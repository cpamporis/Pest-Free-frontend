//SuperAdmin/OrganizationDetailsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import apiService from "../../services/apiService";
import { launchImageLibrary } from "react-native-image-picker";
import { Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../services/apiService";

export default function OrganizationDetailsScreen({ organization, onClose }) {
  const [name, setName] = useState(organization.name);
  const [color, setColor] = useState(organization.brandColor);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [editData, setEditData] = useState({
    email: "",
    password: ""
  });
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await apiService.getOrganizationAdmins(organization.id);
      if (res?.success) {
        setAdmins(res.admins);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const selectLogo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: 1,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Failed to pick image");
        return;
      }

      if (result.assets && result.assets[0]) {
        setSelectedLogo(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to access gallery");
    }
  };

  const uploadLogo = async () => {
    if (!selectedLogo) {
      Alert.alert("Select image first");
      return;
    }

    setUploadingLogo(true);

    const formData = new FormData();

    formData.append("logo", {
      uri: selectedLogo.uri,
      type: selectedLogo.type || "image/jpeg",
      name: selectedLogo.fileName || `logo_${Date.now()}.jpg`,
    });

    try {
      const token = await AsyncStorage.getItem("authToken");

      const response = await fetch(
        `${API_BASE_URL}/super-admin/organizations/${organization.id}/logo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success", "Logo uploaded");

        setSelectedLogo(null);
      } else {
        Alert.alert("Error", result.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    const res = await apiService.updateOrganization(organization.id, {
      name,
      brandColor: color
    });

    if (res?.success) {
      Alert.alert("Saved");
      onClose();
    } else {
      Alert.alert("Error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Organization</Text>

      <Text>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text>Brand Color</Text>
      <TextInput value={color} onChangeText={setColor} style={styles.input} />

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>
        Organization Logo
      </Text>

      {selectedLogo && (
        <Image
          source={{ uri: selectedLogo.uri }}
          style={{ width: 120, height: 120, marginVertical: 10 }}
          resizeMode="contain"
        />
      )}

      {!selectedLogo && (
        <TouchableOpacity style={styles.btn} onPress={selectLogo}>
          <Text style={styles.btnText}>Choose Logo</Text>
        </TouchableOpacity>
      )}

      {selectedLogo && (
        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.btn, { flex: 1, marginRight: 10 }]}
            onPress={uploadLogo}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Upload Logo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { flex: 1, backgroundColor: "#ccc" }]}
            onPress={() => setSelectedLogo(null)}
          >
            <Text style={{ textAlign: "center" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>Admins</Text>

      {loadingAdmins ? (
        <Text>Loading...</Text>
      ) : (
        admins.map((admin) => (
          <View key={admin.id} style={styles.adminRow}>
            <Text>{admin.email}</Text>

            <TouchableOpacity
              onPress={() => {
                setEditingAdmin(admin);
                setEditData({
                  email: admin.email,
                  password: ""
                });
                setShowEditModal(true);
              }}
            >
              <Text style={{ color: "#1f9c8b" }}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity onPress={onClose}>
        <Text>Close</Text>
      </TouchableOpacity>

      {showEditModal && (
        <View style={styles.modal}>
          <Text style={styles.title}>Edit Admin</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={editData.email}
            onChangeText={(text) =>
              setEditData({ ...editData, email: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="New Password (optional)"
            secureTextEntry
            value={editData.password}
            onChangeText={(text) =>
              setEditData({ ...editData, password: text })
            }
          />

          <TouchableOpacity
            style={styles.btn}
            onPress={async () => {
              if (!editData.email) {
                Alert.alert("Email required");
                return;
              }

              const res = await apiService.updateOrganizationAdmin(
                organization.id,
                editingAdmin.id,
                editData
              );

              if (!res?.success) {
                Alert.alert("Error", res?.error || "Failed");
                return;
              }

              setShowEditModal(false);
              setEditingAdmin(null);

              await loadAdmins();
            }}
          >
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowEditModal(false)}>
            <Text style={{ textAlign: "center", marginTop: 10 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10
  },
  btn: {
    backgroundColor: "#1f9c8b",
    padding: 12,
    borderRadius: 6,
    marginTop: 10
  },
  btnText: { color: "#fff", textAlign: "center" },
    adminRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee"
  },

  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    padding: 20
  }
});