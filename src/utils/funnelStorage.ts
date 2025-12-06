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

const STORAGE_KEY = 'funnel_data';

export const saveFunnelData = (data: Partial<FunnelData>) => {
  try {
    const currentData = getFunnelData();
    const mergedData = { ...currentData, ...data };
    console.log('FunnelStorage - Saving data:', mergedData);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
  } catch (error) {
    console.error('FunnelStorage - Error saving data:', error);
  }
};

export const getFunnelData = (): FunnelData => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      console.log('FunnelStorage - Retrieved data:', data);
      return data;
    }
  } catch (error) {
    console.error('FunnelStorage - Error getting data:', error);
  }
  return {};
};

export const clearFunnelData = () => {
  try {
    console.log('FunnelStorage - Clearing data');
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('FunnelStorage - Error clearing data:', error);
  }
};

export const getUserName = (): string => {
  const data = getFunnelData();
  return data.userData?.nome?.split(' ')[0] || 'Usuário';
};

export const getUserData = () => {
  const data = getFunnelData();
  return data.userData || null;
};
