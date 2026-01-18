/**
 * Metadata Preview for Seed Elaboration
 *
 * Displays collected metadata and "Convert to Project" button
 * Based on: project-pipeline/frontend/src/components/seeds/MetadataPreview.tsx
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import type { RichSeedMetadata } from '@/lib/types/brainstorm'

interface MetadataPreviewProps {
  metadata: RichSeedMetadata
  onConvert?: () => void
  isConvertEnabled?: boolean
}

export function MetadataPreview({ metadata, onConvert, isConvertEnabled }: MetadataPreviewProps) {
  const canConvert = isConvertEnabled ?? metadata.completeness >= 80

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Project Information</CardTitle>
        <p className="text-sm text-muted-foreground">
          Collected from your answers
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Participants */}
        <MetadataField
          label="Participants"
          value={metadata.participantCount?.toString()}
          icon={metadata.participantCount ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
        />

        {/* Duration */}
        <MetadataField
          label="Duration"
          value={metadata.duration ? `${metadata.duration} days` : undefined}
          icon={metadata.duration ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
        />

        {/* Destination */}
        <MetadataField
          label="Destination"
          value={
            metadata.destination
              ? `${metadata.destination.city}${metadata.destination.country ? `, ${metadata.destination.country}` : ''}`
              : undefined
          }
          icon={metadata.destination ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
        />

        {/* Countries */}
        {metadata.participantCountries && metadata.participantCountries.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">Participant Countries</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {metadata.participantCountries.map((country, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {country}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Budget */}
        <MetadataField
          label="Budget"
          value={metadata.totalBudget ? `€${metadata.totalBudget.toLocaleString()}` : undefined}
          icon={metadata.totalBudget ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
        />

        {/* Activities */}
        {metadata.activities && metadata.activities.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">Activities</span>
            </div>
            <ul className="space-y-1 text-sm">
              {metadata.activities.slice(0, 3).map((activity, index) => (
                <li key={index} className="truncate text-xs">
                  • {activity}
                </li>
              ))}
              {metadata.activities.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{metadata.activities.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Theme */}
        <MetadataField
          label="Theme"
          value={metadata.theme}
          icon={metadata.theme ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
        />

        {/* Divider */}
        <div className="my-4 border-t" />

        {/* Completeness */}
        <div className="text-center">
          <p className="mb-1 text-sm font-medium">Completeness</p>
          <p className="mb-3 text-3xl font-bold text-primary">
            {metadata.completeness}%
          </p>
          {metadata.completeness < 80 && (
            <p className="text-xs text-muted-foreground">
              Complete at least 6 of 7 questions (80%) to convert to project
            </p>
          )}
        </div>

        {/* Convert Button */}
        <Button
          onClick={onConvert}
          disabled={!canConvert}
          size="lg"
          className="w-full"
        >
          Convert to Project
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {!canConvert && (
          <p className="text-center text-xs text-muted-foreground">
            Answer more questions to enable conversion
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function MetadataField({ label, value, icon }: { label: string; value?: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-medium">
        {value || <span className="text-muted-foreground">Not answered yet</span>}
      </p>
    </div>
  )
}
