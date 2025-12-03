import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';
import { initGooglePixel } from '../utils/googlePixel';
import { navigateWithParams } from '../utils/urlParams';

interface Question {
  id: number;
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    question: 'Você já tem conta no Roxinho?',
    options: ['Sim, tenho conta', 'Não, ainda não tenho', 'Estou abrindo conta']
  },
  {
    id: 2,
    question: 'Como você considera sua vida financeira atual?',
    options: ['Saudável e organizada', 'Precisa de melhorias', 'Em dificuldades']
  },
  {
    id: 3,
    question: 'Qual seu principal objetivo financeiro agora?',
    options: ['Obter crédito', 'Organizar dívidas', 'Investir e poupar']
  }
];

export default function PresellPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    initGooglePixel();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestion]);

  const handleOptionSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResults(true);
      }
    }, 400);
  };

  const handleContinue = () => {
    navigateWithParams(navigate, '/', location);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {!showResults ? (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 animate-fadeIn">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-purple-600">
                    Pergunta {currentQuestion + 1} de {questions.length}
                  </span>
                  <span className="text-sm font-semibold text-purple-600">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
                {questions[currentQuestion].question}
              </h2>

              <div className="space-y-4">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    className={`w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg hover:scale-[1.02] ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-left font-medium text-gray-700 group-hover:text-purple-700">
                      {option}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center animate-fadeIn">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Ótimo! Questionário Concluído
              </h2>

              <p className="text-lg text-gray-600 mb-8">
                Obrigado por compartilhar suas informações. Agora vamos verificar as melhores opções disponíveis para você!
              </p>

              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <span>Continuar para Consulta</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-xs text-gray-500 mt-6">
                Ao continuar, você concorda com nossos{' '}
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="text-purple-600 hover:underline"
                >
                  Termos de Uso
                </button>{' '}
                e{' '}
                <button
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-purple-600 hover:underline"
                >
                  Política de Privacidade
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-purple-900 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm mb-2">
            CNPJ: 63.318.866/0001-65 - Todos os direitos reservados
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <button
              onClick={() => setShowTermsModal(true)}
              className="hover:underline transition-all"
            >
              Termos de Uso
            </button>
            <span>•</span>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:underline transition-all"
            >
              Política de Privacidade
            </button>
          </div>
        </div>
      </footer>

      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Termos de Uso</h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p>
                <strong>1. Aceitação dos Termos</strong><br />
                Ao utilizar este serviço, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
              </p>
              <p>
                <strong>2. Uso do Serviço</strong><br />
                Este serviço destina-se a fornecer informações sobre produtos financeiros. O usuário é responsável por fornecer informações precisas e verdadeiras.
              </p>
              <p>
                <strong>3. Privacidade</strong><br />
                Respeitamos sua privacidade e protegemos suas informações pessoais de acordo com nossa Política de Privacidade.
              </p>
              <p>
                <strong>4. Limitação de Responsabilidade</strong><br />
                Este serviço é fornecido "como está" sem garantias de qualquer tipo. Não nos responsabilizamos por decisões tomadas com base nas informações fornecidas.
              </p>
              <p>
                <strong>5. Modificações</strong><br />
                Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso continuado do serviço após tais modificações constitui aceitação dos novos termos.
              </p>
              <p>
                <strong>6. Contato</strong><br />
                Para questões sobre estes termos, entre em contato através dos canais oficiais.
              </p>
              <p className="mt-6 text-xs text-gray-500">
                CNPJ: 63.318.866/0001-65
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="mt-6 w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Política de Privacidade</h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p>
                <strong>1. Coleta de Informações</strong><br />
                Coletamos informações que você nos fornece diretamente, incluindo dados pessoais necessários para prestação de serviços.
              </p>
              <p>
                <strong>2. Uso das Informações</strong><br />
                Utilizamos suas informações para: fornecer e melhorar nossos serviços, processar solicitações, comunicar sobre produtos e serviços, e cumprir obrigações legais.
              </p>
              <p>
                <strong>3. Compartilhamento de Informações</strong><br />
                Não vendemos suas informações pessoais. Podemos compartilhar dados com parceiros de serviço que nos auxiliam nas operações, sempre sob acordos de confidencialidade.
              </p>
              <p>
                <strong>4. Segurança</strong><br />
                Implementamos medidas de segurança apropriadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
              <p>
                <strong>5. Seus Direitos</strong><br />
                Você tem direito de acessar, corrigir ou excluir suas informações pessoais. Entre em contato conosco para exercer esses direitos.
              </p>
              <p>
                <strong>6. Cookies e Tecnologias Similares</strong><br />
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar uso do serviço e personalizar conteúdo.
              </p>
              <p>
                <strong>7. Alterações na Política</strong><br />
                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através do serviço ou por outros meios.
              </p>
              <p>
                <strong>8. Lei Geral de Proteção de Dados (LGPD)</strong><br />
                Estamos em conformidade com a LGPD e respeitamos todos os direitos dos titulares de dados.
              </p>
              <p className="mt-6 text-xs text-gray-500">
                CNPJ: 63.318.866/0001-65
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="mt-6 w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
