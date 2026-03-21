import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { formatCountdownTime } from '@colanode/mobile/lib/format-utils';

interface EmailVerifyFormProps {
  onSubmit: (values: { otp: string }) => void;
  isPending: boolean;
  expiresAt: string;
}

export const EmailVerifyForm = ({
  onSubmit,
  isPending,
  expiresAt,
}: EmailVerifyFormProps) => {
  const { colors } = useTheme();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
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

  const handleSubmit = () => {
    if (!otp.trim()) {
      setError('Verification code is required');
      return;
    }
    setError('');
    onSubmit({ otp: otp.trim() });
  };


  return (
    <View style={styles.container}>
      <TextInput
        label="Verification Code"
        placeholder="Enter the code from your email"
        value={otp}
        onChangeText={setOtp}
        error={error}
        autoCapitalize="none"
        keyboardType="number-pad"
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
        title="Verify"
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
