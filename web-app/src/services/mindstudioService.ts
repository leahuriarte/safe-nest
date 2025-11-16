// MindStudio Agent API Service
// Replace with your actual MindStudio agent credentials

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
}

class MindStudioService {
  private config: MindStudioConfig
  private conversationHistory: MindStudioMessage[] = []

  constructor(config: MindStudioConfig) {
    this.config = {
      baseUrl: 'https://api.mindstudio.ai/v1', // Default MindStudio API endpoint
      ...config
    }
  }

  /**
   * Send a message to the MindStudio agent
   */
  async sendMessage(userMessage: string): Promise<MindStudioResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
      })

      // Call MindStudio API
      const response = await fetch(`${this.config.baseUrl}/agents/${this.config.agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          message: userMessage,
          history: this.conversationHistory,
          // Add any additional MindStudio-specific parameters here
        })
      })

      if (!response.ok) {
        throw new Error(`MindStudio API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: data.response || data.message || '',
        timestamp: Date.now()
      })

      return {
        success: true,
        message: data.response || data.message || '',
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

    return this.sendMessage(prompt)
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
  }

  /**
   * Reset the conversation
   */
  reset(): void {
    this.clearHistory()
  }
}

// Singleton instance - configure with your actual credentials
export const mindstudioAgent = new MindStudioService({
  agentId: 'YOUR_MINDSTUDIO_AGENT_ID', // Replace with your agent ID
  apiKey: 'YOUR_MINDSTUDIO_API_KEY',   // Replace with your API key
  // baseUrl: 'https://custom-endpoint.com' // Optional: custom endpoint
})

export default MindStudioService
