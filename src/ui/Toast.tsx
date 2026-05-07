import { X } from "lucide-react";

export interface ToastMessage {
  id: number;
  tone: "info" | "error" | "success";
  text: string;
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastStack({ messages, onDismiss }: ToastProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
      {messages.map((message) => (
        <div
          className={`pointer-events-auto flex items-start gap-3 rounded-md border px-3 py-3 text-sm shadow-2xl backdrop-blur ${
            message.tone === "error"
              ? "border-red-300/30 bg-red-950/85 text-red-50"
              : message.tone === "success"
                ? "border-emerald-300/30 bg-emerald-950/85 text-emerald-50"
                : "border-sky-300/30 bg-slate-950/85 text-sky-50"
          }`}
          key={message.id}
        >
          <span className="min-w-0 flex-1">{message.text}</span>
          <button
            aria-label="Dismiss message"
            className="rounded p-1 text-current opacity-80 hover:bg-white/10 hover:opacity-100"
            onClick={() => onDismiss(message.id)}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
