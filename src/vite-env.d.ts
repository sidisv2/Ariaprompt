/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_OTHER_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  gtag?: (...args: any[]) => void;
  Paddle?: {
    Checkout?: {
      open: (options: { items: Array<{ priceId: string; quantity: number }> }) => void;
    };
  };
}
