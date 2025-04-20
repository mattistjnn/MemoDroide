import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: "transparent" },
    }}
>
      <Stack.Screen name="login" />
      <Stack.Screen
        name="qr-scan"
        options={{
          title: "Scan QR Code",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
