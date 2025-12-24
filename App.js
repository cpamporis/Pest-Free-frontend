// App.js - COMPLETE VERSION WITH MAPSCREEN TIMER
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import { PanGestureHandler, PinchGestureHandler } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { Calendar } from "react-native-calendars";
import AdminTechSchedule from "./src/screens/Admin/AdminTechSchedule";
import CustomersScreen from "./src/screens/Customers/CustomersScreen";
import TechniciansScreen from "./src/screens/Admin/TechniciansScreen";
import { processCustomerData } from "./src/utils/customerUtils.js";

import pestfreeLogo from "./assets/pestfree_logo.png";
import loginBackground from "./assets/background.jpg";

// MAPS
import porfiMapDefault from "./assets/porfi_01.png";
import porfiMapFinal from "./assets/porfi_storage_final.png";
import katoopsiMapDefault from "./assets/katoopsi_exo.png";
import katoopsiMapInside from "./assets/katoopsi_inside.png";

// At the top of App.js, add:
import { formatTime } from "./src/utils/timeUtils";

// External API service
import apiService from "./src/services/apiService";


const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window");

// MAP IMAGE MAPPING
const MAP_IMAGES = {
  "porfi_01.png": porfiMapDefault,
  "porfi_storage_final.png": porfiMapFinal,
  "katoopsi_exo.png": katoopsiMapDefault,
  "katoopsi_inside.png": katoopsiMapInside
};

// -------- TECHNICIANS (ADMIN MANAGED) --------

// Fallback customers (offline)
const INITIAL_CUSTOMERS = [
  processCustomerData({
    customerId: "01",
    customerName: "Porfi Hotel",
    address: "123 Hotel Street, Athens",
    email: "porfi@example.com",
    maps: [
      {
        mapId: "map_1",
        name: "Default Map",
        image: "porfi_01.png",
        stations: [
          { id: 1, x: 1056 / 1920, y: 467 / 1920 },
          { id: 2, x: 1091 / 1920, y: 510 / 1920 },
          { id: 3, x: 1110 / 1920, y: 560 / 1920 },
          { id: 4, x: 1120 / 1920, y: 680 / 1920 },
          { id: 5, x: 1000 / 1920, y: 700 / 1920 },
          { id: 6, x: 1120 / 1920, y: 740 / 1920 },
          { id: 7, x: 1150 / 1920, y: 887 / 1920 },
          { id: 8, x: 1150 / 1920, y: 1000 / 1920 },
          { id: 9, x: 1067 / 1920, y: 887 / 1920 },
          { id: 15, x: 1085 / 1920, y: 985 / 1920 },
          { id: 16, x: 1093 / 1920, y: 1047 / 1920 },
          { id: 17, x: 1166 / 1920, y: 1223 / 1920 },
          { id: 18, x: 1525 / 1920, y: 552 / 1920 },
          { id: 19, x: 1500 / 1920, y: 630 / 1920 },
          { id: 20, x: 580 / 1920, y: 1250 / 1920 },
          { id: 21, x: 330 / 1920, y: 1327 / 1920 },
          { id: 22, x: 530 / 1920, y: 1206 / 1920 },
          { id: 23, x: 610 / 1920, y: 1160 / 1920 },
          { id: 24, x: 580 / 1920, y: 1100 / 1920 },
          { id: 25, x: 445 / 1920, y: 1013 / 1920 },
          { id: 26, x: 482 / 1920, y: 912 / 1920 },
          { id: 27, x: 521 / 1920, y: 797 / 1920 },
          { id: 28, x: 577 / 1920, y: 649 / 1920 },
          { id: 29, x: 621 / 1920, y: 505 / 1920 },
          { id: 30, x: 737 / 1920, y: 311 / 1920 }
        ]
      },
      {
        mapId: "map_2",
        name: "Storage Τελικό",
        image: "porfi_storage_final.png",
        stations: []
      }
    ],
    sheetId: "",
    createdAt: new Date().toISOString()
  }),
  processCustomerData({
    customerId: "02",
    customerName: "Κάβα Συρδάρη",
    address: "456 Wine Street, Crete",
    email: "kava@example.com",
    maps: [
      {
        mapId: "map_1",
        name: "Default Map",
        image: "katoopsi_exo.png",
        stations: [
          { id: 1, x: 800.78 / 1920, y: 900.28 / 1920 },
          { id: 2, x: 935.1 / 1920, y: 840.9 / 1920 },
          { id: 3, x: 1050.5 / 1920, y: 760.5 / 1920 },
          { id: 4, x: 1170.38 / 1920, y: 700.5 / 1920 },
          { id: 5, x: 1270 / 1920, y: 600 / 1920 },
          { id: 6, x: 1490 / 1920, y: 370 / 1920 },
          { id: 7, x: 1425 / 1920, y: 520 / 1920 },
          { id: 8, x: 1350.5 / 1920, y: 700 / 1920 },
          { id: 9, x: 1445.28 / 1920, y: 845.14 / 1920 },
          { id: 10, x: 1400.41 / 1920, y: 1017.92 / 1920 },
          { id: 11, x: 1250.61 / 1920, y: 1160.04 / 1920 },
          { id: 12, x: 1150.42 / 1920, y: 1260.76 / 1920 },
          { id: 13, x: 980 / 1920, y: 1250 / 1920 },
          { id: 14, x: 800.12 / 1920, y: 1040.62 / 1920 },
          { id: 15, x: 1210.66 / 1920, y: 790.43 / 1920 }
        ]
      },
      {
        mapId: "map_2",
        name: "Inside Map",
        image: "katoopsi_inside.png",
        stations: []
      }
    ],
    sheetId: "",
    createdAt: new Date().toISOString()
  })
];

// --------------- MODALS & FORMS -----------------

function AddTechnicianModal({ onClose, onSave }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSave = () => {
    if (!firstName || !lastName || !username || !password) {
      Alert.alert("Error", "All required fields must be filled");
      return;
    }

    onSave({
      technicianId: `tech_${Date.now()}`,
      firstName,
      lastName,
      age,
      username,
      password
    });

    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.customerFormCard}>
            <Text style={styles.title}>Add Technician</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter age"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.formButtonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    flex: 0,
                    width: "45%",
                    alignSelf: "center"
                  }
                ]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function BaitStationForm({ stationId, onClose, customerId, technician, timerData, onStationLogged }) {
  const [consumption, setConsumption] = useState("");
  const [baitType, setBaitType] = useState("");
  const [condition, setCondition] = useState(null);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const saveData = async () => {
    const entry = {
      stationId,
      customerId,
      technicianId: technician?.id,
      technicianName: technician?.name,
      timestamp: new Date().toISOString(),
      consumption: consumption || "",
      baitType: baitType || "",
      condition: condition || "",
      access,
      startTime: timerData?.startTime,
      endTime: Date.now(),
      duration: timerData?.elapsedTime,
      appointmentId: timerData?.appointmentId,
      isVisitSummary: false
    };

    setLoading(true);
    try {
      const result = await apiService.logBaitStation(entry);

      if (result.success) {
        if (onStationLogged) {
          onStationLogged({
            stationId,
            timestamp: new Date().toISOString(),
            consumption: consumption || "",
            baitType: baitType || "",
            condition: condition || "",
            access: access || ""
          });
        }
        
        Alert.alert("Success", `Station ${stationId} logged successfully!`);
        onClose();
      } else {
        Alert.alert("Error", result.error || "Failed to save data");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Station {stationId}</Text>
            
            {timerData && (
              <View style={styles.timerInfo}>
                <Text style={styles.timerInfoText}>
                  Time spent: {formatTime(timerData.elapsedTime)}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bait Consumption %</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={consumption}
                onChangeText={setConsumption}
                placeholder="Enter bait consumption %"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bait Type</Text>
              <TextInput
                style={styles.input}
                value={baitType}
                onChangeText={setBaitType}
                placeholder="Enter bait type"
                editable={!loading}
              />
            </View>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Condition</Text>
              <View style={styles.toggleButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    condition === "Functional" && styles.toggleActive
                  ]}
                  onPress={() => !loading && setCondition("Functional")}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      condition === "Functional" && styles.toggleTextActive
                    ]}
                  >
                    Functional
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    condition === "Damaged" && styles.toggleActive
                  ]}
                  onPress={() => !loading && setCondition("Damaged")}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      condition === "Damaged" && styles.toggleTextActive
                    ]}
                  >
                    Damaged
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Access</Text>
              <View style={styles.toggleButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    access === "Yes" && styles.toggleActive
                  ]}
                  onPress={() => !loading && setAccess("Yes")}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.toggleText,
                    access === "Yes" && styles.toggleTextActive
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    access === "No" && styles.toggleActive
                  ]}
                  onPress={() => !loading && setAccess("No")}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      access === "No" && styles.toggleTextActive
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, loading && { opacity: 0.7 }]}
                onPress={saveData}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
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
        </ScrollView>
      </View>
    </Modal>
  );
}

// ------------------ TECHNICIAN HOME SCREEN ------------------

function TechnicianHomeScreen({ technician, onLogout, onSelectCustomer }) {
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
      const customersResult = await apiService.getCustomers();
      setCustomers(Array.isArray(customersResult) ? customersResult : []);

      const scheduleResult = await apiService.getSchedule();
      
      let allAppointments = [];
      if (scheduleResult && scheduleResult.success && scheduleResult.schedule) {
        if (scheduleResult.schedule.schedule) {
          allAppointments = scheduleResult.schedule.schedule.filter(
            appt => appt.techId === technician.id
          );
        } else if (Array.isArray(scheduleResult.schedule)) {
          allAppointments = scheduleResult.schedule.filter(
            appt => appt.techId === technician.id
          );
        }
      } else if (Array.isArray(scheduleResult)) {
        allAppointments = scheduleResult.filter(
          appt => appt.techId === technician.id
        );
      }
      
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
    onSelectCustomer(customer, null);
  };

  const handleAppointmentSelect = async (appointment) => {
    const customer = customers.find(c => c.customerId === appointment.customerId);
    if (customer) {
      const session = {
        appointmentId: `${appointment.date}_${appointment.time}_${appointment.customerId}`,
        customer,
        appointmentTime: appointment.time,
        appointmentDate: appointment.date,
        startTime: null,
        elapsedTime: 0,
        isActive: false,
        fromAppointment: true
      };
      
      onSelectCustomer(customer, session);
    } else {
      Alert.alert("Error", "Customer not found");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView style={styles.techContainer}>
        {/* Header */}
        <View style={styles.techHeader}>
          <View>
            <Text style={styles.techTitle}>Welcome, {technician.name}</Text>
            <Text style={styles.techSubtitle}>Technician Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.techLogoutBtn} onPress={onLogout}>
            <Text style={styles.techLogoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Selection Dropdown */}
        <View style={styles.techSection}>
          <Text style={styles.techSectionTitle}>Customer Selection</Text>
          <TouchableOpacity
            style={styles.techDropdownButton}
            onPress={() => setShowCustomerDropdown(!showCustomerDropdown)}
          >
            <Text style={styles.techDropdownButtonText}>
              {selectedCustomer ? selectedCustomer.customerName : "Select a Customer"}
            </Text>
            <Text style={styles.techDropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showCustomerDropdown && (
            <View style={styles.techDropdownList}>
              <ScrollView style={styles.techDropdownScroll} nestedScrollEnabled={true}>
                {customers.map((customer) => (
                  <TouchableOpacity
                    key={customer.customerId}
                    style={styles.techDropdownItem}
                    onPress={() => handleCustomerSelect(customer)}
                  >
                    <Text style={styles.techDropdownItemText}>
                      {customer.customerName}
                    </Text>
                    <Text style={styles.techDropdownItemSubtext}>
                      {customer.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Calendar */}
        <View style={styles.techSection}>
          <Text style={styles.techSectionTitle}>Your Schedule</Text>
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
            style={styles.techCalendar}
          />
      </View>

        {/* Today's Appointments */}
        <View style={styles.techSection}>
          <Text style={styles.techSectionTitle}>
            Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          {todayAppointments.length === 0 ? (
            <View style={styles.techNoAppointments}>
              <Text style={styles.techNoAppointmentsText}>No appointments scheduled</Text>
              <Text style={styles.techNoAppointmentsSubtext}>
                Select a customer manually above or wait for admin assignment
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.techAppointmentsList}>
              {todayAppointments.map((appointment, index) => {
                const customer = customers.find(c => c.customerId === appointment.customerId);
                return (
                  <TouchableOpacity
                    key={`${appointment.date}_${appointment.time}_${index}`}
                    style={styles.techAppointmentCard}
                    onPress={() => handleAppointmentSelect(appointment)}
                  >
                    <View style={styles.techAppointmentTime}>
                      <Text style={styles.techAppointmentTimeText}>{appointment.time}</Text>
                    </View>
                    <View style={styles.techAppointmentInfo}>
                      <Text style={styles.techAppointmentCustomer}>
                        {customer?.customerName || `Customer ID: ${appointment.customerId}`}
                      </Text>
                      {customer?.address && (
                        <Text style={styles.techAppointmentAddress}>{customer.address}</Text>
                      )}
                    </View>
                    <View style={styles.techAppointmentAction}>
                      <Text style={styles.techAppointmentActionText}>→</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity 
          style={styles.techRefreshButton}
          onPress={loadInitialData}
        >
          <Text style={styles.techRefreshButtonText}>Refresh Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
     </SafeAreaView>
  );
}

// ------------------ MAP SCREEN WITH TIMER ------------------

function MapScreen({ customer, onBack, session, technician }) {
  console.log("MapScreen received:", { 
    customer: customer?.customerName, 
    hasSession: !!session,
    technician: technician?.name 
  });

  const customerMaps = Array.isArray(customer?.maps) ? customer.maps : [];
  
  const [selectedMap, setSelectedMap] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showMapDropdown, setShowMapDropdown] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addingStation, setAddingStation] = useState(false);
  const [removingStation, setRemovingStation] = useState(false);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loggedStations, setLoggedStations] = useState([]);

  // TIMER STATES
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showSaveCancel, setShowSaveCancel] = useState(false);
  const [workStarted, setWorkStarted] = useState(false);
  const [visitId, setVisitId] = useState(null); 

  const getMapImageSource = (imageName) => {
    if (!imageName) return null;
    
    if (typeof imageName === 'number' || imageName.uri) {
      return imageName;
    }
    
    const imageSource = MAP_IMAGES[imageName];
    if (!imageSource) {
      console.warn(`Map image not found: ${imageName}`);
      return null;
    }
    
    return imageSource;
  };

  const startTimer = () => {
    if (timerActive) return;
    
    const start = Date.now();
    setStartTime(start);
    setTimerActive(true);
    setWorkStarted(true);
    setShowSaveCancel(true);
    setLoggedStations([]);

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - start);
    }, 1000);
    
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimerActive(false);
    setShowSaveCancel(false);
  };

  const handleSaveAll = async () => {
    stopTimer();
    
    const newVisitId = `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const visitSummary = {
      startTime: startTime,
      endTime: Date.now(),
      duration: elapsedTime,
      customerId: customer.customerId,
      customerName: customer.customerName,
      technicianId: technician?.id,
      technicianName: technician?.name,
      appointmentId: session?.appointmentId,
      workType: session?.fromAppointment ? 'Scheduled Appointment' : 'Manual Visit',
      visitId: newVisitId
    };
    
    const stations = loggedStations;
    
    console.log("📦 Sending complete visit data:", {
      visitSummary,
      stationCount: stations.length,
      stations: stations
    });
    
    if (stations.length === 0) {
      Alert.alert(
        "No Stations Logged",
        "You haven't logged any stations. Do you want to save just the visit summary?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Save Anyway", 
            onPress: async () => {
              try {
                const result = await apiService.logCompleteVisit(visitSummary, stations);
                handleSaveResponse(result);
              } catch (error) {
                Alert.alert("Error", error.message || "Failed to save data");
              }
            }
          }
        ]
      );
      return;
    }
    
    try {
      const result = await apiService.logCompleteVisit(visitSummary, stations);
      handleSaveResponse(result);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save data");
    }
  };

  const handleSaveResponse = (result) => {
    if (result && result.success) {
      Alert.alert(
        "Work Completed Successfully!",
        `Duration: ${formatTime(elapsedTime)}\n` +
        `Stations: ${result.stationCount || loggedStations.length} logged\n` +
        `Data saved successfully!`
      );
      
      setWorkStarted(false);
      setShowSaveCancel(false);
      setStartTime(null);
      setElapsedTime(0);
      setLoggedStations([]);
      setVisitId(null);
      
    } else {
      Alert.alert("Error", result?.error || "Failed to save visit data");
    }
  };

  const handleCancelWork = () => {
    Alert.alert(
      "Cancel Work Session",
      "Are you sure you want to cancel this work session? All unsaved station data will be lost.",
      [
        { 
          text: "No, Continue Working", 
          style: "cancel" 
        },
        { 
          text: "Yes, Cancel Work", 
          style: "destructive",
          onPress: () => {
            stopTimer();
            setTimerActive(false);
            setWorkStarted(false);
            setShowSaveCancel(false);
            setVisitId(null);
            setStartTime(null);
            setElapsedTime(0);
            
            if (timerInterval) {
              clearInterval(timerInterval);
              setTimerInterval(null);
            }
            
            Alert.alert(
              "Work Cancelled", 
              "Session cancelled. No data was saved.",
              [{ text: "OK", onPress: () => {} }]
            );
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (customerMaps.length > 0) {
      const firstMap = customerMaps[0];
      const imageSource = getMapImageSource(firstMap.image);
      
      const initialMap = {
        ...firstMap,
        stations: Array.isArray(firstMap.stations) ? firstMap.stations : [],
        mapId: firstMap.mapId || `map_${Date.now()}`,
        image: imageSource || firstMap.image
      };
      
      setSelectedMap(initialMap);
      setStations(initialMap.stations);
    }
  }, [customer]);

  const handleMapSelect = (map) => {
    const imageSource = getMapImageSource(map.image);
    const selected = {
      ...map,
      stations: Array.isArray(map.stations) ? map.stations : [],
      mapId: map.mapId || `map_${Date.now()}`,
      image: imageSource || map.image
    };
    
    setSelectedMap(selected);
    setStations(selected.stations);
    setShowMapDropdown(false);
  };

  const saveStations = async () => {
    if (!selectedMap) return;

    setSaving(true);
    try {
      const updatedMaps = customerMaps.map((map) => {
        if (map.mapId === selectedMap.mapId) {
          return {
            ...map,
            stations
          };
        }
        return map;
      });

      const updatedCustomer = {
        ...customer,
        maps: updatedMaps
      };

      const result = await apiService.updateCustomer(
        customer.customerId,
        updatedCustomer
      );

      if (result && result.success) {
        Alert.alert("Saved", "Stations locations saved to server!");
        setEditMode(false);
        setAddingStation(false);
        setRemovingStation(false);
      } else {
        Alert.alert("Error", result?.error || "Failed to save stations");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save stations.");
    } finally {
      setSaving(false);
    }
  };

  const startDrag = (id, gestureX, gestureY) => {
    const newStations = stations.map((s) =>
      s.id === id
        ? {
            ...s,
            x: Math.max(0, Math.min(1, (gestureX - offsetX) / (deviceWidth * scale))),
            y: Math.max(0, Math.min(1, (gestureY - offsetY) / (deviceWidth * scale)))
          }
        : s
    );
    setStations(newStations);
  };

  const handleMapPress = (evt) => {
    if (!addingStation || !selectedMap) return;

    const x = evt.nativeEvent.locationX;
    const y = evt.nativeEvent.locationY;

    const newStation = {
      id: stations.length ? Math.max(...stations.map((s) => s.id)) + 1 : 1,
      x: x / (deviceWidth * scale),
      y: y / (deviceWidth * scale)
    };

    setStations([...stations, newStation]);
    setAddingStation(false);
  };

  if (!selectedMap || customerMaps.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.topButtons}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.noMapContainer}>
          <Text style={styles.noMapText}>No maps available for this customer</Text>
          <Text style={styles.noMapSubtext}>Please contact admin to add maps</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar with Timer */}
      <View style={styles.topButtons}>
        {editMode ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setEditMode(false);
              setAddingStation(false);
              setRemovingStation(false);
            }}
          >
            <Text style={styles.backBtnText}>Cancel Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}

        {/* Timer Display */}
        {timerActive && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              ⏱ {formatTime(elapsedTime)}
            </Text>
          </View>
        )}

        {/* Start Button - only show if timer not active and session exists */}
        {!timerActive && session && !workStarted && (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startTimer}
          >
            <Text style={styles.startButtonText}>▶ Start Work</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.chooseMapBtn}
          onPress={() => setShowMapDropdown(!showMapDropdown)}
        >
          <Text style={styles.backBtnText}>Choose Map ▼</Text>
        </TouchableOpacity>
      </View>

      {showMapDropdown && (
        <View style={styles.mapDropdown}>
          {customerMaps.map((map, index) => (
            <TouchableOpacity
              key={map.mapId || `map_${index}`}
              style={styles.mapDropdownItem}
              onPress={() => handleMapSelect(map)}
            >
              <Text>{map.name || `Map ${index + 1}`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        maximumZoomScale={4}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapContainer}>
          <PinchGestureHandler
            onGestureEvent={(e) =>
              setScale(Math.max(1, Math.min(3, e.nativeEvent.scale)))
            }
          >
            <Animated.View>
              <TouchableOpacity activeOpacity={1} onPress={handleMapPress}>
                {selectedMap.image ? (
                  <Image
                    source={selectedMap.image}
                    style={styles.map}
                    resizeMode="contain"
                    onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text>No map image available</Text>
                  </View>
                )}

                {stations.map((st) => {
                  const left = st.x * deviceWidth * scale;
                  const top = st.y * deviceWidth * scale;

                  return (
                    <PanGestureHandler
                      key={st.id}
                      onGestureEvent={(evt) =>
                        editMode &&
                        startDrag(st.id, evt.nativeEvent.x, evt.nativeEvent.y)
                      }
                    >
                      <Animated.View style={[styles.marker, { 
                        left, 
                        top,
                        transform: [
                          { translateX: -14 },
                          { translateY: -14 }
                        ]
                      }]}>
                        <TouchableOpacity
                          style={{
                            width: "100%",
                            height: "100%",
                            justifyContent: "center",
                            alignItems: "center"
                          }}
                          onPress={() => {
                            if (!editMode && workStarted) {
                              setSelectedStation(st.id);
                            } else if (editMode && removingStation) {
                              setStations(stations.filter((s) => s.id !== st.id));
                            } else if (!workStarted && !editMode) {
                              Alert.alert("Info", "Start work first to log station data");
                            }
                          }}
                        >
                          <Text style={styles.markerText}>{st.id}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </PanGestureHandler>
                  );
                })}
              </TouchableOpacity>
            </Animated.View>
          </PinchGestureHandler>
        </View>
      </ScrollView>

      {editMode && (
        <View style={styles.editButtons}>
          <TouchableOpacity
            style={[styles.editBtn, saving && { opacity: 0.7 }]}
            onPress={() => setAddingStation(true)}
            disabled={saving}
          >
            <Text style={styles.editBtnText}>Add Station</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editBtn, saving && { opacity: 0.7 }]}
            onPress={() => setRemovingStation(true)}
            disabled={saving}
          >
            <Text style={styles.editBtnText}>Remove Station</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editBtn, saving && { opacity: 0.7 }]}
            onPress={saveStations}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.editBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!editMode && !workStarted && (
        <View style={styles.centerButton}>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
            <Text style={styles.editBtnText}>Edit Map</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Save/Cancel Buttons for Timer */}
      {showSaveCancel && (
        <View style={styles.saveCancelContainer}>
          <TouchableOpacity 
            style={[styles.saveCancelButton, styles.cancelWorkButton]}
            onPress={handleCancelWork}
          >
            <Text style={styles.cancelWorkButtonText}>Cancel Work</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveCancelButton, styles.saveWorkButton]}
            onPress={handleSaveAll}
          >
            <Text style={styles.saveWorkButtonText}>Finish & Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedStation && workStarted && (
        <BaitStationForm
          stationId={selectedStation}
          customerId={customer.customerId}
          technician={technician}
          timerData={{
            startTime,
            elapsedTime,
            appointmentId: session?.appointmentId,
            visitId: visitId
          }}
          onStationLogged={(stationData) => {
            console.log("📍 Station logged:", stationData);
            setLoggedStations(prev => [...prev, stationData]);
          }}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </View>
  );
}

// ------------------ CUSTOMER SELECTOR ------------------

function CustomerSelector({ onSelect, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getCustomers();

      if (!Array.isArray(result)) {
        console.error("Unexpected customers response:", result);
        throw new Error("Invalid customers response");
      }

      const processed = result.map(processCustomerData);
      setCustomers(processed);
    } catch (error) {
      console.error("Failed to fetch customers from API:", error);
      setError("Failed to load customers. Using offline data.");
      setCustomers(INITIAL_CUSTOMERS);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCustomers();
  };

  if (loading) {
    return (
      <View style={styles.customerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.customerTitle}>Select a Customer</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1f9c8d" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.customerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.customerTitle}>Select a Customer</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Retry</Text>
        </TouchableOpacity>
        {customers.map((c) => (
          <TouchableOpacity
            key={c.customerId}
            style={styles.customerBtn}
            onPress={() => onSelect(c)}
          >
            <Text style={styles.customerBtnText}>
              {c.customerId} — {c.customerName}
            </Text>
            <Text style={styles.offlineBadge}>Offline</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.customerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.customerTitle}>Select a Customer</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>

      {customers.map((c) => (
        <TouchableOpacity
          key={c.customerId}
          style={styles.customerBtn}
          onPress={() => onSelect(c)}
        >
          <Text style={styles.customerBtnText}>
            {c.customerId} — {c.customerName}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ------------------ ADMIN HOME ------------------

function AdminHomeScreen({ onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showTechSchedule, setShowTechSchedule] = useState(false);
  const [showTechnicians, setShowTechnicians] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await apiService.getCustomers();

      if (!Array.isArray(result)) {
        console.error("Unexpected customers response:", result);
        throw new Error("Invalid customers response");
      }

      const processed = result.map(processCustomerData);
      setCustomers(processed);
    } catch (error) {
      console.error("Failed to fetch customers from API:", error);
      Alert.alert("Error", "Failed to load customers. Using offline data.");
      setCustomers(INITIAL_CUSTOMERS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.adminContainer}
      contentContainerStyle={styles.adminScrollContent}
    >
      <Image source={pestfreeLogo} style={styles.adminLogo} resizeMode="contain" />
      <Text style={styles.adminTitle}>Admin Home</Text>

      <TouchableOpacity style={styles.logoutBtnAdmin} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.adminButton, { backgroundColor: "#6c757d", marginBottom: 20 }]}
        onPress={async () => {
          try {
            const test = await fetch(`${API_BASE_URL}/customers`);
            const data = await test.json();
            Alert.alert("API Test", `Connection OK! Found ${data.length} customers.`);
          } catch (error) {
            Alert.alert("API Test Failed", error.message);
          }
        }}
      >
        <Text style={styles.adminButtonText}>Test API Connection</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#1f9c8d" style={{ marginTop: 20 }} />
      ) : (
        <View style={{ width: "100%" }}>

          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => setShowCustomers(true)}
          >
            <Text style={styles.adminButtonText}>Customers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminButton, { backgroundColor: "#1f9c8d", marginBottom: 20 }]}
            onPress={() => setShowTechSchedule(true)}
          >
            <Text style={styles.adminButtonText}>Technician Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminButton, { backgroundColor: "#1f9c8d", marginBottom: 20 }]}
            onPress={() => setShowTechnicians(true)}
          >
            <Text style={styles.adminButtonText}>Technicians</Text>
          </TouchableOpacity>
        </View>
      )}

      {showTechSchedule && (
        <Modal animationType="slide" transparent={false} visible>
          <AdminTechSchedule onClose={() => setShowTechSchedule(false)} />
        </Modal>
      )}
      {showCustomers && (
        <Modal animationType="slide" visible>
          <CustomersScreen onClose={() => setShowCustomers(false)} />
        </Modal>
      )}

      {showTechnicians && (
        <Modal animationType="slide" visible>
          <TechniciansScreen onClose={() => setShowTechnicians(false)} />
        </Modal>
      )}
    </ScrollView>
  );
}

// ------------------ LOGIN & ROOT APP ------------------

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [loggedTechnician, setLoggedTechnician] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  const tryLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    const result = await apiService.login(email, password);

    if (!result || !result.success) {
      Alert.alert("Login Failed", result?.error || "Invalid credentials");
      setPassword("");
      return;
    }

    if (result.role === "admin") {
      setIsAdmin(true);
      setIsLoggedIn(true);
      return;
    }

    if (result.role === "tech") {
      setLoggedTechnician(result.user);
      setIsAdmin(false);
      setIsLoggedIn(true);
      return;
    }

    Alert.alert("Login Failed", "Invalid credentials");
    setPassword("");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setEmail("");
    setPassword("");
    setCurrentCustomer(null);
    setLoggedTechnician(null);
    setCurrentSession(null);
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        {/* Background Image */}
        <Image 
          source={loginBackground} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        {/* Dark overlay for text readability */}
        <View style={styles.backgroundOverlay} />
        
        {/* Login Content */}
        <View style={styles.loginContent}>
          <Image source={pestfreeLogo} style={styles.logo} resizeMode="contain" />

          <TextInput
            style={styles.loginInput}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.loginInput}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginButton} onPress={tryLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isAdmin) {
    return (
      <AdminHomeScreen onLogout={handleLogout} />
    );
  }

  if (loggedTechnician && currentCustomer) {
    return (
      <MapScreen
        customer={currentCustomer}
        onBack={() => {
          setCurrentCustomer(null);
          setCurrentSession(null);
        }}
        session={currentSession}
        technician={loggedTechnician}
      />
    );
  }

  if (loggedTechnician) {
    return (
      <TechnicianHomeScreen
        technician={loggedTechnician}
        onLogout={handleLogout}
        onSelectCustomer={(customer, session) => {
          console.log("Customer selected:", customer.customerName);
          if (session) {
            setCurrentSession({
              ...session,
              technicianId: loggedTechnician.id,
              technicianName: loggedTechnician.name
            });
          }
          setCurrentCustomer(customer);
        }}
      />
    );
  }

  return (
    <View style={styles.loginContainer}>
      <Image source={pestfreeLogo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.loginTitle}>Session Error</Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogout}>
        <Text style={styles.loginButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// ------------------ STYLES ------------------

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  loginContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1,
  },
  logo: {
    width: deviceWidth * 0.7,
    height: deviceWidth * 0.35,
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#fff",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loginInput: {
    width: "85%",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: "#1f9c8d",
    padding: 18,
    borderRadius: 10,
    width: "85%",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  container: { flex: 1, backgroundColor: "#fff" },
  
  customerContainer: { flex: 1, justifyContent: "center", padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30
  },
  customerTitle: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  customerBtn: {
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#1f9c8d",
    marginBottom: 20,
    position: "relative"
  },
  customerBtnText: { color: "#fff", fontSize: 18, textAlign: "center", fontWeight: "bold" },
  offlineBadge: {
    position: "absolute",
    top: 5,
    right: 10,
    backgroundColor: "#ff9800",
    color: "#fff",
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  loadingContainer: { alignItems: "center", justifyContent: "center", padding: 40 },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  errorText: { color: "#dc3545", textAlign: "center", marginBottom: 20 },
  refreshButton: {
    backgroundColor: "#1f9c8d",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center"
  },
  refreshButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  logoutBtn: {
    backgroundColor: "#1f9c8d",
    padding: 10,
    borderRadius: 8
  },
  logoutBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  logoutBtnAdmin: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#1f9c8d",
    padding: 10,
    borderRadius: 8
  },

  backBtn: {
    backgroundColor: "#1f9c8d",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    zIndex: 10
  },
  backBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  chooseMapBtn: {
    position: "absolute",
    right: 20,
    backgroundColor: "#1f9c8d",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 15
  },

  topButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40
  },

  timerContainer: {
    backgroundColor: '#1f9c8d',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  timerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveCancelContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveWorkButton: {
    backgroundColor: '#1f9c8d',
  },
  saveWorkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelWorkButton: {
    backgroundColor: '#dc3545',
  },
  cancelWorkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  timerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timerInfoText: {
    fontSize: 14,
    color: '#1f9c8d',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  mapDropdown: {
    position: "absolute",
    right: 20,
    top: Platform.OS === "ios" ? 100 : 80,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5
  },

  mapDropdownItem: { paddingVertical: 8, paddingHorizontal: 12 },
  mapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    width: "100%",
    height: "100%"
  },
  map: { width: "100%", height: undefined, aspectRatio: 1 },
  marker: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(31, 156, 142, 0.8)",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center"
  },
  markerText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  noMapContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  noMapText: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#666" },
  noMapSubtext: { fontSize: 16, color: "#999", textAlign: "center" },

  overlay: { flex: 1, justifyContent: "center", backgroundColor: "#0008", padding: 20 },
  scrollContainer: { flexGrow: 1, justifyContent: "center" },
  card: { width: "95%", maxWidth: 550, backgroundColor: "#fff", padding: 24, borderRadius: 12 },
  customerFormCard: {
    width: "95%",
    maxWidth: 550,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12
  },
  confirmationCard: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12
  },
  selectionCard: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#dc3545"
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#1f9c8d"
  },
  selectionSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center"
  },
  confirmationText: { fontSize: 18, marginBottom: 15, textAlign: "center" },
  warningText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
    fontStyle: "italic"
  },
  customerIdText: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  noteText: { fontSize: 14, color: "#666", marginBottom: 25, textAlign: "center" },

  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  input: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc"
  },

  toggleContainer: { marginBottom: 25 },
  toggleLabel: { fontSize: 16, marginBottom: 12 },
  toggleButtonsContainer: { flexDirection: "row" },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
    alignItems: "center"
  },
  toggleActive: { backgroundColor: "#1f9c8d", borderColor: "#1f9c8d" },
  toggleText: { fontSize: 16, color: "#555" },
  toggleTextActive: { color: "#fff", fontWeight: "bold" },

  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  formButtonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  confirmationButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#1f9c8d",
    padding: 16,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center"
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ccc",
    padding: 16,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center"
  },
  cancelButtonText: { color: "#333", fontSize: 16, fontWeight: "bold" },
  dangerButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    padding: 16,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center"
  },
  dangerButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  editButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  editBtn: {
    backgroundColor: "#1f9c8d",
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center"
  },
  editBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  centerButton: { position: "absolute", bottom: 30, alignSelf: "center" },

  adminContainer: {
    flex: 1,
    backgroundColor: "#fff"
  },
  adminScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40
  },
  adminLogo: { width: deviceWidth * 0.6, height: deviceWidth * 0.3, marginBottom: 20 },
  adminTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 30 },
  adminButton: {
    backgroundColor: "#1f9c8d",
    paddingVertical: 16,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center"
  },
  adminButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  techContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  techScrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  techHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  techTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  techSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  techLogoutBtn: {
    backgroundColor: "#1f9c8d",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  techLogoutBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  techSection: {
    marginBottom: 25,
  },
  techSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  techDropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  techDropdownButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  techDropdownArrow: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
  },
  techDropdownList: {
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
  techDropdownScroll: {
    maxHeight: 300,
  },
  techDropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  techDropdownItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  techDropdownItemSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  techCalendar: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingBottom: 10,
  },
  techNoAppointments: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
  },
  techNoAppointmentsText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  techNoAppointmentsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  techAppointmentsList: {
    maxHeight: 200,
  },
  techAppointmentCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
  },
  techAppointmentTime: {
    backgroundColor: "#1f9c8d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 15,
  },
  techAppointmentTimeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  techAppointmentInfo: {
    flex: 1,
  },
  techAppointmentCustomer: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  techAppointmentAddress: {
    fontSize: 12,
    color: "#666",
  },
  techAppointmentAction: {
    paddingLeft: 10,
  },
  techAppointmentActionText: {
    fontSize: 20,
    color: "#1f9c8d",
    fontWeight: "bold",
  },
  techRefreshButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  techRefreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  placeholderImage: {
    width: deviceWidth,
    height: deviceWidth,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
});