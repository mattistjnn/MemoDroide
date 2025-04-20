// jest.setup.js
import 'react-native-gesture-handler/jestSetup';

// Mock pour expo-router
const mockRouter = {
    replace: jest.fn(),
    push: jest.fn()
};

jest.mock('expo-router', () => {
    const segments = [''];
    segments.isReady = true;

    return {
        useRouter: () => mockRouter,
        useSegments: () => segments,
        Link: () => 'Link',
        Stack: {
            Screen: () => 'Stack.Screen'
        },
        Tabs: {
            Screen: () => 'Tabs.Screen'
        }
    };
});

// Mock pour expo-secure-store
jest.mock('expo-secure-store', () => {
    const mockStore = {};

    return {
        getItemAsync: jest.fn((key) => Promise.resolve(mockStore[key] || null)),
        setItemAsync: jest.fn((key, value) => {
            mockStore[key] = value;
            return Promise.resolve();
        }),
        deleteItemAsync: jest.fn((key) => {
            delete mockStore[key];
            return Promise.resolve();
        }),
        AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK'
    };
});

// Mock de fetch global
global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({})
});

// Désactive les avertissements console
jest.spyOn(console, 'warn').mockImplementation(() => { });
jest.spyOn(console, 'error').mockImplementation(() => { });