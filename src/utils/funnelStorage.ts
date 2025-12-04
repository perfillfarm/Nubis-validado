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

const STORAGE_KEY = 'funnelData';

export const saveFunnelData = (data: Partial<FunnelData>) => {
  try {
    const existing = getFunnelData();
    const updated = { ...existing, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('FunnelStorage - Data saved:', updated);
  } catch (error) {
    console.error('FunnelStorage - Error saving data:', error);
  }
};

export const getFunnelData = (): FunnelData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      console.log('FunnelStorage - Data retrieved:', data);
      return data;
    }
  } catch (error) {
    console.error('FunnelStorage - Error reading data:', error);
  }
  return {};
};

export const clearFunnelData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('FunnelStorage - Data cleared');
  } catch (error) {
    console.error('FunnelStorage - Error clearing data:', error);
  }
};

export const getUserName = (): string => {
  try {
    const data = getFunnelData();
    if (data.userData?.nome) {
      return data.userData.nome.split(' ')[0];
    }
  } catch (error) {
    console.error('FunnelStorage - Error getting user name:', error);
  }
  return 'Usuário';
};

export const getUserData = () => {
  try {
    const data = getFunnelData();
    return data.userData || null;
  } catch (error) {
    console.error('FunnelStorage - Error getting user data:', error);
    return null;
  }
};
