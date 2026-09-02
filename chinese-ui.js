(() => {
  window.addEventListener('load', () => {
    document.title = '犬猫临床成长工作台';
    const eyebrow = document.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = '犬猫临床成长工作台 · 正式版 V1';
    const footer = document.querySelector('.footer');
    if (footer) footer.textContent = '犬猫临床成长工作台 · 本地正式版 V1 · 数据更新与病例训练池严格分离。';
  });
})();
