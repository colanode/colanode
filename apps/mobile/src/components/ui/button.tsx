import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { ThemeColors } from '@colanode/mobile/lib/colors';
import { useTheme } from '@colanode/mobile/contexts/theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'link';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: ViewStyle;
}

const getVariantStyles = (
  variant: ButtonVariant,
  colors: ThemeColors
): ViewStyle => {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.text };
    case 'secondary':
      return {
        backgroundColor: colors.surfaceHover,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      };
    case 'destructive':
      return { backgroundColor: colors.error };
    case 'link':
      return { backgroundColor: 'transparent' };
  }
};

const getVariantTextColor = (
  variant: ButtonVariant,
  colors: ThemeColors
): string => {
  switch (variant) {
    case 'primary':
      return colors.background;
    case 'secondary':
      return colors.text;
    case 'destructive':
      return colors.text;
    case 'link':
      return colors.textSecondary;
  }
};

const getVariantFontWeight = (
  variant: ButtonVariant
): '400' | '500' | '600' => {
  switch (variant) {
    case 'primary':
      return '600';
    case 'secondary':
      return '500';
    case 'destructive':
      return '600';
    case 'link':
      return '400';
  }
};

export const Button = ({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const variantStyle = getVariantStyles(variant, colors);
  const textColor = getVariantTextColor(variant, colors);
  const fontWeight = getVariantFontWeight(variant);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.background : colors.text}
        />
      ) : (
        <Text style={[styles.text, { color: textColor, fontWeight }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
  },
});
