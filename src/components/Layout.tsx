import { useEffect, useState, type ReactNode } from "react"
import {
  Bell,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react"
import { NavLink, Outlet, useNavigate } from "react-router"
import { useWorkspace } from "../app/WorkspaceProvider"
import { useToast } from "../app/ToastProvider"
import type { View } from "../types"
import { GlobalSearch } from "./GlobalSearch"
import { MemberAvatar, TaskModal } from "./product"
import { Button } from "./ui"

interface NavItem {
  id: View
  path: string
  label: string
  icon: ReactNode
}

const nav: NavItem[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={19} />,
  },
  {
    id: "projects",
    path: "/projects",
    label: "Projects",
    icon: <FolderKanban size={19} />,
  },
  {
    id: "tasks",
    path: "/tasks",
    label: "My Tasks",
    icon: <CheckSquare size={19} />,
  },
  {
    id: "calendar",
    path: "/calendar",
    label: "Calendar",
    icon: <CalendarDays size={19} />,
  },
  {
    id: "notifications",
    path: "/notifications",
    label: "Notifications",
    icon: <Bell size={19} />,
  },
  {
    id: "settings",
    path: "/settings",
    label: "Settings",
    icon: <Settings size={19} />,
  },
]

export function AppLayout() {
  const { state, logout, createTask } = useWorkspace()
  const notify = useToast()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const unread = state.notifications.filter(
    (notification) => notification.unread,
  ).length

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Sparkles size={19} />
            </div>
            <span className="text-xl font-bold tracking-tight">TeamSpace</span>
          </NavLink>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </Button>
        </div>
        <div className="px-4">
          <Button className="w-full" onClick={() => setTaskOpen(true)}>
            <Plus size={18} /> Create task
          </Button>
        </div>
        <nav className="mt-6 flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === "notifications" && unread > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-1 flex items-center gap-3 rounded-xl p-2">
            <MemberAvatar memberId="m1" showStatus />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {state.profile.firstName} {state.profile.lastName}
              </div>
              <div className="truncate text-xs text-slate-400">
                {state.profile.role}
              </div>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </div>
          <button
            onClick={() => {
              logout()
              navigate("/login")
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </Button>
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden h-10 max-w-md flex-1 items-center gap-3 rounded-xl bg-slate-100 px-3 text-sm text-slate-400 hover:bg-slate-200/70 md:flex"
          >
            <Search size={18} />
            Search projects, tasks, people...
            <span className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              ⌘ K
            </span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              className="md:hidden"
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/notifications")}
              className="relative"
              aria-label={`${unread} unread notifications`}
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
              )}
            </Button>
            <div className="ml-1 hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex">
              <MemberAvatar memberId="m1" size="sm" />
              <span className="text-sm font-semibold">
                {state.profile.firstName}
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-screen-2xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TaskModal
        key={String(taskOpen)}
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        projects={state.projects}
        onSave={(partial) => {
  createTask({
    projectId:
      partial.projectId ??
      state.projects[0]?.id ??
      "",
    title: partial.title ?? "Untitled task",
    description: partial.description ?? "",
    assigneeId: partial.assigneeId ?? "m1",
    status: partial.status ?? "To Do",
    priority: partial.priority ?? "Medium",
    deadline: partial.deadline ?? "",
    tags: partial.tags ?? [],
    version: 1,
  })
  notify("Task created successfully")
}}
      />
    </div>
  )
}
