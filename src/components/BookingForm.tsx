import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Booking, Group, EGYPT_GOVERNORATES, AcademicTrackKey, TrackConfig } from '../types';
import { dbService } from '../supabaseClient';
import { User, Phone, MapPin, School, Briefcase, GraduationCap, ArrowLeft, Loader2, Sparkles, BookOpen } from 'lucide-react';

interface BookingFormProps {
  onSuccess: (booking: Booking, trackConfig: TrackConfig) => void;
}

const TRACKS_CONFIG: Record<AcademicTrackKey, TrackConfig> = {
  medicine: {
    key: 'medicine',
    label: 'مسار الطب والعلوم الصحية',
    icon: '🩺',
    color: 'text-emerald-700 border-emerald-600 bg-emerald-50',
    bgLight: 'bg-emerald-50/50',
    borderClass: 'border-emerald-200'
  },
  engineering: {
    key: 'engineering',
    label: 'مسار الهندسة والتكنولوجيا',
    icon: '📐',
    color: 'text-blue-700 border-blue-600 bg-blue-50',
    bgLight: 'bg-blue-50/50',
    borderClass: 'border-blue-200'
  },
  business: {
    key: 'business',
    label: 'مسار إدارة الأعمال والاقتصاد',
    icon: '📊',
    color: 'text-amber-700 border-amber-600 bg-amber-50',
    bgLight: 'bg-amber-50/50',
    borderClass: 'border-amber-200'
  },
  arts: {
    key: 'arts',
    label: 'مسار الآداب والفنون الجميلة',
    icon: '🎨',
    color: 'text-rose-700 border-rose-600 bg-rose-50',
    bgLight: 'bg-rose-50/50',
    borderClass: 'border-rose-200'
  },
};

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    governorate: 'القاهرة',
    city: '',
    school: '',
    studentPhone: '',
    fatherJob: '',
    fatherPhone: '',
    motherPhone: '',
    academicTrack: 'medicine' as AcademicTrackKey,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  // Load Groups on init
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const fetchedGroups = await dbService.getGroups();
        setGroups(fetchedGroups);
      } catch (err) {
        console.error('Error loading groups:', err);
      }
    };
    loadGroups();
  }, []);

  // Validation functions
  const validatePhone = (phone: string) => {
    // Egyptian phone validation: 11 digits, starts with 010, 011, 012, 015
    const regex = /^01[0125][0-9]{8}$/;
    return regex.test(phone);
  };

  const validateFullName = (name: string) => {
    const words = name.trim().split(/\s+/);
    return words.length >= 4 && words.every(word => word.length >= 2);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleTrackChange = (track: AcademicTrackKey) => {
    setFormData(prev => ({ ...prev, academicTrack: track }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Name Validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'يرجى إدخال الاسم رباعياً';
    } else if (!validateFullName(formData.fullName)) {
      newErrors.fullName = 'يجب إدخال الاسم رباعياً كاملاً لتفادي تشابه الأسماء';
    }

    // School Validation
    if (!formData.school.trim()) {
      newErrors.school = 'يرجى إدخال اسم المدرسة';
    }

    // City Validation
    if (!formData.city.trim()) {
      newErrors.city = 'يرجى إدخال اسم المدينة أو المركز يدوياً';
    }

    // Student Phone Validation
    if (!formData.studentPhone) {
      newErrors.studentPhone = 'يرجى إدخال رقم هاتف الطالب';
    } else if (!validatePhone(formData.studentPhone)) {
      newErrors.studentPhone = 'يجب إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 01)';
    }

    // Father Phone Validation
    if (!formData.fatherPhone) {
      newErrors.fatherPhone = 'يرجى إدخال رقم هاتف الأب';
    } else if (!validatePhone(formData.fatherPhone)) {
      newErrors.fatherPhone = 'يجب إدخال رقم هاتف مصري صحيح (11 رقم)';
    } else if (formData.studentPhone === formData.fatherPhone) {
      newErrors.fatherPhone = 'يجب أن يكون رقم تليفون الأب مختلفاً عن رقم تليفون الطالب';
    }

    // Mother Phone Validation
    if (!formData.motherPhone) {
      newErrors.motherPhone = 'يرجى إدخال رقم هاتف الأم';
    } else if (!validatePhone(formData.motherPhone)) {
      newErrors.motherPhone = 'يجب إدخال رقم هاتف مصري صحيح (11 رقم)';
    } else if (formData.motherPhone === formData.studentPhone) {
      newErrors.motherPhone = 'يجب أن يكون رقم تليفون الأم مختلفاً عن رقم تليفون الطالب';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);

    try {
      // Find assigned group based on track
      // Logic: 
      // 1. Look for a group mapped to the specific academic track of the student.
      // 2. If not found, look for a group mapped to 'all' (General).
      // 3. If still not found, take the first active group, or assign a default template name.
      const activeGroups = groups.filter(g => g.is_active);
      let assignedGroup = activeGroups.find(g => g.track === formData.academicTrack);
      
      if (!assignedGroup) {
        assignedGroup = activeGroups.find(g => g.track === 'all');
      }
      
      if (!assignedGroup && activeGroups.length > 0) {
        assignedGroup = activeGroups[0];
      }

      const assignedGroupId = assignedGroup ? assignedGroup.id : 'default-g';
      const assignedGroupName = assignedGroup 
        ? `${assignedGroup.name} (${assignedGroup.day} الساعة ${assignedGroup.time})`
        : 'المجموعة العامة للصف الأول الثانوي (سيتم توزيع المواعيد بالمركز)';

      const bookingToSave: Omit<Booking, 'id'> = {
        full_name: formData.fullName.trim(),
        governorate: formData.governorate,
        city: formData.city.trim(),
        school: formData.school.trim(),
        student_phone: formData.studentPhone.trim(),
        father_job: formData.fatherJob.trim() || 'موظف',
        father_phone: formData.fatherPhone.trim(),
        mother_phone: formData.motherPhone.trim(),
        academic_track: formData.academicTrack,
        assigned_group_id: assignedGroupId,
        assigned_group_name: assignedGroupName
      };

      const savedBooking = await dbService.saveBooking(bookingToSave);
      const trackConfig = TRACKS_CONFIG[formData.academicTrack];
      
      onSuccess(savedBooking, trackConfig);
    } catch (err) {
      console.error('Error saving booking:', err);
      alert('حدث خطأ أثناء حفظ الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Check state helpers for real-time validation visual ticks
  const isNameValid = validateFullName(formData.fullName);
  const isStudentPhoneValid = validatePhone(formData.studentPhone);
  const isFatherPhoneValid = validatePhone(formData.fatherPhone) && formData.fatherPhone !== formData.studentPhone;
  const isMotherPhoneValid = validatePhone(formData.motherPhone) && formData.motherPhone !== formData.studentPhone;

  return (
    <div className="max-w-md mx-auto px-4 pb-12 pt-4" style={{ direction: 'rtl' }}>
      {/* Intro Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          العام الدراسي ٢٠٢٦ - ٢٠٢٧
        </span>
        <h1 className="text-2xl font-black text-gray-900 leading-tight">منصة الحجز الإلكتروني</h1>
        <p className="text-emerald-800 font-extrabold text-lg mt-1">الأستاذ محمود الديب</p>
        <p className="text-xs text-gray-500 mt-1.5">مرحلة الصف الأول الثانوي | لمادة اللغة العربية</p>
      </div>

      {/* Main Registration Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-lg space-y-6">
        
        {/* SECTION 1: Personal & Study Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">١</div>
            <h2 className="font-bold text-gray-900 text-sm">بيانات الطالب الأساسية</h2>
          </div>

          {/* Full Name */}
          <div id="field-fullName" className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between items-center">
              <span>الاسم رباعي</span>
              {isNameValid && <span className="text-green-600 text-[10px] font-bold">✓ اسم رباعي مكتمل</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="أدخل اسمك رباعياً كاملاً..."
                className={`w-full pr-10 pl-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                  isNameValid 
                    ? 'border-green-200 bg-green-50/10 focus:ring-green-100' 
                    : errors.fullName 
                      ? 'border-red-400 bg-red-50/10 focus:ring-red-100' 
                      : 'border-gray-200 focus:ring-emerald-100 focus:border-emerald-500'
                }`}
              />
              <User className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            </div>
            {errors.fullName && <p className="text-[11px] text-red-600 font-medium">{errors.fullName}</p>}
          </div>

          {/* Governorate (Select) & City (Manual) */}
          <div className="grid grid-cols-2 gap-3">
            <div id="field-governorate" className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">المحافظة</label>
              <div className="relative">
                <select
                  name="governorate"
                  value={formData.governorate}
                  onChange={handleChange}
                  className="w-full pr-3 pl-2 py-3 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 bg-white"
                >
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>
            </div>

            <div id="field-city" className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">المدينة والمركز (يدوي)</label>
              <div className="relative">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="مثال: منيا القمح"
                  className={`w-full pr-8 pl-3 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                    errors.city 
                      ? 'border-red-400 focus:ring-red-100' 
                      : 'border-gray-200 focus:ring-emerald-100 focus:border-emerald-500'
                  }`}
                />
                <MapPin className="absolute right-2.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              {errors.city && <p className="text-[10px] text-red-600 font-medium">{errors.city}</p>}
            </div>
          </div>

          {/* School */}
          <div id="field-school" className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">المدرسة</label>
            <div className="relative">
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="أدخل اسم المدرسة المقيد بها حالياً..."
                className={`w-full pr-10 pl-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                  errors.school 
                    ? 'border-red-400 focus:ring-red-100' 
                    : 'border-gray-200 focus:ring-emerald-100 focus:border-emerald-500'
                }`}
              />
              <School className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            </div>
            {errors.school && <p className="text-[11px] text-red-600 font-medium">{errors.school}</p>}
          </div>

          {/* Student Phone */}
          <div id="field-studentPhone" className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between items-center">
              <span>رقم تليفون الطالب</span>
              {isStudentPhoneValid && <span className="text-green-600 text-[10px] font-bold">✓ هاتف صحيح</span>}
            </label>
            <div className="relative">
              <input
                type="tel"
                name="studentPhone"
                value={formData.studentPhone}
                onChange={handleChange}
                placeholder="مثال: 01012345678"
                maxLength={11}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border text-sm text-left font-mono tracking-wider transition-all focus:outline-hidden focus:ring-2 ${
                  isStudentPhoneValid 
                    ? 'border-green-200 bg-green-50/10 focus:ring-green-100' 
                    : errors.studentPhone 
                      ? 'border-red-400 bg-red-50/10 focus:ring-red-100' 
                      : 'border-gray-200 focus:ring-emerald-100 focus:border-emerald-500'
                }`}
              />
              <Phone className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            </div>
            {errors.studentPhone && <p className="text-[11px] text-red-600 font-medium">{errors.studentPhone}</p>}
          </div>
        </div>

        {/* SECTION 2: Parental Contact Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">٢</div>
            <h2 className="font-bold text-gray-900 text-sm">بيانات الاتصال والمتابعة</h2>
          </div>

          {/* Father Occupation */}
          <div id="field-fatherJob" className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">وظيفة الأب</label>
            <div className="relative">
              <input
                type="text"
                name="fatherJob"
                value={formData.fatherJob}
                onChange={handleChange}
                placeholder="أدخل وظيفة الوالد..."
                className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
              />
              <Briefcase className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            </div>
          </div>

          {/* Father Phone */}
          <div id="field-fatherPhone" className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between items-center">
              <span>رقم تليفون الأب</span>
              {isFatherPhoneValid && <span className="text-green-600 text-[10px] font-bold">✓ هاتف صحيح</span>}
            </label>
            <div className="relative">
              <input
                type="tel"
                name="fatherPhone"
                value={formData.fatherPhone}
                onChange={handleChange}
                placeholder="مثال: 01198765432"
                maxLength={11}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border text-sm text-left font-mono tracking-wider transition-all focus:outline-hidden focus:ring-2 ${
                  isFatherPhoneValid 
                    ? 'border-green-200 bg-green-50/10 focus:ring-green-100' 
                    : errors.fatherPhone 
                      ? 'border-red-400 bg-red-50/10 focus:ring-red-100' 
                      : 'border-gray-200 focus:ring-emerald-100 focus:border-emerald-500'
                }`}
              />
              <Phone className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            </div>
            {errors.fatherPhone && <p className="text-[11px] text-red-600 font-medium">{errors.fatherPhone}</p>}
          </div>

          {/* Mother Phone */}
          <div id="field-motherPhone" className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between items-center">
              <span>رقم تليفون الأم</span>
              {isMotherPhoneValid && <span className="text-green-600 text-[10px] font-bold">✓ هاتف صحيح</span>}
            </label>
            <div className="relative">
              <input
                type="tel"
                name="motherPhone"
                value={formData.motherPhone}
                onChange={handleChange}
                placeholder="مثال: 01245678901"
                maxLength={11}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border text-sm text-left font-mono tracking-wider transition-all focus:outline-hidden focus:ring-2 ${
                  isMotherPhoneValid 
                    ? 'border-green-200 bg-green-50/10 focus:ring-green-100' 
                    : errors.motherPhone 
                      ? 'border-red-400 bg-red-50/10 focus:ring-red-100' 
                      : 'border-gray-200 focus:ring-emerald-100 focus:border-emerald-500'
                }`}
              />
              <Phone className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            </div>
            {errors.motherPhone && <p className="text-[11px] text-red-600 font-medium">{errors.motherPhone}</p>}
          </div>
        </div>

        {/* SECTION 3: Academic Orientation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-xs">٣</div>
            <h2 className="font-bold text-gray-900 text-sm">التوجيه الأكاديمي (المسار الدراسى)</h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {(Object.keys(TRACKS_CONFIG) as AcademicTrackKey[]).map((key) => {
              const track = TRACKS_CONFIG[key];
              const isSelected = formData.academicTrack === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleTrackChange(key)}
                  className={`w-full text-right p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected 
                      ? `${track.color} ring-1 ring-emerald-500 font-bold scale-[1.01] shadow-xs` 
                      : 'border-gray-100 hover:bg-gray-50/50 text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0 leading-none">{track.icon}</span>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900 leading-tight">{track.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">الصف الأول الثانوي</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Assignment Hint */}
        <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed">
          <p className="font-bold mb-1">ℹ️ توزيع المجموعات واللقاءات:</p>
          لقد تم تنظيم الحجز لطلاب الصف الأول الثانوي بمختلف المسارات. سيقوم الأستاذ محمود الديب ومساعدوه بتوزيع المجموعات وفقاً للمسار الأكاديمي الذي ستحدده أعلاه، وسيتم طباعة موعد وتفاصيل مجموعتك الخاصة تلقائياً على إيصالك الإلكتروني فور إرسال النموذج.
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري تسجيل بياناتك...</span>
            </>
          ) : (
            <>
              <span>إرسال وتأكيد الحجز الإلكتروني</span>
              <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </button>

      </form>
    </div>
  );
}
