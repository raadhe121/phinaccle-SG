import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CText, HeaderTitleTag, Height } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { modal } from "@/common/utils/modal";
import { colors } from "@/common/utils/config";
import axios from "axios";
import { apiUrl } from "@/Config";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RawSpecialist {
  id: number;
  active: boolean;
  title?: string;
  name?: string;
  image_url?: string;
  banner_image_path?: string | null;
  bio?: string;
  short_bio?: string;
  full_bio?: string;
  board_certifications?: string;
  clinic_name?: string;
  clinic_photo_path?: string;
  consultation_fee?: number;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  created_at?: string;
  display_order?: number;
  hospital_affiliations?: string;
  insurance_shield_plan?: string;
  insurance_tpa?: string;
  languages?: string;
  service_details?: string;
  service_name?: string;
  specialisation?: {
    id: number;
    name: string;
    slug: string;
  };
  specialisation_id?: number;
  updated_at?: string | null;
  years_of_practice?: number;
}

interface SpecialisationResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  banner_url?: string | null;
  display_mode?: "doctors" | "services" | string;
  specialists?: RawSpecialist[];
  services?: RawSpecialist[];
}

interface SpecialistItem {
  id: number;
  available: boolean;
  type: "doctor" | "service";
  title?: string;
  name?: string;
  service_name?: string;
  clinic_name?: string;
  clinic_photo_path?: string;
  image_url?: string;
  consultation_fee?: number;
  languages?: string;
  bio?: string;
  years_of_practice?: number;
  board_certifications?: string;
}

const SpecialistSelection = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [items, setItems] = useState<SpecialistItem[]>([]);
  const [selectedSpecialisation, setSelectedSpecialisation] = useState<SpecialisationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const specialisationId = Array.isArray(params.specialisation)
    ? params.specialisation[0]
    : params.specialisation;
  const Name = params.name;

  const fetchSpecialists = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get(
        `${apiUrl}/specialisations/active?include_items=true`,
      );

      const data: SpecialisationResponse[] = response.data;
      const selected = data.find(
        (specialisation) =>
          String(specialisation.id) === String(specialisationId) ||
          specialisation.slug === specialisationId,
      );

      if (!selected) {
        throw new Error("Specialisation not found");
      }

      setSelectedSpecialisation(selected);
      console.log(selected.specialists,'selected.specialists');
      
      const specialisationItems: SpecialistItem[] =
        selected.display_mode === "doctors"
          ? (selected.specialists ?? []).map((s) => ({
              id: s.id,
              available: s.active,
              type: "doctor",
              title: s.title,
              name: s.name,
              service_name: s.service_name,
              clinic_name: s.clinic_name,
              clinic_photo_path: s.clinic_photo_path,
              image_url: s.image_url,
              consultation_fee: s.consultation_fee,
              languages: s.languages,
              bio: s.short_bio || s.full_bio || s.bio || s.service_details,
              years_of_practice: s.years_of_practice,
              board_certifications: s.board_certifications,
            }))
          : (selected.services ?? []).map((s) => ({
              id: s.id,
              available: s.active,
              type: "service",
              title: s.title,
              name: s.name,
              service_name: s.service_name,
              clinic_name: s.clinic_name,
              clinic_photo_path: s.clinic_photo_path,
              image_url: s.image_url,
              consultation_fee: s.consultation_fee,
              languages: s.languages,
              bio: s.short_bio || s.full_bio || s.bio || s.service_details,
              years_of_practice: s.years_of_practice,
              board_certifications: s.board_certifications,
            }));

      setItems(specialisationItems);
    } catch (err: any) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, [specialisationId]);

  const toggleDropdown = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const selectedSpecialisationSlug =
    selectedSpecialisation?.slug || String(specialisationId);

  const handleSelection = (id: number, type: "doctor" | "service") => {
    router.navigate(
      `/specialist_care/${id}?specialisation=${encodeURIComponent(
        selectedSpecialisationSlug,
      )}&type=${type}`,
    );
  };

  const renderSpecialist = ({ item }: { item: SpecialistItem }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={[styles.cardContainer, isExpanded && styles.cardExpanded]}>
        <TouchableOpacity
          style={[styles.card, !item.available && styles.disabledCard]}
          onPress={() => item.available && toggleDropdown(item.id)}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={styles.imageSection}>
              <Image
                source={{
                  uri:
                    item.image_url ||
                    item.clinic_photo_path ||
                    "https://via.placeholder.com/80",
                }}
                style={styles.photo}
              />
              {item.available && (
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text numberOfLines={1} style={styles.name}>
                {item.type === "doctor"
                  ? item.name || "Doctor"
                  : item.service_name || "Specialist Service"}
              </Text>
              <Text numberOfLines={1} style={styles.credentials}>
                {item.type === "doctor"
                  ? item.title || item.board_certifications || "Doctor"
                  : item.board_certifications || "Certified Specialist"}
              </Text>
              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {item.years_of_practice ? `${item.years_of_practice} Yrs Exp` : "Expert"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <AntdMiniIcon 
                name={isExpanded ? "UpOutline" : "DownOutline"} 
                size={14} 
                color={isExpanded ? colors.brands2 : colors.brands3} 
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Inline Dropdown Service Box */}
        {isExpanded && (
          <View style={styles.dropdownBox}>
            <View style={styles.divider} />
            <View style={styles.dropdownContent}>
              <View style={styles.clinicDetailRow}>
                <Text style={styles.clinicNameText}>{item.clinic_name || "Private Clinic"}</Text>
              </View>
              
              <Text style={styles.shortDesc}>
                {item.bio
                  ? item.bio.substring(0, 85) + "..."
                  : item.type === "doctor"
                  ? "Experienced specialist available for consultation."
                  : "Professional medical consultation and specialized care services provided at the clinic."}
              </Text>

              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => handleSelection(item.id, item.type)}
              >
                <Text style={styles.selectButtonText}>
                  {item.type === "doctor" ? "Select Doctor" : "Select Service"}
                </Text>
                <AntdMiniIcon name="RightOutline" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardView
        navBack={() => router.back()}
        title={
          <HeaderTitleTag
            tag="Specialist Care"
            title={
              selectedSpecialisation?.display_mode === "doctors"
                ? "Choose a Specialist"
                : "Choose a Service"
            }
          />
        }
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <AntdMiniIcon name="CloseCircleOutline" size={48} color={colors.danger} />
            <CText style={styles.errorText}>Failed to load specialisation items.</CText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSpecialists}>
              <CText style={styles.retryButtonText}>Retry</CText>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          >
            {Name ? (
              <View style={styles.headerBanner}>
                <View style={styles.bannerIcon}>
                  <AntdMiniIcon name="MedicineBoxOutline" size={16} color={colors.brands2} />
                </View>
                <CText style={styles.headerBannerText}>{Name}</CText>
              </View>
            ) : null}

            {items.length > 0 ? (
              <View style={styles.sectionWrapper}>
                <Text style={styles.sectionTitle}>
                  {selectedSpecialisation?.display_mode === "doctors"
                    ? "Available Specialists"
                    : "Available Services"}
                </Text>
                {items.map((item) => (
                  <View key={`${item.type}-${item.id}`}>{renderSpecialist({ item })}</View>
                ))}
              </View>
            ) : null}

            {items.length === 0 && !loading ? (
              <View style={styles.emptyContainer}>
                <AntdMiniIcon name="UserOutline" size={48} color={colors.brands3} />
                <CText style={styles.emptyText}>
                  {selectedSpecialisation?.display_mode === "doctors"
                    ? "No specialists available in this category."
                    : "No services available in this category."}
                </CText>
              </View>
            ) : null}
          </ScrollView>
        )}
      </KeyboardView>

      <Modal visible={loading} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={colors.brands2} />
            <Height h={12} />
            <Text style={styles.loaderText}>Loading items...</Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: { padding: 20, paddingBottom: 40 },
  headerBanner: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bannerIcon: {
    backgroundColor: `${colors.brands2}15`,
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  headerBannerText: { color: colors.brands1, fontWeight: '700', fontSize: 16 },
  
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardExpanded: {
    borderColor: colors.brands2,
    borderWidth: 1.5,
    elevation: 6,
  },
  card: { padding: 14 },
  cardContent: { flexDirection: "row", alignItems: "center" },
  imageSection: { position: "relative" },
  photo: { width: 66, height: 66, borderRadius: 18, backgroundColor: "#F9FAFB" },
  onlineBadge: {
    position: "absolute", top: -2, right: -2, width: 14, height: 14,
    borderRadius: 7, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center",
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  infoSection: { flex: 1, marginLeft: 16 },
  name: { fontSize: 17, fontWeight: "700", color: "#1A1C1E" },
  credentials: { fontSize: 13, color: "#6C757D", marginTop: 2 },
  tagRow: { flexDirection: 'row', marginTop: 8 },
  tag: {
    backgroundColor: "#F4F7FF", paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, alignSelf: 'flex-start'
  },
  tagText: { fontSize: 11, color: colors.brands2, fontWeight: "600" },
  arrowContainer: { marginLeft: 8 },

  dropdownBox: { backgroundColor: "#FAFBFF" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginHorizontal: 16 },
  dropdownContent: { padding: 16 },
  clinicDetailRow: { marginBottom: 6 },
  clinicNameText: { fontSize: 14, fontWeight: '700', color: colors.brands1 },
  shortDesc: { fontSize: 12, color: "#6C757D", lineHeight: 18, marginBottom: 16 },
  selectButton: {
    backgroundColor: colors.brands2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  selectButtonText: { color: "#FFF", fontWeight: "700", fontSize: 14, marginRight: 8 },

  disabledCard: { opacity: 0.5 },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  sectionWrapper: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.brands1, marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#6C757D', marginTop: 12 },
  errorText: { color: colors.danger, marginTop: 12, fontWeight: "600" },
  retryButton: { 
    marginTop: 20, backgroundColor: colors.brands1, paddingVertical: 12, 
    paddingHorizontal: 30, borderRadius: 12 
  },
  retryButtonText: { color: "#FFF", fontWeight: "700" },
  loaderOverlay: { 
    flex: 1, backgroundColor: "rgba(0,0,0,0.05)", 
    justifyContent: "center", alignItems: "center" 
  },
  loaderCard: {
    backgroundColor: '#FFF', padding: 25, borderRadius: 20, alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  loaderText: { fontSize: 14, color: colors.brands1, fontWeight: '600' }
});

export default SpecialistSelection;