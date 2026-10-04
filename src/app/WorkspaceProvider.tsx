import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react"
import {
  type AuthChangeEvent,
} from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

import type {
  Comment,
  DiscussionMessage,
  Notification,
  Profile,
  Project,
  Task,
  TeamFile,
  UserPreferences,
  WorkspaceSettings,
  WorkspaceState,
  Activity,
} from "../types"

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`

type SupabaseRow = Record<string, any>

function emptyState(): WorkspaceState {
  return {
    version: 1,

    loggedIn: false,

    currentUserId: "",

    projects: [],
    tasks: [],
    files: [],
    notifications: [],
    discussions: [],
    activity: [],

    preferences: {
      taskAssignments: true,
      comments: true,
      deadlines: false,
      fileActivity: true,
      theme: "Light",
    },

    profile: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      bio: "",
    },

    workspace: {
      name: "",
      url: "",
      visibility: "Workspace members",
    },
  }
}

/* -------------------------------------------------------------------------- */
/* ACTIONS                                                                    */
/* -------------------------------------------------------------------------- */

type Action =
  | {
      type: "LOGIN"
      value: boolean
    }
  | {
      type: "LOAD_DATABASE"
      value: WorkspaceState
    }
  | {
      type: "CREATE_PROJECT"
      value: Project
    }
  | {
      type: "UPDATE_PROJECT"
      id: string
      value: Partial<Project>
    }
  | {
      type: "CREATE_TASK"
      value: Task
    }
  | {
      type: "UPDATE_TASK"
      id: string
      value: Partial<Task>
    }
  | {
      type: "ADD_COMMENT"
      taskId: string
      value: Comment
    }
  | {
      type: "ADD_MESSAGE"
      value: DiscussionMessage
    }
  | {
      type: "ADD_FILE"
      value: TeamFile
    }
  | {
      type: "READ_NOTIFICATION"
      id?: string
    }
  | {
      type: "UPDATE_PREFERENCES"
      value: Partial<UserPreferences>
    }
  | {
      type: "UPDATE_PROFILE"
      value: Partial<Profile>
    }
  | {
      type: "UPDATE_WORKSPACE"
      value: Partial<WorkspaceSettings>
    }
  | {
      type: "RESET"
    }

/* -------------------------------------------------------------------------- */
/* REDUCER                                                                    */
/* -------------------------------------------------------------------------- */

function reducer(
  state: WorkspaceState,
  action: Action,
): WorkspaceState {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        loggedIn: action.value,
      }

    case "LOAD_DATABASE":
      return action.value

    case "CREATE_PROJECT":
      return {
        ...state,
        projects: [
          action.value,
          ...(state.projects ?? []),
        ],
      }

    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: (state.projects ?? []).map(
          (project) =>
            project.id === action.id
              ? {
                  ...project,
                  ...action.value,
                }
              : project,
        ),
      }

    case "CREATE_TASK":
      return {
        ...state,
        tasks: [
          action.value,
          ...(state.tasks ?? []),
        ],
      }

    case "UPDATE_TASK":
      return {
        ...state,
        tasks: (state.tasks ?? []).map(
          (task) =>
            task.id === action.id
              ? {
                  ...task,
                  ...action.value,
                }
              : task,
        ),
      }

    case "ADD_COMMENT":
      return {
        ...state,
        tasks: (state.tasks ?? []).map(
          (task) =>
            task.id === action.taskId
              ? {
                  ...task,
                  comments: [
                    ...(task.comments ?? []),
                    action.value,
                  ],
                }
              : task,
        ),
      }

    case "ADD_MESSAGE":
      return {
        ...state,
        discussions: [
          ...(state.discussions ?? []),
          action.value,
        ],
      }

    case "ADD_FILE":
      return {
        ...state,
        files: [
          action.value,
          ...(state.files ?? []),
        ],
      }

    case "READ_NOTIFICATION":
      return {
        ...state,
        notifications: (
          state.notifications ?? []
        ).map((notification) =>
          !action.id ||
          notification.id === action.id
            ? {
                ...notification,
                unread: false,
              }
            : notification,
        ),
      }

    case "UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.value,
        },
      }

    case "UPDATE_PROFILE":
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.value,
        },
      }

    case "UPDATE_WORKSPACE":
      return {
        ...state,
        workspace: {
          ...state.workspace,
          ...action.value,
        },
      }

    case "RESET":
      return emptyState()

    default:
      return state
  }
}

/* -------------------------------------------------------------------------- */
/* CONTEXT TYPE                                                               */
/* -------------------------------------------------------------------------- */

interface WorkspaceContextValue {
  state: WorkspaceState
  currentUserId: string
  authReady: boolean

  projectSummary: (
    project: Project,
  ) => Project

  login: () => void
  logout: () => void

  createProject: (
    value: Omit<
      Project,
      "id" | "taskCount" | "progress"
    >,
  ) => Project

  updateProject: (
    projectId: string,
    value: Partial<Project>,
  ) => void

    addProjectMember: (
    projectId: string,
    userId: string,
    role?: string,
  ) => void

  createTask: (
    value: Omit<
      Task,
      "id" | "comments" | "attachments"
    >,
  ) => Task

  updateTask: (
    taskId: string,
    value: Partial<Task>,
  ) => void

  addComment: (
    taskId: string,
    body: string,
  ) => void

  addMessage: (
    projectId: string,
    body: string,
  ) => void

  addFile: (
    projectId: string,
    file: File,
  ) => void

  markRead: (
    notificationId?: string,
  ) => void

  updatePreferences: (
    value: Partial<UserPreferences>,
  ) => void

  updateProfile: (
    value: Partial<Profile>,
  ) => void

  updateWorkspace: (
    value: Partial<WorkspaceSettings>,
  ) => void

  reset: () => void
}

const WorkspaceContext =
  createContext<WorkspaceContextValue | null>(
    null,
  )

/* -------------------------------------------------------------------------- */
/* PROVIDER                                                                   */
/* -------------------------------------------------------------------------- */

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    emptyState,
  )

  const [currentUserId, setCurrentUserId] =
    useState("")
  const [authReady, setAuthReady] =
  useState(false)

  /* ------------------------------------------------------------------------ */
  /* LOAD DATABASE                                                            */
  /* ------------------------------------------------------------------------ */

  const loadDatabase = useCallback(async () => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error(
        "TeamSpace session error:",
        sessionError,
      )

      setCurrentUserId("")
      dispatch({
        type: "RESET",
      })
      setAuthReady(true)

      return
    }

    const user = session?.user

    if (!user) {
      setCurrentUserId("")

      dispatch({
        type: "RESET",
      })

      setAuthReady(true)

      return
    }

    // ⬇️ KEEP THE REST OF YOUR EXISTING
    // loadDatabase code from here onward.

      if (!user) {
        setCurrentUserId("")

        dispatch({
          type: "RESET",
        })
        setAuthReady(true)

        return
      }

      setCurrentUserId(user.id)

      /* -------------------------------------------------------------------- */
      /* PROFILE                                                              */
      /* -------------------------------------------------------------------- */

      const {
        data: profileRow,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error(
          "TeamSpace profile error:",
          profileError,
        )
      }

      const profileName =
        profileRow?.name ??
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        ""

      const profile: Profile = {
        firstName:
          getFirstName(profileName),

        lastName:
          getLastName(profileName),

        email:
          profileRow?.email ??
          user.email ??
          "",

        role: "",

        bio: "",
      }

      /* -------------------------------------------------------------------- */
      /* PROJECTS                                                             */
      /* -------------------------------------------------------------------- */

      const {
        data: projectRows,
        error: projectsError,
      } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (projectsError) {
        console.error(
          "TeamSpace projects error:",
          projectsError,
        )
      }

      /* -------------------------------------------------------------------- */
      /* PROJECT MEMBERS                                                      */
      /* -------------------------------------------------------------------- */

      const {
        data: projectMemberRows,
        error: projectMembersError,
      } = await supabase
        .from("project_members")
        .select("*")

      if (projectMembersError) {
        console.error(
          "TeamSpace project members error:",
          projectMembersError,
        )
      }

      const membersByProject =
        new Map<string, string[]>()

      for (const row of (
        projectMemberRows ?? []
      ) as SupabaseRow[]) {
        const projectId =
          row.project_id ??
          row.projectId

        const memberId =
          row.user_id ??
          row.profile_id ??
          row.member_id ??
          row.userId

        if (!projectId || !memberId) {
          continue
        }

        const projectKey =
          String(projectId)

        const memberIdString =
          String(memberId)

        const members =
          membersByProject.get(
            projectKey,
          ) ?? []

        if (
          !members.includes(
            memberIdString,
          )
        ) {
          members.push(
            memberIdString,
          )
        }

        membersByProject.set(
          projectKey,
          members,
        )
      }

      /* -------------------------------------------------------------------- */
      /* TASKS                                                                */
      /* -------------------------------------------------------------------- */

      const {
        data: taskRows,
        error: tasksError,
      } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (tasksError) {
        console.error(
          "TeamSpace tasks error:",
          tasksError,
        )
      }

      /* -------------------------------------------------------------------- */
      /* COMMENTS                                                             */
      /* -------------------------------------------------------------------- */

      const {
        data: commentRows,
        error: commentsError,
      } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", {
          ascending: true,
        })

      if (commentsError) {
        console.error(
          "TeamSpace comments error:",
          commentsError,
        )
      }

      const commentsByTask =
        new Map<string, Comment[]>()

      for (const row of (
        commentRows ?? []
      ) as SupabaseRow[]) {
        const taskId =
          row.task_id ??
          row.taskId

        if (!taskId) {
          continue
        }

        const comment: Comment = {
  id: String(row.id),

  authorId: String(
    row.user_id ?? "",
  ),

  body:
    row.content ?? "",

  createdAt:
    row.created_at ??
    new Date().toISOString(),
}

        const taskKey =
          String(taskId)

        const comments =
          commentsByTask.get(
            taskKey,
          ) ?? []

        comments.push(comment)

        commentsByTask.set(
          taskKey,
          comments,
        )
      }

      /* -------------------------------------------------------------------- */
      /* FILES                                                                */
      /* -------------------------------------------------------------------- */

      const {
        data: fileRows,
        error: filesError,
      } = await supabase
        .from("files")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (filesError) {
        console.error(
          "TeamSpace files error:",
          filesError,
        )
      }

      /* -------------------------------------------------------------------- */
      /* NOTIFICATIONS                                                        */
      /* -------------------------------------------------------------------- */

      const {
        data: notificationRows,
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })

      if (notificationsError) {
        console.error(
          "TeamSpace notifications error:",
          notificationsError,
        )
      }

      /* -------------------------------------------------------------------- */
      /* ACTIVITY                                                             */
      /* -------------------------------------------------------------------- */

      const {
        data: activityRows,
        error: activityError,
      } = await supabase
        .from("activity")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (activityError) {
        console.error(
          "TeamSpace activity error:",
          activityError,
        )
      }

      /* -------------------------------------------------------------------- */
      /* MAP PROJECTS                                                         */
      /* -------------------------------------------------------------------- */

      const mappedProjects: Project[] =
        (
          (projectRows ?? []) as SupabaseRow[]
        ).map((row) => {
          const projectId =
            String(row.id)

          const projectTasks =
            (
              (taskRows ?? []) as SupabaseRow[]
            ).filter(
              (task) =>
                String(
                  task.project_id ??
                    task.projectId ??
                    "",
                ) === projectId,
            )

          const completed =
            projectTasks.filter(
              (task) =>
                normalizeStatus(
                  task.status,
                ) === "Completed",
            ).length

          const progress =
            projectTasks.length > 0
              ? Math.round(
                  (completed /
                    projectTasks.length) *
                    100,
                )
              : 0

          return {
            id: projectId,

            name:
              row.name ??
              row.title ??
              "",

            description:
              row.description ??
              "",

            deadline:
              row.deadline ??
              row.due_date ??
              "",

            color:
              row.color ??
              "",

            taskCount:
              projectTasks.length,

            progress,

            memberIds:
              membersByProject.get(
                projectId,
              ) ?? [],
          }
        })

      /* -------------------------------------------------------------------- */
      /* MAP TASKS                                                            */
      /* -------------------------------------------------------------------- */

      const mappedTasks: Task[] =
        (
          (taskRows ?? []) as SupabaseRow[]
        ).map((row) => {
          const taskId =
            String(row.id)

          return {
            id: taskId,

            projectId: String(
              row.project_id ??
                row.projectId ??
                "",
            ),

            title:
              row.title ??
              "",

            description:
              row.description ??
              "",

            assigneeId:
              row.assigned_to ??
              row.assignee_id ??
              "",

            status:
              normalizeStatus(
                row.status,
              ),

            priority:
              normalizePriority(
                row.priority,
              ),

            deadline:
              row.deadline ??
              row.due_date ??
              "",

            comments:
              commentsByTask.get(
                taskId,
              ) ?? [],

            attachments: [],

            tags:
              Array.isArray(row.tags)
                ? row.tags
                : [],

            version:
              Number(row.version) || 1,
          }
        })

      /* -------------------------------------------------------------------- */
      /* MAP FILES                                                            */
      /* -------------------------------------------------------------------- */

      const mappedFiles: TeamFile[] =
        (
          (fileRows ?? []) as SupabaseRow[]
        ).map((row) => {
          const fileName =
            row.name ??
            row.file_name ??
            ""

          return {
            id: String(row.id),

            projectId: String(
              row.project_id ??
                row.projectId ??
                "",
            ),

            name: fileName,

            type:
              isValidFileType(
                row.type,
              )
                ? row.type
                : inferFileType(
                    fileName,
                  ),

            size:
              row.size ??
              formatSize(
                Number(
                  row.file_size ?? 0,
                ),
              ),

            uploadedBy:
              row.uploaded_by ??
              row.user_id ??
              row.created_by ??
              "",

            uploadedAt:
              row.uploaded_at ??
              row.created_at ??
              "",
          }
        })

      /* -------------------------------------------------------------------- */
      /* MAP NOTIFICATIONS                                                    */
      /* -------------------------------------------------------------------- */

      const mappedNotifications: Notification[] =
        (
          (notificationRows ?? []) as SupabaseRow[]
        ).map((row) => ({
          id: String(row.id),

          type:
            normalizeNotificationType(
              row.type,
            ),

          title:
            row.title ??
            row.message ??
            "",

          body:
            row.body ??
            row.message ??
            "",

          time:
            row.time ??
            row.created_at ??
            "",

          unread:
            row.unread ??
            !Boolean(
              row.read_at,
            ),
        }))

      /* -------------------------------------------------------------------- */
      /* MAP ACTIVITY                                                         */
      /* -------------------------------------------------------------------- */

      const mappedActivity: Activity[] =
        (
          (activityRows ?? []) as SupabaseRow[]
        ).map((row) => ({
          id: String(row.id),

          memberId: String(
            row.member_id ??
              row.user_id ??
              row.created_by ??
              "",
          ),

          action:
            row.action ??
            row.description ??
            row.type ??
            "",

          target:
            row.target ??
            row.target_name ??
            row.entity_name ??
            "",

          time:
            row.time ??
            row.created_at ??
            "",
        }))

      /* -------------------------------------------------------------------- */
      /* FINAL STATE                                                          */
      /* -------------------------------------------------------------------- */

      const databaseState: WorkspaceState = {
        version: 1,

        loggedIn: true,

        currentUserId:
          user.id,

        projects:
          mappedProjects,

        tasks:
          mappedTasks,

        files:
          mappedFiles,

        notifications:
          mappedNotifications,

        discussions: [],

        activity:
          mappedActivity,

        preferences: {
          taskAssignments: true,
          comments: true,
          deadlines: false,
          fileActivity: true,
          theme: "Light",
        },

        profile,

        workspace: {
          name: "",
          url: "",
          visibility:
            "Workspace members",
        },
      }

      dispatch({
        type: "LOAD_DATABASE",
        value: databaseState,
      })

      console.log(
        "TeamSpace database loaded:",
        {
          user: user.email,
          userId: user.id,
          projects:
            mappedProjects.length,
          tasks:
            mappedTasks.length,
          files:
            mappedFiles.length,
          notifications:
            mappedNotifications.length,
          activity:
            mappedActivity.length,
        },
      )
      setAuthReady(true)
    } catch (error) {
      console.error(
        "TeamSpace database loading failed:",
        error,
      )
      setAuthReady(true)

    }
  }, [])

  /* ------------------------------------------------------------------------ */
  /* AUTH                                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true

    void loadDatabase()

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent) => {
          if (!mounted) {
            return
          }

          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          ) {
            void loadDatabase()
          }

          if (
            event === "SIGNED_OUT"
          ) {
            setCurrentUserId("")

            dispatch({
              type: "RESET",
            })
          }
        },
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadDatabase])

  /* ------------------------------------------------------------------------ */
  /* REALTIME                                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false

    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null

    const setupRealtime = async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser()

      if (!user || cancelled) {
        return
      }

      channel = supabase.channel(
        `teamspace-${user.id}`,
      )

      const tables = [
        "projects",
        "tasks",
        "comments",
        "notifications",
        "files",
        "activity",
      ] as const

      for (const table of tables) {
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
          },
          () => {
            if (!cancelled) {
              void loadDatabase()
            }
          },
        )
      }

      if (!cancelled) {
        channel.subscribe(
          (status) => {
            console.log(
              "TeamSpace realtime:",
              status,
            )
          },
        )
      }
    }

    void setupRealtime()

    return () => {
      cancelled = true

      if (channel) {
        void supabase.removeChannel(
          channel,
        )

        channel = null
      }
    }
  }, [loadDatabase])

  /* ------------------------------------------------------------------------ */
  /* CONTEXT VALUE                                                            */
  /* ------------------------------------------------------------------------ */

  const value =
    useMemo<WorkspaceContextValue>(
      () => ({
        state,

        currentUserId,

        authReady,

        projectSummary: (
          project,
        ) => {
          const projectTasks =
            (
              state.tasks ?? []
            ).filter(
              (task) =>
                task.projectId ===
                project.id,
            )

          const completed =
            projectTasks.filter(
              (task) =>
                normalizeStatus(
                  task.status,
                ) === "Completed",
            ).length

          return {
            ...project,

            taskCount:
              projectTasks.length,

            progress:
              projectTasks.length > 0
                ? Math.round(
                    (completed /
                      projectTasks.length) *
                      100,
                  )
                : 0,
          }
        },

        login: () => {
          void loadDatabase()
        },

        logout: () => {
          void supabase.auth.signOut()

          setCurrentUserId("")

          dispatch({
            type: "RESET",
          })
        },

        createProject: (
          project,
        ) => {
          const value: Project = {
            ...project,

            id: createId(),

            taskCount: 0,

            progress: 0,
          }

          dispatch({
            type: "CREATE_PROJECT",
            value,
          })

          void saveProjectToSupabase(
            value,
          )

          return value
        },

        updateProject: (
          projectId,
          update,
        ) => {
          dispatch({
            type: "UPDATE_PROJECT",
            id: projectId,
            value: update,
          })

          void updateProjectInSupabase(
            projectId,
            update,
          )
        },

                addProjectMember: (
          projectId,
          userId,
          role = "member",
        ) => {
          if (!currentUserId) {
            console.warn(
              "TeamSpace: cannot add member without authenticated user.",
            )

            return
          }

          if (!projectId || !userId) {
            return
          }

          void (async () => {
            try {
              const { data: existingMember, error: existingError } =
                await supabase
                  .from("project_members")
                  .select("id")
                  .eq("project_id", projectId)
                  .eq("user_id", userId)
                  .maybeSingle()

              if (existingError) {
                console.error(
                  "TeamSpace member check failed:",
                  existingError,
                )
                return
              }

              if (existingMember) {
                console.warn(
                  "TeamSpace: user is already a project member.",
                )
                return
              }

              const { data, error } = await supabase
                .from("project_members")
                .insert({
                  project_id: projectId,
                  user_id: userId,
                  role,
                })
                .select()
                .single()

              if (error) {
                console.error(
                  "TeamSpace: failed to add project member:",
                  error,
                )
                return
              }

              console.log(
                "TeamSpace: project member added:",
                data,
              )

              const project = (
                state.projects ?? []
              ).find(
                (item) =>
                  item.id === projectId,
              )

              if (!project) {
                return
              }

              const memberIds =
                project.memberIds ?? []

              if (
                !memberIds.includes(userId)
              ) {
                dispatch({
                  type: "UPDATE_PROJECT",
                  id: projectId,
                  value: {
                    memberIds: [
                      ...memberIds,
                      userId,
                    ],
                  },
                })
              }
            } catch (error) {
              console.error(
                "TeamSpace: add project member error:",
                error,
              )
            }
          })()
        },

        createTask: (
          task,
        ) => {
          const value: Task = {
            ...task,

            id: createId(),

            comments: [],

            attachments: [],
          }

          dispatch({
            type: "CREATE_TASK",
            value,
          })

          void saveTaskToSupabase(
            value,
          )

          return value
        },

        updateTask: (
          taskId,
          update,
        ) => {
          const existingTask =
            (
              state.tasks ?? []
            ).find(
              (task) =>
                task.id === taskId,
            )

          if (!existingTask) {
            console.warn(
              "TeamSpace: task not found:",
              taskId,
            )

            return
          }


          void (async () => {
            const result =
              await updateTaskInSupabase(
                taskId,
                update,
                existingTask.version ?? 1,
              )

            if (result?.success) {
              dispatch({
                type: "UPDATE_TASK",
                id: taskId,
                value: {
                  ...update,
                  version:
                    result.task?.version ??
                    (existingTask.version ?? 1) + 1,
                },
              })
            }
          })()
        },

        addComment: (
          taskId,
          body,
        ) => {
          const trimmedBody =
            body.trim()

          if (!trimmedBody) {
            return
          }

          if (!currentUserId) {
            console.warn(
              "TeamSpace: cannot add comment without authenticated user.",
            )

            return
          }

          const comment: Comment = {
            id: createId(),

            authorId:
              currentUserId,

            body:
              trimmedBody,

            createdAt:
              new Date().toISOString(),
          }

          dispatch({
            type: "ADD_COMMENT",
            taskId,
            value: comment,
          })

          void saveCommentToSupabase(
            taskId,
            trimmedBody,
          )
        },

        addMessage: (
          projectId,
          body,
        ) => {
          const trimmedBody =
            body.trim()

          if (!trimmedBody) {
            return
          }

          if (!currentUserId) {
            console.warn(
              "TeamSpace: cannot add message without authenticated user.",
            )

            return
          }

          const message: DiscussionMessage = {
            id: createId(),

            projectId,

            authorId:
              currentUserId,

            body:
              trimmedBody,

            createdAt:
              new Date().toISOString(),
          }

          dispatch({
            type: "ADD_MESSAGE",
            value: message,
          })
        },

        addFile: (
          projectId,
          file,
        ) => {
          if (!currentUserId) {
            console.warn(
              "TeamSpace: cannot upload file without authenticated user.",
            )

            return
          }

          const fileId =
            createId()

          const value: TeamFile = {
            id: fileId,

            projectId,

            name:
              file.name,

            type:
              inferFileType(
                file.name,
              ),

            size:
              formatSize(
                file.size,
              ),

            uploadedBy:
              currentUserId,

            uploadedAt:
              new Date().toISOString(),
          }

          dispatch({
            type: "ADD_FILE",
            value,
          })

          void uploadFileToSupabase(
            projectId,
            fileId,
            file,
            value,
          )
        },

        markRead: (
          notificationId,
        ) => {
          dispatch({
            type: "READ_NOTIFICATION",
            id: notificationId,
          })

          void markNotificationRead(
            notificationId,
          )
        },

        updatePreferences: (
          update,
        ) => {
          dispatch({
            type: "UPDATE_PREFERENCES",
            value: update,
          })
        },

        updateProfile: (
          update,
        ) => {
          dispatch({
            type: "UPDATE_PROFILE",
            value: update,
          })

          void updateProfileInSupabase(
            update,
          )
        },

        updateWorkspace: (
          update,
        ) => {
          dispatch({
            type: "UPDATE_WORKSPACE",
            value: update,
          })
        },

        reset: () => {
          setCurrentUserId("")

          dispatch({
            type: "RESET",
          })
        },
      }),
      [
        state,
        currentUserId,
        authReady,
        loadDatabase,
      ],
    )

  return (
    <WorkspaceContext.Provider
      value={value}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* HOOK                                                                       */
/* -------------------------------------------------------------------------- */

export function useWorkspace() {
  const context =
    useContext(WorkspaceContext)

  if (!context) {
    throw new Error(
      "useWorkspace must be used inside WorkspaceProvider",
    )
  }

  return context
}

/* -------------------------------------------------------------------------- */
/* SUPABASE: PROJECT                                                          */
/* -------------------------------------------------------------------------- */

async function saveProjectToSupabase(
  project: Project,
) {
  try {
    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser()

    if (authError) {
      console.error(
        "Supabase auth error:",
        authError,
      )

      return
    }

    if (!user) {
      console.error(
        "No authenticated user.",
      )

      return
    }

    const { error } =
      await supabase
        .from("projects")
        .insert({
          id: project.id,

          name:
            project.name,

          description:
            project.description ?? "",

          deadline:
            project.deadline || null,

          created_by:
            user.id,
        })

    if (error) {
      console.error(
        "Failed to save project:",
        error,
      )
    }
  } catch (error) {
    console.error(
      "Failed to save project:",
      error,
    )
  }
}

/* -------------------------------------------------------------------------- */
/* SUPABASE: UPDATE PROJECT                                                   */
/* -------------------------------------------------------------------------- */

async function updateProjectInSupabase(
  projectId: string,
  update: Partial<Project>,
) {
  try {
    const payload: SupabaseRow = {}

    if (
      update.name !==
      undefined
    ) {
      payload.name =
        update.name
    }

    if (
      update.description !==
      undefined
    ) {
      payload.description =
        update.description
    }

    if (
      update.deadline !==
      undefined
    ) {
      payload.deadline =
        update.deadline || null
    }

    if (
      Object.keys(payload).length ===
      0
    ) {
      return
    }

    const { error } =
      await supabase
        .from("projects")
        .update(payload)
        .eq(
          "id",
          projectId,
        )

    if (error) {
      console.error(
        "Failed to update project:",
        error,
      )
    }
  } catch (error) {
    console.error(
      "Failed to update project:",
      error,
    )
  }
}

/* -------------------------------------------------------------------------- */
/* SUPABASE: TASK                                                             */
/* -------------------------------------------------------------------------- */

async function saveTaskToSupabase(
  task: Task,
) {
  try {
    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      console.error(
        "No authenticated user.",
      )

      return
    }

    const { error } =
      await supabase
        .from("tasks")
        .insert({
          id: task.id,

          project_id:
            task.projectId,

          title:
            task.title,

          description:
            task.description ?? "",

          assigned_to:
            task.assigneeId || null,

          status:
            mapStatusForDatabase(
              task.status,
            ),

          priority:
            mapPriorityForDatabase(
              task.priority,
            ),

          deadline:
            task.deadline || null,

          created_by:
            user.id,

          version:
            Number(task.version) || 1,

          updated_by:
            user.id,
        })

    if (error) {
      console.error(
        "Failed to save task:",
        error,
      )
    }
  } catch (error) {
    console.error(
      "Failed to save task:",
      error,
    )
  }
}

/* -------------------------------------------------------------------------- */
/* SUPABASE: CONFLICT-SAFE TASK UPDATE                                       */
/* -------------------------------------------------------------------------- */

async function updateTaskInSupabase(
  taskId: string,
  update: Partial<Task>,
  expectedVersion: number,
) {
  try {
    const {
      data,
      error,
    } = await supabase.rpc(
      "update_task_safe",
      {
        p_task_id:
          taskId,

        p_expected_version:
          expectedVersion,

        p_title:
          update.title ??
          null,

        p_description:
          update.description ??
          null,

        p_assigned_to:
          update.assigneeId ??
          null,

        p_status:
          update.status !==
          undefined
            ? mapStatusForDatabase(
                update.status,
              )
            : null,

        p_priority:
          update.priority !==
          undefined
            ? mapPriorityForDatabase(
                update.priority,
              )
            : null,

        p_deadline:
          update.deadline ??
          null,
      },
    )

    if (error) {
      console.error(
        "Task update error:",
        error,
      )

      return
    }

    if (
      data?.success === false &&
      data?.error ===
        "CONFLICT"
    ) {
      console.warn(
        "TeamSpace task conflict:",
        data,
      )

      window.dispatchEvent(
        new CustomEvent(
          "teamspace-task-conflict",
          {
            detail: data,
          },
        ),
      )

      return
    }

    if (
      data?.success === false &&
      data?.error ===
        "TASK_NOT_FOUND"
    ) {
      console.warn(
        "TeamSpace task not found:",
        taskId,
      )

      return
    }

    if (
      data?.success === true
    ) {
      return data
    }

    console.warn(
      "Unexpected task update response:",
      data,
    )
  } catch (error) {
    console.error(
      "Failed to update task:",
      error,
    )
    return null
  }
}

/* -------------------------------------------------------------------------- */
/* SUPABASE: COMMENTS                                                         */
/* -------------------------------------------------------------------------- */

async function saveCommentToSupabase(
  taskId: string,
  body: string,
) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error(
        "COMMENT USER ERROR:",
        userError,
      )
      return
    }

    const {
      data,
      error,
    } = await supabase
      .from("comments")
      .insert({
        task_id: taskId,
        user_id: user.id,
        content: body.trim(),
      })
      .select()
      .single()

    console.log(
      "COMMENT INSERT RESULT:",
      { data, error },
    )

    if (error) {
      console.error(
        "COMMENT INSERT FAILED:",
        error,
      )
      return
    }

    console.log(
      "COMMENT SAVED SUCCESSFULLY:",
      data,
    )
  } catch (error) {
    console.error(
      "COMMENT SAVE ERROR:",
      error,
    )
  }
}
/* -------------------------------------------------------------------------- */
/* SUPABASE: FILE UPLOAD                                                      */
/* -------------------------------------------------------------------------- */

async function uploadFileToSupabase(
  projectId: string,
  fileId: string,
  file: File,
  metadata: TeamFile,
) {
  try {
    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      console.error(
        "No authenticated user.",
      )

      return
    }

    const safeName =
      file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_",
      )

    const path =
      `${user.id}/${projectId}/${fileId}-${safeName}`

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("project-files")
        .upload(
          path,
          file,
          {
            upsert: false,
          },
        )

    if (uploadError) {
      console.error(
        "File upload error:",
        uploadError,
      )

      return
    }

    const {
      error: databaseError,
    } =
      await supabase
        .from("files")
        .insert({
          id:
            fileId,

          project_id:
            projectId,

          name:
            file.name,

          type:
            metadata.type,

          size:
            metadata.size,

          uploaded_by:
            user.id,

          storage_path:
            path,
        })

    if (databaseError) {
      console.error(
        "Failed to save file metadata:",
        databaseError,
      )

      const {
        error: cleanupError,
      } =
        await supabase.storage
          .from("project-files")
          .remove([path])

      if (cleanupError) {
        console.error(
          "Failed to clean up orphaned file:",
          cleanupError,
        )
      }

      return
    }
  } catch (error) {
    console.error(
      "Failed to upload file:",
      error,
    )
  }
}

/* -------------------------------------------------------------------------- */
/* SUPABASE: NOTIFICATION READ                                                */
/* -------------------------------------------------------------------------- */

async function markNotificationRead(
  notificationId?: string,
) {
  try {
    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      return
    }

    let query =
      supabase
        .from("notifications")
        .update({
          unread: false,

          read_at:
            new Date().toISOString(),
        })
        .eq(
          "user_id",
          user.id,
        )

    if (notificationId) {
      query = query.eq(
        "id",
        notificationId,
      )
    }

    const { error } =
      await query

    if (error) {
      console.error(
        "Failed to mark notification read:",
        error,
      )
    }
  } catch (error) {
    console.error(
      "Failed to mark notification read:",
      error,
    )
  }
}

/* -------------------------------------------------------------------------- */
/* SUPABASE: PROFILE                                                          */
/* -------------------------------------------------------------------------- */

async function updateProfileInSupabase(
  update: Partial<Profile>,
) {
  try {
    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      return
    }

    const payload: SupabaseRow = {}

    const hasNameUpdate =
      update.firstName !==
        undefined ||
      update.lastName !==
        undefined

    if (hasNameUpdate) {
      const currentName =
        `${update.firstName ?? ""} ${
          update.lastName ?? ""
        }`.trim()

      if (currentName) {
        payload.name =
          currentName
      }
    }

    if (
      update.email !==
      undefined
    ) {
      payload.email =
        update.email
    }

    if (
      Object.keys(payload).length ===
      0
    ) {
      return
    }

    const { error } =
      await supabase
        .from("profiles")
        .update(payload)
        .eq(
          "id",
          user.id,
        )

    if (error) {
      console.error(
        "Failed to update profile:",
        error,
      )
    }
  } catch (error) {
    console.error(
      "Failed to update profile:",
      error,
    )
  }
}

/* -------------------------------------------------------------------------- */
/* STATUS HELPERS                                                             */
/* -------------------------------------------------------------------------- */

function normalizeStatus(
  value: unknown,
): Task["status"] {
  const normalized =
    String(value ?? "")
      .toLowerCase()
      .replace(
        /[-_]/g,
        " ",
      )
      .trim()

  if (
    normalized ===
      "in progress" ||
    normalized ===
      "inprogress"
  ) {
    return "In Progress"
  }

  if (
    normalized ===
      "completed" ||
    normalized ===
      "complete" ||
    normalized ===
      "done"
  ) {
    return "Completed"
  }

  return "To Do"
}

function normalizePriority(
  value: unknown,
): Task["priority"] {
  const normalized =
    String(value ?? "")
      .toLowerCase()
      .trim()

  if (
    normalized === "high"
  ) {
    return "High"
  }

  if (
    normalized === "low"
  ) {
    return "Low"
  }

  return "Medium"
}

function mapStatusForDatabase(
  value: unknown,
) {
  const normalized =
    String(value ?? "")
      .toLowerCase()
      .replace(
        /[-_]/g,
        " ",
      )
      .trim()

  if (
    normalized ===
      "in progress" ||
    normalized ===
      "inprogress"
  ) {
    return "in_progress"
  }

  if (
    normalized ===
      "completed" ||
    normalized ===
      "complete" ||
    normalized ===
      "done"
  ) {
    return "completed"
  }

  return "todo"
}

function mapPriorityForDatabase(
  value: unknown,
) {
  const normalized =
    String(value ?? "")
      .toLowerCase()
      .trim()

  if (
    normalized === "high"
  ) {
    return "high"
  }

  if (
    normalized === "low"
  ) {
    return "low"
  }

  return "medium"
}

/* -------------------------------------------------------------------------- */
/* NOTIFICATION HELPERS                                                       */
/* -------------------------------------------------------------------------- */

function normalizeNotificationType(
  value: unknown,
): Notification["type"] {
  const normalized =
    String(value ?? "")
      .toLowerCase()
      .trim()

  if (
    normalized ===
      "assignment"
  ) {
    return "assignment"
  }

  if (
    normalized ===
      "comment"
  ) {
    return "comment"
  }

  if (
    normalized ===
      "deadline"
  ) {
    return "deadline"
  }

  if (
    normalized ===
      "file"
  ) {
    return "file"
  }

  return "update"
}

/* -------------------------------------------------------------------------- */
/* PROFILE HELPERS                                                            */
/* -------------------------------------------------------------------------- */

function getFirstName(
  name: string,
) {
  const trimmed =
    name.trim()

  if (!trimmed) {
    return ""
  }

  return (
    trimmed.split(/\s+/)[0] ??
    ""
  )
}

function getLastName(
  name: string,
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (parts.length <= 1) {
    return ""
  }

  return parts
    .slice(1)
    .join(" ")
}

/* -------------------------------------------------------------------------- */
/* FILE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function isValidFileType(
  value: unknown,
): value is TeamFile["type"] {
  return (
    value === "pdf" ||
    value === "figma" ||
    value === "image" ||
    value === "sheet" ||
    value === "doc"
  )
}

function inferFileType(
  name: string,
): TeamFile["type"] {
  const extension =
    name
      .split(".")
      .pop()
      ?.toLowerCase()

  if (
    extension === "fig"
  ) {
    return "figma"
  }

  if (
    [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
    ].includes(
      extension ?? "",
    )
  ) {
    return "image"
  }

  if (
    [
      "xls",
      "xlsx",
      "csv",
    ].includes(
      extension ?? "",
    )
  ) {
    return "sheet"
  }

  if (
    [
      "doc",
      "docx",
    ].includes(
      extension ?? "",
    )
  ) {
    return "doc"
  }

  return "pdf"
}

function formatSize(
  bytes: number,
) {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "1 KB"
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.max(
      1,
      Math.round(
        bytes / 1024,
      ),
    )} KB`
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`
}