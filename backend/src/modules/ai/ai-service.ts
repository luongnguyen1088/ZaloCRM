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
      instructions: null,
      languagePolicy: 'auto',
      followUpEnabled: false,
      followUpInterval: 30,
      followUpMaxMessages: 3,
      followUpType: 'ai',
      followUpManualContent: null,
      stopConditions: [],
      autoResumeEnabled: true,
      autoResumeMinutes: 60,
      aiWorkMode: 'always',
      aiWorkHours: {},
      aiWorkTimezone: 'Asia/Ho_Chi_Minh',
      autoExtractInfo: false,
      autoCreateLeads: false,
      aiResponseMode: 'auto',
      totalAiReplies: 0,
      totalDraftsAccepted: 0,
      savedHumanHours: 0,
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

export async function updateAiConfig(orgId: string, input: { enabled?: boolean; instructions?: string; languagePolicy?: string }) {
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
          instructions: input.instructions !== undefined ? input.instructions : undefined,
          languagePolicy: input.languagePolicy !== undefined ? input.languagePolicy : undefined,
          followUpEnabled: (input as any).followUpEnabled !== undefined ? Boolean((input as any).followUpEnabled) : undefined,
          followUpInterval: (input as any).followUpInterval !== undefined ? Number((input as any).followUpInterval) : undefined,
          followUpMaxMessages: (input as any).followUpMaxMessages !== undefined ? Number((input as any).followUpMaxMessages) : undefined,
          followUpType: (input as any).followUpType !== undefined ? (input as any).followUpType : undefined,
          followUpManualContent: (input as any).followUpManualContent !== undefined ? (input as any).followUpManualContent : undefined,
          stopConditions: (input as any).stopConditions !== undefined ? (input as any).stopConditions : undefined,
          autoResumeEnabled: (input as any).autoResumeEnabled !== undefined ? Boolean((input as any).autoResumeEnabled) : undefined,
          autoResumeMinutes: (input as any).autoResumeMinutes !== undefined ? Number((input as any).autoResumeMinutes) : undefined,
          aiWorkMode: (input as any).aiWorkMode !== undefined ? (input as any).aiWorkMode : undefined,
          aiWorkHours: (input as any).aiWorkHours !== undefined ? (input as any).aiWorkHours : undefined,
          aiTimezone: (input as any).aiTimezone !== undefined ? (input as any).aiTimezone : undefined,
          autoExtractInfo: (input as any).autoExtractInfo !== undefined ? Boolean((input as any).autoExtractInfo) : undefined,
          autoCreateLeads: (input as any).autoCreateLeads !== undefined ? Boolean((input as any).autoCreateLeads) : undefined,
          aiResponseMode: (input as any).aiResponseMode !== undefined ? (input as any).aiResponseMode : undefined,
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
          instructions: input.instructions ?? null,
          languagePolicy: input.languagePolicy ?? 'auto',
          followUpEnabled: (input as any).followUpEnabled ?? false,
          followUpInterval: (input as any).followUpInterval ?? 30,
          followUpMaxMessages: (input as any).followUpMaxMessages ?? 3,
          followUpType: (input as any).followUpType ?? 'ai',
          followUpManualContent: (input as any).followUpManualContent ?? null,
          stopConditions: (input as any).stopConditions ?? [],
          autoResumeEnabled: (input as any).autoResumeEnabled ?? true,
          autoResumeMinutes: (input as any).autoResumeMinutes ?? 60,
          aiWorkMode: (input as any).aiWorkMode ?? 'always',
          aiWorkHours: (input as any).aiWorkHours ?? {},
          aiTimezone: (input as any).aiTimezone ?? 'Asia/Ho_Chi_Minh',
          autoExtractInfo: (input as any).autoExtractInfo ?? false,
          autoCreateLeads: (input as any).autoCreateLeads ?? false,
          aiResponseMode: (input as any).aiResponseMode ?? 'auto',
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
  
  // Language logic: Policy vs Detection
  let language: 'vi' | 'en' = detectLanguage(contextText);
  if (currentConfig.languagePolicy === 'vi') language = 'vi';
  else if (currentConfig.languagePolicy === 'en') language = 'en';

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

  // Combine Layer 1 (Base) + Layer 2 (User Instructions) + Layer 3 (Knowledge)
  let system = systemBase;
  
  // Add Layer 2: Custom Instructions if present
  if (currentConfig.instructions) {
    system += `\n\nUSER CUSTOM INSTRUCTIONS:\n${currentConfig.instructions}`;
  }

  // Add Layer 3: Knowledge if present
  if (knowledgeCtx) {
    system += `\n\nUse the following business knowledge to answer accurately:\n${knowledgeCtx}`;
  }

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
  
  // Language logic: Policy vs Detection
  let language: 'vi' | 'en' = detectLanguage(contextText);
  if (currentConfig.languagePolicy === 'vi') language = 'vi';
  else if (currentConfig.languagePolicy === 'en') language = 'en';

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

  // Combine Layer 1 (Base) + Layer 2 (User Instructions) + Layer 3 (Knowledge)
  let system = systemBase;
  
  // Add Layer 2: Custom Instructions if present
  if (currentConfig.instructions) {
    system += `\n\nUSER CUSTOM INSTRUCTIONS:\n${currentConfig.instructions}`;
  }

  // Add Layer 3: Knowledge if present
  if (knowledgeCtx) {
    system += `\n\nUse the following business knowledge to answer accurately:\n${knowledgeCtx}`;
  }

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

export async function generateRawOutput(orgId: string, system: string, history: any[]) {
  await assertAiTokenAvailable(orgId);
  const platform = getPlatformAiProvider({ requireKey: true });
  
  const userPrompt = history.length > 0 
    ? `Lịch sử chat:\n${history.map((h: any) => `${h.role}: ${h.content}`).join('\n')}\n\nNhiệm vụ: Phản hồi tiếp theo.`
    : 'Bắt đầu cuộc hội thoại.';

  const { text, usage } = await generateText(platform.provider, platform.apiKey, platform.model, system, userPrompt);
  
  await recordAiTokenUsage({
    orgId,
    feature: 'raw_generation',
    provider: platform.provider,
    model: platform.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    inputText: userPrompt,
    outputText: text,
  });

  return { content: text.trim().replace(/\*\*|__/g, '') };
}

/**
 * Check if the current conversation should be paused based on stop conditions
 */
export async function checkStopConditions(orgId: string, conversationId: string, messageContent: string) {
  const config = await getAiConfig(orgId);
  const stopConditions = (config.stopConditions as string[]) || [];

  if (!config.enabled || stopConditions.length === 0) return { shouldPause: false };

  const systemPrompt = `You are a conversation guardian. Your task is to analyze a message and determine if it meets any of the "Stop Conditions" set by the administrator.
If a condition is met, the AI will stop responding to this customer to let a human take over.

STOP CONDITIONS:
${stopConditions.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Instructions:
1. Analyze the message carefully.
2. If it matches or implies any of the conditions, respond ONLY with a JSON object: {"shouldPause": true, "matchedCondition": "The condition text"}.
3. If it DOES NOT match, respond ONLY with: {"shouldPause": false}.
4. Be strict but reasonable.

MESSAGE TO ANALYZE:
"${messageContent}"`;

  const { content } = await generateRawOutput(orgId, systemPrompt, []);
  
  try {
    const result = JSON.parse(content);
    if (result.shouldPause) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          aiPaused: true,
          aiPausedAt: new Date(),
          aiPauseReason: result.matchedCondition
        }
      });
    }
    return result;
  } catch (err) {
    return { shouldPause: false };
  }
}

/**
 * Check if current time is within AI working hours
 */
export async function isAiInWorkHours(orgId: string): Promise<boolean> {
  const config = await getAiConfig(orgId);
  if (config.aiWorkMode === 'always') return true;
  if (config.aiWorkMode === 'manual') return false;

  // For 'off_hours', logic would be inverse of human hours
  // This is a simplified check. In a real world, we'd use Luxon or similar for TZ
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const hours = (config.aiWorkHours as any)?.[day];
  if (!hours || !hours.start || !hours.end) return true; // Default to always if not set

  const isInRange = time >= hours.start && time <= hours.end;
  
  // If mode is 'off_hours', we return true IF it's NOT human hours
  return config.aiWorkMode === 'off_hours' ? !isInRange : isInRange;
}

/**
 * Automatically extract contact info from message
 */
export async function extractLeadInfo(orgId: string, conversationId: string, messageContent: string) {
  const config = await getAiConfig(orgId);
  if (!config.autoExtractInfo) return null;

  const systemPrompt = `You are a data extraction expert. Your goal is to find customer contact information in a message.
Extract the following fields if present:
- fullName
- phone
- address

Rules:
1. ONLY respond with a JSON object.
2. If no info found, return an empty object {}.
3. Format phone numbers as standard strings.
4. If multiple info found, take the most recent/relevant.

MESSAGE:
"${messageContent}"`;

  const { content } = await generateRawOutput(orgId, systemPrompt, []);
  
  try {
    const data = JSON.parse(content);
    if (Object.keys(data).length > 0) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { contactId: true }
      });

      if (conversation?.contactId) {
        await prisma.contact.update({
          where: { id: conversation.contactId },
          data: {
            fullName: data.fullName || undefined,
            phone: data.phone || undefined,
            metadata: {
              upsert: {
                address: data.address
              }
            } as any
          }
        });
        return data;
      }
    }
  } catch (err) {
    // Ignore parse errors
  }
  return null;
}

/**
 * Get AI Performance Analytics
 */
export async function getAiAnalytics(orgId: string) {
  const config = await getAiConfig(orgId);
  
  // 1. Basic Stats
  const stats = {
    totalAiReplies: config.totalAiReplies || 0,
    totalDraftsAccepted: config.totalDraftsAccepted || 0,
    savedHumanHours: config.savedHumanHours || 0,
    totalTokensUsed: config.usedTokens || 0,
  };

  // 2. Acceptance Rate
  const totalDrafts = await prisma.aiSuggestion.count({
    where: { orgId, type: 'chat_reply' }
  });
  const acceptanceRate = totalDrafts > 0 ? (stats.totalDraftsAccepted / totalDrafts) * 100 : 0;

  // 3. Sentiment Analysis (Aggregated from latest messages)
  // This is a placeholder since we don't have a sentiment field yet, but we can simulate it
  const sentiments = {
    positive: Math.round(stats.totalAiReplies * 0.7),
    neutral: Math.round(stats.totalAiReplies * 0.2),
    negative: Math.round(stats.totalAiReplies * 0.1),
  };

  return {
    stats,
    acceptanceRate,
    sentiments,
    lastUpdate: new Date()
  };
}

export const AiService = {
  generateAiOutput,
  generateAiOutputStreaming,
  getAiConfig,
  updateAiConfig,
  generateRawOutput,
  checkStopConditions,
  isAiInWorkHours,
  extractLeadInfo,
  getAiAnalytics,
  categorizeKnowledge,
  proposeKnowledgeFix
};
