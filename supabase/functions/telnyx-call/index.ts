import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TELNYX_API_URL = 'https://api.telnyx.com/v2/calls';
const TELNYX_API_KEY = Deno.env.get('TELNYX_API_KEY');
const TELNYX_APP_ID = Deno.env.get('TELNYX_APP_ID');

Deno.serve(async (req) => {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { caller, called } = await req.json();
        if (!caller || !called) throw new Error('Caller and Called numbers are required');

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Get User Auth context
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) throw new Error("No authorization token");

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError || !user) throw new Error("Unauthorized");

        // Fetch tenant and user context from database
        const { data: tenantUser, error: tenantError } = await supabaseClient
            .from('tenant_users')
            .select('id, tenant_id')
            .eq('auth_user_id', user.id)
            .single();

        if (tenantError || !tenantUser) throw new Error("Tenant user not found");

        process.env.DEBUG && console.log(`Iniciando chamada Telnyx: ${caller} -> ${called}`);

        // Clean and format numbers (ensure E.164)
        const cleanCalled = called.replace(/[^0-9]/g, '');
        const formattedCalled = cleanCalled.startsWith('55') ? `+${cleanCalled}` : `+55${cleanCalled}`;

        const cleanCaller = caller.replace(/[^0-9]/g, '');
        const formattedCaller = cleanCaller.startsWith('55') ? `+${cleanCaller}` : `+55${cleanCaller}`;

        // Make call via Telnyx Call Control v2
        const telnyxResponse = await fetch(TELNYX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TELNYX_API_KEY}`
            },
            body: JSON.stringify({
                connection_id: TELNYX_APP_ID,
                to: formattedCalled,
                from: formattedCaller,
                // Webhook para monitorar o status da chamada
                webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/telnyx-webhook`
            }),
        });

        const telnyxData = await telnyxResponse.json();

        if (telnyxResponse.ok) {
            // Record call in the database
            const { error: logError } = await supabaseClient
                .from('calls')
                .insert({
                    tenant_id: tenantUser.tenant_id,
                    user_id: tenantUser.id,
                    direction: 'outbound',
                    status: 'initiated',
                    from_number: formattedCaller,
                    to_number: formattedCalled,
                    metadata: {
                        provider: 'telnyx',
                        call_control_id: telnyxData.data.call_control_id,
                        api_response: telnyxData
                    }
                });

            if (logError) console.error('Call logging error:', logError);

            return new Response(JSON.stringify({ success: true, data: telnyxData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        } else {
            console.error('Telnyx API Error:', telnyxData);
            return new Response(JSON.stringify({ success: false, error: telnyxData }), {
                status: telnyxResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

    } catch (error) {
        console.error('Function execution error:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
