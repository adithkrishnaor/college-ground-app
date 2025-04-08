import { Stack, Tabs, router, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { HapticTab } from "@/components/HapticTab";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StyleSheet, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Octicons from "@expo/vector-icons/Octicons";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/FirebaseConfig";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const tintColor = Colors[colorScheme ?? "light"].tint;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      // Only redirect if not authenticated and we've checked auth status
      if (user === null) {
        router.replace("/(auth)/login");
      }
    });

    return unsubscribe;
  }, [router]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return null;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: "#888",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                borderTopWidth: 1,
                borderTopColor: isDark ? "#333" : "#f0f0f0",
              },
            ]}
          />
        ),
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginBottom: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Entypo
              name="home"
              size={24}
              color={focused ? tintColor : "#888"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: "Book",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6
              name="check-to-slot"
              size={22}
              color={focused ? tintColor : "#888"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="userBookingHistory"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, focused }) => (
            <Octicons
              name="history"
              size={24}
              color={focused ? tintColor : "#888"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="user"
              size={24}
              color={focused ? tintColor : "#888"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
