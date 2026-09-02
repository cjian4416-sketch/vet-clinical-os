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
})();
