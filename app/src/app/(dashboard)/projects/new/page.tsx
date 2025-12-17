'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc/client'
import { Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useProjectWizard } from '@/hooks/useProjectWizard'
import { toast } from 'sonner'

export default function NewProjectPage() {
  const router = useRouter()
  const { currentStep, formData, updateFormData, goNext, goBack, reset } = useProjectWizard()
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const generateMutation = trpc.projects.generateFromIdea.useMutation()
  const { data: generationStatus } = trpc.projects.getGenerationStatus.useQuery(
    { sessionId: sessionId! },
    {
      enabled: !!sessionId,
      refetchInterval: (query) => (query.state.data?.status === 'IN_PROGRESS' ? 2000 : false),
    }
  )

  const handleSubmit = async () => {
    try {
      setIsGenerating(true)
      toast.info('Starting project generation...')
      const result = await generateMutation.mutateAsync(formData as any)
      setSessionId(result.sessionId)
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error('Failed to generate project. Please try again.')
      setIsGenerating(false)
    }
  }

  // Handle generation status changes
  useEffect(() => {
    if (generationStatus?.status === 'COMPLETED' && generationStatus.project) {
      toast.success('Project generated successfully!')
      router.push(`/projects/${generationStatus.project.id}`)
    } else if (generationStatus?.status === 'FAILED') {
      toast.error('Project generation failed. Please try again.')
      setIsGenerating(false)
      setSessionId(null)
    }
  }, [generationStatus, router])

  const steps = ['Basics', 'Participants', 'Duration', 'Partners', 'Details']
  const isLastStep = currentStep === steps.length - 1

  // Validation for each step
  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Basics
        return formData.theme && formData.theme.trim().length > 0
      case 1: // Participants
        return formData.age_group && formData.target_profile
      case 2: // Duration
        return formData.activity_intensity && formData.green_ambition
      case 3: // Partners
        return formData.partner_status && formData.partner_experience
      case 4: // Details
        return formData.primary_languages && formData.digital_comfort && formData.budget_flexibility
      default:
        return true
    }
  }

  const canGoNext = currentStep < steps.length - 1 && isStepValid()
  const canSubmit = isStepValid()

  if (isGenerating || sessionId) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold">Generating Your Project...</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Our AI is crafting your Erasmus+ project concept. This may take 30-60 seconds.
          </p>
          <div className="mt-6">
            <Progress value={generationStatus?.status === 'COMPLETED' ? 100 : 60} className="h-2" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-zinc-600">{steps[currentStep]}</span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">What's your project about?</h2>
                <p className="mt-2 text-zinc-600">Tell us the main theme or topic</p>
              </div>
              <div>
                <Label>Project Theme *</Label>
                <Input
                  value={formData.theme || ''}
                  onChange={(e) => updateFormData({ theme: e.target.value })}
                  placeholder="e.g., Environmental sustainability"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Additional details about your project..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Who will participate?</h2>
                <p className="mt-2 text-zinc-600">Define your target group</p>
              </div>
              <div>
                <Label>Age Group *</Label>
                <RadioGroup
                  value={formData.age_group}
                  onValueChange={(value: any) => updateFormData({ age_group: value })}
                  className="mt-2 space-y-2"
                >
                  {['13-17', '18-25', '26-30', 'mixed'].map((age) => (
                    <div key={age} className="flex items-center space-x-2">
                      <RadioGroupItem value={age} id={age} />
                      <Label htmlFor={age} className="font-normal">{age} years</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Number of Participants: {formData.participant_count}</Label>
                <Slider
                  value={[formData.participant_count || 30]}
                  onValueChange={([value]) => updateFormData({ participant_count: value })}
                  min={16}
                  max={60}
                  step={1}
                  className="mt-4"
                />
                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                  <span>16</span>
                  <span>60</span>
                </div>
              </div>
              <div>
                <Label>Target Profile *</Label>
                <RadioGroup
                  value={formData.target_profile}
                  onValueChange={(value: any) => updateFormData({ target_profile: value })}
                  className="mt-2 space-y-2"
                >
                  {[
                    { value: 'general', label: 'General youth population' },
                    { value: 'fewer_opportunities', label: 'Youth with fewer opportunities' },
                    { value: 'specific_needs', label: 'Specific needs (accessibility, etc.)' },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Project duration</h2>
                <p className="mt-2 text-zinc-600">How long will the exchange last?</p>
              </div>
              <div>
                <Label>Duration: {formData.duration_days} days</Label>
                <Slider
                  value={[formData.duration_days || 10]}
                  onValueChange={([value]) => updateFormData({ duration_days: value })}
                  min={5}
                  max={21}
                  step={1}
                  className="mt-4"
                />
                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                  <span>5 days</span>
                  <span>21 days</span>
                </div>
              </div>
              <div>
                <Label>Activity Intensity *</Label>
                <RadioGroup
                  value={formData.activity_intensity}
                  onValueChange={(value: any) => updateFormData({ activity_intensity: value })}
                  className="mt-2 space-y-2"
                >
                  {[
                    { value: 'low', label: 'Low (relaxed pace, many breaks)' },
                    { value: 'medium', label: 'Medium (balanced schedule)' },
                    { value: 'high', label: 'High (intensive programme)' },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Environmental Focus *</Label>
                <RadioGroup
                  value={formData.green_ambition}
                  onValueChange={(value: any) => updateFormData({ green_ambition: value })}
                  className="mt-2 space-y-2"
                >
                  {[
                    { value: 'basic', label: 'Basic (meet requirements)' },
                    { value: 'moderate', label: 'Moderate (active green practices)' },
                    { value: 'high', label: 'High (sustainability focus)' },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Partner organizations</h2>
                <p className="mt-2 text-zinc-600">Tell us about your partners</p>
              </div>
              <div>
                <Label>Partner Status *</Label>
                <RadioGroup
                  value={formData.partner_status}
                  onValueChange={(value: any) => updateFormData({ partner_status: value })}
                  className="mt-2 space-y-2"
                >
                  {[
                    { value: 'confirmed', label: 'Partners confirmed' },
                    { value: 'need_suggestions', label: 'Need partner suggestions' },
                    { value: 'some_confirmed', label: 'Some confirmed, need more' },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Partner Experience *</Label>
                <RadioGroup
                  value={formData.partner_experience}
                  onValueChange={(value: any) => updateFormData({ partner_experience: value })}
                  className="mt-2 space-y-2"
                >
                  {[
                    { value: 'new', label: 'New to Erasmus+' },
                    { value: 'mixed', label: 'Mixed experience' },
                    { value: 'experienced', label: 'All experienced' },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Preferred Countries (optional)</Label>
                <Input
                  value={formData.preferred_countries || ''}
                  onChange={(e) => updateFormData({ preferred_countries: e.target.value })}
                  placeholder="e.g., Germany, Italy, Poland"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Final details</h2>
                <p className="mt-2 text-zinc-600">Just a few more questions</p>
              </div>
              <div>
                <Label>Primary Languages *</Label>
                <Input
                  value={formData.primary_languages || ''}
                  onChange={(e) => updateFormData({ primary_languages: e.target.value })}
                  placeholder="e.g., English, Swedish"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Digital Comfort *</Label>
                <RadioGroup
                  value={formData.digital_comfort}
                  onValueChange={(value: any) => updateFormData({ digital_comfort: value })}
                  className="mt-2 space-y-2"
                >
                  {[
                    { value: 'low', label: 'Low (limited experience)' },
                    { value: 'medium', label: 'Medium (comfortable with basics)' },
                    { value: 'high', label: 'High (digitally savvy)' },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Budget Flexibility *</Label>
                <RadioGroup
                  value={formData.budget_flexibility}
                  onValueChange={(value: any) => updateFormData({ budget_flexibility: value })}
                  className="mt-2 space-y-2"
                >
                  {[
                    { value: 'tight', label: 'Tight (minimum costs)' },
                    { value: 'moderate', label: 'Moderate (reasonable spending)' },
                    { value: 'flexible', label: 'Flexible (quality prioritized)' },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Additional Notes (optional)</Label>
                <Textarea
                  value={formData.additional_notes || ''}
                  onChange={(e) => updateFormData({ additional_notes: e.target.value })}
                  placeholder="Any other important information..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? () => router.back() : goBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={generateMutation.isPending || !canSubmit}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Project
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (canGoNext) {
                  goNext()
                } else {
                  toast.error('Please fill in all required fields')
                }
              }}
              disabled={!canGoNext}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
