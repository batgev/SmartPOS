import {
  BleManager,
  Device,
  State,
} from "react-native-ble-plx";
import {
  PermissionsAndroid,
  Platform,
} from "react-native";

class PrinterService {
  private bleManager: BleManager;
  private connectedDevice: Device | null = null;
  private writableCharacteristic: {
  serviceUUID: string;
  characteristicUUID: string;
  withoutResponse: boolean;
} | null = null;

  constructor() {
    this.bleManager = new BleManager();
  }

  // =========================
  // INITIALIZE
  // =========================

  async initialize() {
    console.log("🖨 Printer initialized");

    return this.bleManager.state();
  }

  // =========================
  // BLUETOOTH STATE
  // =========================

  async getBluetoothState(): Promise<State> {
    return await this.bleManager.state();
  }
onBluetoothStateChange(
  listener: (state: State) => void
) {
  return this.bleManager.onStateChange(
    listener,
    true
  );
}
  // =========================
  // PERMISSIONS
  // =========================

  private async requestBluetoothPermissions() {
    if (Platform.OS !== "android") {
      return true;
    }

    if (Platform.Version >= 31) {
      const result =
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

      return (
        result[
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        ] === PermissionsAndroid.RESULTS.GRANTED &&
        result[
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        ] === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const result =
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

    return (
      result === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  // =========================
  // SCAN
  // =========================

  async scanPrinters(
    onDevice: (device: Device) => void,
    onError?: (error: Error) => void
  ) {
    const hasPermission =
      await this.requestBluetoothPermissions();

    if (!hasPermission) {
      throw new Error(
        "Bluetooth permission is required to find printers."
      );
    }

    const state =
      await this.bleManager.state();

    if (state !== State.PoweredOn) {
      throw new Error(
        "Please turn on Bluetooth before searching for printers."
      );
    }

    this.bleManager.startDeviceScan(
      null,
      {
        allowDuplicates: false,
      },
      (error, device) => {
        if (error) {
          console.error(
            "Bluetooth scan error:",
            error
          );

          onError?.(error);
          return;
        }

        if (!device) {
          return;
        }

        const name =
          device.name ||
          device.localName;

        // Ignore devices without a name.
        if (!name) {
          return;
        }

        onDevice(device);
      }
    );
  }

  // =========================
  // STOP SCAN
  // =========================

  stopScan() {
    this.bleManager.stopDeviceScan();
  }

  // =========================
  // CONNECT
  // =========================

  async connect(deviceId: string): Promise<Device> {
  this.stopScan();

  const device = await this.bleManager.connectToDevice(deviceId);

  await device.discoverAllServicesAndCharacteristics();

  const connected = await device.isConnected();

  if (!connected) {
    throw new Error("Unable to establish a connection.");
  }

  this.connectedDevice = device;

  // Find a writable characteristic automatically.
  const services = await device.services();

  this.writableCharacteristic = null;

  for (const service of services) {
    const characteristics =
      await service.characteristics();

    for (const characteristic of characteristics) {
      if (characteristic.isWritableWithoutResponse) {
        this.writableCharacteristic = {
          serviceUUID: service.uuid,
          characteristicUUID: characteristic.uuid,
          withoutResponse: true,
        };

        break;
      }

      if (characteristic.isWritableWithResponse) {
        this.writableCharacteristic = {
          serviceUUID: service.uuid,
          characteristicUUID: characteristic.uuid,
          withoutResponse: false,
        };

        break;
      }
    }

    if (this.writableCharacteristic) {
      break;
    }
  }

  if (!this.writableCharacteristic) {
    await this.disconnect();

    throw new Error(
      "Connected to the printer, but no writable Bluetooth characteristic was found."
    );
  }

  console.log("Printer connected:", deviceId);
  console.log(
    "Writable characteristic:",
    this.writableCharacteristic
  );

  return device;
}
async inspectConnectedPrinter() {
  if (!this.connectedDevice) {
    throw new Error("Printer not connected.");
  }

  const services =
    await this.connectedDevice.services();

  for (const service of services) {
    console.log("================================");
    console.log("SERVICE:", service.uuid);

    const characteristics =
      await service.characteristics();

    for (const characteristic of characteristics) {
      console.log(
        "CHARACTERISTIC:",
        characteristic.uuid
      );

      console.log(
        "  readable:",
        characteristic.isReadable
      );

      console.log(
        "  writable:",
        characteristic.isWritableWithResponse
      );

      console.log(
        "  writableWithoutResponse:",
        characteristic.isWritableWithoutResponse
      );

      console.log(
        "  notifiable:",
        characteristic.isNotifiable
      );

      console.log(
        "  indicatable:",
        characteristic.isIndicatable
      );
    }
  }

  console.log("================================");
}
  // =========================
  // DISCONNECT
  // =========================

  async disconnect() {
  if (!this.connectedDevice) {
    return;
  }

  try {
    await this.bleManager.cancelDeviceConnection(
      this.connectedDevice.id
    );
  } finally {
    this.connectedDevice = null;
    this.writableCharacteristic = null;
  }
}

  // =========================
  // CURRENT DEVICE
  // =========================

  getConnectedDevice() {
    return this.connectedDevice;
  }

  // =========================
  // CONNECTION STATUS
  // =========================

  async isConnected() {
    if (!this.connectedDevice) {
      return false;
    }

    return await this.connectedDevice.isConnected();
  }

  // =========================
  // PRINT
  // =========================
async printReceipt(receipt: string) {
  if (!this.connectedDevice) {
    throw new Error("Printer not connected.");
  }

  if (!this.writableCharacteristic) {
    throw new Error(
      "Printer writable characteristic has not been found."
    );
  }

  const {
    serviceUUID,
    characteristicUUID,
    withoutResponse,
  } = this.writableCharacteristic;

  // ESC/POS commands
  const ESC = "\x1B";
  const GS = "\x1D";

  // Initialize printer
  const initialize = `${ESC}@`;

  // Receipt content
  const text = receipt;

  // Feed paper after printing
  const feed = "\n\n\n";

  // Cut paper
  const cut = `${GS}V\x00`;

  const data = initialize + text + feed + cut;

  const base64Data = this.stringToBase64(data);

  // BLE packets are usually limited in size.
  // Send the receipt in chunks.
  const chunkSize = 180;

  for (
    let i = 0;
    i < base64Data.length;
    i += chunkSize
  ) {
    const chunk = base64Data.substring(
      i,
      i + chunkSize
    );

    if (withoutResponse) {
      await this.connectedDevice.writeCharacteristicWithoutResponseForService(
        serviceUUID,
        characteristicUUID,
        chunk
      );
    } else {
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        chunk
      );
    }
  }

  console.log("Receipt printed successfully.");
}
  // =========================
  // CLEANUP
  // =========================
private stringToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);

  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
  destroy() {
    this.stopScan();
    this.bleManager.destroy();
    this.connectedDevice = null;
  }
}

export default new PrinterService();