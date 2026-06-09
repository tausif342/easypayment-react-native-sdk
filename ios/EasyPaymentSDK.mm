/**
 * EasyPaymentSDK.mm
 *
 * Objective-C++ bridge that exposes the Swift `EasyPaymentSDK` class
 * to React Native's bridge. This file is required because React Native's
 * bridge mechanism relies on Objective-C runtime introspection.
 *
 * The macro `RCT_EXPORT_MODULE()` registers the module with the name
 * "EasyPayment", matching the Turbo Module spec in `NativeEasyPayment.ts`.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// Forward-declare the Swift class so the Obj-C++ bridge can reference it.
@interface EasyPaymentSDK : NSObject
@end

// ─── Module Registration ─────────────────────────────────────────────────────

@interface RCT_EXTERN_MODULE(EasyPayment, NSObject)

// ─── Method Exports ──────────────────────────────────────────────────────────

/**
 * initialize(apiKey, baseUrl) → Promise<boolean>
 *
 * Registers the API key and optional base URL with the native SDK.
 */
RCT_EXTERN_METHOD(
    initialize:(NSString *)apiKey
    withBaseUrl:(NSString *)baseUrl
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject
)

/**
 * pay(payload) → Promise<string>
 *
 * Creates a payment. `payload` is a JSON-encoded PaymentRequest.
 * Resolves with a JSON-encoded PaymentResponse string.
 */
RCT_EXTERN_METHOD(
    pay:(NSString *)payload
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject
)

/**
 * verify(trxId) → Promise<string>
 *
 * Verifies a payment by transaction ID.
 * Resolves with a JSON-encoded PaymentVerification string.
 */
RCT_EXTERN_METHOD(
    verify:(NSString *)trxId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject
)

@end
