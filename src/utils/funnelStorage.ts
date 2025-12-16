interface FunnelData {
  cpf?: string;
  userData?: any;
  loanAmount?: number;
  installments?: number;
  dueDate?: number;
  hasNubankAccount?: boolean;
  profileAnswers?: Record<string, string>;
  currentStep?: string;
  urlParams?: any;
}

interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  src?: string;
}

const UTM_STORAGE_KEY = 'nubank_utm_params';

export const saveUtmParams = (utmParams: UtmData) => {
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
    console.log('UTM params saved to localStorage:', utmParams);
  } catch (error) {
    console.error('Error saving UTM params:', error);
  }
};

export const getUtmParams = (): UtmData => {
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting UTM params:', error);
  }
  return {};
};

export const clearUtmParams = () => {
  try {
    localStorage.removeItem(UTM_STORAGE_KEY);
    console.log('UTM params cleared from localStorage');
  } catch (error) {
    console.error('Error clearing UTM params:', error);
  }
};

export const saveFunnelData = (data: Partial<FunnelData>) => {
  console.log('FunnelStorage - saveFunnelData called (no-op):', data);
};

export const getFunnelData = (): FunnelData => {
  return {};
};

export const clearFunnelData = () => {
  console.log('FunnelStorage - clearFunnelData called (no-op)');
};

export const getUserName = (): string => {
  return 'Usuário';
};

export const getUserData = () => {
  return null;
};
