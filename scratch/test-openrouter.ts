import fetch from 'node-fetch';

async function test() {
  const apiKey = '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';
  const model = 'anthropic/claude-3.5-sonnet';
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say hello' }],
      }),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
