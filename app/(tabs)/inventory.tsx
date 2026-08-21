import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";

import { MaterialIcons } from "@expo/vector-icons";

import { useFocusEffect } from "expo-router";

import { useAuth } from "../../context/AuthContext";

import productService, {
  Product,
} from "../../services/product.service";

export default function InventoryScreen() {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // BARCODE SCANNER
  // =========================

  const [showScanner, setShowScanner] = useState(false);

  const [scannerTarget, setScannerTarget] = useState<
    "add" | "edit"
  >("add");

  const [scannerBarcodeIndex, setScannerBarcodeIndex] =
    useState<number | null>(null);

  const [permission, requestPermission] =
    useCameraPermissions();

  // =========================
  // ADD PRODUCT
  // =========================

  const [showAddProduct, setShowAddProduct] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");

  const [sku, setSku] = useState("");

  const [barcodes, setBarcodes] = useState<string[]>([
    "",
  ]);

  const [category, setCategory] = useState("");

  const [buyingPrice, setBuyingPrice] = useState("");

  const [sellingPrice, setSellingPrice] = useState("");

  const [lowStockThreshold, setLowStockThreshold] =
    useState("5");

  const [unit, setUnit] = useState("pcs");

  // =========================
  // EDIT PRODUCT
  // =========================

  const [showEditProduct, setShowEditProduct] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [editName, setEditName] = useState("");

  const [editSku, setEditSku] = useState("");

  const [editBarcode, setEditBarcode] = useState("");

  const [editCategory, setEditCategory] = useState("");

  const [editBuyingPrice, setEditBuyingPrice] =
    useState("");

  const [editSellingPrice, setEditSellingPrice] =
    useState("");

  const [editLowStockThreshold, setEditLowStockThreshold] =
    useState("");

  const [editUnit, setEditUnit] = useState("pcs");

  const [updating, setUpdating] = useState(false);

  // =========================
  // STOCK IN
  // =========================

  const [showStockIn, setShowStockIn] =
    useState(false);

  const [stockInProduct, setStockInProduct] =
    useState<Product | null>(null);

  const [stockInQuantity, setStockInQuantity] =
    useState("");

  const [stockInReference, setStockInReference] =
    useState("");

  const [stockInNotes, setStockInNotes] =
    useState("");

  const [stockingIn, setStockingIn] =
    useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  // =========================
  // ADD PRODUCT BARCODE HELPERS
  // =========================

  const addBarcodeField = () => {
    setBarcodes((current) => [
      ...current,
      "",
    ]);
  };

  const updateBarcode = (
    index: number,
    value: string
  ) => {
    setBarcodes((current) =>
      current.map((barcode, currentIndex) =>
        currentIndex === index
          ? value
          : barcode
      )
    );
  };

  const removeBarcodeField = (
    index: number
  ) => {
    setBarcodes((current) => {
      if (current.length === 1) {
        return [""];
      }

      return current.filter(
        (_, currentIndex) =>
          currentIndex !== index
      );
    });
  };

  // =========================
  // BARCODE SCANNER
  // =========================

  const openScanner = async (
    target: "add" | "edit",
    barcodeIndex?: number
  ) => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result =
        await requestPermission();

      if (!result.granted) {
        Alert.alert(
          "Camera Permission",
          "Camera permission is required to scan barcodes."
        );

        return;
      }
    }

    setScannerTarget(target);

    if (
      target === "add" &&
      typeof barcodeIndex === "number"
    ) {
      setScannerBarcodeIndex(
        barcodeIndex
      );
    } else {
      setScannerBarcodeIndex(null);
    }

    setShowScanner(true);
  };

  const handleBarcodeScanned = ({
    data,
  }: {
    data: string;
  }) => {
    if (!data) {
      return;
    }

    const scannedBarcode = data.trim();

    if (!scannedBarcode) {
      return;
    }

    setShowScanner(false);

    if (scannerTarget === "add") {
      const targetIndex =
        scannerBarcodeIndex ?? 0;

      setBarcodes((current) =>
        current.map(
          (barcode, index) =>
            index === targetIndex
              ? scannedBarcode
              : barcode
        )
      );
    } else {
      setEditBarcode(
        scannedBarcode
      );
    }

    setScannerBarcodeIndex(null);

    Alert.alert(
      "Barcode Scanned",
      `Barcode: ${scannedBarcode}`
    );
  };

  // =========================
  // ADD PRODUCT
  // =========================

  const resetForm = () => {
    setName("");

    setSku("");

    setBarcodes([""]);

    setCategory("");

    setBuyingPrice("");

    setSellingPrice("");

    setLowStockThreshold("5");

    setUnit("pcs");
  };

  const handleAddProduct = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Validation",
        "Please enter the product name."
      );

      return;
    }

    if (!sellingPrice.trim()) {
      Alert.alert(
        "Validation",
        "Please enter the selling price."
      );

      return;
    }

    const buying = Number(
      buyingPrice || 0
    );

    const selling = Number(
      sellingPrice
    );

    const threshold = Number(
      lowStockThreshold || 0
    );

    if (
      Number.isNaN(buying) ||
      buying < 0
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid buying price."
      );

      return;
    }

    if (
      Number.isNaN(selling) ||
      selling < 0
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid selling price."
      );

      return;
    }

    if (
      Number.isNaN(threshold) ||
      threshold < 0
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid low-stock threshold."
      );

      return;
    }

    // ----------------------------------
    // CLEAN BARCODE LIST
    // ----------------------------------

    const cleanedBarcodes =
      barcodes
        .map((value) =>
          value.trim()
        )
        .filter(Boolean);

    // ----------------------------------
    // CHECK FOR DUPLICATE BARCODES
    // ----------------------------------

    const uniqueBarcodes =
      new Set(cleanedBarcodes);

    if (
      uniqueBarcodes.size !==
      cleanedBarcodes.length
    ) {
      Alert.alert(
        "Validation",
        "The same barcode cannot be added more than once to the same product."
      );

      return;
    }

    try {
      setSaving(true);

      await productService.createProduct({
        name: name.trim(),

        sku: sku.trim(),

        barcodes:
          cleanedBarcodes.map(
            (barcode, index) => ({
              barcode,

              barcodeType:
                "unknown",

              unitQuantity: 1,

              isPrimary:
                index === 0,
            })
          ),

        category:
          category.trim(),

        buyingPrice: buying,

        sellingPrice: selling,

        lowStockThreshold:
          threshold,

        unit:
          unit.trim() || "pcs",
      });

      Alert.alert(
        "Success",
        "Product created successfully."
      );

      resetForm();

      setShowAddProduct(false);

      await loadProducts();
    } catch (error) {
      console.error(
        "Failed to create product:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to create product.";

      Alert.alert(
        "Error",
        message
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT PRODUCT
  // =========================

  const openEditProduct = (
    product: Product
  ) => {
    setEditingProduct(product);

    setEditName(product.name);

    setEditSku(
      product.sku ?? ""
    );

    setEditBarcode(
      product.barcode ?? ""
    );

    setEditCategory(
      product.category ?? ""
    );

    setEditBuyingPrice(
      product.buyingPrice.toString()
    );

    setEditSellingPrice(
      product.sellingPrice.toString()
    );

    setEditLowStockThreshold(
      product.lowStockThreshold.toString()
    );

    setEditUnit(product.unit);

    setShowEditProduct(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) {
      return;
    }

    if (!editName.trim()) {
      Alert.alert(
        "Validation",
        "Please enter the product name."
      );

      return;
    }

    const buying =
      Number(editBuyingPrice);

    const selling =
      Number(editSellingPrice);

    const threshold =
      Number(editLowStockThreshold);

    if (
      Number.isNaN(buying) ||
      buying < 0
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid buying price."
      );

      return;
    }

    if (
      Number.isNaN(selling) ||
      selling < 0
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid selling price."
      );

      return;
    }

    if (
      Number.isNaN(threshold) ||
      threshold < 0
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid low-stock threshold."
      );

      return;
    }

    try {
      setUpdating(true);

      await productService.updateProduct(
        editingProduct.id,
        {
          name: editName,

          sku: editSku,

          barcode: editBarcode,

          category: editCategory,

          buyingPrice: buying,

          sellingPrice: selling,

          lowStockThreshold:
            threshold,

          unit: editUnit,
        }
      );

      Alert.alert(
        "Success",
        "Product updated successfully."
      );

      setShowEditProduct(false);

      setEditingProduct(null);

      await loadProducts();
    } catch (error) {
      console.error(
        "Failed to update product:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update product.";

      Alert.alert(
        "Error",
        message
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================
  // DELETE PRODUCT
  // =========================

  const handleDeleteProduct = (
    product: Product
  ) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete ${product.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              await productService.deleteProduct(
                product.id
              );

              Alert.alert(
                "Success",
                "Product deleted successfully."
              );

              await loadProducts();
            } catch (error) {
              console.error(
                "Failed to delete product:",
                error
              );

              const message =
                error instanceof Error
                  ? error.message
                  : "Unable to delete product.";

              Alert.alert(
                "Error",
                message
              );
            }
          },
        },
      ]
    );
  };

  // =========================
  // STOCK IN
  // =========================

  const resetStockInForm = () => {
    setStockInProduct(null);

    setStockInQuantity("");

    setStockInReference("");

    setStockInNotes("");
  };

  const openStockIn = () => {
    if (products.length === 0) {
      Alert.alert(
        "No Products",
        "Please create a product before adding stock."
      );

      return;
    }

    resetStockInForm();

    setShowStockIn(true);
  };

  const handleStockIn = async () => {
    if (!stockInProduct) {
      Alert.alert(
        "Validation",
        "Please select a product."
      );

      return;
    }

    const quantity =
      Number(stockInQuantity);

    if (
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      Alert.alert(
        "Validation",
        "Please enter a quantity greater than zero."
      );

      return;
    }

    if (!user?.id) {
      Alert.alert(
        "Error",
        "Unable to identify the current user."
      );

      return;
    }

    try {
      setStockingIn(true);

      await productService.adjustStock(
        stockInProduct.id,
        quantity,
        "in",
        user.id,
        stockInReference.trim() ||
          undefined,
        stockInNotes.trim() ||
          undefined
      );

      Alert.alert(
        "Success",
        `${quantity} ${stockInProduct.unit} added to ${stockInProduct.name}.`
      );

      resetStockInForm();

      setShowStockIn(false);

      await loadProducts();
    } catch (error) {
      console.error(
        "Failed to add stock:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to add stock.";

      Alert.alert(
        "Error",
        message
      );
    } finally {
      setStockingIn(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Inventory
            </Text>

            <Text
              style={styles.subtitle}
            >
              Manage your products and stock
            </Text>
          </View>

          <View
            style={styles.headerButtons}
          >
            <TouchableOpacity
              style={
                styles.stockInButton
              }
              onPress={openStockIn}
            >
              <MaterialIcons
                name="add-box"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.headerButtonText
                }
              >
                Stock In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                setShowAddProduct(
                  true
                )
              }
            >
              <MaterialIcons
                name="add"
                size={22}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.addButtonText
                }
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PRODUCTS */}

        {loading ? (
          <ActivityIndicator
            size="large"
            style={styles.loader}
          />
        ) : products.length ===
          0 ? (
          <View
            style={styles.emptyState}
          >
            <MaterialIcons
              name="inventory-2"
              size={55}
              color="#BBBBBB"
            />

            <Text
              style={styles.emptyTitle}
            >
              No Products
            </Text>

            <Text
              style={styles.emptyText}
            >
              Add your first product to
              start managing inventory.
            </Text>
          </View>
        ) : (
          products.map((product) => (
            <View
              key={product.id}
              style={styles.productCard}
            >
              <View
                style={
                  styles.productIcon
                }
              >
                <MaterialIcons
                  name="inventory-2"
                  size={25}
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
                >
                  {product.name}
                </Text>

                {product.sku ? (
                  <Text
                    style={
                      styles.productMeta
                    }
                  >
                    SKU: {product.sku}
                  </Text>
                ) : null}

                {product.barcode ? (
                  <Text
                    style={
                      styles.productMeta
                    }
                  >
                    Barcode:{" "}
                    {product.barcode}
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.productPrice
                  }
                >
                  Selling: GH₵{" "}
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
                  {product.stockQuantity}{" "}
                  {product.unit}
                </Text>
              </View>

              <View
                style={
                  styles.productActions
                }
              >
                <TouchableOpacity
                  style={
                    styles.editButton
                  }
                  onPress={() =>
                    openEditProduct(
                      product
                    )
                  }
                >
                  <MaterialIcons
                    name="edit"
                    size={21}
                    color="#1E88E5"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.deleteButton
                  }
                  onPress={() =>
                    handleDeleteProduct(
                      product
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
            </View>
          ))
        )}
      </ScrollView>

      {/* =========================
          ADD PRODUCT MODAL
      ========================= */}

      <Modal
        visible={showAddProduct}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowAddProduct(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View style={styles.modal}>
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Add Product
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowAddProduct(
                    false
                  )
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
              <Text
                style={styles.label}
              >
                Product Name *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={name}
                onChangeText={setName}
              />

              <Text
                style={styles.label}
              >
                SKU
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Optional"
                value={sku}
                onChangeText={setSku}
                autoCapitalize="none"
              />

              {/* MULTIPLE BARCODES */}

              <Text
                style={styles.label}
              >
                Barcodes
              </Text>

              <Text
                style={
                  styles.barcodeHint
                }
              >
                Add one or more barcodes for this product.
                The first barcode will be the primary barcode.
              </Text>

              {barcodes.map(
                (barcode, index) => (
                  <View
                    key={index}
                    style={
                      styles.multipleBarcodeRow
                    }
                  >
                    <View
                      style={
                        styles.barcodeNumber
                      }
                    >
                      <Text
                        style={
                          styles.barcodeNumberText
                        }
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <TextInput
                      style={
                        styles.multipleBarcodeInput
                      }
                      placeholder={
                        index === 0
                          ? "Primary barcode"
                          : "Additional barcode"
                      }
                      value={barcode}
                      onChangeText={(
                        value
                      ) =>
                        updateBarcode(
                          index,
                          value
                        )
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <TouchableOpacity
                      style={
                        styles.barcodeScanButton
                      }
                      onPress={() =>
                        openScanner(
                          "add",
                          index
                        )
                      }
                    >
                      <MaterialIcons
                        name="qr-code-scanner"
                        size={22}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>

                    {barcodes.length >
                      1 && (
                      <TouchableOpacity
                        style={
                          styles.removeBarcodeButton
                        }
                        onPress={() =>
                          removeBarcodeField(
                            index
                          )
                        }
                      >
                        <MaterialIcons
                          name="close"
                          size={21}
                          color="#D32F2F"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )
              )}

              <TouchableOpacity
                style={
                  styles.addBarcodeButton
                }
                onPress={
                  addBarcodeField
                }
              >
                <MaterialIcons
                  name="add"
                  size={20}
                  color="#1E88E5"
                />

                <Text
                  style={
                    styles.addBarcodeText
                  }
                >
                  Add Another Barcode
                </Text>
              </TouchableOpacity>

              <Text
                style={styles.label}
              >
                Category
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Drinks"
                value={category}
                onChangeText={
                  setCategory
                }
              />

              <Text
                style={styles.label}
              >
                Buying Price
              </Text>

              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={buyingPrice}
                onChangeText={
                  setBuyingPrice
                }
                keyboardType="decimal-pad"
              />

              <Text
                style={styles.label}
              >
                Selling Price *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={sellingPrice}
                onChangeText={
                  setSellingPrice
                }
                keyboardType="decimal-pad"
              />

              <Text
                style={styles.label}
              >
                Low Stock Alert
              </Text>

              <TextInput
                style={styles.input}
                placeholder="5"
                value={
                  lowStockThreshold
                }
                onChangeText={
                  setLowStockThreshold
                }
                keyboardType="numeric"
              />

              <Text
                style={styles.label}
              >
                Unit
              </Text>

              <TextInput
                style={styles.input}
                placeholder="pcs"
                value={unit}
                onChangeText={setUnit}
              />

              <TouchableOpacity
                style={
                  styles.saveButton
                }
                onPress={
                  handleAddProduct
                }
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    CREATE PRODUCT
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =========================
          EDIT PRODUCT MODAL
      ========================= */}

      <Modal
        visible={showEditProduct}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowEditProduct(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View style={styles.modal}>
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Edit Product
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowEditProduct(
                    false
                  )
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
              <Text
                style={styles.label}
              >
                Product Name *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={editName}
                onChangeText={
                  setEditName
                }
              />

              <Text
                style={styles.label}
              >
                SKU
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Optional"
                value={editSku}
                onChangeText={
                  setEditSku
                }
                autoCapitalize="none"
              />

              <Text
                style={styles.label}
              >
                Barcode
              </Text>

              <View
                style={
                  styles.barcodeInputRow
                }
              >
                <TextInput
                  style={
                    styles.barcodeInput
                  }
                  placeholder="Scan or enter barcode"
                  value={
                    editBarcode
                  }
                  onChangeText={
                    setEditBarcode
                  }
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={
                    styles.scanButton
                  }
                  onPress={() =>
                    openScanner("edit")
                  }
                >
                  <MaterialIcons
                    name="qr-code-scanner"
                    size={23}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.scanButtonText
                    }
                  >
                    Scan
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={styles.label}
              >
                Category
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Drinks"
                value={
                  editCategory
                }
                onChangeText={
                  setEditCategory
                }
              />

              <Text
                style={styles.label}
              >
                Buying Price
              </Text>

              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={
                  editBuyingPrice
                }
                onChangeText={
                  setEditBuyingPrice
                }
                keyboardType="decimal-pad"
              />

              <Text
                style={styles.label}
              >
                Selling Price *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={
                  editSellingPrice
                }
                onChangeText={
                  setEditSellingPrice
                }
                keyboardType="decimal-pad"
              />

              <Text
                style={styles.label}
              >
                Low Stock Alert
              </Text>

              <TextInput
                style={styles.input}
                placeholder="5"
                value={
                  editLowStockThreshold
                }
                onChangeText={
                  setEditLowStockThreshold
                }
                keyboardType="numeric"
              />

              <Text
                style={styles.label}
              >
                Unit
              </Text>

              <TextInput
                style={styles.input}
                placeholder="pcs"
                value={editUnit}
                onChangeText={
                  setEditUnit
                }
              />

              <TouchableOpacity
                style={
                  styles.saveButton
                }
                onPress={
                  handleUpdateProduct
                }
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    SAVE CHANGES
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =========================
          STOCK IN MODAL
      ========================= */}

      <Modal
        visible={showStockIn}
        animationType="slide"
        transparent
        onRequestClose={() => {
          resetStockInForm();
          setShowStockIn(false);
        }}
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View style={styles.modal}>
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Stock In
              </Text>

              <TouchableOpacity
                onPress={() => {
                  resetStockInForm();

                  setShowStockIn(
                    false
                  );
                }}
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
              <Text
                style={styles.label}
              >
                Select Product *
              </Text>

              {products.map(
                (product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.stockProductOption,
                      stockInProduct?.id ===
                        product.id &&
                        styles.selectedStockProduct,
                    ]}
                    onPress={() =>
                      setStockInProduct(
                        product
                      )
                    }
                  >
                    <View
                      style={
                        styles.stockProductInfo
                      }
                    >
                      <Text
                        style={
                          styles.stockProductName
                        }
                      >
                        {product.name}
                      </Text>

                      <Text
                        style={
                          styles.stockProductMeta
                        }
                      >
                        Current stock:{" "}
                        {
                          product.stockQuantity
                        }{" "}
                        {product.unit}
                      </Text>
                    </View>

                    {stockInProduct?.id ===
                    product.id ? (
                      <MaterialIcons
                        name="check-circle"
                        size={24}
                        color="#1E88E5"
                      />
                    ) : null}
                  </TouchableOpacity>
                )
              )}

              <Text
                style={styles.label}
              >
                Quantity *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                value={
                  stockInQuantity
                }
                onChangeText={
                  setStockInQuantity
                }
                keyboardType="decimal-pad"
              />

              <Text
                style={styles.label}
              >
                Reference
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Supplier invoice number"
                value={
                  stockInReference
                }
                onChangeText={
                  setStockInReference
                }
              />

              <Text
                style={styles.label}
              >
                Notes
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.notesInput,
                ]}
                placeholder="Optional notes"
                value={stockInNotes}
                onChangeText={
                  setStockInNotes
                }
                multiline
                textAlignVertical="top"
              />

              {stockInProduct ? (
                <View
                  style={
                    styles.stockSummary
                  }
                >
                  <Text
                    style={
                      styles.stockSummaryTitle
                    }
                  >
                    Stock Summary
                  </Text>

                  <Text
                    style={
                      styles.stockSummaryText
                    }
                  >
                    Current:{" "}
                    {
                      stockInProduct.stockQuantity
                    }{" "}
                    {
                      stockInProduct.unit
                    }
                  </Text>

                  {Number(
                    stockInQuantity
                  ) > 0 ? (
                    <Text
                      style={
                        styles.stockSummaryText
                      }
                    >
                      After stock in:{" "}
                      {(
                        stockInProduct.stockQuantity +
                        Number(
                          stockInQuantity
                        )
                      ).toString()}{" "}
                      {
                        stockInProduct.unit
                      }
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <TouchableOpacity
                style={
                  styles.saveButton
                }
                onPress={
                  handleStockIn
                }
                disabled={stockingIn}
              >
                {stockingIn ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    ADD STOCK
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =========================
          BARCODE SCANNER
      ========================= */}

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() =>
          setShowScanner(false)
        }
      >
        <View
          style={
            styles.scannerContainer
          }
        >
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
                "codabar",
                "itf14",
              ],
            }}
            onBarcodeScanned={
              showScanner
                ? handleBarcodeScanned
                : undefined
            }
          />

          <View
            style={
              styles.scannerOverlay
            }
          >
            <View
              style={
                styles.scannerTopBar
              }
            >
              <TouchableOpacity
                style={
                  styles.closeScannerButton
                }
                onPress={() =>
                  setShowScanner(
                    false
                  )
                }
              >
                <MaterialIcons
                  name="close"
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.scannerTitle
                }
              >
                Scan Barcode
              </Text>

              <View
                style={
                  styles.scannerSpacer
                }
              />
            </View>

            <View
              style={
                styles.scanFrame
              }
            >
              <View
                style={[
                  styles.corner,
                  styles.topLeft,
                ]}
              />

              <View
                style={[
                  styles.corner,
                  styles.topRight,
                ]}
              />

              <View
                style={[
                  styles.corner,
                  styles.bottomLeft,
                ]}
              />

              <View
                style={[
                  styles.corner,
                  styles.bottomRight,
                ]}
              />
            </View>

            <View
              style={
                styles.scannerBottom
              }
            >
              <Text
                style={
                  styles.scannerInstruction
                }
              >
                Position the barcode inside
                the frame
              </Text>

              <TouchableOpacity
                style={
                  styles.cancelScanButton
                }
                onPress={() =>
                  setShowScanner(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelScanText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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

  header: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },

  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },

  stockInButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 4,
  },

  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },

  loader: {
    marginTop: 50,
  },

  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 15,
  },

  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 8,
    lineHeight: 20,
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
  },

  productMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },

  productPrice: {
    fontSize: 13,
    color: "#555",
    marginTop: 5,
  },

  stockText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
    marginTop: 3,
  },

  lowStock: {
    color: "#D32F2F",
  },

  productActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  editButton: {
    padding: 8,
  },

  deleteButton: {
    padding: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
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

  // =========================
  // MULTIPLE BARCODE STYLES
  // =========================

  barcodeHint: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    marginBottom: 8,
  },

  multipleBarcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  barcodeNumber: {
    width: 28,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  barcodeNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E88E5",
  },

  multipleBarcodeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
  },

  barcodeScanButton: {
    width: 48,
    height: 48,
    marginLeft: 6,
    borderRadius: 8,
    backgroundColor: "#1E88E5",
    alignItems: "center",
    justifyContent: "center",
  },

  removeBarcodeButton: {
    width: 40,
    height: 48,
    marginLeft: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEBEE",
  },

  addBarcodeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },

  addBarcodeText: {
    color: "#1E88E5",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },

  barcodeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  barcodeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
  },

  scanButton: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1E88E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  scanButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 5,
  },

  notesInput: {
    height: 90,
    paddingTop: 12,
  },

  saveButton: {
    marginTop: 25,
    backgroundColor: "#1E88E5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  stockProductOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },

  selectedStockProduct: {
    borderColor: "#1E88E5",
    backgroundColor: "#E3F2FD",
  },

  stockProductInfo: {
    flex: 1,
  },

  stockProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },

  stockProductMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  stockSummary: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },

  stockSummaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 6,
  },

  stockSummaryText: {
    fontSize: 14,
    color: "#444",
    marginTop: 3,
  },

  // =========================
  // SCANNER
  // =========================

  scannerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  camera: {
    flex: 1,
  },

  scannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },

  scannerTopBar: {
    height: 100,
    paddingTop: 45,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor:
      "rgba(0,0,0,0.45)",
  },

  closeScannerButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor:
      "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  scannerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },

  scannerSpacer: {
    width: 45,
  },

  scanFrame: {
    width: 280,
    height: 150,
    alignSelf: "center",
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 35,
    height: 35,
    borderColor: "#FFFFFF",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  scannerBottom: {
    paddingBottom: 45,
    paddingHorizontal: 30,
    alignItems: "center",
    backgroundColor:
      "rgba(0,0,0,0.45)",
  },

  scannerInstruction: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },

  cancelScanButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 35,
    paddingVertical: 12,
    borderRadius: 25,
  },

  cancelScanText: {
    color: "#222",
    fontSize: 15,
    fontWeight: "600",
  },
});