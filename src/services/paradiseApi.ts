import { createClient } from '@supabase/supabase-js';
import type { CreateTransactionRequest, Transaction } from './genesysApi';
import { generateCustomerData, generateUniqueExternalId } from '../utils/customerDataGenerator';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
      amount: Math.round(transaction.amount * 100),
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

export interface ParadiseConfig {
  apiUrl: string;
  secretKey: string;
  recipientId: string;
  productCode?: string;
}

export async function createParadiseTransaction(
  config: ParadiseConfig,
  data: CreateTransactionRequest
): Promise<Transaction> {
  try {
    const { cleanCpf, customerName, customerEmail, customerPhone } = generateCustomerData({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      cpf: data.cpf,
    });

    console.log('Creating Paradise transaction with amount:', data.amount);
    console.log('Paradise config:', {
      apiUrl: config.apiUrl,
      hasSecretKey: !!config.secretKey,
      secretKeyPrefix: config.secretKey?.substring(0, 10),
      recipientId: config.recipientId,
      productCode: config.productCode,
    });
    console.log('Customer data:', { customerName, customerEmail, customerPhone, cpf: cleanCpf });

    const reference = generateUniqueExternalId('paradise');
    const amountInCents = Math.round(data.amount * 100);

    const payload: any = {
      amount: amountInCents,
      description: data.productName || 'Produto Digital',
      reference: reference,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        document: cleanCpf,
      },
      postback_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paradise-webhook`,
    };

    if (config.productCode) {
      payload.productHash = config.productCode;
    }

    if (data.utmSource || data.utmMedium || data.utmCampaign || data.utmTerm || data.utmContent || data.src) {
      payload.tracking = {
        ...(data.utmSource && { utm_source: data.utmSource }),
        ...(data.utmMedium && { utm_medium: data.utmMedium }),
        ...(data.utmCampaign && { utm_campaign: data.utmCampaign }),
        ...(data.utmContent && { utm_content: data.utmContent }),
        ...(data.utmTerm && { utm_term: data.utmTerm }),
        ...(data.src && { src: data.src }),
      };
    }

    console.log('Paradise API URL:', `${config.apiUrl}/api/v1/transaction.php`);
    console.log('Paradise payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${config.apiUrl}/api/v1/transaction.php`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Paradise Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Paradise API error:', errorText);
      throw new Error(`Paradise API error: ${response.status} - ${errorText}`);
    }

    const paradiseTransaction = await response.json();
    console.log('Paradise transaction created:', paradiseTransaction);

    if (paradiseTransaction.status !== 'success') {
      throw new Error(`Paradise API returned error: ${JSON.stringify(paradiseTransaction)}`);
    }

    const transactionId = crypto.randomUUID();

    const qrCodeText = paradiseTransaction.qr_code || '';
    let qrCodeImage = paradiseTransaction.qr_code_base64 || '';

    if (!qrCodeImage && qrCodeText) {
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
      genesys_transaction_id: (paradiseTransaction.transaction_id || paradiseTransaction.id || reference).toString(),
      provider: 'paradise',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    console.error('Error creating Paradise transaction:', error);
    throw error;
  }
}

export async function getParadiseTransactionStatus(
  config: ParadiseConfig,
  transactionId: string
): Promise<string> {
  try {
    console.log('Checking Paradise transaction status:', transactionId);

    const response = await fetch(`${config.apiUrl}/api/v1/transaction.php?transaction_id=${transactionId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.secretKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Paradise status check error:', errorText);
      throw new Error(`Paradise API error: ${response.status} - ${errorText}`);
    }

    const transaction = await response.json();
    console.log('Paradise transaction status:', transaction);

    const status = transaction.status || 'pending';

    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'approved': 'approved',
      'paid': 'approved',
      'completed': 'approved',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  } catch (error: any) {
    console.error('Error checking Paradise transaction status:', error);
    throw error;
  }
}
