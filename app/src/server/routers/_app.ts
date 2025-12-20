import { router } from '../trpc'
import { projectsRouter } from './projects'
import { programmesRouter } from './programmes'
import { brainstormRouter } from './brainstorm'

export const appRouter = router({
  projects: projectsRouter,
  programmes: programmesRouter,
  brainstorm: brainstormRouter,
})

export type AppRouter = typeof appRouter
