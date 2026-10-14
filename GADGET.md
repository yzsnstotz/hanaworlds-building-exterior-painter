# 建筑外形画师 · C-painter v3

把 workshop 带入的已确认建造提案校验为 BUILD/V5 或 region-build/v2。
输入文字或图片的语义提案由 skills/workshop 提供；painter 不自调 LLM。
材质使用世界源提供的 materialRef、中立 orientation、目录标签和颜色。

- 服务：hanaworldsPainterV2PictureBlocks。
- 合约方法：ValidateBuildProposal、ValidateRegionProposal。
- 注册工具：hanaworlds_image_material，execute 接收图片字节、当前 Catalogue、currentConnection、C-world-facts ReadMaterialSources 的 materialSources（snapshot + textures）。唯一配色入口是 matchCurrentImageMaterials。
- 同一个原工具的模型入口由仅注入 tools 的 Cordis 子插件在官方 ctx.tools 注册；原 ctx.provide 服务继续承载 typed 四字段。模型只传 {attachmentRef}，原 exec/Agent/Session/signal 原样交当前 Workshop 的 readMaterialSourcesProjection；不让模型自授字节、路径、世界或事实权限。
- 模型处理先复制完整当前投影、走同实例原配色，严格校验完整结果后重读全投影；消息/附件/世界/来源/字节变化拒绝释放，无重试或跨调用缓存。原异常与取消 reason 保原对象/cause；native 按实际 message/Error: 文本及可选 HarnessError info 展示，不声称序列化保 identity。
- native 输出 raw schema 使用布尔 additionalProperties 和显式 enum/const type；本方完整严格校验仍核每个修订键值。完整规范 JSON 结果就是实际模型提示，仍需提案校验。
- 无材质源时工具仍注册；materialSources 缺省、undefined、null 或合法源无可用候选材质，execute 在解码前拒绝为 CAPABILITY_UNAVAILABLE。已提供但格式错误或过期的源保留合约错误，不用历史结果兜底。
- 配色：sharp 解码，color-diff 1.4.0 的 CIEDE2000，零模型调用、零写世界。
- 设置：可选 maxBytes、maxPixels、formats，默认33554432字节/16777216像素/png jpeg webp；主图和KNOWN纹理共用本实例预算。旧模型路由和CreateBuildPlan路径已归档。
- 非对象配置立即 TypeError，不静默注册默认预算；native 描述和 typed limits 同源于当前实例配置。
- 版本：session/v5+ReferenceBrief/v5或session/v6+ReferenceBrief/v6，混版和错误摘要域拒绝。v6确认/首末事实由原调用方携入，不增加来源读取服务或权限。

接入、输入形状、错误码、模拟事实端口和测试命令见 README.md。
