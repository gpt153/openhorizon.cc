'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/types/budget'
import { ExpenseCategory } from '@prisma/client'
import { MoreHorizontal, FileText, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Expense {
  id: string
  amount: number | string
  category: ExpenseCategory
  description: string
  date: Date
  receiptUrl?: string | null
  phase: {
    name: string
    type: string
  }
}

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
}

const categoryColors: Record<ExpenseCategory, string> = {
  ACCOMMODATION: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  TRAVEL: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  FOOD: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  ACTIVITIES: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  INSURANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  EMERGENCY: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  OTHER: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL')

  const filteredExpenses = categoryFilter === 'ALL'
    ? expenses
    : expenses.filter(e => e.category === categoryFilter)

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expenses</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} • {formatCurrency(totalAmount)}
            </p>
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ExpenseCategory | 'ALL')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {Object.values(ExpenseCategory).map(cat => (
                <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No expenses found</p>
          ) : (
            filteredExpenses.map(expense => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={categoryColors[expense.category]}>
                      {expense.category}
                    </Badge>
                    {expense.receiptUrl && (
                      <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  <p className="font-medium mt-1">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.phase.name} • {new Date(expense.date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">{formatCurrency(Number(expense.amount))}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(expense.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
