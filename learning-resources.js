(() => {
  const resources = [
    {
      title: 'Veterinary Radiology · Case of the Day',
      type: '公开病例库',
      focus: '犬猫 DR、超声、CT/MRI；可按胸部、腹部、骨科和物种浏览。',
      url: 'https://www.veterinaryradiology.net/cases/'
    },
    {
      title: 'IVRA Open Education Resources',
      type: '开放教学资源',
      focus: '影像病例、感染性疾病影像总结与外部学习资源索引。',
      url: 'https://www.ivraimaging.org/oer-open-education-resources'
    },
    {
      title: 'St. George’s University · Small Animal Radiology I',
      type: '课程大纲',
      focus: '犬猫标准体位、图像质量、正常解剖和基础判读的学习顺序。',
      url: 'https://catalog.sgu.edu/courses/sams-501/syllabus'
    },
    {
      title: 'UC Davis · Small Animal X-ray',
      type: '临床影像基础',
      focus: '了解 DR/X-ray 的临床定位、胸部/腹部/骨骼系统常见适应证及数字影像工作场景。',
      url: 'https://www.vetmed.ucdavis.edu/hospital/diagnostic-imaging/small-animal/xray'
    },
    {
      title: 'University of Copenhagen · Veterinary Imaging',
      type: '影像课程框架',
      focus: 'DR 取得质量、体位、辐射安全、超声和横断面影像的完整课程路径。',
      url: 'https://kurser.ku.dk/course/svek13043u/2025-2026'
    },
    {
      title: 'Oregon State · Diagnostic Imaging Techniques',
      type: '技术原理',
      focus: '从 X-ray、透视到数字影像的技术基础；用于补齐“怎样获得合格片子”的底层知识。',
      url: 'https://vetmed.oregonstate.edu/hospital/diagnostic-imaging-techniques'
    }
  ];

  function addResourcePanel() {
    const section = document.getElementById('imaging');
    if (!section || document.getElementById('open-learning-resources')) return;
    const panel = document.createElement('article');
    panel.id = 'open-learning-resources';
    panel.className = 'card';
    panel.style.marginTop = '16px';
    panel.innerHTML = `<p class="label">外部公开资源 · 不等同于本地已审核病例</p><h2>DR/影像课程与病例入口</h2><p class="muted">用于补充正常片对照、更多盲读案例和操作教学。外部资源保留在原站学习；只有病例信息、图像授权和教学用途都复核通过，才会复制进本地正式病例库。</p><div class="case-grid">${resources.map((item) => `<article class="case" style="cursor:default"><strong>${item.title}</strong><span class="chip">${item.type}</span><p class="small">${item.focus}</p><a class="btn small" href="${item.url}" target="_blank" rel="noreferrer">打开原始资源</a></article>`).join('')}</div><div class="notice"><strong>使用方式：</strong>先在“病例库”选本地病例完成接诊；在“影像实操”做本地已审核片子的盲读；外站资料用于补充正常片对照、体位和更多专题病例，不会被自动算作你已掌握的病例。</div>`;
    section.append(panel);
  }

  window.addEventListener('load', addResourcePanel);
})();
