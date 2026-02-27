import React, { useState, useEffect } from "react";
import { GoogleMap, MarkerF, DirectionsRenderer } from "@react-google-maps/api";
import { Wallet, Package, Bike, CheckCircle2 } from "lucide-react";

export const TrackingMap = ({
  isLoaded,
  loadError,
  center,
  directions,
  order,
  courier,
  ICONS,
}: any) => {
  // 🚀 STATE UNTUK ANIMASI MOTOR JALAN (SMOOTH TRANSITION)
  const [animatedCourierPos, setAnimatedCourierPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // LOGIKA ANIMASI MOTOR
  useEffect(() => {
    if (courier?.current_lat && courier?.current_lng) {
      if (!animatedCourierPos) {
        // Jika belum ada posisi awal, langsung set
        setAnimatedCourierPos({
          lat: courier.current_lat,
          lng: courier.current_lng,
        });
      } else {
        // Jika ada perubahan posisi, animasikan pergerakannya
        const startLat = animatedCourierPos.lat;
        const startLng = animatedCourierPos.lng;
        const endLat = courier.current_lat;
        const endLng = courier.current_lng;

        let startTime: number | null = null;
        const duration = 2000; // 2 detik perjalanan halus

        const animate = (time: number) => {
          if (!startTime) startTime = time;
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Hitung posisi di antara titik awal dan akhir
          const currentLat = startLat + (endLat - startLat) * progress;
          const currentLng = startLng + (endLng - startLng) * progress;

          setAnimatedCourierPos({ lat: currentLat, lng: currentLng });

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }
    }
  }, [courier?.current_lat, courier?.current_lng]);

  if (loadError)
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500 font-black">
        GAGAL MEMUAT PETA
      </div>
    );
  if (!isLoaded)
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 animate-pulse font-black text-[#008080]">
        MEMANASKAN RADAR...
      </div>
    );

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={15}
      options={{
        disableDefaultUI: true,
        gestureHandling: "greedy",
        styles: [
          // Sedikit modifikasi agar jalanan lebih jelas (Opsional, gaya modern)
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      }}
    >
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#008080",
              strokeWeight: 4,
              strokeOpacity: 0.8,
            },
          }}
        />
      )}

      {/* 📍 TITIK TOKO / PASAR */}
      {order?.merchant?.latitude ? (
        <MarkerF
          position={{
            lat: order.merchant.latitude,
            lng: order.merchant.longitude,
          }}
          icon={{
            url: ICONS.store,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40), // Jangkar di tengah bawah
          }}
        />
      ) : order?.market?.latitude ? (
        <MarkerF
          position={{ lat: order.market.latitude, lng: order.market.longitude }}
          icon={{
            url: ICONS.store,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40),
          }}
        />
      ) : null}

      {/* 📍 TITIK RUMAH PEMBELI */}
      {order?.delivery_lat && (
        <MarkerF
          position={{ lat: order.delivery_lat, lng: order.delivery_lng }}
          icon={{
            url: ICONS.home,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40),
          }}
        />
      )}

      {/* 🛵 MOTOR KURIR (BERGERAK MULUS) */}
      {animatedCourierPos && (
        <MarkerF
          position={animatedCourierPos}
          icon={{
            url: ICONS.courier, // Gambar Motor
            scaledSize: new window.google.maps.Size(45, 45), // Ukuran diperbesar sedikit
            anchor: new window.google.maps.Point(22.5, 22.5), // Jangkar pas di tengah ban motor
          }}
          zIndex={9999} // Selalu di atas
        />
      )}
    </GoogleMap>
  );
};

export const ProgressSteps = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { label: "DIBAYAR", icon: Wallet },
    { label: "DIKEMAS", icon: Package },
    { label: "DIKIRIM", icon: Bike },
    { label: "SELESAI", icon: CheckCircle2 },
  ];

  return (
    <div className="flex justify-between items-center relative">
      <div className="absolute top-[18px] left-8 right-8 h-[2px] bg-slate-100 -z-0" />
      {steps.map((step, idx) => {
        const isActive = idx <= currentStep;
        return (
          <div
            key={idx}
            className="relative z-10 flex flex-col items-center w-1/4"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${isActive ? "bg-[#008080] border-[#008080] text-white shadow-md scale-110" : "bg-white border-slate-100 text-slate-200"}`}
            >
              <step.icon size={18} />
            </div>
            <span
              className={`text-[9px] mt-2 font-black text-center ${isActive ? "text-[#008080]" : "text-slate-300"}`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
