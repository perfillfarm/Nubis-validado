import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface FunnelPersistenceProps {
  currentStep: string;
  children: React.ReactNode;
  requiresUserData?: boolean;
}

export const FunnelPersistence: React.FC<FunnelPersistenceProps> = ({
  currentStep,
  children,
  requiresUserData = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (requiresUserData && !location.state?.userData) {
      const searchParams = new URLSearchParams(location.search);
      navigate(`/?${searchParams.toString()}`);
      return;
    }
  }, [currentStep, requiresUserData, location, navigate]);

  return <>{children}</>;
};

export const useFunnelData = () => {
  const location = useLocation();

  return {
    userData: location.state?.userData,
    loanAmount: location.state?.loanAmount,
    installments: location.state?.installments,
    dueDate: location.state?.dueDate,
    hasNubankAccount: location.state?.hasNubankAccount,
    profileAnswers: location.state?.profileAnswers,
    indemnityAmount: location.state?.indemnityAmount || 7854.63,
  };
};
