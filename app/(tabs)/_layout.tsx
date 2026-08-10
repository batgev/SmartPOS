import { Tabs, Redirect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" color={color} size={size} />
          ),
        }}
      />

     

      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="point-of-sale" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales-history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" color={color} size={size} />
          ),
        }}
      />
       
     

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
