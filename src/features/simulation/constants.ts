import type { IntegratorId } from "./types";

export const integratorCodes: Record<IntegratorId, number> = {
  ias15: 0,
  whfast: 1,
  leapfrog: 4,
};

export const integratorLabels: Record<IntegratorId, string> = {
  ias15: "IAS15",
  whfast: "WHFast",
  leapfrog: "Leapfrog",
};

export const defaultSettings = {
  integrator: "ias15",
  speed: 5,
  timeStep: 0.002,
  soundEnabled: false,
} satisfies {
  integrator: IntegratorId;
  speed: number;
  timeStep: number;
  soundEnabled: boolean;
};

export const resonanceTargets = [
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "5:3", value: 5 / 3 },
  { label: "2:1", value: 2 },
  { label: "5:2", value: 5 / 2 },
  { label: "3:1", value: 3 },
  { label: "4:1", value: 4 },
] as const;
