import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'

export const pipelinePhasesRouter = router({
  // List phases for a project
  list: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Pipeline project not found')
      }

      const phases = await ctx.prisma.pipelinePhase.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          communications: true,
          quotes: {
            include: {
              vendor: true,
            },
          },
          aiConversations: true,
        },
        orderBy: {
          order: 'asc',
        },
      })

      return phases
    }),

  // Get a single phase by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.id,
        },
        include: {
          project: true,
          communications: true,
          quotes: {
            include: {
              vendor: true,
            },
          },
          aiConversations: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      return phase
    }),

  // Create new phase
  create: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        name: z.string().min(1),
        type: z.enum([
          'ACCOMMODATION',
          'TRAVEL',
          'FOOD',
          'ACTIVITIES',
          'INSURANCE',
          'EMERGENCY',
          'CUSTOM',
        ]),
        startDate: z.string(),
        endDate: z.string(),
        budgetAllocated: z.number(),
        order: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Pipeline project not found')
      }

      const phase = await ctx.prisma.pipelinePhase.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          type: input.type,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          budgetAllocated: input.budgetAllocated,
          order: input.order,
        },
      })

      return phase
    }),

  // Update phase
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().optional(),
          status: z
            .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'BLOCKED'])
            .optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          budgetAllocated: z.number().optional(),
          budgetSpent: z.number().optional(),
          order: z.number().int().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through project
      const existing = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.id,
        },
        include: {
          project: true,
        },
      })

      if (!existing || existing.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      const phase = await ctx.prisma.pipelinePhase.update({
        where: { id: input.id },
        data: {
          ...input.data,
          startDate: input.data.startDate ? new Date(input.data.startDate) : undefined,
          endDate: input.data.endDate ? new Date(input.data.endDate) : undefined,
        },
      })

      return phase
    }),

  // Delete phase
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through project
      const existing = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.id,
        },
        include: {
          project: true,
        },
      })

      if (!existing || existing.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      await ctx.prisma.pipelinePhase.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Create default phases for a project
  createDefaultPhases: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Pipeline project not found')
      }

      // Calculate budget split (rough allocation)
      const totalBudget = Number(project.budgetTotal)
      const defaultPhases = [
        {
          name: 'Accommodation',
          type: 'ACCOMMODATION' as const,
          budgetPercent: 0.4, // 40%
          order: 1,
        },
        {
          name: 'Travel',
          type: 'TRAVEL' as const,
          budgetPercent: 0.25, // 25%
          order: 2,
        },
        {
          name: 'Food & Catering',
          type: 'FOOD' as const,
          budgetPercent: 0.2, // 20%
          order: 3,
        },
        {
          name: 'Activities',
          type: 'ACTIVITIES' as const,
          budgetPercent: 0.1, // 10%
          order: 4,
        },
        {
          name: 'Insurance',
          type: 'INSURANCE' as const,
          budgetPercent: 0.03, // 3%
          order: 5,
        },
        {
          name: 'Emergency Planning',
          type: 'EMERGENCY' as const,
          budgetPercent: 0.02, // 2%
          order: 6,
        },
      ]

      // Calculate phase duration
      const startDate = new Date(project.startDate)
      const endDate = new Date(project.endDate)

      const phases = await Promise.all(
        defaultPhases.map((phaseTemplate) =>
          ctx.prisma.pipelinePhase.create({
            data: {
              projectId: input.projectId,
              name: phaseTemplate.name,
              type: phaseTemplate.type,
              startDate: startDate,
              endDate: endDate,
              budgetAllocated: totalBudget * phaseTemplate.budgetPercent,
              order: phaseTemplate.order,
            },
          })
        )
      )

      return phases
    }),

  // Chat with AI agent for a phase
  chat: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        userMessage: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get phase with project
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // Build agent context
      const agentContext = {
        project: {
          name: phase.project.name,
          location: phase.project.location,
          participantCount: phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      // Get appropriate agent
      const { getAgentForPhaseType } = await import('@/lib/ai/agents/registry')
      const agent = getAgentForPhaseType(phase.type)

      // Generate response
      let aiResponse: string
      try {
        aiResponse = await agent.generateResponse(
          `You are an AI assistant helping with ${phase.type.toLowerCase()} planning for Erasmus+ projects. Be helpful, specific, and practical.`,
          input.userMessage
        )
      } catch (error) {
        console.error('AI agent error:', error)
        aiResponse =
          "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists."
      }

      // Store conversation
      const conversation = await ctx.prisma.aIConversation.create({
        data: {
          projectId: phase.projectId,
          phaseId: input.phaseId,
          agentType: phase.type.toLowerCase(),
          messages: [
            {
              role: 'user',
              content: input.userMessage,
              timestamp: new Date().toISOString(),
            },
            {
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      })

      return {
        response: aiResponse,
        conversationId: conversation.id,
      }
    }),

  // Search for travel options (flights and agencies)
  searchTravel: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        origin: z.string().min(1),
        destination: z.string().min(1),
        date: z.string(),
        passengers: z.number().int().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify phase access
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // Build agent context
      const agentContext = {
        project: {
          name: phase.project.name,
          location: phase.project.location,
          participantCount: phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      // Get travel agent
      const { TravelAgent } = await import('@/lib/ai/agents/travel-agent')
      const agent = new TravelAgent()

      // Perform search
      try {
        const results = await agent.search(
          {
            origin: input.origin,
            destination: input.destination,
            date: new Date(input.date),
            passengers: input.passengers,
          },
          agentContext
        )

        return results
      } catch (error) {
        console.error('Travel search error:', error)
        throw new Error('Failed to search travel options')
      }
    }),

  // Generate quote request emails for selected travel options
  generateTravelQuotes: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        origin: z.string().min(1),
        destination: z.string().min(1),
        date: z.string(),
        passengers: z.number().int().min(1),
        selectedFlightIds: z.array(z.string()).optional(),
        selectedAgencyIds: z.array(z.string()).optional(),
        flights: z.array(z.any()),
        agencies: z.array(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify phase access
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // Build agent context
      const agentContext = {
        project: {
          name: phase.project.name,
          location: phase.project.location,
          participantCount: phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      // Get travel agent
      const { TravelAgent } = await import('@/lib/ai/agents/travel-agent')
      const agent = new TravelAgent()

      const searchParams = {
        origin: input.origin,
        destination: input.destination,
        date: new Date(input.date),
        passengers: input.passengers,
      }

      // Generate emails for selected options
      const emails: { recipient: string; subject: string; body: string }[] = []

      // Process selected flights
      if (input.selectedFlightIds && input.selectedFlightIds.length > 0) {
        const selectedFlights = input.flights.filter((f: any) =>
          input.selectedFlightIds?.includes(f.id)
        )

        for (const flight of selectedFlights) {
          const email = await agent.generateQuoteEmail(flight, searchParams, agentContext)
          const lines = email.split('\n')
          const subject = lines[0].replace('Subject: ', '')
          const body = lines.slice(1).join('\n').trim()

          emails.push({
            recipient: flight.airline,
            subject,
            body,
          })
        }
      }

      // Process selected agencies
      if (input.selectedAgencyIds && input.selectedAgencyIds.length > 0) {
        const selectedAgencies = input.agencies.filter((a: any) =>
          input.selectedAgencyIds?.includes(a.id)
        )

        for (const agency of selectedAgencies) {
          const email = await agent.generateQuoteEmail(agency, searchParams, agentContext)
          const lines = email.split('\n')
          const subject = lines[0].replace('Subject: ', '')
          const body = lines.slice(1).join('\n').trim()

          emails.push({
            recipient: agency.name,
            subject,
            body,
          })
        }
      }

      return { emails }
    }),

  // Search for food options (caterers and restaurants)
  searchFood: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        location: z.string().optional(),
        participants: z.number().int().optional(),
        dietaryRequirements: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify phase access
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // Build agent context
      const agentContext = {
        project: {
          name: phase.project.name,
          location: input.location || phase.project.location,
          participantCount: input.participants || phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      // Get food agent
      const { FoodAgent } = await import('@/lib/ai/agents/food-agent')
      const agent = new FoodAgent()

      // Perform search
      try {
        const results = await agent.research(agentContext)

        // Store results in phase for later access
        await ctx.prisma.pipelinePhase.update({
          where: { id: input.phaseId },
          data: {
            agentSearchResults: results as any,
          },
        })

        return {
          options: results,
          success: true,
        }
      } catch (error) {
        console.error('Food search error:', error)
        throw new Error('Failed to search food options')
      }
    }),

  // Food agent: Get stored search results
  getFoodOptions: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      return {
        options: phase.agentSearchResults || [],
        selectedOptions: phase.selectedOptions || [],
      }
    }),

  // Food agent: Analyze a specific food option
  analyzeFoodOption: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        option: z.object({
          name: z.string(),
          type: z.enum(['caterer', 'restaurant']),
          cuisineType: z.string().optional(),
          estimatedPricePerPerson: z.number().optional(),
          features: z.array(z.string()).optional(),
          capacity: z
            .object({
              min: z.number().optional(),
              max: z.number().optional(),
            })
            .optional(),
          dietaryOptions: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      const agentContext = {
        project: {
          name: phase.project.name,
          location: phase.project.location,
          participantCount: phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      const { FoodAgent } = await import('@/lib/ai/agents/food-agent')
      const foodAgent = new FoodAgent()

      try {
        const analysis = await foodAgent.analyzeFoodOption(input.option, agentContext)
        return analysis
      } catch (error) {
        console.error('Food option analysis error:', error)
        throw new Error('Failed to analyze food option')
      }
    }),

  // Food agent: Generate quote emails for selected options
  generateFoodQuoteEmails: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        selectedOptionNames: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      const agentContext = {
        project: {
          name: phase.project.name,
          location: phase.project.location,
          participantCount: phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      // Get stored search results
      const searchResults = phase.agentSearchResults as any[]
      if (!searchResults || searchResults.length === 0) {
        throw new Error('No food search results found. Please search first.')
      }

      // Filter selected options
      const selectedOptions = searchResults.filter((option) =>
        input.selectedOptionNames.includes(option.name)
      )

      if (selectedOptions.length === 0) {
        throw new Error('No matching food options found')
      }

      // Generate quote emails
      const { FoodAgent } = await import('@/lib/ai/agents/food-agent')
      const foodAgent = new FoodAgent()

      try {
        const emails = await Promise.all(
          selectedOptions.map((option) => foodAgent.generateQuoteEmail(option, agentContext))
        )

        // Store selected options and email drafts
        await ctx.prisma.pipelinePhase.update({
          where: { id: input.phaseId },
          data: {
            selectedOptions: selectedOptions as any,
            quoteEmailsDrafts: emails as any,
          },
        })

        return {
          emails: emails.map((email, index) => ({
            ...email,
            optionName: selectedOptions[index].name,
          })),
          success: true,
        }
      } catch (error) {
        console.error('Quote email generation error:', error)
        throw new Error('Failed to generate quote emails')
      }
    }),

  // Search for accommodation options
  searchAccommodation: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        location: z.string().optional(),
        participants: z.number().int().optional(),
        checkInDate: z.string().optional(),
        checkOutDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      const agentContext = {
        project: {
          name: phase.project.name,
          location: input.location || phase.project.location,
          participantCount: input.participants || phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      const { AccommodationAgent } = await import('@/lib/ai/agents/accommodation-agent')
      const agent = new AccommodationAgent()

      try {
        const results = await agent.research(agentContext)

        await ctx.prisma.pipelinePhase.update({
          where: { id: input.phaseId },
          data: {
            agentSearchResults: results as any,
          },
        })

        return {
          options: results,
          success: true,
        }
      } catch (error) {
        console.error('Accommodation search error:', error)
        throw new Error('Failed to search accommodation options')
      }
    }),

  // Generate quote emails for selected accommodation options
  generateAccommodationQuoteEmails: orgProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        selectedOptionNames: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      const agentContext = {
        project: {
          name: phase.project.name,
          location: phase.project.location,
          participantCount: phase.project.participantCount,
          startDate: phase.project.startDate,
          endDate: phase.project.endDate,
        },
        phase: {
          name: phase.name,
          type: phase.type,
          budgetAllocated: Number(phase.budgetAllocated),
          startDate: phase.startDate,
          endDate: phase.endDate,
        },
      }

      const searchResults = phase.agentSearchResults as any[]
      if (!searchResults || searchResults.length === 0) {
        throw new Error('No accommodation search results found. Please search first.')
      }

      const selectedOptions = searchResults.filter((option) =>
        input.selectedOptionNames.includes(option.name)
      )

      if (selectedOptions.length === 0) {
        throw new Error('No matching accommodation options found')
      }

      const { AccommodationAgent } = await import('@/lib/ai/agents/accommodation-agent')
      const accommodationAgent = new AccommodationAgent()

      try {
        const emails = await Promise.all(
          selectedOptions.map((option) =>
            accommodationAgent.generateQuoteEmail(option, agentContext)
          )
        )

        await ctx.prisma.pipelinePhase.update({
          where: { id: input.phaseId },
          data: {
            selectedOptions: selectedOptions as any,
            quoteEmailsDrafts: emails as any,
          },
        })

        return {
          emails: emails.map((email, index) => ({
            ...email,
            optionName: selectedOptions[index].name,
          })),
          success: true,
        }
      } catch (error) {
        console.error('Accommodation quote email generation error:', error)
        throw new Error('Failed to generate accommodation quote emails')
      }
    }),
})
