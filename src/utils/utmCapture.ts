/**
 * @file src/utils/utmCapture.ts
 * @description Marketing Command Center (Phase MC-3): first-touch UTM capture on the
 * storefront. Reads campaign parameters from the landing URL once, keeps them in
 * sessionStorage, and hands them to the order payload so the server can auto-tag
 * orders with their acquisition source. Purely additive telemetry — it never
 * influences cart math or payment values.
 * @license Apache-2.0
 */

const UTM_STORAGE_KEY = 'kisholoy_utm_first_touch';

export interface StoredUtmTag {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  landingPath: string;
  capturedAt: string;
}

function sanitize(value: string | null): string | undefined {
  if (!value) return undefined;
  const clean = decodeURIComponent(value).replace(/[^\w\s.,:+/()#\u0980-\u09ff-]/g, '').trim().slice(0, 160);
  return clean || undefined;
}

/**
 * Call once at app start: if the current URL carries UTM/click-id parameters,
 * store them as the FIRST-TOUCH attribution snapshot (existing snapshot wins).
 */
export function captureUtmOnVisit(): void {
  try {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const utmSource = sanitize(params.get('utm_source'));
    const utmMedium = sanitize(params.get('utm_medium'));
    const utmCampaign = sanitize(params.get('utm_campaign'));
    const utmContent = sanitize(params.get('utm_content'));
    const gclid = sanitize(params.get('gclid'));
    const fbclid = sanitize(params.get('fbclid'));

    if (!utmSource && !utmMedium && !utmCampaign && !utmContent && !gclid && !fbclid) return;

    const existing = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (existing) return; // first-touch policy: never overwrite mid-session

    const snapshot: StoredUtmTag = {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      gclid,
      fbclid,
      landingPath: `${window.location.pathname}${window.location.hash}`.slice(0, 300),
      capturedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage unavailable (private mode etc.) — attribution tagging is best-effort
  }
}

/**
 * Returns the first-touch UTM snapshot to attach to the order creation payload.
 * The server re-sanitizes and caps everything; client values are treated as hints.
 */
export function getStoredUtmPayload(): StoredUtmTag | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUtmTag;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      utmSource: parsed.utmSource,
      utmMedium: parsed.utmMedium,
      utmCampaign: parsed.utmCampaign,
      utmContent: parsed.utmContent,
      gclid: parsed.gclid,
      fbclid: parsed.fbclid,
      landingPath: typeof parsed.landingPath === 'string' ? parsed.landingPath.slice(0, 300) : '/',
      capturedAt: typeof parsed.capturedAt === 'string' ? parsed.capturedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
