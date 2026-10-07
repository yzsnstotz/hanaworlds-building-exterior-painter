# 图片 → 材质 · 本机独立网页

入口：<http://127.0.0.1:47603/image>。

这是 Painter 自带的开发服务。网页加载原 `image-material-panel/client.cjs`，仅把它的公开图片请求适配为本机 HTTP；服务端调用原 `engine.mjs` 和冻结的 Painter 0.4.0。原 App 面板保留，App 内整合不属于这个网页。

此网页没有世界绑定，首屏与每个结果都明确标出「示例材质表」。图片原始字节通过 JSON Base64 交给本机 Node 服务取色；浏览器不计算主色，服务不调用模型或写入世界。当前世界分支留给后续公开宿主整合。

在仓根目录准备依赖（Node 24）：

```sh
npm ci --prefix image-material-panel
npm ci --prefix image-material-web
```

启动：

```sh
npm start --prefix image-material-web
```

仅监听 `127.0.0.1:47603`。端口占用会直接报错，不占用其他卡的服务或自动切换端口。打开网页，选择或拖入图片；显示缩略图、主色、合法示例材质及色块。相同输入与材质来源保持确定性，非图片显示原因并清除旧结果。按 Ctrl+C 正常停止服务。

新 HTTP 宿主的传输检查：`node --test test/image-web.test.mjs`。它检查页面/原面板字节、真实 PNG HTTP 调用与来源边界；不代替浏览器主流程。

许可：本代码 MIT；React 18.2.0、React DOM 18.2.0、scheduler 0.23.2、loose-envify 1.4.0、js-tokens 4.0.0 均 MIT，来自官方 npm registry，仅用于本地呈现原面板；对应 LICENSE 随本机依赖保留。既有 Painter/Sharp/Contracts 许可与来源继续使用 `image-material-panel/LICENSE_AUDIT.md`，未新增模型或纹理数据。
