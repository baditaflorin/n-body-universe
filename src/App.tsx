import {
  Activity,
  CircleDollarSign,
  Github,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildInfo } from "./config/buildInfo";
import { OrbitalAudio } from "./features/audio/OrbitalAudio";
import { integratorLabels } from "./features/simulation/constants";
import {
  createSimulationWorker,
  type SimulationWorkerRemote,
} from "./features/simulation/SimulationWorkerClient";
import { cloneBodies, defaultPreset, presets } from "./features/simulation/presets";
import {
  circularVelocity,
  findResonances,
  formatScientific,
  nextBodyId,
} from "./features/simulation/orbitalMath";
import type {
  BodySeed,
  IntegratorId,
  RendererMode,
  SimulationSettings,
  SimulationSnapshot,
  UniversePreset,
} from "./features/simulation/types";
import { defaultSettings } from "./features/simulation/constants";
import { loadStoredUniverse, saveStoredUniverse } from "./features/storage/settings";
import { ToastStack, type ToastMessage } from "./ui/Toast";

const UniverseScene = lazy(() =>
  import("./features/scene/UniverseScene").then((module) => ({ default: module.UniverseScene })),
);

const loadingSnapshot: SimulationSnapshot = {
  status: "loading",
  time: 0,
  bodies: [],
  energy: 0,
  initialEnergy: 0,
  energyDrift: 0,
  integrator: "ias15",
  reboundVersion: "loading",
};

export function App() {
  const stored = useMemo(() => safeLoadStoredUniverse(), []);
  const initialPreset = useMemo(
    () => presets.find((preset) => preset.id === stored?.presetId) ?? defaultPreset,
    [stored],
  );
  const [preset, setPreset] = useState<UniversePreset>(initialPreset);
  const [seedBodies, setSeedBodies] = useState<BodySeed[]>(
    stored?.bodies ? cloneBodies(stored.bodies) : cloneBodies(initialPreset.bodies),
  );
  const [settings, setSettings] = useState<SimulationSettings>(
    stored?.settings ?? { ...defaultSettings, timeStep: initialPreset.timeStep },
  );
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [running, setRunning] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [dropMode, setDropMode] = useState(false);
  const [rendererMode, setRendererMode] = useState<RendererMode>("webgl");
  const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [fps, setFps] = useState(0);
  const workerRef = useRef<{ api: SimulationWorkerRemote; dispose: () => void } | null>(null);
  const snapshotRef = useRef<SimulationSnapshot | null>(null);
  const settingsRef = useRef(settings);
  const seedBodiesRef = useRef(seedBodies);
  const presetRef = useRef(preset);
  const steppingRef = useRef(false);
  const audioRef = useRef(new OrbitalAudio());

  snapshotRef.current = snapshot;
  settingsRef.current = settings;
  seedBodiesRef.current = seedBodies;
  presetRef.current = preset;

  const selectedBody = snapshot?.bodies.find((body) => body.id === selectedBodyId) ?? null;
  const resonances = useMemo(() => findResonances(snapshot?.bodies ?? []), [snapshot]);

  const pushToast = useCallback((tone: ToastMessage["tone"], text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 10_000);
    setToasts((current) => [...current, { id, tone, text }].slice(-3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((message) => message.id !== id));
    }, 5200);
  }, []);

  const reloadUniverse = useCallback(
    async (
      bodies: BodySeed[],
      nextPreset = presetRef.current,
      nextSettings = settingsRef.current,
    ) => {
      const worker = workerRef.current;
      if (!worker) {
        return;
      }

      const loaded = await worker.api.loadUniverse(
        cloneBodies(bodies),
        nextPreset.gravitationalConstant,
        nextSettings.timeStep,
        nextSettings.integrator,
      );
      setSnapshot(loaded);
    },
    [],
  );

  const startSimulator = useCallback(async () => {
    try {
      setSnapshot(loadingSnapshot);
      if (!workerRef.current) {
        workerRef.current = createSimulationWorker();
      }
      await workerRef.current.api.initialize();
      setWorkerReady(true);
      await reloadUniverse(seedBodiesRef.current, presetRef.current, settingsRef.current);
      setRunning(true);
      pushToast("success", "REBOUND WASM initialized in a worker.");
    } catch (error) {
      setSnapshot({ ...loadingSnapshot, status: "error" });
      pushToast(
        "error",
        error instanceof Error ? error.message : "Failed to initialize simulator.",
      );
    }
  }, [pushToast, reloadUniverse]);

  const selectPreset = useCallback(
    async (presetId: string) => {
      const nextPreset = presets.find((candidate) => candidate.id === presetId) ?? defaultPreset;
      const nextBodies = cloneBodies(nextPreset.bodies);
      const nextSettings = { ...settingsRef.current, timeStep: nextPreset.timeStep };
      setPreset(nextPreset);
      setSeedBodies(nextBodies);
      setSettings(nextSettings);
      setSelectedBodyId(null);
      if (workerReady) {
        await reloadUniverse(nextBodies, nextPreset, nextSettings);
      }
      pushToast("info", `${nextPreset.name} loaded.`);
    },
    [pushToast, reloadUniverse, workerReady],
  );

  const resetCurrent = useCallback(async () => {
    const nextBodies = cloneBodies(presetRef.current.bodies);
    setSeedBodies(nextBodies);
    setSelectedBodyId(null);
    if (workerReady) {
      await reloadUniverse(nextBodies, presetRef.current, settingsRef.current);
    }
  }, [reloadUniverse, workerReady]);

  const dropBody = useCallback(
    async (x: number, y: number) => {
      const bodies = seedBodiesRef.current;
      const central = bodies[0];
      const id = nextBodyId(bodies);
      const [vx, vy, vz] = circularVelocity(
        presetRef.current.gravitationalConstant,
        Math.max(central?.mass ?? 1, 0.0001),
        x,
        y,
        id % 2 === 0,
      );
      const body: BodySeed = {
        id,
        name: `Drop ${id}`,
        color: id % 3 === 0 ? "#fca5a5" : id % 3 === 1 ? "#86efac" : "#93c5fd",
        mass: 0.000002 + (id % 5) * 0.0000008,
        radius: 0.026,
        position: [x, y, 0],
        velocity: [vx, vy, vz],
      };
      const nextBodies = [...bodies, body];
      setSeedBodies(nextBodies);
      setSelectedBodyId(id);
      if (workerReady) {
        await reloadUniverse(nextBodies, presetRef.current, settingsRef.current);
      }
      pushToast("success", `${body.name} dropped into orbit.`);
    },
    [pushToast, reloadUniverse, workerReady],
  );

  const addRandomPlanet = useCallback(async () => {
    const radius = 0.45 + Math.random() * 1.75;
    const angle = Math.random() * Math.PI * 2;
    await dropBody(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }, [dropBody]);

  const addMoonlets = useCallback(async () => {
    let bodies = seedBodiesRef.current;
    const central = bodies[0];
    const additions: BodySeed[] = [];
    for (let i = 0; i < 25; i += 1) {
      const id = nextBodyId([...bodies, ...additions]);
      const radius = 0.55 + (i % 5) * 0.17 + Math.random() * 0.04;
      const angle = i * 2.399963229728653;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const [vx, vy, vz] = circularVelocity(
        presetRef.current.gravitationalConstant,
        central?.mass ?? 1,
        x,
        y,
      );
      additions.push({
        id,
        name: `Moonlet ${id}`,
        color: i % 2 === 0 ? "#67e8f9" : "#fde68a",
        mass: 0.0000005,
        radius: 0.014,
        position: [x, y, (Math.random() - 0.5) * 0.04],
        velocity: [vx * (0.985 + Math.random() * 0.03), vy * (0.985 + Math.random() * 0.03), vz],
      });
    }
    bodies = [...bodies, ...additions];
    setSeedBodies(bodies);
    if (workerReady) {
      await reloadUniverse(bodies, presetRef.current, settingsRef.current);
    }
    pushToast("success", "Added 25 moonlets.");
  }, [pushToast, reloadUniverse, workerReady]);

  const removeSelected = useCallback(async () => {
    if (!selectedBodyId || selectedBodyId === seedBodiesRef.current[0]?.id) {
      return;
    }
    const nextBodies = seedBodiesRef.current.filter((body) => body.id !== selectedBodyId);
    setSeedBodies(nextBodies);
    setSelectedBodyId(null);
    if (workerReady) {
      await reloadUniverse(nextBodies, presetRef.current, settingsRef.current);
    }
  }, [reloadUniverse, selectedBodyId, workerReady]);

  const updateSettings = useCallback(
    async (patch: Partial<SimulationSettings>) => {
      const nextSettings = { ...settingsRef.current, ...patch };
      setSettings(nextSettings);
      if (patch.integrator || patch.timeStep) {
        await reloadUniverse(seedBodiesRef.current, presetRef.current, nextSettings);
      }
    },
    [reloadUniverse],
  );

  const toggleAudio = useCallback(async () => {
    const enabled = !settingsRef.current.soundEnabled;
    await updateSettings({ soundEnabled: enabled });
    if (enabled) {
      try {
        await audioRef.current.enable();
        if (snapshotRef.current) {
          audioRef.current.update(snapshotRef.current.bodies);
        }
        pushToast("success", "Orbital harmonics enabled.");
      } catch {
        await updateSettings({ soundEnabled: false });
        pushToast("error", "Audio could not be started by this browser.");
      }
    } else {
      audioRef.current.disable();
    }
  }, [pushToast, updateSettings]);

  const saveUniverse = useCallback(() => {
    saveStoredUniverse(presetRef.current.id, seedBodiesRef.current, settingsRef.current);
    pushToast("success", "Saved to this browser.");
  }, [pushToast]);

  useEffect(() => {
    let animation = 0;
    let frames = 0;
    let lastFps = performance.now();

    function tick(now: number) {
      animation = requestAnimationFrame(tick);
      frames += 1;
      if (now - lastFps >= 1_000) {
        setFps(Math.round((frames * 1_000) / (now - lastFps)));
        frames = 0;
        lastFps = now;
      }

      void stepSimulation();
    }

    async function stepSimulation() {
      const worker = workerRef.current;
      if (!running || !workerReady || !worker || steppingRef.current) {
        return;
      }

      steppingRef.current = true;
      try {
        const steps = Math.max(1, Math.round(settingsRef.current.speed));
        const next = await worker.api.step(settingsRef.current.timeStep, steps);
        setSnapshot(next);
        if (settingsRef.current.soundEnabled) {
          audioRef.current.update(next.bodies);
        }
      } catch (error) {
        setRunning(false);
        pushToast("error", error instanceof Error ? error.message : "Simulation step failed.");
      } finally {
        steppingRef.current = false;
      }
    }

    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [pushToast, running, workerReady]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      workerRef.current?.dispose();
      audio.disable();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#06111d] text-slate-100">
      <ToastStack
        messages={toasts}
        onDismiss={(id) => setToasts((current) => current.filter((message) => message.id !== id))}
      />

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-normal sm:text-lg">
              N-Body Universe
            </h1>
            <p className="truncate text-xs text-slate-400">
              REBOUND {snapshot?.reboundVersion ?? "WASM"} · v{buildInfo.version} ·{" "}
              <a
                className="text-cyan-200 hover:text-cyan-100"
                href={`${buildInfo.repoUrl}/commit/${buildInfo.fullCommit}`}
                rel="noreferrer"
                target="_blank"
              >
                {buildInfo.commit}
              </a>
            </p>
          </div>

          <nav className="flex shrink-0 items-center gap-2">
            <a className="icon-link" href={buildInfo.repoUrl} rel="noreferrer" target="_blank">
              <Github size={18} />
              <span>Star</span>
            </a>
            <a className="icon-link" href={buildInfo.paypalUrl} rel="noreferrer" target="_blank">
              <CircleDollarSign size={18} />
              <span>PayPal</span>
            </a>
          </nav>
        </div>
      </header>

      <section className="grid min-h-screen grid-rows-[1fr_auto] pt-16 lg:grid-cols-[320px_1fr_320px] lg:grid-rows-1">
        <aside className="panel order-2 lg:order-1">
          <div className="control-group">
            <label className="control-label" htmlFor="preset">
              Preset
            </label>
            <select
              className="field"
              id="preset"
              onChange={(event) => {
                void selectPreset(event.target.value);
              }}
              value={preset.id}
            >
              {presets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="help-text">{preset.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="primary-button col-span-2"
              onClick={() => void startSimulator()}
              type="button"
            >
              {workerReady ? <Sparkles size={18} /> : <Activity size={18} />}
              {workerReady ? "Reload WASM" : "Start REBOUND"}
            </button>
            <button
              className="tool-button"
              onClick={() => setRunning((value) => !value)}
              type="button"
            >
              {running ? <Pause size={17} /> : <Play size={17} />}
              {running ? "Pause" : "Run"}
            </button>
            <button className="tool-button" onClick={() => void resetCurrent()} type="button">
              <RotateCcw size={17} />
              Reset
            </button>
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="integrator">
              Integrator
            </label>
            <select
              className="field"
              id="integrator"
              onChange={(event) => {
                void updateSettings({ integrator: event.target.value as IntegratorId });
              }}
              value={settings.integrator}
            >
              {Object.entries(integratorLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Slider
            label="Speed"
            max={30}
            min={1}
            onChange={(speed) => void updateSettings({ speed })}
            step={1}
            value={settings.speed}
          />
          <Slider
            label="Time step"
            max={0.01}
            min={0.0004}
            onChange={(timeStep) => void updateSettings({ timeStep })}
            step={0.0002}
            value={settings.timeStep}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              className="tool-button"
              onClick={() => setDropMode((value) => !value)}
              type="button"
            >
              <Plus size={17} />
              {dropMode ? "Dropping" : "Drop"}
            </button>
            <button className="tool-button" onClick={() => void addRandomPlanet()} type="button">
              <Plus size={17} />
              Planet
            </button>
            <button className="tool-button" onClick={() => void addMoonlets()} type="button">
              <Sparkles size={17} />
              Moonlets
            </button>
            <button className="tool-button" onClick={saveUniverse} type="button">
              <Save size={17} />
              Save
            </button>
          </div>

          <button className="wide-toggle" onClick={() => void toggleAudio()} type="button">
            {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {settings.soundEnabled ? "Harmonics on" : "Harmonics off"}
          </button>
        </aside>

        <section className="order-1 min-h-[62vh] lg:order-2 lg:min-h-0">
          <Suspense
            fallback={
              <div className="grid h-full min-h-[420px] place-items-center bg-[#06111d] text-sm text-slate-300">
                Loading renderer
              </div>
            }
          >
            <UniverseScene
              cameraDistance={preset.cameraDistance}
              dropMode={dropMode}
              onDropBody={(x, y) => void dropBody(x, y)}
              onRendererMode={setRendererMode}
              onSelectBody={setSelectedBodyId}
              selectedBodyId={selectedBodyId}
              snapshot={snapshot}
            />
          </Suspense>
        </section>

        <aside className="panel order-3">
          <section className="stats-grid">
            <Metric label="Bodies" value={String(snapshot?.bodies.length ?? seedBodies.length)} />
            <Metric label="Sim time" value={formatScientific(snapshot?.time ?? 0, 3)} />
            <Metric label="Energy drift" value={formatScientific(snapshot?.energyDrift ?? 0, 2)} />
            <Metric label="Renderer" value={rendererMode.toUpperCase()} />
            <Metric label="FPS" value={String(fps)} />
            <Metric label="Integrator" value={integratorLabels[settings.integrator]} />
          </section>

          <section className="control-group">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Music size={17} />
              Resonance Monitor
            </div>
            <div className="mt-3 space-y-2">
              {resonances.length > 0 ? (
                resonances.map((pair) => (
                  <div className="resonance-row" key={`${pair.innerId}-${pair.outerId}`}>
                    <span>{pair.innerName}</span>
                    <strong>{pair.label}</strong>
                    <span>{pair.outerName}</span>
                  </div>
                ))
              ) : (
                <p className="help-text">
                  Run the simulation to reveal near-commensurate orbital periods.
                </p>
              )}
            </div>
          </section>

          <section className="control-group">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-100">Selected Body</h2>
              <button
                aria-label="Remove selected body"
                className="icon-only"
                disabled={!selectedBody || selectedBody.id === seedBodies[0]?.id}
                onClick={() => void removeSelected()}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {selectedBody ? (
              <dl className="body-details">
                <div>
                  <dt>Name</dt>
                  <dd>{selectedBody.name}</dd>
                </div>
                <div>
                  <dt>Mass</dt>
                  <dd>{formatScientific(selectedBody.mass, 3)}</dd>
                </div>
                <div>
                  <dt>Period</dt>
                  <dd>
                    {selectedBody.period > 0 ? formatScientific(selectedBody.period, 3) : "n/a"}
                  </dd>
                </div>
                <div>
                  <dt>Speed</dt>
                  <dd>{formatScientific(selectedBody.speed, 3)}</dd>
                </div>
              </dl>
            ) : (
              <p className="help-text">Click a body in the scene to inspect its orbital readout.</p>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

function Slider({ label, min, max, step, value, onChange }: SliderProps) {
  return (
    <div className="control-group">
      <div className="flex items-center justify-between gap-3">
        <label className="control-label" htmlFor={label}>
          {label}
        </label>
        <span className="mono-pill">{formatScientific(value, 4)}</span>
      </div>
      <input
        className="slider"
        id={label}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function safeLoadStoredUniverse() {
  try {
    return loadStoredUniverse();
  } catch {
    return null;
  }
}
