import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Chat from './src/components/Chat';

export default function App() {
  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={['#e8a87c', '#d4a5c4', '#a5b4d4', '#89c4cd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <StatusBar style="dark" />
        <Chat />
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
