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
  CheckCircle2
} from 'lucide-react';
import { QUESTIONS } from './constants';
import { LeadData, AIAnalysis } from './types';
import { analyzeCruiseProfile } from './geminiService';

const LOADING_MESSAGES = [
  "Sol está consultando as rotas da MSC e Costa...",
  "Buscando as melhores cabines para o seu perfil...",
  "Sol está negociando seus bônus exclusivos...",
  "Calculando a melhor vivência baseada no seu desejo...",
  "Quase pronto! Sol está finalizando seu plano de ouro..."
];

const SOCIAL_PROOFS = [
  { name: "Mariana", city: "Curitiba", action: "garantiu o bônus de cabine" },
  { name: "Carlos", city: "São Paulo", action: "reservou o MSC Grandiosa" },
  { name: "Beatriz", city: "Belo Horizonte", action: "acaba de falar com a Sol" },
  { name: "Ricardo", city: "Porto Alegre", action: "escolheu a cabine com varanda" },
  { name: "Fernanda", city: "Brasília", action: "recebeu o upgrade Yacht Club" },
  { name: "André", city: "Salvador", action: "economizou R$ 1.200 na reserva" }
];

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

  // Features adicionais já existentes
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [socialProof, setSocialProof] = useState<{ name: string; city: string; action: string } | null>(null);
  const [showSocial, setShowSocial] = useState(false);

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
      }, 3000);
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

  const handleNext = (value?: any) => {
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

    const newFormData = { ...formData, [currentQuestion.id]: finalValue };
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

    // pequeno delay para garantir UI de loading
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log("🚀 Chamando Gemini Service com:", data);
      const result = await analyzeCruiseProfile(data);
      console.log("✅ Resultado Gemini recebido:", result);

      if (!result) throw new Error("Retorno vazio da API");

      setAnalysis(result);
      setStep('results');

      // reset de estados de preferência ao entrar nos resultados
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

    // Exige escolha no fluxo principal (não no compartilhar)
    if (!shareWithPartner && !(recTitle || selectedPreference)) return;

    const bestRec = analysis.recommendations.find(r => r.isRecommended) || analysis.recommendations[0];
    const chosen = recTitle || selectedPreference || bestRec.magneticName;

    let text = "";
    if (shareWithPartner) {
      text =
        `Olha o que a Sol encontrou para nossa viagem! 🚢\n\n` +
        `Opção: ${chosen}\n` +
        `Navio: ${bestRec.ship}\n` +
        `Valor aproximado: ${bestRec.estimatedPrice}\n\n` +
        `Achei que combina muito com a gente. O que acha?`;
    } else {
      const budgetFormatted = formData.budget?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      text =
        `Olá Sol! 🚢 Acabei de finalizar minha consultoria digital e estou muito animado(a) para navegar!\n\n` +
        `Aqui está o resumo do meu *Projeto de Viagem*:\n\n` +
        `👤 *Viajante:* ${formData.name}\n` +
        `👥 *Passageiros:* ${formData.peopleCount} pessoas (${formData.profile})\n` +
        `📅 *Período:* ${formData.period}\n` +
        `📍 *Destino:* ${formData.route}\n` +
        `💎 *Foco:* ${formData.priority}\n` +
        `🛌 *Cabine:* ${formData.cabin}\n` +
        `💰 *Orçamento:* ${budgetFormatted}\n` +
        `⚓ *Experiência:* ${formData.experience}\n\n` +
        `⭐ *MINHA PREFERÊNCIA:*\n` +
        `*${chosen}*\n\n` +
        `Quero garantir meus *Bônus de Ação Rápida* e as condições especiais que você encontrou para mim! Como prosseguimos com a reserva?`;
    }

    window.open(
      `https://wa.me/${shareWithPartner ? '' : '5511981366140'}?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  // Safeguard
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
          AGÊNCIA PREMIUM
        </div>
      </header>

      {/* Social Proof Notification */}
      <div
        className={`fixed bottom-24 left-4 right-4 z-[100] transition-all duration-500 transform ${
          showSocial ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
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
              Atendimento Digital Inteligente
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
            {/* Real Scarcity Counter */}
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
                          className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                            rec.type === 'ECONOMY'
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

            <div className="space-y-12">
              {analysis.recommendations.map((rec, i) => (
                <div
                  id={`rec-${rec.type}`}
                  key={i}
                  className={`rounded-[2.5rem] border-2 overflow-hidden shadow-2xl transition-all relative ${
                    rec.isRecommended ? 'border-yellow-400 ring-8 ring-yellow-50 bg-white' : 'border-slate-200 bg-white'
                  }`}
                >
                  {rec.isRecommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-blue-900 px-6 py-2 rounded-full font-black text-xs uppercase shadow-lg z-20 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-blue-900" /> Indicação da Sol
                    </div>
                  )}

                  <div className="relative">
                    <img src={rec.imageUrl} alt={rec.ship} className="h-64 w-full object-cover" />
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

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          setSelectedPreference(rec.magneticName);
                          handleWhatsApp(rec.magneticName);
                        }}
                        className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                      >
                        Escolher esta Opção <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(rec.magneticName, true)}
                        className="w-full py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                      >
                        <Share2 className="w-4 h-4" /> Compartilhar com meu Par
                      </button>
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
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all text-left flex justify-between items-center ${
                          selectedPreference === rec.magneticName
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200'
                        }`}
                      >
                        {rec.magneticName}
                        {selectedPreference === rec.magneticName && (
                          <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                    Escolha 1 opção para continuar
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <Sun className="w-12 h-12 text-yellow-500 mx-auto animate-pulse" />

                  <h3 className="text-2xl font-black text-blue-900 leading-tight">
                    Hummm… ótima escolha, {formData.name || 'meu viajante'}! 😄
                  </h3>

                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Você escolheu: <span className="font-black text-emerald-700">{selectedPreference}</span>
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                    <p className="text-sm font-bold text-slate-700">
                      {isDraftingMsg
                        ? `Só alguns segundos, ${formData.name || 'meu viajante'}… estou montando um textinho curto pro meu gerente.`
                        : `Pronto! Agora aperte o botão verde pra eu enviar pro meu gerente. Ele costuma destravar condições melhores rapidinho.`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Ele vai te responder no WhatsApp com a melhor condição possível.
                    </p>
                  </div>

                  <button
                    disabled={isDraftingMsg}
                    onClick={() => handleWhatsApp(selectedPreference || undefined)}
                    className={`w-full font-black py-6 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-1 text-xl active:scale-95 transition-all
                      ${isDraftingMsg ? 'bg-emerald-300 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-7 h-7" />
                      <span>{isDraftingMsg ? 'Aguarde...' : 'Apertar o Botão Verde'}</span>
                    </div>
                    <span className="text-[10px] opacity-80 uppercase tracking-[0.2em] font-bold">
                      Enviar para o Gerente no WhatsApp
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowPostChoice(false);
                      setIsDraftingMsg(false);
                    }}
                    className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800"
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

      <footer className="mt-auto pt-16 pb-12 text-center px-10">
        <Sun className="w-8 h-8 text-slate-200 mx-auto mb-4" />
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
          Framework Sol AI & $100M Offers.<br />
          Engenharia de Valor para {formData.name || 'Você'}.
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
