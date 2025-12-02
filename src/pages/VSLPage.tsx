import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserMenu from '../components/UserMenu';
import { navigateWithParams } from '../utils/urlParams';

export default function VSLPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, loanAmount, selectedInstallments, installmentValue, selectedDueDate, protocol, urlParams, profileAnswers, loanPriority, nubankCustomer, creditStatus } = location.state || {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!userData) {
      navigate('/');
    }
  }, [navigate, userData]);

  useEffect(() => {
    const script1 = document.createElement('script');
    script1.innerHTML = `!function(i,n){i._plt=i._plt||(n&&n.timeOrigin?n.timeOrigin+n.now():Date.now())}(window,performance);`;
    document.head.appendChild(script1);

    const preloadEmbed = document.createElement('link');
    preloadEmbed.rel = 'preload';
    preloadEmbed.href = 'https://scripts.converteai.net/f5ab9e88-cc1b-4dce-a537-c7de7e019d8b/players/692e3b983dbab420e99085ca/v4/embed.html';
    document.head.appendChild(preloadEmbed);

    const preloadPlayer = document.createElement('link');
    preloadPlayer.rel = 'preload';
    preloadPlayer.href = 'https://scripts.converteai.net/f5ab9e88-cc1b-4dce-a537-c7de7e019d8b/players/692e3b983dbab420e99085ca/v4/player.js';
    preloadPlayer.as = 'script';
    document.head.appendChild(preloadPlayer);

    const preloadSmartplayer = document.createElement('link');
    preloadSmartplayer.rel = 'preload';
    preloadSmartplayer.href = 'https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js';
    preloadSmartplayer.as = 'script';
    document.head.appendChild(preloadSmartplayer);

    const preloadVideo = document.createElement('link');
    preloadVideo.rel = 'preload';
    preloadVideo.href = 'https://cdn.converteai.net/f5ab9e88-cc1b-4dce-a537-c7de7e019d8b/692e3b878c029b83a0a378e2/main.m3u8';
    preloadVideo.as = 'fetch';
    document.head.appendChild(preloadVideo);

    const dnsPrefetch1 = document.createElement('link');
    dnsPrefetch1.rel = 'dns-prefetch';
    dnsPrefetch1.href = 'https://cdn.converteai.net';
    document.head.appendChild(dnsPrefetch1);

    const dnsPrefetch2 = document.createElement('link');
    dnsPrefetch2.rel = 'dns-prefetch';
    dnsPrefetch2.href = 'https://scripts.converteai.net';
    document.head.appendChild(dnsPrefetch2);

    const dnsPrefetch3 = document.createElement('link');
    dnsPrefetch3.rel = 'dns-prefetch';
    dnsPrefetch3.href = 'https://images.converteai.net';
    document.head.appendChild(dnsPrefetch3);

    const dnsPrefetch4 = document.createElement('link');
    dnsPrefetch4.rel = 'dns-prefetch';
    dnsPrefetch4.href = 'https://api.vturb.com.br';
    document.head.appendChild(dnsPrefetch4);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(preloadEmbed);
      document.head.removeChild(preloadPlayer);
      document.head.removeChild(preloadSmartplayer);
      document.head.removeChild(preloadVideo);
      document.head.removeChild(dnsPrefetch1);
      document.head.removeChild(dnsPrefetch2);
      document.head.removeChild(dnsPrefetch3);
      document.head.removeChild(dnsPrefetch4);
    };
  }, []);

  if (!userData) {
    return null;
  }

  const firstName = userData.nome.split(' ')[0];

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleContinue = () => {
    navigateWithParams(
      navigate,
      '/detalhamento-taxas',
      location,
      {
        userData,
        indemnityAmount: loanAmount,
        pixKeyType: 'cpf',
        pixKey: userData.cpf,
        loanAmount,
        selectedInstallments,
        installmentValue,
        selectedDueDate,
        protocol,
        profileAnswers,
        loanPriority,
        nubankCustomer,
        creditStatus
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col">
      <Header showUserIcon={true} onMenuClick={handleMenuClick} />
      <UserMenu isOpen={isMenuOpen} onClose={handleMenuClose} userName={firstName} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 pt-24 sm:pt-28 pb-20">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="text-center mb-6 animate-fade-in-down">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">Informação Importante</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Última etapa para liberar seu empréstimo
            </h1>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{firstName}</span>, assista ao vídeo e veja como liberar o seu empréstimo de <span className="text-green-600 font-bold">R$ {formatCurrency(loanAmount)}</span>
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 mb-4 shadow-sm animate-slide-up">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 mb-1">Vídeo Explicativo</h2>
                <p className="text-xs text-gray-600">Entenda por que do seguro prestamista.</p>
              </div>
            </div>

            <div className="relative w-full rounded-lg overflow-hidden bg-gray-900" style={{ paddingTop: '56.25%' }}>
              <iframe
                id="panda-692e3b98-3dba-b420-e990-85ca"
                src="https://scripts.converteai.net/f5ab9e88-cc1b-4dce-a537-c7de7e019d8b/players/692e3b983dbab420e99085ca/v4/embed.html"
                className="absolute top-0 left-0 w-full h-full"
                style={{ border: 'none' }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 mb-6 shadow-sm animate-slide-up border-l-4 border-purple-600">
            <div className="mb-4">
              <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                IMPORTANTE
              </span>
              <div className="flex items-start gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-base font-bold text-gray-900">Por que solicitamos o Seguro Prestamista?</h3>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              Essa proteção garante que seu empréstimo seja quitado mesmo em casos de:
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Perda de renda
              </span>
              <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Acidente
              </span>
              <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                Invalidez
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-bold text-gray-900">Além disso:</h4>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700">
                  O valor do seu empréstimo é tratado como prioridade, garantindo depósito em <span className="font-semibold">5 minutos</span> após o pagamento
                </p>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700">
                  O valor pago pelo seguro é <span className="font-semibold">abatido da primeira parcela</span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Não é necessário</span> apresentar bens como garantia
                </p>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700">
                  Assista o vídeo explicativo abaixo
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 animate-slide-up"
          >
            Fazer Pagamento e Receber Empréstimo
          </button>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Protegido por segurança bancária
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
