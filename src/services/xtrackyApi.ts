export interface XtrackyPayload {
  orderId: string;
  amount: number;
  status: 'waiting_payment' | 'paid';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface XtrackyResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const XTRACKY_API_URL = 'https://api.xtracky.com/api/integrations/api';

export function mapGenesysStatusToXtracky(genesysStatus: string): 'waiting_payment' | 'paid' {
  const status = genesysStatus.toUpperCase();

  if (status === 'AUTHORIZED' || status === 'PAID' || status === 'APPROVED') {
    return 'paid';
  }

  return 'waiting_payment';
}

export async function sendToXtracky(
  orderId: string,
  amount: number,
  genesysStatus: string,
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }
): Promise<XtrackyResponse> {
  try {
    const xtrackyStatus = mapGenesysStatusToXtracky(genesysStatus);

    const payload: XtrackyPayload = {
      orderId,
      amount,
      status: xtrackyStatus,
      ...(utmParams?.utm_source && { utm_source: utmParams.utm_source }),
      ...(utmParams?.utm_medium && { utm_medium: utmParams.utm_medium }),
      ...(utmParams?.utm_campaign && { utm_campaign: utmParams.utm_campaign }),
      ...(utmParams?.utm_term && { utm_term: utmParams.utm_term }),
      ...(utmParams?.utm_content && { utm_content: utmParams.utm_content }),
    };

    console.log('Sending to Xtracky:', JSON.stringify(payload, null, 2));

    const response = await fetch(XTRACKY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Xtracky API error:', response.status, errorText);
      return {
        success: false,
        error: `Xtracky API returned status ${response.status}`,
      };
    }

    const responseData = await response.json();
    console.log('Xtracky response:', responseData);

    return {
      success: true,
      message: 'Successfully sent to Xtracky',
    };
  } catch (error: any) {
    console.error('Error sending to Xtracky:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}
