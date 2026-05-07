import { describe, expect, it } from "vitest";
import { circularVelocity, findResonances, nearestResonanceTarget } from "./orbitalMath";

describe("orbital math", () => {
  it("creates perpendicular circular velocities", () => {
    const [vx, vy] = circularVelocity(4, 9, 3, 0);

    expect(vx).toBeCloseTo(0);
    expect(vy).toBeCloseTo(Math.sqrt(12));
  });

  it("finds nearest simple period resonances", () => {
    const target = nearestResonanceTarget(1.51);

    expect(target?.label).toBe("3:2");
    expect(target?.error).toBeLessThan(0.01);
  });

  it("sorts resonance pairs by closeness", () => {
    const resonances = findResonances([
      {
        id: 1,
        name: "Star",
        color: "#fff",
        mass: 1,
        radius: 1,
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        speed: 0,
        period: 0,
      },
      {
        id: 2,
        name: "Inner",
        color: "#fff",
        mass: 1,
        radius: 1,
        position: [1, 0, 0],
        velocity: [0, 1, 0],
        speed: 1,
        period: 1,
      },
      {
        id: 3,
        name: "Outer",
        color: "#fff",
        mass: 1,
        radius: 1,
        position: [2, 0, 0],
        velocity: [0, 1, 0],
        speed: 1,
        period: 1.5,
      },
    ]);

    expect(resonances[0]?.label).toBe("3:2");
  });
});
