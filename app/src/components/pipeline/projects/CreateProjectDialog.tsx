'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'

const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  type: z.enum(['STUDENT_EXCHANGE', 'TRAINING', 'CONFERENCE', 'CUSTOM']),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budgetTotal: z.number().positive('Budget must be positive'),
  participantCount: z.number().int().positive('Participant count must be positive'),
  location: z.string().min(2, 'Location is required'),
  originCountry: z.string().optional(),
  hostCountry: z.string().optional(),
})

type CreateProjectFormData = z.infer<typeof createProjectSchema>

type CreateProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      type: 'STUDENT_EXCHANGE',
      participantCount: 20,
      budgetTotal: 50000,
    },
  })

  const createProject = trpc.pipeline.projects.create.useMutation({
    onSuccess: (project) => {
      router.push(`/pipeline/projects/${project.id}`)
      onOpenChange(false)
      reset()
    },
    onError: (error) => {
      console.error('Failed to create project:', error)
      alert('Failed to create project. Please try again.')
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = (data: CreateProjectFormData) => {
    setIsSubmitting(true)
    createProject.mutate(data)
  }

  const projectType = watch('type')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Pipeline Project</DialogTitle>
          <DialogDescription>
            Create a new pipeline project to manage Erasmus+ applications, budgets, and vendor communications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Barcelona Youth Exchange 2026"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Project Type *</Label>
            <Select
              value={projectType}
              onValueChange={(value) => setValue('type', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT_EXCHANGE">Student Exchange</SelectItem>
                <SelectItem value="TRAINING">Training</SelectItem>
                <SelectItem value="CONFERENCE">Conference</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the project..."
              rows={3}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Budget and Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetTotal">Total Budget (EUR) *</Label>
              <Input
                id="budgetTotal"
                type="number"
                step="0.01"
                {...register('budgetTotal', { valueAsNumber: true })}
                placeholder="50000"
              />
              {errors.budgetTotal && (
                <p className="text-sm text-red-600">{errors.budgetTotal.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="participantCount">Participants *</Label>
              <Input
                id="participantCount"
                type="number"
                {...register('participantCount', { valueAsNumber: true })}
                placeholder="20"
              />
              {errors.participantCount && (
                <p className="text-sm text-red-600">{errors.participantCount.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Barcelona, Spain"
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Countries */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originCountry">Origin Country Code</Label>
              <Input
                id="originCountry"
                {...register('originCountry')}
                placeholder="e.g., SE"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostCountry">Host Country Code</Label>
              <Input
                id="hostCountry"
                {...register('hostCountry')}
                placeholder="e.g., ES"
                maxLength={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
