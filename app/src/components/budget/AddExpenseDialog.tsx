'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
// Removed invalid Prisma type import from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const expenseSchema = z.object({
  phaseId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(3, 'Description is required'),
  date: z.string(), // Date input as string, will convert
  receiptUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface AddExpenseDialogProps {
  phaseId: string
  phaseName: string
  onSuccess?: () => void
}

export function AddExpenseDialog({ phaseId, phaseName, onSuccess }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const utils = trpc.useUtils()

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      phaseId,
      category: ExpenseCategory.OTHER,
      date: new Date().toISOString().split('T')[0],
    },
  })

  const createExpense = trpc.pipeline.expenses.create.useMutation({
    onSuccess: () => {
      toast.success('Expense added successfully')
      utils.pipeline.expenses.list.invalidate()
      utils.pipeline.phases.getById.invalidate()
      utils.pipeline.projects.getById.invalidate()
      setOpen(false)
      form.reset()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add expense')
    },
  })

  const onSubmit = (data: ExpenseFormData) => {
    createExpense.mutate({
      ...data,
      date: new Date(data.date),
      receiptUrl: data.receiptUrl || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Add a new expense to {phaseName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (EUR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ExpenseCategory).map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the expense..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createExpense.isPending}>
                {createExpense.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
