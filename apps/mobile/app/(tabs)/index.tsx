import { SafeAreaView, Image, Pressable, View, Text, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { offers } from "@/constants/index";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import { Fragment, useState, useMemo } from "react";

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
        <View className="pl-2">
          <Text className="text-xs text-gray-500">Mijn balans</Text>
          <Text className="font-semibold text-sm">€ 1,55</Text>
        </View>
      </View>
      <View className="pr-4 flex-row space-x-7">
        {/* Chat icon with badge */}
        <View>
          <Ionicons name="chatbubble-ellipses-outline" size={22} />
          <View className="absolute -top-1 -right-2 bg-blue-600 rounded-full w-4 h-4 items-center justify-center">
            <Text className="text-[10px] text-white font-semibold">3</Text>
          </View>
        </View>
        {/* Bell icon with badge */}
        <View className="pl-4">
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
    <View className="px-4 mb-6 pt-4">
      <View className="flex-row items-center justify-between">

        <Text className="text-lg px-2 font-bold mb-3">Order details</Text>

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
      </View>

      {/* Date row */}
      <TouchableOpacity className="flex-row justify-between items-center bg-white rounded-xl p-4 mb-2 mx-1 shadow-sm">
        <View className="flex-row items-center space-x-3">
          <Ionicons name="calendar-outline" size={18} color="#6b7280" />
          <Text className="text-sm">Delivery date</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#9ca3af" />
      </TouchableOpacity>

      {/* Address row */}
      <TouchableOpacity className="flex-row justify-between items-center bg-white rounded-xl p-4 mx-1 shadow-sm">
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
  // Define your non-linear steps
  const BUCKETS = [
    { label: "1–2",   range: [1, 2] },
    { label: "3–5",   range: [3, 5] },
    { label: "5–10",  range: [5, 10] },
    { label: "10–20", range: [10, 20] },
    { label: "20–30", range: [20, 30] },
    { label: "30–50", range: [30, 50] },
    { label: "50–100", range: [50, 100] },
    { label: "100+", range: [100, Infinity] },
  ] as const;

  const START_INDEX = 1; // e.g. "5–10" as the starting value

  function GroupSize() {
    const [idx, setIdx] = useState(START_INDEX);
    const current = BUCKETS[idx];

    // If you also want a single number (e.g., midpoint) for logic:
    const groupSize = useMemo(
      () => Math.round((current.range[0] + current.range[1]) / 2),
      [current]
    );

    return (
      <View className="px-4 mb-6 bg-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold">Estimated group size</Text>
          <Text className="self-center mt-2 text-base font-bold font-medium">
            {current.label} {/* or show {groupSize} if you prefer a single number */}
          </Text>
        </View>

        <Text className="text-xs text-gray-500 mb-2">
          Discounts will be determined by the final group size.
        </Text>

        <View className="rounded-xl p-1 items-center shadow-sm">
          <Slider
            style={{ width: "95%", height: 40 }}
            minimumValue={0}
            maximumValue={BUCKETS.length - 1}
            step={1}
            value={START_INDEX} // starting bucket
            onValueChange={(v) => setIdx(Math.round(v))}
            onSlidingComplete={(v) => {
              const i = Math.round(v);
              const sel = BUCKETS[i];
              // e.g., save sel.range or midpoint here
              // saveGroupSize({ label: sel.label, range: sel.range, midpoint: groupSize })
            }}
            minimumTrackTintColor="#1390cf"
            maximumTrackTintColor="#d9d9d9"
            // Optional extras (from the lib’s props you pasted):
            // renderStepNumber={true}
            // StepMarker={({ isSelected }) => <View style={{ width: 2, height: 8, opacity: isSelected ? 1 : 0.5, backgroundColor: 'black' }} />}
          />
        </View>
      </View>
    );
  }


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
    <SafeAreaView className="flex-1 bg-gray-100">
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
