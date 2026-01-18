import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { generateBudgetCSV } from '@/lib/budget/export'

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get project ID from search params
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return new NextResponse('Project ID required', { status: 400 })
    }

    // Verify project access
    const project = await prisma.pipelineProject.findFirst({
      where: { id: projectId },
      include: {
        phases: true,
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Generate phase map
    const phasesMap = project.phases.reduce(
      (acc: Record<string, { name: string; type: string }>, phase: any) => {
        acc[phase.id] = { name: phase.name, type: phase.type }
        return acc
      },
      {} as Record<string, { name: string; type: string }>
    )

    // Generate CSV
    const csv = generateBudgetCSV(project.expenses, phasesMap)

    // Return CSV file
    const filename = `budget-${project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Budget export error:', error)
    return new NextResponse('Export failed', { status: 500 })
  }
}
