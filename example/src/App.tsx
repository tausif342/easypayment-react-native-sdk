/**
 * Example App — React Native + Easy Payment SDK
 *
 * This minimal example demonstrates:
 *   1. Initialising the Easy Payment SDK
 *   2. Creating a payment using the `useEasyPayment` hook
 *   3. Displaying a `PaymentSheet` bottom sheet
 *   4. Verifying a payment after it is created
 *
 * Copy this file into your project's `App.tsx` to get started quickly.
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import {
  EasyPaymentClient,
  PaymentSheet,
  useEasyPayment,
} from '@easypayment/react-native-sdk';
import type { PaymentRequest, PaymentResponse } from '@easypayment/react-native-sdk';

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Replace these values with your actual Easy Payment credentials.
 * Use a sandbox API key for testing.
 */
const EASYPAYMENT_API_KEY = 'ep_test_your_api_key_here';
const EASYPAYMENT_BASE_URL = 'https://sandbox-api.easypayment.io';

// ─── Sample Payment ───────────────────────────────────────────────────────────

const SAMPLE_PAYMENT: PaymentRequest = {
  slug: 'order-' + Date.now(),
  amount: 49.99,
  method: 'card',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '+8801712345678',
};

// ─── App Component ────────────────────────────────────────────────────────────

export default function App() {
  const [showSheet, setShowSheet] = useState(false);
  const [lastTrxId, setLastTrxId] = useState<string | null>(null);

  const { initialize, pay, verify, loading, error, paymentResult, verificationResult, clearError } =
    useEasyPayment();

  // ─── Initialize SDK on mount ──────────────────────────────────────────────

  useEffect(() => {
    initialize({
      apiKey: EASYPAYMENT_API_KEY,
      baseUrl: EASYPAYMENT_BASE_URL,
    });
  }, [initialize]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /** Open the payment sheet. */
  const handleOpenSheet = () => {
    clearError();
    setShowSheet(true);
  };

  /** Payment succeeded. */
  const handleSuccess = (response: PaymentResponse) => {
    setShowSheet(false);
    setLastTrxId(response.trxId);
    Alert.alert('Payment Successful ✅', `Transaction ID: ${response.trxId}`);
  };

  /** Verify the last payment. */
  const handleVerify = async () => {
    if (!lastTrxId) {
      Alert.alert('No Transaction', 'Create a payment first.');
      return;
    }
    const result = await verify(lastTrxId);
    if (result) {
      Alert.alert('Verification Result', `Status: ${result.status}\nAmount: ${result.amount}`);
    }
  };

  /** Direct pay (without the sheet). */
  const handleDirectPay = async () => {
    const result = await pay(SAMPLE_PAYMENT);
    if (result) {
      setLastTrxId(result.trxId);
      Alert.alert('Payment Successful ✅', `Transaction ID: ${result.trxId}`);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Easy Payment SDK</Text>
          <Text style={styles.headerSubtitle}>React Native Example</Text>
        </View>

        {/* ── Status Card ────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SDK Status</Text>
          <Text style={styles.cardText}>
            {loading ? '⏳ Processing...' : '✅ Ready'}
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>❌ {error.message}</Text>
            </View>
          )}

          {paymentResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                Last Payment: {paymentResult.trxId} ({paymentResult.status})
              </Text>
            </View>
          )}

          {verificationResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                Verified: {verificationResult.status} — {verificationResult.amount}
              </Text>
            </View>
          )}
        </View>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleOpenSheet}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Open Payment Sheet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleDirectPay}
          disabled={loading}
        >
          <Text style={styles.buttonTextDark}>Direct Pay (No Sheet)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handleVerify}
          disabled={loading || !lastTrxId}
        >
          <Text style={styles.buttonTextDark}>
            {lastTrxId ? `Verify ${lastTrxId}` : 'No Transaction to Verify'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Payment Bottom Sheet ─────────────────────────────────────────── */}
      <PaymentSheet
        visible={showSheet}
        onDismiss={() => setShowSheet(false)}
        onSuccess={handleSuccess}
        onError={(err) => Alert.alert('Payment Error', err.message)}
        payment={SAMPLE_PAYMENT}
        title="Complete Your Order"
        subtitle="You're about to pay $49.99"
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#374151',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  resultBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  resultText: {
    color: '#166534',
    fontSize: 13,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextDark: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
