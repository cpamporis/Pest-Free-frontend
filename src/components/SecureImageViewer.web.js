import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ProtectedAdminModal } from "./AdminSessionTimer";

export default function SecureImageViewer({
  images = [],
  imageIndex = 0,
  visible,
  onRequestClose,
  onImageIndexChange
}) {
  const [currentIndex, setCurrentIndex] = useState(imageIndex);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(imageIndex);
    }
  }, [imageIndex, visible]);

  const select = nextIndex => {
    if (nextIndex < 0 || nextIndex >= images.length) {
      return;
    }

    setCurrentIndex(nextIndex);
    onImageIndexChange?.(nextIndex);
  };

  const source = images[currentIndex];

  return (
    <ProtectedAdminModal
      animationType="fade"
      onRequestClose={onRequestClose}
      transparent
      visible={visible}
    >
      <View style={styles.container}>
        <TouchableOpacity
          accessibilityLabel="Close image viewer"
          accessibilityRole="button"
          onPress={onRequestClose}
          style={styles.closeButton}
        >
          <MaterialIcons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        {source ? (
          <Image
            resizeMode="contain"
            source={source}
            style={styles.image}
          />
        ) : (
          <Text style={styles.emptyText}>No image available</Text>
        )}

        {images.length > 1 ? (
          <View style={styles.navigation}>
            <TouchableOpacity
              accessibilityLabel="Previous image"
              disabled={currentIndex === 0}
              onPress={() => select(currentIndex - 1)}
              style={[
                styles.navigationButton,
                currentIndex === 0 && styles.disabled
              ]}
            >
              <MaterialIcons
                name="chevron-left"
                size={32}
                color="#fff"
              />
            </TouchableOpacity>

            <Text style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>

            <TouchableOpacity
              accessibilityLabel="Next image"
              disabled={currentIndex === images.length - 1}
              onPress={() => select(currentIndex + 1)}
              style={[
                styles.navigationButton,
                currentIndex === images.length - 1 && styles.disabled
              ]}
            >
              <MaterialIcons
                name="chevron-right"
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ProtectedAdminModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    alignItems: "center",
    justifyContent: "center"
  },
  image: {
    width: "92%",
    height: "82%"
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10001
  },
  navigation: {
    position: "absolute",
    bottom: 22,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 24,
    padding: 4
  },
  navigationButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  disabled: {
    opacity: 0.3
  },
  counter: {
    minWidth: 58,
    color: "#fff",
    textAlign: "center",
    fontWeight: "700"
  },
  emptyText: {
    color: "#fff",
    fontSize: 16
  }
});
