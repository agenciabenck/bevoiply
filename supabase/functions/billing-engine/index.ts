// =============================================
// EDGE FUNCTION: billing-engine
// Motor de cobrança por minutos
// Calcula custo, debita saldo e registra transação
// =============================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    try {
        const body = await req.json();
        const { call_sid } = body;

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Buscar dados da chamada
        const { data: call, error: callError } = await supabaseAdmin
            .from("calls")
            .select("id, tenant_id, to_number, duration_seconds, billable_seconds")
            .eq("twilio_call_sid", call_sid)
            .single();

        if (callError || !call) {
            throw new Error(`Chamada não encontrada: ${call_sid}`);
        }

        if (!call.billable_seconds || call.billable_seconds === 0) {
            return new Response(JSON.stringify({ message: "Chamada sem duração faturável" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Encontrar tarifa aplicável pelo prefixo do número
        const toNumber = call.to_number.replace(/\D/g, "");
        const { data: rateCards } = await supabaseAdmin
            .from("rate_cards")
            .select("*")
            .eq("is_active", true)
            .order("prefix", { ascending: false });

        let selectedRate = null;
        for (const rate of rateCards || []) {
            if (toNumber.startsWith(rate.prefix.replace("+", ""))) {
                selectedRate = rate;
                break;
            }
        }

        // Tarifa padrão fallback
        const ratePerMinute = selectedRate?.rate_per_minute || 0.15;
        const billingIncrement = selectedRate?.billing_increment || 6;
        const connectionFee = selectedRate?.connection_fee || 0;

        // Calcular custo
        const billableIncrements = Math.ceil(call.billable_seconds / billingIncrement);
        const billableMinutes = (billableIncrements * billingIncrement) / 60;
        const totalCost = (billableMinutes * ratePerMinute) + connectionFee;

        // Buscar conta de billing
        const { data: billingAccount, error: baError } = await supabaseAdmin
            .from("billing_accounts")
            .select("id, balance_minutes, balance_currency")
            .eq("tenant_id", call.tenant_id)
            .single();

        if (baError || !billingAccount) {
            throw new Error(`Conta de billing não encontrada para tenant: ${call.tenant_id}`);
        }

        // Debitar saldo (usar transação atômica via RPC seria ideal)
        const newBalanceMinutes = billingAccount.balance_minutes - billableMinutes;
        const newBalanceCurrency = billingAccount.balance_currency - totalCost;

        // Atualizar saldo
        await supabaseAdmin
            .from("billing_accounts")
            .update({
                balance_minutes: newBalanceMinutes,
                balance_currency: newBalanceCurrency,
                updated_at: new Date().toISOString(),
            })
            .eq("id", billingAccount.id);

        // Registrar transação
        await supabaseAdmin.from("billing_transactions").insert({
            tenant_id: call.tenant_id,
            billing_account_id: billingAccount.id,
            type: "call_debit",
            amount_minutes: -billableMinutes,
            amount_currency: -totalCost,
            balance_after_minutes: newBalanceMinutes,
            balance_after_currency: newBalanceCurrency,
            reference_id: call.id,
            reference_type: "call",
            description: `Chamada para ${call.to_number} - ${call.billable_seconds}s`,
            metadata: {
                rate_per_minute: ratePerMinute,
                billing_increment: billingIncrement,
                connection_fee: connectionFee,
                destination_type: selectedRate?.destination_type || "unknown",
            },
        });

        // Atualizar custo na chamada
        await supabaseAdmin
            .from("calls")
            .update({
                cost_per_minute: ratePerMinute,
                total_cost: totalCost,
            })
            .eq("id", call.id);

        console.log(`Billing: ${billableMinutes.toFixed(2)} min = R$ ${totalCost.toFixed(4)} para chamada ${call_sid}`);

        return new Response(JSON.stringify({
            success: true,
            billable_minutes: billableMinutes,
            total_cost: totalCost,
            balance_after: newBalanceCurrency,
        }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Erro no billing:", err);

        // Registrar na DLQ
        try {
            const supabaseAdmin = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            const body = await req.clone().json();
            await supabaseAdmin.from("dead_letter_queue").insert({
                task_type: "billing_debit",
                payload: body,
                error_message: (err as Error).message,
                status: "pending",
            });
        } catch { /* silenciar */ }

        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
