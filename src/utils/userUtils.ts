export const getUserName = (): string => {
  const userDataStr = sessionStorage.getItem('userData');
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      return userData.nome?.split(' ')[0] || 'Usuário';
    } catch {
      return 'Usuário';
    }
  }
  return 'Usuário';
};

export const getUserData = () => {
  const userDataStr = sessionStorage.getItem('userData');
  if (userDataStr) {
    try {
      return JSON.parse(userDataStr);
    } catch {
      return null;
    }
  }
  return null;
};
