import { BoldText, Height, TabBarPadding } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { router } from "expo-router";
import {
  TouchableHighlight,
  View,
  ImageBackground,
  useWindowDimensions,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useSession } from "@/ctx";
import { colors, tabBarHeight, tagColorMapping } from "@/common/utils/config";
import { modal } from "@/common/utils/modal";
import {
  appointmentIcon,
  consultIcon,
  queueIcon,
  reportsIcon,
  marketplaceIcon,
  corporateIcon,
  bgImages,
  ImageRef,
  myfamilyIcon,
  healthReportsIcon,
  healthScreeningCentreIcon,
  imagingCentreIcon,
  specialistIcon,
} from "@/common/components/AntdMiniIcon";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityRow } from "../walkin/consultation";
import { useQuery } from "@tanstack/react-query";
import React, { useRef } from "react";
import { useRealtime } from "@/providers/realtime";
import { Banners, Discover, getBannersApiSupportBannersGet } from "@/services/client";
import { useLaunchActivity } from "@/hooks/useLaunchActivity";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import GenericCarousel from "@/components/home/GenericCarousel";
import BannerCard from "@/components/home/BannerCard";
import DiscoverCard from "@/components/home/DiscoverCard";

// TODO: Configure the actual branch IDs for each service centre
const HEALTH_SCREENING_CENTRE_BRANCH_IDS = ['ca884123-a06c-4514-a8fd-ccd289d34bd6'];
const IMAGING_CENTRE_BRANCH_IDS = ['b15d33ee-547e-4d9c-81e6-6ed436804b79'];

// Defaults loaded before query is completed
const banners: Banners = {
  topSlider: [
    {
      title: "Vaccination",
      imageUrl:
        "https://yaadelemrtuxfyxayxpu.supabase.co/storage/v1/object/public/uploads/home_banners/vaccinations.jpg",
      imageRatio: 0.55,
      url: "pinnaclesgplus://browser?url=https://pinnaclefamilyclinic.com.sg/medical-services/vaccinations/",
      actionText: "Read",
    },
    {
      title: "Telemedicine",
      imageUrl:
        "https://yaadelemrtuxfyxayxpu.supabase.co/storage/v1/object/public/uploads/home_banners/telemedicine.jpg",
      imageRatio: 0.55,
      url: "pinnaclesgplus://browser?url=https://pinnaclefamilyclinic.com.sg/telemedicine/",
      actionText: "Read",
    },
    {
      title: "Health Screening",
      imageUrl:
        "https://yaadelemrtuxfyxayxpu.supabase.co/storage/v1/object/public/uploads/home_banners/healthscreening.jpg",
      imageRatio: 0.55,
      url: "pinnaclesgplus://browser?url=https://pinnaclefamilyclinic.com.sg/medical-services/health-screening/",
      actionText: "Read",
    },
    {
      title: "Healthier SG",
      imageUrl:
        "https://yaadelemrtuxfyxayxpu.supabase.co/storage/v1/object/public/uploads/home_banners/healthiersg.jpg",
      imageRatio: 0.55,
      url: "pinnaclesgplus://browser?url=https://pinnaclefamilyclinic.com.sg/healthier-sg/",
      actionText: "Read",
    },
  ],
  highlights: [],
  discover: [],
};

function NavItem({
  onPress,
  icon,
  title,
  opacity = 1.0,
}: {
  onPress: () => void;
  icon: any;
  title: string;
  opacity?: number;
}) {
  return (
    <View style={{ flex: 1, flexGrow: 1, borderRadius: 12, opacity }}>
      <TouchableHighlight underlayColor={colors.underlay} onPress={onPress}>
        <View
          style={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            margin: 8,
            marginHorizontal: 0,
          }}
        >
          <Image
            source={icon}
            resizeMode="contain"
            style={{ width: 36, height: 36 }}
          />
          <BoldText size={12} style={{ marginTop: 6, textAlign: "center" }}>
            {title}
          </BoldText>
        </View>
      </TouchableHighlight>
    </View>
  );
}

const showFeatureNotLaunchedDialog = () => {
  modal.warn({
    title: "Feature Unavailable",
    content: "This feature is not yet available. Please check back later.",
    labels: ["OK"],
    onCancel: () => {},
  });
};

type ServiceItem = {
  title: string;
  icon: any;
  onPress: () => void;
  opacity?: number;
};

// Component to render a page of 8 service items in 4x2 grid
function ServicePage({ items }: { items: ServiceItem[] }) {
  return (
    <View style={{ marginHorizontal: 12 }}>
      <View style={{ flexDirection: "row" }}>
        {items.slice(0, 4).map((item, index) => (
          <NavItem
            key={index}
            onPress={item.onPress}
            title={item.title}
            icon={item.icon}
            opacity={item.opacity}
          />
        ))}
        {items.length < 4 && (
          Array.from({ length: 4 - items.length }).map((_, i) => (
            <View key={`empty-top-${i}`} style={{ flex: 1 }} />
          ))
        )}
      </View>
      <View style={{ flexDirection: "row" }}>
        {items.slice(4, 8).map((item, index) => (
          <NavItem
            key={index + 4}
            onPress={item.onPress}
            title={item.title}
            icon={item.icon}
            opacity={item.opacity}
          />
        ))}
        {items.length < 8 && (
          Array.from({ length: 8 - items.length }).map((_, i) => (
            <View key={`empty-bottom-${i}`} style={{ flex: 1 }} />
          ))
        )}
      </View>
    </View>
  );
}

const getGreeting = () => {
  // Generate "Good Morning", "Good Afternoon", "Good Evening" based on current time
  const date = new Date();
  const hours = date.getHours();
  if (hours < 12) {
    return "Good Morning";
  } else if (hours < 18) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
};

// Carousel component for swipeable service pages with page indicator
function ServicesCarousel({
  flags,
  launchActivity,
}: {
  flags: string[];
  launchActivity: (activity: string) => void;
}) {
  const { width } = useWindowDimensions();
  const carouselRef = useRef<ICarouselInstance | null>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  // Define all service items
  const allServices: ServiceItem[] = [
    // Page 1 - Main Service Centers
    {
      title: `Book\nTelemedicine`,
      icon: consultIcon,
      onPress: () => launchActivity("teleconsult"),
      opacity: 1.0,
    },
    {
      title: `Queue\nRequest`,
      icon: queueIcon,
      onPress: () => launchActivity("walkin"),
      opacity: 1.0,
    },
    {
      title: `Book\nAppointment`,
      icon: appointmentIcon,
      onPress: () => router.navigate("/appointment"),
      opacity: flags.includes("appointment") ? 1.0 : 0.4,
    },
    {
      title: `Health\nReports`,
      icon: healthReportsIcon,
      onPress: () =>
        router.navigate({
          pathname: "/documents",
          params: { route: "/documents/health_report/list" },
        }),
      opacity: 1.0,
    },
    {
      title: `My\nRecords`,
      icon: reportsIcon,
      onPress: () =>
        router.navigate({
          pathname: "/documents",
          params: { route: "/documents/list" },
        }),
      opacity: 1.0,
    },
    {
      title: `Health\nScreening Centre`,
      icon: healthScreeningCentreIcon,
      onPress: () => router.navigate({
        pathname: "/appointment",
        params: { branch_ids: HEALTH_SCREENING_CENTRE_BRANCH_IDS.join(',') }
      }),
      opacity: flags.includes("appointment") ? 1.0 : 0.4,
    },
    {
      title: `Imaging\nCentre`,
      icon: imagingCentreIcon,
      onPress: () => router.navigate({
        pathname: "/appointment",
        params: { branch_ids: IMAGING_CENTRE_BRANCH_IDS.join(',') }
      }),
      opacity: flags.includes("appointment") ? 1.0 : 0.4,
    },
    {
      title: `Specialist\nCare`,
      icon: specialistIcon,
      onPress: showFeatureNotLaunchedDialog,
      opacity: 0.4,
    },
    // Page 2 - Quick Services

    {
      title: `My\nFamily`,
      icon: myfamilyIcon,
      onPress: () => router.navigate("/family"),
      opacity: 1.0,
    },
    {
      title: `Corporate\nProgram`,
      icon: corporateIcon,
      onPress: showFeatureNotLaunchedDialog,
      opacity: 0.4,
    },
    {
      title: `Health\nMarketplace`,
      icon: marketplaceIcon,
      onPress: showFeatureNotLaunchedDialog,
      opacity: 0.4,
    },
  ];

  // Split services into pages of 8 items each
  const pages: ServiceItem[][] = [];
  for (let i = 0; i < allServices.length; i += 8) {
    pages.push(allServices.slice(i, i + 8));
  }

  return (
    <View>
      <Carousel
        ref={carouselRef}
        width={width}
        height={200}
        data={pages}
        scrollAnimationDuration={300}
        onProgressChange={(_, absoluteProgress) => {
          setScrollProgress(absoluteProgress);
        }}
        renderItem={({ item }) => <ServicePage items={item} />}
        pagingEnabled={true}
        snapEnabled={true}
      />
      {/* Page Indicator */}
      {pages.length > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 8,
            gap: 6,
          }}
        >
          {pages.map((_, index) => {
            // Simple on/off logic: calculate active page with modulo for looping
            const backgroundColor = (Math.round(scrollProgress) % pages.length === index) ? colors.primary : colors.light;

            return (
              <View
                key={index}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor,
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { activity } = useRealtime();
  const { launchActivity } = useLaunchActivity();
  const flags = useFeatureFlags();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const bgImg = bgImages.IndexFrame;
  const bgHeight = (width * bgImg.height) / bgImg.width;

  // State to store measured height of promotion cards
  const [discoverBannerHeight, setDiscoverBannerHeight] = React.useState<
    number | undefined
  >(undefined);

  const rq = useQuery({
    queryKey: ['banners'],
    queryFn: getBannersApiSupportBannersGet,
  })

  return (
    <>
      <KeyboardView edges={[]} bottom={64}>
        <ImageBackground
          source={bgImg.uri}
          resizeMode="stretch"
          style={{ position: "absolute", top: -200 }}
        >
          <View style={{ width, height: bgHeight }} />
        </ImageBackground>

        <View style={{ height: insets.top }}></View>
        <View className="my-1 items-center">
          <ImageRef src="HeaderLogo" width={150} />
        </View>

        {/* Primary Carousel */}
        <GenericCarousel
          title={`${getGreeting()}, ${user?.displayName}`}
          items={rq.data?.topSlider ?? banners.topSlider}
          loading={rq.isLoading}
          itemHeightRatio={0.5}
          renderItem={(item, width, height) => (
            <BannerCard
              width={width}
              height={height}
              item={item}
              onPress={() => Linking.openURL(item.url)}
            />
          )}
        />

        {/* Clinic Services - Swipeable Pages */}
        <BoldText
          size={18}
          style={{ marginLeft: 12, marginTop: 18, marginBottom: 6 }}
        >
          Clinic Services
        </BoldText>
        <ServicesCarousel flags={flags} launchActivity={launchActivity} />

        {/* Highlights Section */}
        <GenericCarousel
          top={18}
          title="Highlights"
          items={rq.data?.highlights ?? banners.highlights}
          loading={rq.isLoading}
          itemHeightRatio={0.5}
          renderItem={(item, width, height) => (
            <BannerCard
              width={width}
              height={height}
              item={item}
              onPress={() => Linking.openURL(item.url)}
            />
          )}
        />

        {/* Discover Section */}
        <GenericCarousel
          top={18}
          title="Discover"
          items={(rq.data?.discover ?? banners.discover).reduce(
            (acc, item, index) => {
              if (index % 2 === 0) {
                acc.push([item]);
              } else {
                acc[acc.length - 1].push(item);
              }
              return acc;
            },
            [] as Discover[][],
          )}
          loading={rq.isLoading}
          fixedHeight={discoverBannerHeight}
          itemHeightRatio={0.6}
          renderItem={(discoverPair) => (
            <View
              style={{ flexDirection: "row", gap: 12 }}
              onLayout={(event) => {
                // Measure the height on first render
                const { height } = event.nativeEvent.layout;
                if (!discoverBannerHeight || height > discoverBannerHeight) {
                  setDiscoverBannerHeight(height);
                }
              }}
            >
              {discoverPair.map((discover, index) => (
                <DiscoverCard
                  key={index}
                  discover={discover}
                  onPress={() => console.log("Promotion pressed:", discover)}
                />
              ))}
            </View>
          )}
        />

        {/* Pinnacle+ Marketplace Section */}
        {/* <MarketplaceGrid
        categories={mockMarketplaceCategories}
        onCategoryPress={(category) => console.log('Category pressed:', category.id)}
      /> */}

        {/* If there's activity +100px height */}
        <Height h={12 + (activity ? 100 : 0)} />
        <TabBarPadding />
      </KeyboardView>
      <ActivityBanner />
    </>
  );
}

const ActivityBanner = () => {
  const { activity } = useRealtime();
  const insets = useSafeAreaInsets();

  if (!activity) return <></>;
  // if (activity.type === 'teleconsult' && activity.tag === 'Cancelled') return <></>;

  const tagColor = tagColorMapping[activity.tag] ?? colors.success;
  const onPress =
    {
      teleconsult: () => router.navigate("/teleconsult/consultation"),
      walkin: () => router.navigate("/walkin/consultation"),
      appointment: () => {},
    }[activity.type] ?? (() => {});

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + tabBarHeight,
        width: "100%",
      }}
    >
      <LinearGradient
        colors={["#99D6FF", "#0874BD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ margin: 12, borderRadius: 8 }}
      >
        <View
          style={{
            margin: 2,
            borderRadius: 6,
            backgroundColor: colors.brands4,
            overflow: "hidden",
          }}
        >
          <TouchableHighlight underlayColor={colors.light} onPress={onPress}>
            <ActivityRow
              type={activity.type}
              title={activity.title}
              content={activity.content}
              boldContent={activity.boldContent}
              tag={activity.tag}
            />
          </TouchableHighlight>
        </View>
      </LinearGradient>
    </View>
  );
};

const PinnacleCarousel = () => {


//   return (
//     <GenericCarousel
//       title=""
//       items={rq.data ?? []}
//       loading={rq.isLoading}
//       itemWidthRatio={1}
//       itemHeightRatio={0.6}
//       renderItem={(item, width, height) => (
//         <CarouselCard
//           width={width}
//           height={height}
//           item={item}
//           index={rq.data?.indexOf(item) ?? 0}
//         />
//       )}
//     />
//   );
}
