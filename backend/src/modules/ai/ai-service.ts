import { prisma } from '../../shared/database/prisma-client.js';
import type { Prisma } from '@prisma/client';
import { config } from '../../config/index.js';
import { getProviderConfig, getAvailableProviders } from './provider-registry.js';
import { generateWithAnthropic } from './providers/anthropic.js';
import { generateWithGemini } from './providers/gemini.js';
import { generateWithOpenaiCompat } from './providers/openai-compat.js';
import { buildReplyDraftPrompt } from './prompts/reply-draft.js';
import { buildSummaryPrompt } from './prompts/summary.js';
import { buildSentimentPrompt } from './prompts/sentiment.js';
import { buildCategorizePrompt } from './prompts/categorize.js';
import { getRelevantKnowledge, searchSemanticKnowledge } from './knowledge/knowledge-service.js';
import { getApprovedTopupTokensForWindow } from '../billing/payment-order-service.js';
import { buildProposeKnowledgeFixPrompt } from './prompts/propose-knowledge-fix.js';

export type AiTaskType = 'reply_draft' | 'summary' | 'sentiment' | 'categorize';

/**
 * Hybrid model mapping for OpenRouter.
 * We use specialized models for each task to balance speed, cost, and quality.
 */
const OPENROUTER_HYBRID_MODELS: Record<AiTaskType | 'auto_reply', string> = {
  reply_draft: 'google/gemini-2.0-flash-001',   // Reliable Flash
  auto_reply: 'google/gemini-2.0-flash-001',    // Using Flash for auto-reply too for debugging
  summary: 'google/gemini-2.0-flash-001',
  sentiment: 'openai/gpt-4o-mini',
  categorize: 'openai/gpt-4o',
};

type MessageContext = { senderType: string; senderName: string | null; content: string | null; sentAt: Date };
type SentimentResult = { label: 'positive' | 'neutral' | 'negative'; confidence: number; reason: string };

function detectLanguage(text: string): 'vi' | 'en' {
  if (/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text)) return 'vi';
  const vietnameseHints = [' khách ', ' chào ', ' tư vấn ', ' báo giá ', ' sản phẩm ', ' giúp ', ' nhé ', ' không '];
  return vietnameseHints.some((hint) => (` ${text.toLowerCase()} `).includes(hint)) ? 'vi' : 'en';
}

function escapeXmlBoundary(text: string): string {
  return text.replace(/<\/?conversation_context>/gi, '');
}

function buildConversationContext(messages: MessageContext[]) {
  return messages
    .map((msg) => {
      const author = msg.senderType === 'self' ? 'staff' : (msg.senderName || 'customer');
      const content = escapeXmlBoundary(msg.content || '(empty)');
      const sentAt = msg.sentAt instanceof Date ? msg.sentAt : new Date(msg.sentAt);
      const timeStr = isNaN(sentAt.getTime()) ? 'Unknown' : sentAt.toISOString();
      return `[${timeStr}] ${author}: ${content}`;
    })
    .join('\n');
}

const FALLBACK_AI_TOKENS = 100000;

function getBillingPeriodFallback() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { periodStart, periodEnd };
}

async function getAiEntitlement(orgId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
    include: { plan: true },
  });
  const fallback = getBillingPeriodFallback();
  const periodStart = subscription?.currentPeriodStart ?? fallback.periodStart;
  const periodEnd = subscription?.currentPeriodEnd ?? fallback.periodEnd;
  const maxTokens = subscription?.status === 'active'
    ? subscription.plan.maxAiTokens
    : FALLBACK_AI_TOKENS;
  const topupTokens = await getApprovedTopupTokensForWindow(orgId, periodStart, periodEnd);
  const totalTokens = maxTokens + topupTokens;

  const aggregate = await prisma.aiTokenUsage.aggregate({
    where: {
      orgId,
      createdAt: { gte: periodStart, lt: periodEnd },
    },
    _sum: { tokens: true },
  });

  const usedTokens = aggregate._sum.tokens ?? 0;
  return {
    planName: subscription?.plan.name ?? 'Free',
    periodStart,
    periodEnd,
    maxTokens: totalTokens,
    baseTokens: maxTokens,
    topupTokens,
    usedTokens,
    remainingTokens: Math.max(0, totalTokens - usedTokens),
  };
}

function getPlatformAiProvider(options: { requireKey?: boolean } = {}) {
  let provider = config.aiDefaultProvider.toLowerCase();
  let model = config.aiDefaultModel;
  let providerDef = getProviderConfig(provider);

  // Fallback: If default provider is missing or has no key, find any available provider
  if (!providerDef || (options.requireKey && !providerDef.authToken)) {
    const available = getAvailableProviders();
    if (available.length > 0) {
      const first = available[0];
      const fullDef = getProviderConfig(first.id);
      if (fullDef) {
        provider = first.id;
        // Use the first model of the fallback provider
        model = first.models[0]?.value || model;
        providerDef = fullDef;
      }
    }
  }

  if (!providerDef) throw new Error('Platform AI provider is not configured');
  if (options.requireKey && !providerDef.authToken) throw new Error('Platform AI provider key is not configured');
  if (!model) throw new Error('Platform AI model is not configured');
  return { provider, model, apiKey: providerDef.authToken, keyConfigured: Boolean(providerDef.authToken) };
}

async function assertAiTokenAvailable(orgId: string) {
  const usage = await getAiEntitlement(orgId);
  if (usage.remainingTokens <= 0) throw new Error('AI tokens quota exceeded');
  return usage;
}

function calculateAiTokens(inputTokens: number, outputTokens: number): number {
  return inputTokens + outputTokens;
}

async function recordAiTokenUsage(input: {
  orgId: string;
  feature: AiTaskType;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  inputText?: string;
  outputText?: string;
  metadata?: Prisma.InputJsonObject;
}) {
  const tokens = calculateAiTokens(input.inputTokens || 0, input.outputTokens || 0);

  return prisma.aiTokenUsage.create({
    data: {
      orgId: input.orgId,
      feature: input.feature,
      provider: input.provider,
      model: input.model,
      tokens: tokens, // We use the tokens column to store token count
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      inputChars: input.inputText?.length,
      outputChars: input.outputText?.length,
      metadata: input.metadata ?? {},
    },
  });
}

export async function getAiConfig(orgId: string) {
  console.log(`[AI Settings] FETCHING config for orgId: "${orgId}"`);
  
  let aiConfig = await prisma.aiConfig.findUnique({ where: { orgId } });
  const platform = getPlatformAiProvider({ requireKey: false });
  const entitlement = await getAiEntitlement(orgId);
  
  if (!aiConfig) {
    console.log(`[AI Settings] WARNING: No config found in DB for org "${orgId}". Returning in-memory defaults.`);
    aiConfig = {
      orgId,
      provider: platform.provider,
      model: platform.model,
      maxDaily: entitlement.maxTokens,
      enabled: true,
    } as any;
  } else {
    console.log(`[AI Settings] Found config in DB:`, JSON.stringify(aiConfig));
  }

  const finalConfig = aiConfig as any;
  return { 
    ...finalConfig, 
    provider: finalConfig.provider || platform.provider,
    model: finalConfig.model || platform.model,
    maxDaily: entitlement.maxTokens,
    managed: true,
    billingMode: 'platform_managed',
    platformKeyConfigured: platform.keyConfigured,
    availableProviders: getAvailableProviders(),
    planName: entitlement.planName,
    usedTokens: entitlement.usedTokens,
    maxTokens: entitlement.maxTokens,
    remainingTokens: entitlement.remainingTokens,
    periodStart: entitlement.periodStart,
    periodEnd: entitlement.periodEnd,
  };
}

export async function updateAiConfig(orgId: string, input: { enabled?: boolean }) {
  console.log(`[AI Settings] Updating config for org ${orgId}:`, JSON.stringify(input));

  try {
    const enabledValue = input.enabled !== undefined ? Boolean(input.enabled) : undefined;
    const platform = getPlatformAiProvider({ requireKey: false });
    const entitlement = await getAiEntitlement(orgId);

    // Use explicit check to ensure we know if record exists
    const existing = await prisma.aiConfig.findUnique({ where: { orgId } });
    
    if (existing) {
      console.log(`[AI Settings] Updating existing config...`);
      await prisma.aiConfig.update({
        where: { orgId },
        data: {
          provider: platform.provider,
          model: platform.model,
          maxDaily: entitlement.maxTokens,
          enabled: enabledValue,
        }
      });
    } else {
      console.log(`[AI Settings] Creating new config...`);
      await prisma.aiConfig.create({
        data: {
          orgId,
          provider: platform.provider,
          model: platform.model,
          maxDaily: entitlement.maxTokens,
          enabled: enabledValue ?? true,
        }
      });
    }

    const finalConfig = await getAiConfig(orgId);
    console.log(`[AI Settings] Success! Final state:`, JSON.stringify(finalConfig));
    return finalConfig;
  } catch (err: any) {
    console.error(`[AI Settings ERROR] Failed to update config:`, err);
    throw new Error(`Database error: ${err.message}`);
  }
}

export async function getAiUsage(orgId: string) {
  const currentConfig = await getAiConfig(orgId);
  const entitlement = await getAiEntitlement(orgId);
  return {
    usedToday: entitlement.usedTokens,
    maxDaily: entitlement.maxTokens,
    remaining: entitlement.remainingTokens,
    usedTokens: entitlement.usedTokens,
    maxTokens: entitlement.maxTokens,
    remainingTokens: entitlement.remainingTokens,
    planName: entitlement.planName,
    periodStart: entitlement.periodStart,
    periodEnd: entitlement.periodEnd,
    enabled: Boolean(currentConfig.enabled),
  };
}

export async function getAiUsageHistory(orgId: string, limit = 50) {
  return prisma.aiTokenUsage.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

async function loadConversation(conversationId: string, orgId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, orgId },
    include: {
      contact: { select: { fullName: true } },
      messages: {
        where: { isDeleted: false },
        orderBy: { sentAt: 'desc' },
        take: 40,
        select: { senderType: true, senderName: true, content: true, sentAt: true },
      },
    },
  });
  if (!conversation) throw new Error('Conversation not found');
  return { ...conversation, messages: [...conversation.messages].reverse() };
}

async function generateText(provider: string, apiKey: string, model: string, system: string, prompt: string) {
  const providerDef = getProviderConfig(provider);
  const baseUrl = providerDef?.baseUrl?.replace(/\/$/, '') || '';
  
  // OpenRouter requires model names in provider/model-name format
  let targetModel = model;
  if (provider === 'openrouter' && !targetModel.includes('/')) {
    targetModel = `anthropic/${targetModel}`.replace('claude-sonnet-4-6', 'claude-3.5-sonnet');
  }

  console.log(`[AI] Generating text with ${provider} using model ${targetModel}`);
  
  try {
    if (provider === 'anthropic') return await generateWithAnthropic(baseUrl, apiKey, targetModel, system, prompt);
    if (provider === 'gemini') return await generateWithGemini(baseUrl, apiKey, targetModel, system, prompt);

    /* OpenAI-compatible providers */
    let endpoint = '/v1/chat/completions';
    if (provider === 'qwen') endpoint = '/compatible-mode/v1/chat/completions';
    if (provider === 'openrouter' || provider === 'kimi') endpoint = '/chat/completions';
    
    const fullUrl = `${baseUrl}${endpoint}`;
    return await generateWithOpenaiCompat(fullUrl, apiKey, targetModel, system, prompt);
  } catch (err: any) {
    const errorDetail = err?.response?.data || err.message || err;
    console.error(`[AI ERROR] Provider ${provider} failed:`, JSON.stringify(errorDetail));
    // Re-throw with more context to help the API response
    throw new Error(`AI Provider Error: ${JSON.stringify(errorDetail)}`);
  }
}

async function saveSuggestion(input: { 
  orgId: string; 
  conversationId: string; 
  messageId?: string; 
  type: AiTaskType; 
  content: string; 
  confidence: number;
  metadata?: any;
}) {
  return prisma.aiSuggestion.create({
    data: {
      orgId: input.orgId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      type: input.type,
      content: input.content,
      confidence: input.confidence,
      metadata: input.metadata || {},
    },
  });
}

export async function generateAiOutput(input: { 
  orgId: string; 
  conversationId: string; 
  type: AiTaskType; 
  messageId?: string;
  customPrompt?: string;
  originalContent?: string;
  isAutoReply?: boolean;
  history?: MessageContext[];
}) {
  const [currentConfig, conversation] = await Promise.all([
    getAiConfig(input.orgId),
    loadConversation(input.conversationId, input.orgId),
  ]);

  if (!currentConfig.enabled) throw new Error('AI is disabled for this organization');

  await assertAiTokenAvailable(input.orgId);
  const platform = getPlatformAiProvider({ requireKey: true });
  const provider = platform.provider;
  const apiKey = platform.apiKey;

  // Determine which model to use based on the task and provider
  let model = platform.model;
  if (provider === 'openrouter') {
    const modelKey = (input.type === 'reply_draft' && input.isAutoReply) ? 'auto_reply' : input.type;
    model = OPENROUTER_HYBRID_MODELS[modelKey] || model;
  }

  const messages = input.history || conversation.messages;
  const contextText = buildConversationContext(messages);
  const language = detectLanguage(contextText);
  const customerName = conversation.contact?.fullName || 'customer';
  
  let userPrompt = [
    `<conversation_context>`,
    `Customer: ${customerName}`,
    contextText,
    `</conversation_context>`,
  ].join('\n');

  if (input.originalContent) {
    userPrompt += `\n\n<current_draft>\n${input.originalContent}\n</current_draft>\nRefine the above draft based on the instruction.`;
  }

  if (input.customPrompt) {
    userPrompt += `\n\n<instruction>\n${input.customPrompt}\n</instruction>`;
  }

  // Fetch relevant knowledge if this is a reply draft
  let knowledgeCtx = '';
  let sources: any[] = [];
  if (input.type === 'reply_draft') {
    // Determine search query from last contact message or custom prompt
    const lastContactMsg = [...messages].reverse().find(m => m.senderType === 'contact');
    const searchQuery = lastContactMsg?.content || input.customPrompt || '';
    
    const knowledgeItems = searchQuery 
      ? await searchSemanticKnowledge(input.orgId, searchQuery, conversation.zaloAccountId)
      : await getRelevantKnowledge(input.orgId, conversation.zaloAccountId);

    sources = knowledgeItems.map(k => ({ id: k.id, title: k.title }));
    if (knowledgeItems.length > 0) {
      knowledgeCtx = [
        '\n<business_knowledge>',
        ...knowledgeItems.map(k => `[${k.title}]: ${k.content}`),
        '</business_knowledge>',
      ].join('\n');
    }
  }

  const systemBase = input.type === 'reply_draft'
    ? buildReplyDraftPrompt(language)
    : input.type === 'summary'
      ? buildSummaryPrompt(language)
      : buildSentimentPrompt(language);

  const system = knowledgeCtx ? `${systemBase}\nUse the following business knowledge to answer accurately:\n${knowledgeCtx}` : systemBase;

  const { text: raw, usage } = await generateText(provider, apiKey, model, system, userPrompt);

  if (input.type === 'sentiment') {
    let parsed: SentimentResult;
    try {
      parsed = JSON.parse(raw) as SentimentResult;
    } catch {
      parsed = { label: 'neutral', confidence: 0.4, reason: raw };
    }
    const normalized = {
      label: ['positive', 'negative', 'neutral'].includes(parsed.label) ? parsed.label : 'neutral',
      confidence: Number.isFinite(parsed.confidence) ? Math.max(0, Math.min(1, parsed.confidence)) : 0.4,
      reason: parsed.reason || raw,
    };
    await saveSuggestion({
      orgId: input.orgId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      type: 'sentiment',
      content: JSON.stringify(normalized),
      confidence: normalized.confidence,
    });
    await recordAiTokenUsage({
      orgId: input.orgId,
      feature: 'sentiment',
      provider,
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      inputText: userPrompt,
      outputText: raw,
      metadata: { conversationId: input.conversationId, messageId: input.messageId },
    });
    return normalized;
  }

  // Post-processing to strip markdown bold symbols (**, __)
  const text = raw.trim().replace(/\*\*|__/g, '');

  // Persist summary to conversation if type is summary
  if (input.type === 'summary') {
    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        summary: text,
        summaryUpdatedAt: new Date(),
      },
    });
  }

  await saveSuggestion({
    orgId: input.orgId,
    conversationId: input.conversationId,
    messageId: input.messageId,
    type: input.type,
    content: text,
    confidence: 1.0,
    metadata: { sources },
  });
  await recordAiTokenUsage({
    orgId: input.orgId,
    feature: input.type,
    provider,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    inputText: userPrompt,
    outputText: text,
    metadata: { conversationId: input.conversationId, messageId: input.messageId },
  });
  return { content: text, confidence: 1.0, sources };
}

export async function categorizeKnowledge(orgId: string, content: string) {
  const currentConfig = await getAiConfig(orgId);
  if (!currentConfig.enabled) throw new Error('AI is disabled for this organization');
  await assertAiTokenAvailable(orgId);
  const platform = getPlatformAiProvider({ requireKey: true });
  const provider = platform.provider;
  const apiKey = platform.apiKey;
  let model = platform.model;

  if (provider === 'openrouter') {
    model = OPENROUTER_HYBRID_MODELS['categorize'] || model;
  }

  const system = buildCategorizePrompt();
  const { text: raw, usage } = await generateText(provider, apiKey, model, system, content);
  await recordAiTokenUsage({
    orgId,
    feature: 'categorize',
    provider,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    inputText: content,
    outputText: raw,
  });

  try {
    return JSON.parse(raw) as { title: string; category: string };
  } catch (err) {
    console.error('[AI Categorize Error] Failed to parse JSON:', raw);
    return { title: content.substring(0, 30) + '...', category: 'Chung' };
  }
}
export async function proposeKnowledgeFix(orgId: string, input: { question: string; originalAnswer: string; desiredAnswer: string }) {
  const currentConfig = await getAiConfig(orgId);
  if (!currentConfig.enabled) throw new Error('AI is disabled');
  await assertAiTokenAvailable(orgId);
  const platform = getPlatformAiProvider({ requireKey: true });
  const provider = platform.provider;
  const apiKey = platform.apiKey;
  let model = platform.model;

  if (provider === 'openrouter') {
    model = OPENROUTER_HYBRID_MODELS['categorize'] || model; // Use the same smart model as categorize
  }

  const system = buildProposeKnowledgeFixPrompt();
  const userPrompt = [
    `USER QUESTION: ${input.question}`,
    `FLAWED AI ANSWER: ${input.originalAnswer}`,
    `USER DESIRED ANSWER: ${input.desiredAnswer}`,
    '',
    'Based on this, propose a knowledge base entry that fixes the error.',
  ].join('\n');

  const { text: raw, usage } = await generateText(provider, apiKey, model, system, userPrompt);
  await recordAiTokenUsage({
    orgId,
    feature: 'categorize',
    provider,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    inputText: userPrompt,
    outputText: raw,
  });

  try {
    return JSON.parse(raw) as { title: string; content: string; category: string };
  } catch (err) {
    return { title: `Sửa lỗi: ${input.question.substring(0, 20)}`, content: input.desiredAnswer, category: 'Khác' };
  }
}
