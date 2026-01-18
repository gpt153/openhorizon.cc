'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  // Check if it's an auth error
  const isAuthError =
    error.message.includes('Unauthorized') ||
    error.message.includes('401') ||
    error.message.includes('Authentication') ||
    error.message.includes('UNAUTHORIZED')

  if (isAuthError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold">Authentication Required</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Your session has expired or you're not authenticated. Please sign in again.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => router.push('/sign-in')}>Go to Sign In</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="max-w-md p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-2xl font-bold">Something went wrong!</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}
