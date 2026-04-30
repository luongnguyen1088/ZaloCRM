<template>
  <div class="mobile-contacts">
    <section class="mobile-contacts__hero">
      <div class="mobile-contacts__hero-top">
        <div>
          <div class="text-overline font-weight-bold text-medium-emphasis">CRM khach hang</div>
          <h1 class="text-h5 font-weight-bold mb-1">Khach hang</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ total.toLocaleString('vi-VN') }} ho so • {{ interestedCount }} lead dang nong
          </p>
        </div>

        <v-btn
          variant="tonal"
          color="primary"
          rounded="pill"
          prepend-icon="mdi-content-duplicate"
          size="small"
          @click="refreshDuplicates"
        >
          Trung lap
        </v-btn>
      </div>

      <v-text-field
        v-model="filters.search"
        placeholder="Tim khach hang..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        rounded="xl"
        class="mt-4"
        @update:model-value="onSearch"
      />

      <div class="mobile-contacts__chips mt-4">
        <v-chip
          :color="filters.status === '' ? 'primary' : undefined"
          :variant="filters.status === '' ? 'flat' : 'outlined'"
          size="small"
          @click="toggleStatus('')"
        >
          Tat ca
        </v-chip>
        <v-chip
          v-for="status in STATUS_OPTIONS"
          :key="status.value"
          :color="filters.status === status.value ? statusColor(status.value) : undefined"
          :variant="filters.status === status.value ? 'flat' : 'outlined'"
          size="small"
          @click="toggleStatus(status.value)"
        >
          {{ status.text }}
        </v-chip>
      </div>
    </section>

    <section class="mobile-contacts__summary">
      <div class="summary-pill">
        <span class="summary-pill__label">Quan tam</span>
        <strong>{{ interestedCount }}</strong>
      </div>
      <div class="summary-pill">
        <span class="summary-pill__label">Sap hen</span>
        <strong>{{ followUpCount }}</strong>
      </div>
      <div class="summary-pill">
        <span class="summary-pill__label">Im lang</span>
        <strong>{{ staleCount }}</strong>
      </div>
    </section>

    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else class="mobile-contacts__list">
      <v-card
        v-for="contact in contacts"
        :key="contact.id"
        class="contact-mobile-card"
        elevation="0"
        rounded="xl"
        @click="openContact(contact)"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-center">
            <v-avatar size="48" class="mr-3 contact-mobile-card__avatar">
              <v-img v-if="contact.avatarUrl" :src="contact.avatarUrl" />
              <v-icon v-else size="22">mdi-account</v-icon>
            </v-avatar>

            <div class="flex-grow-1 min-w-0">
              <div class="text-body-1 font-weight-bold text-truncate">
                {{ contact.fullName || 'Chua dat ten' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ contact.phone || 'Chua co SDT' }}
              </div>
            </div>

            <v-chip
              v-if="contact.status"
              :color="statusColor(contact.status)"
              size="x-small"
              variant="tonal"
            >
              {{ statusLabel(contact.status) }}
            </v-chip>
          </div>

          <div class="d-flex flex-wrap ga-2 mt-4">
            <v-chip v-if="contact.source" size="x-small" variant="tonal" :color="sourceColor(contact.source)">
              {{ sourceLabel(contact.source) }}
            </v-chip>
            <v-chip v-if="contact.primaryChannel" size="x-small" variant="tonal" :color="channelColor(contact.primaryChannel.channelType)">
              {{ channelTypeLabel(contact.primaryChannel.channelType) }} • {{ contact.primaryChannel.displayName || contact.primaryChannel.platformId || 'Kenh ket noi' }}
            </v-chip>
            <v-chip size="x-small" variant="tonal" :color="scoreColor(contact.leadScore)">
              Score {{ contact.leadScore ?? 0 }}
            </v-chip>
            <v-chip size="x-small" variant="outlined">
              {{ contact._count?.conversations ?? 0 }} hoi thoai
            </v-chip>
          </div>

          <div class="d-flex align-center justify-space-between mt-4 text-caption text-medium-emphasis">
            <span>{{ contact.nextAppointment ? `Hen ${formatDate(contact.nextAppointment)}` : 'Chua co lich hen' }}</span>
            <span>{{ contact.lastActivity ? relativeTime(contact.lastActivity) : 'Chua co hoat dong' }}</span>
          </div>
        </v-card-text>
      </v-card>

      <div v-if="contacts.length === 0" class="text-center py-10 text-medium-emphasis">
        Khong tim thay khach hang phu hop
      </div>
    </div>

    <v-btn
      icon
      color="primary"
      size="large"
      class="mobile-contacts__fab"
      @click="openCreate"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <ContactDetailDialog
      v-model="showDialog"
      :contact="selectedContact"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ContactDetailDialog from '@/components/contacts/ContactDetailDialog.vue';
import { useContacts, STATUS_OPTIONS, useContactIntelligence, SOURCE_OPTIONS } from '@/composables/use-contacts';
import type { Contact } from '@/composables/use-contacts';

const { contacts, total, loading, filters, fetchContacts } = useContacts();
const { fetchDuplicateGroups } = useContactIntelligence();

const showDialog = ref(false);
const selectedContact = ref<Contact | null>(null);

const interestedCount = computed(() => contacts.value.filter((contact) => contact.status === 'interested' || (contact.leadScore ?? 0) >= 70).length);

const followUpCount = computed(() => {
  const now = Date.now();
  const nextWeek = now + 7 * 24 * 60 * 60 * 1000;
  return contacts.value.filter((contact) => {
    if (!contact.nextAppointment) return false;
    const time = new Date(contact.nextAppointment).getTime();
    return time >= now && time <= nextWeek;
  }).length;
});

const staleCount = computed(() => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return contacts.value.filter((contact) => !contact.lastActivity || new Date(contact.lastActivity).getTime() < sevenDaysAgo).length;
});

function statusColor(status: string) {
  const map: Record<string, string> = {
    new: 'grey',
    contacted: 'blue',
    interested: 'orange',
    converted: 'success',
    lost: 'error',
  };
  return map[status] ?? 'grey';
}

function statusLabel(value: string) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.text ?? value;
}

function sourceLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  const option = SOURCE_OPTIONS.find((item) => item.value === normalized);
  if (option) return option.text;
  if (['fb', 'facebook'].includes(normalized)) return 'Facebook';
  if (['tt', 'tiktok'].includes(normalized)) return 'TikTok';
  if (['gt', 'referral'].includes(normalized)) return 'Gioi thieu';
  if (['cn', 'personal'].includes(normalized)) return 'Ca nhan';
  return value;
}

function sourceColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (['fb', 'facebook'].includes(normalized)) return 'blue';
  if (normalized === 'zalo') return 'cyan';
  if (['tt', 'tiktok'].includes(normalized)) return 'pink';
  if (['gt', 'referral'].includes(normalized)) return 'deep-orange';
  return 'grey';
}

function channelTypeLabel(channelType: string) {
  return channelType === 'facebook' ? 'Fanpage' : 'Zalo';
}

function channelColor(channelType: string) {
  return channelType === 'facebook' ? 'blue' : 'cyan';
}

function scoreColor(score: number) {
  if (score >= 70) return 'success';
  if (score >= 40) return 'orange';
  return 'error';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN');
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (hours < 24) return `${Math.max(hours, 1)} gio truoc`;
  if (days === 1) return 'Hom qua';
  return `${days} ngay truoc`;
}

function toggleStatus(value: string) {
  filters.status = filters.status === value ? '' : value;
  fetchContacts();
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function onSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchContacts(), 260);
}

function openContact(contact: Contact) {
  selectedContact.value = contact;
  showDialog.value = true;
}

function openCreate() {
  selectedContact.value = null;
  showDialog.value = true;
}

function onSaved() {
  fetchContacts();
}

function onDeleted() {
  fetchContacts();
}

async function refreshDuplicates() {
  await fetchDuplicateGroups();
}

onMounted(() => fetchContacts());
onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>

<style scoped>
.mobile-contacts {
  padding: 12px;
  padding-bottom: 96px;
}

.mobile-contacts__hero {
  padding: 18px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 32%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.06);
}

.mobile-contacts__hero-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.mobile-contacts__chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.mobile-contacts__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 16px;
}

.summary-pill {
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.08);
  text-align: center;
}

.summary-pill__label {
  display: block;
  font-size: 0.72rem;
  color: rgba(15, 23, 42, 0.62);
  margin-bottom: 4px;
}

.mobile-contacts__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-mobile-card {
  border: 1px solid rgba(15, 23, 42, 0.08) !important;
  background: rgba(255, 255, 255, 0.96) !important;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.contact-mobile-card__avatar {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(148, 163, 184, 0.12);
}

.mobile-contacts__fab {
  position: fixed;
  right: 18px;
  bottom: 88px;
  z-index: 50;
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.35);
}
</style>
