import { prisma } from '../config/database.js'
import type { ReportProject } from './types.js'

export async function fetchProjectReportData(
  userId: string,
  projectId: string
): Promise<ReportProject> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      created_by: userId
    },
    include: {
      phases: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          start_date: true,
          end_date: true,
          budget_allocated: true,
          budget_spent: true,
          order: true
        }
      },
      creator: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  return project as ReportProject
}
