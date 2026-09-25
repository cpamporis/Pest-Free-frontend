import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";

import AdminHeaderSessionActions from "./AdminHeaderSessionActions";
import { authenticatedImageSource } from "./ProtectedImage";
import apiService from "../services/apiService";

export default function SecureImageViewer({
  onRequestClose,
  ...viewerProps
}) {
  const [token, setToken] = useState(apiService.getCurrentToken());

  useEffect(
    () => apiService.subscribePrivateImageSession(setToken),
    []
  );

  const Header = () => (
    <View style={styles.header}>
      <AdminHeaderSessionActions>
        <TouchableOpacity
          accessibilityLabel="Close image viewer"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRequestClose}
          style={styles.closeButton}
        >
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </AdminHeaderSessionActions>
    </View>
  );

  return (
    <ImageViewing
      {...viewerProps}
      visible={!!token && viewerProps.visible}
      images={(viewerProps.images || [])
        .map(source => authenticatedImageSource(source, token))
        .filter(Boolean)}
      HeaderComponent={Header}
      onRequestClose={onRequestClose}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    height: 72,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 12
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center"
  }
});
