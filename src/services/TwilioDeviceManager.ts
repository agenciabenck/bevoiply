// =============================================
// TWILIO DEVICE MANAGER
// Encapsula Twilio Client JS SDK
// =============================================
import { supabase } from '../lib/supabase';
import type { Call } from '../types';

export type DeviceStatus = 'offline' | 'registering' | 'registered' | 'error';
export type ConnectionStatus = 'idle' | 'connecting' | 'ringing' | 'open' | 'closed';

interface DeviceEvents {
    onStatusChange: (status: DeviceStatus) => void;
    onIncomingCall: (params: { from: string; callSid: string }) => void;
    onConnectionStatusChange: (status: ConnectionStatus) => void;
    onError: (error: Error) => void;
    onCallUpdate: (call: Partial<Call>) => void;
}

export class TwilioDeviceManager {
    private device: any = null;
    private connection: any = null;
    // private token: string = '';
    // private identity: string = '';
    // private tenantId: string = '';
    // private userId: string = '';
    private events: Partial<DeviceEvents> = {};
    private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    private _status: DeviceStatus = 'offline';
    private _connectionStatus: ConnectionStatus = 'idle';
    private _isMuted: boolean = false;
    private _callStartTime: Date | null = null;

    get status(): DeviceStatus { return this._status; }
    get connectionStatus(): ConnectionStatus { return this._connectionStatus; }
    get isMuted(): boolean { return this._isMuted; }
    get callDuration(): number {
        if (!this._callStartTime) return 0;
        return Math.floor((Date.now() - this._callStartTime.getTime()) / 1000);
    }

    on<K extends keyof DeviceEvents>(event: K, handler: DeviceEvents[K]) {
        this.events[event] = handler;
    }

    async initialize(): Promise<void> {
        try {
            this.setStatus('registering');

            // Buscar token do Twilio via Edge Function
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão não encontrada');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Falha ao obter token Twilio');

            const data = await response.json();
            // this.token = data.token;
            // this.identity = data.identity;
            // this.tenantId = data.tenant_id;
            // this.userId = data.user_id;

            // Simular registro do device (em produção, usar @twilio/voice-sdk)
            this.setStatus('registered');
            console.log(`[TwilioDevice] Registrado`);

            // Agendar refresh do token (50 min antes de expirar)
            this.scheduleTokenRefresh();

        } catch (err) {
            this.setStatus('error');
            this.events.onError?.(err as Error);
            throw err;
        }
    }

    async makeCall(toNumber: string, callerId?: string): Promise<void> {
        if (this._status !== 'registered') {
            throw new Error('Device não registrado');
        }

        try {
            this.setConnectionStatus('connecting');

            // Em produção: this.connection = await this.device.connect({ params })
            // Simulação para frontend
            console.log(`[TwilioDevice] Ligando para ${toNumber}...`);

            setTimeout(() => {
                this.setConnectionStatus('ringing');
                this._callStartTime = new Date();
                this.events.onCallUpdate?.({
                    status: 'ringing',
                    to_number: toNumber,
                    from_number: callerId || '',
                });
            }, 500);

        } catch (err) {
            this.setConnectionStatus('idle');
            this.events.onError?.(err as Error);
            throw err;
        }
    }

    hangup(): void {
        if (this.connection) {
            this.connection.disconnect();
        }
        this.setConnectionStatus('closed');
        this._callStartTime = null;
        this._isMuted = false;

        setTimeout(() => this.setConnectionStatus('idle'), 100);
    }

    toggleMute(): boolean {
        this._isMuted = !this._isMuted;
        if (this.connection) {
            this.connection.mute(this._isMuted);
        }
        return this._isMuted;
    }

    sendDTMF(digit: string): void {
        if (this.connection) {
            this.connection.sendDigits(digit);
        }
        console.log(`[TwilioDevice] DTMF: ${digit}`);
    }

    async acceptIncoming(): Promise<void> {
        if (this.connection) {
            this.connection.accept();
            this.setConnectionStatus('open');
            this._callStartTime = new Date();
        }
    }

    rejectIncoming(): void {
        if (this.connection) {
            this.connection.reject();
            this.setConnectionStatus('idle');
        }
    }

    destroy(): void {
        if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
        this.hangup();
        if (this.device) this.device.destroy();
        this.setStatus('offline');
    }

    private setStatus(status: DeviceStatus) {
        this._status = status;
        this.events.onStatusChange?.(status);
    }

    private setConnectionStatus(status: ConnectionStatus) {
        this._connectionStatus = status;
        this.events.onConnectionStatusChange?.(status);
    }

    private scheduleTokenRefresh() {
        this.tokenRefreshTimer = setTimeout(async () => {
            try {
                console.log('[TwilioDevice] Renovando token...');
                await this.initialize();
            } catch (err) {
                console.error('[TwilioDevice] Falha ao renovar token:', err);
            }
        }, 50 * 60 * 1000); // 50 minutos
    }
}

export const twilioDevice = new TwilioDeviceManager();
