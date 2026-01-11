'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Phase detail page error:', error)
  }, [error])

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Something went wrong
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                An error occurred while loading this phase detail page.
              </p>
            </div>

            {error.message && (
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={reset} variant="default">
                Try Again
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
              >
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
