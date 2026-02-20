import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { Loader2, ArrowLeft, Printer, CheckCircle2 } from "lucide-react";

export const OrderInvoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`*`)
          .eq("id", orderId)
          .single();

        if (orderError || !orderData) throw new Error("Order tidak ditemukan");

        const [resItems, resCustomer] = await Promise.all([
          supabase.from("order_items").select("*").eq("order_id", orderId),
          supabase
            .from("profiles")
            .select("*")
            .eq("id", orderData.customer_id)
            .single(),
        ]);

        const items = resItems.data || [];
        const productIds = [...new Set(items.map((i) => i.product_id))];
        const { data: products } = await supabase
          .from("products")
          .select("id, name, unit")
          .in("id", productIds);

        const itemsWithDetails = items.map((item) => ({
          ...item,
          product_details: products?.find((p) => p.id === item.product_id) || {
            name: "PRODUK",
            unit: "PCS",
          },
        }));

        setOrder({
          ...orderData,
          customer: resCustomer.data,
          my_items: itemsWithDetails,
        });

        setTimeout(() => {
          window.print();
        }, 1200);
      } catch (err: any) {
        console.error("Invoice Error:", err.message);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [orderId]);

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400">
          Menyusun Nota...
        </p>
      </div>
    );

  if (!order)
    return (
      <div className="p-20 text-center font-black uppercase text-red-500">
        Nota Tidak Ditemukan
      </div>
    );

  return (
    <div className="bg-white min-h-screen p-0 md:p-5 print:p-0 font-sans">
      <style>
        {`
          @media print {
            @page { size: portrait; margin: 8mm; }
            body { -webkit-print-color-adjust: exact; background-color: white !important; }
            .no-print { display: none !important; }
          }
          * { text-transform: uppercase !important; font-family: 'Inter', sans-serif !important; }
        `}
      </style>

      {/* HEADER CONTROL - RAPAT */}
      <div className="no-print max-w-[750px] mx-auto mb-4 flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-black text-[9px] tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> KEMBALI
        </button>
        <button
          onClick={() => window.print()}
          className="bg-teal-600 text-white px-5 py-2 rounded-lg font-black text-[9px] tracking-widest flex items-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <Printer size={14} /> CETAK SEKARANG
        </button>
      </div>

      {/* KERTAS NOTA PORTRAIT - COMPACT MODE */}
      <div className="max-w-[750px] mx-auto bg-white border border-slate-100 p-6 md:p-10 relative overflow-hidden print:border-none min-h-[900px] text-left">
        {/* LOGO & HEADER - NAIK KE ATAS */}
        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              <span className="text-teal-600">PASAR</span>
              <span className="text-orange-500">QU</span>
            </h1>
            <p className="text-[8px] font-black text-slate-400 mt-1 tracking-[0.3em]">
              BUKTI TRANSAKSI RESMI
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              NOTA PEMBAYARAN
            </h2>
            <p className="text-[10px] font-black text-teal-600">
              #{order.id.toString().substring(0, 8)}
            </p>
          </div>
        </div>

        {/* INFO TRANSAKSI - MERAPAT */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[8px] font-black text-slate-400 tracking-widest mb-0.5">
              PELANGGAN:
            </p>
            <p className="text-base font-black text-slate-900 leading-tight">
              {order.customer?.full_name || "PELANGGAN PASARQU"}
            </p>
            <p className="text-[9px] font-bold text-slate-500 mt-1 leading-tight max-w-[250px]">
              {order.address}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 tracking-widest mb-0.5">
              WAKTU:
            </p>
            <p className="text-[11px] font-black text-slate-900">
              {new Date(order.created_at).toLocaleDateString("id-ID", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-[11px] font-black text-slate-700">
              {new Date(order.created_at).toLocaleTimeString("id-ID")} WIB
            </p>
          </div>
        </div>

        {/* TABEL ITEM - COMPACT */}
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-2 text-[9px] font-black text-slate-900 text-left tracking-widest">
                  PRODUK
                </th>
                <th className="py-2 text-[9px] font-black text-slate-900 text-center tracking-widest">
                  QTY
                </th>
                <th className="py-2 text-[9px] font-black text-slate-900 text-right tracking-widest">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {order.my_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-1">
                    <p className="font-black text-xs text-slate-800 leading-none">
                      {item.product_details?.name}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1">
                      RP {item.price_at_purchase.toLocaleString()} /{" "}
                      {item.product_details?.unit}
                    </p>
                  </td>
                  <td className="py-1 text-xs font-black text-slate-600 text-center">
                    {item.quantity}
                  </td>
                  <td className="py-1 text-xs font-black text-slate-900 text-right">
                    RP{" "}
                    {(item.quantity * item.price_at_purchase).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RINCIAN BIAYA - MERAPAT KE KANAN */}
        <div className="flex flex-col items-end pt-4 border-t border-slate-900 space-y-1">
          <div className="w-full md:w-[280px] space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-slate-500">
              <span>SUBTOTAL PRODUK</span>
              <span>
                RP{" "}
                {(
                  order.total_price -
                  order.shipping_cost -
                  (order.service_fee || 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-500">
              <span>LAYANAN APLIKASI</span>
              <span>RP {order.service_fee?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-500">
              <span>ONGKOS KIRIM</span>
              <span>
                RP{" "}
                {(
                  order.shipping_cost - (order.courier_surge_fee || 0)
                ).toLocaleString()}
              </span>
            </div>
            {order.courier_surge_fee > 0 && (
              <div className="flex justify-between text-[9px] font-black text-orange-600">
                <span>EKSTRA TOKO ({order.total_merchants} PASAR)</span>
                <span>+ RP {order.courier_surge_fee.toLocaleString()}</span>
              </div>
            )}
            <div className="pt-3 mt-1 border-t-2 border-slate-900 flex justify-between items-center">
              <span className="text-[10px] font-black tracking-widest text-slate-900">
                TOTAL BAYAR
              </span>
              <span className="text-2xl font-black tracking-tighter text-orange-600 leading-none">
                RP {order.total_price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* CATATAN & CAP LUNAS - POSISI NAIK */}
        <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
          <div className="flex justify-between items-center">
            <div className="max-w-[280px]">
              <p className="text-[8px] font-black text-teal-600 mb-1 tracking-widest uppercase">
                CATATAN:
              </p>
              <p className="text-[9px] font-bold text-slate-400 leading-tight normal-case italic">
                "{order.notes || "TIDAK ADA CATATAN TAMBAHAN."}"
              </p>
            </div>

            {/* CAP LUNAS - LEBIH KECIL & RAPAT */}
            <div className="flex flex-col items-center opacity-[0.15] -rotate-12 border-[3px] border-red-600 px-4 py-1 rounded-lg text-red-600">
              <span className="text-xl font-black tracking-[3px]">LUNAS</span>
              <CheckCircle2 size={18} strokeWidth={3} />
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
            TERIMA KASIH TELAH MENDUKUNG PASAR TRADISIONAL
          </p>
        </div>
      </div>
    </div>
  );
};
