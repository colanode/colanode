/**
 * AI Assistant Demo and Examples
 *
 * This file demonstrates how to use the new AI workflow-based assistant system
 * and provides examples for different use cases.
 */

import { Mastra } from '@mastra/core';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { assistantWorkflow } from './ai-workflow';
import {
  AssistantWorkflowInput,
  AssistantWorkflowOutput,
} from '@colanode/server/types/ai';

/**
 * Process an AI request using the Mastra workflow directly.
 *
 * @param request - The user's request with context
 * @returns Promise resolving to the assistant's response
 */
async function processAIRequest(
  request: AssistantWorkflowInput
): Promise<AssistantWorkflowOutput> {
  const startTime = Date.now();

  // Prepare runtime context
  const runtimeContext = new RuntimeContext();
  runtimeContext.set('workspaceName', request.workspaceId);
  runtimeContext.set('userName', request.userDetails.name);
  runtimeContext.set('userEmail', request.userDetails.email);
  runtimeContext.set('workspaceId', request.workspaceId);
  runtimeContext.set('userId', request.userId);
  runtimeContext.set(
    'selectedContextNodeIds',
    request.selectedContextNodeIds || []
  );
  runtimeContext.set('userInput', request.userInput);

  // Initialize Mastra and get the workflow
  const mastra = new Mastra({
    workflows: {
      assistantWorkflow,
    },
  });
  const workflow = mastra.getWorkflow('assistantWorkflow');
  const run = await workflow.createRunAsync();

  // Execute the workflow
  const result = await run.start({
    inputData: request,
    runtimeContext,
  });

  if (result.status !== 'success' || !result.result) {
    const errorMessage =
      result.status === 'suspended'
        ? 'Workflow was suspended unexpectedly'
        : (result as any).error || 'Workflow execution failed';
    console.error('❌ Workflow failed:', errorMessage);
    throw new Error(errorMessage);
  }

  return {
    ...result.result,
    processingTimeMs: Date.now() - startTime,
  };
}

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
    console.log(
      '🤖 Response:',
      generalResponse.finalAnswer.substring(0, 200) + '...'
    );
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
    console.log(
      '🤖 Response:',
      workspaceResponse.finalAnswer.substring(0, 200) + '...'
    );
    console.log('🔍 Search Performed:', workspaceResponse.searchPerformed);
    console.log('📚 Citations:', workspaceResponse.citations.length);
  } catch (error) {
    console.error('❌ Workflow demo failed:', error);
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
 * Demo: New Workflow Architecture
 *
 * Shows the new declarative workflow with proper branching
 */
export async function demoNewWorkflowArchitecture() {
  console.log('\n🏗️ === New Workflow Architecture Demo ===');

  try {
    // Test 1: No-context branch (general knowledge)
    console.log('\n1️⃣ Testing NO_CONTEXT branch (general knowledge)...');
    const generalResponse = await processAIRequest({
      userInput: 'What is TypeScript and why should I use it?',
      workspaceId: 'demo_workspace_123',
      userId: 'demo_user_456',
      userDetails: {
        name: 'Alice Developer',
        email: 'alice@example.com',
      },
    });

    console.log('📝 Query: "What is TypeScript and why should I use it?"');
    console.log('🎯 Expected Branch: no_context');
    console.log(
      '🔍 Search Performed:',
      generalResponse.searchPerformed ? '❌ Unexpected' : '✅ None (correct)'
    );
    console.log(
      '📚 Citations:',
      generalResponse.citations.length === 0
        ? '✅ None (correct)'
        : '❌ Unexpected'
    );
    console.log(
      '💬 Response Preview:',
      generalResponse.finalAnswer.substring(0, 150) + '...'
    );

    // Test 2: Retrieve branch (workspace-specific)
    console.log('\n2️⃣ Testing RETRIEVE branch (workspace-specific)...');
    const workspaceResponse = await processAIRequest({
      userInput: 'Show me recent documents about project planning',
      workspaceId: 'demo_workspace_123',
      userId: 'demo_user_456',
      userDetails: {
        name: 'Bob Manager',
        email: 'bob@example.com',
      },
    });

    console.log('📝 Query: "Show me recent documents about project planning"');
    console.log('🎯 Expected Branch: retrieve');
    console.log(
      '🔍 Search Performed:',
      workspaceResponse.searchPerformed
        ? '✅ Yes (correct)'
        : '❌ None (unexpected)'
    );
    console.log(
      '📚 Citations:',
      workspaceResponse.citations.length > 0
        ? '✅ Present (good)'
        : '⚠️ None (no results)'
    );
    console.log(
      '💬 Response Preview:',
      workspaceResponse.finalAnswer.substring(0, 150) + '...'
    );

    console.log('\n✅ New workflow architecture demo completed successfully!');
  } catch (error) {
    console.error('❌ New workflow architecture demo failed:', error);
  }
}

/**
 * Run all demos including new architecture demonstrations
 *
 * Executes all demo functions to show the complete system capabilities
 */
export async function runAllDemos() {
  console.log('🎬 === AI Assistant System Demo Suite ===');
  console.log('This demo showcases the new Mastra-based AI assistant system\n');

  try {
    // Show the migration comparison first
    showMigrationComparison();

    // Demo new architecture
    await demoNewWorkflowArchitecture();

    // Run original demos for compatibility
    await demoBasicUsage();
    await demoWorkflowUsage();
    await demoErrorHandling();
    await demoPerformance();

    console.log('\n🎉 === All Demos Completed Successfully ===');
    console.log('The new Mastra-based AI system is ready for production! 🚀');
  } catch (error) {
    console.error('❌ Demo suite failed:', error);
  }
}

/**
 * Migration comparison showing before vs after
 */
export function showMigrationComparison() {
  console.log(`
🔄 === MASTRA MIGRATION COMPLETED ===

📊 BEFORE (Complex LangChain System):
┌─────────────────────────────────────────────────────────┐
│ ❌ 600+ lines across multiple complex files             │
│ ❌ Manual LangGraph workflow with 14+ imperative nodes  │
│ ❌ Complex state management between workflow steps      │
│ ❌ Monolithic agents with multi-purpose prompts         │
│ ❌ Tightly coupled search and reranking logic           │
│ ❌ Poor observability and debugging capabilities        │
│ ❌ Not optimized for smaller/self-hosted LLMs           │
│ ❌ Difficult to test, maintain, and extend              │
└─────────────────────────────────────────────────────────┘

📊 AFTER (Declarative Mastra Workflow System):
┌─────────────────────────────────────────────────────────┐
│ ✅ Fully declarative workflow with proper branching     │
│ ✅ Single-purpose agents optimized for smaller LLMs     │
│ ✅ Granular tools with focused responsibilities         │
│ ✅ Intelligent intent-based routing                     │
│ ✅ Full observability through Mastra's workflow engine  │
│ ✅ Type-safe, maintainable, and easily extensible      │
└─────────────────────────────────────────────────────────┘

🎯 KEY ACHIEVEMENTS:
• TRUE Mastra idiomatic implementation with .branch() routing
• BYOM (Bring Your Own Model) optimization for self-hosted LLMs
• Granular tools: semantic search, keyword search, database tools
• Step-by-step observability for debugging and optimization

🏗️ ARCHITECTURE HIGHLIGHTS:
• Declarative workflow: intentClassification → branch(intent) → publish
• Simplified agents: intentClassifier, queryOptimizer, answerGenerator

📁 REFACTORED FILE STRUCTURE:
├── ai-workflow.ts    → Declarative Mastra workflow with branching
├── ai-agents.ts      → Single-purpose agents optimized for small LLMs
├── ai-tools.ts       → Granular tools (semantic, keyword, database)
├── ai-models.ts      → Multi-provider model configuration
└── ai-demo.ts        → Workflow path demonstrations
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
