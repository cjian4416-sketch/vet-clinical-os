(() => {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function asList(value, empty = '本病例暂未提供该项资料。') {
    if (!value || (Array.isArray(value) && !value.length)) return `<p class="muted">${empty}</p>`;
    const entries = Array.isArray(value) ? value : Object.entries(value).map(([key, item]) => `${key}：${typeof item === 'object' ? JSON.stringify(item) : item}`);
    return `<ul class="checklist">${entries.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  function addStudyView() {
    const nav = document.querySelector('.nav');
    const main = document.querySelector('main');
    const detailActions = document.querySelector('#casebank .case-detail > div:last-child');
    if (!nav || !main || !detailActions || document.getElementById('case-study')) return;

    const navButton = document.createElement('button');
    navButton.dataset.view = 'case-study';
    navButton.textContent = '病例学习';
    nav.append(navButton);

    const studyButton = document.createElement('button');
    studyButton.id = 'open-case-study';
    studyButton.className = 'btn';
    studyButton.disabled = true;
    studyButton.style.marginLeft = '8px';
    studyButton.textContent = '查看病例内容';
    detailActions.append(studyButton);

    const section = document.createElement('section');
    section.id = 'case-study';
    section.className = 'view';
    section.innerHTML = '<article class="card" id="case-study-content"><p class="label">病例学习</p><h2>请先从病例库选择病例</h2></article>';
    main.append(section);

    navButton.addEventListener('click', () => openStudy());
    studyButton.addEventListener('click', () => openStudy());
    document.addEventListener('click', (event) => {
      const card = event.target.closest('.case[data-id]');
      if (!card) return;
      studyButton.disabled = false;
      studyButton.dataset.caseId = card.dataset.id;
    });
  }

  function showView(id) {
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === id));
    document.querySelectorAll('.nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === id));
  }

  function selectedCase() {
    const explicit = document.getElementById('open-case-study')?.dataset.caseId;
    const selectedId = explicit || document.querySelector('.case.selected')?.dataset.id;
    return (window.VET_CLINICAL_DATA?.catalog?.cases || []).find((item) => item.id === selectedId);
  }

  function openStudy() {
    const item = selectedCase();
    const content = document.getElementById('case-study-content');
    if (!content) return;
    if (!item) {
      content.innerHTML = '<p class="label">病例学习</p><h2>请先从病例库选择病例</h2><p class="muted">选择病例后，可在“用此病例开始训练”和“查看病例内容”之间选择。</p>';
      showView('case-study');
      return;
    }
    const diagnosticEntries = item.diagnostics ? Object.entries(item.diagnostics).map(([key, value]) => `${key}：${typeof value === 'object' ? JSON.stringify(value) : value}`) : [];
    content.innerHTML = `
      <p class="label">病例学习 · ${escapeHtml(item.id)}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <div>${[item.species, item.life_stage, item.system, item.acuity].filter(Boolean).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}</div>
      <h3 style="margin-top:18px">主诉与病例背景</h3>
      <p class="lead">${escapeHtml(item.chief_complaint || '暂未提供主诉。')}</p>
      <p class="muted">${escapeHtml(item.clinical_loop_stage || item.learning_goal || '')}</p>
      <div class="grid two" style="margin-top:14px">
        <article class="card"><h3>已有资料</h3><p><strong>体检/发现</strong></p>${asList(item.findings, '本节点暂未提供体检资料。')}<p><strong>问题清单</strong></p>${asList(item.problem_list, '本节点进入训练后需要由你建立 Problem List。')}</article>
        <article class="card"><h3>检查资料</h3>${asList(diagnosticEntries, '本节点尚未释放检查结果；请在模拟接诊中决定是否申请检查。')}</article>
      </div>
      <div class="grid two" style="margin-top:14px">
        <article class="card"><h3>本例训练重点</h3>${asList(item.skills)}<p><strong>学习目标</strong></p><p>${escapeHtml(item.learning_goal || '暂未提供。')}</p></article>
        <article class="card"><h3>关键错误与安全边界</h3>${asList(item.critical_errors || item.red_flags, '本病例暂无额外标注。')}</article>
      </div>
      <article class="card" style="margin-top:14px"><p class="label">证据和数据边界</p><p>${escapeHtml(item.source_type || '病例类型未标注')} · ${escapeHtml(item.source || '来源未标注')}</p><p class="source">证据等级：${escapeHtml(item.evidence_grade || '未标注')}。教学重构病例用于训练决策链，不能替代真实患者的现场评估。</p><button class="btn primary" id="study-train" type="button">用此病例开始模拟接诊</button></article>`;
    content.querySelector('#study-train')?.addEventListener('click', () => {
      document.querySelector('[data-view="casebank"]')?.click();
      const card = document.querySelector(`.case[data-id="${CSS.escape(item.id)}"]`);
      card?.click();
      document.getElementById('train-selected')?.click();
    });
    showView('case-study');
  }

  window.addEventListener('load', addStudyView);
})();
