import { useState, useEffect } from 'react';
import { FileImage, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface PaymentReceipt {
  id: string;
  transaction_id: string;
  cpf: string;
  customer_name: string;
  amount: number;
  receipt_image_url: string | null;
  receipt_uploaded_at: string | null;
  status: string;
  admin_notes: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function ReceiptsViewer() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('payment_receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReceipts(data || []);
    } catch (err: any) {
      console.error('Error loading receipts:', err);
      setError(err.message || 'Erro ao carregar comprovantes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return 'N/A';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'receipt_uploaded':
        return {
          icon: CheckCircle,
          text: 'Comprovante Enviado',
          color: 'bg-green-100 text-green-800',
        };
      case 'verified':
        return {
          icon: CheckCircle,
          text: 'Verificado',
          color: 'bg-blue-100 text-blue-800',
        };
      case 'pending_receipt':
        return {
          icon: Clock,
          text: 'Aguardando Comprovante',
          color: 'bg-yellow-100 text-yellow-800',
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Desconhecido',
          color: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReceipt(expandedReceipt === id ? null : id);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Comprovantes de Pagamento
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#8A05BE] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Comprovantes de Pagamento
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Comprovantes de Pagamento
          </h2>
          <button
            onClick={loadReceipts}
            className="text-sm text-[#8A05BE] hover:underline"
          >
            Atualizar
          </button>
        </div>

        {receipts.length === 0 ? (
          <div className="text-center py-12">
            <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum comprovante encontrado</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {receipts.map((receipt) => {
              const status = getStatusBadge(receipt.status);
              const StatusIcon = status.icon;
              const isExpanded = expandedReceipt === receipt.id;

              return (
                <div
                  key={receipt.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleExpand(receipt.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                          {receipt.customer_name || 'Cliente'}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color} w-fit`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.text}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600">
                        <span>CPF: {formatCPF(receipt.cpf)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Valor: {formatCurrency(Number(receipt.amount))}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatDate(receipt.created_at)}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 sm:p-5 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">ID da Transação</p>
                          <p className="text-xs sm:text-sm font-mono text-gray-900 break-all">
                            {receipt.transaction_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">Data de Upload</p>
                          <p className="text-xs sm:text-sm text-gray-900">
                            {formatDate(receipt.receipt_uploaded_at)}
                          </p>
                        </div>
                        {receipt.verified_at && (
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">Verificado em</p>
                            <p className="text-xs sm:text-sm text-gray-900">
                              {formatDate(receipt.verified_at)}
                            </p>
                          </div>
                        )}
                      </div>

                      {receipt.admin_notes && (
                        <div className="mb-4">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">Notas do Admin</p>
                          <p className="text-xs sm:text-sm text-gray-900 bg-white p-3 rounded border border-gray-200">
                            {receipt.admin_notes}
                          </p>
                        </div>
                      )}

                      {receipt.receipt_image_url ? (
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">Comprovante</p>
                          <div className="relative group">
                            <img
                              src={receipt.receipt_image_url}
                              alt="Comprovante"
                              className="w-full max-w-md rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setImageModal(receipt.receipt_image_url)}
                            />
                            <button
                              onClick={() => setImageModal(receipt.receipt_image_url)}
                              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg"
                            >
                              <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Clique para ampliar
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FileImage className="w-4 h-4" />
                          <span>Sem comprovante anexado</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {imageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-900" />
            </button>
            <img
              src={imageModal}
              alt="Comprovante ampliado"
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
