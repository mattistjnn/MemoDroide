import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { API } from '@/constants/api';



export default function EditTaskPage() {
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState({ description: "", is_completed: false, subtasks: [], note_id: null });
  const [notes, setNotes] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTokenAndData = async () => {
      const storedToken = await SecureStore.getItemAsync("token");

      if (!storedToken) {
        router.replace("/auth/login");
        return;
      }

      setToken(storedToken);

      try {
        setLoading(true);
        const [taskRes, notesRes] = await Promise.all([
          fetch(`${API.TASKS}/${id}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API.NOTES}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "Content-Type": "application/json",
            },
          })
        ]);

        if (!taskRes.ok || !notesRes.ok) {
          if (taskRes.status === 401 || notesRes.status === 401) {
            await SecureStore.deleteItemAsync("token");
            router.replace("/auth/login");
            return;
          }
          throw new Error("Erreur de chargement");
        }

        const taskData = await taskRes.json();
        const notesData = await notesRes.json();

        setTask(taskData.data);
        setNotes(notesData.data);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        Alert.alert("Erreur", "Impossible de charger la tâche.");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndData();
  }, [id]);

  const updateTask = async () => {
    try {
      const response = await fetch(`${API.TASKS}/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const data = await response.json();
      Alert.alert("Succès", data.message);
      router.back();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour la tâche.");
    }
  };

  const deleteTask = async () => {
    Alert.alert("Confirmation", "Supprimer cette tâche ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API.TASKS}/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              throw new Error(`Erreur HTTP : ${response.status}`);
            }

            const data = await response.json();
            Alert.alert("Succès", data.message);
            router.back();
          } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            Alert.alert("Erreur", "Suppression impossible.");
          }
        },
      },
    ]);
  };

  const updateSubtask = (index, field, value) => {
    const updated = [...task.subtasks];
    updated[index][field] = value;
    setTask({ ...task, subtasks: updated });
  };

  const addSubtask = () => {
    setTask({ ...task, subtasks: [...task.subtasks, { description: "", is_completed: false }] });
  };

  const removeSubtask = (index) => {
    Alert.alert("Supprimer ?", "Cette sous-tâche sera supprimée.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          const filtered = task.subtasks.filter((_, i) => i !== index);
          setTask({ ...task, subtasks: filtered });
        },
      },
    ]);
  };

  const toggleNoteSelection = (noteId) => {
    setTask({ ...task, note_id: task.note_id === noteId ? null : noteId });
  };

  if (loading) return <Text style={styles.loadingText}>Chargement de la tâche...</Text>;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={task.description}
          onChangeText={text => setTask({ ...task, description: text })}
          placeholder="Description de la tâche"
        />

        <Text style={styles.label}>Complétée</Text>
        <View style={styles.switchContainer}>
          <Switch
            value={task.is_completed}
            onValueChange={value => setTask({ ...task, is_completed: value })}
          />
          <Text style={styles.switchLabel}>
            {task.is_completed ? "Oui" : "Non"}
          </Text>
        </View>

        <Text style={styles.label}>Sous-tâches</Text>
        {task.subtasks.length === 0 ? (
          <Text style={styles.emptyText}>Aucune sous-tâche. Utilisez le bouton ci-dessous pour en ajouter.</Text>
        ) : (
          task.subtasks.map((subtask, index) => (
            <View key={`subtask-${index}`} style={styles.subtaskItem}>
              <View style={styles.subtaskInputContainer}>
                <TextInput
                  style={styles.subtaskInput}
                  value={subtask.description}
                  onChangeText={text => updateSubtask(index, "description", text)}
                  placeholder="Description de la sous-tâche"
                />
              </View>
              <View style={styles.subtaskControls}>
                <View style={styles.subtaskSwitch}>
                  <Switch
                    value={subtask.is_completed}
                    onValueChange={value => updateSubtask(index, "is_completed", value)}
                  />
                </View>
                <TouchableOpacity 
                  style={styles.deleteSubtaskButton} 
                  onPress={() => removeSubtask(index)}
                >
                  <IconSymbol size={20} name="trash" color="#dc3545" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <TouchableOpacity style={styles.addButton} onPress={addSubtask}>
          <Text style={styles.buttonText}>+ Ajouter une sous-tâche</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Associer une note</Text>
        {notes.length === 0 ? (
          <Text style={styles.emptyText}>Aucune note disponible.</Text>
        ) : (
          <View style={styles.notesContainer}>
            {notes.map(item => (
              <TouchableOpacity
                key={`note-${item.id}`}
                style={[styles.noteItem, task.note_id === item.id && styles.selectedNote]}
                onPress={() => toggleNoteSelection(item.id)}
              >
                <Text style={[styles.noteText, task.note_id === item.id && styles.selectedNoteText]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {task.note_id && (
          <TouchableOpacity 
            style={styles.deselectNoteButton}
            onPress={() => setTask({ ...task, note_id: null })}
          >
            <Text style={styles.deselectNoteText}>Désélectionner la note</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.updateButton} onPress={updateTask}>
            <Text style={styles.buttonText}>Mettre à jour</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={deleteTask}>
            <Text style={styles.buttonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  switchLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  emptyText: {
    fontStyle: "italic",
    color: "#666",
    marginBottom: 15,
  },
  subtaskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
  },
  subtaskInputContainer: {
    flex: 1,
  },
  subtaskInput: {
    padding: 8,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  subtaskControls: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  subtaskSwitch: {
    marginRight: 10,
  },
  deleteSubtaskButton: {
    padding: 5,
  },
  addButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  notesContainer: {
    marginBottom: 15,
  },
  noteItem: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedNote: {
    backgroundColor: "#007bff",
    borderColor: "#0056b3",
  },
  noteText: {
    fontSize: 16,
  },
  selectedNoteText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deselectNoteButton: {
    padding: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  deselectNoteText: {
    color: "#dc3545",
    fontWeight: "500",
  },
  actionButtons: {
    marginTop: 10,
    marginBottom: 30,
  },
  updateButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});