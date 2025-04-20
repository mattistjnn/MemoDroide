import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Switch
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API } from '@/constants/api';
import { IconSymbol } from '@/components/ui/IconSymbol'; // Ajouté pour l'icône de rafraîchissement

interface Subtask {
  id: number;
  description: string;
  is_completed: boolean;
}

interface Task {
  id: number;
  description: string;
  is_completed: boolean;
  user_id: number;
  note_id: number;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
  note?: {
    id: number;
    title: string;
  };
}

export default function TasksIndex() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false); // Nouvel état pour le rafraîchissement
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const checkToken = async () => {
      const storedToken = await SecureStore.getItemAsync("token");

      if (!storedToken && isMounted) {
        router.replace("/auth/login");
      } else if (isMounted) {
        setToken(storedToken);
      }
    };
    checkToken();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, showCompleted]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const storedToken = await SecureStore.getItemAsync("token");

      if (!storedToken) {
        router.replace("/auth/login");
        return;
      }

      setToken(storedToken);

      const response = await fetch(`${API.TASKS}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await SecureStore.deleteItemAsync("token");
          router.replace("/auth/login");
          return;
        }
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des tâches:', err);
      setError('Impossible de charger les tâches. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };
  
  // Nouvelle fonction pour rafraîchir les tâches
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const storedToken = await SecureStore.getItemAsync("token");
      
      if (!storedToken) {
        router.replace("/auth/login");
        return;
      }

      const response = await fetch(`${API.TASKS}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await SecureStore.deleteItemAsync("token");
          router.replace("/auth/login");
          return;
        }
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data.data);
      // Notification de succès du rafraîchissement (facultatif)
      // Alert.alert("Succès", "Les tâches ont été rafraîchies avec succès");
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des tâches:', err);
      setError('Impossible de rafraîchir les tâches. Veuillez réessayer plus tard.');
    } finally {
      setRefreshing(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(task =>
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (showCompleted) {
      filtered = filtered.filter(task => task.is_completed);
    } else {
      filtered = filtered.filter(task => !task.is_completed);
    }
    setFilteredTasks(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const toggleTaskCompletion = async (taskId: number, currentStatus: boolean) => {
    try {
      const storedToken = await SecureStore.getItemAsync("token");

      if (!storedToken) {
        router.replace("/auth/login");
        return;
      }

      const response = await fetch(`${API.TASKS}/${taskId}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, is_completed: !currentStatus }
            : task
        )
      );
    } catch (err) {
      console.error('Erreur lors du basculement de l\'état de la tâche:', err);
      setError('Impossible de mettre à jour la tâche. Veuillez réessayer plus tard.');
    }
  };

  const navigateToEditTask = (taskId: number) => {
    router.push(`/tasks/edit?id=${taskId}`);
  };

  const renderSubtask = (subtask: Subtask, index: number, taskId: number) => (
    <Text
      key={`task-${taskId}-subtask-${subtask.id || index}`}
      style={[styles.subtaskItem, subtask.is_completed && styles.completedSubtask]}
    >
      • {subtask.description}
    </Text>
  );

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => navigateToEditTask(item.id)}
    >
      <View style={styles.taskRow}>
        <Checkbox
          status={item.is_completed ? 'checked' : 'unchecked'}
          onPress={(e) => {
            e.stopPropagation?.();
            toggleTaskCompletion(item.id, item.is_completed);
          }}
          color="#007bff"
          uncheckedColor="#007bff"
        />
        <View style={styles.taskContent}>
          <Text style={[styles.taskDescription, item.is_completed && styles.completedTask]}>
            {item.description}
          </Text>
          {item.subtasks && item.subtasks.length > 0 && (
            <View style={styles.subtasksContainer}>
              <Text style={styles.subtasksHeader}>
                Sous-tâches ({item.subtasks.filter(st => st.is_completed).length}/{item.subtasks.length})
              </Text>
              {item.subtasks.slice(0, 2).map((subtask, index) =>
                renderSubtask(subtask, index, item.id)
              )}
              {item.subtasks.length > 2 && (
                <Text style={styles.moreSubtasks} key={`task-${item.id}-more-subtasks`}>
                  Et {item.subtasks.length - 2} autres...
                </Text>
              )}
            </View>
          )}
          {item.note && (
            <Text style={styles.noteText} key={`task-${item.id}-note`}>
              Note: {item.note.title}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        Aucune tâche ne correspond à votre recherche.
      </Text>
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitle}>Mes tâches</Text>
        {/* Bouton de rafraîchissement */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : (
            <IconSymbol size={20} name="arrow.clockwise" color="#007bff" />
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/tasks/create')}
      >
        <Text style={styles.addButtonText}>+ Nouvelle tâche</Text>
      </TouchableOpacity>
      <TextInput
        ref={searchInputRef}
        style={styles.searchBar}
        placeholder="Rechercher une tâche..."
        value={searchText}
        onChangeText={handleSearch}
        clearButtonMode="while-editing"
      />
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Afficher uniquement les tâches complétées</Text>
        <Switch
          value={showCompleted}
          onValueChange={setShowCompleted}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        {/* Bouton pour réessayer en cas d'erreur */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.retryButtonText}>Réessayer</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskDescription: {
    fontSize: 16,
    fontWeight: '500',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  subtasksContainer: {
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
  },
  subtasksHeader: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  subtaskItem: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 2,
  },
  completedSubtask: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  moreSubtasks: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});