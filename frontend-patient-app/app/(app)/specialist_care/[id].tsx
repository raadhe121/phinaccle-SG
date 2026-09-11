import React, { useEffect, useMemo, useState } from "react";
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
  Keyboard,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  BoldText,
  CText,
  HeaderTitleTag,
  Height,
  Label,
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
import {
  RawSpecialist,
  fetchSpecialisations,
  findSpecialisation,
  specialisationsQueryKey,
} from "./api";

type DoctorDetail = RawSpecialist;

const dayNameToNumber: { [key: string]: number } = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

// ─── Helper: Initials from Name ───────────────────────────────────────────────
const getInitials = (name?: string, title?: string): string => {
  const n = name || title || "DR";
  const parts = n.trim().split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
};

// ─── Patient-Centric Doctor Profile Header ────────────────────────────────────
const DoctorProfileHeader = ({ specialist }: { specialist: any }) => {
  const displayName =
    specialist.name || specialist.title || specialist.clinic_name || "Doctor";
  const initials = getInitials(specialist.name, specialist.title);

  const hasClinicHeader =
    specialist.clinic_logo_path ||
    (specialist.clinic_name &&
      specialist.clinic_name !== specialist.name &&
      specialist.clinic_name !== specialist.title);

  return (
    <View style={doctorHeaderStyles.container}>
      {/* 1. Clinic Branding Tile */}


      {/* 2. Doctor Avatar & Profile Details */}
      <View style={doctorHeaderStyles.profileSection}>
        <View style={doctorHeaderStyles.avatarContainer}>
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
        </View>

        <View style={doctorHeaderStyles.identityInfo}>
          <BoldText style={doctorHeaderStyles.doctorName} size={19}>
            {displayName}
          </BoldText>

          {specialist.specialisation?.name && (
            <View style={doctorHeaderStyles.specialisationTag}>
              <CText style={doctorHeaderStyles.specialisationText}>
                {specialist.specialisation.name}
              </CText>
            </View>
          )}


          {specialist.credentials && (
            <CText style={doctorHeaderStyles.doctorCredentials} numberOfLines={2}>
              {specialist.credentials}
            </CText>
          )}
          {hasClinicHeader && (
            <View style={doctorHeaderStyles.clinicHeaderRow}>
              {specialist.clinic_logo_path ? (
                <View style={doctorHeaderStyles.clinicLogoWrapper}>
                  <Image
                    source={{ uri: specialist.clinic_logo_path }}
                    style={doctorHeaderStyles.clinicLogo}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
              {specialist.clinic_name && (
                <CText style={doctorHeaderStyles.clinicNameText} numberOfLines={1}>
               {specialist.clinic_name}
                </CText>
              )}
            </View>
          )}
        </View>
      </View>

      {/* 3. Key Patient Stats Grid */}
      <View style={doctorHeaderStyles.statsGrid}>
        {specialist.years_of_practice ? (
          <View style={doctorHeaderStyles.statBox}>
            <CText style={doctorHeaderStyles.statLabel}>EXPERIENCE</CText>
            <BoldText style={doctorHeaderStyles.statValue}>
              {specialist.years_of_practice} Yrs
            </BoldText>
          </View>
        ) : null}

        {specialist.consultation_fee != null ? (
          <View style={doctorHeaderStyles.statBox}>
            <CText style={doctorHeaderStyles.statLabel}>CONSULT FEE</CText>
            <BoldText style={doctorHeaderStyles.statValue}>
              ${specialist.consultation_fee}
            </BoldText>
          </View>
        ) : null}

        {specialist.languages ? (
          <View style={doctorHeaderStyles.statBox}>
            <CText style={doctorHeaderStyles.statLabel}>LANGUAGES</CText>
            <BoldText style={doctorHeaderStyles.statValue} numberOfLines={1}>
              {specialist.languages}
            </BoldText>
          </View>
        ) : null}
      </View>

     
    </View>
  );
};

const doctorHeaderStyles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  clinicCard: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    // marginBottom: 16,
    // minHeight: 56,
  },
  clinicHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    // marginBottom: 6,
    marginTop:12
  },
  clinicLogoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    // backgroundColor: "#F8FAFC",
    // borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    // padding: 4,
  },
  clinicLogo: {
    width: "100%",
    height: "100%",
    // resizeMode:"cover"
  },
  clinicNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    flexShrink: 1,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary || "#008080"}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary || "#008080",
  },
  identityInfo: {
    flex: 1,
    justifyContent: "center",
  },
  doctorName: {
    color: colors.brands1,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  specialisationTag: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.primary || "#008080"}12`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  specialisationText: {
    fontSize: 12,
    color: colors.primary || "#008080",
    fontWeight: "600",
  },
  doctorCredentials: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    color: colors.brands1,
    fontWeight: "700",
  },
  contactBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contactBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    maxWidth: "100%",
  },
  contactIcon: {
    fontSize: 12,
  },
  contactText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "500",
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
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDetail | null>(
    null
  );
  const [preferredDate, setPreferredDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [requestEmail, setRequestEmail] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [remarkChecked, setRemarkChecked] = useState(false);
  const [reason, setReason] = useState("");
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

  // Doctors are nested inside the (large) specialisations list, shared with the
  // specialisation/specialist selection screens via this same query key so it's
  // only fetched once per session instead of on every screen transition.
  const specialisationsQry = useQuery({
    queryKey: specialisationsQueryKey,
    queryFn: fetchSpecialisations,
  });

  const serviceQry = useQuery({
    queryKey: ["specialist-service", id],
    queryFn: async (): Promise<RawSpecialist> => {
      const response = await fetch(`${apiUrl}/api/admin/services/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch specialist details");
      }
      return response.json();
    },
    enabled: itemTypeValue !== "doctor" && !!id,
  });

  const specialist: any = useMemo(() => {
    if (itemTypeValue === "doctor") {
      const specialisationData = findSpecialisation(
        specialisationsQry.data,
        specialisationSlug as string | undefined
      );
      return specialisationData?.specialists?.find(
        (doc) => String(doc.id) === String(id)
      );
    }
    return serviceQry.data;
  }, [itemTypeValue, specialisationsQry.data, specialisationSlug, id, serviceQry.data]);

  const doctors: DoctorDetail[] = useMemo(() => {
    if (itemTypeValue === "doctor" || !specialist) return [];

    const slug =
      specialisationSlug ||
      specialist.specialisation?.slug ||
      String(specialist.specialisation_id || "");
    if (!slug) return [];

    const selected = findSpecialisation(specialisationsQry.data, slug as string);
    return selected?.specialists ?? [];
  }, [itemTypeValue, specialist, specialisationSlug, specialisationsQry.data]);

  const loading =
    itemTypeValue === "doctor" ? specialisationsQry.isPending : serviceQry.isPending;
  const error =
    itemTypeValue === "doctor"
      ? specialisationsQry.isError ||
        (!specialisationsQry.isPending && !specialist)
      : serviceQry.isError;

  const getMarkedDates = () => {
    const marked: any = {};
    let current = dayjs().add(3, "day").startOf("day");
    const end = dayjs().add(6, "month");

    if (!specialist?.day_availability || Object.keys(specialist.day_availability).length === 0) {
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

    const availableDays = Object.keys(specialist.day_availability).map(
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
      marked[preferredDate] = { selected: true, selectedColor: colors.primary, selectedTextColor: "#fff", disableTouchEvent: false };
    }
    return marked;
  };

  useEffect(() => {
    if (preferredDate && specialist?.day_availability) {
      const dayName = dayjs(preferredDate).format("dddd");
      const slots = specialist.day_availability[dayName] || [];
      setTimeSlots(slots);
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
    Keyboard.dismiss();

    if (disableReason === "") {
      modal.warn({
        title: "Confirm Appointment Request",
        content: (
          <>
            <CText>You are requesting an appointment with </CText>
            <BoldText style={{ marginVertical: 8 }}>
              {itemTypeValue === "doctor"
                ? `Doctor: ${specialist.name ||
                specialist.title ||
                specialist.clinic_name
                }`
                : `Service: ${specialist.service_name || specialist.clinic_name
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
        onCancel: () => { },
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
            clinic_name: specialist.clinic_name || selectedDoctor?.clinic_name,
            preferred_days: preferredDate,
              // ? dayjs(preferredDate).format("dddd")
              // : undefined,
            preferred_time: selectedTime,
            
            reason:
              itemTypeValue === "doctor" ? "Consultation" : "Service booking",
            additional_info: remarkChecked ? reason : null
          };

          if (remarkChecked && reason) payload.reason = reason;
          if (itemTypeValue === "doctor") {
            payload.specialist_id = specialist.id;
          } else {
            
            payload.service_id = specialist.id;
            if (selectedDoctorId) {
              payload.specialist_id = selectedDoctorId;
            }
          }
          console.log(payload,'payloadpayloadpayloadpayload');
          
          appointmentRequestMutation.mutate(payload);
        },
      });
    } else {
      modal.warn({
        title: "Complete Required Fields",
        content: <CText>{disableReason}</CText>,
        labels: ["OK", "Cancel"],
        onOk: () => { },
      });
    }
  };

  const getDisableReason = () => {
    if (!!getEmailError(requestEmail)) return getEmailError(requestEmail);
    if (!preferredDate) return "Please select a preferred date.";
    if (!selectedTime) return "Please select a time slot.";
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

  const renderConsultationFee = () => (
    <Section title="Consultation Fee" top={0} bottom={8}>
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

  // ─── Shared Booking Sections ──────────────────────────────────────────────
  const renderBookingSections = (isServiceFlow = false) => (
    <>
      <Section
        title={isServiceFlow ? "Patient Input: Contact Email" : "Your Contact Email"}
        top={0}
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
                minDate={dayjs().add(3, "day").format("YYYY-MM-DD")}
                markedDates={getMarkedDates()}
                disableAllTouchEventsForDisabledDays
                onDayPress={(day: any) => {
                  setPreferredDate(day.dateString);
                }}
                theme={{
                  todayTextColor: "#EF4444",
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

      {remarkChecked && (
        <View style={styles.remarkInputContainer}>
          <TextInput
            style={styles.remarkInput}
            value={reason}
            onChangeText={setReason}
            placeholder="Please provide more information here..."
            placeholderTextColor={colors.weak}
            multiline
          />
        </View>
      )}
    </>
  );

  // ─── Doctor-Specific Content Layout ──────────────────────────────────────
  const renderDoctorContent = () => (
    <>
      <DoctorProfileHeader specialist={specialist} />

      {(specialist.full_bio || specialist.short_bio || specialist.bio || specialist.service_details) && (
        <Section title="About" top={12} bottom={0}>
          <View style={styles.sectionPadded}>
            <CText style={styles.bioText}>
              {specialist.full_bio || specialist.short_bio || specialist.bio || specialist.service_details || "No information available"}
            </CText>
          </View>
        </Section>
      )}

      {specialist.hospital_affiliations && (
        <Section title="Hospital Affiliations" top={0} bottom={0}>
          <View style={styles.fieldContainer}>
            <View style={styles.certificationCard}>
              <CText style={styles.fieldValue}>
                {specialist.hospital_affiliations}
              </CText>
            </View>
          </View>
        </Section>
      )}

      {specialist.board_certifications && (
        <Section title="Board Certifications" top={0} bottom={0}>
          <View style={styles.fieldContainer}>
            <View style={styles.certificationCard}>
              <CText style={styles.fieldValue}>
                {specialist.board_certifications}
              </CText>
            </View>
          </View>
        </Section>
      )}

      {specialist.awards && (
        <Section title="Awards & Recognitions" top={0} bottom={0}>
          <View style={styles.fieldContainer}>
            <View style={styles.certificationCard}>
              <CText style={styles.fieldValue}>{specialist.awards}</CText>
            </View>
          </View>
        </Section>
      )}

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

      {renderBookingSections()}
    </>
  );

  // ─── Service-Specific Content Layout ─────────────────────────────────────
  const renderServiceContent = () => (
    console.log(specialist,'specialist.clinic_photo_path'),
    
    <>
      <ImageBackground
        source={{
          uri:
            specialist.image_url ||
            "https://via.placeholder.com/400x200",
        }}
        style={styles.bannerImage}
        imageStyle={{ resizeMode: "contain" }}
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
      <View style={[styles.contactRow,{flexDirection:'row',alignItems:'center',gap:10}]}>
              {specialist.clinic_logo_path ? (
                <View style={[doctorHeaderStyles.clinicLogoWrapper,{width:140,height:80}]}>
                  <Image
                    source={{ uri: specialist.clinic_logo_path }}
                    style={doctorHeaderStyles.clinicLogo}
                    resizeMode="cover"
                  />
                </View>
              ) : null}
              {specialist.clinic_name && (
                <CText style={doctorHeaderStyles.clinicNameText} numberOfLines={1}>
               {specialist.clinic_name}
                </CText>
              )}
      </View>
      {/* <View style={styles.contactRow}> */}
        {/* {specialist.contact_name && (
          <View style={styles.contactItem}>
            <CText style={styles.contactItemText}>
              {specialist.contact_name}
            </CText>
          </View>
        )} */}

        {/* {specialist.contact_email && (
          <View style={styles.contactItem}>
            <CText style={styles.contactItemText} numberOfLines={1}>
              {specialist.contact_email}
            </CText>
          </View>
        )} */}
        {/* {specialist.appointment_email && (
          <View style={styles.contactItem}>
            <CText style={styles.contactItemText} numberOfLines={1}>
              {specialist.appointment_email}
            </CText>
          </View>
        )}
      </View> */}

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

      <Section title="About Us" top={8} bottom={0}>
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

      {specialist.years_of_practice && (
        <Section title="Experience" top={8} bottom={8}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>
              {specialist.years_of_practice} years
            </CText>
          </View>
        </Section>
      )}

      {specialist.languages && (
        <Section title="Languages" top={8} bottom={8}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>{specialist.languages}</CText>
          </View>
        </Section>
      )}

      {specialist.hospital_affiliations && (
        <Section title="Hospital Affiliations" top={8} bottom={8}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>
              {specialist.hospital_affiliations}
            </CText>
          </View>
        </Section>
      )}

      {specialist.board_certifications && (
        <Section title="Board Certifications" top={8} bottom={8}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>
              {specialist.board_certifications}
            </CText>
          </View>
        </Section>
      )}

      {specialist.awards && (
        <Section title="Awards & Recognitions" top={12} bottom={12}>
          <View style={styles.fieldContainer}>
            <CText style={styles.fieldValue}>{specialist.awards}</CText>
          </View>
        </Section>
      )}

      {renderConsultationFee()}

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
            <Button
              type="primary"
              loading={appointmentRequestMutation.isPending}
              disabled={appointmentRequestMutation.isPending}
              onPress={handleBookAppointment}
            >
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
                if (itemTypeValue === "doctor") {
                  specialisationsQry.refetch();
                } else {
                  serviceQry.refetch();
                }
              }}
            >
              <CText style={styles.retryButtonText}>Retry</CText>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.brands2} />
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

      {/* Reschedule/Cancel Modal */}
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
  // ── Empty / Error States ──────────────────────────────────────────────────
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
    // width: "100%",
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

  // ── Service Contact Row ───────────────────────────────────────────────────
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
    width: "100%",
    marginBottom: 4,
  },
  aboutText: {
    lineHeight: 22,
    color: colors.brands1,
    fontSize: 14,
    textAlign: "left",
  },

  // ── Doctor Bio ────────────────────────────────────────────────────────────
  bioText: {
    width: "100%",
    lineHeight: 23,
    color: colors.brands1,
    fontSize: 14,
    paddingBottom: 4,
    textAlign: "left",
  },

  certificationCard: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 0,
    borderRadius: 10,
    borderWidth: 0,
  },

  // ── Generic Field Container ───────────────────────────────────────────────
  fieldContainer: {
    marginBottom: 10,
    paddingVertical: 0,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 0,
    borderColor: colors.brands4,
  },
  fieldValue: {
    width: "100%",
    fontSize: 14,
    color: colors.brands1,
    lineHeight: 20,
    textAlign: "left",
  },

  // ── Insurance Section ─────────────────────────────────────────────────────
  insuranceBody: {
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 8,
  },
  insuranceRow: {
    backgroundColor: "white",
    padding: 16,
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
    width: "100%",
    fontSize: 14,
    color: colors.brands1,
    lineHeight: 20,
    textAlign: "left",
  },
  insuranceNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 0,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: `${colors.brands3}10`,
    padding: 16,
    borderRadius: 8,
    gap: 6,
  },
  insuranceNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.brands3,
    fontStyle: "italic",
    textAlign: "left",
  },

  sectionPadded: {
    paddingHorizontal: 16,
    // paddingBottom: 2,
  },

  // ── Time Slots ────────────────────────────────────────────────────────────
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

  // ── Remark Checkbox ───────────────────────────────────────────────────────
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

  remarkInputContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  remarkInput: {
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // ── Consultation Fee ──────────────────────────────────────────────────────
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

  // ── Doctor Picker Trigger ─────────────────────────────────────────────────
  doctorPickerTrigger: {
    marginHorizontal: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "#fafafa",
    overflow: "hidden",
    padding: 12,
  },

  // ── Doctor Picker Modal ───────────────────────────────────────────────────
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
});

export default SpecialistDetailsPage;
