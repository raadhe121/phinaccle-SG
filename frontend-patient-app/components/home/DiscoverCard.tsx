import React from "react";
import { View, TouchableHighlight, Linking } from "react-native";
import { Image } from "expo-image";
import { BoldText, CText } from "@/common/components/AntdText";
import { colors } from "@/common/utils/config";
import { Discover } from "@/services/client";

interface DiscoverCardProps {
  discover: Discover;
  onPress?: () => void;
}

export default function DiscoverCard({ discover, onPress }: DiscoverCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (discover.url) {
      Linking.openURL(discover.url);
    }
  };

  return (
    <View style={{ flex: 1, margin: 0 }}>
      <TouchableHighlight
        underlayColor={colors.underlay}
        onPress={handlePress}
        style={{ borderRadius: 16, overflow: "hidden" }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <View
            style={{
              width: "100%",
              aspectRatio: 1,
              backgroundColor: "#F8F9FA",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: discover.imageUrl }}
              style={{
                width: "100%",
                height: "100%",
              }}
              contentFit="cover"
            />
          </View>

          <View style={{ padding: 12 }}>
            {discover.subtitle && (
              <CText size={12} style={{ color: "#666", marginBottom: 2 }}>
                {discover.subtitle}
              </CText>
            )}
            {discover.title && (
              <BoldText size={13} numberOfLines={2} style={{ color: "#333" }}>
                {discover.title}
              </BoldText>
            )}
            {discover.price && (
              <CText size={12} style={{ color: "#666", marginTop: 2 }}>
                {discover.price}
              </CText>
            )}
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}
