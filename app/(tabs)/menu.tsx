import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function MenuPage() {
  const router = useRouter();

  const sportOptions = [
    {
      id: "cricket",
      title: "Cricket",
      description:
        "Book cricket grounds and organize matches with other teams.",
      icon: "cricket" as const,
      route: "/screens/cricketBooking" as const,
      color: "#2ecc71", // Green for cricket
    },
    {
      id: "football",
      title: "Football",
      description:
        "Reserve football grounds and set up matches with other teams.",
      icon: "soccer" as const,
      route: "/screens/footballBooking" as const,
      color: "#3498db", // Blue for football
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sports Booking</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Choose your sport</Text>

        {sportOptions.map((sport) => (
          <TouchableOpacity
            key={sport.id}
            style={[styles.card, { borderTopColor: sport.color }]}
            activeOpacity={0.9}
            onPress={() => router.push(sport.route)}
          >
            <View style={styles.cardContent}>
              <View
                style={[styles.iconContainer, { backgroundColor: sport.color }]}
              >
                <MaterialCommunityIcons
                  name={sport.icon}
                  size={40}
                  color="white"
                />
              </View>

              <View style={styles.cardDetails}>
                <Text style={styles.sportTitleText}>{sport.title}</Text>
                <Text style={styles.description}>{sport.description}</Text>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>Book Now</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color="white"
                    style={styles.buttonIcon}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Add extra space at bottom for tab bar */}
        <View style={{ height: 70 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    elevation: 1,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333333",
    marginTop: 8,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderTopWidth: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardDetails: {
    flex: 1,
  },
  sportTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#666666",
    marginBottom: 16,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  buttonIcon: {
    marginTop: 1,
  },
});
