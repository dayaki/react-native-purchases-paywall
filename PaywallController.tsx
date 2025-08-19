import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import Switch from "react-native-switch-toggles";
import { useFocusEffect } from "@react-navigation/native";
import { Close } from "../../assets/icons";
import Svg, { Circle } from "react-native-svg";

// CONSTANTS
const ENTITLEMENT_ID = "soulift_premium";
const TEXT_MAX_LENGTH = 10;
const PRIVACY_POLICY_URL = "https://soulift.app/privacy/";

export const isPremiumUser = async (): Promise<boolean> => {
  let isPremium = false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    if (
      typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
    ) {
      isPremium = true;
    }
    return isPremium;
  } catch (e) {
    return false;
  }
};

const PayWallController = ({ navigation }: any) => {
  const [hasTrial, setHasTrial] = useState(true);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [progress, setProgress] = useState(0);
  const loaded = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPackages();

    // Animate progress over 3 seconds
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 6000,
      useNativeDriver: false,
    }).start(() => {
      setShowCloseButton(true);
    });

    // Update progress state for visual feedback
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1; // Update every 60ms (3000ms / 50 steps)
      });
    }, 60);

    return () => {
      clearInterval(progressInterval);
    };
  }, [progressAnim]);

  useFocusEffect(
    useCallback(() => {
      checkIfPremium();
    }, []),
  );

  const checkIfPremium = async () => {
    const isPremium = await isPremiumUser();
    if (isPremium) {
      navigation.goBack();
    }
  };

  const fetchPackages = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (
        offerings.current !== null &&
        offerings.current.availablePackages.length !== 0
      ) {
        setPackages(offerings.current.availablePackages);
        setSelectedPackage(offerings.current.availablePackages[1]);
      }
    } catch (e) {}
  };

  const truncateText = (
    text: string | number,
    maxLength: number = TEXT_MAX_LENGTH,
  ): string => {
    const stringText = String(text);
    if (stringText.length < maxLength) {
      return stringText;
    }
    return stringText.length > maxLength
      ? `${stringText.substring(0, maxLength)}...`
      : stringText;
  };

  const selectPackage = (packageItem: PurchasesPackage) => {
    setSelectedPackage(packageItem);
    if (packageItem.product.title.toLowerCase().includes("annual")) {
      setHasTrial(false);
    } else {
      setHasTrial(true);
    }
  };

  const handleToggle = (value: boolean) => {
    setHasTrial(value);
    if (loaded.current) {
      if (value) {
        setSelectedPackage(packages[1]);
      } else {
        setSelectedPackage(packages[0]);
      }
    } else {
      loaded.current = true;
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const restore = await Purchases.restorePurchases();
      // ... check restored purchaserInfo to see if entitlement is now active
      if (typeof restore.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        // Unlock that great "pro" content
        Alert.alert("Success", "Your subscription is restored successful");
        setLoading(false);
        navigation.goBack();
      } else {
        console.log("@@@@ error restoring", restore);
        setLoading(false);
      }
    } catch (e) {
      console.log("@@@@ handleRestore error", e);
      setLoading(false);
    }
  };

  const handleTerms = () => {
    Linking.openURL(
      "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      return;
    }
    setLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
      ) {
        Alert.alert("Success", "Thank you! You are now a Premium User");
        navigation.goBack();
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.header}>
          {showCloseButton ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeBtn}>
              <Close color="black" />
            </TouchableOpacity>
          ) : (
            <View style={styles.svgIcon}>
              <Svg width={28} height={28} viewBox="0 0 28 28">
                <Circle
                  cx={14}
                  cy={14}
                  r={11}
                  stroke="rgba(0, 0, 0, 0.2)"
                  strokeWidth={2}
                  fill="none"
                />
                <Circle
                  cx={14}
                  cy={14}
                  r={11}
                  stroke="#000000"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray={69.12}
                  strokeDashoffset={69.12 - (progress * 69.12) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 14 14)"
                />
              </Svg>
            </View>
          )}
        </View>

        <View style={styles.logoView}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.contentView}>
          <Text style={styles.title}>Unlock Premium Access</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <View style={styles.listIcon}>
                <Image
                  source={require("../../assets/images/chat.png")}
                  style={styles.icon}
                />
              </View>
              <Text style={styles.listText}>
                Unlimited spiritual conversations
              </Text>
            </View>
            <View style={styles.listItem}>
              <View style={styles.listIcon}>
                <Image
                  source={require("../../assets/images/gratitude.png")}
                  style={styles.icon}
                />
              </View>
              <Text style={styles.listText}>
                Unlimited prayer topics and daily reminders
              </Text>
            </View>
            <View style={styles.listItem}>
              <View style={styles.listIcon}>
                <Image
                  source={require("../../assets/images/notification.png")}
                  style={styles.icon}
                />
              </View>
              <Text style={styles.listText}>
                Personalised uplifting push notifications
              </Text>
            </View>
            <View style={styles.listItem}>
              <View style={styles.listIcon}>
                <Image
                  source={require("../../assets/images/features.png")}
                  style={styles.icon}
                />
              </View>
              <Text style={styles.listText}>Remove annoying paywalls</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.packages}>
        {packages.map((packageItem: PurchasesPackage, index: number) => (
          <TouchableOpacity
            style={[
              styles.packageItem,
              selectedPackage === packageItem && styles.packageItemSelected,
            ]}
            key={index}
            onPress={() => selectPackage(packageItem)}>
            <View>
              <Text style={styles.packageTitle}>
                {packageItem.product.title.toLowerCase().includes("week")
                  ? "3-Day Trial"
                  : "Yearly Plan"}
              </Text>
              <View style={styles.row}>
                {packageItem.product.title.toLowerCase().includes("annual") ? (
                  <Text style={styles.price}>
                    {packageItem.product.pricePerYearString} per year
                  </Text>
                ) : (
                  <Text style={styles.price}>
                    then {packageItem.product.pricePerWeekString} per week
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.row}>
              {packageItem.product.introPrice === null && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>SAVE 90%</Text>
                </View>
              )}
              <View
                style={[
                  styles.uncheck,
                  selectedPackage === packageItem && styles.checked,
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.spread}>
          <Text style={styles.price}>Free Trial Enabled</Text>
          <Switch
            size={22}
            value={hasTrial}
            onChange={val => handleToggle(val)}
            activeTrackColor="#2767a7"
            activeThumbColor="#fff"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handlePayment}>
          <Text style={styles.buttonText}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : hasTrial ? (
              "Try for 3 Days Free"
            ) : (
              "Continue"
            )}
          </Text>
        </TouchableOpacity>
        <View
          style={[
            styles.spread,
            { width: "70%", alignSelf: "center", marginTop: 10 },
          ]}>
          <Text style={styles.textLink} onPress={handleRestore}>
            Restore
          </Text>
          <Text style={styles.textLink} onPress={handleTerms}>
            Terms
          </Text>
          <Text style={styles.textLink} onPress={handlePrivacyPolicy}>
            Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PayWallController;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 50,
  },
  svgIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  icon: {
    width: 20,
    height: 20,
  },
  closeBtn: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  loadingContainer: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  logoView: {
    alignItems: "center",
    marginTop: -20,
  },
  logo: {
    width: 300,
    height: 120,
    objectFit: "contain",
  },
  contentView: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: "#000",
    marginTop: 20,
    fontFamily: "Geologica-Medium",
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "WorkSans-Regular",
    lineHeight: 20,
  },
  list: {
    marginTop: 30,
    alignItems: "flex-start",
    alignSelf: "center",
    width: "100%",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  listIcon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  listText: {
    fontSize: 16,
    color: "#000",
    textAlign: "left",
    fontFamily: "WorkSans-Regular",
    lineHeight: 20,
    opacity: 0.8,
    width: "90%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spread: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  packages: {
    width: "90%",
    alignSelf: "center",
  },
  packageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderColor: "#ececec",
    borderWidth: 1.5,
    borderRadius: 10,
    marginBottom: 10,
  },
  packageItemSelected: {
    borderColor: "#2767a7",
  },
  tag: {
    backgroundColor: "#cf3826",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "WorkSans-Bold",
    lineHeight: 16,
  },
  priceStrikeOut: {
    textDecorationLine: "line-through",
    textDecorationStyle: "solid",
    textDecorationColor: "rgba(52, 50, 50, 0.5)",
    fontSize: 16,
    fontFamily: "WorkSans-Regular",
    lineHeight: 20,
    color: "rgba(52, 50, 50, 0.5)",
    marginRight: 6,
  },
  price: {
    fontSize: 16,
    fontFamily: "WorkSans-Regular",
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(52, 50, 50, 0.7)",
  },
  packageTitle: {
    fontSize: 16,
    fontFamily: "WorkSans-Medium",
    lineHeight: 20,
    color: "#000",
    marginBottom: 4,
  },
  uncheck: {
    width: 26,
    height: 26,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#ececec",
    alignItems: "center",
    justifyContent: "center",
  },
  checked: {
    backgroundColor: "#2767a7",
  },
  button: {
    backgroundColor: "#2767a7",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "WorkSans-Bold",
    lineHeight: 20,
  },
  textLink: {
    color: "#000",
    fontSize: 14,
    fontFamily: "WorkSans-Regular",
    lineHeight: 20,
    opacity: 0.6,
    textDecorationLine: "underline",
  },
});
