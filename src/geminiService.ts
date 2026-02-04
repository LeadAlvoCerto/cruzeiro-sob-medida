/// <reference types="vite/client" />
import { GoogleGenAI, Type } from "@google/genai";
import { LeadData, AIAnalysis } from "./types";

export async function analyzeCruiseProfile(data: LeadData): Promise<AIAnalysis> {
  // 1. INFRAESTRUTURA VITE (O Corpo Novo)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ ERRO CRÍTICO: Chave VITE_GEMINI_API_KEY não encontrada no .env.local");
    throw new Error("Chave de API não configurada");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const budgetPerPerson = (data.budget / (data.peopleCount || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // 2. A ALMA DA SOL (O Prompt Validado Restaurado)
  const prompt = `
    Olá, eu sou a Sol, sua consultora especialista em cruzeiros!
    Analisei o seguinte perfil de lead para encontrar as opções perfeitas:

    - Nome do Lead: ${data.name}
    - Orçamento Total: R$ ${data.budget} (Aprox. ${budgetPerPerson} por pessoa)
    - Prioridade: ${data.priority}
    - Roteiro Desejado: ${data.route}
    - Exigência de Cabine: ${data.cabin}
    - Período: ${data.period}
    - Com quem viaja: ${data.profile}

    SUA MISSÃO (PERSONA SOL + HORMORZI):
    Como Sol, você deve demonstrar que buscou minuciosamente entre as melhores companhias (MSC e Costa) para encontrar o "match" perfeito para o(a) ${data.name}. Use um tom entusiasmado, expert e acolhedor. Trate o lead pelo nome.

    REQUISITOS OBRIGATÓRIOS:
    1. Gere EXATAMENTE 3 recomendações: uma "ECONOMY" (custo-benefício), uma "IDEAL" (a recomendada pela Sol, que melhor casa com a prioridade e roteiro) e uma "UPGRADE" (experiência premium).
    2. Identifique qual delas é a recomendada pela Sol (isRecommended: true).
    3. Cada recomendação deve ter nomes M.A.G.I.C (Magnéticos, Atrativos) e um Value Stack de bônus robusto (ex: "Guia de Malas", "Consultoria VIP").
    4. Crie uma mensagem de introdução ("solIntro") onde você explica por que essas opções foram escolhidas pessoalmente para o(a) ${data.name}.
    5. Crie uma pergunta final ("preferenceQuestion") perguntando qual dessas foi a favorita do(a) ${data.name} para que você possa tentar melhorar ainda mais as condições.
    6. "tradeOffs": Explique o raciocínio da escolha (ex: "Priorizei X em vez de Y para caber no orçamento...").
  `;

  try {
    // Usando modelo flash estável para garantir resposta rápida
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        // Schema rigoroso para garantir que o JSON venha perfeito para o App
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solIntro: { type: Type.STRING, description: 'Mensagem de boas-vindas da consultora Sol explicando as escolhas para o lead específico.' },
            tradeOffs: { type: Type.STRING },
            typicalDay: { type: Type.STRING },
            fastActionBonus: { type: Type.STRING },
            preferenceQuestion: { type: Type.STRING, description: 'Pergunta final perguntando a preferência do lead.' },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  isRecommended: { type: Type.BOOLEAN },
                  magneticName: { type: Type.STRING },
                  ship: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  itinerary: { type: Type.STRING },
                  cabinType: { type: Type.STRING },
                  estimatedPrice: { type: Type.STRING },
                  totalValue: { type: Type.STRING },
                  whyThis: { type: Type.STRING },
                  imageUrl: { type: Type.STRING },
                  guarantee: { type: Type.STRING },
                  bonusStack: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        value: { type: Type.STRING },
                        description: { type: Type.STRING }
                      },
                      required: ['name', 'value', 'description']
                    }
                  }
                },
                required: ['type', 'isRecommended', 'magneticName', 'ship', 'duration', 'itinerary', 'cabinType', 'estimatedPrice', 'totalValue', 'whyThis', 'imageUrl', 'bonusStack', 'guarantee']
              }
            },
            conversionTrigger: { type: Type.STRING }
          },
          required: ['solIntro', 'tradeOffs', 'typicalDay', 'recommendations', 'conversionTrigger', 'fastActionBonus', 'preferenceQuestion']
        },
        // Instrução de Sistema Original Restaurada
        systemInstruction: `Você é a Sol, consultora digital de cruzeiros da agência. Você aplica a metodologia de Alex Hormozi para criar ofertas de valor imbatível. Sua missão é fazer o(a) lead sentir que você encontrou o tesouro no oceano especificamente para ele(a). Sempre use o nome do lead na solIntro e na preferenceQuestion.`,
      }
    });

    const text = response.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON Error");
    
    return JSON.parse(jsonMatch[0]) as AIAnalysis;

  } catch (error) {
    console.error("AI Error (Fallback Ativado):", error);
    
    // 3. FALLBACK RICO (Caso a API falhe, a Sol ainda entrega valor, não erro genérico)
    return {
      solIntro: `Oi, ${data.name}! Sou a Sol. Vasculhei as tabelas da MSC e Costa e encontrei três joias que se encaixam perfeitamente no que você busca para navegar!`,
      tradeOffs: "Foquei em garantir que você tenha a vivência que priorizou, otimizando cada centavo do seu orçamento.",
      typicalDay: "Seu dia será repleto de descobertas e o conforto que você merece a bordo dos gigantes dos mares.",
      fastActionBonus: "🎁 PRESENTE DA SOL: Feche em 24h e eu pessoalmente garanto seu crédito para o SPA ou Jantar Especial!",
      preferenceQuestion: `E aí, ${data.name}? Alguma dessas opções balançou seu coração? Me conta qual você mais gostou para eu brigar por uma condição ainda melhor para você!`,
      recommendations: [
        {
          type: 'ECONOMY',
          isRecommended: false,
          magneticName: 'Mini-Férias Smart: 4 Dias de Sol no MSC Orchestra',
          ship: 'MSC Orchestra',
          duration: '4 Noites',
          itinerary: 'Santos, Ilhabela, Santos',
          cabinType: 'Cabine Interna Fantastica',
          estimatedPrice: 'R$ 2.950',
          totalValue: 'R$ 4.100',
          whyThis: 'Para quem quer navegar com economia sem abrir mão da qualidade e diversão Sol.',
          imageUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?q=80&w=800',
          guarantee: '🛡️ Garantia Sol: Embarque garantido com suporte 24h via WhatsApp diretamente comigo.',
          bonusStack: [{ name: 'Guia de Malas Express', value: 'R$ 147', description: 'Como organizar tudo para um cruzeiro curto.' }]
        },
        {
          type: 'IDEAL',
          isRecommended: true,
          magneticName: `Ouro no Nordeste: 7 Dias Magníficos para ${data.name} no MSC Grandiosa`,
          ship: 'MSC Grandiosa',
          duration: '7 Noites',
          itinerary: 'Santos, Salvador, Maceió, Santos',
          cabinType: 'Cabine com Varanda Deluxe',
          estimatedPrice: 'R$ 5.400',
          totalValue: 'R$ 7.500',
          whyThis: `Esta é a minha indicação de ouro para você, ${data.name}! Combina exatamente o roteiro que você deseja com o navio mais moderno da costa.`,
          imageUrl: 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?q=80&w=800',
          guarantee: '🛡️ Compromisso Sol 24h: Suporte total do porto ao desembarque. Você nunca estará sozinho(a).',
          bonusStack: [
            { name: 'Consultoria de Passeios VIP', value: 'R$ 450', description: 'Dicas de ouro para Salvador e Maceió.' },
            { name: 'Checklist de Viagem Completo', value: 'R$ 150', description: 'Tudo o que você precisa saber para não ter stress.' }
          ]
        },
        {
          type: 'UPGRADE',
          isRecommended: false,
          magneticName: 'Elite do Oceano: Experiência Exclusiva Yacht Club no MSC Splendida',
          ship: 'MSC Splendida',
          duration: '7 Noites',
          itinerary: 'Santos, Búzios, Salvador, Santos',
          cabinType: 'Suíte Yacht Club (All Inclusive Premium)',
          estimatedPrice: 'R$ 10.200',
          totalValue: 'R$ 14.200',
          whyThis: 'Para quem deseja o nível máximo de exclusividade, mordomo 24h e áreas privativas luxuosas.',
          imageUrl: 'https://images.unsplash.com/photo-1516132200388-75b2b295c651?q=80&w=800',
          guarantee: '🛡️ Garantia de Luxo VIP: Atendimento prioritário e experiência totalmente sem filas.',
          bonusStack: [{ name: 'Concierge Particular Sol', value: 'R$ 2.500', description: 'Atendimento prioritário em todas as solicitações.' }]
        }
      ],
      conversionTrigger: "⚠️ A Sol avisa: Os lotes promocionais para este período estão evaporando. Não deixe para amanhã!"
    };
  }
}