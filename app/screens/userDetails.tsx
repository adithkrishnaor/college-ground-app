import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../config/FirebaseConfig";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function UserDetails() {
  const router = useRouter();
  const { date, timeSlot, groundType } = useLocalSearchParams<{
    date: string;
    timeSlot: string;
    groundType: string;
  }>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const currentUser = auth.currentUser;

        if (currentUser) {
          // Set email from authentication
          if (currentUser.email) {
            setEmail(currentUser.email);
          }

          // Set name from authentication if available
          if (currentUser.displayName) {
            setName(currentUser.displayName);
          }

          // Try to get additional user data from Firestore if needed
          // This is useful if you store additional user info like phone number in Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // If name wasn't set from auth, try to get it from Firestore
            if (!currentUser.displayName && userData.name) {
              setName(userData.name);
            }

            // Get phone number if available
            if (userData.phone) {
              setPhone(userData.phone);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    // Navigate to Payment screen with booking details
    router.push({
      pathname: "/screens/Payment",
      params: {
        name,
        email,
        phone,
        date,
        timeSlot,
        groundType,
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Request Booking",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#424242",
          },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.bookingDetails}>
          <Text style={styles.subtitle}>Booking Details:</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(date as string)}</Text>
          </View>
          {timeSlot && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{timeSlot}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ground:</Text>
            <Text style={styles.detailValue}>
              {groundType === "cricket" ? "Cricket" : "Football"}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading your information...</Text>
          </View>
        ) : (
          <View style={[styles.form, styles.bookingDetails]}>
            <Text style={styles.subtitle}>Your Details:</Text>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, name ? styles.disabledInput : null]}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              editable={!name && !isSubmitting}
            />

            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={[styles.input, email ? styles.disabledInput : null]}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!email && !isSubmitting} // Make email non-editable if already fetched
            />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your 10-digit phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              maxLength={10}
              editable={!isSubmitting}
            />

            <Pressable style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
          disabled={isSubmitting}
        >
          <Text style={styles.backButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  bookingDetails: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
    width: 80,
    color: "#555",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
    color: "#333",
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
  },
  form: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#555",
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  disabledButton: {
    backgroundColor: "#90CAF9",
    opacity: 0.7,
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#666",
  },
});
