import { createRouter, createWebHistory } from "vue-router";

import LandingView from "../views/LandingView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import NotesView from "../views/NotesView.vue";
import { useAuthStore } from "../stores/useAuthStore.ts";
import SettingsView from "../views/SettingsView.vue";
import ArchiveView from "../views/ArchiveView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "landing",
			component: LandingView,
			meta: { hideLayout: true },
		},
		{
			path: "/login",
			name: "login",
			component: LoginView,
			meta: { hideLayout: true },
		},
		{
			path: "/register",
			name: "register",
			component: RegisterView,
			meta: { hideLayout: true },
		},
		{
			path: "/notes",
			name: "notes",
			component: NotesView,
			meta: { requiresAuth: true },
		},
		{
			path: "/archive",
			name: "archive",
			component: ArchiveView,
			meta: { requiresAuth: true },
		},
		{
			path: "/settings",
			name: "settings",
			component: SettingsView,
			meta: { requiresAuth: true },
		},
	],
});

router.beforeEach((to, _from, next) => {
	const authStore = useAuthStore();

	if (to.meta.requiresAuth && !authStore.isAuthenticated) {
		next("/");
	} else if (to.meta.hideLayout && authStore.isAuthenticated) {
		next("/notes");
	} else {
		next();
	}
});

export default router;
