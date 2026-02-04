import { PreferredPeriod, TravelProfile, ExperienceLevel, ExperiencePriority, RoutePreference, CabinRequirement } from './types';

export const QUESTIONS = [
  {
    id: 'name',
    question: 'Para começar, como posso te chamar?',
    description: 'Quero te tratar pelo nome durante nossa consultoria.',
    type: 'text',
    placeholder: 'Digite seu nome aqui'
  },
  {
    id: 'budget',
    question: 'Qual é o seu orçamento total para a cabine?',
    description: 'Investimento total planejado para a viagem.',
    type: 'number',
    placeholder: 'Ex: 8000',
    unit: 'R$'
  },
  {
    id: 'peopleCount',
    question: 'Para quantas pessoas?',
    type: 'number',
    placeholder: 'Ex: 2',
    unit: 'Pessoas'
  },
  {
    id: 'period',
    question: 'Qual período você prefere navegar?',
    type: 'select',
    options: Object.values(PreferredPeriod)
  },
  {
    id: 'priority',
    question: 'O que você mais valoriza vivenciar a bordo?',
    type: 'select',
    options: Object.values(ExperiencePriority)
  },
  {
    id: 'route',
    question: 'Qual roteiro faz seus olhos brilharem?',
    type: 'select',
    options: Object.values(RoutePreference)
  },
  {
    id: 'cabin',
    question: 'Qual o seu nível de exigência com a cabine?',
    type: 'select',
    // MUDANÇA 1: Definimos explicitamente para excluir o "Ainda não decidi" dos botões grandes
    options: [
      CabinRequirement.ECONOMY,
      CabinRequirement.VIEW,
      CabinRequirement.BALCONY
    ],
    // MUDANÇA 2: Conteúdo educativo para o Modal
    helpContent: {
      title: "Entenda as Diferenças",
      cards: [
        {
          title: "Interna (Econômica)",
          description: "Sem janelas. Ideal se você só vai ao quarto para dormir e trocar de roupa.",
          bestFor: "Orçamento focado em passeios"
        },
        {
          title: "Externa (Vista Mar)",
          description: "Possui uma janela (bocata) que não abre, mas garante luz natural e vista.",
          bestFor: "Quem quer ver o dia amanhecer"
        },
        {
          title: "Varanda (Conforto)",
          description: "Sua área privada ao ar livre. Sentir a brisa do mar na rede ou cadeira.",
          bestFor: "Experiência completa e privacidade"
        }
      ]
    }
  },
  {
    id: 'experience',
    question: 'Você já viajou de cruzeiro antes?',
    type: 'select',
    options: Object.values(ExperienceLevel)
  },
  {
    id: 'profile',
    question: 'Com quem você pretende viajar?',
    type: 'select',
    options: Object.values(TravelProfile)
  }
];

export const MOCK_CRUISES_REFERENCE = `
Referências de Cruzeiros no Brasil (Temporada 2024/2025):
- MSC Grandiosa (O maior, moderno, luxuoso, ideal para famílias e festas)
- MSC Seaview (Design revolucionário, foco em áreas externas)
- MSC Splendida (Clássico, elegante, Yacht Club)
- MSC Orchestra (Médio porte, boa gastronomia)
- Costa Diadema (Estilo italiano, diversão para famílias)
- Costa Favolosa (Elegante, clássico, bons roteiros)
- Costa Pacifica (Focado em música, renovado)
`;