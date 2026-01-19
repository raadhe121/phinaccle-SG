import { Theme } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { OpenAPI } from '@/services/client';
import { supabase } from '@/lib/supabase';
import { apiUrl } from '@/Config'; 

OpenAPI.BASE = apiUrl;
OpenAPI.TOKEN = async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token ?? '';
}

export const DefaultTheme: Theme = {
    dark: false,
    colors: {
      primary: 'rgb(0, 122, 255)',
      background: '#DFE3EB',
      card: 'rgb(255, 255, 255)',
      text: 'rgb(28, 28, 30)',
      border: 'rgb(216, 216, 216)',
      notification: 'rgb(255, 59, 48)',
    },
};

export const tabBarHeight = 64;

const baseColors = {
    brands1: '#15405F',
    brands2: '#0874BD',
    brands3: '#8AB8DD',
    brands4: '#D6E6F1',
    brands5: '#F9F9FC',
    weak: '#999999',
    light: '#CCCCCC',
    background: '#FFFFFF',
    white: '#FFFFFF',
    success: '#00B578',
    warning: '#FF8F1F',
    danger: '#FF3141',
    badge: '#FF411C',
}

const refColors = {
    title: baseColors.brands1,
    text: baseColors.brands1,
    border: baseColors.brands4,
    primary: baseColors.brands2,
}

export const colors = {
    ...baseColors,
    ...refColors,
    underlay: baseColors.brands4,
    action: baseColors.brands4,
    disabled: '#666666',
    greyButton: '#F5F5F5',
    inactive: '#8AB8DD',
}

export const statusMapping: { [key: string]: string} = {
    "CHECKED_IN": "Checked In",
    "CONSULT_START": "Consult Start",
    "CONSULT_END": "Consult End",
    "OUTSTANDING": "Outstanding",
    "CHECKED_OUT": "Checked Out",
    "CANCELLED": "Cancelled",
    "MISSED": "Missed",
}

export const tagColorMapping: { [key: string]: string} = {
    "Checked In": colors.success,
    "Consult Start": colors.brands2,
    "Outstanding": colors.danger,
    "Missed": colors.danger,
    "Cancelled": colors.danger,
    "Consult End": colors.warning,
    "Checked Out": colors.disabled,
    "Pending": colors.success,
    "Rejected": colors.danger,
    "In-Queue": colors.brands2,
}

export enum TeleconsultsStatus {
    CHECKED_IN = "CHECKED_IN",
    MISSED = "MISSED",
    CONSULT_START = "CONSULT_START",
    CONSULT_END = "CONSULT_END",
    OUTSTANDING = "OUTSTANDING",
    CANCELLED = "CANCELLED",
}

export const antd = StyleSheet.create({
    h1Text: {
        margin: 12,
        marginTop: 28,
        fontSize: 25,
        fontFamily: 'Manrope_700Bold',
        color: colors.brands1,
    },
    h3Text: {
        fontFamily: 'Manrope_700Bold'
    },
    titleText: {
        margin: 12,
        fontSize: 18,
        fontFamily: 'Manrope_700Bold',
        color: colors.brands1,
    },
    manropeText: {
        fontSize: 16,
        fontFamily: 'Manrope_400Regular'
    },
    boldText: {
        fontFamily: 'Manrope_700Bold'
    },
    defaultText: {
        fontSize: 15, 
        fontFamily: 'Inter_400Regular'
    },
    menuItemText: {
        fontSize: 17,
    },
    subtitleText: {
        fontSize: 10,
        color: 'grey',
    },
    inputLabel: {
        marginLeft: 12,
        marginTop: 12,
        color: colors.brands2,
        fontFamily: 'Manrope_700Bold'
    },
    tabBarLabel: {
        fontSize: 12,
        fontFamily: 'Manrope_700Bold'
    },
    button: {
        margin: 12
    },
    disabledColor: {
        color: colors.light
    }
})
