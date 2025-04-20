// Import de React et des outils de test de React Native Testing Library
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Le composant que l’on teste
import EditNotePage from "../app/notes/edit";

// SecureStore pour la gestion du token (mocké dans les tests)
import * as SecureStore from "expo-secure-store";

// Alert de React Native pour tester les alertes utilisateur
import { Alert } from "react-native";

// Mock de SecureStore : on fournit des fonctions fictives à la place de la vraie lib
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(), // fonction qui sera redéfinie dans le beforeEach
}));

// Mock du router d'expo : on simule les hooks utilisés dans EditNotePage
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }), // simule un retour en arrière
  useLocalSearchParams: () => ({ id: "1" }), // simule un paramètre d'URL avec id = 1
}));

// Mock des données de la note qu’on veut éditer
const mockNote = {
  data: {
    title: "Note de test",
    content: "Contenu de la note",
    categories: [{ id: 1, name: "Travail" }],
  },
};

// Mock des catégories disponibles
const mockCategories = {
  data: [
    { id: 1, name: "Travail" },
    { id: 2, name: "Perso" },
  ],
};

// Début de la suite de tests
describe("EditNotePage", () => {
  // Avant chaque test : on vide les mocks pour repartir proprement
  beforeEach(() => {
    jest.clearAllMocks();

    // On simule la récupération d’un token
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("fake-token");

    // On simule les appels API successifs :
    // - d'abord fetchNote (GET /notes/1)
    // - puis fetchCategories
    (global.fetch as jest.Mock) = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNote,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });
  });

  // Test : la page affiche bien les données récupérées
  it("charge et affiche les données de la note", async () => {
    const { getByDisplayValue, getByText } = render(<EditNotePage />);

    // On attend que les champs soient remplis avec les données mockées
    await waitFor(() => {
      expect(getByDisplayValue("Note de test")).toBeTruthy();
      expect(getByDisplayValue("Contenu de la note")).toBeTruthy();
      expect(getByText("Travail")).toBeTruthy(); // catégorie sélectionnée
    });
  });

  // Test : on affiche une alerte si le champ titre est vide
  it("affiche une alerte si on essaie de sauvegarder sans titre", async () => {
    // On espionne l’appel à Alert.alert pour vérifier qu’il est déclenché
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    
    const { getByDisplayValue, getByText } = render(<EditNotePage />);

    // On attend que les données soient bien affichées
    await waitFor(() => getByDisplayValue("Note de test"));

    // On simule l’effacement du titre
    fireEvent.changeText(getByDisplayValue("Note de test"), "");

    // On simule un clic sur "Mettre à jour"
    fireEvent.press(getByText("Mettre à jour"));

    // On vérifie que l’alerte s’est bien déclenchée
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Validation", "Le titre est requis.");
    });
  });

  // Test : la note est bien mise à jour via une requête PUT
  it("met à jour la note correctement", async () => {
    // On mocke la requête PUT
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Note mise à jour avec succès" }),
    });

    const { getByDisplayValue, getByText } = render(<EditNotePage />);

    // On attend que les données soient bien chargées
    await waitFor(() => getByDisplayValue("Note de test"));

    // On change les champs titre et contenu
    fireEvent.changeText(getByDisplayValue("Note de test"), "Nouveau titre");
    fireEvent.changeText(getByDisplayValue("Contenu de la note"), "Nouveau contenu");

    // On clique sur "Mettre à jour"
    fireEvent.press(getByText("Mettre à jour"));

    // On vérifie que la bonne requête PUT a bien été envoyée
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notes/1"),
        expect.objectContaining({
          method: "PUT",
          headers: expect.any(Object),
          body: JSON.stringify({
            title: "Nouveau titre",
            content: "Nouveau contenu",
            categories: [1], // ID de la catégorie sélectionnée
          }),
        })
      );
    });
  });
});
