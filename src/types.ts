export type View =
  | "dashboard"
  | "projects"
  | "project"
  | "tasks"
  | "task"
  | "calendar"
  | "notifications"
  | "settings"

export type TaskStatus =
  | "To Do"
  | "In Progress"
  | "Completed"

export type Priority =
  | "Low"
  | "Medium"
  | "High"

export interface Member {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  color: string
}

export interface Project {
  id: string
  name: string
  description: string
  memberIds: string[]
  taskCount: number
  progress: number
  deadline: string
  color: string
}

export interface Comment {
  id: string
  authorId: string
  body: string
  createdAt: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  assigneeId: string
  status: TaskStatus
  priority: Priority
  deadline: string
  comments: Comment[]
  attachments: string[]
  tags: string[]
  version: number
}

export interface TeamFile {
  id: string
  projectId: string
  name: string
  type: "pdf" | "figma" | "image" | "sheet" | "doc"
  size: string
  uploadedBy: string
  uploadedAt: string
}

export interface Activity {
  id: string
  memberId: string
  action: string
  target: string
  time: string
}

export interface Notification {
  id: string
  type:
    | "assignment"
    | "update"
    | "comment"
    | "deadline"
    | "file"
  title: string
  body: string
  time: string
  unread: boolean
}

export interface DiscussionMessage {
  id: string
  projectId: string
  authorId: string
  body: string
  createdAt: string
}

export interface UserPreferences {
  taskAssignments: boolean
  comments: boolean
  deadlines: boolean
  fileActivity: boolean
  theme: "Light" | "Dark" | "System"
}

export interface Profile {
  firstName: string
  lastName: string
  email: string
  role: string
  bio: string
}

export interface WorkspaceSettings {
  name: string
  url: string
  visibility: "Workspace members" | "Private"
}

export interface WorkspaceState {
  version: 1

  loggedIn: boolean

  /**
   * Real Supabase Auth user ID.
   * This is intentionally separate from Profile because
   * Profile represents the UI profile data.
   */
  currentUserId: string

  projects: Project[]
  tasks: Task[]
  files: TeamFile[]
  notifications: Notification[]
  discussions: DiscussionMessage[]
  activity: Activity[]

  preferences: UserPreferences
  profile: Profile
  workspace: WorkspaceSettings
}
