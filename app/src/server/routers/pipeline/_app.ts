import { router } from '../../trpc'
import { pipelineProjectsRouter } from './projects'
import { pipelinePhasesRouter } from './phases'
import { pipelineVendorsRouter } from './vendors'
import { pipelineCommunicationsRouter } from './communications'
import { pipelineQuotesRouter } from './quotes'
import { calculatorRouter } from './calculator'
import { expensesRouter } from './expenses'
import { alertsRouter } from './alerts'
import { budgetCalculatorRouter } from './budget-calculator'
import { searchJobsRouter } from './search-jobs'

export const pipelineRouter = router({
  projects: pipelineProjectsRouter,
  phases: pipelinePhasesRouter,
  vendors: pipelineVendorsRouter,
  communications: pipelineCommunicationsRouter,
  quotes: pipelineQuotesRouter,
  calculator: calculatorRouter,
  budgetCalculator: budgetCalculatorRouter,
  expenses: expensesRouter,
  alerts: alertsRouter,
  searchJobs: searchJobsRouter,
})
