import { useEffect, useMemo, useState } from "react"
import { FolderKanban, Search, UserRound, CheckSquare } from "lucide-react"
import { useNavigate } from "react-router"
import { supabase } from "../lib/supabase"
import { useWorkspace } from "../app/WorkspaceProvider"
import { Badge, Input, Modal, Text } from "./ui"

type WorkspaceProfile = {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { state } = useWorkspace()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>([])

  useEffect(() => {
    let mounted = true

    const loadProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .order("name", { ascending: true })

      if (!mounted) return

      if (error) {
        console.error("Global search profiles error:", error)
        setProfiles([])
        return
      }

      setProfiles(data ?? [])
    }

    void loadProfiles()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setActive(0)
    }
  }, [open])

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()

    const includes = (...values: string[]) =>
      !term || values.some((value) => value.toLowerCase().includes(term))

    return [
      ...state.projects
        .filter((project) => includes(project.name, project.description))
        .slice(0, 4)
        .map((project) => ({
          id: project.id,
          type: "Project",
          label: project.name,
          meta: project.description,
          path: `/projects/${project.id}`,
        })),

      ...state.tasks
        .filter((task) =>
          includes(task.title, task.description, task.tags.join(" ")),
        )
        .slice(0, 5)
        .map((task) => ({
          id: task.id,
          type: "Task",
          label: task.title,
          meta:
            state.projects.find((project) => project.id === task.projectId)
              ?.name ?? "Project",
          path: `/tasks/${task.id}`,
        })),

      ...profiles
        .filter((profile) =>
          includes(
            profile.name,
            profile.email,
            "Workspace member",
          ),
        )
        .slice(0, 3)
        .map((profile) => ({
          id: profile.id,
          type: "Person",
          label: profile.name || profile.email.split("@")[0],
          meta: profile.email,
          path: `/tasks?member=${profile.id}`,
        })),
    ]
  }, [query, state.projects, state.tasks, profiles])

  const select = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Search TeamSpace"
      description="Find projects, tasks, and teammates."
      wide
    >
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />

        <Input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault()

              if (results.length > 0) {
                setActive((value) =>
                  Math.min(value + 1, results.length - 1),
                )
              }
            }

            if (event.key === "ArrowUp") {
              event.preventDefault()
              setActive((value) => Math.max(value - 1, 0))
            }

            if (event.key === "Enter" && results[active]) {
              select(results[active].path)
            }

            if (event.key === "Escape") {
              onClose()
            }
          }}
          className="h-12 pl-10"
          placeholder="Search by name, description, tag, or person..."
          aria-label="Search TeamSpace"
        />
      </div>

      <div className="mt-4 max-h-96 overflow-y-auto">
        {results.length ? (
          results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => select(result.path)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${
                active === index
                  ? "bg-indigo-50"
                  : "hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  result.type === "Project"
                    ? "bg-violet-50 text-violet-600"
                    : result.type === "Task"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {result.type === "Project" ? (
                  <FolderKanban size={18} />
                ) : result.type === "Task" ? (
                  <CheckSquare size={18} />
                ) : (
                  <UserRound size={18} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {result.label}
                </div>

                <div className="truncate text-xs text-slate-400">
                  {result.meta}
                </div>
              </div>

              <Badge className="bg-slate-100 text-slate-500">
                {result.type}
              </Badge>
            </button>
          ))
        ) : (
          <div className="py-12 text-center">
            <Search
              className="mx-auto mb-3 text-slate-300"
              size={28}
            />
            <Text>No matching projects, tasks, or people.</Text>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
        <span>↑↓ Navigate</span>
        <span>↵ Open</span>
        <span>Esc Close</span>
      </div>
    </Modal>
  )
}
