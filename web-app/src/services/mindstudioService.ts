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
  private currentSessionId: string | null = null
  private currentUserId: string | null = null

  constructor(config: MindStudioConfig) {
    this.config = {
      baseUrl: 'https://api.mindstudio.ai/developer/v2', // MindStudio API v2 endpoint
      ...config
    }
  }

  /**
   * Send a message to the MindStudio agent via our server
   */
  async sendMessage(userMessage: string, variables?: Record<string, any>): Promise<MindStudioResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
      })

      // Use our server endpoint instead of calling MindStudio directly
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE_URL}/api/mindstudio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: this.currentSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: this.currentUserId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json()

      // Store session info for conversation continuity
      if (data.sessionId) {
        this.currentSessionId = data.sessionId
      }
      if (!this.currentUserId) {
        this.currentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      const assistantMessage = data.response || 'No response received'

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: Date.now()
      })

      return {
        success: data.success,
        message: assistantMessage,
        threadId: data.threadId,
        data: data
      }
    } catch (error) {
      console.error('MindStudio Service Error:', error)
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
    this.currentSessionId = null
    this.currentUserId = null
  }

  /**
   * Reset the conversation
   */
  reset(): void {
    this.clearHistory()
    
    // Also reset on the server
    if (this.currentSessionId) {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      fetch(`${API_BASE_URL}/api/mindstudio/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.currentSessionId })
      }).catch(err => console.warn('Failed to reset server session:', err));
    }
  }
}

// Singleton instance - uses server endpoint, no need for frontend credentials
export const mindstudioAgent = new MindStudioService({
  agentId: 'deb8174b-3595-4b64-b269-9bb3f735d79f', // Used for reference only
  apiKey: 'server-handled' // Credentials handled by server
})

export default MindStudioService
