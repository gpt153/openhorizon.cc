'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/lib/trpc/client'
import { Loader2, Plus, X, Calculator, Save } from 'lucide-react'
import { toast } from 'sonner'
import { BudgetResults } from './BudgetResults'

interface ParticipantEntry {
  id: string
  country: string
  count: number
}

interface BudgetCalculatorProps {
  projectId?: string
  onSave?: () => void
}

export function BudgetCalculator({ projectId, onSave }: BudgetCalculatorProps) {
  const [destinationCity, setDestinationCity] = useState('')
  const [destinationCountry, setDestinationCountry] = useState('')
  const [durationDays, setDurationDays] = useState<number>(7)
  const [useGreenTravel, setUseGreenTravel] = useState(false)
  const [participants, setParticipants] = useState<ParticipantEntry[]>([
    { id: '1', country: 'SE', count: 15 },
  ])
  const [calculationResult, setCalculationResult] = useState<any>(null)

  const calculateMutation = trpc.pipeline.budgetCalculator.calculateBudget.useMutation({
    onSuccess: (data) => {
      setCalculationResult(data)
      toast.success('Budget calculated successfully!')
      if (onSave) {
        onSave()
      }
    },
    onError: (error) => {
      toast.error(`Calculation failed: ${error.message}`)
    },
  })

  const addParticipantEntry = () => {
    setParticipants([
      ...participants,
      { id: Date.now().toString(), country: '', count: 1 },
    ])
  }

  const removeParticipantEntry = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id))
  }

  const updateParticipantEntry = (
    id: string,
    field: 'country' | 'count',
    value: string | number
  ) => {
    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    )
  }

  const handleCalculate = () => {
    // Validate inputs
    if (!destinationCity || !destinationCountry) {
      toast.error('Please enter destination city and country')
      return
    }

    if (destinationCountry.length !== 2) {
      toast.error('Country code must be 2 letters (e.g., ES for Spain)')
      return
    }

    if (participants.length === 0) {
      toast.error('Please add at least one participant group')
      return
    }

    // Build participantsByCountry object
    const participantsByCountry: Record<string, number> = {}
    for (const entry of participants) {
      if (!entry.country || entry.count <= 0) {
        toast.error('All participant entries must have valid country code and count')
        return
      }
      if (entry.country.length !== 2) {
        toast.error('All country codes must be 2 letters (e.g., DE for Germany)')
        return
      }
      participantsByCountry[entry.country.toUpperCase()] = entry.count
    }

    // Calculate
    calculateMutation.mutate({
      projectId,
      participantsByCountry,
      destinationCity,
      destinationCountry: destinationCountry.toUpperCase(),
      durationDays,
      useGreenTravel,
    })
  }

  const totalParticipants = participants.reduce((sum, p) => sum + p.count, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Budget Calculator
          </CardTitle>
          <CardDescription>
            Calculate Erasmus+ project budget based on 2024-2027 unit costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Destination */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Destination</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="destination-city">City</Label>
                <Input
                  id="destination-city"
                  placeholder="e.g., Barcelona"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="destination-country">
                  Country Code (2 letters)
                </Label>
                <Input
                  id="destination-country"
                  placeholder="e.g., ES"
                  maxLength={2}
                  value={destinationCountry}
                  onChange={(e) =>
                    setDestinationCountry(e.target.value.toUpperCase())
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Duration */}
          <div>
            <Label htmlFor="duration">Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
              className="mt-1.5 max-w-xs"
            />
          </div>

          <Separator />

          {/* Participants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Participants by Country</h3>
                <p className="text-sm text-zinc-600">
                  Total: {totalParticipants} participants
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addParticipantEntry}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Country
              </Button>
            </div>

            <div className="space-y-3">
              {participants.map((entry) => (
                <div key={entry.id} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label htmlFor={`country-${entry.id}`}>Country Code</Label>
                    <Input
                      id={`country-${entry.id}`}
                      placeholder="e.g., SE"
                      maxLength={2}
                      value={entry.country}
                      onChange={(e) =>
                        updateParticipantEntry(
                          entry.id,
                          'country',
                          e.target.value.toUpperCase()
                        )
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`count-${entry.id}`}>Participants</Label>
                    <Input
                      id={`count-${entry.id}`}
                      type="number"
                      min={1}
                      value={entry.count}
                      onChange={(e) =>
                        updateParticipantEntry(
                          entry.id,
                          'count',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParticipantEntry(entry.id)}
                    disabled={participants.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Green Travel */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="green-travel">Green Travel</Label>
              <p className="text-sm text-zinc-600">
                Add green travel supplement for eligible distances
              </p>
            </div>
            <Switch
              id="green-travel"
              checked={useGreenTravel}
              onCheckedChange={setUseGreenTravel}
            />
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={calculateMutation.isPending}
            className="w-full"
            size="lg"
          >
            {calculateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Budget
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {calculationResult && <BudgetResults result={calculationResult} />}
    </div>
  )
}
