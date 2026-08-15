(() => {
  const html = `
  <section id="diagnostics" class="view"><article class="card"><p class="label">诊断实操线</p><h2>先学“何时申请、如何取得合格资料、怎样解读、结果如何改变决策”</h2><div class="case-grid" id="diagnostic-grid"></div></article></section>
  <section id="skills" class="view"><article class="card"><p class="label">操作技能线</p><h2>操作前必须先掌握适应证、禁忌证、无菌要求和并发症识别</h2><table><thead><tr><th>技能</th><th>训练目标</th><th>必须有带教复核的边界</th></tr></thead><tbody><tr><td>采血与留置针</td><td>患者约束、静脉选择、无菌、样本质量</td><td>首批真实患者操作、并发症处理</td></tr><tr><td>输液与监护</td><td>适应证、液体计划、出入量、复评</td><td>休克、心肾病、复杂电解质异常</td></tr><tr><td>导尿与泌尿急症</td><td>无菌准备、风险识别、留置管理</td><td>尿闭、镇静/麻醉、失败升级</td></tr><tr><td>创伤与无菌基础</td><td>清创逻辑、疼痛评估、包扎复查</td><td>深部伤口、胸腹腔创伤、感染控制</td></tr><tr><td>麻醉监护</td><td>术前分级、监护参数、恢复观察</td><td>高风险患者、异常监护和抢救</td></tr></tbody></table></article></section>
  <section id="review" class="view"><article class="card"><p class="label">复盘与考核线</p><h2>每周用错题和安全遗漏决定下周病例，而不是随机刷题</h2><div class="grid three"><div class="stat"><span class="label">本周完整闭环</span><strong>0 / 5</strong><span>问诊 → 检查 → 判断 → 沟通</span></div><div class="stat"><span class="label">安全遗漏</span><strong>0</strong><span>红旗征、升级、禁忌证</span></div><div class="stat"><span class="label">带教复核</span><strong>待接入</strong><span>真实操作必须留痕</span></div></div><div class="notice">复盘模板：我漏了什么？为什么会漏？下次用哪个问题、检查或动作防错？</div></article></section>`;
  const groups = [
    ['DR / X-ray','胸腔、腹部、骨科、口腔','申请依据 → 患者准备与体位 → 片位/质量 → 系统阅片 → 鉴别 → 是否加做超声或化验'],
    ['超声','FAST/POCUS、腹部、泌尿、心超','患者体位 → 探头/方向 → 标准切面 → 动态扫查 → 关键征象 → 与病例问题清单整合'],
    ['ECG 心电图','基础节律、传导异常、电解质相关改变','电极放置 → 纸速/增益/校准 → 心率与节律 → P-QRS-T → 临床意义 → 何时升级'],
    ['CT / MRI','神经、胸腹部、骨科、肿瘤','适应证 → 检查前准备/镇静麻醉风险 → 窗位/序列/层面 → 定位 → 与 DR/超声对照'],
    ['实验室资料','CBC、生化、尿检、血气、电解质、凝血','采样与前分析 → 报告质控 → 异常组合 → 趋势 → 如何改变诊断和治疗计划'],
    ['其他诊断资料','细胞学、病理、内镜、传染病快检','何时取样 → 样本质量 → 结果局限 → 与影像和病史交叉验证']
  ];
  function add(){
    const main=document.querySelector('main'), nav=document.querySelector('.nav'); if(!main||!nav||document.getElementById('diagnostics')) return;
    main.insertAdjacentHTML('beforeend',html);
    [['diagnostics','诊断实操'],['skills','操作技能'],['review','复盘考核']].forEach(([id,label])=>{const b=document.createElement('button');b.dataset.view=id;b.textContent=label;b.onclick=()=>{document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x===b))};nav.appendChild(b)});
    document.getElementById('diagnostic-grid').innerHTML=groups.map(([name,scope,steps])=>`<article class="case"><strong>${name}</strong><span class="small">${scope}</span><p class="small">${steps}</p><span class="chip risk">病例资料持续入库，未核验资料不展示为真实案例</span></article>`).join('');
  }
  window.addEventListener('load',add);
})();
