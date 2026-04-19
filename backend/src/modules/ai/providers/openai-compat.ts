/**
 * Shared handler for OpenAI-compatible chat/completions API.
 * Works with: OpenAI, Qwen (dashscope compat mode), Kimi (Moonshot).
 */
export async function generateWithOpenaiCompat(
  url: string,
  apiKey: string,
  model: string,
  system: string,
  prompt: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://zalocrm.com',
        'X-Title': 'ZaloCRM',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI-compat request failed (${response.status}): ${errorData}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('OpenAI-compat returned empty content');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
