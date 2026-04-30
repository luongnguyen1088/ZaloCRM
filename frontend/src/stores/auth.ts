import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/index';

interface Organization {
  id: string;
  name: string;
}

interface Membership {
  id: string;
  orgId: string;
  role: string;
  isActive: boolean;
  org: Organization;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string; // Active role
  orgId: string; // Active org
  org?: Organization; // Active org details
  isSystemAdmin: boolean;
  memberships: Membership[];
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref(localStorage.getItem('token') || '');
  const needsSetup = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isOwner = computed(() => user.value?.role === 'owner');
  const isSuperAdmin = computed(() => user.value?.isSystemAdmin || false);
  const isAdmin = computed(() => ['owner', 'admin'].includes(user.value?.role || ''));

  async function checkSetup() {
    const res = await api.get('/setup/status');
    needsSetup.value = res.data.needsSetup;
    return res.data.needsSetup;
  }

  async function register(data: { orgName: string; fullName: string; email: string; password: string }) {
    const res = await api.post('/auth/register', data);
    setAuth(res.data.token, res.data.user);
  }

  async function setup(data: { orgName: string; fullName: string; email: string; password: string }) {
    return register(data);
  }

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    setAuth(res.data.token, res.data.user);
    await fetchProfile();
  }

  async function googleLogin(idToken: string) {
    const res = await api.post('/auth/google', { idToken });
    setAuth(res.data.token, res.data.user);
    await fetchProfile();
  }

  async function fetchProfile() {
    try {
      const res = await api.get('/profile');
      user.value = res.data;
    } catch {
      logout();
    }
  }

  async function switchOrg(orgId: string) {
    const res = await api.post(`/auth/switch-org/${orgId}`);
    setAuth(res.data.token, res.data.user);
    // Reload profile to get full details
    await fetchProfile();
    // Redirect to home
    window.location.href = '/dashboard';
  }

  async function createOrg(name: string) {
    const res = await api.post('/organizations', { name });
    // After creation, switch to the new one
    await switchOrg(res.data.id);
  }

  function setAuth(newToken: string, userData: any) {
    token.value = newToken;
    user.value = userData;
    localStorage.setItem('token', newToken);
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
  }

  async function init() {
    if (token.value) {
      await fetchProfile();
    }
  }

  async function forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email });
  }

  async function resetPassword(data: { token: string; password: string }) {
    return api.post('/auth/reset-password', data);
  }

  return { 
    user, 
    token, 
    needsSetup, 
    isAuthenticated, 
    isOwner, 
    isSuperAdmin,
    isAdmin, 
    checkSetup, 
    setup, 
    register, 
    login, 
    googleLogin, 
    forgotPassword,
    resetPassword,
    fetchProfile, 
    switchOrg,
    createOrg,
    logout, 
    init 
  };
});
