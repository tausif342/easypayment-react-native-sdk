/**
 * PaymentSheet — A bottom-sheet component for collecting payments.
 *
 * Renders a polished payment UI inside a `@gorhom/bottom-sheet`.
 * Handles payment creation, loading states, success/failure feedback,
 * and automatic dismissal on completion.
 *
 * @example
 * ```tsx
 * <PaymentSheet
 *   visible={showSheet}
 *   onDismiss={() => setShowSheet(false)}
 *   onSuccess={(response) => console.log('Paid!', response.trxId)}
 *   onError={(err) => console.error(err)}
 *   payment={{
 *     slug: 'order-123',
 *     amount: 29.99,
 *     method: 'card',
 *     customerName: 'Jane Doe',
 *     customerEmail: 'jane@example.com',
 *     customerPhone: '+8801712345678',
 *   }}
 * />
 * ```
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { PaymentSheetProps, PaymentResponse } from '../types';
import { EasyPaymentClient } from '../EasyPaymentClient';
import { EasyPaymentError } from '../errors';

export function PaymentSheet({
  visible,
  onDismiss,
  onSuccess,
  onError,
  payment,
  title = 'Complete Payment',
  subtitle,
}: PaymentSheetProps) {
  // ─── State ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ─── Refs ──────────────────────────────────────────────────────────────
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useRef(['65%']).current;

  // ─── Handlers ──────────────────────────────────────────────────────────

  /** Render the backdrop behind the sheet. */
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        onPress={onDismiss}
      />
    ),
    [onDismiss]
  );

  /** Initiate the payment via the SDK client. */
  const handlePay = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const client = EasyPaymentClient.getInstance();
      const response: PaymentResponse = await client.pay(payment);

      // Payment succeeded — notify parent and close the sheet.
      onSuccess(response);
      bottomSheetRef.current?.close();
    } catch (error) {
      const message =
        error instanceof EasyPaymentError
          ? error.message
          : 'An unexpected error occurred. Please try again.';

      setErrorMessage(message);
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  }, [payment, onSuccess, onError]);

  /** Cancel and dismiss the sheet. */
  const handleCancel = useCallback(() => {
    setErrorMessage(null);
    onDismiss();
  }, [onDismiss]);

  // ─── Render ────────────────────────────────────────────────────────────

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onDismiss}
      index={0}
    >
      <BottomSheetView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          {/* ── Payment Summary ─────────────────────────────────────────── */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>
                {payment.amount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Method</Text>
              <Text style={styles.summaryValue}>
                {payment.method.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reference</Text>
              <Text style={styles.summaryValue}>{payment.slug}</Text>
            </View>
          </View>

          {/* ── Error Message ───────────────────────────────────────────── */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={handlePay}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Pay Now</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  summary: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  actions: {
    marginTop: 'auto',
    gap: 12,
  },
  payButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
});
