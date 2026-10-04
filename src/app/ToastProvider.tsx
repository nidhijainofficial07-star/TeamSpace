import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { CheckCircle2, X } from "lucide-react"
import { Button } from "../components/ui"

const ToastContext = createContext<((message: string) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("")
  const timeout = useRef<number | null>(null)
  const notify = useCallback((next: string) => {
    if (timeout.current) window.clearTimeout(timeout.current)
    setMessage(next)
    timeout.current = window.setTimeout(() => setMessage(""), 2800)
  }, [])
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-[70]"
      >
        {message && (
          <div className="flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-xl">
            <CheckCircle2 size={18} className="text-emerald-400" />
            {message}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setMessage("")}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </Button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used inside ToastProvider")
  return context
}
