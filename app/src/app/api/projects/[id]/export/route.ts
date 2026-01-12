import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { generateProjectPDF } from '@/lib/export/pdf-generator'
import { generateProjectExcel } from '@/lib/export/excel-generator'
import { generateProjectZIP } from '@/lib/export/zip-packager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get project ID from params
    const { id: projectId } = await params

    // Get export format from query params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'zip' // Default to ZIP

    // Validate format
    if (!['pdf', 'excel', 'zip'].includes(format)) {
      return new NextResponse('Invalid format. Use: pdf, excel, or zip', { status: 400 })
    }

    // Fetch project with all related data
    const project = await prisma.pipelineProject.findFirst({
      where: { id: projectId },
      include: {
        phases: {
          orderBy: { order: 'asc' },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Generate sanitized filename
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9-_]/g, '-')
    const timestamp = new Date().toISOString().split('T')[0]

    // Generate export based on format
    let buffer: Buffer
    let contentType: string
    let filename: string

    switch (format) {
      case 'pdf':
        buffer = await generateProjectPDF(project)
        contentType = 'application/pdf'
        filename = `${sanitizedName}-report-${timestamp}.pdf`
        break

      case 'excel':
        buffer = await generateProjectExcel(project)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `${sanitizedName}-budget-${timestamp}.xlsx`
        break

      case 'zip':
        buffer = await generateProjectZIP(project)
        contentType = 'application/zip'
        filename = `${sanitizedName}-complete-${timestamp}.zip`
        break

      default:
        return new NextResponse('Unsupported format', { status: 400 })
    }

    // Return file
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Project export error:', error)
    return new NextResponse(
      `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
}
