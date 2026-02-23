import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

Deno.serve(async (req) => {
  // Hanya menerima metode POST dari Midtrans
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body

    // 1. VERIFIKASI KEASLIAN MIDTRANS (PENTING!)
    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
    
    // Rumus Signature Midtrans: SHA512(order_id + status_code + gross_amount + server_key)
    const dataString = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(dataString)
    const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Jika signature tidak cocok, ini adalah serangan hacker! Tolak!
    if (expectedSignature !== signature_key) {
      console.error("Signature Mismatch! Potensi serangan manipulasi.")
      return new Response("Invalid Signature", { status: 401 })
    }

    // 2. KONEKSI KE DATABASE (Bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. PROSES STATUS PEMBAYARAN
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      // Pembayaran Sukses! Panggil RPC yang kita buat tadi
      const { error } = await supabaseAdmin.rpc('process_topup_success', {
        p_order_id: order_id
      })
      if (error) throw error
      console.log(`Top Up Sukses: ${order_id}`)

    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      // Pembayaran Gagal/Kadaluarsa
      await supabaseAdmin
        .from('topup_requests')
        .update({ status: 'FAILED' })
        .eq('id', order_id)
      console.log(`Top Up Gagal/Expired: ${order_id}`)
    }

    // Selalu balas dengan 200 OK agar Midtrans berhenti mengirim notifikasi ulang
    return new Response(JSON.stringify({ message: 'Webhook Processed' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error("Webhook Error:", err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})