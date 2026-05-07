import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createBestRenderer, type SceneRenderer } from "./createRenderer";
import type { BodySeed, RendererMode, SimulationSnapshot } from "../simulation/types";

interface UniverseSceneProps {
  snapshot: SimulationSnapshot | null;
  cameraDistance: number;
  dropMode: boolean;
  selectedBodyId: number | null;
  onDropBody: (x: number, y: number) => void;
  onSelectBody: (id: number | null) => void;
  onRendererMode: (mode: RendererMode) => void;
}

interface BodyMesh {
  mesh: Mesh<SphereGeometry, MeshStandardMaterial>;
  trail: Line<BufferGeometry, LineBasicMaterial>;
  history: Vector3[];
}

export function UniverseScene({
  snapshot,
  cameraDistance,
  dropMode,
  selectedBodyId,
  onDropBody,
  onSelectBody,
  onRendererMode,
}: UniverseSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotRef = useRef(snapshot);
  const selectedRef = useRef(selectedBodyId);
  const dropModeRef = useRef(dropMode);
  const onDropRef = useRef(onDropBody);
  const onSelectRef = useRef(onSelectBody);
  const cameraDistanceRef = useRef(cameraDistance);

  snapshotRef.current = snapshot;
  selectedRef.current = selectedBodyId;
  dropModeRef.current = dropMode;
  onDropRef.current = onDropBody;
  onSelectRef.current = onSelectBody;
  cameraDistanceRef.current = cameraDistance;

  const hint = useMemo(
    () =>
      dropMode ? "Click the orbital plane to drop a body" : "Double-click a body to inspect it",
    [dropMode],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const canvasElement = canvas;

    let disposed = false;
    let renderer: SceneRenderer | null = null;
    let frame = 0;
    const scene = new Scene();
    scene.background = new Color("#06111d");
    const camera = new PerspectiveCamera(50, 1, 0.01, 200);
    camera.position.set(0, cameraDistanceRef.current * 0.8, cameraDistanceRef.current);
    const bodies = new Map<number, BodyMesh>();
    const group = new Group();
    scene.add(group);
    scene.add(new AmbientLight("#b7d8ff", 1.1));
    const light = new DirectionalLight("#fff1cf", 2.4);
    light.position.set(4, 8, 6);
    scene.add(light);
    scene.add(createStarfield());
    scene.add(createOrbitPlane());
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const plane = new Plane(new Vector3(0, 1, 0), 0);
    const intersection = new Vector3();

    let controls: OrbitControls | null = null;

    createBestRenderer(canvasElement)
      .then((result) => {
        if (disposed) {
          result.renderer.dispose();
          return;
        }
        renderer = result.renderer;
        onRendererMode(result.mode);
        controls = new OrbitControls(camera, canvasElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.minDistance = 0.2;
        controls.maxDistance = 40;
        resize();
        animate();
      })
      .catch(() => onRendererMode("webgl"));

    function resize() {
      if (!renderer || !canvasElement.parentElement) {
        return;
      }
      const width = canvasElement.parentElement.clientWidth;
      const height = canvasElement.parentElement.clientHeight;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function animate() {
      if (disposed || !renderer) {
        return;
      }

      frame = requestAnimationFrame(animate);
      syncBodies(group, bodies, snapshotRef.current, selectedRef.current);
      controls?.update();
      renderer.render(scene, camera);
    }

    function onClick(event: MouseEvent) {
      const rect = canvasElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      if (dropModeRef.current) {
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          onDropRef.current(intersection.x, intersection.z);
        }
        return;
      }

      const meshes = [...bodies.values()].map((entry) => entry.mesh);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      onSelectRef.current(hit ? Number(hit.object.userData.bodyId) : null);
    }

    canvasElement.addEventListener("click", onClick);
    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      canvasElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
      controls?.dispose();
      for (const body of bodies.values()) {
        body.mesh.geometry.dispose();
        body.mesh.material.dispose();
        body.trail.geometry.dispose();
        body.trail.material.dispose();
      }
      renderer?.dispose();
    };
  }, [onRendererMode]);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden bg-[#06111d]">
      <canvas
        aria-label="Interactive n-body universe"
        className={`h-full w-full ${dropMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
        ref={canvasRef}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-slate-950/55 px-3 py-2 text-xs text-slate-200 backdrop-blur">
        {hint}
      </div>
    </div>
  );
}

function syncBodies(
  group: Group,
  entries: Map<number, BodyMesh>,
  snapshot: SimulationSnapshot | null,
  selectedId: number | null,
) {
  const active = new Set<number>();
  for (const body of snapshot?.bodies ?? []) {
    active.add(body.id);
    let entry = entries.get(body.id);
    if (!entry) {
      entry = createBodyMesh(body);
      entries.set(body.id, entry);
      group.add(entry.mesh);
      group.add(entry.trail);
    }

    const rendered = toScenePosition(body.position);
    entry.mesh.position.copy(rendered);
    const scale = body.id === selectedId ? 1.45 : 1;
    entry.mesh.scale.setScalar(scale);
    entry.mesh.material.emissiveIntensity = body.id === selectedId ? 0.8 : 0.2;
    entry.history.push(rendered.clone());
    if (entry.history.length > 260) {
      entry.history.shift();
    }
    const positions = new Float32Array(entry.history.length * 3);
    entry.history.forEach((point, index) => {
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
    });
    entry.trail.geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    entry.trail.geometry.computeBoundingSphere();
  }

  for (const [id, entry] of entries) {
    if (!active.has(id)) {
      group.remove(entry.mesh);
      group.remove(entry.trail);
      entry.mesh.geometry.dispose();
      entry.mesh.material.dispose();
      entry.trail.geometry.dispose();
      entry.trail.material.dispose();
      entries.delete(id);
    }
  }
}

function createBodyMesh(body: BodySeed): BodyMesh {
  const geometry = new SphereGeometry(Math.max(body.radius, 0.01), 24, 16);
  const material = new MeshStandardMaterial({
    color: body.color,
    emissive: body.color,
    emissiveIntensity: body.mass > 0.01 ? 1.1 : 0.2,
    roughness: 0.48,
    metalness: 0.05,
  });
  const mesh = new Mesh(geometry, material);
  mesh.userData.bodyId = body.id;

  const trail = new Line(
    new BufferGeometry(),
    new LineBasicMaterial({
      color: body.color,
      transparent: true,
      opacity: body.mass > 0.01 ? 0.18 : 0.34,
    }),
  );

  return { mesh, trail, history: [] };
}

function toScenePosition(position: [number, number, number]) {
  return new Vector3(position[0], position[2], position[1]);
}

function createStarfield() {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  for (let i = 0; i < 900; i += 1) {
    const radius = 18 + Math.random() * 42;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return new Points(
    geometry,
    new PointsMaterial({
      color: "#dbeafe",
      size: 0.035,
      transparent: true,
      opacity: 0.58,
      blending: AdditiveBlending,
    }),
  );
}

function createOrbitPlane() {
  const geometry = new BufferGeometry();
  const points: number[] = [];
  const size = 5;
  for (let i = -size; i <= size; i += 1) {
    points.push(-size, 0, i, size, 0, i, i, 0, -size, i, 0, size);
  }
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  return new Line(
    geometry,
    new LineBasicMaterial({
      color: "#5eead4",
      transparent: true,
      opacity: 0.08,
    }),
  );
}
