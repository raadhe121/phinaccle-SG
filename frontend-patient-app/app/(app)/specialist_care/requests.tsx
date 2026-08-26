import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import KeyboardView from "@/common/components/KeyboardView";
import {
  BoldText,
  CText,
  HeaderTitleTag,
  FormDatePicker,
  Height,
  Label,
  Section,
} from "@/common/components/AntdText";
import { colors } from "@/common/utils/config";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { Button, Toast } from "@ant-design/react-native";
import { modal } from "@/common/utils/modal";
import dayjs from "dayjs";
import axios from "axios";
import { fetchProfileApiUserProfileGet } from "@/services/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/Config";
import { Calendar } from "react-native-calendars";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  service: {
    service_name: string;
    id: number;
  };
  id: number;
  status:
  | "requested"
  | "rescheduled"
  | "in_progress"
  | "scheduled"
  | "confirmed"
  | "completed"
  | "rejected"
  | "cancelled";
  status_message: string;
  submitted_at: string;
  updated_at: string;
}

interface SpecialistDetail {
  id: number;
  name: string;
  available_days: string;
}

type RequestStatus = "Requested" | "Confirmed" | "Completed" | "Rejected" | "Cancelled";

// ─── Config ───────────────────────────────────────────────────────────────────

const dayNameToNumber: { [key: string]: number } = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const statusConfig = {
  Requested: {
    icon: "ExclamationCircleFill",
    color: colors.warning,
    message: (name: string) =>
      `${name} has received your request and will contact you soon.`,
    title: "Requested",
  },
  Cancelled: {
    icon: "ExclamationCircleFill",
    color: colors.danger,
    message: (name: string) =>
      `Your appointment with ${name} has been cancelled.`,
    title: "Cancelled",
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
      `Your appointment with ${name} is Completed for ${date}.`,
    title: "Completed",
  },
  Rejected: {
    icon: "CloseCircleFill",
    color: colors.danger,
    message: (name: string) =>
      `Your appointment with ${name} has been rejected.`,
    title: "Rejected",
  },
};


const mapStatus = (status: string): RequestStatus => {
  switch (status) {
    case "requested":
      return "Requested";
    case "rejected":
      return "Rejected";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Requested";
  }
};

const BASE_URL = apiUrl;

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SpecialistRequestsScreen = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ── Reschedule state ──
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [specialistDetail, setSpecialistDetail] =
    useState<any>(null);
  const [specialistLoading, setSpecialistLoading] = useState(false);
  const [preferredDate, setPreferredDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [dateAvailable, setDateAvailable] = useState<boolean | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rescheduleRemarkChecked, setRescheduleRemarkChecked] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");

  // ── Cancel state ──
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelRequest, setCancelRequest] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");

  const qry = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfileApiUserProfileGet,
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await axios.get<AppointmentRequest[]>(
        `${BASE_URL}/appointment-requests/`,
        { headers: { accept: "application/json" } },
      );
      setRequests(response.data);
    } catch {
      setError(true);
      Toast.fail("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchSpecialistDetail = async (specialistId: number) => {
    setSpecialistLoading(true);
    setSpecialistDetail(null);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/services/${specialistId}`);
      if (!res.ok) throw new Error("Failed");
      const data: SpecialistDetail = await res.json();
      console.log(data, 'SpecialistDetail');

      setSpecialistDetail(data);
    } catch (e) {
      console.log(e);
      Toast.fail("Could not load specialist availability.");
      setRescheduleModalVisible(false);
    } finally {
      setSpecialistLoading(false);
    }
  };
  const getMarkedDates = () => {
    const marked: any = {};
    let current = dayjs().add(3, "day").startOf("day");
    const end = dayjs().add(6, "month");

    if (!specialistDetail?.day_availability || Object.keys(specialistDetail.day_availability).length === 0) {
      // If no availability is defined, disable all dates for the next 6 months.
      while (current.isBefore(end) || current.isSame(end, "day")) {
        const dateString = current.format("YYYY-MM-DD");
        marked[dateString] = {
          disabled: true,
          disableTouchEvent: true,
        };
        current = current.add(1, "day");
      }
      return marked;
    }

    const availableDays = Object.keys(specialistDetail.day_availability).map(
      (day) => dayNameToNumber[day]
    );

    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateString = current.format("YYYY-MM-DD");
      if (!availableDays.includes(current.day())) {
        marked[dateString] = { disabled: true, disableTouchEvent: true };
      }
      current = current.add(1, "day");
    }

    if (preferredDate) {
      marked[preferredDate] = {
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: "#fff",
      };
    }

    return marked;
  };
  const getDisabledDays = () => {
    if (!specialistDetail?.day_availability) {
      return [];
    }

    const availableDayNumbers = Object.keys(specialistDetail.day_availability)
      .map((day) => dayNameToNumber[day])
      .filter((day) => day !== undefined);

    const allDays = [0, 1, 2, 3, 4, 5, 6];

    return allDays.filter((day) => !availableDayNumbers.includes(day));
  };

  useEffect(() => {
    if (!preferredDate || !specialistDetail?.day_availability) {
      setTimeSlots([]);
      setSelectedTime(undefined);
      setDateAvailable(null);
      return;
    }

    // e.g. "Monday"
    const dayName = dayjs(preferredDate).format("dddd");

    // Get slots for that day
    const slots = specialistDetail.day_availability[dayName] || [];

    setDateAvailable(slots.length > 0);
    setTimeSlots(slots);
    setSelectedTime(undefined);
    setSelectedTime(slots.length > 0 ? slots[0] : undefined);
  }, [preferredDate, specialistDetail]);
  // useEffect(() => {
  //   if (!preferredDate || !specialistDetail) {
  //     setTimeSlots([]);
  //     setSelectedTime(undefined);
  //     setDateAvailable(null);
  //     return;
  //   }
  //   const dayOfWeek = dayjs(preferredDate).day();
  //   const availableDayNumbers = specialistDetail.available_days
  //     .split(",")
  //     .map((d:any) => dayNameToNumber[d.trim()]);
  //   const isAvailable = availableDayNumbers.includes(dayOfWeek);
  //   setDateAvailable(isAvailable);
  //   setTimeSlots(isAvailable ? ["Morning", "Afternoon"] : []);
  //   setSelectedTime(undefined);
  // }, [preferredDate, specialistDetail]);

  const rescheduleMutation = useMutation({
    mutationFn: async (body: {
      preferred_time: string;
      preferred_days: string;
      additional_info: string | null;
    }) => {
      console.log(body,"bodybodybodybodybody");
      
      const res = await fetch(
        `${BASE_URL}/appointment-requests/${selectedRequest?.id}/reschedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const contentType = res.headers.get("content-type");
      const data =
        contentType && contentType.includes("application/json")
          ? await res.json()
          : await res.text();
      if (!res.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.detail || "Failed to reschedule.",
        );
      }
      return data;
    },
    onSuccess: () => {
      setRescheduleModalVisible(false);
      resetRescheduleState();
      modal.success({
        title: "Appointment Rescheduled",
        content:
          "Your appointment has been successfully rescheduled. The service's team will confirm the new time shortly.",
        labels: [null, "OK"],
        onOk: () => fetchRequests(),
      });
    },
    onError: (err: Error) => {
      Toast.fail({ content: err.message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (body: { reason: string }) => {
      const res = await fetch(
        `${BASE_URL}/appointment-requests/${cancelRequest?.id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            reason: body.reason,
          }),
        },
      );
      const contentType = res.headers.get("content-type");
      const data =
        contentType && contentType.includes("application/json")
          ? await res.json()
          : await res.text();
      if (!res.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.detail || "Failed to cancel appointment.",
        );
      }
      return data;
    },
    onSuccess: () => {
      setCancelModalVisible(false);
      setCancelReason("");
      setCancelReasonError("");
      setCancelRequest(null);
      modal.success({
        title: "Appointment Cancelled",
        content:
          "Your appointment has been cancelled. A confirmation email has been sent.",
        labels: [null, "OK"],
        onOk: () => fetchRequests(),
      });
    },
    onError: (err: Error) => {
      Toast.fail({ content: err.message });
    },
  });

  const openReschedule = (item: any) => {
    resetRescheduleState();
    setSelectedRequest(item);
    setRescheduleModalVisible(true);
    console.log(item, 'itemitemitemitem');
    if (item.service) {
      fetchSpecialistDetail(item.service.id);
    } else {
      fetchSpecialistDetail(item.specialist.id);
    }
  };

  const resetRescheduleState = () => {
    setPreferredDate(undefined);
    setSelectedTime(undefined);
    setTimeSlots([]);
    setDateAvailable(null);
    setSpecialistDetail(null);
    setRescheduleRemarkChecked(false);
    setRescheduleReason("");
  };

  const openCancel = (item: any) => {
    setCancelRequest(item);
    setCancelReason("");
    setCancelReasonError("");
    setCancelModalVisible(true);
  };

  const handleConfirmReschedule = () => {
  // Safety guard
  if (!preferredDate || !selectedTime || !selectedRequest) return;
  
  // Close your dropdown/picker modal layout right away
  // setRescheduleModalVisible(false);

  // Determine the name to display (Plain strings only)
  const appointmentWith = selectedRequest.service 
    ? selectedRequest.service.service_name 
    : selectedRequest.specialist?.name || "";

  const formattedDate = dayjs(preferredDate).format("ddd, D MMM YYYY");

  // 💡 Call the native React Native Alert
  Alert.alert(
    "Confirm Reschedule", // Title
    `You are rescheduling your appointment with:\n\n${appointmentWith}\n\nto ${formattedDate} at ${selectedTime}.`, // Message Body
    [
      {
        text: "Cancel",
        onPress: () => {
          // 💡 Does nothing but close the alert. Safe from background mutations!
          console.log("Reschedule cancelled");
        },
        style: "cancel", // Gives it a distinct "cancel" treatment on iOS
      },
      {
        text: "Confirm",
        onPress: () => {
          // 💡 Only fires when they intentionally click Confirm
          rescheduleMutation.mutate({
            preferred_days: preferredDate,
            preferred_time: selectedTime,
            additional_info: rescheduleRemarkChecked
              ? rescheduleReason.trim() || null
              : null,
          });
        },
      },
    ],
    { cancelable: true } // On Android, tapping outside the alert will close it like a cross button
  );
};
  // const handleConfirmReschedule = () => {
  //   setRescheduleModalVisible(false);
  //   if (!preferredDate || !selectedTime || !selectedRequest) return;
  //   modal.warn({
  //     title: "Confirm Reschedule",
  //     content: (
  //       <>
  //         <CText>You are rescheduling your appointment with:</CText>
  //         <BoldText style={{ marginVertical: 8 }}>
  //           {selectedRequest.service ? selectedRequest?.service?.service_name : selectedRequest?.specialist?.name}
  //         </BoldText>
  //         <CText>
  //           to {dayjs(preferredDate).format("ddd, D MMM YYYY")} at{" "}
  //           <BoldText>{selectedTime}</BoldText>.
  //         </CText>
  //       </>
  //     ),
  //     labels: ["Confirm","Cancel", ],
  //     onOk: () => {
  //       rescheduleMutation.mutate({
  //         preferred_days: dayjs(preferredDate).format("dddd"),
  //         preferred_time: selectedTime!,
  //       });
  //     },
  //   });
  // };

  const handleConfirmCancel = () => {
    const trimmed = cancelReason.trim();
    if (!trimmed) {
      setCancelReasonError("Please provide a reason for cancellation.");
      return;
    }
    // if (trimmed.length < 10) {
    //   setCancelReasonError(
    //     "Please provide a more detailed reason (at least 10 characters).",
    //   );
    //   return;
    // }
    setCancelReasonError("");
    cancelMutation.mutate({ reason: trimmed });
  };

  const RequestCard = ({ item }: { item: any }) => {
    const config = statusConfig[mapStatus(item.status)];
    const formattedDate = dayjs(item.submitted_at).format("D MMM YYYY, h:mm A");
    const scheduledDate = item.updated_at
      ? dayjs(item.updated_at).format("ddd, D MMM YYYY [at] h:mm A")
      : "";

    const isMatchedUser = qry.data?.name === item.patient_name;
    if (!isMatchedUser) return null;

    const canReschedule = ["rescheduled", "requested", "confirmed"].includes(item.status);
    const canCancel = ["requested", "rescheduled", "confirmed"].includes(item.status);

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

        <View style={styles.specialistRow}>
          <AntdMiniIcon name="TeamOutline" size={15} color={colors.brands3} />
          {item.service ?
            <CText style={styles.specialistText}>
              Service: {item.service?.service_name}
            </CText> : <CText style={styles.specialistText}>
              Specialist: {item.specialist.name}
            </CText>
          }
        </View>

        {item.reason && (
          <View style={styles.reasonContainer}>
            <AntdMiniIcon name="FileOutline" size={16} color={colors.brands3} />
            <CText style={styles.reasonText}>{item.reason}</CText>
          </View>
        )}

        <View style={styles.dateContainer}>
          <AntdMiniIcon name="ClockCircleOutline" size={14} color={colors.weak} />
          <CText size={12} style={styles.dateText}>
            Requested: {formattedDate}
          </CText>
        </View>

        <View style={[styles.statusMessageContainer, { backgroundColor: `${config.color}15` }]}>
          <AntdMiniIcon name={config.icon} color={config.color} size={18} />
          {item.service ?
            <CText style={styles.statusMessage}>
              {config.message(item.service?.service_name, scheduledDate)}
            </CText> : <CText style={styles.statusMessage}>
              {config.message(item.specialist?.name, scheduledDate)}
            </CText>
          }
        </View>
        {(canReschedule || canCancel) && (
          <View style={styles.actionRow}>
            {canReschedule && (
              <TouchableOpacity
                style={[styles.actionButton, styles.rescheduleButton]}
                onPress={() => openReschedule(item)}
              >
                <AntdMiniIcon name="CalendarOutline" size={15} color={colors.primary} />
                <CText style={styles.rescheduleButtonText}>Reschedule</CText>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelActionButton]}
                onPress={() => openCancel(item)}
              >
                <AntdMiniIcon name="CloseCircleOutline" size={15} color={colors.danger} />
                <CText style={styles.cancelActionButtonText}>Cancel</CText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const AvailabilityBadge = () => {
    if (!preferredDate || dateAvailable === null) return null;
    return (
      <View
        style={[
          styles.availabilityBadge,
          { backgroundColor: dateAvailable ? `${colors.success}15` : `${colors.danger}15` },
        ]}
      >
        <AntdMiniIcon
          name={dateAvailable ? "CheckCircleFill" : "CloseCircleFill"}
          size={16}
          color={dateAvailable ? colors.success : colors.danger}
        />
        <CText style={[styles.availabilityText, { color: dateAvailable ? colors.success : colors.danger }]}>
          {dateAvailable
            ? "Doctor is available on this day"
            : "Doctor is not available on this day. Please choose another date."}
        </CText>
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
            <AntdMiniIcon name="CloseCircleOutline" size={48} color={colors.danger} />
            <CText style={styles.errorText}>Failed to load requests.</CText>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchRequests()}>
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
                <AntdMiniIcon name="InboxOutline" size={48} color={colors.brands3} />
                <CText style={styles.emptyText}>You have no appointment requests.</CText>
              </View>
            }
          />
        )}
      </KeyboardView>

      {/* Global Loaders */}
      <Modal visible={loading || rescheduleMutation.isPending || cancelMutation.isPending} transparent>
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={colors.brands2} />
            <Height h={16} />
            <CText style={styles.loaderText}>Processing...</CText>
          </View>
        </View>
      </Modal>

      {/* ── Reschedule Bottom Sheet ── */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setRescheduleModalVisible(false);
          resetRescheduleState();
        }}
      >
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setRescheduleModalVisible(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <BoldText size={18} style={styles.sheetTitle}>Reschedule Appointment</BoldText>
              {selectedRequest && <CText style={styles.sheetSubtitle}>{selectedRequest.service?.service_name}</CText>}
            </View>
            <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
              <AntdMiniIcon name="CloseOutline" size={20} color={colors.brands1} />
            </TouchableOpacity>
          </View>

          {specialistLoading ? (
            <View style={styles.sheetLoader}>
              <ActivityIndicator size="small" color={colors.brands2} />
            </View>
          ) : specialistDetail ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <CText style={styles.availableDaysText}>
                Available:
              </CText>

              {Object.entries(specialistDetail.day_availability).map(
                ([day, slots]: [string, any]) => (
                  <CText key={day} style={styles.availableDaysText}>
                    <BoldText>{day}</BoldText>: {slots.join(", ")}
                  </CText>
                )
              )}

              <Section title="Select New Date" top={0} bottom={0}>
                <Calendar
                  minDate={dayjs().add(3, "day").format("YYYY-MM-DD")}
                  markedDates={getMarkedDates()}
                  onDayPress={(day: any) => {
                    if (
                      getMarkedDates()[day.dateString]?.disabled
                    ) {
                      return;
                    }

                    setPreferredDate(day.dateString);
                  }}
                  theme={{
                    todayTextColor: colors.primary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: "#fff",
                    arrowColor: colors.primary,
                    textDayFontWeight: "500",
                    textMonthFontWeight: "bold",
                    textDayHeaderFontWeight: "600",
                  }}
                />
              </Section>
              {/* <Section title="Select New Date" top={0} bottom={0}>
                <FormDatePicker
                  value={preferredDate}
                  onChange={setPreferredDate}
                  placeholder="Select a date"
                  minDate={new Date()}
                  disabledDays={getDisabledDays()}
                />
              </Section> */}

              <AvailabilityBadge />

              {timeSlots.length > 0 && (
                <Section title="Select Time" top={16} bottom={0}>
                  <View style={styles.timeSlotsContainer}>
                    {timeSlots.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[styles.timeSlot, selectedTime === time && styles.selectedTimeSlot]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <CText style={[styles.timeSlotText, selectedTime === time && styles.selectedTimeSlotText]}>{time}</CText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Section>
              )}

              <TouchableOpacity
                style={styles.remarkRow}
                onPress={() => setRescheduleRemarkChecked(!rescheduleRemarkChecked)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    rescheduleRemarkChecked && styles.checkboxChecked,
                  ]}
                >
                  {rescheduleRemarkChecked && (
                    <CText style={styles.checkmark}>✓</CText>
                  )}
                </View>
                <CText style={styles.remarkText}>
                  You may provide more information on your reschedule request
                </CText>
              </TouchableOpacity>

              {rescheduleRemarkChecked && (
                <View style={styles.rescheduleReasonInputContainer}>
                  <TextInput
                    style={styles.rescheduleReasonInput}
                    value={rescheduleReason}
                    onChangeText={setRescheduleReason}
                    placeholder="Please provide more information here..."
                    placeholderTextColor={colors.weak}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}

              <Height h={24} />
              <Button type="primary" disabled={!preferredDate || !selectedTime || !dateAvailable} onPress={handleConfirmReschedule}>
                Confirm Reschedule
              </Button>
              <Height h={32} />
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* ── Cancellation Pop-up Modal ── */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : 'padding'}
          style={styles.popupOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCancelModalVisible(false)}
          />

          <View style={styles.popupContainer}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <BoldText size={18} style={{ color: colors.danger }}>Cancel Appointment</BoldText>
                <CText style={styles.sheetSubtitle}>{cancelRequest?.service?.service_name}</CText>
              </View>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <AntdMiniIcon name="CloseOutline" size={20} color={colors.brands1} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.cancelWarningBanner}>
                <AntdMiniIcon name="ExclamationCircleFill" size={18} color={colors.danger} />
                <CText style={styles.cancelWarningText}>
                  This action cannot be undone. A cancellation email will be sent to {cancelRequest?.email}.
                </CText>
              </View>

              <Height h={16} />
              <Label label="Reason for Cancellation *" error={cancelReasonError}>
                <View style={[styles.reasonInputContainer, !!cancelReasonError && styles.reasonInputError]}>
                  <TextInput
                    style={styles.reasonInput}
                    value={cancelReason}
                    onChangeText={(text) => {
                      setCancelReason(text);
                      if (cancelReasonError) setCancelReasonError("");
                    }}
                    placeholder="e.g. Schedule conflict, feeling better..."
                    placeholderTextColor={colors.weak}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                <CText style={styles.charCount}>{cancelReason.length}/500</CText>
              </Label>

              {!!cancelReasonError && (
                <View style={styles.errorRow}>
                  <CText style={styles.errorMessage}>{cancelReasonError}</CText>
                </View>
              )}
            </ScrollView>

            <View style={{ marginTop: 16 }}>
              <Button type="warning" onPress={handleConfirmCancel} disabled={!cancelReason.trim()}>
                Confirm Cancellation
              </Button>
              <Height h={8} />
              <Button onPress={() => setCancelModalVisible(false)}>
                Keep Appointment
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: { padding: 16, flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  emptyText: { textAlign: "center", marginTop: 12, color: colors.brands1 },
  errorText: { textAlign: "center", marginTop: 12, color: colors.danger },
  retryButton: { marginTop: 16, backgroundColor: colors.brands2, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontWeight: "bold" },
  card: { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3, borderWidth: 1, borderColor: colors.brands4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  patientName: { marginLeft: 8, color: colors.brands1 },
  specialistRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  specialistText: { marginLeft: 6, color: colors.brands2, fontSize: 13, fontWeight: "600" },
  reasonContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8, padding: 8, backgroundColor: colors.brands5, borderRadius: 6 },
  reasonText: { marginLeft: 8, flex: 1, color: colors.brands1, fontSize: 14 },
  dateContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  dateText: { marginLeft: 6, color: colors.weak, fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { color: "white", fontWeight: "bold", fontSize: 12 },
  statusMessageContainer: { flexDirection: "row", alignItems: "center", marginTop: 4, padding: 12, borderRadius: 8 },
  statusMessage: { marginLeft: 8, flex: 1, fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 5 },
  rescheduleButton: { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
  rescheduleButtonText: { color: colors.primary, fontWeight: "600" },
  cancelActionButton: { borderColor: colors.danger, backgroundColor: `${colors.danger}08` },
  cancelActionButtonText: { color: colors.danger, fontWeight: "600" },
  loaderOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  loaderCard: { backgroundColor: "#fff", padding: 32, borderRadius: 16, alignItems: "center" },
  loaderText: { color: colors.brands1, fontWeight: "600" },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: "80%" },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.brands4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { color: colors.brands1 },
  sheetSubtitle: { color: colors.brands3, fontSize: 14 },
  sheetLoader: { padding: 32, alignItems: "center" },
  datePickerInput: { padding: 14, borderWidth: 0, borderColor: colors.border, borderRadius: 8, backgroundColor: "#fafafa" },
  availableDaysHint: { flexDirection: "row", alignItems: "center", backgroundColor: `${colors.brands2}12`, padding: 10, borderRadius: 8, gap: 6 },
  availableDaysText: { fontSize: 13, color: colors.brands1 },
  availabilityBadge: { flexDirection: "row", marginTop: 12, padding: 10, borderRadius: 8, gap: 6 },
  availabilityText: { fontSize: 13, flex: 1 },
  timeSlotsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16, marginLeft: 16 },
  timeSlot: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  selectedTimeSlot: { borderColor: colors.primary },
  timeSlotText: { color: colors.brands1 },
  selectedTimeSlotText: { color: "#fff", fontWeight: "bold" },
  remarkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: "#fff", fontWeight: "bold", lineHeight: 18 },
  remarkText: { flex: 1, color: colors.brands1, fontSize: 14, lineHeight: 20 },
  rescheduleReasonInputContainer: { marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: "#fafafa" },
  rescheduleReasonInput: { minHeight: 96, padding: 12, fontSize: 14, color: colors.brands1 },

  // ── Pop-up Styles ──
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    height: "100%",
    alignItems: "center",
    padding: 20
  },
  popupContainer: { backgroundColor: "#FFF", width: "100%", maxHeight: "100%", borderRadius: 20, padding: 20, elevation: 20 },
  cancelWarningBanner: { flexDirection: "row", backgroundColor: `${colors.danger}10`, padding: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: `${colors.danger}30` },
  cancelWarningText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18 },
  reasonInputContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, backgroundColor: "#fafafa", minHeight: 100 },
  reasonInputError: { borderColor: colors.danger },
  reasonInput: { fontSize: 14, color: colors.brands1 },
  charCount: { fontSize: 11, color: colors.weak, textAlign: "right", marginTop: 4 },
  errorRow: { marginTop: 6 },
  errorMessage: { fontSize: 12, color: colors.danger },
});

export default SpecialistRequestsScreen;
