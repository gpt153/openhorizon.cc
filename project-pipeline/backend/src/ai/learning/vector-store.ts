import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client'
import { env } from '../../config/env.js'

export interface VectorDocument {
  id: string
  content: string
  metadata: Record<string, any>
  embedding?: number[]
}

export interface SearchResult {
  id: string
  content: string
  metadata: Record<string, any>
  score: number
}

export class VectorStore {
  private client: WeaviateClient
  private className: string = 'ProjectPattern'

  constructor() {
    this.client = weaviate.client({
      scheme: env.WEAVIATE_SCHEME || 'http',
      host: env.WEAVIATE_HOST || 'localhost:8080',
      ...(env.WEAVIATE_API_KEY && {
        apiKey: new ApiKey(env.WEAVIATE_API_KEY)
      }),
      headers: env.OPENAI_API_KEY ? {
        'X-OpenAI-Api-Key': env.OPENAI_API_KEY
      } : undefined
    })
  }

  /**
   * Initialize schema for vector store
   */
  async initSchema(): Promise<void> {
    try {
      // Check if class already exists
      const exists = await this.client.schema
        .exists(this.className)

      if (exists) {
        console.log(`✅ Schema ${this.className} already exists`)
        return
      }

      // Create class schema
      await this.client.schema
        .classCreator()
        .withClass({
          class: this.className,
          description: 'Learned patterns from past Erasmus+ projects',
          vectorizer: 'text2vec-openai',
          moduleConfig: {
            'text2vec-openai': {
              model: 'text-embedding-ada-002',
              type: 'text'
            }
          },
          properties: [
            {
              name: 'content',
              dataType: ['text'],
              description: 'The pattern content or description',
              moduleConfig: {
                'text2vec-openai': {
                  skip: false,
                  vectorizePropertyName: false
                }
              }
            },
            {
              name: 'patternType',
              dataType: ['string'],
              description: 'Type of pattern (vendor_preference, budget_allocation, timeline_adjustment, etc.)'
            },
            {
              name: 'phaseType',
              dataType: ['string'],
              description: 'Phase type this pattern applies to'
            },
            {
              name: 'projectType',
              dataType: ['string'],
              description: 'Project type this pattern was learned from'
            },
            {
              name: 'location',
              dataType: ['string'],
              description: 'Location where this pattern was observed'
            },
            {
              name: 'confidence',
              dataType: ['number'],
              description: 'Confidence score (0-100) based on frequency and recency'
            },
            {
              name: 'frequency',
              dataType: ['int'],
              description: 'Number of times this pattern was observed'
            },
            {
              name: 'lastObserved',
              dataType: ['date'],
              description: 'When this pattern was last observed'
            },
            {
              name: 'metadata',
              dataType: ['text'],
              description: 'JSON string of additional metadata'
            }
          ]
        })
        .do()

      console.log(`✅ Created schema: ${this.className}`)
    } catch (error) {
      console.error('❌ Error creating schema:', error)
      throw error
    }
  }

  /**
   * Add a document to the vector store
   */
  async addDocument(doc: {
    id: string
    content: string
    patternType: string
    phaseType: string
    projectType: string
    location: string
    confidence: number
    frequency: number
    lastObserved: Date
    metadata: Record<string, any>
  }): Promise<string> {
    try {
      const result = await this.client.data
        .creator()
        .withClassName(this.className)
        .withId(doc.id)
        .withProperties({
          content: doc.content,
          patternType: doc.patternType,
          phaseType: doc.phaseType,
          projectType: doc.projectType,
          location: doc.location,
          confidence: doc.confidence,
          frequency: doc.frequency,
          lastObserved: doc.lastObserved.toISOString(),
          metadata: JSON.stringify(doc.metadata)
        })
        .do()

      return result.id
    } catch (error) {
      console.error('❌ Error adding document:', error)
      throw error
    }
  }

  /**
   * Search for similar patterns
   */
  async search(params: {
    query: string
    patternType?: string
    phaseType?: string
    projectType?: string
    location?: string
    limit?: number
    minConfidence?: number
  }): Promise<SearchResult[]> {
    try {
      let queryBuilder = this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('content patternType phaseType projectType location confidence frequency lastObserved metadata _additional { id distance }')
        .withNearText({ concepts: [params.query] })
        .withLimit(params.limit || 5)

      // Add filters
      const filters: any[] = []

      if (params.patternType) {
        filters.push({
          path: ['patternType'],
          operator: 'Equal',
          valueString: params.patternType
        })
      }

      if (params.phaseType) {
        filters.push({
          path: ['phaseType'],
          operator: 'Equal',
          valueString: params.phaseType
        })
      }

      if (params.projectType) {
        filters.push({
          path: ['projectType'],
          operator: 'Equal',
          valueString: params.projectType
        })
      }

      if (params.location) {
        filters.push({
          path: ['location'],
          operator: 'Equal',
          valueString: params.location
        })
      }

      if (params.minConfidence !== undefined) {
        filters.push({
          path: ['confidence'],
          operator: 'GreaterThanEqual',
          valueNumber: params.minConfidence
        })
      }

      if (filters.length > 0) {
        queryBuilder = queryBuilder.withWhere({
          operator: 'And',
          operands: filters
        })
      }

      const result = await queryBuilder.do()

      const patterns = result.data.Get[this.className] || []

      return patterns.map((p: any) => ({
        id: p._additional.id,
        content: p.content,
        metadata: {
          ...JSON.parse(p.metadata || '{}'),
          patternType: p.patternType,
          phaseType: p.phaseType,
          projectType: p.projectType,
          location: p.location,
          confidence: p.confidence,
          frequency: p.frequency,
          lastObserved: p.lastObserved
        },
        score: 1 - p._additional.distance // Convert distance to similarity score
      }))
    } catch (error) {
      console.error('❌ Error searching:', error)
      return []
    }
  }

  /**
   * Update document confidence and frequency
   */
  async updatePattern(id: string, updates: {
    confidence?: number
    frequency?: number
    lastObserved?: Date
  }): Promise<void> {
    try {
      // Get existing object first
      const existing = await this.client.data
        .getterById()
        .withClassName(this.className)
        .withId(id)
        .do()

      const updatedProperties = {
        ...existing.properties,
        ...(updates.confidence !== undefined && { confidence: updates.confidence }),
        ...(updates.frequency !== undefined && { frequency: updates.frequency }),
        ...(updates.lastObserved && { lastObserved: updates.lastObserved.toISOString() })
      }

      await this.client.data
        .merger()
        .withClassName(this.className)
        .withId(id)
        .withProperties(updatedProperties)
        .do()
    } catch (error) {
      console.error('❌ Error updating pattern:', error)
      throw error
    }
  }

  /**
   * Delete a pattern
   */
  async deletePattern(id: string): Promise<void> {
    try {
      await this.client.data
        .deleter()
        .withClassName(this.className)
        .withId(id)
        .do()
    } catch (error) {
      console.error('❌ Error deleting pattern:', error)
      throw error
    }
  }

  /**
   * Get all patterns for a specific context
   */
  async getPatternsByContext(params: {
    phaseType: string
    projectType?: string
    location?: string
    limit?: number
  }): Promise<SearchResult[]> {
    try {
      let queryBuilder = this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('content patternType phaseType projectType location confidence frequency lastObserved metadata _additional { id }')
        .withLimit(params.limit || 10)

      const filters: any[] = [{
        path: ['phaseType'],
        operator: 'Equal',
        valueString: params.phaseType
      }]

      if (params.projectType) {
        filters.push({
          path: ['projectType'],
          operator: 'Equal',
          valueString: params.projectType
        })
      }

      if (params.location) {
        filters.push({
          path: ['location'],
          operator: 'Equal',
          valueString: params.location
        })
      }

      queryBuilder = queryBuilder.withWhere({
        operator: 'And',
        operands: filters
      })

      const result = await queryBuilder.do()
      const patterns = result.data.Get[this.className] || []

      return patterns.map((p: any) => ({
        id: p._additional.id,
        content: p.content,
        metadata: {
          ...JSON.parse(p.metadata || '{}'),
          patternType: p.patternType,
          phaseType: p.phaseType,
          projectType: p.projectType,
          location: p.location,
          confidence: p.confidence,
          frequency: p.frequency,
          lastObserved: p.lastObserved
        },
        score: p.confidence / 100
      }))
    } catch (error) {
      console.error('❌ Error getting patterns by context:', error)
      return []
    }
  }

  /**
   * Test connection to Weaviate
   */
  async testConnection(): Promise<boolean> {
    try {
      const meta = await this.client.misc.metaGetter().do()
      console.log('✅ Weaviate connection successful')
      console.log('Version:', meta.version)
      return true
    } catch (error) {
      console.error('❌ Weaviate connection failed:', error)
      return false
    }
  }
}

// Singleton instance
let vectorStoreInstance: VectorStore | null = null

export function getVectorStore(): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore()
  }
  return vectorStoreInstance
}
