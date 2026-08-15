# VET Clinical OS

本地可运行的犬猫临床训练工作台。病例库分为已审核教学病例与公开文献待审核队列；后者绝不直接进入日常训练。

## 使用

部署到 HTTPS 地址后，用 iPhone Safari 打开 `index.html`，点击分享按钮，再选择“添加到主屏幕”。学习进度只保存在该 iPhone 浏览器中；首次打开后，核心界面和病例库可在离线状态下继续使用。

## 部署要求

PWA 必须通过 HTTPS 提供服务；直接双击本地 HTML 文件无法完成 iPhone 安装和离线缓存。将整个 `vet-clinical-os` 目录部署到任意静态 HTTPS 主机，且保持目录结构不变。

## 更新公开文献待审核队列

```powershell
python .\scripts\refresh_pubmed.py --max 20
python .\scripts\build_data.py
```

刷新浏览器页面，即可看到新的待审核文献元数据。只有人工补全物种、系统、临床问题、风险点、来源适用性并将状态改为 `approved` 的病例，才可以加入 `data/cases.json` 的训练池。

## 临床安全边界

这是学习与复盘工具，不生成个体化处方或替代执业判断。真实临床决策须遵循本地法规、产品说明书、医院制度和带教兽医意见。
