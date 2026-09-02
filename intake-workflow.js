(() => {
  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function renderCandidatePool(records) {
    if (!records.length) return '<p class="muted">当前没有候选文献线索。</p>';
    return `<div class="notice"><strong>原始候选线索：</strong>以下为检索元数据，不是病例、不是诊疗建议，也不会进入训练。只有需要核验时才展开查看。</div>
      <details style="margin-top:12px"><summary>展开查看 ${records.length} 条原始候选线索</summary>
      <table style="margin-top:10px"><thead><tr><th>原始题目</th><th>原始来源</th><th>状态</th></tr></thead><tbody>${records.map((record) => `<tr><td>${escapeHtml(record.title)}</td><td>${escapeHtml(record.journal || '未标注')} · PMID ${escapeHtml(record.pmid || '未标注')}<br><a href="${escapeHtml(record.url || '#')}" target="_blank" rel="noreferrer">查看原始 PubMed 记录</a></td><td><span class="chip risk">仅候选</span></td></tr>`).join('')}</tbody></table></details>`;
  }

  function renderWorkflow() {
    const section = document.getElementById('intake');
    const data = window.VET_CLINICAL_DATA;
    if (!section || !data || section.dataset.workflowReady === '1') return;
    section.dataset.workflowReady = '1';
    const records = data.intake?.records || [];
    const approved = data.catalog?.cases?.length || 0;
    section.innerHTML = `
      <article class="card">
        <p class="label">病例入库漏斗</p>
        <h2>文献线索不等于训练病例</h2>
        <p class="muted">你只需要在病例库学习已审核的结构化病例；公开文献先进入后台候选池，不在这里制造“病例数量”的错觉。</p>
        <div class="stats" style="margin-top:14px">
          <div class="stat"><span class="label">已审核训练病例</span><strong>${approved}</strong><span>可选、可学、可复习</span></div>
          <div class="stat"><span class="label">原始候选线索</span><strong>${records.length}</strong><span>尚未构成病例</span></div>
          <div class="stat"><span class="label">待入库教学包</span><strong>0</strong><span>尚无已完成审核的新增包</span></div>
        </div>
      </article>
      <article class="card" style="margin-top:16px">
        <h3>固定审核流程</h3>
        <ol class="checklist">
          <li><strong>初筛：</strong>是否为犬猫、是否具有常见且可训练的临床决策点。</li>
          <li><strong>教学重构：</strong>提取主诉、体征、检查、影像、诊断、处置和结局，形成连续病例结构。</li>
          <li><strong>证据与授权：</strong>核对原文、图像许可、发表时间和适用边界。</li>
          <li><strong>双出口：</strong>合格者进入病例库；不合格/过度罕见/信息不足者归档，不推送给你。</li>
        </ol>
        <div class="notice">当前 ${records.length} 条记录仍停留在“原始候选线索”阶段；它们没有被算作病例，也不会进入今日训练。</div>
      </article>
      <article class="card" style="margin-top:16px">
        <h3>原始候选线索池</h3>
        ${renderCandidatePool(records)}
      </article>`;
  }

  window.addEventListener('load', renderWorkflow);
})();
