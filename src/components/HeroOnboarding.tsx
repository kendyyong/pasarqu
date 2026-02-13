import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface HeroOnboardingProps {
  onShopNow?: () => void;
}

const BANNERS = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200",
    title: "Diskon Pengguna Baru",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?auto=format&fit=crop&q=80&w=1200",
    title: "Sayur Segar Harian",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=1200",
    title: "Gratis Ongkir",
  },
];

export const HeroOnboarding: React.FC<HeroOnboardingProps> = ({
  onShopNow,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  };

  return (
    /**
     * KUNCI LEBAR TOTAL (MOBILE FULL):
     * -mx-5: Menarik iklan keluar dari padding App.tsx (sejauh 20px kiri-kanan).
     * md:mx-0: Mengembalikan ke posisi normal di desktop agar sejajar.
     */
    <div className="-mx-5 md:mx-0 block leading-[0] mt-0 md:mt-4 overflow-hidden">
      {/* Container Slider:
          - rounded-none: Di HP wajib siku agar terlihat full lebar.
          - md:rounded-[2rem]: Di Desktop baru melengkung mewah.
      */}
      <div className="relative w-full h-52 md:h-80 overflow-hidden group rounded-none md:rounded-[2rem] shadow-none md:shadow-md border-none bg-white">
        <div
          className="w-full h-full flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {BANNERS.map((banner) => (
            <div
              key={banner.id}
              className="w-full h-full flex-shrink-0 relative"
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover object-center block border-none outline-none"
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Navigasi Desktop */}
        <button
          onClick={prevSlide}
          className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/80 p-3 rounded-full text-white hover:text-slate-900 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 z-10 shadow-lg"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={nextSlide}
          className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/80 p-3 rounded-full text-white hover:text-slate-900 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 z-10 shadow-lg"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dots Indikator */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {BANNERS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                currentIndex === index
                  ? "bg-teal-500 w-8 shadow-sm"
                  : "bg-white/40 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroOnboarding;
