import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS untuk preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    // 1. Inisialisasi Supabase Admin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '' 
    )

    // 2. Ambil data penting dari laporan Midtrans
    const orderId = payload.order_id 
    const transactionStatus = payload.transaction_status
    const fraudStatus = payload.fraud_status
    const grossAmount = payload.gross_amount

    // 3. Hanya proses jika pembayaran benar-benar SUKSES (settlement/capture)
    if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
      
      // Cari data permintaan topup berdasarkan order_id
      const { data: topupReq, error: findError } = await supabase
        .from('topup_requests')
        .select('*, courier:profiles!courier_id(wallet_balance)')
        .eq('id', orderId)
        .single()

      // Jika data ketemu dan belum pernah disetujui (mencegah double topup)
      if (topupReq && topupReq.status !== 'APPROVED') {
        const amount = Number(topupReq.amount)
        const currentBalance = Number(topupReq.courier.wallet_balance || 0)
        const newBalance = currentBalance + amount

        // PROSES OTOMATIS 1: Tambah Saldo Kurir & Aktifkan Status Akun
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ 
            wallet_balance: newBalance, 
            status: 'ACTIVE' 
          })
          .eq('id', topupReq.courier_id)
          
        if (balanceError) throw balanceError

        // PROSES OTOMATIS 2: Update Status Request di tabel antrean
        // Ini akan membuat tombol "Terima/Tolak" di Dashboard Admin hilang
        await supabase
          .from('topup_requests')
          .update({ 
            status: 'APPROVED', 
            processed_at: new Date().toISOString() 
          })
          .eq('id', orderId)

        // PROSES OTOMATIS 3: Catat di General Ledger (Transactions)
        // Sesuai dengan Dashboard Finance Juragan agar Liquidity naik
        await supabase.from('transactions').insert([{
          type: 'KURIR_TOPUP_AUTO',
          debit: amount,
          credit: 0,
          account_code: '1001-KAS',
          description: `Top Up Otomatis (Midtrans) - Kurir ID: ${topupReq.courier_id}`
        }])
        
        // PROSES OTOMATIS 4: Catat di Log Dompet Kurir
        await supabase.from('wallet_logs').insert([{
          profile_id: topupReq.courier_id,
          type: 'TOPUP',
          amount: amount,
          balance_after: newBalance,
          description: "Top up otomatis via Midtrans"
        }])
      }
    }

    return new Response(JSON.stringify({ message: "Webhook processed successfully" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })

  } catch (err: any) {
    console.error("Webhook Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400 
    })
  }
})