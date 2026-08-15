(() => {
  const questionFor = (title) => {
    if (title.includes('疫苗') || title.includes('免疫')) return {
      question: '主人追问：它看起来精神还可以，为什么今天不能直接打疫苗？是不是小题大做？',
      must: ['解释当前异常', '说明延后免疫的目的', '交代观察或复诊边界'],
      risk: ['呕吐', '血便', '精神变差', '脱水', '发热']
    };
    if (title.includes('呼吸') || title.includes('尿') || title.includes('异物')) return {
      question: '主人追问：我先带它回家观察一晚可以吗？现在必须做检查或去急诊吗？',
      must: ['说明不能延误的原因', '给出明确红旗征', '说明检查或升级的目的'],
      risk: ['无尿', '张口呼吸', '发绀', '虚脱', '持续呕吐', '腹胀']
    };
    return {
      question: '主人追问：这项检查一定要做吗？不做会有什么风险，检查结果又会怎样改变下一步？',
      must: ['解释检查目的', '说明不做的风险或局限', '说明结果如何改变计划'],
      risk: ['精神变差', '疼痛加重', '呕吐', '拒食', '呼吸困难']
    };
  };

  const scoreReply = (answer, config) => {
    const text = answer.replace(/\s/g, '');
    const explain = /(因为|目的是|用于|判断|排除|确认|检查)/.test(text);
    const plan = /(如果|结果|根据|下一步|调整|决定)/.test(text);
    const boundary = /(立即|尽快|急诊|复诊|观察|回来|恶化)/.test(text);
    const empathy = /(理解|担心|我们一起|我会|您可以)/.test(text);
    const unsafe = /(肯定没事|绝对|不用担心|不需要检查)/.test(text);
    const score = Math.max(0, (explain ? 25 : 0) + (plan ? 25 : 0) + (boundary ? 30 : 0) + (empathy ? 20 : 0) - (unsafe ? 30 : 0));
    const missing = [];
    if (!explain) missing.push('没有解释检查或暂缓处理的医学目的');
    if (!plan) missing.push('没有说明结果会怎样改变下一步计划');
    if (!boundary) missing.push('没有交代主人必须升级处理的观察边界');
    if (!empathy) missing.push('语气中缺少对主人顾虑的回应');
    return { score, missing, unsafe };
  };

  function render() {
    const training = document.getElementById('training');
    const title = document.getElementById('train-title')?.textContent || '';
    if (!training?.classList.contains('active') || !title || document.getElementById('owner-dialogue-panel')) return;
    const config = questionFor(title);
    const host = training.querySelector('article.card');
    if (!host) return;
    const panel = document.createElement('section');
    panel.id = 'owner-dialogue-panel';
    panel.className = 'feedback';
    panel.innerHTML = `<p class="label">主人互动 · 沟通关</p><p><strong>${config.question}</strong></p><p class="muted">请用主人能听懂的话回答：为什么、现在怎么做、观察什么、何时必须升级。</p><textarea id="owner-reply" placeholder="写下你会对主人说的话。"></textarea><div class="controls" style="margin-top:10px"><button class="btn primary" id="score-owner-reply">提交并获取练习反馈</button></div><div id="owner-feedback" class="hide"></div><p class="source">练习反馈按病例风险与沟通要素生成，不替代带教兽医对实际病例的审核。</p>`;
    host.appendChild(panel);
    document.getElementById('score-owner-reply').onclick = () => {
      const answer = document.getElementById('owner-reply').value.trim();
      const box = document.getElementById('owner-feedback');
      if (!answer) { box.className = 'reveal'; box.textContent = '请先完成你对主人的回答。'; return; }
      const result = scoreReply(answer, config);
      const flags = config.risk.join('、');
      box.className = 'reveal';
      box.innerHTML = `<strong>沟通练习评分：${result.score}/100</strong><br>${result.unsafe ? '<span class="danger">注意：避免“肯定没事”“绝对”等无条件保证。</span><br>' : ''}${result.missing.length ? '建议补充：' + result.missing.map(x => '• ' + x).join('<br>') : '结构完整：已覆盖解释、计划、升级边界和主人顾虑。'}<br><span class="source">本例应主动交代的红旗征示例：${flags}。</span>`;
    };
  }

  const observer = new MutationObserver(render);
  window.addEventListener('load', () => { observer.observe(document.body, { subtree: true, attributes: true, childList: true }); setInterval(render, 500); });
})();
