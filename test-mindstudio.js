#!/usr/bin/env node

// Simple test script for MindStudio integration
// Run with: node test-mindstudio.js

const API_URL = 'http://localhost:3001/api/mindstudio';

async function testMindStudio() {
  console.log('🧪 Testing MindStudio Integration...\n');

  const testMessage = {
    message: "Hello! This is a test message from SafeNest. Can you respond?",
    sessionId: `test_session_${Date.now()}`,
    userId: `test_user_${Date.now()}`
  };

  try {
    console.log('📤 Sending test message:', testMessage.message);
    console.log('🔗 Endpoint:', API_URL);
    console.log('📋 Session ID:', testMessage.sessionId);
    console.log('👤 User ID:', testMessage.userId);
    console.log('\n⏳ Waiting for response...\n');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Success! MindStudio responded:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 Agent Response:', result.response);
    console.log('🆔 Agent ID:', result.agentId);
    console.log('📋 Session ID:', result.sessionId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Integration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Make sure your server is running: cd server && npm run dev');
      console.log('   2. Check if the server is running on port 3001');
      console.log('   3. Verify your .env file has the correct MindStudio credentials');
    } else if (error.message.includes('401')) {
      console.log('\n💡 Authentication issue:');
      console.log('   1. Check your MINDSTUDIO_API_KEY in server/.env');
      console.log('   2. Verify the API key is valid and has proper permissions');
    } else if (error.message.includes('404')) {
      console.log('\n💡 Agent not found:');
      console.log('   1. Check your MINDSTUDIO_AGENT_ID in server/.env');
      console.log('   2. Verify the agent ID is correct and the agent is published');
    }
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you need to install node-fetch');
  console.log('💡 Try: npm install -g node-fetch');
  process.exit(1);
}

testMindStudio();