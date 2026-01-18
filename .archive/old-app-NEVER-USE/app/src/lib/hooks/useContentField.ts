import { useContentModeStore } from '@/lib/stores/contentModeStore'

/**
 * Helper function to get the appropriate field value based on mode
 * Falls back to working mode if formal version is not available
 */
export function getContentFieldValue(
  mode: 'working' | 'formal',
  workingValue: string | null | undefined,
  formalValue: string | null | undefined
): string {
  if (mode === 'formal' && formalValue) {
    return formalValue
  }

  return workingValue || ''
}

/**
 * Hook to get the appropriate field value based on current content mode
 * Falls back to working mode if formal version is not available
 */
export function useContentField(
  workingValue: string | null | undefined,
  formalValue: string | null | undefined
): string {
  const { mode } = useContentModeStore()
  return getContentFieldValue(mode, workingValue, formalValue)
}

/**
 * Check if a formal version exists for a field
 */
export function hasFormalVersion(
  formalValue: string | null | undefined
): boolean {
  return Boolean(formalValue && formalValue.trim().length > 0)
}

/**
 * Get field name for tRPC updates based on current mode
 */
export function getFieldName(
  baseFieldName: string,
  mode: 'working' | 'formal'
): string {
  return mode === 'formal' ? `${baseFieldName}Formal` : baseFieldName
}
