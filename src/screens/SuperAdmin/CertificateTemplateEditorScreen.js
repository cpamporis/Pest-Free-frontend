// SuperAdmin/CertificateTemplateEditorScreen.js
import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Alert,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import apiService from "../../services/apiService";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

const FIELD_CATALOG = [
  {
    field: "organization.logo",
    label: "Organization Logo",
    type: "image",
    width: 120,
    height: 70
  },
  {
    field: "organization.name",
    label: "Organization Name",
    type: "text",
    width: 220,
    height: 28
  },
  {
    field: "organization.details",
    label: "Organization Details",
    type: "text",
    width: 250,
    height: 80
  },
  {
    field: "certificate.serviceDate",
    label: "Service Date",
    type: "text",
    width: 100,
    height: 24
  },
  {
    field: "customer.name",
    label: "Customer Name",
    type: "text",
    width: 210,
    height: 24
  },
  {
    field: "customer.address",
    label: "Customer Address",
    type: "text",
    width: 240,
    height: 30
  },
  {
    field: "customer.tin",
    label: "Customer TIN / ΑΦΜ",
    type: "text",
    width: 120,
    height: 24
  },
  {
    field: "customer.ama",
    label: "Customer AMA",
    type: "text",
    width: 120,
    height: 24
  },
  {
    field: "organization.applicatorName",
    label: "Applicator Name",
    type: "text",
    width: 190,
    height: 24
  },
  {
    field: "organization.licenceNumber",
    label: "Licence Number",
    type: "text",
    width: 120,
    height: 24
  },
  {
    field: "organization.licenceDate",
    label: "Licence Date",
    type: "text",
    width: 100,
    height: 24
  },
  {
    field: "services.insecticide",
    label: "Insecticide Checkbox",
    type: "checkbox",
    width: 145,
    height: 28
  },
  {
    field: "services.myocide",
    label: "Myocide Checkbox",
    type: "checkbox",
    width: 130,
    height: 28
  },
  {
    field: "services.disinfection",
    label: "Disinfection Checkbox",
    type: "checkbox",
    width: 160,
    height: 28
  },
  {
    field: "certificate.materials",
    label: "Materials / Active Ingredients / Antidotes",
    type: "materials",
    width: 520,
    height: 115
  },
  {
    field: "certificate.validFrom",
    label: "Valid From",
    type: "text",
    width: 100,
    height: 24
  },
  {
    field: "certificate.validUntil",
    label: "Valid Until",
    type: "text",
    width: 100,
    height: 24
  },
  {
    field: "organization.signature",
    label: "Applicator Signature",
    type: "image",
    width: 130,
    height: 70
  }
];

const DEFAULT_LAYOUT = {
  version: 1,
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT
  },
  elements: []
};

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalizeLayout(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_LAYOUT;
  }

  return {
    version: Number(value.version) || 1,
    page: {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT
    },
    elements: Array.isArray(value.elements)
      ? value.elements.map((element, index) => ({
          id: element.id || `element_${index}_${Date.now()}`,
          field: element.field || "customer.name",
          label: element.label || element.field || "Field",
          type: element.type || "text",
          x: Number(element.x) || 0,
          y: Number(element.y) || 0,
          width: Math.max(Number(element.width) || 120, 20),
          height: Math.max(Number(element.height) || 24, 16),
          fontSize: Math.max(Number(element.fontSize) || 11, 6),
          color: element.color || "#000000",
          align: ["left", "center", "right"].includes(element.align)
            ? element.align
            : "left",
          bold: Boolean(element.bold)
        }))
      : []
  };
}

function DraggableElement({
  element,
  scale,
  selected,
  onSelect,
  onMove,
  onDragStateChange
}) {
  const elementRef = useRef(element);
  const scaleRef = useRef(scale);
  const callbacksRef = useRef({
    onSelect,
    onMove,
    onDragStateChange
  });
  const startRef = useRef({ x: element.x, y: element.y });

  elementRef.current = element;
  scaleRef.current = scale;
  callbacksRef.current = {
    onSelect,
    onMove,
    onDragStateChange
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const current = elementRef.current;
        startRef.current = { x: current.x, y: current.y };
        callbacksRef.current.onSelect(current.id);
        callbacksRef.current.onDragStateChange(true);
      },
      onPanResponderMove: (event, gestureState) => {
        const current = elementRef.current;
        const currentScale = scaleRef.current || 1;
        const nextX = clamp(
          startRef.current.x + gestureState.dx / currentScale,
          0,
          PAGE_WIDTH - current.width
        );
        const nextY = clamp(
          startRef.current.y + gestureState.dy / currentScale,
          0,
          PAGE_HEIGHT - current.height
        );

        callbacksRef.current.onMove(current.id, nextX, nextY);
      },
      onPanResponderRelease: () => {
        callbacksRef.current.onDragStateChange(false);
      },
      onPanResponderTerminate: () => {
        callbacksRef.current.onDragStateChange(false);
      }
    })
  ).current;

  const isImage = element.type === "image";
  const isCheckbox = element.type === "checkbox";

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.element,
        {
          left: element.x * scale,
          top: element.y * scale,
          width: element.width * scale,
          height: element.height * scale,
          borderColor: selected ? "#ff8a00" : "#1f9c8b",
          backgroundColor: isImage
            ? "rgba(31,156,139,0.18)"
            : "rgba(255,255,255,0.82)"
        }
      ]}
    >
      {isCheckbox && (
        <MaterialIcons
          name="check-box-outline-blank"
          size={Math.max(12, 15 * scale)}
          color={element.color}
        />
      )}

      {isImage && (
        <MaterialIcons
          name="image"
          size={Math.max(12, 18 * scale)}
          color="#1f9c8b"
        />
      )}

      <Text
        numberOfLines={element.type === "materials" ? 4 : 2}
        style={{
          flex: 1,
          color: element.color,
          fontSize: Math.max(7, element.fontSize * scale),
          fontWeight: element.bold ? "700" : "400",
          textAlign: element.align
        }}
      >
        {element.label}
      </Text>
    </View>
  );
}

export default function CertificateTemplateEditorScreen({
  organizationId,
  templateUrl,
  initialLayout,
  brandColor = "#1f9c8b",
  onSave,
  onClose
}) {
  const [layout, setLayout] = useState(() =>
    normalizeLayout(initialLayout)
  );
  const [selectedId, setSelectedId] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(320);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLayout(normalizeLayout(initialLayout));
    setSelectedId(null);
  }, [initialLayout]);

  const scale = canvasWidth / PAGE_WIDTH;
  const canvasHeight = PAGE_HEIGHT * scale;

  const selectedElement = useMemo(
    () => layout.elements.find(element => element.id === selectedId),
    [layout.elements, selectedId]
  );

  const updateElement = (id, changes) => {
    setLayout(current => ({
      ...current,
      elements: current.elements.map(element =>
        element.id === id
          ? { ...element, ...changes }
          : element
      )
    }));
  };

  const moveElement = (id, x, y) => {
    updateElement(id, { x, y });
  };

  const addField = catalogItem => {
    const offset = (layout.elements.length * 12) % 120;
    const id =
      `${catalogItem.field.replace(/[^a-z0-9]/gi, "_")}_` +
      `${Date.now()}`;

    const newElement = {
      id,
      field: catalogItem.field,
      label: catalogItem.label,
      type: catalogItem.type,
      x: 35 + offset,
      y: 45 + offset,
      width: catalogItem.width,
      height: catalogItem.height,
      fontSize: catalogItem.type === "materials" ? 9 : 11,
      color: "#000000",
      align: "left",
      bold: false
    };

    setLayout(current => ({
      ...current,
      elements: [...current.elements, newElement]
    }));
    setSelectedId(id);
  };

  const updateSelected = changes => {
    if (!selectedId) return;
    updateElement(selectedId, changes);
  };

  const deleteSelected = () => {
    if (!selectedId) return;

    setLayout(current => ({
      ...current,
      elements: current.elements.filter(
        element => element.id !== selectedId
      )
    }));
    setSelectedId(null);
  };

  const changeLayer = direction => {
    if (!selectedId) return;

    setLayout(current => {
      const elements = [...current.elements];
      const currentIndex = elements.findIndex(
        element => element.id === selectedId
      );

      if (currentIndex < 0) return current;

      const nextIndex = direction === "forward"
        ? Math.min(currentIndex + 1, elements.length - 1)
        : Math.max(currentIndex - 1, 0);

      if (nextIndex === currentIndex) return current;

      const [item] = elements.splice(currentIndex, 1);
      elements.splice(nextIndex, 0, item);

      return { ...current, elements };
    });
  };

  const saveLayout = async () => {
    if (!organizationId) {
      Alert.alert("Error", "Organization ID is missing");
      return;
    }

    setSaving(true);

    try {
      const normalized = {
        version: 1,
        page: {
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT
        },
        elements: layout.elements.map(element => ({
          ...element,
          x: Number(element.x.toFixed(2)),
          y: Number(element.y.toFixed(2)),
          width: Number(element.width.toFixed(2)),
          height: Number(element.height.toFixed(2)),
          fontSize: Number(element.fontSize.toFixed(2))
        }))
      };

      const result =
        await apiService.updateOrganizationCertificateSettings(
          organizationId,
          {
            certificateMode: "custom",
            certificateLayout: normalized
          }
        );

      if (!result?.success) {
        Alert.alert("Error", result?.error || "Failed to save layout");
        return;
      }

      Alert.alert("Saved", "Certificate layout saved successfully");
      onSave?.(
        result.certificateSettings?.certificateLayout || normalized
      );
    } catch (error) {
      console.error("❌ Save certificate layout error:", error);
      Alert.alert("Error", error.message || "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Certificate Template Editor</Text>
          <Text style={styles.subtitle}>
            Add fields and drag them to their required position.
          </Text>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDragging}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Available fields</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fieldList}
        >
          {FIELD_CATALOG.map(item => (
            <TouchableOpacity
              key={item.field}
              style={styles.fieldButton}
              onPress={() => addField(item)}
            >
              <MaterialIcons name="add" size={16} color="#fff" />
              <Text style={styles.fieldButtonText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!templateUrl && (
          <View style={styles.warning}>
            <MaterialIcons name="warning" size={20} color="#9a6700" />
            <Text style={styles.warningText}>
              Upload a custom certificate background before saving the
              custom design.
            </Text>
          </View>
        )}

        <View
          style={[
            styles.canvas,
            {
              height: canvasHeight,
              borderColor: brandColor
            }
          ]}
          onLayout={event => {
            const nextWidth = event.nativeEvent.layout.width;
            if (nextWidth > 0 && nextWidth !== canvasWidth) {
              setCanvasWidth(nextWidth);
            }
          }}
        >
          {templateUrl && (
            <Image
              source={{ uri: templateUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="stretch"
              pointerEvents="none"
            />
          )}

          {layout.elements.map(element => (
            <DraggableElement
              key={element.id}
              element={element}
              scale={scale}
              selected={element.id === selectedId}
              onSelect={setSelectedId}
              onMove={moveElement}
              onDragStateChange={setIsDragging}
            />
          ))}
        </View>

        {selectedElement && (
          <View style={styles.propertiesCard}>
            <Text style={styles.sectionTitle}>Selected field</Text>
            <Text style={styles.selectedName}>
              {selectedElement.label}
            </Text>

            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Font size</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() =>
                    updateSelected({
                      fontSize: Math.max(
                        6,
                        selectedElement.fontSize - 1
                      )
                    })
                  }
                >
                  <MaterialIcons name="remove" size={18} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>
                  {selectedElement.fontSize}
                </Text>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() =>
                    updateSelected({
                      fontSize: Math.min(
                        48,
                        selectedElement.fontSize + 1
                      )
                    })
                  }
                >
                  <MaterialIcons name="add" size={18} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Width</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() =>
                    updateSelected({
                      width: Math.max(20, selectedElement.width - 10)
                    })
                  }
                >
                  <MaterialIcons name="remove" size={18} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>
                  {Math.round(selectedElement.width)}
                </Text>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() =>
                    updateSelected({
                      width: Math.min(
                        PAGE_WIDTH - selectedElement.x,
                        selectedElement.width + 10
                      )
                    })
                  }
                >
                  <MaterialIcons name="add" size={18} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Height</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() =>
                    updateSelected({
                      height: Math.max(16, selectedElement.height - 5)
                    })
                  }
                >
                  <MaterialIcons name="remove" size={18} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>
                  {Math.round(selectedElement.height)}
                </Text>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() =>
                    updateSelected({
                      height: Math.min(
                        PAGE_HEIGHT - selectedElement.y,
                        selectedElement.height + 5
                      )
                    })
                  }
                >
                  <MaterialIcons name="add" size={18} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>Text color</Text>
            <TextInput
              style={styles.input}
              value={selectedElement.color}
              onChangeText={color => updateSelected({ color })}
              placeholder="#000000"
              autoCapitalize="none"
            />

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedElement.bold && styles.toggleButtonActive
                ]}
                onPress={() =>
                  updateSelected({ bold: !selectedElement.bold })
                }
              >
                <Text
                  style={[
                    styles.toggleText,
                    selectedElement.bold && styles.toggleTextActive
                  ]}
                >
                  Bold
                </Text>
              </TouchableOpacity>

              {["left", "center", "right"].map(align => (
                <TouchableOpacity
                  key={align}
                  style={[
                    styles.toggleButton,
                    selectedElement.align === align &&
                      styles.toggleButtonActive
                  ]}
                  onPress={() => updateSelected({ align })}
                >
                  <MaterialIcons
                    name={`format-align-${align}`}
                    size={18}
                    color={
                      selectedElement.align === align
                        ? "#fff"
                        : "#333"
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => changeLayer("backward")}
              >
                <Text style={styles.secondaryButtonText}>Send Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => changeLayer("forward")}
              >
                <Text style={styles.secondaryButtonText}>Bring Forward</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={deleteSelected}
              >
                <MaterialIcons name="delete" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Close</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!templateUrl || saving) && styles.disabledButton
          ]}
          onPress={saveLayout}
          disabled={!templateUrl || saving}
        >
          <MaterialIcons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Layout"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827"
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#6b7280"
  },
  iconButton: {
    padding: 8
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 10
  },
  fieldList: {
    paddingBottom: 14
  },
  fieldButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f9c8b",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8
  },
  fieldButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7d6",
    borderColor: "#f0c36d",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    color: "#7c5700",
    fontSize: 12
  },
  canvas: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderRadius: 4,
    overflow: "hidden"
  },
  element: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderStyle: "dashed",
    zIndex: 5
  },
  propertiesCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  selectedName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f9c8b",
    marginBottom: 12
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  propertyLabel: {
    fontSize: 13,
    color: "#374151"
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden"
  },
  stepButton: {
    padding: 7,
    backgroundColor: "#f3f4f6"
  },
  stepValue: {
    minWidth: 44,
    textAlign: "center",
    fontWeight: "600"
  },
  inputLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
    backgroundColor: "#fff"
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12
  },
  toggleButton: {
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 7,
    marginRight: 7,
    marginBottom: 7
  },
  toggleButtonActive: {
    backgroundColor: "#1f9c8b",
    borderColor: "#1f9c8b"
  },
  toggleText: {
    color: "#333",
    fontWeight: "600"
  },
  toggleTextActive: {
    color: "#fff"
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1f9c8b",
    borderRadius: 7,
    paddingVertical: 9,
    alignItems: "center",
    marginRight: 7
  },
  secondaryButtonText: {
    color: "#1f9c8b",
    fontSize: 12,
    fontWeight: "600"
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 7,
    padding: 10
  },
  footer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb"
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginRight: 8
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600"
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#1f9c8b"
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6
  },
  disabledButton: {
    opacity: 0.5
  }
});