'use client'

import { useContentModeStore } from '@/lib/stores/contentModeStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ScrollText } from 'lucide-react'

export function ContentModeToggle() {
  const { mode, toggleMode, isWorking } = useContentModeStore()

  return (
    <div className="flex items-center gap-3">
      <Badge variant={isWorking ? 'default' : 'secondary'} className="text-xs">
        {isWorking ? (
          <>
            <FileText className="mr-1 h-3 w-3" />
            Working Mode
          </>
        ) : (
          <>
            <ScrollText className="mr-1 h-3 w-3" />
            Formal Mode
          </>
        )}
      </Badge>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleMode}
        className="text-xs"
        title={`Switch to ${isWorking ? 'Formal' : 'Working'} Mode`}
      >
        Switch to {isWorking ? 'Formal' : 'Working'}
      </Button>
    </div>
  )
}
