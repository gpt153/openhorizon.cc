'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc/client'
import { Sparkles, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import SeedCard from '@/components/brainstorm/SeedCard'

export default function BrainstormPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [creativityTemp, setCreativityTemp] = useState(0.9)
  const [seedCount, setSeedCount] = useState(10)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const generateMutation = trpc.brainstorm.generate.useMutation()
  const { data: generationStatus } = trpc.brainstorm.getStatus.useQuery(
    { sessionId: sessionId! },
    {
      enabled: !!sessionId,
      refetchInterval: (query) =>
        query.state.data?.status === 'IN_PROGRESS' ? 2000 : false,
    }
  )

  const saveSeedMutation = trpc.brainstorm.saveSeed.useMutation()
  const dismissSeedMutation = trpc.brainstorm.dismissSeed.useMutation()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    try {
      toast.info('Starting seed generation...')
      const result = await generateMutation.mutateAsync({
        prompt,
        creativityTemp,
        seedCount,
      })
      setSessionId(result.sessionId)
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error('Failed to generate seeds. Please try again.')
    }
  }

  const handleSaveSeed = async (seedId: string) => {
    try {
      await saveSeedMutation.mutateAsync({ id: seedId })
      toast.success('Seed saved to your garden!')
    } catch (error) {
      toast.error('Failed to save seed')
    }
  }

  const handleDismissSeed = async (seedId: string) => {
    try {
      await dismissSeedMutation.mutateAsync({ id: seedId })
      toast.success('Seed dismissed')
    } catch (error) {
      toast.error('Failed to dismiss seed')
    }
  }

  const isGenerating = sessionId && generationStatus?.status === 'IN_PROGRESS'
  const isCompleted = sessionId && generationStatus?.status === 'COMPLETED'

  if (isGenerating) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold">Cooking Up Creative Ideas...</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Our AI is brainstorming {seedCount} unique project seeds. This may take 15-30 seconds.
          </p>
          <Progress value={60} className="mt-6 h-2" />
        </Card>
      </div>
    )
  }

  if (isCompleted && generationStatus?.seeds) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Seeds Are Ready!</h1>
            <p className="mt-2 text-zinc-600">
              Found {generationStatus.seeds.length} creative ideas. Save the ones that spark your interest.
            </p>
          </div>
          <Button variant="outline" onClick={() => setSessionId(null)}>
            Generate More
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {generationStatus.seeds.map((seed: any) => (
            <SeedCard
              key={seed.id}
              seed={seed}
              onSave={() => handleSaveSeed(seed.id)}
              onDismiss={() => handleDismissSeed(seed.id)}
              onElaborate={() => router.push(`/seeds/${seed.id}`)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-8">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl">AI Brainstorming Playground</CardTitle>
              <CardDescription className="mt-2">
                Describe a feeling, mood, or theme, and we'll generate creative project seeds for you to explore
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-0">
          <div>
            <Label htmlFor="prompt">What are you in the mood for?</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'something warm and adventurous with lots of movement' or 'a project about rediscovering childhood wonder' or 'minimal, zen, focused on breath'"
              className="mt-2 min-h-[120px]"
            />
            <p className="mt-2 text-sm text-zinc-500">
              Be as vague or specific as you like. The more creative the prompt, the more surprising the results!
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="seed-count">Number of Seeds</Label>
              <span className="text-sm font-medium text-zinc-700">{seedCount}</span>
            </div>
            <Slider
              id="seed-count"
              value={[seedCount]}
              onValueChange={(values) => setSeedCount(values[0])}
              min={5}
              max={15}
              step={1}
              className="mt-2"
            />
            <p className="mt-2 text-sm text-zinc-500">
              How many ideas should we generate? More seeds = more variety.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="creativity">Creativity Level</Label>
              <span className="text-sm font-medium text-zinc-700">
                {creativityTemp < 0.5 ? 'Safe' : creativityTemp < 0.8 ? 'Balanced' : 'Wild'}
              </span>
            </div>
            <Slider
              id="creativity"
              value={[creativityTemp]}
              onValueChange={(values) => setCreativityTemp(values[0])}
              min={0.3}
              max={1.0}
              step={0.1}
              className="mt-2"
            />
            <p className="mt-2 text-sm text-zinc-500">
              Lower = proven concepts. Higher = experimental and unexpected ideas.
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 shrink-0 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">How this works:</p>
                <p className="mt-1">
                  We'll generate {seedCount} unique project seeds based on your prompt. Each seed includes a title,
                  description, and feasibility score. Save the ones you like to your Seed Garden, or elaborate on
                  them right away.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generateMutation.isPending}
            size="lg"
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Seeds
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
