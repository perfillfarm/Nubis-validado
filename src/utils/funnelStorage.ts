interface FunnelData {
  cpf?: string;
  userData?: any;
  loanAmount?: number;
  installments?: number;
  dueDate?: number;
  hasNubankAccount?: boolean;
  profileAnswers?: Record<string, string>;
  currentStep?: string;
}

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
  return 'Usuario';
};

export const getUserData = () => {
  return null;
};
