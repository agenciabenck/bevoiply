import { UserAgent, Registerer, Inviter, SessionState, RegistererState } from 'sip.js';
import type { Session } from 'sip.js';
import { supabase } from './supabase';

export interface SipConfig {
    sipUser: string;
    sipPassword: string;
    sipServer: string;       // e.g. sip.telnyx.com
    wsServer: string;        // e.g. wss://sip.telnyx.com:8089/ws
}

export type CallStatus = 'idle' | 'registering' | 'registered' | 'dialing' | 'ringing' | 'connected' | 'ended' | 'error';

export interface SipServiceCallbacks {
    onStatusChange: (status: CallStatus, message?: string) => void;
    onCallDuration?: (seconds: number) => void;
}

class SipService {
    private ua: UserAgent | null = null;
    private registerer: Registerer | null = null;
    private currentSession: Session | null = null;
    private callbacks: SipServiceCallbacks | null = null;
    private durationTimer: ReturnType<typeof setInterval> | null = null;
    private duration = 0;
    private remoteAudio: HTMLAudioElement | null = null;
    private _status: CallStatus = 'idle';

    get status() { return this._status; }
    get callDuration() { return this.duration; }

    private setStatus(status: CallStatus, message?: string) {
        this._status = status;
        this.callbacks?.onStatusChange(status, message);
    }

    async register(config: SipConfig, callbacks: SipServiceCallbacks) {
        this.callbacks = callbacks;

        // Clean up existing UA
        if (this.ua) {
            try { await this.ua.stop(); } catch { /* ignore */ }
        }

        this.setStatus('registering');

        try {
            const uri = UserAgent.makeURI(`sip:${config.sipUser}@${config.sipServer}`);
            if (!uri) throw new Error('URI SIP inválida');

            this.ua = new UserAgent({
                uri,
                authorizationUsername: config.sipUser,
                authorizationPassword: config.sipPassword,
                transportOptions: {
                    server: config.wsServer,
                },
                sessionDescriptionHandlerFactoryOptions: {
                    peerConnectionConfiguration: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                        ],
                    },
                },
                logLevel: 'warn',
                displayName: 'Bevoiply',
            });

            // Incoming call handler
            this.ua.delegate = {
                onInvite: (invitation) => {
                    // For now, auto-reject incoming calls (can be enhanced later)
                    invitation.reject();
                },
            };

            await this.ua.start();

            // Register with SIP server
            this.registerer = new Registerer(this.ua);

            this.registerer.stateChange.addListener((newState) => {
                switch (newState) {
                    case RegistererState.Registered:
                        this.setStatus('registered');
                        break;
                    case RegistererState.Unregistered:
                        if (this._status !== 'idle') {
                            this.setStatus('idle');
                        }
                        break;
                    case RegistererState.Terminated:
                        this.setStatus('error', 'Registro SIP encerrado');
                        break;
                }
            });

            await this.registerer.register();
        } catch (err) {
            console.error('SIP registration error:', err);
            this.setStatus('error', err instanceof Error ? err.message : 'Erro ao registrar SIP');
        }
    }

    async makeCall(destination: string) {
        if (!this.ua || this._status !== 'registered') {
            this.setStatus('error', 'SIP não registrado');
            return;
        }

        // Clean number
        let cleanNumber = destination.replace(/[^0-9+]/g, '');
        if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('55')) {
            cleanNumber = '55' + cleanNumber;
        }

        const targetUri = UserAgent.makeURI(`sip:${cleanNumber}@${this.ua.configuration.uri.host}`);
        if (!targetUri) {
            this.setStatus('error', 'Número inválido');
            return;
        }

        this.setStatus('dialing');

        try {
            const inviter = new Inviter(this.ua, targetUri, {
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false,
                    },
                },
            });

            this.currentSession = inviter;
            this.setupSessionListeners(inviter);

            await inviter.invite();
        } catch (err) {
            console.error('Call error:', err);
            this.setStatus('error', err instanceof Error ? err.message : 'Erro ao iniciar chamada');
        }
    }

    private setupSessionListeners(session: Session) {
        session.stateChange.addListener((newState) => {
            switch (newState) {
                case SessionState.Establishing:
                    this.setStatus('ringing');
                    break;
                case SessionState.Established:
                    this.setStatus('connected');
                    this.startDurationTimer();
                    this.attachRemoteAudio(session);
                    break;
                case SessionState.Terminated:
                    this.stopDurationTimer();
                    this.setStatus('ended');
                    this.cleanupAudio();
                    setTimeout(() => this.setStatus('registered'), 2000);
                    break;
            }
        });
    }

    private attachRemoteAudio(session: Session) {
        try {
            const sdh = session.sessionDescriptionHandler as any;
            if (sdh && sdh.peerConnection) {
                const pc = sdh.peerConnection as RTCPeerConnection;
                const remoteStream = new MediaStream();
                pc.getReceivers().forEach((receiver) => {
                    if (receiver.track) remoteStream.addTrack(receiver.track);
                });

                if (!this.remoteAudio) {
                    this.remoteAudio = new Audio();
                    this.remoteAudio.autoplay = true;
                }
                this.remoteAudio.srcObject = remoteStream;
                this.remoteAudio.play().catch(console.error);
            }
        } catch (err) {
            console.error('Audio attach error:', err);
        }
    }

    private cleanupAudio() {
        if (this.remoteAudio) {
            this.remoteAudio.srcObject = null;
        }
    }

    private startDurationTimer() {
        this.duration = 0;
        this.durationTimer = setInterval(() => {
            this.duration++;
            this.callbacks?.onCallDuration?.(this.duration);
        }, 1000);
    }

    private stopDurationTimer() {
        if (this.durationTimer) {
            clearInterval(this.durationTimer);
            this.durationTimer = null;
        }
    }

    hangup() {
        if (this.currentSession) {
            try {
                switch (this.currentSession.state) {
                    case SessionState.Initial:
                    case SessionState.Establishing:
                        (this.currentSession as Inviter).cancel();
                        break;
                    case SessionState.Established:
                        this.currentSession.bye();
                        break;
                }
            } catch (err) {
                console.error('Hangup error:', err);
            }
            this.currentSession = null;
            this.stopDurationTimer();
        }
    }

    toggleMute(): boolean {
        if (!this.currentSession || this.currentSession.state !== SessionState.Established) return false;
        try {
            const sdh = this.currentSession.sessionDescriptionHandler as any;
            if (sdh?.peerConnection) {
                const pc = sdh.peerConnection as RTCPeerConnection;
                const senders = pc.getSenders();
                const audioSender = senders.find(s => s.track?.kind === 'audio');
                if (audioSender?.track) {
                    audioSender.track.enabled = !audioSender.track.enabled;
                    return !audioSender.track.enabled; // return true if muted
                }
            }
        } catch (err) {
            console.error('Mute toggle error:', err);
        }
        return false;
    }

    async toggleHold(): Promise<boolean> {
        // Hold/unhold via re-invite with sendonly/sendrecv
        // Simplified: just mute/unmute for now
        return this.toggleMute();
    }

    sendDTMF(tone: string) {
        if (!this.currentSession || this.currentSession.state !== SessionState.Established) return;
        try {
            const sdh = this.currentSession.sessionDescriptionHandler as any;
            if (sdh?.peerConnection) {
                const pc = sdh.peerConnection as RTCPeerConnection;
                const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
                if (sender?.dtmf) {
                    sender.dtmf.insertDTMF(tone, 100, 70);
                }
            }
        } catch (err) {
            console.error('DTMF error:', err);
        }
    }

    async unregister() {
        this.hangup();
        try {
            if (this.registerer) await this.registerer.unregister();
            if (this.ua) await this.ua.stop();
        } catch { /* ignore */ }
        this.ua = null;
        this.registerer = null;
        this.setStatus('idle');
    }

    // --- REST API CALL METHOD (Official integration) ---
    async makeApiCall(caller: string, called: string) {
        this.setStatus('dialing');

        try {
            // Chamar a nova Edge Function da Telnyx
            const { data, error } = await supabase.functions.invoke('telnyx-call', {
                body: { caller, called }
            });

            if (error) throw error;

            if (data.success) {
                this.setStatus('connected', 'Iniciando via Telnyx...');
                return { success: true, data };
            } else {
                throw new Error(data.error || 'Erro ao iniciar chamada via Telnyx');
            }
        } catch (err) {
            console.error('API Call error:', err);
            this.setStatus('error', err instanceof Error ? err.message : 'Erro na API da Telnyx');
            return { success: false, error: err };
        }
    }
}

// Singleton
export const sipService = new SipService();
