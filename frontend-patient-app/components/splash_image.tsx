import { Image } from 'expo-image';
import { splashImage, splashEventImage } from '@/common/components/AntdMiniIcon';
import dayjs from 'dayjs';

// Event Splash
const eventSplashStart = dayjs('2025-01-29 00:00:00');
const eventSplashEnd = dayjs('2025-02-13 00:00:00');

export default function SplashImage() {
    const isEventActive = dayjs().isAfter(eventSplashStart) && dayjs().isBefore(eventSplashEnd);
    return <Image source={isEventActive ? splashEventImage : splashImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
}
