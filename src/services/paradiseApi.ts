import { createClient } from '@supabase/supabase-js';
import type { CreateTransactionRequest, Transaction } from './genesysApi';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
    console.log('Creating Paradise transaction with amount:', data.amount);
    console.log('Paradise config:', {
      apiUrl: config.apiUrl,
      hasSecretKey: !!config.secretKey,
      secretKeyPrefix: config.secretKey?.substring(0, 10),
      recipientId: config.recipientId,
      productCode: config.productCode,
    });

    const reference = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const amountInCents = Math.round(data.amount * 100);

    const payload: any = {
      amount: amountInCents,
      description: data.productName || 'Produto Digital',
      reference: reference,
      customer: {
        name: data.customerName || 'Cliente',
        email: data.customerEmail || `${data.cpf}@cliente.com`,
        phone: data.customerPhone?.replace(/\D/g, '') || '11999999999',
        document: data.cpf,
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
      cpf: data.cpf,
      genesys_transaction_id: (paradiseTransaction.transaction_id || paradiseTransaction.id || reference).toString(),
      provider: 'paradise',
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
          cpf: data.cpf,
          customer_name: data.customerName || 'Cliente',
          amount: data.amount,
          status: 'pending_receipt',
        })
        .select()
        .single();
    }

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
