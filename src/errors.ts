/**
 * Custom error classes for the Easy Payment React Native SDK.
 *
 * All SDK errors inherit from `EasyPaymentError` so consumers can
 * distinguish SDK errors from generic JavaScript errors:
 *
 * ```ts
 * try {
 *   await client.pay(request);
 * } catch (error) {
 *   if (error instanceof EasyPaymentError) {
 *     // Handle SDK-specific error
 *   }
 * }
 * ```
 */

/**
 * Base error class for all Easy Payment SDK errors.
 * Extends the native `Error` class with an optional HTTP status code.
 */
export class EasyPaymentError extends Error {
  /** HTTP status code from the gateway, if applicable. */
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'EasyPaymentError';
    this.statusCode = statusCode;

    // Restore prototype chain (required for extending built-in classes in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when payment creation fails.
 *
 * Common causes:
 *  - Invalid or missing payment parameters
 *  - Insufficient permissions on the API key
 *  - Gateway-side validation errors
 */
export class PaymentCreationError extends EasyPaymentError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = 'PaymentCreationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when payment verification fails.
 *
 * Common causes:
 *  - Transaction ID does not exist
 *  - API key lacks read permissions
 */
export class PaymentVerificationError extends EasyPaymentError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = 'PaymentVerificationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a refund request fails.
 *
 * Common causes:
 *  - Transaction not eligible for refund
 *  - Refund period expired
 */
export class PaymentRefundError extends EasyPaymentError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = 'PaymentRefundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a network request fails entirely (no response from server).
 *
 * Common causes:
 *  - No internet connection
 *  - DNS resolution failure
 *  - Request timeout
 */
export class NetworkError extends EasyPaymentError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the SDK is misconfigured or not initialised.
 *
 * Common causes:
 *  - `initialize()` not called before `pay()` or `verify()`
 *  - Malformed API key
 */
export class InvalidConfigError extends EasyPaymentError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidConfigError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
