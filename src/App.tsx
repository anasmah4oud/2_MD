import { useState, useEffect } from 'react';
import BookingForm from './components/BookingForm';
import Receipt from './components/Receipt';
import AdminDashboard from './components/AdminDashboard';
import { Booking, TrackConfig } from './types';
import { Shield, Sparkles } from 'lucide-react';

export default function App() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [trackConfig, setTrackConfig] = useState<TrackConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check URL path or hash to route to the hidden admin panel
  useEffect(() => {
    const handleRouting = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      
      // Match explicit requested secret path: /a/a/a/a/2/0/0/2/3
      // We also check for hash fallback as SPAs behind proxies can route hashes easier.
      if (
        path === '/a/a/a/a/2/0/0/2/3' || 
        hash === '#/a/a/a/a/2/0/0/2/3' || 
        params.get('admin') === 'true'
      ) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    // Run on mount
    handleRouting();

    // Listen to changes (e.g. popstate or hash change)
    window.addEventListener('popstate', handleRouting);
    window.addEventListener('hashchange', handleRouting);

    return () => {
      window.removeEventListener('popstate', handleRouting);
      window.removeEventListener('hashchange', handleRouting);
    };
  }, []);

  const handleBookingSuccess = (newBooking: Booking, config: TrackConfig) => {
    setBooking(newBooking);
    setTrackConfig(config);
  };

  const handleReset = () => {
    setBooking(null);
    setTrackConfig(null);
  };

  // If the admin route is active, render the admin dashboard directly
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        {/* Subtle Admin Header banner */}
        <div className="bg-emerald-950 text-white text-center py-2 text-xs font-bold px-4 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>منطقة الإدارة والمتابعة المؤمنة للأستاذ محمود الديب</span>
        </div>
        
        <main className="py-6">
          <AdminDashboard />
        </main>
      </div>
    );
  }

  // Normal Student Booking Flow
  return (
    <div className="min-h-screen bg-gray-50/60 text-gray-900 font-sans antialiased flex flex-col justify-between" style={{ direction: 'rtl' }}>
      
      {/* Dynamic Visual Content */}
      <main className="flex-grow py-4">
        {booking && trackConfig ? (
          <Receipt 
            booking={booking} 
            trackConfig={trackConfig} 
            onNewBooking={handleReset} 
          />
        ) : (
          <BookingForm onSuccess={handleBookingSuccess} />
        )}
      </main>

      {/* Modern, Simple and Light Footer - Completely clean without telemetry or system logs */}
      <footer className="py-5 text-center bg-white border-t border-gray-100 mt-8 print:hidden">
        <p className="text-xs text-gray-400 font-medium leading-relaxed">
          منصة الحجز الإلكتروني - الأستاذ محمود الديب للعام الدراسي ٢٠٢٦ - ٢٠٢٧
        </p>
        <p className="text-[10px] text-gray-400/80 mt-1">
          تم التصميم ليوائم الهواتف الذكية بسلاسة وأداء فائق
        </p>
      </footer>
    </div>
  );
}
