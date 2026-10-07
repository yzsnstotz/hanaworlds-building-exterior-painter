# 图片 → 材质

Painter 同仓独立开发面板。经 HanaWorlds 的「插件」页 Add plugin 安装本包，再启用。

未绑定世界时使用内置已测颜色索引与明示示例静态 Catalogue，显示「示例材质表」。绑定世界时通过 Desktop Host 的 `hanaworldsSkillBusiness`、`hanaworldsCatalogue` 公共服务读取当前材质事实；缺失或过期时给原因，不回退到示例。

输入文件原始字节用标准 Base64 JSON 字段通过 Connection `/api/hanaworldsImageMaterialPanel/{sampleImage,sessionImage}` 传到 Host。SRC 自动解析 `session` 参数为官方 Session lookup；Host 使用 Painter 0.4.0 原方法，浏览器不计算颜色。无模型、无世界写入。沿用 Painter 的单帧 PNG/JPEG/WebP、32 MiB/16777216 像素限制。

依赖的 Painter 0.4.0 tar 是同 origin 的冻结原实现，base commit `2aa55c7fe55d68b6ec839b3c6c0c9a204a8a3dab`。不修改或解锁安装器自带 Painter 包。
