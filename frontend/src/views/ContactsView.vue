<template>
  <MobileContactView v-if="isMobile" />

  <div v-else class="contacts-view">
    <section class="contacts-hero mb-6">
      <div class="contacts-hero__content">
        <div class="contacts-hero__badge">
          <v-icon size="18">mdi-account-group-outline</v-icon>
          <span>CRM khach hang</span>
        </div>
        <h1 class="text-h4 font-weight-bold mb-2">Khach hang</h1>
        <p class="text-body-1 text-medium-emphasis mb-0 contacts-hero__subtitle">
          Theo doi lead moi, uu tien cham soc, va mo nhanh ho so khach hang co tin hieu chuyen doi tot.
        </p>
      </div>

      <div class="contacts-hero__actions">
        <v-btn
          variant="outlined"
          rounded="xl"
          prepend-icon="mdi-content-duplicate"
          class="text-none"
          @click="showDuplicateDialog = true"
        >
          Trung lap
          <v-badge
            v-if="duplicateTotal > 0"
            :content="duplicateTotal"
            color="error"
            inline
          />
        </v-btn>

        <v-btn color="primary" rounded="xl" prepend-icon="mdi-plus" class="text-none elevation-4" @click="openCreate">
          Them khach hang
        </v-btn>
      </div>
    </section>

    <v-row class="mb-1">
      <v-col cols="12" md="6" xl="3">
        <v-card class="metric-card metric-card--primary" elevation="0">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <div class="text-overline metric-label">Tong dang hien thi</div>
                <div class="text-h4 font-weight-bold">{{ total.toLocaleString('vi-VN') }}</div>
              </div>
              <div class="metric-icon">
                <v-icon color="primary" size="26">mdi-database-eye-outline</v-icon>
              </div>
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ contacts.length }} ho so trong trang hien tai
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" xl="3">
        <v-card class="metric-card" elevation="0">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <div class="text-overline metric-label">Lead quan tam</div>
                <div class="text-h4 font-weight-bold">{{ interestedCount }}</div>
              </div>
              <div class="metric-icon metric-icon--warm">
                <v-icon color="orange-darken-2" size="26">mdi-fire-circle</v-icon>
              </div>
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Trang thai <strong>Quan tam</strong> hoac diem lead tu 70 tro len
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" xl="3">
        <v-card class="metric-card" elevation="0">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <div class="text-overline metric-label">Can follow-up</div>
                <div class="text-h4 font-weight-bold">{{ followUpCount }}</div>
              </div>
              <div class="metric-icon metric-icon--info">
                <v-icon color="blue-darken-2" size="26">mdi-calendar-clock-outline</v-icon>
              </div>
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Co lich hen hoac tai kham trong 7 ngay toi
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" xl="3">
        <v-card class="metric-card" elevation="0">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <div class="text-overline metric-label">Lau chua cham</div>
                <div class="text-h4 font-weight-bold">{{ staleCount }}</div>
              </div>
              <div class="metric-icon metric-icon--danger">
                <v-icon color="error" size="26">mdi-weather-night</v-icon>
              </div>
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Khong co hoat dong hoac da yen lang tren 7 ngay
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <ContactFilters
      :filters="filters"
      :total="total"
      :loading="loading"
      :active-filter-count="activeFilterCount"
      @search="onFilterChange"
      @reset="onResetFilters"
    />

    <v-card class="table-shell" elevation="0">
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="contacts"
          :loading="loading"
          :items-per-page="pagination.limit"
          :items-length="total"
          item-value="id"
          hover
          density="comfortable"
          @click:row="onRowClick"
          @update:page="onPageChange"
        >
          <template #item.fullName="{ item }">
            <div class="contact-cell d-flex align-center py-2">
              <v-avatar size="46" class="mr-3 contact-cell__avatar">
                <v-img v-if="item.avatarUrl" :src="item.avatarUrl" />
                <v-icon v-else size="22">mdi-account</v-icon>
              </v-avatar>

              <div class="contact-cell__content">
                <div class="font-weight-bold text-body-1 text-truncate">{{ item.fullName || 'Chua dat ten' }}</div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ item.phone || 'Chua co SDT' }}
                  <span v-if="item.email"> • {{ item.email }}</span>
                </div>
                <div class="d-flex flex-wrap ga-1 mt-2">
                  <v-chip v-if="item.primaryChannel" size="x-small" variant="tonal" :color="channelColor(item.primaryChannel.channelType)">
                    {{ channelBadge(item.primaryChannel) }}
                  </v-chip>
                  <v-chip size="x-small" variant="tonal" color="primary">
                    {{ item._count?.conversations ?? 0 }} hoi thoai
                  </v-chip>
                  <v-chip size="x-small" variant="tonal" color="secondary">
                    {{ item._count?.appointments ?? 0 }} lich hen
                  </v-chip>
                  <v-chip v-for="tag in (item.tags || []).slice(0, 2)" :key="tag" size="x-small" variant="outlined">
                    {{ tag }}
                  </v-chip>
                </div>
              </div>
            </div>
          </template>

          <template #item.source="{ item }">
            <v-chip v-if="item.source" :color="sourceColor(item.source)" size="small" variant="tonal" class="font-weight-medium">
              {{ sourceLabel(item.source) }}
            </v-chip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template #item.primaryChannel="{ item }">
            <div v-if="item.primaryChannel">
              <v-chip :color="channelColor(item.primaryChannel.channelType)" size="small" variant="tonal" class="font-weight-medium mb-1">
                {{ channelTypeLabel(item.primaryChannel.channelType) }}
              </v-chip>
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ item.primaryChannel.displayName || item.primaryChannel.platformId || 'Kenh da ket noi' }}
              </div>
            </div>
            <span v-else class="text-medium-emphasis">Chua co</span>
          </template>

          <template #item.status="{ item }">
            <v-chip
              v-if="item.status"
              :color="statusColor(item.status)"
              size="small"
              variant="tonal"
              class="font-weight-medium"
            >
              {{ statusLabel(item.status) }}
            </v-chip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template #item.nextAppointment="{ item }">
            <div v-if="item.nextAppointment">
              <div class="font-weight-medium">{{ formatDate(item.nextAppointment) }}</div>
              <div class="text-caption text-medium-emphasis">{{ appointmentHint(item.nextAppointment) }}</div>
            </div>
            <span v-else class="text-medium-emphasis">Chua co lich</span>
          </template>

          <template #item.assignedUser="{ item }">
            <div v-if="item.assignedUser" class="text-body-2">
              <div class="font-weight-medium">{{ item.assignedUser.fullName }}</div>
              <div class="text-caption text-medium-emphasis">Dang phu trach</div>
            </div>
            <span v-else class="text-medium-emphasis">Chua giao</span>
          </template>

          <template #item.leadScore="{ item }">
            <div class="score-cell">
              <v-chip :color="scoreColor(item.leadScore)" size="small" variant="flat" class="font-weight-bold mb-2">
                {{ item.leadScore ?? 0 }}
              </v-chip>
              <v-progress-linear
                :model-value="Math.min(item.leadScore ?? 0, 100)"
                :color="scoreColor(item.leadScore)"
                rounded
                height="6"
              />
            </div>
          </template>

          <template #item.lastActivity="{ item }">
            <div v-if="item.lastActivity">
              <div class="font-weight-medium">{{ relativeTime(item.lastActivity) }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatDateTime(item.lastActivity) }}</div>
            </div>
            <span v-else class="text-medium-emphasis">Chua ghi nhan</span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex justify-end ga-1">
              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="text"
                color="medium-emphasis"
                :disabled="!item.phone"
                @click.stop="copyPhone(item)"
              />
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                color="primary"
                @click.stop="openContact(item)"
              />
            </div>
          </template>

          <template #no-data>
            <div class="empty-state py-12">
              <v-avatar size="72" color="grey-lighten-4" class="mb-4">
                <v-icon size="34" color="grey-darken-1">mdi-account-search-outline</v-icon>
              </v-avatar>
              <div class="text-h6 font-weight-bold mb-2">Chua tim thay khach hang phu hop</div>
              <div class="text-body-2 text-medium-emphasis mb-5">
                Thu doi bo loc hoac them khach hang moi de bat dau quan ly pipeline.
              </div>
              <div class="d-flex justify-center ga-2">
                <v-btn variant="tonal" color="primary" rounded="xl" @click="onResetFilters">Xoa bo loc</v-btn>
                <v-btn color="primary" rounded="xl" @click="openCreate">Them khach hang</v-btn>
              </div>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <ContactDetailDialog
      v-model="showDialog"
      :contact="selectedContact"
      @saved="onSaved"
      @deleted="onDeleted"
    />

    <DuplicateReviewDialog
      v-model="showDuplicateDialog"
      @merged="onDuplicateMerged"
    />

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500" rounded="pill">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ContactFilters from '@/components/contacts/ContactFilters.vue';
import ContactDetailDialog from '@/components/contacts/ContactDetailDialog.vue';
import DuplicateReviewDialog from '@/components/contacts/DuplicateReviewDialog.vue';
import { useContacts, useContactIntelligence, SOURCE_OPTIONS, STATUS_OPTIONS } from '@/composables/use-contacts';
import type { Contact } from '@/composables/use-contacts';
import MobileContactView from '@/views/MobileContactView.vue';
import { useMobile } from '@/composables/use-mobile';

const { isMobile } = useMobile();
const { contacts, total, loading, filters, pagination, fetchContacts, resetFilters } = useContacts();
const { duplicateTotal, fetchDuplicateGroups } = useContactIntelligence();

const showDialog = ref(false);
const showDuplicateDialog = ref(false);
const selectedContact = ref<Contact | null>(null);
const snack = ref({ show: false, text: '', color: 'success' });

const headers: any[] = [
  { title: 'Khach hang', key: 'fullName', sortable: false, width: '340px' },
  { title: 'Nguon', key: 'source', sortable: false, width: '120px' },
  { title: 'Kenh ket noi', key: 'primaryChannel', sortable: false, width: '180px' },
  { title: 'Trang thai', key: 'status', sortable: false, width: '130px' },
  { title: 'Tai kham', key: 'nextAppointment', sortable: true, width: '160px' },
  { title: 'Phu trach', key: 'assignedUser', sortable: false, width: '150px' },
  { title: 'Lead score', key: 'leadScore', sortable: true, width: '130px' },
  { title: 'Hoat dong gan nhat', key: 'lastActivity', sortable: true, width: '170px' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '90px' },
];

const activeFilterCount = computed(() => [filters.search, filters.source, filters.status].filter(Boolean).length);

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

function normalizeSource(value: string) {
  return value.trim().toLowerCase();
}

function sourceLabel(value: string) {
  const normalized = normalizeSource(value);
  const option = SOURCE_OPTIONS.find((item) => item.value === normalized);
  if (option) return option.text;
  if (['fb', 'facebook'].includes(normalized)) return 'Facebook';
  if (['tt', 'tiktok'].includes(normalized)) return 'TikTok';
  if (['gt', 'referral'].includes(normalized)) return 'Gioi thieu';
  if (['cn', 'personal'].includes(normalized)) return 'Ca nhan';
  return value;
}

function sourceColor(value: string) {
  const normalized = normalizeSource(value);
  if (['fb', 'facebook'].includes(normalized)) return 'blue';
  if (['zalo'].includes(normalized)) return 'cyan';
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

function channelBadge(channel: NonNullable<Contact['primaryChannel']>) {
  const channelName = channel.displayName || channel.platformId || 'Kenh ket noi';
  return `${channelTypeLabel(channel.channelType)} • ${channelName}`;
}

function statusLabel(value: string) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.text ?? value;
}

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN');
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function appointmentHint(date: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Qua ${Math.abs(diffDays)} ngay`;
  if (diffDays === 0) return 'Hom nay';
  if (diffDays === 1) return 'Ngay mai';
  return `${diffDays} ngay nua`;
}

function scoreColor(score: number) {
  if (score >= 70) return 'success';
  if (score >= 40) return 'orange';
  return 'error';
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${Math.max(minutes, 1)} phut truoc`;
  if (hours < 24) return `${hours} gio truoc`;
  if (days === 0) return 'Hom nay';
  if (days === 1) return 'Hom qua';
  return `${days} ngay truoc`;
}

let filterTimer: ReturnType<typeof setTimeout> | null = null;

function onFilterChange() {
  pagination.page = 1;
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    fetchContacts();
  }, 220);
}

function onResetFilters() {
  if (filterTimer) clearTimeout(filterTimer);
  resetFilters();
}

function onPageChange(page: number) {
  pagination.page = page;
  fetchContacts();
}

function openCreate() {
  selectedContact.value = null;
  showDialog.value = true;
}

function openContact(contact: Contact) {
  selectedContact.value = contact;
  showDialog.value = true;
}

function onRowClick(_event: Event, row: { item: Contact }) {
  selectedContact.value = row.item;
  showDialog.value = true;
}

async function copyPhone(contact: Contact) {
  if (!contact.phone) return;
  await navigator.clipboard.writeText(contact.phone);
  snack.value = { show: true, text: `Da sao chep SDT cua ${contact.fullName || 'khach hang'}`, color: 'success' };
}

function onSaved() {
  fetchContacts();
}

function onDeleted() {
  fetchContacts();
}

function onDuplicateMerged() {
  fetchContacts();
  fetchDuplicateGroups();
}

onMounted(() => {
  fetchContacts();
  fetchDuplicateGroups();
});

onUnmounted(() => {
  if (filterTimer) clearTimeout(filterTimer);
});
</script>

<style scoped>
.contacts-view {
  max-width: 1480px;
  margin: 0 auto;
  padding-bottom: 32px;
}

.contacts-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 28%),
    radial-gradient(circle at left center, rgba(16, 185, 129, 0.16), transparent 26%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 22px 55px rgba(15, 23, 42, 0.06);
}

.contacts-hero__content {
  max-width: 760px;
}

.contacts-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: rgb(var(--v-theme-primary));
  font-size: 0.82rem;
  font-weight: 700;
}

.contacts-hero__subtitle {
  max-width: 620px;
}

.contacts-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.metric-card {
  border-radius: 24px !important;
  border: 1px solid rgba(15, 23, 42, 0.08) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.05);
}

.metric-card--primary {
  background: linear-gradient(150deg, rgba(219, 234, 254, 0.95), rgba(255, 255, 255, 0.98)) !important;
}

.metric-label {
  letter-spacing: 0.08em;
}

.metric-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(37, 99, 235, 0.08);
}

.metric-icon--warm {
  background: rgba(249, 115, 22, 0.1);
}

.metric-icon--info {
  background: rgba(59, 130, 246, 0.1);
}

.metric-icon--danger {
  background: rgba(239, 68, 68, 0.1);
}

.table-shell {
  border-radius: 28px !important;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08) !important;
  background: rgba(255, 255, 255, 0.96) !important;
  box-shadow: 0 22px 55px rgba(15, 23, 42, 0.06);
}

.contact-cell__avatar {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(148, 163, 184, 0.12);
}

.contact-cell__content {
  min-width: 0;
}

.score-cell {
  min-width: 92px;
}

.empty-state {
  text-align: center;
}

@media (max-width: 960px) {
  .contacts-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .contacts-hero__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
