"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Copy, Code, Globe, Monitor, Smartphone, Terminal, Eye, FileCode,
  HelpCircle, CheckCircle, Shield, Zap, MessageSquare
} from "lucide-react"
import toast from "react-hot-toast"

export default function EmbedPage() {
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState<"script" | "iframe" | "react" | "html">("script")
  const [showPreview, setShowPreview] = useState(false)
  const origin = typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"

  const scriptCode = `<script src="${origin}/embed/${id}/widget"></script>`
  const iframeCode = `<iframe src="${origin}/embed/${id}" width="100%" height="600" frameborder="0"></iframe>`
  const reactCode = `import { useEffect } from "react";

function ChatWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "${origin}/embed/${id}/widget";
    script.async = true;
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return null;
}`
  const htmlFull = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to my website!</h1>
  <p>This is my amazing content.</p>

  <!-- DropBot Chat Widget -->
  ${scriptCode}
</body>
</html>`

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900">Embed Chatbot</h1>
        </div>
        <p className="text-sm text-gray-500 ml-4">
          Add your AI chatbot to any website in minutes. Copy one line of code and paste it into your site.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Zap className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quick Start</h3>
            <p className="text-sm text-gray-600 mt-1">
              Copy this script tag and paste it just before the <code className="bg-white/80 px-1.5 py-0.5 rounded text-xs font-mono text-blue-700">&lt;/body&gt;</code> tag on your website.
            </p>
          </div>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm leading-relaxed">
            <code className="text-green-400">{scriptCode}</code>
          </pre>
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-3 right-3 gap-1.5 bg-white/10 text-white hover:bg-white/20 border-0"
            onClick={() => copy(scriptCode)}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { step: "1", icon: Copy, title: "Copy the code", desc: "Click the copy button above to copy the script tag.", color: "bg-blue-500" },
          { step: "2", icon: FileCode, title: "Paste in your site", desc: "Open your website's HTML editor and paste the code before &lt;/body&gt;.", color: "bg-purple-500" },
          { step: "3", icon: Eye, title: "See it live", desc: "Save and visit your site. The chat widget appears in the corner.", color: "bg-emerald-500" },
        ].map((item) => (
          <div key={item.step} className="rounded-xl border border-gray-100 bg-white p-5 hover:border-gray-200 hover:shadow-sm transition-all">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color} text-white text-sm font-bold mb-4`}>
              {item.step}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <item.icon className="h-4 w-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { key: "script" as const, label: "Script Tag", icon: Code },
            { key: "iframe" as const, label: "iFrame", icon: Monitor },
            { key: "react" as const, label: "React / Next.js", icon: Terminal },
            { key: "html" as const, label: "Full HTML Page", icon: FileCode },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          <pre className="overflow-x-auto rounded-xl bg-gray-900 p-5 text-sm leading-relaxed">
            <code className="text-green-400">
              {activeTab === "script" && scriptCode}
              {activeTab === "iframe" && iframeCode}
              {activeTab === "react" && reactCode}
              {activeTab === "html" && htmlFull}
            </code>
          </pre>
          <Button
            size="sm"
            className="mt-4 gap-1.5"
            variant="outline"
            onClick={() => {
              const code = { script: scriptCode, iframe: iframeCode, react: reactCode, html: htmlFull }[activeTab]
              copy(code)
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy {activeTab === "script" ? "Script" : activeTab === "iframe" ? "iFrame" : activeTab === "react" ? "React Code" : "HTML"} to Clipboard
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">WordPress</h3>
          </div>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">1.</span> Go to <strong>Appearance &rarr; Theme Editor</strong></li>
            <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">2.</span> Open <strong>footer.php</strong></li>
            <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">3.</span> Paste the script tag before <code className="bg-gray-100 px-1 rounded text-xs">&lt;?php wp_footer(); ?&gt;</code></li>
            <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">4.</span> Click <strong>Update File</strong></li>
          </ol>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Shopify / Wix / Squarespace</h3>
          </div>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">1.</span> Go to <strong>Settings &rarr; Custom Code</strong></li>
            <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">2.</span> Click <strong>Add custom code</strong></li>
            <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">3.</span> Paste the script tag in the <strong>Footer</strong> section</li>
            <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">4.</span> Click <strong>Save</strong></li>
          </ol>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Live Preview</h3>
          </div>
          <Badge variant="secondary" className="rounded-full text-xs">Demo</Badge>
        </div>
        <div className="p-6">
          <div className="relative rounded-xl border border-dashed border-gray-300 bg-gray-50/50 h-[400px] flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Chatbot will appear here</p>
              <p className="text-xs text-gray-400 max-w-xs">The floating chat button appears in the bottom corner of your website. Click it to open the chat window.</p>
            </div>
            <div className="absolute bottom-6 right-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Need help?</h3>
        </div>
        <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>The widget is fully client-side. No server configuration needed.</span>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <span>Works with any website builder, CMS, or static HTML site.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <span>Make sure your chatbot status is set to <strong>Approved</strong> for it to appear.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
