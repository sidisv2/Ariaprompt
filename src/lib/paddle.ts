type PaddleCheckoutEvent = {
  name?: string;
  data?: {
    transaction_id?: string;
    totals?: {
      total?: number | string;
    };
  };
};

type PaddleInstance = {
  Initialize: (options: {
    token: string;
    eventCallback?: (event: PaddleCheckoutEvent) => void;
  }) => void;
  Checkout: {
    open: (options: {
      items: Array<{ priceId: string; quantity: number }>;
      settings?: {
        displayMode?: 'overlay';
        theme?: 'dark';
        locale?: string;
      };
      customData?: Record<string, string>;
      eventCallback?: (event: PaddleCheckoutEvent) => void;
    }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleInstance;
  }
}

const PADDLE_SCRIPT_ID = 'paddle-js-sdk';
const PADDLE_SCRIPT_SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js';

let paddleLoadPromise: Promise<PaddleInstance> | null = null;
let paddleInitialized = false;
let checkoutCompletedCallback: ((event: PaddleCheckoutEvent) => void) | undefined;

const getPaddleToken = () => import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;

const loadPaddleScript = () => new Promise<void>((resolve, reject) => {
  const existingScript = document.getElementById(PADDLE_SCRIPT_ID) as HTMLScriptElement | null;

  if (existingScript) {
    if (window.Paddle) {
      resolve();
      return;
    }

    existingScript.addEventListener('load', () => resolve(), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar Paddle.js.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = PADDLE_SCRIPT_ID;
  script.src = PADDLE_SCRIPT_SRC;
  script.async = true;
  script.addEventListener('load', () => resolve(), { once: true });
  script.addEventListener('error', () => reject(new Error('No se pudo cargar Paddle.js.')), { once: true });
  document.head.appendChild(script);
});

const initializePaddle = (paddle: PaddleInstance) => {
  if (paddleInitialized) {
    return paddle;
  }

  const token = getPaddleToken();

  if (!token) {
    throw new Error('Falta configurar VITE_PADDLE_CLIENT_TOKEN para iniciar Paddle Checkout.');
  }

  paddle.Initialize({
    token,
    eventCallback: (event) => {
      if (event.name === 'checkout.completed') {
        checkoutCompletedCallback?.(event);
      }
    },
  });

  paddleInitialized = true;
  return paddle;
};

export const getPaddleInstance = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Paddle Checkout solo está disponible en el navegador.');
  }

  if (window.Paddle) {
    return initializePaddle(window.Paddle);
  }

  if (!paddleLoadPromise) {
    paddleLoadPromise = loadPaddleScript().then(() => {
      if (!window.Paddle) {
        throw new Error('Paddle.js no expuso una instancia global.');
      }

      return initializePaddle(window.Paddle);
    });
  }

  return paddleLoadPromise;
};

export const openPaddleCheckout = async (
  priceId: string,
  options: { onCompleted?: (event: PaddleCheckoutEvent) => void; planId?: string; billingCycle?: string } = {},
) => {
  checkoutCompletedCallback = options.onCompleted;
  const paddle = await getPaddleInstance();

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    settings: {
      displayMode: 'overlay',
      theme: 'dark',
      locale: 'es',
    },
    customData: {
      planId: options.planId || '',
      billingCycle: options.billingCycle || '',
    },
  });
};
