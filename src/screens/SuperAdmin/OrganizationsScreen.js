//SuperAdmin/OrganizationsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import OrganizationDetailsScreen from "./OrganizationDetailsScreen";
import apiService from "../../services/apiService";
import { TextInput } from "react-native";

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
    maxCustomers: ""
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

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <MaterialIcons name="add" size={26} color="#1f9c8b" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginLeft: 12 }}>
            <MaterialIcons name="close" size={24} />
          </TouchableOpacity>
        </View>
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
            onClose={() => setSelectedOrg(null)}
          />
        </Modal>
      )}

      <Modal visible={showCreateModal} animationType="slide">
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Create Organization</Text>

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

          {newOrg.subscriptionPlan === "custom" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Max Technicians"
                keyboardType="numeric"
                value={newOrg.maxTechnicians}
                onChangeText={(text) =>
                  setNewOrg({ ...newOrg, maxTechnicians: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Max Customers"
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
                    maxCustomers: ""
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
    padding: 16
  },
  title: { fontSize: 18, fontWeight: "bold" },
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