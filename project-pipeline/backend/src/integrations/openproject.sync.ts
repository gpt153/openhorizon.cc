import { prisma } from '../config/database.js'
import { openProjectClient } from './openproject.client.js'

export interface SyncResult {
  success: boolean
  projectId?: string
  openProjectId?: string
  workPackagesCreated?: number
  budgetSynced?: boolean
  error?: string
}

export class OpenProjectSync {
  async syncProjectToOpenProject(projectId: string): Promise<SyncResult> {
    if (!openProjectClient.isConfigured()) {
      return {
        success: false,
        error: 'OpenProject not configured'
      }
    }

    try {
      // Fetch project with all phases
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          phases: {
            orderBy: { order: 'asc' }
          }
        }
      })

      if (!project) {
        return {
          success: false,
          error: 'Project not found'
        }
      }

      // Create or find OpenProject project
      const identifier = `pipeline-${projectId.substring(0, 8)}`

      let opProject
      try {
        opProject = await openProjectClient.createProject({
          name: project.name,
          identifier,
          description: project.description || ''
        })
      } catch (error: any) {
        // Project might already exist
        if (error.response?.status === 422) {
          const projects = await openProjectClient.getProjects()
          opProject = projects.find((p: any) => p.identifier === identifier)
        } else {
          throw error
        }
      }

      if (!opProject) {
        return {
          success: false,
          error: 'Failed to create or find OpenProject project'
        }
      }

      // Create work packages for each phase
      let workPackagesCreated = 0
      for (const phase of project.phases) {
        try {
          await openProjectClient.createWorkPackage(opProject.id, {
            subject: phase.name,
            description: `Phase: ${phase.type}\nStatus: ${phase.status}`,
            startDate: phase.start_date.toISOString().split('T')[0],
            dueDate: phase.end_date.toISOString().split('T')[0],
            customFields: {
              budget: phase.budget_allocated.toString(),
              phaseType: phase.type
            }
          })
          workPackagesCreated++
        } catch (error) {
          console.error(`Failed to create work package for phase ${phase.id}:`, error)
        }
      }

      // Create budget
      let budgetSynced = false
      try {
        await openProjectClient.createBudget(opProject.id, {
          subject: `${project.name} Budget`,
          amount: Number(project.budget_total),
          description: `Total budget for ${project.name}`
        })
        budgetSynced = true
      } catch (error) {
        console.error('Failed to create budget:', error)
      }

      // Store OpenProject ID in metadata
      await prisma.project.update({
        where: { id: projectId },
        data: {
          metadata: {
            ...((project.metadata as any) || {}),
            openproject_id: opProject.id,
            openproject_identifier: identifier,
            last_synced: new Date().toISOString()
          }
        }
      })

      return {
        success: true,
        projectId,
        openProjectId: opProject.id,
        workPackagesCreated,
        budgetSynced
      }
    } catch (error: any) {
      console.error('Sync error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error during sync'
      }
    }
  }

  async syncBudgetToOpenProject(projectId: string): Promise<boolean> {
    if (!openProjectClient.isConfigured()) {
      return false
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { phases: true }
      })

      if (!project || !project.metadata) {
        return false
      }

      const metadata = project.metadata as any
      const openProjectId = metadata.openproject_id

      if (!openProjectId) {
        return false
      }

      // Update budget amount
      const totalBudget = Number(project.budget_total)
      const totalSpent = Number(project.budget_spent)

      // This would update the budget if we had the budget ID
      // For now, we'll just log it
      console.log(`Budget sync: ${totalSpent} / ${totalBudget}`)

      return true
    } catch (error) {
      console.error('Budget sync error:', error)
      return false
    }
  }

  async syncPhaseToWorkPackage(phaseId: string): Promise<boolean> {
    if (!openProjectClient.isConfigured()) {
      return false
    }

    try {
      const phase = await prisma.phase.findUnique({
        where: { id: phaseId },
        include: { project: true }
      })

      if (!phase || !phase.project.metadata) {
        return false
      }

      const metadata = phase.project.metadata as any
      const openProjectId = metadata.openproject_id

      if (!openProjectId) {
        return false
      }

      // Get work packages and find the matching one
      const workPackages = await openProjectClient.getWorkPackages(openProjectId)
      const matchingWP = workPackages.find((wp: any) =>
        wp.subject === phase.name || wp.customField?.phaseType === phase.type
      )

      if (matchingWP) {
        // Update work package
        await openProjectClient.updateWorkPackage(matchingWP.id, {
          startDate: phase.start_date.toISOString().split('T')[0],
          dueDate: phase.end_date.toISOString().split('T')[0],
          percentageDone: phase.status === 'COMPLETED' ? 100 :
                         phase.status === 'IN_PROGRESS' ? 50 : 0
        })
      }

      return true
    } catch (error) {
      console.error('Phase sync error:', error)
      return false
    }
  }
}

export const openProjectSync = new OpenProjectSync()
