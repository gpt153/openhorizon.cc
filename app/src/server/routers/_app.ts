import { router } from '../trpc'
import { projectsRouter } from './projects'
import { programmesRouter } from './programmes'

export const appRouter = router({
  projects: projectsRouter,
  programmes: programmesRouter,
})

export type AppRouter = typeof appRouter
