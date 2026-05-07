import { resonanceTargets } from "./constants";
import type { BodySeed, ResonancePair, SimBody } from "./types";

export function circularVelocity(
  gravitationalConstant: number,
  centralMass: number,
  x: number,
  y: number,
  clockwise = false,
): [number, number, number] {
  const radius = Math.hypot(x, y);
  if (radius === 0) {
    return [0, 0, 0];
  }

  const speed = Math.sqrt((gravitationalConstant * centralMass) / radius);
  const direction = clockwise ? -1 : 1;
  return [(-direction * y * speed) / radius, (direction * x * speed) / radius, 0];
}

export function bodySpeed(body: Pick<SimBody, "velocity"> | Pick<BodySeed, "velocity">) {
  return Math.hypot(body.velocity[0], body.velocity[1], body.velocity[2]);
}

export function findResonances(bodies: SimBody[], maxPairs = 5): ResonancePair[] {
  const orbiters = bodies
    .filter((body) => body.period > 0 && Number.isFinite(body.period))
    .sort((a, b) => a.period - b.period);

  const pairs: ResonancePair[] = [];
  for (let i = 0; i < orbiters.length - 1; i += 1) {
    for (let j = i + 1; j < orbiters.length; j += 1) {
      const inner = orbiters[i];
      const outer = orbiters[j];
      const ratio = outer.period / inner.period;
      const target = nearestResonanceTarget(ratio);
      if (!target || target.error > 0.06) {
        continue;
      }

      pairs.push({
        innerId: inner.id,
        outerId: outer.id,
        innerName: inner.name,
        outerName: outer.name,
        ratio,
        label: target.label,
        error: target.error,
      });
    }
  }

  return pairs.sort((a, b) => a.error - b.error).slice(0, maxPairs);
}

export function nearestResonanceTarget(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return null;
  }

  return resonanceTargets
    .map((target) => ({
      ...target,
      error: Math.abs(ratio - target.value) / target.value,
    }))
    .sort((a, b) => a.error - b.error)[0];
}

export function formatScientific(value: number, digits = 2) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  if (Math.abs(value) >= 1_000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) {
    return value.toExponential(digits);
  }

  return value.toFixed(digits);
}

export function nextBodyId(bodies: readonly BodySeed[]) {
  return bodies.reduce((max, body) => Math.max(max, body.id), 0) + 1;
}
