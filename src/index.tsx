/**
 * @easypayment/react-native-sdk
 *
 * Main entry point for the Easy Payment React Native SDK.
 * Re-exports all public APIs, components, hooks, types, and errors.
 */

// ─── Client ──────────────────────────────────────────────────────────────────
export { EasyPaymentClient } from './EasyPaymentClient';

// ─── Native Module Spec ─────────────────────────────────────────────────────
export { NativeEasyPayment } from './NativeEasyPayment';

// ─── Components ──────────────────────────────────────────────────────────────
export { PaymentSheet } from './components/PaymentSheet';

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useEasyPayment } from './hooks/useEasyPayment';

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  EasyPaymentConfig,
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
  RefundRequest,
  RefundResponse,
  PaymentMethod,
  PaymentStatus,
  CustomerInfo,
} from './types';

// ─── Errors ──────────────────────────────────────────────────────────────────
export {
  EasyPaymentError,
  PaymentCreationError,
  PaymentVerificationError,
  PaymentRefundError,
  NetworkError,
  InvalidConfigError,
} from './errors';
