import { router } from '../../trpc'
import { pipelineProjectsRouter } from './projects'
import { pipelinePhasesRouter } from './phases'
import { pipelineVendorsRouter } from './vendors'
import { pipelineCommunicationsRouter } from './communications'
import { pipelineQuotesRouter } from './quotes'
import { calculatorRouter } from './calculator'

export const pipelineRouter = router({
  projects: pipelineProjectsRouter,
  phases: pipelinePhasesRouter,
  vendors: pipelineVendorsRouter,
  communications: pipelineCommunicationsRouter,
  quotes: pipelineQuotesRouter,
  calculator: calculatorRouter,
})
