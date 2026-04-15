import React, { useState, useEffect } from "react";
import {
  NavHeader3,
  CText,
  Height,
  Section,
  BoldText,
  TitleText,
  ReactQueryChild,
  CMarkdown,
} from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { router, useLocalSearchParams } from "expo-router";
import { View, TouchableHighlight, StyleSheet } from "react-native";
import { Button, Toast } from "@ant-design/react-native";
import { MAX_MONTHS_AHEAD } from "@/hooks/useAppointment";
import dayjs from "dayjs";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRescheduleAppointmentTimingsApiAppointmentV1AppointmentsIdRescheduleTimingsPost,
  rescheduleAppointmentApiAppointmentV1AppointmentsIdReschedulePost,
} from "@/services/client";
import { Picker } from "@react-native-picker/picker";
import { modal } from "@/common/utils/modal";

// Calendar data and helpers
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getDayOfWeek = (year: number, month: number, day: number) => {
  return new Date(year, month, day).getDay();
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const generateCalendarDays = (
  selectedMonthDate: dayjs.Dayjs,
  availableDates: string[] = [],
  minDate?: string,
) => {
  const year = selectedMonthDate.year();
  const month = selectedMonthDate.month();
  const minDateObj = minDate ? dayjs(minDate) : null;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getDayOfWeek(year, month, 1);

  // Previous month days to fill the first row
  const prevMonthDays = [];
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

  for (let i = 0; i < firstDayOfMonth; i++) {
    prevMonthDays.push({
      day: daysInPrevMonth - firstDayOfMonth + i + 1,
      month: prevMonth,
      year: prevMonthYear,
      isCurrentMonth: false,
      isAvailable: false,
      availableSlots: 0,
    });
  }

  // Current month days
  const currentMonthDays = [];
  const now = dayjs();
  const today = now.date();
  const currentMonth = now.month();
  const currentYear = now.year();

  for (let i = 1; i <= daysInMonth; i++) {
    // Format the date to match the API response format
    const currentDate = dayjs().year(year).month(month).date(i);
    const dateStr = currentDate.format("YYYY-MM-DD");

    // Count how many time slots are available for this date
    const timeSlotsForDate = availableDates.filter((timing) =>
      timing.startsWith(dateStr),
    );
    const hasAvailableSlots = timeSlotsForDate.length > 0;

    // Check if date is after minDate from API
    const isAfterMinDate = minDateObj
      ? currentDate.isAfter(minDateObj) || currentDate.isSame(minDateObj, "day")
      : false;

    // Date is available if it's after minDate AND has slots available from API
    const isAvailable = minDateObj ? isAfterMinDate : true;

    currentMonthDays.push({
      day: i,
      month,
      year,
      isCurrentMonth: true,
      isToday: i === today && month === currentMonth && year === currentYear,
      isAvailable: isAvailable,
      availableSlots: isAvailable ? timeSlotsForDate.length : 0, // Use the actual count of available slots
    });
  }

  // Next month days to fill the last row
  const nextMonthDays = [];
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const totalCalendarDays = 42; // 6 rows of 7 days
  const remainingDays =
    totalCalendarDays - prevMonthDays.length - currentMonthDays.length;

  for (let i = 1; i <= remainingDays; i++) {
    nextMonthDays.push({
      day: i,
      month: nextMonth,
      year: nextMonthYear,
      isCurrentMonth: false,
      isAvailable: false,
      availableSlots: 0,
    });
  }

  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
};

// CalendarDay component
interface CalendarDayProps {
  day: {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday?: boolean;
    isAvailable: boolean;
    availableSlots: number;
  };
  selectedDate: dayjs.Dayjs | null;
  onSelect: (day: any) => void;
  index: number;
}

const CalendarDay = ({
  day,
  selectedDate,
  onSelect,
  index,
}: CalendarDayProps) => {
  const isSelected = selectedDate
    ? day.day === selectedDate.date() &&
      day.month === selectedDate.month() &&
      day.year === selectedDate.year()
    : false;

  let availableColor = "green";
  if (day.availableSlots == 0) {
    availableColor = "grey";
  } else if (day.availableSlots < 10) {
    availableColor = "orange";
  }

  return (
    <View style={styles.dayCell}>
      <TouchableHighlight
        key={index}
        underlayColor={colors.underlay}
        onPress={() => onSelect(day)}
        disabled={!day.isAvailable || day.availableSlots === 0 || isSelected}
        style={[
          styles.dayCellContent,
          !day.isCurrentMonth && styles.notCurrentMonth,
          day.isToday && styles.today,
          isSelected && styles.selectedDay,
          (!day.isAvailable || day.availableSlots === 0) &&
            styles.unavailableDay,
        ]}
      >
        <>
          <CText
            size={15}
            style={{ color: isSelected ? "white" : colors.text }}
          >
            {day.day}
          </CText>
          {day.isAvailable && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: availableColor,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginRight: 2,
                }}
              />
              {/* <CText size={9} style={
                [
                  isSelected && { color: 'white' },
                  day.isAvailable && day.availableSlots === 0 && { color: colors.weak }
                ].reduce((acc, curr) => ({ ...acc, ...curr }), {})
              }>
                {
                  day.isAvailable && day.availableSlots === 0
                    ? 'N/A'
                    : day.availableSlots
                }
              </CText> */}
            </View>
          )}
        </>
      </TouchableHighlight>
    </View>
  );
};

// Date time selection screen for appointments
export default function AppointmentRescheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Combined selected month and year into a Dayjs object
  const [selectedMonthDate, setSelectedMonthDate] = useState(() =>
    dayjs().date(1),
  );
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>();
  const [calendarDays, setCalendarDays] = useState<any[]>([]);

  const queryClient = useQueryClient();
  const appointmentQuery = useQuery({
    queryKey: [
      "appointmentRescheduleAvailability",
      selectedMonthDate.toISOString(),
    ],
    queryFn: () =>
      getRescheduleAppointmentTimingsApiAppointmentV1AppointmentsIdRescheduleTimingsPost(
        {
          id: id,
          requestBody: {
            curr_date: selectedMonthDate.format("YYYY-MM-DD"),
          },
        },
      ),
  });

  const rescheduleMutation = useMutation({
    mutationFn:
      rescheduleAppointmentApiAppointmentV1AppointmentsIdReschedulePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      router.back();
    },
  });

  const onReschedule = (selectedTime: string) => {
    modal.warn({
      iconColor: colors.warning,
      title: "Reschedule appointment?",
      content: (
        <CMarkdown size={15} textAlign="center">
          Are you sure you want to reschedule this health screening appointment?
        </CMarkdown>
      ),
      labels: ["Cancel", "Yes, Reschedule"],
      onCancel: () => {},
      onOk: () =>
        rescheduleMutation.mutate({
          id,
          requestBody: {
            new_start_datetime: selectedTime,
          },
        }),
    });
  };

  // Function to check if a date is before the current month
  const isBeforeCurrentMonth = (date: dayjs.Dayjs) => {
    const currentSystemDate = dayjs().date(1);
    return date.isBefore(currentSystemDate);
  };

  // Function to check if a date is after the max allowed month
  const isAfterMaxMonth = (date: dayjs.Dayjs) => {
    const maxDate = getMaxDate();
    return date.isAfter(maxDate);
  };

  // Function to get max date either from API or default (6 months ahead)
  const getMaxDate = () => {
    if (appointmentQuery.data?.max_date) {
      return dayjs(appointmentQuery.data.max_date);
    }
    return dayjs().add(MAX_MONTHS_AHEAD, "month").date(1);
  };

  useEffect(() => {
    if (appointmentQuery.data) {
      setCalendarDays(
        generateCalendarDays(
          selectedMonthDate,
          appointmentQuery.data.timings,
          appointmentQuery.data.min_date,
        ),
      );
    }
  }, [selectedMonthDate, appointmentQuery.data]);

  const setMonthDate = (date: dayjs.Dayjs) => {
    setSelectedMonthDate(date);
    setSelectedDate(null);
    setSelectedTime(undefined);
  };

  const goToPreviousMonth = () => {
    const newDate = selectedMonthDate.subtract(1, "month").day(2);
    if (isBeforeCurrentMonth(newDate)) {
      Toast.info("Cannot navigate before the current month.", 1);
      return;
    }

    setMonthDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = selectedMonthDate.add(1, "month").day(2);
    if (isAfterMaxMonth(newDate)) {
      const maxDate = getMaxDate().format("MMMM YYYY");
      Toast.info(`Cannot navigate beyond ${maxDate}.`, 1);
      return;
    }

    setMonthDate(newDate);
  };

  const goToCurrentMonth = () => {
    setMonthDate(dayjs().date(1));
  };

  const goToMaxMonth = () => {
    const maxDate = getMaxDate();
    if (selectedMonthDate.isSame(maxDate, "month")) {
      Toast.info(`Already at the maximum allowed month.`, 1);
      return;
    }

    setMonthDate(maxDate);
  };

  const handleDateSelect = (day: any) => {
    if (!day.isAvailable) {
      Toast.fail("This date is not available.", 2);
      return;
    }

    if (day.availableSlots === 0) {
      Toast.fail("No appointment slots available for this date.", 2);
      return;
    }

    const selectedDate = dayjs().year(day.year).month(day.month).date(day.day);
    setSelectedDate(selectedDate);

    if (appointmentQuery.data) {
      // Set the first available time slot for the selected date
      setSelectedTime(
        appointmentQuery.data.timings.find((slot: string) =>
          slot.startsWith(selectedDate?.format("YYYY-MM-DD")),
        ),
      );
    }
  };

  const confirmSelection = () => {
    if (selectedDate && selectedTime) {
      // Use the exact start time from the API response
      // TODO: Confirm Timing and call reschedule endpoint
      onReschedule(selectedTime);
    } else {
      Toast.info("Please select both date and time", 1);
    }
  };

  const monthName = selectedMonthDate.format("MMMM");
  const year = selectedMonthDate.year();

  // Button to confirm selection
  const action = (
    <View>
      <Button
        type="primary"
        onPress={confirmSelection}
        disabled={!selectedTime || rescheduleMutation.isPending}
        loading={rescheduleMutation.isPending}
      >
        <BoldText size={17} style={{ color: "white" }}>
          Select{" "}
          {selectedTime ? dayjs(selectedTime).format("DD MMM h:mm A") : "Time"}
        </BoldText>
      </Button>
    </View>
  );

  return (
    <KeyboardView
      navBack={router.back}
      header={<NavHeader3 navBack={router.back} />}
      scrollOverflow="hidden"
      action={action}
    >
      {/* <H1Text>Select date & time</H1Text>
      <CText size={15} style={styles.infoText}>
        Available timings from <BoldText>{location?.name}</BoldText>.
      </CText> */}

      <Height h={16} />

      {/* Calendar navigation */}
      <View style={styles.calendarHeader}>
        <TouchableHighlight
          onPress={goToCurrentMonth}
          underlayColor={colors.underlay}
          style={styles.navButton}
        >
          <AntdMiniIcon
            name="BackwardOutline"
            size={24}
            color={colors.primary}
          />
        </TouchableHighlight>
        <TouchableHighlight
          onPress={goToPreviousMonth}
          underlayColor={colors.underlay}
          style={styles.navButton}
        >
          <AntdMiniIcon name="LeftOutline" size={24} color={colors.primary} />
        </TouchableHighlight>
        <CText size={18} style={styles.monthYearText}>
          {monthName} {year}
        </CText>
        <TouchableHighlight
          onPress={goToNextMonth}
          underlayColor={colors.underlay}
          style={styles.navButton}
        >
          <AntdMiniIcon name="RightOutline" size={24} color={colors.primary} />
        </TouchableHighlight>
        <TouchableHighlight
          onPress={goToMaxMonth}
          underlayColor={colors.underlay}
          style={styles.navButton}
        >
          <AntdMiniIcon
            name="ForwardOutline"
            size={24}
            color={colors.primary}
          />
        </TouchableHighlight>
      </View>

      {/* Weekdays header */}
      <View style={styles.weekdaysContainer}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <CText size={15}>{day}</CText>
          </View>
        ))}
      </View>

      {/* Calendar grid with loading state using ReactQueryChild */}
      <ReactQueryChild query={appointmentQuery}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <CalendarDay
              key={index}
              day={day}
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
              index={index}
            />
          ))}
        </View>
      </ReactQueryChild>
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 12,
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            backgroundColor: "green",
            borderRadius: 3,
          }}
        ></View>
        <CText style={{ marginLeft: 4, marginRight: 8 }}>Available</CText>
        <View
          style={{
            width: 6,
            height: 6,
            backgroundColor: "orange",
            borderRadius: 3,
          }}
        ></View>
        <CText style={{ marginLeft: 4, marginRight: 8 }}>Limited Slots</CText>
        <View
          style={{
            width: 6,
            height: 6,
            backgroundColor: "grey",
            borderRadius: 3,
          }}
        ></View>
        <CText style={{ marginLeft: 4, marginRight: 8 }}>No Slots</CText>
      </View>

      <TitleText>Select appointment time</TitleText>

      {!selectedDate ? (
        <View style={styles.selectDatePromptContainer}>
          <AntdMiniIcon name="EventBusy" size={24} color={colors.weak} />
          <CText size={16} style={styles.selectDatePromptText}>
            Select an appointment date to view the available appointment
            timeslots
          </CText>
        </View>
      ) : (
        <ReactQueryChild query={appointmentQuery}>
          {appointmentQuery?.data?.timings.length === 0 ? (
            <Section title={<></>}>
              <CText size={16} style={styles.noTimeSlotsText}>
                No appointment slots available for this date
              </CText>
            </Section>
          ) : (
            <Picker
              // @ts-ignore
              themeVariant="light"
              selectedValue={selectedTime}
              onValueChange={(itemValue, itemIndex) =>
                setSelectedTime(itemValue)
              }
            >
              {appointmentQuery?.data?.timings
                .filter((slot: string) =>
                  slot.startsWith(selectedDate?.format("YYYY-MM-DD")),
                )
                .map((slot: string) => (
                  <Picker.Item
                    key={slot}
                    label={dayjs(slot).format("h:mm A")}
                    value={slot}
                  />
                ))}
            </Picker>
          )}
        </ReactQueryChild>
      )}

      <Height h={24} />
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  infoText: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  monthYearText: {
    width: "40%",
    textAlign: "center",
    fontWeight: "bold",
  },
  weekdaysContainer: {
    flexDirection: "row",
    marginHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.brands4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    padding: 8,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 12,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  dayCellContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  dayText: {
    fontWeight: "bold",
  },
  notCurrentMonth: {
    opacity: 0.3,
  },
  notCurrentMonthText: {
    color: colors.weak,
  },
  today: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
  },
  todayText: {
    color: colors.primary,
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  selectedDayText: {
    color: "white",
  },
  unavailableDay: {
    opacity: 0.5,
  },
  unavailableDayText: {
    color: colors.weak,
  },
  availableSlotsText: {
    color: colors.primary,
    marginTop: 2,
  },
  selectedSlotsText: {
    color: "white",
  },
  unavailableSlotsText: {
    color: colors.weak,
    marginTop: 2,
  },
  timeSlotContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
    marginHorizontal: 12,
  },
  timeSlotRow: {
    padding: 16,
  },
  timeSlotRowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  timeSlotText: {
    marginLeft: 8,
  },
  unavailableTimeSlotText: {
    color: colors.weak,
  },
  noTimeSlotsContainer: {
    padding: 16,
    alignItems: "center",
  },
  noTimeSlotsText: {
    color: colors.weak,
    textAlign: "center",
  },
  selectDatePromptContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectDatePromptText: {
    marginTop: 8,
    color: colors.weak,
    textAlign: "center",
  },
  actionContainer: {
    padding: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
});
