/**
 * AI Assistant Demo and Examples
 *
 * This file demonstrates how to use the new AI workflow-based assistant system
 * and provides examples for different use cases.
 */

import { getAIService, processAIRequest } from './ai-service';

/**
 * Demo: Basic AI Assistant Usage
 *
 * Shows how to use the AI service for simple requests
 */
export async function demoBasicUsage() {
  console.log('\n🤖 === Basic AI Assistant Usage Demo ===');

  try {
    const response = await processAIRequest({
      userInput: 'What are the latest documents about project management?',
      workspaceId: 'demo_workspace_123',
      userId: 'demo_user_456',
      userDetails: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    });

    console.log(
      '📝 User Query:',
      'What are the latest documents about project management?'
    );
    console.log('🤖 AI Response:', response.finalAnswer);
    console.log('🔍 Search Performed:', response.searchPerformed);
    console.log('⏱️ Processing Time:', `${response.processingTimeMs}ms`);
    console.log('📚 Citations:', response.citations.length);
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

/**
 * Demo: Complex Database Query Processing
 *
 * Shows how the service handles complex database queries
 */
export async function demoComplexDatabaseQuery() {
  console.log('\n🗄️ === Complex Database Query Demo ===');

  try {
    const response = await processAIRequest({
      userInput:
        'Can you help me understand the Q3 sales data from our database?',
      workspaceId: 'demo_workspace_123',
      userId: 'demo_user_456',
      userDetails: {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    });

    console.log(
      '📝 User Query:',
      'Can you help me understand the Q3 sales data from our database?'
    );
    console.log('🤖 AI Response:', response.finalAnswer);
    console.log('🔍 Search Performed:', response.searchPerformed);
    console.log('⏱️ Processing Time:', `${response.processingTimeMs}ms`);
    console.log('📚 Citations Found:', response.citations.length);
  } catch (error) {
    console.error('❌ Complex query demo failed:', error);
  }
}

/**
 * Demo: Workflow System Usage
 *
 * Shows how the new workflow system handles different types of queries
 */
export async function demoWorkflowUsage() {
  console.log('\n🔄 === Workflow System Demo ===');

  try {
    // Test general knowledge query (no_context intent)
    console.log('\n📚 Testing general knowledge query...');
    const generalResponse = await processAIRequest({
      userInput: 'What is TypeScript and why is it useful?',
      workspaceId: 'demo_workspace_123',
      userId: 'demo_user_456',
      userDetails: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    });

    console.log('📝 Query: What is TypeScript and why is it useful?');
    console.log('🤖 Response:', generalResponse.finalAnswer.substring(0, 200) + '...');
    console.log('🔍 Search Performed:', generalResponse.searchPerformed);
    console.log('📚 Citations:', generalResponse.citations.length);

    // Test workspace-specific query (retrieve intent)
    console.log('\n🔍 Testing workspace-specific query...');
    const workspaceResponse = await processAIRequest({
      userInput: 'Show me recent documents about project planning',
      workspaceId: 'demo_workspace_123',
      userId: 'demo_user_456',
      userDetails: {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    });

    console.log('📝 Query: Show me recent documents about project planning');
    console.log('🤖 Response:', workspaceResponse.finalAnswer.substring(0, 200) + '...');
    console.log('🔍 Search Performed:', workspaceResponse.searchPerformed);
    console.log('📚 Citations:', workspaceResponse.citations.length);

  } catch (error) {
    console.error('❌ Workflow demo failed:', error);
  }
}

/**
 * Demo: Service Health Check
 *
 * Shows how to check if the AI system is healthy and operational
 */
export async function demoHealthCheck() {
  console.log('\n🏥 === AI System Health Check Demo ===');

  try {
    const aiService = getAIService();
    const health = await aiService.healthCheck();

    console.log('🏥 Health Status:', health.status);
    console.log('📋 Details:', health.details);

    if (health.status === 'healthy') {
      console.log('✅ AI system is operational and ready to process requests');
    } else {
      console.log('❌ AI system has issues and may not work properly');
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

/**
 * Demo: Error Handling
 *
 * Shows how the system handles various error scenarios
 */
export async function demoErrorHandling() {
  console.log('\n⚠️ === Error Handling Demo ===');

  // Test with invalid workspace ID
  try {
    console.log('Testing with invalid workspace ID...');
    const response = await processAIRequest({
      userInput: 'Test query',
      workspaceId: 'invalid_workspace',
      userId: 'test_user',
      userDetails: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    console.log('🤖 Response (graceful error):', response.finalAnswer);
    console.log('⏱️ Processing Time:', `${response.processingTimeMs}ms`);
  } catch (error) {
    console.log(
      '❌ Handled error gracefully:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  // Test with empty input
  try {
    console.log('Testing with empty input...');
    const response = await processAIRequest({
      userInput: '',
      workspaceId: 'demo_workspace_123',
      userId: 'test_user',
      userDetails: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    console.log('🤖 Response (empty input):', response.finalAnswer);
  } catch (error) {
    console.log(
      '❌ Handled empty input gracefully:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Demo: Performance Testing
 *
 * Shows performance characteristics with different query types
 */
export async function demoPerformance() {
  console.log('\n⚡ === Performance Testing Demo ===');

  const queries = [
    { type: 'General Knowledge', query: 'What is TypeScript?' },
    { type: 'Simple Workspace', query: 'Show me recent documents' },
    {
      type: 'Complex Database',
      query: 'Find all projects where status is completed and priority is high',
    },
  ];

  for (const { type, query } of queries) {
    try {
      console.log(`\n🔬 Testing ${type} query...`);
      console.log(`📝 Query: "${query}"`);

      const startTime = Date.now();
      const response = await processAIRequest({
        userInput: query,
        workspaceId: 'demo_workspace_123',
        userId: 'perf_test_user',
        userDetails: {
          name: 'Performance Tester',
          email: 'perf@example.com',
        },
      });
      const totalTime = Date.now() - startTime;

      console.log('🔍 Search Performed:', response.searchPerformed);
      console.log('⏱️ Service Time:', `${response.processingTimeMs}ms`);
      console.log('⏱️ Total Time:', `${totalTime}ms`);
      console.log(
        '📏 Response Length:',
        `${response.finalAnswer.length} chars`
      );
    } catch (error) {
      console.error(`❌ Performance test failed for ${type}:`, error);
    }
  }
}

/**
 * Run all demos
 *
 * Executes all demo functions to show the complete system capabilities
 */
export async function runAllDemos() {
  console.log('🎬 === AI Assistant System Demo ===');
  console.log(
    'This demo shows the capabilities of the new AI assistant system\n'
  );

  try {
    await demoHealthCheck();
    await demoBasicUsage();
    await demoComplexDatabaseQuery();
    await demoWorkflowUsage();
    await demoErrorHandling();
    await demoPerformance();

    console.log('\n🎉 === All Demos Completed Successfully ===');
  } catch (error) {
    console.error('❌ Demo suite failed:', error);
  }
}

/**
 * Migration comparison showing before vs after
 */
export function showMigrationComparison() {
  console.log(`
🔄 === MIGRATION COMPARISON ===

📊 BEFORE (Complex LangChain System):
┌─────────────────────────────────────────────────────────┐
│ ❌ 600+ lines across 4 complex files                   │
│ ❌ Manual LangGraph workflow with 14+ nodes            │
│ ❌ Complex state management between workflow steps      │
│ ❌ Manual chat history and memory handling              │
│ ❌ Hardcoded prompt templates and tool definitions      │
│ ❌ Custom document retrieval and reranking logic        │
│ ❌ Tightly coupled components                           │
│ ❌ Difficult to test and maintain                       │
└─────────────────────────────────────────────────────────┘

📊 AFTER (Clean Mastra Workflow System):
┌─────────────────────────────────────────────────────────┐
│ ✅ Workflow-based architecture with proper orchestration│
│ ✅ Specialized agents for intent detection and answering │
│ ✅ Type-safe workflow steps with full observability     │
│ ✅ Intelligent routing (no_context vs retrieve)         │
│ ✅ Built-in RAG with automatic context fetching         │
│ ✅ Unified processing with branching logic              │
│ ✅ Proper citation handling and deduplication           │
│ ✅ Easy to extend with new workflow steps               │
└─────────────────────────────────────────────────────────┘

🎯 KEY IMPROVEMENTS:
• Proper Mastra workflow utilization
• Better separation of concerns with focused agents
• Enhanced observability and debugging capabilities
• Type-safe workflow orchestration
• Intelligent intent-based routing
• Simplified yet more powerful architecture
• Built-in error handling and fallbacks

📁 NEW FILE STRUCTURE:
├── ai-workflow.ts    → Main workflow orchestration (NEW)
├── ai-agents.ts      → Intent and answer agents
├── ai-tools.ts       → Document search and database tools
├── ai-service.ts     → Service layer with workflow integration
├── ai-models.ts      → Model configuration (simplified)
├── ai-assistant.ts   → Legacy compatibility (minimal)
└── ai-demo.ts        → Workflow demonstrations
`);
}

// Run demos if this file is executed directly
if (require.main === module) {
  async function main() {
    try {
      showMigrationComparison();

      console.log(
        '\n⚠️  Note: These demos require valid workspace and user IDs to run properly.'
      );
      console.log(
        'To run actual demos, update the IDs in the demo functions and uncomment the line below.\n'
      );

      // Uncomment to run actual demonstrations (requires valid workspace/user IDs)
      // await runAllDemos();
    } catch (error) {
      console.error('Demo error:', error);
    }
  }

  main();
}
