# Feature: Erasmus+ Application Form Generation System

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Implement a comprehensive application form generation system that creates finalized Erasmus+ application forms from project data. The system will support template-based form generation, dynamic data population from multiple sources (phases, budgets, participants), AI-powered narrative generation, multi-format exports (PDF, Word), form preview with editing capabilities, and version control for drafts and revisions.

## User Story

As a **Project Coordinator**
I want to **generate complete Erasmus+ application forms automatically from my project data**
So that **I can submit professional, compliant applications without manual data entry and ensure all required information is included**

## Problem Statement

Currently, Erasmus+ project coordinators must manually compile data from various sources (project phases, budgets, participant lists, activity descriptions) and transfer this information into application forms. This is time-consuming, error-prone, and creates inconsistencies between project planning data and the final application. There's no automated way to:

1. Aggregate data from multiple project phases into a cohesive application
2. Generate AI-powered narratives that synthesize project information
3. Export professional forms in required formats (PDF/Word)
4. Preview and edit forms before finalization
5. Track multiple versions and revisions

## Solution Statement

Build an application form generation system integrated with the project-pipeline backend that:

1. **Template System**: Defines Erasmus+ form structures with field mappings to project data
2. **Data Aggregation Service**: Pulls data from phases, budgets, participants, and other project entities
3. **AI Narrative Generator**: Uses LangChain + Anthropic to create coherent project descriptions and justifications
4. **Export Service**: Generates PDF and Word documents using Puppeteer (PDF) and docx (Word)
5. **Form Management**: Stores form data, supports editing, and tracks versions
6. **REST API**: Exposes endpoints for form generation, preview, editing, and export

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: Backend API, Database (Prisma), AI Services, Document Generation
**Dependencies**:
- `puppeteer` (HTML to PDF) - already installed
- `docx` (Word document generation) - NEW
- `@langchain/anthropic` (AI narratives) - already installed
- `zod` (validation) - already installed

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/prisma/schema.prisma` (lines 79-121) - Phase model with APPLICATION type, PhaseType enum
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/prisma/schema.prisma` (lines 37-63) - Project model with metadata, budget, participants
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/app.ts` (lines 63-70) - Why: Route registration pattern to follow
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/phases/phases.routes.ts` (entire file) - Why: Reference for CRUD route patterns with authentication
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/seeds/seeds.routes.ts` - Why: Route structure with POST endpoints for generation
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/seeds/seeds.service.ts` (lines 266-325) - Why: Transaction pattern for complex multi-step operations
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/seeds/seeds.schemas.ts` - Why: Zod validation schema patterns
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/ai/agents/base-agent.ts` - Why: Base class for AI agent implementation
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/ai/agents/email-agent.ts` (lines 1-100) - Why: Structured AI output generation example
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/ai/chains/seed-generation.ts` - Why: LangChain structured output parser pattern
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/auth/middleware.ts` (lines 19-41) - Why: Authentication and authorization patterns
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/tests/setup.ts` (lines 104-242) - Why: Test setup, mocks, and fixtures
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/tests/integration/budget-tracking.test.ts` - Why: Integration test structure example
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/config/env.ts` (lines 6-39) - Why: Environment variable validation pattern
- `/worktrees/openhorizon.cc/issue-71/project-pipeline/backend/src/integrations/scrapers/hotel-scraper.ts` (lines 1-50) - Why: Puppeteer/Playwright browser automation pattern

### New Files to Create

- `project-pipeline/backend/prisma/migrations/XXX_add_application_forms/migration.sql` - Database migration for ApplicationForm model
- `project-pipeline/backend/src/application-forms/application-forms.types.ts` - TypeScript interfaces for form data structures
- `project-pipeline/backend/src/application-forms/application-forms.schemas.ts` - Zod validation schemas for API requests/responses
- `project-pipeline/backend/src/application-forms/application-forms.service.ts` - Business logic for form generation, data aggregation, versioning
- `project-pipeline/backend/src/application-forms/application-forms.routes.ts` - REST API endpoints
- `project-pipeline/backend/src/application-forms/templates/erasmus-ka1-template.ts` - KA1 form template definition
- `project-pipeline/backend/src/application-forms/templates/erasmus-ka2-template.ts` - KA2 form template definition
- `project-pipeline/backend/src/application-forms/templates/template-engine.ts` - Template rendering engine
- `project-pipeline/backend/src/application-forms/export/pdf-exporter.ts` - PDF generation using Puppeteer
- `project-pipeline/backend/src/application-forms/export/docx-exporter.ts` - Word document generation using docx library
- `project-pipeline/backend/src/application-forms/export/html-renderer.ts` - HTML template renderer for forms
- `project-pipeline/backend/src/ai/agents/form-narrative-agent.ts` - AI agent for generating form narratives
- `project-pipeline/backend/src/tests/integration/application-forms.test.ts` - Integration tests for form generation
- `project-pipeline/backend/src/tests/integration/application-forms-export.test.ts` - Export functionality tests

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

**PDF Generation:**
- [Puppeteer HTML to PDF - RisingStack](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/)
  - Section: PDF generation from HTML with Node.js
  - Why: Already have Puppeteer installed, shows best practices for HTML-to-PDF conversion
- [Top PDF Generation Libraries - LogRocket](https://blog.logrocket.com/best-html-pdf-libraries-node-js/)
  - Section: Puppeteer vs PDFKit comparison
  - Why: Helps validate using Puppeteer (already installed) vs adding new dependency

**Word Document Generation:**
- [docx - Official Documentation](https://docx.js.org/)
  - Section: Getting started, Document structure, Paragraphs, Tables
  - Why: Primary library for .docx generation, TypeScript-first with declarative API
- [docx - GitHub Repository](https://github.com/dolanmiu/docx)
  - Section: Examples folder, TypeScript usage
  - Why: Code examples for sections, tables, headers, footers

**LangChain Structured Output:**
- [LangChain Core Output Parsers](https://js.langchain.com/docs/modules/model_io/output_parsers/)
  - Section: StructuredOutputParser with Zod
  - Why: Pattern for AI-generated structured data (already used in seed-generation.ts)

**Erasmus+ Forms:**
- [Erasmus+ Programme Guide 2024-2027](https://erasmus-plus.ec.europa.eu/programme-guide/erasmusplus-programme-guide)
  - Section: Application forms, KA1/KA2 requirements
  - Why: Official form structure and required fields

### Patterns to Follow

**Naming Conventions:**
```typescript
// Files: kebab-case
// application-forms.service.ts, form-narrative-agent.ts

// Classes: PascalCase
class FormNarrativeAgent extends BaseAgent { }

// Functions/Variables: camelCase
async function generateApplicationForm() { }
const formData = { ... }

// Types/Interfaces: PascalCase
interface ApplicationFormData { }
type ExportFormat = 'pdf' | 'docx'

// Constants: UPPER_SNAKE_CASE
const DEFAULT_FORM_VERSION = 1
```

**Error Handling:**
```typescript
// From app.ts and existing services
try {
  const form = await generateForm(params)
  return reply.code(200).send(form)
} catch (error) {
  if (error instanceof z.ZodError) {
    return reply.code(400).send({ error: 'Validation failed', details: error.errors })
  }
  if (error.message.includes('not found')) {
    return reply.code(404).send({ error: 'Phase not found' })
  }
  console.error('[ApplicationForms] Generation failed:', error)
  throw new Error('Failed to generate application form')
}
```

**Service Pattern:**
```typescript
// From seeds.service.ts - Pure async functions with userId authorization
export async function generateApplicationForm(
  phaseId: string,
  userId: string,
  options: GenerateFormOptions
): Promise<ApplicationFormData> {
  // 1. Authorization check
  const phase = await prisma.phase.findFirst({
    where: { id: phaseId, project: { /* check user access */ } },
    include: { project: true }
  })
  if (!phase) throw new Error('Phase not found or access denied')

  // 2. Business logic
  const formData = await aggregateProjectData(phase.project_id)

  // 3. Transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    // Create form and related records
  })
}
```

**Route Pattern:**
```typescript
// From phases.routes.ts and seeds.routes.ts
export async function registerApplicationFormRoutes(app: FastifyInstance) {
  // GET /application-forms - List forms (with auth)
  app.get('/application-forms', {
    onRequest: [app.authenticate],
    schema: {
      querystring: ListFormsQuerySchema,
      response: { 200: ListFormsResponseSchema }
    }
  }, async (request, reply) => {
    const { projectId } = request.query
    const forms = await listApplicationForms(request.user.userId, projectId)
    return reply.send(forms)
  })

  // POST /phases/:phaseId/application-form/generate - Generate form
  app.post('/phases/:phaseId/application-form/generate', {
    onRequest: [app.authenticate, app.requireRole(['ADMIN', 'COORDINATOR'])],
    schema: {
      params: PhaseIdParamSchema,
      body: GenerateFormBodySchema,
      response: { 201: FormResponseSchema }
    }
  }, async (request, reply) => {
    const form = await generateApplicationForm(
      request.params.phaseId,
      request.user.userId,
      request.body
    )
    return reply.code(201).send(form)
  })
}
```

**AI Agent Pattern:**
```typescript
// From base-agent.ts and email-agent.ts
import { BaseAgent } from './base-agent'
import { StructuredOutputParser } from '@langchain/core/output_parsers'

export class FormNarrativeAgent extends BaseAgent {
  private parser = StructuredOutputParser.fromZodSchema(NarrativeOutputSchema)

  async generateNarrative(context: FormContext): Promise<FormNarrative> {
    const systemPrompt = `You are an expert in Erasmus+ applications...`
    const userMessage = `Generate narratives for: ${JSON.stringify(context)}\n\n${this.parser.getFormatInstructions()}`

    const response = await this.generateResponse(systemPrompt, userMessage)
    return this.parser.parse(response)
  }
}
```

**Logging Pattern:**
```typescript
// From existing codebase
console.log('[ApplicationForms] Generating form for phase:', phaseId)
console.warn('[ApplicationForms] Missing budget data, using defaults')
console.error('[ApplicationForms] Export failed:', error)
```

---

## IMPLEMENTATION PLAN

### Phase 1: Database Schema & Core Types

Establish the data foundation by creating the ApplicationForm model in Prisma, defining TypeScript interfaces for form data structures, and setting up Zod validation schemas.

**Tasks:**
- Extend Prisma schema with ApplicationForm model
- Define TypeScript types for form templates, data aggregation, and export formats
- Create Zod validation schemas for API requests

### Phase 2: Template System

Build the template engine that defines Erasmus+ form structures with field mappings to project data sources.

**Tasks:**
- Create template definitions for KA1 and KA2 forms
- Implement template rendering engine with dynamic field population
- Add template validation and field mapping logic

### Phase 3: Data Aggregation Service

Develop the core service layer that aggregates project data from multiple sources and prepares it for form population.

**Tasks:**
- Implement data aggregation from projects, phases, budgets, participants
- Calculate totals, summaries, and derived fields
- Validate data completeness and flag missing required fields

### Phase 4: AI Narrative Generation

Integrate AI-powered narrative generation using LangChain and Anthropic Claude to create coherent project descriptions.

**Tasks:**
- Create FormNarrativeAgent extending BaseAgent
- Define structured output schemas for narratives
- Implement context building from aggregated data

### Phase 5: Export Services

Build PDF and Word document export functionality using Puppeteer and docx library.

**Tasks:**
- Implement HTML renderer for form preview
- Create PDF exporter using Puppeteer
- Create Word exporter using docx library
- Add export format validation and error handling

### Phase 6: REST API Endpoints

Expose form generation, retrieval, editing, and export functionality through REST API.

**Tasks:**
- Create route handlers with authentication
- Implement CRUD operations for application forms
- Add export endpoints with format selection
- Register routes in main application

### Phase 7: Testing & Validation

Comprehensive testing of form generation, data aggregation, AI narratives, and export functionality.

**Tasks:**
- Write integration tests for form generation workflow
- Test export functionality for PDF and Word formats
- Add edge case tests for missing/incomplete data
- Validate AI narrative generation quality

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE prisma/migrations/XXX_add_application_forms/migration.sql

- **IMPLEMENT**: New ApplicationForm model with fields: id, phase_id, project_id, form_type (enum: KA1, KA2, CUSTOM), version, status (enum: DRAFT, FINALIZED), form_data (JSON), generated_narratives (JSON), created_by, created_at, updated_at, finalized_at
- **PATTERN**: Follow Phase model structure (schema.prisma:79-107) for relations and indexes
- **IMPORTS**: None (SQL migration)
- **GOTCHA**: Use CUID for IDs, add foreign keys with ON DELETE CASCADE, create indexes on phase_id, project_id, status
- **VALIDATE**: `cd project-pipeline/backend && npx prisma migrate dev --name add_application_forms`

### UPDATE prisma/schema.prisma

- **IMPLEMENT**: Add ApplicationForm model after Phase model (after line 107), add FormType enum (KA1, KA2, CUSTOM), add FormStatus enum (DRAFT, FINALIZED), add relation to Phase and Project models
- **PATTERN**: Mirror Phase model structure (lines 79-107) with proper relations and indexes
- **IMPORTS**: None
- **GOTCHA**: Add `forms ApplicationForm[]` to Phase model, add `application_forms ApplicationForm[]` to Project model
- **VALIDATE**: `cd project-pipeline/backend && npx prisma format && npx prisma validate`

### CREATE src/application-forms/application-forms.types.ts

- **IMPLEMENT**: TypeScript interfaces for FormTemplate, FormField, FormSection, FormContext, AggregatedProjectData, FormNarrative, ExportFormat ('pdf' | 'docx'), ApplicationFormData
- **PATTERN**: Follow seeds.types.ts structure with clear interface definitions
- **IMPORTS**: `import { Prisma } from '@prisma/client'`
- **GOTCHA**: Use Prisma-generated types where possible, define ExportFormat as const union type
- **VALIDATE**: `cd project-pipeline/backend && npx tsc --noEmit`

### CREATE src/application-forms/application-forms.schemas.ts

- **IMPLEMENT**: Zod schemas: PhaseIdParamSchema, GenerateFormBodySchema (formType, aiGenerated, includeNarratives), UpdateFormBodySchema (form_data partial updates), ExportFormBodySchema (format: pdf|docx), ListFormsQuerySchema (projectId, status), FormResponseSchema, ListFormsResponseSchema
- **PATTERN**: Mirror seeds.schemas.ts structure with input/output validation
- **IMPORTS**: `import { z } from 'zod'`
- **GOTCHA**: Use z.enum() for FormType and ExportFormat, make optional fields with .optional() or .default()
- **VALIDATE**: `cd project-pipeline/backend && npx tsc --noEmit`

### CREATE src/application-forms/templates/erasmus-ka1-template.ts

- **IMPLEMENT**: KA1 form template definition with sections (Project Info, Participants, Activities, Budget, Impact), field mappings to project data paths (e.g., 'project.name', 'project.participants_count'), validation rules for required fields
- **PATTERN**: Create structured object with nested sections and fields
- **IMPORTS**: `import { FormTemplate } from '../application-forms.types'`
- **GOTCHA**: Reference actual Prisma schema field names, mark required vs optional fields
- **VALIDATE**: `cd project-pipeline/backend && npx tsc --noEmit`

### CREATE src/application-forms/templates/erasmus-ka2-template.ts

- **IMPLEMENT**: KA2 form template (similar structure to KA1 but with partnership-specific sections: Partnership Info, Partner Organizations, Joint Activities, Co-financing)
- **PATTERN**: Mirror erasmus-ka1-template.ts structure
- **IMPORTS**: `import { FormTemplate } from '../application-forms.types'`
- **GOTCHA**: KA2 focuses on partnerships, adjust field mappings accordingly
- **VALIDATE**: `cd project-pipeline/backend && npx tsc --noEmit`

### CREATE src/application-forms/templates/template-engine.ts

- **IMPLEMENT**: Functions: getTemplate(formType: FormType): FormTemplate, renderTemplate(template: FormTemplate, data: AggregatedProjectData): object, validateFields(template: FormTemplate, data: object): { valid: boolean, missing: string[] }
- **PATTERN**: Pure functions that transform template + data → populated form
- **IMPORTS**: `import { FormTemplate, FormType, AggregatedProjectData } from '../application-forms.types'`, import KA1/KA2 templates
- **GOTCHA**: Use lodash _.get() or custom path accessor for nested field access (e.g., 'project.budget' from aggregated data)
- **VALIDATE**: `cd project-pipeline/backend && npm test src/tests/integration/application-forms.test.ts`

### CREATE src/application-forms/application-forms.service.ts

- **IMPLEMENT**: Core service functions:
  - `aggregateProjectData(projectId: string): Promise<AggregatedProjectData>` - Fetch project, phases (with budget totals), participants count, metadata
  - `generateApplicationForm(phaseId: string, userId: string, options: GenerateFormOptions): Promise<ApplicationFormData>` - Authorization check, aggregate data, render template, optionally generate narratives, create DB record in transaction
  - `getApplicationForm(formId: string, userId: string): Promise<ApplicationFormData>` - Retrieve with authorization
  - `updateApplicationForm(formId: string, userId: string, updates: Partial<FormData>): Promise<ApplicationFormData>` - Update form_data field
  - `listApplicationForms(userId: string, projectId?: string, status?: FormStatus): Promise<ApplicationFormData[]>` - List with filters
  - `finalizeForm(formId: string, userId: string): Promise<ApplicationFormData>` - Set status to FINALIZED, set finalized_at timestamp
- **PATTERN**: Follow seeds.service.ts structure (lines 266-325) with transactions for multi-step operations
- **IMPORTS**: `import { prisma } from '../config/database'`, `import { FormNarrativeAgent } from '../ai/agents/form-narrative-agent'`, `import { getTemplate, renderTemplate, validateFields } from './templates/template-engine'`, types and schemas
- **GOTCHA**: Check user access via phase.project relation, use Prisma include for full data fetching, wrap create+updates in $transaction
- **VALIDATE**: `cd project-pipeline/backend && npm test src/tests/integration/application-forms.test.ts`

### CREATE src/ai/agents/form-narrative-agent.ts

- **IMPLEMENT**: FormNarrativeAgent class extending BaseAgent with method `generateNarrative(context: FormContext): Promise<FormNarrative>`, use StructuredOutputParser with Zod schema for output validation, build system prompt: "You are an expert in Erasmus+ applications. Generate compelling narratives for project descriptions, objectives, impact, methodology.", pass project data as JSON context
- **PATTERN**: Follow email-agent.ts structure (lines 1-100) with BaseAgent extension
- **IMPORTS**: `import { BaseAgent } from './base-agent'`, `import { StructuredOutputParser } from '@langchain/core/output_parsers'`, `import { z } from 'zod'`, FormContext, FormNarrative types
- **GOTCHA**: Define Zod schema for narrative output (project_description, objectives, methodology, expected_impact), include format_instructions in user message
- **VALIDATE**: `cd project-pipeline/backend && npm test src/tests/integration/application-forms.test.ts`

### CREATE src/application-forms/export/html-renderer.ts

- **IMPLEMENT**: Function `renderFormAsHTML(formData: ApplicationFormData): string` - Generate HTML representation of form with CSS for print/PDF, include form header, sections, fields with labels and values, use template literals for HTML generation
- **PATTERN**: Create structured HTML with semantic elements (section, table, div) and inline CSS for styling
- **IMPORTS**: ApplicationFormData type
- **GOTCHA**: Use inline CSS since Puppeteer needs styles embedded, ensure proper escaping of user data in HTML
- **VALIDATE**: `cd project-pipeline/backend && npm test src/tests/integration/application-forms-export.test.ts`

### CREATE src/application-forms/export/pdf-exporter.ts

- **IMPLEMENT**: Function `exportFormAsPDF(formData: ApplicationFormData): Promise<Buffer>` - Use Puppeteer to launch browser, create page, set HTML content from html-renderer, generate PDF with options (format: 'A4', printBackground: true), return buffer
- **PATTERN**: Follow hotel-scraper.ts Playwright pattern (lines 1-50) but use Puppeteer (already imported in package.json)
- **IMPORTS**: `import puppeteer from 'puppeteer'`, `import { renderFormAsHTML } from './html-renderer'`, ApplicationFormData type
- **GOTCHA**: Use headless: true, close browser after PDF generation, handle errors gracefully, set viewport size for consistent rendering
- **VALIDATE**: `cd project-pipeline/backend && npm test src/tests/integration/application-forms-export.test.ts`

### CREATE src/application-forms/export/docx-exporter.ts

- **IMPLEMENT**: Function `exportFormAsDocx(formData: ApplicationFormData): Promise<Buffer>` - Use docx library to create Document with sections/paragraphs/tables, iterate form sections and fields, create Paragraph/Table elements, generate buffer with Packer.toBuffer()
- **PATTERN**: Programmatic document building using docx declarative API (see docx.js.org documentation)
- **IMPORTS**: `import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel } from 'docx'`, ApplicationFormData type
- **GOTCHA**: Install docx first: `npm install docx`, use HeadingLevel.HEADING_1 for sections, create tables for multi-column data, use await Packer.toBuffer(doc) to get final buffer
- **VALIDATE**: `cd project-pipeline/backend && npm install docx && npx tsc --noEmit`

### CREATE src/application-forms/application-forms.routes.ts

- **IMPLEMENT**: Export async function `registerApplicationFormRoutes(app: FastifyInstance)`, routes:
  - GET `/application-forms` - List forms (auth: COORDINATOR+, query: projectId?, status?)
  - POST `/phases/:phaseId/application-form/generate` - Generate form (auth: COORDINATOR+, body: GenerateFormBodySchema)
  - GET `/application-forms/:id` - Get form details (auth: any authenticated user)
  - PATCH `/application-forms/:id` - Update form (auth: COORDINATOR+, body: UpdateFormBodySchema)
  - POST `/application-forms/:id/finalize` - Finalize form (auth: COORDINATOR+)
  - POST `/application-forms/:id/export` - Export form (auth: any authenticated user, body: ExportFormBodySchema with format)
- **PATTERN**: Follow phases.routes.ts structure (entire file) with authentication, Zod validation, proper HTTP codes
- **IMPORTS**: `import { FastifyInstance } from 'fastify'`, service functions, schemas
- **GOTCHA**: Use `onRequest: [app.authenticate]` for auth, `app.requireRole(['ADMIN', 'COORDINATOR'])` for role checks, return appropriate status codes (200, 201, 400, 404, 500), for export endpoint set Content-Type header based on format and Content-Disposition for file download
- **VALIDATE**: `cd project-pipeline/backend && npx tsc --noEmit`

### UPDATE src/app.ts

- **IMPLEMENT**: Add import `import { registerApplicationFormRoutes } from './application-forms/application-forms.routes'`, add route registration after line 70: `await registerApplicationFormRoutes(app)`
- **PATTERN**: Mirror existing route registrations (lines 63-70)
- **IMPORTS**: None (add import at top of file)
- **GOTCHA**: ⚠️ **CRITICAL: Preserve import order for side-effect imports** - If reordering imports, use `// ruff: noqa: I001` comment (though this is TypeScript, same principle applies for maintaining import order)
- **VALIDATE**: `cd project-pipeline/backend && npx tsc --noEmit`

### UPDATE package.json

- **IMPLEMENT**: Add `docx` to dependencies if not already present (it's not in current package.json)
- **PATTERN**: Add to dependencies object with latest version
- **IMPORTS**: None
- **GOTCHA**: Run `npm install` after modifying package.json
- **VALIDATE**: `cd project-pipeline/backend && npm install && npm list docx`

### CREATE src/tests/integration/application-forms.test.ts

- **IMPLEMENT**: Integration tests using vitest:
  - `describe('Application Form Generation')` with tests:
    - `it('should generate KA1 form from phase data')`
    - `it('should aggregate project data correctly')`
    - `it('should generate AI narratives when requested')`
    - `it('should validate required fields')`
    - `it('should update form data')`
    - `it('should finalize form and set timestamp')`
  - Use `createMockPrismaClient()` from setup.ts, mock Phase/Project data with testData fixtures
- **PATTERN**: Follow budget-tracking.test.ts structure with describe blocks, beforeEach setup, expect assertions
- **IMPORTS**: `import { describe, it, expect, beforeEach, vi } from 'vitest'`, `import { createMockPrismaClient, testData } from '../setup'`, service functions
- **GOTCHA**: Test service layer functions directly (NOT route handlers), mock Prisma responses, test both success and error cases
- **VALIDATE**: `cd project-pipeline/backend && npm test src/tests/integration/application-forms.test.ts`

### CREATE src/tests/integration/application-forms-export.test.ts

- **IMPLEMENT**: Export functionality tests:
  - `describe('Form Export')` with tests:
    - `it('should render form as HTML')`
    - `it('should export form as PDF buffer')` - Mock Puppeteer
    - `it('should export form as DOCX buffer')` - Mock docx library
    - `it('should handle export errors gracefully')`
  - Mock Puppeteer and docx to avoid actual browser/file generation in tests
- **PATTERN**: Follow test setup pattern from setup.ts (lines 42-60) where Playwright is mocked
- **IMPORTS**: `import { describe, it, expect, beforeEach, vi } from 'vitest'`, export functions
- **GOTCHA**: Mock external libraries to avoid side effects, test that Buffer is returned, verify buffer size > 0
- **VALIDATE**: `cd project-pipeline/backend && npm test src/tests/integration/application-forms-export.test.ts`

---

## TESTING STRATEGY

Testing approach based on Vitest framework (already configured in project).

### Unit Tests

**Scope**: Pure functions in template-engine.ts, html-renderer.ts

- Test template retrieval for different form types
- Test field population with mock data
- Test field validation with missing/incomplete data
- Test HTML rendering with various form structures

**Pattern**: Import functions directly, pass mock data, assert output structure

### Integration Tests

**Scope**: Service layer functions, data aggregation, AI narrative generation, export workflows

- Test complete form generation flow from phaseId to ApplicationFormData
- Test data aggregation from multiple Prisma models (mocked)
- Test AI agent integration (mock LLM responses)
- Test export functions with mocked Puppeteer/docx
- Test authorization checks (user access to phases/projects)

**Pattern**: Use `createMockPrismaClient()` from setup.ts, mock external services (AI, browser), verify database calls

### Edge Cases

**Specific scenarios to test:**

1. **Missing Data**: Phase with no budget data - should use defaults or flag as incomplete
2. **Invalid Phase Type**: Attempt to generate form for non-APPLICATION phase - should error
3. **Unauthorized Access**: User tries to generate form for project they don't have access to - should return 404/403
4. **Concurrent Updates**: Multiple updates to same form - should handle with proper versioning
5. **Large Forms**: Forms with extensive data - should not timeout or exceed memory limits
6. **AI Service Unavailable**: LLM service fails - should gracefully skip narratives or retry
7. **Export Failures**: Puppeteer/docx throws error - should return meaningful error message

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Import Validation (CRITICAL)

**Verify all imports resolve before running tests:**

```bash
cd project-pipeline/backend && npx tsc --noEmit
```

**Expected:** No TypeScript errors, all imports resolve

**Why:** Catches incorrect package imports immediately. If this fails, fix imports before proceeding.

### Level 2: Database Schema

**Validate Prisma schema and generate client:**

```bash
cd project-pipeline/backend && npx prisma format && npx prisma validate && npx prisma generate
```

**Expected:** Schema is valid, Prisma client generated successfully

### Level 3: Install Dependencies

**Install new docx dependency:**

```bash
cd project-pipeline/backend && npm install
```

**Expected:** All packages installed, no vulnerabilities (or acceptable ones)

### Level 4: Run Database Migration

**Apply migration for ApplicationForm model:**

```bash
cd project-pipeline/backend && npx prisma migrate dev --name add_application_forms
```

**Expected:** Migration applied successfully, database schema updated

### Level 5: Unit Tests

**Run application form tests:**

```bash
cd project-pipeline/backend && npm test src/tests/integration/application-forms
```

**Expected:** All tests pass with no failures

### Level 6: Full Test Suite

**Run complete test suite to ensure no regressions:**

```bash
cd project-pipeline/backend && npm test
```

**Expected:** All existing tests still pass (no regressions)

### Level 7: Code Quality

**TypeScript type checking:**

```bash
cd project-pipeline/backend && npx tsc --noEmit
```

**Expected:** Zero TypeScript errors

### Level 8: Manual Validation

**Start development server and test API endpoints manually:**

```bash
# Start server
cd project-pipeline/backend && npm run dev
```

**Test with curl:**

```bash
# 1. Authenticate and get JWT token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}' | jq -r '.token')

# 2. Generate application form
curl -X POST http://localhost:3000/phases/{phaseId}/application-form/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"formType":"KA1","aiGenerated":true,"includeNarratives":true}'

# 3. List forms
curl http://localhost:3000/application-forms?projectId={projectId} \
  -H "Authorization: Bearer $TOKEN"

# 4. Export as PDF
curl -X POST http://localhost:3000/application-forms/{formId}/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"pdf"}' \
  --output form.pdf

# 5. Export as Word
curl -X POST http://localhost:3000/application-forms/{formId}/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"docx"}' \
  --output form.docx
```

**Expected:**
- Form generation returns 201 with form data
- List returns array of forms
- PDF export returns valid PDF file
- DOCX export returns valid Word document

---

## ACCEPTANCE CRITERIA

- [x] Feature implements all specified functionality (template system, data aggregation, AI narratives, PDF/Word export, versioning)
- [x] All validation commands pass with zero errors
- [x] Unit test coverage meets requirements (80%+)
- [x] Integration tests verify end-to-end workflows (generate → edit → finalize → export)
- [x] Code follows project conventions and patterns (service layer, Zod validation, Fastify routes, authentication)
- [x] No regressions in existing functionality (full test suite passes)
- [x] Documentation is updated (API endpoints documented, schema comments added)
- [x] Performance meets requirements (form generation < 5s, export < 10s)
- [x] Security considerations addressed (authorization checks, user data access control, input validation)
- [x] AI narratives are coherent and relevant (manual review of generated text)
- [x] Exported documents are properly formatted and readable (manual review of PDF/Word files)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works (curl tests successful, files open correctly)
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability
- [ ] Database migration applied without issues
- [ ] New dependency (docx) installed and working
- [ ] AI agent generates quality narratives (tested with real data)
- [ ] PDF exports are properly formatted (tested with real browser)
- [ ] Word documents are readable in MS Word/LibreOffice (tested with real files)

---

## NOTES

### Design Decisions

**1. Template-Based Approach**: Using programmatic templates (KA1/KA2 TypeScript objects) rather than external template files (e.g., .docx templates) for flexibility and version control. This allows easier customization and validation.

**2. Puppeteer for PDF**: Already installed, mature library, supports full CSS/HTML rendering. Alternative (PDFKit) would require more manual layout code.

**3. docx Library for Word**: Chosen over docxtemplater because we're generating from scratch (not populating existing templates). Provides full programmatic control with TypeScript support.

**4. AI Narratives Optional**: `aiGenerated` and `includeNarratives` flags allow users to skip AI generation if they prefer manual text or want faster generation.

**5. Version Control via Records**: Each form generation creates a new database record rather than updating in place. This provides audit trail and allows comparing versions.

**6. JSON Storage for Form Data**: Using Prisma `Json` type for `form_data` field allows flexible schema evolution without migrations. AI narratives also stored as JSON.

**7. Phase Association**: Forms are associated with APPLICATION type phases (already exists in PhaseType enum). This links forms to project planning workflow.

### Trade-offs

**Performance vs Quality**: AI narrative generation adds 2-5 seconds to form generation but provides significant value. Made optional to allow faster generation when needed.

**Storage vs Flexibility**: Storing complete form data in JSON increases database size but enables full versioning and editing without schema changes.

**Browser Dependency**: Puppeteer requires Chrome/Chromium installation (~170MB). Alternative (PDFKit) would reduce dependencies but require more complex layout code. Chosen Puppeteer because it's already a project dependency (for hotel scraper).

**Synchronous Export**: Export endpoints generate files synchronously. For very large forms, consider async job queue (e.g., with existing websocket infrastructure for progress updates). Current implementation acceptable for expected form sizes (<100 pages).

### Future Enhancements

1. **Multi-language Support**: Add `language` field to forms, translate templates and narratives
2. **Custom Templates**: Allow users to define custom form templates beyond KA1/KA2
3. **Collaborative Editing**: Real-time collaboration via WebSockets (already available in codebase)
4. **PDF Form Filling**: Generate fillable PDF forms using pdf-lib
5. **Email Integration**: Send generated forms via email using existing email.service.ts
6. **Template Versioning**: Track template versions separately for compliance with changing Erasmus+ requirements
7. **Batch Export**: Export multiple forms at once as ZIP archive
8. **Form Analytics**: Track which sections are most often edited, flag commonly incomplete fields

### External Resources

**Erasmus+ Programme Guide**: https://erasmus-plus.ec.europa.eu/programme-guide/erasmusplus-programme-guide
- Official source for application requirements
- Form field specifications
- Validation criteria

**PDF Generation Research**:
- [Best HTML to PDF libraries for Node.js - LogRocket](https://blog.logrocket.com/best-html-pdf-libraries-node-js/)
- [Puppeteer HTML to PDF - RisingStack](https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/)
- [Top PDF Generation Libraries - PDFBolt](https://pdfbolt.com/blog/top-nodejs-pdf-generation-libraries)

**Word Generation Research**:
- [docx - Official Documentation](https://docx.js.org/)
- [docx - GitHub Repository](https://github.com/dolanmiu/docx)
- [docx - NPM Package](https://www.npmjs.com/package/docx)

### Cost Considerations

**AI API Costs**: Each form generation with narratives costs approximately:
- Input tokens: ~2,000 (project data context)
- Output tokens: ~1,000 (narrative sections)
- Cost: ~$0.01-0.02 per form at Anthropic Claude rates

**Storage Costs**: Each form record with JSON data: ~10-50KB
- 1,000 forms ≈ 10-50MB storage (negligible)

**Compute Costs**: PDF/Word generation is CPU-intensive but fast (<1s per export)
- No significant impact on backend performance for expected usage (dozens per day)
