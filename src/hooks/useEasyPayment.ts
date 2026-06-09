/**
 * useEasyPayment — React hook for the Easy Payment SDK.
 *
 * Provides a declarative API for initialising the SDK, creating payments,
 * verifying transactions, and tracking loading/error states.
 *
 * @example
 * ```tsx
 * function CheckoutScreen() {
 *   const { initialize, pay, verify, loading, error, paymentResult } = useEasyPayment();
 *
 *   useEffect(() => {
 *     initialize({ apiKey: 'ep_live_abc123' });
 *   }, []);
 *
 *   const handlePay = async () => {
 *     const result = await pay({
 *       slug: 'order-123',
 *       amount: 49.99,
 *       method: 'card',
 *       customerName: 'Jane Doe',
 *       customerEmail: 'jane@example.com',
 *       customerPhone: '+8801712345678',
 *     });
 *     if (result) {
 *       console.log('Transaction ID:', result.trxId);
 *     }
 *   };
 *
 *   return (
 *     <Button onPress={handlePay} disabled={loading} title="Pay" />
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { EasyPaymentClient } from '../EasyPaymentClient';
import type {
  EasyPaymentConfig,
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
} from '../types';
import { EasyPaymentError } from '../errors';

/** Return type of the `useEasyPayment` hook. */
export interface UseEasyPaymentReturn {
  /** Initialise the SDK with the given configuration. */
  initialize: (config: EasyPaymentConfig) => Promise<void>;
  /** Create a payment. Returns `PaymentResponse` on success or `null` on failure. */
  pay: (request: PaymentRequest) => Promise<PaymentResponse | null>;
  /** Verify a payment by transaction ID. Returns `PaymentVerification` or `null`. */
  verify: (trxId: string) => Promise<PaymentVerification | null>;
  /** Whether an async operation is currently in progress. */
  loading: boolean;
  /** The most recent error, or `null` if the last operation succeeded. */
  error: EasyPaymentError | null;
  /** Result of the last successful `pay()` call. */
  paymentResult: PaymentResponse | null;
  /** Result of the last successful `verify()` call. */
  verificationResult: PaymentVerification | null;
  /** Clear the current error state. */
  clearError: () => void;
  /** Reset all state to initial values. */
  reset: () => void;
}

export function useEasyPayment(): UseEasyPaymentReturn {
  // ─── State ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<EasyPaymentError | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [verificationResult, setVerificationResult] = useState<PaymentVerification | null>(null);

  // ─── Refs ──────────────────────────────────────────────────────────────
  const clientRef = useRef(EasyPaymentClient.getInstance());

  // ─── Initialisation ────────────────────────────────────────────────────

  const initialize = useCallback(async (config: EasyPaymentConfig) => {
    setLoading(true);
    setError(null);

    try {
      await clientRef.current.initialize(config);
    } catch (err) {
      const sdkError =
        err instanceof EasyPaymentError
          ? err
          : new EasyPaymentError((err as Error).message);
      setError(sdkError);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Pay ───────────────────────────────────────────────────────────────

  const pay = useCallback(async (request: PaymentRequest): Promise<PaymentResponse | null> => {
    setLoading(true);
    setError(null);
    setPaymentResult(null);

    try {
      const result = await clientRef.current.pay(request);
      setPaymentResult(result);
      return result;
    } catch (err) {
      const sdkError =
        err instanceof EasyPaymentError
          ? err
          : new EasyPaymentError((err as Error).message);
      setError(sdkError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Verify ────────────────────────────────────────────────────────────

  const verify = useCallback(async (trxId: string): Promise<PaymentVerification | null> => {
    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const result = await clientRef.current.verify(trxId);
      setVerificationResult(result);
      return result;
    } catch (err) {
      const sdkError =
        err instanceof EasyPaymentError
          ? err
          : new EasyPaymentError((err as Error).message);
      setError(sdkError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Utility ───────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setError(null);
    setPaymentResult(null);
    setVerificationResult(null);
    setLoading(false);
    clientRef.current.reset();
  }, []);

  return {
    initialize,
    pay,
    verify,
    loading,
    error,
    paymentResult,
    verificationResult,
    clearError,
    reset,
  };
}
