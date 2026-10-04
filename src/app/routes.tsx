import { useState } from "react"
import {
  Navigate,
  Outlet,
  createBrowserRouter,
  useLocation,
  useNavigate,
  useParams,
} from "react-router"
import { AppLayout } from "../components/Layout"
import { ProjectFormDialog } from "../components/ProjectFormDialog"
import {
  TaskDetails,
  TaskModal,
} from "../components/product"
import {
  Button,
  Card,
  Heading,
  Text,
} from "../components/ui"
import {
  CalendarPage,
  DashboardPage,
  LoginPage,
  NotificationsPage,
  ProjectPage,
  ProjectsPage,
  SettingsPage,
  TasksPage,
} from "../pages/Pages"
import type { Task } from "../types"
import { useToast } from "./ToastProvider"
import { useWorkspace } from "./WorkspaceProvider"

/* -------------------------------------------------------------------------- */
/* PROTECTED ROUTE                                                            */
/* -------------------------------------------------------------------------- */

function ProtectedRoute() {
  const {
    state,
    authReady,
  } = useWorkspace()

  const location = useLocation()

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Loading TeamSpace...
        </div>
      </div>
    )
  }

  return state.loggedIn ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{
        from:
          location.pathname +
          location.search,
      }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* LOGIN                                                                      */
/* -------------------------------------------------------------------------- */

function LoginRoute() {
  const {
    state,
    login,
    authReady,
  } = useWorkspace()
  const notify = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  if (!authReady) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-sm text-slate-500">
        Loading TeamSpace...
      </div>
    </div>
  )
}

  if (state.loggedIn) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return (
    <LoginPage
      onMockAction={notify}
      onLogin={() => {
        login()

        const from = (
          location.state as
            | { from?: string }
            | null
        )?.from

        navigate(
          from ?? "/dashboard",
          {
            replace: true,
          },
        )
      }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* DASHBOARD                                                                  */
/* -------------------------------------------------------------------------- */

function DashboardRoute() {
  const {
    state,
    projectSummary,
    createProject,
    createTask,
  } = useWorkspace()

  const navigate = useNavigate()
  const notify = useToast()

  const [projectOpen, setProjectOpen] =
    useState(false)

  const [taskOpen, setTaskOpen] =
    useState(false)

  const summarized =
    state.projects.map(
      projectSummary,
    )

  return (
    <>
      <DashboardPage
        tasks={state.tasks}
        projects={summarized}
        onNavigate={(view) =>
          navigate(`/${view}`)
        }
        onOpenTask={(id) =>
          navigate(`/tasks/${id}`)
        }
        onCreateTask={() =>
          setTaskOpen(true)
        }
        onCreateProject={() =>
          setProjectOpen(true)
        }
      />

      <ProjectFormDialog
        key={String(projectOpen)}
        open={projectOpen}
        onClose={() =>
          setProjectOpen(false)
        }
        onSave={(value) => {
          const project =
            createProject(value)

          notify(
            "Project created successfully",
          )

          navigate(
            `/projects/${project.id}`,
          )
        }}
      />

      <ConnectedTaskDialog
        open={taskOpen}
        onClose={() =>
          setTaskOpen(false)
        }
        onSave={(task) => {
          createTask(task)

          notify(
            "Task created successfully",
          )
        }}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* PROJECTS                                                                   */
/* -------------------------------------------------------------------------- */

function ProjectsRoute() {
  const {
    state,
    projectSummary,
    createProject,
  } = useWorkspace()

  const navigate = useNavigate()
  const notify = useToast()

  const [open, setOpen] =
    useState(false)

  return (
    <>
      <ProjectsPage
        projects={state.projects.map(
          projectSummary,
        )}
        onOpenProject={(id) =>
          navigate(
            `/projects/${id}`,
          )
        }
        onCreateProject={() =>
          setOpen(true)
        }
      />

      <ProjectFormDialog
        key={String(open)}
        open={open}
        onClose={() =>
          setOpen(false)
        }
        onSave={(value) => {
          const project =
            createProject(value)

          notify(
            "Project created successfully",
          )

          navigate(
            `/projects/${project.id}`,
          )
        }}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* PROJECT DETAIL                                                             */
/* -------------------------------------------------------------------------- */

function ProjectRoute() {
  const { projectId = "" } =
    useParams()

  const {
    state,
    projectSummary,
    createTask,
    updateProject,
    addMessage,
    addFile,
    addProjectMember,
  } = useWorkspace()

  const navigate = useNavigate()
  const notify = useToast()

  const [taskOpen, setTaskOpen] =
    useState(false)

  const [projectOpen, setProjectOpen] =
    useState(false)

  const project =
    state.projects.find(
      (item) =>
        item.id === projectId,
    )

  if (!project) {
    return (
      <EntityNotFound
        entity="project"
        destination="/projects"
      />
    )
  }

  return (
    <>
      <ProjectPage
        project={projectSummary(
          project,
        )}
        tasks={state.tasks}
        files={state.files}
        messages={state.discussions}
        onOpenTask={(id) =>
          navigate(`/tasks/${id}`)
        }
        onCreateTask={() =>
          setTaskOpen(true)
        }
        onEditProject={() =>
          setProjectOpen(true)
        }
        onAddMember={(
  projectId,
  userId,
  role,
) => {
  addProjectMember(
    projectId,
    userId,
    role,
  )
}}

        onAddMessage={(body) =>
          addMessage(
            project.id,
            body,
          )
        }
        onAddFile={(file) => {
          addFile(
            project.id,
            file,
          )

          notify(
            `${file.name} added to the project`,
          )
        }}
        onDownload={(file) =>
          notify(
            `Demo download prepared for ${file.name}`,
          )
        }
      />

      <ConnectedTaskDialog
        open={taskOpen}
        onClose={() =>
          setTaskOpen(false)
        }
        defaultProjectId={
          project.id
        }
        onSave={(task) => {
          createTask(task)

          notify(
            "Task created successfully",
          )
        }}
      />

      <ProjectFormDialog
        key={`${project.id}-${projectOpen}`}
        open={projectOpen}
        onClose={() =>
          setProjectOpen(false)
        }
        project={project}
        onSave={(value) => {
          updateProject(
            project.id,
            value,
          )

          notify(
            "Project changes saved",
          )
        }}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* TASKS                                                                      */
/* -------------------------------------------------------------------------- */

function TasksRoute() {
  const {
    state,
    createTask,
  } = useWorkspace()

  const navigate = useNavigate()
  const notify = useToast()

  const [open, setOpen] =
    useState(false)

  return (
    <>
      <TasksPage
        tasks={state.tasks}
        projects={state.projects}
        onOpenTask={(id) =>
          navigate(`/tasks/${id}`)
        }
        onCreateTask={() =>
          setOpen(true)
        }
      />

      <ConnectedTaskDialog
        open={open}
        onClose={() =>
          setOpen(false)
        }
        onSave={(task) => {
          createTask(task)

          notify(
            "Task created successfully",
          )
        }}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* TASK DETAIL                                                                */
/* -------------------------------------------------------------------------- */

function TaskRoute() {
  const { taskId = "" } =
    useParams()

  const {
    state,
    updateTask,
    addComment,
  } = useWorkspace()

  const navigate = useNavigate()
  const location = useLocation()
  const notify = useToast()

  const [editing, setEditing] =
    useState(false)

  const task =
    state.tasks.find(
      (item) =>
        item.id === taskId,
    )

  if (!task) {
    return (
      <EntityNotFound
        entity="task"
        destination="/tasks"
      />
    )
  }

  const project =
    state.projects.find(
      (item) =>
        item.id === task.projectId,
    )

  return (
    <>
      <TaskDetails
        task={task}
        project={project}
        onClose={() =>
          location.key === "default"
            ? navigate("/tasks")
            : navigate(-1)
        }
        onEdit={() =>
          setEditing(true)
        }
        onAddComment={(body) => {
          addComment(
            task.id,
            body,
          )

          notify(
            "Comment added",
          )
        }}
        onStatusChange={(status) => {
          updateTask(
            task.id,
            { status },
          )

          notify(
            `Task moved to ${status}`,
          )
        }}
      />

      <TaskModal
        key={`${task.id}-${editing}`}
        open={editing}
        onClose={() =>
          setEditing(false)
        }
        task={task}
        projects={state.projects}
        onSave={(partial) => {
          updateTask(
            task.id,
            partial,
          )

          notify(
            "Task changes saved",
          )
        }}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* CALENDAR                                                                   */
/* -------------------------------------------------------------------------- */

function CalendarRoute() {
  const { state } =
    useWorkspace()

  const navigate =
    useNavigate()

  return (
    <CalendarPage
      tasks={state.tasks}
      onOpenTask={(id) =>
        navigate(`/tasks/${id}`)
      }
    />
  )
}

/* -------------------------------------------------------------------------- */
/* NOTIFICATIONS                                                              */
/* -------------------------------------------------------------------------- */

function NotificationsRoute() {
  const {
    state,
    markRead,
  } = useWorkspace()

  const notify = useToast()

  return (
    <NotificationsPage
      notifications={
        state.notifications
      }
      onMarkRead={markRead}
      onMarkAllRead={() => {
        markRead()

        notify(
          "All notifications marked as read",
        )
      }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* SETTINGS                                                                   */
/* -------------------------------------------------------------------------- */

function SettingsRoute() {
  const {
    state,
    updatePreferences,
    updateProfile,
    updateWorkspace,
    reset,
  } = useWorkspace()

  const notify = useToast()

  return (
    <SettingsPage
      profile={state.profile}
      preferences={
        state.preferences
      }
      workspace={
        state.workspace
      }
      onSaveProfile={(value) => {
        updateProfile(value)

        notify(
          "Profile saved",
        )
      }}
      onUpdatePreferences={(value) => {
        updatePreferences(value)

        notify(
          "Preference saved",
        )
      }}
      onSaveWorkspace={(value) => {
        updateWorkspace(value)

        notify(
          "Workspace settings saved",
        )
      }}
      onReset={() => {
        reset()

        notify(
          "Demo workspace reset",
        )
      }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* CONNECTED TASK DIALOG                                                      */
/* -------------------------------------------------------------------------- */

function ConnectedTaskDialog({
  open,
  onClose,
  onSave,
  defaultProjectId,
}: {
  open: boolean
  onClose: () => void
  onSave: (
    task: Omit<
      Task,
      "id" | "comments" | "attachments"
    >,
  ) => void
  defaultProjectId?: string
}) {
  const {
    state,
    currentUserId,
    addProjectMember,

  } = useWorkspace()

  return (
    <TaskModal
      key={`${open}-${defaultProjectId}`}
      open={open}
      onClose={onClose}
      projects={state.projects}
      defaultProjectId={
        defaultProjectId
      }
      onSave={(partial) =>
        onSave({
          projectId:
            partial.projectId ??
            defaultProjectId ??
            state.projects[0]?.id ??
            "",

          title:
            partial.title ??
            "",

          description:
            partial.description ??
            "",

          assigneeId:
            partial.assigneeId ??
            currentUserId,

          status:
            partial.status ??
            "To Do",

          priority:
            partial.priority ??
            "Medium",

          deadline:
            partial.deadline ??
            "",

          tags:
            partial.tags ??
            [],

          version: 1,
        })
      }
    />
  )
}

/* -------------------------------------------------------------------------- */
/* ENTITY NOT FOUND                                                           */
/* -------------------------------------------------------------------------- */

function EntityNotFound({
  entity,
  destination,
}: {
  entity: string
  destination: string
}) {
  const navigate =
    useNavigate()

  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <Heading level={2}>
        We couldn’t find that {entity}
      </Heading>

      <Text className="mt-2">
        It may have been removed or the
        link may be out of date.
      </Text>

      <Button
        className="mt-6"
        onClick={() =>
          navigate(destination)
        }
      >
        Back to{" "}
        {entity === "project"
          ? "projects"
          : "tasks"}
      </Button>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* 404                                                                        */
/* -------------------------------------------------------------------------- */

function NotFoundRoute() {
  const { state } =
    useWorkspace()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="max-w-lg p-10 text-center">
        <div className="text-6xl font-bold text-indigo-100">
          404
        </div>

        <Heading
          level={1}
          className="mt-4"
        >
          Page not found
        </Heading>

        <Text className="mt-2">
          The page you’re looking for
          doesn’t exist or has moved.
        </Text>

        <Button
          className="mt-6"
          onClick={() =>
            window.location.assign(
              state.loggedIn
                ? "/dashboard"
                : "/login",
            )
          }
        >
          Return to TeamSpace
        </Button>
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ROUTER                                                                     */
/* -------------------------------------------------------------------------- */

export const router =
  createBrowserRouter([
    {
      path: "/login",
      Component: LoginRoute,
    },

    {
      Component: ProtectedRoute,

      children: [
        {
          Component: AppLayout,

          children: [
            {
              index: true,

              element: (
                <Navigate
                  to="/dashboard"
                  replace
                />
              ),
            },

            {
              path: "dashboard",
              Component:
                DashboardRoute,
            },

            {
              path: "projects",
              Component:
                ProjectsRoute,
            },

            {
              path: "projects/:projectId",
              Component:
                ProjectRoute,
            },

            {
              path: "tasks",
              Component:
                TasksRoute,
            },

            {
              path: "tasks/:taskId",
              Component:
                TaskRoute,
            },

            {
              path: "calendar",
              Component:
                CalendarRoute,
            },

            {
              path: "notifications",
              Component:
                NotificationsRoute,
            },

            {
              path: "settings",
              Component:
                SettingsRoute,
            },
          ],
        },
      ],
    },

    {
      path: "*",
      Component:
        NotFoundRoute,
    },
  ])