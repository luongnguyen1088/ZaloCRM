import { prisma } from '../../shared/database/prisma-client.js';
import { config } from '../../config/index.js';
import { getProviderConfig, getAvailableProviders } from './provider-registry.js';
import { generateWithAnthropic } from './providers/anthropic.js';
import { generateWithGemini } from './providers/gemini.js';
import { generateWithOpenaiCompat } from './providers/openai-compat.js';
import { buildReplyDraftPrompt } from './prompts/reply-draft.js';
import { buildSummaryPrompt } from './prompts/summary.js';
import { buildSentimentPrompt } from './prompts/sentiment.js';

export type AiTaskType = 'reply_draft' | 'summary' | 'sentiment';

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
      return `[${msg.sentAt.toISOString()}] ${author}: ${content}`;
    })
    .join('\n');
}

async function getProviderApiKey(orgId: string, provider: string) {
  const pLower = provider.toLowerCase();
  /* 1. Check registry (env-based) */
  const providerDef = getProviderConfig(pLower);
  if (providerDef?.authToken) return providerDef.authToken;

  /* 2. Fallback: per-org DB setting */
  const setting = await prisma.appSetting.findFirst({
    where: { orgId, settingKey: `ai_${pLower}_api_key` },
  });
  return setting?.valuePlain || '';
}

export async function getAiConfig(orgId: string) {
  let aiConfig = await prisma.aiConfig.findUnique({ where: { orgId } });
  if (!aiConfig) {
    aiConfig = await prisma.aiConfig.create({
      data: { orgId, provider: config.aiDefaultProvider, model: config.aiDefaultModel, maxDaily: 500, enabled: true },
    });
  }
  const availableProviders = getAvailableProviders();
  const hasKey = async (p: string) => {
    const pLower = p.toLowerCase();
    const def = getProviderConfig(pLower);
    if (def?.authToken) return true;
    const setting = await prisma.appSetting.findFirst({
      where: { orgId, settingKey: `ai_${pLower}_api_key` }
    });
    return !!setting?.valuePlain;
  };
  const [hasAnthropicKey, hasGeminiKey, hasOpenRouterKey] = await Promise.all([
    hasKey('anthropic'),
    hasKey('gemini'),
    hasKey('openrouter')
  ]);
  return { ...aiConfig, hasAnthropicKey, hasGeminiKey, hasOpenRouterKey, availableProviders };
}

export async function updateAiConfig(orgId: string, input: { provider?: string; model?: string; maxDaily?: number; enabled?: boolean; apiKey?: string }) {
  if (input.apiKey && input.provider) {
    const pLower = input.provider.toLowerCase();
    await prisma.appSetting.upsert({
      where: { orgId_settingKey: { orgId, settingKey: `ai_${pLower}_api_key` } },
      create: { orgId, settingKey: `ai_${pLower}_api_key`, valuePlain: input.apiKey },
      update: { valuePlain: input.apiKey },
    });
  }
  return prisma.aiConfig.upsert({
    where: { orgId },
    create: {
      orgId,
      provider: input.provider || config.aiDefaultProvider,
      model: input.model || config.aiDefaultModel,
      maxDaily: input.maxDaily ?? 500,
      enabled: input.enabled ?? true,
    },
    update: {
      provider: input.provider,
      model: input.model,
      maxDaily: input.maxDaily,
      enabled: input.enabled,
    },
  });
}

export async function getAiUsage(orgId: string) {
  const currentConfig = await getAiConfig(orgId);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const usedToday = await prisma.aiSuggestion.count({ where: { orgId, createdAt: { gte: startOfDay } } });
  return {
    usedToday,
    maxDaily: currentConfig.maxDaily,
    remaining: Math.max(0, currentConfig.maxDaily - usedToday),
    enabled: currentConfig.enabled,
  };
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

async function saveSuggestion(input: { orgId: string; conversationId: string; messageId?: string; type: AiTaskType; content: string; confidence: number }) {
  return prisma.aiSuggestion.create({
    data: {
      orgId: input.orgId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      type: input.type,
      content: input.content,
      confidence: input.confidence,
    },
  });
}

export async function generateAiOutput(input: { orgId: string; conversationId: string; type: AiTaskType; messageId?: string }) {
  const [currentConfig, conversation] = await Promise.all([
    getAiConfig(input.orgId),
    loadConversation(input.conversationId, input.orgId),
  ]);

  if (!currentConfig.enabled) throw new Error('AI is disabled for this organization');

  // Atomic quota check — count inside transaction to prevent TOCTOU race
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const withinQuota = await prisma.$transaction(async (tx) => {
    const usedToday = await tx.aiSuggestion.count({ where: { orgId: input.orgId, createdAt: { gte: startOfDay } } });
    return usedToday < currentConfig.maxDaily;
  });
  if (!withinQuota) throw new Error('AI daily quota exceeded');

  const apiKey = await getProviderApiKey(input.orgId, currentConfig.provider);
  if (!apiKey) throw new Error('AI provider key is not configured');

  const contextText = buildConversationContext(conversation.messages);
  const language = detectLanguage(contextText);
  const customerName = conversation.contact?.fullName || 'customer';
  const userPrompt = [
    `<conversation_context>`,
    `Customer: ${customerName}`,
    contextText,
    `</conversation_context>`,
  ].join('\n');

  const system = input.type === 'reply_draft'
    ? buildReplyDraftPrompt(language)
    : input.type === 'summary'
      ? buildSummaryPrompt(language)
      : buildSentimentPrompt(language);

  const raw = await generateText(currentConfig.provider, apiKey, currentConfig.model, system, userPrompt);

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
    return normalized;
  }

  const text = raw.trim();

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
    confidence: 0.8,
  });
  return { content: text, confidence: 0.8 };
}
