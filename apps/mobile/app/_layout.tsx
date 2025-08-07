import { Stack } from "expo-router/stack";
import './globals.css'; // Import global styles

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
