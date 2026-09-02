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
    return localDateKey(item.approved_at || item.ingested_at || item.created_at) === todayKey();
  }

  function enhanceCaseBank() {
    const grid = document.getElementById("case-grid");
    if (!grid) return;
    const cards = [...grid.querySelectorAll(".case[data-id]")];
    if (!cards.length) return;

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

  document.addEventListener("DOMContentLoaded", () => {
    enhanceCaseBank();
    const grid = document.getElementById("case-grid");
    if (grid) new MutationObserver(enhanceCaseBank).observe(grid, { childList: true, subtree: false });
  });
})();
