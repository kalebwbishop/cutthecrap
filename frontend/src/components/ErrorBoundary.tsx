import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches unhandled JS errors
 * and displays a recovery UI instead of crashing the app.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={s.container}>
        <Text style={s.emoji}>😵</Text>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.message}>
          The app ran into an unexpected error. Try reloading to get back on track.
        </Text>
        {__DEV__ && this.state.error && (
          <Text style={s.errorDetail}>{this.state.error.message}</Text>
        )}
        <TouchableOpacity style={s.button} onPress={this.handleRetry} activeOpacity={0.7} accessibilityLabel="Try again" accessibilityRole="button">
          <Text style={s.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.6)',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 360,
  },
  errorDetail: {
    fontSize: 13,
    color: '#ff6b6b',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 360,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    backgroundColor: '#2d2d2d',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
