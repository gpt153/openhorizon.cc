import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  generateApplicationForm,
  getApplicationForm,
  updateApplicationForm,
  listApplicationForms,
  finalizeForm
} from './application-forms.service.js'
import { exportFormAsPDF } from './export/pdf-exporter.js'
import { exportFormAsDocx } from './export/docx-exporter.js'
import {
  PhaseIdParamSchema,
  FormIdParamSchema,
  GenerateFormBodySchema,
  UpdateFormBodySchema,
  ExportFormBodySchema,
  ListFormsQuerySchema
} from './application-forms.schemas.js'

/**
 * Register application form routes
 */
export async function registerApplicationFormRoutes(app: FastifyInstance) {
  // GET /application-forms - List forms
  app.get('/application-forms', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const query = ListFormsQuerySchema.parse(request.query)

      const forms = await listApplicationForms(
        userId,
        query.projectId,
        query.status
      )

      return reply.send({ forms })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      console.error('[ApplicationForms] List error:', error)
      return reply.code(500).send({ error: 'Failed to list forms' })
    }
  })

  // POST /phases/:phaseId/application-form/generate - Generate form
  app.post('/phases/:phaseId/application-form/generate', {
    onRequest: [app.authenticate, app.requireRole(['ADMIN', 'COORDINATOR'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const params = PhaseIdParamSchema.parse(request.params)
      const body = GenerateFormBodySchema.parse(request.body)

      const form = await generateApplicationForm(
        params.phaseId,
        userId,
        body
      )

      return reply.code(201).send({ form })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return reply.code(404).send({ error: error.message })
      }
      console.error('[ApplicationForms] Generate error:', error)
      return reply.code(500).send({ error: 'Failed to generate form' })
    }
  })

  // GET /application-forms/:id - Get form details
  app.get('/application-forms/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const params = FormIdParamSchema.parse(request.params)

      const form = await getApplicationForm(params.id, userId)

      return reply.send({ form })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return reply.code(404).send({ error: error.message })
      }
      console.error('[ApplicationForms] Get error:', error)
      return reply.code(500).send({ error: 'Failed to get form' })
    }
  })

  // PATCH /application-forms/:id - Update form
  app.patch('/application-forms/:id', {
    onRequest: [app.authenticate, app.requireRole(['ADMIN', 'COORDINATOR'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const params = FormIdParamSchema.parse(request.params)
      const body = UpdateFormBodySchema.parse(request.body)

      const form = await updateApplicationForm(params.id, userId, body)

      return reply.send({ form })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return reply.code(404).send({ error: error.message })
      }
      if (error.message.includes('finalized')) {
        return reply.code(400).send({ error: error.message })
      }
      console.error('[ApplicationForms] Update error:', error)
      return reply.code(500).send({ error: 'Failed to update form' })
    }
  })

  // POST /application-forms/:id/finalize - Finalize form
  app.post('/application-forms/:id/finalize', {
    onRequest: [app.authenticate, app.requireRole(['ADMIN', 'COORDINATOR'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const params = FormIdParamSchema.parse(request.params)

      const form = await finalizeForm(params.id, userId)

      return reply.send({ form })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return reply.code(404).send({ error: error.message })
      }
      if (error.message.includes('already finalized')) {
        return reply.code(400).send({ error: error.message })
      }
      console.error('[ApplicationForms] Finalize error:', error)
      return reply.code(500).send({ error: 'Failed to finalize form' })
    }
  })

  // POST /application-forms/:id/export - Export form
  app.post('/application-forms/:id/export', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const params = FormIdParamSchema.parse(request.params)
      const body = ExportFormBodySchema.parse(request.body)

      // Get form data
      const form = await getApplicationForm(params.id, userId)

      // Export based on format
      let buffer: Buffer
      let contentType: string
      let filename: string

      if (body.format === 'pdf') {
        buffer = await exportFormAsPDF(form)
        contentType = 'application/pdf'
        filename = `application-form-${form.id}.pdf`
      } else {
        buffer = await exportFormAsDocx(form)
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = `application-form-${form.id}.docx`
      }

      // Set headers for file download
      reply.header('Content-Type', contentType)
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      reply.header('Content-Length', buffer.length)

      return reply.send(buffer)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return reply.code(404).send({ error: error.message })
      }
      console.error('[ApplicationForms] Export error:', error)
      return reply.code(500).send({ error: 'Failed to export form' })
    }
  })
}
