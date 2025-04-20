import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { API } from '@/constants/api';

const PREDEFINED_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#FF33A8",
  "#33B5FF", "#FFD633", "#FF8C33", "#9C27B0",
  "#673AB7", "#009688", "#795548", "#607D8B"
];

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Nouvel état pour le rafraîchissement
  const [token, setToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        if (storedToken) {
          setToken(storedToken);
        } else {
          router.replace("/auth/login");
        }
      } catch (error) {
        router.replace("/auth/login");
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchNotes();
    }
  }, [token]);

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
      if (Array.isArray(data.data)) setCategories(data.data);
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API.NOTES}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des notes");
      const data = await response.json();
      if (Array.isArray(data.data)) {
        setNotes(data.data);
        setFilteredNotes(data.data);
      } else throw new Error("Format de données inattendu");
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Nouvelle fonction pour rafraîchir les données
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchCategories(), fetchNotes()]);
      // Notification visuelle que les données ont été rafraîchies
      Alert.alert("Succès", "Les données ont été rafraîchies");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de rafraîchir les données");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  useEffect(() => {
    let filtered = notes;
    if (searchQuery.trim()) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(note =>
        selectedCategories.every(catId =>
          note.categories.some(c => c.id === catId)
        )
      );
    }
    setFilteredNotes(filtered);
  }, [searchQuery, notes, selectedCategories]);

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Erreur", "Le nom de la catégorie est requis.");
      return;
    }
    try {
      setCreatingCategory(true);
      const response = await fetch(`${API.CATEGORIES}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName.trim(), color: selectedColor }),
      });
      if (!response.ok) throw new Error("Erreur lors de la création de la catégorie");
      setNewCategoryName("");
      setSelectedColor(PREDEFINED_COLORS[0]);
      setModalVisible(false);
      fetchCategories();
      Alert.alert("Succès", "Catégorie créée avec succès !");
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const toggleCategorySelection = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleNotePress = (noteId) => {
    router.push(`/notes/edit?id=${noteId}`);
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      // Suppression du token
      await SecureStore.deleteItemAsync("token");
      // Redirection vers la page de connexion
      router.replace("/auth/login");
    } catch (error) {
      Alert.alert("Erreur", "Problème lors de la déconnexion");
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCarouselItem, { backgroundColor: item.color }, selectedCategories.includes(item.id) && styles.categoryCarouselItemSelected]}
      onPress={() => toggleCategorySelection(item.id)}
    >
      <Text style={styles.categoryCarouselText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderColorOption = (color) => (
    <TouchableOpacity
      key={color}
      style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.selectedColorOption]}
      onPress={() => setSelectedColor(color)}
    />
  );

  if (loading) return <Text style={styles.loadingText}>Chargement des notes...</Text>;

  return (
    <View style={styles.container}>
      {/* Barre de recherche, bouton de création de catégorie, bouton de rafraîchissement et bouton de déconnexion */}
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <IconSymbol size={20} name="magnifyingglass" color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des notes..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setModalVisible(true)}
        >
          <IconSymbol size={20} name="tag" color="#007bff" />
        </TouchableOpacity>

        {/* Nouveau bouton de rafraîchissement */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : (
            <IconSymbol size={20} name="arrow.clockwise" color="#007bff" />
          )}
        </TouchableOpacity>

        {/* Bouton de déconnexion */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleLogout}
        >
          <IconSymbol size={20} name="rectangle.portrait.and.arrow.right" color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      {/* Carrousel de catégories */}
      {categories.length > 0 && (
        <View style={styles.categoryCarouselContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryCarouselContent}
          />
          {selectedCategories.length > 0 && (
            <TouchableOpacity 
              style={styles.clearCategoriesButton}
              onPress={() => setSelectedCategories([])}
            >
              <Text style={styles.clearCategoriesText}>Effacer les filtres</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Mes Notes</Text>

        {filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedCategories.length > 0 
                ? "Aucune note ne contient toutes les catégories sélectionnées." 
                : "Aucune note disponible."}
            </Text>
          </View>
        ) : (
          <View style={styles.notesList}>
            {filteredNotes.map((note) => (
              <TouchableOpacity key={note.id} style={styles.noteItem} onPress={() => handleNotePress(note.id)}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text>{note.content}</Text>
                {note.categories.length > 0 && (
                  <View style={styles.categories}>
                    <Text style={styles.categoriesTitle}>Catégories :</Text>
                    <View style={styles.categoriesList}>
                      {note.categories.map((category) => (
                        <View 
                          key={category.id} 
                          style={[
                            styles.categoryItem, 
                            { backgroundColor: category.color },
                            selectedCategories.includes(category.id) && styles.highlightedCategory
                          ]}
                        >
                          <Text style={styles.categoryText}>{category.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bouton d'ajout flottant */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/notes/create")}
      >
        <IconSymbol size={24} name="plus" color="#fff" />
      </TouchableOpacity>

      {/* Modale de création de catégorie */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Créer une catégorie</Text>
            
            <Text style={styles.inputLabel}>Nom de la catégorie</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Entrez le nom de la catégorie"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            
            <Text style={styles.inputLabel}>Couleur</Text>
            <View style={styles.colorOptionsContainer}>
              {PREDEFINED_COLORS.map(renderColorOption)}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={creatingCategory}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.createButton}
                onPress={createCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
              >
                <Text style={styles.createButtonText}>
                  {creatingCategory ? "Création..." : "Créer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 70,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    padding: 0,
  },
  // Style unifié pour tous les boutons d'icônes
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    marginLeft: 8,
  },
  categoryCarouselContainer: {
    marginTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryCarouselContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  categoryCarouselItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryCarouselItemSelected: {
    borderColor: "#000",
    borderWidth: 2,
  },
  categoryCarouselText: {
    color: "#fff",
    fontWeight: "500",
  },
  clearCategoriesButton: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    alignSelf: "flex-end",
  },
  clearCategoriesText: {
    color: "#007bff",
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  loadingText: {
    padding: 20,
    fontSize: 16,
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
  notesList: {
    marginTop: 16,
  },
  noteItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: "#fff",
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  categories: {
    marginTop: 8,
  },
  categoriesTitle: {
    fontWeight: "bold",
  },
  categoriesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  categoryItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: "white",
  },
  highlightedCategory: {
    borderWidth: 2,
    borderColor: "#000",
  },
  addButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // Styles pour la modale
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: '80%',
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  colorOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: "#000",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007bff",
    alignItems: "center",
    marginLeft: 8,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
  },
});