/**
 * EasyPaymentPackage.kt
 *
 * React Native package that registers the `EasyPaymentModule` with
 * the React Native bridge. This package must be added to the list
 * of packages in `MainApplication.kt` (bare workflow) or referenced
 * by an Expo config plugin.
 *
 * @see EasyPaymentModule
 */

package com.easypayment

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Provides the `EasyPaymentModule` to React Native's module registry.
 *
 * Registration example (bare workflow — `MainApplication.kt`):
 * ```kotlin
 * override fun getPackages(): List<ReactPackage> =
 *     PackageList(this).packages.apply {
 *         // Packages that cannot be autolinked yet can be added manually:
 *         add(EasyPaymentPackage())
 *     }
 * ```
 */
class EasyPaymentPackage : ReactPackage {

    /**
     * Returns the list of native modules provided by this package.
     * Currently only `EasyPaymentModule`.
     */
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(EasyPaymentModule(reactContext))
    }

    /**
     * Returns an empty list — this package does not provide any custom views.
     */
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
