import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import userService, { User } from "../../services/user.service";
import businessSettingsService, {
  BusinessSettings,
} from "../../services/business_settings.service";
export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [showAddUser, setShowAddUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [role, setRole] = useState("cashier");

  const [saving, setSaving] = useState(false);
const [businessSettings, setBusinessSettings] =
  useState<BusinessSettings | null>(null);

const [showBusinessSettings, setShowBusinessSettings] =
  useState(false);

const [businessName, setBusinessName] = useState("");
const [businessAddress, setBusinessAddress] = useState("");
const [businessPhone, setBusinessPhone] = useState("");
const [businessEmail, setBusinessEmail] = useState("");
const [businessCurrency, setBusinessCurrency] = useState("GH₵");
const [receiptFooter, setReceiptFooter] = useState("");

const [savingBusinessSettings, setSavingBusinessSettings] =
  useState(false);
  const loadBusinessSettings = async () => {
  try {
    const data =
      await businessSettingsService.getSettings();

    setBusinessSettings(data);

    setBusinessName(data.businessName);
    setBusinessAddress(data.address);
    setBusinessPhone(data.phone);
    setBusinessEmail(data.email);
    setBusinessCurrency(data.currency);
    setReceiptFooter(data.receiptFooter);
  } catch (error) {
    console.error(
      "Failed to load business settings:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to load business settings."
    );
  }
};
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      const data = await userService.getUsers();

      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);

      Alert.alert("Error", "Unable to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

 useFocusEffect(
  useCallback(() => {
    loadUsers();

    if (user?.role === "admin") {
      loadBusinessSettings();
    }
  }, [user?.role]),
);
  const resetForm = () => {
    const resetForm = () => {
      setFullName("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setRole("cashier");
    };
  };

  const handleAddUser = async () => {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }
    try {
      setSaving(true);

      await userService.createUser({
        fullName,
        username,
        password,
        role,
      });

      Alert.alert("Success", "User created successfully.");

      resetForm();
      setShowAddUser(false);

      await loadUsers();
    } catch (error) {
      console.error("Failed to create user:", error);

      const message =
        error instanceof Error ? error.message : "Unable to create user.";

      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Validation", "Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Validation", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Validation", "New password must be at least 6 characters.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "No logged-in user found.");
      return;
    }

    try {
      setChangingPassword(true);

      await userService.changePassword(user.id, currentPassword, newPassword);

      Alert.alert("Success", "Your password has been changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setShowChangePassword(false);
    } catch (error) {
      console.error("Failed to change password:", error);

      const message =
        error instanceof Error ? error.message : "Unable to change password.";

      Alert.alert("Error", message);
    } finally {
      setChangingPassword(false);
    }
  };
  const handleDeleteUser = (selectedUser: User) => {
    if (!user) {
      return;
    }

    if (selectedUser.id === user.id) {
      Alert.alert("Not Allowed", "You cannot remove your own account.");
      return;
    }

    Alert.alert(
      "Remove User",
      `Are you sure you want to remove ${selectedUser.fullName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.deleteUser(selectedUser.id, user.id);

              Alert.alert("Success", "User removed successfully.");

              await loadUsers();
            } catch (error) {
              console.error("Failed to delete user:", error);

              const message =
                error instanceof Error
                  ? error.message
                  : "Unable to remove user.";

              Alert.alert("Error", message);
            }
          },
        },
      ],
    );
  };
  const handleSaveBusinessSettings = async () => {
  if (user?.role !== "admin") {
    Alert.alert(
      "Not Allowed",
      "Only administrators can change business settings."
    );
    return;
  }

  if (!businessName.trim()) {
    Alert.alert(
      "Validation",
      "Business name is required."
    );
    return;
  }

  try {
    setSavingBusinessSettings(true);

    await businessSettingsService.updateSettings({
      businessName,
      address: businessAddress,
      phone: businessPhone,
      email: businessEmail,
      currency: businessCurrency,
      receiptFooter,
    });

    const updated =
      await businessSettingsService.getSettings();

    setBusinessSettings(updated);

    setBusinessName(updated.businessName);
    setBusinessAddress(updated.address);
    setBusinessPhone(updated.phone);
    setBusinessEmail(updated.email);
    setBusinessCurrency(updated.currency);
    setReceiptFooter(updated.receiptFooter);

    setShowBusinessSettings(false);

    Alert.alert(
      "Success",
      "Business settings saved successfully."
    );
  } catch (error) {
    console.error(
      "Failed to save business settings:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to save business settings.";

    Alert.alert("Error", message);
  } finally {
    setSavingBusinessSettings(false);
  }
};
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout error:", error);

            Alert.alert("Logout Failed", "Unable to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* Current User */}

      <View style={styles.userCard}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="person" size={32} color="#1E88E5" />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.name}>{user?.fullName}</Text>

          <Text style={styles.username}>@{user?.username}</Text>

          <Text style={styles.role}>{user?.role}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={() => setShowChangePassword(true)}
      >
        <MaterialIcons name="lock-outline" size={22} color="#1E88E5" />

        <Text style={styles.changePasswordText}>Change Password</Text>
      </TouchableOpacity>
      {/* User Management */}

      {user?.role === "admin" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Management</Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddUser(true)}
            >
              <MaterialIcons name="person-add" size={20} color="#FFFFFF" />

              <Text style={styles.addButtonText}>Add User</Text>
            </TouchableOpacity>
          </View>

          {loadingUsers ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : (
            users.map((item) => (
              <View key={item.id} style={styles.userRow}>
                <View style={styles.userRowIcon}>
                  <MaterialIcons name="person" size={22} color="#1E88E5" />
                </View>

                <View style={styles.userRowInfo}>
                  <Text style={styles.userRowName}>{item.fullName}</Text>

                  <Text style={styles.userRowUsername}>@{item.username}</Text>
                </View>

                <View style={styles.userRowActions}>
                  <Text style={styles.userRowRole}>{item.role}</Text>

                  {item.id !== user?.id && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteUser(item)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={22}
                        color="#D32F2F"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}
     
     
       <TouchableOpacity
        style={styles.settingItem}
        onPress={() => router.push("/printer")}
      >
        <View style={styles.settingIcon}>
          <MaterialIcons name="print" size={24} color="#1E88E5" />
        </View>

        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Printer</Text>

          <Text style={styles.settingDescription}>
            Connect and manage your receipt printer
          </Text>
        </View>

        <MaterialIcons name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>
      {/* Logout */}
      {user?.role === "admin" && (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={() => setShowBusinessSettings(true)}
  >
    <View style={styles.settingIcon}>
      <MaterialIcons
        name="business"
        size={24}
        color="#1E88E5"
      />
    </View>

    <View style={styles.settingInfo}>
      <Text style={styles.settingTitle}>
        Business Settings
      </Text>

      <Text style={styles.settingDescription}>
        Manage business information printed on receipts
      </Text>
    </View>

    <MaterialIcons
      name="chevron-right"
      size={24}
      color="#999"
    />
  </TouchableOpacity>
)}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={22} color="#D32F2F" />

        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <Text style={styles.version}>SmartPOS Version 1.0.0</Text>
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>

              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <MaterialIcons name="close" size={26} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Current Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <Text style={styles.label}>New Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Confirm New Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>CHANGE PASSWORD</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Add User Modal */}

      <Modal
        visible={showAddUser}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddUser(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add User</Text>

              <TouchableOpacity onPress={() => setShowAddUser(false)}>
                <MaterialIcons name="close" size={26} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Full Name</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Username</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text style={styles.label}>Confirm Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <Text style={styles.label}>Role</Text>

            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "cashier" && styles.selectedRole,
                ]}
                onPress={() => setRole("cashier")}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === "cashier" && styles.selectedRoleText,
                  ]}
                >
                  Cashier
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "admin" && styles.selectedRole,
                ]}
                onPress={() => setRole("admin")}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === "admin" && styles.selectedRoleText,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddUser}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>CREATE USER</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
  visible={showBusinessSettings}
  animationType="slide"
  transparent
  onRequestClose={() =>
    setShowBusinessSettings(false)
  }
>
  <View style={styles.modalOverlay}>
    <View style={styles.modal}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          Business Settings
        </Text>

        <TouchableOpacity
          onPress={() =>
            setShowBusinessSettings(false)
          }
        >
          <MaterialIcons
            name="close"
            size={26}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>
          Business Name *
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter business name"
          value={businessName}
          onChangeText={setBusinessName}
        />

        <Text style={styles.label}>
          Address
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter business address"
          value={businessAddress}
          onChangeText={setBusinessAddress}
        />

        <Text style={styles.label}>
          Phone Number
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          value={businessPhone}
          onChangeText={setBusinessPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter business email"
          value={businessEmail}
          onChangeText={setBusinessEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          Currency
        </Text>

        <TextInput
          style={styles.input}
          placeholder="GH₵"
          value={businessCurrency}
          onChangeText={setBusinessCurrency}
        />

        <Text style={styles.label}>
          Receipt Footer
        </Text>

        <TextInput
          style={[
            styles.input,
           
          ]}
          placeholder="Thank you for your business."
          value={receiptFooter}
          onChangeText={setReceiptFooter}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveBusinessSettings}
          disabled={savingBusinessSettings}
        >
          {savingBusinessSettings ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              SAVE BUSINESS SETTINGS
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  </View>
</Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginBottom: 30,
  },

  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  userInfo: {
    flex: 1,
  },
  changePasswordButton: {
    marginTop: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  userRowActions: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  deleteButton: {
    marginTop: 6,
    padding: 4,
  },
  changePasswordText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E88E5",
  },
  name: {
    fontSize: 19,
    fontWeight: "600",
    color: "#222",
  },

  username: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },

  role: {
    marginTop: 5,
    fontSize: 13,
    color: "#1E88E5",
    textTransform: "capitalize",
    fontWeight: "600",
  },

  section: {
    marginTop: 30,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 5,
  },

  loader: {
    marginVertical: 20,
  },

  userRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  userRowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  userRowInfo: {
    flex: 1,
  },

  userRowName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  userRowUsername: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },

  userRowRole: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E88E5",
    textTransform: "capitalize",
  },
  settingItem: {
    backgroundColor: "#1E88E5",
    borderRadius: 12,
    padding: 15,
   marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  settingInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  settingTitle: { fontSize: 15, fontWeight: "800", color: "white" },
  settingDescription: {
    fontSize: 12,
    color: "white",
    marginTop: 4,
    lineHeight: 17,
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },

  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#D32F2F",
  },

  version: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
  },

  roleContainer: {
    flexDirection: "row",
    gap: 10,
  },

  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },

  selectedRole: {
    backgroundColor: "#1E88E5",
    borderColor: "#1E88E5",
  },

  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  selectedRoleText: {
    color: "#FFFFFF",
  },

  saveButton: {
    marginTop: 25,
    backgroundColor: "#1E88E5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
