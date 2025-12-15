import { createClient } from '@supabase/supabase-js';
import type { CreateTransactionRequest, Transaction } from './genesysApi';
import { generateCustomerData, generateUniqueExternalId, formatCpf } from '../utils/customerDataGenerator';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function getUserIp(): Promise<string> {
  try {
    const response = await fetch('https://ipv4.wtfismyip.com/json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch IP, using fallback');
      return '127.0.0.1';
    }

    const data = await response.json();
    const ip = data.YourFuckingIPAddress;

    if (ip && typeof ip === 'string') {
      console.log('User IP fetched:', ip);
      return ip;
    }

    return '127.0.0.1';
  } catch (error) {
    console.warn('Error fetching user IP:', error);
    return '127.0.0.1';
  }
}

async function sendToXtracky(transaction: any, requestData: CreateTransactionRequest, status: 'waiting_payment' | 'paid') {
  try {
    const { data: xtrackySettings } = await supabase
      .from('xtracky_settings')
      .select('api_url, is_active')
      .maybeSingle();

    if (!xtrackySettings || !xtrackySettings.is_active) {
      console.log('Xtracky is not active, skipping');
      return;
    }

    const payload: any = {
      orderId: transaction.genesys_transaction_id,
      amount: transaction.amount,
      status: status,
    };

    if (requestData.utmSource) payload.utm_source = requestData.utmSource;
    if (requestData.utmMedium) payload.utm_medium = requestData.utmMedium;
    if (requestData.utmCampaign) payload.utm_campaign = requestData.utmCampaign;
    if (requestData.utmTerm) payload.utm_term = requestData.utmTerm;
    if (requestData.utmContent) payload.utm_content = requestData.utmContent;
    if (requestData.src) payload.src = requestData.src;

    console.log('Sending to Xtracky:', JSON.stringify(payload, null, 2));

    const response = await fetch(xtrackySettings.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Xtracky API error:', response.status, errorText);
    } else {
      const responseData = await response.json();
      console.log('Xtracky response:', responseData);
    }
  } catch (error: any) {
    console.error('Error sending to Xtracky (non-critical):', error.message);
  }
}

export interface AureoConfig {
  apiUrl: string;
  publicKey: string;
  secretKey: string;
}

export async function createAureoTransaction(
  config: AureoConfig,
  data: CreateTransactionRequest
): Promise<Transaction> {
  try {
    const { cleanCpf, customerName, customerEmail, customerPhone } = generateCustomerData({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      cpf: data.cpf,
    });

    console.log('Creating Aureo transaction with amount:', data.amount);
    console.log('Aureo config:', {
      apiUrl: config.apiUrl,
      hasPublicKey: !!config.publicKey,
      publicKeyPrefix: config.publicKey?.substring(0, 10),
      hasSecretKey: !!config.secretKey,
      secretKeyPrefix: config.secretKey?.substring(0, 10),
    });
    console.log('Customer data:', { customerName, customerEmail, customerPhone, cpf: cleanCpf });

    const auth = 'Basic ' + btoa(config.publicKey + ':' + config.secretKey);

    const objectId = generateUniqueExternalId('aureo');
    const amountInCents = Math.round(data.amount * 100);
    const userIp = await getUserIp();

    const payload = {
      type: 'transaction',
      objectId: objectId,
      companyId: 1,
      amount: amountInCents,
      currency: 'BRL',
      paymentMethod: 'pix',
      status: 'waiting_payment',
      installments: 1,
      postbackUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aureo-webhook`,
      ip: userIp,
      externalRef: `pix_${objectId}`,
      items: [
        {
          title: data.productName || 'Produto Digital',
          quantity: 1,
          tangible: false,
          unitPrice: amountInCents,
          externalRef: `item_${objectId}`,
        },
      ],
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        birthdate: data.customerBirthdate || '1990-01-01',
        document: {
          type: 'cpf',
          number: cleanCpf,
        },
        ...(data.utmSource && { utm_source: data.utmSource }),
        ...(data.utmMedium && { utm_medium: data.utmMedium }),
        ...(data.utmCampaign && { utm_campaign: data.utmCampaign }),
        ...(data.utmTerm && { utm_term: data.utmTerm }),
        ...(data.utmContent && { utm_content: data.utmContent }),
        address: data.customerAddress ? {
          street: data.customerAddress.street || 'Rua Principal',
          streetNumber: data.customerAddress.number || '100',
          complement: data.customerAddress.complement || '',
          zipCode: data.customerAddress.zipcode || '01000000',
          neighborhood: data.customerAddress.neighborhood || 'Centro',
          city: data.customerAddress.city || 'São Paulo',
          state: data.customerAddress.state || 'SP',
          country: 'BR',
        } : {
          street: 'Rua Principal',
          streetNumber: '100',
          complement: '',
          zipCode: '01000000',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR',
        },
      },
    };

    console.log('Aureo API URL:', `${config.apiUrl}/v1/transactions`);
    console.log('Aureo payload:', JSON.stringify(payload, null, 2));
    console.log('Aureo auth header:', auth.substring(0, 20) + '...');

    const response = await fetch(`${config.apiUrl}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Aureo Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Aureo API error:', errorText);
      throw new Error(`Aureo API error: ${response.status} - ${errorText}`);
    }

    const aureoTransaction = await response.json();
    console.log('Aureo transaction created:', aureoTransaction);

    const transactionId = crypto.randomUUID();

    const pixData = aureoTransaction.data?.pix || aureoTransaction.pix;
    const qrCodeText = pixData?.qrcode || pixData?.qrCode || pixData?.qrCodeText || pixData?.copyPaste || '';

    let qrCodeImage = '';
    if (qrCodeText) {
      try {
        qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeText)}`;
      } catch (e) {
        console.error('Error generating QR code URL:', e);
      }
    }

    const transaction: Transaction = {
      id: transactionId,
      amount: data.amount,
      status: 'pending',
      qr_code: qrCodeText,
      qr_code_image: qrCodeImage,
      cpf: cleanCpf,
      genesys_transaction_id: (aureoTransaction.data?.id || aureoTransaction.id || transactionId).toString(),
      provider: 'aureo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      utm_source: data.utmSource,
      utm_medium: data.utmMedium,
      utm_campaign: data.utmCampaign,
      utm_term: data.utmTerm,
      utm_content: data.utmContent,
      src: data.src,
    };

    const { error } = await supabase.from('transactions').insert(transaction);

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Transaction saved to database:', transactionId);

    if (data.createReceipt !== false) {
      await supabase
        .from('payment_receipts')
        .insert({
          transaction_id: transactionId,
          cpf: cleanCpf,
          customer_name: customerName,
          amount: data.amount,
          status: 'pending_receipt',
        })
        .select()
        .single();
    }

    await sendToXtracky(transaction, data, 'waiting_payment');

    return transaction;
  } catch (error: any) {
    console.error('Error creating Aureo transaction:', error);
    throw error;
  }
}

export async function getAureoTransactionStatus(
  config: AureoConfig,
  transactionId: string
): Promise<string> {
  try {
    console.log('Checking Aureo transaction status:', transactionId);

    const auth = 'Basic ' + btoa(config.publicKey + ':' + config.secretKey);

    const response = await fetch(`${config.apiUrl}/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Aureo status check error:', errorText);
      throw new Error(`Aureo API error: ${response.status} - ${errorText}`);
    }

    const transaction = await response.json();
    console.log('Aureo transaction status:', transaction);

    const status = transaction.status || transaction.payment?.status || 'pending';

    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'paid': 'approved',
      'authorized': 'approved',
      'approved': 'approved',
      'cancelled': 'cancelled',
      'failed': 'failed',
      'expired': 'cancelled',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  } catch (error: any) {
    console.error('Error checking Aureo transaction status:', error);
    throw error;
  }
}
