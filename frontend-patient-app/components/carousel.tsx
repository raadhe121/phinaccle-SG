import AntdMiniIcon, { bgImages } from "@/common/components/AntdMiniIcon";
import { BoldText } from "@/common/components/AntdText";
import { colors } from "@/common/utils/config";
import { GetCarouselApiSupportCarouselGetResponse } from "@/services/client";
import { BlurView } from "expo-blur";
import { useRef, useState } from "react";
import { ImageBackground, Linking, TouchableHighlight, useWindowDimensions, View } from "react-native";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";

export default function HomeCarousel({ data }: { data: GetCarouselApiSupportCarouselGetResponse }) {
    const { width } = useWindowDimensions();
    const ref = useRef<ICarouselInstance | null>(null);
    const [index, setIndex] = useState<number>(0);

    const carouselBaseImages = [bgImages.IndexFrame1, bgImages.IndexFrame2, bgImages.IndexFrame3]

    return <Carousel
        autoPlay={true}
        autoPlayInterval={2500}
        ref={ref}
        width={width}
        height={240}
        data={data}
        windowSize={3}
        onProgressChange={(p) => setIndex(p)}
        renderItem={({ item }) => (
            <View key={index} style={{ marginLeft: 12, marginTop: 0, marginRight: 12 }}>
                <View style={{ borderRadius: 18, overflow: 'hidden', height: 216 }}>
                    <TouchableHighlight underlayColor={colors.underlay} onPress={() => Linking.openURL(item.url)}>
                        <ImageBackground
                            source={item.image ? { uri: item.image } : carouselBaseImages[index % carouselBaseImages.length].uri}
                            resizeMode='cover'
                            style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}>
                            <BlurView intensity={30} style={{ backgroundColor: '#0521355F' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 15 }}>
                                    <BoldText size={16} style={{ color: 'white' }}>{item.title}</BoldText>
                                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brands2, alignItems: 'center', justifyContent: 'center' }}>
                                        <AntdMiniIcon name='RightOutline' color='white' size={18} />
                                    </View>
                                </View>
                            </BlurView>
                        </ImageBackground>
                    </TouchableHighlight>
                </View>
            </View>
        )}
        />
}
