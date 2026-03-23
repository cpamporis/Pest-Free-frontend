//SuperAdmin/SuperAdminHomeScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import pestfreeLogo from "../../../assets/pestfree_logo.png";
import OrganizationsScreen from "./OrganizationsScreen";

export default function SuperAdminHomeScreen({ onLogout }) {
  const [showOrganizations, setShowOrganizations] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandContainer}>
              <Image source={pestfreeLogo} style={styles.logo} />
              <View style={styles.adminBadge}>
                <MaterialIcons name="security" size={14} color="#fff" />
                <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <MaterialIcons name="logout" size={18} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>System Control Panel</Text>
          <Text style={styles.subtitle}>
            Manage organizations, admins & subscriptions
          </Text>
        </View>

        {/* MODULES */}
        <View style={styles.sectionHeader}>
          <MaterialIcons name="admin-panel-settings" size={20} color="#2c3e50" />
          <Text style={styles.sectionTitle}>System Modules</Text>
        </View>

        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => setShowOrganizations(true)}
          >
            <View style={styles.moduleIcon}>
              <MaterialIcons name="business" size={26} color="#fff" />
            </View>

            <Text style={styles.moduleTitle}>Organizations</Text>
            <Text style={styles.moduleDesc}>
              Manage organizations, plans and admins
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODAL */}
        {showOrganizations && (
          <Modal animationType="slide" visible>
            <OrganizationsScreen onClose={() => setShowOrganizations(false)} />
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8"
  },
  header: {
    padding: 20,
    backgroundColor: "#1f9c8b"
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34495e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 10,
    marginLeft: 4
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center"
  },
  logoutText: {
    color: "#fff",
    marginLeft: 5
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10
  },
  subtitle: {
    color: "#dfe6e9",
    fontSize: 12
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold"
  },
  modulesGrid: {
    padding: 16
  },
  moduleCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12
  },
  moduleIcon: {
    backgroundColor: "#1f9c8b",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 10
  },
  moduleTitle: {
    fontWeight: "bold",
    fontSize: 16
  },
  moduleDesc: {
    fontSize: 12,
    color: "#7f8c8d"
  }
});