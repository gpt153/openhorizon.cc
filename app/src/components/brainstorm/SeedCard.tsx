'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Trash2, MessageSquare } from 'lucide-react'
import type { Seed } from '@prisma/client'
import ApprovalLikelihoodMeter from './ApprovalLikelihoodMeter'
import { useContentField } from '@/lib/hooks/useContentField'
import { ContentModeBadge } from '@/components/ui/ContentModeBadge'
import { useContentModeStore } from '@/lib/stores/contentModeStore'

interface SeedCardProps {
  seed: Seed
  onSave: () => void
  onDismiss: () => void
  onElaborate: () => void
  showActions?: boolean
}

export default function SeedCard({
  seed,
  onSave,
  onDismiss,
  onElaborate,
  showActions = true,
}: SeedCardProps) {
  const currentVersion = seed.currentVersion as any
  const { mode } = useContentModeStore()

  // Use content field hook for working/formal mode switching
  const displayTitle = useContentField(seed.title, seed.titleFormal)
  const displayDescription = useContentField(seed.description, seed.descriptionFormal)

  // Select approval likelihood based on mode
  const displayLikelihood = mode === 'formal' && seed.approvalLikelihoodFormal !== null
    ? seed.approvalLikelihoodFormal
    : seed.approvalLikelihood

  return (
    <Card
      className="group relative flex flex-col transition-shadow hover:shadow-lg cursor-pointer"
      onClick={showActions ? undefined : onElaborate}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg leading-tight">{displayTitle}</CardTitle>
            </div>
            <ContentModeBadge formalValue={seed.titleFormal} />
          </div>
          <ApprovalLikelihoodMeter value={displayLikelihood} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <CardDescription className="line-clamp-4 text-sm leading-relaxed">
          {displayDescription}
        </CardDescription>

        {currentVersion?.suggestedTags && currentVersion.suggestedTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentVersion.suggestedTags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {seed.elaborationCount > 0 && (
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <MessageSquare className="h-3 w-3" />
            <span>{seed.elaborationCount} elaborations</span>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDismiss()
            }}
            className="flex-1"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Pass
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSave()
            }}
            className="flex-1"
          >
            <Heart className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onElaborate()
            }}
            className="flex-1"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Elaborate
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
