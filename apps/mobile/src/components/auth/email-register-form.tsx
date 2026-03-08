import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@colanode/mobile/components/ui/button';
import { TextInput } from '@colanode/mobile/components/ui/text-input';

interface EmailRegisterFormProps {
  onSubmit: (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => void;
  isPending: boolean;
}

export const EmailRegisterForm = ({
  onSubmit,
  isPending,
}: EmailRegisterFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Invalid email address';
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
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoCapitalize="words"
        textContentType="name"
        returnKeyType="next"
      />
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
      <Button title="Register" onPress={handleSubmit} loading={isPending} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
