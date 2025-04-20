import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Button,
} from "react-native";
import tw from "twrnc";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

export default function QRScanScreen() {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");
  const { signIn } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    setDebug(`QR Code scann\u00e9: ${data.substring(0, 50)}...\n`);

    if (!data.includes("/auth/qr-login/")) {
      Alert.alert("QR Code invalide", "Ce QR code n'est pas valide pour l'authentification.");
      setScanned(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(data, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const rawText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(rawText);
      } catch (parseError) {
        throw new Error("Format de r\u00e9ponse invalide");
      }

      if (!response.ok || !responseData.access_token) {
        const errorMessage = responseData.message || "Erreur lors de l'authentification";
        throw new Error(errorMessage);
      }

      await signIn(responseData.access_token, responseData.user);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      Alert.alert("Erreur d'authentification", message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setScanned(false);
    setDebug("");
  };

  if (!permission) {
    return (
      <View style={tw`flex-1 bg-white justify-center p-5`}>
        <Text>V\u00e9rification des permissions cam\u00e9ra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={tw`flex-1 bg-white justify-center p-5`}>
        <Text style={tw`text-red-500 text-lg text-center`}>
          Nous avons besoin de votre permission pour utiliser la cam\u00e9ra
        </Text>
        <Button title="Autoriser l'acc\u00e8s" onPress={requestPermission} />
        <TouchableOpacity
          style={tw`bg-gray-500 p-3 rounded-md mt-3`}
          onPress={() => router.back()}
        >
          <Text style={tw`text-white text-center font-bold text-base`}>
            Retour
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white justify-center p-5`}>
      <StatusBar style="light" />

      {!scanned && (
        <View style={tw`flex-1 overflow-hidden`}>
          <CameraView
            ref={cameraRef}
            style={tw`flex-1`}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={tw`flex-1 justify-center items-center`}>
              <View
                style={tw`w-64 h-64 border-2 border-white rounded-2xl bg-transparent`}
              />
            </View>
            <View
              style={tw`absolute bottom-20 left-0 right-0 items-center px-5`}
            >
              <Text
                style={tw`text-white text-lg text-center bg-black bg-opacity-70 p-3 rounded-lg`}
              >
                Placez le QR code dans le cadre
              </Text>
            </View>
          </CameraView>
        </View>
      )}

      {(scanned || debug) && (
        <ScrollView style={tw`flex-1 bg-white`} contentContainerStyle={tw`p-5`}>
          <Text style={tw`text-2xl font-bold mb-5 text-center`}>
            Scan QR code
          </Text>

          {loading && (
            <View style={tw`items-center justify-center my-5`}>
              <ActivityIndicator size="large" color="#007BFF" />
              <Text style={tw`mt-2.5 text-base`}>Connexion en cours...</Text>
            </View>
          )}

          {debug ? (
            <View style={tw`mt-5 p-2.5 bg-gray-100 rounded-md`}>
              <Text style={tw`font-bold mb-1`}>Informations de d\u00e9bogage:</Text>
              <Text style={tw`font-mono text-xs`}>{debug}</Text>
            </View>
          ) : null}

          {scanned && !loading && (
            <View style={tw`mt-5`}>
              <TouchableOpacity
                style={tw`bg-blue-500 p-3 rounded-md mb-3`}
                onPress={handleRetry}
              >
                <Text style={tw`text-white text-center font-bold text-base`}>
                  Scanner un autre QR code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`bg-gray-500 p-3 rounded-md`}
                onPress={() => router.back()}
              >
                <Text style={tw`text-white text-center font-bold text-base`}>
                  Retour
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}