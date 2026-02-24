import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface HeroOnboardingProps {
  banners?: any[]; // Data dari database (tabel ads)
  isLoading?: boolean;
}

export const HeroOnboarding: React.FC<HeroOnboardingProps> = ({
  banners = [],
  isLoading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🚀 AUTO-PLAY SLIDER (Ganti setiap 5 detik)
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  // TAMPILAN SAAT LOADING
  if (isLoading) {
    return (
      <div className="w-full flex justify-center mt-2 md:mt-4">
        {/* Kunci Lebar Maksimal 1200px di Desktop */}
        <div className="w-full px-[1px] md:px-0 md:max-w-[1200px]">
          {/* Rasio Mobile 2:1 | Desktop 3:1 */}
          <div className="w-full aspect-[2/1] md:aspect-[3/1] bg-slate-200 animate-pulse rounded-xl md:rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  // Jika tidak ada data iklan
  if (banners.length === 0) return null;

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="w-full flex justify-center mt-2 md:mt-4">
      {/* 🚀 PEMBATAS UKURAN DESKTOP (Maksimal 1200px) */}
      <div className="w-full px-[1px] md:px-0 md:max-w-[1200px] overflow-hidden">
        {/* JENDELA BANNER 
            Di HP (aspect-[2/1]): Lebar full, tinggi setengah lebar.
            Di Desktop (md:aspect-[3/1]): Lebar max 1200px, Tinggi proporsional 400px.
        */}
        <div className="relative w-full aspect-[2/1] md:aspect-[3/1] overflow-hidden group rounded-xl md:rounded-2xl shadow-sm bg-slate-50 border border-slate-100">
          {/* TRACK SLIDER */}
          <div
            className="w-full h-full flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner) => {
              // BACA PENGATURAN DARI SUPER ADMIN
              const fitMode =
                banner.image_fit === "contain"
                  ? "object-contain"
                  : banner.image_fit === "fill"
                    ? "object-fill"
                    : "object-cover";

              // Posisi Fokus Gambar
              const posX =
                banner.image_pos_x !== undefined ? banner.image_pos_x : 50;
              const posY =
                banner.image_pos_y !== undefined ? banner.image_pos_y : 50;

              return (
                <div
                  key={banner.id}
                  className="w-full h-full flex-shrink-0 relative cursor-pointer"
                  onClick={() => {
                    if (banner.link_to && banner.link_to !== "/") {
                      window.location.href = banner.link_to;
                    }
                  }}
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title || "Promo PasarQu"}
                    className={`w-full h-full block border-none outline-none ${fitMode}`}
                    style={{ objectPosition: `${posX}% ${posY}%` }}
                  />
                  {/* Efek Gelap Tipis Agar Terlihat Premium */}
                  <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                </div>
              );
            })}
          </div>

          {/* TOMBOL NAVIGASI KIRI/KANAN (Hanya Desktop) */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/90 p-3 rounded-full text-slate-800 transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 z-10 shadow-lg active:scale-90"
              >
                <ChevronLeft size={28} strokeWidth={2.5} />
              </button>
              <button
                onClick={nextSlide}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/90 p-3 rounded-full text-slate-800 transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 z-10 shadow-lg active:scale-90"
              >
                <ChevronRight size={28} strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* INDIKATOR TITIK (DOTS) */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${
                    currentIndex === index
                      ? "bg-[#008080] w-6 md:w-8 shadow-md"
                      : "bg-white/70 hover:bg-white w-2 md:w-2 shadow-sm"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroOnboarding;
