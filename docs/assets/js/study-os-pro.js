(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const path = location.pathname.replace(/\/$/, '');
  const isNote = /\/html\//.test(location.pathname);
  const isHome = /\/study-notes\/?$/.test(location.pathname) || /\/docs\/?$/.test(location.pathname) || path.endsWith('/study-notes') || path === '';
  const isSubject = !isNote && !isHome;
  const accentMap = [
    ['computer-architecture', '#3b82f6'],
    ['operating-system', '#8b5cf6'],
    ['probability-and-statistics', '#10b981'],
    ['machine-learning', '#f43f5e']
  ];
  const accent = (accentMap.find(([key]) => location.pathname.includes(key)) || [null, '#2563eb'])[1];
  body.style.setProperty('--accent', accent);
  body.classList.add(isNote ? 'sop-note-page' : isSubject ? 'sop-subject-page' : 'sop-home-page');

  function getPrefix(){
    const parts = location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('study-notes');
    const depth = idx >= 0 ? parts.length - idx - 1 - (location.pathname.endsWith('/') ? 0 : 1) : 0;
    return depth <= 0 ? '' : '../'.repeat(depth);
  }
  const prefix = getPrefix();

  function icon(name){
    const attrs = 'fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const paths = {
      sun:'<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>',
      moon:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
      search:'<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.35-4.35"></path>',
      top:'<path d="m18 15-6-6-6 6"></path>',
      home:'<path d="m3 10.5 9-7 9 7"></path><path d="M5 10v10h14V10"></path>',
      focus:'<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"></path>',
      wide:'<path d="M3 5h18v14H3z"></path><path d="M9 5v14"></path><path d="M15 5v14"></path>'
    };
    return `<svg ${attrs}>${paths[name] || paths.home}</svg>`;
  }

  function applyTheme(mode){
    const dark = mode === 'dark';
    root.classList.toggle('dark', dark);
    root.dataset.theme = mode;
    localStorage.setItem('study-notes-theme', mode);
    document.querySelectorAll('[data-sop-theme]').forEach(btn => {
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.innerHTML = icon(dark ? 'sun' : 'moon');
    });
  }
  const saved = localStorage.getItem('study-notes-theme');
  applyTheme(saved || (root.classList.contains('dark') ? 'dark' : 'light'));
  if (!saved) applyTheme('light');
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#theme-toggle, [data-sop-theme], .los-theme-toggle, [data-los-theme-toggle]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    applyTheme(root.classList.contains('dark') ? 'light' : 'dark');
  }, true);

  if (!document.querySelector('.sop-topbar')) {
    const topbar = document.createElement('nav');
    topbar.className = 'sop-topbar';
    topbar.innerHTML = `<div class="sop-topbar-inner">
      <a class="sop-brand" href="${prefix}">
        <span class="sop-logo">SN</span><span class="sop-brand-text"><span class="sop-brand-title">Study Notes</span><span class="sop-brand-kicker">Soft Study</span></span>
      </a>
      <div class="sop-nav" aria-label="Main navigation">
        <a href="${prefix}computer-architecture/">Architecture</a>
        <a href="${prefix}operating-system/">OS</a>
        <a href="${prefix}probability-and-statistics/">Stats</a>
        <a href="${prefix}machine-learning/">ML</a>
      </div>
      <button class="sop-icon-btn" type="button" data-sop-theme aria-label="Switch theme">${icon(root.classList.contains('dark') ? 'sun' : 'moon')}</button>
    </div>`;
    body.prepend(topbar);
  }

  function initSearch(){
    const input = document.querySelector('[data-sop-search]');
    if (!input) return;
    const cards = [...document.querySelectorAll('[data-sop-search-item]')];
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      cards.forEach(card => {
        const hay = (card.textContent || '').toLowerCase();
        card.style.display = !q || hay.includes(q) ? '' : 'none';
      });
    });
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); }
    });
  }

  function initNotePage(){
    if (!isNote) return;
    const headings = [...document.querySelectorAll('main h2[id], main h3[id], main section[id] h2, main section[id] h3')]
      .map(h => {
        const section = h.closest('section[id]');
        const id = h.id || section?.id;
        if (!id) return null;
        return {id, text: h.textContent.trim().replace(/\s+/g,' ').slice(0,70)};
      }).filter(Boolean);
    const seen = new Set();
    const unique = headings.filter(h => !seen.has(h.id) && seen.add(h.id)).slice(0,18);
    if (unique.length && !document.querySelector('.sop-study-rail')) {
      const rail = document.createElement('aside');
      rail.className = 'sop-study-rail sop-glass';
      rail.innerHTML = `<h2>Concept Map</h2>${unique.map(h=>`<a href="#${CSS.escape(h.id)}">${h.text}</a>`).join('')}`;
      body.appendChild(rail);
    }
    if (!document.querySelector('.sop-cockpit')) {
      const cockpit = document.createElement('aside');
      cockpit.className = 'sop-cockpit sop-glass';
      cockpit.innerHTML = `<h2>Study Cockpit</h2>
        <div style="font-weight:900;font-size:20px;letter-spacing:-.04em">Soft Reading Mode</div>
        <p style="color:var(--sop-muted);font-size:13px;line-height:1.55;margin:8px 0 0">본문 개념은 그대로 두고, 읽기 폭·진도·목차를 CNN 노트처럼 차분하게 정리했어.</p>
        <div class="sop-progress-track"><div class="sop-progress-fill"></div></div>
        <div style="display:flex;justify-content:space-between;color:var(--sop-faint);font:800 11px var(--sop-mono)"><span>PROGRESS</span><span data-sop-progress>0%</span></div>
        <div class="sop-tools"><button data-sop-focus>Focus</button><button data-sop-wide>Wide</button><button data-sop-small>A−</button><button data-sop-large>A+</button></div>`;
      body.appendChild(cockpit);
    }
    if (!document.querySelector('.sop-bottom-dock')) {
      const dock = document.createElement('div');
      dock.className = 'sop-bottom-dock sop-glass';
      dock.innerHTML = `<a href="${prefix}" aria-label="Home">${icon('home')}</a><button type="button" data-sop-focus>${icon('focus')}</button><button type="button" data-sop-wide>${icon('wide')}</button><button type="button" data-sop-theme>${icon(root.classList.contains('dark')?'sun':'moon')}</button><button type="button" data-sop-top>${icon('top')}</button>`;
      body.appendChild(dock);
    }
    const fill = document.querySelector('.sop-progress-fill');
    const label = document.querySelector('[data-sop-progress]');
    function onScroll(){
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const pct = Math.round((scrollY / max) * 100);
      if (fill) fill.style.width = pct + '%';
      if (label) label.textContent = pct + '%';
    }
    addEventListener('scroll', onScroll, {passive:true}); onScroll();
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-sop-top]')) scrollTo({top:0,behavior:'smooth'});
      if (e.target.closest('[data-sop-focus]')) body.classList.toggle('sop-focus-mode');
      if (e.target.closest('[data-sop-wide]')) body.classList.toggle('sop-wide-mode');
      if (e.target.closest('[data-sop-small]')) document.querySelector('main')?.style.setProperty('font-size','0.94em');
      if (e.target.closest('[data-sop-large]')) document.querySelector('main')?.style.setProperty('font-size','1.06em');
    });
    const links = [...document.querySelectorAll('.sop-study-rail a')];
    if ('IntersectionObserver' in window && links.length) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(en => { if(en.isIntersecting){ links.forEach(a=>a.classList.toggle('active', a.getAttribute('href') === '#'+en.target.id)); } });
      }, {rootMargin:'-25% 0px -65% 0px', threshold:0});
      unique.forEach(h => { const el = document.getElementById(h.id); if(el) obs.observe(el); });
    }
  }
  initSearch();
  initNotePage();
})();
