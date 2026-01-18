'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/lib/trpc/client'
import { Loader2, Send, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { ElaborationProgressIndicator } from '@/components/brainstorm/ElaborationProgressIndicator'
import { QuickReplyButtons, generateQuickReplies } from '@/components/brainstorm/QuickReplyButtons'
import { MetadataPreview } from '@/components/brainstorm/MetadataPreview'
import type { ElaborationMessage, RichSeedMetadata } from '@/lib/types/brainstorm'

export default function SeedElaborationPage() {
  const router = useRouter()
  const params = useParams()
  const seedId = params.id as string

  const [userMessage, setUserMessage] = useState('')
  const [quickReplies, setQuickReplies] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: seed, isLoading, refetch } = trpc.brainstorm.getSeedById.useQuery({ id: seedId })
  const elaborateMutation = trpc.brainstorm.elaborate.useMutation({
    onSuccess: (response) => {
      setUserMessage('')
      // Generate quick replies for next question
      if (response.nextQuestionId) {
        setQuickReplies(generateQuickReplies(response.nextQuestionId))
      } else {
        setQuickReplies([])
      }
      refetch()
    },
  })

  const conversationHistory = (seed?.elaborations?.[0]?.conversationHistory || []) as unknown as ElaborationMessage[]
  const metadata: RichSeedMetadata = (seed?.metadata as any) || { completeness: 0 }
  const completeness = seed?.completeness ?? 0

  // Generate initial quick replies on first load
  useEffect(() => {
    if (seed && quickReplies.length === 0 && completeness < 100) {
      // Determine next question based on completeness
      const answeredQuestions = Math.round((completeness / 100) * 7)
      const nextQuestionId = Math.min(answeredQuestions + 1, 7)
      setQuickReplies(generateQuickReplies(nextQuestionId))
    }
  }, [seed, completeness])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || userMessage
    if (!messageToSend.trim()) return

    try {
      await elaborateMutation.mutateAsync({
        seedId,
        userMessage: messageToSend,
      })
    } catch (error) {
      toast.error('Failed to elaborate seed')
    }
  }

  const handleQuickReply = (value: string) => {
    setUserMessage(value)
    if (value) {
      handleSendMessage(value)
    }
  }

  const handleConvertToProject = () => {
    // TODO: Implement conversion to project
    router.push(`/projects/new?seedId=${seedId}`)
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
        <Button onClick={handleConvertToProject} variant="default" disabled={completeness < 80}>
          <ArrowRight className="mr-2 h-5 w-5" />
          Turn into Project {completeness >= 80 ? '' : `(${completeness}%)`}
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <ElaborationProgressIndicator
          completeness={completeness}
          totalQuestions={7}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Panel */}
        <Card className="flex flex-col lg:col-span-2" style={{ height: '600px' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Answer Questions to Complete Your Seed
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto pb-4">
              {conversationHistory.length === 0 && (
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-medium">Welcome to the seed elaboration process!</p>
                  <p className="mt-1">
                    I'll ask you 7 questions to help build a complete project plan. You can answer in natural language,
                    or use the quick reply buttons below. Let's start!
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

            {/* Quick Replies */}
            {quickReplies.length > 0 && (
              <QuickReplyButtons
                replies={quickReplies}
                onSelect={handleQuickReply}
                disabled={elaborateMutation.isPending}
              />
            )}

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
                  if (e.key === 'Escape') {
                    setUserMessage('')
                  }
                }}
                placeholder="Answer the question or ask for changes..."
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={() => handleSendMessage()}
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

        {/* Metadata Preview Panel */}
        <div className="lg:col-span-1">
          <MetadataPreview
            metadata={metadata}
            onConvert={handleConvertToProject}
            isConvertEnabled={completeness >= 80}
          />
        </div>
      </div>
    </div>
  )
}
