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

	const logout = () => {
		user.value = null;
		localStorage.removeItem("paper_user");
	};

	return {
		user,
		isAuthenticated,
		setUser,
		logout,
	};
});
