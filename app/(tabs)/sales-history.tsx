import React, { useCallback, useState } from "react";
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
import { useFocusEffect } from "expo-router";
import { router } from "expo-router";
import saleService, { Sale } from "../../services/sale.service";

export default function SalesHistoryScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSales = async () => {
    try {
      setLoading(true);

      const data = await saleService.getSales();

      setSales(data);
    } catch (error) {
      console.error(error);

      Alert.alert("Error", "Unable to load sales.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={sales}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Sales History</Text>

          <Text style={styles.subtitle}>All completed sales</Text>
        </>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <MaterialIcons name="receipt-long" size={50} color="#AAA" />

          <Text style={styles.emptyTitle}>No sales yet</Text>

          <Text style={styles.emptyText}>
            Completed sales will appear here.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => router.push(`/sale-details/${item.id}`)}
        >
          <View style={styles.icon}>
            <MaterialIcons name="receipt" size={24} color="#1E88E5" />
          </View>

          <View style={styles.info}>
            <Text style={styles.receipt}>{item.receiptNumber}</Text>

            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>

            <Text style={styles.payment}>{item.paymentMethod}</Text>
          </View>

          <View>
            <Text style={styles.total}>GH₵ {item.total.toFixed(2)}</Text>

            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  list: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    color: "#777",
    marginTop: 4,
    marginBottom: 20,
  },

  empty: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 40,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "600",
  },

  emptyText: {
    marginTop: 5,
    color: "#888",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 1,
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  info: {
    flex: 1,
  },

  receipt: {
    fontWeight: "700",
    fontSize: 15,
    color: "#222",
  },

  date: {
    marginTop: 4,
    color: "#777",
    fontSize: 12,
  },

  payment: {
    marginTop: 3,
    color: "#1E88E5",
    fontSize: 12,
    textTransform: "capitalize",
  },

  total: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 4,
    textAlign: "right",
  },
});
