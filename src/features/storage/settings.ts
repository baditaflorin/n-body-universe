import { z } from "zod";
import { defaultSettings } from "../simulation/constants";
import type { BodySeed, SimulationSettings, StoredUniverse } from "../simulation/types";

const storageKey = "n-body-universe:v1";

const vectorSchema = z.tuple([z.number(), z.number(), z.number()]);

const bodySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  color: z.string().min(1),
  mass: z.number().positive(),
  radius: z.number().positive(),
  position: vectorSchema,
  velocity: vectorSchema,
});

const settingsSchema = z.object({
  integrator: z.enum(["ias15", "whfast", "leapfrog"]),
  speed: z.number().min(1).max(30),
  timeStep: z.number().min(0.0001).max(0.05),
  soundEnabled: z.boolean(),
});

const storedUniverseSchema = z.object({
  version: z.literal(1),
  presetId: z.string(),
  bodies: z.array(bodySchema).min(1),
  settings: settingsSchema,
});

export function loadStoredUniverse(): StoredUniverse | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  const parsed: unknown = JSON.parse(raw);
  const result = storedUniverseSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function saveStoredUniverse(
  presetId: string,
  bodies: readonly BodySeed[],
  settings: SimulationSettings,
) {
  const payload: StoredUniverse = {
    version: 1,
    presetId,
    bodies: bodies.map((body) => ({
      ...body,
      position: [...body.position],
      velocity: [...body.velocity],
    })),
    settings,
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
}

export function loadStoredSettings(): SimulationSettings {
  try {
    const stored = loadStoredUniverse();
    return stored?.settings ?? defaultSettings;
  } catch {
    return defaultSettings;
  }
}
