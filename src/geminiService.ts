// src/geminiService.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { LeadData, AIAnalysis } from "./types";

// Schema definido como objeto simples (forçaremos a aceitação com 'as any' para evitar erros de TS)
const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    solIntro: { 
      type: SchemaType.STRING, 
      description: "Gancho inicial de alta conversão. Deve interromper o padrão, usar o nome do lead e sugerir que encontrou algo 'fora do radar' ou exclusivo." 
    },
    tradeOffs: { 
      type: SchemaType.STRING, 
      description: "Explicação estratégica de por que essas opções vencem qualquer busca no Google. Foco em custo-benefício inteligente." 
    },
    typicalDay: { 
      type: SchemaType.STRING, 
      description: "Micro-história sensorial de um momento 'Uau' a bordo. Use gatilhos visuais e emocionais." 
    },
    conversionTrigger: { 
      type: SchemaType.STRING, 
      description: "Gatilho de urgência real baseado em volatilidade de tarifas (ex: 'Tarifa flutuante, segura apenas por 20min')." 
    },
    fastActionBonus: { 
      type: SchemaType.STRING, 
      description: "Um bônus de alto valor percebido (digital ou serviço) apenas para quem fechar agora." 
    },
    preferenceQuestion: { 
      type: SchemaType.STRING, 
      description: "Pergunta de fechamento alternativa (Ex: 'Qual dessas experiências você quer travar antes que o preço suba?')." 
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, enum: ["ECONOMY", "IDEAL", "UPGRADE"] },
          isRecommended: { type: SchemaType.BOOLEAN },
          magneticName: { 
            type: SchemaType.STRING, 
            description: "NOME MAGNÉTICO DA OFERTA. Use a fórmula: Adjetivo Forte + Benefício Principal + (Recurso Anti-Medo). Ex: 'Escapada VIP Sem Custos Ocultos'." 
          },
          ship: { type: SchemaType.STRING },
          duration: { type: SchemaType.STRING },
          itinerary: { type: SchemaType.STRING },
          cabinType: { type: SchemaType.STRING },
          estimatedPrice: { type: SchemaType.STRING },
          totalValue: { type: SchemaType.STRING, description: "Preço âncora (valor percebido total antes do desconto exclusivo)." },
          whyThis: { 
            type: SchemaType.STRING, 
            description: "Justificativa lógica irrefutável para esta escolha específica." 
          },
          imageUrl: { type: SchemaType.STRING },
          guarantee: { 
            type: SchemaType.STRING, 
            description: "Garantia de risco revertido (ex: 'Garantia de Melhor Cabine Disponível na Categoria')." 
          },
          bonusStack: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING, description: "Nome sexy do bônus." },
                value: { type: SchemaType.STRING, description: "Valor monetário percebido (R$)." },
                description: { type: SchemaType.STRING, description: "Qual dor específica esse bônus resolve?" }
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

  if (!apiKey) {
    console.error("❌ ERRO: VITE_GEMINI_API_KEY não configurada.");
    return getFallbackAnalysis(data);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const budgetPerPerson = (data.budget / (data.peopleCount || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // ENGENHARIA DE PROMPT (DEV + MKT)
    const prompt = `
      ATUE COMO: Sol, uma 'Caçadora de Ofertas de Cruzeiro' Sênior e Estrategista de Viagens.
      Não aja como uma IA ou atendente. Aja como uma amiga especialista que acabou de encontrar um "erro no sistema" ou uma oportunidade rara.

      CONTEXTO DO LEAD:
      - Nome: ${data.name}
      - Orçamento Total: R$ ${data.budget} (~${budgetPerPerson}/pessoa)
      - Perfil: ${data.profile} (${data.peopleCount} pessoas)
      - Experiência Anterior: ${data.experience}
      - O que mais valoriza: ${data.priority}
      - Roteiro Desejado: ${data.route}
      - Cabine Preferida: ${data.cabin}

      SUA MISSÃO (COPYWRITING DE ALTA CONVERSÃO):
      Crie 3 Ofertas Irresistíveis (Economy, Ideal, Upgrade) usando a metodologia de "Grand Slam Offer".
      
      DIRETRIZES OBRIGATÓRIAS:
      
      1. O GANCHO (SOL INTRO):
         - Comece com uma afirmação forte e contra-intuitiva. 
         - Ex: "${data.name}, pare de procurar. O que encontrei aqui supera qualquer preço público."
         - Use autoridade e escassez.
      
      2. NOMES MAGNÉTICOS (PARA AS OFERTAS):
         - NUNCA use nomes genéricos como "Pacote Básico".
         - Use a fórmula: [Benefício Emocional] + [Mecanismo Único] + [Quebra de Objeção].
         - Ex: "Jornada Relax Total (Com Pacote de Bebidas Incluso)" ou "Aventura em Família Sem Stress".

      3. EMPILHAMENTO DE VALOR (BONUS STACK):
         - Invente 2 ou 3 bônus digitais/serviços para cada oferta que resolvam "Dores Ocultas".
         - Dor: Medo de gastar muito a bordo -> Bônus: "Guia de Economia Inteligente a Bordo (Poupe até R$500)".
         - Dor: Medo de enjoar -> Bônus: "Seleção de Cabine Estratégica (Centro do Navio)".
         - Dor: Não saber o que vestir -> Bônus: "Lookbook de Cruzeiro Tropical".
         - Atribua um valor monetário alto para esses bônus (Valor Percebido).

      4. ESCASSEZ E URGÊNCIA (CONVERSION TRIGGER):
         - Use a volatilidade real das tarifas de cruzeiro.
         - "O sistema atualiza a cada 20 minutos. Essa tarifa pode sumir se você fechar a aba."

      5. OBJETIVO DO BOTÃO WHATSAPP:
         - O cliente não quer "falar". Ele quer "TRAVAR" essa oportunidade antes que ela suma. A copy deve direcionar para isso.

      DADOS TÉCNICOS:
      - Foque EXCLUSIVAMENTE em navios da MSC e COSTA que operam na temporada brasileira ou América do Sul.
      - Mantenha os preços realistas mas apresente-os como "oportunidades únicas".
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        // O 'as any' garante que o TS aceite nosso Schema otimizado
        responseSchema: ANALYSIS_SCHEMA as any,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();

    if (!resultText) throw new Error("Resposta vazia da IA");

    return JSON.parse(resultText) as AIAnalysis;

  } catch (error) {
    console.warn("⚠️ Falha na IA (usando Fallback com Copy Otimizada):", error);
    return getFallbackAnalysis(data);
  }
}

/**
 * Fallback com Copywriting Otimizado (Caso a API falhe)
 */
function getFallbackAnalysis(data: LeadData): AIAnalysis {
  return {
    solIntro: `${data.name}, escute com atenção: o sistema de tarifas flutuantes acabou de liberar 3 oportunidades que não aparecem nos buscadores comuns. Segurei essas opções temporariamente para você.`,
    tradeOffs: "Filtrei centenas de cabines para encontrar estas 3 jóias raras que entregam luxo de resort pelo preço de hotel pousada.",
    typicalDay: "Imagine você no deck superior, drink na mão, pôr do sol dourado no horizonte, sabendo que pagou menos que a pessoa na espreguiçadeira ao lado.",
    fastActionBonus: "🎁 BÔNUS SECRETO: 'Guia Anti-Fila' + Upgrade de Prioridade no Embarque (Apenas hoje).",
    conversionTrigger: "⚠️ Alerta de Tarifa: O sistema indica alta demanda para estas datas. Preços podem subir nas próximas 2 horas.",
    preferenceQuestion: `Seja sincero, ${data.name}: qual dessas experiências exclusivas eu devo bloquear no sistema para você agora?`,
    recommendations: [
      {
        type: "ECONOMY",
        isRecommended: false,
        magneticName: "O 'Hacker' de Tarifas Inteligente",
        ship: "Costa Favolosa",
        duration: "4 Noites",
        itinerary: "Santos, Balneário, Ilhabela, Santos",
        cabinType: "Interna Premium (Localização Silenciosa)",
        estimatedPrice: "R$ 3.290",
        totalValue: "R$ 4.800",
        whyThis: "Para quem quer viver a experiência completa do navio gastando o mínimo possível na dormida.",
        imageUrl: "https://images.unsplash.com/photo-1599640845513-2627a3a4af75?auto=format&fit=crop&w=800&q=80",
        guarantee: "Menor tarifa garantida para esta categoria hoje.",
        bonusStack: [
          { name: "Manual: Como Beber de Graça (Dicas Legais)", value: "R$ 97", description: "Segredos dos viajantes experientes." },
          { name: "Checklist de Mala Compacta", value: "R$ 47", description: "Não pague excesso de bagagem nunca mais." }
        ]
      },
      {
        type: "IDEAL",
        isRecommended: true,
        magneticName: "A Experiência 'Celebridade' (Sem Preço de Celebridade)",
        ship: "MSC Seaview",
        duration: "7 Noites",
        itinerary: "Nordeste Mágico (Salvador & Ilhéus)",
        cabinType: "Varanda Fantastica (Vista Mar Infinita)",
        estimatedPrice: "R$ 6.850",
        totalValue: "R$ 9.200",
        whyThis: "O ponto exato onde o luxo encontra o preço justo. Acordar com o mar na sua varanda não tem preço.",
        imageUrl: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=800&q=80",
        guarantee: "Satisfação Blindada: Se não amar a cabine, lutamos por upgrade a bordo.",
        bonusStack: [
          { name: "Roteiro Secreto de Salvador", value: "R$ 197", description: "Fuja das armadilhas de turista." },
          { name: "Acesso VIP: Agente Dedicado MCATUR", value: "R$ 997", description: "Suporte humano real no WhatsApp 24h." }
        ]
      },
      {
        type: "UPGRADE",
        isRecommended: false,
        magneticName: "O Protocolo Yacht Club (Elite)",
        ship: "MSC Grandiosa",
        duration: "7 Noites",
        itinerary: "Roteiro Premium Sudeste",
        cabinType: "Suíte Yacht Club (All Inclusive)",
        estimatedPrice: "R$ 12.900",
        totalValue: "R$ 18.000",
        whyThis: "Acesso a áreas restritas que 95% do navio nem sabe que existem. Mordomo, bebidas premium e privacidade total.",
        imageUrl: "https://images.unsplash.com/photo-1632943792072-3c0ae076e0eb?auto=format&fit=crop&w=800&q=80",
        guarantee: "Status VIP Vitalício na nossa agência.",
        bonusStack: [
          { name: "Concierge Pessoal de Reservas", value: "Inestimável", description: "Nós reservamos seus restaurantes e shows." },
          { name: "Spa Pass Day", value: "R$ 450", description: "Acesso termal para relaxamento profundo." }
        ]
      }
    ]
  };
}