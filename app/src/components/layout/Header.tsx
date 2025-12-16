export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Open Horizon Project Companion</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500">Auth Disabled - Development Mode</span>
      </div>
    </header>
  )
}
