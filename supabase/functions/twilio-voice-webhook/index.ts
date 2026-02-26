// =============================================
// EDGE FUNCTION: twilio-voice-webhook
// Webhook da Twilio para processar chamadas (TwiML)
// Suporta gravação dual-channel
// =============================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    try {
        const formData = await req.formData();
        const callSid = formData.get("CallSid") as string;
        const from = formData.get("From") as string;
        const to = formData.get("To") as string;
        const direction = formData.get("Direction") as string;
        const callerName = formData.get("CallerName") as string;

        // Parâmetros customizados passados pelo Twilio Client JS
        const toNumber = formData.get("number") as string;
        const tenantId = formData.get("tenant_id") as string;
        const userId = formData.get("user_id") as string;
        const callerId = formData.get("caller_id") as string;

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const statusCallbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-status-callback`;
        const recordingCallbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-recording`;

        // Determinar se é chamada de saída (outbound) via Client
        if (toNumber) {
            // OUTBOUND: BDR ligando para um número
            // Registrar chamada no banco
            const { data: call } = await supabaseAdmin.from("calls").insert({
                tenant_id: tenantId,
                user_id: userId,
                twilio_call_sid: callSid,
                direction: "outbound",
                status: "initiated",
                from_number: callerId || from,
                to_number: toNumber,
                started_at: new Date().toISOString(),
            }).select("id").single();

            // Gerar TwiML com gravação dual-channel
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerId || from}"
        record="record-from-answer-dual"
        recordingStatusCallback="${recordingCallbackUrl}"
        recordingStatusCallbackMethod="POST"
        recordingStatusCallbackEvent="completed"
        recordingChannels="dual"
        action="${statusCallbackUrl}"
        method="POST">
    <Number statusCallback="${statusCallbackUrl}"
            statusCallbackEvent="initiated ringing answered completed"
            statusCallbackMethod="POST">
      ${toNumber}
    </Number>
  </Dial>
</Response>`;

            return new Response(twiml, {
                headers: { "Content-Type": "application/xml" },
            });

        } else {
            // INBOUND: Chamada entrando
            const { data: call } = await supabaseAdmin.from("calls").insert({
                tenant_id: tenantId,
                user_id: userId,
                twilio_call_sid: callSid,
                direction: "inbound",
                status: "ringing",
                from_number: from,
                to_number: to,
                caller_name: callerName,
                started_at: new Date().toISOString(),
            }).select("id").single();

            // Direcionar para o Client do BDR
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial record="record-from-answer-dual"
        recordingStatusCallback="${recordingCallbackUrl}"
        recordingStatusCallbackMethod="POST"
        recordingChannels="dual">
    <Client>
      <Identity>${userId}</Identity>
    </Client>
  </Dial>
  <Say language="pt-BR">Desculpe, nenhum atendente disponível no momento.</Say>
</Response>`;

            return new Response(twiml, {
                headers: { "Content-Type": "application/xml" },
            });
        }

    } catch (err) {
        console.error("Erro no webhook de voz:", err);
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Erro interno. Tente novamente.</Say>
  <Hangup/>
</Response>`;
        return new Response(twiml, {
            headers: { "Content-Type": "application/xml" },
        });
    }
});
