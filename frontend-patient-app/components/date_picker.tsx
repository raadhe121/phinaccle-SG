import { colors } from '@/common/utils/config'
import { toast } from '@/common/utils/modal'
import { modal } from '@/common/utils/modal'
import dayjs, { Dayjs } from 'dayjs'
import React, { useEffect, useState } from 'react'
import { TouchableHighlight } from 'react-native'
import DatePicker from 'react-native-date-picker'

export const dateFormat = 'YYYY-MM-DD';
export const dateHumanFormat = 'DD MMM YYYY';

type NativeDatePickerProps = {
    value?: string,
    onChange: (value: string) => void,
    children: React.ReactNode,
    minDate?: string,
    maxDate?: string
}

export default function NativeDatePicker({ value, onChange, children, minDate, maxDate }: NativeDatePickerProps) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Dayjs>(value ? dayjs(value, dateFormat) : dayjs())

    // validate value in YYYY-MM-DD format
    useEffect(() => {
        if (value && !dayjs(value, dateFormat).isValid()) toast.fail('Invalid date value');
        if (minDate && !dayjs(minDate, dateFormat).isValid()) toast.fail('Invalid min date value');
        if (maxDate && !dayjs(maxDate, dateFormat).isValid()) toast.fail('Invalid max date value');
    }, [])

    const validateDate = (date: Dayjs) => {
        let valid = true;
        if (minDate) valid = dayjs(minDate, dateFormat).startOf('day').isBefore(date)
        if (valid && maxDate) valid = dayjs(maxDate, dateFormat).endOf('day').isAfter(date)

        if (!valid) {
            let content = '';
            const formatDate = (date: string) => dayjs(date, dateFormat).format(dateHumanFormat)
            if (minDate && maxDate) {
                content = `Date must be within ${formatDate(minDate)} and ${formatDate(maxDate)}`
            } else if (minDate) {
                content = `Date must be after ${formatDate(minDate)}`
            } else if (maxDate) {
                content = `Date must be before ${formatDate(maxDate)}`
            }

            modal.error({
                title: `Date is invalid`,
                content: content,
                labels: ['OK'],
                onCancel: () => {}
            })
        }

        return valid;
    }

    const onConfirm = (date: Date) => {
        const dayjsDate = dayjs(date)
        setOpen(false)
        if (!validateDate(dayjsDate)) return;
        
        // Checked to ensure that upon format, the date shown is aligned with what is shown on datepicker
        setDate(dayjsDate)
        onChange(dayjsDate.format(dateFormat))
    }

    const onCancel = () => {
        setOpen(false)
    }

    return (
        <>
            <TouchableHighlight underlayColor={colors.underlay} onPress={() => setOpen(true)}>
                {children}
            </TouchableHighlight>
            <DatePicker
                modal
                mode='date'
                open={open}
                date={date.toDate()}
                onConfirm={onConfirm}
                onCancel={onCancel}
                locale='en-SG'
            />
        </>
    
    )
}
