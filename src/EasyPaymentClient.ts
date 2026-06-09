/**
 * EasyPaymentClient — Main client class for the React Native SDK.
 *
 * Provides three core operations:
 *   1. `initialize()` — Register your API key and optional base URL.
 *   2. `pay()`         — Create a new payment through the gateway.
 *   3. `verify()`      — Check the status of an existing transaction.
 *
 * The client first attempts to call the **native module** (iOS/Android).
 * If the native module is unavailable (e.g. during Expo Go development),
 * it transparently falls back to a pure‑JavaScript HTTP implementation.
 */

import { NativeModules, Platform } from 'react-native';
import type {
  EasyPaymentConfig,
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
} from './types';
import {
  InvalidConfigError,
  PaymentCreationError,
  PaymentVerificationError,
  NetworkError,
} from './errors';

/** Default production base URL for the Easy Payment API. */
const DEFAULT_BASE_URL = 'https://api.easypayment.io';

/** Singleton instance reference. */
let _instance: EasyPaymentClient | null = null;

export class EasyPaymentClient {
  private config: EasyPaymentConfig | null = null;
  private initialized = false;

  // ─── Singleton ───────────────────────────────────────────────────────────

  /** Private constructor enforces singleton usage via `EasyPaymentClient.getInstance()`. */
  private constructor() {}

  /**
   * Returns the shared client instance.
   * Call `initialize()` on the instance before using `pay()` or `verify()`.
   */
  static getInstance(): EasyPaymentClient {
    if (!_instance) {
      _instance = new EasyPaymentClient();
    }
    return _instance;
  }

  // ─── Initialisation ──────────────────────────────────────────────────────

  /**
   * Initialise the SDK with your merchant credentials.
   *
   * @param config - SDK configuration containing `apiKey` and optional `baseUrl`
   * @throws {InvalidConfigError} If the API key is missing or malformed
   *
   * @example
   * ```ts
   * await EasyPaymentClient.getInstance().initialize({
   *   apiKey: 'ep_live_abc123',
   *   baseUrl: 'https://sandbox-api.easypayment.io', // optional
   * });
   * ```
   */
  async initialize(config: EasyPaymentConfig): Promise<void> {
    // ── Validate required fields ──────────────────────────────────────────
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new InvalidConfigError(
        'API key is required and must be a non-empty string.'
      );
    }

    if (!config.apiKey.startsWith('ep_')) {
      throw new InvalidConfigError(
        'Invalid API key format. Easy Payment API keys start with "ep_".'
      );
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    };

    // ── Attempt native module initialisation ───────────────────────────────
    try {
      const nativeModule = this.getNativeModule();
      if (nativeModule) {
        await nativeModule.initialize(
          this.config.apiKey,
          this.config.baseUrl
        );
      }
    } catch (nativeError) {
      // Non‑fatal: the JS fallback will be used instead.
      console.warn(
        '[EasyPayment] Native module initialisation failed, falling back to JS client.',
        nativeError
      );
    }

    this.initialized = true;
  }

  // ─── Create Payment ──────────────────────────────────────────────────────

  /**
   * Create a new payment via the Easy Payment Gateway.
   *
   * @param request - Payment details (slug, amount, method, customer info)
   * @returns Payment response containing `trxId`, `status`, `checkoutUrl`, etc.
   * @throws {InvalidConfigError} If the client has not been initialised
   * @throws {PaymentCreationError} If the gateway rejects the request
   * @throws {NetworkError} If a network failure occurs
   *
   * @example
   * ```ts
   * const result = await EasyPaymentClient.getInstance().pay({
   *   slug: 'order-12345',
   *   amount: 49.99,
   *   method: 'card',
   *   customerName: 'Jane Doe',
   *   customerEmail: 'jane@example.com',
   *   customerPhone: '+8801712345678',
   * });
   * console.log(result.trxId); // "EP-TRX-abc123"
   * ```
   */
  async pay(request: PaymentRequest): Promise<PaymentResponse> {
    this.ensureInitialized();

    try {
      // ── Try native module first ──────────────────────────────────────────
      const nativeModule = this.getNativeModule();
      if (nativeModule) {
        const nativeResult = await nativeModule.pay(JSON.stringify(request));
        return JSON.parse(nativeResult) as PaymentResponse;
      }
    } catch (nativeError) {
      console.warn(
        '[EasyPayment] Native pay() failed, falling back to JS.',
        nativeError
      );
    }

    // ── JS Fallback: direct HTTP request ───────────────────────────────────
    return this.payViaHttp(request);
  }

  // ─── Verify Payment ──────────────────────────────────────────────────────

  /**
   * Verify the current status of a payment transaction.
   *
   * @param trxId - The transaction ID returned by `pay()`
   * @returns Verification result with `status`, `amount`, `paidAt`, etc.
   * @throws {InvalidConfigError} If the client has not been initialised
   * @throws {PaymentVerificationError} If the transaction cannot be verified
   * @throws {NetworkError} If a network failure occurs
   *
   * @example
   * ```ts
   * const verification = await EasyPaymentClient.getInstance().verify('EP-TRX-abc123');
   * if (verification.status === 'paid') {
   *   console.log('Payment confirmed!');
   * }
   * ```
   */
  async verify(trxId: string): Promise<PaymentVerification> {
    this.ensureInitialized();

    if (!trxId || typeof trxId !== 'string') {
      throw new PaymentVerificationError(
        'Transaction ID is required for verification.'
      );
    }

    try {
      // ── Try native module first ──────────────────────────────────────────
      const nativeModule = this.getNativeModule();
      if (nativeModule) {
        const nativeResult = await nativeModule.verify(trxId);
        return JSON.parse(nativeResult) as PaymentVerification;
      }
    } catch (nativeError) {
      console.warn(
        '[EasyPayment] Native verify() failed, falling back to JS.',
        nativeError
      );
    }

    // ── JS Fallback ────────────────────────────────────────────────────────
    return this.verifyViaHttp(trxId);
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  /** Ensure `initialize()` has been called before making API requests. */
  private ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new InvalidConfigError(
        'EasyPaymentClient must be initialised before use. Call initialize() first.'
      );
    }
  }

  /**
   * Access the native Turbo Module if it is linked.
   * Returns `null` when running in Expo Go or if the native module is missing.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getNativeModule(): any | null {
    try {
      return NativeModules.EasyPayment || null;
    } catch {
      return null;
    }
  }

  /**
   * Perform the payment creation via HTTP (JS fallback).
   * Used when the native module is unavailable.
   */
  private async payViaHttp(request: PaymentRequest): Promise<PaymentResponse> {
    const baseUrl = this.config!.baseUrl;

    try {
      const response = await fetch(`${baseUrl}/api/pay/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config!.apiKey,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new PaymentCreationError(
          data.message || `Payment creation failed with status ${response.status}`,
          response.status
        );
      }

      return data as PaymentResponse;
    } catch (error) {
      if (error instanceof PaymentCreationError) throw error;
      throw new NetworkError(
        `Network error during payment creation: ${(error as Error).message}`
      );
    }
  }

  /**
   * Perform payment verification via HTTP (JS fallback).
   */
  private async verifyViaHttp(trxId: string): Promise<PaymentVerification> {
    const baseUrl = this.config!.baseUrl;

    try {
      const response = await fetch(`${baseUrl}/api/pay/verify/${encodeURIComponent(trxId)}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.config!.apiKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new PaymentVerificationError(
          data.message || `Verification failed with status ${response.status}`,
          response.status
        );
      }

      return data as PaymentVerification;
    } catch (error) {
      if (error instanceof PaymentVerificationError) throw error;
      throw new NetworkError(
        `Network error during verification: ${(error as Error).message}`
      );
    }
  }

  // ─── Reset (useful for testing / switching accounts) ─────────────────────

  /**
   * Reset the client to its uninitialised state.
   * Useful for switching between sandbox and production, or during tests.
   */
  reset(): void {
    this.config = null;
    this.initialized = false;
  }
}
