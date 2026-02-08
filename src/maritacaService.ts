// src/maritacaService.ts
import type { LeadData, AIAnalysis } from './types';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function buildMessages(data: LeadData): Message[] {
  const system: Message = {
    role: 'system',
    content:
      'Você é a consultora digital Sol (Brasil). Responda SOMENTE com JSON VÁLIDO (sem Markdown, sem comentários, sem texto fora do JSON).\n' +
      'Obrigatório: preencha TODOS os campos com texto útil. Não deixe vazio.\n' +
      'Retorne EXATAMENTE 3 recomendações, na ordem: ECONOMY, IDEAL, PREMIUM.\n' +
      'Apenas UMA recomendação deve ter "isRecommended": true (a IDEAL).\n' +
      'Cada recomendação deve conter:\n' +
      '- type: "ECONOMY" | "IDEAL" | "PREMIUM"\n' +
      '- isRecommended: boolean\n' +
      '- magneticName: string\n' +
      '- ship: string\n' +
      '- duration: string (ex: "3 noites")\n' +
      '- cabinType: string (ex: "Interna", "Varanda")\n' +
      '- totalValue: string (ex: "R$ 9.800")\n' +
      '- estimatedPrice: string (ex: "R$ 6.900")\n' +
      '- bonusStack: array com EXATAMENTE 4 itens; cada item tem { name, value, description }\n' +
      '- guarantee: string\n' +
      'O objeto raiz deve ter também: solIntro, tradeOffs, preferenceQuestion, conversionTrigger, fastActionBonus.\n' +
      'Use valores em BRL com "R$".\n' +
      'Saída final: apenas JSON.',
  };

  const user: Message = {
    role: 'user',
    content:
      'Aqui está o LeadData (JSON). Gere o objeto completo no formato exigido.\n' +
      JSON.stringify(data, null, 2),
  };

  return [system, user];
}

export async function analyzeCruiseProfile(data: LeadData): Promise<AIAnalysis> {
  const apiKey = import.meta.env.VITE_MARITACA_API_KEY;

  if (!apiKey) {
    throw new Error('Chave da API da Maritaca não encontrada (VITE_MARITACA_API_KEY).');
  }

  const response = await fetch('https://chat.maritaca.ai/api/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'sabia-4',
      messages: buildMessages(data),
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Erro Maritaca (${response.status}): ${errText || 'sem detalhe'}`);
  }

  const dataJson = await response.json();
  const content: string | undefined = dataJson?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Resposta vazia da Maritaca.');
  }

  // Esperamos JSON puro. Se vier texto extra, dá erro — isso nos protege.
  try {
    return JSON.parse(content) as AIAnalysis;
  } catch {
    const preview = content.slice(0, 300);
    throw new Error(`A IA não retornou JSON válido. Início: ${preview}`);
  }
}
