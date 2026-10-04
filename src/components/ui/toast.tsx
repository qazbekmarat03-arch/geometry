"use client";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
type Notice = { message: string; description?: string; error?: boolean };
type Toast = Notice & { id: number };
const ToastContext = createContext<(notice: Notice) => void>(() => {});
export function useToast() {
  return useContext(ToastContext);
}
function ToastItem({
  item,
  remove,
}: {
  item: Toast;
  remove: (id: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => remove(item.id), 6500);
    return () => clearTimeout(timer);
  }, [item.id, remove, paused]);
  const Icon = item.error ? AlertCircle : CheckCircle2;
  return (
    <div
      role={item.error ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-ink shadow-xl"
    >
      <Icon
        size={20}
        className={
          item.error
            ? "mt-0.5 shrink-0 text-red-700"
            : "mt-0.5 shrink-0 text-brand"
        }
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.message}</p>
        {item.description && (
          <p className="mt-1 break-words text-xs leading-5 text-muted">
            {item.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => remove(item.id)}
        aria-label="Хабарламаны жабу"
        className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-surface"
      >
        <X size={16} />
      </button>
    </div>
  );
}
function RedirectNotice() {
  const params = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const toast = useToast();
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (params.get("notice") !== "saved") {
      seen.current = null;
      return;
    }
    const key = path + params.toString();
    if (seen.current === key) return;
    seen.current = key;
    toast({ message: "Өзгерістер сақталды" });
    const clean = new URLSearchParams(params.toString());
    clean.delete("notice");
    router.replace(`${path}${clean.size ? `?${clean}` : ""}`, {
      scroll: false,
    });
  }, [params, path, router, toast]);
  return null;
}
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const counter = useRef(0);
  const notify = useCallback((notice: Notice) => {
    const item = { ...notice, id: ++counter.current };
    setItems((previous) => [...previous.slice(-2), item]);
  }, []);
  const remove = useCallback(
    (id: number) =>
      setItems((previous) => previous.filter((item) => item.id !== id)),
    [],
  );
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <Suspense fallback={null}>
        <RedirectNotice />
      </Suspense>
      <div
        aria-label="Хабарламалар"
        className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] space-y-3 sm:left-auto sm:w-96"
      >
        {items.map((item) => (
          <ToastItem key={item.id} item={item} remove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function useActionToast(state: { ok: boolean; message: string }) {
  const toast = useToast();
  const previous = useRef(state);
  useEffect(() => {
    if (previous.current === state) return;
    previous.current = state;
    if (state.message)
      toast({
        message: state.ok ? "Өзгерістер сақталды" : "Қате орын алды",
        description: state.message,
        error: !state.ok,
      });
  }, [state, toast]);
}
