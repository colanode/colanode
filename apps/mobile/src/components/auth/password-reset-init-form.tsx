import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';

interface PasswordResetInitFormProps {
  onSubmit: (values: { email: string }) => void;
  isPending: boolean;
}

export const PasswordResetInitForm = ({
  onSubmit,
  isPending,
}: PasswordResetInitFormProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Invalid email address');
      return;
    }
    setError('');
    onSubmit({ email: trimmed });
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        placeholder="hi@example.com"
        value={email}
        onChangeText={setEmail}
        error={error}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      <Button
        title="Send Reset Code"
        onPress={handleSubmit}
        loading={isPending}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
