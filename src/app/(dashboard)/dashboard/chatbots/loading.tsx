export default function ChatbotsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
