import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Toast } from "@ant-design/react-native";
import {
  CText,
  HeaderTitleTag,
  Row,
  Height,
} from "@/common/components/AntdText";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";

interface Specialisation {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon_url: string;
}

const fetchSpecialisations = async (): Promise<Specialisation[]> => {
  const response = await fetch(
    "https://poculiform-nonenunciative-trenton.ngrok-free.dev/specialisations/",
  );
  if (!response.ok) {
    throw new Error("Failed to fetch specialisations");
  }
  return response.json();
};

const SpecialisationSelection = () => {
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["specialisations"],
    queryFn: fetchSpecialisations,
  });

  const handleSpecialisationSelect = (slug: number, name: string) => {
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
            <AntdMiniIcon
              name="CloseCircleOutline"
              size={48}
              color={colors.danger}
            />
            <CText style={styles.errorText}>
              Failed to load specialisations.
            </CText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <CText style={styles.retryButtonText}>Retry</CText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.requestsButton}
              onPress={() => router.navigate("/specialist_care/requests")}
            >
              <Row style={{ alignItems: "center" }}>
                <AntdMiniIcon
                  name="UnorderedListOutline"
                  size={20}
                  color="#fff"
                />
                <CText style={styles.requestsButtonText}>My Requests</CText>
                <AntdMiniIcon name="RightOutline" size={16} color="#fff" />
              </Row>
            </TouchableOpacity>
            {data && data.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AntdMiniIcon
                  name="InboxOutline"
                  size={48}
                  color={colors.brands3}
                />
                <CText style={styles.emptyText}>
                  No specialisations available at the moment.
                </CText>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {data?.map((specialisation: Specialisation) => (
                  <TouchableOpacity
                    key={specialisation.id}
                    style={styles.listItem}
                    onPress={() =>
                      handleSpecialisationSelect(
                        specialisation.id,
                        specialisation.name,
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      <Image
                        source={{ uri: specialisation.icon_url }}
                        style={styles.listIcon}
                      />
                    </View>
                    <View style={styles.listTextContainer}>
                      <Text style={styles.listTitle}>
                        {specialisation.name}
                      </Text>
                      <Text style={styles.listDescription}>
                        {specialisation.description}
                      </Text>
                    </View>
                    <AntdMiniIcon
                      name="RightOutline"
                      size={20}
                      color={colors.brands3}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </KeyboardView>

      {/* Full page loader overlay */}
      <Modal
        visible={isLoading}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={colors.brands2} />
            <Height h={16} />
            <CText style={styles.loaderCardText}>
              Loading specialisations...
            </CText>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brands5,
    padding: 16,
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 24,
  },
  listContainer: {
    width: "100%",
    paddingHorizontal: 16,
  },
  listItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.brands4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brands5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listIcon: {
    width: 36,
    height: 36,
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.brands1,
  },
  listDescription: {
    fontSize: 13,
    color: colors.brands3,
    marginTop: 4,
    lineHeight: 18,
  },
  requestsButton: {
    backgroundColor: colors.brands2,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.brands2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  requestsButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
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
  loaderCardText: {
    color: colors.brands1,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SpecialisationSelection;
