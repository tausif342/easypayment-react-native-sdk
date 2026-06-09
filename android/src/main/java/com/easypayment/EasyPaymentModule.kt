/**
 * EasyPaymentModule.kt
 *
 * Native Android module for the Easy Payment React Native SDK.
 * Implements the Turbo Module spec defined in `src/NativeEasyPayment.ts`.
 *
 * Responsibilities:
 *   - Store API key & base URL in memory
 *   - Expose `initialize`, `pay`, and `verify` methods to JS via the bridge
 *   - Perform HTTP requests natively using OkHttp for better performance
 */

package com.easypayment

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

/** Module name registered with React Native's bridge. */
@ReactModule(name = EasyPaymentModule.NAME)
class EasyPaymentModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "EasyPayment"
        private const val DEFAULT_BASE_URL = "https://api.easypayment.io"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }

    // ─── Stored Configuration ─────────────────────────────────────────────

    private var apiKey: String? = null
    private var baseUrl: String = DEFAULT_BASE_URL

    /** Shared OkHttp client with sensible timeouts. */
    private val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    // ─── Module Metadata ──────────────────────────────────────────────────

    override fun getName(): String = NAME

    // ─── Initialize ───────────────────────────────────────────────────────

    /**
     * Initialise the SDK with the merchant's API key and optional base URL.
     *
     * @param apiKey  Merchant API key (starts with "ep_")
     * @param baseUrl Optional override for the API base URL
     */
    @ReactMethod
    fun initialize(apiKey: String, baseUrl: String?, promise: Promise) {
        if (!apiKey.startsWith("ep_")) {
            promise.reject(
                "INVALID_CONFIG",
                "Invalid API key format. Easy Payment API keys start with \"ep_\"."
            )
            return
        }

        this.apiKey = apiKey
        if (!baseUrl.isNullOrBlank()) {
            this.baseUrl = baseUrl
        }

        promise.resolve(true)
    }

    // ─── Pay ──────────────────────────────────────────────────────────────

    /**
     * Create a payment through the gateway.
     *
     * @param payload JSON-encoded PaymentRequest string
     */
    @ReactMethod
    fun pay(payload: String, promise: Promise) {
        val key = this.apiKey
        if (key == null) {
            promise.reject(
                "NOT_INITIALIZED",
                "EasyPayment SDK has not been initialised. Call initialize() first."
            )
            return
        }

        val url = "${baseUrl}/api/pay/create"
        val body = payload.toRequestBody(JSON_MEDIA_TYPE)

        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Content-Type", "application/json")
            .addHeader("X-API-Key", key)
            .build()

        httpClient.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: IOException) {
                promise.reject("NETWORK_ERROR", "Network error: ${e.message}", e)
            }

            override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                val responseBody = response.body?.string()
                if (!response.isSuccessful) {
                    promise.reject(
                        "PAYMENT_ERROR",
                        "Payment creation failed (${response.code}): $responseBody"
                    )
                    return
                }

                if (responseBody == null) {
                    promise.reject("EMPTY_RESPONSE", "Received empty response body.")
                    return
                }

                promise.resolve(responseBody)
            }
        })
    }

    // ─── Verify ───────────────────────────────────────────────────────────

    /**
     * Verify the status of an existing payment transaction.
     *
     * @param trxId Transaction ID returned by `pay()`
     */
    @ReactMethod
    fun verify(trxId: String, promise: Promise) {
        val key = this.apiKey
        if (key == null) {
            promise.reject(
                "NOT_INITIALIZED",
                "EasyPayment SDK has not been initialised. Call initialize() first."
            )
            return
        }

        val encodedTrxId = java.net.URLEncoder.encode(trxId, "UTF-8")
        val url = "${baseUrl}/api/pay/verify/$encodedTrxId"

        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("X-API-Key", key)
            .build()

        httpClient.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: IOException) {
                promise.reject("NETWORK_ERROR", "Network error: ${e.message}", e)
            }

            override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                val responseBody = response.body?.string()
                if (!response.isSuccessful) {
                    promise.reject(
                        "VERIFICATION_ERROR",
                        "Verification failed (${response.code}): $responseBody"
                    )
                    return
                }

                if (responseBody == null) {
                    promise.reject("EMPTY_RESPONSE", "Received empty response body.")
                    return
                }

                promise.resolve(responseBody)
            }
        })
    }
}
