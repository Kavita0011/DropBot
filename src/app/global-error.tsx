"use client"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">Fatal Error</h1>
        <p className="mb-6 text-gray-500">A critical error occurred.</p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Reload
        </button>
      </body>
    </html>
  )
}
