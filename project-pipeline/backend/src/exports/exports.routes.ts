import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { fetchProjectReportData } from './report.service.js'
import { generatePDFReport } from './pdf-export.service.js'
import { generateExcelReport } from './excel-export.service.js'
import { generateWordReport } from './word-export.service.js'

const exportRequestSchema = z.object({
  format: z.enum(['pdf', 'excel', 'word'])
})

export async function registerExportRoutes(app: FastifyInstance) {
  // POST /projects/:id/export - Generate and download report
  app.post('/projects/:id/export', {
    onRequest: [app.authenticate]
  }, async (
    request: FastifyRequest<{
      Params: { id: string }
      Body: { format: 'pdf' | 'excel' | 'word' }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = (request.user as any).userId
      const { id } = request.params
      const { format } = exportRequestSchema.parse(request.body)

      // Fetch project data
      const project = await fetchProjectReportData(userId, id)

      // Generate report based on format
      let result
      switch (format) {
        case 'pdf':
          result = await generatePDFReport(project)
          break
        case 'excel':
          result = await generateExcelReport(project)
          break
        case 'word':
          result = await generateWordReport(project)
          break
        default:
          return reply.code(400).send({ error: 'Invalid format' })
      }

      // Send file download response
      return reply
        .header('Content-Type', result.mimeType)
        .header('Content-Disposition', `attachment; filename="${result.filename}"`)
        .send(result.buffer)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      if (error instanceof Error && error.message === 'Project not found') {
        return reply.code(404).send({ error: 'Project not found' })
      }
      throw error
    }
  })
}
