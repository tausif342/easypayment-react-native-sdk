# @easypayment/react-native-sdk

> Official React Native SDK for the **Easy Payment** Gateway — accept card, mobile banking, bank transfer, crypto, and wallet payments in your iOS and Android apps.

[![npm version](https://img.shields.io/npm/v/@easypayment/react-native-sdk.svg)](https://www.npmjs.com/package/@easypayment/react-native-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## Features

- 🚀 **Zero-config JS fallback** — works in Expo Go without native code
- 📱 **Native modules** — iOS (Swift) & Android (Kotlin) for production builds
- 🎨 **PaymentSheet** — ready-made bottom sheet UI component
- 🪝 **useEasyPayment hook** — declarative React hook with loading/error state
- 🔒 **Type-safe** — full TypeScript support with exported interfaces
- ⚡ **Turbo Module ready** — supports React Native's New Architecture
- 🌐 **Offline-first errors** — distinguish network, config, and gateway errors

---

## Installation

### Expo (Managed Workflow)

```bash
npx expo install @easypayment/react-native-sdk @gorhom/bottom-sheet
```

The SDK works out-of-the-box in Expo Go using the JavaScript HTTP fallback. For production builds with native modules, create a [development build](https://docs.expo.dev/develop/development-builds/introduction/) or use EAS Build with a config plugin.

### Bare Workflow (React Native CLI)

```bash
# Install the SDK and the bottom sheet dependency
npm install @easypayment/react-native-sdk @gorhom/bottom-sheet

# iOS — install CocoaPods
cd ios && pod install && cd ..
```

#### Android — Register the module (if not autolinked)

In `android/app/src/main/java/.../MainApplication.kt`:

```kotlin
import com.easypayment.EasyPaymentPackage

override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(EasyPaymentPackage())
    }
```

#### iOS — No extra steps

The Swift module and Objective-C++ bridge are automatically registered via CocoaPods.

---

## Quick Start

### 1. Initialize the SDK

Initialize once when your app starts (e.g. in `App.tsx` or a root component):

```tsx
import { EasyPaymentClient } from '@easypayment/react-native-sdk';

// In an async function or useEffect:
await EasyPaymentClient.getInstance().initialize({
  apiKey: 'ep_live_your_api_key',
  baseUrl: 'https://api.easypayment.io', // optional, defaults to production
});
```

### 2. Create a Payment

```tsx
import { EasyPaymentClient } from '@easypayment/react-native-sdk';

const client = EasyPaymentClient.getInstance();

const result = await client.pay({
  slug: 'order-12345',         // Your unique order reference
  amount: 49.99,               // Payment amount
  method: 'card',              // 'card' | 'mobile_banking' | 'bank_transfer' | 'crypto' | 'wallet'
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '+8801712345678',
});

console.log(result.trxId);      // "EP-TRX-abc123"
console.log(result.status);     // "pending"
console.log(result.checkoutUrl); // URL to redirect customer (if applicable)
```

### 3. Verify a Payment

```tsx
const verification = await client.verify('EP-TRX-abc123');

console.log(verification.status); // "paid" | "pending" | "failed"
console.log(verification.paidAt); // "2024-06-15T10:30:00Z"
```

---

## Usage with `useEasyPayment` Hook

The hook manages loading, error, and result state for you:

```tsx
import { useEasyPayment } from '@easypayment/react-native-sdk';

function CheckoutScreen() {
  const { initialize, pay, verify, loading, error, paymentResult } = useEasyPayment();

  useEffect(() => {
    initialize({ apiKey: 'ep_live_your_api_key' });
  }, []);

  const handlePay = async () => {
    const result = await pay({
      slug: 'order-12345',
      amount: 49.99,
      method: 'card',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '+8801712345678',
    });

    if (result) {
      // Navigate to success screen or verify
      const verification = await verify(result.trxId);
    }
  };

  return (
    <View>
      <Button onPress={handlePay} disabled={loading} title="Pay $49.99" />
      {error && <Text>Error: {error.message}</Text>}
    </View>
  );
}
```

---

## Usage with `<PaymentSheet />`

The payment sheet provides a pre-built bottom sheet UI:

```tsx
import { useState } from 'react';
import { PaymentSheet } from '@easypayment/react-native-sdk';
import type { PaymentResponse } from '@easypayment/react-native-sdk';

function CheckoutScreen() {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <Button title="Pay Now" onPress={() => setShowSheet(true)} />

      <PaymentSheet
        visible={showSheet}
        onDismiss={() => setShowSheet(false)}
        onSuccess={(response: PaymentResponse) => {
          console.log('Payment successful!', response.trxId);
          setShowSheet(false);
        }}
        onError={(error) => {
          console.error('Payment failed:', error.message);
        }}
        payment={{
          slug: 'order-12345',
          amount: 49.99,
          method: 'card',
          customerName: 'Jane Doe',
          customerEmail: 'jane@example.com',
          customerPhone: '+8801712345678',
        }}
        title="Complete Payment"
        subtitle="You're about to pay $49.99"
      />
    </>
  );
}
```

---

## API Reference

### `EasyPaymentClient`

| Method | Description |
|--------|-------------|
| `getInstance()` | Returns the singleton client instance |
| `initialize(config)` | Initialise the SDK with your API key |
| `pay(request)` | Create a payment (returns `Promise<PaymentResponse>`) |
| `verify(trxId)` | Verify a payment (returns `Promise<PaymentVerification>`) |
| `reset()` | Reset the client to uninitialised state |

### `useEasyPayment()` Hook

| Property | Type | Description |
|----------|------|-------------|
| `initialize` | `(config) => Promise<void>` | Initialise the SDK |
| `pay` | `(request) => Promise<PaymentResponse \| null>` | Create a payment |
| `verify` | `(trxId) => Promise<PaymentVerification \| null>` | Verify a payment |
| `loading` | `boolean` | Whether an operation is in progress |
| `error` | `EasyPaymentError \| null` | Last error |
| `paymentResult` | `PaymentResponse \| null` | Last payment result |
| `verificationResult` | `PaymentVerification \| null` | Last verification result |
| `clearError` | `() => void` | Clear the current error |
| `reset` | `() => void` | Reset all state |

### `<PaymentSheet />` Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | ✅ | Show/hide the bottom sheet |
| `onDismiss` | `() => void` | ✅ | Called when user dismisses |
| `onSuccess` | `(response) => void` | ✅ | Called on successful payment |
| `onError` | `(error) => void` | ❌ | Called on payment error |
| `payment` | `PaymentRequest` | ✅ | Payment details |
| `title` | `string` | ❌ | Custom sheet title |
| `subtitle` | `string` | ❌ | Custom sheet subtitle |

---

## Types

```typescript
interface PaymentRequest {
  slug: string;
  amount: number;
  method: 'card' | 'mobile_banking' | 'bank_transfer' | 'crypto' | 'wallet';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface PaymentResponse {
  trxId: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  checkoutUrl?: string;
  slug: string;
  amount: number;
  currency?: string;
  createdAt: string;
}

interface PaymentVerification {
  trxId: string;
  status: PaymentStatus;
  amount: number;
  currency?: string;
  paidAt: string | null;
  method?: PaymentMethod;
  customer?: CustomerInfo;
}
```

---

## Error Handling

All SDK errors extend `EasyPaymentError`:

```typescript
import {
  EasyPaymentError,
  PaymentCreationError,
  PaymentVerificationError,
  PaymentRefundError,
  NetworkError,
  InvalidConfigError,
} from '@easypayment/react-native-sdk';

try {
  await client.pay(request);
} catch (error) {
  if (error instanceof NetworkError) {
    // Show "check your internet" message
  } else if (error instanceof InvalidConfigError) {
    // SDK not initialized or bad API key
  } else if (error instanceof PaymentCreationError) {
    // Gateway rejected the payment
    console.log(error.statusCode); // e.g. 400, 402, 422
  }
}
```

---

## Sandbox Testing

Use the sandbox base URL during development:

```tsx
await EasyPaymentClient.getInstance().initialize({
  apiKey: 'ep_test_your_sandbox_key',
  baseUrl: 'https://sandbox-api.easypayment.io',
});
```

---

## Requirements

| Dependency | Minimum Version |
|------------|----------------|
| React Native | ≥ 0.71 |
| React | ≥ 18.0 |
| @gorhom/bottom-sheet | ≥ 4.0 |
| TypeScript | ≥ 5.0 (recommended) |

---

## Migration Guide

### v0.x → v1.0

- `EasyPaymentClient` is now a singleton — use `getInstance()` instead of `new EasyPaymentClient()`
- All errors now extend `EasyPaymentError` — update catch blocks accordingly
- `PaymentSheet` requires `@gorhom/bottom-sheet` ≥ 4.0

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

- 📧 Email: dev@easypayment.io
- 📖 Docs: https://docs.easypayment.io
- 🐛 Issues: https://github.com/easypayment/react-native-sdk/issues

---

## License

MIT © [Easy Payment](./LICENSE)
