import fetch from 'node-fetch';

async function test() {
  const url = 'https://openrouter.ai/api/v1/models';

  try {
    const response = await fetch(url);
    const data = await response.json();
    const claudeModels = data.data
      .filter(m => m.id.includes('claude-3.5-sonnet'))
      .map(m => m.id);
    console.log('Claude 3.5 Sonnet IDs:', claudeModels);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
