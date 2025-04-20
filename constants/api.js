const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const API = {
    BASE: API_URL,
    NOTES: `${API_URL}/notes`,
    CATEGORIES: `${API_URL}/categories`,
    TASKS: `${API_URL}/tasks`
};