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

  /* 1. Primary: per-org DB setting (user provided via UI) */
  const setting = await prisma.appSetting.findFirst({
    where: { orgId, settingKey: `ai_${pLower}_api_key` },
  });
  if (setting?.valuePlain) return setting.valuePlain;

  /* 2. Fallback: registry (system env-based) */
  const providerDef = getProviderConfig(pLower);
  return providerDef?.authToken || '';
}

export async function getAiConfig(orgId: string) {
  console.log(`[AI Settings] FETCHING config for orgId: "${orgId}"`);
  
  let aiConfig = await prisma.aiConfig.findUnique({ where: { orgId } });
  
  if (!aiConfig) {
    console.log(`[AI Settings] WARNING: No config found in DB for org "${orgId}". Returning in-memory defaults.`);
    // Return defaults but DO NOT save to DB here. Let the user Save from UI.
    aiConfig = {
      orgId,
      provider: config.aiDefaultProvider,
      model: config.aiDefaultModel,
      maxDaily: 500,
      enabled: false,
    } as any;
  } else {
    console.log(`[AI Settings] Found config in DB:`, JSON.stringify(aiConfig));
  }

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

  return { 
    ...aiConfig, 
    hasAnthropicKey, 
    hasGeminiKey, 
    hasOpenRouterKey,
    availableProviders: getAvailableProviders()
  };
}

export async function updateAiConfig(orgId: string, input: { provider?: string; model?: string; maxDaily?: number; enabled?: boolean; apiKey?: string }) {
  console.log(`[AI Settings] Updating config for org ${orgId}:`, JSON.stringify(input));

  try {
    if (input.apiKey && input.provider) {
      const pLower = input.provider.toLowerCase();
      console.log(`[AI Settings] Saving API Key for ${pLower}`);
      await prisma.appSetting.upsert({
        where: { orgId_settingKey: { orgId, settingKey: `ai_${pLower}_api_key` } },
        create: { orgId, settingKey: `ai_${pLower}_api_key`, valuePlain: input.apiKey },
        update: { valuePlain: input.apiKey },
      });
    }

    const enabledValue = input.enabled !== undefined ? Boolean(input.enabled) : undefined;
    const maxDaily = input.maxDaily !== undefined ? Number(input.maxDaily) : undefined;

    // Use explicit check to ensure we know if record exists
    const existing = await prisma.aiConfig.findUnique({ where: { orgId } });
    
    if (existing) {
      console.log(`[AI Settings] Updating existing config...`);
      await prisma.aiConfig.update({
        where: { orgId },
        data: {
          provider: input.provider || undefined,
          model: input.model || undefined,
          maxDaily: maxDaily,
          enabled: enabledValue,
        }
      });
    } else {
      console.log(`[AI Settings] Creating new config...`);
      await prisma.aiConfig.create({
        data: {
          orgId,
          provider: input.provider || config.aiDefaultProvider,
          model: input.model || config.aiDefaultModel,
          maxDaily: maxDaily || 500,
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
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const usedToday = await prisma.aiSuggestion.count({ where: { orgId, createdAt: { gte: startOfDay } } });
  const configMaxDaily = Number(currentConfig.maxDaily) || 500;
  return {
    usedToday,
    maxDaily: configMaxDaily,
    remaining: Math.max(0, configMaxDaily - usedToday),
    enabled: Boolean(currentConfig.enabled),
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
  const configMaxDaily = Number(currentConfig.maxDaily) || 500;
  const withinQuota = await prisma.$transaction(async (tx) => {
    const usedToday = await tx.aiSuggestion.count({ where: { orgId: input.orgId, createdAt: { gte: startOfDay } } });
    return usedToday < configMaxDaily;
  });
  if (!withinQuota) throw new Error('AI daily quota exceeded');

  const provider = currentConfig.provider || 'anthropic';
  const apiKey = await getProviderApiKey(input.orgId, provider);
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

  const model = currentConfig.model || 'claude-3-5-sonnet';
  const raw = await generateText(provider, apiKey, model, system, userPrompt);

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
