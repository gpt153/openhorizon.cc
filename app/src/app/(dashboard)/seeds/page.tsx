'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { Loader2, Sprout, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import SeedCard from '@/components/brainstorm/SeedCard'

export default function SeedGardenPage() {
  const router = useRouter()
  const { data: seeds, isLoading, error } = trpc.brainstorm.listSavedSeeds.useQuery(undefined, {
    retry: 2,
    retryDelay: 1000,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-12 text-center border-red-200 bg-red-50">
          <h2 className="text-2xl font-semibold text-red-900">Unable to Load Seeds</h2>
          <p className="mt-2 text-red-700">
            {error.message || 'An error occurred while loading your seeds'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-6"
            variant="outline"
          >
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  if (!seeds || seeds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-12 text-center">
          <Sprout className="mx-auto h-16 w-16 text-zinc-300" />
          <h2 className="mt-4 text-2xl font-semibold">Your Seed Garden is Empty</h2>
          <p className="mt-2 text-zinc-600">
            Start brainstorming to grow some creative project seeds. Save the ones you like and elaborate on them
            whenever inspiration strikes.
          </p>
          <Button onClick={() => router.push('/brainstorm')} className="mt-6">
            <Plus className="mr-2 h-5 w-5" />
            Generate Your First Seeds
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Seed Garden</h1>
          <p className="mt-2 text-zinc-600">
            {seeds.length} saved {seeds.length === 1 ? 'seed' : 'seeds'} waiting to be cultivated
          </p>
        </div>
        <Button onClick={() => router.push('/brainstorm')}>
          <Plus className="mr-2 h-5 w-5" />
          Generate More Seeds
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seeds.map((seed: any) => (
          <SeedCard
            key={seed.id}
            seed={seed}
            onSave={() => {}}
            onDismiss={() => {}}
            onElaborate={() => router.push(`/seeds/${seed.id}`)}
            showActions={false}
          />
        ))}
      </div>
    </div>
  )
}
