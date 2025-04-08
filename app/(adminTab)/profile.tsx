import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "@/config/FirebaseConfig";
import { signOut } from "firebase/auth";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FontAwesome5 } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  // Force light mode for white theme
  const isDark = false; // Previously: colorScheme === "dark"
  const tintColor = Colors[colorScheme ?? "light"].tint;

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get current user info
    const user = auth.currentUser;
    if (user) {
      // Fixed username display - get full name or email username if displayName is null
      const displayName =
        user.displayName || user.email?.split("@")[0] || "User";
      setUserName(displayName);
      setUserEmail(user.email || "");
    }
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToBookingHistory = () => {
    router.push("/(tabs)/userBookingHistory");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: "#f8f8f8" }, // Always light background
        ]}
      >
        <View style={styles.header}>
          <View
            style={[styles.avatarContainer, { backgroundColor: tintColor }]}
          >
            {userName ? (
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <FontAwesome5 name="user-alt" size={32} color="white" />
            )}
          </View>
          <Text style={[styles.userName, { color: "#000000" }]}>
            {userName}
          </Text>
          <Text style={[styles.userEmail, { color: "#666666" }]}>
            {userEmail}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: "#ffffff" }]}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <MaterialIcons
                name="settings"
                size={22}
                color={tintColor}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: "#000000" }]}>
                Settings
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999999" />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: "#ffffff" }]}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <MaterialIcons
                name="help-outline"
                size={22}
                color={tintColor}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: "#000000" }]}>
                Help & Support
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <MaterialIcons
                name="privacy-tip"
                size={22}
                color={tintColor}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: "#000000" }]}>
                Privacy Policy
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: "#f0f0f0" }]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={tintColor} />
          ) : (
            <Text style={[styles.logoutText, { color: "#ff3b30" }]}>
              Log Out
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  section: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
