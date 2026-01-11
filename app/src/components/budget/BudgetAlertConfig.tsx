'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Bell, Trash2 } from 'lucide-react'

const alertSchema = z.object({
  threshold: z.number().min(1).max(200),
  emailRecipients: z.string().min(1, 'At least one email required'),
})

type AlertFormData = z.infer<typeof alertSchema>

interface BudgetAlertConfigProps {
  projectId: string
}

export function BudgetAlertConfig({ projectId }: BudgetAlertConfigProps) {
  const [isAdding, setIsAdding] = useState(false)
  const utils = trpc.useUtils()

  const { data: alerts, isLoading } = trpc.pipeline.alerts.list.useQuery({ projectId })

  const form = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      threshold: 90,
      emailRecipients: '',
    },
  })

  const createAlert = trpc.pipeline.alerts.create.useMutation({
    onSuccess: () => {
      toast.success('Budget alert created')
      utils.pipeline.alerts.list.invalidate()
      form.reset()
      setIsAdding(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create alert')
    },
  })

  const updateAlert = trpc.pipeline.alerts.update.useMutation({
    onSuccess: () => {
      toast.success('Alert updated')
      utils.pipeline.alerts.list.invalidate()
    },
  })

  const deleteAlert = trpc.pipeline.alerts.delete.useMutation({
    onSuccess: () => {
      toast.success('Alert deleted')
      utils.pipeline.alerts.list.invalidate()
    },
  })

  const onSubmit = (data: AlertFormData) => {
    const emails = data.emailRecipients.split(',').map(e => e.trim()).filter(Boolean)
    createAlert.mutate({
      projectId,
      threshold: data.threshold,
      emailRecipients: emails,
    })
  }

  const threshold = form.watch('threshold')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Budget Alerts
        </CardTitle>
        <CardDescription>
          Configure automated email notifications when budget thresholds are reached
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Alerts */}
        {!isLoading && alerts && alerts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Active Alerts</h4>
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge>{alert.threshold}%</Badge>
                    {!alert.enabled && (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.emailRecipients.join(', ')}
                  </p>
                  {alert.lastTriggeredAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last triggered: {new Date(alert.lastTriggeredAt).toLocaleDateString('sv-SE')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={(enabled: boolean) =>
                      updateAlert.mutate({ id: alert.id, data: { enabled } })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlert.mutate({ id: alert.id })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Alert */}
        {isAdding ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Threshold: {threshold}%</FormLabel>
                    <FormControl>
                      <Slider
                        min={50}
                        max={150}
                        step={5}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Alert will trigger when budget reaches this percentage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailRecipients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Recipients</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email1@example.com, email2@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of email addresses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createAlert.isPending}>
                  {createAlert.isPending ? 'Creating...' : 'Create Alert'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
            Add Budget Alert
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
