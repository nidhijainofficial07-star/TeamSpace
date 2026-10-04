import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Palette,
  Link2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  UserRound,
} from "lucide-react"
import { useWorkspace } from "../app/WorkspaceProvider"
import type {
  Activity,
  Notification,
  Priority,
  Project,
  Task,
  TaskStatus,
  TeamFile,
} from "../types"
import {
  Badge,
  Button,
  Card,
  Heading,
  Input,
  Label,
  Modal,
  Progress,
  Select,
  Text,
  Textarea,
} from "./ui"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getInitials(value?: string | null) {
  if (!value) return "?"

  const trimmed = value.trim()

  if (!trimmed) return "?"

  const parts = trimmed.split(/\s+/)

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
  }

  return trimmed.slice(0, 2).toUpperCase()
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) {
    return "No deadline"
  }

  const parsedDate =
    date instanceof Date
      ? date
      : new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return "No deadline"
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/* -------------------------------------------------------------------------- */
/* Member Avatar                                                              */
/* -------------------------------------------------------------------------- */

export function MemberAvatar({
  memberId,
  size = "md",
  showStatus = false,
}: {
  memberId?: string | null
  size?: "sm" | "md" | "lg"
  showStatus?: boolean
}) {
  const sizeClass =
    size === "sm"
      ? "h-7 w-7 text-[10px]"
      : size === "lg"
        ? "h-11 w-11 text-sm"
        : "h-9 w-9 text-xs"

  const initials = getInitials(memberId)

  return (
    <div className="relative shrink-0">
      <div
        title={memberId || "Team member"}
        className={`flex ${sizeClass} items-center justify-center rounded-full bg-primary/10 font-semibold text-primary`}
      >
        {initials}
      </div>

      {showStatus && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Status / Priority                                                          */
/* -------------------------------------------------------------------------- */

export function StatusBadge({
  status,
}: {
  status: TaskStatus
}) {
  const styles: Record<TaskStatus, string> = {
    "To Do": "bg-slate-100 text-slate-600",
    "In Progress": "bg-blue-50 text-blue-700",
    Completed: "bg-emerald-50 text-emerald-700",
  }

  return (
    <Badge className={styles[status]}>
      {status === "Completed" && (
        <Check
          size={12}
          className="mr-1"
        />
      )}
      {status}
    </Badge>
  )
}

export function PriorityBadge({
  priority,
}: {
  priority: Priority
}) {
  const styles: Record<Priority, string> = {
    Low: "bg-slate-100 text-slate-600",
    Medium: "bg-amber-50 text-amber-700",
    High: "bg-rose-50 text-rose-700",
  }

  return (
    <Badge className={styles[priority]}>
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          priority === "High"
            ? "bg-rose-500"
            : priority === "Medium"
              ? "bg-amber-500"
              : "bg-slate-400"
        }`}
      />
      {priority}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/* Project Card                                                               */
/* -------------------------------------------------------------------------- */

export function ProjectCard({
  project,
  onOpen,
}: {
  project: Project
  onOpen: () => void
}) {
  return (
    <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="w-full p-5 text-left"
      >
        <div className="mb-5 flex items-start justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm ${
              project.color || "bg-indigo-500"
            }`}
          >
            {project.name?.[0] ?? "P"}
          </div>

          <Badge className="bg-slate-50 text-slate-600">
            {project.taskCount ?? 0} tasks
          </Badge>
        </div>

        <Heading
          level={3}
          className="mb-1 group-hover:text-indigo-600"
        >
          {project.name}
        </Heading>

        <Text className="mb-5 line-clamp-2 min-h-12">
          {project.description ||
            "No description available."}
        </Text>

        <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
          <span>Progress</span>
          <span>
            {project.progress ?? 0}%
          </span>
        </div>

        <Progress
          value={project.progress ?? 0}
        />

        <div className="mt-5 flex items-center justify-between">
          <div className="flex -space-x-2">
            {(project.memberIds ?? [])
              .slice(0, 4)
              .map((id) => (
                <MemberAvatar
                  key={id}
                  memberId={id}
                  size="sm"
                />
              ))}
          </div>

          {project.deadline && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays size={14} />
              {formatDate(
                project.deadline,
              )}
            </div>
          )}
        </div>
      </button>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Task Card                                                                  */
/* -------------------------------------------------------------------------- */

export function TaskCard({
  task,
  onOpen,
  compact = false,
}: {
  task: Task
  onOpen: () => void
  compact?: boolean
}) {
  return (
    <Card
      className={`overflow-hidden transition hover:border-indigo-200 hover:shadow-md ${
        compact ? "" : "mb-3"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="w-full p-4 text-left"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <Heading
            level={4}
            className="leading-5"
          >
            {task.title}
          </Heading>

          <PriorityBadge
            priority={task.priority}
          />
        </div>

        {!compact && (
          <Text className="mb-4 line-clamp-2">
            {task.description ||
              "No description."}
          </Text>
        )}

        <div className="mb-4 flex flex-wrap gap-1.5">
          {(task.tags ?? []).map(
            (tag) => (
              <Badge
                key={tag}
                className="bg-indigo-50 text-indigo-600"
              >
                {tag}
              </Badge>
            ),
          )}
        </div>

        <div className="flex items-center justify-between">
          <MemberAvatar
            memberId={task.assigneeId}
            size="sm"
          />

          <div className="flex items-center gap-3 text-xs text-slate-500">
            {(task.comments ?? [])
              .length > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare
                  size={13}
                />
                {task.comments.length}
              </span>
            )}

            {(task.attachments ?? [])
              .length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip size={13} />
                {task.attachments.length}
              </span>
            )}

            {task.deadline && (
              <span className="flex items-center gap-1">
                <Clock3 size={13} />
                {formatDate(
                  task.deadline,
                )}
              </span>
            )}
          </div>
        </div>
      </button>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Task Modal                                                                 */
/* -------------------------------------------------------------------------- */

export function TaskModal({
  open,
  onClose,
  onSave,
  task,
  projects = [],
  defaultProjectId,
}: {
  open: boolean
  onClose: () => void
  onSave: (
    task: Partial<Task>,
  ) => void | Promise<void>
  task?: Task | null
  projects?: Project[]
  defaultProjectId?: string
}) {
  const {
    state,
    currentUserId,
  } = useWorkspace()

  const [title, setTitle] =
    useState("")

  const [description, setDescription] =
    useState("")

  const [status, setStatus] =
    useState<TaskStatus>("To Do")

  const [priority, setPriority] =
    useState<Priority>("Medium")

  const [assigneeId, setAssigneeId] =
    useState("")

  const [projectId, setProjectId] =
    useState("")

  const [deadline, setDeadline] =
    useState("")

  const [tags, setTags] =
    useState("")

  const [attempted, setAttempted] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  useEffect(() => {
    if (!open) return

    setTitle(task?.title ?? "")
    setDescription(
      task?.description ?? "",
    )
    setStatus(
      task?.status ?? "To Do",
    )
    setPriority(
      task?.priority ?? "Medium",
    )
    setAssigneeId(
      task?.assigneeId ??
        currentUserId,
    )
    setProjectId(
      task?.projectId ??
        defaultProjectId ??
        projects[0]?.id ??
        "",
    )
    setDeadline(
      task?.deadline ?? "",
    )
    setTags(
      task?.tags?.join(", ") ?? "",
    )
    setAttempted(false)
    setSaving(false)
  }, [
    open,
    task,
    currentUserId,
    defaultProjectId,
    projects,
  ])

  const submit = async () => {
    setAttempted(true)

    if (!currentUserId) {
      return
    }

    if (!title.trim()) {
      return
    }

    if (!projectId) {
      return
    }

    if (!assigneeId) {
      return
    }

    if (!deadline) {
      return
    }

    if (saving) {
      return
    }

    setSaving(true)

    try {
      await Promise.resolve(
        onSave({
          ...(task?.id
            ? { id: task.id }
            : {}),
          title: title.trim(),
          description:
            description.trim(),
          assigneeId,
          projectId,
          status,
          priority,
          deadline,
          tags: tags
            .split(",")
            .map((tag) =>
              tag.trim(),
            )
            .filter(Boolean),
          ...(task?.version !==
          undefined
            ? {
                version:
                  task.version,
              }
            : {}),
        }),
      )

      onClose()
    } catch (error) {
      console.error(
        "Failed to save task:",
        error,
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    void submit()
  }

  const profileName =
    state.profile?.firstName ||
    state.profile?.email ||
    "Me"

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) {
          onClose()
        }
      }}
      title={
        task
          ? "Edit task"
          : "Create a new task"
      }
      description="Add the details your team needs to move this work forward."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() =>
              void submit()
            }
            disabled={
              saving ||
              !currentUserId
            }
          >
            {saving
              ? task
                ? "Saving..."
                : "Creating..."
              : task
                ? "Save changes"
                : "Create task"}
          </Button>
        </div>
      }
    >
      <form
        id="task-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="task-title">
            Task title
          </Label>

          <Input
            id="task-title"
            autoFocus
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
            placeholder="What needs to be done?"
            aria-invalid={
              attempted &&
              !title.trim()
            }
          />

          {attempted &&
            !title.trim() && (
              <div className="mt-1 text-xs text-rose-600">
                Enter a task title.
              </div>
            )}
        </div>

        <div>
          <Label htmlFor="task-description">
            Description
          </Label>

          <Textarea
            id="task-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            placeholder="Add context and acceptance criteria..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="task-status">
              Status
            </Label>

            <Select
              id="task-status"
              className="w-full"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as TaskStatus,
                )
              }
            >
              <option value="To Do">
                To Do
              </option>
              <option value="In Progress">
                In Progress
              </option>
              <option value="Completed">
                Completed
              </option>
            </Select>
          </div>

          <div>
            <Label htmlFor="task-priority">
              Priority
            </Label>

            <Select
              id="task-priority"
              className="w-full"
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target
                    .value as Priority,
                )
              }
            >
              <option value="Low">
                Low
              </option>
              <option value="Medium">
                Medium
              </option>
              <option value="High">
                High
              </option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="task-assignee">
              Assignee
            </Label>

            <Select
              id="task-assignee"
              className="w-full"
              value={assigneeId}
              onChange={(event) =>
                setAssigneeId(
                  event.target.value,
                )
              }
              disabled={
                !currentUserId
              }
            >
              {currentUserId && (
                <option
                  value={
                    currentUserId
                  }
                >
                  {profileName}
                </option>
              )}
            </Select>

            {attempted &&
              !assigneeId && (
                <div className="mt-1 text-xs text-rose-600">
                  Choose an assignee.
                </div>
              )}
          </div>

          <div>
            <Label htmlFor="task-deadline">
              Deadline
            </Label>

            <Input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(event) =>
                setDeadline(
                  event.target.value,
                )
              }
              aria-invalid={
                attempted &&
                !deadline
              }
            />

            {attempted &&
              !deadline && (
                <div className="mt-1 text-xs text-rose-600">
                  Choose a deadline.
                </div>
              )}
          </div>
        </div>

        <div>
          <Label htmlFor="task-project">
            Project
          </Label>

          <Select
            id="task-project"
            className="w-full"
            value={projectId}
            onChange={(event) =>
              setProjectId(
                event.target.value,
              )
            }
            disabled={
              projects.length === 0
            }
          >
            {projects.length === 0 ? (
              <option value="">
                No projects available
              </option>
            ) : (
              projects.map(
                (project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ),
              )
            )}
          </Select>

          {attempted &&
            !projectId && (
              <div className="mt-1 text-xs text-rose-600">
                Choose a project.
              </div>
            )}
        </div>

        <div>
          <Label htmlFor="task-tags">
            Tags
          </Label>

          <Input
            id="task-tags"
            value={tags}
            onChange={(event) =>
              setTags(
                event.target.value,
              )
            }
            placeholder="Design, Mobile"
          />
        </div>
      </form>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Comments                                                                   */
/* -------------------------------------------------------------------------- */

export function CommentSection({
  task,
  onAddComment,
}: {
  task: Task
  onAddComment?: (
    body: string,
  ) => void
}) {
  const {
    state,
    currentUserId,
  } = useWorkspace()

  const [value, setValue] =
    useState("")

  const send = () => {
    const trimmed =
      value.trim()

    if (!trimmed) return

    onAddComment?.(trimmed)
    setValue("")
  }

  const comments =
    task.comments ?? []

  return (
    <div>
      <Heading
        level={3}
        className="mb-4"
      >
        Comments{" "}
        <span className="text-slate-400">
          ({comments.length})
        </span>
      </Heading>

      <div className="space-y-5">
        {comments.length === 0 ? (
          <Text>
            No comments yet.
          </Text>
        ) : (
          comments.map(
            (comment) => {
              const authorName =
                comment.authorId ===
                currentUserId
                  ? state.profile
                      ?.firstName ||
                    state.profile
                      ?.email ||
                    "You"
                  : comment.authorId
                    ? `User ${comment.authorId.slice(
                        0,
                        6,
                      )}`
                    : "Unknown user"

              return (
                <div
                  key={comment.id}
                  className="flex gap-3"
                >
                  <MemberAvatar
                    memberId={
                      comment.authorId
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {authorName}
                      </span>

                      <span className="text-xs text-slate-400">
                        {comment.createdAt}
                      </span>
                    </div>

                    <Text className="mt-1 text-slate-600">
                      {comment.body}
                    </Text>
                  </div>
                </div>
              )
            },
          )
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <MemberAvatar
          memberId={
            currentUserId
          }
        />

        <Input
          value={value}
          onChange={(event) =>
            setValue(
              event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              send()
            }
          }}
          placeholder="Write a comment..."
        />

        <Button
          type="button"
          size="icon"
          onClick={send}
          aria-label="Send comment"
          disabled={!value.trim()}
        >
          <Send size={17} />
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Files                                                                      */
/* -------------------------------------------------------------------------- */

const fileIcon = (
  type: TeamFile["type"],
) => {
  const props = { size: 19 }

  if (type === "figma")
    return <Palette {...props} />

  if (type === "image")
    return <FileImage {...props} />

  if (type === "sheet")
    return <FileSpreadsheet {...props} />

  if (type === "doc")
    return <FileText {...props} />

  return <File {...props} />
}

export function FileList({
  projectId = "",
  compact = false,
  files = [],
  onDownload,
}: {
  projectId?: string
  compact?: boolean
  files?: TeamFile[]
  onDownload?: (
    file: TeamFile,
  ) => void
}) {
  const projectFiles =
    files.filter(
      (file) =>
        file.projectId ===
        projectId,
    )

  return (
    <div className="divide-y divide-slate-100">
      {projectFiles.length ===
      0 ? (
        <div className="py-8 text-center">
          <Text>
            No files uploaded yet.
          </Text>
        </div>
      ) : (
        projectFiles.map(
          (file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 py-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {fileIcon(
                  file.type,
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">
                  {file.name}
                </div>

                <div className="text-xs text-slate-400">
                  {file.size}

                  {!compact &&
                    ` · Uploaded ${file.uploadedAt}`}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Download ${file.name}`}
                onClick={() =>
                  onDownload?.(
                    file,
                  )
                }
              >
                <Download
                  size={17}
                />
              </Button>
            </div>
          ),
        )
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Activity                                                                   */
/* -------------------------------------------------------------------------- */

export function ActivityTimeline({
  items = [],
  limit,
}: {
  items?: Activity[]
  limit?: number
}) {
  const visibleItems =
    typeof limit === "number"
      ? items.slice(0, limit)
      : items

  if (
    visibleItems.length === 0
  ) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <Clock3 className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />

        <p className="text-sm text-muted-foreground">
          No activity yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visibleItems.map(
        (item) => (
          <div
            key={item.id}
            className="flex items-start gap-3"
          >
            <MemberAvatar
              memberId={
                item.memberId
              }
              size="sm"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {item.action ||
                  "Activity updated"}
                {item.target
                  ? ` ${item.target}`
                  : ""}
              </p>

              {item.time && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(
                    item.time,
                  ).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

const notificationIcon: Record<
  Notification["type"],
  ReactNode
> = {
  assignment: (
    <UserRound size={18} />
  ),
  update: (
    <CheckCircle2 size={18} />
  ),
  comment: (
    <MessageSquare size={18} />
  ),
  deadline: (
    <Clock3 size={18} />
  ),
  file: (
    <Paperclip size={18} />
  ),
}

export function NotificationItem({
  notification,
}: {
  notification: Notification
}) {
  return (
    <div
      className={`flex gap-4 border-b border-slate-100 p-5 last:border-0 ${
        notification.unread
          ? "bg-indigo-50/40"
          : ""
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          notification.unread
            ? "bg-indigo-100 text-indigo-600"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {
          notificationIcon[
            notification.type
          ]
        }
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">
            {notification.title}
          </div>

          <span className="whitespace-nowrap text-xs text-slate-400">
            {notification.time}
          </span>
        </div>

        <Text>
          {notification.body}
        </Text>
      </div>

      {notification.unread && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Empty / Loading                                                            */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon = <File size={24} />,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <Heading level={3}>
        {title}
      </Heading>

      <Text className="mt-1 max-w-sm">
        {description}
      </Text>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(
        (item) => (
          <div
            key={item}
            className="h-20 animate-pulse rounded-2xl bg-slate-100"
          />
        ),
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Task Details                                                               */
/* -------------------------------------------------------------------------- */

export function TaskDetails({
  task,
  project,
  onClose,
  onEdit,
  onAddComment,
  onStatusChange,
}: {
  task: Task
  project?: Project
  onClose: () => void
  onEdit: () => void
  onAddComment?: (
    body: string,
  ) => void
  onStatusChange?: (
    status: TaskStatus,
  ) => void
}) {
  const {
    state,
    currentUserId,
  } = useWorkspace()

  const projectFiles =
    task.attachments ?? []

  const currentUserName =
    state.profile?.firstName ||
    state.profile?.email ||
    "Current user"

  const assigneeName =
    task.assigneeId ===
    currentUserId
      ? currentUserName
      : task.assigneeId
        ? `User ${task.assigneeId.slice(
            0,
            6,
          )}`
        : "Unassigned"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Select
              aria-label="Task status"
              value={task.status}
              onChange={(event) =>
                onStatusChange?.(
                  event.target
                    .value as TaskStatus,
                )
              }
            >
              <option value="To Do">
                To Do
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Completed">
                Completed
              </option>
            </Select>

            <PriorityBadge
              priority={
                task.priority
              }
            />
          </div>

          <Heading level={1}>
            {task.title}
          </Heading>

          <Text className="mt-2">
            {task.description ||
              "No description provided."}
          </Text>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Back
          </Button>

          <Button
            type="button"
            onClick={onEdit}
          >
            Edit task
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="p-6">
            <Heading
              level={3}
              className="mb-3"
            >
              Description
            </Heading>

            <Text className="text-slate-600">
              {task.description ||
                "No description provided."}
            </Text>
          </Card>

          <Card className="p-6">
            <CommentSection
              task={task}
              onAddComment={
                onAddComment
              }
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <Heading
              level={3}
              className="mb-4"
            >
              Task details
            </Heading>

            <Detail
              icon={
                <UserRound size={16} />
              }
              label="Assignee"
            >
              <div className="flex items-center gap-2">
                <MemberAvatar
                  memberId={
                    task.assigneeId
                  }
                  size="sm"
                />

                <span>
                  {assigneeName}
                </span>
              </div>
            </Detail>

            <Detail
              icon={
                <CalendarDays
                  size={16}
                />
              }
              label="Deadline"
            >
              {formatDate(
                task.deadline,
              )}
            </Detail>

            <Detail
              icon={
                <Link2 size={16} />
              }
              label="Project"
            >
              {project?.name ??
                "Unknown project"}
            </Detail>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <Heading level={3}>
                Attachments
              </Heading>

              <Button
                type="button"
                variant="ghost"
                size="sm"
              >
                <Plus size={15} />
                Add
              </Button>
            </div>

            {projectFiles.length ? (
              projectFiles.map(
                (file) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 border-t border-slate-100 py-3 text-sm text-slate-700"
                  >
                    <Paperclip
                      size={16}
                      className="text-slate-400"
                    />

                    <span className="truncate">
                      {file}
                    </span>
                  </div>
                ),
              )
            ) : (
              <Text>
                No attachments yet.
              </Text>
            )}
          </Card>

          <Card className="p-5">
            <Heading
              level={3}
              className="mb-4"
            >
              Activity
            </Heading>

            <ActivityTimeline
              limit={3}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                     */
/* -------------------------------------------------------------------------- */

function Detail({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </div>

      <div className="text-sm font-medium text-slate-700">
        {children}
      </div>
    </div>
  )
}