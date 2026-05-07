import {
  ACESFilmicToneMapping,
  Color,
  SRGBColorSpace,
  WebGLRenderer,
  type WebGLRendererParameters,
} from "three";
import type { RendererMode } from "../simulation/types";

export type SceneRenderer = Pick<
  WebGLRenderer,
  "dispose" | "render" | "setClearColor" | "setPixelRatio" | "setSize"
> & {
  init?: () => Promise<void>;
  outputColorSpace: WebGLRenderer["outputColorSpace"];
  toneMapping: WebGLRenderer["toneMapping"];
};

export async function createBestRenderer(canvas: HTMLCanvasElement): Promise<{
  renderer: SceneRenderer;
  mode: RendererMode;
}> {
  const params: WebGLRendererParameters = {
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  };

  if ("gpu" in navigator) {
    try {
      const webgpu = (await import("three/webgpu")) as unknown as {
        WebGPURenderer: new (options: WebGLRendererParameters) => SceneRenderer;
      };
      const renderer = new webgpu.WebGPURenderer(params);
      await renderer.init?.();
      configureRenderer(renderer);
      return { renderer, mode: "webgpu" };
    } catch {
      // WebGPU support varies by browser and GPU driver; WebGL is the stable fallback.
    }
  }

  const renderer = new WebGLRenderer(params);
  configureRenderer(renderer);
  return { renderer, mode: "webgl" };
}

function configureRenderer(renderer: SceneRenderer) {
  renderer.setClearColor(new Color("#06111d"), 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
