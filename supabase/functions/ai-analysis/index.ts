// =============================================
// EDGE FUNCTION: ai-analysis
// Pipeline de inteligência pós-chamada com Gemini 1.5 Pro
// 1. Extrai áudio do Supabase Storage
// 2. Envia para Gemini 1.5 Pro
// 3. Análise de sentimento, objeções e próxima ação
// 4. Salva resultados
// 5. DLQ em caso de falha
// =============================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_ANALYSIS_PROMPT = `Você é um analista especialista em vendas B2B por telefone.
Analise a seguinte transcrição de uma chamada comercial e retorne um JSON estruturado com:

{
  "transcription": {
    "full_text": "Texto completo da transcrição",
    "segments": [
      {"speaker": "bdr|client", "start": 0.0, "end": 5.2, "text": "..."}
    ],
    "language": "pt-BR",
    "confidence": 0.95
  },
  "analysis": {
    "sentiment_score": 0.6,
    "sentiment_label": "positive",
    "call_summary": "Resumo da chamada em 2-3 frases",
    "objections": [
      {
        "objection": "Descrição da objeção",
        "severity": "high|medium|low",
        "context": "Contexto de quando surgiu",
        "suggested_counter": "Sugestão de contra-argumento"
      }
    ],
    "suggested_actions": [
      {
        "action": "Descrição da ação",
        "priority": "high|medium|low",
        "reasoning": "Porquê esta ação"
      }
    ],
    "key_topics": ["preço", "prazo", "concorrência"],
    "talk_ratio": {"bdr_percentage": 45, "client_percentage": 55},
    "energy_level": "medium",
    "next_best_action": "Enviar proposta ajustada em 24h",
    "deal_probability": 0.65
  }
}

IMPORTANTE:
- Retorne APENAS o JSON, sem markdown ou texto adicional.
- sentiment_score de -1.0 (muito negativo) a 1.0 (muito positivo).
- deal_probability de 0.0 a 1.0.
- Identifique o speaker pelo contexto (quem faz perguntas comerciais = BDR, quem responde = Cliente).
`;

Deno.serve(async (req: Request) => {
    const startTime = Date.now();

    try {
        const body = await req.json();
        const { recording_id, call_id, tenant_id, storage_path } = body;

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Atualizar status da gravação para "processing"
        await supabaseAdmin
            .from("call_recordings")
            .update({ transcription_status: "processing" })
            .eq("id", recording_id);

        // Baixar áudio do Storage
        const { data: audioData, error: downloadError } = await supabaseAdmin.storage
            .from("call-recordings")
            .download(storage_path);

        if (downloadError || !audioData) {
            throw new Error(`Falha ao baixar áudio: ${downloadError?.message}`);
        }

        // Converter para base64 para enviar ao Gemini
        const audioArrayBuffer = await audioData.arrayBuffer();
        const audioBase64 = btoa(
            String.fromCharCode(...new Uint8Array(audioArrayBuffer))
        );

        // Chamar Gemini 1.5 Pro via API
        const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            inlineData: {
                                mimeType: "audio/wav",
                                data: audioBase64,
                            },
                        },
                        { text: GEMINI_ANALYSIS_PROMPT },
                    ],
                }],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            throw new Error(`Gemini API error ${geminiResponse.status}: ${errText}`);
        }

        const geminiResult = await geminiResponse.json();
        const rawText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error("Gemini retornou resposta vazia");
        }

        const analysisData = JSON.parse(rawText);
        const processingTime = Date.now() - startTime;

        // Salvar transcrição
        const { data: transcription } = await supabaseAdmin
            .from("ai_transcriptions")
            .insert({
                recording_id,
                call_id,
                tenant_id,
                full_text: analysisData.transcription?.full_text,
                segments: analysisData.transcription?.segments,
                language: analysisData.transcription?.language || "pt-BR",
                confidence: analysisData.transcription?.confidence,
                model_used: "gemini-1.5-pro",
                processing_time_ms: processingTime,
            })
            .select("id")
            .single();

        // Salvar análise
        await supabaseAdmin.from("ai_analyses").insert({
            transcription_id: transcription!.id,
            call_id,
            tenant_id,
            sentiment_score: analysisData.analysis?.sentiment_score,
            sentiment_label: analysisData.analysis?.sentiment_label,
            objections: analysisData.analysis?.objections,
            suggested_actions: analysisData.analysis?.suggested_actions,
            call_summary: analysisData.analysis?.call_summary,
            key_topics: analysisData.analysis?.key_topics,
            talk_ratio: analysisData.analysis?.talk_ratio,
            energy_level: analysisData.analysis?.energy_level,
            next_best_action: analysisData.analysis?.next_best_action,
            deal_probability: analysisData.analysis?.deal_probability,
            model_used: "gemini-1.5-pro",
            processing_time_ms: processingTime,
            raw_response: geminiResult,
        });

        // Atualizar status da gravação
        await supabaseAdmin
            .from("call_recordings")
            .update({ transcription_status: "completed" })
            .eq("id", recording_id);

        console.log(`Análise IA concluída para gravação ${recording_id} em ${processingTime}ms`);
        return new Response(JSON.stringify({ success: true, processing_time_ms: processingTime }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Erro na análise IA:", err);

        // Registrar na DLQ
        try {
            const supabaseAdmin = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            const body = await req.clone().json();
            await supabaseAdmin.from("dead_letter_queue").insert({
                tenant_id: body.tenant_id,
                task_type: "ai_analysis",
                payload: body,
                error_message: (err as Error).message,
                error_stack: (err as Error).stack,
                status: "pending",
            });

            // Marcar gravação como falha
            if (body.recording_id) {
                await supabaseAdmin
                    .from("call_recordings")
                    .update({ transcription_status: "failed" })
                    .eq("id", body.recording_id);
            }
        } catch { /* silenciar */ }

        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
