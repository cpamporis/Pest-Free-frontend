import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";

import { AdminSessionTimer } from "./AdminSessionTimer";

export default function SecureImageViewer({
  onRequestClose,
  ...viewerProps
}) {
  const Header = () => (
    <View style={styles.header}>
      <AdminSessionTimer />
      <TouchableOpacity
        accessibilityLabel="Close image viewer"
        accessibilityRole="button"
        onPress={onRequestClose}
        style={styles.closeButton}
      >
        <MaterialIcons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageViewing
      {...viewerProps}
      HeaderComponent={Header}
      onRequestClose={onRequestClose}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    height: 72,
    width: "100%",
    justifyContent: "center"
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10001,
    elevation: 10001
  }
});
