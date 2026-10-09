# 图片 → 材质

Painter 同仓独立开发面板。经 HanaWorlds 的「插件」页 Add plugin 安装本包，再启用。

未绑定世界时使用内置已测颜色索引与明示示例静态 Catalogue，显示「示例材质表」。绑定世界时通过 Desktop Host 的 `hanaworldsSkillBusiness`、`hanaworldsCatalogue` 公共服务读取当前材质事实；缺失或过期时给原因，不回退到示例。

输入文件原始字节用标准 Base64 JSON 字段通过 Connection `/api/hanaworldsImageMaterialPanel/{sampleImage,sessionImage}` 传到 Host。SRC 自动解析 `session` 参数为官方 Session lookup；Host 使用 Painter 0.5.2（取色/匹配算法同 0.4.0）原方法，浏览器不计算颜色。无模型、无世界写入。沿用 Painter 的单帧 PNG/JPEG/WebP、32 MiB/16777216 像素限制。

依赖的 Painter 0.5.2 tar 由同 origin 源码用 `tools/repack-panel-painter.sh` 重新打包（F-PAINTER-VALIDATE-01 合约 major 1 适配），合约按大版本范围依赖已发布的 hanaworlds-contracts `^1.0.0`（不钉 commit；当前解析正式 v1.0.0），包内不带 vendor 合约副本；取色与匹配算法未改。不修改或解锁安装器自带 Painter 包。

安装时使用 `hanaworlds-painter-image-material-panel-0.2.2.tgz` 的绝对路径，不使用源码目录 link。公开 Host SDK peer 必须由包管理器解析：`@deepseek-ai/cordis@4.0.4`、`@deepseek-ai/dsh-typert-protocol@0.2.0-rc.2`；缺 peer 不能启用。

面板 tar 的 bundledDependencies 随包携带同 origin Painter 0.5.2 与打包时解析的 hanaworlds-contracts（`^1.0.0` 范围内）及其既有图像依赖，避免安装阶段访问尚未展开的内嵌 file tar。公开 Cordis/Remote SDK 是必需 peer，保持由产品宿主解析，不随包复制 SDK。
