import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import { API } from '@/constants/api';

export default function CreateNotePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const navigation = useNavigation();



  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        if (storedToken) {
          setToken(storedToken);
        } else {
          Alert.alert("Erreur", "Token introuvable, veuillez vous reconnecter.");
        }
      } catch (error) {
        Alert.alert("Erreur", "Impossible de récupérer le token.");
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      if (token) {
        try {
          const response = await fetch(API.CATEGORIES, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) throw new Error("Erreur lors du chargement des catégories");

          const data = await response.json();

          if (data && data.data) {
            setCategoryOptions(data.data);
          } else {
            throw new Error("Format de données incorrect reçu");
          }
        } catch (error) {
          Alert.alert("Erreur", error.message);
        }
      }
    };

    fetchCategories();
  }, [token]);

  const validateNote = () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Le titre ne peut pas être vide.");
      return false;
    }
    if (!content.trim()) {
      Alert.alert("Validation", "Le contenu ne peut pas être vide.");
      return false;
    }
    return true;
  };

  const handleCreateNote = async () => {
    if (!validateNote() || !token) return;

    try {
      setLoading(true);
      const requestBody = {
        title,
        content,
        categories: selectedCategories,
      };

      const response = await fetch(API.NOTES, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Échec de la création de la note");

      Alert.alert("Succès", "Note créée avec succès !");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategorySelection = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.mainContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView style={styles.container}>
        <Text style={styles.title}>Créer une nouvelle note</Text>

        <TextInput
          style={styles.input}
          placeholder="Titre de la note"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Contenu de la note"
          value={content}
          onChangeText={setContent}
          multiline
        />

        <Text style={styles.label}>Catégories :</Text>

        {categoryOptions.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategories.includes(category.id) && styles.selectedCategoryButton,
            ]}
            onPress={() => toggleCategorySelection(category.id)}
          >
            <Text style={styles.categoryButtonText}>{category.name}</Text>
          </TouchableOpacity>
        ))}

        <Button
          title={loading ? "Création en cours..." : "Créer la note"}
          onPress={handleCreateNote}
          disabled={loading}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  categoryButton: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  selectedCategoryButton: {
    backgroundColor: "#5733FF",
  },
  categoryButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButtonText: {
    fontSize: 16,
    color: "#5733FF",
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 20,
  },
});