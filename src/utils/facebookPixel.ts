declare global {
  interface Window {
    fbq?: (track: string, event: string, params?: Record<string, any>) => void;
    _fbqTrackedEvents?: Set<string>;
  }
}

export interface InitiateCheckoutParams {
  value: number;
  currency?: string;
  content_type?: string;
  content_name?: string;
  content_ids?: string[];
  num_items?: number;
}

export const trackInitiateCheckout = (params: InitiateCheckoutParams): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    const eventParams = {
      value: params.value,
      currency: params.currency || 'BRL',
      content_type: params.content_type || 'product',
      content_name: params.content_name,
      content_ids: params.content_ids,
      num_items: params.num_items || 1,
    };

    console.log('Facebook Pixel - InitiateCheckout:', eventParams);
    window.fbq('track', 'InitiateCheckout', eventParams);
  } else {
    console.warn('Facebook Pixel not initialized');
  }
};

export const trackPurchase = (params: InitiateCheckoutParams): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    if (!window._fbqTrackedEvents) {
      window._fbqTrackedEvents = new Set();
    }

    const eventKey = `purchase_${params.value}_${params.content_name || params.content_type}`;

    if (window._fbqTrackedEvents.has(eventKey)) {
      console.log('Facebook Pixel - Purchase already tracked, skipping:', eventKey);
      return;
    }

    const eventParams = {
      value: params.value,
      currency: params.currency || 'BRL',
      content_type: params.content_type || 'product',
      content_name: params.content_name,
      content_ids: params.content_ids,
      num_items: params.num_items || 1,
    };

    console.log('Facebook Pixel - Purchase:', eventParams);
    window.fbq('track', 'Purchase', eventParams);
    window._fbqTrackedEvents.add(eventKey);
  } else {
    console.warn('Facebook Pixel not initialized');
  }
};

export const trackAddToCart = (params: InitiateCheckoutParams): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    const eventParams = {
      value: params.value,
      currency: params.currency || 'BRL',
      content_type: params.content_type || 'product',
      content_name: params.content_name,
      content_ids: params.content_ids,
      num_items: params.num_items || 1,
    };

    console.log('Facebook Pixel - AddToCart:', eventParams);
    window.fbq('track', 'AddToCart', eventParams);
  } else {
    console.warn('Facebook Pixel not initialized');
  }
};
