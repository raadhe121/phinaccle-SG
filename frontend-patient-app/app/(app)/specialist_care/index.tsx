import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  CText,
  HeaderTitleTag,
  Row,
  Height,
} from "@/common/components/AntdText";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import {
  Specialisation,
  fetchSpecialisations,
  specialisationsQueryKey,
} from "./api";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SpecialisationSelection = () => {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: specialisationsQueryKey,
    queryFn: fetchSpecialisations,
  });

  const toggleDropdown = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleConfirmSelect = (slug: number, name: string) => {
    router.navigate(
      `/specialist_care/SpecialistSelection?specialisation=${slug}&name=${encodeURIComponent(
        name,
      )}`,
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
            title="Select a Specialisation"
          />
        }
      >
        {isError ? (
          <View style={styles.emptyContainer}>
            <AntdMiniIcon name="CloseCircleOutline" size={48} color={colors.danger} />
            <CText style={styles.errorText}>Failed to load services.</CText>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <CText style={styles.retryButtonText}>Retry</CText>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.brands2} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* My Requests Action Card */}
            <TouchableOpacity
              style={styles.requestsCard}
              onPress={() => router.navigate("/specialist_care/requests")}
              activeOpacity={0.8}
            >
              <View style={styles.requestsIconBg}>
                <AntdMiniIcon name="UnorderedListOutline" size={20} color={colors.brands2} />
              </View>
              <View style={styles.requestsTextContainer}>
                <Text style={styles.requestsTitle}>View My Requests</Text>
                <Text style={styles.requestsSub}>Check your appointment status</Text>
              </View>
              <AntdMiniIcon name="RightOutline" size={16} color={colors.brands3} />
            </TouchableOpacity>

            <Height h={8} />

            {data && data.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AntdMiniIcon name="InboxOutline" size={48} color={colors.brands3} />
                <CText style={styles.emptyText}>No specialisations available.</CText>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {data?.map((specialisation: Specialisation) => {
                  const isExpanded = expandedId === specialisation.id;
                  return (
                    <View key={specialisation.id} style={[styles.cardContainer, isExpanded && styles.cardExpanded]}>
                      <TouchableOpacity
                        style={styles.listItem}
                        onPress={() => toggleDropdown(specialisation.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.iconContainer}>
                          <Image
                            source={{ uri: specialisation.icon_url }}
                            style={styles.listIcon}
                          />
                        </View>
                        <View style={styles.listTextContainer}>
                          <Text style={styles.listTitle}>{specialisation.name}</Text>
                          {!isExpanded && (
                            <Text numberOfLines={1} style={styles.listDescription}>
                              {specialisation.description}
                            </Text>
                          )}
                        </View>
                        <AntdMiniIcon
                          name={isExpanded ? "UpOutline" : "DownOutline"}
                          size={14}
                          color={isExpanded ? colors.brands2 : colors.brands3}
                        />
                      </TouchableOpacity>

                      {/* Dropdown Action Box */}
                      {isExpanded && (
                        <View style={styles.dropdownBox}>
                          <View style={styles.divider} />
                          <View style={styles.dropdownContent}>
                            <Text style={styles.expandedDesc}>
                              {specialisation.description}
                            </Text>
                            <TouchableOpacity
                              style={styles.selectButton}
                              onPress={() => handleConfirmSelect(specialisation.id, specialisation.name)}
                            >
                              <Text style={styles.selectButtonText}>Select This Specialisation</Text>
                              <AntdMiniIcon name="RightOutline" size={14} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardView>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: { paddingHorizontal: 16 },
  requestsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
  },
  requestsIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.brands2}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  requestsTextContainer: { flex: 1, marginLeft: 14 },
  requestsTitle: { fontSize: 15, fontWeight: "700", color: colors.brands1 },
  requestsSub: { fontSize: 12, color: colors.brands3, marginTop: 2 },

  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    elevation: 2,
  },
  cardExpanded: {
    borderColor: colors.brands2,
    borderWidth: 1.5,
  },
  listItem: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F8F9FB",
    justifyContent: "center",
    alignItems: "center",
  },
  listIcon: { width: 32, height: 32, resizeMode: "contain" },
  listTextContainer: { flex: 1, marginLeft: 14, marginRight: 8 },
  listTitle: { fontSize: 16, fontWeight: "700", color: "#1A1C1E" },
  listDescription: { fontSize: 12, color: colors.brands3, marginTop: 4 },

  dropdownBox: { backgroundColor: "#FAFBFF" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginHorizontal: 16 },
  dropdownContent: { padding: 16 },
  expandedDesc: { fontSize: 13, color: "#6C757D", lineHeight: 18, marginBottom: 16 },
  selectButton: {
    backgroundColor: colors.brands2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectButtonText: { color: "#FFF", fontWeight: "700", fontSize: 14, marginRight: 8 },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 80 },
  errorText: { color: colors.danger, marginTop: 12, fontWeight: "600" },
  retryButton: { marginTop: 16, backgroundColor: colors.brands2, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  retryButtonText: { color: "#fff", fontWeight: "700" },
  emptyText: { textAlign: "center", marginTop: 12, color: colors.brands1, fontSize: 14 },
});

export default SpecialisationSelection;