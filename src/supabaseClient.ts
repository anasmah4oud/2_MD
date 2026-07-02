import { createClient } from '@supabase/supabase-js';
import { Booking, Group } from './types';

// Read credentials from Vite env
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are valid/provided
const isSupabaseConfigured = SUPABASE_URL.trim() !== '' && SUPABASE_ANON_KEY.trim() !== '';

// Initialize actual supabase client if configured
export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Initial Mock Groups to populate local storage when empty
const DEFAULT_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'مجموعة أطباء المستقبل (السبت)',
    track: 'medicine',
    day: 'السبت',
    time: '10:00 ص',
    capacity: 50,
    is_active: true
  },
  {
    id: 'g2',
    name: 'مجموعة عباقرة الهندسة (الأحد)',
    track: 'engineering',
    day: 'الأحد',
    time: '12:00 م',
    capacity: 50,
    is_active: true
  },
  {
    id: 'g3',
    name: 'مجموعة رواد الأعمال (الاثنين)',
    track: 'business',
    day: 'الاثنين',
    time: '02:00 م',
    capacity: 40,
    is_active: true
  },
  {
    id: 'g4',
    name: 'مجموعة الفنون والآداب (الثلاثاء)',
    track: 'arts',
    day: 'الثلاثاء',
    time: '04:00 م',
    capacity: 35,
    is_active: true
  },
  {
    id: 'g5',
    name: 'المجموعة العامة (الأربعاء)',
    track: 'all',
    day: 'الأربعاء',
    time: '04:00 م',
    capacity: 60,
    is_active: true
  }
];

// LocalStorage helpers for fallbacks and double safety
const getLocalBookings = (): Booking[] => {
  const data = localStorage.getItem('eldeeb_bookings');
  return data ? JSON.parse(data) : [];
};

const saveLocalBookings = (bookings: Booking[]) => {
  localStorage.setItem('eldeeb_bookings', JSON.stringify(bookings));
};

const getLocalGroups = (): Group[] => {
  const data = localStorage.getItem('eldeeb_groups');
  if (!data) {
    localStorage.setItem('eldeeb_groups', JSON.stringify(DEFAULT_GROUPS));
    return DEFAULT_GROUPS;
  }
  return JSON.parse(data);
};

const saveLocalGroups = (groups: Group[]) => {
  localStorage.setItem('eldeeb_groups', JSON.stringify(groups));
};

// Unified Database Service
export const dbService = {
  // Check if Supabase is connected
  isConfigured: (): boolean => {
    return isSupabaseConfigured;
  },

  getSupabaseUrl: (): string => {
    return SUPABASE_URL;
  },

  // GET GROUPS
  getGroups: async (): Promise<Group[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          // Sync to local storage for offline support
          saveLocalGroups(data as Group[]);
          return data as Group[];
        }
        console.warn('Failed to fetch from Supabase, falling back to local storage:', error);
      } catch (err) {
        console.warn('Supabase query error, falling back to local storage:', err);
      }
    }
    // Fallback
    return getLocalGroups();
  },

  // SAVE GROUP (Create or Update)
  saveGroup: async (group: Omit<Group, 'id'> & { id?: string }): Promise<Group> => {
    const id = group.id || Math.random().toString(36).substring(2, 11);
    const newGroup: Group = {
      ...group,
      id,
      created_at: group.created_at || new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('groups')
          .upsert(newGroup)
          .select()
          .single();

        if (!error && data) {
          // Sync
          const currentLocal = getLocalGroups();
          const index = currentLocal.findIndex(g => g.id === id);
          if (index > -1) {
            currentLocal[index] = data as Group;
          } else {
            currentLocal.push(data as Group);
          }
          saveLocalGroups(currentLocal);
          return data as Group;
        }
        console.error('Supabase saveGroup error:', error);
      } catch (err) {
        console.error('Supabase saveGroup exception:', err);
      }
    }

    // Local fallback
    const currentLocal = getLocalGroups();
    const index = currentLocal.findIndex(g => g.id === id);
    if (index > -1) {
      currentLocal[index] = newGroup;
    } else {
      currentLocal.push(newGroup);
    }
    saveLocalGroups(currentLocal);
    return newGroup;
  },

  // DELETE GROUP
  deleteGroup: async (id: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('groups')
          .delete()
          .eq('id', id);

        if (!error) {
          const currentLocal = getLocalGroups().filter(g => g.id !== id);
          saveLocalGroups(currentLocal);
          return true;
        }
        console.error('Supabase deleteGroup error:', error);
      } catch (err) {
        console.error('Supabase deleteGroup exception:', err);
      }
    }

    const currentLocal = getLocalGroups().filter(g => g.id !== id);
    saveLocalGroups(currentLocal);
    return true;
  },

  // GET BOOKINGS
  getBookings: async (): Promise<Booking[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          saveLocalBookings(data as Booking[]);
          return data as Booking[];
        }
        console.warn('Failed to fetch bookings from Supabase, falling back to local storage:', error);
      } catch (err) {
        console.warn('Supabase query error, falling back to local storage:', err);
      }
    }
    return getLocalBookings();
  },

  // SAVE BOOKING
  saveBooking: async (booking: Omit<Booking, 'id'> & { id?: string }): Promise<Booking> => {
    const id = booking.id || 'B-' + Math.floor(100000 + Math.random() * 900000);
    const newBooking: Booking = {
      ...booking,
      id,
      created_at: booking.created_at || new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .insert(newBooking)
          .select()
          .single();

        if (!error && data) {
          const currentLocal = getLocalBookings();
          currentLocal.unshift(data as Booking);
          saveLocalBookings(currentLocal);
          return data as Booking;
        }
        console.error('Supabase saveBooking error:', error);
      } catch (err) {
        console.error('Supabase saveBooking exception:', err);
      }
    }

    // Local fallback
    const currentLocal = getLocalBookings();
    currentLocal.unshift(newBooking);
    saveLocalBookings(currentLocal);
    return newBooking;
  }
};
