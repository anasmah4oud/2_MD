-- --------------------------------------------------------
-- ملف تهيئة قاعدة بيانات Supabase - الأستاذ محمود الديب
-- العام الدراسي: 2026 - 2027 (الصف الأول الثانوي)
-- --------------------------------------------------------

-- 1. إنشاء جدول المجموعات (groups)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    track TEXT NOT NULL CHECK (track IN ('medicine', 'engineering', 'business', 'arts', 'all')),
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. إنشاء جدول الحجوزات (bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY, -- سنقوم بتوليد كود الحجز مثل B-123456
    full_name TEXT NOT NULL,
    governorate TEXT NOT NULL,
    city TEXT NOT NULL,
    school TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    father_job TEXT NOT NULL,
    father_phone TEXT NOT NULL,
    mother_phone TEXT NOT NULL,
    academic_track TEXT NOT NULL CHECK (academic_track IN ('medicine', 'engineering', 'business', 'arts')),
    assigned_group_id TEXT, -- معرف المجموعة
    assigned_group_name TEXT, -- اسم المجموعة للسهولة
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. إدراج المجموعات الافتراضية للبداية
INSERT INTO public.groups (name, track, day, time, capacity, is_active)
VALUES 
('مجموعة أطباء المستقبل (السبت)', 'medicine', 'السبت', '10:00 ص', 50, TRUE),
('مجموعة عباقرة الهندسة (الأحد)', 'engineering', 'الأحد', '12:00 م', 50, TRUE),
('مجموعة رواد الأعمال (الاثنين)', 'business', 'الاثنين', '02:00 م', 40, TRUE),
('مجموعة الفنون والآداب (الثلاثاء)', 'arts', 'الثلاثاء', '04:00 م', 35, TRUE),
('المجموعة العامة (الأربعاء)', 'all', 'الأربعاء', '04:00 م', 60, TRUE)
ON CONFLICT DO NOTHING;

-- 4. إعداد سياسات الحماية (Row Level Security - RLS)
-- لتسهيل الحجز، سنسمح بالوصول العام للإدخال لجدول الحجوزات، والوصول العام للقراءة لجدول المجموعات.

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- سياسات جدول المجموعات
CREATE POLICY "الجميع يمكنهم قراءة المجموعات" 
ON public.groups FOR SELECT 
USING (true);

CREATE POLICY "المدير يمكنه التعديل على المجموعات" 
ON public.groups FOR ALL 
USING (true) 
WITH CHECK (true); -- للتسهيل في البداية بدون تعقيدات تسجيل الدخول

-- سياسات جدول الحجوزات
CREATE POLICY "الجميع يمكنهم إدخال حجز جديد" 
ON public.bookings FOR INSERT 
WITH CHECK (true);

CREATE POLICY "الجميع يمكنهم قراءة الحجوزات" 
ON public.bookings FOR SELECT 
USING (true); -- لتسهيل لوحة التحكم المفتوحة بالرابط السري

CREATE POLICY "الجميع يمكنهم التعديل أو الحذف" 
ON public.bookings FOR ALL 
USING (true)
WITH CHECK (true);
