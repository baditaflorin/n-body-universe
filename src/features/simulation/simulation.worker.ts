import { expose } from "comlink";
import { ReboundKernel } from "./rebound/reboundKernel";
import type { BodySeed, IntegratorId } from "./types";

const kernel = new ReboundKernel();

const api = {
  initialize: () => kernel.initialize(),
  loadUniverse: (
    bodies: BodySeed[],
    gravitationalConstant: number,
    timeStep: number,
    integrator: IntegratorId,
  ) => kernel.loadUniverse(bodies, gravitationalConstant, timeStep, integrator),
  step: (timeStep: number, steps: number) => kernel.step(timeStep, steps),
};

export type SimulationWorkerApi = typeof api;

expose(api);
