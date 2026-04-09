import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CText, HeaderTitleTag, Height } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { modal } from "@/common/utils/modal";
import { colors } from "@/common/utils/config";
import dayjs from "dayjs";
import axios from "axios";

interface RawSpecialist {
  id: number;
  title: string;
  name: string;
  active: boolean;
  image_url: string;
  credentials: string;
  available_days: string; // e.g., "Monday,Wednesday,Friday"
  specialisation?: {
    id: number;
    name: string;
    slug: string;
  };
  // ... other properties from the mock data if needed
}

interface Specialist {
  id: number;
  title: string;
  name: string;
  image_url: string;
  credentials: string;
  available: boolean;
  available_days: string; // Keep this for display or other logic if needed
}

const dayNameToNumber: { [key: string]: number } = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const SpecialistSelection = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [specialisationName, setSpecialisationName] = useState<string>("");

  const specialisationId = Array.isArray(params.specialisation)
    ? params.specialisation[0]
    : params.specialisation;
  const Name = params.name;
  console.log(Name, "specialisationName");

  const fetchSpecialists = async () => {
    setLoading(true);
    setError(false);
    try {
      console.log(specialisationId, "specialisationId");

      const response = await axios.get(
        `https://poculiform-nonenunciative-trenton.ngrok-free.dev/specialists/by-specialisation/${specialisationId}`,
      );

      if (!response.status === true) {
        throw new Error("Failed to fetch specialists");
      }
      console.log(response, "response.data");

      const rawData: RawSpecialist[] = await response.data;

      // Extract specialisation name from the first specialist's specialisation
      if (rawData.length > 0 && rawData[0].specialisation) {
        setSpecialisationName(rawData[0].specialisation.name);
      } else {
        // Fallback: use the slug as name
        setSpecialisationName(
          specialisationId
            ? specialisationId
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : "",
        );
      }

      const currentDayNumber = dayjs().day(); // 0 for Sunday, 1 for Monday, etc.

      const processedSpecialists: Specialist[] = rawData.map((s) => {
        const availableDayNumbers = s.available_days
          .split(",")
          .map((day) => dayNameToNumber[day.trim()]);
        const isAvailableToday = availableDayNumbers.includes(currentDayNumber);
        console.log(isAvailableToday, "isAvailableToday", currentDayNumber);
        const active = s.active && isAvailableToday;
        return { ...s, available: active };
      });

      setSpecialists(processedSpecialists);
    } catch (err) {
      console.log("errrrror", err);

      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, [specialisationId]);

  const handleSpecialistPress = (specialist: Specialist) => {
    if (!specialist.available) {
      modal.warn({
        title: "Specialist Unavailable",
        content:
          "This specialist is currently not available. Please check back later or select another specialist.",
        labels: ["OK"],
        onCancel: () => {},
      });
      return;
    }
    router.navigate(`/specialist_care/${specialist.id}`);
  };

  const renderSpecialist = ({ item }: { item: Specialist }) => (
    <TouchableOpacity
      style={[styles.card, !item.available && styles.disabledCard]}
      onPress={() => handleSpecialistPress(item)}
      activeOpacity={item.available ? 0.7 : 1}
    >
      <View style={styles.photoContainer}>
        <Image source={{ uri: item.image_url }} style={styles.photo} />
        {item.available && (
          <View style={styles.availableBadge}>
            <View style={styles.availableDot} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, !item.available && styles.disabledText]}>
          {item.title} {item.name}
        </Text>
        <Text
          style={[styles.credentials, !item.available && styles.disabledText]}
        >
          {item.credentials}
        </Text>
        {item.available ? (
          <Text style={styles.availableText}>Available Today</Text>
        ) : (
          <Text style={styles.unavailableText}>Not Available Today</Text>
        )}
      </View>
      {item.available && (
        <AntdMiniIcon name="RightOutline" size={20} color={colors.brands3} />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardView
        navBack={() => router.back()}
        title={
          <HeaderTitleTag tag="Specialist Care" title="Select a Specialist" />
        }
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <AntdMiniIcon
              name="CloseCircleOutline"
              size={48}
              color={colors.danger}
            />
            <CText style={styles.errorText}>Failed to load specialists.</CText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchSpecialists()}
            >
              <CText style={styles.retryButtonText}>Retry</CText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={specialists}
            renderItem={renderSpecialist}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              specialisationName ? (
                <View style={styles.specialisationBanner}>
                  <AntdMiniIcon
                    name="MedicineBoxOutline"
                    size={18}
                    color={colors.brands2}
                  />
                  <CText style={styles.specialisationBannerText}>{Name}</CText>
                </View>
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <AntdMiniIcon
                  name="UserOutline"
                  size={48}
                  color={colors.brands3}
                />
                <CText style={styles.emptyText}>
                  No specialists found for this specialisation.
                </CText>
              </View>
            )}
          />
        )}
      </KeyboardView>

      {/* Full page loader overlay - centered on entire screen */}
      <Modal
        visible={loading}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={colors.brands2} />
            <Height h={16} />
            <CText style={styles.loaderCardText}>Loading specialists...</CText>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  specialisationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.brands2}10`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  specialisationBannerText: {
    marginLeft: 8,
    color: colors.brands1,
    fontSize: 15,
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderTextContainer: {
    marginTop: 12,
  },
  loaderText: {
    color: colors.brands1,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 12,
    color: colors.brands1,
    fontSize: 14,
  },
  errorText: {
    textAlign: "center",
    marginTop: 12,
    color: colors.danger,
    fontSize: 14,
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.brands2,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.brands4,
  },
  disabledCard: {
    backgroundColor: "#F3F4F6",
    opacity: 0.7,
    borderColor: colors.light,
  },
  disabledText: {
    color: "#9CA3AF",
  },
  photoContainer: {
    position: "relative",
    marginRight: 16,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  availableBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.brands1,
  },
  credentials: {
    fontSize: 14,
    color: colors.brands3,
    marginTop: 4,
  },
  availableText: {
    fontSize: 12,
    color: colors.success,
    marginTop: 6,
    fontWeight: "500",
  },
  unavailableText: {
    fontSize: 12,
    color: colors.weak,
    marginTop: 6,
    fontWeight: "500",
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderCard: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  loaderIconContainer: {
    marginBottom: 16,
  },
  loaderCardText: {
    color: colors.brands1,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SpecialistSelection;
