'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type CreateProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [participantCount, setParticipantCount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const utils = trpc.useUtils()

  const createMutation = trpc.pipeline.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success('Pipeline project created successfully')
      utils.pipeline.projects.list.invalidate()
      onOpenChange(false)
      resetForm()
      router.push(`/pipeline/projects/${data.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`)
    },
  })

  const resetForm = () => {
    setName('')
    setLocation('')
    setParticipantCount('')
    setStartDate('')
    setEndDate('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!name.trim() || !location.trim() || !participantCount || !startDate || !endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    const participants = parseInt(participantCount, 10)
    if (isNaN(participants) || participants < 1) {
      toast.error('Participant count must be a positive number')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      location: location.trim(),
      participantCount: participants,
      startDate: startDate,
      endDate: endDate,
      type: 'STUDENT_EXCHANGE',
      budgetTotal: 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Pipeline Project</DialogTitle>
          <DialogDescription>
            Enter basic details to create a new pipeline project for vendor coordination
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Barcelona Youth Exchange 2026"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Barcelona, Spain"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="participants">Participant Count *</Label>
              <Input
                id="participants"
                type="number"
                min="1"
                value={participantCount}
                onChange={(e) => setParticipantCount(e.target.value)}
                placeholder="20"
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
