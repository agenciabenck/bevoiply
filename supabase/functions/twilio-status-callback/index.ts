// =============================================
// EDGE FUNCTION: twilio-status-callback
// Atualiza status da chamada em tempo real
// Propaga via Supabase Realtime (WebSocket)
// =============================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    try {
        const formData = await req.formData();

        const callSid = formData.get("CallSid") as string;
        const callStatus = formData.get("CallStatus") as string;
        const callDuration = formData.get("CallDuration") as string;
        const timestamp = formData.get("Timestamp") as string;
        const sequenceNumber = formData.get("SequenceNumber") as string;

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Mapear status da Twilio para nosso enum
        const statusMap: Record<string, string> = {
            queued: "queued",
            initiated: "initiated",
            ringing: "ringing",
            "in-progress": "in-progress",
            completed: "completed",
            busy: "busy",
            "no-answer": "no-answer",
            canceled: "canceled",
            failed: "failed",
        };

        const mappedStatus = statusMap[callStatus] || callStatus;

        // Dados para atualizar
        const updateData: Record<string, unknown> = {
            status: mappedStatus,
        };

        // Atualizar timestamps conforme o status
        if (mappedStatus === "in-progress") {
            updateData.answered_at = new Date().toISOString();
        }

        if (["completed", "busy", "no-answer", "canceled", "failed"].includes(mappedStatus)) {
            updateData.ended_at = new Date().toISOString();
            if (callDuration) {
                updateData.duration_seconds = parseInt(callDuration, 10);
                updateData.billable_seconds = parseInt(callDuration, 10);
            }
        }

        // Atualizar no banco — Realtime propaga automaticamente via WebSocket
        const { error } = await supabaseAdmin
            .from("calls")
            .update(updateData)
            .eq("twilio_call_sid", callSid);

        if (error) {
            console.error("Erro ao atualizar status da chamada:", error);

            // Registrar na DLQ para retry
            await supabaseAdmin.from("dead_letter_queue").insert({
                task_type: "status_update",
                payload: { callSid, callStatus, callDuration, timestamp },
                error_message: error.message,
                status: "pending",
            });
        }

        // Se a chamada foi completada, enfileirar billing
        if (mappedStatus === "completed" && callDuration) {
            const billingUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/billing-engine`;
            fetch(billingUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({ call_sid: callSid }),
            }).catch((err) => console.error("Erro ao chamar billing:", err));
        }

        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error("Erro no status callback:", err);
        return new Response("Erro interno", { status: 500 });
    }
});
