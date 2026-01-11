'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, Table, FileSpreadsheet, Loader2 } from 'lucide-react'

interface ExportReportButtonProps {
  projectId: string
  projectName: string
}

type ExportFormat = 'pdf' | 'excel' | 'word'

export function ExportReportButton({ projectId, projectName }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    setSelectedFormat(format)

    try {
      // Call backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${projectId}/export`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication header if needed
            // 'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ format })
        }
      )

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get blob from response
      const blob = await response.blob()

      // Determine file extension
      const extension = format === 'excel' ? 'xlsx' : format === 'word' ? 'docx' : 'pdf'
      const filename = `${projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report.${extension}`

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsExporting(false)
      setSelectedFormat(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting && selectedFormat ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting {selectedFormat.toUpperCase()}...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <Table className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('word')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Word
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
