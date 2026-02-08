// src/geminiService.ts
import { GoogleGenAI, SchemaType } from "@google/genai";
import { LeadData, AIAnalysis } from "./types";

// Schema rigoroso para garantir a tipagem da resposta da IA
const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    solIntro: { type: SchemaType.STRING, description: "Mensagem de boas-vindas empática e personalizada." },
    tradeOffs: { type: SchemaType.STRING, description: "Explicação das escolhas baseadas no orçamento." },
    typicalDay: { type: SchemaType.STRING, description: "Storytelling de um dia típico a bordo." },
    conversionTrigger: { type: SchemaType.STRING, description: "Gatilho de escassez ou urgência." },
    fastActionBonus: { type: SchemaType.STRING, description: "Bônus para fechamento rápido." },
    preferenceQuestion: { type: SchemaType.STRING, description: "Pergunta final para engajar o lead." },
    recommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, enum: ["ECONOMY", "IDEAL", "UPGRADE"] },
          isRecommended: { type: SchemaType.BOOLEAN },
          magneticName: { type: SchemaType.STRING, description: "Nome comercial atraente da oferta." },
          ship: { type: SchemaType.STRING },
          duration: { type: SchemaType.STRING },
          itinerary: { type: SchemaType.STRING },
          cabinType: { type: SchemaType.STRING },
          estimatedPrice: { type: SchemaType.STRING },
          totalValue: { type: SchemaType.STRING, description: "Preço âncora (antes do desconto)." },
          whyThis: { type: SchemaType.STRING },
          imageUrl: { type: SchemaType.STRING },
          guarantee: { type: SchemaType.STRING },
          bonusStack: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING }
              },
              required: ["name", "value", "description"]
            }
          }
        },
        required: [
          "type", "isRecommended", "magneticName", "ship", "duration", 
          "itinerary", "cabinType", "estimatedPrice", "totalValue", 
          "whyThis", "imageUrl", "bonusStack", "guarantee"
        ]
      }
    }
  },
  required: [
    "solIntro", "tradeOffs", "typicalDay", "recommendations", 
    "conversionTrigger", "fastActionBonus", "preferenceQuestion"
  ]
};

export async function analyzeCruiseProfile(data: LeadData): Promise<AIAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Validação preventiva da API Key
  if (!apiKey) {
    console.error("❌ ERRO: VITE_GEMINI_API_KEY não configurada.");
    return getFallbackAnalysis(data); // Retorna fallback imediato
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Cálculo simples para contexto da IA
    const budgetPerPerson = (data.budget / (data.peopleCount || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const prompt = `
      ATUE COMO: Sol, consultora de elite em cruzeiros da MCATUR.
      
      DADOS DO CLIENTE:
      - Nome: ${data.name}
      - Budget Total: R$ ${data.budget} (~${budgetPerPerson}/pessoa)
      - Perfil: ${data.profile} (${data.peopleCount} pessoas)
      - Experiência: ${data.experience}
      - Prioridade: ${data.priority}
      - Roteiro: ${data.route}
      - Cabine: ${data.cabin}

      OBJETIVO:
      Criar 3 ofertas irresistíveis (ECONOMY, IDEAL, UPGRADE) usando a metodologia de "Value Stacking" (Alex Hormozi).
      Foque em navios da MSC e COSTA que operam no Brasil.

      DIRETRIZES DE COPYWRITING:
      1. Seja entusiasta, expert e pessoal. Use o nome ${data.name}.
      2. Crie nomes "Magnéticos" para os pacotes (ex: "Jornada do Relaxamento").
      3. Invente bônus digitais/serviços críveis (ex: "Guia de Malas", "Roteiro de Bares").
      4. A opção "IDEAL" deve ser a que melhor equilibra o budget e o desejo do cliente.
    `;

    // Chamada à API usando o modelo Flash (mais rápido e barato)
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const resultText = response.text();
    if (!resultText) throw new Error("Resposta vazia da IA");

    return JSON.parse(resultText) as AIAnalysis;

  } catch (error) {
    console.warn("⚠️ Falha na IA (usando Fallback):", error);
    return getFallbackAnalysis(data);
  }
}

/**
 * Retorna uma análise "Mock" de alta qualidade caso a API falhe.
 * Garante que o usuário nunca fique sem resposta.
 */
function getFallbackAnalysis(data: LeadData): AIAnalysis {
  return {
    solIntro: `Olá, ${data.name}! O sistema da IA está sobrecarregado pelo alto volume de buscas, mas não se preocupe! Acessei nosso banco de dados offline e selecionei manualmente 3 opções incríveis para você.`,
    tradeOffs: "Foquei em maximizar seu orçamento priorizando navios com melhor infraestrutura de lazer.",
    typicalDay: "Imagine acordar com vista para o mar, curtir piscinas infinitas e terminar o dia com um jantar de gala.",
    fastActionBonus: "🎁 BÔNUS DE CONTINGÊNCIA: 5% OFF extra se chamar no WhatsApp agora.",
    conversionTrigger: "⚠️ Últimas cabines disponíveis nesta tarifa.",
    preferenceQuestion: `Dessas opções manuais, ${data.name}, qual delas te fez sonhar mais alto?`,
    recommendations: [
      {
        type: "ECONOMY",
        isRecommended: false,
        magneticName: "Escapada Smart no Costa Favolosa",
        ship: "Costa Favolosa",
        duration: "4 Noites",
        itinerary: "Santos, Balneário Camboriú, Santos",
        cabinType: "Interna Premium",
        estimatedPrice: "R$ 3.200",
        totalValue: "R$ 4.500",
        whyThis: "A opção mais inteligente para caber no bolso sem perder a diversão.",
        imageUrl: "https://images.unsplash.com/photo-1599640845513-2627a3a4af75?auto=format&fit=crop&w=800&q=80",
        guarantee: "Menor preço garantido da temporada.",
        bonusStack: [{ name: "E-book: Malas Inteligentes", value: "R$ 97", description: "O que levar sem excesso de peso." }]
      },
      {
        type: "IDEAL",
        isRecommended: true,
        magneticName: `A Experiência Sol para ${data.name} no MSC Seaview`,
        ship: "MSC Seaview",
        duration: "7 Noites",
        itinerary: "Santos, Salvador, Ilhéus, Santos",
        cabinType: "Varanda Fantastica",
        estimatedPrice: "R$ 6.800",
        totalValue: "R$ 8.900",
        whyThis: "O equilíbrio perfeito entre o luxo do navio e o roteiro dos sonhos.",
        imageUrl: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=800&q=80",
        guarantee: "Satisfação total ou upgrade na próxima viagem.",
        bonusStack: [
          { name: "Consultoria VIP de Passeios", value: "R$ 250", description: "Os melhores pontos turísticos sem filas." },
          { name: "Voucher de Drinks", value: "R$ 150", description: "Crédito para seus primeiros brindes." }
        ]
      },
      {
        type: "UPGRADE",
        isRecommended: false,
        magneticName: "Luxo Supremo Yacht Club",
        ship: "MSC Grandiosa",
        duration: "7 Noites",
        itinerary: "Roteiro Nordeste Premium",
        cabinType: "Suíte Yacht Club",
        estimatedPrice: "R$ 12.500",
        totalValue: "R$ 15.000",
        whyThis: "Para quem não aceita nada menos que a perfeição e exclusividade.",
        imageUrl: "https://images.unsplash.com/photo-1632943792072-3c0ae076e0eb?auto=format&fit=crop&w=800&q=80",
        guarantee: "Atendimento de Mordomo 24h.",
        bonusStack: [{ name: "Acesso Termal SPA", value: "R$ 800", description: "Relaxamento total incluso." }]
      }
    ]
  };
}