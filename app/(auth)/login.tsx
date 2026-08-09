import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

import AppButton from "../../components/buttons/AppButton";
import AppInput from "../../components/forms/AppInput";
import userService from "../../services/user.service";

export default function LoginScreen() {
  const { login } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      console.log("USER SERVICE:", userService);
      console.log("USER SERVICE LOGIN:", userService?.login);
      const user = await userService.login(username, password);

      if (!user) {
        Alert.alert("Login Failed", "Invalid username or password.");
        return;
      }

      await login({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      });

      router.replace("/(tabs)/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      Alert.alert("Login Error", "Something went wrong while signing in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SmartPOS</Text>

        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        <AppInput
          label="Username"
          placeholder="Enter username"
          value={username}
          onChangeText={setUsername}
        />

        <View style={styles.passwordContainer}>
          <AppInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={hidePassword}
          />

          <TouchableOpacity
            style={styles.eye}
            onPress={() => setHidePassword(!hidePassword)}
          >
            <Ionicons
              name={hidePassword ? "eye-off" : "eye"}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        </View>

        <AppButton title="LOGIN" loading={loading} onPress={handleLogin} />
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 50,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1E88E5",
    marginTop: 15,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },

  form: {
    width: "100%",
  },

  passwordContainer: {
    position: "relative",
  },

  eye: {
    position: "absolute",
    right: 15,
    top: 47,
  },

  version: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
  },
});
