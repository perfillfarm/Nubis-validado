import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractUtmParams, preserveUrlParams } from '../utils/urlParams';

export default function UtmPersistence() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const utmParams = extractUtmParams(location);
    const currentSearch = new URLSearchParams(location.search);

    let needsUpdate = false;
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value && !currentSearch.has(key)) {
        currentSearch.set(key, value);
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      const newSearch = currentSearch.toString();
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, {
        replace: true,
        state: { ...location.state, utmParams }
      });
    }
  }, [location.pathname]);

  return null;
}
