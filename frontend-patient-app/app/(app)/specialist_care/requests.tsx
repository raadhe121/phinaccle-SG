import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import KeyboardView from "@/common/components/KeyboardView";
import {
  BoldText,
  CText,
  EmptySection,
  HeaderTitleTag,
  Row,
  Height,
} from "@/common/components/AntdText";
import { colors } from "@/common/utils/config";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { Toast } from "@ant-design/react-native";
import dayjs from "dayjs";
import axios from "axios";
import { fetchProfileApiUserProfileGet } from "@/services/client";
import { useMutation, useQuery } from "@tanstack/react-query";

// Define the type for the API response
interface AppointmentRequest {
  specialisation_id: number;
  specialist_id: number;
  patient_name: string;
  patient_dob: string;
  contact_number: string;
  email: string;
  preferred_days: string;
  preferred_time: string;
  reason: string;
  specialist: {
    name: string;
    slug: string;
  };
  id: number;
  status: "pending" | "in_progress" | "scheduled";
  status_message: string;
  submitted_at: string;
  updated_at: string;
}

type RequestStatus = "Pending" | "Confirmed" | "Completed" | "Rejected";

const statusConfig = {
  Pending: {
    icon: "ExclamationCircleFill",
    color: colors.warning,
    message: (name: string) =>
      `Dr. ${name} has received your request and will contact you soon.`,
    title: "Pending",
  },
  Confirmed: {
    icon: "InformationCircleFill",
    color: colors.primary,
    message: (_name: string) =>
      "The specialist is currently coordinating your appointment.",
    title: "Confirmed",
  },
  Completed: {
    icon: "CheckCircleFill",
    color: colors.success,
    message: (name: string, date?: string) =>
      `Your appointment with Dr. ${name} is Completed for ${date}.`,
    title: "Completed",
  },
  Rejected: {
    icon: "CloseCircleFill",
    color: colors.danger,
    message: (name: string) =>
      `Your appointment with Dr. ${name} has been rejected.`,
    title: "Rejected",
  },
};

// Map API status values to the existing statusConfig keys
const mapStatus = (status: string): RequestStatus => {
  console.log(status, "status");

  switch (status) {
    case "pending":
      return "Confirmed";
    case "rejected":
      return "Rejected";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    default:
      return "Pending"; // Default fallback
  }
};

const SpecialistRequestsScreen = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const qry = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfileApiUserProfileGet,
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await axios.get<AppointmentRequest[]>(
        "https://poculiform-nonenunciative-trenton.ngrok-free.dev/appointment-requests/",
        {
          headers: {
            accept: "application/json",
          },
        },
      );
      setRequests(response.data);
    } catch (error) {
      setError(true);
      Toast.fail("Failed to load requests. Please try again.");
      console.error("Error fetching appointment requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const RequestCard = ({ item }: { item: AppointmentRequest }) => {
    const config = statusConfig[mapStatus(item.status)];
    const formattedDate = dayjs(item.submitted_at).format("D MMM YYYY, h:mm A");
    const scheduledDate = item.updated_at
      ? dayjs(item.updated_at).format("ddd, D MMM YYYY [at] h:mm A")
      : "";

    const isMatchedUser = qry.data?.name === item.patient_name;

    if (!isMatchedUser) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <AntdMiniIcon name="UserOutline" size={20} color={colors.brands2} />
            <BoldText size={16} style={styles.patientName}>
              {item.patient_name}
            </BoldText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
            <CText style={styles.statusText}>{config.title}</CText>
          </View>
        </View>

        {item.reason && (
          <View style={styles.reasonContainer}>
            <AntdMiniIcon name="FileOutline" size={16} color={colors.brands3} />
            <CText style={styles.reasonText}>{item.reason}</CText>
          </View>
        )}

        <View style={styles.dateContainer}>
          <AntdMiniIcon
            name="ClockCircleOutline"
            size={14}
            color={colors.weak}
          />
          <CText size={12} style={styles.dateText}>
            Requested: {formattedDate}
          </CText>
        </View>

        <View
          style={[
            styles.statusMessageContainer,
            { backgroundColor: `${config.color}15` },
          ]}
        >
          <AntdMiniIcon name={config.icon} color={config.color} size={18} />
          <CText style={styles.statusMessage}>
            {config.message(item?.specialist?.name, scheduledDate)}
          </CText>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardView
        navBack={() => router.back()}
        title={<HeaderTitleTag tag="Specialist Care" title="My Requests" />}
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <AntdMiniIcon
              name="CloseCircleOutline"
              size={48}
              color={colors.danger}
            />
            <CText style={styles.errorText}>Failed to load requests.</CText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchRequests()}
            >
              <CText style={styles.retryButtonText}>Retry</CText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={({ item }) => <RequestCard item={item} />}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <AntdMiniIcon
                  name="InboxOutline"
                  size={48}
                  color={colors.brands3}
                />
                <CText style={styles.emptyText}>
                  You have no appointment requests.
                </CText>
              </View>
            }
          />
        )}
      </KeyboardView>

      {/* Full page loader overlay */}
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
            <CText style={styles.loaderText}>Loading requests...</CText>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  listLoader: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.brands4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  patientName: {
    marginLeft: 8,
    color: colors.brands1,
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    backgroundColor: colors.brands5,
    borderRadius: 6,
  },
  reasonText: {
    marginLeft: 8,
    flex: 1,
    color: colors.brands1,
    fontSize: 14,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    marginLeft: 6,
    color: colors.weak,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  statusMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  statusMessage: {
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontSize: 13,
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
  loaderText: {
    color: colors.brands1,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SpecialistRequestsScreen;
