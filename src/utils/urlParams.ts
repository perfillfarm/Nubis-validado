export function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }
  return new URLSearchParams(window.location.search);
}

export function preserveUrlParams(newParams?: Record<string, string>): URLSearchParams {
  const currentParams = getUrlParams();

  if (newParams) {
    Object.entries(newParams).forEach(([key, value]) => {
      currentParams.set(key, value);
    });
  }

  return currentParams;
}

export function getUrlParamsString(newParams?: Record<string, string>): string {
  const params = preserveUrlParams(newParams);
  const paramsString = params.toString();
  return paramsString ? `?${paramsString}` : '';
}

export function buildNavigationState(state?: any): any {
  const urlParams = getUrlParams();
  return {
    ...state,
    urlParams: Object.fromEntries(urlParams.entries()),
  };
}
