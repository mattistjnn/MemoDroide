// Import de React et des outils de test pour React Native
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Le composant qu’on teste : la page de création de note
import CreateNotePage from "@/app/notes/create";

// Import d'Alert pour tester les messages d’erreur affichés à l’utilisateur
import { Alert } from "react-native";

// ------------------------------
// 🔶 1️⃣ MOCKS
// ------------------------------

// On simule la navigation de React Navigation
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({
        goBack: jest.fn(), // simule la fonction de retour
    }),
}));

// On simule SecureStore (récupération du token)
jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(() => Promise.resolve("fake-token")),
}));

// On espionne l’appel à Alert.alert (sans empêcher son exécution ici)
jest.spyOn(Alert, "alert");

// ------------------------------
// 🔶 2️⃣ SUITE DE TESTS
// ------------------------------

describe("📝 CreateNotePage", () => {

    // 🔸 Test : alerte si on essaie de créer une note sans titre
    it("affiche une alerte si l'on essaie de créer une note sans titre", async () => {

        // 4️⃣ On rend le composant CreateNotePage
        const { getByPlaceholderText, getByText } = render(<CreateNotePage />);

        // 5️⃣ On simule l'entrée de l'utilisateur : il écrit du contenu
        // mais laisse le champ "titre" vide
        fireEvent.changeText(getByPlaceholderText("Contenu de la note"), "Contenu test");

        // 6️⃣ Il clique sur le bouton "Créer la note"
        fireEvent.press(getByText("Créer la note"));

        // 7️⃣ On vérifie qu’une alerte est affichée avec le bon message
        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Validation", "Le titre ne peut pas être vide.");
        });
    });
});
