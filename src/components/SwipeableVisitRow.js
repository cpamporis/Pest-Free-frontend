// components/SwipeableVisitRow.js - UPDATED
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { MaterialIcons } from '@expo/vector-icons';
import apiService from '../services/apiService';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import i18n from "../services/i18n";

export default function SwipeableVisitRow({ 
  visit, 
  onPress,
  customerName,
  isNested = false,
  appointmentId
}) {
  const swipeableRef = useRef(null);
  const [activeDownloadType, setActiveDownloadType] = useState(null);

  const isDownloading = activeDownloadType !== null;

  const serviceType = String(
    visit.serviceType ??
    visit.service_type ??
    visit.serviceCategory ??
    visit.service_category ??
    ""
  )
    .trim()
    .toLowerCase();

  const isCertificateService = [
    "certificate",
    "certification",
    "st"
  ].includes(serviceType);

  const visitDate =
    visit.appointmentDate ??
    visit.appointment_date ??
    visit.startTime ??
    visit.start_time ??
    visit.date ??
    visit.createdAt ??
    visit.created_at ??
    null;

  const getVisitYear = (value) => {
    if (!value) return null;

    const directYear = String(value).match(/^(\d{4})/);
    if (directYear) return Number(directYear[1]);

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime())
      ? null
      : parsedDate.getFullYear();
  };

  const certificateYear = getVisitYear(visitDate);
  const currentYear = new Date().getFullYear();
  const canDownloadCertificate =
    isCertificateService &&
    certificateYear === currentYear;

  const locale = String(i18n.getLocale() || "").toLowerCase();
  const isGreek = locale.startsWith("el") || locale.startsWith("gr");

  const certificateCopy = {
    label: isGreek ? "Πιστοποιητικό" : "Certificate",
    title: isGreek
      ? "Λήψη πιστοποιητικού"
      : "Download Certificate",
    confirmation: isGreek
      ? `Θέλετε να κατεβάσετε το πιστοποιητικό του ${certificateYear};`
      : `Do you want to download the ${certificateYear} certificate?`,
    unavailable: isGreek
      ? "Το πιστοποιητικό είναι διαθέσιμο μόνο για το τρέχον έτος."
      : "The certificate is available only for the current year."
  };
  
  const handleDownloadPDF = (documentType = "report") => {
    // Close swipeable first
    swipeableRef.current?.close();

    if (documentType === "certificate" && !canDownloadCertificate) {
      Alert.alert(certificateCopy.title, certificateCopy.unavailable);
      return;
    }

    const isCertificate = documentType === "certificate";
    const alertTitle = isCertificate
      ? certificateCopy.title
      : i18n.t("components.swipeableVisitRow.downloadReport");

    const alertMessage = isCertificate
      ? certificateCopy.confirmation
      : i18n.t("components.swipeableVisitRow.downloadConfirm", {
          service:
            visit.serviceType ||
            i18n.t("components.swipeableVisitRow.service") ||
            "service"
        });
    
    Alert.alert(
      alertTitle,
      alertMessage,
      [
        { 
          text: i18n.t("components.swipeableVisitRow.cancel"), 
          style: "cancel"
        },
        { 
          text: i18n.t("components.swipeableVisitRow.download"), 
          style: "default",
          onPress: async () => {
            try {
              await downloadPDF(documentType);
            } catch (error) {
              console.error("❌ Download error:", error);
            }
          }
        }
      ]
    );
  };

  const getTranslatedServiceType = (type) => {
    const typeLower = type?.toLowerCase() || '';
    
    if (typeLower.includes('myocide')) {
      return i18n.t("components.swipeableVisitRow.serviceTypes.myocide");
    }
    if (typeLower.includes('certificate')) {
      return i18n.t("components.swipeableVisitRow.serviceTypes.certificate");
    }
    if (typeLower.includes('insecticide')) {
      return i18n.t("components.swipeableVisitRow.serviceTypes.insecticide");
    }
    if (typeLower.includes('disinfection')) {
      return i18n.t("components.swipeableVisitRow.serviceTypes.disinfection");
    }
    if (typeLower.includes('special')) {
      return i18n.t("components.swipeableVisitRow.serviceTypes.special");
    }
    
    return i18n.t("components.swipeableVisitRow.serviceTypes.myocide"); 
  };

  const downloadPDF = async (documentType = "report") => {
    // Double-check we're not already downloading
    if (isDownloading) {
      return;
    }

    if (documentType === "certificate" && !canDownloadCertificate) {
      Alert.alert(certificateCopy.title, certificateCopy.unavailable);
      return;
    }

    setActiveDownloadType(documentType);

    try {
      if (!visit.visitId) {
        throw new Error("Missing visit ID");
      }

      const token = apiService.getCurrentToken();
      const customerNameSlug = customerName 
        ? customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        : 'customer';
      const reportServiceType = visit.serviceType || 'service';
      const filename = documentType === "certificate"
        ? `certificate_${customerNameSlug}_${certificateYear}_${visit.visitId.substring(0, 8)}.pdf`
        : `report_${customerNameSlug}_${reportServiceType}_${visit.visitId.substring(0, 8)}.pdf`;
      
      const lang = i18n.getLocale();
      const url = documentType === "certificate"
        ? apiService.getCertificatePdfUrl(visit.visitId)
        : apiService.getReportPdfUrl(visit.visitId, lang);
      
      const getDownloadDirectory = () => {
        if (FileSystem.documentDirectory) {
          return FileSystem.documentDirectory;
        }
        if (FileSystem.cacheDirectory) {
          return FileSystem.cacheDirectory;
        }
        throw new Error("No suitable directory available for download");
      };
      
      const downloadDir = getDownloadDirectory();
      const fileUri = downloadDir + filename;
      
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
      );

      const downloadResult =
  await downloadResumable.downloadAsync();

const { uri, status, headers } = downloadResult;

const contentType = String(
  headers?.["content-type"] ||
  headers?.["Content-Type"] ||
  ""
).toLowerCase();

if (
  status !== 200 ||
  !contentType.includes("application/pdf")
) {
  let backendMessage = `Download failed with status ${status}`;

  try {
    const errorText =
      await FileSystem.readAsStringAsync(uri);

    const errorJson = JSON.parse(errorText);

    backendMessage =
      errorJson?.error ||
      errorJson?.message ||
      backendMessage;
  } catch {
    // Keep the HTTP error message
  }

  try {
    await FileSystem.deleteAsync(uri, {
      idempotent: true
    });
  } catch {
    // Ignore cleanup failure
  }

  throw new Error(backendMessage);
}
    
      
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: documentType === "certificate"
            ? certificateCopy.title
            : i18n.t("components.swipeableVisitRow.downloadReport"),
          UTI: 'com.adobe.pdf'
        });
        
      } else {
        Alert.alert(
          i18n.t("components.swipeableVisitRow.success"), 
          i18n.t("components.swipeableVisitRow.pdfSaved", { path: uri }),
          [{ text: i18n.t("common.ok") || "OK" }]
        );
      }
      
    } catch (error) {
      console.error("❌ PDF download error:", error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Network request failed')) {
        errorMessage = i18n.t("components.swipeableVisitRow.errors.network");
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = i18n.t("components.swipeableVisitRow.errors.auth");
      } else if (error.message.includes('404')) {
        errorMessage = i18n.t("components.swipeableVisitRow.errors.notFound");
      } else if (error.message.includes('Document directory not available')) {
        errorMessage = i18n.t("components.swipeableVisitRow.errors.storage");
      }
      
      Alert.alert(
        documentType === "certificate"
          ? certificateCopy.title
          : i18n.t("components.swipeableVisitRow.downloadFailed"),
        errorMessage,
        [{ text: i18n.t("common.ok") || "OK" }]
      );
    } finally {
      setActiveDownloadType(null);
    }
  };

  const renderRightActions = () => {
    return (
      <View
        style={[
          styles.rightActionContainer,
          canDownloadCertificate &&
            styles.rightActionContainerWithCertificate
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.pdfButton,
            canDownloadCertificate && styles.pdfButtonPaired,
            activeDownloadType === "report" &&
              styles.pdfButtonDownloading
          ]}
          onPress={() => handleDownloadPDF("report")}
          activeOpacity={0.7}
          disabled={isDownloading}
        >
          {activeDownloadType === "report" ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.pdfButtonContent}>
              <MaterialIcons name="picture-as-pdf" size={22} color="#fff" />
              <Text style={styles.pdfButtonText}>{i18n.t("components.swipeableVisitRow.download")}</Text>
            </View>
          )}
        </TouchableOpacity>

        {canDownloadCertificate && (
          <TouchableOpacity
            style={[
              styles.certificateButton,
              activeDownloadType === "certificate" &&
                styles.pdfButtonDownloading
            ]}
            onPress={() => handleDownloadPDF("certificate")}
            activeOpacity={0.7}
            disabled={isDownloading}
          >
            {activeDownloadType === "certificate" ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.pdfButtonContent}>
                <MaterialIcons name="verified" size={22} color="#fff" />
                <Text style={styles.certificateButtonText}>
                  {certificateCopy.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={styles.swipeableContainer}
    >
      <TouchableOpacity
        style={[
          styles.customerCard,
          isNested && styles.visitRowNested
        ]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerAvatar}>
            <MaterialIcons name="assignment" size={22} color="#fff" />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {visit.serviceType
                ? getTranslatedServiceType(visit.serviceType)
                : i18n.t("components.swipeableVisitRow.service") || "Service"}
            </Text>
            <View style={styles.customerMeta}>
              <View style={styles.customerMetaItem}>
                <MaterialIcons name="calendar-today" size={12} color="#666" />
                <Text style={styles.customerMetaText}>
                  {visit.appointmentDate
                    ? new Date(visit.appointmentDate).toLocaleDateString()
                    : i18n.t("components.swipeableVisitRow.unknownDate")}
                </Text>
              </View>
              {visit.duration && (
                <View style={styles.customerMetaItem}>
                  <MaterialIcons name="timer" size={12} color="#666" />
                  <Text style={styles.customerMetaText}>
                    {Math.floor(visit.duration / 60)} {i18n.t("components.swipeableVisitRow.minutes")}
                  </Text>
                </View>
              )}
              {visit.technicianName && (
                <View style={styles.customerMetaItem}>
                  <MaterialIcons name="person" size={12} color="#666" />
                  <Text style={styles.customerMetaText}>
                    {visit.technicianName}
                  </Text>
                </View>
              )}
            </View>
            {/* APPOINTMENT ID SECTION */}
            {(appointmentId || visit.appointmentId) && (
              <View style={styles.appointmentIdContainer}>
                <MaterialIcons name="fingerprint" size={10} color="#888" />
                <Text style={styles.appointmentIdText}>
                  {i18n.t("components.swipeableVisitRow.appointmentId", { 
                    id: appointmentId || visit.appointmentId 
                  })}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.chevronContainer}>
            <MaterialIcons name="chevron-right" size={22} color="#1f9c8b" />
            <MaterialIcons name="swipe" size={12} color="#1f9c8b" style={{ marginTop: 2 }} />
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    marginBottom: 8,
  },
  customerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  visitRowNested: {
    backgroundColor: "#fafafa",
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1f9c8b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
    fontFamily: 'System',
  },
  customerMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  customerMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  customerMetaText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    fontFamily: 'System',
  },
  chevronContainer: {
    alignItems: "center",
  },
  // APPOINTMENT ID STYLES
  appointmentIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  appointmentIdText: {
    fontSize: 11,
    color: "#888",
    marginLeft: 4,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  rightActionContainer: {
    width: 100,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  rightActionContainerWithCertificate: {
    width: 190,
  },
  pdfButton: {
    width: 80,
    height: '100%',
    backgroundColor: '#1f9c8b',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfButtonDownloading: {
    backgroundColor: '#666',
  },
  pdfButtonPaired: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  certificateButton: {
    width: 100,
    height: '100%',
    backgroundColor: '#176f64',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfButtonContent: {
    alignItems: 'center',
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
    fontFamily: 'System',
  },
  certificateButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'System',
  },
});