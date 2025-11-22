import React from 'react';
import MindStudioChat from '../components/MindStudioChat';
import './MindStudioDemo.css';

export default function MindStudioDemo() {
  return (
    <div className="mindstudio-demo-container">
      <div className="mindstudio-demo-header">
        <h1>MindStudio Agent Integration</h1>
        <p>Test your MindStudio agent integration with this chat interface.</p>
      </div>
      
      <div className="mindstudio-demo-content">
        <div className="demo-info">
          <h3>🤖 About Your Agent</h3>
          <ul>
            <li>Connected to your MindStudio agent via webhook</li>
            <li>Maintains conversation context with session management</li>
            <li>Real-time responses from your configured agent</li>
            <li>Secure API key authentication</li>
          </ul>
          
          <div className="demo-tips">
            <h4>💡 Tips for Testing:</h4>
            <ul>
              <li>Try asking questions related to your agent's training</li>
              <li>Test different conversation flows</li>
              <li>Check how the agent handles follow-up questions</li>
              <li>Verify the session persistence works correctly</li>
            </ul>
          </div>
        </div>
        
        <div className="chat-container">
          <MindStudioChat 
            title="Your MindStudio Agent"
            placeholder="Type your message to test the agent..."
          />
        </div>
      </div>
    </div>
  );
}