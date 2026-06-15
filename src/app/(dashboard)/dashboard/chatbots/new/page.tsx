"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"

export default function NewChatbotPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/chatbots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) { toast.error("Failed to create"); setLoading(false); return }
    const data = await res.json()
    toast.success("Chatbot created!")
    router.push(`/dashboard/chatbots/${data.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Chatbot</h1>
        <p className="text-sm text-gray-500 mt-1">Set up your chatbot and start building.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Chatbot Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Chatbot Name</Label>
              <Input id="name" placeholder="e.g., Customer Support Bot" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="What does this chatbot do?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Chatbot"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
