/**
 * TypeScript type definitions for the Easy Payment React Native SDK.
 *
 * All public types are exported from `src/index.tsx` so consumers can
 * import them directly:
 *
 * ```ts
 * import type { PaymentRequest, PaymentResponse } from '@easypayment/react-native-sdk';
 * ```
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * SDK initialisation configuration.
 *
 * @example
 * ```ts
 * const config: EasyPaymentConfig = {
 *   apiKey: 'ep_live_abc123',
 *   baseUrl: 'https://api.easypayment.io',   // optional, defaults to production
 * };
 * ```
 */
export interface EasyPaymentConfig {
  /** Your merchant API key (starts with `ep_`). */
  apiKey: string;
  /**
   * Override the default API base URL.
   * Useful for sandbox testing: `https://sandbox-api.easypayment.io`
   */
  baseUrl?: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

/** Supported payment methods. */
export type PaymentMethod = 'card' | 'mobile_banking' | 'bank_transfer' | 'crypto' | 'wallet';

/** Possible payment statuses. */
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';

/** Customer information attached to a payment. */
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

/**
 * Payload sent to `EasyPaymentClient.pay()`.
 *
 * Maps directly to the POST `/api/pay/create` request body.
 */
export interface PaymentRequest {
  /** Unique identifier for the payment (e.g. order ID). */
  slug: string;
  /** Payment amount in the currency's smallest unit or decimal — depending on gateway config. */
  amount: number;
  /** Selected payment method. */
  method: PaymentMethod;
  /** Full name of the customer. */
  customerName: string;
  /** Email address of the customer. */
  customerEmail: string;
  /** Phone number of the customer (international format preferred). */
  customerPhone: string;
}

/**
 * Response returned after a successful payment creation.
 *
 * Maps to the response of POST `/api/pay/create`.
 */
export interface PaymentResponse {
  /** Unique transaction ID assigned by the gateway. */
  trxId: string;
  /** Current payment status. */
  status: PaymentStatus;
  /** Checkout URL the customer can visit to complete payment (if applicable). */
  checkoutUrl?: string;
  /** Original slug from the request. */
  slug: string;
  /** Amount confirmed by the gateway. */
  amount: number;
  /** Currency code (e.g. "USD", "BDT"). */
  currency?: string;
  /** ISO‑8601 timestamp of creation. */
  createdAt: string;
}

// ─── Verification ─────────────────────────────────────────────────────────────

/**
 * Result of a payment verification request.
 *
 * Maps to the response of GET `/api/pay/verify/{trxId}`.
 */
export interface PaymentVerification {
  /** Transaction ID. */
  trxId: string;
  /** Current payment status. */
  status: PaymentStatus;
  /** Amount that was paid / is expected. */
  amount: number;
  /** Currency code. */
  currency?: string;
  /** ISO‑8601 timestamp when payment was confirmed (null if unpaid). */
  paidAt: string | null;
  /** Payment method used. */
  method?: PaymentMethod;
  /** Customer info on file for this transaction. */
  customer?: CustomerInfo;
}

// ─── Refund ───────────────────────────────────────────────────────────────────

/**
 * Payload sent for a refund request.
 * Maps to POST `/api/pay/refund`.
 */
export interface RefundRequest {
  /** Transaction ID to refund. */
  trxId: string;
}

/**
 * Response from a refund request.
 */
export interface RefundResponse {
  /** Transaction ID of the refund. */
  refundTrxId: string;
  /** Original transaction ID. */
  originalTrxId: string;
  /** Refund status. */
  status: 'refunded' | 'pending';
  /** Refunded amount. */
  amount: number;
  /** ISO‑8601 timestamp of the refund. */
  refundedAt: string;
}

// ─── Component Props ──────────────────────────────────────────────────────────

/** Props for the `<PaymentSheet />` component. */
export interface PaymentSheetProps {
  /** Whether the bottom sheet is visible. */
  visible: boolean;
  /** Callback when the user dismisses the sheet without paying. */
  onDismiss: () => void;
  /** Callback when payment succeeds. Receives the full PaymentResponse. */
  onSuccess: (response: PaymentResponse) => void;
  /** Callback when payment fails. Receives the error. */
  onError?: (error: Error) => void;
  /** Payment details to pre‑fill. */
  payment: PaymentRequest;
  /** Optional custom title for the sheet. */
  title?: string;
  /** Optional subtitle / description. */
  subtitle?: string;
}
