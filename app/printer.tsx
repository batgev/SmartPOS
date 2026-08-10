import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { Device, State } from "react-native-ble-plx";

import printerService from "../services/printer.service";

export default function PrinterScreen() {
  const [bluetoothState, setBluetoothState] =
    useState<State | null>(null);
    const [printing, setPrinting] =
  useState(false);

  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectingId, setConnectingId] =
    useState<string | null>(null);

  const [connectedDevice, setConnectedDevice] =
    useState<Device | null>(null);

  const devicesRef = useRef<Map<string, Device>>(
    new Map()
  );

  // =========================
  // INITIALIZE
  // =========================

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const state =
          await printerService.initialize();

        if (mounted) {
          setBluetoothState(state);
        }
      } catch (error) {
        console.error(
          "Printer initialization error:",
          error
        );
      }
    };

    initialize();

    return () => {
      mounted = false;
      printerService.stopScan();
    };
  }, []);

  // =========================
  // BLUETOOTH STATE
  // =========================

  useEffect(() => {
    const subscription =
      printerService.onBluetoothStateChange?.(
        (state) => {
          setBluetoothState(state);
        }
      );

    return () => {
      subscription?.remove();
    };
  }, []);

  // =========================
  // SCAN
  // =========================

  const startScan = async () => {
    try {
      setDevices([]);
      devicesRef.current.clear();
      setScanning(true);

      await printerService.scanPrinters(
        (device) => {
          devicesRef.current.set(
            device.id,
            device
          );

          setDevices(
            Array.from(
              devicesRef.current.values()
            )
          );
        },
        (error) => {
          console.error(
            "Bluetooth scan error:",
            error
          );

          setScanning(false);

          Alert.alert(
            "Scan Error",
            error.message ||
              "Unable to scan for printers."
          );
        }
      );

      // Scan for 10 seconds
      setTimeout(() => {
        printerService.stopScan();
        setScanning(false);
      }, 10000);
    } catch (error) {
      setScanning(false);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to scan for printers.";

      Alert.alert(
        "Bluetooth Error",
        message
      );
    }
  };

  // =========================
  // STOP SCAN
  // =========================

  const stopScan = () => {
    printerService.stopScan();
    setScanning(false);
  };

  // =========================
  // CONNECT
  // =========================

  const connectToPrinter = async (
    device: Device
  ) => {
    try {
      setConnectingId(device.id);

      stopScan();

      const connected =
        await printerService.connect(
          device.id
        );

      setConnectedDevice(connected);

      Alert.alert(
        "Printer Connected",
        `${
          connected.name ||
          connected.localName ||
          "Bluetooth printer"
        } is connected successfully.`
      );
    } catch (error) {
      console.error(
        "Printer connection error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to connect to the printer.";

      Alert.alert(
        "Connection Failed",
        message
      );
    } finally {
      setConnectingId(null);
    }
  };

  // =========================
  // DISCONNECT
  // =========================

  const disconnectPrinter = async () => {
    try {
      await printerService.disconnect();

      setConnectedDevice(null);

      Alert.alert(
        "Disconnected",
        "The printer has been disconnected."
      );
    } catch (error) {
      console.error(
        "Disconnect error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to disconnect the printer."
      );
    }
  };
const testPrint = async () => {
  try {
    setPrinting(true);

    const receipt = `
        SMARTPOS
      TEST RECEIPT
--------------------------------
Printer connection successful!
--------------------------------

Date:
${new Date().toLocaleString()}

--------------------------------

     Smart Business,
       Smart Sales.
       Developed by: GTech : 0598778437

\n\n
`;

    await printerService.printReceipt(
      receipt
    );

    Alert.alert(
      "Test Print",
      "Test receipt sent to the printer."
    );
  } catch (error) {
    console.error(
      "Test print error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to print test receipt.";

    Alert.alert(
      "Print Failed",
      message
    );
  } finally {
    setPrinting(false);
  }
};
  // =========================
  // RENDER DEVICE
  // =========================

  const renderDevice = ({
    item,
  }: {
    item: Device;
  }) => {
    const isConnected =
      connectedDevice?.id === item.id;

    const isConnecting =
      connectingId === item.id;

    return (
      <View style={styles.deviceCard}>
        <View style={styles.deviceIcon}>
          <MaterialIcons
            name="print"
            size={27}
            color="#1E88E5"
          />
        </View>

        <View style={styles.deviceInfo}>
          <Text
            style={styles.deviceName}
            numberOfLines={1}
          >
            {item.name ||
              item.localName ||
              "Unknown Bluetooth Device"}
          </Text>

          <Text
            style={styles.deviceId}
            numberOfLines={1}
          >
            {item.id}
          </Text>

          {isConnected && (
            <Text style={styles.connectedText}>
              Connected
            </Text>
          )}
        </View>

        {isConnected ? (
          <MaterialIcons
            name="check-circle"
            size={25}
            color="#2E7D32"
          />
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() =>
              connectToPrinter(item)
            }
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.connectButtonText
                }
              >
                CONNECT
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // =========================
  // UI
  // =========================

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Printer
            </Text>

            <Text style={styles.subtitle}>
              Connect your receipt printer
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <MaterialIcons
              name="print"
              size={27}
              color="#1E88E5"
            />
          </View>
        </View>

        {/* BLUETOOTH STATUS */}

        <View
          style={[
            styles.statusCard,
            bluetoothState === State.PoweredOn
              ? styles.statusReady
              : styles.statusWarning,
          ]}
        >
          <MaterialIcons
            name={
              bluetoothState ===
              State.PoweredOn
                ? "bluetooth"
                : "bluetooth-disabled"
            }
            size={25}
            color={
              bluetoothState ===
              State.PoweredOn
                ? "#1565C0"
                : "#D32F2F"
            }
          />

          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {bluetoothState ===
              State.PoweredOn
                ? "Bluetooth is ready"
                : "Bluetooth is unavailable"}
            </Text>

            <Text style={styles.statusText}>
              {bluetoothState ===
              State.PoweredOn
                ? "You can search for nearby printers."
                : "Turn on Bluetooth to search for printers."}
            </Text>
          </View>
        </View>

        {/* CONNECTED PRINTER */}

        {connectedDevice && (
          <View style={styles.connectedCard}>
            <View
              style={styles.connectedHeader}
            >
              <View
                style={styles.connectedIcon}
              >
                <MaterialIcons
                  name="print"
                  size={26}
                  color="#2E7D32"
                />
              </View>

              <View
                style={styles.connectedInfo}
              >
                <Text
                  style={styles.connectedTitle}
                >
                  Active Printer
                </Text>

                <Text
                  style={styles.connectedName}
                  numberOfLines={1}
                >
                  {connectedDevice.name ||
                    connectedDevice.localName ||
                    "Bluetooth Printer"}
                </Text>
              </View>

              <MaterialIcons
                name="check-circle"
                size={26}
                color="#2E7D32"
              />
            </View>
                    <TouchableOpacity
  style={styles.testPrintButton}
  onPress={testPrint}
  disabled={printing}
>
  {printing ? (
    <ActivityIndicator
      size="small"
      color="#FFFFFF"
    />
  ) : (
    <MaterialIcons
      name="print"
      size={20}
      color="#FFFFFF"
    />
  )}

  <Text
    style={styles.testPrintText}
  >
    {printing
      ? "PRINTING..."
      : "TEST PRINT"}
  </Text>
</TouchableOpacity>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={
                disconnectPrinter
              }
            >
              <MaterialIcons
                name="link-off"
                size={20}
                color="#D32F2F"
              />

              <Text
                style={styles.disconnectText}
              >
                DISCONNECT
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCAN BUTTON */}

        <TouchableOpacity
          style={[
            styles.scanButton,
            scanning &&
              styles.scanningButton,
          ]}
          onPress={
            scanning
              ? stopScan
              : startScan
          }
        >
          {scanning ? (
            <>
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />

              <Text
                style={styles.scanButtonText}
              >
                SCANNING...
              </Text>
            </>
          ) : (
            <>
              <MaterialIcons
                name="bluetooth-searching"
                size={22}
                color="#FFFFFF"
              />

              <Text
                style={styles.scanButtonText}
              >
                SEARCH FOR PRINTERS
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* DEVICES */}

        <View style={styles.devicesHeader}>
          <Text style={styles.sectionTitle}>
            Available Devices
          </Text>

          <Text style={styles.deviceCount}>
            {devices.length}
          </Text>
        </View>

        {devices.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="print-disabled"
              size={48}
              color="#BBBBBB"
            />

            <Text style={styles.emptyTitle}>
              No Printers Found
            </Text>

            <Text style={styles.emptyText}>
              Tap "Search for Printers"
              to find nearby Bluetooth
              devices.
            </Text>
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) =>
              item.id
            }
            renderItem={renderDevice}
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.deviceList
            }
          />
        )}

        {/* INFORMATION */}

        <View style={styles.infoCard}>
          <MaterialIcons
            name="info-outline"
            size={22}
            color="#1E88E5"
          />

          <Text style={styles.infoText}>
            Make sure your receipt printer
            is powered on and Bluetooth is
            enabled before searching.
          </Text>
        </View>
      </View>
    </View>
  );
}

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },

  content: {
    flex: 1,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#777",
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },

  statusCard: {
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  statusReady: {
    backgroundColor: "#E3F2FD",
  },

  statusWarning: {
    backgroundColor: "#FFEBEE",
  },

  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },

  statusText: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },

  connectedCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
testPrintButton: {
  height: 42,
  borderRadius: 8,
  backgroundColor: "#1E88E5",
  marginTop: 13,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
},

testPrintText: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "700",
  marginLeft: 6,
},
  connectedHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  connectedIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  connectedInfo: {
    flex: 1,
    marginLeft: 11,
  },

  connectedTitle: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },

  connectedName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginTop: 2,
  },

  disconnectButton: {
    height: 42,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    marginTop: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  disconnectText: {
    color: "#D32F2F",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },

  scanButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#1E88E5",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },

  scanningButton: {
    backgroundColor: "#757575",
  },

  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  devicesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222",
  },

  deviceCount: {
    marginLeft: 8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    color: "#1E88E5",
    textAlign: "center",
    paddingTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },

  deviceList: {
    paddingBottom: 10,
  },

  deviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },

  deviceIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },

  deviceInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    marginRight: 8,
  },

  deviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },

  deviceId: {
    fontSize: 10,
    color: "#999",
    marginTop: 3,
  },

  connectedText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
    marginTop: 3,
  },

  connectButton: {
    backgroundColor: "#1E88E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 82,
    alignItems: "center",
  },

  connectButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#444",
    marginTop: 10,
  },

  emptyText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 5,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    marginLeft: 9,
  },
});