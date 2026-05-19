// UI/UX Pro Max visual layer: pointer glow + reduced-motion-safe reveal. Content-neutral.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    let raf = 0;
    window.addEventListener('pointermove', (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--sn-mouse-x', `${event.clientX}px`);
        root.style.setProperty('--sn-mouse-y', `${event.clientY}px`);
        raf = 0;
      });
    }, { passive: true });
  }
  const candidates = [...document.querySelectorAll('main > section, article, aside, .glass-card, .glass-strong')];
  if (!candidates.length || reduce || !('IntersectionObserver' in window)) return;
  candidates.forEach((el) => el.classList.add('sn-reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('sn-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  candidates.forEach((el, idx) => {
    el.style.transitionDelay = `${Math.min(idx * 35, 210)}ms`;
    io.observe(el);
  });
})();
