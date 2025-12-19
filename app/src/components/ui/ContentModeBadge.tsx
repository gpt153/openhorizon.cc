'use client'

import { useContentModeStore } from '@/lib/stores/contentModeStore'
import { Badge } from '@/components/ui/badge'
import { hasFormalVersion } from '@/lib/hooks/useContentField'
import { AlertCircle } from 'lucide-react'

interface ContentModeBadgeProps {
  formalValue?: string | null
  inline?: boolean
  className?: string
}

export function ContentModeBadge({
  formalValue,
  inline = false,
  className = ''
}: ContentModeBadgeProps) {
  const { isFormal } = useContentModeStore()
  const hasFormal = hasFormalVersion(formalValue)

  if (isFormal && !hasFormal) {
    return (
      <Badge variant="outline" className={`text-xs text-amber-600 ${className}`}>
        <AlertCircle className="mr-1 h-3 w-3" />
        No formal version (showing working)
      </Badge>
    )
  }

  return null
}
