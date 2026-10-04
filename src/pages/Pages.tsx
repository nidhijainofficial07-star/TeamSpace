import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { supabase } from "../lib/supabase"
import { useSearchParams } from "react-router"
import { AddMemberDialog } from "../components/AddMemberDialog"
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  FolderKanban,
  Grid2X2,
  List,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserPlus,
  Users,
} from "lucide-react"
import {
  formatDate,
  greeting,
  isOverdue,
  monthGrid,
  toISODate,
} from "../lib/dates"
import { useWorkspace } from "../app/WorkspaceProvider"
import type {
  DiscussionMessage,
  Notification,
  Project,
  Task,
  TeamFile,
  UserPreferences,
  Profile,
  WorkspaceSettings,
} from "../types"
import {
  ActivityTimeline,
  EmptyState,
  FileList,
  MemberAvatar,
  NotificationItem,
  PriorityBadge,
  ProjectCard,
  StatusBadge,
  TaskCard,
} from "../components/product"
import {
  Badge,
  Button,
  Card,
  Heading,
  Input,
  Label,
  Progress,
  Select,
  Switch,
  Tabs,
  Text,
  Textarea,
} from "../components/ui"

interface WorkspaceProfileRow {
  id: string
  name: string | null
  email: string | null
  avatar_url?: string | null
}

function useWorkspaceProfiles() {
  const [profiles, setProfiles] = useState<
    WorkspaceProfileRow[]
  >([])

  useEffect(() => {
    let active = true

    const loadProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")

      if (error) {
        console.error(
          "Failed to load workspace profiles:",
          error,
        )
        return
      }

      if (active) {
        setProfiles(
          (data ?? []) as WorkspaceProfileRow[],
        )
      }
    }

    void loadProfiles()

    const channel = supabase
      .channel("pages-profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          void loadProfiles()
        },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [])

  return profiles
}

function getProfileDisplayName(
  profile: WorkspaceProfileRow | undefined,
  fallback = "Team member",
) {
  if (profile?.name?.trim()) {
    return profile.name.trim()
  }

  if (profile?.email?.trim()) {
    return profile.email.split("@")[0]
  }

  return fallback
}

export function LoginPage({
  onLogin,
  onMockAction,
}: {
  onLogin: () => void
  onMockAction?: (message: string) => void
}) {
  const [signup, setSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    setError("")
    setMessage("")
    setLoading(true)

    try {
      if (signup) {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: fullName.trim(),
                full_name: fullName.trim(),
              },
            },
          })

        if (signUpError) {
          throw signUpError
        }

        if (!data.user) {
          throw new Error("Account could not be created.")
        }

        if (!data.session) {
          setMessage(
            "Account created! Check your email to confirm your account, then sign in.",
          )
          setSignup(false)
          setPassword("")
          return
        }

        onLogin()
        return
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (signInError) {
        throw signInError
      }

      if (!data.user) {
        throw new Error("Unable to sign in.")
      }

      onLogin()
    } catch (err) {
      console.error("Authentication error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  const continueWithGoogle = async () => {
    setError("")
    setMessage("")

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      })

    if (error) {
      setError(error.message)
    }
  }

  const forgotPassword = async () => {
    if (!email.trim()) {
      setError(
        "Enter your email address first so we know where to send the reset link.",
      )
      return
    }

    setError("")
    setMessage("")
    setLoading(true)

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/login`,
          },
        )

      if (error) {
        throw error
      }

      setMessage(
        "Password reset link sent. Check your email.",
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the password reset email.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <Sparkles size={21} />
          </div>

          <span className="text-2xl font-bold">
            TeamSpace
          </span>
        </div>

        <div className="relative my-auto max-w-xl">
          <Badge className="mb-6 bg-white/10 text-indigo-200">
            One workspace. One aligned team.
          </Badge>

          <Heading
            level={1}
            className="text-5xl leading-tight text-white"
          >
            Move projects forward, together.
          </Heading>

          <Text className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Plan projects, coordinate tasks, and stay
            in sync with your remote team—without
            losing momentum.
          </Text>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              ["Live", "Workspace data"],
              ["Real-time", "Team updates"],
              ["Secure", "Supabase Auth"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <div className="text-2xl font-bold">
                  {value}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Text className="relative text-slate-500">
          A collaborative workspace for teams who
          care about doing their best work.
        </Text>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Sparkles size={18} />
            </div>

            <span className="text-xl font-bold">
              TeamSpace
            </span>
          </div>

          <Heading level={1}>
            {signup
              ? "Create your account"
              : "Welcome back"}
          </Heading>

          <Text className="mt-2">
            {signup
              ? "Start collaborating with your team today."
              : "Enter your details to access your workspace."}
          </Text>

          <Button
            variant="secondary"
            className="mt-8 w-full"
            onClick={continueWithGoogle}
            disabled={loading}
          >
            <span className="text-base font-bold text-blue-600">
              G
            </span>{" "}
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              or continue with email
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <form
            onSubmit={submit}
            className="space-y-4"
          >
            {signup && (
              <div>
                <Label>Full name</Label>

                <div className="relative">
                  <Users
                    className="absolute left-3 top-3 text-slate-400"
                    size={17}
                  />

                  <Input
                    className="pl-10"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Email address</Label>

              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-slate-400"
                  size={17}
                />

                <Input
                  className="pl-10"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Password</Label>

                {!signup && (
                  <button
                    type="button"
                    onClick={forgotPassword}
                    disabled={loading}
                    className="mb-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="relative">
                <LockKeyhole
                  className="absolute left-3 top-3 text-slate-400"
                  size={17}
                />

                <Input
                  aria-label="Password"
                  className="pl-10 pr-10"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

                <button
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-2.5 text-slate-400"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <Button
              className="mt-2 w-full"
              type="submit"
              disabled={loading}
            >
              {loading
                ? signup
                  ? "Creating account..."
                  : "Signing in..."
                : signup
                  ? "Create account"
                  : "Sign in"}

              {!loading && <ArrowRight size={17} />}
            </Button>
          </form>

          <Text className="mt-7 text-center">
            {signup
              ? "Already have an account?"
              : "New to TeamSpace?"}{" "}

            <button
              type="button"
              onClick={() => {
                setSignup(!signup)
                setError("")
                setMessage("")
              }}
              className="font-semibold text-indigo-600"
            >
              {signup
                ? "Sign in"
                : "Create an account"}
            </button>
          </Text>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage({
  tasks,
  projects,
  onNavigate,
  onOpenTask,
  onCreateTask,
  onCreateProject,
}: PageProps & {
  projects: Project[]
  onCreateTask: () => void
  onCreateProject: () => void
}) {
  const { state, currentUserId } = useWorkspace()

  const safeTasks = tasks ?? []
  const safeProjects = projects ?? []

  const currentUserName =
    state.profile?.firstName?.trim() ||
    state.profile?.email?.split("@")[0] ||
    "there"

  const completed = safeTasks.filter(
    (task) => task.status === "Completed",
  ).length

  const active = safeTasks.filter(
    (task) => task.status === "In Progress",
  ).length

  const overdue = safeTasks.filter(
    (task) =>
      task.status !== "Completed" &&
      isOverdue(task.deadline),
  ).length

  const stats = [
    {
      label: "Total projects",
      value: safeProjects.length,
      change: "Live from workspace",
      icon: <FolderKanban size={20} />,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Active tasks",
      value: active,
      change: "Currently in progress",
      icon: <Clock3 size={20} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completed",
      value: completed,
      change: "Completed tasks",
      icon: <CheckCircle2 size={20} />,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Overdue",
      value: overdue,
      change: overdue
        ? "Needs attention"
        : "Everything on track",
      icon: <Bell size={20} />,
      color: "bg-rose-50 text-rose-600",
    },
  ]

  return (
    <div>
      <PageTitle
        eyebrow={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title={`${greeting()}, ${currentUserName}`}
        description="Here’s what’s happening across your workspace today."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={onCreateProject}
            >
              <FolderKanban size={17} /> Create Project
            </Button>

            <Button onClick={onCreateTask}>
              <Plus size={17} /> Create Task
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <Text>{stat.label}</Text>

                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {stat.value}
                </div>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
              >
                {stat.icon}
              </div>
            </div>

            <div className="mt-4 text-xs font-medium text-slate-400">
              {stat.change}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="p-6">
          <SectionHeader
            title="Project progress"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("projects")}
              >
                View all <ArrowRight size={15} />
              </Button>
            }
          />

          <div className="mt-5 space-y-5">
            {safeProjects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white ${
                    project.color ?? "bg-indigo-600"
                  }`}
                >
                  {project.name?.[0] ?? "P"}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">
                      {project.name}
                    </span>

                    <span className="text-xs font-semibold text-slate-500">
                      {project.progress ?? 0}%
                    </span>
                  </div>

                  <Progress value={project.progress ?? 0} />
                </div>

                <div className="hidden -space-x-2 sm:flex">
                  {(project.memberIds ?? [])
                    .slice(0, 3)
                    .map((id) => (
                      <MemberAvatar
                        key={id}
                        memberId={id}
                        size="sm"
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader
            title="Upcoming deadlines"
            action={
              <CalendarDays
                size={18}
                className="text-slate-400"
              />
            }
          />

          <div className="mt-4 space-y-2">
            {safeTasks
              .filter(
                (task) => task.status !== "Completed",
              )
              .sort((a, b) =>
                (a.deadline ?? "").localeCompare(
                  b.deadline ?? "",
                ),
              )
              .slice(0, 4)
              .map((task, index) => (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task.id)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl ${
                      index === 0
                        ? "bg-rose-50 text-rose-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">
                      {formatDate(task.deadline, {
                        month: "short",
                      })}
                    </span>

                    <span className="text-sm font-bold">
                      {formatDate(task.deadline, {
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {task.title}
                    </div>

                    <div className="text-xs text-slate-400">
                      {
                        safeProjects.find(
                          (project) =>
                            project.id === task.projectId,
                        )?.name
                      }
                    </div>
                  </div>

                  <PriorityBadge priority={task.priority} />
                </button>
              ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <Card className="p-6">
          <SectionHeader
            title="My assigned tasks"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("tasks")}
              >
                View all <ArrowRight size={15} />
              </Button>
            }
          />

          <div className="mt-3 divide-y divide-slate-100">
            {safeTasks
              .filter(
                (task) =>
                  task.assigneeId === currentUserId,
              )
              .slice(0, 4)
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task.id)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      task.status === "Completed"
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300"
                    }`}
                  >
                    {task.status === "Completed" && (
                      <CheckCircle2
                        size={14}
                        className="text-white"
                      />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">
                      {task.title}
                    </div>

                    <div className="text-xs text-slate-400">
                      {
                        safeProjects.find(
                          (project) =>
                            project.id === task.projectId,
                        )?.name
                      }
                    </div>
                  </div>

                  <StatusBadge status={task.status} />
                </button>
              ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader
            title="Recent activity"
            action={
              <Button variant="ghost" size="sm">
                View all
              </Button>
            }
          />

          <div className="mt-5">
            <ActivityTimeline limit={4} />
          </div>
        </Card>
      </div>
    </div>
  )
}


export function ProjectsPage({
  projects,
  onOpenProject,
  onCreateProject,
}: {
  projects: Project[]
  onOpenProject: (id: string) => void
  onCreateProject: () => void
}) {
  const [query, setQuery] = useState("")

  const safeProjects = projects ?? []

  const filtered = safeProjects.filter((project) =>
    project.name
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  return (
    <div>
      <PageTitle
        title="Projects"
        description="Organize initiatives, track progress, and keep your team aligned."
        actions={
          <Button onClick={onCreateProject}>
            <Plus size={17} /> Create project
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={18}
          />

          <Input
            className="pl-10"
            placeholder="Search projects..."
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
        </div>

        <Select>
          <option>All projects</option>
          <option>Active</option>
          <option>Completed</option>
        </Select>

        <Button variant="secondary">
          <SlidersHorizontal size={17} /> Filters
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={() => onOpenProject(project.id)}
          />
        ))}

        <button
          onClick={onCreateProject}
          className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-600"
        >
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
            <Plus size={20} />
          </span>

          <span className="font-semibold">
            Create a new project
          </span>
        </button>
      </div>
    </div>
  )
}

export function ProjectPage({
  project,
  tasks,
  files,
  messages,
  onOpenTask,
  onCreateTask,
  onEditProject,
  onAddMember,
  onAddMessage,
  onAddFile,
  onDownload,
}: {
  project: Project
  tasks: Task[]
  files: TeamFile[]
  messages: DiscussionMessage[]
  onOpenTask: (id: string) => void
  onCreateTask: () => void
  onEditProject: () => void
  onAddMember: (
  projectId: string,
  userId: string,
  role: string,
) => void
  onAddMessage: (body: string) => void
  onAddFile: (file: File) => void
  onDownload: (file: TeamFile) => void
}) {
  const [searchParams, setSearchParams] =
    useSearchParams()
  const [addMemberOpen, setAddMemberOpen] =
  useState(false)

  const tab = searchParams.get("tab") ?? "Overview"

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams)

    if (next === "Overview") {
      params.delete("tab")
    } else {
      params.set("tab", next)
    }

    setSearchParams(params)
  }

  const safeTasks = tasks ?? []
  const safeFiles = files ?? []
  const safeMessages = messages ?? []

  const projectTasks = safeTasks.filter(
    (task) => task.projectId === project.id,
  )

  const projectMessages = safeMessages.filter(
    (message) => message.projectId === project.id,
  )

  return (
    <div>
      <div className="mb-6">
        <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm ${
                project.color ?? "bg-indigo-600"
              }`}
            >
              {project.name?.[0] ?? "P"}
            </div>

            <div>
              <Heading level={1}>
                {project.name}
              </Heading>

              <Text className="mt-1 max-w-2xl">
                {project.description}
              </Text>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
  variant="secondary"
  onClick={() => setAddMemberOpen(true)}
>
  <UserPlus size={17} />
  Add member
</Button>

            <Button onClick={onCreateTask}>
              <Plus size={17} /> Add task
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onEditProject}
              aria-label="Edit project"
            >
              <MoreHorizontal size={19} />
            </Button>
          </div>
        </div>

        <Card className="grid gap-5 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span>Overall progress</span>
              <span>{project.progress ?? 0}%</span>
            </div>

            <Progress value={project.progress ?? 0} />
          </div>

          <div className="flex items-center gap-3 md:border-l md:border-slate-200 md:pl-5">
            <div className="flex -space-x-2">
              {(project.memberIds ?? []).map((id) => (
                <MemberAvatar
                  key={id}
                  memberId={id}
                  size="sm"
                />
              ))}
            </div>

            <Text>
              {(project.memberIds ?? []).length} members
            </Text>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 md:border-l md:border-slate-200 md:pl-5">
            <CalendarDays
              size={17}
              className="text-slate-400"
            />{" "}
            Due{" "}
            {formatDate(project.deadline, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </Card>
      </div>

      <Tabs
        items={[
          "Overview",
          "Tasks",
          "Discussion",
          "Files",
          "Activity",
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="pt-6">
  {tab === "Overview" && (
    <ProjectOverview
      project={project}
      tasks={projectTasks}
      files={safeFiles}
      onCreateTask={onCreateTask}
      onEditProject={onEditProject}
      onAddMember={onAddMember}
      onAddMessage={onAddMessage}
      onOpenTask={onOpenTask}
      onDownload={onDownload}
    />
  )}

        {tab === "Tasks" && (
          <TasksPage
            tasks={projectTasks}
            projects={[project]}
            onOpenTask={onOpenTask}
            onCreateTask={onCreateTask}
            embedded
          />
        )}

        {tab === "Discussion" && (
          <Discussion
            messages={projectMessages}
            onSend={onAddMessage}
          />
        )}

        {tab === "Files" && (
          <ProjectFiles
            projectId={project.id}
            files={safeFiles}
            onUpload={onAddFile}
            onDownload={onDownload}
          />
        )}

        {tab === "Activity" && (
          <Card className="max-w-3xl p-6">
            <SectionHeader title="Project activity" />

            <div className="mt-6">
              <ActivityTimeline />
            </div>
          </Card>
        )}
      </div>
      <AddMemberDialog
  open={addMemberOpen}
  onClose={() => setAddMemberOpen(false)}
  projectId={project.id}
  existingMemberIds={project.memberIds ?? []}
  onAddMember={(
    projectId,
    userId,
    role,
  ) => {
    onAddMember(
      projectId,
      userId,
      role,
    )
  }}
/>
    </div>
  )
}

function ProjectOverview({
  project,
  tasks,
  files,
  onOpenTask,
  onDownload,
}: {
  project: Project
  tasks: Task[]
  files: TeamFile[]
  onCreateTask: () => void
  onEditProject: () => void
  onAddMember: (
    projectId: string,
    userId: string,
    role: string,
  ) => void
  onAddMessage: (body: string) => void
  onOpenTask: (id: string) => void
  onDownload: (file: TeamFile) => void
}) {
  const { state, currentUserId } = useWorkspace()
  const profiles = useWorkspaceProfiles()

  const safeTasks = tasks ?? []
  const safeFiles = files ?? []
  const memberIds = project.memberIds ?? []

  const profileMap = useMemo(
    () =>
      new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ]),
      ),
    [profiles],
  )

  const completed = safeTasks.filter(
    (task) => task.status === "Completed",
  ).length

  const currentProfileName =
    state.profile?.firstName ||
    state.profile?.email?.split("@")[0] ||
    "You"

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
      <div className="space-y-6">
        <Card className="p-6">
          <SectionHeader title="Tasks at a glance" />

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              [
                "To do",
                safeTasks.filter(
                  (task) => task.status === "To Do",
                ).length,
                "bg-slate-100",
              ],
              [
                "In progress",
                safeTasks.filter(
                  (task) =>
                    task.status === "In Progress",
                ).length,
                "bg-blue-50",
              ],
              [
                "Completed",
                completed,
                "bg-emerald-50",
              ],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className={`rounded-xl p-4 ${color}`}
              >
                <div className="text-2xl font-bold text-slate-900">
                  {value}
                </div>

                <div className="text-xs font-medium text-slate-500">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {safeTasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <MemberAvatar
                  memberId={task.assigneeId}
                  size="sm"
                />

                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {task.title}
                </span>

                <StatusBadge status={task.status} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title="Recent files" />

          <FileList
            projectId={project.id}
            files={safeFiles}
            onDownload={onDownload}
          />
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <SectionHeader title="Team" />

          <div className="mt-4 space-y-4">
            {memberIds.map((id) => {
              const isCurrentUser =
                id === currentUserId

              const profile = profileMap.get(id)

              const memberName = isCurrentUser
                ? currentProfileName
                : getProfileDisplayName(
                    profile,
                  )

              return (
                <div
                  key={id}
                  className="flex items-center gap-3"
                >
                  <MemberAvatar
                    memberId={id}
                    showStatus
                  />

                  <div>
                    <div className="text-sm font-semibold">
                      {memberName}
                    </div>

                    <div className="text-xs text-slate-400">
                      {isCurrentUser
                        ? "You"
                        : "Workspace member"}
                    </div>
                  </div>
                </div>
              )
            })}

            {memberIds.length === 0 && (
              <Text>
                No members have been added to this
                project yet.
              </Text>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title="Activity" />

          <div className="mt-5">
            <ActivityTimeline limit={4} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function Discussion({
  messages,
  onSend,
}: {
  messages: DiscussionMessage[]
  onSend: (body: string) => void
}) {
  const { state, currentUserId } = useWorkspace()
  const profiles = useWorkspaceProfiles()

  const [message, setMessage] = useState("")
  const safeMessages = messages ?? []

  const profileMap = useMemo(
    () =>
      new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ]),
      ),
    [profiles],
  )

  const currentUserName =
    state.profile?.firstName ||
    state.profile?.email?.split("@")[0] ||
    "You"

  const send = () => {
    if (message.trim()) {
      onSend(message.trim())
      setMessage("")
    }
  }

  return (
    <Card className="mx-auto max-w-4xl overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <Heading level={2}>Team discussion</Heading>
        <Text>{safeMessages.length} messages</Text>
      </div>

      <div className="min-h-96 space-y-6 p-5">
        {safeMessages.map((post) => {
          const isCurrentUser =
            post.authorId === currentUserId

          const memberName = isCurrentUser
            ? currentUserName
            : getProfileDisplayName(
                profileMap.get(post.authorId),
              )

          return (
            <div
              key={post.id}
              className={`flex gap-3 ${
                isCurrentUser ? "justify-end" : ""
              }`}
            >
              <MemberAvatar
                memberId={post.authorId}
              />

              <div className="max-w-2xl">
                <div className="mb-1 flex gap-2">
                  <span className="text-sm font-semibold">
                    {memberName}
                  </span>

                  <span className="text-xs text-slate-400">
                    {post.createdAt}
                  </span>
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                    isCurrentUser
                      ? "rounded-tr-sm bg-indigo-600 text-white"
                      : "rounded-tl-sm bg-slate-100 text-slate-700"
                  }`}
                >
                  {post.body}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 border-t border-slate-100 p-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </Button>

        <Input
          aria-label="Message"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={(event) =>
            event.key === "Enter" && send()
          }
          placeholder="Write a message..."
        />

        <Button
          size="icon"
          onClick={send}
          aria-label="Send message"
        >
          <Send size={17} />
        </Button>
      </div>
    </Card>
  )
}

function ProjectFiles({
  projectId,
  files,
  onUpload,
  onDownload,
}: {
  projectId: string
  files: TeamFile[]
  onUpload: (file: File) => void
  onDownload: (file: TeamFile) => void
}) {
  const safeFiles = files ?? []

  const projectFiles = safeFiles.filter(
    (file) => file.projectId === projectId,
  )

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
        <div>
          <Heading level={2}>Project files</Heading>

          <Text>
            {projectFiles.length} shared files
          </Text>
        </div>

        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">
          <Upload size={17} /> Upload file

          <input
            className="sr-only"
            type="file"
            onChange={(event) =>
              event.target.files?.[0] &&
              onUpload(event.target.files[0])
            }
          />
        </label>
      </div>

      <div className="p-5">
        <FileList
          projectId={projectId}
          files={safeFiles}
          onDownload={onDownload}
        />
      </div>
    </Card>
  )
}

export function TasksPage({
  tasks,
  projects,
  onOpenTask,
  onCreateTask,
  embedded = false,
}: {
  tasks: Task[]
  projects: Project[]
  onOpenTask: (id: string) => void
  onCreateTask: () => void
  embedded?: boolean
}) {
  const { state, currentUserId } = useWorkspace()
  const profiles = useWorkspaceProfiles()

  const [searchParams, setSearchParams] =
    useSearchParams()

  const view =
    searchParams.get("view") === "list"
      ? "list"
      : "board"

  const query = searchParams.get("q") ?? ""
  const status = searchParams.get("status") ?? "All"
  const priority =
    searchParams.get("priority") ?? "All"
  const member = searchParams.get("member") ?? "All"

  const safeTasks = tasks ?? []
  const safeProjects = projects ?? []

  const profileMap = useMemo(
    () =>
      new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ]),
      ),
    [profiles],
  )

  const memberIds = Array.from(
    new Set(
      safeTasks
        .map((task) => task.assigneeId)
        .filter(Boolean),
    ),
  )

  const currentUserName =
    state.profile?.firstName ||
    state.profile?.email?.split("@")[0] ||
    "You"

  const setParam = (
    key: string,
    value: string,
    defaultValue = "All",
  ) => {
    const params = new URLSearchParams(searchParams)

    if (
      !value ||
      value === defaultValue
    ) {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    setSearchParams(params)
  }

  const filtered = safeTasks.filter(
    (task) =>
      (task.title ?? "")
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All" ||
        task.status === status) &&
      (priority === "All" ||
        task.priority === priority) &&
      (member === "All" ||
        task.assigneeId === member),
  )

  return (
    <div>
      {!embedded && (
        <PageTitle
          title="My Tasks"
          description="Focus on the work assigned to you and keep everything moving."
          actions={
            <Button onClick={onCreateTask}>
              <Plus size={17} /> Create task
            </Button>
          }
        />
      )}

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative max-w-md flex-1">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={17}
          />

          <Input
            className="pl-10"
            placeholder="Search tasks..."
            value={query}
            onChange={(event) =>
              setParam(
                "q",
                event.target.value,
                "",
              )
            }
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(event) =>
              setParam(
                "status",
                event.target.value,
              )
            }
          >
            <option>All</option>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Completed</option>
          </Select>

          <Select
            aria-label="Filter by priority"
            value={priority}
            onChange={(event) =>
              setParam(
                "priority",
                event.target.value,
              )
            }
          >
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </Select>

          <Select
            aria-label="Filter by member"
            value={member}
            onChange={(event) =>
              setParam(
                "member",
                event.target.value,
              )
            }
          >
            <option value="All">
              All members
            </option>

            {memberIds.map((id) => {
              const isCurrentUser =
                id === currentUserId

              const memberName = isCurrentUser
                ? currentUserName
                : getProfileDisplayName(
                    profileMap.get(id),
                  )

              return (
                <option
                  key={id}
                  value={id}
                >
                  {memberName}
                </option>
              )
            })}
          </Select>

          <Button
            variant="secondary"
            size="icon"
            aria-label="Clear filters"
            onClick={() =>
              setSearchParams(
                new URLSearchParams(),
              )
            }
          >
            <Filter size={17} />
          </Button>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <Button
              aria-label="Board view"
              variant={
                view === "board"
                  ? "primary"
                  : "ghost"
              }
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() =>
                setParam(
                  "view",
                  "board",
                  "board",
                )
              }
            >
              <Grid2X2 size={16} />
            </Button>

            <Button
              aria-label="List view"
              variant={
                view === "list"
                  ? "primary"
                  : "ghost"
              }
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() =>
                setParam(
                  "view",
                  "list",
                  "board",
                )
              }
            >
              <List size={17} />
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search size={22} />}
            title="No tasks match these filters"
            description="Try a different search or clear the active filters."
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  setSearchParams(
                    new URLSearchParams(),
                  )
                }
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : view === "board" ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {(
            [
              "To Do",
              "In Progress",
              "Completed",
            ] as const
          ).map((column) => (
            <div
              key={column}
              className="rounded-2xl bg-slate-100/70 p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      column === "To Do"
                        ? "bg-slate-400"
                        : column ===
                            "In Progress"
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                    }`}
                  />

                  <span className="text-sm font-semibold">
                    {column}
                  </span>

                  <Badge className="bg-white text-slate-500">
                    {
                      filtered.filter(
                        (task) =>
                          task.status ===
                          column,
                      ).length
                    }
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Add task to ${column}`}
                  onClick={onCreateTask}
                >
                  <Plus size={16} />
                </Button>
              </div>

              {filtered
                .filter(
                  (task) =>
                    task.status === column,
                )
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() =>
                      onOpenTask(task.id)
                    }
                  />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_140px_120px_150px_100px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <span>Task</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Assignee</span>
            <span>Deadline</span>
          </div>

          {filtered.map((task) => {
            const isCurrentUser =
              task.assigneeId === currentUserId

            const memberName = isCurrentUser
              ? currentUserName
              : getProfileDisplayName(
                  profileMap.get(task.assigneeId),
                )

            return (
              <button
                key={task.id}
                onClick={() =>
                  onOpenTask(task.id)
                }
                className="grid w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left last:border-0 hover:bg-slate-50 md:grid-cols-[1fr_140px_120px_150px_100px]"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {task.title}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {
                      safeProjects.find(
                        (project) =>
                          project.id ===
                          task.projectId,
                      )?.name
                    }
                  </div>
                </div>

                <StatusBadge status={task.status} />

                <PriorityBadge
                  priority={task.priority}
                />

                <div className="flex items-center gap-2">
                  <MemberAvatar
                    memberId={task.assigneeId}
                    size="sm"
                  />

                  <span className="text-sm">
                    {memberName.split(" ")[0]}
                  </span>
                </div>

                <span className="text-xs text-slate-500">
                  {formatDate(task.deadline)}
                </span>
              </button>
            )
          })}
        </Card>
      )}
    </div>
  )
}

export function CalendarPage({
  tasks,
  onOpenTask,
  onCreateTask,
}: {
  tasks: Task[]
  onOpenTask: (id: string) => void
  onCreateTask?: () => void
}) {
  const now = new Date()

  const [cursor, setCursor] = useState(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ),
  )

  const safeTasks = tasks ?? []

  const days = monthGrid(
    cursor.getFullYear(),
    cursor.getMonth(),
  )

  const move = (offset: number) =>
    setCursor(
      new Date(
        cursor.getFullYear(),
        cursor.getMonth() + offset,
        1,
      ),
    )

  return (
    <div>
      <PageTitle
        title="Calendar"
        description="See milestones and deadlines across all your projects."
        actions={
          <Button onClick={onCreateTask}>
            <Plus size={17} /> Add task
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setCursor(
                  new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1,
                  ),
                )
              }
            >
              Today
            </Button>

            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => move(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => move(1)}
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>

          <Heading level={2}>
            {cursor.toLocaleDateString(
              "en-US",
              {
                month: "long",
                year: "numeric",
              },
            )}
          </Heading>

          <Select aria-label="Calendar view">
            <option>Month</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-xs font-semibold uppercase text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => (
                <div
                  key={day.iso}
                  className={`min-h-28 border-b border-r border-slate-100 p-2 ${
                    !day.currentMonth
                      ? "bg-slate-50/60"
                      : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                      day.iso ===
                      toISODate(new Date())
                        ? "bg-indigo-600 text-white"
                        : day.currentMonth
                          ? "text-slate-600"
                          : "text-slate-300"
                    }`}
                  >
                    {day.date.getDate()}
                  </span>

                  <div className="mt-1 space-y-1">
                    {safeTasks
                      .filter((task) => {
                        if (!task.deadline) {
                          return false
                        }

                        return (
                          task.deadline.slice(
                            0,
                            10,
                          ) === day.iso
                        )
                      })
                      .map((task) => (
                        <button
                          key={task.id}
                          onClick={() =>
                            onOpenTask(task.id)
                          }
                          className={`block w-full truncate rounded-md px-2 py-1 text-left text-[11px] font-semibold ${
                            task.priority ===
                            "High"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {task.title}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function NotificationsPage({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}) {
  const [filter, setFilter] = useState("All")

  const safeNotifications =
    notifications ?? []

  const shown =
    filter === "Unread"
      ? safeNotifications.filter(
          (item) => item.unread,
        )
      : safeNotifications

  return (
    <div>
      <PageTitle
        title="Notifications"
        description="Stay up to date with team activity and deadlines."
        actions={
          <Button
            variant="secondary"
            onClick={onMarkAllRead}
          >
            Mark all as read
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5">
          <Tabs
            items={["All", "Unread"]}
            active={filter}
            onChange={setFilter}
          />

          <Button
            variant="ghost"
            size="icon"
            aria-label="Notification settings"
          >
            <Settings2 size={18} />
          </Button>
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<Bell size={22} />}
            title={
              filter === "Unread"
                ? "No unread notifications"
                : "No notifications yet"
            }
            description="You're all caught up."
          />
        ) : (
          shown.map((notification) => (
            <button
              key={notification.id}
              onClick={() =>
                onMarkRead(notification.id)
              }
              className="block w-full text-left"
            >
              <NotificationItem
                notification={notification}
              />
            </button>
          ))
        )}
      </Card>
    </div>
  )
}

export function SettingsPage({
  profile,
  preferences,
  workspace,
  onSaveProfile,
  onUpdatePreferences,
  onSaveWorkspace,
  onReset,
}: {
  profile: Profile
  preferences: UserPreferences
  workspace: WorkspaceSettings
  onSaveProfile: (value: Profile) => void
  onUpdatePreferences: (
    value: Partial<UserPreferences>,
  ) => void
  onSaveWorkspace: (
    value: WorkspaceSettings,
  ) => void
  onReset: () => void
}) {
  const { currentUserId } = useWorkspace()

  const [tab, setTab] = useState("Profile")
  const [profileForm, setProfileForm] =
    useState(profile)
  const [workspaceForm, setWorkspaceForm] =
    useState(workspace)

  useEffect(() => {
    setProfileForm(profile)
  }, [profile])

  useEffect(() => {
    setWorkspaceForm(workspace)
  }, [workspace])

  return (
    <div>
      <PageTitle
        title="Settings"
        description="Manage your profile, preferences, and workspace."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-2">
          {[
            "Profile",
            "Notifications",
            "Appearance",
            "Workspace",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium ${
                tab === item
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
        </Card>

        <Card className="p-6 md:p-8">
          {tab === "Profile" && (
            <div>
              <SectionHeader
                title="Profile information"
                subtitle="Update your personal details and photo."
              />

              <div className="my-7 flex items-center gap-4">
                <MemberAvatar
                  memberId={currentUserId}
                  size="lg"
                />

                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                  >
                    Change photo
                  </Button>

                  <Text className="mt-1">
                    JPG or PNG, up to 2 MB.
                  </Text>
                </div>
              </div>

              <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="profile-first">
                    First name
                  </Label>

                  <Input
                    id="profile-first"
                    value={profileForm.firstName}
                    onChange={(event) =>
                      setProfileForm({
                        ...profileForm,
                        firstName:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="profile-last">
                    Last name
                  </Label>

                  <Input
                    id="profile-last"
                    value={profileForm.lastName}
                    onChange={(event) =>
                      setProfileForm({
                        ...profileForm,
                        lastName:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="profile-email">
                    Email address
                  </Label>

                  <Input
                    id="profile-email"
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm({
                        ...profileForm,
                        email:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="profile-role">
                    Role
                  </Label>

                  <Input
                    id="profile-role"
                    value={profileForm.role}
                    onChange={(event) =>
                      setProfileForm({
                        ...profileForm,
                        role:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="profile-bio">
                    Bio
                  </Label>

                  <Textarea
                    id="profile-bio"
                    value={profileForm.bio}
                    onChange={(event) =>
                      setProfileForm({
                        ...profileForm,
                        bio:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Button
                className="mt-6"
                onClick={() =>
                  onSaveProfile(profileForm)
                }
              >
                Save changes
              </Button>
            </div>
          )}

          {tab === "Notifications" && (
            <div>
              <SectionHeader
                title="Notification preferences"
                subtitle="Choose how and when you want to be notified."
              />

              <div className="mt-6 max-w-2xl divide-y divide-slate-100">
                {[
                  [
                    "Task assignments",
                    "When someone assigns a task to you",
                    "taskAssignments",
                  ],
                  [
                    "Comments and mentions",
                    "When someone comments or mentions you",
                    "comments",
                  ],
                  [
                    "Deadline reminders",
                    "Reminders 24 hours before a task is due",
                    "deadlines",
                  ],
                  [
                    "File activity",
                    "When a file is uploaded to your projects",
                    "fileActivity",
                  ],
                ].map(([title, body, key]) => (
                  <div
                    key={title}
                    className="flex items-center justify-between gap-6 py-5"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        {title}
                      </div>

                      <Text>{body}</Text>
                    </div>

                    <Switch
                      label={title}
                      checked={Boolean(
                        preferences[
                          key as keyof UserPreferences
                        ],
                      )}
                      onChange={() =>
                        onUpdatePreferences({
                          [key]:
                            !preferences[
                              key as keyof UserPreferences
                            ],
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Appearance" && (
            <div>
              <SectionHeader
                title="Appearance"
                subtitle="Your preference is saved; the current workspace uses the optimized light theme."
              />

              <div className="mt-6">
                <Label>Theme</Label>

                <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
                  {(
                    [
                      "Light",
                      "Dark",
                      "System",
                    ] as const
                  ).map((theme) => (
                    <button
                      key={theme}
                      onClick={() =>
                        onUpdatePreferences({
                          theme,
                        })
                      }
                      className={`rounded-2xl border-2 p-3 text-left ${
                        preferences.theme ===
                        theme
                          ? "border-indigo-500"
                          : "border-slate-200"
                      }`}
                    >
                      <div
                        className={`mb-3 h-24 rounded-xl ${
                          theme === "Dark"
                            ? "bg-slate-900"
                            : theme === "System"
                              ? "bg-gradient-to-r from-white to-slate-900"
                              : "bg-slate-100"
                        }`}
                      />

                      <span className="text-sm font-semibold">
                        {theme}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Workspace" && (
            <div>
              <SectionHeader
                title="Workspace settings"
                subtitle="Manage your team’s shared workspace."
              />

              <div className="mt-6 max-w-2xl space-y-5">
                <div>
                  <Label htmlFor="workspace-name">
                    Workspace name
                  </Label>

                  <Input
                    id="workspace-name"
                    value={workspaceForm.name}
                    onChange={(event) =>
                      setWorkspaceForm({
                        ...workspaceForm,
                        name: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="workspace-url">
                    Workspace URL
                  </Label>

                  <Input
                    id="workspace-url"
                    value={workspaceForm.url}
                    onChange={(event) =>
                      setWorkspaceForm({
                        ...workspaceForm,
                        url: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="workspace-visibility">
                    Default project visibility
                  </Label>

                  <Select
                    id="workspace-visibility"
                    className="w-full"
                    value={workspaceForm.visibility}
                    onChange={(event) =>
                      setWorkspaceForm({
                        ...workspaceForm,
                        visibility:
                          event.target
                            .value as WorkspaceSettings["visibility"],
                      })
                    }
                  >
                    <option>
                      Workspace members
                    </option>

                    <option>
                      Private
                    </option>
                  </Select>
                </div>

                <Button
                  onClick={() =>
                    onSaveWorkspace(
                      workspaceForm,
                    )
                  }
                >
                  Save workspace
                </Button>

                <div className="mt-10 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="font-semibold text-rose-800">
                    Reset workspace
                  </div>

                  <Text className="text-rose-600">
                    Reset the current workspace state.
                  </Text>

                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-3"
                    onClick={onReset}
                  >
                    Reset workspace
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            {eyebrow}
          </div>
        )}

        <Heading level={1}>{title}</Heading>

        <Text className="mt-1">
          {description}
        </Text>
      </div>

      {actions && (
        <div className="flex flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <Heading level={2}>{title}</Heading>

        {subtitle && <Text>{subtitle}</Text>}
      </div>

      {action}
    </div>
  )
}

interface PageProps {
  tasks: Task[]
  onNavigate: (
    view: "projects" | "tasks",
  ) => void
  onOpenTask: (id: string) => void
}