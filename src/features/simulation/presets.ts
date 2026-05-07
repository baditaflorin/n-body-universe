import { circularVelocity } from "./orbitalMath";
import type { BodySeed, UniversePreset } from "./types";

const G = 39.47841760435743;

function planet(
  id: number,
  name: string,
  color: string,
  mass: number,
  radius: number,
  orbitRadius: number,
  phase: number,
  centralMass = 1,
): BodySeed {
  const x = Math.cos(phase) * orbitRadius;
  const y = Math.sin(phase) * orbitRadius;
  return {
    id,
    name,
    color,
    mass,
    radius,
    position: [x, y, 0],
    velocity: circularVelocity(G, centralMass, x, y),
  };
}

function moon(
  id: number,
  name: string,
  color: string,
  mass: number,
  radius: number,
  parent: BodySeed,
  orbitRadius: number,
  phase: number,
  parentMass: number,
): BodySeed {
  const dx = Math.cos(phase) * orbitRadius;
  const dy = Math.sin(phase) * orbitRadius;
  const [dvx, dvy, dvz] = circularVelocity(G, parentMass, dx, dy);

  return {
    id,
    name,
    color,
    mass,
    radius,
    position: [parent.position[0] + dx, parent.position[1] + dy, 0],
    velocity: [parent.velocity[0] + dvx, parent.velocity[1] + dvy, parent.velocity[2] + dvz],
  };
}

function star(id = 1, mass = 1, radius = 0.16): BodySeed {
  return {
    id,
    name: "Primary",
    color: "#ffd166",
    mass,
    radius,
    position: [0, 0, 0],
    velocity: [0, 0, 0],
  };
}

function makeSwarm(count: number): BodySeed[] {
  const bodies: BodySeed[] = [star(1, 1, 0.18)];
  for (let i = 0; i < count; i += 1) {
    const ring = i % 5;
    const phase = i * 2.399963229728653;
    const orbitRadius = 0.48 + ring * 0.22 + (i % 7) * 0.01;
    const body = planet(
      i + 2,
      `Moon ${String(i + 1).padStart(3, "0")}`,
      i % 3 === 0 ? "#6ee7f9" : i % 3 === 1 ? "#fca5a5" : "#a7f3d0",
      0.0000015 + (i % 11) * 0.0000002,
      0.012 + (i % 5) * 0.002,
      orbitRadius,
      phase,
    );
    body.velocity[0] *= 0.97 + (i % 9) * 0.006;
    body.velocity[1] *= 0.97 + (i % 9) * 0.006;
    body.position[2] = Math.sin(i * 1.7) * 0.025;
    bodies.push(body);
  }
  return bodies;
}

const jupiter = planet(2, "Jupiter", "#f7b267", 0.0009543, 0.09, 1.0, 0.15);
const io = moon(3, "Io", "#fff3a3", 0.000000047, 0.022, jupiter, 0.12, 0, jupiter.mass);
const europa = moon(4, "Europa", "#cde7ff", 0.000000025, 0.019, jupiter, 0.19, 1.2, jupiter.mass);
const ganymede = moon(
  5,
  "Ganymede",
  "#b7b0a5",
  0.000000075,
  0.026,
  jupiter,
  0.3,
  2.1,
  jupiter.mass,
);

export const presets: UniversePreset[] = [
  {
    id: "resonant-chain",
    name: "Resonant Chain",
    description: "A compact star system tuned near 3:2 and 2:1 period ratios.",
    gravitationalConstant: G,
    timeStep: 0.0018,
    cameraDistance: 3.2,
    bodies: [
      star(),
      planet(2, "Aster", "#5eead4", 0.0000032, 0.035, 0.42, 0.2),
      planet(3, "Boreal", "#93c5fd", 0.0000038, 0.039, 0.55, 2.5),
      planet(4, "Cyra", "#f9a8d4", 0.0000041, 0.043, 0.72, 4.0),
      planet(5, "Dione", "#fef08a", 0.0000027, 0.032, 1.14, 5.2),
    ],
  },
  {
    id: "trappist-ish",
    name: "TRAPPIST-1 Sketch",
    description: "A compact seven-planet teaching model inspired by TRAPPIST-1 spacing.",
    gravitationalConstant: G,
    timeStep: 0.0009,
    cameraDistance: 1.9,
    bodies: [
      star(1, 0.0898, 0.08),
      planet(2, "b", "#ffb4a2", 0.0000042, 0.021, 0.115, 0.0, 0.0898),
      planet(3, "c", "#ffc8dd", 0.0000041, 0.022, 0.158, 1.0, 0.0898),
      planet(4, "d", "#cdb4db", 0.0000014, 0.017, 0.22, 2.0, 0.0898),
      planet(5, "e", "#bde0fe", 0.0000023, 0.019, 0.29, 3.0, 0.0898),
      planet(6, "f", "#a2d2ff", 0.0000029, 0.02, 0.38, 4.0, 0.0898),
      planet(7, "g", "#8ecae6", 0.0000039, 0.021, 0.49, 5.0, 0.0898),
      planet(8, "h", "#90dbf4", 0.0000011, 0.016, 0.62, 6.0, 0.0898),
    ],
  },
  {
    id: "jovian-laplace",
    name: "Jovian Laplace",
    description: "A tiny Sun-Jupiter-moons setup with a recognizable moon-chain rhythm.",
    gravitationalConstant: G,
    timeStep: 0.0007,
    cameraDistance: 2.5,
    bodies: [star(), jupiter, io, europa, ganymede],
  },
  {
    id: "solar-mini",
    name: "Solar Mini",
    description: "A stable inner-system playground with room for dropped planets.",
    gravitationalConstant: G,
    timeStep: 0.002,
    cameraDistance: 4.2,
    bodies: [
      star(),
      planet(2, "Mercury", "#c9b8a8", 0.000000166, 0.022, 0.39, 0.1),
      planet(3, "Venus", "#f4d35e", 0.00000245, 0.035, 0.72, 1.1),
      planet(4, "Earth", "#61a5ff", 0.000003, 0.038, 1.0, 2.4),
      planet(5, "Mars", "#e76f51", 0.00000032, 0.028, 1.52, 4.0),
    ],
  },
  {
    id: "moon-swarm-500",
    name: "500 Moon Swarm",
    description: "A stress-test system of hundreds of tiny bodies with slight velocity jitter.",
    gravitationalConstant: G,
    timeStep: 0.001,
    cameraDistance: 4.8,
    bodies: makeSwarm(500),
  },
];

export const defaultPreset = presets[0];

export function cloneBodies(bodies: readonly BodySeed[]) {
  return bodies.map((body) => ({
    ...body,
    position: [...body.position] as [number, number, number],
    velocity: [...body.velocity] as [number, number, number],
  }));
}
