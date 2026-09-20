import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface User {
	id: string;
	email: string;
	fullName: string;
}

export const useAuthStore = defineStore("auth", () => {
	const user = ref<User | null>(
		JSON.parse(localStorage.getItem("paper_user") || "null"),
	);

	const isAuthenticated = computed(() => !!user.value);

	const setUser = (userData: User) => {
		user.value = userData;
		localStorage.setItem("paper_user", JSON.stringify(userData));
	};

	const login = async (email: string, password: string): Promise<User> => {
		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});

		const data = await res.json();

		if (!res.ok) {
			throw new Error(data.error || "Error al iniciar sesión.");
		}

		setUser(data.user);
		return data.user;
	};

	const register = async (
		fullName: string,
		email: string,
		password: string,
	): Promise<User> => {
		const res = await fetch("/api/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ fullName, email, password }),
		});

		const data = await res.json();

		if (!res.ok) {
			throw new Error(data.error || "Error al registrar la cuenta.");
		}

		setUser(data.user);
		return data.user;
	};

	const logout = () => {
		user.value = null;
		localStorage.removeItem("paper_user");
	};

	return {
		user,
		isAuthenticated,
		setUser,
		login,
		register,
		logout,
	};
});
