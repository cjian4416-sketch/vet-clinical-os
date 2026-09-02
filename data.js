(function () {
  function loadJson(path, fallback) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", path + "?v=" + Date.now(), false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) return JSON.parse(xhr.responseText);
    } catch (error) {
      console.error("VET Clinical OS data load failed:", path, error);
    }
    return fallback;
  }

  const rawCatalog = loadJson("data/cases.json", { schema_version: "2.0", updated_at: null, evidence_policy: "病例数据加载失败。", cases: [] });
  const frontendCases = (rawCatalog.cases || []).map((item) => {
    if (item.status !== "training_log") return item;
    const weekDay = `Week ${item.week || "?"} · Day ${item.day || "?"}`;
    const loop = item.clinical_loop_stage || "Clinical Loop 训练记录";
    const parent = item.parent_case_id ? `连续病例：${item.parent_case_id}` : "独立训练病例";
    return {
      ...item,
      status: "approved",
      source_status: "training_log",
      acuity: item.acuity || "V2训练记录",
      title: `${weekDay}｜${item.title || "临床训练"}`,
      chief_complaint: item.chief_complaint || item.assessment || loop,
      learning_goal: [item.learning_goal, `Clinical Loop：${loop}`, parent].filter(Boolean).join("\n"),
      red_flags: item.critical_errors || item.red_flags || [],
      source_type: "VET Clinical OS V2.0 每日训练",
      source: `data/cases.json · ${item.id}`,
      evidence_grade: item.evidence_grade || "教学训练记录",
      estimated_minutes: item.estimated_minutes || 35
    };
  });

  const catalog = { ...rawCatalog, cases: frontendCases };
  const intake = loadJson("data/pubmed-intake.json", { source: "PubMed E-utilities", updated_at: null, policy: "Pending records are never used in daily training until manually structured and approved.", records: [] });
  const imaging = loadJson("data/imaging.json", { schema_version: "1.0", updated_at: null, cases: [] });

  window.VET_CLINICAL_DATA = { catalog, intake, imaging };
  window.VET_CASE_SOURCE = "data/cases.json";
  window.VET_IMAGING_SOURCE = "data/imaging.json";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function localDateKey(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function todayKey() {
    return localDateKey(new Date());
  }

  function isNewCase(item) {
    const explicitDate = item.approved_at || item.ingested_at || item.created_at;
    if (localDateKey(explicitDate) === todayKey()) return true;

    // V2 daily-training nodes were added as one audited catalog batch. They
    // have no individual ingest timestamps, so use the catalog batch date
    // only for that update day rather than permanently calling them new.
    return item.source_status === "training_log" && localDateKey(rawCatalog.updated_at) === todayKey();
  }

  function enhanceCaseBank() {
    const grid = document.getElementById("case-grid");
    if (!grid) return;
    const cards = [...grid.querySelectorAll(".case[data-id]")];
    if (!cards.length) return;

    const newCount = frontendCases.filter(isNewCase).length;
    const counter = document.getElementById("casebank-count");
    if (counter && newCount) {
      counter.textContent = `${counter.textContent} · 今日新入库 ${newCount} 例`;
    }

    cards.forEach((card) => {
      if (card.dataset.v2Enhanced === "1") return;
      const item = frontendCases.find((c) => c.id === card.dataset.id);
      if (!item) return;
      card.dataset.v2Enhanced = "1";
      card.style.position = "relative";
      card.style.paddingTop = "38px";

      const selector = document.createElement("label");
      selector.style.cssText = "position:absolute;left:12px;top:10px;display:flex;gap:6px;align-items:center;font-size:12px;color:#607068;z-index:2";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "today-training-case";
      radio.value = item.id;
      radio.style.width = "auto";
      radio.addEventListener("click", (event) => {
        event.stopPropagation();
        card.click();
        radio.checked = true;
        localStorage.setItem("vetOsTodayCase", item.id);
      });
      selector.append(radio, document.createTextNode("今日训练"));
      card.prepend(selector);

      if (isNewCase(item)) {
        const badge = document.createElement("span");
        badge.textContent = "新";
        badge.title = "今日新入库病例";
        badge.style.cssText = "position:absolute;right:10px;top:9px;background:#126b4a;color:white;border-radius:3px;padding:2px 7px;font-size:12px;font-weight:700";
        card.prepend(badge);
      }

      if (item.parent_case_id) {
        const chain = document.createElement("div");
        chain.textContent = `连续病例 · ${item.parent_case_id}`;
        chain.style.cssText = "font-size:12px;color:#126b4a;margin-top:8px";
        card.append(chain);
      }

      const saved = localStorage.getItem("vetOsTodayCase");
      if (saved === item.id) radio.checked = true;
    });

    let launch = document.getElementById("launch-selected-today");
    if (!launch) {
      launch = document.createElement("button");
      launch.id = "launch-selected-today";
      launch.className = "btn primary";
      launch.textContent = "开始所选病例的今日训练";
      launch.style.marginLeft = "auto";
      const controls = document.querySelector("#casebank .controls");
      if (controls) controls.append(launch);
      launch.addEventListener("click", () => {
        const checked = document.querySelector('input[name="today-training-case"]:checked');
        if (!checked) {
          alert("请先勾选一个病例作为今日训练病例。");
          return;
        }
        const card = grid.querySelector(`.case[data-id="${checked.value}"]`);
        if (card) card.click();
        const trainBtn = document.getElementById("train-selected");
        if (trainBtn) trainBtn.click();
      });
    }
  }

  function renderImagingLibrary() {
    const section = document.getElementById("imaging");
    if (!section) return;
    const cases = (imaging.cases || []).filter((item) => item.status === "approved");
    if (!cases.length) {
      section.innerHTML = '<article class="card"><p class="label">影像实操</p><h2>暂无已审核影像病例</h2><p class="muted">新的 DR/超声病例通过审核后会进入 data/imaging.json 并显示在这里。</p></article>';
      return;
    }

    section.innerHTML = cases.map((item) => `
      <article class="card imaging-library-case" data-imaging-id="${escapeHtml(item.id)}" style="margin-bottom:16px">
        <p class="label">真实影像实操 · ${escapeHtml(item.id)}</p>
        <h2>${escapeHtml(item.title)}</h2>
        <div>
          <span class="chip">${escapeHtml(item.species)}</span>
          <span class="chip">${escapeHtml(item.patient)}</span>
          <span class="chip">${escapeHtml(item.modality)}</span>
          <span class="chip">${escapeHtml(item.system)}</span>
          <span class="chip risk">${escapeHtml(item.acuity)}</span>
        </div>
        <p class="lead">真实病例背景：${escapeHtml(item.clinical_context)}</p>
        <figure class="imaging-figure">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
          <figcaption class="imaging-caption">${escapeHtml(item.image_caption)}</figcaption>
        </figure>
        <p class="muted">DR 实操任务：${escapeHtml(item.task)}</p>
        <textarea class="imaging-note" placeholder="写下你的影像所见、Problem List、最优先排除的风险和下一步检查目标。"></textarea>
        <div class="controls" style="margin-top:12px">
          <button class="btn primary reveal-imaging" type="button">查看来源判读与结局</button>
          <a class="btn" target="_blank" rel="noreferrer" href="${escapeHtml(item.source_url)}">查看开放原文</a>
        </div>
        <div class="reveal imaging-answer hide"><strong>来源判读（教学整理）：</strong>${escapeHtml(item.interpretation)}<p class="source">来源：${escapeHtml(item.source)}；授权：${escapeHtml(item.license)}。</p></div>
      </article>
    `).join("") + '<article class="card"><p class="label">超声实操</p><h2>待真实授权素材入库</h2><p class="muted">超声病例需具备真实授权视频或连续帧、扫查部位与体位、探头方向、标准切面、关键征象以及最终诊断/随访后再进入正式训练。</p></article>';

    section.querySelectorAll(".reveal-imaging").forEach((button) => {
      button.addEventListener("click", () => {
        const answer = button.closest(".imaging-library-case")?.querySelector(".imaging-answer");
        if (!answer) return;
        answer.classList.remove("hide");
        button.textContent = "已显示来源判读";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    enhanceCaseBank();
    renderImagingLibrary();
    const grid = document.getElementById("case-grid");
    if (grid) new MutationObserver(enhanceCaseBank).observe(grid, { childList: true, subtree: false });
  });
})();
