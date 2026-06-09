/**
 * Turbo Module specification for the Easy Payment native module.
 *
 * This file defines the interface that the native iOS (Swift/Obj-C++) and
 * Android (Kotlin) modules must implement. When the new architecture is
 * enabled, React Native codegen will use this spec to generate boilerplate.
 *
 * @see https://reactnative.dev/docs/the-new-architecture/pillars-turbo-modules
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Native methods that the iOS and Android modules expose to JavaScript.
 */
export interface Spec extends TurboModule {
  /**
   * Initialise the SDK with API credentials.
   *
   * @param apiKey  - Merchant API key
   * @param baseUrl - Optional base URL override (for sandbox / custom regions)
   */
  initialize(apiKey: string, baseUrl?: string): Promise<boolean>;

  /**
   * Launch the native payment sheet / activity.
   *
   * @param payload - JSON-serialised PaymentRequest
   * @returns JSON-serialised PaymentResponse
   */
  pay(payload: string): Promise<string>;

  /**
   * Verify a transaction by its ID.
   *
   * @param trxId - Transaction identifier returned after payment creation
   * @returns JSON-serialised PaymentVerification
   */
  verify(trxId: string): Promise<string>;
}

/**
 * Export the native module via the TurboModuleRegistry so it can be accessed
 * from JavaScript through `NativeEasyPayment`.
 */
export const NativeEasyPayment = TurboModuleRegistry.getEnforcing<Spec>(
  'EasyPayment'
);
