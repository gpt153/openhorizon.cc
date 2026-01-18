import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import { extractProjectDNA } from '@/lib/ai/chains/project-dna-extraction'
import { generateProjectConcept } from '@/lib/ai/chains/project-concept-generation'
import { retrieveSimilarProjects } from '@/lib/ai/chains/retrieve-similar-projects'
import type { UserIdeaInputs } from '@/lib/types/project'
import { InngestMetrics } from '@/lib/monitoring/inngest-metrics'
import { BusinessMetrics } from '@/lib/monitoring/business-metrics'

/**
 * Generate Project from Idea - Background Job
 *
 * This Inngest function runs in the background to process AI generation.
 * Each step is retryable and tracks progress.
 */

export const generateProjectFromIdea = inngest.createFunction(
  {
    id: 'project.generate-from-idea',
    name: 'Generate Project from Idea',
  },
  { event: 'project.generate-from-idea' },
  async ({ event, step }) => {
    const startTime = Date.now()
    const functionId = 'project.generate-from-idea'
    const { sessionId, tenantId, userId } = event.data

    // Record job start
    InngestMetrics.recordJobStart(functionId)

    try {

    // Step 1: Load session
    const session = await step.run('load-session', async () => {
      const session = await prisma.projectGenerationSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        throw new Error(`Session ${sessionId} not found`)
      }

      return session
    })

    const userInputs = session.sessionData as UserIdeaInputs

    // Step 2: Extract Project DNA
    const projectDna = await step.run('extract-dna', async () => {
      console.log('Extracting Project DNA from user inputs...')
      return await extractProjectDNA(userInputs)
    })

    // Step 3: Retrieve similar projects (RAG)
    const similarProjects = await step.run('retrieve-similar', async () => {
      console.log('Retrieving similar projects...')
      return await retrieveSimilarProjects(projectDna)
    })

    // Step 4: Generate concept
    const concept = await step.run('generate-concept', async () => {
      console.log('Generating project concept...')
      return await generateProjectConcept(projectDna, similarProjects)
    })

    // Step 5: Save project to database
    const project = await step.run('save-project', async () => {
      console.log('Saving project to database...')
      return await prisma.project.create({
        data: {
          tenantId,
          createdByUserId: userId,

          // Core fields
          title: concept.title,
          tagline: concept.tagline,
          status: 'CONCEPT',

          // Project DNA
          projectDna: projectDna as any, // Prisma Json type

          // Generated content (working mode)
          objectives: concept.objectives as any,
          targetGroupDescription: concept.targetGroupDescription,
          activityOutline: concept.activityOutline as any,
          learningOutcomes: concept.learningOutcomes as any,
          inclusionPlanOverview: concept.inclusionPlanOverview,
          partnerProfile: concept.partnerProfile,
          estimatedBudgetRange: concept.estimatedBudgetRange as any,
          sustainabilityNarrative: concept.sustainabilityNarrative,
          impactNarrative: concept.impactNarrative,

          // Generated content (formal mode)
          targetGroupDescriptionFormal: concept.targetGroupDescriptionFormal,
          inclusionPlanOverviewFormal: concept.inclusionPlanOverviewFormal,
          partnerProfileFormal: concept.partnerProfileFormal,
          sustainabilityNarrativeFormal: concept.sustainabilityNarrativeFormal,
          impactNarrativeFormal: concept.impactNarrativeFormal,

          // Erasmus+ metadata
          erasmusAction: 'KA1-Youth-Exchange',
          durationDays: projectDna.duration_preference,
          participantCount: projectDna.target_group.size,
        },
      })
    })

    // Step 6: Update session status
    await step.run('update-session', async () => {
      console.log('Updating session status to COMPLETED...')
      return await prisma.projectGenerationSession.update({
        where: { id: sessionId },
        data: {
          projectId: project.id,
          generationStatus: 'COMPLETED',
        },
      })
    })

      console.log(`✅ Project generated successfully: ${project.id}`)

      // Record business metric: project created
      BusinessMetrics.recordProjectCreated(tenantId)

      // Record job success
      const duration = Date.now() - startTime
      InngestMetrics.recordJobSuccess(functionId, duration)

      return { projectId: project.id }
    } catch (error) {
      // Record job failure
      const duration = Date.now() - startTime
      InngestMetrics.recordJobFailure(functionId, error, duration)
      throw error
    }
  }
)
