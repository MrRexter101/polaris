import { $, $$ } from '../../lib/dom.js';

// <div class="video" data-video="YOUTUBE_ID"><button class="video-facade" aria-label="Play video: …">…</button></div>
// The YouTube player (privacy-enhanced domain) loads only when the visitor presses play.
export function initVideoFacades() {
  $$('[data-video]').forEach(box => {
    const facade = $('.video-facade', box);
    facade.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${box.dataset.video}?autoplay=1&rel=0`;
      f.title = facade.getAttribute('aria-label')?.replace(/^Play (film|video): /, '') || 'Film';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      box.replaceChildren(f);
    });
  });
}
