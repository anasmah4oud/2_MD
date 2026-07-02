import { createClient } from '@supabase/supabase-js';
import { Booking, Group } from './types';

// Read credentials from Vite env - REQUIRED for Supabase only mode
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are valid/provided
const isSupabaseConfigured = SUPABASE_URL.trim() !== '' && SUPABASE_ANON_KEY.trim() !== '';

// Initialize Supabase client - MUST be configured
export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Show warning if not configured
if (!isSupabaseConfigured) {
  console.error(
    '❌ Supabase Configuration Error: VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY غير موجودة في ملف .env\n' +
    'الرجاء إضافة متغيرات البيئة كما هو موضح في .env.example'
  );
}

// Unified Database Service - Supabase ONLY, no localStorage fallback
export const dbService = {
  // Check if Supabase is configured
  isConfigured: (): boolean => {
    return isSupabaseConfigured;
  },

  getSupabaseUrl: (): string => {
    return SUPABASE_URL;
  },

  // GET GROUPS - Direct from Supabase only
  getGroups: async (): Promise<Group[]> => {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch groups: ${error.message}`);
      }

      return data as Group[];
    } catch (err) {
      console.error('Error fetching groups from Supabase:', err);
      throw err;
    }
  },

  // SAVE GROUP (Create or Update) - Direct to Supabase only
  saveGroup: async (group: Omit<Group, 'id'> & { id?: string }): Promise<Group> => {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }

    const id = group.id || Math.random().toString(36).substring(2, 11);
    const newGroup: Group = {
      ...group,
      id,
      created_at: group.created_at || new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('groups')
        .upsert(newGroup)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save group: ${error.message}`);
      }

      return data as Group;
    } catch (err) {
      console.error('Error saving group to Supabase:', err);
      throw err;
    }
  },

  // DELETE GROUP - Direct from Supabase only
  deleteGroup: async (id: string): Promise<boolean> => {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete group: ${error.message}`);
      }

      return true;
    } catch (err) {
      console.error('Error deleting group from Supabase:', err);
      throw err;
    }
  },

  // GET BOOKINGS - Direct from Supabase only
  getBookings: async (): Promise<Booking[]> => {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      return data as Booking[];
    } catch (err) {
      console.error('Error fetching bookings from Supabase:', err);
      throw err;
    }
  },

  // SAVE BOOKING - Direct to Supabase only
  saveBooking: async (booking: Omit<Booking, 'id'> & { id?: string }): Promise<Booking> => {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }

    const id = booking.id || 'B-' + Math.floor(100000 + Math.random() * 900000);
    const newBooking: Booking = {
      ...booking,
      id,
      created_at: booking.created_at || new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(newBooking)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save booking: ${error.message}`);
      }

      return data as Booking;
    } catch (err) {
      console.error('Error saving booking to Supabase:', err);
      throw err;
    }
  }
};
