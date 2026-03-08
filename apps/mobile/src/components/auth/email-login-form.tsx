import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';

interface EmailLoginFormProps {
  onSubmit: (values: { email: string; password: string }) => void;
  isPending: boolean;
}

export const EmailLoginForm = ({
  onSubmit,
  isPending,
}: EmailLoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ email: email.trim(), password });
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        placeholder="hi@example.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextInput
        label="Password"
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      <Button title="Login" onPress={handleSubmit} loading={isPending} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
