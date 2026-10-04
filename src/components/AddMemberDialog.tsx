import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Button, Label, Modal, Select } from "./ui"

interface AddMemberDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  existingMemberIds: string[]
  onAddMember: (
    projectId: string,
    userId: string,
    role: string,
  ) => void
}

interface Profile {
  id: string
  name: string | null
  email: string | null
}

export function AddMemberDialog({
  open,
  onClose,
  projectId,
  existingMemberIds,
  onAddMember,
}: AddMemberDialogProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [role, setRole] = useState("member")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const loadProfiles = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .order("name")

      if (error) {
        console.error("Failed to load profiles:", error)
        setProfiles([])
      } else {
        setProfiles(
          (data ?? []).filter(
            (profile) =>
              !existingMemberIds.includes(profile.id),
          ),
        )
      }

      setLoading(false)
    }

    void loadProfiles()
  }, [open, existingMemberIds])

  const handleAdd = () => {
    if (!selectedUserId) return

    onAddMember(
      projectId,
      selectedUserId,
      role,
    )

    setSelectedUserId("")
    setRole("member")
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add member"
    >
      <div className="space-y-5">
        <div>
          <Label>Select member</Label>

          <Select
            value={selectedUserId}
            onChange={(event) =>
              setSelectedUserId(event.target.value)
            }
            disabled={loading}
          >
            <option value="">
              {loading
                ? "Loading members..."
                : "Select a member"}
            </option>

            {profiles.map((profile) => (
              <option
                key={profile.id}
                value={profile.id}
              >
                {profile.name || profile.email}
                {profile.email
                  ? ` — ${profile.email}`
                  : ""}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Role</Label>

          <Select
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
          >
            <option value="member">Member</option>
            <option value="lead">Lead</option>
          </Select>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            onClick={handleAdd}
            disabled={!selectedUserId}
          >
            Add member
          </Button>
        </div>
      </div>
    </Modal>
  )
}