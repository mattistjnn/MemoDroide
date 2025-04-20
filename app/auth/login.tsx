import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import tw from "twrnc";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { API } from '@/constants/api';

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const loadingSpinValue = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;

  const startLoadingAnimation = () => {
    Animated.loop(
      Animated.timing(loadingSpinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  };

  const spin = loadingSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Email invalide");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe est trop court");
      return false;
    }
    return true;
  };

  const encryptToken = async (token: string) => {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      token
    );
    return digest;
  };

  const handleLogin = async () => {
    if (!email || !password || !validateInputs()) return;

    animateButtonPress();
    setLoading(true);
    startLoadingAnimation();

    Animated.timing(blurAnim, {
      toValue: 0.5,
      duration: 300,
      useNativeDriver: true
    }).start();

    try {
      const response = await fetch(`${API.BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        Alert.alert("Erreur", "Erreur de parsing JSON");
        setLoading(false);
        Animated.timing(blurAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start();
        return;
      }

      if (!data.access_token) throw new Error("Token manquant");

      // Chiffrer le token pour usage interne sécurisé (optionnel)
      const encryptedToken = await encryptToken(data.access_token);
      console.log("Encrypted token:", encryptedToken);

      await SecureStore.setItemAsync("token", data.access_token);

      Animated.parallel([
        Animated.timing(blurAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        })
      ]).start(async () => {
        await signIn(data.access_token, data.user);
        router.replace("/(tabs)");
      });

    } catch (error) {
      Alert.alert("Erreur", error.message);
      setLoading(false);
      Animated.timing(blurAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1`}
    >
      <StatusBar style="auto" />
      <Animated.View
        style={[
          tw`flex-1 dark:bg-gray-900`,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <SafeAreaView style={tw`flex-1`}>
          {/* Conteneur principal centré verticalement et horizontalement */}
          <Animated.View
            style={[
              tw`flex-1 px-6 justify-center items-center`,
              {
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            {/* Logo/Header */}
            <Animated.View
              style={[
                tw`items-center mb-8 ${isKeyboardVisible ? 'mb-2' : ''}`,
                { opacity: fadeAnim }
              ]}
            >
              <Animated.View
                style={[
                  tw`w-24 h-24 bg-blue-600 dark:bg-blue-500 rounded-2xl items-center justify-center mb-4 shadow-xl ${isKeyboardVisible ? 'w-16 h-16' : ''}`,
                  {
                    transform: [
                      { scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })}
                    ]
                  }
                ]}
              >
                <Text style={tw`text-white text-4xl font-bold ${isKeyboardVisible ? 'text-2xl' : ''}`}>MT</Text>
              </Animated.View>
              {!isKeyboardVisible && (
                <>
                  <Animated.Text
                    style={[
                      tw`text-4xl font-bold text-blue-800 dark:text-blue-400`,
                      {
                        opacity: fadeAnim,
                        transform: [
                          { translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                          })}
                        ]
                      }
                    ]}
                  >
                    Bienvenue
                  </Animated.Text>
                  <Animated.Text
                    style={[
                      tw`text-gray-600 dark:text-gray-300 text-lg mt-2`,
                      {
                        opacity: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.8]
                        })
                      }
                    ]}
                  >
                    Connectez-vous à votre compte
                  </Animated.Text>
                </>
              )}
            </Animated.View>

            {/* Formulaire - maintenant avec largeur maximale et parfaitement centré */}
            <Animated.View
              style={[
                tw`rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl w-full max-w-sm`,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  elevation: 10,
                }
              ]}
            >
              <Animated.View style={{ opacity: Animated.subtract(1, blurAnim) }}>
                <View style={tw`mb-6`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={18}
                      color={tw.color('gray-600 dark:gray-400')}
                    />
                    <Text style={tw`text-gray-700 dark:text-gray-300 text-sm font-medium ml-2`}>
                      Email
                    </Text>
                  </View>
                  <View style={tw`relative`}>
                    <TextInput
                      style={tw`p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 w-full`}
                      placeholder="votre@email.com"
                      placeholderTextColor={tw.color('gray-400')}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={tw`mb-6`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={18}
                      color={tw.color('gray-600 dark:gray-400')}
                    />
                    <Text style={tw`text-gray-700 dark:text-gray-300 text-sm font-medium ml-2`}>
                      Mot de passe
                    </Text>
                  </View>
                  <View style={tw`relative`}>
                    <TextInput
                      style={tw`p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 w-full pr-12`}
                      placeholder="••••••••"
                      placeholderTextColor={tw.color('gray-400')}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={tw`absolute right-4 top-4`}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={tw.color('gray-500')}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    style={tw`p-4 bg-blue-500 dark:bg-blue-600 rounded-xl mt-2 shadow-lg`}
                  >
                    {loading ? (
                      <View style={tw`flex-row justify-center items-center`}>
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                          <MaterialCommunityIcons name="loading" size={24} color="white" />
                        </Animated.View>
                        <Text style={tw`text-white text-center font-bold text-lg ml-2`}>
                          Connexion...
                        </Text>
                      </View>
                    ) : (
                      <Text style={tw`text-white text-center font-bold text-lg`}>
                        Se connecter
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  style={tw`p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mt-4 border border-gray-200 dark:border-gray-600 flex-row justify-center items-center`}
                  onPress={() => {
                    animateButtonPress();
                    router.push("/auth/qr-scan");
                  }}
                >
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={22}
                    color={tw.color('gray-700 dark:gray-300')}
                    style={tw`mr-2`}
                  />
                  <Text style={tw`text-gray-700 dark:text-gray-300 text-center font-medium`}>
                    Scanner un QR Code
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {/* Zone de debug */}
            {debug ? (
              <Animated.View
                style={[
                  tw`mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-sm`,
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }]
                  }
                ]}
              >
                <Text style={tw`text-xs text-gray-500 dark:text-gray-400 font-mono`}>
                  {debug}
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
