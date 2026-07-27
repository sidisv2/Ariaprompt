export const trackPurchaseConversion = (transactionId: string, amount: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-18353352141/pPXXCLaMsNccEM3bx69E',
      value: amount,
      currency: 'ARS',
      transaction_id: transactionId,
    });
  }
};
