import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import LoadingView from '@/components/LoadingView';
import { useRecipeStore, LOADING_MESSAGES } from '@/store/recipeStore';

/**
 * Full-screen loading experience while the app scrapes & processes.
 * Auto-navigates to /result when loading completes.
 */
export default function LoadingScreen() {
  const router = useRouter();
  const { isLoading, loadingMessageIndex, result, error, cycleLoadingMessage } =
    useRecipeStore();
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Start the progress bar animation
  useEffect(() => {
    progressAnim.setValue(0);
    const progress = Animated.timing(progressAnim, {
      toValue: 0.9,
      duration: 20_000,
      useNativeDriver: false,
    });
    progress.start();
    return () => progress.stop();
  }, [progressAnim]);

  // Cycle loading messages every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(cycleLoadingMessage, 2500);
    return () => clearInterval(interval);
  }, [cycleLoadingMessage]);

  // Navigate to result when loading completes
  useEffect(() => {
    if (!isLoading && (result || error)) {
      router.replace('/result');
    }
  }, [isLoading, result, error, router]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <LoadingView
        message={LOADING_MESSAGES[loadingMessageIndex]}
        progress={progressAnim}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
