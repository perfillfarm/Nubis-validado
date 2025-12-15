import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sendToXtracky(
  supabase: any,
  transactionData: {
    id: string;
    genesys_transaction_id?: string;
    external_id?: string;
    amount: number;
    status: string;
    genesysStatus: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    src?: string;
  }
) {
  try {
    const { data: xtrackySettings } = await supabase
      .from("xtracky_settings")
      .select("api_url, is_active")
      .maybeSingle();

    if (!xtrackySettings || !xtrackySettings.is_active) {
      console.log("Xtracky is not active, skipping");
      return;
    }

    const mapGenesysStatusToXtracky = (genesysStatus: string): string => {
      const status = genesysStatus.toUpperCase();
      if (status === 'AUTHORIZED' || status === 'PAID' || status === 'APPROVED') {
        return 'paid';
      }
      return 'waiting_payment';
    };

    const xtrackyStatus = mapGenesysStatusToXtracky(transactionData.genesysStatus);

    const payload: any = {
      orderId: transactionData.genesys_transaction_id || transactionData.external_id || transactionData.id,
      amount: Math.round(transactionData.amount * 100),
      status: xtrackyStatus,
    };

    if (transactionData.utm_source) payload.utm_source = transactionData.utm_source;
    if (transactionData.utm_medium) payload.utm_medium = transactionData.utm_medium;
    if (transactionData.utm_campaign) payload.utm_campaign = transactionData.utm_campaign;
    if (transactionData.utm_term) payload.utm_term = transactionData.utm_term;
    if (transactionData.utm_content) payload.utm_content = transactionData.utm_content;
    if (transactionData.src) payload.src = transactionData.src;

    console.log("Sending to Xtracky:", JSON.stringify(payload, null, 2));

    const response = await fetch(xtrackySettings.api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Xtracky API error:", response.status, errorText);
    } else {
      const responseData = await response.json();
      console.log("Xtracky response:", responseData);
    }
  } catch (error: any) {
    console.error("Error sending to Xtracky (non-critical):", error.message);
  }
}

interface GenesysWebhookPayload {
  id?: string;
  external_id?: string;
  status?: string;
  amount?: number;
  payment_method?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: any;
  };
  created_at?: string;
  [key: string]: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: GenesysWebhookPayload = await req.json();

    console.log("Genesys webhook received:", JSON.stringify(payload, null, 2));

    const transactionId = payload.id;
    const rawStatus = payload.status?.toUpperCase() || "PENDING";

    const statusMap: Record<string, string> = {
      "PENDING": "pending",
      "WAITING_PAYMENT": "pending",
      "AUTHORIZED": "approved",
      "PAID": "approved",
      "APPROVED": "approved",
      "CANCELLED": "cancelled",
      "CANCELED": "cancelled",
      "FAILED": "failed",
      "EXPIRED": "cancelled",
      "REFUNDED": "refunded",
    };

    const status = statusMap[rawStatus] || "pending";

    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("genesys_transaction_id", transactionId)
      .maybeSingle();

    if (findError) {
      console.error("Database error finding transaction:", findError);
      return new Response(
        JSON.stringify({ error: "Database error", details: findError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!transaction) {
      console.warn("Transaction not found for id:", transactionId);
      return new Response(
        JSON.stringify({ message: "Transaction not found", transaction_id: transactionId }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    if ((status === "approved" || status === "authorized") && !transaction.completed_at) {
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
      .from("transactions")
      .update(updateData)
      .eq("id", transaction.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return new Response(
        JSON.stringify({ error: "Update failed", details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Transaction updated successfully:", updatedTransaction.id);

    await sendToXtracky(supabase, {
      id: updatedTransaction.id,
      genesys_transaction_id: updatedTransaction.genesys_transaction_id,
      external_id: payload.external_id,
      amount: updatedTransaction.amount,
      status: updatedTransaction.status,
      genesysStatus: rawStatus,
      utm_source: updatedTransaction.utm_source,
      utm_medium: updatedTransaction.utm_medium,
      utm_campaign: updatedTransaction.utm_campaign,
      utm_term: updatedTransaction.utm_term,
      utm_content: updatedTransaction.utm_content,
      src: updatedTransaction.src,
    });

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: updatedTransaction.id,
        status: updatedTransaction.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});