import { integratorCodes } from "../constants";
import { bodySpeed } from "../orbitalMath";
import type { BodySeed, IntegratorId, SimBody, SimulationSnapshot } from "../types";

type ReboundModule = {
  cwrap: <ReturnType extends "number" | "string" | null>(
    name: string,
    returnType: ReturnType,
    argTypes: Array<"number" | "string">,
  ) => (
    ...args: number[]
  ) => ReturnType extends "number" ? number : ReturnType extends "string" ? string : void;
  HEAPF64: Float64Array;
};

type ModuleFactory = (options?: {
  locateFile?: (path: string) => string;
  print?: (text: string) => void;
  printErr?: (text: string) => void;
}) => Promise<ReboundModule>;

const particleStride = 11;

export class ReboundKernel {
  private module: ReboundModule | null = null;
  private reboundVersion = "loading";
  private bodiesById = new Map<number, BodySeed>();
  private currentIntegrator: IntegratorId = "ias15";
  private initialEnergy = 0;

  private reset: ((G: number, dt: number, integrator: number) => void) | null = null;
  private add:
    | ((
        id: number,
        mass: number,
        radius: number,
        x: number,
        y: number,
        z: number,
        vx: number,
        vy: number,
        vz: number,
      ) => number)
    | null = null;
  private moveToCom: (() => void) | null = null;
  private stepKernel: ((dt: number, steps: number) => number) | null = null;
  private count: (() => number) | null = null;
  private time: (() => number) | null = null;
  private energy: (() => number) | null = null;
  private bufferPtr: (() => number) | null = null;

  async initialize() {
    if (this.module) {
      return { reboundVersion: this.reboundVersion };
    }

    const base = import.meta.env.BASE_URL;
    const moduleUrl = new URL(`${base}wasm/rebound_module.js`, self.location.origin).toString();
    const wasmBase = new URL(`${base}wasm/`, self.location.origin).toString();

    let imported: { default: ModuleFactory };
    try {
      imported = (await import(/* @vite-ignore */ moduleUrl)) as { default: ModuleFactory };
    } catch (cause) {
      // The most common deploy mistake is shipping the page without the
      // wasm/ directory. Surface a message that points at it instead of the
      // raw "failed to fetch dynamic module" string from the runtime.
      throw new Error(
        `Could not load REBOUND WebAssembly module at ${moduleUrl}. ` +
          `Confirm public/wasm/rebound_module.{js,wasm} is present in the build output.`,
        { cause: cause instanceof Error ? cause : undefined },
      );
    }

    try {
      this.module = await imported.default({
        locateFile: (path) => `${wasmBase}${path}`,
        print: () => undefined,
        printErr: (text) => {
          if (import.meta.env.DEV) {
            console.warn(text);
          }
        },
      });
    } catch (cause) {
      throw new Error(
        `REBOUND WebAssembly module failed to instantiate. The browser may lack ` +
          `WebAssembly support, or the .wasm file at ${wasmBase}rebound_module.wasm ` +
          `is missing or corrupted.`,
        { cause: cause instanceof Error ? cause : undefined },
      );
    }

    this.reset = this.module.cwrap("nu_reset", null, ["number", "number", "number"]);
    this.add = this.module.cwrap("nu_add_particle", "number", [
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
    ]);
    this.moveToCom = this.module.cwrap("nu_move_to_com", null, []);
    this.stepKernel = this.module.cwrap("nu_step", "number", ["number", "number"]);
    this.count = this.module.cwrap("nu_particle_count", "number", []);
    this.time = this.module.cwrap("nu_time", "number", []);
    this.energy = this.module.cwrap("nu_energy", "number", []);
    this.bufferPtr = this.module.cwrap("nu_get_particle_buffer", "number", []);
    const version = this.module.cwrap("nu_rebound_version", "string", []);
    this.reboundVersion = version();

    return { reboundVersion: this.reboundVersion };
  }

  loadUniverse(
    bodies: BodySeed[],
    gravitationalConstant: number,
    timeStep: number,
    integrator: IntegratorId,
  ): SimulationSnapshot {
    this.requireReady();
    this.currentIntegrator = integrator;
    this.bodiesById = new Map(bodies.map((body) => [body.id, body]));
    this.reset?.(gravitationalConstant, timeStep, integratorCodes[integrator]);

    for (const body of bodies) {
      this.add?.(
        body.id,
        body.mass,
        body.radius,
        body.position[0],
        body.position[1],
        body.position[2],
        body.velocity[0],
        body.velocity[1],
        body.velocity[2],
      );
    }
    this.moveToCom?.();
    this.initialEnergy = this.energy?.() ?? 0;
    return this.snapshot();
  }

  step(timeStep: number, steps: number): SimulationSnapshot {
    this.requireReady();
    const result = this.stepKernel?.(timeStep, steps) ?? 0;
    if (result !== 0) {
      throw new Error(`REBOUND integration failed with status ${result}`);
    }
    return this.snapshot();
  }

  private snapshot(): SimulationSnapshot {
    const module = this.requireReady();
    const count = this.count?.() ?? 0;
    const ptr = this.bufferPtr?.() ?? 0;
    const offset = ptr / Float64Array.BYTES_PER_ELEMENT;
    const raw = module.HEAPF64.subarray(offset, offset + count * particleStride);

    const bodies: SimBody[] = [];
    for (let i = 0; i < count; i += 1) {
      const base = i * particleStride;
      const id = raw[base];
      const seed = this.bodiesById.get(id);
      const body = {
        id,
        name: seed?.name ?? `Body ${id}`,
        color: seed?.color ?? "#ffffff",
        mass: raw[base + 1],
        radius: raw[base + 2],
        position: [raw[base + 3], raw[base + 4], raw[base + 5]] as [number, number, number],
        velocity: [raw[base + 6], raw[base + 7], raw[base + 8]] as [number, number, number],
        period: raw[base + 9],
        speed: raw[base + 10],
      };
      bodies.push({ ...body, speed: bodySpeed(body) });
      this.bodiesById.set(id, body);
    }

    const energy = this.energy?.() ?? 0;
    const energyDrift =
      this.initialEnergy === 0 ? 0 : Math.abs((energy - this.initialEnergy) / this.initialEnergy);

    return {
      status: "ready",
      time: this.time?.() ?? 0,
      bodies,
      energy,
      initialEnergy: this.initialEnergy,
      energyDrift,
      integrator: this.currentIntegrator,
      reboundVersion: this.reboundVersion,
    };
  }

  private requireReady() {
    if (!this.module) {
      throw new Error("REBOUND WASM module is not initialized");
    }
    return this.module;
  }
}
