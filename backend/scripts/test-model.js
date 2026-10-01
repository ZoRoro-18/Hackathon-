import { config } from '../src/config.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

async function test(name) {
  try {
    const res = await ai.models.generateContent({
      model: name,
      contents: 'Respond with JSON {"status": "ok"}'
    });
    console.log(`Model [${name}]: SUCCESS ->`, res.text.trim());
    return true;
  } catch (err) {
    console.log(`Model [${name}]: FAILED ->`, err.message?.slice(0, 100));
    return false;
  }
}

async function run() {
  await test('gemini-flash-lite-latest');
  await test('gemini-3.1-flash-lite');
  await test('gemini-3.7-flash');
  await test('gemini-2.5-pro');
}

run();
