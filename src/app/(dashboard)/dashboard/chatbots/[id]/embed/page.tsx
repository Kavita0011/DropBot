"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

export default function EmbedPage() {
  const params = useParams()
  const id = params.id as string
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const embedCode = `<script src="${origin}/embed/${id}/widget"></script>`
  const iframeCode = `<iframe src="${origin}/embed/${id}" width="100%" height="600" frameborder="0"></iframe>`

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Embed Chatbot</h1>
        <p className="text-sm text-gray-500 mt-1">Add this chatbot to your website.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Script Tag</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">{embedCode}</pre>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => copy(embedCode)}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}Copy Code</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>iFrame Embed</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">{iframeCode}</pre>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => copy(iframeCode)}><Copy className="h-4 w-4" /> Copy Code</Button>
        </CardContent>
      </Card>
    </div>
  )
}
