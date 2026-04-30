<template>
  <v-container fluid class="ai-guide pa-6">
    <div class="guide-hero mb-6">
      <div>
        <div class="text-overline font-weight-bold text-primary mb-2">AI Playbook</div>
        <h1 class="text-h4 font-weight-bold mb-2">Hướng dẫn cấu hình AI theo từng kênh</h1>
        <p class="text-body-1 text-medium-emphasis mb-0 guide-hero__copy">
          Dùng trang này để thiết lập AI khác nhau cho từng Fanpage hoặc tài khoản Zalo trong cùng một workspace,
          đặc biệt khi mỗi kênh là một brand hoặc một cách vận hành riêng.
        </p>
      </div>
      <div class="d-flex flex-wrap ga-3 mt-4">
        <v-btn color="primary" variant="flat" rounded="xl" to="/ai-training" prepend-icon="mdi-school-outline">
          Mở Đào tạo AI
        </v-btn>
        <v-btn color="secondary" variant="outlined" rounded="xl" to="/zalo-accounts" prepend-icon="mdi-cellphone-link">
          Xem kênh kết nối
        </v-btn>
      </div>
    </div>

    <v-row dense class="mb-6">
      <v-col v-for="card in overviewCards" :key="card.title" cols="12" md="4">
        <v-card class="overview-card" elevation="0" border>
          <div class="d-flex align-center ga-3 mb-4">
            <v-avatar :color="card.color" variant="tonal" size="46">
              <v-icon :icon="card.icon" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ card.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ card.subtitle }}</div>
            </div>
          </div>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ card.body }}</p>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="guide-section mb-6" elevation="0" border>
          <div class="section-head">
            <div class="text-overline font-weight-bold text-primary">Bước 1</div>
            <h2 class="text-h6 font-weight-bold mb-1">Hiểu phạm vi cấu hình AI</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Hệ thống hiện có 2 tầng cấu hình trong cùng một workspace: mặc định toàn workspace và override riêng cho từng kênh.
            </p>
          </div>

          <div class="info-grid">
            <v-card class="mini-panel" elevation="0" border>
              <div class="text-subtitle-2 font-weight-bold mb-2">Mặc định toàn workspace</div>
              <p class="text-body-2 text-medium-emphasis mb-3">
                Dùng làm lớp nền chung cho mọi kênh chưa có cấu hình riêng.
              </p>
              <v-chip size="small" color="primary" variant="tonal">Nên để rule chung</v-chip>
            </v-card>

            <v-card class="mini-panel" elevation="0" border>
              <div class="text-subtitle-2 font-weight-bold mb-2">Override theo kênh</div>
              <p class="text-body-2 text-medium-emphasis mb-3">
                Dùng khi từng Fanpage hoặc từng tài khoản Zalo có brand voice, sản phẩm, quy trình khác nhau.
              </p>
              <v-chip size="small" color="secondary" variant="tonal">Dùng cho multi-brand</v-chip>
            </v-card>
          </div>

          <v-alert variant="tonal" color="info" rounded="lg" class="mt-4">
            Nếu bạn đang vận hành nhiều brand, đừng để mọi thứ ở cấu hình mặc định. Chỉ giữ các quy tắc nền, còn persona và cách vận hành nên tách theo từng kênh.
          </v-alert>
        </v-card>

        <v-card class="guide-section mb-6" elevation="0" border>
          <div class="section-head">
            <div class="text-overline font-weight-bold text-primary">Bước 2</div>
            <h2 class="text-h6 font-weight-bold mb-1">Cách cấu hình cho từng kênh</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Đây là flow chuẩn để team vận hành không bị đè nhầm cấu hình giữa các Fanpage hoặc tài khoản Zalo.
            </p>
          </div>

          <div class="step-list">
            <v-card v-for="step in setupSteps" :key="step.title" class="step-card" elevation="0" border>
              <div class="d-flex ga-4">
                <v-avatar color="primary" variant="flat" size="34">{{ step.order }}</v-avatar>
                <div>
                  <div class="text-subtitle-2 font-weight-bold mb-1">{{ step.title }}</div>
                  <p class="text-body-2 text-medium-emphasis mb-0">{{ step.body }}</p>
                </div>
              </div>
            </v-card>
          </div>
        </v-card>

        <v-card class="guide-section mb-6" elevation="0" border>
          <div class="section-head">
            <div class="text-overline font-weight-bold text-primary">Bước 3</div>
            <h2 class="text-h6 font-weight-bold mb-1">Checklist cấu hình chuẩn</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Dưới đây là 3 checklist thực dụng nhất cho các mô hình vận hành phổ biến.
            </p>
          </div>

          <v-row dense>
            <v-col v-for="preset in presets" :key="preset.title" cols="12">
              <v-card class="preset-panel" elevation="0" border>
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ preset.title }}</div>
                    <div class="text-caption text-medium-emphasis">{{ preset.subtitle }}</div>
                  </div>
                  <v-chip :color="preset.color" variant="tonal" size="small">{{ preset.tag }}</v-chip>
                </div>

                <v-row dense>
                  <v-col cols="12" md="4">
                    <div class="check-group__title">Cá tính</div>
                    <v-list density="compact" class="bg-transparent pa-0">
                      <v-list-item v-for="item in preset.persona" :key="item" class="px-0">
                        <template #prepend>
                          <v-icon icon="mdi-check-circle-outline" size="16" color="primary" />
                        </template>
                        <v-list-item-title class="text-body-2">{{ item }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-col>

                  <v-col cols="12" md="4">
                    <div class="check-group__title">Tri thức</div>
                    <v-list density="compact" class="bg-transparent pa-0">
                      <v-list-item v-for="item in preset.knowledge" :key="item" class="px-0">
                        <template #prepend>
                          <v-icon icon="mdi-book-check-outline" size="16" color="secondary" />
                        </template>
                        <v-list-item-title class="text-body-2">{{ item }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-col>

                  <v-col cols="12" md="4">
                    <div class="check-group__title">Vận hành</div>
                    <v-list density="compact" class="bg-transparent pa-0">
                      <v-list-item v-for="item in preset.operations" :key="item" class="px-0">
                        <template #prepend>
                          <v-icon icon="mdi-robot-outline" size="16" color="success" />
                        </template>
                        <v-list-item-title class="text-body-2">{{ item }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-card>

        <v-card class="guide-section" elevation="0" border>
          <div class="section-head">
            <div class="text-overline font-weight-bold text-primary">Bước 4</div>
            <h2 class="text-h6 font-weight-bold mb-1">Lỗi vận hành thường gặp</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Đây là các lỗi khiến AI trả lời lẫn brand hoặc hành xử sai kênh dù phần mềm vẫn hoạt động bình thường.
            </p>
          </div>

          <v-row dense>
            <v-col v-for="risk in commonMistakes" :key="risk.title" cols="12" md="6">
              <v-card class="risk-card" elevation="0" border>
                <div class="text-subtitle-2 font-weight-bold mb-2">{{ risk.title }}</div>
                <p class="text-body-2 text-medium-emphasis mb-2">{{ risk.problem }}</p>
                <v-chip size="small" color="warning" variant="tonal">{{ risk.fix }}</v-chip>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="guide-section mb-6 sticky-panel" elevation="0" border>
          <div class="section-head mb-4">
            <div class="text-overline font-weight-bold text-primary">Checklist nhanh</div>
            <h2 class="text-h6 font-weight-bold mb-1">Trước khi bấm Lưu</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Kiểm tra 5 điểm này để tránh tạo override sai hoặc nạp nhầm knowledge.
            </p>
          </div>

          <v-list density="comfortable" class="bg-transparent pa-0">
            <v-list-item v-for="item in preSaveChecklist" :key="item" class="px-0">
              <template #prepend>
                <v-icon icon="mdi-checkbox-marked-circle-outline" color="primary" />
              </template>
              <v-list-item-title class="text-body-2">{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="guide-section mb-6" elevation="0" border>
          <div class="section-head mb-4">
            <div class="text-overline font-weight-bold text-primary">Khuyến nghị</div>
            <h2 class="text-h6 font-weight-bold mb-1">Cách chia tầng hợp lý</h2>
          </div>

          <v-list density="comfortable" class="bg-transparent pa-0">
            <v-list-item class="px-0">
              <template #prepend><v-icon icon="mdi-earth" color="primary" /></template>
              <v-list-item-title class="text-body-2 font-weight-medium">Toàn workspace</v-list-item-title>
              <v-list-item-subtitle>Ngôn ngữ, safety rule, stop-condition nền.</v-list-item-subtitle>
            </v-list-item>
            <v-list-item class="px-0">
              <template #prepend><v-icon icon="mdi-bullhorn-outline" color="secondary" /></template>
              <v-list-item-title class="text-body-2 font-weight-medium">Fanpage bán hàng</v-list-item-title>
              <v-list-item-subtitle>Persona, giá, khuyến mãi, auto-reply riêng.</v-list-item-subtitle>
            </v-list-item>
            <v-list-item class="px-0">
              <template #prepend><v-icon icon="mdi-lifebuoy" color="success" /></template>
              <v-list-item-title class="text-body-2 font-weight-medium">Kênh CSKH</v-list-item-title>
              <v-list-item-subtitle>Giọng bình tĩnh, follow-up ít hơn, ưu tiên handoff.</v-list-item-subtitle>
            </v-list-item>
            <v-list-item class="px-0">
              <template #prepend><v-icon icon="mdi-chat-processing-outline" color="info" /></template>
              <v-list-item-title class="text-body-2 font-weight-medium">Zalo cá nhân chốt đơn</v-list-item-title>
              <v-list-item-subtitle>Tự nhiên hơn, CTA rõ, knowledge thực chiến hơn.</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="guide-section cta-panel" elevation="0" border>
          <div class="text-overline font-weight-bold text-primary mb-2">Sẵn sàng cấu hình</div>
          <div class="text-h6 font-weight-bold mb-2">Đi thẳng vào AI Studio</div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Mở `Đào tạo AI`, chọn đúng `Phạm vi cấu hình AI`, rồi áp dụng checklist bên trên cho từng kênh.
          </p>
          <v-btn block color="primary" variant="flat" rounded="xl" to="/ai-training" prepend-icon="mdi-arrow-right">
            Cấu hình ngay
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const overviewCards = [
  {
    title: 'Mỗi kênh là một AI khác nhau',
    subtitle: 'Trong cùng một workspace',
    body: 'Bạn có thể cho từng Fanpage hoặc từng tài khoản Zalo dùng persona, tri thức và cách vận hành riêng mà không ảnh hưởng kênh khác.',
    icon: 'mdi-source-branch',
    color: 'primary',
  },
  {
    title: 'Mặc định chỉ là lớp nền',
    subtitle: 'Không phải nơi nhét toàn bộ logic',
    body: 'Giữ các quy tắc chung ở cấu hình mặc định. Những gì khác brand thật sự nên tách thành override theo kênh.',
    icon: 'mdi-layers-outline',
    color: 'secondary',
  },
  {
    title: 'Knowledge phải đi đúng kênh',
    subtitle: 'Tránh lẫn giá và chính sách',
    body: 'Khi thêm tri thức, luôn kiểm tra mục Áp dụng cho. Đây là lớp dễ gây nhầm brand nhất nếu đội vận hành thao tác ẩu.',
    icon: 'mdi-book-lock-open-outline',
    color: 'success',
  },
];

const setupSteps = [
  {
    order: 1,
    title: 'Mở trang Đào tạo AI và chọn Phạm vi cấu hình AI',
    body: 'Chọn “Mặc định toàn workspace” nếu bạn muốn chỉnh cấu hình gốc, hoặc chọn đúng Fanpage / tài khoản Zalo nếu muốn làm cấu hình riêng cho kênh đó.',
  },
  {
    order: 2,
    title: 'Cấu hình lớp Cá tính trước',
    body: 'Chọn mẫu phù hợp với brand rồi sửa lại prompt theo đúng cách xưng hô, mức độ chủ động, tone bán hàng và điều AI cần tránh.',
  },
  {
    order: 3,
    title: 'Nạp Tri thức đúng theo tài khoản áp dụng',
    body: 'Mỗi nhóm thông tin như giá, ship, đổi trả, bảo hành, bảng size, quy trình chốt đơn nên được lưu thành các mục tri thức rõ ràng và gắn đúng kênh.',
  },
  {
    order: 4,
    title: 'Thiết lập lớp Vận hành',
    body: 'Chọn auto hay hybrid, follow-up bao lâu, có tự extract lead hay không, khi nào AI phải dừng và nhường người thật.',
  },
  {
    order: 5,
    title: 'Dùng Trình giả lập AI để test',
    body: 'Luôn chọn đúng tài khoản trong simulator, hỏi thử các câu về giá, vận chuyển, chốt đơn và CSKH để chắc AI đang dùng đúng giọng và đúng dữ liệu.',
  },
];

const presets = [
  {
    title: 'Fanpage bán hàng',
    subtitle: 'Dùng cho inbox ads, page chốt đơn, volume chat cao',
    tag: 'Bán hàng',
    color: 'primary',
    persona: [
      'Ưu tiên “Chốt đơn nhanh” hoặc “Thân thiện tự nhiên”',
      'Giữ câu ngắn, có CTA rõ',
      'Không giải thích quá dài khi khách đã có ý định mua',
    ],
    knowledge: [
      'Bảng giá, combo, khuyến mãi hiện hành',
      'Chính sách ship, đổi trả, bảng size',
      'Kịch bản xử lý phản đối về giá',
    ],
    operations: [
      'Mode: auto hoặc hybrid tùy đội duyệt',
      'Follow-up: bật, nhưng giới hạn 1-2 lần',
      'Stop-condition: khiếu nại, đòi gặp người thật, ép giá quá sâu',
    ],
  },
  {
    title: 'Fanpage CSKH',
    subtitle: 'Dùng cho kênh hỗ trợ sau bán, đổi trả, bảo hành',
    tag: 'CSKH',
    color: 'success',
    persona: [
      'Ưu tiên “CSKH sau bán”',
      'Giọng bình tĩnh, có trách nhiệm',
      'Tập trung trấn an và hướng dẫn theo bước',
    ],
    knowledge: [
      'Quy trình đổi trả, bảo hành, tra đơn',
      'FAQ về lỗi sản phẩm và hỗ trợ sau mua',
      'Thông tin hotline và ca escalated',
    ],
    operations: [
      'Mode: hybrid nếu cần nhân viên duyệt',
      'Follow-up: thấp hoặc tắt nếu dễ gây khó chịu',
      'Stop-condition: khách bức xúc, yêu cầu quản lý, vấn đề pháp lý',
    ],
  },
  {
    title: 'Zalo cá nhân chốt đơn',
    subtitle: 'Dùng cho account tư vấn trực tiếp, closers hoặc chủ shop',
    tag: 'Zalo',
    color: 'secondary',
    persona: [
      'Ưu tiên “Thân thiện tự nhiên”',
      'Nói gần gũi như nhân viên thật',
      'Có thể mềm hơn fanpage nhưng vẫn giữ cấu trúc rõ',
    ],
    knowledge: [
      'Giá thực chiến, hàng sẵn, hàng hot',
      'Thông tin giao nhanh, upsell, combo',
      'Kịch bản chốt đơn theo số lượng, màu, size',
    ],
    operations: [
      'Mode: auto nếu chủ shop muốn phản hồi nhanh 24/7',
      'Follow-up: bật cho khách im lặng giữa chừng',
      'Auto extract info: nên bật để đẩy số điện thoại, địa chỉ vào CRM',
    ],
  },
];

const commonMistakes = [
  {
    title: 'Để tất cả tri thức ở “Tất cả tài khoản”',
    problem: 'AI dễ lẫn giá, chính sách hoặc sản phẩm giữa nhiều brand.',
    fix: 'Chỉ giữ tri thức nền ở toàn cục. Thông tin bán hàng nên gắn đúng kênh.',
  },
  {
    title: 'Override persona nhưng quên test simulator',
    problem: 'Prompt đã đổi nhưng chưa biết AI phản hồi có đúng tone và đúng brand không.',
    fix: 'Sau mỗi lần lưu, test lại ngay trong Trình giả lập AI với đúng tài khoản.',
  },
  {
    title: 'Dùng cùng một mode vận hành cho mọi kênh',
    problem: 'Kênh CSKH và kênh chốt đơn thường không nên cùng một chế độ auto-reply.',
    fix: 'Tách auto / hybrid theo mục tiêu của từng kênh.',
  },
  {
    title: 'Không tạo stop-condition theo loại kênh',
    problem: 'AI có thể tiếp tục trả lời ở các tình huống đáng ra phải handoff cho người thật.',
    fix: 'Tối thiểu phải có stop-condition cho khiếu nại, đòi gặp người thật và vấn đề nhạy cảm.',
  },
];

const preSaveChecklist = [
  'Đã chọn đúng “Phạm vi cấu hình AI” trước khi sửa',
  'Đã kiểm tra đây là config mặc định hay override riêng',
  'Knowledge mới đã gắn đúng mục “Áp dụng cho”',
  'Đã test lại bằng simulator với đúng tài khoản',
  'Đã xác định rõ kênh này nên auto, hybrid hay manual',
];
</script>

<style scoped>
.ai-guide {
  min-height: 100%;
}

.guide-hero {
  padding: 28px 30px;
  border: 1px solid var(--color-border);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 255, 0.96));
  box-shadow: var(--shadow-sm);
}

.guide-hero__copy {
  max-width: 820px;
}

.overview-card,
.guide-section {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 22px !important;
  box-shadow: var(--shadow-sm) !important;
}

.overview-card {
  padding: 22px;
  height: 100%;
}

.guide-section {
  padding: 24px;
}

.section-head {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.mini-panel,
.step-card,
.preset-panel,
.risk-card {
  border-radius: 18px !important;
  border: 1px solid rgba(148, 163, 184, 0.22) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92)) !important;
}

.mini-panel,
.risk-card {
  padding: 18px;
}

.step-list {
  display: grid;
  gap: 14px;
}

.step-card {
  padding: 18px;
}

.preset-panel {
  padding: 20px;
}

.check-group__title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(71, 85, 105, 0.9);
  margin-bottom: 10px;
}

.cta-panel {
  background:
    linear-gradient(135deg, rgba(239, 246, 255, 0.98), rgba(255, 255, 255, 0.96)),
    var(--color-surface-elevated) !important;
}

.sticky-panel {
  position: sticky;
  top: 24px;
}

@media (max-width: 1279px) {
  .sticky-panel {
    position: static;
  }
}

@media (max-width: 767px) {
  .guide-hero,
  .guide-section,
  .overview-card {
    padding: 18px;
    border-radius: 18px !important;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
