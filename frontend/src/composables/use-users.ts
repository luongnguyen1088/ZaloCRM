/**
 * Composable for user/staff management API calls.
 * Provides CRUD operations scoped to the current org via JWT.
 */
import { ref } from 'vue';
import { api } from '@/api';

export interface OrgUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  teamId: string | null;
  createdAt: string;
  team?: { id: string; name: string } | null;
}

export function useUsers() {
  const users = ref<OrgUser[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function fetchUsers() {
    loading.value = true;
    error.value = '';
    try {
      const res = await api.get('/users');
      users.value = res.data.users;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'L?i t?i danh s�ch nh�n vi�n';
    } finally {
      loading.value = false;
    }
  }

  async function createUser(data: {
    email: string;
    fullName: string;
    password: string;
    role: string;
    teamId?: string;
  }): Promise<{ ok: boolean; error?: string }> {
    try {
      await api.post('/users', data);
      await fetchUsers();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || 'L?i t?o nh�n vi�n' };
    }
  }

  async function updateUser(
    id: string,
    data: Partial<{ fullName: string; email: string; role: string; teamId: string; isActive: boolean }>,
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      await api.put(`/users/${id}`, data);
      await fetchUsers();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || 'L?i c?p nh?t nh�n vi�n' };
    }
  }

  async function resetPassword(id: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await api.put(`/users/${id}/password`, { password });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || 'Lỗi đặt lại mật khẩu' };
    }
  }

  async function deleteUser(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || 'L?i x�a nh�n vi�n' };
    }
  }

  return { users, loading, error, fetchUsers, createUser, updateUser, resetPassword, deleteUser };
}
