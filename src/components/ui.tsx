import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "icon"
}) {
  const variants = {
    primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    icon: "h-10 w-10",
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50",
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50",
        className,
      )}
      {...props}
    />
  )
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Heading({
  level = 1,
  children,
  className = "",
}: {
  level?: 1 | 2 | 3 | 4
  children: ReactNode
  className?: string
}) {
  const classes = cn(
    "font-semibold tracking-tight text-slate-950",
    level === 1
      ? "text-2xl md:text-3xl"
      : level === 2
        ? "text-xl"
        : level === 3
          ? "text-base"
          : "text-sm",
    className,
  )
  if (level === 1) return <h1 className={classes}>{children}</h1>
  if (level === 2) return <h2 className={classes}>{children}</h2>
  if (level === 3) return <h3 className={classes}>{children}</h3>
  return <h4 className={classes}>{children}</h4>
}

export function Text({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-sm leading-6 text-slate-500", className)}>
      {children}
    </p>
  )
}

export function Label({
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className="mb-1.5 block text-sm font-medium text-slate-700"
      {...props}
    >
      {children}
    </label>
  )
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Progress({
  value,
  className = "",
}: {
  value: number
  className?: string
}) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn("h-2 overflow-hidden rounded-full bg-slate-100", className)}
    >
      <div
        className="h-full rounded-full bg-indigo-600 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none",
            wide ? "max-w-3xl" : "max-w-lg",
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight text-slate-950">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-slate-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close dialog">
                <X size={18} />
              </Button>
            </Dialog.Close>
          </div>
          <div className="p-6">{children}</div>
          {footer && (
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Tabs({
  items,
  active,
  onChange,
}: {
  items: string[]
  active: string
  onChange: (item: string) => void
}) {
  return (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto border-b border-slate-200"
    >
      {items.map((item) => (
        <button
          role="tab"
          aria-selected={item === active}
          key={item}
          onClick={() => onChange(item)}
          className={cn(
            "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            item === active
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        checked ? "bg-indigo-600" : "bg-slate-200",
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
          checked ? "left-6" : "left-1",
        )}
      />
    </button>
  )
}
