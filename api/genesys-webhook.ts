import { createClient } from '@supabase/supabase-js';

interface GenesysWebhookPayload {
  id: string;
  external_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
}

interface XtrackyPayload {
  orderId: string;
  amount: number;
  status: 'waiting_payment' | 'paid';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

function mapGenesysStatusToXtracky(genesysStatus: string): 'waiting_payment' | 'paid' {
  const status = genesysStatus.toUpperCase();
  if (status === 'AUTHORIZED' || status === 'PAID' || status === 'APPROVED') {
    return 'paid';
  }
  return 'waiting_payment';
}

function mapGenesysStatusToInternal(genesysStatus: string): string {
  const status = genesysStatus.toUpperCase();
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'WAITING_PAYMENT': 'pending',
    'AUTHORIZED': 'approved',
    'PAID': 'approved',
    'APPROVED': 'approved',
    'CANCELLED': 'cancelled',
    'CANCELED': 'cancelled',
    'FAILED': 'failed',
    'EXPIRED': 'cancelled',
    'REFUNDED': 'refunded',
  };
  return statusMap[status] || 'pending';
}

async function sendToXtracky(
  supabase: any,
  transactionData: {
    id: string;
    external_id?: string;
    amount: number;
    genesysStatus: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }
) {
  try {
    const { data: xtrackySettings } = await supabase
      .from('xtracky_settings')
      .select('api_url, is_active')
      .maybeSingle();

    if (!xtrackySettings || !xtrackySettings.is_active) {
      console.log('Xtracky is not active, skipping');
      return;
    }

    const xtrackyStatus = mapGenesysStatusToXtracky(transactionData.genesysStatus);

    const payload: XtrackyPayload = {
      orderId: transactionData.external_id || transactionData.id,
      amount: transactionData.amount,
      status: xtrackyStatus,
    };

    if (transactionData.utm_source) payload.utm_source = transactionData.utm_source;
    if (transactionData.utm_medium) payload.utm_medium = transactionData.utm_medium;
    if (transactionData.utm_campaign) payload.utm_campaign = transactionData.utm_campaign;
    if (transactionData.utm_term) payload.utm_term = transactionData.utm_term;
    if (transactionData.utm_content) payload.utm_content = transactionData.utm_content;

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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, Apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: GenesysWebhookPayload = req.body;

    console.log('Genesys webhook received:', JSON.stringify(payload, null, 2));

    const transactionId = payload.id;
    const rawStatus = payload.status?.toUpperCase() || 'PENDING';
    const internalStatus = mapGenesysStatusToInternal(rawStatus);

    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('genesys_transaction_id', transactionId)
      .maybeSingle();

    if (findError) {
      console.error('Database error finding transaction:', findError);
      return res.status(500).json({ error: 'Database error', details: findError.message });
    }

    if (!transaction) {
      console.warn('Transaction not found for id:', transactionId);
      return res.status(404).json({ message: 'Transaction not found', transaction_id: transactionId });
    }

    const updateData: any = {
      status: internalStatus,
      updated_at: new Date().toISOString(),
    };

    if ((internalStatus === 'approved') && !transaction.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    if (!transaction.webhook_payload) {
      updateData.webhook_payload = [payload];
    } else {
      const existingPayloads = Array.isArray(transaction.webhook_payload)
        ? transaction.webhook_payload
        : [transaction.webhook_payload];
      updateData.webhook_payload = [...existingPayloads, payload];
    }

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transaction.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return res.status(500).json({ error: 'Update failed', details: updateError.message });
    }

    console.log('Transaction updated successfully:', updatedTransaction.id);

    await sendToXtracky(supabase, {
      id: updatedTransaction.id,
      external_id: payload.external_id,
      amount: updatedTransaction.amount,
      genesysStatus: rawStatus,
      utm_source: updatedTransaction.utm_source,
      utm_medium: updatedTransaction.utm_medium,
      utm_campaign: updatedTransaction.utm_campaign,
      utm_term: updatedTransaction.utm_term,
      utm_content: updatedTransaction.utm_content,
    });

    return res.status(200).json({
      success: true,
      transaction_id: updatedTransaction.id,
      status: updatedTransaction.status,
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
