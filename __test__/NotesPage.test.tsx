// Importation de React (nécessaire pour utiliser du JSX)
import React from 'react';

// Importation de la fonction de rendu et de l’utilitaire asynchrone waitFor pour les tests
import { render, waitFor } from '@testing-library/react-native';

// Importation du composant à tester
import NotesPage from '../app/(tabs)/index';

// Importation de SecureStore d'Expo pour le mocker
import * as SecureStore from 'expo-secure-store';

// On mocke SecureStore pour éviter les accès réels au stockage sécurisé pendant le test
jest.mock('expo-secure-store');

// On mocke expo-router pour intercepter les redirections (router.replace)
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Début de la suite de tests pour le composant NotesPage
describe('NotesPage', () => {
  // Avant chaque test, on réinitialise tous les mocks pour éviter des interférences
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Cas de test : vérifier que les titres des notes récupérées sont affichés
  it('affiche les titres des notes récupérées', async () => {
    // On simule la récupération d'un token via SecureStore
    SecureStore.getItemAsync = jest.fn().mockResolvedValueOnce('fake-token');

    // On mock l'API : 
    // 1er appel pour récupérer les catégories (vide ici)
    // 2e appel pour récupérer les notes
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 1, title: 'Note 1', content: 'Contenu 1', categories: [] },
            { id: 2, title: 'Note 2', content: 'Contenu 2', categories: [] },
          ],
        }),
      });

    // On rend le composant NotesPage dans l'environnement de test
    const { getByText } = render(<NotesPage />);

    // On attend que les notes soient rendues à l'écran
    await waitFor(() => {
      // Vérifie que les titres des deux notes sont présents
      expect(getByText('Note 1')).toBeTruthy();
      expect(getByText('Note 2')).toBeTruthy();
    });
  });
});
