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

  return utmParams;
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
  const utmParams = extractUtmParams(location);
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
