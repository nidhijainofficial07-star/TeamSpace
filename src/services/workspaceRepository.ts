import type { WorkspaceState } from "../types"

const KEY = "teamspace-workspace-v1"

export const workspaceRepository = {
  load(): WorkspaceState | null {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const value = JSON.parse(raw) as WorkspaceState
      return value?.version === 1 &&
        Array.isArray(value.projects) &&
        Array.isArray(value.tasks) &&
        Array.isArray(value.files) &&
        Array.isArray(value.notifications) &&
        Array.isArray(value.discussions) &&
        Boolean(value.preferences) &&
        Boolean(value.profile) &&
        Boolean(value.workspace)
        ? value
        : null
    } catch {
      return null
    }
  },
  save(state: WorkspaceState) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // The demo remains usable if storage is unavailable.
    }
  },
  clear() {
    localStorage.removeItem(KEY)
  },
}
