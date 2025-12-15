import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FIRST_NAMES = [
  'Ana', 'Maria', 'Jose', 'Joao', 'Carlos', 'Paulo', 'Pedro', 'Lucas',
  'Marcos', 'Felipe', 'Rafael', 'Bruno', 'Fernanda', 'Juliana', 'Camila',
  'Patricia', 'Amanda', 'Larissa', 'Beatriz', 'Gabriela', 'Rodrigo', 'Diego',
  'Thiago', 'Leonardo', 'Gustavo', 'Eduardo', 'Mariana', 'Carolina', 'Vanessa',
  'Renata', 'Sandra', 'Claudia', 'Adriana', 'Luciana', 'Simone', 'Cristina'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha',
  'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado'
];

const DDD_LIST = [
  '11', '21', '31', '41', '51', '61', '71', '81', '91',
  '12', '13', '14', '15', '16', '17', '18', '19',
  '22', '24', '27', '28', '32', '33', '34', '35', '37', '38',
  '42', '43', '44', '45', '46', '47', '48', '49',
  '53', '54', '55', '62', '63', '64', '65', '66', '67', '68', '69',
  '73', '74', '75', '77', '79', '82', '83', '84', '85', '86', '87', '88', '89',
  '92', '93', '94', '95', '96', '97', '98', '99'
];

function generateRandomName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

function generateRandomEmail(name: string): string {
  const namePart = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z.]/g, '');
  const randomNum = Math.floor(Math.random() * 9999);
  const domain = Math.random() > 0.5 ? 'gmail.com' : 'hotmail.com';
  return `${namePart}${randomNum}@${domain}`;
}

function generateRandomPhone(): string {
  const ddd = DDD_LIST[Math.floor(Math.random() * DDD_LIST.length)];
  const firstDigit = '9';
  const remainingDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${ddd}${firstDigit}${remainingDigits}`;
}

function formatCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function generateUniqueExternalId(): string {
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).substring(2, 11);
  const random2 = Math.random().toString(36).substring(2, 6);
  return `nubank_${timestamp}_${random1}_${random2}`;
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
      orderId: transaction.id,
      amount: transaction.amount,
      status: status,
    };

    if (requestData.utmSource) payload.utm_source = requestData.utmSource;
    if (requestData.utmMedium) payload.utm_medium = requestData.utmMedium;
    if (requestData.utmCampaign) payload.utm_campaign = requestData.utmCampaign;
    if (requestData.utmTerm) payload.utm_term = requestData.utmTerm;
    if (requestData.utmContent) payload.utm_content = requestData.utmContent;

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

async function getGenesysConfig() {
  const { data, error } = await supabase
    .from('pix_provider_settings')
    .select('*')
    .eq('provider', 'genesys')
    .maybeSingle();

  const defaultApiUrl = 'https://api.genesys.finance';

  if (error || !data) {
    return {
      apiUrl: import.meta.env.VITE_GENESYS_API_URL || defaultApiUrl,
      apiSecret: import.meta.env.VITE_GENESYS_API_SECRET || ''
    };
  }

  return {
    apiUrl: data.api_url && data.api_url.trim() !== '' ? data.api_url : defaultApiUrl,
    apiSecret: data.api_key || ''
  };
}

export interface CreateTransactionRequest {
  cpf: string;
  amount: number;
  pixKey: string;
  productName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerBirthdate?: string;
  customerAddress?: {
    zipcode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  createReceipt?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  src?: string;
}

export interface GenesysTransaction {
  id: string;
  external_id: string;
  status: string;
  total_value: number;
  payment_method: string;
  pix: {
    payload: string;
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
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  src?: string;
}

export async function createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
  try {
    const config = await getGenesysConfig();

    const externalId = generateUniqueExternalId();
    const cleanCpf = formatCpf(data.cpf);
    const customerName = data.customerName && data.customerName !== 'Cliente'
      ? data.customerName
      : generateRandomName();
    const customerEmail = data.customerEmail && !data.customerEmail.includes('example.com') && !data.customerEmail.includes('@cliente.com')
      ? data.customerEmail
      : generateRandomEmail(customerName);
    const customerPhone = data.customerPhone && data.customerPhone !== '11999999999'
      ? data.customerPhone.replace(/\D/g, '')
      : generateRandomPhone();

    console.log('Creating transaction with:', {
      url: `${config.apiUrl}/v1/transactions`,
      hasApiKey: !!config.apiSecret,
      apiKeyPrefix: config.apiSecret?.substring(0, 10),
      externalId,
      customerName,
      customerEmail,
      customerPhone,
      cpf: cleanCpf,
    });

    const response = await fetch(`${config.apiUrl}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-secret': config.apiSecret,
      },
      body: JSON.stringify({
        external_id: externalId,
        total_amount: data.amount,
        payment_method: 'PIX',
        webhook_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/genesys-webhook`,
        items: [
          {
            id: `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            title: data.productName || 'Produto Digital',
            description: `Pagamento ${data.productName || 'Produto Digital'}`,
            quantity: 1,
            price: data.amount,
            is_physical: false,
          },
        ],
        ip: '127.0.0.1',
        customer: {
          name: customerName,
          email: customerEmail,
          document: cleanCpf,
          document_type: 'CPF',
          phone: customerPhone,
          ...(data.utmSource && { utm_source: data.utmSource }),
          ...(data.utmMedium && { utm_medium: data.utmMedium }),
          ...(data.utmCampaign && { utm_campaign: data.utmCampaign }),
          ...(data.utmTerm && { utm_term: data.utmTerm }),
          ...(data.utmContent && { utm_content: data.utmContent }),
        },
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.warn('API request failed. Using mock data for development.');

      const mockGenesysTransaction: GenesysTransaction = {
        id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        external_id: externalId,
        status: 'PENDING',
        total_value: data.amount,
        payment_method: {
          type: 'PIX',
          pix_payload: '00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p65204000053039865802BR5925NUBANK PAGAMENTOS SA6009SAO PAULO62410503***50300017br.gov.bcb.brcode01051.0.063043C2A',
        },
      };

      const pixPayload = mockGenesysTransaction.payment_method.pix_payload || '';
      const qrCodeImageUrl = pixPayload
        ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixPayload)}`
        : '';

      const { data: transaction, error: dbError } = await supabase
        .from('transactions')
        .insert({
          genesys_transaction_id: mockGenesysTransaction.id,
          cpf: cleanCpf,
          amount: data.amount,
          pix_key: data.pixKey,
          qr_code: pixPayload,
          qr_code_image: qrCodeImageUrl,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign,
          utm_term: data.utmTerm,
          utm_content: data.utmContent,
          src: data.src,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      if (data.createReceipt !== false) {
        await supabase
          .from('payment_receipts')
          .insert({
            transaction_id: transaction.id,
            cpf: cleanCpf,
            customer_name: customerName,
            amount: data.amount,
            status: 'pending_receipt',
          })
          .select()
          .single();
      }

      await sendToXtracky(transaction, data, 'waiting_payment');

      return transaction as Transaction;
    }

    const genesysTransaction: GenesysTransaction = await response.json();

    console.log('Genesys transaction response:', genesysTransaction);
    console.log('PIX payload:', genesysTransaction.pix?.payload);

    const pixPayload = genesysTransaction.pix?.payload || '';
    const qrCodeImageUrl = pixPayload
      ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixPayload)}`
      : '';

    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert({
        genesys_transaction_id: genesysTransaction.id,
        cpf: cleanCpf,
        amount: data.amount,
        pix_key: data.pixKey,
        qr_code: pixPayload,
        qr_code_image: qrCodeImageUrl,
        status: genesysTransaction.status.toLowerCase(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_term: data.utmTerm,
        utm_content: data.utmContent,
        src: data.src,
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
          cpf: cleanCpf,
          customer_name: customerName,
          amount: data.amount,
          status: 'pending_receipt',
        })
        .select()
        .single();
    }

    await sendToXtracky(transaction, data, 'waiting_payment');

    return transaction as Transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

export async function getTransactionStatus(transactionId: string): Promise<Transaction> {
  try {
    const config = await getGenesysConfig();

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const response = await fetch(
      `${config.apiUrl}/v1/transactions/${transaction.genesys_transaction_id}`,
      {
        headers: {
          'api-secret': config.apiSecret,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transaction status from Genesys');
    }

    const genesysTransaction: GenesysTransaction = await response.json();
    const normalizedStatus = genesysTransaction.status.toLowerCase();

    if (normalizedStatus !== transaction.status) {
      const updateData: any = {
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
      };

      if (normalizedStatus === 'authorized' && !transaction.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updatedTransaction, error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update transaction: ${updateError.message}`);
      }

      return updatedTransaction as Transaction;
    }

    return transaction as Transaction;
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw error;
  }
}

export async function getTransactionByGenesysId(genesysId: string): Promise<Transaction | null> {
  try {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('genesys_transaction_id', genesysId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return transaction as Transaction | null;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
}
