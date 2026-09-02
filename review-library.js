(() => {
  const STORAGE_KEY = 'vetOsReviewBank';
  const TYPES = ['病史遗漏', 'Problem List', '鉴别诊断', '检查选择', '风险升级', '主人沟通', '影像判读', '操作流程'];

  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function readItems() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function addReviewNav() {
    const nav = document.querySelector('.nav');
    const main = document.querySelector('main');
    if (!nav || !main || document.getElementById('review-bank')) return;

    const button = document.createElement('button');
    button.dataset.view = 'review-bank';
    button.textContent = '复习库';
    nav.append(button);

    const section = document.createElement('section');
    section.id = 'review-bank';
    section.className = 'view';
    section.innerHTML = `
      <article class="card">
        <p class="label">个人错题 / 待更新点</p>
        <h2>病例复习库</h2>
        <p class="muted">按病例名称归档。这里只记录你明确标记的遗漏、错误或需要更新的判断；它不是系统擅自给出的临床结论。</p>
        <div id="review-bank-content"></div>
      </article>`;
    main.append(section);
    button.addEventListener('click', () => showView('review-bank'));
  }

  function showView(id) {
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === id));
    document.querySelectorAll('.nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === id));
    if (id === 'review-bank') renderReviewBank();
  }

  function renderReviewBank() {
    const content = document.getElementById('review-bank-content');
    if (!content) return;
    const items = readItems().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if (!items.length) {
      content.innerHTML = '<div class="notice">复习库还是空的。训练中发现遗漏、判断不稳或需要更新的地方时，点击“加入本关复习库”。</div>';
      return;
    }
    const groups = new Map();
    items.forEach((item) => {
      const key = `${item.caseId || ''}::${item.caseTitle || '未命名病例'}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    content.innerHTML = [...groups.values()].map((group) => {
      const first = group[0];
      return `<article class="card" style="margin-top:14px">
        <p class="label">病例 · ${escapeHtml(first.caseId || '未编号')}</p>
        <h3>${escapeHtml(first.caseTitle)}</h3>
        <p class="source">${group.length} 个待复习点 · 最近记录：${escapeHtml(String(first.updatedAt || '').replace('T', ' ').slice(0, 16))}</p>
        ${group.map((item) => `<div class="feedback" style="margin-top:9px">
          <span class="chip risk">${escapeHtml(item.type)}</span>
          <strong>${escapeHtml(item.stage)}</strong>
          <p style="margin:7px 0 0">${escapeHtml(item.note)}</p>
          <div class="controls" style="margin:9px 0 0"><button class="btn small reopen-review" data-case-id="${escapeHtml(item.caseId)}">打开病例</button><button class="btn small resolve-review" data-review-id="${escapeHtml(item.id)}">标记已掌握</button></div>
        </div>`).join('')}
      </article>`;
    }).join('');

    content.querySelectorAll('.resolve-review').forEach((button) => button.addEventListener('click', () => {
      saveItems(readItems().filter((item) => item.id !== button.dataset.reviewId));
      renderReviewBank();
    }));
    content.querySelectorAll('.reopen-review').forEach((button) => button.addEventListener('click', () => openCase(button.dataset.caseId)));
  }

  function openCase(caseId) {
    const casebank = document.querySelector('[data-view="casebank"]');
    if (!casebank) return;
    casebank.click();
    const card = document.querySelector(`.case[data-id="${CSS.escape(caseId)}"]`);
    if (card) card.click();
  }

  function attachTrainingReviewControl() {
    const training = document.getElementById('training');
    const submit = document.getElementById('submit-training');
    if (!training || !submit || document.getElementById('review-capture')) return;
    const capture = document.createElement('div');
    capture.id = 'review-capture';
    capture.className = 'notice';
    capture.style.marginTop = '12px';
    capture.innerHTML = `
      <strong>本关复习记录</strong>
      <div class="controls" style="margin:8px 0 0"><select id="review-type" aria-label="复习类型">${TYPES.map((type) => `<option>${type}</option>`).join('')}</select></div>
      <textarea id="review-note" style="min-height:76px" placeholder="写下具体错在哪里、漏了什么，或下次准备怎样判断。"></textarea>
      <button class="btn" id="save-review" type="button" style="margin-top:8px">加入本关复习库</button>
      <span class="source" id="review-status"></span>`;
    training.append(capture);

    document.getElementById('save-review').addEventListener('click', () => {
      const note = document.getElementById('review-note').value.trim();
      const title = document.getElementById('train-title')?.textContent.trim();
      const stage = document.getElementById('train-task')?.textContent.trim();
      if (!note) {
        document.getElementById('review-status').textContent = '请先写明复习原因。';
        return;
      }
      const catalog = window.VET_CLINICAL_DATA?.catalog?.cases || [];
      const current = catalog.find((item) => item.title === title);
      const items = readItems();
      items.push({
        id: `review-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        caseId: current?.id || '未匹配病例',
        caseTitle: title || '未命名病例',
        stage: stage || '未标注训练关卡',
        type: document.getElementById('review-type').value,
        note,
        updatedAt: new Date().toISOString()
      });
      saveItems(items);
      document.getElementById('review-note').value = '';
      document.getElementById('review-status').textContent = '已按病例名称存入复习库。';
    });
  }

  window.addEventListener('load', () => {
    addReviewNav();
    attachTrainingReviewControl();
  });
})();
