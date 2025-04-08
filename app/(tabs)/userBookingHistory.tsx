import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/config/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BookingItem {
  id: string;
  date: string;
  timeSlot: string;
  groundType: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string | number;
}

export default function BookingHistoryScreen() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const insets = useSafeAreaInsets(); // Get safe area insets

  useEffect(() => {
    fetchUserBookings();
  }, [activeFilter]);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;

      if (!user || !user.email) {
        Alert.alert("Error", "User information not found");
        setLoading(false);
        return;
      }

      const bookingsRef = collection(db, "bookings");
      let q = query(bookingsRef, where("email", "==", user.email));

      const querySnapshot = await getDocs(q);

      let userBookings: BookingItem[] = [];

      querySnapshot.forEach((doc) => {
        userBookings.push({
          id: doc.id,
          ...doc.data(),
        } as BookingItem);
      });

      // Sort by date (newest first)
      userBookings.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      // Apply status filter if not "all"
      if (activeFilter !== "all") {
        userBookings = userBookings.filter(
          (booking) => booking.status === activeFilter
        );
      }

      setBookings(userBookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      Alert.alert("Error", "Failed to load booking history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#4caf50";
      case "rejected":
        return "#f44336";
      default:
        return "#ffc107";
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(status) },
        ]}
      >
        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  const renderBookingItem = ({ item }: { item: BookingItem }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.groundType}>{item.groundType}</Text>
        {getStatusBadge(item.status)}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{formatDate(item.date)}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{item.timeSlot}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusInfo}>
          <Text style={styles.statusMessage}>
            {item.status === "approved"
              ? "Your booking is confirmed! See you there."
              : item.status === "rejected"
              ? "Sorry, this booking was not available."
              : "Your booking is pending approval."}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerTitle: "Booking History",
          headerStyle: {
            backgroundColor: "#f8f8f8",
          },
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.container, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "all" && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "all" && styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "pending" && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter("pending")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "pending" && styles.activeFilterText,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "approved" && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter("approved")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "approved" && styles.activeFilterText,
              ]}
            >
              Approved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "rejected" && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter("rejected")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "rejected" && styles.activeFilterText,
              ]}
            >
              Rejected
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.loadingText}>Loading your bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Bookings Found</Text>
            <Text style={styles.emptyStateText}>
              {activeFilter === "all"
                ? "You haven't made any bookings yet."
                : `You don't have any ${activeFilter} bookings.`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    padding: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activeFilter: {
    backgroundColor: Colors.light.tint,
  },
  filterText: {
    fontWeight: "500",
    color: "#333",
    fontSize: 13,
  },
  activeFilterText: {
    color: "#fff",
  },
  listContainer: {
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  groundType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  statusInfo: {
    marginTop: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
