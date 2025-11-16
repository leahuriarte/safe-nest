// MindStudio Agent API Service
// Credentials are loaded from environment variables

interface MindStudioConfig {
  agentId: string
  apiKey: string
  baseUrl?: string
}

interface MindStudioMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
}

interface MindStudioResponse {
  success: boolean
  message: string
  data?: any
  error?: string
  threadId?: string
}

interface MindStudioApiResponse {
  result?: string
  threadId?: string
  billingCost?: number
}

class MindStudioService {
  private config: MindStudioConfig
  private conversationHistory: MindStudioMessage[] = []
  private currentThreadId: string | null = null

  constructor(config: MindStudioConfig) {
    this.config = {
      baseUrl: 'https://api.mindstudio.ai/developer/v2', // MindStudio API v2 endpoint
      ...config
    }
  }

  /**
   * Send a message to the MindStudio agent
   */
  async sendMessage(userMessage: string, variables?: Record<string, any>): Promise<MindStudioResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
      })

      // Prepare request body
      const requestBody: any = {
        workerId: this.config.agentId,
        variables: {
          message: userMessage,
          ...variables
        }
      }

      // Include threadId for conversation continuity
      if (this.currentThreadId) {
        requestBody.threadId = this.currentThreadId
      }

      // Call MindStudio API
      const response = await fetch(`${this.config.baseUrl}/agents/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`MindStudio API error (${response.status}): ${errorText}`)
      }

      const data: MindStudioApiResponse = await response.json()

      // Store threadId for conversation continuity
      if (data.threadId) {
        this.currentThreadId = data.threadId
      }

      const assistantMessage = data.result || ''

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: Date.now()
      })

      return {
        success: true,
        message: assistantMessage,
        threadId: data.threadId,
        data: data
      }
    } catch (error) {
      console.error('MindStudio API Error:', error)
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Evaluate a clinic using the MindStudio agent
   */
  async evaluateClinic(clinicData: {
    name: string
    address?: string
    services?: string[]
    reviews?: string[]
    additionalInfo?: string
  }): Promise<MindStudioResponse> {
    const prompt = `Please evaluate the following clinic for pregnancy care:

Clinic Name: ${clinicData.name}
${clinicData.address ? `Address: ${clinicData.address}` : ''}
${clinicData.services ? `Services: ${clinicData.services.join(', ')}` : ''}
${clinicData.reviews ? `Reviews: ${clinicData.reviews.join('\n')}` : ''}
${clinicData.additionalInfo || ''}

Please provide:
1. Overall quality rating (1-5)
2. Key strengths
3. Potential concerns
4. Recommendations for pregnant individuals considering this clinic`

    return this.sendMessage(prompt, {
      clinicName: clinicData.name,
      clinicAddress: clinicData.address,
      services: clinicData.services,
      reviews: clinicData.reviews
    })
  }

  /**
   * Ask a specific question about clinic care
   */
  async askQuestion(question: string): Promise<MindStudioResponse> {
    return this.sendMessage(question)
  }

  /**
   * Get conversation history
   */
  getHistory(): MindStudioMessage[] {
    return [...this.conversationHistory]
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = []
    this.currentThreadId = null
  }

  /**
   * Reset the conversation
   */
  reset(): void {
    this.clearHistory()
  }
}

// Singleton instance - credentials loaded from environment variables
const apiKey = import.meta.env.VITE_MINDSTUDIO_API_KEY
const agentId = import.meta.env.VITE_MINDSTUDIO_AGENT_ID

if (!apiKey || !agentId) {
  console.error('MindStudio credentials not configured. Please set VITE_MINDSTUDIO_API_KEY and VITE_MINDSTUDIO_AGENT_ID in your .env file')
}

export const mindstudioAgent = new MindStudioService({
  agentId: agentId || '',
  apiKey: apiKey || ''
})

export default MindStudioService
