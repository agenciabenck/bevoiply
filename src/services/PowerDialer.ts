// =============================================
// POWER DIALER SERVICE
// Discagem automática em sequência
// =============================================
import { supabase } from '../lib/supabase';
import { twilioDevice } from './TwilioDeviceManager';
import type { CampaignContact, PowerDialQueue } from '../types';

export type DialerStatus = 'idle' | 'running' | 'paused' | 'wrap_up';

interface DialerEvents {
    onStatusChange: (status: DialerStatus) => void;
    onContactChange: (contact: CampaignContact | null) => void;
    onQueueUpdate: (queue: PowerDialQueue[]) => void;
    onError: (error: Error) => void;
    onStatsUpdate: (stats: DialerStats) => void;
}

export interface DialerStats {
    total: number;
    completed: number;
    connected: number;
    noAnswer: number;
    busy: number;
    failed: number;
    remaining: number;
}

export class PowerDialerService {
    private _status: DialerStatus = 'idle';
    // private campaignId: string = '';
    // private tenantId: string = '';
    // private userId: string = '';
    private queue: PowerDialQueue[] = [];
    private currentContact: CampaignContact | null = null;
    private events: Partial<DialerEvents> = {};
    private autoDialDelay: number = 3000; // ms entre chamadas
    private autoDialTimer: ReturnType<typeof setTimeout> | null = null;
    private wrapUpTimer: ReturnType<typeof setTimeout> | null = null;
    private wrapUpDuration: number = 15000; // 15s para wrap-up

    get status(): DialerStatus { return this._status; }
    get contact(): CampaignContact | null { return this.currentContact; }

    on<K extends keyof DialerEvents>(event: K, handler: DialerEvents[K]) {
        this.events[event] = handler;
    }

    async loadCampaign(campaignId: string, tenantId: string, userId: string): Promise<void> {
        // this.campaignId = campaignId;
        // this.tenantId = tenantId;
        // this.userId = userId;

        // Carregar contatos pendentes
        const { data: contacts } = await supabase
            .from('campaign_contacts')
            .select('*')
            .eq('campaign_id', campaignId)
            .in('status', ['pending', 'callback'])
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true });

        // Criar fila
        this.queue = (contacts || []).map((contact, index) => ({
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            user_id: userId,
            campaign_id: campaignId,
            contact_id: contact.id,
            position: index,
            status: 'waiting' as const,
            contact,
        }));

        this.events.onQueueUpdate?.(this.queue);
        this.updateStats();
    }

    async start(): Promise<void> {
        if (this._status === 'running') return;
        this.setStatus('running');
        await this.dialNext();
    }

    pause(): void {
        this.setStatus('paused');
        if (this.autoDialTimer) clearTimeout(this.autoDialTimer);
        if (this.wrapUpTimer) clearTimeout(this.wrapUpTimer);
    }

    resume(): void {
        this.setStatus('running');
        this.dialNext();
    }

    async skip(): Promise<void> {
        const current = this.queue.find(q => q.status === 'dialing' || q.status === 'active');
        if (current) {
            current.status = 'skipped';
            twilioDevice.hangup();
        }
        if (this._status === 'running') {
            await this.dialNext();
        }
    }

    async completeWrapUp(notes?: string): Promise<void> {
        if (this.wrapUpTimer) clearTimeout(this.wrapUpTimer);
        if (this.currentContact && notes) {
            await supabase
                .from('campaign_contacts')
                .update({ notes })
                .eq('id', this.currentContact.id);
        }
        if (this._status !== 'paused') {
            this.setStatus('running');
            await this.dialNext();
        }
    }

    stop(): void {
        this.setStatus('idle');
        if (this.autoDialTimer) clearTimeout(this.autoDialTimer);
        if (this.wrapUpTimer) clearTimeout(this.wrapUpTimer);
        this.currentContact = null;
        this.events.onContactChange?.(null);
    }

    private async dialNext(): Promise<void> {
        const nextItem = this.queue.find(q => q.status === 'waiting');
        if (!nextItem || !nextItem.contact) {
            this.setStatus('idle');
            return;
        }

        nextItem.status = 'dialing';
        this.currentContact = nextItem.contact;
        this.events.onContactChange?.(this.currentContact);
        this.events.onQueueUpdate?.(this.queue);

        try {
            await twilioDevice.makeCall(nextItem.contact.phone_number);

            // Monitorar resultado da chamada
            twilioDevice.on('onConnectionStatusChange', (status) => {
                if (status === 'open') {
                    nextItem.status = 'active';
                } else if (status === 'closed') {
                    nextItem.status = 'completed';
                    this.handleCallEnd(nextItem);
                }
            });

        } catch (err) {
            nextItem.status = 'completed';
            this.events.onError?.(err as Error);
            // Tentar próximo após delay
            this.autoDialTimer = setTimeout(() => this.dialNext(), this.autoDialDelay);
        }
    }

    private handleCallEnd(_item: PowerDialQueue): void {
        this.updateStats();
        this.setStatus('wrap_up');

        // Auto-avanço após wrap-up
        this.wrapUpTimer = setTimeout(() => {
            if (this._status === 'wrap_up') {
                this.setStatus('running');
                this.dialNext();
            }
        }, this.wrapUpDuration);
    }

    private updateStats(): void {
        const stats: DialerStats = {
            total: this.queue.length,
            completed: this.queue.filter(q => q.status === 'completed').length,
            connected: this.queue.filter(q => q.status === 'completed').length, // simplificado
            noAnswer: 0,
            busy: 0,
            failed: 0,
            remaining: this.queue.filter(q => q.status === 'waiting').length,
        };
        this.events.onStatsUpdate?.(stats);
    }

    private setStatus(status: DialerStatus) {
        this._status = status;
        this.events.onStatusChange?.(status);
    }
}

export const powerDialer = new PowerDialerService();
