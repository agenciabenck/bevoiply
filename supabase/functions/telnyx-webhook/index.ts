import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    try {
        const payload = await req.json();
        const event = payload.data;
        const eventType = event.event_type;
        const callControlId = event.payload.call_control_id;

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Mapear status da Telnyx para nosso enum
        const statusMap: Record<string, string> = {
            'call.initiated': "initiated",
            'call.answered': "in-progress",
            'call.hangup': "completed",
            'call.failed': "failed",
        };

        const mappedStatus = statusMap[eventType];
        if (!mappedStatus) {
            // Ignorar eventos que não mapeamos
            return new Response("OK", { status: 200 });
        }

        // Dados para atualizar
        const updateData: Record<string, unknown> = {
            status: mappedStatus,
        };

        // Atualizar timestamps conforme o status
        if (eventType === "call.answered") {
            updateData.answered_at = new Date().toISOString();
        }

        if (eventType === "call.hangup") {
            updateData.ended_at = new Date().toISOString();
            // Calcular duração se disponível no payload
            // A Telnyx envia a duração em alguns payloads ou podemos calcular aqui
        }

        // Atualizar no banco via call_control_id salvo no metadata
        // Nota: No telnyx-call salvamos o call_control_id no metadata
        const { error } = await supabaseAdmin
            .from("calls")
            .update(updateData)
            .contains('metadata', { call_control_id: callControlId });

        if (error) {
            console.error("Erro ao atualizar status da chamada Telnyx:", error);
        }

        // Se a chamada foi completada, podemos enfileirar billing futuramente
        // if (mappedStatus === "completed") { ... }

        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error("Erro no Telnyx webhook:", err);
        return new Response("Erro interno", { status: 500 });
    }
});
