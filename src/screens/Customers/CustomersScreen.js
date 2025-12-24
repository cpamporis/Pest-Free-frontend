import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Platform
} from "react-native";
import { launchImageLibrary } from 'react-native-image-picker';
import apiService, { API_BASE_URL } from "../../services/apiService";


/* ===================== EXISTING MODALS ===================== */

function CustomerSelectModal({ title, subtitle, customers, onClose, onSelect }) {
  return (
    <Modal animationType="slide" transparent visible>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.selectCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.modalSub}>{subtitle}</Text>}

          <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.customerId}
                style={styles.selectItem}
                onPress={() => onSelect(c)}
              >
                <Text style={styles.selectItemTitle}>
                  {c.customerId} — {c.customerName}
                </Text>
                {!!c.address && <Text style={styles.selectItemSub}>{c.address}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.cancelWide} onPress={onClose}>
            <Text style={styles.cancelWideText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// UPDATED: AddCustomerModal with Image Upload (Gallery only)
function AddCustomerModal({ onClose, onSave }) {
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Map upload states
  const [showMapUpload, setShowMapUpload] = useState(false);
  const [mapName, setMapName] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [uploadedMaps, setUploadedMaps] = useState([]);

  const selectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: 1,
      });
      
      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
      } else if (result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to access image library');
    }
  };

  const uploadMapImage = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!mapName.trim()) {
      Alert.alert('Error', 'Please enter a map name');
      return;
    }

    setUploadingMap(true);
    
    const formData = new FormData();
    formData.append('image', {
      uri: selectedImage.uri,
      type: selectedImage.type || 'image/jpeg',
      name: selectedImage.fileName || `map_${Date.now()}.jpg`,
    });
    formData.append('mapName', mapName.trim());

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newMap = {
          mapId: `map_${Date.now()}`,
          name: mapName.trim(),
          image: result.image.filename,
          stations: []
        };
        
        setUploadedMaps([...uploadedMaps, newMap]);
        setSelectedImage(null);
        setMapName("");
        setShowMapUpload(false);
        Alert.alert('Success', 'Map added successfully!');
      } else {
        Alert.alert('Error', result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingMap(false);
    }
  };

  const removeMap = (index) => {
    const newMaps = [...uploadedMaps];
    newMaps.splice(index, 1);
    setUploadedMaps(newMaps);
  };

  async function handleSave() {
    if (!customerName.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }

    setLoading(true);
    try {
      // First create the customer
      const customerData = {
        customerName: customerName.trim(),
        address: address.trim(),
        email: email.trim()
      };
      
      const createResult = await apiService.createCustomer(customerData);
      
      if (!createResult?.success) {
        throw new Error(createResult?.error || "Failed to create customer");
      }
      
      const newCustomer = createResult.customer;
      
      // If there are uploaded maps, update the customer with maps
      if (uploadedMaps.length > 0) {
        const updatedCustomer = {
          ...newCustomer,
          maps: uploadedMaps
        };
        
        await apiService.updateCustomer(newCustomer.customerId, updatedCustomer);
      }
      
      // Call the onSave callback with the complete data
      await onSave({
        ...newCustomer,
        maps: uploadedMaps
      });
      
      onClose();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to create customer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="slide" transparent visible>
      <SafeAreaView style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Customer</Text>

            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Porfi Hotel"
              value={customerName}
              onChangeText={setCustomerName}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123 Hotel Street, Athens"
              value={address}
              onChangeText={setAddress}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. info@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            {/* ADD MAP SECTION */}
            <View style={styles.mapSection}>
              <Text style={styles.inputLabel}>Maps (Optional)</Text>
              
              {uploadedMaps.length > 0 && (
                <View style={styles.uploadedMapsContainer}>
                  <Text style={styles.uploadedMapsTitle}>Uploaded Maps:</Text>
                  {uploadedMaps.map((map, index) => (
                    <View key={map.mapId} style={styles.uploadedMapItem}>
                      <Text style={styles.uploadedMapName}>{map.name}</Text>
                      <TouchableOpacity 
                        style={styles.removeMapBtn}
                        onPress={() => removeMap(index)}
                      >
                        <Text style={styles.removeMapText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {!showMapUpload ? (
                <TouchableOpacity 
                  style={[styles.primaryTop, { backgroundColor: '#17a2b8', marginTop: 10 }]}
                  onPress={() => setShowMapUpload(true)}
                  disabled={loading}
                >
                  <Text style={styles.primaryText}>+ Add Map</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.mapUploadContainer}>
                  {/* Image Preview */}
                  {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: selectedImage.uri }}
                        style={styles.imagePreview}
                        resizeMode="contain"
                      />
                      <TouchableOpacity 
                        style={styles.changeImageBtn}
                        onPress={() => setSelectedImage(null)}
                      >
                        <Text style={styles.changeImageText}>Change Image</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Select Image Button (Gallery Only) */}
                  {!selectedImage && (
                    <TouchableOpacity 
                      style={[styles.primaryTop, { marginBottom: 15 }]}
                      onPress={selectImage}
                      disabled={uploadingMap}
                    >
                      <Text style={styles.primaryText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                  )}

                  <Text style={styles.inputLabel}>Map Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ground Floor, Storage Area, etc."
                    value={mapName}
                    onChangeText={setMapName}
                    editable={!uploadingMap}
                  />

                  <View style={styles.mapUploadButtons}>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton, 
                        { flex: 1, marginRight: 10 },
                        (!selectedImage || !mapName.trim() || uploadingMap) && { opacity: 0.5 }
                      ]}
                      onPress={uploadMapImage}
                      disabled={!selectedImage || !mapName.trim() || uploadingMap}
                    >
                      {uploadingMap ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryText}>Upload Map</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cancelButton, { flex: 1 }]}
                      onPress={() => {
                        setShowMapUpload(false);
                        setSelectedImage(null);
                        setMapName("");
                      }}
                      disabled={uploadingMap}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Save Customer</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, loading && { opacity: 0.7 }]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// UPDATED: EditCustomerModal with Image Upload (Gallery only)
function EditCustomerModal({ customer, onClose, onSave }) {
  const [customerName, setCustomerName] = useState(customer.customerName || "");
  const [address, setAddress] = useState(customer.address || "");
  const [email, setEmail] = useState(customer.email || "");
  const [loading, setLoading] = useState(false);
  
  // Map upload states
  const [showMapUpload, setShowMapUpload] = useState(false);
  const [mapName, setMapName] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [customerMaps, setCustomerMaps] = useState(customer.maps || []);

  const selectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: 1,
      });
      
      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
      } else if (result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to access image library');
    }
  };

  const uploadMapImage = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!mapName.trim()) {
      Alert.alert('Error', 'Please enter a map name');
      return;
    }

    setUploadingMap(true);
    
    const formData = new FormData();
    formData.append('image', {
      uri: selectedImage.uri,
      type: selectedImage.type || 'image/jpeg',
      name: selectedImage.fileName || `map_${Date.now()}.jpg`,
    });
    formData.append('customerId', customer.customerId);
    formData.append('mapName', mapName.trim());

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newMap = {
          mapId: `map_${Date.now()}`,
          name: mapName.trim(),
          image: result.image.filename,
          stations: []
        };
        
        setCustomerMaps([...customerMaps, newMap]);
        setSelectedImage(null);
        setMapName("");
        setShowMapUpload(false);
        Alert.alert('Success', 'Map added successfully!');
      } else {
        Alert.alert('Error', result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingMap(false);
    }
  };

  const removeMap = async (map, index) => {
    Alert.alert(
      "Delete Map",
      `Are you sure you want to delete "${map.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              // Delete image file from server
              await fetch(`${API_BASE_URL}/api/delete-image/${map.image}`, {
                method: 'DELETE'
              });

              // Remove from local state
              const newMaps = [...customerMaps];
              newMaps.splice(index, 1);
              setCustomerMaps(newMaps);
              
              Alert.alert("Success", "Map deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete map");
            }
          }
        }
      ]
    );
  };

  async function handleSave() {
    if (!customerName.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        customerId: customer.customerId,
        customerName: customerName.trim(),
        address: address.trim(),
        email: email.trim(),
        maps: customerMaps
      };

      await onSave(updateData);
      onClose();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to update customer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="slide" transparent visible>
      <SafeAreaView style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Customer</Text>
            <Text style={styles.modalSub}>Customer ID: {customer.customerId}</Text>

            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              editable={!loading}
            />

            {/* MAPS SECTION */}
            <View style={styles.mapSection}>
              <Text style={styles.inputLabel}>Customer Maps</Text>
              
              {customerMaps.length > 0 && (
                <View style={styles.uploadedMapsContainer}>
                  <Text style={styles.uploadedMapsTitle}>Current Maps:</Text>
                  {customerMaps.map((map, index) => (
                    <View key={map.mapId} style={styles.uploadedMapItem}>
                      <Text style={styles.uploadedMapName}>{map.name}</Text>
                      <TouchableOpacity 
                        style={styles.removeMapBtn}
                        onPress={() => removeMap(map, index)}
                      >
                        <Text style={styles.removeMapText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {!showMapUpload ? (
                <TouchableOpacity 
                  style={[styles.primaryTop, { backgroundColor: '#17a2b8', marginTop: 10 }]}
                  onPress={() => setShowMapUpload(true)}
                  disabled={loading}
                >
                  <Text style={styles.primaryText}>+ Add New Map</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.mapUploadContainer}>
                  {/* Image Preview */}
                  {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: selectedImage.uri }}
                        style={styles.imagePreview}
                        resizeMode="contain"
                      />
                      <TouchableOpacity 
                        style={styles.changeImageBtn}
                        onPress={() => setSelectedImage(null)}
                      >
                        <Text style={styles.changeImageText}>Change Image</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Select Image Button (Gallery Only) */}
                  {!selectedImage && (
                    <TouchableOpacity 
                      style={[styles.primaryTop, { marginBottom: 15 }]}
                      onPress={selectImage}
                      disabled={uploadingMap}
                    >
                      <Text style={styles.primaryText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                  )}

                  <Text style={styles.inputLabel}>Map Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ground Floor, Storage Area, etc."
                    value={mapName}
                    onChangeText={setMapName}
                    editable={!uploadingMap}
                  />

                  <View style={styles.mapUploadButtons}>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton, 
                        { flex: 1, marginRight: 10 },
                        (!selectedImage || !mapName.trim() || uploadingMap) && { opacity: 0.5 }
                      ]}
                      onPress={uploadMapImage}
                      disabled={!selectedImage || !mapName.trim() || uploadingMap}
                    >
                      {uploadingMap ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryText}>Upload Map</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cancelButton, { flex: 1 }]}
                      onPress={() => {
                        setShowMapUpload(false);
                        setSelectedImage(null);
                        setMapName("");
                      }}
                      disabled={uploadingMap}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, loading && { opacity: 0.7 }]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DeleteCustomerModal({ customerName, onClose, onConfirm }) {
  return (
    <Modal animationType="fade" transparent visible>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.modalTitle}>Delete Customer</Text>
          <Text style={styles.modalSub}>
            Are you sure you want to delete{" "}
            <Text style={{ fontWeight: "bold" }}>{customerName}</Text>?
          </Text>
          <Text style={[styles.modalSub, { marginTop: 8 }]}>
            This action cannot be undone.
          </Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.dangerButton} onPress={onConfirm}>
              <Text style={styles.primaryText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* ===================== MAIN SCREEN ===================== */

export default function CustomersScreen({ onClose }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [showSelectForEdit, setShowSelectForEdit] = useState(false);
  const [showSelectForDelete, setShowSelectForDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await apiService.getCustomers();
      if (!Array.isArray(res)) throw new Error("Invalid customers response");
      setCustomers(res);
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCustomer(data) {
    await loadCustomers(); // Refresh the list
  }

  async function handleEditCustomer(data) {
    try {
      console.log('📝 Updating customer via API:', data.customerId);
      
      // Call the API to update the customer
      const result = await apiService.updateCustomer(data.customerId, data);
      
      console.log('API update response:', result);
      
      if (!result?.success) {
        // Check if result has success property
        if (result && result.success === false) {
          throw new Error(result.error || "Failed to update customer");
        }
        // If result doesn't have success property but has customer data, it's OK
        if (!result.customer) {
          throw new Error("Invalid response from server");
        }
      }
      
      // Refresh the list
      await loadCustomers();
      
      return result;
    } catch (e) {
      console.error('Edit customer error:', e);
      throw e; // Re-throw to show error in modal
    }
  }
  
  async function handleDeleteCustomer() {
    if (!selectedCustomer) return;
    
    console.log('Deleting customer:', selectedCustomer.customerId);
    
    try {
      const result = await apiService.deleteCustomer(selectedCustomer.customerId);
      
      console.log('Delete API result:', result);
      
      if (result && result.success) {
        Alert.alert("Success", "Customer deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedCustomer(null);
        loadCustomers(); // Refresh list
      } else {
        Alert.alert("Error", result?.error || "Failed to delete customer");
      }
    } catch (error) {
      console.error('Delete customer error:', error);
      Alert.alert("Error", error.message || "Failed to delete customer");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 10 }}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Customers</Text>

      {/* TOP ACTION BUTTONS */}
      <TouchableOpacity style={styles.primaryTop} onPress={() => setShowAdd(true)}>
        <Text style={styles.primaryText}>Add Customer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.primaryTop}
        onPress={() => {
          if (customers.length === 0) return Alert.alert("No customers", "There are no customers to edit.");
          setShowSelectForEdit(true);
        }}
      >
        <Text style={styles.primaryText}>Edit Customer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryTop, { backgroundColor: "#1f9c8d" }]}
        onPress={() => {
          if (customers.length === 0) return Alert.alert("No customers", "There are no customers to delete.");
          setShowSelectForDelete(true);
        }}
      >
        <Text style={styles.primaryText}>Delete Customer</Text>
      </TouchableOpacity>

      {/* CUSTOMER LIST */}
      {loading ? (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="large" color="#1f9c8d" />
        </View>
      ) : (
        <ScrollView style={{ marginTop: 15 }} showsVerticalScrollIndicator>
          {customers.map((c) => (
            <View key={c.customerId} style={styles.customerCard}>
              <Text style={styles.customerName}>{c.customerName}</Text>
              <Text style={styles.customerSub}>ID: {c.customerId}</Text>
              <Text style={{ fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' }}>
                📍 Maps: {c.maps?.length || 0} | 
                🎯 Stations: {c.maps?.reduce((total, map) => total + (map.stations?.length || 0), 0) || 0}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODALS */}
      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            try {
              await handleAddCustomer(data);
              Alert.alert("Success", "Customer created successfully!");
              setShowAdd(false);
            } catch (e) {
              Alert.alert("Error", e?.message || "Failed to create customer");
            }
          }}
        />
      )}

      {showSelectForEdit && (
        <CustomerSelectModal
          title="Select Customer to Edit"
          subtitle="Choose a customer from the list"
          customers={customers}
          onClose={() => setShowSelectForEdit(false)}
          onSelect={(c) => {
            setSelectedCustomer(c);
            setShowSelectForEdit(false);
            setShowEdit(true);
          }}
        />
      )}

      {showEdit && selectedCustomer && (
        <EditCustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowEdit(false);
            setSelectedCustomer(null);
          }}
          onSave={async (data) => {
            try {
              await handleEditCustomer(data);
              Alert.alert("Success", "Customer updated successfully!");
              setShowEdit(false);
              setSelectedCustomer(null);
            } catch (e) {
              Alert.alert("Error", e?.message || "Failed to update customer");
            }
          }}
        />
      )}

      {showSelectForDelete && (
        <CustomerSelectModal
          title="Select Customer to Delete"
          subtitle="Choose a customer from the list"
          customers={customers}
          onClose={() => setShowSelectForDelete(false)}
          onSelect={(c) => {
            setSelectedCustomer(c);
            setShowSelectForDelete(false);
            setShowDeleteConfirm(true);
          }}
        />
      )}

      {showDeleteConfirm && selectedCustomer && (
        <DeleteCustomerModal
          customerName={selectedCustomer.customerName}
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleDeleteCustomer}
        />
      )}
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  back: { color: "#1f9c8d", fontWeight: "bold", fontSize: 16 },

  screenTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 15 },

  primaryTop: {
    backgroundColor: "#1f9c8d",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12
  },

  primaryText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  customerCard: {
    backgroundColor: "#f1f1f1",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10
  },
  customerName: { fontSize: 18, fontWeight: "bold" },
  customerSub: { color: "#666", marginTop: 3 },

  overlay: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    padding: 20
  },

  modalScroll: { flexGrow: 1, justifyContent: "center" },

  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 18 },

  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  modalSub: { fontSize: 15, color: "#555" },

  inputLabel: { fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12
  },

  row: { flexDirection: "row", marginTop: 16 },

  primaryButton: {
    flex: 1,
    backgroundColor: "#1f9c8d",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#ccc",
    padding: 14,
    borderRadius: 10,
    alignItems: "center"
  },
  cancelText: { fontWeight: "bold", color: "#333" },

  dangerButton: {
    flex: 1,
    backgroundColor: "#1f9c8d",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10
  },

  confirmCard: { backgroundColor: "#fff", borderRadius: 12, padding: 18 },

  selectCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    maxHeight: "85%"
  },
  selectItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  selectItemTitle: { fontSize: 16, fontWeight: "600", color: "#222" },
  selectItemSub: { fontSize: 13, color: "#666", marginTop: 3 },

  cancelWide: {
    marginTop: 12,
    backgroundColor: "#1f9c8d",
    padding: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  cancelWideText: { color: "#fff", fontWeight: "bold" },

  // NEW STYLES FOR MAP UPLOAD
  mapSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee"
  },

  uploadedMapsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },

  uploadedMapsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8
  },

  uploadedMapItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef"
  },

  uploadedMapName: {
    fontSize: 14,
    color: "#555"
  },

  removeMapBtn: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },

  removeMapText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold"
  },

  mapUploadContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8
  },

  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },

  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },

  changeImageBtn: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },

  changeImageText: {
    color: '#fff',
    fontSize: 14,
  },

  mapUploadButtons: {
    flexDirection: "row",
    marginTop: 10
  }
});