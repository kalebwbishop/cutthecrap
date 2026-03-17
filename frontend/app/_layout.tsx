import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useThemeColors, useIsDarkMode } from '../src/theme';

function RootLayoutInner() {
    const colors = useThemeColors();
    const isDark = useIsDarkMode();

    return (
        <View style={[s.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
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
