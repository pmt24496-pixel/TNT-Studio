// TNT Studio — App Controller
// Pure JS, no framework. Manages UI state and wires all components.

window.TNTApp = (function () {

  // ── State ─────────────────────────────────────────────────────────────
  const state = {
    currentPage: 'home',
    selectedPreset: null,
    currentStory: null,
    currentProject: null,
    generationOptions: {
      title: '', protagonist: '', antagonist: '',
      setting: '', episodeCount: 8, tone: 'auto'
    }
  };

  // ── Preset color map ──────────────────────────────────────────────────
  const PRESET_COLORS = {
    doanhTraiHanQuoc:    '#4a9eff',
    quanDoiTraDuaHanQuoc:'#e8304a',
    haoMonLatMatNhatBan: '#9b59b6',
    giaDinhCamXucNhatBan:'#ff6b9d',
    japanShockSerialized:'#00d4aa',
  };

  // ── Toast ──────────────────────────────────────────────────────────────
  function toast(msg, type, title) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'default');
    el.innerHTML = (title ? '<div class="toast__title">' + escHtml(title) + '</div>' : '') +
                   '<div class="toast__msg">' + escHtml(msg) + '</div>';
    container.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Navigation ─────────────────────────────────────────────────────────
  function navigate(page) {
    state.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    document.querySelectorAll('.page-section').forEach(el => {
      el.classList.toggle('hidden', el.id !== 'page-' + page);
    });
    // Re-render dynamic pages
    if (page === 'library') renderLibrary();
    if (page === 'home')    renderStats();
  }

  // ── Render: Home / Dashboard ──────────────────────────────────────────
  function renderStats() {
    const stats = window.ProjectManager.getStats();
    const el = document.getElementById('stats-container');
    if (!el) return;
    el.innerHTML = [
      statCard('Dự án', stats.totalProjects, 'Tổng số câu chuyện'),
      statCard('Tập phim', stats.totalEpisodes, 'Đã tạo ra'),
      statCard(fmtNum(stats.totalWords), '', 'Tổng số từ'),
      statCard('5', '', 'Preset thể loại'),
    ].join('');
  }

  function statCard(val, sub, label) {
    return '<div class="stat-card"><div class="stat-card__label">' + escHtml(label) + '</div>' +
           '<div class="stat-card__value">' + escHtml(String(val)) + '</div>' +
           (sub ? '<div class="stat-card__sub">' + escHtml(String(sub)) + '</div>' : '') + '</div>';
  }

  function fmtNum(n) {
    if (n >= 1000) return (n/1000).toFixed(1) + 'k';
    return String(n);
  }

  // ── Render: Preset Selector ───────────────────────────────────────────
  function renderPresets() {
    const container = document.getElementById('preset-cards');
    if (!container || !window.DNA_PRESETS) return;
    container.innerHTML = '';
    Object.values(window.DNA_PRESETS).forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-card ' + preset.id;
      card.dataset.id = preset.id;
      card.innerHTML =
        '<div class="preset-card__icon">' + preset.emoji + '</div>' +
        '<div class="preset-card__name">' + escHtml(preset.name) + '</div>' +
        '<div class="preset-card__desc">' + escHtml(preset.shortDesc) + '</div>';
      card.addEventListener('click', () => selectPreset(preset.id));
      container.appendChild(card);
    });
  }

  function selectPreset(id) {
    state.selectedPreset = id;
    document.querySelectorAll('.preset-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.id === id);
    });
    const preset = window.DNA_PRESETS[id];
    // Update DNA panel
    const dnaPanel = document.getElementById('dna-panel');
    if (dnaPanel && preset) {
      dnaPanel.classList.remove('hidden');
      dnaPanel.querySelector('#dna-title').textContent = preset.emoji + ' ' + preset.name;
      dnaPanel.querySelector('#dna-core').innerHTML =
        preset.coreDNA.map(d => '<li>• ' + escHtml(d) + '</li>').join('');
      dnaPanel.querySelector('#dna-style').textContent = preset.dialogueStyle;
      dnaPanel.querySelector('#dna-hooks').innerHTML =
        preset.hooks.map(h => '<li class="mb-1">❝ ' + escHtml(h) + ' ❞</li>').join('');
    }
    // Enable generate button
    const btn = document.getElementById('btn-generate');
    if (btn) btn.disabled = false;
  }

  // ── Render: Story Output ──────────────────────────────────────────────
  function renderStory(story) {
    state.currentStory = story;
    const preset = window.DNA_PRESETS[story.presetId];
    const color = PRESET_COLORS[story.presetId] || 'var(--gold)';

    const panel = document.getElementById('output-panel');
    if (!panel) return;
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    panel.querySelector('#output-title').textContent = story.title;
    panel.querySelector('#output-badge').textContent = preset ? preset.emoji + ' ' + preset.name : story.presetId;
    panel.querySelector('#output-badge').style.color = color;

    // Synopsis
    panel.querySelector('#output-synopsis').textContent = story.synopsis;

    // Themes
    const themesEl = panel.querySelector('#output-themes');
    if (themesEl) {
      themesEl.innerHTML = (story.themes || []).map(t =>
        '<span class="badge badge-gold">' + escHtml(t.split(' ').slice(0,5).join(' ')) + '</span>'
      ).join('');
    }

    // Characters
    const charsEl = panel.querySelector('#output-characters');
    charsEl.innerHTML = (story.characters || []).map(c => charCard(c)).join('');

    // Episodes
    const epCountEl = panel.querySelector('#ep-count');
    if (epCountEl) epCountEl.textContent = story.episodes.length;
    const epsEl = panel.querySelector('#output-episodes');
    epsEl.innerHTML = (story.episodes || []).map(ep => episodeCard(ep, color)).join('');
  }

  function charCard(c) {
    const traits = (c.traits || []).map(t => '<span class="trait-tag">' + escHtml(t) + '</span>').join('');
    return '<div class="character-card">' +
      '<div class="character-card__role">' + escHtml(c.role || '') + '</div>' +
      '<div class="character-card__name">' + escHtml(c.name) + '</div>' +
      '<div class="character-card__traits">' + traits + '</div>' +
      '<div class="character-card__motivation">' + escHtml(c.motivation || '') + '</div>' +
      '</div>';
  }

  function episodeCard(ep, color) {
    const scenes = (ep.scenes || []).map(s =>
      '<div class="episode-card__scene">' + escHtml(s.description) + '</div>'
    ).join('');
    return '<div class="episode-card">' +
      '<div class="episode-card__num" style="color:' + color + '">Tập ' + ep.number + '</div>' +
      '<div class="episode-card__title">' + escHtml(ep.title) + '</div>' +
      '<div class="episode-card__hook">' + escHtml(ep.hook) + '</div>' +
      '<div class="episode-card__scenes">' + scenes + '</div>' +
      (ep.emotionalPeak ? '<div class="episode-card__scene" style="border-color:' + color + ';margin-top:0.5rem">💔 ' + escHtml(ep.emotionalPeak) + '</div>' : '') +
      (ep.cliffhanger ? '<div class="episode-card__cliff">⚡ ' + escHtml(ep.cliffhanger) + '</div>' : '') +
      '</div>';
  }

  // ── Render: Library ───────────────────────────────────────────────────
  function renderLibrary(filterPreset, searchQuery) {
    const container = document.getElementById('library-list');
    if (!container) return;

    let projects = searchQuery
      ? window.ProjectManager.search(searchQuery)
      : filterPreset
        ? window.ProjectManager.filterByPreset(filterPreset)
        : window.ProjectManager.getAll();

    if (!projects.length) {
      container.innerHTML =
        '<div class="library-empty">' +
        '<div class="library-empty__icon">📭</div>' +
        '<div class="library-empty__text">Chưa có dự án nào</div>' +
        '<div class="text-muted">Hãy tạo câu chuyện đầu tiên của bạn!</div>' +
        '</div>';
      return;
    }

    container.innerHTML = projects.map(p => projectCard(p)).join('');

    // Bind actions
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'open')      openProject(id);
        if (action === 'duplicate') duplicateProject(id);
        if (action === 'delete')    confirmDeleteProject(id);
      });
    });

    container.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => openProject(card.dataset.id));
    });
  }

  function projectCard(p) {
    const color = PRESET_COLORS[p.presetId] || '#55556a';
    const preset = window.DNA_PRESETS[p.presetId];
    const epCount = (p.episodes || []).length;
    const date = new Date(p.updatedAt).toLocaleDateString('vi-VN');
    return '<div class="project-card" data-id="' + p.id + '">' +
      '<div class="project-card__badge" style="background:' + color + '"></div>' +
      '<div class="project-card__info">' +
        '<div class="project-card__title">' + escHtml(p.title) + '</div>' +
        '<div class="project-card__meta">' +
          (preset ? preset.emoji + ' ' + preset.name + ' · ' : '') +
          epCount + ' tập · ' + (p.wordCount || 0).toLocaleString('vi') + ' từ · ' + date +
          ' <span class="badge badge-' + (p.status === 'complete' ? 'gold' : 'draft') + '">' +
          (p.status === 'complete' ? 'Hoàn thành' : 'Bản nháp') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="project-card__actions">' +
        '<button class="btn btn-ghost btn-sm btn-icon" data-action="duplicate" data-id="' + p.id + '" title="Nhân bản">⧉</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" data-action="delete" data-id="' + p.id + '" title="Xóa" style="color:var(--danger)">✕</button>' +
      '</div>' +
      '</div>';
  }

  function openProject(id) {
    const p = window.ProjectManager.get(id);
    if (!p) return;
    state.currentProject = p;
    // Reconstruct story-like object and render
    const story = { presetId: p.presetId, title: p.title, synopsis: p.synopsis, episodes: p.episodes || [], characters: p.characters || [], themes: p.themes || [] };
    navigate('generator');
    setTimeout(() => {
      selectPreset(p.presetId);
      renderStory(story);
    }, 50);
  }

  function duplicateProject(id) {
    const p = window.ProjectManager.duplicate(id);
    if (p) { toast('Đã nhân bản: ' + p.title, 'success', 'Nhân bản thành công'); renderLibrary(); }
  }

  function confirmDeleteProject(id) {
    const p = window.ProjectManager.get(id);
    if (!p) return;
    showModal({
      title: 'Xóa dự án',
      body: 'Bạn có chắc muốn xóa "' + escHtml(p.title) + '"? Hành động này không thể hoàn tác.',
      confirmLabel: 'Xóa',
      confirmClass: 'btn-danger',
      onConfirm: () => { window.ProjectManager.delete(id); renderLibrary(); toast('Đã xóa dự án', 'error'); }
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────
  function showModal({ title, body, confirmLabel, confirmClass, onConfirm }) {
    const overlay = document.getElementById('modal-overlay');
    overlay.querySelector('#modal-title').textContent = title;
    overlay.querySelector('#modal-body').innerHTML = body;
    const confirmBtn = overlay.querySelector('#modal-confirm');
    confirmBtn.textContent = confirmLabel || 'OK';
    confirmBtn.className = 'btn ' + (confirmClass || 'btn-primary');
    confirmBtn.onclick = () => { hideModal(); if (onConfirm) onConfirm(); };
    overlay.classList.remove('hidden');
  }

  function hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  // ── Export ────────────────────────────────────────────────────────────
  function exportStory(format) {
    if (!state.currentProject && !state.currentStory) {
      toast('Chưa có câu chuyện để xuất', 'error'); return;
    }

    let content, filename, mime;
    if (state.currentProject) {
      content = window.ProjectManager.exportProject(state.currentProject.id, format);
      filename = state.currentProject.title;
    } else {
      // Export from current story (not yet saved)
      const tmpId = window.ProjectManager.create(Object.assign({ status: 'draft' }, state.currentStory)).id;
      content = window.ProjectManager.exportProject(tmpId, format);
      window.ProjectManager.delete(tmpId);
      filename = state.currentStory.title;
    }

    if (!content) { toast('Không thể xuất file', 'error'); return; }

    const ext = { txt: 'txt', markdown: 'md', json: 'json' }[format] || 'txt';
    mime = format === 'json' ? 'application/json' : 'text/plain';

    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename.replace(/[^\w\u00C0-\u024F ]/g, '') + '.' + ext;
    a.click();
    URL.revokeObjectURL(url);
    toast('Đã xuất file .' + ext, 'success', 'Xuất thành công');
  }

  // ── Generate Story ─────────────────────────────────────────────────────
  function generateStory() {
    if (!state.selectedPreset) { toast('Vui lòng chọn một thể loại preset', 'error', 'Chưa chọn preset'); return; }

    const options = {
      title:        document.getElementById('inp-title')?.value.trim() || '',
      protagonist:  document.getElementById('inp-protagonist')?.value.trim() || '',
      antagonist:   document.getElementById('inp-antagonist')?.value.trim() || '',
      setting:      document.getElementById('inp-setting')?.value.trim() || '',
      episodeCount: parseInt(document.getElementById('inp-episodes')?.value) || 8,
      tone:         document.getElementById('inp-tone')?.value || 'auto',
    };

    const btn = document.getElementById('btn-generate');
    const spinner = document.getElementById('gen-spinner');
    if (btn) btn.disabled = true;
    if (spinner) spinner.classList.remove('hidden');

    // Simulate brief generation delay for UX
    setTimeout(() => {
      try {
        const story = window.StoryGenerator.generateStory(state.selectedPreset, options);
        renderStory(story);
        toast('Đã tạo xong "' + story.title + '"', 'success', 'Tạo thành công!');
      } catch(e) {
        toast(e.message || 'Lỗi khi tạo câu chuyện', 'error', 'Lỗi');
      }
      if (btn) btn.disabled = false;
      if (spinner) spinner.classList.add('hidden');
    }, 600);
  }

  // ── Save Story to Library ─────────────────────────────────────────────
  function saveCurrentStory() {
    if (!state.currentStory) { toast('Chưa có câu chuyện để lưu', 'error'); return; }
    const p = window.ProjectManager.create(Object.assign({ status: 'draft' }, state.currentStory));
    state.currentProject = p;
    toast('Đã lưu vào thư viện', 'success', 'Đã lưu!');
  }

  // ── Episode count slider display ──────────────────────────────────────
  function bindSlider() {
    const slider = document.getElementById('inp-episodes');
    const display = document.getElementById('episodes-display');
    if (!slider || !display) return;
    slider.addEventListener('input', () => { display.textContent = slider.value; });
  }

  // ── Search in library ─────────────────────────────────────────────────
  function bindSearch() {
    const inp = document.getElementById('library-search');
    if (!inp) return;
    let timer;
    inp.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => renderLibrary(null, inp.value.trim()), 250);
    });
  }

  // ── Mobile sidebar toggle ──────────────────────────────────────────────
  function bindMobileMenu() {
    const btn = document.getElementById('btn-menu');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && e.target !== btn) sidebar.classList.remove('open');
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    window.ProjectManager.init();
    renderStats();
    renderPresets();
    bindSlider();
    bindSearch();
    bindMobileMenu();

    // Nav clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.page));
    });

    // Generate button
    const btnGen = document.getElementById('btn-generate');
    if (btnGen) btnGen.addEventListener('click', generateStory);

    // Save button
    const btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', saveCurrentStory);

    // Export buttons
    document.querySelectorAll('.export-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.export-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        exportStory(btn.dataset.format);
      });
    });

    // Regenerate button
    const btnRegen = document.getElementById('btn-regenerate');
    if (btnRegen) btnRegen.addEventListener('click', generateStory);

    // Modal close
    document.getElementById('modal-cancel')?.addEventListener('click', hideModal);
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') hideModal();
    });

    // Start on home
    navigate('home');
  }

  return { init, navigate, renderLibrary, toast };
})();

document.addEventListener('DOMContentLoaded', () => window.TNTApp.init());
