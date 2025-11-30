import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateTransactionRequest {
  cpf: string;
  amount: number;
  pixKey: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  externalCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  src?: string;
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

    const { data: settings, error: settingsError } = await supabase
      .from("pix_provider_settings")
      .select("*")
      .eq("provider", "mangofy")
      .eq("is_active", true)
      .maybeSingle();

    if (settingsError || !settings) {
      console.error("Mangofy settings not found:", settingsError);
      return new Response(
        JSON.stringify({ error: "Mangofy provider not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data: CreateTransactionRequest = await req.json();

    console.log("Creating Mangofy transaction:", {
      url: `${settings.api_url}/api/v1/payment`,
      storeCode: settings.store_code,
      hasApiKey: !!settings.api_key,
    });

    const response = await fetch(`${settings.api_url}/api/v1/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": settings.api_key,
        "Store-Code": settings.store_code,
      },
      body: JSON.stringify({
        store_code: settings.store_code,
        external_code: data.externalCode || `TXN-${Date.now()}`,
        payment_method: "pix",
        payment_format: "regular",
        installments: 1,
        payment_amount: Math.round(data.amount * 100),
        shipping_amount: 0,
        postback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mangofy-webhook`,
        items: [
          {
            name: "Pagamento PIX",
            quantity: 1,
            unit_price: Math.round(data.amount * 100),
          },
        ],
        customer: {
          email: data.customerEmail || `${data.cpf.replace(/\D/g, "")}@cliente.com`,
          name: data.customerName || "Cliente",
          document: data.cpf.replace(/\D/g, ""),
          phone: data.customerPhone || "11999999999",
          ip: "127.0.0.1",
          ...(data.utmSource && { utm_source: data.utmSource }),
          ...(data.utmMedium && { utm_medium: data.utmMedium }),
          ...(data.utmCampaign && { utm_campaign: data.utmCampaign }),
          ...(data.utmTerm && { utm_term: data.utmTerm }),
          ...(data.utmContent && { utm_content: data.utmContent }),
          ...(data.src && { src: data.src }),
        },
        pix: {
          expiration_time: 1800,
        },
      }),
    });

    console.log("Mangofy response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mangofy error response:", errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText || "Failed to create Mangofy transaction" };
      }

      return new Response(
        JSON.stringify({ error: error.message || "Failed to create Mangofy transaction" }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mangofyTransaction = await response.json();
    console.log("Mangofy transaction created:", mangofyTransaction);

    const pixPayload = mangofyTransaction.pix?.qr_code || "";
    const qrCodeImageUrl =
      mangofyTransaction.pix?.qr_code_image ||
      (pixPayload
        ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixPayload)}`
        : "");

    const { data: transaction, error: dbError } = await supabase
      .from("transactions")
      .insert({
        external_transaction_id: mangofyTransaction.payment_code,
        provider: "mangofy",
        cpf: data.cpf.replace(/\D/g, ""),
        amount: data.amount,
        pix_key: data.pixKey,
        qr_code: pixPayload,
        qr_code_image: qrCodeImageUrl,
        status: mangofyTransaction.status.toLowerCase() === "pending" ? "pending" : "completed",
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
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Database error", details: dbError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Transaction saved to database:", transaction.id);

    return new Response(JSON.stringify(transaction), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating Mangofy transaction:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
