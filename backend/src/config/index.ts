/**
 * Centralized configuration loader.
 * All environment variables are read once at startup and typed here.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(configDir, '../../.env');
const rootEnvPath = path.resolve(configDir, '../../../.env');

// Load backend/.env first so backend-specific AI provider keys win in local dev.
dotenv.config({ path: backendEnvPath, override: false });
dotenv.config({ path: rootEnvPath, override: false });

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev-key-change-me-16b',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://crmuser:password@localhost:5432/zalocrm',
  uploadDir: process.env.UPLOAD_DIR || '/var/lib/zalo-crm/files',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  aiDefaultProvider: process.env.AI_DEFAULT_PROVIDER || 'anthropic',
  aiDefaultModel: process.env.AI_DEFAULT_MODEL || 'claude-sonnet-4-6',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',

  /* Legacy keys (kept for backward compat) */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || '',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_AUTH_TOKEN || '',

  /* --- AI Provider configs --- */
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
  anthropicAuthToken: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || '',
  anthropicDefaultOpusModel: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || 'claude-3-opus-20240229',
  anthropicDefaultSonnetModel: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'claude-3-5-sonnet-20240620',
  anthropicDefaultHaikuModel: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'claude-3-haiku-20240307',

  geminiBaseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com',
  geminiAuthToken: process.env.GEMINI_AUTH_TOKEN || process.env.GEMINI_API_KEY || '',
  geminiDefaultProModel: process.env.GEMINI_DEFAULT_PRO_MODEL || 'gemini-1.5-pro',
  geminiDefaultFlashModel: process.env.GEMINI_DEFAULT_FLASH_MODEL || 'gemini-1.5-flash',

  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com',
  openaiAuthToken: process.env.OPENAI_AUTH_TOKEN || '',
  openaiDefaultGpt4oModel: process.env.OPENAI_DEFAULT_GPT4O_MODEL || 'gpt-4o',
  openaiDefaultGpt4oMiniModel: process.env.OPENAI_DEFAULT_GPT4O_MINI_MODEL || 'gpt-4o-mini',

  qwenBaseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com',
  qwenAuthToken: process.env.QWEN_AUTH_TOKEN || '',
  qwenDefaultPlusModel: process.env.QWEN_DEFAULT_PLUS_MODEL || 'qwen-plus',
  qwenDefaultTurboModel: process.env.QWEN_DEFAULT_TURBO_MODEL || 'qwen-turbo',
  qwenDefaultMaxModel: process.env.QWEN_DEFAULT_MAX_MODEL || 'qwen-max',

  kimiBaseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn',
  kimiAuthToken: process.env.KIMI_AUTH_TOKEN || '',
  kimiDefaultMoonshotV1Model: process.env.KIMI_DEFAULT_MOONSHOT_V1_MODEL || 'moonshot-v1-8k',

  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  openrouterAuthToken: process.env.OPENROUTER_AUTH_TOKEN || process.env.OPENROUTER_API_KEY || '',
  openrouterDefaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.7-sonnet',

  isProduction: process.env.NODE_ENV === 'production',
};
