import { ReactNode } from 'react';
import {
  DimensionValue,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  avoidKeyboard?: boolean;
  maxHeight?: DimensionValue;
}

export const BottomSheet = ({
  visible,
  onClose,
  children,
  avoidKeyboard = false,
  maxHeight,
}: BottomSheetProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <Pressable
      style={[styles.overlay, { backgroundColor: colors.overlay }]}
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel="Close"
    >
      <Pressable
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 16) },
          maxHeight !== undefined && { maxHeight },
        ]}
        onPress={() => {}}
      >
        <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />
        {children}
      </Pressable>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
});
