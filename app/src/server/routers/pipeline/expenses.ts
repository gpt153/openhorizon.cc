import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
// Removed invalid Prisma type import from '@prisma/client'
import { shouldTriggerAlert } from '@/lib/budget/health-calculator'
import { sendBudgetAlertEmail } from '@/lib/email/templates/budget-alert'

// ExpenseCategory enum from Prisma schema
// Defined locally to avoid Prisma client generation issues
enum ExpenseCategory {
  ACCOMMODATION = 'ACCOMMODATION',
  TRAVEL = 'TRAVEL',
  FOOD = 'FOOD',
  ACTIVITIES = 'ACTIVITIES',
  INSURANCE = 'INSURANCE',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

const createExpenseSchema = z.object({
  phaseId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(3, 'Description is required'),
  date: z.date(),
  receiptUrl: z.string().url().optional(),
})

const updateExpenseSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    amount: z.number().positive().optional(),
    category: z.nativeEnum(ExpenseCategory).optional(),
    description: z.string().min(3).optional(),
    date: z.date().optional(),
    receiptUrl: z.string().url().optional().nullable(),
  }),
})

export const expensesRouter = router({
  // List expenses for a phase or project
  list: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid().optional(),
        phaseId: z.string().uuid().optional(),
        category: z.nativeEnum(ExpenseCategory).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Build where clause
      const where: any = {
        tenantId: ctx.orgId,
      }

      if (input.projectId) {
        where.projectId = input.projectId
      }

      if (input.phaseId) {
        where.phaseId = input.phaseId
      }

      if (input.category) {
        where.category = input.category
      }

      if (input.startDate || input.endDate) {
        where.date = {}
        if (input.startDate) {
          where.date.gte = input.startDate
        }
        if (input.endDate) {
          where.date.lte = input.endDate
        }
      }

      const expenses = await ctx.prisma.expense.findMany({
        where,
        include: {
          phase: {
            select: {
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      })

      return expenses
    }),

  // Get single expense
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          phase: true,
          project: true,
        },
      })

      if (!expense) {
        throw new Error('Expense not found')
      }

      return expense
    }),

  // Create expense
  create: orgProcedure
    .input(createExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // Get phase with project
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // Create expense
      const expense = await ctx.prisma.expense.create({
        data: {
          tenantId: ctx.orgId,
          phaseId: input.phaseId,
          projectId: phase.projectId,
          amount: input.amount,
          category: input.category,
          description: input.description,
          date: input.date,
          receiptUrl: input.receiptUrl,
        },
      })

      // Update budgetSpent for phase
      const updatedPhase = await ctx.prisma.pipelinePhase.update({
        where: { id: input.phaseId },
        data: {
          budgetSpent: {
            increment: input.amount,
          },
        },
      })

      // Update budgetSpent for project
      const updatedProject = await ctx.prisma.pipelineProject.update({
        where: { id: phase.projectId },
        data: {
          budgetSpent: {
            increment: input.amount,
          },
        },
      })

      // Check for budget alerts
      const alerts = await ctx.prisma.budgetAlert.findMany({
        where: {
          projectId: phase.projectId,
          enabled: true,
        },
      })

      for (const alert of alerts) {
        const budgetTotal = Number(updatedProject.budgetTotal)
        const budgetSpent = Number(updatedProject.budgetSpent)

        if (shouldTriggerAlert(budgetTotal, budgetSpent, alert.threshold, alert.lastTriggeredAt)) {
          // Send alert email
          await sendBudgetAlertEmail({
            projectName: updatedProject.name,
            projectId: updatedProject.id,
            budgetTotal,
            budgetSpent,
            budgetRemaining: budgetTotal - budgetSpent,
            percentage: (budgetSpent / budgetTotal) * 100,
            threshold: alert.threshold,
            recipientEmails: alert.emailRecipients,
          })

          // Update lastTriggeredAt
          await ctx.prisma.budgetAlert.update({
            where: { id: alert.id },
            data: { lastTriggeredAt: new Date() },
          })
        }
      }

      return expense
    }),

  // Update expense
  update: orgProcedure
    .input(updateExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // Get existing expense
      const existing = await ctx.prisma.expense.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          phase: true,
        },
      })

      if (!existing) {
        throw new Error('Expense not found')
      }

      // If amount changed, adjust budgetSpent
      if (input.data.amount !== undefined && input.data.amount !== Number(existing.amount)) {
        const amountDiff = input.data.amount - Number(existing.amount)

        await ctx.prisma.pipelinePhase.update({
          where: { id: existing.phaseId },
          data: {
            budgetSpent: {
              increment: amountDiff,
            },
          },
        })

        await ctx.prisma.pipelineProject.update({
          where: { id: existing.projectId },
          data: {
            budgetSpent: {
              increment: amountDiff,
            },
          },
        })
      }

      // Update expense
      const expense = await ctx.prisma.expense.update({
        where: { id: input.id },
        data: input.data,
      })

      return expense
    }),

  // Delete expense
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get expense to adjust budgets
      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!expense) {
        throw new Error('Expense not found')
      }

      // Decrement budgetSpent
      await ctx.prisma.pipelinePhase.update({
        where: { id: expense.phaseId },
        data: {
          budgetSpent: {
            decrement: Number(expense.amount),
          },
        },
      })

      await ctx.prisma.pipelineProject.update({
        where: { id: expense.projectId },
        data: {
          budgetSpent: {
            decrement: Number(expense.amount),
          },
        },
      })

      // Delete expense
      await ctx.prisma.expense.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get expense summary for a phase
  getSummary: orgProcedure
    .input(z.object({ phaseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const expenses = await ctx.prisma.expense.findMany({
        where: {
          phaseId: input.phaseId,
          tenantId: ctx.orgId,
        },
      })

      const totalByCategory = expenses.reduce((acc: Record<string, number>, expense: any) => {
        const category = expense.category
        const amount = Number(expense.amount)
        acc[category] = (acc[category] || 0) + amount
        return acc
      }, {} as Record<string, number>)

      return {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0),
        byCategory: totalByCategory,
      }
    }),
})
