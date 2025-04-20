module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect'
    ],
    transformIgnorePatterns: [
        "node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-secure-store|twrnc|@sentry|expo-router)"],

    // Alias pour la résolution des chemins
    moduleNameMapper: {
        '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
        '^@/auth/(.*)$': '<rootDir>/app/auth/$1',
        '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
        '^@/(.*)$': '<rootDir>/$1'
    },

    testMatch: [
        '**/__tests__/**/*.ts?(x)',
        '**/?(*.)+(spec|test).ts?(x)'
    ],

    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}