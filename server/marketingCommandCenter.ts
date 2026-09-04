/**
 * KISHOLOY Marketing Command Center — Data registry, spend ledger, attribution & ROI engine.
 *
 * HARD RULES enforced by this engine:
 *  - It NEVER mutates Finance records or Order records. Order.utm tagging happens once at
 *    order creation (additive metadata only) and all order reads here are read-only.
 *  - Every financial metric (ROAS, ROI%, CPO, cost/click, cost/conversation, monthly
 *    summaries) is computed server-side. The client only displays what this engine returns.
 *  - History is preserved: nothing is hard-deleted. Spend entries are VOIDED, channel
 *    registry rows are ARCHIVED, and every edit appends to an immutable amendment trail.
 *  - API auto-sync connectors (Meta CAPI / WhatsApp Business API / Telegram Bot API) are
 *    reported as FUTURE / unimplemented — no fabricated sync data is ever produced.
 *
 * @license Apache-2.0
 */

import {
  MarketingChannelRegistry,
  MarketingSpendEntry,
  MarketingAttributionEntry,
  Order,
  OrderUtmTag,
  AdChannelType,
  AdChannelStatus,
  MarketingRoiRow,
  MarketingRoiReport,
  MarketingMonthlySummaryRow,
  AutoAttributedOrderRow,
  MarketingSyncConnector,
  MarketingFinanceReconciliation,
  MarketingCampaign,
} from '../src/types';
import { serverDb } from './db';
import { marketingService } from './marketingService';

// ---------------------------------------------------------------------------
// Built-in utm_source aliases per channel type (admins can extend per channel)
// ---------------------------------------------------------------------------
const BUILT_IN_UTM_ALIASES: Record<AdChannelType, string[]> = {
  FACEBOOK: ['facebook', 'fb', 'meta', 'fb_ad', 'fb_ads', 'facebook_ad', 'messenger'],
  INSTAGRAM: ['instagram', 'ig', 'insta', 'ig_ad', 'ig_ads'],
  WHATSAPP: ['whatsapp', 'wa', 'whatsapp_business', 'wa_business'],
  TELEGRAM: ['telegram', 'tg', 'telegram_channel'],
  OTHER: [],
};

// ---------------------------------------------------------------------------
// Seed data — derived ONLY from records that already exist elsewhere in the
// system (site content social handles, Finance expense exp-3, and the
// Campaigns module cost telemetry). Nothing here invents new financial facts.
// ---------------------------------------------------------------------------

const SEED_CHANNELS: MarketingChannelRegistry[] = [
  {
    id: 'mchn-facebook-01',
    type: 'FACEBOOK',
    name: 'Kisholoy Official Facebook Page',
    handle: 'kisholoy.bd',
    pageUrl: 'https://facebook.com/kisholoy.bd',
    status: 'ACTIVE',
    utmSourcePatterns: [],
    notes: 'Primary storefront page — organic posts, boosts and Meta ad runs.',
    statusHistory: [{ status: 'ACTIVE', changedAt: '2026-08-01T10:00:00+06:00', changedBy: 'SYSTEM_SEED', note: 'Registered from site content social handles' }],
    createdAt: '2026-08-01T10:00:00+06:00',
    updatedAt: '2026-08-01T10:00:00+06:00',
  },
  {
    id: 'mchn-instagram-01',
    type: 'INSTAGRAM',
    name: 'Kisholoy Official Instagram',
    handle: 'kisholoy.bd',
    pageUrl: 'https://instagram.com/kisholoy.bd',
    status: 'ACTIVE',
    utmSourcePatterns: [],
    notes: 'Visual discovery channel for handloom & artisan storytelling.',
    statusHistory: [{ status: 'ACTIVE', changedAt: '2026-08-01T10:00:00+06:00', changedBy: 'SYSTEM_SEED', note: 'Registered from site content social handles' }],
    createdAt: '2026-08-01T10:00:00+06:00',
    updatedAt: '2026-08-01T10:00:00+06:00',
  },
  {
    id: 'mchn-whatsapp-01',
    type: 'WHATSAPP',
    name: 'Kisholoy WhatsApp Business Line',
    handle: '+8801700000000',
    status: 'ACTIVE',
    utmSourcePatterns: ['wa_link'],
    notes: 'Direct sales conversations, order confirmations and broadcast sends.',
    statusHistory: [{ status: 'ACTIVE', changedAt: '2026-08-01T10:00:00+06:00', changedBy: 'SYSTEM_SEED', note: 'Registered from site content contact info' }],
    createdAt: '2026-08-01T10:00:00+06:00',
    updatedAt: '2026-08-01T10:00:00+06:00',
  },
];

const seedNow = '2026-08-25T09:00:00+06:00';

const SEED_SPENDS: MarketingSpendEntry[] = [
  {
    id: 'msp-1',
    entryType: 'AD',
    channelId: 'mchn-facebook-01',
    dateFrom: '2026-08-20',
    dateTo: '2026-08-25',
    amountBdt: 12000,
    impressions: 0,
    clicks: 0,
    sends: 0,
    utmSource: 'fb',
    utmCampaign: 'jamdani-honey-festive',
    notes: 'Mirrored from Finance expense exp-3 (Meta Ads — Bangla Jamdani Saree & Honey festive campaign, ref FB-ACT-99120). Impressions/clicks to be completed from Ads Manager.',
    financeExpenseRef: 'exp-3',
    status: 'ACTIVE',
    editHistory: [],
    recordedBy: 'SYSTEM_SEED',
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: 'msp-2',
    entryType: 'SEND',
    channelId: 'mchn-whatsapp-01',
    campaignId: 'camp-03',
    campaignNameSnapshot: 'Cart Abandonment Automated Recovery Flow',
    dateFrom: '2026-09-01',
    dateTo: '2026-09-01',
    amountBdt: 90,
    impressions: 0,
    clicks: 31,
    sends: 44,
    notes: 'Broadcast send cost carried over from Campaigns module telemetry (camp-03 costBdt).',
    status: 'ACTIVE',
    editHistory: [],
    recordedBy: 'SYSTEM_SEED',
    createdAt: seedNow,
    updatedAt: seedNow,
  },
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

type IdPrefix = 'mchn' | 'msp' | 'mat';

function genId(prefix: IdPrefix): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function norm(s?: string | null): string {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09ff]+/g, '_').replace(/^_+|_+$/g, '');
}

function round2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

function safeRatio(numer: number, denom: number): number {
  if (!Number.isFinite(numer) || !Number.isFinite(denom) || denom <= 0) return 0;
  return round2(numer / denom);
}

function dateOnly(iso: string): string {
  return (iso || '').slice(0, 10);
}

function withinRange(day: string, from?: string, to?: string): boolean {
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

class MarketingCommandCenterEngine {
  private channels: MarketingChannelRegistry[] = JSON.parse(JSON.stringify(SEED_CHANNELS));
  private spends: MarketingSpendEntry[] = JSON.parse(JSON.stringify(SEED_SPENDS));
  private attributions: MarketingAttributionEntry[] = [];

  // -------------------------------------------------------------
  // Channel Registry (Phase MC-1)
  // -------------------------------------------------------------

  listChannels(includeArchived = true): MarketingChannelRegistry[] {
    const rows = [...this.channels].sort((a, b) => a.name.localeCompare(b.name));
    return includeArchived ? rows : rows.filter((c) => c.status !== 'ARCHIVED');
  }

  getChannel(id: string): MarketingChannelRegistry | undefined {
    return this.channels.find((c) => c.id === id);
  }

  createChannel(input: {
    type: AdChannelType;
    name: string;
    handle: string;
    pageUrl?: string;
    status?: AdChannelStatus;
    utmSourcePatterns?: string[];
    notes?: string;
    actor?: string;
  }): MarketingChannelRegistry {
    const now = new Date().toISOString();
    const actor = input.actor || 'MARKETING_ADMIN';
    const channel: MarketingChannelRegistry = {
      id: genId('mchn'),
      type: input.type,
      name: input.name,
      handle: input.handle,
      pageUrl: input.pageUrl || undefined,
      status: input.status || 'ACTIVE',
      utmSourcePatterns: (input.utmSourcePatterns || []).map((p) => p.toLowerCase().trim()).filter(Boolean),
      notes: input.notes || undefined,
      statusHistory: [{ status: input.status || 'ACTIVE', changedAt: now, changedBy: actor, note: 'Channel registered' }],
      createdAt: now,
      updatedAt: now,
    };
    this.channels.push(channel);
    serverDb.addAuditLog(
      'MC_CHANNEL_REGISTERED',
      'MarketingCommand',
      channel.id,
      `Registered ${channel.type} channel "${channel.name}" (${channel.handle})`,
      actor,
      undefined,
      'INFO',
      'CONFIG'
    );
    return channel;
  }

  updateChannel(
    id: string,
    patch: Partial<Pick<MarketingChannelRegistry, 'name' | 'handle' | 'pageUrl' | 'utmSourcePatterns' | 'notes'>>,
    actor = 'MARKETING_ADMIN'
  ): MarketingChannelRegistry | null {
    const ch = this.getChannel(id);
    if (!ch) return null;
    const changes: string[] = [];
    if (patch.name !== undefined && patch.name !== ch.name) {
      changes.push(`name: "${ch.name}" → "${patch.name}"`);
      ch.name = patch.name;
    }
    if (patch.handle !== undefined && patch.handle !== ch.handle) {
      changes.push(`handle: "${ch.handle}" → "${patch.handle}"`);
      ch.handle = patch.handle;
    }
    if (patch.pageUrl !== undefined) ch.pageUrl = patch.pageUrl || undefined;
    if (patch.notes !== undefined) ch.notes = patch.notes || undefined;
    if (patch.utmSourcePatterns) {
      const next = patch.utmSourcePatterns.map((p) => p.toLowerCase().trim()).filter(Boolean);
      if (next.join(',') !== ch.utmSourcePatterns.join(',')) changes.push(`utm aliases → ${next.join(', ') || '(none)'}`);
      ch.utmSourcePatterns = next;
    }
    ch.updatedAt = new Date().toISOString();
    serverDb.addAuditLog(
      'MC_CHANNEL_UPDATED',
      'MarketingCommand',
      ch.id,
      changes.length ? `Channel "${ch.name}" updated: ${changes.join('; ')}` : `Channel "${ch.name}" reviewed (no field changes)`,
      actor,
      undefined,
      'INFO',
      'CONFIG'
    );
    return ch;
  }

  setChannelStatus(id: string, status: AdChannelStatus, note?: string, actor = 'MARKETING_ADMIN'): MarketingChannelRegistry | null {
    const ch = this.getChannel(id);
    if (!ch) return null;
    if (ch.status === status) return ch;
    const previous = ch.status;
    ch.status = status;
    ch.updatedAt = new Date().toISOString();
    ch.statusHistory.push({ status, changedAt: ch.updatedAt, changedBy: actor, note: note || `Status ${previous} → ${status}` });
    serverDb.addAuditLog(
      'MC_CHANNEL_STATUS_CHANGED',
      'MarketingCommand',
      ch.id,
      `Channel "${ch.name}" status ${previous} → ${status}${note ? ` (${note})` : ''}. History preserved.`,
      actor,
      undefined,
      status === 'ARCHIVED' ? 'WARNING' : 'INFO',
      'CONFIG'
    );
    return ch;
  }

  // -------------------------------------------------------------
  // Spend Ledger (Phase MC-2)
  // -------------------------------------------------------------

  listSpends(filters?: { channelId?: string; campaignId?: string; from?: string; to?: string; includeVoided?: boolean }): MarketingSpendEntry[] {
    return this.spends
      .filter((s) => {
        if (!filters?.includeVoided && s.status === 'VOID') return false;
        if (filters?.channelId && s.channelId !== filters.channelId) return false;
        if (filters?.campaignId && s.campaignId !== filters.campaignId) return false;
        if (filters?.from && s.dateTo < filters.from) return false;
        if (filters?.to && s.dateFrom > filters.to) return false;
        return true;
      })
      .sort((a, b) => b.dateFrom.localeCompare(a.dateFrom));
  }

  getSpend(id: string): MarketingSpendEntry | undefined {
    return this.spends.find((s) => s.id === id);
  }

  private validateSpendRefs(input: { channelId: string; campaignId?: string; dateFrom: string; dateTo: string }): string | null {
    const ch = this.getChannel(input.channelId);
    if (!ch) return 'Unknown marketing channel — register the channel first.';
    if (ch.status === 'ARCHIVED') return `Channel "${ch.name}" is archived; reactivate or archive-pending channels only accept historical edits.`;
    if (input.dateTo < input.dateFrom) return 'Period end date cannot be before the period start date.';
    if (input.campaignId) {
      const camp = this.getCampaignById(input.campaignId);
      if (!camp) return 'Linked campaign not found in the Campaigns module.';
    }
    return null;
  }

  private getCampaignById(campaignId: string): MarketingCampaign | undefined {
    return marketingService.getCampaigns().find((c) => c.id === campaignId);
  }

  createSpend(input: Omit<MarketingSpendEntry, 'id' | 'status' | 'editHistory' | 'createdAt' | 'updatedAt' | 'recordedBy' | 'campaignNameSnapshot'> & { actor?: string }): { error?: string; entry?: MarketingSpendEntry } {
    const refErr = this.validateSpendRefs(input);
    if (refErr) return { error: refErr };
    if (input.financeExpenseRef && !serverDb.expenses.some((e) => e.id === input.financeExpenseRef)) {
      return { error: `Finance expense reference "${input.financeExpenseRef}" does not exist` };
    }
    const now = new Date().toISOString();
    const actor = input.actor || 'MARKETING_ADMIN';
    const camp = input.campaignId ? this.getCampaignById(input.campaignId) : undefined;
    const entry: MarketingSpendEntry = {
      id: genId('msp'),
      entryType: input.entryType,
      channelId: input.channelId,
      campaignId: input.campaignId || undefined,
      campaignNameSnapshot: camp?.campaignName,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      amountBdt: round2(input.amountBdt),
      impressions: input.impressions || 0,
      clicks: input.clicks || 0,
      sends: input.sends || 0,
      utmSource: input.utmSource || undefined,
      utmCampaign: input.utmCampaign || undefined,
      utmContent: input.utmContent || undefined,
      notes: input.notes || undefined,
      financeExpenseRef: input.financeExpenseRef || undefined,
      status: 'ACTIVE',
      editHistory: [],
      recordedBy: actor,
      createdAt: now,
      updatedAt: now,
    };
    this.spends.push(entry);
    serverDb.addAuditLog(
      'MC_SPEND_LOGGED',
      'MarketingCommand',
      entry.id,
      `Logged ৳${entry.amountBdt} ${entry.entryType} spend on ${this.getChannel(entry.channelId)?.name || entry.channelId}${camp ? ` (campaign: ${camp.campaignName})` : ''}${entry.financeExpenseRef ? ` [finance ref ${entry.financeExpenseRef}]` : ''}`,
      actor,
      undefined,
      'INFO',
      'FINANCIAL'
    );
    return { entry };
  }

  updateSpend(id: string, patch: Partial<MarketingSpendEntry>, actor = 'MARKETING_ADMIN'): { error?: string; entry?: MarketingSpendEntry } {
    const entry = this.getSpend(id);
    if (!entry) return { error: 'Spend entry not found' };
    if (entry.status === 'VOID') return { error: 'Voided ledger entries are immutable. Log a corrected entry instead.' };
    if (patch.financeExpenseRef !== undefined) {
      const ref = patch.financeExpenseRef;
      if (ref && !serverDb.expenses.some((e) => e.id === ref)) return { error: `Finance expense reference "${ref}" does not exist` };
    }
    const merged = {
      ...entry,
      ...patch,
      channelId: patch.channelId ?? entry.channelId,
      campaignId: patch.campaignId ?? entry.campaignId,
      dateFrom: patch.dateFrom ?? entry.dateFrom,
      dateTo: patch.dateTo ?? entry.dateTo,
    };
    const refErr = this.validateSpendRefs(merged);
    if (refErr) return { error: refErr };

    const changes: string[] = [];
    if (patch.entryType && patch.entryType !== entry.entryType) changes.push(`type ${entry.entryType} → ${patch.entryType}`);
    if (patch.channelId && patch.channelId !== entry.channelId) changes.push(`channel ${entry.channelId} → ${patch.channelId}`);
    if (patch.campaignId !== undefined && (patch.campaignId || undefined) !== (entry.campaignId || undefined)) changes.push(`campaign ${entry.campaignId || '—'} → ${patch.campaignId || '—'}`);
    if ((patch.dateFrom && patch.dateFrom !== entry.dateFrom) || (patch.dateTo && patch.dateTo !== entry.dateTo)) changes.push(`period ${entry.dateFrom}..${entry.dateTo} → ${merged.dateFrom}..${merged.dateTo}`);
    if (patch.amountBdt !== undefined && round2(patch.amountBdt) !== entry.amountBdt) changes.push(`amount ৳${entry.amountBdt} → ৳${round2(patch.amountBdt)}`);
    if (patch.impressions !== undefined && (patch.impressions || 0) !== entry.impressions) changes.push(`impressions ${entry.impressions} → ${patch.impressions || 0}`);
    if (patch.clicks !== undefined && (patch.clicks || 0) !== entry.clicks) changes.push(`clicks ${entry.clicks} → ${patch.clicks || 0}`);
    if (patch.sends !== undefined && (patch.sends || 0) !== entry.sends) changes.push(`sends ${entry.sends} → ${patch.sends || 0}`);
    if (patch.notes !== undefined && (patch.notes || undefined) !== (entry.notes || undefined)) changes.push('notes updated');

    const camp = merged.campaignId ? this.getCampaignById(merged.campaignId) : undefined;
    Object.assign(entry, {
      entryType: patch.entryType ?? entry.entryType,
      channelId: merged.channelId,
      campaignId: merged.campaignId || undefined,
      campaignNameSnapshot: camp?.campaignName ?? entry.campaignNameSnapshot,
      dateFrom: merged.dateFrom,
      dateTo: merged.dateTo,
      amountBdt: round2(merged.amountBdt),
      impressions: merged.impressions || 0,
      clicks: merged.clicks || 0,
      sends: merged.sends || 0,
      utmSource: patch.utmSource !== undefined ? patch.utmSource || undefined : entry.utmSource,
      utmCampaign: patch.utmCampaign !== undefined ? patch.utmCampaign || undefined : entry.utmCampaign,
      utmContent: patch.utmContent !== undefined ? patch.utmContent || undefined : entry.utmContent,
      notes: patch.notes !== undefined ? patch.notes || undefined : entry.notes,
      financeExpenseRef: patch.financeExpenseRef !== undefined ? patch.financeExpenseRef || undefined : entry.financeExpenseRef,
      updatedAt: new Date().toISOString(),
    });
    if (changes.length) {
      entry.editHistory.push({ editedAt: entry.updatedAt, editedBy: actor, summary: changes.join('; ') });
      serverDb.addAuditLog(
        'MC_SPEND_EDITED',
        'MarketingCommand',
        entry.id,
        `Spend entry amended: ${changes.join('; ')}`,
        actor,
        undefined,
        'WARNING',
        'FINANCIAL'
      );
    }
    return { entry };
  }

  voidSpend(id: string, reason: string, actor = 'MARKETING_ADMIN'): { error?: string; entry?: MarketingSpendEntry } {
    const entry = this.getSpend(id);
    if (!entry) return { error: 'Spend entry not found' };
    if (entry.status === 'VOID') return { error: 'Entry is already voided' };
    entry.status = 'VOID';
    entry.voidReason = reason;
    entry.voidedAt = new Date().toISOString();
    entry.updatedAt = entry.voidedAt;
    entry.editHistory.push({ editedAt: entry.voidedAt, editedBy: actor, summary: `VOIDED: ${reason}` });
    serverDb.addAuditLog(
      'MC_SPEND_VOIDED',
      'MarketingCommand',
      entry.id,
      `Spend entry voided (history preserved): ৳${entry.amountBdt} on ${this.getChannel(entry.channelId)?.name || entry.channelId} — reason: ${reason}`,
      actor,
      undefined,
      'WARNING',
      'FINANCIAL'
    );
    return { entry };
  }

  // -------------------------------------------------------------
  // Attribution (Phase MC-3)
  // -------------------------------------------------------------

  listAttributions(filters?: { channelId?: string; campaignId?: string; from?: string; to?: string }): MarketingAttributionEntry[] {
    return this.attributions
      .filter((a) => {
        if (filters?.channelId && a.channelId !== filters.channelId) return false;
        if (filters?.campaignId && a.campaignId !== filters.campaignId) return false;
        if (filters?.from && a.date < filters.from) return false;
        if (filters?.to && a.date > filters.to) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  createAttribution(input: Omit<MarketingAttributionEntry, 'id' | 'createdAt' | 'campaignNameSnapshot' | 'recordedBy'> & { actor?: string; recordedBy?: string }): { error?: string; entry?: MarketingAttributionEntry } {
    const ch = this.getChannel(input.channelId);
    if (!ch) return { error: 'Unknown marketing channel for attribution' };
    if (input.campaignId) {
      const camp = this.getCampaignById(input.campaignId);
      if (!camp) return { error: 'Linked campaign not found in the Campaigns module' };
    }
    // Validate order references against the live order book (read-only check)
    const cleanOrderNumbers: string[] = [];
    for (const raw of input.orderNumbers || []) {
      const on = (raw || '').trim().toUpperCase();
      if (!on) continue;
      const exists = serverDb.orders.some((o) => o.orderNumber.toUpperCase() === on);
      if (!exists) return { error: `Order ${on} was not found — attribution can only reference real order numbers` };
      cleanOrderNumbers.push(on);
    }
    const now = new Date().toISOString();
    const actor = input.actor || 'MARKETING_ADMIN';
    const camp = input.campaignId ? this.getCampaignById(input.campaignId) : undefined;
    const entry: MarketingAttributionEntry = {
      id: genId('mat'),
      channelId: input.channelId,
      campaignId: input.campaignId || undefined,
      campaignNameSnapshot: camp?.campaignName,
      date: input.date,
      attributedRevenueBdt: round2(input.attributedRevenueBdt),
      attributedOrders: input.attributedOrders || cleanOrderNumbers.length,
      orderNumbers: cleanOrderNumbers,
      source: input.source,
      notes: input.notes || undefined,
      recordedBy: actor,
      createdAt: now,
    };
    if (entry.attributedOrders < cleanOrderNumbers.length) entry.attributedOrders = cleanOrderNumbers.length;
    this.attributions.push(entry);
    serverDb.addAuditLog(
      'MC_ATTRIBUTION_RECORDED',
      'MarketingCommand',
      entry.id,
      `Attributed ৳${entry.attributedRevenueBdt} / ${entry.attributedOrders} order(s) to ${ch.name}${camp ? ` × ${camp.campaignName}` : ''} via ${entry.source}${cleanOrderNumbers.length ? ` [${cleanOrderNumbers.join(', ')}]` : ''}`,
      actor,
      undefined,
      'INFO',
      'FINANCIAL'
    );
    return { entry };
  }

  // -------------------------------------------------------------
  // Storefront UTM auto-tagging (called once at order creation, additive only)
  // -------------------------------------------------------------

  /**
   * Sanitizes a client-provided UTM payload into a trusted-shaped tag.
   * Strings only, length-capped. This NEVER touches money fields; it is
   * stored as immutable metadata on the freshly created order.
   */
  sanitizeOrderUtm(raw: unknown): OrderUtmTag | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const r = raw as Record<string, unknown>;
    const str = (v: unknown, max = 160): string | undefined => {
      if (typeof v !== 'string') return undefined;
      const cleaned = v.replace(/[^\w\s.,:+/()#\u0980-\u09ff-]/g, '').trim().slice(0, max);
      return cleaned || undefined;
    };
    const tag: OrderUtmTag = {
      utmSource: str(r.utmSource, 80),
      utmMedium: str(r.utmMedium, 80),
      utmCampaign: str(r.utmCampaign, 160),
      utmContent: str(r.utmContent, 120),
      gclid: str(r.gclid, 120),
      fbclid: str(r.fbclid, 120),
      landingPath: str(r.landingPath, 300),
      capturedAt: new Date().toISOString(),
    };
    const meaningful = Object.entries(tag).filter(([k, v]) => v && k !== 'capturedAt');
    return meaningful.length > 0 ? tag : undefined;
  }

  // -------------------------------------------------------------
  // Order → channel/campaign matching (read-only derivations)
  // -------------------------------------------------------------

  /** Resolves the registry channel for an order and records which evidence matched it. */
  private matchOrderChannel(order: Order): { channel?: MarketingChannelRegistry; basis: AutoAttributedOrderRow['matchBasis'] } {
    const utm = order.utm;
    if (utm?.utmSource) {
      const src = norm(utm.utmSource);
      const direct = this.channels.find(
        (c) =>
          c.status !== 'ARCHIVED' &&
          (c.utmSourcePatterns.some((p) => norm(p) === src) ||
            BUILT_IN_UTM_ALIASES[c.type].some((a) => a === src) ||
            (c.handle ? norm(c.handle) === src : false))
      );
      if (direct) return { channel: direct, basis: 'UTM_SOURCE' };
    }
    // Fallback: orders taken through an in-house channel desk map to their registry twin
    const sourceByOrderSource: Partial<Record<string, AdChannelType>> = {
      WHATSAPP: 'WHATSAPP',
      FACEBOOK: 'FACEBOOK',
      MESSENGER: 'FACEBOOK',
      INSTAGRAM: 'INSTAGRAM',
    };
    const wantedType = order.orderSource ? sourceByOrderSource[order.orderSource] : undefined;
    if (wantedType) {
      const viaSource = this.channels.find((c) => c.type === wantedType && c.status !== 'ARCHIVED');
      if (viaSource) return { channel: viaSource, basis: 'ORDER_SOURCE' };
    }
    return { basis: 'NONE' };
  }

  campaignForOrder(order: Order): MarketingCampaign | undefined {
    const campaigns = marketingService.getCampaigns();
    const utmCamp = norm(order.utm?.utmCampaign);
    if (utmCamp) {
      const byId = campaigns.find((c) => norm(c.id) === utmCamp || utmCamp.includes(norm(c.id)));
      if (byId) return byId;
      const byName = campaigns.find((c) => utmCamp.includes(norm(c.campaignName)) || norm(c.campaignName).includes(utmCamp));
      if (byName) return byName;
    }
    const applied = (order.appliedCouponCode || '').toUpperCase().trim();
    if (applied) {
      const byCoupon = campaigns.find((c) => c.couponCode && c.couponCode.toUpperCase() === applied);
      if (byCoupon) return byCoupon;
    }
    return undefined;
  }

  /**
   * Read-only scan of orders that carry UTM tags or channel-desk provenance.
   * Orders already referenced by a manual attribution entry are skipped so the
   * same revenue is never double-counted.
   */
  autoAttributedOrders(from?: string, to?: string): AutoAttributedOrderRow[] {
    const claimedOrderNumbers = new Set(this.attributions.flatMap((a) => a.orderNumbers.map((o) => o.toUpperCase())));
    const rows: AutoAttributedOrderRow[] = [];
    for (const order of serverDb.orders) {
      if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'FAILED') continue;
      const day = dateOnly(order.createdAt);
      if (!withinRange(day, from, to)) continue;
      const hasUtm = !!order.utm && !!(order.utm.utmSource || order.utm.utmCampaign || order.utm.fbclid || order.utm.gclid);
      const { channel, basis } = this.matchOrderChannel(order);
      if (!hasUtm && basis === 'NONE') continue;
      const manuallyClaimed = claimedOrderNumbers.has(order.orderNumber.toUpperCase());
      const camp = this.campaignForOrder(order);
      const row: AutoAttributedOrderRow = {
        orderNumber: order.orderNumber,
        orderDate: day,
        totalBdt: order.total,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        utmSource: order.utm?.utmSource,
        utmCampaign: order.utm?.utmCampaign,
        matchedChannelId: manuallyClaimed ? undefined : channel?.id,
        matchedChannelLabel: manuallyClaimed ? undefined : channel?.name,
        matchedCampaignId: camp?.id,
        matchedCampaignName: camp?.campaignName,
        // Manual attribution entries own their orders: shown as NONE so the same
        // revenue is never double-counted in auto totals.
        matchBasis: manuallyClaimed ? 'NONE' : basis,
      };
      rows.push(row);
    }
    return rows;
  }

  // -------------------------------------------------------------
  // ROI Engine (Phase MC-4) — all math server-side
  // -------------------------------------------------------------

  private activeSpends(from?: string, to?: string): MarketingSpendEntry[] {
    return this.spends.filter(
      (s) => s.status === 'ACTIVE' && !(from && s.dateTo < from) && !(to && s.dateFrom > to)
    );
  }

  private autoOrders(from?: string, to?: string): AutoAttributedOrderRow[] {
    return this.autoAttributedOrders(from, to).filter((r) => r.matchedChannelId && r.matchBasis !== 'NONE');
  }

  private emptyMetrics() {
    return { spendBdt: 0, revenueBdt: 0, orders: 0, impressions: 0, clicks: 0, sends: 0 };
  }

  private foldMetrics(row: ReturnType<MarketingCommandCenterEngine['emptyMetrics']>) {
    return {
      roas: safeRatio(row.revenueBdt, row.spendBdt),
      roiPct: row.spendBdt > 0 ? round2(((row.revenueBdt - row.spendBdt) / row.spendBdt) * 100) : 0,
      cpoBdt: safeRatio(row.spendBdt, row.orders),
      costPerClickBdt: safeRatio(row.spendBdt, row.clicks),
      costPerSendBdt: safeRatio(row.spendBdt, row.sends),
    };
  }

  computeRoiReport(from?: string, to?: string): MarketingRoiReport {
    const spends = this.activeSpends(from, to);
    const attrs = this.listAttributions({ from, to });
    const autoRows = this.autoOrders(from, to);

    // --- Channel rollup ---
    const channelMap = new Map<string, ReturnType<MarketingCommandCenterEngine['emptyMetrics']> & { registry?: MarketingChannelRegistry }>();
    const ensureChannel = (key: string, registry?: MarketingChannelRegistry) => {
      if (!channelMap.has(key)) channelMap.set(key, { ...this.emptyMetrics(), registry });
      return channelMap.get(key)!;
    };

    for (const s of spends) {
      const reg = this.getChannel(s.channelId);
      const bucket = ensureChannel(s.channelId, reg);
      bucket.spendBdt += s.amountBdt;
      bucket.impressions += s.impressions || 0;
      bucket.clicks += s.clicks || 0;
      bucket.sends += s.sends || 0;
    }
    for (const a of attrs) {
      const bucket = ensureChannel(a.channelId, this.getChannel(a.channelId));
      bucket.revenueBdt += a.attributedRevenueBdt;
      bucket.orders += a.attributedOrders;
    }
    for (const r of autoRows) {
      const bucket = ensureChannel(r.matchedChannelId!, this.getChannel(r.matchedChannelId!));
      bucket.revenueBdt += r.totalBdt;
      bucket.orders += 1;
    }

    const byChannel: MarketingRoiRow[] = Array.from(channelMap.entries())
      .map(([key, m]) => ({
        key,
        label: m.registry?.name || key,
        labelBn: m.registry?.name || key,
        meta: m.registry ? `${m.registry.type} · @${m.registry.handle}` : 'Orphan reference',
        spendBdt: round2(m.spendBdt),
        attributedRevenueBdt: round2(m.revenueBdt),
        attributedOrders: m.orders,
        impressions: m.impressions,
        clicks: m.clicks,
        sends: m.sends,
        ...this.foldMetrics(m),
      }))
      .sort((a, b) => b.spendBdt - a.spendBdt || b.attributedRevenueBdt - a.attributedRevenueBdt);

    // --- Campaign rollup ---
    const campaignMap = new Map<string, ReturnType<MarketingCommandCenterEngine['emptyMetrics']> & { campaign?: MarketingCampaign }>();
    const ensureCampaign = (key: string, campaign?: MarketingCampaign) => {
      if (!campaignMap.has(key)) campaignMap.set(key, { ...this.emptyMetrics(), campaign });
      return campaignMap.get(key)!;
    };
    for (const s of spends) {
      if (!s.campaignId) continue;
      const bucket = ensureCampaign(s.campaignId, this.getCampaignById(s.campaignId));
      bucket.spendBdt += s.amountBdt;
      bucket.impressions += s.impressions || 0;
      bucket.clicks += s.clicks || 0;
      bucket.sends += s.sends || 0;
    }
    for (const a of attrs) {
      if (!a.campaignId) continue;
      const bucket = ensureCampaign(a.campaignId, this.getCampaignById(a.campaignId));
      bucket.revenueBdt += a.attributedRevenueBdt;
      bucket.orders += a.attributedOrders;
    }
    for (const r of autoRows) {
      if (!r.matchedCampaignId) continue;
      const bucket = ensureCampaign(r.matchedCampaignId, this.getCampaignById(r.matchedCampaignId));
      bucket.revenueBdt += r.totalBdt;
      bucket.orders += 1;
    }
    const byCampaign: MarketingRoiRow[] = Array.from(campaignMap.entries())
      .map(([key, m]) => ({
        key,
        label: m.campaign?.campaignName || key,
        labelBn: m.campaign?.campaignNameBn || m.campaign?.campaignName || key,
        meta: m.campaign ? `${m.campaign.type} · ${m.campaign.status}` : 'Archived campaign reference',
        spendBdt: round2(m.spendBdt),
        attributedRevenueBdt: round2(m.revenueBdt),
        attributedOrders: m.orders,
        impressions: m.impressions,
        clicks: m.clicks,
        sends: m.sends,
        ...this.foldMetrics(m),
      }))
      .sort((a, b) => b.roas - a.roas || b.attributedRevenueBdt - a.attributedRevenueBdt);

    // --- Monthly buckets (spend by dateFrom month; revenue by attribution/order month) ---
    const monthlyMap = new Map<string, ReturnType<MarketingCommandCenterEngine['emptyMetrics']>>();
    const ensureMonth = (month: string) => {
      if (!monthlyMap.has(month)) monthlyMap.set(month, this.emptyMetrics());
      return monthlyMap.get(month)!;
    };
    for (const s of spends) ensureMonth(s.dateFrom.slice(0, 7)).spendBdt += s.amountBdt;
    for (const a of attrs) ensureMonth(a.date.slice(0, 7)).revenueBdt += a.attributedRevenueBdt;
    for (const r of autoRows) {
      const bucket = ensureMonth(r.orderDate.slice(0, 7));
      bucket.revenueBdt += r.totalBdt;
      bucket.orders += 1;
    }
    for (const s of spends) {
      const bucket = ensureMonth(s.dateFrom.slice(0, 7));
      bucket.impressions += s.impressions || 0;
      bucket.clicks += s.clicks || 0;
      bucket.sends += s.sends || 0;
    }
    const monthly: MarketingMonthlySummaryRow[] = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, m]) => ({
        month,
        spendBdt: round2(m.spendBdt),
        attributedRevenueBdt: round2(m.revenueBdt),
        attributedOrders: m.orders,
        clicks: m.clicks,
        sends: m.sends,
        roas: safeRatio(m.revenueBdt, m.spendBdt),
        roiPct: m.spendBdt > 0 ? round2(((m.revenueBdt - m.spendBdt) / m.spendBdt) * 100) : 0,
      }));

    // --- Totals ---
    const totalsRaw = this.emptyMetrics();
    for (const row of byChannel) {
      totalsRaw.spendBdt += row.spendBdt;
      totalsRaw.revenueBdt += row.attributedRevenueBdt;
      totalsRaw.orders += row.attributedOrders;
      totalsRaw.impressions += row.impressions;
      totalsRaw.clicks += row.clicks;
      totalsRaw.sends += row.sends;
    }
    const totals = {
      spendBdt: round2(totalsRaw.spendBdt),
      attributedRevenueBdt: round2(totalsRaw.revenueBdt),
      attributedOrders: totalsRaw.orders,
      impressions: totalsRaw.impressions,
      clicks: totalsRaw.clicks,
      sends: totalsRaw.sends,
      ...this.foldMetrics(totalsRaw),
    };

    return {
      period: { from: from || 'ALL', to: to || 'ALL' },
      totals,
      byChannel,
      byCampaign,
      monthly,
      generatedAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------
  // Finance reconciliation (READ-ONLY — never writes to Finance)
  // -------------------------------------------------------------

  financeReconciliation(from?: string, to?: string): MarketingFinanceReconciliation {
    const financeRows = serverDb.expenses
      .filter((e) => e.category === 'MARKETING' && withinRange(dateOnly(e.date), from, to))
      .map((e) => ({ id: e.id, date: dateOnly(e.date), vendor: e.vendor, amount: e.amount, reference: e.reference }));
    const financeTotal = financeRows.reduce((sum, r) => sum + r.amount, 0);
    const commandRows = this.activeSpends(from, to).map((s) => ({
      id: s.id,
      dateFrom: s.dateFrom,
      dateTo: s.dateTo,
      amount: s.amountBdt,
      financeExpenseRef: s.financeExpenseRef,
      entryType: s.entryType,
    }));
    const commandTotal = commandRows.reduce((sum, r) => sum + r.amount, 0);
    return {
      financeMarketingSpendBdt: round2(financeTotal),
      commandCenterSpendBdt: round2(commandTotal),
      gapBdt: round2(financeTotal - commandTotal),
      financeRows,
      commandRows,
      note: 'Finance remains the single source of truth for booked expenses. The Marketing ledger mirrors spend for ROI only; a positive gap means marketing spend exists in Finance that has not been logged (or linked) in the Command Center yet. Nothing here is auto-posted.',
      noteBn: 'বইখাতায় খরচের একমাত্র প্রামাণিক উৎস হলো ফাইন্যান্স মডিউল। মার্কেটিং লেজার শুধু ROI হিসাবের জন্য খরচ প্রতিফলিত করে — ধনাত্মক পার্থক্য মানে এমন খরচ যা এখনও কমান্ড সেন্টারে লগ (বা লিংক) হয়নি। এখান থেকে ফাইন্যান্সে কিছুই অটো-পোস্ট হয় না।',
    };
  }

  // -------------------------------------------------------------
  // FUTURE / OPTIONAL API connectors (Phase MC-5) — never fabricated
  // -------------------------------------------------------------

  syncStatus(): { connectors: MarketingSyncConnector[]; note: string; noteBn: string } {
    return {
      connectors: [
        {
          id: 'conn-meta-capi',
          label: 'Meta Conversion API (Ads Manager spend & conversions import)',
          labelBn: 'মেটা কনভার্সন এপিআই (অ্যাডস ম্যানেজার স্পেন্ড ও কনভার্সন ইমপোর্ট)',
          provider: 'META_CAPI',
          status: 'FUTURE',
          autoSyncImplemented: false,
          description: 'Planned: signed-request import of daily ad account spend and click telemetry into the spend ledger, deduplicated by (account, date). Requires a real Meta App access token before enablement.',
          descriptionBn: 'পরিকল্পিত: অ্যাড অ্যাকাউন্টের দৈনিক খরচ ও ক্লিক ডেটা স্বয়ংক্রিয়ভাবে স্পেন্ড লেজারে ইমপোর্ট (অ্যাকাউন্ট+তারিখ ভিত্তিক ডুপ্লিকেট প্রতিরোধ)। সক্রিয় করার আগে প্রকৃত Meta App অ্যাক্সেস টোকেন প্রয়োজন।',
        },
        {
          id: 'conn-wa-business',
          label: 'WhatsApp Business Cloud API (send receipts & conversation counts)',
          labelBn: 'হোয়াটসঅ্যাপ বিজনেস ক্লাউড এপিআই (সেন্ড রসিদ ও কথোপকথন গণনা)',
          provider: 'WHATSAPP_BUSINESS_API',
          status: 'FUTURE',
          autoSyncImplemented: false,
          description: 'Planned: import per-message delivery receipts and conversation pricing from the Cloud API into SEND ledger entries. Until then, send counts are logged manually or seeded from Campaigns telemetry.',
          descriptionBn: 'পরিকল্পিত: ক্লাউড এপিআই থেকে প্রতি-মেসেজ ডেলিভারি রসিদ ও কথোপকথন মূল্য SEND লেজারে যুক্ত হবে। এখন পর্যন্ত সেন্ড সংখ্যা ম্যানুয়ালি লগ করা হয় অথবা ক্যাম্পেইন টেলিমেট্রি থেকে আসে।',
        },
        {
          id: 'conn-telegram-bot',
          label: 'Telegram Bot API (channel broadcast stats import)',
          labelBn: 'টেলিগ্রাম বট এপিআই (চ্যানেল ব্রডকাস্ট স্ট্যাটস ইমপোর্ট)',
          provider: 'TELEGRAM_BOT_API',
          status: 'FUTURE',
          autoSyncImplemented: false,
          description: 'Planned: pull bot commands/getChatMember counts and broadcast view statistics for registered Telegram channels. No Telegram sync exists today.',
          descriptionBn: 'পরিকল্পিত: নিবন্ধিত টেলিগ্রাম চ্যানেলের বট পরিসংখ্যান ও ব্রডকাস্ট ভিউ ডেটা আনা হবে। বর্তমানে কোনো টেলিগ্রাম সিংক চালু নেই।',
        },
      ],
      note: 'All connectors above are FUTURE/OPTIONAL hooks. No auto-import is running and no placeholder/simulated figures are ever inserted into the ledger or reports.',
      noteBn: 'উপরের সংযোগকারীগুলো ভবিষ্যতের (FUTURE/OPTIONAL) হুক — এখনো কোনো অটো-ইমপোর্ট চালু নেই এবং লেজার বা রিপোর্টে কোনো কাল্পনিক/সিমুলেটেড সংখ্যা যোগ করা হয় না।',
    };
  }

  // -------------------------------------------------------------
  // CSV export (Phase MC-5)
  // -------------------------------------------------------------

  buildCsv(dataset: 'SPENDS' | 'ATTRIBUTIONS' | 'ROI_CHANNELS' | 'ROI_CAMPAIGNS' | 'MONTHLY' | 'CHANNELS', from?: string, to?: string): string {
    const esc = (v: unknown): string => {
      const s = v === null || v === undefined ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines: string[] = [];
    const push = (cells: unknown[]) => lines.push(cells.map(esc).join(','));

    if (dataset === 'SPENDS') {
      push(['ID', 'Type', 'Channel', 'Campaign', 'DateFrom', 'DateTo', 'AmountBDT', 'Impressions', 'Clicks', 'Sends', 'UTM Source', 'UTM Campaign', 'Status', 'Finance Ref', 'Notes', 'Recorded By', 'Logged At']);
      for (const s of this.listSpends({ from, to, includeVoided: true })) {
        push([
          s.id, s.entryType, this.getChannel(s.channelId)?.name || s.channelId, s.campaignNameSnapshot || '',
          s.dateFrom, s.dateTo, s.amountBdt, s.impressions, s.clicks, s.sends,
          s.utmSource || '', s.utmCampaign || '', s.status, s.financeExpenseRef || '',
          s.status === 'VOID' ? `VOID: ${s.voidReason || ''}${s.notes ? ` | ${s.notes}` : ''}` : s.notes || '',
          s.recordedBy, s.createdAt,
        ]);
      }
    } else if (dataset === 'ATTRIBUTIONS') {
      push(['ID', 'Channel', 'Campaign', 'Date', 'AttributedRevenueBDT', 'AttributedOrders', 'Order Numbers', 'Source', 'Notes', 'Recorded By', 'Recorded At']);
      for (const a of this.listAttributions({ from, to })) {
        push([a.id, this.getChannel(a.channelId)?.name || a.channelId, a.campaignNameSnapshot || '', a.date, a.attributedRevenueBdt, a.attributedOrders, a.orderNumbers.join(' '), a.source, a.notes || '', a.recordedBy, a.createdAt]);
      }
      push([]);
      push(['--- AUTO-TAGGED ORDERS (UTM / channel-desk provenance, read-only) ---']);
      push(['Order Number', 'Date', 'TotalBDT', 'Payment Status', 'Order Status', 'UTM Source', 'UTM Campaign', 'Matched Channel', 'Matched Campaign', 'Basis']);
      for (const r of this.autoAttributedOrders(from, to)) {
        push([r.orderNumber, r.orderDate, r.totalBdt, r.paymentStatus, r.orderStatus, r.utmSource || '', r.utmCampaign || '', r.matchedChannelLabel || '', r.matchedCampaignName || '', r.matchBasis]);
      }
    } else if (dataset === 'ROI_CHANNELS' || dataset === 'ROI_CAMPAIGNS') {
      const report = this.computeRoiReport(from, to);
      const rows = dataset === 'ROI_CHANNELS' ? report.byChannel : report.byCampaign;
      push(['Key', 'Label', 'Meta', 'SpendBDT', 'AttributedRevenueBDT', 'AttributedOrders', 'Impressions', 'Clicks', 'Sends', 'ROAS', 'ROI%', 'Cost Per Order BDT', 'Cost Per Click BDT', 'Cost Per Conversation/Send BDT']);
      for (const r of rows) {
        push([r.key, dataset === 'ROI_CHANNELS' ? r.label : `${r.label} / ${r.labelBn}`, r.meta || '', r.spendBdt, r.attributedRevenueBdt, r.attributedOrders, r.impressions, r.clicks, r.sends, r.roas, r.roiPct, r.cpoBdt, r.costPerClickBdt, r.costPerSendBdt]);
      }
      push([]);
      push(['TOTALS', '', '', report.totals.spendBdt, report.totals.attributedRevenueBdt, report.totals.attributedOrders, report.totals.impressions, report.totals.clicks, report.totals.sends, report.totals.roas, report.totals.roiPct, report.totals.cpoBdt, report.totals.costPerClickBdt, report.totals.costPerSendBdt]);
    } else if (dataset === 'MONTHLY') {
      const report = this.computeRoiReport(from, to);
      push(['Month', 'SpendBDT', 'AttributedRevenueBDT', 'AttributedOrders', 'Clicks', 'Sends', 'ROAS', 'ROI%']);
      for (const m of report.monthly) {
        push([m.month, m.spendBdt, m.attributedRevenueBdt, m.attributedOrders, m.clicks, m.sends, m.roas, m.roiPct]);
      }
    } else {
      push(['ID', 'Type', 'Name', 'Handle', 'Page URL', 'Status', 'UTM Patterns', 'Notes', 'Created At', 'Updated At']);
      for (const c of this.channels) {
        push([c.id, c.type, c.name, c.handle, c.pageUrl || '', c.status, c.utmSourcePatterns.join(' '), c.notes || '', c.createdAt, c.updatedAt]);
      }
    }
    return '\uFEFF' + lines.join('\r\n');
  }
}

export const marketingCommandCenter = new MarketingCommandCenterEngine();
