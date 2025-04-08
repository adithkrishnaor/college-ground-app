import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import React, { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BookingSlot {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  groundType: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminReports() {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterType, setFilterType] = useState<"day" | "month" | "year">("day");
  const [reportData, setReportData] = useState({
    totalCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    cricketCount: 0,
    footballCount: 0,
  });

  useEffect(() => {
    fetchAllBookings();
  }, []);

  useEffect(() => {
    if (bookings.length > 0) {
      generateReportData();
    }
  }, [bookings, selectedDate, filterType]);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef);
      const querySnapshot = await getDocs(q);

      const fetchedBookings: BookingSlot[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() } as BookingSlot);
      });

      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = () => {
    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;
    let cricketCount = 0;
    let footballCount = 0;

    const filteredBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();

      if (filterType === "year") {
        return bookingDate.getFullYear() === selectedYear;
      } else if (filterType === "month") {
        return (
          bookingDate.getFullYear() === selectedYear &&
          bookingDate.getMonth() === selectedMonth
        );
      } else if (filterType === "day") {
        return (
          bookingDate.getFullYear() === selectedYear &&
          bookingDate.getMonth() === selectedMonth &&
          bookingDate.getDate() === selectedDay
        );
      }
      return false;
    });

    filteredBookings.forEach((booking) => {
      if (booking.status === "approved") {
        approvedCount++;
      } else if (booking.status === "rejected") {
        rejectedCount++;
      } else {
        pendingCount++;
      }

      if (booking.groundType?.toLowerCase() === "cricket") {
        cricketCount++;
      } else if (booking.groundType?.toLowerCase() === "football") {
        footballCount++;
      }
    });

    setReportData({
      totalCount: filteredBookings.length,
      approvedCount,
      rejectedCount,
      pendingCount,
      cricketCount,
      footballCount,
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top + 10, 50) },
        ]}
      >
        <Text style={styles.headerTitle}>Booking Reports</Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "day" && styles.activeFilter,
            ]}
            onPress={() => setFilterType("day")}
          >
            <Text
              style={[
                styles.filterText,
                filterType === "day" && styles.activeFilterText,
              ]}
            >
              Day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "month" && styles.activeFilter,
            ]}
            onPress={() => setFilterType("month")}
          >
            <Text
              style={[
                styles.filterText,
                filterType === "month" && styles.activeFilterText,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "year" && styles.activeFilter,
            ]}
            onPress={() => setFilterType("year")}
          >
            <Text
              style={[
                styles.filterText,
                filterType === "year" && styles.activeFilterText,
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerButtonText}>
            {filterType === "year"
              ? selectedDate.getFullYear()
              : filterType === "month"
              ? selectedDate.toLocaleString("default", { month: "long" }) +
                " " +
                selectedDate.getFullYear()
              : selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode={
              filterType === "year"
                ? "date"
                : filterType === "month"
                ? "date"
                : "date"
            }
            display="default"
            onChange={handleDateChange}
          />
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, styles.totalStat]}>
              <Text style={styles.statValue}>{reportData.totalCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statBox, styles.approvedStat]}>
              <Text style={styles.statValue}>{reportData.approvedCount}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={[styles.statBox, styles.rejectedStat]}>
              <Text style={styles.statValue}>{reportData.rejectedCount}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
            <View style={[styles.statBox, styles.pendingStat]}>
              <Text style={styles.statValue}>{reportData.pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statBox, styles.cricketStat]}>
              <Text style={styles.statValue}>{reportData.cricketCount}</Text>
              <Text style={styles.statLabel}>Cricket</Text>
            </View>
            <View style={[styles.statBox, styles.footballStat]}>
              <Text style={styles.statValue}>{reportData.footballCount}</Text>
              <Text style={styles.statLabel}>Football</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5,
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "#007AFF",
    borderColor: "#0056b3",
  },
  filterText: {
    fontWeight: "500",
    color: "#333",
  },
  activeFilterText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  datePickerButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerButtonText: {
    fontWeight: "500",
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    width: "48%",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  totalStat: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  approvedStat: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  rejectedStat: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  pendingStat: {
    backgroundColor: "#fffde7",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  cricketStat: {
    backgroundColor: "#e0f7fa",
    borderLeftWidth: 4,
    borderLeftColor: "#00bcd4",
  },
  footballStat: {
    backgroundColor: "#f3e5f5",
    borderLeftWidth: 4,
    borderLeftColor: "#9c27b0",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});
