import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-client@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()
    if (!phone) throw new Error("Nomor telepon wajib diisi")

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 🚀 1. LOGIKA RATE LIMITING: Cek jumlah permintaan dalam 1 jam terakhir
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { count, error: countError } = await supabase
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gt('created_at', oneHourAgo)

    if (countError) throw countError

    // Batasi maksimal 3 kali kirim per jam
    if (count && count >= 3) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "LIMIT_REACHED",
          message: "TERLALU BANYAK PERMINTAAN. COBA LAGI DALAM 1 JAM." 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 // Too Many Requests
        }
      )
    }

    // 2. Generate 6 Digit Code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // 3. Simpan ke Database
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert([{ phone, code: otpCode }])

    if (dbError) throw dbError

    // 4. Kirim via Fonnte API
    const fonnteToken = "TOKEN_FONNTE_ANDA_DI_SINI" 
    const message = `*[PASARQU 2026]*\n\nKode Verifikasi Anda: *${otpCode}*\n\nJangan berikan kode ini kepada siapapun termasuk pihak Pasarqu. Kode berlaku selama 5 menit.`

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': fonnteToken },
      body: new URLSearchParams({
        'target': phone,
        'message': message,
        'countryCode': '62'
      })
    })

    const result = await response.json()

    return new Response(JSON.stringify({ success: true, detail: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})