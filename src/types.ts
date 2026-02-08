// src/types.ts

/**
 * Perfis de viajantes para segmentação da oferta.
 */
export enum TravelProfile {
  COUPLE = 'Casal',
  FAMILY = 'Família com crianças',
  FRIENDS = 'Grupo de Amigos',
  SOLO = 'Viajante Solo'
}

/**
 * Nível de experiência do lead com cruzeiros.
 * Ajuda a definir o tom da explicação (mais educativo ou mais direto).
 */
export enum ExperienceLevel {
  FIRST_TIME = 'Primeira vez',
  EXPERIENCED = 'Já viajei de cruzeiro'
}

/**
 * Períodos preferenciais de viagem.
 */
export enum PreferredPeriod {
  SUMMER = 'Verão (Dez a Mar)',
  OFF_PEAK = 'Baixa Temporada (Abr a Nov)',
  HOLIDAYS = 'Feriados / Datas Especiais'
}

/**
 * O que o cliente mais valoriza na experiência.
 * Crucial para o "match" do navio (ex: Navio festeiro vs Navio gastronômico).
 */
export enum ExperiencePriority {
  GASTRONOMY = 'Alta Gastronomia',
  PARTIES = 'Festas e Agito',
  RELAX = 'Relaxamento e SPA',
  KIDS = 'Atividades para Crianças'
}

/**
 * Preferência de rota geográfica.
 */
export enum RoutePreference {
  NORTHEAST = 'Praias do Nordeste',
  SOUTH = 'Litoral Catarinense / Uruguai',
  SHORT = 'Mini-Cruzeiro (Sudeste)'
}

/**
 * Exigência de cabine.
 * O valor UNDEFINED é usado internamente para disparar o modal educativo.
 */
export enum CabinRequirement {
  ECONOMY = 'Preço (Interna)',
  VIEW = 'Vista Mar (Janela)',
  BALCONY = 'Conforto (Varanda)',
  UNDEFINED = 'Ainda não decidi / Quero ajuda'
}

/**
 * Estrutura dos dados coletados do Lead durante o formulário.
 */
export interface LeadData {
  name: string;
  budget: number;
  peopleCount: number;
  period: PreferredPeriod;
  experience: ExperienceLevel;
  profile: TravelProfile;
  priority: ExperiencePriority;
  route: RoutePreference;
  cabin: CabinRequirement;
  /** Flag para indicar à IA que o lead precisou de explicação sobre cabines */
  needsCabinEducation?: boolean; 
}

/**
 * Item individual da "Pilha de Valor" (Bônus).
 */
export interface BonusItem {
  name: string;
  value: string;
  description: string;
}

/**
 * Estrutura de uma recomendação de cruzeiro retornada pela IA.
 */
export interface CruiseOption {
  type: 'ECONOMY' | 'IDEAL' | 'UPGRADE';
  isRecommended: boolean; // Se é a "Escolha da Sol"
  magneticName: string;   // Nome de marketing (Copywriting)
  ship: string;
  duration: string;
  itinerary: string;
  cabinType: string;
  estimatedPrice: string;
  totalValue: string;     // Valor "ancora" antes do desconto/bônus
  whyThis: string;        // Justificativa da IA
  imageUrl: string;
  bonusStack: BonusItem[];
  guarantee: string;      // Inversão de risco
}

/**
 * Resposta completa da análise da IA (Gemini).
 */
export interface AIAnalysis {
  solIntro: string;       // Introdução personalizada da persona Sol
  tradeOffs: string;      // Explicação das escolhas baseadas no budget
  typicalDay: string;     // Storytelling do dia a dia
  recommendations: CruiseOption[];
  conversionTrigger: string; // Gatilho de urgência/escassez
  fastActionBonus: string;   // Bônus para ação rápida
  preferenceQuestion: string; // Pergunta de fechamento
  sources?: { uri: string; title: string }[]; // Para citar fontes (opcional)
}