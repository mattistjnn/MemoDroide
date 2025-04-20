import React, { useState, useEffect } from "react";
import { Text, View, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { API } from '@/constants/api';


export default function CreateTaskPage() {
  const [description, setDescription] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [subtasks, setSubtasks] = useState([{ description: "", is_completed: false }]);
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      if (!storedToken) {
        router.replace("/auth/login");
      } else {
        setToken(storedToken);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!token) return;
      try {
        const response = await fetch(API.NOTES, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            await SecureStore.deleteItemAsync("token");
            router.replace("/auth/login");
            return;
          }
          throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.json();
        if (data && data.data) setNotes(data.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des notes :", error);
        Alert.alert("Erreur", "Impossible de charger les notes.");
      }
    };

    fetchNotes();
  }, [token]);

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { description: "", is_completed: false }]);
  };

  const handleRemoveSubtask = (index) => {
    if (subtasks.length > 1) {
      const newSubtasks = [...subtasks];
      newSubtasks.splice(index, 1);
      setSubtasks(newSubtasks);
    }
  };

  const handleSubtaskChange = (index, value) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].description = value;
    setSubtasks(newSubtasks);
  };

  const handleToggleSubtask = (index) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].is_completed = !newSubtasks[index].is_completed;
    setSubtasks(newSubtasks);
  };

  const handleCreateTask = async () => {
    if (!description.trim()) {
      Alert.alert("Erreur", "Veuillez remplir la description de la tâche.");
      return;
    }

    try {
      setLoading(true);
      const storedToken = await SecureStore.getItemAsync("token");
      if (!storedToken) {
        router.replace("/auth/login");
        return;
      }

      const filteredSubtasks = subtasks.filter(st => st.description.trim() !== "");

      const requestBody = {
        description,
        is_completed: false,
        subtasks: filteredSubtasks,
        ...(selectedNoteId && { note_id: selectedNoteId })
      };

      const response = await fetch(API.TASKS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await SecureStore.deleteItemAsync("token");
          router.replace("/auth/login");
          return;
        }
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      await response.json();
      Alert.alert("Succès", "Tâche créée avec succès !");
      router.push("/tasks");
    } catch (error) {
      console.error("Erreur lors de la création de la tâche :", error);
      Alert.alert("Erreur", "Erreur lors de la création de la tâche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer une nouvelle tâche</Text>

      <TextInput
        style={styles.input}
        placeholder="Description de la tâche"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Note associée (optionnel):</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.notesContainer}>
        {notes.length === 0 ? (
          <Text>Aucune note disponible</Text>
        ) : (
          notes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={[styles.noteButton, selectedNoteId === note.id && styles.selectedNoteButton]}
              onPress={() => setSelectedNoteId(selectedNoteId === note.id ? null : note.id)}
            >
              <Text style={styles.noteButtonText}>{note.title}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Text style={styles.label}>Sous-tâches:</Text>
      {subtasks.map((subtask, index) => (
        <View key={index} style={styles.subtaskContainer}>
          <View style={styles.subtaskInputContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => handleToggleSubtask(index)}
            >
              <View style={[styles.checkboxBase, subtask.is_completed && styles.checkboxChecked]}>
                {subtask.is_completed && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <TextInput
              style={[styles.subtaskInput, subtask.is_completed && styles.completedSubtask]}
              placeholder="Description de la sous-tâche"
              value={subtask.description}
              onChangeText={(value) => handleSubtaskChange(index, value)}
            />
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveSubtask(index)}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={handleAddSubtask}>
        <Text style={styles.addButtonText}>+ Ajouter une sous-tâche</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Button
          title="Annuler"
          onPress={() => router.back()}
          color="#888"
        />
        <Button
          title={loading ? "Création en cours..." : "Créer la tâche"}
          onPress={handleCreateTask}
          disabled={loading || description.trim() === ""}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  notesContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  noteButton: {
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: "#ccc",
    minWidth: 120,
  },
  selectedNoteButton: {
    backgroundColor: "#5733FF",
  },
  noteButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  subtaskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  subtaskInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingRight: 8,
  },
  checkbox: {
    marginHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#5733FF",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#5733FF",
  },
  checkMark: {
    color: "white",
    fontSize: 16,
  },
  subtaskInput: {
    flex: 1,
    padding: 8,
    fontSize: 14,
  },
  completedSubtask: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  removeButton: {
    marginLeft: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "#5733FF",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  }
});