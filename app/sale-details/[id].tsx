import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import printerService from "../../services/printer.service";
import {
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";

import saleService, {
  SaleDetails,
} from "../../services/sale.service";


  export default function SaleDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const saleId = Number(id);

  const [details, setDetails] =
    useState<SaleDetails | null>(null);

  const [loading, setLoading] = useState(true);

  const loadSale = async () => {
    try {
      setLoading(true);

      const data =
        await saleService.getSaleDetails(
          saleId
        );

      if (!data) {
        Alert.alert(
          "Error",
          "Sale not found."
        );
        return;
      }

      setDetails(data);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Unable to load sale."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSale();
    }, [saleId])
  );

 if (loading) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

  if (!details) {
  return (
    <View style={styles.center}>
      <Text>Sale not found.</Text>
    </View>
  );
}
  const { sale, items } = details;
return (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Receipt</Text>

    <Text style={styles.receipt}>
      {sale.receiptNumber}
    </Text>

    <Text style={styles.date}>
      {new Date(sale.createdAt).toLocaleString()}
    </Text>
    <View style={styles.card}>
  <Text style={styles.sectionTitle}>Payment</Text>

  <View style={styles.row}>
    <Text>Method</Text>
    <Text>{sale.paymentMethod}</Text>
  </View>

  <View style={styles.row}>
    <Text>Subtotal</Text>
    <Text>GH₵ {sale.subtotal.toFixed(2)}</Text>
  </View>

  <View style={styles.row}>
    <Text>Discount</Text>
    <Text>GH₵ {sale.discount.toFixed(2)}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.totalLabel}>Total</Text>
    <Text style={styles.totalValue}>
      GH₵ {sale.total.toFixed(2)}
    </Text>
  </View>

  <View style={styles.row}>
    <Text>Paid</Text>
    <Text>GH₵ {sale.amountPaid.toFixed(2)}</Text>
  </View>

  <View style={styles.row}>
    <Text>Change</Text>
    <Text>GH₵ {sale.changeAmount.toFixed(2)}</Text>
  </View>
</View>
<View style={styles.card}>
  <Text style={styles.sectionTitle}>Items</Text>

  {items.map(item => (
    <View
      key={item.id}
      style={styles.itemRow}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>
          {item.productName}
        </Text>

        <Text style={styles.itemMeta}>
          {item.quantity} × GH₵ {item.unitPrice.toFixed(2)}
        </Text>
      </View>

      <Text style={styles.itemTotal}>
        GH₵ {item.subtotal.toFixed(2)}
      </Text>
    </View>
  ))}
</View>
<TouchableOpacity
  style={styles.printButton}
  onPress={async () => {
    try {
      const printer =
        printerService.getConnectedDevice();

      if (!printer) {
        Alert.alert(
          "Printer Not Connected",
          "Please connect a Bluetooth printer in Settings before printing."
        );

        return;
      }

      if (!details) {
        return;
      }

      const { sale, items } = details;

      const receipt = `
        SMARTPOS
------------------------------
Receipt: ${sale.receiptNumber}
Date: ${new Date(
        sale.createdAt
      ).toLocaleString()}
------------------------------

${items
  .map(
    (item) =>
      `${item.productName}
${item.quantity} x GH₵ ${item.unitPrice.toFixed(
        2
      )}    GH₵ ${item.subtotal.toFixed(2)}`
  )
  .join("\n")}

------------------------------
Subtotal:       GH₵ ${sale.subtotal.toFixed(2)}
Discount:       GH₵ ${sale.discount.toFixed(2)}
TOTAL:          GH₵ ${sale.total.toFixed(2)}

Payment:        ${sale.paymentMethod}
Amount Paid:    GH₵ ${sale.amountPaid.toFixed(2)}
Change:         GH₵ ${sale.changeAmount.toFixed(2)}

------------------------------
        Thank you!
------------------------------
Developed by: 
Batong Gevaise(0598778437)
      `;

      await printerService.printReceipt(
        receipt
      );

      Alert.alert(
        "Printed",
        "Receipt sent to the printer."
      );
    } catch (error) {
      console.error(
        "Failed to print receipt:",
        error
      );

      Alert.alert(
        "Printing Failed",
        error instanceof Error
          ? error.message
          : "Unable to print receipt."
      );
    }
  }}
>
  <Text style={styles.printButtonText}>
    PRINT RECEIPT
  </Text>
</TouchableOpacity>
  </ScrollView>
  
);
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    padding: 20,
  },
card: {
  backgroundColor: "#FFF",
  borderRadius: 14,
  padding: 16,
  marginTop: 20,
},

sectionTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 12,
},

row: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 10,
},

totalLabel: {
  fontWeight: "700",
  fontSize: 16,
},

totalValue: {
  fontWeight: "700",
  fontSize: 18,
  color: "#2E7D32",
},

itemRow: {
  flexDirection: "row",
  marginBottom: 14,
},

itemName: {
  fontWeight: "600",
  fontSize: 15,
},

itemMeta: {
  color: "#777",
  marginTop: 3,
},

itemTotal: {
  fontWeight: "700",
},

printButton: {
  backgroundColor: "#1E88E5",
  padding: 16,
  borderRadius: 12,
  marginTop: 25,
  alignItems: "center",
},

printButtonText: {
  color: "#FFF",
  fontWeight: "700",
  fontSize: 16,
},
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },

  receipt: {
    fontSize: 18,
    fontWeight: "600",
  },

  date: {
    color: "#777",
    marginTop: 4,
  },
});