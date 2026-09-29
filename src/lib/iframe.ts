/**
 * Runs before any deck script. reveal.js (with `hash: true`) rebuilds the
 * URL from `location.pathname`, which inside a blob: document is the full
 * "https://host/<uuid>" — so its history.replaceState/pushState calls
 * target a URL the blob document isn't allowed to write and throw a
 * SecurityError. Swallow those failures: slide position just isn't
 * mirrored in the iframe's URL, which nobody can see anyway.
 */
const HISTORY_GUARD = `<script>(function () {
  ['pushState', 'replaceState'].forEach(function (name) {
    var original = history[name];
    history[name] = function () {
      try { return original.apply(history, arguments); } catch (e) {}
    };
  });
})();</script>`;

function injectHistoryGuard(html: string): string {
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch && headMatch.index !== undefined) {
    const at = headMatch.index + headMatch[0].length;
    return html.slice(0, at) + HISTORY_GUARD + html.slice(at);
  }
  return HISTORY_GUARD + html;
}

/**
 * Loads HTML into an iframe via a blob: URL instead of `srcdoc`.
 * `srcdoc` documents get an opaque "about:srcdoc" origin, which breaks
 * scripts that resolve relative URLs against the document. A blob: URL
 * has a real origin; history writes are neutralised by HISTORY_GUARD.
 */
export function setIframeHtml(iframe: HTMLIFrameElement, html: string): void {
  const blobUrl = URL.createObjectURL(
    new Blob([injectHistoryGuard(html)], { type: 'text/html' })
  );
  const previousBlobUrl = iframe.dataset.blobUrl;
  iframe.src = blobUrl;
  iframe.dataset.blobUrl = blobUrl;
  if (previousBlobUrl) URL.revokeObjectURL(previousBlobUrl);
}
