import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform
} from "react-native";
import apiService, { API_BASE_URL } from "../../services/apiService";

// Technician Modal Component
const TechnicianModal = ({ isEdit, visible, onClose, onSubmit, technician, loading }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    username: "",
    email: "",
    password: "",
  });

  // Update form when technician changes
  useEffect(() => {
    if (technician && isEdit) {
      setFormData({
        firstName: technician.firstName || "",
        lastName: technician.lastName || "",
        age: technician.age?.toString() || "",
        username: technician.username || "",
        email: technician.email || "",
        password: "",
      });
    } else {
      // Reset form for add mode
      setFormData({
        firstName: "",
        lastName: "",
        age: "",
        username: "",
        email: "",
        password: "",
      });
    }
  }, [technician, isEdit]);

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.username || (!isEdit && !formData.password)) {
      Alert.alert("Error", "Please fill all required fields (*)");
      return;
    }

    onSubmit(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal 
      animationType="slide" 
      transparent 
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isEdit ? "Edit Technician" : "Add Technician"}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor="#999"
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor="#999"
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter age"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={formData.age}
                onChangeText={(text) => updateField('age', text)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={formData.username}
                onChangeText={(text) => updateField('username', text)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="username@pest-free.gr"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                editable={!loading}
              />
              <Text style={styles.inputHint}>
                Leave blank to auto-generate: username@pest-free.gr
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {isEdit ? "New Password (leave blank to keep current)" : "Password *"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={isEdit ? "Enter new password" : "Enter password"}
                placeholderTextColor="#999"
                secureTextEntry
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                editable={!loading}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.saveButton, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEdit ? "Update" : "Save"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, loading && { opacity: 0.7 }]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default function TechniciansScreen({ onClose }) {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [technicianToDelete, setTechnicianToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    setLoading(true);
    try {
      console.log("=== LOADING TECHNICIANS ===");
      const result = await apiService.getTechnicians();
      
      console.log("Technicians API Result:", result);
      
      if (Array.isArray(result)) {
        console.log(`✅ Found ${result.length} technicians`);
        setTechnicians(result);
      } else {
        console.log("❌ Invalid response format");
        Alert.alert("Info", "No technicians found");
        setTechnicians([]);
      }
    } catch (error) {
      console.error("Failed to load technicians:", error);
      Alert.alert("Error", "Failed to load technicians. Check backend connection.");
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTechnician = async (formData) => {
    setSaveLoading(true);
    try {
      const newTech = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        // Auto-generate email if not provided
        email: formData.email || `${formData.username}@pest-free.gr`
      };

      const result = await apiService.createTechnician(newTech);
      
      if (result && result.success) {
        Alert.alert("Success", "Technician added successfully");
        setShowAddModal(false);
        loadTechnicians();
      } else {
        Alert.alert("Error", result?.error || "Failed to add technician");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add technician");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditTechnician = async (formData) => {
    setSaveLoading(true);
    try {
      const updatedTech = {
        ...selectedTechnician,
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age ? parseInt(formData.age) : null,
        username: formData.username,
        email: formData.email || `${formData.username}@pest-free.gr`,
        // Only update password if provided
        ...(formData.password ? { password: formData.password } : {})
      };

      const result = await apiService.updateTechnician(selectedTechnician.technicianId, updatedTech);
      
      if (result && result.success) {
        Alert.alert("Success", "Technician updated successfully");
        setShowEditModal(false);
        setSelectedTechnician(null);
        loadTechnicians();
      } else {
        Alert.alert("Error", result?.error || "Failed to update technician");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update technician");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteTechnician = (techId) => {
    const tech = technicians.find(t => t.technicianId === techId);
    if (!tech) return;
    
    setTechnicianToDelete(techId);
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!technicianToDelete) return;

    try {
      const result = await apiService.deleteTechnician(technicianToDelete);
      
      if (result && result.success) {
        Alert.alert("Success", "Technician deleted successfully");
        loadTechnicians();
      } else {
        Alert.alert("Error", result?.error || "Failed to delete technician");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete technician");
    } finally {
      setDeleteConfirm(false);
      setTechnicianToDelete(null);
    }
  };

  const openEditModal = (tech) => {
    setSelectedTechnician(tech);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Technicians</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1f9c8d" />
            <Text style={styles.loadingText}>Loading technicians...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Technicians</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Test Button */}
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: '#6c757d', marginBottom: 10 }]} 
          onPress={async () => {
            try {
              const test = await apiService.getTechnicians();
              Alert.alert("API Test", 
                `Found ${Array.isArray(test) ? test.length : 0} technicians\n` +
                `API URL: ${API_BASE_URL}/technicians`
              );
            } catch (error) {
              Alert.alert("API Test Failed", error.message);
            }
          }}
        >
          <Text style={styles.addButtonText}>Test API Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Add Technician</Text>
        </TouchableOpacity>

        {technicians.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No technicians found</Text>
            <Text style={styles.emptyStateSubtext}>
              Click "Add Technician" to create your first technician
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {technicians.map((tech) => (
              <View key={tech.technicianId} style={styles.techCard}>
                <View style={styles.techInfo}>
                  <Text style={styles.techName}>
                    {tech.firstName} {tech.lastName}
                  </Text>
                  <Text style={styles.techDetails}>
                    Username: {tech.username} • Email: {tech.email}
                  </Text>
                  <Text style={styles.techDetails}>
                    Age: {tech.age || "N/A"} • ID: {tech.technicianId}
                  </Text>
                </View>
                
                <View style={styles.techActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(tech)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTechnician(tech.technicianId)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Modals */}
        <TechnicianModal
          isEdit={false}
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTechnician}
          loading={saveLoading}
        />

        <TechnicianModal
          isEdit={true}
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTechnician(null);
          }}
          onSubmit={handleEditTechnician}
          technician={selectedTechnician}
          loading={saveLoading}
        />

        {/* Delete Confirmation Modal */}
        <Modal animationType="fade" transparent visible={deleteConfirm}>
          <View style={styles.overlay}>
            <View style={styles.confirmationCard}>
              <Text style={styles.confirmationTitle}>Confirm Delete</Text>
              <Text style={styles.confirmationText}>
                Are you sure you want to delete this technician?
              </Text>
              <Text style={styles.warningText}>
                This action cannot be undone.
              </Text>
              
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={confirmDelete}
                >
                  <Text style={styles.dangerButtonText}>Delete</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setDeleteConfirm(false);
                    setTechnicianToDelete(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, // Extra padding for iOS
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 5 : 0, // Adjust for iOS
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#1f9c8d",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#1f9c8d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
  },
  techCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  techInfo: {
    marginBottom: 10,
  },
  techName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  techDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  techActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editButton: {
    backgroundColor: "#1f9c8d",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#0008",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#1f9c8d",
    padding: 14,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    padding: 14,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#0008",
    padding: 20,
  },
  confirmationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#dc3545",
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  warningText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
    fontStyle: "italic",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    padding: 14,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});