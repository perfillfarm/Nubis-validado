export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  src?: string;
}

const UTM_KEYS: (keyof UtmParams)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'src'
];

const UTM_STORAGE_KEY = 'nubank_utm_params';

export const saveUtmToStorage = (utmParams: UtmParams): void => {
  try {
    if (Object.keys(utmParams).length > 0) {
      const existing = getUtmParamsFromStorage();
      const merged = { ...existing, ...utmParams };
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
    }
  } catch (error) {
    console.error('Error saving UTM to localStorage:', error);
  }
};

export const getUtmParamsFromStorage = (): UtmParams => {
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading UTM from localStorage:', error);
  }
  return {};
};

export const extractUtmParams = (location: any): UtmParams => {
  const utmParams: UtmParams = {};
  const searchParams = new URLSearchParams(location.search);

  UTM_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });

  if (location.state?.utmParams) {
    UTM_KEYS.forEach(key => {
      if (location.state.utmParams[key] && !utmParams[key]) {
        utmParams[key] = location.state.utmParams[key];
      }
    });
  }

  if (Object.keys(utmParams).length > 0) {
    saveUtmToStorage(utmParams);
  }

  return utmParams;
};

export const getUtmParamsWithFallback = (location: any): UtmParams => {
  const urlUtms = extractUtmParams(location);
  const storageUtms = getUtmParamsFromStorage();

  const merged: UtmParams = {};
  UTM_KEYS.forEach(key => {
    merged[key] = urlUtms[key] || storageUtms[key];
  });

  return merged;
};

export const preserveUrlParams = (location: any): string => {
  const currentParams = new URLSearchParams(location.search);

  if (location.state?.utmParams) {
    UTM_KEYS.forEach(key => {
      const value = location.state.utmParams[key];
      if (value && !currentParams.has(key)) {
        currentParams.set(key, value);
      }
    });
  }

  const storageUtms = getUtmParamsFromStorage();
  UTM_KEYS.forEach(key => {
    const value = storageUtms[key];
    if (value && !currentParams.has(key)) {
      currentParams.set(key, value);
    }
  });

  return currentParams.toString();
};

export const getUrlParamsString = (location: any, additionalParams?: Record<string, string>): string => {
  const params = preserveUrlParams(location);
  const urlParams = new URLSearchParams(params);

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      urlParams.set(key, value);
    });
  }

  return urlParams.toString();
};

export const navigateWithParams = (
  navigate: any,
  path: string,
  location: any,
  state?: any
): void => {
  const utmParams = getUtmParamsWithFallback(location);
  const urlParams = preserveUrlParams(location);

  const finalState = {
    ...state,
    utmParams
  };

  navigate(`${path}${urlParams ? `?${urlParams}` : ''}`, { state: finalState });
};

export const getUtmString = (utmParams: UtmParams): string => {
  return Object.entries(utmParams)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};
