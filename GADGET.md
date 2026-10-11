# 建筑外形画师 · C-painter v2

把 workshop 带入的已确认建造提案校验为 BUILD/V5 或 region-build/v2。
输入文字或图片的语义提案由 skills/workshop 提供；painter 不自调 LLM。
材质使用世界源提供的 materialRef、中立 orientation、目录标签和颜色。

- 服务：hanaworldsPainterV2PictureBlocks。
- 合约方法：ValidateBuildProposal、ValidateRegionProposal。
- 注册工具：hanaworlds_image_material，execute 接收图片字节、Catalogue、materialColours。
- 配色：sharp 解码，color-diff 1.4.0 的 CIEDE2000，零模型调用、零写世界。
- 设置：空 schema；旧模型路由和 CreateBuildPlan 路径已归档。

接入、输入形状、错误码、模拟事实端口和测试命令见 README.md。
