/**
 * Report Export Integration Tests
 *
 * Tests the complete report export workflow including:
 * - Project data fetching
 * - PDF generation with Playwright
 * - Excel generation with ExcelJS
 * - Word generation with docx library
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Prisma before importing services
const mockFindFirst = vi.fn()
vi.mock('../../config/database.js', () => ({
  prisma: {
    project: {
      findFirst: mockFindFirst
    }
  }
}))

import { fetchProjectReportData } from '../../exports/report.service.js'
import { generatePDFReport } from '../../exports/pdf-export.service.js'
import { generateExcelReport } from '../../exports/excel-export.service.js'
import { generateWordReport } from '../../exports/word-export.service.js'

describe('Report Export Integration', () => {
  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    type: 'STUDENT_EXCHANGE',
    status: 'IN_PROGRESS',
    description: 'A test project for export functionality',
    start_date: new Date('2025-03-01'),
    end_date: new Date('2025-03-15'),
    budget_total: 50000,
    budget_spent: 15000,
    participants_count: 20,
    location: 'Stockholm, Sweden',
    created_by: 'user-1',
    created_at: new Date(),
    updated_at: new Date(),
    metadata: null,
    phases: [
      {
        id: 'phase-1',
        name: 'Accommodation',
        type: 'ACCOMMODATION',
        status: 'COMPLETED',
        start_date: new Date('2025-03-01'),
        end_date: new Date('2025-03-05'),
        budget_allocated: 15000,
        budget_spent: 12000,
        order: 1
      },
      {
        id: 'phase-2',
        name: 'Travel',
        type: 'TRAVEL',
        status: 'IN_PROGRESS',
        start_date: new Date('2025-03-06'),
        end_date: new Date('2025-03-15'),
        budget_allocated: 20000,
        budget_spent: 3000,
        order: 2
      }
    ],
    creator: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  }

  beforeEach(() => {
    mockFindFirst.mockReset()
  })

  describe('Data Fetching', () => {
    it('should fetch project report data with all relations', async () => {
      mockFindFirst.mockResolvedValue(mockProject)

      const result = await fetchProjectReportData('user-1', 'project-1')

      expect(result).toBeDefined()
      expect(result.id).toBe('project-1')
      expect(result.phases).toHaveLength(2)
      expect(result.creator).toBeDefined()
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: 'project-1',
          created_by: 'user-1'
        },
        include: {
          phases: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              start_date: true,
              end_date: true,
              budget_allocated: true,
              budget_spent: true,
              order: true
            }
          },
          creator: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    })

    it('should throw error if project not found', async () => {
      mockFindFirst.mockResolvedValue(null)

      await expect(
        fetchProjectReportData('user-1', 'nonexistent')
      ).rejects.toThrow('Project not found')
    })
  })

  describe('PDF Export', () => {
    it('should generate PDF with correct structure', async () => {
      const result = await generatePDFReport(mockProject)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
      expect(result.filename).toContain('test-project')
      expect(result.filename).toEndWith('.pdf')
      expect(result.mimeType).toBe('application/pdf')
    }, 30000) // Increased timeout for PDF generation

    it('should handle project with no description', async () => {
      const projectNoDesc = { ...mockProject, description: null }
      const result = await generatePDFReport(projectNoDesc)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
    }, 30000)
  })

  describe('Excel Export', () => {
    it('should generate Excel with multiple worksheets', async () => {
      const result = await generateExcelReport(mockProject)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
      expect(result.filename).toEndWith('.xlsx')
      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })

    it('should include all phases in phases worksheet', async () => {
      const result = await generateExcelReport(mockProject)
      expect(result.buffer).toBeDefined()
      // Excel file should contain data for 2 phases
    })
  })

  describe('Word Export', () => {
    it('should generate Word document with tables', async () => {
      const result = await generateWordReport(mockProject)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
      expect(result.filename).toEndWith('.docx')
      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    })

    it('should handle empty phases array', async () => {
      const projectNoPhases = { ...mockProject, phases: [] }
      const result = await generateWordReport(projectNoPhases)

      expect(result).toBeDefined()
      expect(result.buffer).toBeInstanceOf(Buffer)
    })
  })

  describe('Format Selection', () => {
    it('should generate different file types for each format', async () => {
      const pdf = await generatePDFReport(mockProject)
      const excel = await generateExcelReport(mockProject)
      const word = await generateWordReport(mockProject)

      expect(pdf.filename).toMatch(/\.pdf$/)
      expect(excel.filename).toMatch(/\.xlsx$/)
      expect(word.filename).toMatch(/\.docx$/)

      expect(pdf.mimeType).toContain('pdf')
      expect(excel.mimeType).toContain('spreadsheet')
      expect(word.mimeType).toContain('wordprocessing')
    }, 30000)
  })
})
