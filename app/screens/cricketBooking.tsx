import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Stack } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { getAuth } from "firebase/auth";
import { Calendar } from "react-native-calendars";

interface BookingSlot {
  id: string;
  timeSlot: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  groundType: string;
  name: string;
  email: string;
  phone: string;
  userId?: string;
}

const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateForComparison = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateForCalendar = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function cricketBooking() {
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

  const timeSlots = ["09:00 AM - 05:00 PM"];
  const groundType = "cricket";

  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser) {
      Alert.alert(
        "Authentication Required",
        "Please log in to view and make bookings.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
    } else {
      fetchAllBookings();
    }
  }, []);

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
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("groundType", "==", groundType));
      const querySnapshot = await getDocs(q);

      const allBookings: BookingSlot[] = [];
      const bookedDateMap: { [key: string]: string[] } = {};
      const pendingDateMap: { [key: string]: string[] } = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<BookingSlot, "id">;
        const booking = { id: doc.id, ...data };
        allBookings.push(booking);

        const bookingDate = new Date(booking.date);
        const dateStr = formatDateForCalendar(bookingDate);

        if (booking.status === "approved") {
          if (!bookedDateMap[dateStr]) {
            bookedDateMap[dateStr] = [];
          }
          bookedDateMap[dateStr].push(booking.timeSlot);
        }

        if (booking.status === "pending") {
          if (!pendingDateMap[dateStr]) {
            pendingDateMap[dateStr] = [];
          }
          pendingDateMap[dateStr].push(booking.timeSlot);
        }
      });

      setAllBookingsData(allBookings);

      const fullyBookedDates: { [key: string]: boolean } = {};
      Object.keys(bookedDateMap).forEach((dateStr) => {
        const uniqueBookedSlots = [...new Set(bookedDateMap[dateStr])];
        if (uniqueBookedSlots.length >= timeSlots.length) {
          fullyBookedDates[dateStr] = true;
        }
      });

      const datesWithPending: { [key: string]: boolean } = {};
      Object.keys(pendingDateMap).forEach((dateStr) => {
        if (!fullyBookedDates[dateStr]) {
          datesWithPending[dateStr] = true;
        }
      });

      setBookedDates(fullyBookedDates);
      setPendingDates(datesWithPending);

      fetchBookingSlots();
    } catch (error: any) {
      console.error("Error fetching all bookings:", error);
      setFetchError("Failed to load booking information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookingSlots = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      setFetchError("You must be logged in to view bookings");
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);

      const selectedDateStr = formatDateForComparison(selectedDate);

      if (allBookingsData.length > 0) {
        const slots = allBookingsData.filter((booking) => {
          const bookingDate = new Date(booking.date);
          const bookingDateStr = formatDateForComparison(bookingDate);
          return bookingDateStr === selectedDateStr;
        });

        setBookingSlots(slots);
        setIsLoading(false);
        return;
      }

      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("groundType", "==", groundType));

      const querySnapshot = await getDocs(q);
      const slots: BookingSlot[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<BookingSlot, "id">;

        const bookingDate = new Date(data.date);
        const bookingDateStr = formatDateForComparison(bookingDate);

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

  const getMarkedDates = () => {
    const markedDates: any = {};

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

    Object.keys(pendingDates).forEach((dateStr) => {
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

    const selectedDateStr = formatDateForCalendar(selectedDate);
    markedDates[selectedDateStr] = {
      ...markedDates[selectedDateStr],
      selected: true,
      selectedColor: "#4caf50",
    };

    return markedDates;
  };

  const isSlotAvailable = (slot: string): boolean => {
    const slotBookings = bookingSlots.filter((b) => b.timeSlot === slot);
    if (slotBookings.length === 0) {
      return true;
    }
    const hasApprovedOrPending = slotBookings.some(
      (booking) => booking.status === "approved" || booking.status === "pending"
    );
    return !hasApprovedOrPending;
  };

  const getSlotStyle = (slot: string) => {
    const slotBookings = bookingSlots.filter((b) => b.timeSlot === slot);
    let slotStyle = [styles.slot];
    if (slotBookings.length === 0) {
      return slotStyle;
    }
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
    return slotStyle;
  };

  const getSlotStatusText = (slot: string): string => {
    const slotBookings = bookingSlots.filter((b) => b.timeSlot === slot);
    if (slotBookings.length === 0) {
      return "Available";
    }
    if (slotBookings.some((booking) => booking.status === "approved")) {
      return "Booked";
    }
    if (slotBookings.some((booking) => booking.status === "pending")) {
      return "Pending Approval";
    }
    return "Available";
  };

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
        <Text style={styles.title}>Book Your Cricket Slot</Text>

        <View style={styles.dateContainer}>
          {/* <Text style={styles.subtitle}>Select Date:</Text> */}

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
            <View style={styles.slotsGrid}>
              {timeSlots.map((slot) => {
                const available = isSlotAvailable(slot);
                const slotStatus = getSlotStatusText(slot);

                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      getSlotStyle(slot),
                      selectedSlot === slot && available && styles.selectedSlot,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingTop: 60,
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
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  slot: {
    width: "98%",
    padding: 16,
    margin: 5,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#a5d6a7",
  },
  selectedSlot: {
    backgroundColor: "#4caf50",
    borderColor: "#2e7d32",
  },
  slotText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
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
    bottom: 15,
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
    backgroundColor: "#ffcdd2",
    borderColor: "#e57373",
    opacity: 1,
  },
  pendingSlot: {
    backgroundColor: "#fff9c4",
    borderColor: "#fff176",
    opacity: 1,
  },
  unavailableSlotText: {
    color: "#b71c1c",
  },
  statusText: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: "500",
  },
  bookedStatusText: {
    color: "#b71c1c",
    fontWeight: "bold",
  },
  pendingStatusText: {
    color: "#f57f17",
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
