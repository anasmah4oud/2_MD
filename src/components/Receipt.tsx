import { useEffect, useRef } from 'react';
import { Booking, TrackConfig } from '../types';
import { CheckCircle, Download, FileText, Phone, MapPin, School, BookOpen, RotateCcw } from 'lucide-react';

interface ReceiptProps {
  booking: Booking;
  trackConfig: TrackConfig;
  onNewBooking: () => void;
}

export default function Receipt({ booking, trackConfig, onNewBooking }: ReceiptProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-scroll to top when receipt is mounted
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Format date
  const formatDate = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleDateString('ar-EG');
    const date = new Date(isoString);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Generate Image via Canvas
  const downloadReceiptImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution for crisp image
    canvas.width = 600;
    canvas.height = 800;

    // Background - Clean Warm Light Cream
    ctx.fillStyle = '#FCFDF9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Borders - Dark Emerald & Gold
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#064e3b'; // Emerald 900
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d97706'; // Gold/Amber 600
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    // RTL Text Setup
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';

    // Header Title
    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('منصة الحجز الإلكتروني - لغة عربية', 550, 40);

    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('الأستاذ محمود الديب', 550, 75);

    ctx.fillStyle = '#4b5563';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('العام الدراسي: ٢٠٢٦ - ٢٠٢٧ | الصف الثاني الثانوي', 550, 115);

    // Divider Line
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 145);
    ctx.lineTo(550, 145);
    ctx.stroke();

    // Success Stamp
    ctx.fillStyle = '#10b981'; // Green 500
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('✓ تم تأكيد الحجز والقبول بنجاح', 550, 160);

    // Booking Code Badge (Left aligned in header)
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(50, 40, 150, 50);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(50, 40, 150, 50);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#b45309';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('كود الحجز الرقمي', 125, 46);
    ctx.font = 'bold 18px Courier, monospace';
    ctx.fillText(booking.id, 125, 62);

    // Reset align to right
    ctx.textAlign = 'right';

    // Student Info Panel
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(40, 195, 520, 310);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 195, 520, 310);

    // Fields labels and values
    const fields = [
      { label: 'الاسم رباعي:', value: booking.full_name },
      { label: 'المحافظة:', value: booking.governorate },
      { label: 'المدينة والمركز:', value: booking.city },
      { label: 'المدرسة:', value: booking.school },
      { label: 'تليفون الطالب:', value: booking.student_phone },
      { label: 'تليفون الأب:', value: booking.father_phone },
      { label: 'وظيفة الأب:', value: booking.father_job || 'غير محدد' },
    ];

    let currentY = 210;
    fields.forEach((field) => {
      // Label (Gold/Gray)
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText(field.label, 530, currentY);

      // Value
      ctx.fillStyle = '#111827';
      ctx.font = '14px Arial, sans-serif';
      // Value alignment
      ctx.fillText(field.value, 400, currentY);

      currentY += 40;
    });

    // Divider
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(40, 515);
    ctx.lineTo(560, 515);
    ctx.stroke();

    // Assigned Group Section (The customized part)
    ctx.fillStyle = '#ecfdf5'; // Light green container
    ctx.fillRect(40, 530, 520, 130);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 530, 520, 130);

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('تفاصيل المجموعة المخصصة من الإدارة:', 530, 545);

    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(booking.assigned_group_name || 'سيتم التحديد عند الحضور للمركز', 530, 580);

    ctx.fillStyle = '#374151';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(`المسار الأكاديمي المختار: ${trackConfig.label}`, 530, 615);

    // Date and footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(`تاريخ التسجيل الإلكتروني: ${formatDate(booking.created_at)}`, 530, 680);

    // Decorative Cutout Visual pattern at the bottom
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.arc(i + 10, canvas.height, 10, 0, Math.PI, true);
      ctx.fill();
    }

    // Centered footer signature
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4b5563';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('يرجى تصوير الشاشة أو تنزيل هذا الإيصال وعرضه في المركز التعليمي لتأكيد الحضور.', canvas.width / 2, 730);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('منصة الحجز غير الورقي - الأستاذ محمود الديب ٢٠٢٦-٢٠٢٧ ©', canvas.width / 2, 755);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Eldeeb_Receipt_${booking.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6" id="receipt-screen">
      {/* Hidden Canvas for crisp Image Downloads */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Success Badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-3">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">تم التسجيل بنجاح!</h2>
        <p className="text-sm text-gray-500 mt-1">تم إصدار إيصال الحجز الإلكتروني الخاص بك بنجاح</p>
      </div>

      {/* Visual Ticket Receipt */}
      <div 
        id="printable-receipt" 
        className="bg-[#FCFDF9] rounded-2xl border-4 border-emerald-900 p-6 shadow-xl relative overflow-hidden"
        style={{ direction: 'rtl' }}
      >
        {/* Subtle background graphic */}
        <div className="absolute inset-0 opacity-2 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top Gold Border Accent */}
        <div className="h-1.5 bg-amber-500 absolute top-0 left-0 right-0" />

        {/* Ticket Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 block">منصة الحجز الإلكتروني</span>
            <h1 className="text-xl font-black text-emerald-900">البارع محمود الديب</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">الصف الثاني الثانوي | ٢٠٢٦ - ٢٠٢٧</p>
          </div>
          
          <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg text-center">
            <span className="text-[9px] text-amber-700 block font-medium">كود الحجز</span>
            <span className="font-mono font-bold text-base tracking-wider">{booking.id}</span>
          </div>
        </div>

        {/* Student Details Fields */}
        <div className="space-y-3 mb-5">
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <h3 className="text-xs text-gray-400 font-medium mb-2">البيانات الأساسية للطالب</h3>
            
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0"><BookOpen className="w-4 h-4 text-emerald-700" /></span>
                <span className="text-gray-500 min-w-[80px]">الاسم رباعي:</span>
                <span className="font-semibold text-gray-950">{booking.full_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0"><MapPin className="w-4 h-4 text-emerald-700" /></span>
                <span className="text-gray-500 min-w-[80px]">المحافظة:</span>
                <span className="font-medium text-gray-900">{booking.governorate}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0"><MapPin className="w-4 h-4 text-emerald-700" /></span>
                <span className="text-gray-500 min-w-[80px]">المدينة/المركز:</span>
                <span className="font-medium text-gray-900">{booking.city}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0"><School className="w-4 h-4 text-emerald-700" /></span>
                <span className="text-gray-500 min-w-[80px]">المدرسة:</span>
                <span className="font-medium text-gray-900">{booking.school}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0"><Phone className="w-4 h-4 text-emerald-700" /></span>
                <span className="text-gray-500 min-w-[80px]">تليفون الطالب:</span>
                <span className="font-mono font-bold text-emerald-900 select-all">{booking.student_phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <h3 className="text-xs text-gray-400 font-medium mb-2">بيانات الاتصال والمتابعة</h3>
            
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0"><Phone className="w-4 h-4 text-amber-600" /></span>
                <span className="text-gray-500 min-w-[80px]">تليفون الأب:</span>
                <span className="font-mono font-semibold text-gray-900 select-all">{booking.father_phone}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 shrink-0"><Phone className="w-4 h-4 text-amber-600" /></span>
                <span className="text-gray-500 min-w-[80px]">تليفون الأم:</span>
                <span className="font-mono font-semibold text-gray-900 select-all">{booking.mother_phone}</span>
              </div>

              {booking.father_job && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 shrink-0"><FileText className="w-4 h-4 text-amber-600" /></span>
                  <span className="text-gray-500 min-w-[80px]">وظيفة الأب:</span>
                  <span className="font-medium text-gray-800">{booking.father_job}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Group Section */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center relative overflow-hidden">
          {/* Subtle overlay */}
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] px-2.5 py-0.5 rounded-bl-lg font-bold">
            المجموعة المعتمدة لك
          </div>
          
          <p className="text-xs text-emerald-800 mt-1 font-medium">تم إدراجك تلقائياً في المجموعة التالية:</p>
          <h4 className="text-lg font-black text-emerald-950 mt-1.5 leading-tight">
            {booking.assigned_group_name || 'المجموعة العامة لـ 1 ثانوي'}
          </h4>
          <div className="mt-2.5 flex justify-center gap-2">
            <span className="inline-block bg-white text-emerald-800 border border-emerald-100 text-[11px] px-2.5 py-1 rounded-full font-bold">
              المسار: {trackConfig.label}
            </span>
          </div>
        </div>

        {/* Date of booking */}
        <div className="mt-5 text-center text-[10px] text-gray-400 border-t border-dashed border-gray-200 pt-4">
          <span>تاريخ التسجيل: {formatDate(booking.created_at)}</span>
          <p className="mt-2 text-xs font-bold text-amber-600">الأستاذ محمود الديب يتمنى لكم عاماً دراسياً حافلاً بالتفوق والنجاح!</p>
        </div>

        {/* Bottom Ticket Scallop cuts */}
        <div className="absolute -bottom-2 left-0 right-0 flex justify-around pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-50 border border-gray-100 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3 print:hidden">
        <button
          onClick={downloadReceiptImage}
          className="w-full bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] transition text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Download className="w-5 h-5" />
          تحميل الإيصال كصورة (PNG)
        </button>

        <button
          onClick={printReceipt}
          className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98] transition text-gray-800 py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-5 h-5 text-gray-500" />
          طباعة الإيصال أو حفظه PDF
        </button>

        <button
          onClick={onNewBooking}
          className="w-full bg-amber-50 hover:bg-amber-100 active:scale-[0.98] transition text-amber-900 border border-amber-200 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 text-amber-700" />
          تسجيل حجز جديد طالب آخر
        </button>
      </div>
    </div>
  );
}
