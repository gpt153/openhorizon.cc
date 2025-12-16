'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const commonThemes = [
  'Environment & Sustainability',
  'Digital Skills',
  'Inclusion & Diversity',
  'Arts & Culture',
  'Democracy & Participation',
  'Health & Well-being',
]

type BasicsStepProps = {
  theme: string
  description?: string
  onChange: (data: { theme?: string; description?: string }) => void
}

export function BasicsStep({ theme, description, onChange }: BasicsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Let's start with the basics</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Tell us about your project theme and what you want to achieve
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="theme">Project Theme *</Label>
          <Input
            id="theme"
            value={theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            placeholder="e.g., Environmental sustainability through youth activism"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Or choose from common themes:</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {commonThemes.map((t) => (
              <Button
                key={t}
                type="button"
                variant={theme === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ theme: t })}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Additional Description (optional)</Label>
          <Textarea
            id="description"
            value={description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Tell us more about your project idea..."
            className="mt-2"
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}
