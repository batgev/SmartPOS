import React, { useCallback, useMemo, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import printerService from "../../services/printer.service";
import { useAuth } from "../../context/AuthContext";
import businessSettingsService, {
  BusinessSettings,
} from "../../services/business_settings.service";
import productService, {
  Product,
} from "../../services/product.service";

import salesService, {
  CartItem,
} from "../../services/sale.service";

export default function SalesScreen() {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
const [businessSettings, setBusinessSettings] =
  useState<BusinessSettings | null>(null);
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [showCheckout, setShowCheckout] =
    useState(false);

  const [amountPaid, setAmountPaid] =
    useState("");

  const [discount, setDiscount] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "mobile_money" | "card">(
      "cash"
    );

  const [processingSale, setProcessingSale] =
    useState(false);
const [showScanner, setShowScanner] = useState(false);
const [cameraPermission, requestCameraPermission] =
  useCameraPermissions();

const [scanning, setScanning] = useState(false);
  // =========================
  // LOAD PRODUCTS
  // =========================

  const loadProducts = async () => {
    try {
      setLoading(true);

      const data =
        await productService.getProducts();

      setProducts(data);
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };
const loadBusinessSettings = async () => {
  try {
    const settings =
      await businessSettingsService.getSettings();

    setBusinessSettings(settings);
  } catch (error) {
    console.error(
      "Failed to load business settings:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to load business information."
    );
  }
};
  useFocusEffect(
  useCallback(() => {
    loadProducts();
    loadBusinessSettings();
  }, [])
);

  // =========================
  // SEARCH
  // =========================

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name
          .toLowerCase()
          .includes(query) ||
        product.sku
          ?.toLowerCase()
          .includes(query) ||
        product.barcode
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [products, search]);

  // =========================
  // CART
  // =========================

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      Alert.alert(
        "Out of Stock",
        `${product.name} has no stock available.`
      );

      return;
    }

    setCart((currentCart) => {
      const existing =
        currentCart.find(
          (item) =>
            item.productId === product.id
        );

      if (existing) {
        if (
          existing.quantity >=
          product.stockQuantity
        ) {
          Alert.alert(
            "Insufficient Stock",
            `Only ${product.stockQuantity} ${product.unit} available.`
          );

          return currentCart;
        }

        return currentCart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice:
            product.sellingPrice,
          buyingPrice:
            product.buyingPrice,
          stockQuantity:
            product.stockQuantity,
          unit: product.unit,
        },
      ];
    });
  };

  const increaseQuantity = (
    productId: number
  ) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        if (
          item.quantity >=
          item.stockQuantity
        ) {
          Alert.alert(
            "Insufficient Stock",
            `Only ${item.stockQuantity} ${item.unit} available.`
          );

          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity + 1,
        };
      })
    );
  };

  const decreaseQuantity = (
    productId: number
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          return {
            ...item,
            quantity:
              item.quantity - 1,
          };
        })
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  const removeFromCart = (
    productId: number
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.productId !== productId
      )
    );
  };

  // =========================
  // TOTALS
  // =========================

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          item.unitPrice,
      0
    );
  }, [cart]);

  const discountAmount = Number(
    discount || 0
  );

  const total = Math.max(
    0,
    subtotal - discountAmount
  );

  const paid = Number(
    amountPaid || 0
  );

  const change = Math.max(
    0,
    paid - total
  );

  // =========================
  // CHECKOUT
  // =========================

  const openCheckout = () => {
    if (cart.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Please add at least one product."
      );

      return;
    }

    setAmountPaid("");
    setDiscount("");
    setPaymentMethod("cash");

    setShowCheckout(true);
  };
const generateReceipt = (saleId: number) => {
  if (!businessSettings) {
    throw new Error(
      "Business settings are not available."
    );
  }

  const lines: string[] = [];

  lines.push("================================");
  lines.push(
    businessSettings.businessName
  );

  if (businessSettings.address) {
    lines.push(businessSettings.address);
  }

  if (businessSettings.phone) {
    lines.push(
      `Tel: ${businessSettings.phone}`
    );
  }

  if (businessSettings.email) {
    lines.push(
      `Email: ${businessSettings.email}`
    );
  }

  lines.push("================================");
  lines.push("            RECEIPT");
  lines.push("================================");

  lines.push(`Sale #: ${saleId}`);
  lines.push(
    `Cashier: ${user?.username || "Cashier"}`
  );

  lines.push("--------------------------------");

  cart.forEach((item) => {
    const itemTotal =
      item.quantity * item.unitPrice;

    lines.push(item.productName);

    lines.push(
      `${item.quantity} x ${
        businessSettings.currency
      } ${item.unitPrice.toFixed(2)} = ${
        businessSettings.currency
      } ${itemTotal.toFixed(2)}`
    );
  });

  lines.push("--------------------------------");

  lines.push(
    `Subtotal:     ${
      businessSettings.currency
    } ${subtotal.toFixed(2)}`
  );

  lines.push(
    `Discount:     ${
      businessSettings.currency
    } ${discountAmount.toFixed(2)}`
  );

  lines.push(
    `TOTAL:        ${
      businessSettings.currency
    } ${total.toFixed(2)}`
  );

  lines.push(
    `Paid:         ${
      businessSettings.currency
    } ${paid.toFixed(2)}`
  );

  lines.push(
    `Change:       ${
      businessSettings.currency
    } ${change.toFixed(2)}`
  );

  lines.push(
    `Payment:      ${paymentMethod.replace(
      "_",
      " "
    )}`
  );

  lines.push("--------------------------------");

  if (businessSettings.receiptFooter) {
    lines.push(
      businessSettings.receiptFooter
    );
  }

  lines.push("================================");
  lines.push("Developed By: Batong Gevaise (0598778437)");
  lines.push("");

  return lines.join("\n");
};
  const completeSale = async () => {
    if (!user?.id) {
      Alert.alert(
        "Error",
        "Unable to identify the current cashier."
      );

      return;
    }

    if (cart.length === 0) {
      Alert.alert(
        "Empty Cart",
        "There are no products in the cart."
      );

      return;
    }

    const paidAmount = Number(
      amountPaid || 0
    );

    const discountValue = Number(
      discount || 0
    );

    if (
      Number.isNaN(discountValue) ||
      discountValue < 0
    ) {
      Alert.alert(
        "Invalid Discount",
        "Please enter a valid discount."
      );

      return;
    }

    if (
      Number.isNaN(paidAmount) ||
      paidAmount < total
    ) {
      Alert.alert(
        "Insufficient Payment",
        `The customer must pay at least GH₵ ${total.toFixed(
          2
        )}.`
      );

      return;
    }

    try {
      setProcessingSale(true);

      const saleId =
        await salesService.createSale({
          items: cart,
          discount:
            discountValue,
          amountPaid:
            paidAmount,
          paymentMethod,
          createdBy: user.id,
        });
        const receipt = generateReceipt(saleId);

if (printerService.getConnectedDevice()) {
  try {
    await printerService.printReceipt(
      receipt
    );
  } catch (printError) {
    console.error(
      "Receipt printing failed:",
      printError
    );

    Alert.alert(
      "Sale Completed",
      "The sale was saved, but the receipt could not be printed."
    );
  }
}

      Alert.alert(
        "Sale Completed",
        `Sale #${saleId} completed successfully.\n\nChange: GH₵ ${(
          paidAmount - total
        ).toFixed(2)}`,
        [
          {
            text: "OK",
            onPress: () => {
              setCart([]);
              setSearch("");
              setAmountPaid("");
              setDiscount("");
              setShowCheckout(false);

              loadProducts();
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Failed to complete sale:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete sale.";

      Alert.alert(
        "Sale Failed",
        message
      );
    } finally {
      setProcessingSale(false);
    }
  };

  const openScanner = async () => {
  if (!cameraPermission?.granted) {
    const permission =
      await requestCameraPermission();

    if (!permission.granted) {
      Alert.alert(
        "Camera Permission",
        "Camera permission is required to scan barcodes."
      );

      return;
    }
  }

  setScanning(false);
  setShowScanner(true);
};

const handleBarcodeScanned = ({
  data,
}: {
  data: string;
}) => {
  if (scanning) {
    return;
  }

  setScanning(true);

  const barcode = data.trim();

  const product = products.find(
    (item) =>
      item.barcode?.trim() === barcode
  );

  if (!product) {
    Alert.alert(
      "Product Not Found",
      `No product was found with barcode:\n${barcode}`,
      [
        {
          text: "OK",
          onPress: () => {
            setScanning(false);
          },
        },
      ]
    );

    return;
  }

  if (product.stockQuantity <= 0) {
    Alert.alert(
      "Out of Stock",
      `${product.name} has no stock available.`,
      [
        {
          text: "OK",
          onPress: () => {
            setScanning(false);
          },
        },
      ]
    );

    return;
  }

  addToCart(product);

  setShowScanner(false);
  setScanning(false);
};
  // =========================
  // UI
  // =========================

  return (
    <View style={styles.container}>
      <View
        style={
          styles.content
        }
        
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.title}>
            New Sale
          </Text>

          <Text style={styles.subtitle}>
            Select products to add to the cart
          </Text>
        </View>

        {/* SEARCH */}

       <View style={styles.searchRow}>
  <View style={styles.searchContainer}>
    <MaterialIcons
      name="search"
      size={23}
      color="#777"
    />

    <TextInput
      style={styles.searchInput}
      placeholder="Search product, SKU or barcode"
      value={search}
      onChangeText={setSearch}
      autoCapitalize="none"
    />

    {search.length > 0 ? (
      <TouchableOpacity
        onPress={() => setSearch("")}
      >
        <MaterialIcons
          name="close"
          size={21}
          color="#777"
        />
      </TouchableOpacity>
    ) : null}
  </View>

  <TouchableOpacity
    style={styles.scanButton}
    onPress={openScanner}
    activeOpacity={0.8}
  >
    <MaterialIcons
      name="qr-code-scanner"
      size={25}
      color="#FFFFFF"
    />
  </TouchableOpacity>
</View>

        {/* PRODUCTS */}

      <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>
            Products
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.productList}
            contentContainerStyle={styles.productListContent}
          >

        {loading ? (
          <ActivityIndicator
            size="large"
            style={styles.loader}
          />
        ) : filteredProducts.length ===
          0 ? (
          <View style={styles.emptyProducts}>
            <MaterialIcons
              name="inventory-2"
              size={40}
              color="#AAA"
            />

            <Text
              style={styles.emptyProductsText}
            >
              {products.length === 0
                ? "No products available."
                : "No matching products found."}
            </Text>
          </View>
        ) : (
          filteredProducts.map(
            (product) => {
              const cartItem =
                cart.find(
                  (item) =>
                    item.productId ===
                    product.id
                );

              return (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productCard,
                    product.stockQuantity <=
                      0 &&
                      styles.outOfStockCard,
                  ]}
                  activeOpacity={0.75}
                  disabled={
                    product.stockQuantity <=
                    0
                  }
                  onPress={() =>
                    addToCart(product)
                  }
                >
                  <View
                    style={
                      styles.productIcon
                    }
                  >
                    <MaterialIcons
                      name="inventory-2"
                      size={24}
                      color="#1E88E5"
                    />
                  </View>

                  <View
                    style={
                      styles.productInfo
                    }
                  >
                    <Text
                      style={
                        styles.productName
                      }
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>

                    {product.sku ? (
                      <Text
                        style={
                          styles.productMeta
                        }
                      >
                        SKU:{" "}
                        {product.sku}
                      </Text>
                    ) : null}

                    <Text
                      style={
                        styles.productPrice
                      }
                    >
                      GH₵{" "}
                      {product.sellingPrice.toFixed(
                        2
                      )}
                    </Text>

                    <Text
                      style={[
                        styles.stockText,
                        product.stockQuantity <=
                          product.lowStockThreshold &&
                          styles.lowStock,
                      ]}
                    >
                      Stock:{" "}
                      {
                        product.stockQuantity
                      }{" "}
                      {product.unit}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.productAddArea
                    }
                  >
                    {cartItem ? (
                      <View
                        style={
                          styles.inCartBadge
                        }
                      >
                        <Text
                          style={
                            styles.inCartText
                          }
                        >
                          {cartItem.quantity}{" "}
                          in cart
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.addIcon,
                        product.stockQuantity <=
                          0 &&
                          styles.disabledAddIcon,
                      ]}
                    >
                      <MaterialIcons
                        name="add"
                        size={22}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          )
        )}

          </ScrollView>
        </View>

        {/* CART */}

        <View style={styles.cartHeader}>
          <Text style={styles.sectionTitle}>
            Cart
          </Text>

          {cart.length > 0 ? (
            <Text style={styles.cartCount}>
              {cart.length}{" "}
              {cart.length === 1
                ? "item"
                : "items"}
            </Text>
          ) : null}
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <MaterialIcons
              name="shopping-cart"
              size={42}
              color="#BBB"
            />

            <Text
              style={styles.emptyCartTitle}
            >
              Cart is empty
            </Text>

            <Text
              style={styles.emptyCartText}
            >
              Tap a product above to add it
              to the sale.
            </Text>
          </View>
        ) : (
          <>
            {cart.map((item) => (
              <View
                key={item.productId}
                style={styles.cartItem}
              >
                <View
                  style={
                    styles.cartItemInfo
                  }
                >
                  <Text
                    style={
                      styles.cartItemName
                    }
                    numberOfLines={1}
                  >
                    {item.productName}
                  </Text>

                  <Text
                    style={
                      styles.cartItemPrice
                    }
                  >
                    GH₵{" "}
                    {item.unitPrice.toFixed(
                      2
                    )}{" "}
                    × {item.quantity}
                  </Text>
                </View>

                <View
                  style={
                    styles.quantityControls
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.quantityButton
                    }
                    onPress={() =>
                      decreaseQuantity(
                        item.productId
                      )
                    }
                  >
                    <MaterialIcons
                      name="remove"
                      size={19}
                      color="#555"
                    />
                  </TouchableOpacity>

                  <Text
                    style={
                      styles.quantityText
                    }
                  >
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.quantityButton
                    }
                    onPress={() =>
                      increaseQuantity(
                        item.productId
                      )
                    }
                  >
                    <MaterialIcons
                      name="add"
                      size={19}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={
                    styles.cartItemTotal
                  }
                >
                  GH₵{" "}
                  {(
                    item.quantity *
                    item.unitPrice
                  ).toFixed(2)}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    removeFromCart(
                      item.productId
                    )
                  }
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={22}
                    color="#D32F2F"
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* TOTAL */}

            <View style={styles.totalCard}>
              <View
                style={styles.totalRow}
              >
                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  Subtotal
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  GH₵{" "}
                  {subtotal.toFixed(2)}
                </Text>
              </View>

              <View
                style={styles.totalRow}
              >
                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  Discount
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  GH₵{" "}
                  {discountAmount.toFixed(
                    2
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.totalRow,
                  styles.grandTotalRow,
                ]}
              >
                <Text
                  style={
                    styles.grandTotalLabel
                  }
                >
                  Total
                </Text>

                <Text
                  style={
                    styles.grandTotalValue
                  }
                >
                  GH₵{" "}
                  {total.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.checkoutButton
                }
                activeOpacity={0.8}
                onPress={openCheckout}
              >
                <MaterialIcons
                  name="payments"
                  size={22}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.checkoutButtonText
                  }
                >
                  CHECKOUT
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
{showScanner ? (
  <View style={styles.scannerOverlay}>
    <View style={styles.scannerContainer}>
      <View style={styles.scannerHeader}>
        <Text style={styles.scannerTitle}>
          Scan Barcode
        </Text>

        <TouchableOpacity
          onPress={() => {
            setShowScanner(false);
            setScanning(false);
          }}
        >
          <MaterialIcons
            name="close"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
            "code128",
            "code39",
            "code93",
            "itf14",
          ],
        }}
        onBarcodeScanned={
          scanning
            ? undefined
            : handleBarcodeScanned
        }
      >
        <View style={styles.scanFrame}>
          <View style={styles.scanCornerTopLeft} />
          <View style={styles.scanCornerTopRight} />
          <View style={styles.scanCornerBottomLeft} />
          <View style={styles.scanCornerBottomRight} />
        </View>

        <View style={styles.scanInstructionContainer}>
          <Text style={styles.scanInstruction}>
            Position the barcode inside the frame
          </Text>
        </View>
      </CameraView>
    </View>
  </View>
) : null}
      {/* =========================
          CHECKOUT
      ========================= */}

      {showCheckout ? (
        <View
          style={styles.checkoutOverlay}
        >
          <View
            style={styles.checkoutModal}
          >
            <View
              style={
                styles.checkoutHeader
              }
            >
              <Text
                style={
                  styles.checkoutTitle
                }
              >
                Checkout
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowCheckout(false)
                }
              >
                <MaterialIcons
                  name="close"
                  size={27}
                  color="#555"
                />
              </TouchableOpacity>
            </View>

            <View
              style={styles.checkoutTotal}
            >
              <Text
                style={
                  styles.checkoutTotalLabel
                }
              >
                Amount Due
              </Text>

              <Text
                style={
                  styles.checkoutTotalValue
                }
              >
                GH₵{" "}
                {total.toFixed(2)}
              </Text>
            </View>

            <Text style={styles.label}>
              Discount
            </Text>

            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>
              Amount Paid *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter amount paid"
              value={amountPaid}
              onChangeText={setAmountPaid}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={styles.label}>
              Payment Method
            </Text>

            <View
              style={
                styles.paymentMethods
              }
            >
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod ===
                    "cash" &&
                    styles.selectedPayment,
                ]}
                onPress={() =>
                  setPaymentMethod(
                    "cash"
                  )
                }
              >
                <MaterialIcons
                  name="payments"
                  size={21}
                  color={
                    paymentMethod ===
                    "cash"
                      ? "#FFFFFF"
                      : "#555"
                  }
                />

                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod ===
                      "cash" &&
                      styles.selectedPaymentText,
                  ]}
                >
                  Cash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod ===
                    "mobile_money" &&
                    styles.selectedPayment,
                ]}
                onPress={() =>
                  setPaymentMethod(
                    "mobile_money"
                  )
                }
              >
                <MaterialIcons
                  name="phone-android"
                  size={21}
                  color={
                    paymentMethod ===
                    "mobile_money"
                      ? "#FFFFFF"
                      : "#555"
                  }
                />

                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod ===
                      "mobile_money" &&
                      styles.selectedPaymentText,
                  ]}
                >
                  Mobile Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod ===
                    "card" &&
                    styles.selectedPayment,
                ]}
                onPress={() =>
                  setPaymentMethod(
                    "card"
                  )
                }
              >
                <MaterialIcons
                  name="credit-card"
                  size={21}
                  color={
                    paymentMethod ===
                    "card"
                      ? "#FFFFFF"
                      : "#555"
                  }
                />

                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod ===
                      "card" &&
                      styles.selectedPaymentText,
                  ]}
                >
                  Card
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={styles.changeBox}
            >
              <Text
                style={styles.changeLabel}
              >
                Change
              </Text>

              <Text
                style={styles.changeValue}
              >
                GH₵{" "}
                {change.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.completeButton,
                processingSale &&
                  styles.disabledButton,
              ]}
              onPress={completeSale}
              disabled={processingSale}
            >
              {processingSale ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <MaterialIcons
                    name="check-circle"
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.completeButtonText
                    }
                  >
                    COMPLETE SALE
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },

  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 29,
    fontWeight: "700",
    color: "#222",
  },
  productList:{
    flex: 1,
    marginBottom: 14,
  },
  productListContent: {
    paddingBottom: 10,
  },
  productSection: {
    flex: 1,
  },

  subtitle: {
    marginTop: 5,
    color: "#777",
    fontSize: 14,
  },
searchRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 24,
},

scanButton: {
  width: 50,
  height: 50,
  borderRadius: 12,
  backgroundColor: "#1E88E5",
  justifyContent: "center",
  alignItems: "center",
  marginLeft: 8,
},

scannerOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "#000000",
  justifyContent: "center",
  zIndex: 100,
},

scannerContainer: {
  flex: 1,
  backgroundColor: "#000000",
},

scannerHeader: {
  height: 65,
  backgroundColor: "#000000",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 20,
},

scannerTitle: {
  color: "#FFFFFF",
  fontSize: 20,
  fontWeight: "700",
},

camera: {
  flex: 1,
},

scanFrame: {
  position: "absolute",
  width: 270,
  height: 170,
  top: "40%",
  left: "50%",
  marginLeft: -135,
  marginTop: -85,
},

scanCornerTopLeft: {
  position: "absolute",
  top: 0,
  left: 0,
  width: 35,
  height: 35,
  borderTopWidth: 4,
  borderLeftWidth: 4,
  borderColor: "#FFFFFF",
},

scanCornerTopRight: {
  position: "absolute",
  top: 0,
  right: 0,
  width: 35,
  height: 35,
  borderTopWidth: 4,
  borderRightWidth: 4,
  borderColor: "#FFFFFF",
},

scanCornerBottomLeft: {
  position: "absolute",
  bottom: 0,
  left: 0,
  width: 35,
  height: 35,
  borderBottomWidth: 4,
  borderLeftWidth: 4,
  borderColor: "#FFFFFF",
},

scanCornerBottomRight: {
  position: "absolute",
  bottom: 0,
  right: 0,
  width: 35,
  height: 35,
  borderBottomWidth: 4,
  borderRightWidth: 4,
  borderColor: "#FFFFFF",
},

scanInstructionContainer: {
  position: "absolute",
  bottom: 70,
  left: 0,
  right: 0,
  alignItems: "center",
},

scanInstruction: {
  color: "#FFFFFF",
  fontSize: 15,
  backgroundColor: "rgba(0,0,0,0.65)",
  paddingHorizontal: 18,
  paddingVertical: 10,
  borderRadius: 20,
},
  searchContainer: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 9,
    color: "#222",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },

  loader: {
    marginTop: 40,
  },

  emptyProducts: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
  },

  emptyProductsText: {
    color: "#888",
    marginTop: 10,
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 13,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },

  outOfStockCard: {
    opacity: 0.55,
  },

  productIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  productMeta: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },

  productPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E88E5",
    marginTop: 4,
  },

  stockText: {
    fontSize: 11,
    color: "#2E7D32",
    marginTop: 3,
  },

  lowStock: {
    color: "#D32F2F",
  },

  productAddArea: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  inCartBadge: {
    marginBottom: 5,
  },

  inCartText: {
    fontSize: 10,
    color: "#1E88E5",
    fontWeight: "600",
  },

  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1E88E5",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledAddIcon: {
    backgroundColor: "#AAA",
  },

  cartHeader: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cartCount: {
    fontSize: 13,
    color: "#888",
  },

  emptyCart: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
  },

  emptyCartTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#444",
    marginTop: 10,
  },

  emptyCartText: {
    color: "#888",
    textAlign: "center",
    marginTop: 5,
  },

  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },

  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },

  cartItemPrice: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
  },

  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
  },

  quantityText: {
    width: 30,
    textAlign: "center",
    fontWeight: "600",
    color: "#333",
  },

  cartItemTotal: {
    width: 72,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    marginRight: 9,
  },

  totalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 17,
    marginTop: 8,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  totalLabel: {
    fontSize: 14,
    color: "#666",
  },

  totalValue: {
    fontSize: 14,
    color: "#333",
  },

  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 12,
    marginTop: 3,
  },

  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  grandTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E88E5",
  },

  checkoutButton: {
    height: 52,
    backgroundColor: "#1E88E5",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },

  checkoutOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  checkoutModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
  },

  checkoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  checkoutTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#222",
  },

  checkoutTotal: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 15,
  },

  checkoutTotalLabel: {
    color: "#555",
    fontSize: 13,
  },

  checkoutTotalValue: {
    color: "#1E88E5",
    fontSize: 27,
    fontWeight: "700",
    marginTop: 3,
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
    borderRadius: 9,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
  },

  paymentMethods: {
    flexDirection: "row",
    gap: 7,
  },

  paymentButton: {
    flex: 1,
    minHeight: 45,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 5,
  },

  selectedPayment: {
    backgroundColor: "#1E88E5",
    borderColor: "#1E88E5",
  },

  paymentButtonText: {
    fontSize: 11,
    color: "#555",
    fontWeight: "600",
    marginLeft: 4,
  },

  selectedPaymentText: {
    color: "#FFFFFF",
  },

  changeBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 14,
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  changeLabel: {
    color: "#2E7D32",
    fontWeight: "600",
  },

  changeValue: {
    color: "#2E7D32",
    fontSize: 20,
    fontWeight: "700",
  },

  completeButton: {
    height: 52,
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 18,
  },

  disabledButton: {
    opacity: 0.6,
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 7,
    fontSize: 14,
  },
});