import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
        <section className="max-w-xl rounded-lg border border-red-400/40 bg-red-950/40 p-5">
          <h1 className="text-xl font-semibold">The simulator stopped unexpectedly.</h1>
          <p className="mt-3 text-sm text-red-100">{this.state.error.message}</p>
          <button
            className="mt-5 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload
          </button>
        </section>
      </main>
    );
  }
}
