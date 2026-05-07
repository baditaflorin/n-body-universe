import { wrap, type Remote } from "comlink";
import type { SimulationWorkerApi } from "./simulation.worker";

export function createSimulationWorker() {
  const worker = new Worker(new URL("./simulation.worker.ts", import.meta.url), {
    type: "module",
    name: "rebound-simulation-worker",
  });

  return {
    api: wrap<SimulationWorkerApi>(worker),
    dispose: () => worker.terminate(),
  };
}

export type SimulationWorkerRemote = Remote<SimulationWorkerApi>;
