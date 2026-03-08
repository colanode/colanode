// Custom entry point: polyfill crypto before expo-router loads route modules
import './src/lib/crypto-polyfill';

// Now load expo-router entry
import 'expo-router/entry';
