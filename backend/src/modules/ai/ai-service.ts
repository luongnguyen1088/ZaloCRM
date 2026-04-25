import { prisma } from '../../shared/database/prisma-client.js';
import type { Prisma } from '@prisma/client';
import { config } from '../../config/index.js';
import { getProviderConfig, getAvailableProviders } from './provider-registry.js';
import { generateWithAnthropic } from './providers/anthropic.js';
import { generateWithGemini } from './providers/gemini.js';
import { generateWithOpenaiCompat, streamWithOpenaiCompat } from './providers/openai-compat.js';
import { buildReplyDraftPrompt } from './prompts/reply-draft.js';
import { buildSummaryPrompt } from './prompts/summary.js';
import { buildSentimentPrompt } from './prompts/sentiment.js';
import { buildCategorizePrompt } from './prompts/categorize.js';
import { getRelevantKnowledge, searchSemanticKnowledge } from './knowledge/knowledge-service.js';
import { getApprovedTopupTokensForWindow } from '../billing/payment-order-service.js';
import { buildProposeKnowledgeFixPrompt } from './prompts/propose-knowledge-fix.js';

export type AiTaskType = 'reply_draft' | 'summary' | 'sentiment' | 'categorize';

const OPENROUTER_HYBRID_MODELS: Record<AiTaskType | 'auto_reply', string> = {
  reply_draft: 'anthropic/claude-3-haiku',
  auto_reply: 'anthropic/claude-3-haiku',
  summary: 'anthropic/claude-3-haiku',
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

  if (!providerDef || (options.requireKey && !providerDef.authToken)) {
    const available = getAvailableProviders();
    if (available.length > 0) {
      const first = available[0];
      const fullDef = getProviderConfig(first.id);
      if (fullDef) {
        provider = first.id;
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
  feature: string;
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
      tokens: tokens,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      inputChars: input.inputText?.length,
      outputChars: input.outputText?.length,
      metadata: input.metadata ?? {},
    },
  });
}

export async function getAiConfig(orgId: string) {
  let aiConfig = await prisma.aiConfig.findUnique({ where: { orgId } });
  const platform = getPlatformAiProvider({ requireKey: false });
  const entitlement = await getAiEntitlement(orgId);
  
  if (!aiConfig) {
    aiConfig = {
      orgId,
      provider: platform.provider,
      model: platform.model,
      maxDaily: entitlement.maxTokens,
      enabled: true,
    } as any;
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
  try {
    const enabledValue = input.enabled !== undefined ? Boolean(input.enabled) : undefined;
    const platform = getPlatformAiProvider({ requireKey: false });
    const entitlement = await getAiEntitlement(orgId);

    const existing = await prisma.aiConfig.findUnique({ where: { orgId } });
    
    if (existing) {
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

    return await getAiConfig(orgId);
  } catch (err: any) {
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
  
  let targetModel = model;
  if (provider === 'openrouter' && !targetModel.includes('/')) {
    targetModel = `anthropic/${targetModel}`.replace('claude-sonnet-4-6', 'claude-3.5-sonnet');
  }

  try {
    if (provider === 'anthropic') return await generateWithAnthropic(baseUrl, apiKey, targetModel, system, prompt);
    if (provider === 'gemini') return await generateWithGemini(baseUrl, apiKey, targetModel, system, prompt);

    let endpoint = '/v1/chat/completions';
    if (provider === 'qwen') endpoint = '/compatible-mode/v1/chat/completions';
    if (provider === 'openrouter' || provider === 'kimi') endpoint = '/chat/completions';
    
    const fullUrl = `${baseUrl}${endpoint}`;
    return await generateWithOpenaiCompat(fullUrl, apiKey, targetModel, system, prompt);
  } catch (err: any) {
    const errorDetail = err?.response?.data || err.message || err;
    throw new Error(`AI Provider Error: ${JSON.stringify(errorDetail)}`);
  }
}

async function saveSuggestion(input: { 
  orgId: string; 
  conversationId: string; 
  messageId?: string; 
  type: string; 
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

  let model = platform.model;
  if (provider === 'openrouter') {
    if (currentConfig.planName === 'Enterprise' && input.type === 'reply_draft') {
      model = 'anthropic/claude-3.5-sonnet';
    } else {
      const modelKey = (input.type === 'reply_draft' && input.isAutoReply) ? 'auto_reply' : input.type;
      model = OPENROUTER_HYBRID_MODELS[modelKey] || model;
    }
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

  let knowledgeCtx = '';
  let sources: any[] = [];
  if (input.type === 'reply_draft') {
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

  const text = raw.trim().replace(/\*\*|__/g, '');

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

export async function generateAiOutputStreaming(input: { 
  orgId: string; 
  conversationId: string; 
  type: AiTaskType; 
  messageId?: string;
  customPrompt?: string;
  originalContent?: string;
  history?: MessageContext[];
  onChunk: (text: string) => void;
}) {
  const [currentConfig, conversation] = await Promise.all([
    getAiConfig(input.orgId),
    loadConversation(input.conversationId, input.orgId),
  ]);

  if (!currentConfig.enabled) throw new Error('AI is disabled');
  await assertAiTokenAvailable(input.orgId);
  
  const platform = getPlatformAiProvider({ requireKey: true });
  const provider = platform.provider;
  const apiKey = platform.apiKey;
  let model = platform.model;

  if (provider === 'openrouter') {
    if (currentConfig.planName === 'Enterprise' && input.type === 'reply_draft') {
      model = 'anthropic/claude-3.5-sonnet';
    } else {
      model = OPENROUTER_HYBRID_MODELS[input.type] || model;
    }
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

  let knowledgeCtx = '';
  let sources: any[] = [];
  if (input.type === 'reply_draft') {
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

  let fullText = '';
  await streamWithOpenaiCompat(
    provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : getProviderConfig(provider)?.baseUrl + '/chat/completions',
    apiKey,
    model,
    system,
    userPrompt,
    (chunk) => {
      fullText += chunk;
      input.onChunk(chunk);
    }
  );

  const text = fullText.trim().replace(/\*\*|__/g, '');

  // Post-stream cleanup and saving
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
    inputText: userPrompt,
    outputText: text,
    metadata: { conversationId: input.conversationId, messageId: input.messageId },
  });

  return { content: text, sources };
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
    return { title: content.substring(0, 30) + '...', category: 'Chung' };
  }
}

export async function proposeKnowledgeFix(orgId: string, input: { 
  question: string; 
  originalAnswer: string; 
  desiredAnswer: string;
  sourceIds?: string[];
}) {
  const currentConfig = await getAiConfig(orgId);
  if (!currentConfig.enabled) throw new Error('AI is disabled');
  await assertAiTokenAvailable(orgId);
  
  const platform = getPlatformAiProvider({ requireKey: true });
  const provider = platform.provider;
  const apiKey = platform.apiKey;
  let model = platform.model;

  if (provider === 'openrouter') {
    model = OPENROUTER_HYBRID_MODELS['categorize'] || model;
  }

  let existingContext = '';
  if (input.sourceIds && input.sourceIds.length > 0) {
    try {
      const sources = await prisma.aiKnowledge.findMany({
        where: { id: { in: input.sourceIds }, orgId: orgId },
        select: { id: true, title: true, content: true }
      });
      existingContext = sources.map(s => `[ID: ${s.id}] TITLE: ${s.title}\nCONTENT: ${s.content}`).join('\n\n');
    } catch (dbErr) {
      console.error('[AI Fix] DB Error fetching sources:', dbErr);
    }
  }

  const system = buildProposeKnowledgeFixPrompt();
  const userPrompt = [
    `USER QUESTION: ${input.question}`,
    `FLAWED AI ANSWER: ${input.originalAnswer}`,
    `USER DESIRED ANSWER: ${input.desiredAnswer}`,
    '',
    '--- EXISTING SOURCES USED ---',
    existingContext || 'None used/found.',
    '',
    'Task: Analyze the gap and propose a fix. If one of the existing sources is clearly responsible for the error, recommend UPDATING it by providing its ID. Otherwise, recommend CREATING a new source.',
  ].join('\n');

  const { text: raw, usage } = await generateText(provider, apiKey, model, system, userPrompt);
  
  await recordAiTokenUsage({
    orgId,
    feature: 'propose_fix',
    provider,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    inputText: userPrompt,
    outputText: raw,
  });

  try {
    return JSON.parse(raw) as { 
      title: string; 
      content: string; 
      category: string; 
      action: 'create' | 'update'; 
      targetId?: string;
      reason: string;
    };
  } catch (err) {
    return { 
      title: `Sửa lỗi: ${input.question.substring(0, 20)}`, 
      content: input.desiredAnswer, 
      category: 'Khác',
      action: 'create',
      reason: 'Failed to parse AI proposal'
    };
  }
}
