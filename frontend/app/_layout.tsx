import { useEffect, useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { ThemeProvider, useThemeColors, useIsDarkMode } from '../src/theme';
import { billingService } from '../src/services/billing';
import { useAuthStore } from '../src/store/authStore';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { setupAuthInterceptor } from '../src/api/authInterceptor';

// Prevent the splash screen from auto-hiding until we finish restoring the session.
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
    const colors = useThemeColors();
    const isDark = useIsDarkMode();
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
    const onLayoutReady = useCallback(() => {
        if (appReady) {
            SplashScreen.hideAsync();
        }
    }, [appReady]);

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
                console.warn('Failed to configure billing:', err);
            });
        } else if (user?.id) {
            billingService.logIn(user.id).then(() => {
                refreshCustomerInfo();
            }).catch((err: unknown) => {
                console.warn('Failed to log in to billing:', err);
            });
        } else {
            billingService.logOut().then(() => {
                refreshCustomerInfo();
            }).catch((err: unknown) => {
                console.warn('Failed to log out of billing:', err);
            });
        }
    }, [user?.id]);

    return (
        <View style={s.container} onLayout={onLayoutReady}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
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
});
