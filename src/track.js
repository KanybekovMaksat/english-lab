// События воронки: уходят в Meta Pixel / Google Analytics, если они подключены на странице
// (на english.codify.kg они есть), и копятся локально — для проверки и отладки (window.__wordlabEvents).
const log = [];
export function track(event, data = {}) {
  log.push({ event, ...data, t: Date.now() });
  try {
    if (window.fbq) fbq('trackCustom', event, data);
    if (window.gtag) gtag('event', event, data);
    (window.dataLayer = window.dataLayer || []).push({ event: 'wordlab_' + event, ...data });
  } catch { /* аналитика не должна ломать книгу */ }
}
if (typeof window !== "undefined") window.__wordlabEvents = log;
