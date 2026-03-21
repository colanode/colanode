import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { formatCountdownTime } from '@colanode/mobile/lib/format-utils';

interface PasswordResetCompleteFormProps {
  onSubmit: (values: {
    otp: string;
    password: string;
    confirmPassword: string;
  }) => void;
  isPending: boolean;
  expiresAt: string;
}

export const PasswordResetCompleteForm = ({
  onSubmit,
  isPending,
  expiresAt,
}: PasswordResetCompleteFormProps) => {
  const { colors } = useTheme();
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const expires = new Date(expiresAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!otp.trim()) {
      newErrors.otp = 'Verification code is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Must contain an uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Must contain a lowercase letter';
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = 'Must contain a special character';
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ otp: otp.trim(), password, confirmPassword });
  };


  return (
    <View style={styles.container}>
      <TextInput
        label="Verification Code"
        placeholder="Enter the code from your email"
        value={otp}
        onChangeText={setOtp}
        error={errors.otp}
        autoCapitalize="none"
        keyboardType="number-pad"
        returnKeyType="next"
      />
      <TextInput
        label="New Password"
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        textContentType="newPassword"
        returnKeyType="next"
      />
      <TextInput
        label="Confirm Password"
        placeholder="********"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        secureTextEntry
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      {secondsLeft > 0 ? (
        <Text style={[styles.timer, { color: colors.textSecondary }]}>
          Code expires in {formatCountdownTime(secondsLeft)}
        </Text>
      ) : (
        <Text style={[styles.expired, { color: colors.error }]}>
          Code has expired
        </Text>
      )}
      <Button
        title="Reset Password"
        onPress={handleSubmit}
        loading={isPending}
        disabled={secondsLeft === 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  timer: {
    fontSize: 13,
    textAlign: 'center',
  },
  expired: {
    fontSize: 13,
    textAlign: 'center',
  },
});
