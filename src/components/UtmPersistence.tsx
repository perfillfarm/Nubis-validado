import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { extractUtmParams } from '../utils/urlParams';
import { saveUtmParams } from '../utils/funnelStorage';

export default function UtmPersistence() {
  const location = useLocation();

  useEffect(() => {
    const utmParams = extractUtmParams(location);
    if (Object.keys(utmParams).length > 0) {
      saveUtmParams(utmParams);
      console.log(`[UTM Persistence] UTMs captured on ${location.pathname}:`, utmParams);
    }
  }, [location.pathname, location.search, location.state]);

  return null;
}
