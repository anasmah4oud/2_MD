import React, { useState, useEffect, FormEvent } from 'react';
import { Booking, Group, EGYPT_GOVERNORATES, AcademicTrackKey } from '../types';
import { dbService } from '../supabaseClient';
import { 
  Users, Calendar, Plus, Trash2, Search, Filter, Download, Database, 
  MapPin, GraduationCap, Check, X, ShieldAlert, FileText, AlertTriangle 
} from 'lucide-react';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrack, setFilterTrack] = useState<string>('all');
  const [filterGov, setFilterGov] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Tab state
  const [activeTab, setActiveTab] = useState<'bookings' | 'groups' | 'stats'>('bookings');

  // New Group Form state
  const [newGroup, setNewGroup] = useState({
    name: '',
    track: 'all' as 'medicine' | 'engineering' | 'business' | 'arts' | 'all',
    day: 'السبت',
    time: '10:00 ص',
    capacity: 50,
  });
  const [groupSuccess, setGroupSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedBookings = await dbService.getBookings();
      const fetchedGroups = await dbService.getGroups();
      setBookings(fetchedBookings);
      setGroups(fetchedGroups);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add group
  const handleAddGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    try {
      await dbService.saveGroup({
        name: newGroup.name.trim(),
        track: newGroup.track,
        day: newGroup.day,
        time: newGroup.time,
        capacity: newGroup.capacity,
        is_active: true
      });
      
      setNewGroup({
        name: '',
        track: 'all',
        day: 'السبت',
        time: '10:00 ص',
        capacity: 50,
      });

      setGroupSuccess(true);
      setTimeout(() => setGroupSuccess(false), 3000);
      
      // Reload
      const updatedGroups = await dbService.getGroups();
      setGroups(updatedGroups);
    } catch (err) {
      console.error('Error saving group:', err);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المجموعة؟ لن يؤثر الحذف على الحجوزات القديمة.')) return;
    try {
      await dbService.deleteGroup(id);
      const updatedGroups = await dbService.getGroups();
      setGroups(updatedGroups);
    } catch (err) {
      console.error('Error deleting group:', err);
    }
  };

  // Toggle Group Active state
  const handleToggleGroup = async (group: Group) => {
    try {
      await dbService.saveGroup({
        ...group,
        is_active: !group.is_active
      });
      const updatedGroups = await dbService.getGroups();
      setGroups(updatedGroups);
    } catch (err) {
      console.error('Error toggling group status:', err);
    }
  };

  // Export to Excel / CSV with UTF-8 BOM for Arabic compatibility
  const exportToCSV = () => {
    if (bookings.length === 0) return;

    // Headers
    const headers = [
      'كود الحجز',
      'الاسم رباعي',
      'المحافظة',
      'المدينة والمركز',
      'المدرسة',
      'رقم تليفون الطالب',
      'وظيفة الأب',
      'رقم تليفون الأب',
      'رقم تليفون الأم',
      'المسار الأكاديمي',
      'المجموعة المخصصة',
      'تاريخ التسجيل'
    ];

    // Map tracks to Arabic
    const trackNames: Record<string, string> = {
      medicine: 'الطب والعلوم الصحية',
      engineering: 'الهندسة والتكنولوجيا',
      business: 'إدارة الأعمال',
      arts: 'الآداب والفنون'
    };

    // Rows
    const rows = bookings.map(b => [
      b.id,
      b.full_name,
      b.governorate,
      b.city,
      b.school,
      b.student_phone,
      b.father_job || 'غير محدد',
      b.father_phone,
      b.mother_phone,
      trackNames[b.academic_track] || b.academic_track,
      b.assigned_group_name,
      b.created_at ? new Date(b.created_at).toLocaleDateString('ar-EG') : ''
    ]);

    // Create CSV Content
    let csvContent = '\uFEFF'; // Add BOM for Excel Arabic encoding support!
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    
    rows.forEach(row => {
      csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hajz_Al_Deeb_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.student_phone.includes(searchTerm) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTrack = filterTrack === 'all' || b.academic_track === filterTrack;
    const matchesGov = filterGov === 'all' || b.governorate === filterGov;
    const matchesGroup = filterGroup === 'all' || b.assigned_group_id === filterGroup;

    return matchesSearch && matchesTrack && matchesGov && matchesGroup;
  });

  // Calculate stats
  const stats = {
    total: bookings.length,
    medicine: bookings.filter(b => b.academic_track === 'medicine').length,
    engineering: bookings.filter(b => b.academic_track === 'engineering').length,
    business: bookings.filter(b => b.academic_track === 'business').length,
    arts: bookings.filter(b => b.academic_track === 'arts').length,
  };

  // Map Governorate occurrences
  const govStats: Record<string, number> = {};
  bookings.forEach(b => {
    govStats[b.governorate] = (govStats[b.governorate] || 0) + 1;
  });
  const sortedGovs = Object.entries(govStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full inline-block">
            لوحة التحكم السرية للمشرف والمسؤولين
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-2">بوابة إدارة حجوزات الأستاذ محمود الديب</h1>
          <p className="text-xs text-gray-400 mt-0.5">مرحلة الصف الأول الثانوي - العام الدراسي ٢٠٢٦ / ٢٠٢٧</p>
        </div>

        <button
          onClick={loadData}
          className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          تحديث البيانات لحظياً ↻
        </button>
      </div>

      {/* Supabase Status Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-900">
        <div className="flex items-start gap-2.5">
          <Database className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>حالة اتصال قاعدة البيانات (Supabase):</span>
              {dbService.isConfigured() ? (
                <span className="text-green-700 font-bold bg-green-100 border border-green-200 px-2 py-0.5 rounded-sm text-[10px]">متصل بـ Supabase بنجاح</span>
              ) : (
                <span className="text-red-700 font-bold bg-red-100 border border-red-200 px-2 py-0.5 rounded-sm text-[10px]">استخدام الذاكرة المحلية المؤقتة</span>
              )}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {dbService.isConfigured() 
                ? `قاعدة البيانات نشطة وحية. يتم حفظ حجوزات ومجموعات الأستاذ محمود الديب ومزامنتها على المشروع الخاص بك في سحابة Supabase.`
                : `الموقع يعمل حالياً باستخدام الذاكرة المحلية (LocalStorage) لتبسيط تجربة الاستوديو الفورية. يمكنك ربط قاعدة بيانات Supabase الحقيقية عن طريق تعيين مفتاح VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في أسرار البيئة الموضحة بملف المساعدة المرفق.`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'border-emerald-800 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>عرض الحجوزات ({filteredBookings.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'groups'
              ? 'border-emerald-800 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>إدارة المجموعات المعتمدة ({groups.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'border-emerald-800 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>الإحصائيات والتقارير العامة</span>
          </div>
        </button>
      </div>

      {/* TAB 1: Bookings Management */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          
          {/* Filters header bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم، التليفون، كود الحجز..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-gray-200 text-xs rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-800 focus:outline-hidden"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>

            {/* Filter by track */}
            <select
              value={filterTrack}
              onChange={(e) => setFilterTrack(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-xs rounded-xl focus:ring-2 focus:ring-emerald-100 bg-white"
            >
              <option value="all">كل المسارات التعليمية</option>
              <option value="medicine">🩺 مسار الطب والعلوم الصحية</option>
              <option value="engineering">📐 مسار الهندسة والتكنولوجيا</option>
              <option value="business">📊 مسار إدارة الأعمال</option>
              <option value="arts">🎨 مسار الآداب والفنون</option>
            </select>

            {/* Filter by Governorate */}
            <select
              value={filterGov}
              onChange={(e) => setFilterGov(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-xs rounded-xl focus:ring-2 focus:ring-emerald-100 bg-white"
            >
              <option value="all">كل المحافظات</option>
              {EGYPT_GOVERNORATES.map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>

            {/* Filter by Group */}
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-xs rounded-xl focus:ring-2 focus:ring-emerald-100 bg-white"
            >
              <option value="all">كل المجموعات</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
            <span className="text-xs text-gray-500 font-medium">عدد الطلاب المطابقين للتصفية: <strong className="text-emerald-950 text-sm font-bold">{filteredBookings.length} طالب</strong></span>
            <button
              onClick={exportToCSV}
              disabled={filteredBookings.length === 0}
              className="bg-emerald-800 hover:bg-emerald-900 text-white disabled:bg-gray-300 disabled:cursor-not-allowed px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              تصدير البيانات لـ Excel
            </button>
          </div>

          {/* Bookings List / Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-800 border-t-transparent rounded-full" />
              <p className="text-xs text-gray-500 mt-2">جاري تحميل بيانات الطلاب المحدثة...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-500">لا توجد حجوزات متطابقة مع معايير البحث والفلترة حالياً</p>
              <p className="text-xs text-gray-400 mt-1">تأكد من كتابة الاسم بشكل صحيح أو تغيير خيارات التصفية.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left-top highlight of track */}
                  <div className={`absolute top-0 right-0 w-2 h-full ${
                    b.academic_track === 'medicine' ? 'bg-emerald-500' :
                    b.academic_track === 'engineering' ? 'bg-blue-500' :
                    b.academic_track === 'business' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  
                  <div className="space-y-1.5 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-gray-950 text-sm">{b.full_name}</span>
                      <span className="bg-amber-50 text-amber-800 text-[9px] font-mono font-black px-2 py-0.5 rounded-sm">كود: {b.id}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        b.academic_track === 'medicine' ? 'bg-emerald-50 text-emerald-800' :
                        b.academic_track === 'engineering' ? 'bg-blue-50 text-blue-800' :
                        b.academic_track === 'business' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {b.academic_track === 'medicine' ? '🩺 طب' :
                         b.academic_track === 'engineering' ? '📐 هندسة' :
                         b.academic_track === 'business' ? '📊 أعمال' : '🎨 آداب'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-500">
                      <div>المحافظة: <span className="font-medium text-gray-800">{b.governorate}</span></div>
                      <div>المدينة: <span className="font-medium text-gray-800">{b.city}</span></div>
                      <div>المدرسة: <span className="font-medium text-gray-800">{b.school}</span></div>
                      <div>رقم تليفون الطالب: <span className="font-mono font-bold text-gray-900 select-all">{b.student_phone}</span></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1 border-t border-gray-50 text-xs text-gray-400">
                      <div>تليفون الأب: <span className="font-mono text-gray-700">{b.father_phone}</span></div>
                      <div>تليفون الأم: <span className="font-mono text-gray-700">{b.mother_phone}</span></div>
                      <div>وظيفة الأب: <span className="text-gray-700">{b.father_job}</span></div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-start md:items-end gap-1 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 font-bold">المجموعة المطبوعة بالإيصال:</span>
                    <span className="text-xs font-bold text-emerald-950">{b.assigned_group_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: Groups Management */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* New Group form column */}
          <div className="md:col-span-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Plus className="w-4 h-4 text-emerald-800" />
              <span>إضافة مجموعة جديدة</span>
            </h3>

            {groupSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-2.5 rounded-xl font-bold">
                ✓ تم حفظ وإضافة المجموعة بنجاح!
              </div>
            )}

            <form onSubmit={handleAddGroup} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">اسم المجموعة المميز</label>
                <input
                  type="text"
                  placeholder="مثال: عباقرة السبت"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-800 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">المسار الموجهة له</label>
                <select
                  value={newGroup.track}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, track: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-hidden"
                >
                  <option value="all">الكل (عامة)</option>
                  <option value="medicine">🩺 طب وعلوم صحية</option>
                  <option value="engineering">📐 هندسة وتكنولوجيا</option>
                  <option value="business">📊 إدارة أعمال</option>
                  <option value="arts">🎨 آداب وفنون</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">يوم الحصة</label>
                  <input
                    type="text"
                    value={newGroup.day}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, day: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    placeholder="مثال: السبت"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">وقت الحصة</label>
                  <input
                    type="text"
                    value={newGroup.time}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    placeholder="مثال: 04:00 م"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">السعة الاستيعابية (اختياري)</label>
                <input
                  type="number"
                  value={newGroup.capacity}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, capacity: parseInt(e.target.value) || 50 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                حفظ وإضافة المجموعة
              </button>
            </form>
          </div>

          {/* Groups list column */}
          <div className="md:col-span-2 space-y-3">
            {groups.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">لا توجد مجموعات حالية. يرجى إضافة واحدة من الجانب الأيمن.</p>
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-gray-950 text-sm">{g.name}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        g.track === 'medicine' ? 'bg-emerald-50 text-emerald-800' :
                        g.track === 'engineering' ? 'bg-blue-50 text-blue-800' :
                        g.track === 'business' ? 'bg-amber-50 text-amber-800' : 
                        g.track === 'arts' ? 'bg-rose-50 text-rose-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {g.track === 'medicine' ? '🩺 مسار الطب' :
                         g.track === 'engineering' ? '📐 مسار الهندسة' :
                         g.track === 'business' ? '📊 مسار الأعمال' :
                         g.track === 'arts' ? '🎨 مسار الآداب' : '🌍 مسار عام'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>اليوم: <strong className="text-gray-800">{g.day}</strong></span>
                      <span>•</span>
                      <span>الوقت: <strong className="text-gray-800">{g.time}</strong></span>
                      <span>•</span>
                      <span>السعة المقدرة: <strong className="text-gray-800">{g.capacity} طالب</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle Active status */}
                    <button
                      onClick={() => handleToggleGroup(g)}
                      className={`p-1.5 rounded-lg border transition ${
                        g.is_active 
                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                          : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                      }`}
                      title={g.is_active ? 'تعطيل المجموعة' : 'تنشيط المجموعة'}
                    >
                      {g.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition"
                      title="حذف المجموعة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: General Statistics */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Top Row Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
              <span className="text-gray-400 text-xs block">إجمالي الطلاب المسجلين</span>
              <strong className="text-3xl font-black text-emerald-950 mt-1 block">{stats.total}</strong>
              <span className="text-[10px] text-gray-400 mt-1 block">بالمنصة الإلكترونية</span>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm text-center">
              <span className="text-emerald-800 text-xs block font-bold">🩺 مسار الطب</span>
              <strong className="text-2xl font-black text-emerald-950 mt-1 block">{stats.medicine}</strong>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {stats.total > 0 ? `${Math.round((stats.medicine / stats.total) * 100)}% من الطلاب` : '0%'}
              </span>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm text-center">
              <span className="text-blue-800 text-xs block font-bold">📐 مسار الهندسة</span>
              <strong className="text-2xl font-black text-gray-900 mt-1 block">{stats.engineering}</strong>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {stats.total > 0 ? `${Math.round((stats.engineering / stats.total) * 100)}% من الطلاب` : '0%'}
              </span>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-sm text-center">
              <span className="text-amber-800 text-xs block font-bold">📊 مسار الأعمال</span>
              <strong className="text-2xl font-black text-gray-900 mt-1 block">{stats.business}</strong>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {stats.total > 0 ? `${Math.round((stats.business / stats.total) * 100)}% من الطلاب` : '0%'}
              </span>
            </div>
          </div>

          {/* Visual Distribution Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900 text-sm">التوزيع النسبي للطلاب حسب المسارات الأكاديمية</h4>
            
            {stats.total === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">بانتظار تسجيل أول الطلاب لرسم مؤشرات التوزيع المباشرة.</p>
            ) : (
              <div className="space-y-3.5">
                {/* Visual stacked bar */}
                <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden flex">
                  <div style={{ width: `${(stats.medicine / stats.total) * 100}%` }} className="bg-emerald-500 h-full" title="طب" />
                  <div style={{ width: `${(stats.engineering / stats.total) * 100}%` }} className="bg-blue-500 h-full" title="هندسة" />
                  <div style={{ width: `${(stats.business / stats.total) * 100}%` }} className="bg-amber-500 h-full" title="أعمال" />
                  <div style={{ width: `${(stats.arts / stats.total) * 100}%` }} className="bg-rose-500 h-full" title="آداب" />
                </div>

                {/* Progress-style list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-medium text-emerald-800">🩺 مسار الطب والعلوم الصحية</span>
                      <span className="font-bold">{stats.medicine} طالب ({Math.round((stats.medicine / stats.total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(stats.medicine / stats.total) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-800">📐 مسار الهندسة والتكنولوجيا</span>
                      <span className="font-bold">{stats.engineering} طالب ({Math.round((stats.engineering / stats.total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${(stats.engineering / stats.total) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-medium text-amber-800">📊 مسار إدارة الأعمال والاقتصاد</span>
                      <span className="font-bold">{stats.business} طالب ({Math.round((stats.business / stats.total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${(stats.business / stats.total) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-medium text-rose-800">🎨 مسار الآداب والفنون الجميلة</span>
                      <span className="font-bold">{stats.arts} طالب ({Math.round((stats.arts / stats.total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full" style={{ width: `${(stats.arts / stats.total) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Regional distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>المحافظات الأكثر تسجيلاً</span>
              </h4>
              
              {sortedGovs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">لا توجد محافظات مسجلة بعد.</p>
              ) : (
                <div className="space-y-2">
                  {sortedGovs.slice(0, 5).map(([gov, count], idx) => (
                    <div key={gov} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg">
                      <span className="font-bold text-gray-800">{idx + 1}. {gov}</span>
                      <span className="font-semibold text-emerald-800">{count} طالب</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-800" />
                <span>أعلى المدارس تواجداً بالمنصة</span>
              </h4>
              
              {bookings.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">لا توجد مدارس مسجلة بعد.</p>
              ) : (
                <div className="space-y-2">
                  {(Object.entries(
                    bookings.reduce((acc, curr) => {
                      acc[curr.school] = (acc[curr.school] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ) as [string, number][])
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([school, count], idx) => (
                      <div key={school} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg">
                        <span className="font-bold text-gray-800 truncate max-w-[200px]">{idx + 1}. {school}</span>
                        <span className="font-semibold text-emerald-800">{count} طالب</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
