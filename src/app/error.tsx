"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mb-6 text-gray-500">An unexpected error occurred.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  )
}
