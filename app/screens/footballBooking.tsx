import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { getAuth } from "firebase/auth";
import { Calendar } from "react-native-calendars";

// Update the BookingSlot interface to match Firestore data
interface BookingSlot {
  id: string;
  timeSlot: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  groundType: string;
  name: string;
  email: string;
  phone: string;
  userId?: string; // Add userId field
}

// Custom format for display
const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`; // Returns "31-01-2024"
};

// Format date for comparison (only date part without time)
const formatDateForComparison = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format date for calendar marking (YYYY-MM-DD)
const formatDateForCalendar = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function footballBooking() {
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(Date.now() + 86400000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [bookedDates, setBookedDates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [pendingDates, setPendingDates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [allBookingsData, setAllBookingsData] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Define time slots including the full day option
  const timeSlots = [
    "07:00 AM - 10:00 AM",
    "10:00 AM - 01:00 PM",
    "02:00 PM - 05:00 PM",
  ];

  // Define full day time slot
  const fullDaySlot = "08:00 AM - 05:00 PM (Full Day)";

  const groundType = "football";

  // Check authentication status before loading
  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser) {
      // If not logged in, redirect to login
      Alert.alert(
        "Authentication Required",
        "Please log in to view and make bookings.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
    } else {
      // Load booking slots if authenticated
      fetchAllBookings();
    }
  }, []);

  // Clear selected slot when date changes
  useEffect(() => {
    setSelectedSlot(null);
    fetchBookingSlots();
  }, [selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleContinue = () => {
    if (selectedDate && selectedSlot) {
      // Navigate to user details page with selected date and time
      router.push({
        pathname: "/screens/userDetails",
        params: {
          date: selectedDate.toISOString(),
          timeSlot: selectedSlot,
          groundType: groundType,
        },
      });
    }
  };

  // Fetch all bookings to mark calendar
  const fetchAllBookings = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      setFetchError("You must be logged in to view bookings");
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);

      // Get all bookings for the specific ground type
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("groundType", "==", groundType));
      const querySnapshot = await getDocs(q);

      // Track all bookings for calendar marking
      const allBookings: BookingSlot[] = [];
      const bookedDateMap: { [key: string]: string[] } = {};
      const pendingDateMap: { [key: string]: string[] } = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<BookingSlot, "id">;
        const booking = { id: doc.id, ...data };
        allBookings.push(booking);

        const bookingDate = new Date(booking.date);
        const dateStr = formatDateForCalendar(bookingDate);

        // Track approved bookings
        if (booking.status === "approved") {
          if (!bookedDateMap[dateStr]) {
            bookedDateMap[dateStr] = [];
          }
          bookedDateMap[dateStr].push(booking.timeSlot);
        }

        // Track pending bookings separately
        if (booking.status === "pending") {
          if (!pendingDateMap[dateStr]) {
            pendingDateMap[dateStr] = [];
          }
          pendingDateMap[dateStr].push(booking.timeSlot);
        }
      });

      // Store all bookings data
      setAllBookingsData(allBookings);

      // Find fully booked dates (all slots taken with approved bookings)
      const fullyBookedDates: { [key: string]: boolean } = {};
      Object.keys(bookedDateMap).forEach((dateStr) => {
        // If full day slot is booked or all regular slots are booked
        const uniqueBookedSlots = [...new Set(bookedDateMap[dateStr])];
        if (
          uniqueBookedSlots.includes(fullDaySlot) ||
          timeSlots.every((slot) => uniqueBookedSlots.includes(slot))
        ) {
          fullyBookedDates[dateStr] = true;
        }
      });

      // Find dates with pending bookings
      const datesWithPending: { [key: string]: boolean } = {};
      Object.keys(pendingDateMap).forEach((dateStr) => {
        // Only mark as pending if not already fully booked
        if (!fullyBookedDates[dateStr]) {
          datesWithPending[dateStr] = true;
        }
      });

      setBookedDates(fullyBookedDates);
      setPendingDates(datesWithPending);

      // Filter bookings for the selected date
      fetchBookingSlots();
    } catch (error: any) {
      console.error("Error fetching all bookings:", error);
      setFetchError("Failed to load booking information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Improved fetchBookingSlots function that filters from cached data
  const fetchBookingSlots = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      setFetchError("You must be logged in to view bookings");
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);

      // Format the selected date for comparison
      const selectedDateStr = formatDateForComparison(selectedDate);

      // If we already have all bookings data, filter from it
      if (allBookingsData.length > 0) {
        // Filter bookings for the selected date
        const slots = allBookingsData.filter((booking) => {
          const bookingDate = new Date(booking.date);
          const bookingDateStr = formatDateForComparison(bookingDate);
          return bookingDateStr === selectedDateStr;
        });

        setBookingSlots(slots);
        setIsLoading(false);
        return;
      }

      // If no cached data, fetch from Firestore
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("groundType", "==", groundType));

      const querySnapshot = await getDocs(q);
      const slots: BookingSlot[] = [];

      // Filter bookings for the selected date manually
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<BookingSlot, "id">;

        // Extract and compare only the date part
        const bookingDate = new Date(data.date);
        const bookingDateStr = formatDateForComparison(bookingDate);

        // Add only bookings that match the selected date
        if (bookingDateStr === selectedDateStr) {
          slots.push({
            id: doc.id,
            ...data,
          });
        }
      });

      setBookingSlots(slots);
    } catch (error: any) {
      console.error("Error fetching slots:", error);
      setFetchError("Failed to load booking information. Please try again.");
      setBookingSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate marked dates for calendar
  const getMarkedDates = () => {
    const markedDates: any = {};

    // Mark fully booked dates in red (as circles)
    Object.keys(bookedDates).forEach((dateStr) => {
      markedDates[dateStr] = {
        selected: false,
        marked: false,
        disabled: false,
        disableTouchEvent: false,
        customStyles: {
          container: {
            backgroundColor: "rgba(255, 0, 0, 0.2)",
            borderRadius: 20,
          },
          text: {
            color: "black",
          },
        },
      };
    });

    // Mark pending dates in yellow (as circles)
    Object.keys(pendingDates).forEach((dateStr) => {
      // Don't override fully booked dates
      if (!markedDates[dateStr]) {
        markedDates[dateStr] = {
          selected: false,
          marked: false,
          disabled: false,
          disableTouchEvent: false,
          customStyles: {
            container: {
              backgroundColor: "rgba(255, 255, 0, 0.2)",
              borderRadius: 20,
            },
            text: {
              color: "black",
            },
          },
        };
      }
    });

    // Mark selected date (takes precedence)
    const selectedDateStr = formatDateForCalendar(selectedDate);
    markedDates[selectedDateStr] = {
      ...markedDates[selectedDateStr],
      selected: true,
      selectedColor: "#4caf50",
    };

    return markedDates;
  };

  // Function to check if any regular slot is booked or pending
  const isAnySlotUnavailable = (): boolean => {
    return timeSlots.some((slot) => {
      // Get bookings for this regular slot
      const slotBookings = bookingSlots.filter((b) => b.timeSlot === slot);

      // Check if any booking is approved or pending
      return slotBookings.some(
        (booking) =>
          booking.status === "approved" || booking.status === "pending"
      );
    });
  };

  // Function to check if the full day slot is booked or pending
  const isFullDayUnavailable = (): boolean => {
    const fullDayBookings = bookingSlots.filter(
      (b) => b.timeSlot === fullDaySlot
    );

    if (fullDayBookings.length === 0) {
      return false;
    }

    return fullDayBookings.some(
      (booking) => booking.status === "approved" || booking.status === "pending"
    );
  };

  // Function to get the full day booking status if it exists
  const getFullDayStatus = (): "approved" | "pending" | "available" => {
    const fullDayBookings = bookingSlots.filter(
      (b) => b.timeSlot === fullDaySlot
    );

    if (fullDayBookings.length === 0) {
      return "available";
    }

    if (fullDayBookings.some((booking) => booking.status === "approved")) {
      return "approved";
    }

    if (fullDayBookings.some((booking) => booking.status === "pending")) {
      return "pending";
    }

    return "available";
  };

  // Function to check if a slot is available
  const isSlotAvailable = (slot: string): boolean => {
    // If the full day slot is booked or pending, no regular slots are available
    if (slot !== fullDaySlot && isFullDayUnavailable()) {
      return false;
    }

    // If this is the full day slot and any regular slots are unavailable,
    // the full day slot is not available
    if (slot === fullDaySlot && isAnySlotUnavailable()) {
      return false;
    }

    // Get all bookings for this specific slot
    const slotBookings = bookingSlots.filter((b) => b.timeSlot === slot);

    // If there are no bookings, the slot is available
    if (slotBookings.length === 0) {
      return true;
    }

    // If any booking is approved or pending, the slot is NOT available
    const hasApprovedOrPending = slotBookings.some(
      (booking) => booking.status === "approved" || booking.status === "pending"
    );

    return !hasApprovedOrPending;
  };

  // Function to get the appropriate style for each slot
  const getSlotStyle = (slot: string) => {
    // For regular slots, if full day is booked or pending
    if (slot !== fullDaySlot && isFullDayUnavailable()) {
      const fullDayStatus = getFullDayStatus();
      if (fullDayStatus === "approved") {
        return [styles.slot, styles.bookedSlot];
      } else if (fullDayStatus === "pending") {
        return [styles.slot, styles.pendingSlot];
      }
    }

    // For the full day slot
    if (slot === fullDaySlot) {
      // Check if there are any individual slots booked
      if (isAnySlotUnavailable()) {
        return [styles.slot, styles.bookedSlot];
      }

      // Check the status of full day bookings
      const fullDayBookings = bookingSlots.filter(
        (b) => b.timeSlot === fullDaySlot
      );

      if (fullDayBookings.some((booking) => booking.status === "approved")) {
        return [styles.slot, styles.bookedSlot];
      }

      if (fullDayBookings.some((booking) => booking.status === "pending")) {
        return [styles.slot, styles.pendingSlot];
      }
    }

    // For regular slots
    const slotBookings = bookingSlots.filter((b) => b.timeSlot === slot);

    // Default slot style (available)
    let slotStyle = [styles.slot];

    // If there are no bookings, return the default style (available)
    if (slotBookings.length === 0) {
      return slotStyle;
    }

    // Check for approved and pending bookings with priority on approved
    const hasApproved = slotBookings.some(
      (booking) => booking.status === "approved"
    );
    const hasPending = slotBookings.some(
      (booking) => booking.status === "pending"
    );

    if (hasApproved) {
      return [...slotStyle, styles.bookedSlot];
    }

    if (hasPending) {
      return [...slotStyle, styles.pendingSlot];
    }

    // If all bookings are rejected, the slot is available (default style)
    return slotStyle;
  };

  // Function to get the text status for each slot
  const getSlotStatusText = (slot: string): string => {
    // For regular slots, if full day is booked or pending
    if (slot !== fullDaySlot && isFullDayUnavailable()) {
      const fullDayStatus = getFullDayStatus();
      if (fullDayStatus === "approved") {
        return "Booked (Full Day)";
      } else if (fullDayStatus === "pending") {
        return "Pending (Full Day)";
      }
    }

    // For full day slot
    if (slot === fullDaySlot) {
      // Check if there are any individual slots booked or pending
      if (isAnySlotUnavailable()) {
        // Determine if any slots are booked (approved) or just pending
        const approvedSlots = timeSlots.filter((timeSlot) => {
          const slotBookings = bookingSlots.filter(
            (b) => b.timeSlot === timeSlot
          );
          return slotBookings.some((booking) => booking.status === "approved");
        });

        const pendingSlots = timeSlots.filter((timeSlot) => {
          const slotBookings = bookingSlots.filter(
            (b) => b.timeSlot === timeSlot
          );
          return (
            slotBookings.some((booking) => booking.status === "pending") &&
            !slotBookings.some((booking) => booking.status === "approved")
          );
        });

        if (approvedSlots.length > 0) {
          return "Unavailable - Individual Slots Booked";
        } else if (pendingSlots.length > 0) {
          return "Unavailable - Individual Slots Pending";
        }
      }

      // Check the status of full day bookings
      const fullDayBookings = bookingSlots.filter(
        (b) => b.timeSlot === fullDaySlot
      );

      if (fullDayBookings.some((booking) => booking.status === "approved")) {
        return "Booked";
      }

      if (fullDayBookings.some((booking) => booking.status === "pending")) {
        return "Pending Approval";
      }

      return "Available";
    }

    // For regular slots
    const slotBookings = bookingSlots.filter((b) => b.timeSlot === slot);

    // If there are no bookings, it's available
    if (slotBookings.length === 0) {
      return "Available";
    }

    // Check for approved bookings first (highest priority)
    if (slotBookings.some((booking) => booking.status === "approved")) {
      return "Booked";
    }

    // Then check for pending bookings
    if (slotBookings.some((booking) => booking.status === "pending")) {
      return "Pending Approval";
    }

    // If all bookings are rejected, the slot is available
    return "Available";
  };

  // Show error component if there's a fetch error
  if (fetchError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{fetchError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAllBookings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerBackTitle: "Back",
          headerTransparent: true,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Book Your Football Slot</Text>

        <View style={styles.dateContainer}>
          {/* Custom Calendar Implementation */}
          <Calendar
            minDate={
              new Date(Date.now() + 86400000).toISOString().split("T")[0]
            }
            markedDates={getMarkedDates()}
            onDayPress={(day: {
              timestamp: number;
              dateString: string;
              day: number;
              month: number;
              year: number;
            }) => {
              handleDateChange(new Date(day.timestamp));
            }}
            markingType="custom"
            theme={{
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "500",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
              "stylesheet.calendar.header": {
                dayTextAtIndex0: {
                  color: "red",
                },
                dayTextAtIndex6: {
                  color: "red",
                },
              },
            }}
          />

          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendCircle,
                  { backgroundColor: "rgba(255, 0, 0, 0.2)" },
                ]}
              />
              <Text style={styles.legendText}>Fully Booked</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendCircle,
                  { backgroundColor: "rgba(255, 255, 0, 0.2)" },
                ]}
              />
              <Text style={styles.legendText}>Pending Booking</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendCircle, { backgroundColor: "#4caf50" }]}
              />
              <Text style={styles.legendText}>Selected Date</Text>
            </View>
          </View>

          <Text style={styles.selectedDateText}>
            Selected Date: {formatDate(selectedDate)}
          </Text>
        </View>

        {/* <Text style={styles.subtitle}>Select Time Slot:</Text> */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4caf50" />
            <Text style={styles.loadingText}>Loading available slots...</Text>
          </View>
        ) : (
          <ScrollView style={styles.slotsContainer}>
            {/* Full Day option at the top with same styling as other slots */}
            <TouchableOpacity
              key={fullDaySlot}
              style={[
                getSlotStyle(fullDaySlot),
                selectedSlot === fullDaySlot &&
                  isSlotAvailable(fullDaySlot) &&
                  styles.selectedSlot,
                styles.fullDaySlot,
              ]}
              onPress={() =>
                isSlotAvailable(fullDaySlot) && setSelectedSlot(fullDaySlot)
              }
              disabled={!isSlotAvailable(fullDaySlot)}
            >
              <Text
                style={[
                  styles.slotText,
                  selectedSlot === fullDaySlot &&
                    isSlotAvailable(fullDaySlot) &&
                    styles.selectedSlotText,
                  !isSlotAvailable(fullDaySlot) && styles.unavailableSlotText,
                  styles.fullDaySlotText,
                ]}
              >
                {fullDaySlot}
              </Text>
              <Text
                style={[
                  styles.statusText,
                  getSlotStatusText(fullDaySlot) === "Booked" &&
                    styles.bookedStatusText,
                  getSlotStatusText(fullDaySlot) === "Pending Approval" &&
                    styles.pendingStatusText,
                  getSlotStatusText(fullDaySlot) ===
                    "Unavailable - Individual Slots Booked" &&
                    styles.bookedStatusText,
                  getSlotStatusText(fullDaySlot) ===
                    "Unavailable - Individual Slots Pending" &&
                    styles.pendingStatusText,
                ]}
              >
                {getSlotStatusText(fullDaySlot)}
              </Text>
            </TouchableOpacity>

            {/* Display a divider */}
            <View style={styles.divider}>
              <Text style={styles.dividerText}>- OR -</Text>
            </View>

            {/* Grid layout for regular time slots */}
            <View style={styles.gridContainer}>
              {timeSlots.map((slot) => {
                const available = isSlotAvailable(slot);
                const slotStatus = getSlotStatusText(slot);

                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      getSlotStyle(slot),
                      selectedSlot === slot && available && styles.selectedSlot,
                      styles.gridSlot,
                    ]}
                    onPress={() => available && setSelectedSlot(slot)}
                    disabled={!available}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selectedSlot === slot &&
                          available &&
                          styles.selectedSlotText,
                        !available && styles.unavailableSlotText,
                      ]}
                    >
                      {slot}
                    </Text>
                    <Text
                      style={[
                        styles.statusText,
                        slotStatus === "Booked" && styles.bookedStatusText,
                        slotStatus === "Pending Approval" &&
                          styles.pendingStatusText,
                        slotStatus === "Booked (Full Day)" &&
                          styles.bookedStatusText,
                        slotStatus === "Pending (Full Day)" &&
                          styles.pendingStatusText,
                      ]}
                    >
                      {slotStatus}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedDate || !selectedSlot) && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedDate || !selectedSlot}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// Enhanced styles with additional elements for better UX
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingTop: 60, // Add padding to account for header
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  dateContainer: {
    marginBottom: 20,
  },
  slotsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  // Grid container for the 2x2 layout
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  // Style for grid items (approximately 48% width for 2 items per row)
  gridSlot: {
    width: "48%",
    height: 90, // Fixed height for uniformity
    marginBottom: 10,
  },
  // Full day slot takes full width
  fullDaySlot: {
    width: "100%",
    marginBottom: 10,
  },
  slot: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#e8f5e9", // Light green for available slots
    alignItems: "center",
    justifyContent: "center", // Center content vertically
    borderWidth: 1,
    borderColor: "#a5d6a7",
  },
  fullDaySlotText: {
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 10,
    alignItems: "center",
  },
  dividerText: {
    color: "#666",
    fontWeight: "500",
    marginVertical: 5,
  },
  selectedSlot: {
    backgroundColor: "#4caf50", // Darker green for selected
    borderColor: "#2e7d32",
  },
  slotText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  selectedSlotText: {
    color: "#fff",
    fontWeight: "bold",
  },
  continueButton: {
    backgroundColor: "#4A90E2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    position: "absolute",
    bottom: 15, // Distance from bottom of screen
    left: 16,
    right: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateButton: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginTop: 5,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  bookedSlot: {
    backgroundColor: "#ffcdd2", // Light red for booked slots
    borderColor: "#e57373",
    opacity: 1,
  },
  pendingSlot: {
    backgroundColor: "#fff9c4", // Light yellow for pending slots
    borderColor: "#fff176",
    opacity: 1,
  },
  unavailableSlotText: {
    color: "#b71c1c", // Darker red for unavailable text
  },
  statusText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
    textAlign: "center",
  },
  bookedStatusText: {
    color: "#b71c1c", // Dark red
    fontWeight: "bold",
  },
  pendingStatusText: {
    color: "#f57f17", // Dark yellow/orange
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    textAlign: "center",
    padding: 10,
    color: "#666",
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  // Calendar legend styles
  calendarLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  selectedDateText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    color: "#4caf50",
  },
});
