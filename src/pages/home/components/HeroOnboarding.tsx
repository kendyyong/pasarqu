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
      <div className="w-full flex justify-center -mt-1 md:-mt-[1px]">
        <div className="w-full md:max-w-[1200px]">
          <div className="w-full aspect-[2/1] md:aspect-[3/1] bg-slate-200 animate-pulse border-none"></div>
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
    /* 🚀 FIX: Menggunakan Negative Margin untuk memaksa iklan naik menempel/menutup garis bawah header */
    <div className="w-full flex justify-center -mt-1 md:-mt-[1px] relative z-0">
      {/* 🚀 PEMBATAS UKURAN DESKTOP */}
      <div className="w-full md:max-w-[1200px] overflow-hidden">
        {/* 🚀 FIX: Menghapus total padding, rounded, dan border di mobile agar rapat sempurna */}
        <div className="relative w-full aspect-[2/1] md:aspect-[3/1] overflow-hidden group md:rounded-2xl shadow-sm bg-slate-50 border-none">
          {/* TRACK SLIDER */}
          <div
            className="w-full h-full flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner) => {
              const fitMode =
                banner.image_fit === "contain"
                  ? "object-contain"
                  : banner.image_fit === "fill"
                    ? "object-fill"
                    : "object-cover";

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
                  {/* Overlay tipis agar transisi header ke iklan lebih smooth */}
                  <div className="absolute inset-0 bg-black/[0.03] pointer-events-none"></div>
                </div>
              );
            })}
          </div>

          {/* TOMBOL NAVIGASI (Hanya Desktop) */}
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
                  className={`h-1.2 md:h-2 rounded-full transition-all duration-500 ${
                    currentIndex === index
                      ? "bg-[#008080] w-5 md:w-8 shadow-md"
                      : "bg-white/60 w-1.2 md:w-2 shadow-sm"
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
