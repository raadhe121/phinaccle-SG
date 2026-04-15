import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  BoldText,
  CText,
  FormDatePicker,
  HeaderTitleTag,
  Height,
  Label,
  ListItem,
  Row,
  Section,
} from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { Button, Input } from "@ant-design/react-native";
import { colors } from "@/common/utils/config";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { modal } from "@/common/utils/modal";
import { Toast } from "@ant-design/react-native";
import dayjs from "dayjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchProfileApiUserProfileGet } from "@/services/client";
import { apiUrl } from "@/Config";

interface Specialist {
  id: number;
  title: string;
  name: string;
  image_path: string;
  credentials: string;
  short_bio: string;
  full_bio: string;
  languages: string;
  available_days: string;
  specialisation_id: number;
  // The following are from the old mock data structure and may not be in the API
  specialisation?: {
    name: string;
  };
  insurance: string;
  experience?: string;
  rating?: number;
  reviews?: number;
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

const SpecialistDetailsPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [specialist, setSpecialist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [preferredDate, setPreferredDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [requestEmail, setRequestEmail] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [remarkChecked, setRemarkChecked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const qry: any = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfileApiUserProfileGet,
  });

  // console.log(qry, "qryqryqryqry");
  const appointmentRequestMutation = useMutation({
    mutationFn: (requestBody: any) =>
      fetch(
        "https://poculiform-nonenunciative-trenton.ngrok-free.dev/appointment-requests/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      ).then(async (res) => {
        if (!res.ok) {
          const errorBody = await res.json();
          console.log(errorBody, "errorBodyerrorBody");

          throw new Error(
            errorBody.detail || "Failed to submit appointment request.",
          );
        }
        return res.json();
      }),
    onSuccess: () => {
      modal.success({
        title: "Request Sent",
        content:
          "Your appointment request has been successfully submitted. The specialist's team will reach out to you shortly to arrange and confirm your appointment.",
        labels: [null, "OK"],
        onOk: () => router.back(),
      });
    },
    onError: (error: Error) => Toast.fail({ content: error.message }),
  });

  useEffect(() => {
    if (qry?.data?.email) {
      setRequestEmail(qry.data.email);
    }
  }, [qry?.data?.email]);

  useEffect(() => {
    if (!id) return;

    const fetchSpecialistDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          `https://poculiform-nonenunciative-trenton.ngrok-free.dev/specialists/${id}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch specialist details");
        }
        const data: Specialist = await response.json();
        console.log(data, "datadatadata");

        setSpecialist(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialistDetails();
  }, [id]);

  useEffect(() => {
    if (preferredDate && specialist) {
      const dayOfWeek = dayjs(preferredDate).day();
      const availableDayNumbers = specialist.available_days
        .split(",")
        .map((day: any) => dayNameToNumber[day.trim()]);
      const availableTimesOfDay = availableDayNumbers.includes(dayOfWeek)
        ? ["Morning", "Afternoon"]
        : [];
      setTimeSlots(availableTimesOfDay);
      setSelectedTime(undefined);
    }
  }, [preferredDate, specialist]); // Depend on specialist as well

  const getEmailError = (email: string | undefined): string | undefined => {
    if (!email) {
      return "Email is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    return undefined;
  };

  const validateEmail = (email: string | undefined) => {
    const error = getEmailError(email);
    setEmailError(error);
    return !error;
  };

  const handleBookAppointment = () => {
    if (disableReason == "") {
      modal.warn({
        title: "Confirm Appointment Request",
        content: (
          <>
            <CText>You are requesting an appointment with:</CText>
            <BoldText style={{ marginVertical: 8 }}>
              {specialist.title} {specialist.name}
            </BoldText>
            <CText>
              on {dayjs(preferredDate).format("ddd, D MMM YYYY")} at{" "}
              <BoldText>{selectedTime}</BoldText>.
            </CText>
          </>
        ),
        labels: ["Cancel", "Confirm"],
        onOk: () => {
          if (!validateEmail(requestEmail)) {
            return false; // Prevent API call if email is invalid
          }

          appointmentRequestMutation.mutate({
            specialisation_id: specialist.specialisation_id,
            specialist_id: specialist.id,
            patient_name: qry?.data?.name, // Replace with actual user name
            patient_dob: qry?.data?.date_of_birth, // Replace with actual user DOB
            contact_number: qry?.data?.nric, // Replace with actual user contact
            email: requestEmail,
            preferred_time: selectedTime,
          });
        },
      });
    } else {
      modal.warn({
        title: "Confirm Appointment Request",
        content: (
          <>
            <CText>{disableReason}</CText>
          </>
        ),
        labels: ["Cancel", "Confirm"],
        onOk: () => {},
      });
    }
  };

  const disabledDate = (current: Date) => {
    // Disable past dates
    if (dayjs(current).isBefore(dayjs(), "day")) {
      return true;
    }
    const availableDayNumbers = specialist.available_days
      .split(",")
      .map((day: any) => dayNameToNumber[day.trim()]);
    return !availableDayNumbers.includes(dayjs(current).day());
  };

  const getDisableReason = () => {
    if (!!getEmailError(requestEmail)) return getEmailError(requestEmail);
    if (!preferredDate) return "Please select a preferred date.";
    if (!selectedTime) return "Please select a time slot.";
    if (!remarkChecked) return "Please check the remark checkbox.";

    return "";
  };

  const disableReason = getDisableReason();

  return (
    // console.log(apiUrl + specialist.image_path, "specialist.image_path"),
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardView
        navBack={() => router.back()}
        title={
          <HeaderTitleTag tag="Specialist Care" title="Doctor's Profile" />
        }
        action={
          !loading &&
          !error &&
          specialist && (
            <Button
              type="primary"
              onPress={handleBookAppointment}
              // disabled={
              //   !remarkChecked ||
              //   !preferredDate ||
              //   !selectedTime ||
              //   !!getEmailError(requestEmail)
              // }
            >
              Appointment Request
            </Button>
          )
        }
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <AntdMiniIcon
              name="CloseCircleOutline"
              size={48}
              color={colors.danger}
            />
            <CText style={styles.errorText}>
              Failed to load details. Please try again.
            </CText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(false);
                setLoading(true);
                fetch(
                  `https://poculiform-nonenunciative-trenton.ngrok-free.dev/specialists/${id}`,
                )
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed");
                    return res.json();
                  })
                  .then((data: Specialist) => {
                    setSpecialist(data);
                    setLoading(false);
                  })
                  .catch(() => {
                    setError(true);
                    setLoading(false);
                  });
              }}
            >
              <CText style={styles.retryButtonText}>Retry</CText>
            </TouchableOpacity>
          </View>
        ) : !specialist ? (
          <View style={styles.emptyContainer}>
            <AntdMiniIcon name="UserOutline" size={48} color={colors.brands3} />
            <CText style={styles.emptyText}>Specialist not found.</CText>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Image
                source={{ uri: apiUrl + specialist.image_path }}
                style={styles.photo}
              />
              <View style={styles.headerInfo}>
                <BoldText size={20}>
                  {specialist.title} {specialist.name}
                </BoldText>
                <CText
                  size={16}
                  style={{ color: colors.brands3, marginTop: 4 }}
                >
                  {specialist?.specialisation?.name || "Specialist"}
                </CText>
              </View>
            </View>

            <Section title="About" top={8} bottom={16}>
              <View style={{ maxHeight: 120 }}>
                <ScrollView nestedScrollEnabled={true}>
                  <CText style={{ paddingHorizontal: 12, lineHeight: 22 }}>
                    {specialist.full_bio}
                  </CText>
                </ScrollView>
              </View>
            </Section>

            <Section title="Details" top={0} bottom={16}>
              <ListItem
                thumb={<AntdMiniIcon name="BriefcaseOutline" size={24} />}
                divider={false}
              >
                <BoldText>Experience</BoldText>
                <CText style={{ color: colors.brands3 }}>
                  {specialist.experience || "Not specified"}
                </CText>
              </ListItem>
              <ListItem
                thumb={<AntdMiniIcon name="BookOutline" size={24} />}
                divider={false}
              >
                <BoldText>Qualifications</BoldText>
                <CText style={{ color: colors.brands3, flexShrink: 1 }}>
                  {specialist.credentials}
                </CText>
              </ListItem>
              <ListItem
                thumb={<AntdMiniIcon name="GlobalOutline" size={24} />}
                divider={false}
              >
                <BoldText>Languages Spoken</BoldText>
                <CText style={{ color: colors.brands3 }}>
                  {specialist.languages}
                </CText>
              </ListItem>
            </Section>

            <Section title="Insurance Details" top={0} bottom={16}>
              <View
                style={{
                  marginTop: 12,
                  marginBottom: 12,
                }}
              >
                <CText style={{ paddingHorizontal: 12, lineHeight: 22 }}>
                  {specialist.insurance ?? ""}
                </CText>
              </View>
            </Section>

            <Section title="Your Contact Email" top={0} bottom={16}>
              <Label label="Email for correspondence" error={emailError}>
                <Input
                  value={requestEmail}
                  onChangeText={(text) => {
                    setRequestEmail(text);
                    validateEmail(text);
                  }}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  clear
                  status={emailError ? "error" : undefined}
                />
              </Label>
            </Section>

            <Section title="Request an Appointment" top={0} bottom={16}>
              <Label label="Preferred Date">
                <FormDatePicker
                  value={preferredDate}
                  onChange={setPreferredDate}
                  placeholder="Select a date"
                  disabled={
                    !!preferredDate && disabledDate(new Date(preferredDate))
                  } // Ensure boolean value
                  minDate={new Date()}
                />
              </Label>
              {timeSlots.length > 0 && (
                <View style={styles.timeSlotsContainer}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.selectedTimeSlot,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <CText
                        style={
                          selectedTime === time
                            ? styles.selectedTimeSlotText
                            : undefined
                        }
                      >
                        {time}
                      </CText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Section>

            {/* <Section title="Additional Information" top={0} bottom={16}> */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: 12,
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => setRemarkChecked(!remarkChecked)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: remarkChecked
                    ? colors.primary
                    : "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 8,
                }}
              >
                {remarkChecked && (
                  <AntdMiniIcon name="CheckOutline" size={16} color="#fff" />
                )}
              </TouchableOpacity>
              <CText>You may provide more information on your condition</CText>
            </View>
            {/* </Section> */}
          </>
        )}

        <Height h={24} />
      </KeyboardView>

      {/* Full page loader for initial page loading */}
      <Modal
        visible={loading}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.brands2} />
            <Height h={16} />
            <CText style={styles.loaderText}>
              Loading specialist details...
            </CText>
          </View>
        </View>
      </Modal>

      {/* Full page loader for appointment booking */}
      <Modal
        visible={appointmentRequestMutation.isPending}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.brands2} />
            <Height h={16} />
            <CText style={styles.loaderText}>Booking appointment...</CText>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
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
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    paddingHorizontal: 12,
  },
  timeSlot: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
    marginBottom: 12,
  },
  selectedTimeSlot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedTimeSlotText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // container: {
  //   marginVertical: 12,
  // },

  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#333",
  },

  inputContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  input: {
    fontSize: 15,
    color: "#000",
  },

  inputErrorBorder: {
    borderColor: "#ff4d4f",
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
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
    textAlign: "center",
  },
});

export default SpecialistDetailsPage;
