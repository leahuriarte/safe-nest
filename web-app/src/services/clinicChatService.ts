// Gemini-based clinic finder service
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ClinicChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ClinicChatRequest {
  message: string;
  location?: string;
}

export interface ClinicChatResponse {
  response: string;
}

class ClinicChatService {
  private history: ClinicChatMessage[] = [];
  private currentLocation: string = 'Los Angeles, CA';

  async sendMessage(message: string, location?: string): Promise<string> {
    try {
      // Add user message to history
      this.history.push({
        role: 'user',
        content: message,
        timestamp: Date.now()
      });

      if (location) {
        this.currentLocation = location;
      }

      const response = await fetch(`${API_URL}/api/clinic-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          location: this.currentLocation
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get clinic recommendations: ${response.statusText}`);
      }

      const data: ClinicChatResponse = await response.json();

      // Add assistant response to history
      this.history.push({
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      });

      return data.response;
    } catch (error) {
      console.error('Clinic chat error:', error);
      throw error;
    }
  }

  setLocation(location: string) {
    this.currentLocation = location;
  }

  getLocation(): string {
    return this.currentLocation;
  }

  getHistory(): ClinicChatMessage[] {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  // Extract addresses from the response for auto-search functionality
  extractAddresses(response: string): string[] {
    const addresses: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      // Look for lines that start with the location emoji
      if (line.includes('📍')) {
        const address = line.replace('📍', '').trim();
        if (address) {
          addresses.push(address);
        }
      }
    }

    return addresses;
  }
}

// Export singleton instance
export const clinicChatService = new ClinicChatService();
