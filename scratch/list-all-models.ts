import fetch from 'node-fetch';

async function test() {
  const url = 'https://openrouter.ai/api/v1/models';

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Total models:', data.data.length);
    console.log('First 10 models:', data.data.slice(0, 10).map(m => m.id));
    const sonnet = data.data.filter(m => m.id.toLowerCase().includes('sonnet')).map(m => m.id);
    console.log('Sonnet models:', sonnet);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
