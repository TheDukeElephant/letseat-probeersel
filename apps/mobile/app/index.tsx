import { SafeAreaView, Image, Pressable, View, Text, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { offers } from "@/constants/index";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { Fragment, useState } from "react";

export default function Index() {
  // ────────────────────────────────────────────────────────────────────────────────
  // Local state
  // ────────────────────────────────────────────────────────────────────────────────
  const [orderType, setOrderType] = useState<"Delivery" | "Pickup">("Delivery");
  const [groupSize, setGroupSize] = useState<number[]>([25]);
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

  // ────────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────────
  const renderRestaurantCard = ({ item }: { item: (typeof offers)[0] }) => {
    const discountedPrice = (item.costs * (1 - item.discount / 100)).toFixed(2);

    return (
      <Pressable className="bg-white rounded-xl shadow-md mb-4 mx-4 overflow-hidden">
        {({ pressed }) => (
          <Fragment>
            {/* Image banner */}
            <View className="relative">
              <Image
                source={item.image}
                className="w-full h-40 rounded-xl"
                resizeMode="cover"
                style={{ backgroundColor: item.color }}
              />
              {/* Discount badge */}
              <View className="absolute top-2 right-2 bg-blue-600 px-2 py-1 rounded-lg">
                <Text className="text-white text-xs font-semibold">-{item.discount}%</Text>
              </View>
            </View>

            {/* Info section in 3 columns */}
            <View className="p-3">
              <View className="flex-row justify-between items-start">
                {/* Column 1: Title & Description */}
                <View className="flex-1 pr-2">
                  <Text className="text-lg font-semibold">{item.title}</Text>
                  <Text className="text-sm text-gray-500">{item.description}</Text>
                </View>

                {/* Column 2: Rating & Delivery */}
                <View className="items-end pr-2">
                  {/* Rating */}
                  <View className="flex-row items-center space-x-1">
                    <Ionicons name="star" size={14} color="#077bef" />
                    <Text className="text-sm font-medium">{item.rating.toFixed(1)}</Text>
                  </View>
                  {/* Delivery cost */}
                  <View className="flex-row items-center space-x-1 mt-1">
                    <MaterialCommunityIcons name="bike" size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-700">€{item.deliverycosts.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Column 3: Prices */}
                <View className="items-end">
                  <Text className="text-sm text-gray-400 line-through">From €{item.costs.toFixed(2)}</Text>
                  <Text className="text-sm font-medium pt-1">From €{discountedPrice}</Text>
                </View>
              </View>
            </View>
          </Fragment>
        )}
      </Pressable>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────────
  // Header component (avatar + balance + icons)
  // ────────────────────────────────────────────────────────────────────────────────
  const Header = () => (
    <View className="flex-row items-center justify-between px-4 mt-2 mb-4">
      <View className="flex-row items-center space-x-2">
        <Image
          source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
          className="w-9 h-9 rounded-full"
        />
        <View>
          <Text className="text-xs text-gray-500">Mijn balans</Text>
          <Text className="font-semibold text-sm">€ 1,55</Text>
        </View>
      </View>
      <View className="flex-row space-x-4">
        {/* Chat icon with badge */}
        <View>
          <Ionicons name="chatbubble-ellipses-outline" size={22} />
          <View className="absolute -top-1 -right-2 bg-blue-600 rounded-full w-4 h-4 items-center justify-center">
            <Text className="text-[10px] text-white font-semibold">3</Text>
          </View>
        </View>
        {/* Bell icon with badge */}
        <View>
          <Ionicons name="notifications-outline" size={22} />
          <View className="absolute -top-1 -right-2 bg-blue-600 rounded-full w-4 h-4 items-center justify-center">
            <Text className="text-[10px] text-white font-semibold">2</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ────────────────────────────────────────────────────────────────────────────────
  // Order Details section
  // ────────────────────────────────────────────────────────────────────────────────
  const OrderDetails = () => (
    <View className="px-4 mb-6">
      <Text className="text-lg font-semibold mb-3">Order details</Text>

      {/* Delivery/Pickup toggle */}
      <View className="flex-row bg-gray-100 p-1 rounded-full self-start mb-4">
        {(["Delivery", "Pickup"] as const).map((type) => {
          const isActive = orderType === type;
          return (
            <TouchableOpacity
              key={type}
              className={`px-4 py-1 rounded-full ${isActive ? "bg-blue-600" : ""}`}
              onPress={() => setOrderType(type)}
            >
              <Text className={`text-sm ${isActive ? "text-white" : "text-gray-700"}`}>{type}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date row */}
      <TouchableOpacity className="flex-row justify-between items-center bg-white rounded-xl p-4 mb-3 shadow-sm">
        <View className="flex-row items-center space-x-3">
          <Ionicons name="calendar-outline" size={18} color="#6b7280" />
          <Text className="text-sm">Delivery date</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#9ca3af" />
      </TouchableOpacity>

      {/* Address row */}
      <TouchableOpacity className="flex-row justify-between items-center bg-white rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center space-x-3">
          <Ionicons name="location-outline" size={18} color="#6b7280" />
          <Text className="text-sm">Van der Burghweg 2</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );

  // ────────────────────────────────────────────────────────────────────────────────
  // Group Size slider section
  // ────────────────────────────────────────────────────────────────────────────────
  //const enableScroll = () => setScrollEnabled(true);
  //const disableScroll = () => setScrollEnabled(false);

  const GroupSize = () => (
    <View className="px-4 mb-6">
      <Text className="text-lg font-semibold">Estimated group size</Text>
      <Text className="text-xs text-gray-500 mb-2">Discounts will be determined by the final group size.</Text>
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <MultiSlider
          values={groupSize}
          min={1}
          max={100}
          step={5}
          onValuesChange={setGroupSize}
          //onValuesChangeStart={disableScroll}
          //onValuesChangeFinish={enableScroll}
          selectedStyle={{
            backgroundColor: "#077bef",
          }}
          unselectedStyle={{
            backgroundColor: "#e5e7eb",
          }}
          trackStyle={{
            height: 4,
            borderRadius: 2,
          }}
          markerStyle={{
            backgroundColor: "#077bef",
            height: 20,
            width: 20,
            borderRadius: 10,
          }}
          sliderLength={280}
        />
        <Text className="self-center mt-2 text-sm font-medium">{groupSize[0]}</Text>
      </View>
    </View>
  );

  // ────────────────────────────────────────────────────────────────────────────────
  // Restaurants List Header
  // ────────────────────────────────────────────────────────────────────────────────
  const RestaurantListHeader = () => (
    <Text className="text-lg font-semibold px-4 mb-3">Available restaurants</Text>
  );

  // ────────────────────────────────────────────────────────────────────────────────
  // Main render
  // ────────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRestaurantCard}
        ListHeaderComponent={() => (
          <>
            <Header />
            <OrderDetails />
            <GroupSize />
            <RestaurantListHeader />
          </>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      />
    </SafeAreaView>
  );
}
