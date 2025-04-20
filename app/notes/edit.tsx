import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API } from '@/constants/api';


export default function EditNotePage() {
  const { id } = useLocalSearchParams();
  const [note, setNote] = useState({ title: "", content: "", categories: [] });
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        if (storedToken) {
          setToken(storedToken);
        } else {
          Alert.alert("Erreur", "Token non trouvé. Veuillez vous reconnecter.");
        }
      } catch (error) {
        Alert.alert("Erreur", "Impossible de récupérer le token.");
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    if (token && id) {
      fetchNote();
      fetchCategories();
    }
  }, [token, id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API.NOTES}/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la récupération de la note");

      const data = await response.json();
      setNote(data.data);
      setSelectedCategories(data.data.categories.map(category => category.id));
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API.CATEGORIES}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la récupération des catégories");

      const data = await response.json();
      setCategories(data.data);
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  };

  const validateNote = () => {
    if (!note.title.trim()) {
      Alert.alert("Validation", "Le titre est requis.");
      return false;
    }
    if (!note.content.trim()) {
      Alert.alert("Validation", "Le contenu est requis.");
      return false;
    }
    return true;
  };

  const updateNote = async () => {
    if (!validateNote()) return;

    try {
      const response = await fetch(`${API.NOTES}/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          categories: selectedCategories,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour de la note");

      const data = await response.json();
      Alert.alert("Succès", data.message);
      router.back();
    } catch (error) {
      Alert.alert("Erreur", error.message || "Impossible de mettre à jour la note.");
    }
  };

  const deleteNote = async () => {
    try {
      const response = await fetch(`${API.NOTES}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression de la note");

      const data = await response.json();
      Alert.alert("Succès", data.message);
      router.back();
    } catch (error) {
      Alert.alert("Erreur", error.message || "Impossible de supprimer la note.");
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prevSelected =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter(id => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  if (loading) return <Text style={styles.loadingText}>Chargement de la note...</Text>;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.label}>Titre</Text>
        <TextInput
          style={styles.input}
          value={note.title}
          onChangeText={text => setNote({ ...note, title: text })}
        />

        <Text style={styles.label}>Contenu</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={10}
          value={note.content}
          onChangeText={text => setNote({ ...note, content: text })}
        />

        <Text style={styles.label}>Catégories</Text>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryItem, selectedCategories.includes(category.id) && styles.selectedCategory]}
            onPress={() => toggleCategory(category.id)}
          >
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.button} onPress={updateNote}>
          <Text style={styles.buttonText}>Mettre à jour</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={deleteNote}>
          <Text style={styles.buttonText}>Supprimer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    padding: 20,
    fontSize: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  categoryItem: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
  },
  selectedCategory: {
    backgroundColor: "#007bff",
  },
  categoryText: {
    fontSize: 16,
  },
});
