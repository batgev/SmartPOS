import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
} from "react-native";

import { runMigrations } from "../database/db";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function startApp() {
      try {
        await runMigrations();
      } catch (error) {
        console.error(
          "Database initialization failed:",
          error
        );
      } finally {
        setReady(true);
      }
    }

    startApp();
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </PaperProvider>
  );
}