import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import apiService from "../services/apiService";
import { ProtectedAdminModal as Modal } from "./AdminSessionTimer";

function formatOffset(offsetSeconds) {
  const totalMinutes = Math.round(Number(offsetSeconds || 0) / 60);
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(totalMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");

  return `UTC${sign}${hours}:${minutes}`;
}

export default function TimeZonePicker({
  label = "Time zone",
  value,
  onChange,
  disabled = false
}) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [timeZones, setTimeZones] = useState([]);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!visible || timeZones.length > 0) return;

    let active = true;

    const loadTimeZones = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await apiService.getTimeZones();

        if (!active) return;

        if (result?.success && Array.isArray(result.timeZones)) {
          setTimeZones(result.timeZones);
        } else {
          setError(result?.error || "Unable to load time zones");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load time zones");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTimeZones();

    return () => {
      active = false;
    };
  }, [visible, timeZones.length, retryToken]);

  const filteredTimeZones = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return timeZones;

    return timeZones.filter((timeZone) =>
      `${timeZone.name} ${timeZone.abbreviation || ""}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, timeZones]);

  const close = () => {
    setVisible(false);
    setQuery("");
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View style={styles.triggerTextContainer}>
          <Text style={styles.triggerText}>{value || "Select a time zone"}</Text>
          <Text style={styles.helpText}>
            IANA zone; daylight-saving changes are automatic
          </Text>
        </View>
        <MaterialIcons name="keyboard-arrow-down" size={24} color="#1f9c8b" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.header}>
            <TouchableOpacity onPress={close} style={styles.iconButton}>
              <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.title}>Choose time zone</Text>
            <View style={styles.iconButton} />
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#6b7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search city or zone"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#1f9c8b" />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <MaterialIcons name="error-outline" size={36} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setTimeZones([]);
                  setError("");
                  setRetryToken((current) => current + 1);
                }}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredTimeZones}
              keyExtractor={(item) => item.name}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = item.name === value;

                return (
                  <TouchableOpacity
                    style={[styles.row, selected && styles.selectedRow]}
                    onPress={() => {
                      onChange(item.name);
                      close();
                    }}
                  >
                    <View style={styles.rowTextContainer}>
                      <Text style={[styles.zoneName, selected && styles.selectedText]}>
                        {item.name}
                      </Text>
                      <Text style={styles.zoneMeta}>
                        {formatOffset(item.offsetSeconds)}
                        {item.abbreviation ? ` • ${item.abbreviation}` : ""}
                      </Text>
                    </View>
                    {selected && (
                      <MaterialIcons name="check" size={22} color="#1f9c8b" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No matching time zones</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 12
  },
  label: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6
  },
  trigger: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  disabled: {
    opacity: 0.55
  },
  triggerTextContainer: {
    flex: 1,
    marginRight: 8
  },
  triggerText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600"
  },
  helpText: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 2
  },
  modal: {
    backgroundColor: "#f8fafc",
    flex: 1
  },
  header: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  iconButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40
  },
  title: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700"
  },
  searchContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d1d5db",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    margin: 14,
    paddingHorizontal: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 11
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  errorText: {
    color: "#4b5563",
    marginTop: 10,
    textAlign: "center"
  },
  retryButton: {
    backgroundColor: "#1f9c8b",
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  retryText: {
    color: "#fff",
    fontWeight: "700"
  },
  row: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 62,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  selectedRow: {
    backgroundColor: "#ecfdf5"
  },
  rowTextContainer: {
    flex: 1,
    marginRight: 12
  },
  zoneName: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600"
  },
  selectedText: {
    color: "#167b6d"
  },
  zoneMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 3
  },
  emptyText: {
    color: "#6b7280"
  }
});
