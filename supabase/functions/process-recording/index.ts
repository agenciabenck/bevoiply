// =============================================
// EDGE FUNCTION: process-recording
// Baixa gravação do Twilio, armazena no Storage
// e enfileira para análise IA
// =============================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    try {
        const formData = await req.formData();

        const recordingSid = formData.get("RecordingSid") as string;
        const recordingUrl = formData.get("RecordingUrl") as string;
        const callSid = formData.get("CallSid") as string;
        const recordingDuration = formData.get("RecordingDuration") as string;
        const recordingChannels = formData.get("RecordingChannels") as string;

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Buscar dados da chamada
        const { data: call } = await supabaseAdmin
            .from("calls")
            .select("id, tenant_id")
            .eq("twilio_call_sid", callSid)
            .single();

        if (!call) {
            console.error(`Chamada não encontrada para CallSid: ${callSid}`);
            return new Response("Chamada não encontrada", { status: 404 });
        }

        // Baixar gravação do Twilio (formato WAV)
        const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
        const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
        const audioUrl = `${recordingUrl}.wav`;

        const audioResponse = await fetch(audioUrl, {
            headers: {
                Authorization: "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            },
        });

        if (!audioResponse.ok) {
            throw new Error(`Falha ao baixar gravação: ${audioResponse.status}`);
        }

        const audioBlob = await audioResponse.blob();
        const storagePath = `recordings/${call.tenant_id}/${call.id}/${recordingSid}.wav`;

        // Upload para Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from("call-recordings")
            .upload(storagePath, audioBlob, {
                contentType: "audio/wav",
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Falha no upload: ${uploadError.message}`);
        }

        // Gerar URL pública (ou signed URL)
        const { data: urlData } = supabaseAdmin.storage
            .from("call-recordings")
            .getPublicUrl(storagePath);

        // Registrar gravação no banco
        const { data: recording, error: insertError } = await supabaseAdmin
            .from("call_recordings")
            .insert({
                call_id: call.id,
                tenant_id: call.tenant_id,
                twilio_recording_sid: recordingSid,
                storage_path: storagePath,
                storage_url: urlData.publicUrl,
                duration_seconds: parseInt(recordingDuration || "0", 10),
                channels: parseInt(recordingChannels || "2", 10),
                file_size_bytes: audioBlob.size,
                format: "wav",
                status: "available",
                transcription_status: "pending",
                retention_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias LGPD
            })
            .select("id")
            .single();

        if (insertError) {
            throw new Error(`Falha ao inserir gravação: ${insertError.message}`);
        }

        // Enfileirar análise IA
        const aiUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-analysis`;
        fetch(aiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
                recording_id: recording!.id,
                call_id: call.id,
                tenant_id: call.tenant_id,
                storage_path: storagePath,
            }),
        }).catch((err) => {
            console.error("Erro ao enfileirar análise IA:", err);
            // Salvar na DLQ
            supabaseAdmin.from("dead_letter_queue").insert({
                tenant_id: call.tenant_id,
                task_type: "ai_analysis",
                payload: { recording_id: recording!.id, call_id: call.id, storage_path: storagePath },
                error_message: err.message,
                status: "pending",
            });
        });

        console.log(`Gravação ${recordingSid} processada com sucesso`);
        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error("Erro ao processar gravação:", err);

        // Registrar na DLQ
        try {
            const supabaseAdmin = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            const formData = await req.clone().formData();
            await supabaseAdmin.from("dead_letter_queue").insert({
                task_type: "recording_download",
                payload: Object.fromEntries(formData.entries()),
                error_message: (err as Error).message,
                error_stack: (err as Error).stack,
                status: "pending",
            });
        } catch { /* silenciar erro do DLQ */ }

        return new Response("Erro interno", { status: 500 });
    }
});
