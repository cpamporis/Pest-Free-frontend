import React from "react";
import {
  ActivityIndicator,
  Modal as NativeModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useAdminSession } from "../security/AdminSessionContext";

function formatRemaining(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const minuteText = String(minutes).padStart(2, "0");
  const secondText = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${minuteText}:${secondText}`
    : `${minuteText}:${secondText}`;
}

export function AdminSessionTimer() {
  const {
    session,
    remainingSeconds,
    refreshing,
    refreshError,
    refreshAdminSession
  } = useAdminSession();

  if (!session) {
    return null;
  }

  const urgent = remainingSeconds <= 60;
  const warning = !urgent && remainingSeconds <= 300;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          `Session ${formatRemaining(remainingSeconds)}. ` +
          "Press to refresh the session."
        }
        disabled={refreshing || remainingSeconds === 0}
        onPress={refreshAdminSession}
        style={[
          styles.timer,
          warning && styles.warning,
          urgent && styles.urgent,
          refreshing && styles.disabled
        ]}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <MaterialIcons name="refresh" size={17} color="#fff" />
        )}
        <Text style={styles.timerText}>
          {formatRemaining(remainingSeconds)}
        </Text>
      </TouchableOpacity>

      {refreshError ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          Δεν ανανεώθηκε — ο χρόνος συνεχίζει
        </Text>
      ) : null}
    </View>
  );
}

export function ProtectedAdminSurface({ children }) {
  return (
    <View style={styles.surface}>
      {children}
      <AdminSessionTimer />
    </View>
  );
}

export function ProtectedAdminModal({ children, ...modalProps }) {
  return (
    <NativeModal {...modalProps}>
      <ProtectedAdminSurface>
        {children}
      </ProtectedAdminSurface>
    </NativeModal>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1
  },
  overlay: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10000,
    elevation: 10000,
    alignItems: "center"
  },
  timer: {
    minWidth: 94,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: "#176d64",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  warning: {
    backgroundColor: "#b26a00"
  },
  urgent: {
    backgroundColor: "#b42318"
  },
  disabled: {
    opacity: 0.8
  },
  timerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginLeft: 5
  },
  error: {
    marginTop: 3,
    color: "#fff",
    backgroundColor: "rgba(180,35,24,0.94)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "600"
  }
});
