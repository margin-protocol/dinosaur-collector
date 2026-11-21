# MediaPipe Tasks Vision（外出合照臉部特效用）

- 套件：`@mediapipe/tasks-vision` 0.10.21（npm），只放了 `vision_bundle.mjs` 和 SIMD 版 wasm（`vision_wasm_internal.js/.wasm`）
- 模型：`face_landmarker.task`（Face Landmarker float16 v1，Google 官方模型）
- 授權：Apache License 2.0（https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE）
- 放在自己的網站上而不是 CDN：離線也能用、照片和畫面都只在手機上算，不會傳出去
- 不支援 SIMD 的舊瀏覽器直接關掉臉部特效（js/face-fx.js 的 faceFxSupport），所以沒有放 nosimd 版
