// Study Notes — Learning OS v2 interaction layer. Content-neutral: no educational prose is rewritten.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const THEME_KEY = 'study-notes-theme';
  const UI_KEY = 'study-notes-learning-os-v2';

  const icons = {
    sun: '<svg class="los-theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg class="los-theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/></svg>'
  };

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    document.querySelectorAll('#theme-toggle, .los-theme-toggle, [data-los-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', isDark ? 'Light mode' : 'Dark mode');
      btn.innerHTML = `${isDark ? icons.sun : icons.moon}<span class="hidden sm:inline">${isDark ? 'Light' : 'Dark'}</span>`;
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (systemDark ? 'dark' : 'dark'));
    document.addEventListener('click', (event) => {
      const btn = event.target.closest('#theme-toggle, .los-theme-toggle, [data-los-theme-toggle]');
      if (!btn) return;
      // Capture phase: replace older page-local theme handlers so the toggle never double-flips.
      event.preventDefault();
      event.stopPropagation();
      applyTheme(root.classList.contains('dark') ? 'light' : 'dark');
    }, true);
    if (!document.querySelector('#theme-toggle, .los-theme-toggle, [data-los-theme-toggle]')) {
      const fixed = document.createElement('button');
      fixed.type = 'button';
      fixed.className = 'los-theme-toggle';
      fixed.dataset.losThemeToggle = 'true';
      fixed.style.position = 'fixed';
      fixed.style.right = '16px';
      fixed.style.top = '76px';
      fixed.style.zIndex = '9001';
      document.body.append(fixed);
      applyTheme(root.classList.contains('dark') ? 'dark' : 'light');
    }
  }

  function pageType() {
    const path = location.pathname;
    if (path.includes('/html/')) return 'note';
    if (/\/(machine-learning|operating-system|computer-architecture|probability-and-statistics)\/?$/.test(path)) return 'subject';
    return 'home';
  }

  function ensureMainTarget() {
    const main = document.querySelector('main') || document.querySelector('article') || document.querySelector('section') || document.body;
    if (!main.id) main.id = 'main-content';
    return main;
  }

  function addSkipAndProgress() {
    const main = ensureMainTarget();
    if (!document.querySelector('.los-skip-link, .sn-skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'los-skip-link';
      skip.href = `#${main.id}`;
      skip.textContent = 'Skip to study content';
      document.body.prepend(skip);
    }
    if (!document.querySelector('.los-progress, .sn-progress')) {
      const progress = document.createElement('div');
      progress.className = 'los-progress';
      progress.setAttribute('aria-hidden', 'true');
      progress.innerHTML = '<div class="los-progress__bar"></div>';
      document.body.append(progress);
      const bar = progress.firstElementChild;
      const update = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        const pct = Math.max(0, Math.min(100, (scrollY / max) * 100));
        bar.style.width = `${pct}%`;
        const txt = document.getElementById('progress-text');
        if (txt) txt.textContent = `${Math.round(pct)}%`;
      };
      update();
      addEventListener('scroll', update, { passive: true });
      addEventListener('resize', update, { passive: true });
    }
  }

  function slugify(text, idx) {
    const slug = text.trim().toLowerCase().replace(/[\s\u00a0]+/g, '-').replace(/[^\w\-가-힣]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return slug || `study-section-${idx}`;
  }

  function buildNoteShell() {
    if (pageType() !== 'note') return;
    document.body.classList.add('los-note-page');
    const main = ensureMainTarget();
    const headings = [...main.querySelectorAll('h2, h3')].filter(h => h.textContent.trim().length > 0).slice(0, 36);
    headings.forEach((h, idx) => { if (!h.id) h.id = slugify(h.textContent, idx); });

    if (headings.length && !document.querySelector('.los-auto-toc')) {
      const toc = document.createElement('aside');
      toc.className = 'los-auto-toc';
      toc.setAttribute('aria-label', 'Lecture section navigation');
      toc.innerHTML = `<div class="los-panel-title">Concept Map</div>${headings.map(h => `<a class="${h.tagName.toLowerCase()}" href="#${encodeURIComponent(h.id)}">${h.textContent.trim()}</a>`).join('')}`;
      document.body.append(toc);
    }

    if (!document.querySelector('.los-study-rail')) {
      const rail = document.createElement('aside');
      rail.className = 'los-study-rail';
      rail.setAttribute('aria-label', 'Study controls');
      rail.innerHTML = `
        <div class="los-panel-title">Study Cockpit</div>
        <div class="los-rail-card"><div class="los-rail-label">Mode</div><div class="los-rail-value">Read → Understand → Review</div></div>
        <div class="los-rail-card"><div class="los-rail-label">Current section</div><div class="los-rail-value" data-los-current>Opening</div></div>
        <div class="los-rail-card">
          <div class="los-rail-label">Reader controls</div>
          <div class="los-rail-actions">
            <button type="button" data-los-ui="focus" aria-label="Toggle focus mode">Focus</button>
            <button type="button" data-los-ui="wide" aria-label="Toggle wide reading width">Wide</button>
            <button type="button" data-los-ui="small" aria-label="Decrease text size">A−</button>
            <button type="button" data-los-ui="large" aria-label="Increase text size">A+</button>
          </div>
        </div>`;
      document.body.append(rail);
    }

    if (!document.querySelector('.los-mobile-dock')) {
      const dock = document.createElement('nav');
      dock.className = 'los-mobile-dock';
      dock.setAttribute('aria-label', 'Mobile study controls');
      dock.innerHTML = `
        <button type="button" data-los-ui="focus" aria-label="Toggle focus mode">◎</button>
        <button type="button" data-los-ui="wide" aria-label="Toggle wide reading width">↔</button>
        <button type="button" data-los-theme-toggle aria-label="Toggle theme">◐</button>
        <button type="button" data-los-ui="large" aria-label="Increase text size">A+</button>
        <a href="#" aria-label="Back to top">↑</a>`;
      document.body.append(dock);
    }
  }

  function loadUiState() {
    const saved = JSON.parse(localStorage.getItem(UI_KEY) || '{}');
    root.classList.toggle('los-focus-mode', !!saved.focus);
    root.classList.toggle('los-wide-mode', !!saved.wide);
    root.classList.toggle('los-large-text', saved.text === 'large');
    root.classList.toggle('los-small-text', saved.text === 'small');
    syncUiState();
  }

  function saveUiState() {
    localStorage.setItem(UI_KEY, JSON.stringify({
      focus: root.classList.contains('los-focus-mode'),
      wide: root.classList.contains('los-wide-mode'),
      text: root.classList.contains('los-large-text') ? 'large' : root.classList.contains('los-small-text') ? 'small' : 'normal'
    }));
  }

  function syncUiState() {
    document.querySelectorAll('[data-los-ui="focus"]').forEach(b => b.setAttribute('aria-pressed', root.classList.contains('los-focus-mode')));
    document.querySelectorAll('[data-los-ui="wide"]').forEach(b => b.setAttribute('aria-pressed', root.classList.contains('los-wide-mode')));
  }

  function bindUiControls() {
    document.addEventListener('click', (event) => {
      const top = event.target.closest('.los-mobile-dock a[href="#"]');
      if (top) { event.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
      const btn = event.target.closest('[data-los-ui]');
      if (!btn) return;
      const action = btn.dataset.losUi;
      if (action === 'focus') root.classList.toggle('los-focus-mode');
      if (action === 'wide') root.classList.toggle('los-wide-mode');
      if (action === 'large') { root.classList.toggle('los-large-text'); root.classList.remove('los-small-text'); }
      if (action === 'small') { root.classList.toggle('los-small-text'); root.classList.remove('los-large-text'); }
      saveUiState(); syncUiState();
    });
  }

  function activeSectionTracking() {
    const sections = [...document.querySelectorAll('main h2[id], main h3[id]')];
    if (!sections.length || !('IntersectionObserver' in window)) return;
    const links = [...document.querySelectorAll('.los-auto-toc a')];
    const current = document.querySelector('[data-los-current]');
    const byId = new Map(links.map(a => [decodeURIComponent(a.getAttribute('href').slice(1)), a]));
    const setActive = (id, text) => {
      links.forEach(a => a.removeAttribute('aria-current'));
      const a = byId.get(id);
      if (a) a.setAttribute('aria-current', 'true');
      if (current) current.textContent = text;
    };
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id, visible.target.textContent.trim());
    }, { rootMargin: '-16% 0px -68% 0px', threshold: [0.02, .12, .28] });
    sections.forEach(s => io.observe(s));
  }

  function pointerGlow() {
    if (reduce) return;
    let raf = 0;
    addEventListener('pointermove', (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--los-x', `${event.clientX}px`);
        root.style.setProperty('--los-y', `${event.clientY}px`);
        raf = 0;
      });
    }, { passive: true });
  }

  function reveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    const els = [...document.querySelectorAll('main > section, article, aside, .glass-card, .glass-strong')].filter(el => !el.classList.contains('sn-reveal'));
    els.forEach(el => el.classList.add('los-reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('los-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .05, rootMargin: '0px 0px -5% 0px' });
    els.forEach((el, idx) => { el.style.transitionDelay = `${Math.min(idx * 24, 168)}ms`; io.observe(el); });
    setTimeout(() => els.forEach(el => el.classList.add('los-visible')), 1200);
  }

  document.body.classList.add(`los-${pageType()}-page`);
  initTheme();
  addSkipAndProgress();
  buildNoteShell();
  loadUiState();
  bindUiControls();
  activeSectionTracking();
  pointerGlow();
  reveal();
})();
