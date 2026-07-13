import { colors } from '@/common/utils/config';
import { toast } from '@/common/utils/modal';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import { TouchableHighlight } from 'react-native';
import DatePicker from 'react-native-date-picker';

export const dateFormat = 'YYYY-MM-DD';
export const dateHumanFormat = 'DD MMM YYYY';

type NativeDatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  minDate?: string;
  maxDate?: string;
  disabledDays?: number[];
};

export default function NativeDatePicker({
  value,
  onChange,
  children,
  minDate,
  maxDate,
  disabledDays = [],
}: NativeDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Dayjs>(
    value ? dayjs(value, dateFormat) : dayjs(),
  );

  useEffect(() => {
    if (value && !dayjs(value, dateFormat).isValid()) {
      toast.fail('Invalid date value');
    }

    if (minDate && !dayjs(minDate, dateFormat).isValid()) {
      toast.fail('Invalid min date value');
    }

    if (maxDate && !dayjs(maxDate, dateFormat).isValid()) {
      toast.fail('Invalid max date value');
    }
  }, [value, minDate, maxDate]);

  useEffect(() => {
    if (value) {
      const parsedDate = dayjs(value, dateFormat);
      if (parsedDate.isValid()) {
        setDate(parsedDate);
      }
    }
  }, [value]);

  const validateDate = (selectedDate: Dayjs) => {
    let valid = true;

    if (minDate) {
      valid =
        dayjs(minDate, dateFormat).startOf('day').isBefore(selectedDate) ||
        dayjs(minDate, dateFormat).isSame(selectedDate, 'day');
    }

    if (valid && maxDate) {
      valid =
        dayjs(maxDate, dateFormat).endOf('day').isAfter(selectedDate) ||
        dayjs(maxDate, dateFormat).isSame(selectedDate, 'day');
    }

    return valid;
  };

  const onConfirm = (selectedDate: Date) => {
    const dayjsDate = dayjs(selectedDate);
    const weekday = dayjsDate.day(); // 0 = Sunday ... 6 = Saturday

    // Check unavailable weekdays
    if (disabledDays.includes(weekday)) {
      toast.fail('This doctor is not available on the selected day.');
      setOpen(false);
      return;
    }

    // Check min/max dates
    if (!validateDate(dayjsDate)) {
      toast.fail('Please select a valid date.');
      setOpen(false);
      return;
    }

    setOpen(false);
    setDate(dayjsDate);
    onChange(dayjsDate.format(dateFormat));
  };

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <>
      <TouchableHighlight
        underlayColor={colors.underlay}
        onPress={() => setOpen(true)}
      >
        {children}
      </TouchableHighlight>

      <DatePicker
        modal
        mode="date"
        open={open}
        date={date.toDate()}
        minimumDate={minDate ? dayjs(minDate).toDate() : undefined}
        maximumDate={maxDate ? dayjs(maxDate).toDate() : undefined}
        onConfirm={onConfirm}
        onCancel={onCancel}
        locale="en-SG"
      />
    </>
  );
}