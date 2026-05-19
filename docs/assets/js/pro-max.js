// Study Notes — Learning OS interaction layer. Content-neutral UI only.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureMainTarget() {
    const main = document.querySelector('main') || document.querySelector('section') || document.body;
    if (!main.id) main.id = 'main-content';
    return main;
  }

  function addSkipLink() {
    if (document.querySelector('.sn-skip-link')) return;
    const main = ensureMainTarget();
    const a = document.createElement('a');
    a.className = 'sn-skip-link';
    a.href = `#${main.id}`;
    a.textContent = 'Skip to study content';
    document.body.prepend(a);
  }

  function addProgressBar() {
    if (document.querySelector('.sn-progress')) return;
    const progress = document.createElement('div');
    progress.className = 'sn-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<div class="sn-progress__bar"></div>';
    document.body.append(progress);
    const bar = progress.firstElementChild;
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      bar.style.width = `${pct}%`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }

  function addStudyDock() {
    if (document.querySelector('.sn-study-dock')) return;
    const dock = document.createElement('div');
    dock.className = 'sn-study-dock';
    dock.setAttribute('aria-label', 'Study reading controls');
    dock.innerHTML = `
      <button type="button" data-sn-toggle="focus" aria-label="Toggle focus reading mode" title="Focus mode">◎</button>
      <button type="button" data-sn-toggle="wide" aria-label="Toggle wider reading measure" title="Wide reading">↔</button>
      <button type="button" data-sn-text="down" aria-label="Decrease text size" title="Smaller text">A−</button>
      <button type="button" data-sn-text="up" aria-label="Increase text size" title="Larger text">A+</button>
      <a href="#" aria-label="Back to top" title="Back to top">↑</a>
    `;
    document.body.append(dock);

    const saved = JSON.parse(localStorage.getItem('study-notes-learning-ui') || '{}');
    if (saved.focus) root.classList.add('sn-focus-mode');
    if (saved.wide) root.classList.add('sn-wide-mode');
    if (saved.text === 'large') root.classList.add('sn-large-text');
    if (saved.text === 'small') root.classList.add('sn-small-text');

    const sync = () => {
      dock.querySelector('[data-sn-toggle="focus"]').setAttribute('aria-pressed', root.classList.contains('sn-focus-mode'));
      dock.querySelector('[data-sn-toggle="wide"]').setAttribute('aria-pressed', root.classList.contains('sn-wide-mode'));
      localStorage.setItem('study-notes-learning-ui', JSON.stringify({
        focus: root.classList.contains('sn-focus-mode'),
        wide: root.classList.contains('sn-wide-mode'),
        text: root.classList.contains('sn-large-text') ? 'large' : root.classList.contains('sn-small-text') ? 'small' : 'normal'
      }));
    };
    sync();

    dock.addEventListener('click', (event) => {
      const target = event.target.closest('button, a');
      if (!target) return;
      if (target.matches('a')) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        return;
      }
      const toggle = target.dataset.snToggle;
      if (toggle === 'focus') root.classList.toggle('sn-focus-mode');
      if (toggle === 'wide') root.classList.toggle('sn-wide-mode');
      if (target.dataset.snText === 'up') {
        root.classList.remove('sn-small-text');
        root.classList.toggle('sn-large-text');
      }
      if (target.dataset.snText === 'down') {
        root.classList.remove('sn-large-text');
        root.classList.toggle('sn-small-text');
      }
      sync();
    });
  }

  function pointerGlow() {
    if (reduce) return;
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

  function revealOnScroll() {
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
      el.style.transitionDelay = `${Math.min(idx * 28, 196)}ms`;
      io.observe(el);
    });
  }

  function activeSectionTracking() {
    const sections = [...document.querySelectorAll('main section[id]')];
    const links = [...document.querySelectorAll('aside nav a[href^="#"], nav[aria-label] a[href^="#"]')];
    if (!sections.length || !links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [decodeURIComponent(a.getAttribute('href').slice(1)), a]));
    const setActive = (id) => {
      links.forEach((a) => a.removeAttribute('aria-current'));
      const active = byId.get(id);
      if (active) active.setAttribute('aria-current', 'true');
    };
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-20% 0px -62% 0px', threshold: [0.05, 0.2, 0.45] });
    sections.forEach((section) => io.observe(section));
  }

  addSkipLink();
  addProgressBar();
  addStudyDock();
  pointerGlow();
  revealOnScroll();
  activeSectionTracking();
})();
