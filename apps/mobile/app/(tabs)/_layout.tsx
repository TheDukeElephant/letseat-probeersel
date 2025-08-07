import { Tabs } from "expo-router";
import { Image, Text, View } from "react-native";
import cn from "clsx";
import { images } from "@/constants";
import { TabBarIconProps } from "../../types/type";

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
  <View className="w-full items-center">
    <Image
      source={icon}
      className="w-8 h-8"
      resizeMode="contain"
      tintColor={focused ? "#077bef" : "#5D5F6D"}
    />
    <Text
      numberOfLines={1}
      ellipsizeMode="clip"
      className={cn(
        "mt-1 text-sm font-semibold",
        focused ? "text-primary" : "text-gray-400"
      )}
      // wajoooo tering heb lang over gedaan dat je gewoon meer dan 100% width kan geven
      // dit is echt zo'n kut bug in react native dat je moet weten om niet tot 3 uur in de nacht te debuggen
      style={{ width: "150%", textAlign: "center", includeFontPadding: false }}
    >
      {title}
    </Text>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // we render our own label
        tabBarItemStyle: { flex: 1, minWidth: 0, paddingVertical: 20, paddingHorizontal: 0 },
        tabBarStyle: {
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          borderBottomLeftRadius: 50,
          borderBottomRightRadius: 50,
          marginHorizontal: 20,
          height: 80,
          position: "absolute",
          bottom: 40,
          backgroundColor: "white",
          shadowColor: "#1a1a1a",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
          paddingHorizontal: 10, // reduce inner whitespace so labels can use the width
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Create" icon={images.home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="join"
        options={{
          title: "Join",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Join" icon={images.search} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Groups" icon={images.bag} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Profile" icon={images.person} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
