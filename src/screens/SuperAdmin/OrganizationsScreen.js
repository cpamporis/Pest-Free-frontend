//SuperAdmin/OrganizationsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import OrganizationDetailsScreen from "./OrganizationDetailsScreen";
import apiService from "../../services/apiService";
import { TextInput } from "react-native";
import TimeZonePicker from "../../components/TimeZonePicker";
import { ProtectedAdminModal as Modal } from "../../components/AdminSessionTimer";
import AdminHeaderSessionActions from "../../components/AdminHeaderSessionActions";

const PLAN_DESCRIPTIONS = {
  basic:
    "1 technician • 150 customers • Default certificate",
  premium:
    "3 technicians • Unlimited customers • Custom certificate",
  custom:
    "Custom or unlimited usage limits • Custom certificate"
};

const formatLimit = value => {
  return value === null || value === undefined
    ? "Unlimited"
    : String(value);
};

export default function OrganizationsScreen({ onClose }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: "",
    brandColor: "#1f9c8b",
    adminEmail: "",
    adminPassword: "",
    subscriptionPlan: "basic",
    maxTechnicians: "",
    maxCustomers: "",
    timeZone: "Europe/Athens"
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const res = await apiService.getOrganizations();

      if (res?.success) {
        setOrganizations(res.organizations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1f9c8b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Organizations</Text>

        <AdminHeaderSessionActions>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.headerIconButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Create organization"
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={styles.headerIconButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close organizations screen"
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </AdminHeaderSessionActions>
      </View>

      <ScrollView>
        {organizations.map((org) => (
          <TouchableOpacity
            key={org.id}
            style={styles.card}
            onPress={() => setSelectedOrg(org)}
          >
            <Text style={styles.name}>{org.name}</Text>

            <Text style={styles.meta}>
              Status:{" "}
              <Text style={{ color: org.is_active ? "green" : "red" }}>
                {org.is_active ? "ACTIVE" : "INACTIVE"}
              </Text>
            </Text>

            <Text style={styles.meta}>
              Plan: {org.subscription_plan}
            </Text>

            <Text style={styles.meta}>
              Technicians:{" "}
              {formatLimit(
                org.maxTechnicians ?? org.max_technicians
              )}
            </Text>

            <Text style={styles.meta}>
              Customers:{" "}
              {formatLimit(
                org.maxCustomers ?? org.max_customers
              )}
            </Text>

            <Text style={styles.meta}>
              Time zone: {org.timeZone || org.time_zone || "Europe/Athens"}
            </Text>

            <Text style={styles.meta}>
              Created: {new Date(org.created_at).toLocaleDateString()}
            </Text>

            {/* 🔴 ACTION BUTTON */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: org.is_active ? "#e74c3c" : "#2ecc71" }
              ]}
              onPress={async () => {
                try {
                  if (org.is_active) {
                    await apiService.deactivateOrganization(org.id);
                  } else {
                    await apiService.restoreOrganization(org.id);
                  }

                  loadOrganizations(); 
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              <Text style={styles.actionText}>
                {org.is_active ? "Deactivate" : "Restore"}
              </Text>
            </TouchableOpacity>

            {!org.is_active && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#000" }]}
                onPress={() => {
                  Alert.alert(
                    "Permanent Delete",
                    "This will DELETE the organization and ALL its data permanently. Continue?",
                    [
                      { text: "Cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            const res = await apiService.hardDeleteOrganization(org.id);

                            if (!res?.success) {
                              Alert.alert("Delete failed", res?.error || "Unknown error");
                              return;
                            }

                            await loadOrganizations();
                          } catch (err) {
                            console.error(err);
                            Alert.alert("Delete failed", err.message || "Unknown error");
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.actionText}>Delete Permanently</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedOrg && (
        <Modal animationType="slide" visible>
          <OrganizationDetailsScreen
            organization={selectedOrg}
            onClose={() => {
              setSelectedOrg(null);
              loadOrganizations();
            }}
          />
        </Modal>
      )}

      <Modal visible={showCreateModal} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Organization</Text>

            <AdminHeaderSessionActions>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.headerIconButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close create organization screen"
              >
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </AdminHeaderSessionActions>
          </View>

          <ScrollView
            contentContainerStyle={styles.createContent}
            keyboardShouldPersistTaps="handled"
          >

          <TextInput
            style={styles.input}
            placeholder="Organization Name"
            value={newOrg.name}
            onChangeText={(text) => setNewOrg({ ...newOrg, name: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Brand Color (#hex)"
            value={newOrg.brandColor}
            onChangeText={(text) => setNewOrg({ ...newOrg, brandColor: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            value={newOrg.adminEmail}
            onChangeText={(text) => setNewOrg({ ...newOrg, adminEmail: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Admin Password"
            secureTextEntry
            value={newOrg.adminPassword}
            onChangeText={(text) => setNewOrg({ ...newOrg, adminPassword: text })}
          />

          <View style={styles.timeZoneField}>
            <TimeZonePicker
              value={newOrg.timeZone}
              onChange={(timeZone) => setNewOrg({ ...newOrg, timeZone })}
            />
          </View>

          {newOrg.subscriptionPlan === "custom" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Max Technicians (empty = unlimited)"
                keyboardType="numeric"
                value={newOrg.maxTechnicians}
                onChangeText={(text) =>
                  setNewOrg({ ...newOrg, maxTechnicians: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Max Customers (empty = unlimited)"
                keyboardType="numeric"
                value={newOrg.maxCustomers}
                onChangeText={(text) =>
                  setNewOrg({ ...newOrg, maxCustomers: text })
                }
              />
            </>
          )}

          <Text style={{ marginTop: 10 }}>Plan</Text>

          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            {["basic", "premium", "custom"].map((plan) => (
              <TouchableOpacity
                key={plan}
                onPress={() =>
                  setNewOrg({ ...newOrg, subscriptionPlan: plan })
                }
                style={{
                  padding: 8,
                  marginRight: 8,
                  borderRadius: 6,
                  backgroundColor:
                    newOrg.subscriptionPlan === plan ? "#1f9c8b" : "#ccc"
                }}
              >
                <Text style={{ color: "#fff" }}>{plan.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={async () => {
              try {
                const res = await apiService.createOrganization(newOrg);

                if (res?.success) {
                  setShowCreateModal(false);
                  setNewOrg({
                    name: "",
                    brandColor: "#1f9c8b",
                    adminEmail: "",
                    adminPassword: "",
                    subscriptionPlan: "basic",
                    maxTechnicians: "",
                    maxCustomers: "",
                    timeZone: "Europe/Athens"
                  });
                  loadOrganizations();
                } else {
                  Alert.alert("Error", res?.error || "Failed");
                }
              } catch (err) {
                console.error(err);
              }
            }}
          >
            <Text style={styles.createText}>Create</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={{ textAlign: "center", marginTop: 10 }}>Cancel</Text>
          </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1f9c8b",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)"
  },
  title: {
    flex: 1,
    paddingRight: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff"
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)"
  },
  createContent: {
    paddingBottom: 24
  },
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee"
  },
  name: { fontWeight: "bold", fontSize: 16 },
    meta: { fontSize: 12, color: "#888" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    actionButton: {
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    alignItems: "center"
  },

  actionText: {
    color: "#fff",
    fontWeight: "bold"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    margin: 10
  },
  timeZoneField: {
    marginHorizontal: 10
  },

  createButton: {
    backgroundColor: "#1f9c8b",
    padding: 12,
    margin: 10,
    borderRadius: 8,
    alignItems: "center"
  },

  createText: {
    color: "#fff",
    fontWeight: "bold"
  }
});
