import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://xlhoroxghgwfzuhnbbbc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_8M_UKmpAHNKLHyhD_vrbnw_VwfCzA4p';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Fetch the profile of a given user ID, or the currently logged-in user if omitted.
 */
export async function getUserProfile(userId) {
  try {
    let targetId = userId;
    if (!targetId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      targetId = user.id;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error) {
      console.warn('Error fetching profile from Supabase:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('getUserProfile exception:', err);
    return null;
  }
}
