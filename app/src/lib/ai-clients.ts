/**
 * AI Clients — OpenAI SDK setup and shared helper functions.
 *
 * Provides a singleton OpenAI client, embedding generation,
 * and a chat-completion wrapper with retry logic and cost tracking.
 */

import OpenAI from 'openai';

// ─── Model Constants ────────────────────────────────────────────────────────

/** Fast / cheap model for extraction and structured parsing tasks. */
export const FAST_MODEL = 'gpt-4o-mini' as const;

/** Reasoning model for analysis, feedback, and rewrite tasks. */
export const REASONING_MODEL = 'gpt-4o' as const;

/** Embedding model (1536 dimensions, maps to pgvector vector(1536)). */
export const EMBEDDING_MODEL = 'text-embedding-3-small' as const;

/** Embedding dimensions — must match pgvector column size. */
export const EMBEDDING_DIMENSIONS = 1536 as const;

// ─── Cost Constants (dollars per 1 000 tokens) ──────────────────────────────

const COST_TABLE: Record<string, { inputPerMToken: number; outputPerMToken: number }> = {
  [FAST_MODEL]: {
    inputPerMToken: 0.15,
    outputPerMToken: 0.6,
  },
  [REASONING_MODEL]: {
    inputPerMToken: 2.5,
    outputPerMToken: 10.0,
  },
  [EMBEDDING_MODEL]: {
    inputPerMToken: 0.02,
    outputPerMToken: 0,
  },
};

// ─── Singleton Client ───────────────────────────────────────────────────────

let _client: OpenAI | null = null;

/**
 * Return a singleton OpenAI client.
 * Reads `OPENAI_API_KEY` from the environment.
 */
export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Add it to your .env.local file.',
      );
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// ─── Embedding ──────────────────────────────────────────────────────────────

/**
 * Generate an embedding vector for a piece of text.
 *
 * @param text - Input text to embed.
 * @returns    - Float array of length EMBEDDING_DIMENSIONS.
 * @throws     - On API error or empty response.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text.');
  }

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const embedding = response.data[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error('OpenAI returned an empty embedding vector.');
  }

  return embedding;
}

// ─── Chat Completion ────────────────────────────────────────────────────────

/** Options for the chatCompletion wrapper. */
export interface ChatCompletionOptions {
  /** Model override (defaults to FAST_MODEL). */
  model?: string;
  /** Temperature (0.0-2.0). Default 0.2 for structured extraction. */
  temperature?: number;
  /** Max output tokens. */
  max_tokens?: number;
  /** Response format hint (e.g., { type: 'json_object' }). */
  response_format?: { type: 'json_object' };
  /** Request timeout in milliseconds. Default 60 000. */
  timeout_ms?: number;
}

/** Return type from chatCompletion. */
export interface ChatCompletionResult {
  /** The model's text response. */
  content: string;
  /** Number of input tokens consumed. */
  prompt_tokens: number;
  /** Number of output tokens generated. */
  completion_tokens: number;
  /** Total tokens (prompt + completion). */
  total_tokens: number;
  /** Estimated cost in US dollars. */
  cost_usd: number;
  /** Which model was actually used. */
  model: string;
}

/**
 * Send a chat completion request with retry logic and cost tracking.
 *
 * Retries once on transient 429 / 500 / 503 errors with exponential back-off.
 *
 * @param messages - Chat messages array (system + user).
 * @param options  - Override model, temperature, etc.
 * @returns        - Response content plus token/cost metadata.
 */
export async function chatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: ChatCompletionOptions = {},
): Promise<ChatCompletionResult> {
  const client = getOpenAIClient();
  const model = options.model ?? FAST_MODEL;
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.max_tokens,
          response_format: options.response_format,
        },
        {
          timeout: options.timeout_ms ?? 60_000,
        },
      );

      const choice = response.choices[0];
      const usage = response.usage;

      if (!choice?.message?.content) {
        throw new Error('OpenAI returned an empty response (no content in choices).');
      }

      const promptTokens = usage?.prompt_tokens ?? 0;
      const completionTokens = usage?.completion_tokens ?? 0;

      // Calculate cost
      const costInfo = COST_TABLE[model] ?? COST_TABLE[FAST_MODEL];
      const costUsd =
        (promptTokens * costInfo.inputPerMToken) / 1_000_000 +
        (completionTokens * costInfo.outputPerMToken) / 1_000_000;

      return {
        content: choice.message.content,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        cost_usd: Math.round(costUsd * 10_000) / 10_000, // 4 decimal places
        model: response.model ?? model,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry on transient errors
      const isTransient =
        lastError.message.includes('429') ||
        lastError.message.includes('500') ||
        lastError.message.includes('503') ||
        lastError.message.includes('rate_limit') ||
        lastError.message.includes('ECONNRESET');

      if (!isTransient || attempt === maxRetries) {
        break;
      }

      // Exponential back-off: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `Chat completion failed after ${maxRetries + 1} attempts: ${lastError?.message ?? 'unknown error'}`,
  );
}

// ─── Cost Estimation Utilities ──────────────────────────────────────────────

/** Estimated cost in cents for each pipeline step. */
export const STEP_COST_ESTIMATES: Record<string, number> = {
  parse_resume: 0.1,       // ~$0.001 — local extraction, fallback only
  extract_skills: 1.7,     // ~$0.017
  jd_parse: 0.8,           // ~$0.008
  embedding_resume: 0.02,  // ~$0.0002
  embedding_jd: 0.01,      // ~$0.0001
  match: 0,                // pgvector is free
  gap_analysis: 1.5,       // ~$0.015
  feedback: 3.0,           // ~$0.03
  rewrite: 4.3,            // ~$0.043
};

/**
 * Estimate cost in cents for a named pipeline step.
 *
 * @param stepName - Step identifier (e.g. 'extract_skills').
 * @returns        - Estimated cost in cents.
 */
export function estimateCostForStep(stepName: string): number {
  return STEP_COST_ESTIMATES[stepName] ?? 0;
}
