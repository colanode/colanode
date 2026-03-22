import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@colanode/mobile/contexts/theme';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (text: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);

  const show = useCallback((text: string, variant: ToastVariant = 'error') => {
    const id = ++nextId.current;
    setToast({ id, text, variant });
  }, []);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <ToastBanner
          key={toast.id}
          text={toast.text}
          variant={toast.variant}
          onDismiss={dismiss}
        />
      )}
    </ToastContext.Provider>
  );
};

interface ToastBannerProps {
  text: string;
  variant: ToastVariant;
  onDismiss: () => void;
}

const ToastBanner = ({ text, variant, onDismiss }: ToastBannerProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, 3000);

    return () => clearTimeout(timer);
  }, [translateY, onDismiss]);

  const backgroundColor =
    variant === 'error'
      ? colors.error
      : variant === 'success'
        ? colors.success
        : colors.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        style={[styles.banner, { backgroundColor }]}
        onPress={onDismiss}
      >
        <Text style={styles.text} numberOfLines={2}>
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
