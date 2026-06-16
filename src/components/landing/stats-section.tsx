import { Bot, MessageSquare, Users, Globe } from "lucide-react"

const stats = [
  { icon: Bot, value: "10,000+", label: "Chatbots Built" },
  { icon: MessageSquare, value: "1.2M+", label: "Conversations" },
  { icon: Users, value: "5,000+", label: "Active Users" },
  { icon: Globe, value: "99.9%", label: "Uptime" },
]

export function StatsSection() {
  return (
    <section className="border-t border-gray-100 bg-gradient-to-br from-blue-50 to-purple-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
