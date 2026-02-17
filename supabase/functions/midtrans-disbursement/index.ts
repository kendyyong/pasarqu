import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Data dari Dashboard Admin saat menyetujui penarikan
    const { payoutDetails } = await req.json()

    // 🛡️ AMAN: Mengambil kunci dari Brankas Supabase Secrets (Lolos Vercel!)
    const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") || "";
    const authString = btoa(`${MIDTRANS_SERVER_KEY}:`)

    // 2. URL Payouts (Iris Midtrans)
    // Sandbox: https://app.sandbox.midtrans.com/iris/api/v1/payouts
    const IRIS_URL = 'https://app.sandbox.midtrans.com/iris/api/v1/payouts'

    const response = await fetch(IRIS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
        'X-Idempotency-Key': `payout-${Date.now()}` // Mencegah double transfer
      },
      body: JSON.stringify({
        payouts: [
          {
            beneficiary_name: payoutDetails.holder_name,
            beneficiary_account: payoutDetails.account_number,
            beneficiary_bank: payoutDetails.bank_code,
            amount: payoutDetails.amount.toString(),
            notes: `Cair Gaji Pasarqu - ${payoutDetails.orderId}`
          }
        ]
      })
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Disbursement Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})