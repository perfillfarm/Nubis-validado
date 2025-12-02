import { useState, useEffect } from 'react';
import { FileImage, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, X, Search, Filter, Download, Calendar } from 'lucide-react';
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
  const [filteredReceipts, setFilteredReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [receipts, searchTerm, statusFilter, startDate, endDate]);

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

  const applyFilters = () => {
    let filtered = [...receipts];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (receipt) =>
          receipt.customer_name?.toLowerCase().includes(search) ||
          receipt.cpf?.includes(search.replace(/\D/g, '')) ||
          receipt.transaction_id?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((receipt) => receipt.status === statusFilter);
    }

    if (startDate) {
      filtered = filtered.filter(
        (receipt) => new Date(receipt.created_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (receipt) => new Date(receipt.created_at) <= endDateTime
      );
    }

    setFilteredReceipts(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Nome', 'CPF', 'Valor', 'Status', 'ID Transação'];
    const rows = filteredReceipts.map((receipt) => [
      formatDate(receipt.created_at),
      receipt.customer_name || 'N/A',
      formatCPF(receipt.cpf),
      formatCurrency(Number(receipt.amount)),
      getStatusBadge(receipt.status).text,
      receipt.transaction_id,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comprovantes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileImage className="w-6 h-6 text-[#8A05BE]" />
            Comprovantes de Pagamento
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-[#8A05BE] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando comprovantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileImage className="w-6 h-6 text-[#8A05BE]" />
            Comprovantes de Pagamento
          </h2>
        </div>
        <div className="p-6">
          <div className="bg-gradient-to-r from-red-50 to-red-50/50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (startDate || endDate) count++;
    return count;
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileImage className="w-6 h-6 text-[#8A05BE]" />
                Comprovantes de Pagamento
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold text-[#8A05BE]">{filteredReceipts.length}</span> de <span className="font-semibold">{receipts.length}</span> comprovante{receipts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-[#8A05BE] hover:bg-[#8A05BE]/5 transition-all duration-200 relative"
              >
                <Filter className="w-4 h-4" />
                Filtros
                {getActiveFiltersCount() > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#8A05BE] to-[#a020f0] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredReceipts.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#8A05BE] to-[#a020f0] rounded-xl hover:shadow-lg hover:shadow-[#8A05BE]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button
                onClick={loadReceipts}
                className="p-2.5 text-[#8A05BE] hover:bg-[#8A05BE]/10 rounded-xl transition-all duration-200"
                title="Atualizar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome, CPF ou ID"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A05BE] focus:border-[#8A05BE] transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A05BE] focus:border-[#8A05BE] transition-all duration-200"
                >
                  <option value="all">Todos</option>
                  <option value="pending_receipt">Aguardando Comprovante</option>
                  <option value="receipt_uploaded">Comprovante Enviado</option>
                  <option value="verified">Verificado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data Início
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A05BE] focus:border-[#8A05BE] transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data Fim
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A05BE] focus:border-[#8A05BE] transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {getActiveFiltersCount() > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-[#8A05BE] hover:bg-[#8A05BE]/10 rounded-lg font-semibold transition-all duration-200"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {receipts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileImage className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg">Nenhum comprovante encontrado</p>
              <p className="text-gray-500 text-sm mt-2">Os comprovantes aparecerão aqui quando forem enviados</p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-yellow-500" />
              </div>
              <p className="text-gray-900 font-semibold text-lg mb-2">Nenhum resultado encontrado</p>
              <p className="text-gray-600 text-sm mb-4">Tente ajustar os filtros para encontrar o que procura</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 text-sm text-white bg-gradient-to-r from-[#8A05BE] to-[#a020f0] rounded-xl font-semibold hover:shadow-lg hover:shadow-[#8A05BE]/30 transition-all duration-200"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedReceipts.map((receipt) => {
                  const status = getStatusBadge(receipt.status);
                  const StatusIcon = status.icon;
                  const isExpanded = expandedReceipt === receipt.id;

                  return (
                    <div
                      key={receipt.id}
                      className="group border-2 border-gray-100 rounded-xl overflow-hidden hover:border-[#8A05BE]/30 hover:shadow-lg transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleExpand(receipt.id)}
                        className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-all duration-200 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-[#8A05BE] transition-colors">
                              {receipt.customer_name || 'Cliente'}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color} w-fit`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.text}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-600">
                            <span className="font-medium">CPF: <span className="font-normal">{formatCPF(receipt.cpf)}</span></span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span className="font-medium">Valor: <span className="font-semibold text-[#8A05BE]">{formatCurrency(Number(receipt.amount))}</span></span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span className="text-gray-500">{formatDate(receipt.created_at)}</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-[#8A05BE]/10' : 'group-hover:bg-gray-100'}`}>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-[#8A05BE] flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 p-5 bg-gradient-to-br from-gray-50 to-white animate-in slide-in-from-top duration-300">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs font-semibold text-gray-600 mb-1.5">ID da Transação</p>
                              <p className="text-xs font-mono text-gray-900 break-all">
                                {receipt.transaction_id}
                              </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs font-semibold text-gray-600 mb-1.5">Data de Upload</p>
                              <p className="text-xs font-medium text-gray-900">
                                {formatDate(receipt.receipt_uploaded_at)}
                              </p>
                            </div>
                            {receipt.verified_at && (
                              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-xs font-semibold text-green-700 mb-1.5">Verificado em</p>
                                <p className="text-xs font-medium text-green-900">
                                  {formatDate(receipt.verified_at)}
                                </p>
                              </div>
                            )}
                          </div>

                          {receipt.admin_notes && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Notas do Admin</p>
                              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
                                <p className="text-sm text-blue-900">
                                  {receipt.admin_notes}
                                </p>
                              </div>
                            </div>
                          )}

                          {receipt.receipt_image_url ? (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-3">Comprovante</p>
                              <div className="relative group">
                                <img
                                  src={receipt.receipt_image_url}
                                  alt="Comprovante"
                                  className="w-full max-w-md rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#8A05BE] transition-all duration-200 shadow-sm hover:shadow-lg"
                                  onClick={() => setImageModal(receipt.receipt_image_url)}
                                />
                                <button
                                  onClick={() => setImageModal(receipt.receipt_image_url)}
                                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-xl"
                                >
                                  <span className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                                    🔍 Clique para ampliar
                                  </span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
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

              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 font-medium">
                    Página <span className="text-[#8A05BE] font-bold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-[#8A05BE] hover:bg-[#8A05BE]/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white transition-all duration-200"
                    >
                      Anterior
                    </button>
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[40px] px-3 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-[#8A05BE] to-[#a020f0] text-white shadow-lg shadow-[#8A05BE]/30'
                                : 'text-gray-700 bg-white border-2 border-gray-200 hover:border-[#8A05BE] hover:bg-[#8A05BE]/5'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-[#8A05BE] hover:bg-[#8A05BE]/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white transition-all duration-200"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {imageModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-4xl w-full animate-in zoom-in duration-300">
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-14 right-0 w-12 h-12 bg-white hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl group"
            >
              <X className="w-6 h-6 text-gray-900 group-hover:text-white transition-colors" />
            </button>
            <div className="bg-white p-2 rounded-2xl shadow-2xl">
              <img
                src={imageModal}
                alt="Comprovante ampliado"
                className="w-full h-auto rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
