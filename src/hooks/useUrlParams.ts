import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export function useUrlParams() {
  const location = useLocation();

  const urlParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const stateParams = (location.state as any)?.urlParams;

    if (stateParams) {
      if (typeof stateParams === 'string') {
        const parsed = new URLSearchParams(stateParams);
        parsed.forEach((value, key) => {
          if (!searchParams.has(key)) {
            searchParams.set(key, value);
          }
        });
      } else if (typeof stateParams === 'object') {
        Object.entries(stateParams).forEach(([key, value]) => {
          if (!searchParams.has(key)) {
            searchParams.set(key, String(value));
          }
        });
      }
    }

    return Object.fromEntries(searchParams.entries());
  }, [location.search, location.state]);

  const getUrlParamsString = () => {
    const params = new URLSearchParams(urlParams);
    return params.toString();
  };

  return {
    urlParams,
    urlParamsString: getUrlParamsString(),
  };
}
