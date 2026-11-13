const measurementId = 'G-CH9NXJH2NW';
const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'source'] as const;
let initialReferralTracked = false;

type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function enabled() {
  return Boolean(measurementId && /^G-[A-Z0-9]+$/i.test(measurementId));
}

function ensureGtag() {
  if (!enabled() || typeof window === 'undefined') return false;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function gtag() {
    window.dataLayer?.push(arguments);
  };
  return true;
}
export function initializeAnalytics() {
  if (!ensureGtag() || !measurementId) return;

  window.gtag?.('js', new Date());
  window.gtag?.('config', measurementId, { send_page_view: false });

  const loadScript = () => {
    if (document.querySelector(`script[data-ga-id="${measurementId}"]`)) return;
    const script = document.createElement('script');
    script.async = true;
    script.dataset.gaId = measurementId;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  };

  if ('requestIdleCallback' in window && window.requestIdleCallback) {
    window.requestIdleCallback(loadScript, { timeout: 3000 });
  } else {
    window.setTimeout(loadScript, 1500);
  }
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!ensureGtag()) return;
  window.gtag?.('event', name, params);
}
export function trackPageView(path: string, title: string) {
  const pageUrl = new URL(path, window.location.origin);
  const currentParams = new URLSearchParams(window.location.search);
  for (const key of trackingParams) {
    const value = currentParams.get(key);
    // Do not forward arbitrary URL parameters (which may contain personal data).
    if (value && /^[a-z0-9_-]{1,80}$/i.test(value)) pageUrl.searchParams.set(key, value);
  }

  trackEvent('page_view', {
    page_location: pageUrl.toString(),
    page_path: path,
    page_title: title,
  });

  if (!initialReferralTracked) {
    initialReferralTracked = true;
    const hasChatgptSource = ['utm_source', 'source'].some((key) => currentParams.get(key)?.toLowerCase() === 'chatgpt');
    let chatgptReferrer = false;
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      chatgptReferrer = host === 'chatgpt.com' || host.endsWith('.chatgpt.com') || host === 'chat.openai.com';
    } catch {
      // Direct visits and stripped referrers have no parseable referrer.
    }
    if (hasChatgptSource || chatgptReferrer) {
      trackEvent('ai_referral', {
        referral_source: 'chatgpt',
        attribution_method: hasChatgptSource ? 'url_parameter' : 'referrer',
        landing_page: path,
      });
    }
  }

  if (path === '/contact') trackEvent('contact_view');
  if (path.startsWith('/cases/')) trackEvent('case_view', { case_path: path });
  if (path.startsWith('/insights/')) trackEvent('insight_view', { insight_path: path });
}

export function enableLinkTracking() {
  if (!enabled() || typeof document === 'undefined') return;
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a') : null;
    if (!target) return;
    const href = target.getAttribute('href') ?? '';
    if (href.startsWith('mailto:')) trackEvent('email_click');
    else if (href.startsWith('tel:')) trackEvent('phone_click');
    else if (href === '/contact') trackEvent('cta_click', { destination: '/contact' });
  }, { passive: true });
}
