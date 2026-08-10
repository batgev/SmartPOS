import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import saleService, {
  Sale,
} from "../../services/sale.service";

import productService, {
  Product,
} from "../../services/product.service";

type DashboardStats = {
  todayRevenue: number;
  todayTransactions: number;
  todayItemsSold: number;
  todayProfit: number;
  totalProducts: number;
  lowStockCount: number;
};

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayTransactions: 0,
    todayItemsSold: 0,
    todayProfit: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });

  const [recentSales, setRecentSales] =
    useState<Sale[]>([]);

  const [lowStockProducts, setLowStockProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  // =========================
  // LOAD DASHBOARD
  // =========================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [sales, products] =
        await Promise.all([
          saleService.getSales(),
          productService.getProducts(),
        ]);

      // =========================
      // TODAY
      // =========================

      const now = new Date();

      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDate = now.getDate();

      const todaySales = sales.filter(
        (sale) => {
          const saleDate =
            new Date(sale.createdAt);

          return (
            saleDate.getFullYear() ===
              todayYear &&
            saleDate.getMonth() ===
              todayMonth &&
            saleDate.getDate() ===
              todayDate
          );
        }
      );

      // =========================
      // REVENUE
      // =========================

      const todayRevenue =
        todaySales.reduce(
          (sum, sale) =>
            sum + sale.total,
          0
        );

      // =========================
      // ITEMS SOLD + PROFIT
      // =========================

      let todayItemsSold = 0;
      let todayProfit = 0;

      for (const sale of todaySales) {
        const details =
          await saleService.getSaleDetails(
            sale.id
          );

        if (!details) {
          continue;
        }

        for (const item of details.items) {
          todayItemsSold +=
            item.quantity;

          todayProfit +=
            (item.unitPrice -
              item.buyingPrice) *
            item.quantity;
        }
      }

      // =========================
      // LOW STOCK
      // =========================

      const lowStockProducts =
        products.filter(
          (product) =>
            product.stockQuantity <=
            product.lowStockThreshold
        );

      setStats({
        todayRevenue,
        todayTransactions:
          todaySales.length,
        todayItemsSold,
        todayProfit,
        totalProducts:
          products.length,
        lowStockCount:
          lowStockProducts.length,
      });

      setRecentSales(
        sales.slice(0, 5)
      );

      setLowStockProducts(
        lowStockProducts.slice(0, 5)
      );
    } catch (error) {
      console.error(
        "Failed to load dashboard:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  // =========================
  // REFRESH
  // =========================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#1E88E5"
        />

        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  // =========================
  // RENDER
  // =========================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* =========================
          HEADER
      ========================= */}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Dashboard
          </Text>

          <Text style={styles.subtitle}>
            Today's business overview
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <MaterialIcons
            name="refresh"
            size={23}
            color="#1E88E5"
          />
        </TouchableOpacity>
      </View>

      {/* =========================
          SALES SUMMARY
      ========================= */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Today's Sales
        </Text>

        <View style={styles.statsGrid}>
          {/* REVENUE */}

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.blueIcon,
              ]}
            >
              <MaterialIcons
                name="payments"
                size={23}
                color="#1E88E5"
              />
            </View>

            <Text style={styles.statLabel}>
              Revenue
            </Text>

            <Text style={styles.statValue}>
              GH₵{" "}
              {stats.todayRevenue.toFixed(
                2
              )}
            </Text>
          </View>

          {/* TRANSACTIONS */}

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.greenIcon,
              ]}
            >
              <MaterialIcons
                name="receipt-long"
                size={23}
                color="#2E7D32"
              />
            </View>

            <Text style={styles.statLabel}>
              Transactions
            </Text>

            <Text style={styles.statValue}>
              {stats.todayTransactions}
            </Text>
          </View>

          {/* ITEMS SOLD */}

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.orangeIcon,
              ]}
            >
              <MaterialIcons
                name="shopping-cart"
                size={23}
                color="#EF6C00"
              />
            </View>

            <Text style={styles.statLabel}>
              Items Sold
            </Text>

            <Text style={styles.statValue}>
              {stats.todayItemsSold}
            </Text>
          </View>

          {/* PROFIT */}

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                styles.purpleIcon,
              ]}
            >
              <MaterialIcons
                name="trending-up"
                size={23}
                color="#7B1FA2"
              />
            </View>

            <Text style={styles.statLabel}>
              Profit
            </Text>

            <Text
              style={[
                styles.statValue,
                styles.profitValue,
              ]}
            >
              GH₵{" "}
              {stats.todayProfit.toFixed(
                2
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* =========================
          INVENTORY SUMMARY
      ========================= */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Inventory
        </Text>

        <View style={styles.inventorySummary}>
          <View
            style={
              styles.inventorySummaryItem
            }
          >
            <MaterialIcons
              name="inventory-2"
              size={28}
              color="#1E88E5"
            />

            <View>
              <Text
                style={
                  styles.inventoryLabel
                }
              >
                Total Products
              </Text>

              <Text
                style={
                  styles.inventoryValue
                }
              >
                {stats.totalProducts}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.inventoryDivider
            }
          />

          <TouchableOpacity
            style={
              styles.inventorySummaryItem
            }
            onPress={() =>
              router.push(
                "/(tabs)/inventory"
              )
            }
          >
            <MaterialIcons
              name="warning"
              size={28}
              color={
                stats.lowStockCount > 0
                  ? "#D32F2F"
                  : "#2E7D32"
              }
            />

            <View>
              <Text
                style={
                  styles.inventoryLabel
                }
              >
                Low Stock
              </Text>

              <Text
                style={[
                  styles.inventoryValue,
                  stats.lowStockCount >
                    0 &&
                    styles.lowStockValue,
                ]}
              >
                {stats.lowStockCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* =========================
          LOW STOCK
      ========================= */}

      {lowStockProducts.length >
        0 && (
        <View style={styles.section}>
          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Low Stock
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Products that need
                attention
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push(
                  "/(tabs)/inventory"
                )
              }
            >
              <Text
                style={
                  styles.viewAll
                }
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={styles.listCard}
          >
            {lowStockProducts.map(
              (product) => (
                <View
                  key={product.id}
                  style={
                    styles.lowStockRow
                  }
                >
                  <View
                    style={
                      styles.lowStockIcon
                    }
                  >
                    <MaterialIcons
                      name="inventory-2"
                      size={21}
                      color="#D32F2F"
                    />
                  </View>

                  <View
                    style={
                      styles.lowStockInfo
                    }
                  >
                    <Text
                      style={
                        styles.lowStockName
                      }
                    >
                      {product.name}
                    </Text>

                    <Text
                      style={
                        styles.lowStockMeta
                      }
                    >
                      Alert at{" "}
                      {
                        product.lowStockThreshold
                      }{" "}
                      {
                        product.unit
                      }
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.stockQuantity
                    }
                  >
                    {
                      product.stockQuantity
                    }{" "}
                    {product.unit}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>
      )}

      {/* =========================
          RECENT SALES
      ========================= */}

      <View style={styles.section}>
        <View
          style={styles.sectionHeader}
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Recent Sales
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Latest completed
              transactions
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push(
                "/(tabs)/sales-history"
              )
            }
          >
            <Text
              style={styles.viewAll}
            >
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {recentSales.length === 0 ? (
          <View
            style={
              styles.emptySales
            }
          >
            <MaterialIcons
              name="receipt-long"
              size={40}
              color="#BBBBBB"
            />

            <Text
              style={
                styles.emptySalesText
              }
            >
              No sales yet
            </Text>
          </View>
        ) : (
          <View
            style={styles.listCard}
          >
            {recentSales.map(
              (sale) => (
                <TouchableOpacity
                  key={sale.id}
                  style={
                    styles.saleRow
                  }
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(
                      `/sale-details/${sale.id}`
                    )
                  }
                >
                  <View
                    style={
                      styles.saleIcon
                    }
                  >
                    <MaterialIcons
                      name="receipt"
                      size={21}
                      color="#1E88E5"
                    />
                  </View>

                  <View
                    style={
                      styles.saleInfo
                    }
                  >
                    <Text
                      style={
                        styles.receiptNumber
                      }
                    >
                      {
                        sale.receiptNumber
                      }
                    </Text>

                    <Text
                      style={
                        styles.saleDate
                      }
                    >
                      {new Date(
                        sale.createdAt
                      ).toLocaleString()}
                    </Text>

                    <Text
                      style={
                        styles.paymentMethod
                      }
                    >
                      {
                        sale.paymentMethod
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.saleRight
                    }
                  >
                    <Text
                      style={
                        styles.saleTotal
                      }
                    >
                      GH₵{" "}
                      {sale.total.toFixed(
                        2
                      )}
                    </Text>

                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color="#999"
                    />
                  </View>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>

      {/* =========================
          QUICK ACTIONS
      ========================= */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View
          style={
            styles.quickActions
          }
        >
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() =>
              router.push(
                "/(tabs)/sales"
              )
            }
          >
            <View
              style={[
                styles.quickActionIcon,
                styles.blueIcon,
              ]}
            >
              <MaterialIcons
                name="point-of-sale"
                size={25}
                color="#1E88E5"
              />
            </View>

            <Text
              style={
                styles.quickActionText
              }
            >
              New Sale
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() =>
              router.push(
                "/(tabs)/inventory"
              )
            }
          >
            <View
              style={[
                styles.quickActionIcon,
                styles.greenIcon,
              ]}
            >
              <MaterialIcons
                name="inventory-2"
                size={25}
                color="#2E7D32"
              />
            </View>

            <Text
              style={
                styles.quickActionText
              }
            >
              Inventory
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() =>
              router.push(
                "/(tabs)/sales-history"
              )
            }
          >
            <View
              style={[
                styles.quickActionIcon,
                styles.orangeIcon,
              ]}
            >
              <MaterialIcons
                name="history"
                size={25}
                color="#EF6C00"
              />
            </View>

            <Text
              style={
                styles.quickActionText
              }
            >
              Sales History
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F8FA",
  },

  loadingText: {
    marginTop: 10,
    color: "#777",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
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

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },

  section: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222",
  },

  sectionSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  viewAll: {
    color: "#1E88E5",
    fontSize: 13,
    fontWeight: "600",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  blueIcon: {
    backgroundColor: "#E3F2FD",
  },

  greenIcon: {
    backgroundColor: "#E8F5E9",
  },

  orangeIcon: {
    backgroundColor: "#FFF3E0",
  },

  purpleIcon: {
    backgroundColor: "#F3E5F5",
  },

  statLabel: {
    color: "#777",
    fontSize: 13,
    marginBottom: 5,
  },

  statValue: {
    color: "#222",
    fontSize: 19,
    fontWeight: "700",
  },

  profitValue: {
    color: "#2E7D32",
  },

  inventorySummary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },

  inventorySummaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  inventoryDivider: {
    width: 1,
    height: 45,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 12,
  },

  inventoryLabel: {
    color: "#777",
    fontSize: 12,
  },

  inventoryValue: {
    color: "#222",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },

  lowStockValue: {
    color: "#D32F2F",
  },

  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 1,
  },

  lowStockRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  lowStockIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  lowStockInfo: {
    flex: 1,
  },

  lowStockName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },

  lowStockMeta: {
    color: "#888",
    fontSize: 11,
    marginTop: 3,
  },

  stockQuantity: {
    color: "#D32F2F",
    fontWeight: "700",
    fontSize: 13,
  },

  saleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  saleIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  saleInfo: {
    flex: 1,
  },

  receiptNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  saleDate: {
    color: "#888",
    fontSize: 11,
    marginTop: 3,
  },

  paymentMethod: {
    color: "#1E88E5",
    fontSize: 11,
    marginTop: 2,
    textTransform: "capitalize",
  },

  saleRight: {
    alignItems: "flex-end",
  },

  saleTotal: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },

  emptySales: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 35,
    alignItems: "center",
    marginTop: 12,
  },

  emptySalesText: {
    color: "#888",
    marginTop: 8,
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  quickAction: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 1,
  },

  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});