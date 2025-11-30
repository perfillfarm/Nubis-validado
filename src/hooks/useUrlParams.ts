import { useLocation } from 'react-router-dom';
import { useMemo, useEffect } from 'react';

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

    if (searchParams.toString().length === 0) {
      try {
        const stored = sessionStorage.getItem('_app_url_params');
        if (stored) {
          const storedParams = JSON.parse(stored);
          Object.entries(storedParams).forEach(([key, value]) => {
            searchParams.set(key, String(value));
          });
        }
      } catch (e) {
        console.error('Error reading stored params:', e);
      }
    }

    return Object.fromEntries(searchParams.entries());
  }, [location.search, location.state]);

  useEffect(() => {
    if (Object.keys(urlParams).length > 0) {
      sessionStorage.setItem('_app_url_params', JSON.stringify(urlParams));
    }
  }, [urlParams]);

  const getUrlParamsString = () => {
    const params = new URLSearchParams(urlParams);
    return params.toString();
  };

  return {
    urlParams,
    urlParamsString: getUrlParamsString(),
  };
}
