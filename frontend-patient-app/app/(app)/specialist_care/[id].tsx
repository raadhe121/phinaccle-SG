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
  ImageBackground,
  FlatList,
} from "react-native";
import { Calendar } from "react-native-calendars";
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
import { modal } from "@/common/utils/modal";
import { Toast } from "@ant-design/react-native";
import dayjs from "dayjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchProfileApiUserProfileGet,
  getMobileApiUserMobileGet,
} from "@/services/client";
import { apiUrl } from "@/Config";

interface Specialist {
  id: number;
  active: boolean;
  service_name?: string;
  clinic_name?: string;
  clinic_photo_path?: string | null;
  consultation_fee?: number | string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  board_certifications?: string;
  bio?: string;
  languages?: string;
  years_of_practice?: number;
  hospital_affiliations?: string;
  insurance_tpa?: string;
  insurance_shield_plan?: string;
  service_details?: string;
  awards?: string;
  credentials?: string;
  short_bio?: string;
  full_bio?: string;
  appointment_email?: string;
  available_days?: string;
  available_time_slots?: string;
  day_availability?: { [key: string]: string[] };
  specialisation_id?: number;
  specialisation?: {
    id: number;
    name: string;
    slug: string;
  };
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

interface DoctorDetail {
  id: number;
  active: boolean;
  title?: string;
  name?: string;
  image_url?: string;
  clinic_name?: string;
  clinic_photo_path?: string;
  consultation_fee?: number;
  credentials?: string;
  short_bio?: string;
  full_bio?: string;
  languages?: string;
  bio?: string;
  years_of_practice?: number;
  board_certifications?: string;
  specialisation?: {
    id: number;
    name: string;
    slug: string;
  };
}

// ─── Helper: initials from name ───────────────────────────────────────────────
const getInitials = (name?: string, title?: string): string => {
  const n = name || title || "DR";
  const parts = n.trim().split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
};

const formatTimeSlotLabel = (slot: string): string => {
  const normalized = slot?.toLowerCase().trim();
  if (normalized === "morning") return "AM";
  if (normalized === "afternoon") return "PM";
  return slot;
};

// ─── Doctor Profile Header ────────────────────────────────────────────────────
const DoctorProfileHeader = ({ specialist }: { specialist: any }) => {
  const displayName =
    specialist.name || specialist.title || specialist.clinic_name || "Doctor";
  const initials = getInitials(specialist.name, specialist.title);

  const statItems = [
    specialist.years_of_practice
      ? { label: "Experience", value: `${specialist.years_of_practice} yrs` }
      : null,
    specialist.languages
      ? { label: "Languages", value: specialist.languages }
      : null,
    specialist.consultation_fee != null
      ? { label: "Fee", value: `$${specialist.consultation_fee}` }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <View style={doctorHeaderStyles.wrapper}>
      {/* Avatar */}
      <View style={doctorHeaderStyles.avatarWrapper}>
        {specialist.image_url ? (
          <Image
            source={{ uri: specialist.image_url }}
            style={doctorHeaderStyles.avatarImage}
          />
        ) : (
          <View style={doctorHeaderStyles.avatarFallback}>
            <Text style={doctorHeaderStyles.avatarInitials}>{initials}</Text>
          </View>
        )}
        {/* Active indicator dot */}
        
      </View>

      {/* Name + Specialisation */}
      <BoldText style={doctorHeaderStyles.doctorName} size={20}>
        {displayName}
      </BoldText>

          {specialist.credentials && (
            <CText style={doctorHeaderStyles.doctorCredentials} numberOfLines={2}>
              {specialist.credentials}
            </CText>
          )}

      {specialist.specialisation?.name && (
        <View style={doctorHeaderStyles.specialisationBadge}>
          <CText style={doctorHeaderStyles.specialisationText}>
            {specialist.specialisation.name}
          </CText>
        </View>
      )}

      {specialist.clinic_name &&
        specialist.clinic_name !== specialist.name &&
        specialist.clinic_name !== specialist.title && (
          <CText style={doctorHeaderStyles.clinicSubtitle}>
            {specialist.clinic_name}
          </CText>
        )}

      {/* Stats row */}
      {statItems.length > 0 && (
        <View style={doctorHeaderStyles.statsRow}>
          {statItems.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={doctorHeaderStyles.statDivider} />}
              <View style={doctorHeaderStyles.statItem}>
                <BoldText style={doctorHeaderStyles.statValue}>
                  {stat.value}
                </BoldText>
                <CText style={doctorHeaderStyles.statLabel}>{stat.label}</CText>
              </View>
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Contact row */}
      {(specialist.contact_email ||
        specialist.contact_phone ||
        specialist.contact_name ||
        specialist.appointment_email) && (
        <View style={doctorHeaderStyles.contactPills}>
          {specialist.contact_name && (
            <View style={doctorHeaderStyles.contactPill}>
              <CText style={doctorHeaderStyles.contactPillText}>
                {specialist.contact_name}
              </CText>
            </View>
          )}
          {specialist.contact_phone && (
            <View style={doctorHeaderStyles.contactPill}>
              <CText style={doctorHeaderStyles.contactPillText}>
                {specialist.contact_phone}
              </CText>
            </View>
          )}
          {specialist.contact_email && (
            <View style={doctorHeaderStyles.contactPill}>
              <CText
                style={doctorHeaderStyles.contactPillText}
                numberOfLines={1}
              >
                {specialist.contact_email}
              </CText>
            </View>
          )}
          {specialist.appointment_email && (
            <View style={doctorHeaderStyles.contactPill}>
              <CText style={doctorHeaderStyles.contactPillText} numberOfLines={1}>
                {specialist.appointment_email}
              </CText>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const doctorHeaderStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 0,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.brands2,
  },
  activeDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },
  doctorName: {
    color: colors.brands1,
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 26,
    fontWeight: "700",
  },
  specialisationBadge: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  specialisationText: {
    fontSize: 13,
    color: colors.brands2,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  clinicSubtitle: {
    fontSize: 13,
    color: colors.brands3,
    marginBottom: 4,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignSelf: "stretch",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 15,
    color: colors.brands1,
    fontWeight: "700",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    color: colors.brands3,
    marginTop: 3,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  contactPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  contactPill: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  doctorCredentials: {
    fontSize: 13,
    color: colors.brands3,
    marginTop: 4,
    textAlign: "center",
  },
  contactPillText: {
    fontSize: 12,
    color: colors.brands1,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const SpecialistDetailsPage = () => {
  const router = useRouter();
  const {
    id,
    specialisation: specialisationSlug,
    type: itemType,
  } = useLocalSearchParams();
  const itemTypeValue = Array.isArray(itemType) ? itemType[0] : itemType;
  const [specialist, setSpecialist] = useState<any>(null);
  const [doctors, setDoctors] = useState<DoctorDetail[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [preferredDate, setPreferredDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [requestEmail, setRequestEmail] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [remarkChecked, setRemarkChecked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [showRescheduleCancel, setShowRescheduleCancel] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");

  const qry: any = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfileApiUserProfileGet,
  });
  const mobileQry = useQuery({
    queryKey: ["mobile"],
    queryFn: getMobileApiUserMobileGet,
  });

  const appointmentRequestMutation = useMutation({
    mutationFn: (requestBody: any) =>
      fetch(`${apiUrl}/appointment-requests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      }).then(async (res) => {
        if (!res.ok) {
          const errorBody = await res.json();
          throw new Error(
            errorBody.detail || "Failed to submit appointment request."
          );
        }
        return res.json();
      }),
    onSuccess: () => {
      setPreferredDate(undefined);
      setSelectedTime(undefined);
      setRemarkChecked(false);

      modal.success({
        title: "Your appointment request has been successfully submitted.",
        content:
          "Please note that this is not an appointment confirmation and the specialist's team will reach out to you to arrange a suitable timeslot for your appointment.",
        labels: [null, "OK"],
        onOk: () => {
          router.back();
        },
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
        const itemTypeValue = Array.isArray(itemType) ? itemType[0] : itemType;

        if (itemTypeValue === "doctor") {
          const response = await fetch(
            `${apiUrl}/specialisations/active?include_items=true`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch specialist details");
          }
          const data = await response.json();
          const specialisationData = data.find(
            (spec: any) =>
              String(spec.id) === String(specialisationSlug) ||
              spec.slug === specialisationSlug
          );
          const selectedDoctor = specialisationData?.specialists?.find(
            (doc: any) => String(doc.id) === String(id)
          );

          if (!selectedDoctor) {
            throw new Error("Specialist not found");
          }

          setSpecialist(selectedDoctor);
        } else {
          const response = await fetch(`${apiUrl}/api/admin/services/${id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch specialist details");
          }
          const data: Specialist = await response.json();
          setSpecialist(data);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialistDetails();
  }, [id, specialisationSlug, itemType]);

  useEffect(() => {
    const fetchSpecialisationDoctors = async () => {
      const itemTypeValue = Array.isArray(itemType) ? itemType[0] : itemType;
      if (itemTypeValue === "doctor") return;
      if (!specialist) return;

      const slug =
        specialisationSlug ||
        specialist.specialisation?.slug ||
        String(specialist.specialisation_id || "");
      if (!slug) return;

      try {
        const response = await fetch(
          `${apiUrl}/specialisations/active?include_items=true`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch specialisation doctors");
        }
        const data = await response.json();
        const selected = data.find(
          (spec: any) =>
            String(spec.id) === String(slug) || spec.slug === slug
        );
        setDoctors(selected?.specialists ?? []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchSpecialisationDoctors();
  }, [specialist, specialisationSlug]);

  const getMarkedDates = () => {
  if (!specialist?.day_availability) {
    return {};
  }

  const availableDays = Object.keys(specialist.day_availability).map(
    (day) => dayNameToNumber[day]
  );

  const marked: any = {};

  let current = dayjs();
  const end = dayjs().add(6, "month");

  while (current.isBefore(end) || current.isSame(end, "day")) {
    const dateString = current.format("YYYY-MM-DD");

    if (!availableDays.includes(current.day())) {
      marked[dateString] = {
        disabled: true,
        disableTouchEvent: true,
        textColor: "#C4C4C4",
      };
    }

    current = current.add(1, "day");
  }

  if (preferredDate) {
    marked[preferredDate] = {
      ...(marked[preferredDate] || {}),
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: "#fff",
    };
  }

  return marked;
};
  useEffect(() => {
    if (preferredDate && specialist?.day_availability) {
      const dayName = dayjs(preferredDate).format("dddd");
      const slots = specialist.day_availability[dayName] || [];
      setTimeSlots(slots);
      // Auto-select the first available time slot
      setSelectedTime(slots.length > 0 ? slots[0] : undefined);
    } else {
      setTimeSlots([]);
      setSelectedTime(undefined);
    }
  }, [preferredDate, specialist]);

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
    console.log(mobileQry.data);
    
    if (disableReason === "") {
      modal.warn({
        title: "Confirm Appointment Request",
        content: (
          <>
            <CText>You are requesting an appointment with </CText>
            <BoldText style={{ marginVertical: 8 }}>
              {itemTypeValue === "doctor"
                ? `Doctor: ${
                    specialist.name ||
                    specialist.title ||
                    specialist.clinic_name
                  }`
                : `Service: ${
                    specialist.service_name || specialist.clinic_name
                  }`}
            </BoldText>
            <CText>
              on {dayjs(preferredDate).format("ddd, D MMM YYYY")} at{" "}
              <BoldText>{selectedTime}</BoldText>.
            </CText>
            {selectedDoctor ? (
              <CText style={{ marginTop: 8 }}>
                Doctor: {selectedDoctor.name || selectedDoctor.title}
              </CText>
            ) : null}
          </>
        ),
        labels: ["Cancel", "Confirm"],
        onCancel: () => {},
        onOk: () => {
          if (!validateEmail(requestEmail)) {
            return false;
          }
          const itemTypeValue = Array.isArray(itemType)
            ? itemType[0]
            : itemType;

          const payload: any = {
            specialisation_id:
              specialist.specialisation_id || specialist.specialisation?.id,
            patient_name: qry?.data?.name,
            patient_dob: qry?.data?.date_of_birth,
            contact_number: mobileQry.data?.mobile_number,
            email: requestEmail,
            preferred_days: preferredDate
              ? dayjs(preferredDate).format("dddd")
              : undefined,
            preferred_time: preferredDate,
            reason:
              itemTypeValue === "doctor" ? "Consultation" : "Service booking",
          };

          if (itemTypeValue === "doctor") {
            payload.specialist_id = specialist.id;
          } else {
            payload.service_id = specialist.id;
            if (selectedDoctorId) {
              payload.specialist_id = selectedDoctorId;
            }
          }

          appointmentRequestMutation.mutate(payload);
        },
      });
    } else {
      modal.warn({
        title: "Complete Required Fields",
        content: (
          <>
            <CText>{disableReason}</CText>
          </>
        ),
        labels: ["OK","Cancel"],
        onOk: () => {},
      });
    }
  };

  const getDisableReason = () => {
    if (!!getEmailError(requestEmail)) return getEmailError(requestEmail);
    if (!preferredDate) return "Please select a preferred date.";
    if (!selectedTime) return "Please select a time slot.";
    if (!remarkChecked) return "Please check the remark checkbox.";
    if (doctors.length > 0 && !selectedDoctorId)
      return "Please select a doctor for this service.";
    return "";
  };

  const disableReason = getDisableReason();

  const filteredDoctors = doctors.filter((d) => {
    const q = doctorSearchQuery.toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.title || "").toLowerCase().includes(q) ||
      (d.clinic_name || "").toLowerCase().includes(q)
    );
  });

  const getDoctorInitials = (doctor: DoctorDetail) => {
    const name = doctor.name || doctor.title || "D";
    const parts = name.trim().split(" ");
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getDisabledDays = () => {
    if (!specialist?.day_availability) {
      return [0, 1, 2, 3, 4, 5, 6]; // Disable all if not specified
    }
    const availableDayNames = Object.keys(specialist.day_availability);
    const availableDayNumbers = availableDayNames.map((day: any) => dayNameToNumber[day]).filter(n => n !== undefined);
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    return allDays.filter(day => !availableDayNumbers.includes(day));
  };

  const renderConsultationFee = () => (
    <Section title="Consultation Fee" top={16} bottom={8}>
      <View style={styles.minimalFeeRow}>
        <View style={styles.minimalFeeLeft}>
          <CText style={styles.minimalFeeLabel}>Consultation Fee</CText>
        </View>
        <BoldText style={styles.minimalFeeAmount}>
          ${specialist.consultation_fee ?? "N/A"}
        </BoldText>
      </View>
    </Section>
  );

  // ─── Shared booking sections (used by both doctor & service) ──────────────
  const renderBookingSections = (isServiceFlow = false) => (
    <>
      {/* Contact Email */}
      <Section
        title={isServiceFlow ? "Patient Input: Contact Email" : "Your Contact Email"}
        top={16}
        bottom={0}
      >
        <View style={styles.sectionPadded}>
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
              status={emailError ? "error" : undefined}
            />
          </Label>
        </View>
      </Section>

      {/* Request an Appointment */}
      <Section
        title={isServiceFlow ? "Patient Input: Availability" : "Request an Appointment"}
        top={16}
        bottom={0}
      >
        <View style={styles.sectionPadded}>
          {isServiceFlow && doctors.length > 0 && (
            <Label label="Preferred Doctor">
              <TouchableOpacity
                style={styles.doctorPickerTrigger}
                onPress={() => {
                  setDoctorSearchQuery("");
                  setShowDoctorPicker(true);
                }}
                activeOpacity={0.75}
              >
                <CText style={styles.fieldValue}>
                  {selectedDoctor
                    ? selectedDoctor.name || selectedDoctor.title || "Doctor"
                    : "Select a doctor"}
                </CText>
              </TouchableOpacity>
            </Label>
          )}

          <Label label="Preferred Date">
            <View style={{ paddingHorizontal: 12 }}>
             <Calendar
  minDate={dayjs().format("YYYY-MM-DD")}
  markedDates={getMarkedDates()}
  disableAllTouchEventsForDisabledDays
  onDayPress={(day: any) => {
    setPreferredDate(day.dateString);
  }}
  theme={{
    todayTextColor: colors.primary,
    arrowColor: colors.primary,
    textDayFontWeight: "500",
  }}
/>
            </View>
          </Label>

          {timeSlots.length > 0 && (
            <>
              <CText style={styles.timeSlotsLabel}>Preferred Time</CText>
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
                      style={[
                        styles.timeSlotText,
                        selectedTime === time && styles.selectedTimeSlotText,
                      ]}
                    >
                      {time}
                    </CText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </Section>

      {/* Remark checkbox */}
      <TouchableOpacity
        style={styles.remarkRow}
        onPress={() => setRemarkChecked(!remarkChecked)}
        activeOpacity={0.7}
      >
        <View
          style={[styles.checkbox, remarkChecked && styles.checkboxChecked]}
        >
          {remarkChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <CText style={styles.remarkText}>
          You may provide more information on your condition
        </CText>
      </TouchableOpacity>

    </>
  );

  // ─── Doctor-specific content layout ──────────────────────────────────────
  const renderDoctorContent = () => (
    <>
      {/* Profile header replacing banner */}
      <DoctorProfileHeader specialist={specialist} />

      {/* Bio */}
      {(specialist.full_bio || specialist.short_bio || specialist.bio || specialist.service_details) && (
        <Section title="About" top={12} bottom={0}>
          <View style={styles.sectionPadded}>
            <CText style={styles.bioText}>
              {specialist.full_bio || specialist.short_bio || specialist.bio || specialist.service_details || "No information available"}
            </CText>
          </View>
        </Section>
      )}

      {/* Hospital Affiliations */}
      {specialist.hospital_affiliations && (
        <Section title="Hospital Affiliations" top={16} bottom={0}>
          <View style={styles.fieldContainer}>
            <View style={styles.certificationCard}>
              <Text style={styles.certificationIcon}></Text>
              <CText style={styles.fieldValue}>
                {specialist.hospital_affiliations}
              </CText>
            </View>
          </View>
        </Section>
      )}

      {/* Board Certifications */}
      {specialist.board_certifications && (
        <Section title="Board Certifications" top={16} bottom={0}>
          <View style={styles.fieldContainer}>
            <View style={styles.certificationCard}>
              <Text style={styles.certificationIcon}></Text>
              <CText style={styles.fieldValue}>
                {specialist.board_certifications}
              </CText>
            </View>
          </View>
        </Section>
      )}

      {/* Awards */}
      {specialist.awards && (
        <Section title="Awards & Recognitions" top={16} bottom={0}>
          <View style={styles.fieldContainer}>
            <View style={styles.certificationCard}>
              <Text style={styles.certificationIcon}></Text>
              <CText style={styles.fieldValue}>{specialist.awards}</CText>
            </View>
          </View>
        </Section>
      )}

      {/* Insurance */}
      <Section title="Insurance Information" top={16} bottom={2}>
        <View style={styles.insuranceBody}>
          <View style={styles.insuranceRow}>
            <BoldText style={styles.insuranceLabel}>Insurance (TPA)</BoldText>
            <CText style={styles.insuranceValue}>
              {specialist.insurance_tpa || "Not specified"}
            </CText>
          </View>
          <Height h={12} />
          <View style={styles.insuranceRow}>
            <BoldText style={styles.insuranceLabel}>
              Insurance (Shield Plan)
            </BoldText>
            <CText style={styles.insuranceValue}>
              {specialist.insurance_shield_plan || "Not specified"}
            </CText>
          </View>
        </View>
        <View style={styles.insuranceNotice}>
          <CText style={styles.insuranceNoticeText}>
            Please note that insurance panel information may change
            periodically. We recommend contacting your insurance provider
            directly to confirm current arrangements.
          </CText>
        </View>
      </Section>

      {renderBookingSections()}
    </>
  );

  // ─── Service-specific content layout ─────────────────────────────────────
  const renderServiceContent = () => (
    <>
      {/* Banner */}
      <ImageBackground
        source={{
          uri:
            specialist.clinic_photo_path ||
            "https://via.placeholder.com/400x200",
        }}
        style={styles.bannerImage}
        imageStyle={{ resizeMode: "cover" }}
      >
        <View style={styles.bannerOverlay} />
        {specialist?.specialisation?.name && (
          <View style={styles.bannerSpecTag}>
            <CText style={styles.bannerSpecTagText}>
              {specialist.specialisation.name}
            </CText>
          </View>
        )}
        <View style={styles.bannerBottom}>
          <BoldText style={styles.bannerTitle} size={22}>
            {specialist.service_name || specialist.clinic_name}
          </BoldText>
          {specialist.clinic_name &&
            specialist.service_name !== specialist.clinic_name && (
              <CText style={styles.bannerClinicName}>
                {specialist.clinic_name}
              </CText>
            )}
        </View>
      </ImageBackground>

      {/* Contact row */}
      <View style={styles.contactRow}>
        {specialist.contact_name && (
          <View style={styles.contactItem}>
            <CText style={styles.contactItemText}>
              {specialist.contact_name}
            </CText>
          </View>
        )}
        {specialist.contact_phone && (
          <View style={styles.contactItem}>
            <CText style={styles.contactItemText}>
              {specialist.contact_phone}
            </CText>
          </View>
        )}
        {specialist.contact_email && (
          <View style={styles.contactItem}>
            <CText style={styles.contactItemText} numberOfLines={1}>
              {specialist.contact_email}
            </CText>
          </View>
        )}
        {specialist.appointment_email && (
          <View style={styles.contactItem}>
            <CText style={styles.contactItemText} numberOfLines={1}>
              {specialist.appointment_email}
            </CText>
          </View>
        )}
      </View>

      {/* Service Details */}
      {specialist.service_details && (
        <Section
          title={itemTypeValue === "doctor" ? "Doctor Details" : "Service Details"}
          top={16}
          bottom={0}
        >
          <View style={styles.fieldContainer}>
            <View style={styles.aboutContainer}>
              <ScrollView nestedScrollEnabled={true}>
                <CText style={styles.aboutText}>
                  {specialist.service_details}
                </CText>
              </ScrollView>
            </View>
          </View>
        </Section>
      )}

      {/* Hospital Affiliations */}
      {specialist.hospital_affiliations && (
        <Section title="Hospital Affiliations" top={16} bottom={0}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>
              {specialist.hospital_affiliations}
            </CText>
          </View>
        </Section>
      )}

      {/* Board Certifications */}
      {specialist.board_certifications && (
        <Section title="Board Certifications" top={16} bottom={0}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>
              {specialist.board_certifications}
            </CText>
          </View>
        </Section>
      )}

      {/* Awards */}
      {specialist.awards && (
        <Section title="Awards & Recognitions" top={16} bottom={0}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>{specialist.awards}</CText>
          </View>
        </Section>
      )}

      {/* About Us */}
      <Section title="About Us" top={16} bottom={0}>
        <View style={styles.fieldContainer}>
          <View style={styles.aboutContainer}>
            <ScrollView nestedScrollEnabled={true}>
              <CText style={styles.aboutText}>
                {specialist.full_bio || specialist.short_bio ||
                  specialist.bio ||
                  "No information available"}
              </CText>
            </ScrollView>
          </View>
        </View>
      </Section>

      {/* Experience */}
      {specialist.years_of_practice && (
        <Section title="Experience" top={16} bottom={0}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>
              {specialist.years_of_practice} years
            </CText>
          </View>
        </Section>
      )}

      {/* Languages */}
      {specialist.languages && (
        <Section title="Languages" top={16} bottom={0}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>{specialist.languages}</CText>
          </View>
        </Section>
      )}

      {renderConsultationFee()}

      {/* Insurance */}
      <Section title="Insurance Information" top={0} bottom={2}>
        <View style={styles.insuranceBody}>
          <View style={styles.insuranceRow}>
            <BoldText style={styles.insuranceLabel}>Insurance (TPA)</BoldText>
            <CText style={styles.insuranceValue}>
              {specialist.insurance_tpa || "Not specified"}
            </CText>
          </View>
          <Height h={12} />
          <View style={styles.insuranceRow}>
            <BoldText style={styles.insuranceLabel}>
              Insurance (Shield Plan)
            </BoldText>
            <CText style={styles.insuranceValue}>
              {specialist.insurance_shield_plan || "Not specified"}
            </CText>
          </View>
        </View>
        <View style={styles.insuranceNotice}>
          <CText style={styles.insuranceNoticeText}>
            Please note that insurance panel information may change
            periodically. We recommend contacting your insurance provider
            directly to confirm current arrangements.
          </CText>
        </View>
      </Section>

      {renderBookingSections(true)}
    </>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardView
        navBack={() => router.back()}
        title={
          <HeaderTitleTag
            tag="Specialist Care"
            title={
              itemTypeValue === "doctor"
                ? "Doctor Profile"
                : "Service's Profile"
            }
          />
        }
        action={
          !loading &&
          !error &&
          specialist && (
            <Button type="primary" onPress={handleBookAppointment}>
              Appointment Request
            </Button>
          )
        }
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <CText style={styles.errorText}>
              Failed to load details. Please try again.
            </CText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(false);
                setLoading(true);
                fetch(
                  `https://poculiform-nonenunciative-trenton.ngrok-free.dev/specialists/${id}`
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
            <CText style={styles.emptyText}>Specialist not found.</CText>
          </View>
        ) : itemTypeValue === "doctor" ? (
          renderDoctorContent()
        ) : (
          renderServiceContent()
        )}

        <Height h={32} />
      </KeyboardView>

      {/* Page loader */}
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
            <CText style={styles.loaderText}>Loading details...</CText>
          </View>
        </View>
      </Modal>

      {/* Booking loader */}
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

      {/* Reschedule/Cancel modal */}
      <Modal
        visible={showRescheduleCancel}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <BoldText size={18}>Manage Appointment</BoldText>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowRescheduleCancel(false)}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.modalOption}
                activeOpacity={0.7}
                onPress={() => {
                  modal.warn({
                    title: "Reschedule Appointment",
                    content: (
                      <CText>
                        A rescheduling confirmation will be sent to your email
                        with the subject "Rescheduled Appointment".
                      </CText>
                    ),
                    labels: ["Cancel", "Proceed"],
                    onOk: () => {
                      Toast.success({
                        content:
                          "Reschedule request sent. Check your email for confirmation.",
                      });
                      setShowRescheduleCancel(false);
                    },
                  });
                }}
              >
                <View
                  style={[
                    styles.modalOptionIcon,
                    styles.modalOptionIconPrimary,
                  ]}
                >
                  <Text style={styles.modalIconText}>📅</Text>
                </View>
                <View style={styles.modalOptionText}>
                  <BoldText size={15}>Reschedule Appointment</BoldText>
                  <CText style={styles.modalOptionDesc}>
                    Change your appointment date and time
                  </CText>
                </View>
              </TouchableOpacity>

              <Height h={12} />

              <TouchableOpacity
                style={[styles.modalOption, styles.modalOptionDanger]}
                activeOpacity={0.7}
                onPress={() => {
                  modal.warn({
                    title: "Cancel Appointment",
                    content: (
                      <View>
                        <CText style={{ marginBottom: 8 }}>
                          Please provide a reason for cancellation:
                        </CText>
                        <TextInput
                          placeholder="Enter reason..."
                          placeholderTextColor={colors.brands3}
                          style={styles.cancelReasonInput}
                          multiline
                          numberOfLines={4}
                        />
                      </View>
                    ),
                    labels: ["Don't Cancel", "Cancel Appointment"],
                    onOk: () => {
                      Toast.success({
                        content:
                          "Appointment cancelled. A confirmation email has been sent.",
                      });
                      setShowRescheduleCancel(false);
                    },
                  });
                }}
              >
                <View
                  style={[
                    styles.modalOptionIcon,
                    styles.modalOptionIconDanger,
                  ]}
                >
                  <Text style={styles.modalIconDanger}>✕</Text>
                </View>
                <View style={styles.modalOptionText}>
                  <BoldText size={15} style={{ color: colors.danger }}>
                    Cancel Appointment
                  </BoldText>
                  <CText style={styles.modalOptionDesc}>
                    Cancel your appointment request
                  </CText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Doctor Picker Modal */}
      <Modal
        visible={showDoctorPicker}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowDoctorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.doctorPickerModal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <BoldText size={18}>Choose a Doctor</BoldText>
                <CText style={styles.doctorPickerSubtitle}>
                  {doctors.length} specialist
                  {doctors.length !== 1 ? "s" : ""} available
                </CText>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowDoctorPicker(false)}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {doctors.length > 5 && (
              <View style={styles.doctorSearchWrapper}>
                <TextInput
                  style={styles.doctorSearchInput}
                  placeholder="Search by name or clinic..."
                  placeholderTextColor={colors.brands3}
                  value={doctorSearchQuery}
                  onChangeText={setDoctorSearchQuery}
                  autoCorrect={false}
                />
              </View>
            )}

            <FlatList
              data={filteredDoctors}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.doctorPickerList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.doctorPickerEmpty}>
                  <Text style={styles.doctorPickerEmptyIcon}>🔍</Text>
                  <CText style={styles.doctorPickerEmptyText}>
                    No doctors match your search.
                  </CText>
                </View>
              }
              renderItem={({ item: doctor }) => {
                const isSelected = doctor.id === selectedDoctorId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.doctorPickerItem,
                      isSelected && styles.doctorPickerItemSelected,
                    ]}
                    activeOpacity={0.72}
                    onPress={() => {
                      setSelectedDoctorId(doctor.id);
                      setSelectedDoctor(doctor);
                      setShowDoctorPicker(false);
                    }}
                  >
                    <View
                      style={[
                        styles.doctorPickerItemAvatar,
                        isSelected && styles.doctorPickerItemAvatarSelected,
                      ]}
                    >
                      {doctor.image_url ? (
                        <Image
                          source={{ uri: doctor.image_url }}
                          style={styles.doctorPickerItemAvatarImg}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.doctorPickerItemAvatarInitials,
                            isSelected && { color: colors.primary },
                          ]}
                        >
                          {getDoctorInitials(doctor)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.doctorPickerItemInfo}>
                      <BoldText
                        style={[
                          styles.doctorPickerItemName,
                          isSelected && { color: colors.primary },
                        ]}
                      >
                        {doctor.name || doctor.title || "Doctor"}
                      </BoldText>
                      <CText style={styles.doctorPickerItemClinic}>
                        {doctor.clinic_name || "Specialist Clinic"}
                      </CText>
                      {doctor.years_of_practice || doctor.languages ? (
                        <View style={styles.doctorPickerItemMeta}>
                          {doctor.years_of_practice ? (
                            <View style={styles.doctorPickerItemMetaPill}>
                              <Text style={styles.doctorPickerItemMetaText}>
                                {doctor.years_of_practice} yrs exp
                              </Text>
                            </View>
                          ) : null}
                          {doctor.languages ? (
                            <View style={styles.doctorPickerItemMetaPill}>
                              <Text style={styles.doctorPickerItemMetaText}>
                                {doctor.languages}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.doctorPickerItemCheck,
                        isSelected && styles.doctorPickerItemCheckSelected,
                      ]}
                    >
                      {isSelected && (
                        <Text style={styles.doctorPickerItemCheckMark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // ── Empty / error states ──────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    color: colors.brands1,
    fontSize: 15,
  },
  errorText: {
    textAlign: "center",
    marginTop: 16,
    color: colors.danger,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.brands2,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  // ── Service Banner ────────────────────────────────────────────────────────
  bannerImage: {
    width: "100%",
    height: 220,
    justifyContent: "space-between",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bannerSpecTag: {
    alignSelf: "flex-start",
    margin: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  bannerSpecTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  bannerBottom: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bannerTitle: {
    color: "#fff",
    lineHeight: 28,
  },
  bannerClinicName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },

  // ── Service Contact row ───────────────────────────────────────────────────
  contactRow: {
    flexDirection: "column",
    backgroundColor: colors.brands4 + "44",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.brands4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  contactItemText: {
    fontSize: 13,
    color: colors.brands1,
    flexShrink: 1,
  },

  // ── Service About ─────────────────────────────────────────────────────────
  aboutContainer: {
    maxHeight: 140,
    marginHorizontal: 12,
    marginBottom: 4,
  },
  aboutText: {
    lineHeight: 22,
    color: colors.brands1,
    fontSize: 14,
  },

  // ── Doctor Bio (no height cap) ────────────────────────────────────────────
  bioText: {
    lineHeight: 23,
    color: colors.brands1,
    fontSize: 14,
    paddingBottom: 4,
  },

  // ── Doctor certification card ─────────────────────────────────────────────
  certificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 0,
  },
  certificationIcon: {
    fontSize: 18,
    marginTop: 1,
  },

  // ── Generic field container ───────────────────────────────────────────────
  fieldContainer: {
    marginHorizontal: 2,
    marginBottom: 4,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 0,
    borderColor: colors.brands4,
  },
  fieldValue: {
    fontSize: 14,
    color: colors.brands1,
    lineHeight: 20,
  },

  // ── Insurance ─────────────────────────────────────────────────────────────
  insuranceBody: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  insuranceRow: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  insuranceLabel: {
    fontSize: 13,
    color: colors.brands2,
    marginBottom: 4,
  },
  insuranceValue: {
    fontSize: 14,
    color: colors.brands1,
    lineHeight: 20,
  },
  insuranceNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: `${colors.brands3}10`,
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  insuranceNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brands3,
    fontStyle: "italic",
    marginLeft: 6,
  },

  // ── Shared section inner padding ──────────────────────────────────────────
  sectionPadded: {
    paddingHorizontal: 12,
    paddingBottom: 2,
  },

  // ── Time slots ────────────────────────────────────────────────────────────
  timeSlotsLabel: {
    fontSize: 13,
    color: colors.brands3,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 10,
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "#fafafa",
    gap: 6,
    minHeight: 46,
  },
  selectedTimeSlot: {
    borderColor: colors.primary,
  },
  timeSlotText: {
    fontSize: 15,
    color: colors.brands1,
    fontWeight: "500",
  },
  selectedTimeSlotText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // ── Remark checkbox ───────────────────────────────────────────────────────
  remarkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: `${colors.brands2}08`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.brands2}20`,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  remarkText: {
    flex: 1,
    lineHeight: 20,
    fontSize: 14,
    color: colors.brands1,
  },

  // ── Consultation fee ──────────────────────────────────────────────────────
  minimalFeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  minimalFeeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  minimalFeeLabel: {
    fontSize: 15,
    color: colors.brands1,
  },
  minimalFeeAmount: {
    fontSize: 17,
    color: colors.brands2,
  },

  availabilityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  availabilityLabel: {
    width: 96,
    fontSize: 13,
    color: colors.brands3,
    fontWeight: "600",
  },
  availabilityValue: {
    flex: 1,
    fontSize: 14,
    color: colors.brands1,
  },

  // ── Loaders ───────────────────────────────────────────────────────────────
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

  // ── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brands4,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.brands4,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseIcon: {
    fontSize: 24,
    color: colors.brands1,
    fontWeight: "bold",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fafafa",
    gap: 12,
  },
  modalOptionDanger: {
    borderColor: `${colors.danger}30`,
    backgroundColor: `${colors.danger}06`,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOptionIconPrimary: {
    backgroundColor: `${colors.primary}12`,
  },
  modalOptionIconDanger: {
    backgroundColor: `${colors.danger}12`,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionDesc: {
    color: colors.brands3,
    fontSize: 13,
    marginTop: 3,
  },
  modalIconText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  modalIconDanger: {
    fontSize: 22,
    color: colors.danger,
  },
  cancelReasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    color: colors.brands1,
    textAlignVertical: "top",
    fontSize: 14,
    minHeight: 90,
  },

  // ── Doctor picker trigger ─────────────────────────────────────────────────
  doctorPickerTrigger: {
    marginHorizontal: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
  doctorPickerPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  doctorPickerPlaceholderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.brands2}12`,
    justifyContent: "center",
    alignItems: "center",
  },
  doctorPickerPlaceholderIconText: {
    fontSize: 22,
  },
  doctorPickerPlaceholderTitle: {
    fontSize: 14,
    color: colors.brands1,
    fontWeight: "600",
  },
  doctorPickerPlaceholderSub: {
    fontSize: 12,
    color: colors.brands3,
    marginTop: 2,
  },
  doctorPickerChevron: {
    fontSize: 26,
    color: colors.brands3,
    fontWeight: "300",
    marginRight: 4,
  },
  doctorPickerSelected: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: `${colors.primary}08`,
  },
  doctorPickerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: `${colors.primary}18`,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: `${colors.primary}40`,
  },
  doctorPickerAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  doctorPickerAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  doctorPickerSelectedInfo: {
    flex: 1,
  },
  doctorPickerSelectedName: {
    fontSize: 14,
    color: colors.brands1,
    fontWeight: "700",
  },
  doctorPickerSelectedSub: {
    fontSize: 12,
    color: colors.brands3,
    marginTop: 2,
  },
  doctorPickerChangeBadge: {
    backgroundColor: `${colors.primary}18`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  doctorPickerChangeBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },

  // ── Doctor picker modal ───────────────────────────────────────────────────
  doctorPickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "82%",
    paddingBottom: 24,
  },
  doctorPickerSubtitle: {
    fontSize: 12,
    color: colors.brands3,
    marginTop: 2,
  },
  doctorSearchWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "#f7f8fa",
    paddingHorizontal: 14,
    height: 44,
    justifyContent: "center",
  },
  doctorSearchInput: {
    fontSize: 14,
    color: colors.brands1,
    height: 44,
  },
  doctorPickerList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  doctorPickerEmpty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  doctorPickerEmptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  doctorPickerEmptyText: {
    color: colors.brands3,
    fontSize: 14,
  },
  doctorPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "#fafafa",
    gap: 12,
    marginBottom: 10,
  },
  doctorPickerItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  doctorPickerItemAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.brands4}`,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  doctorPickerItemAvatarSelected: {
    borderColor: `${colors.primary}60`,
    backgroundColor: `${colors.primary}12`,
  },
  doctorPickerItemAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  doctorPickerItemAvatarInitials: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.brands1,
  },
  doctorPickerItemInfo: {
    flex: 1,
  },
  doctorPickerItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brands1,
    marginBottom: 3,
  },
  doctorPickerItemClinic: {
    fontSize: 13,
    color: colors.brands3,
    marginBottom: 6,
  },
  doctorPickerItemMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  doctorPickerItemMetaPill: {
    backgroundColor: `${colors.brands4}`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  doctorPickerItemMetaText: {
    fontSize: 11,
    color: colors.brands3,
    fontWeight: "500",
  },
  doctorPickerItemCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  doctorPickerItemCheckSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doctorPickerItemCheckMark: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "bold",
  },

  // ── Legacy doctor card styles (kept for safety) ───────────────────────────
  doctorSectionHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  doctorSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.brands1,
  },
  doctorList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  doctorCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  doctorCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  doctorRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  doctorInfo: {
    flex: 1,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brands1,
    marginBottom: 4,
  },
  doctorSubText: {
    fontSize: 13,
    color: colors.brands3,
    marginBottom: 6,
  },
  selectDoctorText: {
    fontSize: 13,
    color: colors.brands2,
    fontWeight: "600",
  },
  doctorMeta: {
    fontSize: 13,
    color: colors.brands3,
    marginTop: 12,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.brands4,
    justifyContent: "center",
    alignItems: "center",
  },
  doctorAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.brands1,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorRole: {
    fontSize: 13,
    color: colors.brands3,
    marginBottom: 8,
  },
  doctorMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  doctorMetaItem: {
    fontSize: 12,
    color: colors.brands3,
  },
  doctorSelectNote: {
    marginHorizontal: 16,
    marginBottom: 16,
    color: colors.brands3,
    fontSize: 13,
    lineHeight: 19,
  },
  detailValue: {
    color: colors.brands3,
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
  affiliationItem: {
    paddingVertical: 4,
  },
  insuranceLine: {
    lineHeight: 22,
    fontSize: 14,
    color: colors.brands1,
  },
  insuranceTpa: {
    marginTop: 6,
    marginBottom: 4,
  },
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
});

export default SpecialistDetailsPage;
