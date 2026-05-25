(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const path = location.pathname.replace(/\/$/, '');
  const isNote = /\/html\//.test(location.pathname);
  const isHome = /\/study-notes\/?$/.test(location.pathname) || /\/docs\/?$/.test(location.pathname) || path.endsWith('/study-notes') || path === '';
  const isSubject = !isNote && !isHome;
  const accentMap = [
    ['computer-architecture', '#5c7b93'],
    ['operating-system', '#7c6b8c'],
    ['probability-and-statistics', '#6f8f72'],
    ['machine-learning', '#b5735f']
  ];
  const accent = (accentMap.find(([key]) => location.pathname.includes(key)) || [null, '#2563eb'])[1];
  body.style.setProperty('--accent', accent);
  body.classList.add(isNote ? 'sop-note-page' : isSubject ? 'sop-subject-page' : 'sop-home-page');

  function getPrefix(){
    const parts = location.pathname.split('/').filter(Boolean);
    const subjects = ['computer-architecture','operating-system','probability-and-statistics','machine-learning'];
    const idx = parts.lastIndexOf('study-notes') >= 0 ? parts.lastIndexOf('study-notes') : parts.lastIndexOf('docs');
    const subjectIdx = parts.findIndex(part => subjects.includes(part));
    const depth = subjectIdx >= 0
      ? parts.length - subjectIdx - (location.pathname.endsWith('/') ? 0 : 1)
      : idx >= 0
        ? parts.length - idx - 1 - (location.pathname.endsWith('/') ? 0 : 1)
        : 0;
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
      const isSidebarBtn = btn.closest('.sop-note-toc') || btn.classList.contains('btn');
      if (isSidebarBtn) {
        btn.innerHTML = icon(dark ? 'sun' : 'moon') + ' 테마 전환';
      } else {
        btn.innerHTML = icon(dark ? 'sun' : 'moon');
      }
    });
  }
  const saved = localStorage.getItem('study-notes-theme');
  applyTheme(saved || (root.classList.contains('dark') ? 'dark' : 'light'));
  if (!saved) applyTheme('light');
  document.addEventListener('click', (e) => {
    const printBtn = e.target.closest('[data-sop-print]');
    if (!printBtn) return;
    e.preventDefault();
    window.print();
  });

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
      <a class="sop-brand" href="${prefix}" aria-label="가재 Study Notes 홈으로 이동">
        <span class="sop-logo" aria-hidden="true">🦞</span><span class="sop-brand-text"><span class="sop-brand-title">가재 Masterclass Notes</span><span class="sop-brand-kicker">Study Notes</span></span>
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

  function markActiveNav(){
    const normalize = (path) => {
      let value = path.replace(/\/$/, '') || '/';
      value = value.replace(/^\/study-notes(?=\/|$)/, '') || '/';
      return value;
    };
    const here = normalize(location.pathname);
    document.querySelectorAll('.sop-nav a').forEach(a => {
      a.classList.remove('is-active');
      a.removeAttribute('aria-current');
      const url = new URL(a.getAttribute('href'), location.href);
      const target = normalize(url.pathname);
      const active = target !== '/' && (here === target || here.startsWith(target + '/'));
      if (active) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  function initSearch(){
    const input = document.querySelector('[data-sop-search]');
    if (!input) return;
    const cards = [...document.querySelectorAll('[data-sop-search-item]')];
    let empty = document.querySelector('[data-sop-empty]');
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'sop-search-empty';
      empty.dataset.sopEmpty = 'true';
      empty.setAttribute('role', 'status');
      empty.setAttribute('aria-live', 'polite');
      empty.hidden = true;
      const target = document.querySelector('.sop-note-list, .sop-subject-notes, .sop-grid') || input.closest('.sop-shell') || document.body;
      target.insertAdjacentElement(target.matches('.sop-note-list, .sop-subject-notes, .sop-grid') ? 'afterend' : 'beforeend', empty);
    }
    if (!cards.length) {
      input.disabled = true;
      input.placeholder = '아직 검색할 노트가 없습니다';
      input.closest('.sop-search')?.classList.add('is-disabled');
      empty.textContent = '아직 검색할 노트가 없습니다. 새 노트가 추가되면 여기서 바로 검색할 수 있어요.';
      empty.hidden = false;
      return;
    }
    const update = () => {
      const q = input.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const hay = (card.textContent || '').toLowerCase();
        const show = !q || hay.includes(q);
        card.style.display = show ? '' : 'none';
        if (show) visible += 1;
      });
      empty.hidden = !q || visible > 0;
      if (!empty.hidden) empty.textContent = `검색 결과가 없습니다: “${input.value.trim()}”. 다른 키워드로 다시 찾아보세요.`;
    };
    input.addEventListener('input', update);
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); }
    });
  }

  function initNotePage(){
    if (!isNote) return;
    body.classList.add('sop-note-cnn-style');
    const main = document.querySelector('main');
    if (!main) return;
    // CNN single-page note style: in-flow sticky TOC, no fixed side rails/cockpit.
    document.querySelectorAll('.sop-study-rail,.sop-cockpit,.sop-bottom-dock').forEach(el => el.remove());
    if (!document.querySelector('.sop-note-toc')) {
      const headings = [...main.querySelectorAll('section[id] h2, section[id] h3, h2[id], h3[id]')]
        .map(h => {
          const section = h.closest('section[id]');
          const id = h.id || section?.id;
          if (!id) return null;
          return { id, text: h.textContent.trim().replace(/\s+/g,' ').slice(0,64) };
        }).filter(Boolean);
      const seen = new Set();
      const unique = headings.filter(h => !seen.has(h.id) && seen.add(h.id)).slice(0,14);
      if (unique.length) {
        const toc = document.createElement('nav');
        toc.className = 'sop-note-toc';
        toc.setAttribute('aria-label', 'Table of contents');
        toc.innerHTML = `<div class="sop-note-brand">🦞 ${document.title.split('·')[0].trim() || 'Masterclass Note'}</div><div class="sop-note-actions"><button class="btn" type="button" data-sop-theme>테마 전환</button><button class="btn" type="button" data-sop-print>PDF 저장</button></div><div class="sop-note-sourcebox">개념 → 수식 → 직관 → 예제 → 시험 함정 순서로 읽어라. 암기보다 “왜 이 정의가 필요한가”를 먼저 잡는 것이 목표다.</div><strong>학습 목차 목록</strong><div class="sop-note-toc-links">${unique.map(h=>`<a href="#${CSS.escape(h.id)}">${h.text}</a>`).join('')}</div>`;
        const firstSection = main.querySelector(':scope > section');
        if (firstSection && firstSection.nextSibling) main.insertBefore(toc, firstSection.nextSibling);
        else main.prepend(toc);
      }
    }
    const finalToc = document.querySelector('.sop-note-toc');
    if (finalToc) {
      const rowCount = main.children.length;
      finalToc.style.setProperty('grid-row', `1 / span ${rowCount + 1}`, 'important');
    }
  }
  
  // --- Ebbinghaus Spaced Repetition System ---
  const STORAGE_KEY = 'study-notes-reviews';
  const INTERVALS = {
    0: 0,
    1: 24 * 60 * 60 * 1000,       // Stage 1 -> 2: 1 Day
    2: 3 * 24 * 60 * 60 * 1000,   // Stage 2 -> 3: 3 Days
    3: 7 * 24 * 60 * 60 * 1000,   // Stage 3 -> 4: 7 Days
    4: 14 * 24 * 60 * 60 * 1000,  // Stage 4 -> 5: 14 Days
    5: 30 * 24 * 60 * 60 * 1000,  // Stage 5 -> 6: 30 Days
  };

  function getAllReviews() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveAllReviews(reviews) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  }

  function getNoteKey(hrefOrPath) {
    if (!hrefOrPath) return null;
    let url;
    try {
      url = new URL(hrefOrPath, location.href).pathname;
    } catch(e) {
      url = hrefOrPath;
    }
    url = url.replace(/\/index\.html$/, '').replace(/^\/|\/$/g, '');
    const subjects = ['computer-architecture', 'operating-system', 'probability-and-statistics', 'machine-learning'];
    for (const sub of subjects) {
      const idx = url.indexOf(sub + '/html/');
      if (idx !== -1) {
        return url.substring(idx);
      }
    }
    return null;
  }

  function getNoteState(noteKey) {
    const reviews = getAllReviews();
    return reviews[noteKey] || { stage: 0, lastReviewed: null, nextDue: null, history: [] };
  }

  function updateNoteState(noteKey, stage) {
    const reviews = getAllReviews();
    const now = Date.now();
    const state = reviews[noteKey] || { stage: 0, lastReviewed: null, nextDue: null, history: [] };
    
    state.stage = stage;
    state.lastReviewed = now;
    if (stage >= 6) {
      state.nextDue = null; // Mastered
    } else {
      state.nextDue = now + (INTERVALS[stage] || 0);
    }
    if (!state.history) state.history = [];
    state.history.push(now);

    reviews[noteKey] = state;
    saveAllReviews(reviews);
    return state;
  }

  function resetNoteState(noteKey) {
    const reviews = getAllReviews();
    delete reviews[noteKey];
    saveAllReviews(reviews);
    return { stage: 0, lastReviewed: null, nextDue: null, history: [] };
  }

  function getReviewStatus(state) {
    if (!state || state.stage === 0) {
      return { code: 'NOT_STARTED', text: '미시작', class: 'sop-badge-not-started' };
    }
    if (state.stage >= 6) {
      return { code: 'MASTERED', text: '완료 👑', class: 'sop-badge-mastered' };
    }
    const now = Date.now();
    if (now >= state.nextDue) {
      const daysOverdue = Math.floor((now - state.nextDue) / (24 * 60 * 60 * 1000));
      if (daysOverdue >= 3) {
        return { code: 'OVERDUE', text: `복습 지연 ⚠️`, class: 'sop-badge-overdue' };
      }
      return { code: 'DUE', text: '오늘 복습 🔔', class: 'sop-badge-due' };
    } else {
      const diff = state.nextDue - now;
      const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
      return { code: 'SCHEDULED', text: `D-${days}`, class: 'sop-badge-scheduled' };
    }
  }

  function updateBadgesInDOM() {
    const items = document.querySelectorAll('.sop-note-item');
    items.forEach(item => {
      const href = item.getAttribute('href');
      const noteKey = getNoteKey(href);
      if (!noteKey) return;

      const state = getNoteState(noteKey);
      const status = getReviewStatus(state);

      const oldBadge = item.querySelector('.sop-review-badge');
      if (oldBadge) oldBadge.remove();

      const h3 = item.querySelector('h3');
      if (h3) {
        h3.style.display = 'flex';
        h3.style.alignItems = 'center';
        h3.style.gap = '8px';
        h3.style.flexWrap = 'wrap';
        
        const badge = document.createElement('span');
        badge.className = `sop-review-badge ${status.class}`;
        badge.textContent = status.text;
        h3.appendChild(badge);
      }
    });
  }

  function injectHomepageDashboard() {
    const resolvedIsHome = isHome || location.pathname === '/' || location.pathname.endsWith('/index.html') && !location.pathname.includes('/html/') && !['computer-architecture','operating-system','probability-and-statistics','machine-learning'].some(sub => location.pathname.includes(sub));
    if (!resolvedIsHome) return;
    const heroSide = document.querySelector('.sop-hero-side');
    if (!heroSide) return;

    let dashboard = document.querySelector('.sop-review-dashboard');
    if (dashboard) dashboard.remove();

    dashboard = document.createElement('div');
    dashboard.className = 'sop-panel sop-review-dashboard sop-glass';

    const noteItems = [...document.querySelectorAll('.sop-note-item')];
    const dueNotes = [];

    noteItems.forEach(item => {
      const href = item.getAttribute('href');
      const noteKey = getNoteKey(href);
      if (!noteKey) return;
      
      const state = getNoteState(noteKey);
      const status = getReviewStatus(state);
      const title = item.querySelector('h3').textContent.split('\n')[0].replace(/\s{2,}/g, ' ').trim();
      
      if (status.code === 'DUE' || status.code === 'OVERDUE' || state.stage === 0) {
        dueNotes.push({
          key: noteKey,
          href: href,
          title: title,
          status: status,
          state: state
        });
      }
    });

    const dueCount = dueNotes.length;

    let listHtml = '';
    if (dueCount === 0) {
      listHtml = `
        <div class="sop-review-dashboard-empty">
          ✨ <b>오늘 복습할 노트가 없습니다!</b><br>
          완벽하게 최신 상태를 유지하고 있어요. 새 노트를 공부하거나 복습할 주기를 기다려보세요!
        </div>
      `;
    } else {
      listHtml = `
        <div class="sop-review-dashboard-list">
          ${dueNotes.map(note => `
            <div class="sop-review-dashboard-item">
              <span class="title" title="${note.title}">${note.title}</span>
              <span class="sop-review-badge ${note.status.class}">${note.status.text}</span>
              <a href="${note.href}" class="action-btn" title="복습 시작">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </a>
            </div>
          `).join('')}
        </div>
      `;
    }

    dashboard.innerHTML = `
      <h2>
        오늘의 복습 흐름
        <span class="sop-review-dashboard-count">${dueCount}개 대기</span>
      </h2>
      ${listHtml}
    `;

    heroSide.appendChild(dashboard);
  }

  function injectReviewWidget() {
    if (!isNote) return;
    const noteKey = getNoteKey(location.pathname);
    if (!noteKey) return;

    let state = getNoteState(noteKey);
    let status = getReviewStatus(state);

    const oldWidget = document.getElementById('sop-review-widget');
    if (oldWidget) oldWidget.remove();

    const widget = document.createElement('div');
    widget.className = 'sop-review-widget';
    widget.id = 'sop-review-widget';
    
    const flash = document.createElement('div');
    flash.className = 'sop-level-up-flash';
    widget.appendChild(flash);

    const collapsed = document.createElement('div');
    collapsed.className = 'sop-review-widget-collapsed';
    collapsed.innerHTML = `
      <span class="sop-review-widget-collapsed-dot"></span>
      <span class="sop-review-widget-collapsed-text">복습: ${status.text}</span>
    `;
    widget.appendChild(collapsed);

    const expanded = document.createElement('div');
    expanded.className = 'sop-review-widget-expanded sop-glass';
    widget.appendChild(expanded);
    document.body.appendChild(widget);

    function renderExpanded() {
      state = getNoteState(noteKey);
      status = getReviewStatus(state);

      let stageDotsHtml = '';
      for (let i = 1; i <= 5; i++) {
        let dotClass = '';
        if (state.stage >= i) {
          dotClass = 'is-completed';
        } else if (state.stage === i - 1) {
          dotClass = 'is-active';
        }
        stageDotsHtml += `<div class="sop-review-stage-dot ${dotClass}" title="Stage ${i}">${i}</div>`;
      }
      
      const lineFillPercent = Math.min(100, Math.max(0, ((state.stage) / 5) * 100));

      let infoText = '';
      let actionText = '';
      let showAction = true;

      if (state.stage === 0) {
        infoText = '아직 이 노트를 복습하지 않았습니다. 첫 번째 복습 주기를 시작해 보세요.';
        actionText = '오늘 복습 완료 (1일 뒤 예약)';
      } else if (state.stage >= 6) {
        infoText = '🎉 <b>축하합니다!</b> 모든 복습 주기를 완료하고 개념을 완전히 마스터했습니다. 뇌에 장기 기억으로 고착되었습니다!';
        showAction = false;
      } else {
        const nextDateStr = new Date(state.nextDue).toLocaleDateString('ko-KR', {
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        if (status.code === 'DUE' || status.code === 'OVERDUE') {
          infoText = `현재 <b>Stage ${state.stage}</b> 단계입니다. 복습할 시간이 되었습니다!`;
          actionText = `오늘 복습 완료 (다음 단계 예약)`;
        } else {
          infoText = `현재 <b>Stage ${state.stage}</b> 단계 복습 완료 상태입니다.<br>다음 복습 예정일: <b>${nextDateStr}</b>`;
          actionText = `조기 복습 완료 (다음 단계 예약)`;
        }
      }

      expanded.innerHTML = `
        <div class="sop-review-widget-header">
          <h3>스마트 복습 매니저</h3>
          <button class="sop-review-widget-close" aria-label="Collapse scheduler">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="sop-review-stages">
          <div class="sop-review-stages-line">
            <div class="sop-review-stages-line-fill" style="width: ${lineFillPercent}%"></div>
          </div>
          ${stageDotsHtml}
        </div>
        <div class="sop-review-widget-info">
          ${infoText}
        </div>
        ${showAction ? `<button class="sop-review-widget-action">${actionText}</button>` : ''}
        <div class="sop-review-widget-secondary">
          <span>레벨: ${state.stage === 6 ? '마스터 👑' : `Stage ${state.stage}/5`}</span>
          <button class="sop-review-widget-reset-btn">초기화</button>
        </div>
      `;

      expanded.querySelector('.sop-review-widget-close').addEventListener('click', (e) => {
        e.stopPropagation();
        widget.classList.remove('is-open');
      });

      if (showAction) {
        expanded.querySelector('.sop-review-widget-action').addEventListener('click', (e) => {
          e.stopPropagation();
          
          flash.classList.remove('animate');
          void flash.offsetWidth; 
          flash.classList.add('animate');
          
          const nextStage = state.stage + 1;
          updateNoteState(noteKey, nextStage);
          
          renderExpanded();
          updateCollapsedText();
          updateBadgesInDOM();
        });
      }

      expanded.querySelector('.sop-review-widget-reset-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('이 노트의 복습 진도를 정말 초기화하시겠습니까?')) {
          resetNoteState(noteKey);
          renderExpanded();
          updateCollapsedText();
          updateBadgesInDOM();
        }
      });
    }

    function updateCollapsedText() {
      state = getNoteState(noteKey);
      status = getReviewStatus(state);
      collapsed.querySelector('.sop-review-widget-collapsed-text').textContent = `복습: ${status.text}`;
      
      const dot = collapsed.querySelector('.sop-review-widget-collapsed-dot');
      if (status.code === 'DUE') {
        dot.style.background = 'var(--sop-amber)';
      } else if (status.code === 'OVERDUE') {
        dot.style.background = 'var(--sop-rose)';
      } else if (status.code === 'MASTERED') {
        dot.style.background = 'var(--sop-violet)';
      } else if (status.code === 'SCHEDULED') {
        dot.style.background = 'var(--accent, var(--sop-primary))';
      } else {
        dot.style.background = 'var(--sop-faint)';
      }
    }

    collapsed.addEventListener('click', (e) => {
      e.stopPropagation();
      renderExpanded();
      widget.classList.add('is-open');
    });

    renderExpanded();
    updateCollapsedText();
  }

  markActiveNav();
  initSearch();
  initNotePage();
  
  // Initialize Ebbinghaus Spaced Repetition features
  updateBadgesInDOM();
  injectHomepageDashboard();
  injectReviewWidget();
})();

