import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useThemeColors, useIsDarkMode } from '../src/theme';
import { configureRevenueCat } from '../src/config/revenuecat';
import { useAuthStore } from '../src/store/authStore';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { setupAuthInterceptor } from '../src/api/authInterceptor';

function RootLayoutInner() {
    const colors = useThemeColors();
    const isDark = useIsDarkMode();
    const user = useAuthStore((s) => s.user);
    const restoreSession = useAuthStore((s) => s.restoreSession);
    const sessionExpiredMessage = useAuthStore((s) => s.sessionExpiredMessage);
    const clearSessionExpiredMessage = useAuthStore((s) => s.clearSessionExpiredMessage);
    const refreshCustomerInfo = useSubscriptionStore((s) => s.refreshCustomerInfo);

    // Register the 401 interceptor and attempt to restore an existing session
    useEffect(() => {
        setupAuthInterceptor();
        restoreSession();
    }, []);

    // Show an alert when the session can no longer be refreshed
    useEffect(() => {
        if (!sessionExpiredMessage) return;
        Alert.alert('Session Expired', sessionExpiredMessage);
        clearSessionExpiredMessage();
    }, [sessionExpiredMessage]);

    // Initialize RevenueCat once on mount, then re-identify when the user changes
    useEffect(() => {
        configureRevenueCat(user?.id).then(() => {
            refreshCustomerInfo();
        });
    }, [user?.id]);

    return (
        <View style={s.container}>
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
        <SafeAreaProvider>
            <ThemeProvider>
                <RootLayoutInner />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
    },
});
