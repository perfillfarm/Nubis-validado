import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import UserLogsViewer from '../components/UserLogsViewer';
import ReceiptsViewer from '../components/ReceiptsViewer';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ProviderSettings {
  id?: string;
  provider: 'genesys' | 'mangofy' | 'aureo';
  api_url: string;
  api_key: string;
  store_code?: string;
  public_key?: string;
  secret_key?: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeProvider, setActiveProvider] = useState<'genesys' | 'mangofy' | 'aureo'>('genesys');
  const [providers, setProviders] = useState<Record<string, ProviderSettings>>({
    genesys: {
      provider: 'genesys',
      api_url: 'https://api.genesys.finance',
      api_key: 'sk_8327774662b1097b3d37f03212efce3a0de5ea05c2b57c3711c29df02fff3093e60485366021992bd34ef8b9f216f7a2d7aa45a265a27c633fafadf10784e154',
      is_active: true,
    },
    mangofy: {
      provider: 'mangofy',
      api_url: 'https://checkout.mangofy.com.br',
      api_key: '',
      store_code: '',
      is_active: false,
    },
    aureo: {
      provider: 'aureo',
      api_url: 'https://api.aureolink.com.br',
      api_key: '',
      public_key: 'pk_dIaiBPTqwTgJ5qHgcWzVlR5tWHbqZnlaNdZQQQfvD6ZsTAV4',
      secret_key: 'sk_XDmA6-QzA8YbdMBSKKfXoLmeVC9_u2N3gGMl-9nRN5kfxdwM',
      is_active: false,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pix_provider_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap: Record<string, ProviderSettings> = {};
        let active: 'genesys' | 'mangofy' | 'aureo' = 'genesys';

        data.forEach((setting: any) => {
          settingsMap[setting.provider] = setting;
          if (setting.is_active) {
            active = setting.provider;
          }
        });

        setProviders((prev) => ({
          genesys: settingsMap.genesys || prev.genesys,
          mangofy: settingsMap.mangofy || prev.mangofy,
          aureo: settingsMap.aureo || prev.aureo,
        }));
        setActiveProvider(active);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    provider: 'genesys' | 'mangofy' | 'aureo',
    field: keyof ProviderSettings,
    value: string
  ) => {
    setProviders((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const genesysSettings = providers.genesys;
      const mangofySettings = providers.mangofy;
      const aureoSettings = providers.aureo;

      if (activeProvider === 'genesys') {
        if (!genesysSettings.api_url || !genesysSettings.api_key) {
          throw new Error('Preencha todos os campos da Genesys');
        }
      } else if (activeProvider === 'mangofy') {
        if (!mangofySettings.api_url || !mangofySettings.api_key || !mangofySettings.store_code) {
          throw new Error('Preencha todos os campos da Mangofy');
        }
      } else if (activeProvider === 'aureo') {
        if (!aureoSettings.api_url || !aureoSettings.public_key || !aureoSettings.secret_key) {
          throw new Error('Preencha todos os campos da Aureo');
        }
      }

      // First, deactivate all providers to ensure only one is active
      await supabase
        .from('pix_provider_settings')
        .update({ is_active: false })
        .neq('provider', '');

      const updates = [
        {
          ...genesysSettings,
          is_active: activeProvider === 'genesys',
        },
        {
          ...mangofySettings,
          is_active: activeProvider === 'mangofy',
        },
        {
          ...aureoSettings,
          is_active: activeProvider === 'aureo',
        },
      ];

      for (const update of updates) {
        if (update.id) {
          const { error } = await supabase
            .from('pix_provider_settings')
            .update({
              api_url: update.api_url,
              api_key: update.api_key,
              store_code: update.store_code || null,
              public_key: update.public_key || null,
              secret_key: update.secret_key || null,
              is_active: update.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq('id', update.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('pix_provider_settings')
            .insert({
              provider: update.provider,
              api_url: update.api_url,
              api_key: update.api_key,
              store_code: update.store_code || null,
              public_key: update.public_key || null,
              secret_key: update.secret_key || null,
              is_active: update.is_active,
            });

          if (error) throw error;
        }
      }

      console.log(`Gateway ativo alterado para: ${activeProvider}`);
      setSuccess(`Configurações salvas! Gateway ativo: ${activeProvider.toUpperCase()}`);
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8A05BE] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 sm:mb-6 transition-colors touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Configurações de Pagamento PIX
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Configure qual provedor de pagamento PIX será utilizado no sistema
          </p>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm sm:text-base text-green-800">{success}</p>
            </div>
          )}

          <div className="mb-6 sm:mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Provedor Ativo
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setActiveProvider('genesys')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-lg border-2 font-medium text-sm sm:text-base transition-all relative touch-manipulation ${
                  activeProvider === 'genesys'
                    ? 'border-[#8A05BE] bg-[#8A05BE]/10 text-[#8A05BE]'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Genesys
                {activeProvider === 'genesys' && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </button>
              <button
                onClick={() => setActiveProvider('mangofy')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-lg border-2 font-medium text-sm sm:text-base transition-all relative touch-manipulation ${
                  activeProvider === 'mangofy'
                    ? 'border-[#8A05BE] bg-[#8A05BE]/10 text-[#8A05BE]'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Mangofy
                {activeProvider === 'mangofy' && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </button>
              <button
                onClick={() => setActiveProvider('aureo')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-lg border-2 font-medium text-sm sm:text-base transition-all relative touch-manipulation ${
                  activeProvider === 'aureo'
                    ? 'border-[#8A05BE] bg-[#8A05BE]/10 text-[#8A05BE]'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Aureo
                {activeProvider === 'aureo' && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div
              className={`p-4 sm:p-5 md:p-6 rounded-lg border-2 transition-all ${
                activeProvider === 'genesys'
                  ? 'border-[#8A05BE] bg-[#8A05BE]/10'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Configuração Genesys
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    URL da API
                  </label>
                  <input
                    type="text"
                    value={providers.genesys.api_url}
                    onChange={(e) =>
                      handleInputChange('genesys', 'api_url', e.target.value)
                    }
                    placeholder="https://api.genesys.com"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A05BE] focus:border-transparent touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={providers.genesys.api_key}
                    onChange={(e) =>
                      handleInputChange('genesys', 'api_key', e.target.value)
                    }
                    placeholder="Sua API Secret da Genesys"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A05BE] focus:border-transparent touch-manipulation"
                  />
                </div>
              </div>
            </div>

            <div
              className={`p-4 sm:p-5 md:p-6 rounded-lg border-2 transition-all ${
                activeProvider === 'mangofy'
                  ? 'border-[#8A05BE] bg-[#8A05BE]/10'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Configuração Mangofy
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    URL da API
                  </label>
                  <input
                    type="text"
                    value={providers.mangofy.api_url}
                    onChange={(e) =>
                      handleInputChange('mangofy', 'api_url', e.target.value)
                    }
                    placeholder="https://checkout.mangofy.com.br"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A05BE] focus:border-transparent touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    API Key (Authorization)
                  </label>
                  <input
                    type="password"
                    value={providers.mangofy.api_key}
                    onChange={(e) =>
                      handleInputChange('mangofy', 'api_key', e.target.value)
                    }
                    placeholder="Sua API Key da Mangofy"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A05BE] focus:border-transparent touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Store Code
                  </label>
                  <input
                    type="text"
                    value={providers.mangofy.store_code || ''}
                    onChange={(e) =>
                      handleInputChange('mangofy', 'store_code', e.target.value)
                    }
                    placeholder="Código da sua loja na Mangofy"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A05BE] focus:border-transparent touch-manipulation"
                  />
                </div>
              </div>
            </div>

            <div
              className={`p-4 sm:p-5 md:p-6 rounded-lg border-2 transition-all ${
                activeProvider === 'aureo'
                  ? 'border-[#8A05BE] bg-[#8A05BE]/10'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Configuração Aureo
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    URL da API
                  </label>
                  <input
                    type="text"
                    value={providers.aureo.api_url}
                    onChange={(e) =>
                      handleInputChange('aureo', 'api_url', e.target.value)
                    }
                    placeholder="https://api.aureolink.com.br"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A05BE] focus:border-transparent touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Chave Pública (Public Key)
                  </label>
                  <input
                    type="text"
                    value={providers.aureo.public_key || ''}
                    onChange={(e) =>
                      handleInputChange('aureo', 'public_key', e.target.value)
                    }
                    placeholder="Sua chave pública da Aureo"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A05BE] focus:border-transparent touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Chave Secreta (Secret Key)
                  </label>
                  <input
                    type="password"
                    value={providers.aureo.secret_key || ''}
                    onChange={(e) =>
                      handleInputChange('aureo', 'secret_key', e.target.value)
                    }
                    placeholder="Sua chave secreta da Aureo"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A05BE] focus:border-transparent touch-manipulation"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#8A05BE] text-white px-6 sm:px-8 py-3 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-[#8A05BE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>

        <ReceiptsViewer />

        <UserLogsViewer />
      </div>
    </div>
  );
}
