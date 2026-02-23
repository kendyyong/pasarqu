import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface HeroOnboardingProps {
  banners?: any[]; // Data dari database
  isLoading?: boolean;
}

export const HeroOnboarding: React.FC<HeroOnboardingProps> = ({
  banners = [],
  isLoading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play slider jika gambar lebih dari satu
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  // Tampilan saat loading
  if (isLoading) {
    return (
      <div className="w-full mt-2 md:mt-4">
        <div className="mx-auto w-full px-[1px] md:px-0">
          <div className="w-full h-40 md:h-[260px] bg-slate-100 animate-pulse rounded-xl md:rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  // Jika tidak ada data iklan, sembunyikan komponen
  if (banners.length === 0) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    /**
     * 🚀 UPDATE: ULTRA-WIDE PRECISION (1PX)
     */
    <div className="w-full block leading-[0] mt-2 md:mt-4">
      {/* 🛠️ STRUKTUR PRESISI 1PX:
          px-[1px]: Jarak benar-benar 1 pixel dari tepi layar HP.
          md:px-0: Tetap tanpa padding di desktop agar sejajar sempurna dengan produk.
      */}
      <div className="mx-auto w-full max-w-none px-[1px] md:px-0 overflow-hidden">
        {/* JENDELA PROMOSI
            h-40: Tinggi ramping untuk ponsel.
            rounded-xl: Lekukan sudut halus sesuai permintaan.
            md:rounded-2xl: Lekukan desktop tetap premium.
        */}
        <div className="relative w-full h-40 md:h-[260px] overflow-hidden group rounded-xl md:rounded-2xl shadow-sm bg-white border border-slate-100">
          <div
            className="w-full h-full flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="w-full h-full flex-shrink-0 relative cursor-pointer"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center block border-none outline-none"
                />
                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Navigasi Panah (Desktop Only) */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/80 p-3 rounded-full text-white hover:text-slate-900 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 z-10 shadow-lg"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={nextSlide}
                className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/80 p-3 rounded-full text-white hover:text-slate-900 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 z-10 shadow-lg"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Dots Indikator (Warna Hijau Tosca PasarQu) */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    currentIndex === index
                      ? "bg-[#008080] w-6 shadow-sm"
                      : "bg-white/40 w-1.5"
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
