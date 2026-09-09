import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const configurationError = !url || !key || key.includes('YOUR_SUPABASE_PUBLISHABLE_KEY');

if (configurationError) {
  console.error('DataKart: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing/invalid. Check frontend/.env and restart Vite.');
}

let client = null;
if (!configurationError) {
  try {
    client = createClient(url, key);
  } catch (error) {
    console.error('DataKart: Supabase client initialization failed.', error);
  }
}

const unavailable = (message = 'Supabase is not configured. Check frontend/.env and restart the dev server.') =>
  ({ data: null, error: new Error(message) });

const unavailableQuery = () => {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => Promise.resolve(unavailable()),
    maybeSingle: () => Promise.resolve(unavailable()),
  };
  return query;
};

export const supabase = client || {
  auth: {
    getSession: async () => unavailable(),
    onAuthStateChange: () => ({ subscription: { unsubscribe() {} } }),
    signInWithPassword: async () => unavailable(),
    signUp: async () => unavailable(),
    signOut: async () => unavailable(),
  },
  from: () => ({
    select: () => unavailableQuery(),
    insert: async () => unavailable(),
    delete: () => ({ eq: async () => unavailable() }),
  }),
};
