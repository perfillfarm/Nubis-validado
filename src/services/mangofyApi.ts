import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface MangofyConfig {
  apiUrl: string;
  apiKey: string;
  storeCode: string;
}

export interface CreateMangofyTransactionRequest {
  cpf: string;
  amount: number;
  pixKey: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  externalCode?: string;
  createReceipt?: boolean;
}

export interface MangofyTransaction {
  payment_code: string;
  status: string;
  pix?: {
    qr_code: string;
    qr_code_image?: string;
  };
}

export interface Transaction {
  id: string;
  genesys_transaction_id: string;
  cpf: string;
  amount: number;
  pix_key: string;
  qr_code: string;
  qr_code_image: string;
  status: string;
  expires_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export async function createMangofyTransaction(
  config: MangofyConfig,
  data: CreateMangofyTransactionRequest
): Promise<Transaction> {
  try {
    console.log('Creating Mangofy transaction with:', {
      url: `${config.apiUrl}/api/v1/payment`,
      hasApiKey: !!config.apiKey,
      storeCode: config.storeCode,
      data,
    });

    const response = await fetch(`${config.apiUrl}/api/v1/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.apiKey,
        'Store-Code': config.storeCode,
      },
      body: JSON.stringify({
        store_code: config.storeCode,
        external_code: data.externalCode || `TXN-${Date.now()}`,
        payment_method: 'pix',
        payment_format: 'regular',
        installments: 1,
        payment_amount: Math.round(data.amount * 100),
        shipping_amount: 0,
        postback_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mangofy-webhook`,
        items: [
          {
            name: 'Pagamento PIX',
            quantity: 1,
            unit_price: Math.round(data.amount * 100),
          }
        ],
        customer: {
          email: data.customerEmail || `${data.cpf.replace(/\D/g, '')}@cliente.com`,
          name: data.customerName || 'Cliente',
          document: data.cpf.replace(/\D/g, ''),
          phone: data.customerPhone || '11999999999',
          ip: '127.0.0.1',
        },
        pix: {
          expiration_time: 1800,
        }
      }),
    });

    console.log('Mangofy response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mangofy error response:', errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText || 'Failed to create Mangofy transaction' };
      }
      throw new Error(error.message || 'Failed to create Mangofy transaction');
    }

    const mangofyTransaction: MangofyTransaction = await response.json();

    console.log('Mangofy transaction response:', mangofyTransaction);

    const pixPayload = mangofyTransaction.pix?.qr_code || '';
    const qrCodeImageUrl = mangofyTransaction.pix?.qr_code_image ||
      (pixPayload
        ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixPayload)}`
        : '');

    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert({
        external_transaction_id: mangofyTransaction.payment_code,
        provider: 'mangofy',
        cpf: data.cpf.replace(/\D/g, ''),
        amount: data.amount,
        pix_key: data.pixKey,
        qr_code: pixPayload,
        qr_code_image: qrCodeImageUrl,
        status: mangofyTransaction.status.toLowerCase() === 'pending' ? 'pending' : 'completed',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Transaction saved to database:', transaction);

    if (data.createReceipt !== false) {
      await supabase
        .from('payment_receipts')
        .insert({
          transaction_id: transaction.id,
          cpf: data.cpf.replace(/\D/g, ''),
          customer_name: data.customerName || 'Cliente',
          amount: data.amount,
          status: 'pending_receipt',
        })
        .select()
        .single();
    }

    return transaction as Transaction;
  } catch (error) {
    console.error('Error creating Mangofy transaction:', error);
    throw error;
  }
}

export async function getMangofyTransactionStatus(
  config: MangofyConfig,
  paymentCode: string
): Promise<string> {
  try {
    const response = await fetch(
      `${config.apiUrl}/api/v1/payment/${paymentCode}`,
      {
        headers: {
          'Authorization': config.apiKey,
          'Store-Code': config.storeCode,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transaction status from Mangofy');
    }

    const mangofyTransaction: MangofyTransaction = await response.json();
    return mangofyTransaction.status.toLowerCase();
  } catch (error) {
    console.error('Error getting Mangofy transaction status:', error);
    throw error;
  }
}
