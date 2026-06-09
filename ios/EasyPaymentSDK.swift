/**
 * EasyPaymentSDK.swift
 *
 * Native iOS module for the Easy Payment React Native SDK.
 * Implements the Turbo Module spec defined in `src/NativeEasyPayment.ts`.
 *
 * Responsibilities:
 *   - Store API key & base URL in memory
 *   - Expose `initialize`, `pay`, and `verify` methods to JS
 *   - Perform HTTP requests natively for better performance & security
 */

import Foundation

// MARK: - EasyPaymentSDK

@objc(EasyPayment)
class EasyPaymentSDK: NSObject {

    // ─── Stored Configuration ─────────────────────────────────────────────

    private var apiKey: String?
    private var baseUrl: String = "https://api.easypayment.io"

    // MARK: - Initialize

    /// Initialise the SDK with the merchant's API key and optional base URL.
    /// Called from JavaScript via the bridge.
    ///
    /// - Parameters:
    ///   - apiKey:  Merchant API key (starts with "ep_")
    ///   - baseUrl: Optional override for the API base URL
    ///   - resolve: Promise resolver — returns `true` on success
    ///   - reject:  Promise rejector — returns an error on failure
    @objc(initialize:withBaseUrl:resolver:rejecter:)
    func initialize(
        _ apiKey: String,
        withBaseUrl baseUrl: String?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard apiKey.hasPrefix("ep_") else {
            reject(
                "INVALID_CONFIG",
                "Invalid API key format. Easy Payment API keys start with \"ep_\".",
                nil
            )
            return
        }

        self.apiKey = apiKey
        if let url = baseUrl, !url.isEmpty {
            self.baseUrl = url
        }

        resolve(true)
    }

    // MARK: - Pay

    /// Create a payment through the gateway.
    /// The `payload` is a JSON-encoded `PaymentRequest` object.
    ///
    /// - Parameters:
    ///   - payload: JSON string matching the PaymentRequest schema
    ///   - resolve: Promise resolver — returns a JSON-encoded PaymentResponse
    ///   - reject:  Promise rejector
    @objc(pay:resolver:rejecter:)
    func pay(
        _ payload: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let apiKey = self.apiKey else {
            reject("NOT_INITIALIZED", "EasyPayment SDK has not been initialised. Call initialize() first.", nil)
            return
        }

        guard let url = URL(string: "\(baseUrl)/api/pay/create") else {
            reject("INVALID_URL", "Invalid base URL configured.", nil)
            return
        }

        // Build the HTTP request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.httpBody = payload.data(using: .utf8)

        // Execute request
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                reject("NETWORK_ERROR", "Network error: \(error.localizedDescription)", error)
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                reject("INVALID_RESPONSE", "Received non-HTTP response.", nil)
                return
            }

            guard let data = data, let body = String(data: data, encoding: .utf8) else {
                reject("EMPTY_RESPONSE", "Received empty response body.", nil)
                return
            }

            if httpResponse.statusCode >= 400 {
                reject("PAYMENT_ERROR", "Payment creation failed: \(body)", nil)
                return
            }

            resolve(body)
        }

        task.resume()
    }

    // MARK: - Verify

    /// Verify the status of an existing payment transaction.
    ///
    /// - Parameters:
    ///   - trxId:  Transaction ID returned by `pay()`
    ///   - resolve: Promise resolver — returns a JSON-encoded PaymentVerification
    ///   - reject:  Promise rejector
    @objc(verify:resolver:rejecter:)
    func verify(
        _ trxId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let apiKey = self.apiKey else {
            reject("NOT_INITIALIZED", "EasyPayment SDK has not been initialised. Call initialize() first.", nil)
            return
        }

        guard let encodedTrxId = trxId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed),
              let url = URL(string: "\(baseUrl)/api/pay/verify/\(encodedTrxId)") else {
            reject("INVALID_URL", "Could not construct verification URL.", nil)
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                reject("NETWORK_ERROR", "Network error: \(error.localizedDescription)", error)
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                reject("INVALID_RESPONSE", "Received non-HTTP response.", nil)
                return
            }

            guard let data = data, let body = String(data: data, encoding: .utf8) else {
                reject("EMPTY_RESPONSE", "Received empty response body.", nil)
                return
            }

            if httpResponse.statusCode >= 400 {
                reject("VERIFICATION_ERROR", "Verification failed: \(body)", nil)
                return
            }

            resolve(body)
        }

        task.resume()
    }

    // MARK: - React Native Bridge Constants

    /// Tells React Native that this module initializes on the main queue.
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
