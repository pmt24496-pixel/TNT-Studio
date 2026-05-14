// Project Manager — TNT Studio
// Pure JS, no imports. Exposes window.ProjectManager.
// Persists all projects to localStorage.

window.ProjectManager = (function () {
  const KEY = 'tnt_studio_projects';

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (list) => localStorage.setItem(KEY, JSON.stringify(list));
  const now  = () => new Date().toISOString();
  const uid  = () => Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);

  function countWords(p) {
    return [
      p.title, p.synopsis,
      (p.episodes   || []).map(e => [e.title, e.hook, e.emotionalPeak, e.cliffhanger,
        (e.scenes || []).map(s => s.description).join(' ')].join(' ')).join(' '),
      (p.characters || []).map(c => [c.name, c.backstory, c.motivation].join(' ')).join(' '),
      (p.themes     || []).join(' ')
    ].join(' ').split(/\s+/).filter(Boolean).length;
  }

  return {
    init() {
      if (!localStorage.getItem(KEY)) save([]);
    },

    getAll() {
      return load().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    get(id) {
      return load().find(p => p.id === id) || null;
    },

    create(data) {
      const projects = load();
      const p = {
        id:         uid(),
        presetId:   data.presetId   || null,
        title:      data.title      || 'Untitled',
        synopsis:   data.synopsis   || '',
        episodes:   data.episodes   || [],
        characters: data.characters || [],
        themes:     data.themes     || [],
        status:     data.status     || 'draft',
        createdAt:  now(),
        updatedAt:  now(),
        wordCount:  0
      };
      p.wordCount = countWords(p);
      projects.push(p);
      save(projects);
      return p;
    },

    update(id, changes) {
      const projects = load();
      const i = projects.findIndex(p => p.id === id);
      if (i === -1) return null;
      const updated = Object.assign({}, projects[i], changes, {
        id: projects[i].id,
        createdAt: projects[i].createdAt,
        updatedAt: now()
      });
      updated.wordCount = countWords(updated);
      projects[i] = updated;
      save(projects);
      return updated;
    },

    delete(id) {
      const projects = load();
      const i = projects.findIndex(p => p.id === id);
      if (i === -1) return false;
      projects.splice(i, 1);
      save(projects);
      return true;
    },

    duplicate(id) {
      const src = this.get(id);
      if (!src) return null;
      const copy = Object.assign({}, src, {
        id: uid(),
        title: src.title + ' (Bản sao)',
        createdAt: now(),
        updatedAt: now()
      });
      const projects = load();
      projects.push(copy);
      save(projects);
      return copy;
    },

    search(query) {
      if (!query) return this.getAll();
      const q = query.toLowerCase();
      return this.getAll().filter(p =>
        (p.title    || '').toLowerCase().includes(q) ||
        (p.synopsis || '').toLowerCase().includes(q)
      );
    },

    filterByPreset(presetId) {
      return this.getAll().filter(p => p.presetId === presetId);
    },

    exportProject(id, format) {
      const p = this.get(id);
      if (!p) return null;
      const statusLabel = p.status === 'complete' ? 'Hoàn thành' : 'Bản nháp';

      if (format === 'json') return JSON.stringify(p, null, 2);

      if (format === 'markdown') {
        const L = [
          '# ' + p.title, '',
          '**Thể loại:** ' + (p.presetId || 'N/A') + '  ',
          '**Trạng thái:** ' + statusLabel + '  |  **Số từ:** ' + p.wordCount, '',
          '## Tóm tắt', '', p.synopsis || '_Chưa có tóm tắt._', ''
        ];
        if ((p.characters || []).length) {
          L.push('## Nhân vật', '');
          p.characters.forEach(c => {
            L.push('### ' + (c.name || 'Unnamed') + ' — ' + (c.role || ''));
            L.push('- **Đặc điểm:** ' + (c.traits || []).join(', '));
            L.push('- **Động lực:** ' + (c.motivation || ''));
            L.push('- **Backstory:** ' + (c.backstory || ''));
            L.push('');
          });
        }
        if ((p.themes || []).length) L.push('## Chủ đề', '', p.themes.join(' · '), '');
        if ((p.episodes || []).length) {
          L.push('## Các tập', '');
          p.episodes.forEach((e) => {
            L.push('### Tập ' + e.number + ': ' + (e.title || 'Untitled'));
            if (e.hook) L.push('', '> ' + e.hook);
            if (e.scenes && e.scenes.length) {
              L.push('');
              e.scenes.forEach(s => L.push('**Cảnh ' + s.sceneNumber + ':** ' + s.description));
            }
            if (e.emotionalPeak) L.push('', '**Cao trào cảm xúc:** ' + e.emotionalPeak);
            if (e.cliffhanger)   L.push('', '**Cliffhanger:** _' + e.cliffhanger + '_');
            L.push('');
          });
        }
        return L.join('\n');
      }

      // txt
      const sep = '─'.repeat(50);
      const L = [
        p.title.toUpperCase(), '='.repeat(Math.min(p.title.length * 2, 60)), '',
        'Thể loại : ' + (p.presetId || 'N/A'),
        'Trạng thái: ' + statusLabel + '   Số từ: ' + p.wordCount,
        sep, '',
        'TÓM TẮT', sep,
        p.synopsis || '(Chưa có tóm tắt)', ''
      ];
      if ((p.characters || []).length) {
        L.push('NHÂN VẬT', sep);
        p.characters.forEach(c => {
          L.push('[' + (c.role || '') + '] ' + (c.name || 'Unnamed'));
          L.push('  Đặc điểm: ' + (c.traits || []).join(', '));
          L.push('  Động lực: ' + (c.motivation || ''));
          L.push('');
        });
      }
      if ((p.themes || []).length) L.push('CHỦ ĐỀ', sep, p.themes.join(' · '), '');
      if ((p.episodes || []).length) {
        L.push('CÁC TẬP', sep);
        p.episodes.forEach((e) => {
          L.push('', 'Tập ' + e.number + ': ' + (e.title || 'Untitled').toUpperCase());
          if (e.hook) L.push('Hook: ' + e.hook);
          if (e.scenes) e.scenes.forEach(s => L.push('  [Cảnh ' + s.sceneNumber + '] ' + s.description));
          if (e.emotionalPeak) L.push('  Cao trào: ' + e.emotionalPeak);
          if (e.cliffhanger)   L.push('  Cliffhanger: ' + e.cliffhanger);
        });
      }
      return L.join('\n');
    },

    importProject(jsonString) {
      try {
        const d = JSON.parse(jsonString);
        if (!d || typeof d !== 'object') return null;
        return this.create(d);
      } catch { return null; }
    },

    getStats() {
      const projects = load();
      const stats = { totalProjects: projects.length, totalEpisodes: 0, totalWords: 0, byPreset: {} };
      projects.forEach(p => {
        stats.totalEpisodes += (p.episodes || []).length;
        stats.totalWords    += p.wordCount || 0;
        const k = p.presetId || 'unknown';
        stats.byPreset[k] = (stats.byPreset[k] || 0) + 1;
      });
      return stats;
    }
  };
})();
