//Dropdown.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const Dropdown = ({ label, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.input}
        onPress={() => setOpen(!open)}
      >
        <Text style={styles.inputText}>
          {options.find(o => o.value === selected)?.label || "Select"}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenu}>
            <ScrollView
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
            >
          {options.map((item) => (
            <TouchableOpacity
                key={item.value.toString()}
                style={styles.option}
                onPress={() => {
                onSelect(item.value);
                setOpen(false);
                }}
            >
                <Text style={styles.optionText}>{item.label}</Text>
            </TouchableOpacity>
            ))}
            </ScrollView>
        </View>
      )}
    </View>
  );
};

export default Dropdown;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: "relative", // 👈 REQUIRED
    },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#f8f9fa",
  },
  inputText: { fontSize: 16 },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 4,
    elevation: 10,   // 👈 increase
    zIndex: 1000,    // 👈 keep high
    maxHeight: 200,
    },
  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: { fontSize: 16 },
});