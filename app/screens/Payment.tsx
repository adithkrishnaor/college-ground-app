import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Linking,
} from "react-native";
import { getAuth } from "firebase/auth";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

// Updated payment method type (removed banktransfer)
type PaymentMethodType = "upi";

// Define type for Firestore booking data
interface BookingDetails {
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  groundType: string;
  timestamp: Date;
  status: "pending" | "approved" | "rejected";
  paymentMethod: string;
  paymentId?: string;
  transactionId?: string;
  userId: string;
}

export default function PaymentScreen() {
  const [loading, setLoading] = useState(false);
  const [amount] = useState(25000); // Amount in paise (₹250.00)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("upi");
  const [transactionId, setTransactionId] = useState("");
  const auth = getAuth();

  const displayAmount = (amount / 100).toFixed(2);
  const { groundType, date, timeSlot, name, email, phone } =
    useLocalSearchParams<{
      groundType: string;
      date: string;
      timeSlot: string;
      name: string;
      email: string;
      phone: string;
    }>();
  const groundTypeDisplay =
    groundType === "cricket" ? "Cricket Ground" : "Football Ground";

  // Function to add booking to Firestore
  const addBookingToFirestore = async (paymentDetails?: {
    transactionId: string;
  }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const newBooking: BookingDetails = {
        name: name || "User",
        email: email || auth.currentUser?.email || "user@example.com",
        phone: phone || "Not provided",
        date: date || new Date().toISOString(),
        timeSlot: timeSlot || "Not specified",
        groundType: groundType as string,
        timestamp: new Date(),
        status: "pending",
        paymentMethod: paymentMethod,
        userId: currentUser.uid,
        ...(paymentDetails?.transactionId && {
          transactionId: paymentDetails.transactionId,
        }),
      };

      await addDoc(collection(db, "bookings"), newBooking);
      console.log("Booking added to Firestore successfully");
      return true;
    } catch (error) {
      console.error("Error adding booking to Firestore:", error);
      return false;
    }
  };

  // Handle UPI Payment
  const handleUpiPayment = async () => {
    try {
      // UPI ID for payment
      const upiId = "groundbooking@ybl";
      const merchantName = "Ground Booking App";

      // Create UPI URL
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
        merchantName
      )}&am=${displayAmount}&cu=INR&tn=${encodeURIComponent(
        `${groundTypeDisplay} Booking`
      )}`;

      // Open UPI app
      const supported = await Linking.canOpenURL(upiUrl);

      if (supported) {
        await Linking.openURL(upiUrl);
        Alert.alert(
          "UPI Payment Initiated",
          "After completing the payment in your UPI app, please enter the UPI transaction ID below to confirm your booking.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "UPI Not Supported",
          "Your device doesn't support UPI payments or you don't have any UPI apps installed.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("UPI payment error:", error);
      Alert.alert(
        "Payment Error",
        "There was an error initiating UPI payment. Please try again."
      );
    }
  };

  // Handle payment confirmation
  const handlePaymentConfirmation = async () => {
    setLoading(true);

    try {
      const currUser = auth.currentUser;
      if (!currUser) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to make a booking"
        );
        setLoading(false);
        return;
      }

      if (!transactionId.trim()) {
        Alert.alert(
          "Transaction ID Required",
          "Please enter the transaction ID from your payment."
        );
        setLoading(false);
        return;
      }

      // Add booking to Firestore with transaction ID
      const success = await addBookingToFirestore({
        transactionId: transactionId.trim(),
      });

      if (success) {
        Alert.alert(
          "Payment Confirmed",
          "Our team will verify your payment and activate your booking.",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace({
                  pathname: "/screens/PaymentSuccess",
                  params: { groundType },
                }),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to create booking. Please contact support."
        );
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      Alert.alert(
        "Error",
        "An error occurred during payment confirmation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Payment",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#424242",
          },
          headerTintColor: "#fff",
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Checkout</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.productItem}>
              <Text style={styles.productName}>
                {groundTypeDisplay} Booking
              </Text>
              <Text style={styles.productPrice}>₹{displayAmount}</Text>
            </View>

            {date && (
              <View style={styles.productItem}>
                <Text style={styles.productName}>Date</Text>
                <Text style={styles.productValue}>
                  {new Date(date).toLocaleDateString()}
                </Text>
              </View>
            )}

            {timeSlot && (
              <View style={styles.productItem}>
                <Text style={styles.productName}>Time Slot</Text>
                <Text style={styles.productValue}>{timeSlot}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{displayAmount}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            {/* Removed payment method selection since we only have UPI now */}
            <View style={styles.paymentOption}>
              <Text style={styles.paymentOptionText}>UPI Payment</Text>
            </View>

            <Text style={styles.infoText}>
              Pay directly using any UPI app on your phone (Google Pay, PhonePe,
              Paytm, etc.)
            </Text>
            <View style={styles.upiContainer}>
              <Text style={styles.upiLabel}>UPI ID:</Text>
              <Text style={styles.upiValue}>groundbooking@ybl</Text>
            </View>

            <TouchableOpacity
              style={styles.upiButton}
              onPress={handleUpiPayment}
            >
              <Text style={styles.upiButtonText}>Open UPI App</Text>
            </TouchableOpacity>

            <View style={styles.transactionIdContainer}>
              <Text style={styles.transactionIdLabel}>
                Enter Transaction ID after payment:
              </Text>
              <TextInput
                style={styles.transactionIdInput}
                value={transactionId}
                onChangeText={setTransactionId}
                placeholder="UPI Transaction ID"
                placeholderTextColor="#AAA"
              />
            </View>

            <Text style={styles.secureText}>🔒 Secure payment processing</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handlePaymentConfirmation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payButtonText}>Confirm Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    color: "#333",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  productValue: {
    fontSize: 16,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9ECEF",
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#495057",
    marginTop: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#495057",
    marginTop: 15,
  },
  paymentOption: {
    backgroundColor: "#EBF0FF",
    borderWidth: 1,
    borderColor: "#4B7BEC",
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    alignItems: "center",
  },
  paymentOptionText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  upiContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  upiLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
    marginRight: 10,
  },
  upiValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B7BEC",
  },
  upiButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 15,
  },
  upiButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  transactionIdContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  transactionIdLabel: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 8,
  },
  transactionIdInput: {
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#F8F9FA",
  },
  secureText: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
    marginTop: 10,
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  payButton: {
    backgroundColor: "#4B7BEC",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  payButtonDisabled: {
    backgroundColor: "#A0AEC0",
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
