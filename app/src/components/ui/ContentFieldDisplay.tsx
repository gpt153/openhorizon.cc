'use client'

import { useContentField } from '@/lib/hooks/useContentField'

interface ContentFieldDisplayProps {
  workingValue: string | null | undefined
  formalValue: string | null | undefined
  className?: string
}

/**
 * Component to display content that switches based on content mode
 * Properly calls useContentField hook at component level
 */
export function ContentFieldDisplay({
  workingValue,
  formalValue,
  className = ''
}: ContentFieldDisplayProps) {
  const value = useContentField(workingValue, formalValue)

  return <span className={className}>{value}</span>
}
