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
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = '@media(max-width:760px){#case-study .card{padding:14px}#case-study .grid{grid-template-columns:1fr}#case-study h2{font-size:21px}}';
    document.head.append(mobileStyle);

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

  function seriesCases(item) {
    const catalog = window.VET_CLINICAL_DATA?.catalog?.cases || [];
    const weekly = /^V2-W\d+-/.exec(item.id || '');
    if (weekly) return catalog.filter((entry) => entry.id?.startsWith(weekly[0])).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    if (item.parent_case_id) return catalog.filter((entry) => entry.parent_case_id === item.parent_case_id || entry.id === item.parent_case_id);
    return [item];
  }

  function deduplicate(entries) {
    return [...new Set(entries.filter(Boolean))];
  }

  function studyChecklist(item) {
    const bySystem = {
      '心血管': ['确认休息/运动时呼吸变化、咳嗽、晕厥、活动耐力和既往心脏病史。', '完成心率、节律、杂音位置/时期/级别、股动脉脉搏、黏膜和呼吸状态记录。', '把“发现杂音”“是否心衰”“是否需要立即治疗”分成三个独立问题。'],
      '消化系统': ['量化呕吐/反流的频率、内容物、时间线、体重变化及异物、毒物、药物暴露。', '先评估脱水、腹痛和全身状态，再决定血检、X 光或超声的顺序。', '把检查结果用于更新鉴别诊断，不能将单项阴性结果等同于排除疾病。'],
      '预防医疗': ['核对当前健康状态、既往疫苗反应、免疫记录、生活方式和暴露风险。', '发现异常时暂停常规免疫，先建立问题清单与升级边界。', '向主人说明今天能做什么、不能做什么及复诊触发条件。']
    };
    return bySystem[item.system] || ['先把主诉转化为可验证的临床事实，再建立问题清单。', '每项检查都要回答：排除什么、结果如何改变下一步。', '给主人沟通已知、未知、观察指标和升级边界。'];
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
    const series = seriesCases(item);
    const baseline = series.find((entry) => entry.chief_complaint) || item;
    const findings = deduplicate(series.flatMap((entry) => entry.findings || []));
    const problems = deduplicate(series.flatMap((entry) => entry.problem_list || []));
    const diagnosticEntries = series.flatMap((entry) => Object.entries(entry.diagnostics || {}).map(([key, value]) => `${entry.id} · ${key}：${typeof value === 'object' ? JSON.stringify(value) : value}`));
    const sequence = series.map((entry) => `${entry.id}：${entry.title || entry.clinical_loop_stage || '训练节点'}`);
    content.innerHTML = `
      <p class="label">病例学习 · ${escapeHtml(item.id)}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <div>${[item.species, item.life_stage, item.system, item.acuity].filter(Boolean).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}</div>
      <h3 style="margin-top:18px">主诉与病例背景</h3>
      <p class="lead">${escapeHtml(baseline.chief_complaint || '本系列暂未提供主诉。')}</p>
      <p class="muted">当前节点：${escapeHtml(item.clinical_loop_stage || item.learning_goal || '')}</p>
      <article class="card" style="margin-top:14px"><h3>本系列学习路径</h3>${asList(sequence, '本例为独立病例。')}<p class="source">学习页整合同一连续病例的前置与后续节点；模拟接诊中仍按当前关卡逐步释放信息。</p></article>
      <div class="grid two" style="margin-top:14px">
        <article class="card"><h3>病例已有资料</h3><p><strong>体检/发现</strong></p>${asList(findings, '本系列尚未提供体检资料；请按下方学习清单完成定向检查。')}<p><strong>问题清单</strong></p>${asList(problems, '本系列尚未预设问题清单；训练中由你建立。')}</article>
        <article class="card"><h3>检查资料与后续证据</h3>${asList(diagnosticEntries, '当前节点尚未释放检查结果；训练时由你决定是否申请检查。')}</article>
      </div>
      <div class="grid two" style="margin-top:14px">
        <article class="card"><h3>本例怎么学</h3>${asList(studyChecklist(item))}<p><strong>本节点训练重点</strong></p>${asList(item.skills)}<p><strong>学习目标</strong></p><p>${escapeHtml(item.learning_goal || '暂未提供。')}</p></article>
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
