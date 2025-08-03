import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Video from 'react-native-video';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import Switch from 'react-native-switch-toggles';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// CONSTANTS
const ENTITLEMENT_ID = 'hyper_premium';
const TEXT_MAX_LENGTH = 10;
const PRIVACY_POLICY_URL = 'https://www.termsfeed.com/live/f4b4968a-a059-4107-b087-04ff86ac74a9';
const FONT_FAMILY_BOLD = 'WorkSans-Bold';
const FONT_FAMILY_MEDIUM = 'WorkSans-Medium';
const FONT_FAMILY_REGULAR = 'WorkSans-Regular';

export const isPremiumUser = async (): Promise<boolean> => {
  let isPremium = false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    if (
      typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
    ) {
      isPremium = true;
    }
    return isPremium;
  } catch (e) {
    console.log('@@@ isPremiumUser error', e);
    return false;
  }
};

const PayWallController = () => {
  const [hasTrial, setHasTrial] = useState(true);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigation = useNavigation();
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
        return prev + 2; // Update every 60ms (3000ms / 50 steps)
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
    if (packageItem.product.title.includes('Annual')) {
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
      if (typeof restore.entitlements.active[ENTITLEMENT_ID] !== 'undefined') {
        // Unlock that great "pro" content
        Alert.alert('Success', 'Your subscription is restored successful');
        setLoading(false);
        navigation.goBack();
      } else {
        console.log('@@@@ error restoring', restore);
        setLoading(false);
      }
    } catch (e) {
      console.log('@@@@ handleRestore error', e);
      setLoading(false);
    }
  };

  const handleTerms = () => {
    Linking.openURL(
      'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
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
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
      ) {
        Alert.alert('Success', 'Thank you! You are now a Premium User');
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
        {showCloseButton ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
          >
            <Image
              source={require('../../assets/images/close_icon.png')}
              style={styles.closeIcon}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingContainer}>
            <Svg width={28} height={28} viewBox="0 0 28 28">
              {/* Background circle */}
              <Circle
                cx={14}
                cy={14}
                r={11}
                stroke="rgba(0, 0, 0, 0.2)"
                strokeWidth={2}
                fill="none"
              />
              {/* Progress circle */}
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

        <Video
          source={require('../../assets/music_video.mp4')}
          style={styles.video}
          repeat={true}
          controls={false}
          resizeMode="cover"
        />
      </View>

      <View style={styles.contentView}>
        <Text style={styles.title}>Unlock Premium Access</Text>
        {/* <Text style={styles.description}>
            Enjoy powerful volume boost, enhanced bass, equalizer control, and
            crystal clear sound in one app.
          </Text> */}

        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.description}>
              * Enjoy powerful volume boost.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.description}>
              * Enhanced bass, equalizer controls.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.description}>
              * Unlock extreme volume mode - Loud crystal clear sound.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.description}>* Remove annoying paywalls</Text>
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
              onPress={() => selectPackage(packageItem)}
            >
              <View>
                <Text style={styles.packageTitle}>
                  {packageItem.product.title.includes('Week')
                    ? '3-Day Trial'
                    : 'Yearly Plan'}
                </Text>
                <View style={styles.row}>
                  {packageItem.product.title.includes('Annual') ? (
                    <>
                      <Text style={styles.priceStrikeOut}>
                        {packages[1].product.pricePerYearString}
                      </Text>
                      <Text style={styles.price}>
                        {truncateText(
                          `${packageItem.product.pricePerYearString} per year`,
                        )}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.price}>
                      then {packageItem.product.pricePerWeekString} per week
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.row}>
                {packageItem.product.title.includes('Annual') && (
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
              activeTrackColor="#fff"
              activeThumbColor="#000"
              inactiveTrackColor="#A4A4A4"
              inactiveThumbColor="#000"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handlePayment}>
            {loading ? (
              <Text style={styles.buttonText}>Loading...</Text>
            ) : (
              <Text style={styles.buttonText}>
                {hasTrial ? 'Try Free for 3 Days' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
          <View
            style={[
              styles.spread,
              { width: '70%', alignSelf: 'center', marginTop: 10 },
            ]}
          >
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
    </View>
  );
};

export default PayWallController;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  icon: {
    width: 20,
    height: 20,
  },
  closeBtn: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    position: 'absolute',
    top: 46,
    right: 20,
    zIndex: 500,
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  loadingContainer: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    position: 'absolute',
    top: 46,
    right: 20,
    zIndex: 500,
  },
  video: {
    width: '100%',
    height: 280,
  },
  contentView: {
    paddingHorizontal: 20,
    backgroundColor: '#000',
    paddingTop: 20,
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  fadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'TikTokSans-SemiBold',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'left',
    fontFamily: FONT_FAMILY_MEDIUM,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  packages: {
    width: '100%',
    alignSelf: 'center',
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderColor: '#656363',
    borderWidth: 1.5,
    borderRadius: 10,
    marginBottom: 10,
  },
  packageItemSelected: {
    borderColor: '#fff',
  },
  tag: {
    backgroundColor: '#cf3826',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT_FAMILY_BOLD,
    lineHeight: 16,
  },
  priceStrikeOut: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
    textDecorationColor: 'rgba(52, 50, 50, 0.5)',
    fontSize: 16,
    fontFamily: FONT_FAMILY_REGULAR,
    lineHeight: 20,
    color: 'rgba(255 255 255 / 0.5)',
    marginRight: 6,
  },
  price: {
    fontSize: 16,
    fontFamily: FONT_FAMILY_REGULAR,
    lineHeight: 20,
    textAlign: 'center',
    color: '#fff',
  },
  packageTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY_MEDIUM,
    lineHeight: 20,
    color: '#fff',
    marginBottom: 4,
  },
  uncheck: {
    width: 26,
    height: 26,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: '#2767a7',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontFamily: FONT_FAMILY_BOLD,
    lineHeight: 20,
  },
  textLink: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT_FAMILY_REGULAR,
    lineHeight: 20,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
  list: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    width: '100%',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  listIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  listText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'left',
    fontFamily: FONT_FAMILY_REGULAR,
    lineHeight: 20,
    opacity: 0.8,
    width: '90%',
  },
});
