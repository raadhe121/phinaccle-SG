import React, { useRef } from "react";
import { View, ActivityIndicator, useWindowDimensions } from "react-native";
import { BoldText } from "@/common/components/AntdText";
import { colors } from "@/common/utils/config";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";

interface GenericCarouselProps<T> {
  title: string;
  items: T[];
  loading?: boolean;
  renderItem: (item: T, width: number, height: number) => React.ReactNode;
  itemWidthRatio?: number;
  itemHeightRatio?: number;
  fixedHeight?: number;
  top?: number;
}

export default function GenericCarousel<T>({
  title,
  items,
  loading,
  renderItem,
  itemWidthRatio = 1,
  itemHeightRatio,
  fixedHeight,
  top = 0,
}: GenericCarouselProps<T>) {
  const { width } = useWindowDimensions();
  const imgWidth = width * itemWidthRatio - 24;
  const imgHeight =
    fixedHeight || (itemHeightRatio ? imgWidth * itemHeightRatio : 200);
  const ref = useRef<ICarouselInstance | null>(null);

  if (loading) {
    return (
      <View
        style={{
          height: imgHeight,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={{ marginTop: top }}>
      {title ? (
        <BoldText size={18} style={{ marginLeft: 12, marginBottom: 12 }}>
          {title}
        </BoldText>
      ) : null}
      {items.length == 1 ? (
        <View style={{ marginLeft: 12 }}>
          {renderItem(items[0], imgWidth, imgHeight)}
        </View>
      ) : (
        <Carousel
          ref={ref}
          width={imgWidth + 12}
          height={imgHeight}
          data={items}
          autoPlay={true}
          autoPlayInterval={3000}
          scrollAnimationDuration={1000}
          windowSize={3}
          style={{ width: width }}
          renderItem={({ item }) => (
            <View style={{ marginLeft: 12 }}>
              {renderItem(item, imgWidth, imgHeight)}
            </View>
          )}
        />
      )}
    </View>
  );
}
