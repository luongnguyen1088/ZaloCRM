import { ref } from 'vue';
import { api } from '@/api';

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  expiresAt: string;
  createdAt: string;
}

export function useInvitations() {
  const invitations = ref<Invitation[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function fetchInvitations() {
    loading.value = true;
    error.value = '';
    try {
      const res = await api.get('/invitations');
      invitations.value = res.data.invitations;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Lỗi tải danh sách lời mời';
    } finally {
      loading.value = false;
    }
  }

  async function createInvitation(data: { email: string; role: string }) {
    loading.value = true;
    error.value = '';
    try {
      const res = await api.post('/invitations', data);
      await fetchInvitations();
      return { ok: true, debugLink: res.data.debugLink };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || 'Lỗi tạo lời mời' };
    } finally {
      loading.value = false;
    }
  }

  async function verifyInvitation(token: string) {
    try {
      const res = await api.get(`/invitations/verify/${token}`);
      return { ok: true, invitation: res.data };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || 'Lời mời không hợp lệ' };
    }
  }

  async function acceptInvitation(data: { token: string; fullName: string; password: any }) {
    try {
      await api.post('/invitations/accept', data);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || 'Lỗi kích hoạt tài khoản' };
    }
  }

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    createInvitation,
    verifyInvitation,
    acceptInvitation
  };
}
