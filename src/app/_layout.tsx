import { Observe, ObserveRoot } from 'expo-observe';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

// Keep the splash screen visible while we fetch resources
Observe.configure({
  integrations: { 'expo-router': true },
  dispatchInDebug: true,
   sampleRate: 1,
});

function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}

function ErrorFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text>Something went wrong. Please restart the app.</Text>
    </View>
  );
}

export default function ObservedRootLayout() {
  return (
    <ObserveRoot errorBoundaryFallback={<ErrorFallback />}>
      {/* Wrapped in a full-screen View so ObserveRoot can properly hook the layout */}
      <View style={{ flex: 1 }}>
        <RootLayout />
      </View>
    </ObserveRoot>
  );
}
