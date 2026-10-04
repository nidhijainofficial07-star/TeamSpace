import { useEffect, useState, type FormEvent } from "react"
import { supabase } from "../lib/supabase"
import type { Project } from "../types"
import { Button, Input, Label, Modal, Select, Textarea } from "./ui"

type WorkspaceProfile = {
  id: string
  name: string
  email: string
}

const colors = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
]

export function ProjectFormDialog({
  open,
  onClose,
  onSave,
  project,
}: {
  open: boolean
  onClose: () => void
  onSave: (value: Omit<Project, "id" | "taskCount" | "progress">) => void
  project?: Project
}) {
  const [name, setName] = useState(project?.name ?? "")
  const [description, setDescription] = useState(
    project?.description ?? "",
  )
  const [deadline, setDeadline] = useState(project?.deadline ?? "")
  const [color, setColor] = useState(project?.color ?? colors[0])
  const [memberIds, setMemberIds] = useState<string[]>(
    project?.memberIds ?? [],
  )
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>([])
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!open) return

    let mounted = true

    const loadProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .order("name", { ascending: true })

      if (!mounted) return

      if (error) {
        console.error("Project member profiles error:", error)
        setProfiles([])
        return
      }

      setProfiles(data ?? [])
    }

    void loadProfiles()

    return () => {
      mounted = false
    }
  }, [open])

  useEffect(() => {
    setName(project?.name ?? "")
    setDescription(project?.description ?? "")
    setDeadline(project?.deadline ?? "")
    setColor(project?.color ?? colors[0])
    setMemberIds(project?.memberIds ?? [])
    setAttempted(false)
  }, [project, open])

  const today = new Date().toISOString().slice(0, 10)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setAttempted(true)

    if (
      !name.trim() ||
      !deadline ||
      deadline < today ||
      memberIds.length === 0
    ) {
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      deadline,
      color,
      memberIds,
    })

    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Edit project" : "Create a new project"}
      description="Give your team a shared home for tasks, files, and discussion."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" form="project-form">
            {project ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form
        id="project-form"
        onSubmit={submit}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="project-name">Project name</Label>

          <Input
            id="project-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Mobile app launch"
            aria-invalid={attempted && !name.trim()}
          />

          {attempted && !name.trim() && (
            <div className="mt-1 text-xs text-rose-600">
              Enter a project name.
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="project-description">
            Description
          </Label>

          <Textarea
            id="project-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this project about?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="project-deadline">
              Deadline
            </Label>

            <Input
              id="project-deadline"
              type="date"
              min={today}
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              aria-invalid={
                attempted &&
                (!deadline || deadline < today)
              }
            />

            {attempted && (!deadline || deadline < today) && (
              <div className="mt-1 text-xs text-rose-600">
                Choose today or a future date.
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="project-lead">
              Project lead
            </Label>

            <Select
              id="project-lead"
              className="w-full"
              value={memberIds[0] ?? ""}
              onChange={(event) => {
                const selectedId = event.target.value

                if (!selectedId) {
                  setMemberIds([])
                  return
                }

                setMemberIds((current) => [
                  selectedId,
                  ...current.filter(
                    (id) => id !== selectedId,
                  ),
                ])
              }}
            >
              <option value="">
                Select a project lead
              </option>

              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name || profile.email}
                </option>
              ))}
            </Select>

            {attempted && memberIds.length === 0 && (
              <div className="mt-1 text-xs text-rose-600">
                Select a project lead.
              </div>
            )}

            {!profiles.length && (
              <div className="mt-1 text-xs text-slate-400">
                No workspace members found.
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Project color</Label>

          <div className="flex gap-3">
            {colors.map((option) => (
              <button
                type="button"
                key={option}
                aria-label={`Select ${option
                  .replace("bg-", "")
                  .replace("-500", "")}`}
                aria-pressed={color === option}
                onClick={() => setColor(option)}
                className={`h-9 w-9 rounded-xl ${option} ${
                  color === option
                    ? "ring-2 ring-indigo-600 ring-offset-2"
                    : ""
                }`}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
