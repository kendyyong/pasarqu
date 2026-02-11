import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface HeroOnboardingProps {
  onShopNow?: () => void;
}

const BANNERS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200",
    title: "Diskon Pengguna Baru",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?auto=format&fit=crop&q=80&w=1200",
    title: "Sayur Segar Harian",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=1200",
    title: "Gratis Ongkir",
  }
];

export const HeroOnboarding: React.FC<HeroOnboardingProps> = ({ onShopNow }) => {
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
    // PADDING DIHAPUS (px-0) agar full width seperti aplikasi native
    // TINGGI DIKURANGI: h-28 (Mobile) / md:h-48 (Desktop)
    <div className="w-full px-0 pt-0 pb-0 mb-2">
      <div className="relative w-full h-28 md:h-48 overflow-hidden group">
        
        <div 
            className="w-full h-full flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
            {BANNERS.map((banner) => (
                <div key={banner.id} className="w-full h-full flex-shrink-0 relative">
                    <img 
                        src={banner.image} 
                        alt={banner.title} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
            ))}
        </div>

        {/* Tombol Navigasi Desktop */}
        <button onClick={prevSlide} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/80 p-1.5 rounded-full text-white hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"><ChevronLeft size={16} /></button>
        <button onClick={nextSlide} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/80 p-1.5 rounded-full text-white hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"><ChevronRight size={16} /></button>

        {/* Indikator Dots Kecil */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {BANNERS.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1 rounded-full transition-all ${
                        currentIndex === index 
                        ? 'bg-orange-500 w-3' 
                        : 'bg-white/60 w-1'
                    }`}
                />
            ))}
        </div>
      </div>
    </div>
  );
};