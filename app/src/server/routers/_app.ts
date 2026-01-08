import { router } from '../trpc'
import { projectsRouter } from './projects'
import { programmesRouter } from './programmes'
import { brainstormRouter } from './brainstorm'
import { pipelineRouter } from './pipeline/_app'

export const appRouter = router({
  projects: projectsRouter,
  programmes: programmesRouter,
  brainstorm: brainstormRouter,
  pipeline: pipelineRouter,
})

export type AppRouter = typeof appRouter
