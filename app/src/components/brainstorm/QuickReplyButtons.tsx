/**
 * Quick Reply Buttons for Seed Elaboration
 *
 * Displays clickable suggestion chips for common answers
 * Based on: project-pipeline/frontend/src/services/seeds.api.ts
 */

import { Button } from '@/components/ui/button'

export interface QuickReply {
  id: string
  text: string
  value: string
}

interface QuickReplyButtonsProps {
  replies: QuickReply[]
  onSelect: (value: string) => void
  disabled?: boolean
}

export function QuickReplyButtons({ replies, onSelect, disabled }: QuickReplyButtonsProps) {
  if (replies.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Quick replies:</p>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply) => (
          <Button
            key={reply.id}
            variant="outline"
            size="sm"
            onClick={() => onSelect(reply.value || reply.text)}
            disabled={disabled}
            className="h-auto py-1.5 text-xs hover:bg-primary hover:text-primary-foreground"
          >
            {reply.text}
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * Generate quick reply suggestions based on question content
 */
export function generateQuickReplies(questionNumber: number): QuickReply[] {
  switch (questionNumber) {
    case 1: // Participants
      return [
        { id: '1', text: '16-20', value: '16-20 participants' },
        { id: '2', text: '21-30', value: '21-30 participants' },
        { id: '3', text: '31-40', value: '31-40 participants' },
        { id: '4', text: '41-60', value: '41-60 participants' },
      ]

    case 2: // Duration
      return [
        { id: '1', text: '5-7 days', value: '5-7 days' },
        { id: '2', text: '8-14 days', value: '8-14 days' },
        { id: '3', text: '15-21 days', value: '15-21 days' },
      ]

    case 3: // Destination
      return [
        { id: '1', text: 'Barcelona, Spain', value: 'Barcelona, Spain' },
        { id: '2', text: 'Berlin, Germany', value: 'Berlin, Germany' },
        { id: '3', text: 'Athens, Greece', value: 'Athens, Greece' },
        { id: '4', text: 'Custom', value: '' },
      ]

    case 5: // Budget
      return [
        { id: '1', text: '€10k-€20k', value: '€10,000 - €20,000' },
        { id: '2', text: '€20k-€40k', value: '€20,000 - €40,000' },
        { id: '3', text: '€40k+', value: 'Over €40,000' },
      ]

    case 7: // Theme
      return [
        { id: '1', text: 'Digital Skills', value: 'Digital skills and technology' },
        { id: '2', text: 'Sustainability', value: 'Environmental sustainability' },
        { id: '3', text: 'Cultural Exchange', value: 'Cultural exchange and diversity' },
        { id: '4', text: 'Health & Wellbeing', value: 'Health and wellbeing' },
      ]

    default:
      return []
  }
}
