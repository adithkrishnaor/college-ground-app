import {
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  Linking,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

export default function CollegeGroundScreen() {
  const router = useRouter();

  // Single ground data
  const ground = {
    id: 1,
    name: "FISAT COLLEGE GROUND",
    description:
      "The beautiful and well-maintained infrastructure for sports facilities are perfect for the sportive mind.",
    image: require("../../assets/images/crick_ground.png"), // Update path as needed
    location: "Hormis Nagar, Mookkannoor, Angamaly",
    coordinates: { latitude: 10.231061202684609, longitude: 76.41086863839139 }, // Replace with actual coordinates
    facilities: ["Football", "Cricket"],
  };

  // Function to open maps with directions
  const openDirections = () => {
    const { latitude, longitude } = ground.coordinates;
    const destination = `${latitude},${longitude}`;
    const label = encodeURIComponent(ground.name);

    // Different URL schemes for iOS and Android
    const url = Platform.select({
      ios: `maps:?q=${label}&ll=${destination}`,
      android: `geo:0,0?q=${destination}(${label})`,
      default: `https://www.google.com/maps/place/Federal+Institute+of+Science+And+Technology+(FISAT)%C2%AE/@10.2319439,76.4066339,17z/data=!4m9!1m2!2m1!1sFisat+college!3m5!1s0x3b08068aa17bd247:0xf048b9ebcbd2af28!8m2!3d10.2315176!4d76.4088397!15sCg1GaXNhdCBjb2xsZWdlWg8iDWZpc2F0IGNvbGxlZ2WSAQdjb2xsZWdlmgEjQ2haRFNVaE5NRzluUzBWSlEwRm5TVU5YTVRZeWJHTkJFQUU${destination}`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web URL if device maps app is not available
        Linking.openURL(
          `https://www.google.com/maps/place/Federal+Institute+of+Science+And+Technology+(FISAT)%C2%AE/@10.2319439,76.4066339,17z/data=!4m9!1m2!2m1!1sFisat+college!3m5!1s0x3b08068aa17bd247:0xf048b9ebcbd2af28!8m2!3d10.2315176!4d76.4088397!15sCg1GaXNhdCBjb2xsZWdlWg8iDWZpc2F0IGNvbGxlZ2WSAQdjb2xsZWdlmgEjQ2haRFNVaE5NRzluUzBWSlEwRm5TVU5YTVRZeWJHTkJFQUU${destination}`
        );
      }
    });
  };

  // Function to handle the book now button press
  const handleBookNowPress = () => {
    router.push("/(tabs)/menu");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Ground Booking</Text>
            <Text style={styles.subtitle}>
              All details about our sports facility
            </Text>
          </View>

          <View style={styles.groundCard}>
            <Image
              source={ground.image}
              style={styles.groundImage}
              resizeMode="cover"
            />
            <Text style={styles.groundName}>{ground.name}</Text>
            <Text style={styles.groundDescription}>{ground.description}</Text>

            <View style={styles.locationRow}>
              <Text>📍</Text>
              <Text style={styles.locationText}>{ground.location}</Text>
            </View>
            <View style={styles.locationRow}>
              <TouchableOpacity
                onPress={openDirections}
                style={styles.directionsButton}
              >
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Facilities</Text>
            <View style={styles.facilitiesContainer}>
              {ground.facilities.map((facility, index) => (
                <View key={index} style={styles.facilityTag}>
                  <Text style={styles.facilityText}>{facility}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={handleBookNowPress}>
              <View style={styles.bookButton}>
                <Text style={styles.bookButtonText}>Book Now</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  groundImage: {
    width: "100%",
    height: 240,
    borderRadius: 8,
    marginBottom: 15,
  },
  groundCard: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 12,
    overflow: "hidden",
    padding: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groundName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  groundDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 8,
    color: "#333",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  locationText: {
    fontSize: 14,
    marginLeft: 5,
    color: "#666",
    flex: 1,
  },
  directionsButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 5,
  },
  directionsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  facilityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginTop: 8,
    backgroundColor: "#f0f0f0",
  },
  facilityText: {
    color: "#444",
    fontSize: 13,
  },
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
    marginBottom: 10,
  },
  bookButton: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#007AFF",
  },
  bookButtonText: {
    fontWeight: "600",
    color: "#fff",
    fontSize: 16,
  },
});
