//SuperAdmin/CreateOrganizationAdmin.js
import React, { useState, useEffect } from "react";
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

export default function CreateOrganizationAdmin({ organizationId }) {
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Admin</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f4f6f8"
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16
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