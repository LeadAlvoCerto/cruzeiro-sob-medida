
export enum TravelProfile {
  COUPLE = 'Casal',
  FAMILY = 'Família com crianças',
  FRIENDS = 'Grupo de Amigos',
  SOLO = 'Viajante Solo'
}

export enum ExperienceLevel {
  FIRST_TIME = 'Primeira vez',
  EXPERIENCED = 'Já viajei de cruzeiro'
}

export enum PreferredPeriod {
  SUMMER = 'Verão (Dez a Mar)',
  OFF_PEAK = 'Baixa Temporada (Abr a Nov)',
  HOLIDAYS = 'Feriados / Datas Especiais'
}

export enum ExperiencePriority {
  GASTRONOMY = 'Alta Gastronomia',
  PARTIES = 'Festas e Agito',
  RELAX = 'Relaxamento e SPA',
  KIDS = 'Atividades para Crianças'
}

export enum RoutePreference {
  NORTHEAST = 'Praias do Nordeste',
  SOUTH = 'Litoral Catarinense / Uruguai',
  SHORT = 'Mini-Cruzeiro (Sudeste)'
}

export enum CabinRequirement {
  ECONOMY = 'Preço (Interna)',
  VIEW = 'Vista Mar (Janela)',
  BALCONY = 'Conforto (Varanda)'
}

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
}

export interface BonusItem {
  name: string;
  value: string;
  description: string;
}

export interface CruiseOption {
  type: 'ECONOMY' | 'IDEAL' | 'UPGRADE';
  isRecommended: boolean;
  magneticName: string;
  ship: string;
  duration: string;
  itinerary: string;
  cabinType: string;
  estimatedPrice: string;
  totalValue: string;
  whyThis: string;
  imageUrl: string;
  bonusStack: BonusItem[];
  guarantee: string;
}

export interface AIAnalysis {
  solIntro: string; 
  tradeOffs: string;
  typicalDay: string;
  recommendations: CruiseOption[];
  conversionTrigger: string;
  fastActionBonus: string;
  preferenceQuestion: string; // Pergunta de fechamento da Sol
  sources?: { uri: string; title: string }[];
}
