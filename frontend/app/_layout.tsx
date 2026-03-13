import { Stack } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <LinearGradient
                colors={[
                    colors.gradientStart,
                    colors.gradientMid1,
                    colors.gradientMid2,
                    colors.gradientEnd,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.gradient}
            >
                <StatusBar style="dark" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: 'transparent' },
                        animation: 'fade',
                    }}
                />
            </LinearGradient>
        </SafeAreaProvider>
    );
}

const s = StyleSheet.create({
    gradient: {
        flex: 1,
        ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
    },
});
