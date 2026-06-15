"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const { data: session } = useSession()
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={session?.user?.name || ""} readOnly /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={session?.user?.email || ""} readOnly /></div>
          <Button variant="outline" disabled>Update Profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}
