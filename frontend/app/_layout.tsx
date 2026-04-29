import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Alert, Image, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from '../src/components/ErrorBoundary';
import OfflineBanner from '../src/components/OfflineBanner';
import { ThemeProvider, useThemeColors, useIsDarkMode } from '../src/theme';
import { billingService } from '../src/services/billing';
import { useAuthStore } from '../src/store/authStore';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { useRecipeStore } from '../src/store/recipeStore';
import { setupAuthInterceptor } from '../src/api/authInterceptor';

// Prevent the splash screen from auto-hiding until we finish restoring the session.
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
    const colors = useThemeColors();
    const isDark = useIsDarkMode();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const restoreSession = useAuthStore((s) => s.restoreSession);
    const sessionExpiredMessage = useAuthStore((s) => s.sessionExpiredMessage);
    const clearSessionExpiredMessage = useAuthStore((s) => s.clearSessionExpiredMessage);
    const refreshCustomerInfo = useSubscriptionStore((s) => s.refreshCustomerInfo);
    const [appReady, setAppReady] = useState(false);

    // Register the 401 interceptor and attempt to restore an existing session
    useEffect(() => {
        setupAuthInterceptor();
        restoreSession().finally(() => setAppReady(true));
    }, []);

    // Hide the splash screen once session restoration is complete
    useEffect(() => {
        if (appReady) {
            SplashScreen.hideAsync();
        }
    }, [appReady]);

    // Handle incoming deep links (e.g. cutthecrap://extract?url=...)
    useEffect(() => {
        if (!appReady) return;

        const handleIncomingUrl = (urlString: string) => {
            const parsed = Linking.parse(urlString);
            if (parsed.hostname === 'extract' && parsed.queryParams?.url) {
                const recipeUrl = String(parsed.queryParams.url);
                useRecipeStore.getState().setUrl(recipeUrl);
                useRecipeStore.getState().submitUrl();
                router.replace('/loading');
            }
        };

        // Check initial URL (cold launch via deep link)
        Linking.getInitialURL().then((url) => {
            if (url) handleIncomingUrl(url);
        });

        // Listen for URLs while the app is open (warm launch)
        const subscription = Linking.addEventListener('url', (event) => {
            handleIncomingUrl(event.url);
        });

        return () => subscription.remove();
    }, [appReady, router]);

    // Show an alert when the session can no longer be refreshed
    useEffect(() => {
        if (!sessionExpiredMessage) return;
        Alert.alert('Session Expired', sessionExpiredMessage);
        clearSessionExpiredMessage();
    }, [sessionExpiredMessage]);

    useEffect(() => {
        if (!billingService.isConfigured()) {
            billingService.configure(user?.id).then(() => {
                refreshCustomerInfo();
            }).catch((err: unknown) => {
                if (__DEV__) console.warn('Failed to configure billing:', err);
            });
        } else if (user?.id) {
            billingService.logIn(user.id).then(() => {
                refreshCustomerInfo();
            }).catch((err: unknown) => {
                if (__DEV__) console.warn('Failed to log in to billing:', err);
            });
        } else {
            billingService.logOut().then(() => {
                refreshCustomerInfo();
            }).catch((err: unknown) => {
                if (__DEV__) console.warn('Failed to log out of billing:', err);
            });
        }
    }, [user?.id]);

    // Handle Stripe Checkout redirect back to the app (?checkout=success).
    // The webhook is the source of truth for entitlements, but it's async —
    // poll a few times so the UI reflects the new Pro status promptly.
    useEffect(() => {
        if (Platform.OS !== 'web' || !appReady) return;
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const status = params.get('checkout');
        if (status !== 'success') return;

        let cancelled = false;
        const poll = async () => {
            for (let i = 0; i < 5 && !cancelled; i++) {
                await refreshCustomerInfo();
                if (useSubscriptionStore.getState().isPro) break;
                await new Promise((r) => setTimeout(r, 1500));
            }
        };
        poll();

        // Strip the query param so refresh/back navigation don't re-trigger.
        params.delete('checkout');
        const cleaned = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, '', cleaned);

        return () => {
            cancelled = true;
        };
    }, [appReady, refreshCustomerInfo]);

    // Don't render anything until the session is restored — the native splash
    // screen stays visible, so returning null prevents a flash of unstyled content.
    if (!appReady) {
        return (
            <View style={s.splashContainer}>
                <Image
                    source={require('../assets/splash.png')}
                    style={s.splashImage}
                    resizeMode="contain"
                />
            </View>
        );
    }

    return (
        <View style={s.container}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <OfflineBanner />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'fade',
                }}
            />
        </View>
    );
}

export default function RootLayout() {
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <ThemeProvider>
                    <RootLayoutInner />
                </ThemeProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
    },
    splashContainer: {
        flex: 1,
        backgroundColor: '#e8a87c',
        alignItems: 'center',
        justifyContent: 'center',
    },
    splashImage: {
        width: 200,
        height: 200,
    },
});
