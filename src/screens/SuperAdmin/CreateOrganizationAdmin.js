//SuperAdmin/CreateOrganizationAdmin.js
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert
} from "react-native";
import { StyleSheet } from "react-native";
import apiService from "../../services/apiService";
import AdminHeaderSessionActions from "../../components/AdminHeaderSessionActions";

export default function CreateOrganizationAdmin({
  organizationId,
  onClose
}) {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    const res = await apiService.getOrganizationAdmins(organizationId);
    if (res?.success) setAdmins(res.admins);
  };

  const createAdmin = async () => {
    const res = await apiService.createOrganizationAdmin(organizationId, {
      email,
      password
    });

    if (res?.success) {
      setEmail("");
      setPassword("");
      loadAdmins();
    } else {
      Alert.alert(res.error);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "right", "bottom", "left"]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Admin</Text>

        <AdminHeaderSessionActions>
          {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close create admin screen"
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        </AdminHeaderSessionActions>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={createAdmin}>
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={admins}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.adminEmail}>{item.email}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f4f6f8"
  },

  header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginHorizontal: -16,
  marginTop: -16,
  marginBottom: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: "#1f9c8b"
},

title: {
  flex: 1,
  fontSize: 18,
  fontWeight: "bold",
  color: "#fff"
},

closeButton: {
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  borderRadius: 8,
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.3)"
},

  form: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa"
  },

  button: {
    backgroundColor: "#1f9c8b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center"
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  },

  listItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },

  adminEmail: {
    fontSize: 14,
    fontWeight: "500"
  }
});