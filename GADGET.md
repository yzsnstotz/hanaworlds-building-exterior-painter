# 建筑外形画师 · C-painter v3

把 workshop 带入的已确认建造提案校验为 BUILD/V5 或 region-build/v2。
输入文字或图片的语义提案由 skills/workshop 提供；painter 不自调 LLM。
材质使用世界源提供的 materialRef、中立 orientation、目录标签和颜色。

- 服务：hanaworldsPainterV2PictureBlocks。
- 合约方法：ValidateBuildProposal、ValidateRegionProposal。
- 注册工具：hanaworlds_image_material，execute 接收图片字节、当前 Catalogue、currentConnection、C-world-facts ReadMaterialSources 的 materialSources（snapshot + textures）。唯一配色入口是 matchCurrentImageMaterials。
- 无材质源时工具仍注册；materialSources 缺省、undefined、null 或合法源无可用候选材质，execute 在解码前拒绝为 CAPABILITY_UNAVAILABLE。已提供但格式错误或过期的源保留合约错误，不用历史结果兜底。
- 配色：sharp 解码，color-diff 1.4.0 的 CIEDE2000，零模型调用、零写世界。
- 设置：可选 maxBytes、maxPixels、formats，默认33554432字节/16777216像素/png jpeg webp；主图和KNOWN纹理共用本实例预算。旧模型路由和CreateBuildPlan路径已归档。
- 版本：session/v5+ReferenceBrief/v5或session/v6+ReferenceBrief/v6，混版和错误摘要域拒绝。v6确认/首末事实由原调用方携入，不增加来源读取服务或权限。

接入、输入形状、错误码、模拟事实端口和测试命令见 README.md。
