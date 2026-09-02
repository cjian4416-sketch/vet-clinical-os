(() => {
  function setCaseFirstWorkflow() {
    const casebankButton = document.querySelector('[data-view="casebank"]');
    const todayButton = document.querySelector('[data-view="today"]');
    const startButton = document.getElementById('start-case');
    const casebank = document.getElementById('casebank');
    if (!casebankButton || !todayButton || !startButton || !casebank) return;

    todayButton.textContent = '已选病例训练';
    startButton.textContent = '返回病例库选择病例';
    startButton.onclick = () => casebankButton.click();

    // A persisted selection is useful for progress records, but it must not
    // bypass the learning entry point on a new visit.
    const progressKey = 'vetOsProgress';
    try {
      const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      delete progress.selected;
      localStorage.setItem(progressKey, JSON.stringify(progress));
    } catch (_) {
      // Keep the workflow usable when browser storage is unavailable.
    }

    if (!document.getElementById('case-first-notice')) {
      const notice = document.createElement('div');
      notice.id = 'case-first-notice';
      notice.className = 'notice';
      notice.innerHTML = '<strong>学习入口：</strong>先选病例，再开始接诊训练。选定病例后，系统会围绕该病例展示训练步骤、可申请检查资料和主人互动。';
      casebank.prepend(notice);
    }
    casebankButton.click();

    // The original case renderer selects a default case. Replace that visual
    // default with an explicit choice gate: no case can be trained until its
    // card is clicked in this visit.
    const requireChoice = () => {
      document.querySelectorAll('.case.selected').forEach((card) => card.classList.remove('selected'));
      const trainButton = document.getElementById('train-selected');
      if (trainButton) {
        trainButton.disabled = true;
        trainButton.textContent = '请先选择病例';
      }
      const detailTitle = document.getElementById('detail-title');
      if (detailTitle) detailTitle.textContent = '请从左侧病例库选择一个病例';
    };
    requireChoice();

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.case')) return;
      const trainButton = document.getElementById('train-selected');
      if (trainButton) {
        trainButton.disabled = false;
        trainButton.textContent = '用此病例开始训练';
      }
    });
  }
  window.addEventListener('load', setCaseFirstWorkflow);
})();
