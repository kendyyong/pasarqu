import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fungsi Helper untuk Hash SHA512 (Verifikasi Midtrans)
async function verifySignature(payload: any, serverKey: string) {
  const input = payload.order_id + payload.status_code + payload.gross_amount + serverKey;
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === payload.signature_key;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''; // Pastikan ini sudah di-set di Supabase
    
    // 🛡️ 1. VERIFIKASI KEAMANAN (WAJIB)
    const isValid = await verifySignature(payload, serverKey);
    if (!isValid) {
      console.error("🚨 SIGNATURE TIDAK VALID! Seseorang mencoba memalsukan pembayaran.");
      return new Response(JSON.stringify({ error: "Invalid Signature" }), { status: 403 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '' 
    );

    const orderId = payload.order_id;
    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    // 2. PROSES JIKA SUKSES
    if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
      
      const { data: topupReq, error: findError } = await supabase
        .from('topup_requests')
        .select('*, courier:profiles!courier_id(wallet_balance)')
        .eq('id', orderId)
        .single();

      // Cegah Double Topup (Idempotency)
      if (topupReq && topupReq.status !== 'APPROVED') {
        const amount = Number(topupReq.amount);
        const currentBalance = Number(topupReq.courier.wallet_balance || 0);
        const newBalance = currentBalance + amount;

        // EKSEKUSI DATABASE DALAM SATU SERANGAN (Bisa dibungkus RPC jika mau lebih atomik)
        await supabase.from('profiles').update({ 
          wallet_balance: newBalance, 
          status: 'ACTIVE' 
        }).eq('id', topupReq.courier_id);

        await supabase.from('topup_requests').update({ 
          status: 'APPROVED', 
          processed_at: new Date().toISOString() 
        }).eq('id', orderId);

        await supabase.from('transactions').insert([{
          type: 'KURIR_TOPUP_AUTO',
          debit: amount,
          account_code: '1001-KAS',
          description: `Top Up Otomatis Midtrans - Kurir: ${topupReq.courier_id}`
        }]);

        await supabase.from('wallet_logs').insert([{
          profile_id: topupReq.courier_id,
          type: 'TOPUP',
          amount: amount,
          balance_after: newBalance,
          description: "Top up otomatis via Midtrans"
        }]);
      }
    }

    return new Response(JSON.stringify({ status: "success" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});