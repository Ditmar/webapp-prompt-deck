/**
 * Loads HTML into an iframe via a blob: URL instead of `srcdoc`.
 * `srcdoc` documents get an opaque "about:srcdoc" origin, which makes
 * `history.pushState` throw inside slide decks that track their position
 * in the URL (e.g. reveal.js) — breaking navigation after a couple of
 * slides. A blob: URL has a real, resolvable origin, so it doesn't.
 */
export function setIframeHtml(iframe: HTMLIFrameElement, html: string): void {
  const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const previousBlobUrl = iframe.dataset.blobUrl;
  iframe.src = blobUrl;
  iframe.dataset.blobUrl = blobUrl;
  if (previousBlobUrl) URL.revokeObjectURL(previousBlobUrl);
}
