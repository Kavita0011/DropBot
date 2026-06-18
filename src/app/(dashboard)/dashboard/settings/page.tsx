"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import toast from "react-hot-toast"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user?.name || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {}
      if (name !== session?.user?.name) body.name = name
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("Passwords do not match")
          setSaving(false)
          return
        }
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }
      if (Object.keys(body).length === 0) {
        toast("Nothing to update")
        setSaving(false)
        return
      }
      const res = await fetch("/api/user/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to update")
        setSaving(false)
        return
      }
      toast.success("Profile updated")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      await update()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={session?.user?.email || ""} readOnly className="bg-gray-50" /></div>
          <hr />
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Leave blank to keep current" /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 chars, uppercase, number, special" /></div>
          <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" /></div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </CardContent>
      </Card>
    </div>
  )
}