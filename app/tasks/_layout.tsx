import React from "react";
import { Stack } from "expo-router";

export default function TasksLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Mes Tâches" }} />
      <Stack.Screen name="create" options={{ title: "Créer une Tâche" }} />
    </Stack>
  );
}
