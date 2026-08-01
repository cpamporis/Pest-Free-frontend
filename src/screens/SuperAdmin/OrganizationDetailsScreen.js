// SuperAdmin/OrganizationDetailsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { launchImageLibrary } from "react-native-image-picker";
import apiService from "../../services/apiService";
import CertificateTemplateEditorScreen from "./CertificateTemplateEditorScreen";

const EMPTY_LAYOUT = {
  version: 1,
  page: { width: 612, height: 792 },
  elements: []
};

function getInitialCertificateSettings(organization) {
  return {
    certificateMode:
      organization.certificate_mode ||
      organization.certificateMode ||
      "standard",
    legalName: organization.certificate_legal_name || "",
    servicesDescription:
      organization.certificate_services_description || "",
    applicatorName: organization.certificate_applicator_name || "",
    applicatorTitle: organization.certificate_applicator_title || "",
    licenceNumber: organization.certificate_licence_number || "",
    licenceDate: organization.certificate_licence_date
      ? String(organization.certificate_licence_date).slice(0, 10)
      : "",
    vatNumber: organization.certificate_vat_number || "",
    taxOffice: organization.certificate_tax_office || "",
    gemiNumber: organization.certificate_gemi_number || "",
    telephone: organization.certificate_telephone || "",
    email: organization.certificate_email || "",
    address: organization.certificate_address || "",
    website: organization.certificate_website || "",
    signatureUrl: organization.certificate_signature_url || null,
    customTemplateUrl: organization.certificate_template_url || null,
    certificateLayout:
      organization.certificate_layout || EMPTY_LAYOUT
  };
}

function normalizeLoadedSettings(settings) {
  return {
    certificateMode: settings?.certificateMode || "standard",
    legalName: settings?.legalName || "",
    servicesDescription: settings?.servicesDescription || "",
    applicatorName: settings?.applicatorName || "",
    applicatorTitle: settings?.applicatorTitle || "",
    licenceNumber: settings?.licenceNumber || "",
    licenceDate: settings?.licenceDate
      ? String(settings.licenceDate).slice(0, 10)
      : "",
    vatNumber: settings?.vatNumber || "",
    taxOffice: settings?.taxOffice || "",
    gemiNumber: settings?.gemiNumber || "",
    telephone: settings?.telephone || "",
    email: settings?.email || "",
    address: settings?.address || "",
    website: settings?.website || "",
    signatureUrl: settings?.signatureUrl || null,
    customTemplateUrl: settings?.customTemplateUrl || null,
    certificateLayout: settings?.certificateLayout || EMPTY_LAYOUT
  };
}

export default function OrganizationDetailsScreen({
  organization,
  onClose
}) {
  const initialPlan =
    organization.subscriptionPlan ||
    organization.subscription_plan ||
    "basic";

  const [name, setName] = useState(organization.name || "");
  const [color, setColor] = useState(
    organization.brandColor ||
      organization.brand_color ||
      "#1f9c8b"
  );
  const [plan, setPlan] = useState(initialPlan);
  const [savedPlan, setSavedPlan] = useState(initialPlan);
  const [maxTech, setMaxTech] = useState(
    String(
      organization.maxTechnicians ??
        organization.max_technicians ??
        ""
    )
  );
  const [maxCust, setMaxCust] = useState(
    String(
      organization.maxCustomers ??
        organization.max_customers ??
        ""
    )
  );

  const [certificateSettings, setCertificateSettings] = useState(() =>
    getInitialCertificateSettings(organization)
  );
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);

  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editData, setEditData] = useState({
    email: "",
    password: ""
  });

  const [currentLogoUrl, setCurrentLogoUrl] = useState(
    organization.logoUrl || organization.logo_url || null
  );
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [uploadingAsset, setUploadingAsset] = useState(null);

  const isCustomPlan = plan === "custom";
  const customPlanIsSaved = savedPlan === "custom";

  const logoPreview = selectedLogo?.uri ||
    apiService.getUploadedFileUrl(currentLogoUrl);
  const signaturePreview = selectedSignature?.uri ||
    apiService.getUploadedFileUrl(certificateSettings.signatureUrl);
  const templatePreview = selectedTemplate?.uri ||
    apiService.getUploadedFileUrl(
      certificateSettings.customTemplateUrl
    );

  const certificateFields = useMemo(
    () => [
      ["legalName", "Legal / Company Name"],
      ["servicesDescription", "Services Description"],
      ["applicatorName", "Applicator Name"],
      ["applicatorTitle", "Applicator Title"],
      ["licenceNumber", "Licence Number"],
      ["licenceDate", "Licence Date (YYYY-MM-DD)"],
      ["vatNumber", "Organization TIN / ΑΦΜ"],
      ["taxOffice", "Tax Office / ΔΟΥ"],
      ["gemiNumber", "GEMI Number"],
      ["telephone", "Telephone"],
      ["email", "Email"],
      ["address", "Organization Address"],
      ["website", "Website"]
    ],
    []
  );

  useEffect(() => {
    loadAdmins();
    loadCertificateSettings();
  }, [organization.id]);

  useEffect(() => {
    if (!isCustomPlan && certificateSettings.certificateMode !== "standard") {
      setCertificateSettings(current => ({
        ...current,
        certificateMode: "standard"
      }));
    }
  }, [isCustomPlan, certificateSettings.certificateMode]);

  const loadAdmins = async () => {
    setLoadingAdmins(true);

    try {
      const result = await apiService.getOrganizationAdmins(
        organization.id
      );

      if (result?.success) {
        setAdmins(result.admins || []);
      }
    } catch (error) {
      console.error("❌ Load organization admins error:", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const loadCertificateSettings = async () => {
    setLoadingSettings(true);

    try {
      const result =
        await apiService.getOrganizationCertificateSettings(
          organization.id
        );

      if (result?.success && result.certificateSettings) {
        const loaded = result.certificateSettings;
        setCertificateSettings(normalizeLoadedSettings(loaded));

        if (loaded.subscriptionPlan) {
          setSavedPlan(loaded.subscriptionPlan);
          setPlan(loaded.subscriptionPlan);
        }

        if (loaded.logoUrl) {
          setCurrentLogoUrl(loaded.logoUrl);
        }

        if (loaded.brandColor) {
          setColor(loaded.brandColor);
        }
      } else {
        Alert.alert(
          "Certificate Settings",
          result?.error || "Failed to load certificate settings"
        );
      }
    } catch (error) {
      console.error("❌ Load certificate settings error:", error);
      Alert.alert(
        "Certificate Settings",
        error.message || "Failed to load certificate settings"
      );
    } finally {
      setLoadingSettings(false);
    }
  };

  const updateCertificateField = (field, value) => {
    setCertificateSettings(current => ({
      ...current,
      [field]: value
    }));
  };

  const pickImage = async (setter) => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.9,
        maxWidth: 2550,
        maxHeight: 3300,
        selectionLimit: 1,
        includeBase64: false
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert(
          "Error",
          result.errorMessage || "Failed to select image"
        );
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        return;
      }

      const fileName =
        asset.fileName || `organization_asset_${Date.now()}.jpg`;

      const lowerName = fileName.toLowerCase();

      if (
        !lowerName.endsWith(".png") &&
        !lowerName.endsWith(".jpg") &&
        !lowerName.endsWith(".jpeg")
      ) {
        Alert.alert(
          "Unsupported Image",
          "Please select a PNG or JPEG image."
        );
        return;
      }

      setter({
        ...asset,
        fileName,
        type:
          asset.type ||
          (lowerName.endsWith(".png")
            ? "image/png"
            : "image/jpeg")
      });
    } catch (error) {
      console.error("❌ Image picker error:", error);
      Alert.alert("Error", "Failed to access the image gallery");
    }
  };

  const uploadLogo = async () => {
    if (!selectedLogo) {
      Alert.alert("Logo", "Select a logo first");
      return;
    }

    setUploadingAsset("logo");

    try {
      const result = await apiService.uploadOrganizationLogo(
        organization.id,
        selectedLogo
      );

      if (!result?.success) {
        Alert.alert("Error", result?.error || "Logo upload failed");
        return;
      }

      setCurrentLogoUrl(result.logo_url || result.logoUrl);
      setSelectedLogo(null);
      Alert.alert("Saved", "Organization logo uploaded successfully");
    } finally {
      setUploadingAsset(null);
    }
  };

  const uploadSignature = async () => {
    if (!selectedSignature) {
      Alert.alert("Signature", "Select a signature image first");
      return;
    }

    setUploadingAsset("signature");

    try {
      const result =
        await apiService.uploadOrganizationCertificateSignature(
          organization.id,
          selectedSignature
        );

      if (!result?.success) {
        Alert.alert(
          "Error",
          result?.error || "Signature upload failed"
        );
        return;
      }

      setCertificateSettings(current => ({
        ...current,
        signatureUrl:
          result.certificateSettings?.signatureUrl ||
          result.signatureUrl ||
          null
      }));
      setSelectedSignature(null);
      Alert.alert("Saved", "Certificate signature uploaded");
    } finally {
      setUploadingAsset(null);
    }
  };

  const uploadTemplate = async () => {
    if (!customPlanIsSaved) {
      Alert.alert(
        "Custom Plan",
        "Save the organization as a Custom plan before uploading a template."
      );
      return;
    }

    if (!selectedTemplate) {
      Alert.alert("Template", "Select a template image first");
      return;
    }

    setUploadingAsset("template");

    try {
      const result =
        await apiService.uploadOrganizationCertificateTemplate(
          organization.id,
          selectedTemplate
        );

      if (!result?.success) {
        Alert.alert(
          "Error",
          result?.error || "Template upload failed"
        );
        return;
      }

      setCertificateSettings(current => ({
        ...current,
        customTemplateUrl:
          result.certificateSettings?.customTemplateUrl ||
          result.customTemplateUrl ||
          null,
        certificateLayout:
          result.certificateSettings?.certificateLayout ||
          current.certificateLayout,
        certificateMode: "custom"
      }));
      setSelectedTemplate(null);
      Alert.alert(
        "Uploaded",
        "Custom background uploaded. Open the editor to position the fields."
      );
    } finally {
      setUploadingAsset(null);
    }
  };

  const deleteSignature = () => {
    Alert.alert(
      "Delete Signature",
      "Remove the organization certificate signature?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result =
              await apiService.deleteOrganizationCertificateSignature(
                organization.id
              );

            if (!result?.success) {
              Alert.alert("Error", result?.error || "Delete failed");
              return;
            }

            setCertificateSettings(current => ({
              ...current,
              signatureUrl: null
            }));
          }
        }
      ]
    );
  };

  const deleteTemplate = () => {
    Alert.alert(
      "Delete Custom Template",
      "The organization will return to the standard certificate template.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result =
              await apiService.deleteOrganizationCertificateTemplate(
                organization.id
              );

            if (!result?.success) {
              Alert.alert("Error", result?.error || "Delete failed");
              return;
            }

            setCertificateSettings(current => ({
              ...current,
              certificateMode: "standard",
              customTemplateUrl: null
            }));
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Organization name is required");
      return;
    }

    if (plan === "custom") {
      const technicians = Number(maxTech);
      const customers = Number(maxCust);

      if (
        !Number.isInteger(technicians) ||
        technicians < 1 ||
        !Number.isInteger(customers) ||
        customers < 1
      ) {
        Alert.alert(
          "Validation",
          "Custom plan limits must be positive whole numbers"
        );
        return;
      }
    }

    setSaving(true);

    try {
      const organizationResult = await apiService.updateOrganization(
        organization.id,
        {
          name: name.trim(),
          brandColor: color.trim() || "#1f9c8b",
          subscriptionPlan: plan,
          maxTechnicians:
            plan === "custom" ? Number(maxTech) : undefined,
          maxCustomers:
            plan === "custom" ? Number(maxCust) : undefined
        }
      );

      if (!organizationResult?.success) {
        Alert.alert(
          "Error",
          organizationResult?.error || "Failed to update organization"
        );
        return;
      }

      const settingsResult =
        await apiService.updateOrganizationCertificateSettings(
          organization.id,
          {
            certificateMode:
              plan === "custom"
                ? certificateSettings.certificateMode
                : "standard",
            legalName: certificateSettings.legalName,
            servicesDescription:
              certificateSettings.servicesDescription,
            applicatorName: certificateSettings.applicatorName,
            applicatorTitle: certificateSettings.applicatorTitle,
            licenceNumber: certificateSettings.licenceNumber,
            licenceDate: certificateSettings.licenceDate || null,
            vatNumber: certificateSettings.vatNumber,
            taxOffice: certificateSettings.taxOffice,
            gemiNumber: certificateSettings.gemiNumber,
            telephone: certificateSettings.telephone,
            email: certificateSettings.email,
            address: certificateSettings.address,
            website: certificateSettings.website
          }
        );

      if (!settingsResult?.success) {
        Alert.alert(
          "Partially Saved",
          settingsResult?.error ||
            "Organization saved, but certificate settings failed"
        );
        return;
      }

      setCertificateSettings(
        normalizeLoadedSettings(settingsResult.certificateSettings)
      );
      setSavedPlan(plan);
      Alert.alert("Saved", "Organization settings updated successfully");
    } catch (error) {
      console.error("❌ Save organization error:", error);
      Alert.alert("Error", error.message || "Failed to save organization");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Organization</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Organization</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Brand Color</Text>
          <View style={styles.colorRow}>
            <View
              style={[
                styles.colorPreview,
                { backgroundColor: color || "#1f9c8b" }
              ]}
            />
            <TextInput
              value={color}
              onChangeText={setColor}
              style={[styles.input, styles.colorInput]}
              autoCapitalize="none"
              placeholder="#1f9c8b"
            />
          </View>

          <Text style={styles.label}>Plan</Text>
          <View style={styles.planRow}>
            {["basic", "premium", "custom"].map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setPlan(item)}
                style={[
                  styles.planButton,
                  plan === item && styles.planButtonActive
                ]}
              >
                <Text style={styles.planButtonText}>
                  {item.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isCustomPlan && (
            <>
              <Text style={styles.label}>Max Technicians</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={maxTech}
                onChangeText={setMaxTech}
              />

              <Text style={styles.label}>Max Customers</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={maxCust}
                onChangeText={setMaxCust}
              />
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Organization Logo</Text>
          <Text style={styles.helpText}>
            This logo is used in service reports and standard certificates.
          </Text>

          {logoPreview && (
            <Image
              source={{ uri: logoPreview }}
              style={styles.logoPreview}
              resizeMode="contain"
            />
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => pickImage(setSelectedLogo)}
            >
              <MaterialIcons name="photo-library" size={18} color="#1f9c8b" />
              <Text style={styles.outlineButtonText}>Choose Logo</Text>
            </TouchableOpacity>

            {selectedLogo && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={uploadLogo}
                disabled={uploadingAsset === "logo"}
              >
                {uploadingAsset === "logo" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Certificate Information</Text>

          {loadingSettings ? (
            <ActivityIndicator color="#1f9c8b" />
          ) : (
            certificateFields.map(([field, label]) => (
              <View key={field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={[
                    styles.input,
                    field === "servicesDescription" &&
                      styles.multilineInput
                  ]}
                  value={certificateSettings[field]}
                  onChangeText={value =>
                    updateCertificateField(field, value)
                  }
                  multiline={field === "servicesDescription"}
                  autoCapitalize={
                    field === "email" || field === "website"
                      ? "none"
                      : "sentences"
                  }
                  keyboardType={
                    field === "email"
                      ? "email-address"
                      : field === "telephone"
                        ? "phone-pad"
                        : "default"
                  }
                />
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Certificate Signature</Text>

          {signaturePreview && (
            <Image
              source={{ uri: signaturePreview }}
              style={styles.signaturePreview}
              resizeMode="contain"
            />
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => pickImage(setSelectedSignature)}
            >
              <MaterialIcons name="draw" size={18} color="#1f9c8b" />
              <Text style={styles.outlineButtonText}>Choose Signature</Text>
            </TouchableOpacity>

            {selectedSignature && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={uploadSignature}
                disabled={uploadingAsset === "signature"}
              >
                {uploadingAsset === "signature" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {certificateSettings.signatureUrl && !selectedSignature && (
            <TouchableOpacity
              style={styles.textDeleteButton}
              onPress={deleteSignature}
            >
              <Text style={styles.textDeleteButtonLabel}>
                Remove Signature
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Certificate Template</Text>

          {!isCustomPlan ? (
            <View style={styles.infoBox}>
              <MaterialIcons name="verified" size={20} color="#1f9c8b" />
              <Text style={styles.infoText}>
                Basic and Premium plans use the standard branded template.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Certificate Mode</Text>
              <View style={styles.planRow}>
                {["standard", "custom"].map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeButton,
                      certificateSettings.certificateMode === mode &&
                        styles.modeButtonActive
                    ]}
                    onPress={() =>
                      updateCertificateField("certificateMode", mode)
                    }
                  >
                    <Text
                      style={[
                        styles.modeButtonText,
                        certificateSettings.certificateMode === mode &&
                          styles.modeButtonTextActive
                      ]}
                    >
                      {mode.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!customPlanIsSaved && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    Save the Custom plan first. Then upload the custom
                    certificate background.
                  </Text>
                </View>
              )}

              {certificateSettings.certificateMode === "custom" && (
                <>
                  <Text style={styles.helpText}>
                    Upload a blank certificate background. Static labels and
                    design belong in the image; dynamic fields are positioned
                    in the visual editor.
                  </Text>

                  {templatePreview && (
                    <Image
                      source={{ uri: templatePreview }}
                      style={styles.templatePreview}
                      resizeMode="contain"
                    />
                  )}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.outlineButton}
                      onPress={() => pickImage(setSelectedTemplate)}
                      disabled={!customPlanIsSaved}
                    >
                      <MaterialIcons
                        name="upload-file"
                        size={18}
                        color="#1f9c8b"
                      />
                      <Text style={styles.outlineButtonText}>
                        Choose Background
                      </Text>
                    </TouchableOpacity>

                    {selectedTemplate && (
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={uploadTemplate}
                        disabled={uploadingAsset === "template"}
                      >
                        {uploadingAsset === "template" ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Upload</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {certificateSettings.customTemplateUrl && (
                    <>
                      <TouchableOpacity
                        style={styles.editorButton}
                        onPress={() => setEditorVisible(true)}
                      >
                        <MaterialIcons name="dashboard-customize" size={20} color="#fff" />
                        <Text style={styles.editorButtonText}>
                          Open Visual Template Editor
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.textDeleteButton}
                        onPress={deleteTemplate}
                      >
                        <Text style={styles.textDeleteButtonLabel}>
                          Delete Custom Template
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Organization</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Admins</Text>

          {loadingAdmins ? (
            <ActivityIndicator color="#1f9c8b" />
          ) : (
            admins.map(admin => (
              <View key={admin.id} style={styles.adminRow}>
                <Text style={styles.adminEmail}>{admin.email}</Text>

                <TouchableOpacity
                  onPress={() => {
                    setEditingAdmin(admin);
                    setEditData({
                      email: admin.email,
                      password: ""
                    });
                    setShowEditModal(true);
                  }}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showEditModal} animationType="slide">
        <View style={styles.adminModal}>
          <Text style={styles.title}>Edit Admin</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={editData.email}
            onChangeText={email =>
              setEditData(current => ({ ...current, email }))
            }
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="New Password (optional)"
            secureTextEntry
            value={editData.password}
            onChangeText={password =>
              setEditData(current => ({ ...current, password }))
            }
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={async () => {
              if (!editData.email.trim()) {
                Alert.alert("Email required");
                return;
              }

              const result = await apiService.updateOrganizationAdmin(
                organization.id,
                editingAdmin.id,
                {
                  email: editData.email.trim(),
                  password: editData.password
                }
              );

              if (!result?.success) {
                Alert.alert("Error", result?.error || "Failed");
                return;
              }

              setShowEditModal(false);
              setEditingAdmin(null);
              await loadAdmins();
            }}
          >
            <Text style={styles.saveButtonText}>Save Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowEditModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={editorVisible} animationType="slide">
        <CertificateTemplateEditorScreen
          organizationId={organization.id}
          templateUrl={apiService.getUploadedFileUrl(
            certificateSettings.customTemplateUrl
          )}
          initialLayout={certificateSettings.certificateLayout}
          brandColor={color}
          onSave={certificateLayout => {
            setCertificateSettings(current => ({
              ...current,
              certificateMode: "custom",
              certificateLayout
            }));
          }}
          onClose={() => setEditorVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827"
  },
  closeButton: {
    padding: 6
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12
  },
  label: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5
  },
  helpText: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 12,
    color: "#111827"
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: "top"
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  colorPreview: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 9,
    marginBottom: 12
  },
  colorInput: {
    flex: 1
  },
  planRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12
  },
  planButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#9ca3af",
    borderRadius: 7,
    marginRight: 8,
    marginBottom: 8
  },
  planButtonActive: {
    backgroundColor: "#1f9c8b"
  },
  planButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12
  },
  logoPreview: {
    width: 160,
    height: 100,
    alignSelf: "center",
    marginBottom: 12
  },
  signaturePreview: {
    width: 190,
    height: 100,
    alignSelf: "center",
    marginBottom: 12
  },
  templatePreview: {
    width: "100%",
    height: 300,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#1f9c8b",
    borderRadius: 8,
    marginRight: 8
  },
  outlineButtonText: {
    color: "#1f9c8b",
    fontWeight: "600",
    marginLeft: 6
  },
  primaryButton: {
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#1f9c8b",
    borderRadius: 8
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f9c8b",
    paddingVertical: 14,
    borderRadius: 9,
    marginBottom: 14
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6
  },
  editorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 13,
    borderRadius: 8,
    marginTop: 12
  },
  editorButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 7
  },
  textDeleteButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8
  },
  textDeleteButtonLabel: {
    color: "#dc2626",
    fontWeight: "600"
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    padding: 12
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    color: "#166534",
    lineHeight: 18
  },
  warningBox: {
    backgroundColor: "#fff7d6",
    borderWidth: 1,
    borderColor: "#f0c36d",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  warningText: {
    color: "#7c5700",
    fontSize: 12,
    lineHeight: 17
  },
  modeButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8
  },
  modeButtonActive: {
    backgroundColor: "#1f9c8b",
    borderColor: "#1f9c8b"
  },
  modeButtonText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 12
  },
  modeButtonTextActive: {
    color: "#fff"
  },
  disabledButton: {
    opacity: 0.55
  },
  adminRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  adminEmail: {
    flex: 1,
    color: "#374151"
  },
  editText: {
    color: "#1f9c8b",
    fontWeight: "600"
  },
  adminModal: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff"
  },
  modalCancelButton: {
    alignItems: "center",
    paddingVertical: 12
  },
  modalCancelText: {
    color: "#4b5563",
    fontWeight: "600"
  }
});