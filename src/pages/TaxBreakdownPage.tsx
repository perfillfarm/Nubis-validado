import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserMenu from '../components/UserMenu';

export default function TaxBreakdownPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, indemnityAmount = 5960.50, pixKeyType, pixKey, urlParams } = location.state || {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!userData || !pixKeyType || !pixKey) {
    navigate('/');
    return null;
  }

  const firstName = userData.nome.split(' ')[0];
  const iof = 39.27;
  const processingFee = 18.20;
  const totalTaxes = iof + processingFee;
  const netAmount = indemnityAmount - totalTaxes;
  const taxPercentage = (totalTaxes / indemnityAmount) * 100;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleContinue = () => {
    navigate('/pagamento-qrcode', {
      state: {
        userData,
        indemnityAmount,
        pixKeyType,
        pixKey,
        urlParams
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col">
      <Header showUserIcon={true} onMenuClick={handleMenuClick} />
      <UserMenu isOpen={isMenuOpen} onClose={handleMenuClose} userName={firstName} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 pt-24 sm:pt-28 pb-20">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-2xl">
          <div className="text-center mb-5 sm:mb-6 animate-fade-in-down">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Detalhamento das Taxas
            </h1>
          </div>

          <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 sm:p-5 text-white shadow-md animate-slide-up">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-base sm:text-lg">Taxas Obrigatórias</h2>
                  <p className="text-xs sm:text-sm text-purple-50">IOF + Taxa de Processamento</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 animate-slide-up-delayed">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-gray-900 font-semibold text-sm sm:text-base flex-1">
                    IOF - Imposto sobre Operações Financeiras
                  </h3>
                  <p className="text-purple-600 font-bold text-xl sm:text-2xl whitespace-nowrap">
                    R$ 39,27
                  </p>
                </div>
                <p className="text-gray-500 text-xs">
                  Imposto federal obrigatório por lei. Alíquota: 0,5%.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-gray-900 font-semibold text-sm sm:text-base flex-1">
                    Taxa de Processamento Administrativo
                  </h3>
                  <p className="text-purple-600 font-bold text-xl sm:text-2xl whitespace-nowrap">
                    R$ 18,20
                  </p>
                </div>
                <p className="text-gray-500 text-xs">
                  Consulta institucional e transferência PIX.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6 animate-slide-up-summary">
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
              <p className="text-gray-600 text-xs mb-1">
                Total das taxas obrigatórias
              </p>
              <p className="text-gray-900 font-semibold text-lg sm:text-xl">
                R$ {formatCurrency(totalTaxes)}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Apenas {taxPercentage.toFixed(1)}% do valor total a receber
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-5 sm:p-6 text-white shadow-md">
              <p className="text-purple-50 text-sm sm:text-base font-semibold mb-2">
                Você receberá
              </p>
              <p className="text-white font-bold text-4xl sm:text-5xl">
                R$ {formatCurrency(netAmount)}
              </p>
              <p className="text-purple-100 text-sm sm:text-base mt-2">
                Valor líquido garantido
              </p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-4 sm:py-5 px-6 rounded-lg font-semibold text-base sm:text-lg bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 shadow-md hover:shadow-lg animate-slide-up-button"
          >
            Continuar
          </button>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s backwards;
        }

        .animate-slide-up-delayed {
          animation: slide-up 0.6s ease-out 0.4s backwards;
        }

        .animate-slide-up-summary {
          animation: slide-up 0.6s ease-out 0.6s backwards;
        }

        .animate-slide-up-button {
          animation: slide-up 0.6s ease-out 0.8s backwards;
        }
      `}</style>
    </div>
  );
}
