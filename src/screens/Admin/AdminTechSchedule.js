import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator
} from "react-native";
import apiService, { API_BASE_URL } from "../../services/apiService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, SafeAreaView } from 'react-native';

export default function AdminTechSchedule({ onClose }) {
  const [scheduleData, setScheduleData] = useState({ techs: [], schedule: [] });
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      console.log("Loading schedule data...");
      
      // Load schedule
      const schedResult = await apiService.getSchedule();
      console.log("Schedule API response:", schedResult);
      
      // Handle schedule response structure
      let techs = [];
      let schedule = [];
      
      if (schedResult && schedResult.success === true) {
        techs = schedResult.schedule?.techs || [];
        schedule = schedResult.schedule?.schedule || [];
      } else if (schedResult && Array.isArray(schedResult)) {
        schedule = schedResult;
      } else if (schedResult && schedResult.schedule) {
        techs = schedResult.schedule.techs || [];
        schedule = schedResult.schedule.schedule || [];
      }
      
      console.log("Parsed schedule data:", { techs, schedule });
      setScheduleData({ techs, schedule });
      
      // Load technicians separately
      await loadTechnicians();
      
      // Load customers
      const custResult = await apiService.getCustomers();
      console.log("Customers API response:", custResult);
      setCustomers(Array.isArray(custResult) ? custResult : []);
      
    } catch (error) {
      console.error("Failed to load initial data:", error);
      Alert.alert("Error", "Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  }

  async function loadTechnicians() {
    try {
      console.log("Loading technicians...");
      const techResult = await apiService.getTechnicians();
      console.log("Technicians API response:", techResult);
      
      let techsList = [];
      if (Array.isArray(techResult)) {
        techsList = techResult.map(tech => ({
          id: tech.technicianId,
          name: `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.username,
          firstName: tech.firstName,
          lastName: tech.lastName,
          username: tech.username
        }));
      }
      
      console.log("Formatted technicians:", techsList);
      setTechnicians(techsList);
      
      // Auto-select first technician if none selected
      if (techsList.length > 0 && !selectedTech) {
        setSelectedTech(techsList[0].id);
      }
      
    } catch (error) {
      console.error("Failed to load technicians:", error);
      Alert.alert("Error", "Failed to load technicians");
      setTechnicians([]);
    }
  }

  async function saveSchedule() {
    try {
      const updated = {
        techs: technicians,
        schedule: scheduleData.schedule,
      };

      console.log("Saving schedule:", updated);
      const result = await apiService.updateSchedule(updated);

      if (result && result.success === true) {
        Alert.alert("Saved", "Schedule updated!");
      } else {
        Alert.alert("Error", result?.error || "Failed to save schedule");
      }
      console.log("Schedule save response:", result);
    } catch (error) {
      console.error("Save schedule error:", error);
      Alert.alert("Error", error.message || "Failed to save schedule");
    }
  }

  function addCustomerToSchedule(customerId) {
    if (!selectedTech) return Alert.alert("Pick a technician first");
    if (!time.trim()) return Alert.alert("Enter appointment time (HH:MM)");

    // Basic validation
    if (!/^\d{2}:\d{2}$/.test(time.trim())) {
      return Alert.alert("Invalid time", "Use format HH:MM (e.g., 09:30 or 14:00)");
    }

    const [hours, minutes] = time.trim().split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return Alert.alert("Invalid time", "Hours must be 00-23, minutes 00-59");
    }

    const dayKey = selectedDate.toISOString().split("T")[0];
    
    // Check for duplicate time slot
    const existingAppointment = scheduleData.schedule.find(
      s => s.techId === selectedTech && 
           s.date === dayKey && 
           s.time === time.trim()
    );
    
    if (existingAppointment) {
      return Alert.alert("Time Slot Taken", "This time slot is already booked for the selected technician");
    }

    const newSchedule = [...scheduleData.schedule];
    newSchedule.push({
      techId: selectedTech,
      date: dayKey,
      time: time.trim(),
      customerId,
    });
    
    setScheduleData(prev => ({ ...prev, schedule: newSchedule }));
    setTime(""); // Clear time input
  }

  function removeCustomer(techId, date, time, customerId) {
    Alert.alert(
      "Remove Appointment",
      "Are you sure you want to remove this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            const newSchedule = scheduleData.schedule.filter(
              (s) => !(
                s.techId === techId &&
                s.date === date &&
                s.time === time &&
                s.customerId === customerId
              )
            );
            setScheduleData(prev => ({ ...prev, schedule: newSchedule }));
          }
        }
      ]
    );
  }

  function getDayAssignments() {
    if (!selectedTech || !Array.isArray(scheduleData.schedule)) return [];

    const dayKey = selectedDate.toISOString().split("T")[0];

    return scheduleData.schedule
      .filter((s) => s.techId === selectedTech && s.date === dayKey)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Technician Schedule</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1f9c8d" />
            <Text style={styles.loadingText}>Loading schedule data...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
     <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Technician Schedule</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        {/* Pick Tech - CHANGED TO VERTICAL */}
        <Text style={styles.label}>Select Technician:</Text>
        {technicians.length === 0 ? (
          <Text style={styles.noDataText}>No technicians available. Add technicians first.</Text>
        ) : (
          <FlatList
            horizontal={false}  // Changed from horizontal
            data={technicians}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.techButton,
                  selectedTech === item.id && styles.selectedButton,
                ]}
                onPress={() => setSelectedTech(item.id)}
              >
                <Text style={[
                  styles.techText,
                  selectedTech === item.id && styles.selectedText
                ]}>
                  {item.name}
                </Text>
                <Text style={styles.techSubtext}>
                  {item.username}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 150 }} // Limit height if too many
          />
        )}

        {/* Pick Date */}
        <Text style={styles.label}>Date:</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateButtonText}>
            {selectedDate.toISOString().split("T")[0]}
          </Text>
          <Text style={styles.dateButtonSubtext}>(Tap to change)</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowPicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {/* Time Input */}
        <Text style={styles.label}>Appointment Time (HH:MM):</Text>
        <TextInput
          style={styles.timeInput}
          placeholder="e.g. 09:30"
          value={time}
          onChangeText={setTime}
          keyboardType="numbers-and-punctuation"
        />

        {/* Today's assignments */}
        <Text style={styles.subTitle}>
          Appointments for {selectedDate.toISOString().split("T")[0]}
        </Text>
        {getDayAssignments().length === 0 ? (
          <Text style={styles.noDataText}>No appointments scheduled for this day</Text>
        ) : (
          <FlatList
            data={getDayAssignments()}
            keyExtractor={(item, i) => `${item.date}-${item.time}-${i}`}
            renderItem={({ item }) => {
              const customer = customers.find(
                (c) => c.customerId === item.customerId
              );

              return (
                <View style={styles.assigned}>
                  <View style={styles.assignedInfo}>
                    <Text style={styles.assignedTime}>{item.time}</Text>
                    <Text style={styles.assignedCustomer}>
                      {customer?.customerName || `Customer ID: ${item.customerId}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      removeCustomer(
                        item.techId,
                        item.date,
                        item.time,
                        item.customerId
                      )
                    }
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}

        {/* Add Customer */}
        <Text style={styles.subTitle}>Add Customer to This Day</Text>
        {customers.length === 0 ? (
          <Text style={styles.noDataText}>No customers available</Text>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.customerId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerSelect}
                onPress={() => addCustomerToSchedule(item.customerId)}
              >
                <Text style={styles.customerName}>{item.customerName}</Text>
                <Text style={styles.customerId}>ID: {item.customerId}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Save */}
        <TouchableOpacity style={styles.saveButton} onPress={saveSchedule}>
          <Text style={styles.saveText}>Save Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadInitialData}
        >
          <Text style={styles.refreshText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>
     </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "white", 
    padding: 15 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold" 
  },
  closeBtn: {
    backgroundColor: "#1f9c8d",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
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
  label: { 
    fontWeight: "600", 
    marginTop: 15, 
    fontSize: 16 
  },
  subTitle: { 
    fontSize: 16, 
    marginTop: 20, 
    fontWeight: "600" 
  },
  noDataText: {
    fontStyle: "italic",
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  techButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "#f8f9fa",
  },
  selectedButton: {
    backgroundColor: "#1f9c8d",
    borderColor: "#1f9c8d",
  },
  techText: { 
    color: "#333",
    fontWeight: "500",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
  dateButton: {
    backgroundColor: "#1f9c8d",
    padding: 12,
    borderRadius: 6,
    marginTop: 5,
    alignItems: "center",
  },
  dateButtonText: { 
    color: "white", 
    fontWeight: "bold",
    fontSize: 16,
  },
  dateButtonSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    width: 120,
    marginTop: 5,
    fontSize: 16,
  },
  customerSelect: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "500",
  },
  customerId: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  saveButton: {
    marginTop: 25,
    backgroundColor: "#1f9c8d",
    padding: 16,
    borderRadius: 8,
  },
  saveText: { 
    textAlign: "center", 
    color: "white", 
    fontWeight: "bold",
    fontSize: 16,
  },
  refreshButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#6c757d",
    borderRadius: 6,
  },
  refreshText: { 
    textAlign: "center", 
    color: "white", 
    fontWeight: "bold" 
  },
  assigned: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    marginBottom: 6,
  },
  assignedInfo: {
    flex: 1,
  },
  assignedTime: {
    fontWeight: "bold",
    color: "#1f9c8d",
    fontSize: 16,
  },
  assignedCustomer: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },
  removeButton: {
    padding: 6,
    backgroundColor: "#dc3545",
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  removeText: { 
    color: "white", 
    fontWeight: "bold",
    fontSize: 14,
  },
});