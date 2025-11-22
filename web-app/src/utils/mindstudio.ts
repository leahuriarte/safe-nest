export interface MindStudioRequest {
  message: string;
  sessionId?: string;
  userId?: string;
}

export interface MindStudioResponse {
  success: boolean;
  response: string;
  sessionId: string;
  agentId: string;
  error?: string;
  details?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function sendToMindStudio(request: MindStudioRequest): Promise<MindStudioResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mindstudio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('MindStudio API error:', error);
    throw error;
  }
}

// Helper function to generate a session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to generate a user ID
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}