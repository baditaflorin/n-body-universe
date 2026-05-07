export type IntegratorId = "ias15" | "whfast" | "leapfrog";

export type RendererMode = "webgpu" | "webgl";

export interface BodySeed {
  id: number;
  name: string;
  color: string;
  mass: number;
  radius: number;
  position: [number, number, number];
  velocity: [number, number, number];
}

export interface SimBody extends BodySeed {
  period: number;
  speed: number;
}

export interface UniversePreset {
  id: string;
  name: string;
  description: string;
  gravitationalConstant: number;
  timeStep: number;
  cameraDistance: number;
  bodies: BodySeed[];
}

export interface SimulationSnapshot {
  status: "idle" | "loading" | "ready" | "error";
  time: number;
  bodies: SimBody[];
  energy: number;
  initialEnergy: number;
  energyDrift: number;
  integrator: IntegratorId;
  reboundVersion: string;
}

export interface ResonancePair {
  innerId: number;
  outerId: number;
  innerName: string;
  outerName: string;
  ratio: number;
  label: string;
  error: number;
}

export interface SimulationSettings {
  integrator: IntegratorId;
  speed: number;
  timeStep: number;
  soundEnabled: boolean;
}

export interface StoredUniverse {
  version: 1;
  presetId: string;
  bodies: BodySeed[];
  settings: SimulationSettings;
}
