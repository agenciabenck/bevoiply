// =============================================
// EDGE FUNCTION: twilio-token
// Gera Access Token JWT do Twilio Client
// =============================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Implementação simplificada do AccessToken JWT do Twilio
function createTwilioAccessToken(
    accountSid: string,
    apiKeySid: string,
    apiKeySecret: string,
    identity: string,
    twimlAppSid: string,
    ttl: number = 3600
): string {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" }));

    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(JSON.stringify({
        jti: `${apiKeySid}-${now}`,
        iss: apiKeySid,
        sub: accountSid,
        exp: now + ttl,
        nbf: now,
        grants: {
            identity,
            voice: {
                incoming: { allow: true },
                outgoing: { application_sid: twimlAppSid },
            },
        },
    }));

    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiKeySecret);
    const data = encoder.encode(`${header}.${payload}`);

    // Nota: em produção, usar crypto.subtle.importKey + crypto.subtle.sign
    // Para Edge Functions, usar a lib @twilio/voice-sdk server-side
    return `${header}.${payload}.placeholder_signature`;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Verificar autenticação Supabase
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Token de autenticação ausente" }), {
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Buscar dados do tenant_user
        const { data: tenantUser, error: tuError } = await supabase
            .from("tenant_users")
            .select("id, tenant_id, twilio_identity, display_name, role")
            .eq("auth_user_id", user.id)
            .eq("is_active", true)
            .single();

        if (tuError || !tenantUser) {
            return new Response(JSON.stringify({ error: "Usuário não vinculado a nenhum tenant" }), {
                status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Gerar identidade Twilio
        const identity = tenantUser.twilio_identity || `user_${tenantUser.id}`;

        // Gerar Access Token
        const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
        const apiKeySid = Deno.env.get("TWILIO_API_KEY_SID")!;
        const apiKeySecret = Deno.env.get("TWILIO_API_KEY_SECRET")!;
        const twimlAppSid = Deno.env.get("TWILIO_TWIML_APP_SID")!;

        const token = createTwilioAccessToken(
            accountSid, apiKeySid, apiKeySecret,
            identity, twimlAppSid, 3600
        );

        return new Response(JSON.stringify({
            token,
            identity,
            tenant_id: tenantUser.tenant_id,
            user_id: tenantUser.id,
            display_name: tenantUser.display_name,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Erro ao gerar token Twilio:", err);
        return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
