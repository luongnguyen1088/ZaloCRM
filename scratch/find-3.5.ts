import fetch from 'node-fetch';

async function test() {
  const url = 'https://openrouter.ai/api/v1/models';

  try {
    const response = await fetch(url);
    const data = await response.json();
    const models = data.data.filter(m => m.id.includes('3.5-sonnet')).map(m => m.id);
    console.log('3.5-sonnet models:', models);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
