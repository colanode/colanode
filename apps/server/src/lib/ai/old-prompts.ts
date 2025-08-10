import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';

export const queryRewritePrompt = PromptTemplate.fromTemplate(
  `<task>
  You are an expert at rewriting search queries to optimize for both semantic similarity and keyword-based search in a document retrieval system.
  Your task is to generate two separate optimized queries:
  1. A semantic search query optimized for vector embeddings and semantic similarity
  2. A keyword search query optimized for full-text search using PostgreSQL's tsquery
</task>

<guidelines>
  For semantic search query:
  1. Focus on conceptual meaning and intent
  2. Include context-indicating terms
  3. Preserve relationship words between concepts
  4. Expand concepts with related terms
  5. Remove noise words and syntax-specific terms
  
  For keyword search query:
  1. Focus on specific technical terms and exact matches
  2. Include variations of key terms
  3. Keep proper nouns and domain-specific vocabulary
  4. Optimize for PostgreSQL's websearch_to_tsquery syntax
  5. Include essential filters and constraints
</guidelines>

<input>
  Original query: {query}
</input>

<output_format>
  Return a JSON object with:
  {{
    "semanticQuery": "optimized query for semantic search",
    "keywordQuery": "optimized query for keyword search"
}}
</output_format>`
);

export const summarizationPrompt = PromptTemplate.fromTemplate(
  `<task>
  Summarize the following text focusing on key points relevant to the user's query.
  If the text is short (<100 characters), return it as is.
</task>

<input>
  Text: {text}
  User Query: {query}
</input>`
);

export const rerankPrompt = PromptTemplate.fromTemplate(
  `<task>
  You are the final relevance judge in a hybrid search system. Your task is to re-rank search results by analyzing their true relevance to the user's query.
  These documents have already passed through:
  1. Semantic search (vector similarity)
  2. Keyword-based search (full-text search)
  
  Your ranking will determine the final order and which documents are shown to the user.
</task>

<context>
  Each document contains:
  - Main content text
  - Optional summary/context
  - Metadata (type, creation info)
  The documents can be:
  - Workspace nodes (various content types)
  - Documents (files, notes)
  - Database records
</context>

<ranking_criteria>
  Evaluate relevance based on:
  1. Direct answer presence (highest priority)
     - Does the content directly answer the query?
     - Are key details or facts present?
  
  2. Contextual relevance
     - How well does the content relate to the query topic?
     - Is the context/summary relevant?
     - Does it provide important background information?
  
  3. Information freshness
     - For time-sensitive queries, prefer recent content
     - For conceptual queries, recency matters less
  
  4. Content completeness
     - Does it provide comprehensive information?
     - Are related concepts explained?
  
  5. Source appropriateness
     - Is the document type appropriate for the query?
     - Does the source authority match the information need?
</ranking_criteria>

<scoring_guidelines>
  Score from 0 to 1, where:
  1.0: Perfect match, directly answers query
  0.8-0.9: Highly relevant, contains most key information
  0.5-0.7: Moderately relevant, contains some useful information
  0.2-0.4: Tangentially relevant, minimal useful information
  0.0-0.1: Not relevant or useful for the query
</scoring_guidelines>

<documents>
  {context}
</documents>

<user_query>
  {query}
</user_query>

<output_format>
  Return a JSON array of objects, each containing:
  - "index": original position (integer)
  - "score": relevance score (0-1 float)
  - "type": document type (string)
  - "sourceId": original source ID (string)
  
  Example:
  [
    {{"index": 2, "score": 0.95, "type": "document", "sourceId": "doc123"}},
    {{"index": 0, "score": 0.7, "type": "node", "sourceId": "node456"}}
  ]
</output_format>`
);

export const answerPrompt = ChatPromptTemplate.fromTemplate(
  `<system_context>
  You are an AI assistant in a collaboration workspace app called Colanode.

  CURRENT TIME: {currentTimestamp}
  WORKSPACE: {workspaceName}
  USER: {userName} ({userEmail})
</system_context>

<current_conversation_history>
  {formattedChatHistory}
</current_conversation_history>

<context>
  {formattedDocuments}
</context>

<user_query>
  {question}
</user_query>

<task>
  Based solely on the current conversation history and the relevant context above, provide a clear and professional answer to the user's query. 
  
  Pay attention to the metadata provided for each source (like creation date, author, path, document type, etc.) to:
  - Properly attribute information to its source
  - Consider the recency and relevance of the information
  - Understand the relationships between different content pieces
  - Recognize the context in which content was created or modified
  
  In your answer, include exact quotes from the provided context that support your answer.
  If the relevant context does not contain any information that answers the user's query, respond with "No relevant information found." This is a critical step to ensure correct answers.
</task>

<output_format>
  Return your response as a JSON object with the following structure:
  {{
    "answer": <your answer as a string>,
    "citations": [
      {{ "sourceId": <source id>, "quote": <exact quote from the context> }},
      ...
    ]
  }}
</output_format>`
);

export const intentRecognitionPrompt = PromptTemplate.fromTemplate(
  `<task>
  Determine if the following user query requires retrieving context from the workspace's knowledge base.
  You are a crucial decision point in an AI assistant system that must decide between:
  1. Retrieving and using specific context from the workspace ("retrieve")
  2. Answering directly from general knowledge ("no_context")
</task>

<context>
  This system has access to:
  - Documents and their embeddings
  - Node content (various types of workspace items)
  - Database records and their fields
  - Previous conversation history
</context>

<guidelines>
  Return "retrieve" when the query:
  - Asks about specific workspace content, documents, or data
  - References previous conversations or shared content
  - Mentions specific projects, tasks, or workspace items
  - Requires up-to-date information from the workspace
  - Contains temporal references to workspace activity
  - Asks about specific people or collaborators
  - Needs details about database records or fields

  Return "no_context" when the query:
  - Asks for general knowledge or common facts
  - Requests simple calculations or conversions
  - Asks about general concepts without workspace specifics
  - Makes small talk
  - Requests explanations of universal concepts
  - Can be answered correctly without workspace-specific information
</guidelines>

<examples>
  "retrieve" examples:
  - "What did John say about the API design yesterday?"
  - "Show me the latest documentation about user authentication"
  - "Find records in the Projects database where status is completed"
  - "What were the key points from our last meeting?"

  "no_context" examples:
  - "What is REST API?"
  - "How do I write a good commit message?"
  - "Convert 42 kilometers to miles"
  - "What's your name?"
  - "Explain what is Docker in simple terms"
</examples>

<conversation_history>
  {formattedChatHistory}
</conversation_history>

<user_query>
  {question}
</user_query>

<output_format>
  Return exactly one value: "retrieve" or "no_context"
</output_format>`
);

export const noContextPrompt = PromptTemplate.fromTemplate(
  `<task>
  Answer the following query concisely using general knowledge, without retrieving additional context. Return only the answer.
</task>

<conversation_history>
  {formattedChatHistory}
</conversation_history>

<user_query>
  {question}
</user_query>`
);

export const databaseFilterPrompt = ChatPromptTemplate.fromTemplate(
  `<task>
  You are an expert at analyzing natural language queries and converting them into structured database filters.
  
  Your task is to:
  1. Determine if this query is asking or makes sense to answer by filtering/searching databases
  2. If yes, generate appropriate filter attributes for each relevant database
  3. If no, return shouldFilter: false
</task>

<context>
  Available Databases:
  {databasesInfo}
</context>

<user_query>
  {query}
</user_query>

<guidelines>
  Only include databases that are relevant to the query.
  For each filter, use the exact field IDs from the database schema.
  Use appropriate operators based on field types.
</guidelines>

<output_format>
  Return a JSON object with:
  - shouldFilter: boolean
  - filters: array of objects with:
    - databaseId: string
    - filters: array of DatabaseViewFilterAttributes
  
  Example Response:
  {{
    "shouldFilter": true,
    "filters": [
      {{
        "databaseId": "db1",
        "filters": [
          {{
            "type": "field",
            "fieldId": "field1",
            "operator": "contains",
            "value": "search term"
          }}
        ]
      }}
    ]
  }}
</output_format>`
);

export const chunkSummarizationPrompt = PromptTemplate.fromTemplate(
  `<task>
  Generate a concise summary of the following text chunk that is part of a larger document. 
  This summary will be used to enhance vector search retrieval by providing additional context about this specific chunk.
</task>

<context>
  Content Type: {nodeType}
</context>

<guidelines>
  1. Create a brief (30-50 words) summary that captures the key points and main idea of the chunk
  2. Consider how this chunk fits into the overall document provided
  3. If the chunk appears to be part of a specific section, identify its role or purpose
  4. If the chunk contains structured data (like a database record), identify the type of information it represents
  5. Use neutral, descriptive language
  6. Consider the content type ("{nodeType}") when creating the summary - different types have different purposes:
     - "message": Communication content in a conversation
     - "page": Document-like content with structured information
     - "record": Database record with specific fields and values
     - Other types: Adapt your summary accordingly
</guidelines>

<complete_document>
  {fullText}
</complete_document>

<chunk_to_summarize>
  {chunk}
</chunk_to_summarize>

<output_format>
  Provide only the summary with no additional commentary or explanations.
</output_format>`
);
