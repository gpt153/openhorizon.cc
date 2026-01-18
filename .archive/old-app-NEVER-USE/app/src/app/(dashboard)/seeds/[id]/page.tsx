'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/lib/trpc/client'
import { Loader2, Send, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import ApprovalLikelihoodMeter from '@/components/brainstorm/ApprovalLikelihoodMeter'
import type { ElaborationMessage } from '@/lib/types/brainstorm'
import { useContentField } from '@/lib/hooks/useContentField'
import { ContentModeBadge } from '@/components/ui/ContentModeBadge'
import { useContentModeStore } from '@/lib/stores/contentModeStore'

export default function SeedElaborationPage() {
  const router = useRouter()
  const params = useParams()
  const seedId = params.id as string

  const [userMessage, setUserMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: seed, isLoading, refetch } = trpc.brainstorm.getSeedById.useQuery({ id: seedId })
  const elaborateMutation = trpc.brainstorm.elaborate.useMutation({
    onSuccess: () => {
      setUserMessage('')
      refetch()
    },
  })

  const currentVersion = seed?.currentVersion as any
  const conversationHistory = (seed?.elaborations?.[0]?.conversationHistory || []) as unknown as ElaborationMessage[]
  const { mode } = useContentModeStore()

  // Use content field hook for working/formal mode switching
  const displayTitle = useContentField(
    currentVersion?.title || seed?.title,
    currentVersion?.titleFormal || seed?.titleFormal
  )
  const displayDescription = useContentField(
    currentVersion?.description || seed?.description,
    currentVersion?.descriptionFormal || seed?.descriptionFormal
  )

  // Select approval likelihood based on mode
  const displayLikelihood = mode === 'formal' && seed?.approvalLikelihoodFormal !== null
    ? seed?.approvalLikelihoodFormal
    : seed?.approvalLikelihood

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return

    try {
      await elaborateMutation.mutateAsync({
        seedId,
        userMessage,
      })
    } catch (error) {
      toast.error('Failed to elaborate seed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!seed) {
    return <div>Seed not found</div>
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Elaborate Seed</h1>
        <Button onClick={() => router.push('/projects/new')} variant="default">
          <ArrowRight className="mr-2 h-5 w-5" />
          Turn into Project
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview Panel */}
        <Card className="lg:sticky lg:top-6 lg:h-fit">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">Live Preview</CardTitle>
                <ContentModeBadge formalValue={seed.titleFormal} />
              </div>
              <ApprovalLikelihoodMeter value={displayLikelihood || 0.5} size="md" showLabel />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">Title</label>
              <p className="mt-1 text-lg font-semibold">{displayTitle}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">Description</label>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {displayDescription}
              </p>
            </div>

            {currentVersion?.suggestedTags && (
              <div>
                <label className="text-sm font-medium text-zinc-700">Tags</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentVersion.suggestedTags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="flex flex-col" style={{ height: '600px' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Collaborate with AI
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto pb-4">
              {conversationHistory.length === 0 && (
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-medium">Start refining your seed!</p>
                  <p className="mt-1">
                    Try: &quot;Make it more focused on digital skills&quot; or &quot;Add a sustainability angle&quot; or &quot;What activities
                    would work for this?&quot;
                  </p>
                </div>
              )}

              {conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'ml-8 bg-blue-100 text-blue-900'
                      : 'mr-8 bg-zinc-100 text-zinc-900'
                  }`}
                >
                  <p className="text-sm font-medium">{msg.role === 'user' ? 'You' : 'AI Assistant'}</p>
                  <p className="mt-1 text-sm">{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 border-t pt-4">
              <Textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Ask for changes, suggestions, or ideas..."
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userMessage.trim() || elaborateMutation.isPending}
                size="lg"
                className="self-end"
              >
                {elaborateMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
