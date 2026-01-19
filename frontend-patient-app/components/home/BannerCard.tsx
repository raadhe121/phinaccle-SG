import React from "react";
import { View, TouchableHighlight, Linking } from "react-native";
import { ImageBackground } from "expo-image";
import { BlurView } from "expo-blur";
import { BoldText } from "@/common/components/AntdText";
import { colors } from "@/common/utils/config";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { BannerItem } from "@/services/client";

interface BannerCardProps {
  width: number;
  height: number;
  item: BannerItem;
  onPress?: () => void;
}

export default function BannerCard({
  width,
  height,
  item,
  onPress,
}: BannerCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (item.url) {
      Linking.openURL(item.url);
    }
  };

  return (
    <View style={{ width }}>
      <TouchableHighlight
        underlayColor={colors.underlay}
        onPress={handlePress}
        style={{ borderRadius: 16, overflow: "hidden" }}
      >
        <ImageBackground
          source={{ uri: item.imageUrl }}
          style={{
            width: "100%",
            height,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flex: 1,
                alignItems: "flex-start",
                marginVertical: 16,
                marginHorizontal: 20,
              }}
            >
              {item.headerTag && (
                <View
                  style={{
                    backgroundColor: colors.brands2,
                    paddingHorizontal: 4,
                    borderRadius: 4,
                  }}
                >
                  <BoldText size={9} style={{ color: "white" }}>
                    {item.headerTag ?? "Sponsored"}
                  </BoldText>
                </View>
              )}
              <BoldText size={22} numberOfLines={3} style={{ color: "white" }}>
                {item.title}
              </BoldText>
            </View>

            {item.actionText && (
              <View
                style={{
                  alignItems: "flex-end",
                  marginRight: 12,
                  marginBottom: 6,
                }}
              >
                <BlurView
                  intensity={30}
                  style={{
                    backgroundColor: "#05213519",
                    borderRadius: 20,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      gap: 10,
                    }}
                  >
                    <BoldText size={11} style={{ color: "white" }}>
                      {item.actionText}
                    </BoldText>
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 10,
                        backgroundColor: colors.brands2,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AntdMiniIcon
                        name="RightOutline"
                        color="white"
                        size={8}
                      />
                    </View>
                  </View>
                </BlurView>
              </View>
            )}
          </View>
        </ImageBackground>
      </TouchableHighlight>
    </View>
  );
}
