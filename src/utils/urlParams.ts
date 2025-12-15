export const preserveUrlParams = (location: any): string => {
  const currentParams = new URLSearchParams(location.search);

  if (location.state?.urlParams) {
    const stateParams = new URLSearchParams(location.state.urlParams);
    stateParams.forEach((value, key) => {
      if (!currentParams.has(key)) {
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
  const urlParams = preserveUrlParams(location);
  const finalState = {
    ...state,
    urlParams
  };

  navigate(`${path}${urlParams ? `?${urlParams}` : ''}`, { state: finalState });
};

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  src?: string;
}

export const extractUtmParams = (location: any): UtmParams => {
  const utmParams: UtmParams = {};

  const utmKeys: (keyof UtmParams)[] = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'src'
  ];

  if (location.state?.urlParams) {
    const stateParams = new URLSearchParams(location.state.urlParams);
    utmKeys.forEach(key => {
      const value = stateParams.get(key);
      if (value) {
        utmParams[key] = value;
      }
    });
  }

  const searchParams = new URLSearchParams(location.search);
  utmKeys.forEach(key => {
    const value = searchParams.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });

  console.log('extractUtmParams - location.search:', location.search);
  console.log('extractUtmParams - location.state?.urlParams:', location.state?.urlParams);
  console.log('extractUtmParams - final utmParams:', utmParams);

  return utmParams;
};

export const getUtmString = (utmParams: UtmParams): string => {
  return Object.entries(utmParams)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};
