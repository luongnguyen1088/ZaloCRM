import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('@/views/RegisterView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/accept-invite',
    name: 'AcceptInvite',
    component: () => import('@/views/AcceptInviteView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/facebook/callback',
    name: 'FacebookOAuthCallback',
    component: () => import('@/views/FacebookOAuthCallbackView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/privacy-policy',
    name: 'PrivacyPolicy',
    component: () => import('@/views/PrivacyPolicyView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/data-deletion',
    name: 'DataDeletion',
    component: () => import('@/views/DataDeletionView.vue'),
    meta: { layout: 'auth' },
  },
  {
    path: '/',
    name: 'LandingPage',
    component: () => import('@/views/LandingPageView.vue'),
    meta: { layout: 'public' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/AnalyticsHubView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/ChatView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: () => import('@/views/ContactsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/zalo-accounts',
    name: 'ZaloAccounts',
    component: () => import('@/views/ZaloAccountsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/appointments',
    name: 'Appointments',
    component: () => import('@/views/AppointmentsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/api-settings',
    redirect: '/settings?tab=developer'
  },
  {
    path: '/integrations',
    redirect: '/settings?tab=integrations'
  },
  {
    path: '/ai-training',
    name: 'AiTraining',
    component: () => import('@/views/AiKnowledgeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ai-guide',
    name: 'AiGuide',
    component: () => import('@/views/AiGuideView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/usage',
    name: 'UsageDashboard',
    component: () => import('@/views/UsageDashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('@/views/AdminOrdersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/automation',
    name: 'Automation',
    component: () => import('@/views/AutomationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('@/views/billing/PricingPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresAdmin && !authStore.isSuperAdmin) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
