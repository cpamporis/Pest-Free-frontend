// TechnicianHomeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";
import apiService, { API_BASE_URL } from "../../services/apiService";

export default function TechnicianHomeScreen({
  technician,
  onLogout,
  onSelectCustomer,
}) {
  const [customers, setCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      updateMarkedDates();
      updateTodayAppointments();
    }
  }, [appointments, selectedDate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load customers
      const customersResult = await apiService.getCustomers();
      setCustomers(Array.isArray(customersResult) ? customersResult : []);

      // Load schedule to get appointments for this technician
      const scheduleResult = await apiService.getSchedule();
      console.log("Schedule result:", scheduleResult);
      
      // Extract appointments for this technician
      let allAppointments = [];
      if (scheduleResult && scheduleResult.success && scheduleResult.schedule) {
        // Handle new structure
        if (scheduleResult.schedule.schedule) {
          allAppointments = scheduleResult.schedule.schedule.filter(
            appt => appt.techId === technician.id
          );
        } else if (Array.isArray(scheduleResult.schedule)) {
          // Handle old structure
          allAppointments = scheduleResult.schedule.filter(
            appt => appt.techId === technician.id
          );
        }
      } else if (Array.isArray(scheduleResult)) {
        // Handle array response
        allAppointments = scheduleResult.filter(
          appt => appt.techId === technician.id
        );
      }
      
      console.log("Technician appointments:", allAppointments);
      setAppointments(allAppointments);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const updateMarkedDates = () => {
    const marks = {};
    
    appointments.forEach(appt => {
      if (appt.date) {
        marks[appt.date] = {
          marked: true,
          dotColor: '#1f9c8d',
          selected: appt.date === selectedDate,
          selectedColor: '#1f9c8d'
        };
      }
    });

    // Mark today
    const today = new Date().toISOString().split('T')[0];
    if (!marks[today]) {
      marks[today] = {
        selected: today === selectedDate,
        selectedColor: '#1f9c8d'
      };
    } else {
      marks[today].selected = today === selectedDate;
      marks[today].selectedColor = '#1f9c8d';
    }

    setMarkedDates(marks);
  };

  const updateTodayAppointments = () => {
    const todayApps = appointments.filter(
      appt => appt.date === selectedDate
    ).sort((a, b) => a.time.localeCompare(b.time));
    
    setTodayAppointments(todayApps);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    onSelectCustomer(customer);
  };

  const handleAppointmentSelect = async (appointment) => {
    // Find customer from customers list
    const customer = customers.find(c => c.customerId === appointment.customerId);
    if (customer) {
      // Create a timer session object
      const session = {
        appointmentId: `${appointment.date}_${appointment.time}_${appointment.customerId}`,
        customer,
        appointmentTime: appointment.time,
        appointmentDate: appointment.date,
        startTime: null,
        elapsedTime: 0,
        isActive: false
      };
      
      onSelectCustomer(customer, session);
    } else {
      Alert.alert("Error", "Customer not found");
    }
  };

  // ========== CHECK IF APPOINTMENT IS PAST ==========
  const isPastAppointment = (appointmentDate) => {
    const today = new Date();
    const appointmentDay = new Date(appointmentDate);
    return appointmentDay < today;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {technician.name}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1f9c8d" />
          <Text style={styles.loadingText}>Loading your schedule...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Welcome, {technician.name}</Text>
          <Text style={styles.subtitle}>Technician Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Selection Dropdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Selection</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowCustomerDropdown(!showCustomerDropdown)}
        >
          <Text style={styles.dropdownButtonText}>
            {selectedCustomer ? selectedCustomer.customerName : "Select a Customer"}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        {showCustomerDropdown && (
          <View style={styles.dropdownList}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer.customerId}
                  style={styles.dropdownItem}
                  onPress={() => handleCustomerSelect(customer)}
                >
                  <Text style={styles.dropdownItemText}>
                    {customer.customerName}
                  </Text>
                  <Text style={styles.dropdownItemSubtext}>
                    {customer.address}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Calendar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Schedule</Text>
        <Calendar
          current={selectedDate}
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          theme={{
            selectedDayBackgroundColor: '#1f9c8d',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#1f9c8d',
            arrowColor: '#1f9c8d',
            monthTextColor: '#1f9c8d',
            textMonthFontWeight: 'bold',
            textDayFontSize: 14,
            textMonthFontSize: 16,
          }}
          style={styles.calendar}
        />
      </View>

      {/* Today's Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        
        {todayAppointments.length === 0 ? (
          <View style={styles.noAppointments}>
            <Text style={styles.noAppointmentsText}>No appointments scheduled</Text>
            <Text style={styles.noAppointmentsSubtext}>
              Select a customer manually above or wait for admin assignment
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.appointmentsList}>
            {todayAppointments.map((appointment, index) => {
              const customer = customers.find(c => c.customerId === appointment.customerId);
              
              return (
                <View key={`${appointment.date}_${appointment.time}_${index}`}>
                  <TouchableOpacity
                    style={styles.appointmentCard}
                    onPress={() => handleAppointmentSelect(appointment)}
                  >
                    <View style={styles.appointmentTime}>
                      <Text style={styles.appointmentTimeText}>{appointment.time}</Text>
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentCustomer}>
                        {customer?.customerName || `Customer ID: ${appointment.customerId}`}
                      </Text>
                      {customer?.address && (
                        <Text style={styles.appointmentAddress}>{customer.address}</Text>
                      )}
                    </View>
                    <View style={styles.appointmentAction}>
                      <Text style={styles.appointmentActionText}>→</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Refresh Button */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={loadInitialData}
      >
        <Text style={styles.refreshButtonText}>Refresh Schedule</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: "#1f9c8d",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
  },
  dropdownList: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    zIndex: 1000,
    maxHeight: 300,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  calendar: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingBottom: 10,
  },
  noAppointments: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
  },
  noAppointmentsText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  noAppointmentsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  appointmentsList: {
    maxHeight: 200,
  },
  appointmentCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
  },
  appointmentTime: {
    backgroundColor: "#1f9c8d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 15,
  },
  appointmentTimeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentCustomer: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  appointmentAddress: {
    fontSize: 12,
    color: "#666",
  },
  appointmentAction: {
    paddingLeft: 10,
  },
  appointmentActionText: {
    fontSize: 20,
    color: "#1f9c8d",
    fontWeight: "bold",
  },
  
  refreshButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});