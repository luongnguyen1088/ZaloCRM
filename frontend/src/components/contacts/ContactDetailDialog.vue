<template>
  <v-dialog v-model="show" max-width="760" persistent scrollable>
    <v-card class="contact-dialog-card">
      <v-card-title class="d-flex align-center px-6 pt-5 pb-4">
        <div>
          <div class="text-h6 font-weight-bold">{{ isNew ? 'Them khach hang' : 'Chi tiet khach hang' }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ isNew ? 'Tao ho so CRM moi' : (props.contact?.fullName || 'Ho so khach hang') }}
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="px-6 py-5">
        <v-card
          v-if="!isNew && props.contact"
          class="contact-context-card mb-5"
          elevation="0"
        >
          <v-card-text class="pa-4">
            <div class="text-overline font-weight-bold text-medium-emphasis mb-3">Ngu canh ket noi</div>
            <div class="d-flex flex-wrap ga-2">
              <v-chip v-if="props.contact.source" :color="sourceColor(props.contact.source)" variant="tonal">
                Nguon: {{ sourceLabel(props.contact.source) }}
              </v-chip>
              <v-chip
                v-if="props.contact.primaryChannel"
                :color="channelColor(props.contact.primaryChannel.channelType)"
                variant="tonal"
              >
                Kenh chinh: {{ channelLabel(props.contact.primaryChannel) }}
              </v-chip>
              <v-chip v-if="props.contact.connectedChannels?.length" variant="outlined">
                {{ props.contact.connectedChannels.length }} kenh da tung tiep xuc
              </v-chip>
            </div>

            <div
              v-if="props.contact.connectedChannels?.length"
              class="d-flex flex-wrap ga-2 mt-3"
            >
              <v-chip
                v-for="channel in props.contact.connectedChannels"
                :key="channel.id"
                size="small"
                variant="outlined"
                :color="channelColor(channel.channelType)"
              >
                {{ channelLabel(channel) }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.fullName" label="Ho va ten" :rules="[required]" />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field v-model="form.phone" label="So dien thoai" />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field v-model="form.email" label="Email" type="email" />
          </v-col>

          <v-col cols="12" sm="6">
            <v-select
              v-model="form.source"
              :items="SOURCE_OPTIONS"
              item-title="text"
              item-value="value"
              label="Nguon"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-select
              v-model="form.status"
              :items="STATUS_OPTIONS"
              item-title="text"
              item-value="value"
              label="Trang thai"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.nextAppointmentDate"
              label="Ngay tai kham"
              type="date"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.firstContactDate"
              label="Ngay tiep nhan"
              type="date"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-combobox
              v-model="form.tags"
              label="Tags"
              multiple
              chips
              closable-chips
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="form.notes"
              label="Ghi chu"
              rows="3"
              auto-grow
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-6 py-4">
        <v-btn
          v-if="!isNew"
          color="error"
          variant="text"
          :loading="deleting"
          @click="onDelete"
        >
          Xoa
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">Huy</v-btn>
        <v-btn color="primary" :loading="saving" @click="onSave">Luu</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Contact } from '@/composables/use-contacts';
import { SOURCE_OPTIONS, STATUS_OPTIONS, useContacts } from '@/composables/use-contacts';

const props = defineProps<{
  modelValue: boolean;
  contact: Contact | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [contact: Contact];
  deleted: [id: string];
}>();

const { saving, deleting, createContact, updateContact, deleteContact } = useContacts();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const isNew = computed(() => !props.contact?.id);

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  nextAppointmentDate: string;
  firstContactDate: string;
  notes: string;
  tags: string[];
}

const form = ref<FormState>(emptyForm());

function emptyForm(): FormState {
  return {
    fullName: '',
    phone: '',
    email: '',
    source: '',
    status: '',
    nextAppointmentDate: '',
    firstContactDate: '',
    notes: '',
    tags: [],
  };
}

watch(() => props.contact, (c) => {
  if (c) {
    form.value = {
      fullName: c.fullName ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      source: c.source ?? '',
      status: c.status ?? '',
      nextAppointmentDate: c.nextAppointment ? new Date(c.nextAppointment).toISOString().split('T')[0] : '',
      firstContactDate: c.firstContactDate ? new Date(c.firstContactDate).toISOString().split('T')[0] : '',
      notes: c.notes ?? '',
      tags: c.tags ?? [],
    };
  } else {
    form.value = emptyForm();
  }
}, { immediate: true, deep: true });

function required(v: string) {
  return !!v || 'Bat buoc';
}

function sourceColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (['fb', 'facebook'].includes(normalized)) return 'blue';
  if (normalized === 'zalo') return 'cyan';
  if (['tt', 'tiktok'].includes(normalized)) return 'pink';
  if (['gt', 'referral'].includes(normalized)) return 'deep-orange';
  return 'grey';
}

function sourceLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  const option = SOURCE_OPTIONS.find((item) => item.value === normalized);
  if (option) return option.text;
  if (['fb', 'facebook'].includes(normalized)) return 'Facebook';
  if (normalized === 'zalo') return 'Zalo';
  if (['tt', 'tiktok'].includes(normalized)) return 'TikTok';
  if (['gt', 'referral'].includes(normalized)) return 'Gioi thieu';
  if (['cn', 'personal'].includes(normalized)) return 'Ca nhan';
  return value;
}

function channelColor(channelType: string) {
  return channelType === 'facebook' ? 'blue' : 'cyan';
}

function channelLabel(channel: NonNullable<Contact['primaryChannel']>) {
  const prefix = channel.channelType === 'facebook' ? 'Fanpage' : 'Zalo';
  return `${prefix} • ${channel.displayName || channel.platformId || 'Kenh ket noi'}`;
}

async function onSave() {
  const payload: Partial<Contact> = {
    fullName: form.value.fullName || null,
    phone: form.value.phone || null,
    email: form.value.email || null,
    source: form.value.source || null,
    status: form.value.status || null,
    nextAppointment: form.value.nextAppointmentDate
      ? new Date(form.value.nextAppointmentDate + 'T00:00:00').toISOString()
      : null,
    firstContactDate: form.value.firstContactDate
      ? new Date(form.value.firstContactDate + 'T00:00:00').toISOString()
      : null,
    notes: form.value.notes || null,
    tags: form.value.tags,
  };

  let result: Contact | null;
  if (isNew.value) {
    result = await createContact(payload);
  } else {
    result = await updateContact(props.contact!.id, payload);
  }
  if (result) {
    emit('saved', result);
    close();
  }
}

async function onDelete() {
  if (!props.contact?.id) return;
  const ok = await deleteContact(props.contact.id);
  if (ok) {
    emit('deleted', props.contact.id);
    close();
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.contact-dialog-card {
  border-radius: 24px !important;
}

.contact-context-card {
  border-radius: 18px !important;
  background: rgba(248, 250, 252, 0.9) !important;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
</style>
