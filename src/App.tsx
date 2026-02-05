import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Calculator,
  MessageCircle,
  AlertCircle,
  Gift,
  ShieldCheck,
  Zap,
  Sun,
  Star,
  User,
  Tag,
  Share2,
  Timer,
  CheckCircle2,
  HelpCircle,
  X,
  Check,
  Building2,
  Phone
} from 'lucide-react';
import { QUESTIONS } from './constants';
import { LeadData, AIAnalysis } from './types';
import { analyzeCruiseProfile } from './geminiService';

// --- CONFIGURAÇÃO DE IMAGENS BLINDADAS (100% Unsplash) ---
const SHIP_IMAGES: Record<string, string> = {

  // MSC
  "grandiosa": "https://images.unsplash.com/photo-1599640845513-2627a3a4af75?auto=format&fit=crop&w=800&q=80",
  "seaview": "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=800&q=80",
  "splendida": "https://images.unsplash.com/photo-1632943792072-3c0ae076e0eb?auto=format&fit=crop&w=800&q=80",
  "orchestra": "https://images.unsplash.com/photo-1517400508447-f8dd518b86db?auto=format&fit=crop&w=800&q=80",
  "preziosa": "https://images.unsplash.com/photo-1605281317010-fe5ffe79b9b7?auto=format&fit=crop&w=800&q=80",

  // COSTA
  "diadema": "https://images.unsplash.com/photo-1628278235288-750174034267?auto=format&fit=crop&w=800&q=80",
  "favolosa": "https://images.unsplash.com/photo-1559599238-308793637427?auto=format&fit=crop&w=800&q=80",
  "pacifica": "https://images.unsplash.com/photo-1609688669309-fc15db557633?auto=format&fit=crop&w=800&q=80",

  // Genéricos (Fallback)
  "msc": "https://images.unsplash.com/photo-1599640845513-2627a3a4af75?auto=format&fit=crop&w=800&q=80",
  "costa": "https://images.unsplash.com/photo-1628278235288-750174034267?auto=format&fit=crop&w=800&q=80",
  "default": "https://images.unsplash.com/photo-1559599238-308793637427?auto=format&fit=crop&w=800&q=80"
};

const resolveShipImage = (ship?: string, magneticName?: string) => {
  const shipNameLower = (ship || "").toLowerCase();
  const magneticNameLower = (magneticName || "").toLowerCase();

  const matchedKey = Object.keys(SHIP_IMAGES).find((key) =>
    shipNameLower.includes(key) || magneticNameLower.includes(key)
  );

  if (matchedKey) return SHIP_IMAGES[matchedKey];
  if (shipNameLower.includes("msc")) return SHIP_IMAGES["msc"];
  if (shipNameLower.includes("costa")) return SHIP_IMAGES["costa"];
  return SHIP_IMAGES["default"];
};

const LOADING_MESSAGES = [
  "Sol está conectando ao sistema da MSC e Costa...",
  "Analisando disponibilidade de cabines...",
  "Comparando preços e roteiros...",
  "Sol está negociando bônus exclusivos...",
  "Quase pronto! Finalizando seu plano de viagem..."
];

const MIN_LOADING_TIME = 4500; // Tempo mínimo de loading (4.5 segundos)

const SOCIAL_PROOFS = [
  { name: "Mariana", city: "Curitiba", action: "garantiu o bônus de cabine" },
  { name: "Carlos", city: "São Paulo", action: "reservou o MSC Grandiosa" },
  { name: "Beatriz", city: "Belo Horizonte", action: "acaba de falar com a Sol" },
  { name: "Ricardo", city: "Porto Alegre", action: "escolheu a cabine com varanda" },
  { name: "Fernanda", city: "Brasília", action: "recebeu o upgrade Yacht Club" },
  { name: "André", city: "Salvador", action: "economizou R$ 1.200 na reserva" }
];

const SHIP_CAROUSEL_BY_SHIP: Record<string, string[]> = {
  grandiosa: [
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/grandiosanavegando.png",
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/grandiosapiscinas1.png",
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/grandiosacabine.png",
  ],
    splendida: [
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/splendida1.png",
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/splendida2.png",
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/esplendida3.png",
  ],

  default: [
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/navegando1.png",
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/cabine1.png",
    "https://raw.githubusercontent.com/LeadAlvoCerto/cruzeiro-sob-medida/main/public/images/ships/restaurante1.png",
  ],
};

const resolveShipCarouselImages = (ship?: string, magneticName?: string) => {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, " ");

  const shipLower = normalize(ship || "");
  const magneticLower = normalize(magneticName || "");

  const matchedKey = Object.keys(SHIP_CAROUSEL_BY_SHIP).find((key) => {
    if (key === "default") return false;
    return shipLower.includes(key) || magneticLower.includes(key);
  });

  return matchedKey ? SHIP_CAROUSEL_BY_SHIP[matchedKey] : SHIP_CAROUSEL_BY_SHIP.default;
};

const App: React.FC = () => {
  const [step, setStep] = useState<'intro' | 'questions' | 'loading' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<LeadData>>({});
  const [displayValue, setDisplayValue] = useState('');
  const [tempNumber, setTempNumber] = useState<string>('');
  const [tempText, setTempText] = useState<string>('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Preferência do lead
  const [selectedPreference, setSelectedPreference] = useState<string | null>(null);

  // Tela B (pós-escolha)
  const [showPostChoice, setShowPostChoice] = useState(false);
  const [isDraftingMsg, setIsDraftingMsg] = useState(false);

  // Features adicionais
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [socialProof, setSocialProof] = useState<{ name: string; city: string; action: string } | null>(null);
  const [showSocial, setShowSocial] = useState(false);

  // Modal de Ajuda
  const [showCabinHelp, setShowCabinHelp] = useState(false);

  const formatBRL = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const number = (Number(digits) / 100).toFixed(2);
    const parts = number.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  };

  const parseBRLToNumber = (value: string) => {
    return Number(value.replace(/\D/g, '')) / 100;
  };

  // Timer logic
  useEffect(() => {
    let timer: number;
    if (step === 'results' && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Social Proof logic
  useEffect(() => {
    let interval: number;
    if (step === 'results') {
      interval = window.setInterval(() => {
        const randomIdx = Math.floor(Math.random() * SOCIAL_PROOFS.length);
        setSocialProof(SOCIAL_PROOFS[randomIdx]);
        setShowSocial(true);
        setTimeout(() => setShowSocial(false), 5000);
      }, 12000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: number;
    if (step === 'loading') {
      interval = window.setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [step]);

  const startConsultation = () => {
    setStep('questions');
    setCurrentQuestionIndex(0);
    setFormData({});
    setDisplayValue('');
    setTempNumber('');
    setTempText('');
    setError(null);

    setSelectedPreference(null);
    setShowPostChoice(false);
    setIsDraftingMsg(false);

    setTimeLeft(900);
  };

  const resetPlan = () => {
    setStep('intro');
    setFormData({});
    setAnalysis(null);
    setError(null);
    setCurrentQuestionIndex(0);
    setDisplayValue('');
    setTempNumber('');
    setTempText('');

    setSelectedPreference(null);
    setShowPostChoice(false);
    setIsDraftingMsg(false);
  };

  const handleNext = (value?: any, isEducationRequest = false) => {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    let finalValue = value;

    console.log("👉 Avançando passo:", { index: currentQuestionIndex, question: currentQuestion.id, val: value });

    if (currentQuestion.id === 'name') {
      finalValue = tempText.trim();
      if (!finalValue) {
        setError("Por favor, me diga como te chamar!");
        return;
      }
    } else if (currentQuestion.id === 'budget') {
      finalValue = parseBRLToNumber(displayValue);
      if (finalValue < 2000) {
        setError("Cruzeiros nacionais exigem um investimento mínimo para uma boa experiência. Ajuste seu orçamento.");
        return;
      }
    } else if (currentQuestion.type === 'number' && value === undefined) {
      finalValue = Number(tempNumber);
      if (!tempNumber || finalValue <= 0) {
        setError("Por favor, informe um valor válido.");
        return;
      }
    }

    setShowCabinHelp(false);

    const newFormData = {
      ...formData,
      [currentQuestion.id]: finalValue,
      needsCabinEducation: formData.needsCabinEducation || isEducationRequest
    };

    setFormData(newFormData);
    setError(null);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setDisplayValue('');
      setTempNumber('');
      setTempText('');
    } else {
      console.log("🏁 Última pergunta respondida. Iniciando análise...");
      processAnalysis(newFormData as LeadData);
    }
  };

  const processAnalysis = async (data: LeadData) => {
    setStep('loading');

    // Marca o tempo inicial para garantir o delay mínimo ("Teatro" da IA)
    const startTime = Date.now();

    try {
      console.log("🚀 Chamando Gemini Service com:", data);

      const result = await analyzeCruiseProfile(data);
      console.log("✅ Resultado Gemini recebido:", result);

      if (!result) throw new Error("Retorno vazio da API");

      // Calcula quanto tempo passou e aguarda o restante se necessário
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setAnalysis(result);
      setStep('results');

      setSelectedPreference(null);
      setShowPostChoice(false);
      setIsDraftingMsg(false);
    } catch (err) {
      console.error("❌ ERRO FATAL NA ANÁLISE:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Falha ao conectar com a IA: ${errorMessage}. Verifique o console.`);
      setStep('questions');
    }
  };

  const handleWhatsApp = (recTitle?: string, shareWithPartner = false) => {
    if (!analysis || !formData) return;

    if (!shareWithPartner && !(recTitle || selectedPreference)) return;

    const bestRec = analysis.recommendations.find(r => r.isRecommended) || analysis.recommendations[0];
    const chosen = recTitle || selectedPreference || bestRec.magneticName;

    let text = "";
    if (shareWithPartner) {
      text =
        `Olha o que a Sol encontrou para nossa viagem! 🚢\n\n` +
        `*Opção:* ${chosen}\n` +
        `*Navio:* ${bestRec.ship}\n` +
        `*Valor:* ${bestRec.estimatedPrice}\n\n` +
        `Achei que tem tudo a ver com a gente. Vamos fechar?`;
    } else {
      const budgetFormatted = formData.budget?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const cabinNote = formData.needsCabinEducation
        ? `\n⚠️ *Nota:* O cliente pediu ajuda para entender as cabines. Por favor, apresente opções de Interna vs Varanda se possível.`
        : ``;

            text =
        `Olá equipe MCATUR 🙂\n` +
        `Vim encaminhado pela consultora digital *Sol* e gostaria de avançar com minha reserva.\n\n` +
        `★ *RESUMO DO PROJETO DE VIAGEM*\n` +
        `-----------------------------------\n` +
        `➤ *Titular:* ${formData.name}\n` +
        `➤ *Grupo:* ${formData.peopleCount} pessoas (${formData.profile})\n` +
        `➤ *Período:* ${formData.period}\n` +
        `➤ *Roteiro:* ${formData.route}\n` +
        `➤ *Prioridade:* ${formData.priority}\n` +
        `➤ *Cabine:* ${formData.cabin}\n` +
        `➤ *Budget:* ${budgetFormatted}\n` +
        `➤ *Experiência:* ${formData.experience}\n\n` +
        `★ *MINHA ESCOLHA FINAL*\n` +
        `➤ *${chosen}*\n` +
        `➤ *Navio:* ${bestRec.ship}\n` +
        `➤ *Valor Previsto:* ${bestRec.estimatedPrice}\n` +
        `${cabinNote}\n` +
        `-----------------------------------\n` +
        `Pode confirmar a disponibilidade e me enviar as condições de pagamento para fechar hoje? ✔`;

    }

    window.open(
      `https://wa.me/${shareWithPartner ? '' : '5519974010028'}?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  if (!currentQuestion && step === 'questions') {
    return (
      <div>
        Erro: Índice de pergunta inválido. <button onClick={resetPlan}>Reiniciar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-12 overflow-x-hidden">
      <header className="w-full bg-blue-900 p-4 shadow-lg flex items-center justify-between px-6 text-white sticky top-0 z-50 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <Sun className="w-6 h-6 text-yellow-400" />
          <span className="font-display font-bold text-sm tracking-tighter uppercase">Sol • Consultora Digital</span>
        </div>
        <div className="bg-yellow-400 text-blue-900 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
          AGÊNCIA AUTORIZADA
        </div>
      </header>

      {/* Social Proof */}
      <div
        className={`fixed bottom-24 left-4 right-4 z-[100] transition-all duration-500 transform ${showSocial ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
          }`}
      >
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 max-w-xs mx-auto">
          <div className="bg-emerald-500 p-2 rounded-full text-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] leading-tight">
              <span className="font-bold">{socialProof?.name} de {socialProof?.city}</span> {socialProof?.action}
            </p>
          </div>
        </div>
      </div>

      <main className="w-full max-w-md px-4 pt-6">
        {step === 'intro' && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative inline-block">
              <div className="bg-white p-8 rounded-full shadow-2xl animate-float border-4 border-yellow-50">
                <Sun className="w-16 h-16 text-yellow-500 fill-yellow-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                <MessageCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-display font-extrabold text-blue-900 leading-tight">
                Olá! Me chamo Sol. <br />
                <span className="text-blue-600">Vamos Navegar?</span>
              </h2>
              <p className="text-slate-600 font-medium px-4">
                Em menos de 2 minutos vou encontrar as 3 melhores opções de cruzeiro para você.
              </p>
            </div>
            <button
              onClick={startConsultation}
              className="w-full bg-blue-700 text-white font-black py-6 rounded-3xl shadow-2xl flex items-center justify-center gap-2 text-xl active:scale-95 transition-all hover:bg-blue-800"
            >
              Iniciar Consultoria <ChevronRight />
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Pesquisa Digital Inteligente
            </p>
          </div>
        )}

        {step === 'questions' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-blue-50 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 bg-yellow-400/10 w-32 h-32 rounded-full" />

              <div className="flex justify-between items-center mb-8 relative z-10">
                <span className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">
                  PASSO {currentQuestionIndex + 1} DE {QUESTIONS.length}
                </span>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-8 leading-tight relative z-10">
                {currentQuestion.question}
              </h3>

              {currentQuestion.id === 'name' ? (
                <div className="space-y-4 relative z-10">
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      placeholder={currentQuestion.placeholder}
                      value={tempText}
                      onChange={(e) => setTempText(e.target.value)}
                      className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-yellow-400 outline-none text-2xl font-bold text-center text-blue-900"
                    />
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
                  </div>
                  <button
                    onClick={() => handleNext()}
                    className="w-full bg-blue-700 text-white py-5 rounded-2xl font-black shadow-lg text-lg"
                  >
                    Começar, Sol!
                  </button>
                </div>
              ) : currentQuestion.id === 'budget' ? (
                <div className="space-y-4 relative z-10">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="R$ 0,00"
                    value={displayValue}
                    onChange={(e) => setDisplayValue(formatBRL(e.target.value))}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-yellow-400 outline-none text-4xl font-black text-center text-blue-900 placeholder:text-slate-200"
                  />
                  <button
                    onClick={() => handleNext()}
                    className="w-full bg-blue-700 text-white py-5 rounded-2xl font-black shadow-lg text-lg"
                  >
                    Próximo
                  </button>
                </div>
              ) : currentQuestion.type === 'number' ? (
                <div className="space-y-4 relative z-10">
                  <div className="relative">
                    <input
                      type="number"
                      autoFocus
                      placeholder={currentQuestion.placeholder}
                      value={tempNumber}
                      onChange={(e) => setTempNumber(e.target.value)}
                      className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-yellow-400 outline-none text-4xl font-black text-center"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase text-xs">
                      {currentQuestion.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNext()}
                    className="w-full bg-blue-700 text-white py-5 rounded-2xl font-black shadow-lg text-lg"
                  >
                    Continuar
                  </button>
                </div>
              ) : (
                <div className="space-y-3 relative z-10">
                  {currentQuestion.options?.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleNext(opt)}
                      className="w-full text-left p-6 rounded-2xl border-2 border-slate-50 hover:border-yellow-400 hover:bg-yellow-50 flex items-center justify-between font-bold text-slate-700 transition-all active:scale-95"
                    >
                      {opt} <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  ))}

                  {/* Botão de Ajuda na Cabine */}
                  {currentQuestion.id === 'cabin' && (
                    <button
                      onClick={() => setShowCabinHelp(true)}
                      className="w-full text-center py-4 text-blue-600 font-bold text-sm underline underline-offset-4 hover:text-blue-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Não sei... me explique as cabines
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-5 rounded-2xl flex items-start gap-3 border border-red-100 animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center space-y-8 pt-12 animate-in fade-in">
            <div className="relative flex justify-center">
              <div className="w-28 h-28 border-[10px] border-slate-100 border-t-yellow-400 rounded-full animate-spin" />
              <Sun className="w-12 h-12 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-4 px-6">
              <h3 className="text-2xl font-black text-blue-900 leading-tight">
                {formData.name ? `Calma, ${formData.name}, ` : ''}
                {LOADING_MESSAGES[loadingMsgIndex]}
              </h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Inteligência Sol Ativa</p>
            </div>
          </div>
        )}

        {step === 'results' && analysis && (
          <div className="space-y-8 pb-40 animate-in slide-in-from-bottom-8">
            {/* Scarcity */}
            <div className="bg-red-600 text-white py-3 px-6 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Bônus Expira em:</span>
              </div>
              <span className="text-xl font-mono font-black">{formatTime(timeLeft)}</span>
            </div>

            {/* Sol Persona Box */}
            <div className="bg-blue-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sun className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-400 p-2 rounded-full text-blue-900">
                  <Sun className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black font-display">Relatório Especial para {formData.name}</h2>
              </div>
              <p className="text-sm leading-relaxed font-medium opacity-90">"{analysis.solIntro}"</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" /> Consultoria Personalizada por Sol
              </div>
            </div>

            {/* QUICK COMPARISON TABLE */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <div className="bg-slate-50 p-4 border-b border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Resumo Comparativo
                </h4>
              </div>
              <div className="divide-y divide-slate-100">
                {analysis.recommendations.map((rec) => (
                  <div
                    key={rec.type}
                    className={`flex items-center p-4 gap-3 ${rec.isRecommended ? 'bg-yellow-50/50' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${rec.type === 'ECONOMY'
                              ? 'bg-slate-100 text-slate-500'
                              : rec.type === 'IDEAL'
                                ? 'bg-yellow-400 text-blue-900'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                        >
                          {rec.type === 'IDEAL' ? 'Indicado' : rec.type}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{rec.ship}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 line-through leading-none">{rec.totalValue}</p>
                      <p className="text-blue-900 font-black text-sm">{rec.estimatedPrice}</p>
                    </div>
                    <button
                      onClick={() => {
                        const element = document.getElementById(`rec-${rec.type}`);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-slate-100 p-2 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <h4 className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase mb-3">
                <Calculator className="w-4 h-4" /> Diagnóstico da Viagem
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed italic">"{analysis.tradeOffs}"</p>
            </div>

            {/* RECOMMENDATIONS CARDS */}
            <div className="space-y-12">
              {analysis.recommendations.map((rec, i) => (
                <div
                  id={`rec-${rec.type}`}
                  key={i}
                  className={`rounded-[2.5rem] border-2 overflow-hidden shadow-2xl transition-all relative ${rec.isRecommended ? 'border-yellow-400 ring-8 ring-yellow-50 bg-white' : 'border-slate-200 bg-white'
                    }`}
                >
                  {rec.isRecommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-blue-900 px-6 py-2 rounded-full font-black text-xs uppercase shadow-lg z-20 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-blue-900" /> Indicação da Sol
                    </div>
                  )}

                  <div className="relative">
                    {/* CARROSSEL DE IMAGENS NOS CARDS (ETAPA 3) */}
<div className="relative h-64 w-full overflow-hidden">
  <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar">
    {resolveShipCarouselImages(rec.ship, rec.magneticName).map((img, idx) => (
      <div key={idx} className="h-full w-full flex-shrink-0 snap-center">
        <img
          src={img}
          alt={`${rec.ship} ${idx + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
    ))}
  </div>

  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
    {resolveShipCarouselImages(rec.ship, rec.magneticName).map((_, idx) => (
      <span key={idx} className="w-2 h-2 rounded-full bg-white/70 shadow-sm" />
    ))}
  </div>
</div>


                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Valor Total</p>
                      <p className="text-slate-400 line-through text-xs font-bold">{rec.totalValue}</p>
                      <p className="text-blue-900 font-black text-2xl leading-none mt-1">{rec.estimatedPrice}</p>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-blue-900/80 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                        {rec.ship}
                      </span>
                    </div>
                  </div>

                  <div className="p-8">
                    <h4 className="font-black text-slate-900 text-2xl leading-tight mb-2 font-display">{rec.magneticName}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                      {rec.duration} • {rec.cabinType}
                    </p>

                    <div className="space-y-4 mb-8">
                      <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                        Pilha de Valor Exclusiva:
                      </h5>
                      {rec.bonusStack.map((bonus, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="bg-white p-2 rounded-xl shadow-sm text-yellow-500">
                            <Gift className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-black text-slate-800 text-sm">{bonus.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 line-through font-bold">{bonus.value}</span>
                                <span className="flex items-center gap-0.5 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-tighter">
                                  <Tag className="w-2 h-2" /> Grátis!
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">{bonus.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-5 bg-emerald-50 rounded-2xl text-emerald-800 mb-6 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Garantia Sol de Satisfação</span>
                      </div>
                      <p className="text-xs font-bold leading-relaxed">{rec.guarantee}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Preference Interaction (Tela A -> Tela B) */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-emerald-100 text-center space-y-6">
              {!showPostChoice ? (
                <>
                  <Sun className="w-12 h-12 text-yellow-500 mx-auto animate-pulse" />
                  <h3 className="text-2xl font-black text-blue-900 leading-tight">{analysis.preferenceQuestion}</h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Se me contar qual te encantou, posso tentar garantir uma cabine em localização privilegiada ou um desconto direto no fechamento!
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {analysis.recommendations.map((rec) => (
                      <button
                        key={rec.magneticName}
                        onClick={() => {
                          setSelectedPreference(rec.magneticName);
                          setShowPostChoice(true);
                          setIsDraftingMsg(true);
                          setTimeout(() => setIsDraftingMsg(false), 1800);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all flex justify-between items-center group ${selectedPreference === rec.magneticName
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex flex-col text-left">
                          {rec.isRecommended && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                              ★ Indicação da Sol
                            </span>
                          )}
                          <span className={`font-bold text-sm ${selectedPreference === rec.magneticName ? 'text-emerald-900' : 'text-slate-700'}`}>
                            {rec.magneticName}
                          </span>
                          <span className="text-xs text-slate-500 font-medium mt-0.5">{rec.ship}</span>
                          <span className="text-sm font-black text-blue-900 mt-1">{rec.estimatedPrice}</span>
                        </div>

                        <div className="flex items-center">
                          {selectedPreference === rec.magneticName ? (
                            <div className="bg-emerald-500 rounded-full p-1">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                    Toque em 1 opção para eu destravar a melhor condição no WhatsApp
                  </p>
                </>
              ) : (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-full mb-3 ring-4 ring-emerald-50">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight">
                      Hummm… ótima escolha, {formData.name || 'Viajante'}! 😄
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-2">
                      Você escolheu: <span className="font-bold text-emerald-700">{selectedPreference}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 border-2 border-emerald-100 rounded-2xl p-5 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4"></div>

                    <div className="relative z-10 space-y-3">
                      {isDraftingMsg ? (
                        <p className="text-sm font-bold text-slate-700 animate-pulse">
                          Aguarde... estou compilando seus bônus para a diretoria da MCATUR.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-800 leading-relaxed">
                            Perfeito. Agora você vai falar com a agência que executa essa rota com prioridade máxima hoje.
                          </p>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            A MCATUR já recebe seu perfil completo e validado por mim Sol. Nada de repetir informações. Nada de perder tempo.
                          </p>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            No WhatsApp, um consultor humano vai te responder com:
                          </p>

                          <ul className="text-xs text-slate-600 leading-relaxed list-disc list-inside space-y-1">
                            <li>disponibilidade real de cabine (antes de esgotar)</li>
                            <li>valor com desconto final atualizado</li>
                            <li>condições especiais de fechamento</li>
                            <li>próximos passos simples para confirmar sua reserva</li>
                          </ul>
                          {/* Bloco Institucional MCATUR */}
                          <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Building2 className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Agência MCATUR Turismo</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-[10px]">Atuando desde 2014 • Sede física em São Paulo</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-500">
                                <Phone className="w-3 h-3" />
                                <span className="text-[10px]">Telefone fixo: (11) 3040-1860</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={isDraftingMsg}
                    onClick={() => handleWhatsApp(selectedPreference || undefined)}
                    className={`w-full font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-200 flex flex-col items-center justify-center gap-1 text-lg active:scale-95 transition-all relative overflow-hidden group
                      ${isDraftingMsg ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                  >
                    {!isDraftingMsg && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-[1.5rem]"></div>}

                    <div className="flex items-center gap-2 relative z-10">
                      <MessageCircle className="w-6 h-6" />
                      <span>{isDraftingMsg ? 'Processando...' : 'Apertar o Botão Verde'}</span>
                    </div>
                    <span className="text-[10px] opacity-90 uppercase tracking-[0.15em] font-bold relative z-10">
                      Receber a melhor condição no WhatsApp
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowPostChoice(false);
                      setIsDraftingMsg(false);
                    }}
                    className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                  >
                    Trocar minha escolha
                  </button>
                </div>
              )}
            </div>

            <div className="p-8 bg-yellow-400 rounded-[2.5rem] shadow-xl text-center">
              <Zap className="w-12 h-12 text-blue-900 mx-auto mb-4" />
              <p className="text-blue-900 font-black text-lg mb-4 leading-tight">{analysis.conversionTrigger}</p>
              <div className="bg-blue-900 text-yellow-400 px-6 py-4 rounded-3xl text-sm font-black uppercase shadow-lg">
                VÁLIDO POR {formatTime(timeLeft)}: {analysis.fastActionBonus}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE EXPLICAÇÃO (Obrigatório para funcionar) */}
      {showCabinHelp && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCabinHelp(false)} />

          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl relative animate-in slide-in-from-bottom duration-300">
            <button onClick={() => setShowCabinHelp(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-red-500">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-blue-900">{QUESTIONS.find(q => q.id === 'cabin')?.helpContent?.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Entenda para escolher melhor</p>
            </div>

            <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
              {QUESTIONS.find(q => q.id === 'cabin')?.helpContent?.cards.map((card, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-blue-900 text-sm mb-1">{card.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{card.description}</p>
                  <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-blue-600 border border-blue-100 uppercase tracking-wide">
                    Ideal para: {card.bestFor}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setShowCabinHelp(false)}
                className="w-full bg-blue-700 text-white py-4 rounded-xl font-black shadow-lg text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Entendi, quero escolher agora
              </button>

              <button
                onClick={() => handleNext('Ainda não decidi / Quero ajuda', true)}
                className="w-full bg-white text-slate-500 py-3 rounded-xl font-bold border border-slate-200 text-xs hover:bg-slate-50"
              >
                Ainda estou na dúvida (Avançar assim mesmo)
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto pt-16 pb-12 text-center px-10">
        <Sun className="w-8 h-8 text-slate-200 mx-auto mb-4" />
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
          Especialista Em Encontrar Ofertas Para Cruzeiros<br />
          Promoção valida para {formData.name || 'Você'}.
        </p>
        <button
          onClick={resetPlan}
          className="mt-4 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-600"
        >
          Reiniciar Consultoria
        </button>
      </footer>
    </div>
  );
};

export default App;