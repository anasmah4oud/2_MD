/**
 * Types for the El-Deeb Booking Platform
 */

export interface Group {
  id: string;
  name: string; // e.g., "مجموعة السبت"
  track: 'medicine' | 'engineering' | 'business' | 'arts' | 'all'; // 'all' means any track
  day: string; // e.g., "السبت"
  time: string; // e.g., "04:00 م"
  capacity: number;
  is_active: boolean;
  created_at?: string;
}

export interface Booking {
  id: string;
  full_name: string;
  governorate: string;
  city: string;
  school: string;
  student_phone: string;
  father_job: string;
  father_phone: string;
  mother_phone: string;
  academic_track: 'medicine' | 'engineering' | 'business' | 'arts';
  assigned_group_id: string;
  assigned_group_name: string;
  created_at?: string;
}

export type AcademicTrackKey = 'medicine' | 'engineering' | 'business' | 'arts';

export interface TrackConfig {
  key: AcademicTrackKey;
  label: string;
  icon: string;
  color: string;
  bgLight: string;
  borderClass: string;
}

export const EGYPT_GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الشرقية",
  "الغربية",
  "الدقهلية",
  "المنوفية",
  "دمياط",
  "بورسعيد",
  "السويس",
  "الإسماعيلية",
  "البحيرة",
  "كفر الشيخ",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "الوادي الجديد",
  "مطروح",
  "شمال سيناء",
  "جنوب سيناء"
];
