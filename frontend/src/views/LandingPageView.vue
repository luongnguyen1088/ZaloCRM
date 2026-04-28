<template>
  <div class="landing-page">
    <div class="landing-noise"></div>

    <v-app-bar
      flat
      :height="isCompactHeader ? 88 : 104"
      :class="['landing-navbar', 'px-4', 'px-md-8', { 'landing-navbar--compact': isCompactHeader }]"
    >
      <div class="landing-navbar__shell">
        <div class="brand-mark" @click="$router.push('/')">
          <div class="brand-mark__icon">
            <v-icon size="20">mdi-lightning-bolt</v-icon>
          </div>
          <div class="brand-mark__copy">
            <div class="brand-mark__name">Claro</div>
            <div class="brand-mark__meta">AI sales workspace</div>
          </div>
        </div>

        <div class="nav-links">
          <a href="#overview">Tổng quan</a>
          <a href="#workflow">Vận hành</a>
          <a href="#features">Tính năng</a>
          <a href="#integrations">Tích hợp</a>
        </div>

        <div class="nav-actions">
          <v-btn
            v-if="!isAuthenticated"
            variant="text"
            class="text-none nav-button"
            to="/login"
          >
            Đăng nhập
          </v-btn>
          <v-btn
            v-if="!isAuthenticated"
            color="primary"
            class="text-none nav-cta"
            to="/register"
          >
            Tạo workspace
          </v-btn>
          <v-btn
            v-else
            color="primary"
            class="text-none nav-cta"
            to="/dashboard"
          >
            Vào dashboard
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <main>
      <section id="overview" class="hero-section">
        <v-container class="hero-shell">
          <div class="hero-grid">
            <div class="hero-copy">
              <div class="eyebrow-chip">
                <span class="eyebrow-chip__dot"></span>
                CRM cho đội sale vận hành trên Zalo, Facebook và POS
              </div>

              <h1 class="hero-title">
                Chốt đơn nhanh hơn với
                <span>AI điều phối toàn bộ hội thoại</span>
              </h1>

              <p class="hero-subtitle">
                Claro gom chat, khách hàng, lịch hẹn, tự động hóa và dữ liệu bán hàng vào một
                workspace duy nhất. Nhân sự không còn phải nhảy tab, AI không còn đứng ngoài quy
                trình vận hành.
              </p>

              <div class="hero-actions">
                <v-btn
                  size="x-large"
                  color="primary"
                  class="text-none hero-primary"
                  :to="isAuthenticated ? '/dashboard' : '/register'"
                >
                  {{ isAuthenticated ? 'Mở dashboard' : 'Dùng thử miễn phí' }}
                  <v-icon end>mdi-arrow-top-right</v-icon>
                </v-btn>
                <v-btn
                  size="x-large"
                  variant="outlined"
                  color="primary"
                  class="text-none hero-secondary"
                  to="/login"
                >
                  Xem workspace mẫu
                </v-btn>
              </div>

              <div class="hero-proof">
                <div class="proof-line">
                  <span class="proof-line__label">Phù hợp cho</span>
                  <div class="proof-tags">
                    <span>Retail</span>
                    <span>Telesales</span>
                    <span>CSKH</span>
                    <span>Social commerce</span>
                  </div>
                </div>

                <div class="hero-stats">
                  <article
                    v-for="stat in heroStats"
                    :key="stat.label"
                    class="hero-stat"
                  >
                    <div class="hero-stat__value">{{ stat.value }}</div>
                    <div class="hero-stat__label">{{ stat.label }}</div>
                  </article>
                </div>
              </div>
            </div>

            <div class="hero-stage">
              <div class="stage-glow stage-glow--blue"></div>
              <div class="stage-glow stage-glow--gold"></div>

              <div class="command-board">
                <div class="command-board__top">
                  <div>
                    <div class="command-board__caption">Live workspace</div>
                    <div class="command-board__title">AI Command Center</div>
                  </div>
                  <div class="signal-pill">
                    <span class="signal-pill__dot"></span>
                    Đồng bộ thời gian thực
                  </div>
                </div>

                <div class="stage-window">
                  <section class="queue-column">
                    <div class="mini-label">Hàng đợi ưu tiên</div>
                    <div
                      v-for="conversation in liveQueue"
                      :key="conversation.name"
                      class="queue-card"
                    >
                      <div class="queue-card__head">
                        <div>
                          <div class="queue-card__name">{{ conversation.name }}</div>
                          <div class="queue-card__channel">{{ conversation.channel }}</div>
                        </div>
                        <div class="queue-card__score">{{ conversation.score }}</div>
                      </div>
                      <p>{{ conversation.message }}</p>
                    </div>
                  </section>

                  <section class="assistant-column">
                    <div class="assistant-panel">
                      <div class="mini-label">AI đề xuất</div>
                      <h3>Phản hồi có ngữ cảnh, lấy từ tri thức nội bộ</h3>
                      <p>
                        AI nhận diện nhu cầu sỉ, kiểm tra lịch sử mua hàng và gợi ý câu trả lời để
                        nhân viên duyệt trước khi gửi.
                      </p>

                      <div class="assistant-bubbles">
                        <div class="bubble bubble--customer">
                          Shop còn mẫu mùa hè size M không? Nếu lấy 20 sản phẩm thì giá như thế nào?
                        </div>
                        <div class="bubble bubble--assistant">
                          Còn hàng ở kho HCM. Với đơn từ 20 sản phẩm, hệ thống đang áp dụng mức chiết
                          khấu 12% và giao nội thành trong ngày.
                        </div>
                      </div>

                      <div class="assistant-footer">
                        <div class="assistant-proof">
                          <v-icon size="16" color="success">mdi-check-decagram</v-icon>
                          Dữ liệu lấy từ knowledge base + tồn kho
                        </div>
                        <v-btn size="small" color="primary" class="text-none">
                          Duyệt và gửi
                        </v-btn>
                      </div>
                    </div>

                    <div class="activity-grid">
                      <article
                        v-for="activity in stageActivities"
                        :key="activity.title"
                        class="activity-card"
                      >
                        <div class="activity-card__icon">
                          <v-icon :icon="activity.icon" size="18"></v-icon>
                        </div>
                        <div>
                          <div class="activity-card__title">{{ activity.title }}</div>
                          <div class="activity-card__meta">{{ activity.meta }}</div>
                        </div>
                      </article>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </v-container>
      </section>

      <section class="proof-section">
        <v-container>
          <div class="proof-band">
            <div class="proof-band__intro">
              <div class="section-kicker">Vận hành tập trung</div>
              <p>
                Một luồng xử lý thống nhất cho marketing, inbox, sale, CSKH và theo dõi doanh thu.
              </p>
            </div>

            <div class="proof-band__items">
              <article v-for="item in proofItems" :key="item.title" class="proof-item">
                <div class="proof-item__value">{{ item.value }}</div>
                <div class="proof-item__title">{{ item.title }}</div>
                <div class="proof-item__desc">{{ item.description }}</div>
              </article>
            </div>
          </div>
        </v-container>
      </section>

      <section id="workflow" class="workflow-section">
        <v-container>
          <div class="section-heading">
            <div class="section-kicker">Workflow rõ ràng</div>
            <h2>Thiết kế cho đội sale phải phản hồi nhanh và chốt đơn có kỷ luật</h2>
            <p>
              Mỗi điểm chạm đều có dữ liệu, người chịu trách nhiệm và hành động tiếp theo. AI chỉ là
              lớp tăng tốc, không làm mờ quy trình.
            </p>
          </div>

          <div class="workflow-track">
            <article v-for="step in workflowSteps" :key="step.title" class="workflow-card">
              <div class="workflow-card__index">{{ step.index }}</div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
              <div class="workflow-card__tag">{{ step.tag }}</div>
            </article>
          </div>
        </v-container>
      </section>

      <section id="features" class="feature-section">
        <v-container>
          <div class="feature-layout">
            <div class="feature-spotlight">
              <div class="section-kicker">Năng lực cốt lõi</div>
              <h2>Không chỉ là inbox hợp kênh, mà là một hệ điều hành bán hàng nhỏ gọn</h2>
              <p>
                Claro được thiết kế cho các team vận hành thực tế: cần nhìn nhanh khách nào nóng,
                ai đang phụ trách, đơn nào đang vướng và lịch follow-up nào sắp trễ.
              </p>

              <div class="spotlight-stack">
                <div class="spotlight-card spotlight-card--wide">
                  <div class="spotlight-card__label">AI Knowledge</div>
                  <h3>Huấn luyện từ tài liệu nội bộ, chính sách và bảng giá riêng</h3>
                  <p>
                    Tạo câu trả lời có ngữ cảnh thay vì dùng mẫu tĩnh. Phù hợp khi sản phẩm nhiều
                    biến thể, giá thay đổi hoặc có quy trình xử lý riêng theo team.
                  </p>
                </div>

                <div class="spotlight-card-grid">
                  <div class="spotlight-card">
                    <div class="spotlight-card__label">Lead scoring</div>
                    <h3>Tự ưu tiên khách có khả năng mua cao</h3>
                    <p>Đẩy lead nóng lên đầu hàng đợi để trưởng nhóm phân việc chính xác hơn.</p>
                  </div>
                  <div class="spotlight-card">
                    <div class="spotlight-card__label">Follow-up</div>
                    <h3>Lịch hẹn, nhắc việc và activity log</h3>
                    <p>Mỗi cuộc hội thoại đều có bước tiếp theo rõ ràng, hạn chế rơi khách.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="feature-grid">
              <article
                v-for="feature in featureCards"
                :key="feature.title"
                class="feature-card"
              >
                <div class="feature-card__icon">
                  <v-icon :icon="feature.icon" size="22"></v-icon>
                </div>
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.description }}</p>
              </article>
            </div>
          </div>
        </v-container>
      </section>

      <section id="integrations" class="integration-section">
        <v-container>
          <div class="integration-shell">
            <div class="integration-copy">
              <div class="section-kicker">Tích hợp thực dụng</div>
              <h2>Kết nối Zalo, Facebook và Pancake POS trong một nhịp làm việc liên tục</h2>
              <p>
                Nhân viên có thể xem lịch sử chat, kiểm tra tồn kho, lên đơn và cập nhật trạng thái
                mà không rời khỏi workspace. Đó là điểm khác biệt giữa một CRM đẹp và một CRM dùng
                được hàng ngày.
              </p>

              <div class="integration-list">
                <div v-for="point in integrationPoints" :key="point" class="integration-point">
                  <v-icon size="18" color="success">mdi-check-circle</v-icon>
                  <span>{{ point }}</span>
                </div>
              </div>
            </div>

            <div class="integration-diagram">
              <div class="diagram-core">
                <div class="diagram-core__label">Control layer</div>
                <div class="diagram-core__title">Claro Workspace</div>
                <div class="diagram-core__text">Tin nhắn, khách hàng, AI, lịch hẹn, báo cáo</div>
              </div>

              <div class="diagram-node diagram-node--zalo">
                <div class="diagram-node__title">Zalo OA</div>
                <div class="diagram-node__meta">Inbox + nhãn + lịch sử</div>
              </div>
              <div class="diagram-node diagram-node--facebook">
                <div class="diagram-node__title">Facebook</div>
                <div class="diagram-node__meta">Page chat + comment</div>
              </div>
              <div class="diagram-node diagram-node--pos">
                <div class="diagram-node__title">Pancake POS</div>
                <div class="diagram-node__meta">Kho, đơn hàng, trạng thái</div>
              </div>
              <div class="diagram-node diagram-node--team">
                <div class="diagram-node__title">Sales team</div>
                <div class="diagram-node__meta">Phân việc và follow-up</div>
              </div>
            </div>
          </div>
        </v-container>
      </section>

      <section class="closing-section">
        <v-container>
          <div class="closing-panel">
            <div>
              <div class="section-kicker">Sẵn sàng triển khai</div>
              <h2>Đưa đội ngũ vào một giao diện làm việc có cấu trúc hơn ngay từ tuần này</h2>
            </div>

            <div class="closing-panel__aside">
              <p>
                Nếu đang vận hành nhiều inbox và nhân sự phải nhớ mọi thứ bằng tay, chi phí thất
                thoát thường nằm ở tốc độ phản hồi và bước follow-up bị quên.
              </p>
              <div class="closing-actions">
                <v-btn
                  size="x-large"
                  color="primary"
                  class="text-none hero-primary"
                  :to="isAuthenticated ? '/dashboard' : '/register'"
                >
                  {{ isAuthenticated ? 'Tiếp tục làm việc' : 'Tạo workspace ngay' }}
                </v-btn>
                <router-link to="/privacy-policy" class="closing-link">
                  Xem chính sách bảo mật
                </router-link>
              </div>
            </div>
          </div>
        </v-container>
      </section>
    </main>

    <v-footer class="landing-footer">
      <v-container class="landing-footer__inner">
        <div class="landing-footer__brand">
          <div class="brand-mark__icon brand-mark__icon--small">
            <v-icon size="16">mdi-lightning-bolt</v-icon>
          </div>
          <div>
            <div class="landing-footer__title">Claro</div>
            <div class="landing-footer__meta">
              Workspace cho sale, CSKH và tự động hóa hội thoại
            </div>
          </div>
        </div>

        <div class="landing-footer__links">
          <router-link to="/privacy-policy">Chính sách bảo mật</router-link>
          <router-link to="/data-deletion">Xóa dữ liệu</router-link>
          <span>&copy; {{ new Date().getFullYear() }} Claro</span>
        </div>
      </v-container>
    </v-footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isCompactHeader = ref(false);

function syncHeaderState() {
  isCompactHeader.value = window.scrollY > 36;
}

onMounted(() => {
  syncHeaderState();
  window.addEventListener('scroll', syncHeaderState, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', syncHeaderState);
});

const heroStats = [
  { value: '1 workspace', label: 'gom chat, CRM và AI vào cùng màn hình' },
  { value: 'Real-time', label: 'đồng bộ tồn kho, đơn hàng và trạng thái chăm sóc' },
  { value: '24/7', label: 'AI tiếp nhận ngoài giờ và đề xuất trả lời có ngữ cảnh' },
];

const liveQueue = [
  {
    name: 'Thảo Vy Fashion',
    channel: 'Zalo OA • Lead sỉ',
    score: '92',
    message: 'Hỏi bảng giá đại lý và số lượng tối thiểu để nhập đơn đầu tiên.',
  },
  {
    name: 'Minh Anh Boutique',
    channel: 'Facebook • Khách cũ',
    score: '81',
    message: 'Đã từng mua 3 lần, hiện đang hỏi thêm tồn kho size M tại chi nhánh HCM.',
  },
  {
    name: 'Hoàng Nam Store',
    channel: 'Zalo OA • Follow-up',
    score: '74',
    message: 'Đang chờ xác nhận lịch giao và tình trạng đơn in trong Pancake POS.',
  },
];

const stageActivities = [
  { icon: 'mdi-database-search-outline', title: 'Knowledge sync', meta: 'Tài liệu giá và FAQ đã index' },
  { icon: 'mdi-store-check-outline', title: 'Kho khả dụng', meta: '2 kho còn hàng cho size M' },
  { icon: 'mdi-calendar-clock-outline', title: 'Nhắc việc', meta: 'Follow-up lại sau 30 phút' },
  { icon: 'mdi-account-switch-outline', title: 'Phân công', meta: 'Giao lead cho team wholesale' },
];

const proofItems = [
  {
    value: 'Omnichannel',
    title: 'Một inbox cho toàn bộ social',
    description: 'Không còn tản tin nhắn giữa Zalo OA, Facebook Page và ghi chú thủ công.',
  },
  {
    value: 'Actionable AI',
    title: 'AI tham gia vào bước xử lý thực',
    description: 'Tóm tắt, soạn phản hồi, phân loại nhu cầu và nhắc bước tiếp theo.',
  },
  {
    value: 'Clean CRM',
    title: 'Data sạch để chăm sóc lâu dài',
    description: 'Merge trùng, ghi activity log và giữ bối cảnh đầy đủ cho từng khách hàng.',
  },
];

const workflowSteps = [
  {
    index: '01',
    title: 'Tiếp nhận hội thoại',
    description: 'Mọi tin nhắn đổ về một hàng đợi có SLA, trạng thái và người phụ trách rõ ràng.',
    tag: 'Zalo + Facebook',
  },
  {
    index: '02',
    title: 'AI đọc ngữ cảnh',
    description: 'Hệ thống dùng knowledge base, lịch sử mua và intent để gợi ý phản hồi phù hợp.',
    tag: 'Context-aware draft',
  },
  {
    index: '03',
    title: 'Thao tác bán hàng',
    description: 'Kiểm tra kho, tạo lịch hẹn, đẩy lead, lên đơn và cập nhật trạng thái ngay trong luồng chat.',
    tag: 'POS + CRM actions',
  },
  {
    index: '04',
    title: 'Theo dõi đến khi chốt',
    description: 'Nhắc việc, đo hiệu suất và giữ log chi tiết để không bỏ sót khách tiềm năng.',
    tag: 'Follow-up discipline',
  },
];

const featureCards = [
  {
    icon: 'mdi-message-processing-outline',
    title: 'Omnichannel chat',
    description: 'Gộp hội thoại từ nhiều kênh vào cùng một màn hình làm việc có phân quyền.',
  },
  {
    icon: 'mdi-account-search-outline',
    title: 'Khách hàng 360 độ',
    description: 'Lịch sử tương tác, ghi chú nội bộ, lịch hẹn, nguồn lead và người phụ trách nằm chung một hồ sơ.',
  },
  {
    icon: 'mdi-source-branch',
    title: 'Rule-based automation',
    description: 'Tự gán nhân sự, đổi trạng thái, tạo lịch hẹn hoặc gọi AI theo điều kiện vận hành.',
  },
  {
    icon: 'mdi-merge',
    title: 'Merge dữ liệu trùng',
    description: 'Tự phát hiện contact trùng để giữ CRM sạch và hạn chế sale chăm cùng một khách.',
  },
  {
    icon: 'mdi-chart-box-outline',
    title: 'Báo cáo hiệu suất',
    description: 'Theo dõi SLA phản hồi, khối lượng hội thoại, tỷ lệ xử lý và kết quả theo từng team.',
  },
  {
    icon: 'mdi-shield-check-outline',
    title: 'Phân quyền theo vai trò',
    description: 'Tách rõ owner, admin và agent để kiểm soát dữ liệu, quy trình và trách nhiệm.',
  },
];

const integrationPoints = [
  'Đồng bộ cửa hàng, kho và đơn hàng từ Pancake POS.',
  'Tra cứu tồn kho khi đang chat để trả lời khách nhanh và chính xác hơn.',
  'Tạo đơn in hoặc cập nhật trạng thái mà không cần đổi ứng dụng.',
  'Giữ lịch sử xử lý xuyên suốt giữa sale, CSKH và quản lý đội nhóm.',
];
</script>

<style scoped>
.landing-page {
  position: relative;
  min-height: 100vh;
  color: var(--color-text);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 34%),
    radial-gradient(circle at 85% 18%, rgba(245, 158, 11, 0.18), transparent 26%),
    linear-gradient(180deg, #f3f8ff 0%, #f8fafc 36%, #eef4ff 100%);
  overflow: hidden;
}

.v-theme--dark .landing-page {
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 30%),
    radial-gradient(circle at 85% 18%, rgba(251, 191, 36, 0.14), transparent 24%),
    linear-gradient(180deg, #081121 0%, #0f172a 36%, #13203b 100%);
}

.landing-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.32;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent 85%);
}

.landing-navbar {
  position: sticky !important;
  top: 0;
  z-index: 30;
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease,
    height 0.25s ease,
    padding 0.25s ease !important;
  background: rgba(248, 250, 252, 0.72) !important;
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16) !important;
}

.landing-navbar__shell {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
}

.landing-navbar--compact {
  background: rgba(248, 250, 252, 0.9) !important;
  border-bottom-color: rgba(148, 163, 184, 0.24) !important;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.v-theme--dark .landing-navbar {
  background: rgba(8, 17, 33, 0.72) !important;
}

.v-theme--dark .landing-navbar--compact {
  background: rgba(8, 17, 33, 0.88) !important;
  box-shadow: 0 14px 32px rgba(2, 6, 23, 0.34);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: gap 0.25s ease;
}

.brand-mark__copy {
  display: grid;
  gap: 2px;
}

.brand-mark__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8 60%, #f59e0b);
  box-shadow: 0 18px 30px rgba(37, 99, 235, 0.22);
  transition:
    width 0.25s ease,
    height 0.25s ease,
    border-radius 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.brand-mark__icon--small {
  width: 34px;
  height: 34px;
  border-radius: 12px;
}

.brand-mark__name {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  transition: font-size 0.25s ease;
}

.brand-mark__meta {
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  transition: gap 0.25s ease;
}

.nav-links::-webkit-scrollbar {
  display: none;
}

.nav-links a,
.landing-footer__links a,
.closing-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.nav-links a {
  flex: 0 0 auto;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(148, 163, 184, 0.12);
  white-space: nowrap;
}

.nav-links a:hover,
.landing-footer__links a:hover,
.closing-link:hover {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.72);
}

.v-theme--dark .nav-links a {
  background: rgba(15, 23, 42, 0.36);
}

.v-theme--dark .nav-links a:hover {
  background: rgba(15, 23, 42, 0.58);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-button {
  color: var(--color-text);
  opacity: 0.88;
}

.nav-cta,
.hero-primary {
  padding-inline: 1.5rem !important;
  border-radius: 999px !important;
  background: linear-gradient(135deg, #2563eb, #1d4ed8 58%, #0f172a) !important;
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.2);
}

.nav-cta {
  min-width: 146px;
}

.landing-navbar--compact .brand-mark {
  gap: 12px;
}

.landing-navbar--compact .brand-mark__icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
}

.landing-navbar--compact .brand-mark__name {
  font-size: 0.96rem;
}

.landing-navbar--compact .brand-mark__meta {
  opacity: 0.72;
}

.landing-navbar--compact .nav-links {
  gap: 8px;
}

.landing-navbar--compact .nav-cta {
  min-width: 136px;
}

.landing-navbar--compact .nav-links a {
  padding: 8px 12px;
}

.hero-section {
  position: relative;
  padding: 52px 0 34px;
}

.hero-shell {
  position: relative;
  z-index: 1;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
  gap: 44px;
  align-items: center;
}

.hero-copy {
  padding-top: 26px;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  background: rgba(255, 255, 255, 0.64);
  color: #1e3a8a;
  font-size: 0.92rem;
  font-weight: 700;
}

.v-theme--dark .eyebrow-chip {
  background: rgba(15, 23, 42, 0.55);
  color: #bfdbfe;
}

.eyebrow-chip__dot,
.signal-pill__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #10b981, #22c55e);
  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.16);
}

.hero-title {
  margin: 22px 0 18px;
  max-width: 10ch;
  font-size: clamp(3.15rem, 7vw, 5.65rem);
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: -0.065em;
  color: var(--color-text);
}

.hero-title span {
  display: block;
  color: #1d4ed8;
}

.v-theme--dark .hero-title span {
  color: #93c5fd;
}

.hero-subtitle {
  max-width: 58ch;
  font-size: 1.08rem;
  line-height: 1.8;
  color: var(--color-text-secondary);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 34px;
}

.hero-secondary {
  padding-inline: 1.5rem !important;
  border-radius: 999px !important;
  border-width: 1px !important;
}

.hero-proof {
  margin-top: 42px;
  display: grid;
  gap: 20px;
}

.proof-line {
  display: grid;
  gap: 12px;
}

.proof-line__label,
.mini-label,
.section-kicker,
.spotlight-card__label,
.diagram-core__label {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.74rem;
  font-weight: 800;
}

.proof-line__label,
.section-kicker,
.spotlight-card__label,
.diagram-core__label {
  color: var(--color-text-muted);
}

.proof-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.proof-tags span {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.v-theme--dark .proof-tags span {
  background: rgba(19, 32, 59, 0.72);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.hero-stat {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.v-theme--dark .hero-stat {
  background: rgba(19, 32, 59, 0.82);
}

.hero-stat__value {
  font-size: 1.18rem;
  font-weight: 800;
  color: var(--color-text);
}

.hero-stat__label {
  margin-top: 10px;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.hero-stage {
  position: relative;
}

.stage-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(22px);
  opacity: 0.7;
}

.stage-glow--blue {
  top: -30px;
  right: 28px;
  width: 160px;
  height: 160px;
  background: rgba(37, 99, 235, 0.24);
}

.stage-glow--gold {
  bottom: 24px;
  left: 8px;
  width: 120px;
  height: 120px;
  background: rgba(245, 158, 11, 0.22);
}

.command-board {
  position: relative;
  padding: 24px;
  border-radius: 34px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.1)),
    rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.v-theme--dark .command-board {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.24), rgba(15, 23, 42, 0.38)),
    rgba(19, 32, 59, 0.88);
}

.command-board__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 18px;
}

.command-board__caption {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-text-muted);
}

.command-board__title {
  margin-top: 8px;
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--color-text);
}

.signal-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 700;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.v-theme--dark .signal-pill {
  background: rgba(15, 23, 42, 0.48);
}

.stage-window {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: 18px;
}

.queue-column,
.assistant-panel,
.activity-card {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(12px);
}

.v-theme--dark .queue-column,
.v-theme--dark .assistant-panel,
.v-theme--dark .activity-card {
  background: rgba(15, 23, 42, 0.48);
}

.queue-column {
  border-radius: 28px;
  padding: 18px;
}

.mini-label {
  margin-bottom: 14px;
  color: #1d4ed8;
}

.v-theme--dark .mini-label {
  color: #93c5fd;
}

.queue-card {
  padding: 16px;
  border-radius: 22px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.queue-card + .queue-card {
  margin-top: 12px;
}

.v-theme--dark .queue-card {
  background: rgba(19, 32, 59, 0.9);
}

.queue-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.queue-card__name,
.activity-card__title,
.proof-item__title,
.diagram-node__title,
.landing-footer__title {
  font-weight: 800;
  color: var(--color-text);
}

.queue-card__channel,
.activity-card__meta,
.proof-item__desc,
.diagram-node__meta,
.landing-footer__meta {
  color: var(--color-text-secondary);
}

.queue-card__score {
  min-width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-weight: 800;
}

.queue-card p,
.assistant-panel p,
.workflow-card p,
.feature-card p,
.integration-copy p,
.spotlight-card p,
.closing-panel__aside p,
.proof-band__intro p {
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.assistant-column {
  display: grid;
  gap: 16px;
}

.assistant-panel {
  border-radius: 28px;
  padding: 22px;
}

.assistant-panel h3,
.spotlight-card h3,
.workflow-card h3,
.feature-card h3 {
  margin: 0 0 10px;
  font-size: 1.14rem;
  font-weight: 800;
  color: var(--color-text);
}

.assistant-bubbles {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.bubble {
  max-width: 92%;
  padding: 14px 16px;
  border-radius: 22px;
  line-height: 1.6;
  font-size: 0.95rem;
}

.bubble--customer {
  background: rgba(148, 163, 184, 0.12);
  color: var(--color-text);
}

.bubble--assistant {
  margin-left: auto;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: #fff;
  box-shadow: 0 18px 28px rgba(37, 99, 235, 0.22);
}

.assistant-footer {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.assistant-proof {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.activity-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 22px;
  padding: 16px;
}

.activity-card__icon,
.feature-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.12);
}

.proof-section,
.workflow-section,
.feature-section,
.integration-section,
.closing-section {
  position: relative;
  z-index: 1;
}

.proof-section {
  padding: 10px 0 34px;
}

.proof-band {
  display: grid;
  grid-template-columns: minmax(0, 0.74fr) minmax(0, 1.26fr);
  gap: 26px;
  padding: 28px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.v-theme--dark .proof-band {
  background: rgba(19, 32, 59, 0.78);
}

.proof-band__items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.proof-item {
  padding: 20px;
  border-radius: 24px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.v-theme--dark .proof-item {
  background: rgba(15, 23, 42, 0.5);
}

.proof-item__value {
  margin-bottom: 10px;
  font-size: 0.9rem;
  font-weight: 800;
  color: #1d4ed8;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.workflow-section,
.feature-section,
.integration-section {
  padding: 38px 0 24px;
}

.section-heading,
.integration-copy {
  max-width: 760px;
}

.section-heading h2,
.feature-spotlight h2,
.integration-copy h2,
.closing-panel h2 {
  margin: 14px 0 16px;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1.04;
  font-weight: 850;
  letter-spacing: -0.05em;
  color: var(--color-text);
}

.section-heading p,
.feature-spotlight p {
  max-width: 62ch;
  color: var(--color-text-secondary);
  line-height: 1.75;
}

.workflow-track {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.workflow-card,
.feature-card,
.spotlight-card,
.diagram-core,
.diagram-node,
.closing-panel {
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.v-theme--dark .workflow-card,
.v-theme--dark .feature-card,
.v-theme--dark .spotlight-card,
.v-theme--dark .diagram-core,
.v-theme--dark .diagram-node,
.v-theme--dark .closing-panel {
  background: rgba(19, 32, 59, 0.78);
}

.workflow-card {
  border-radius: 28px;
  padding: 22px;
}

.workflow-card__index {
  width: fit-content;
  margin-bottom: 18px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.workflow-card__tag {
  margin-top: 16px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.feature-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: 24px;
  align-items: start;
}

.spotlight-stack {
  margin-top: 24px;
  display: grid;
  gap: 16px;
}

.spotlight-card,
.feature-card {
  border-radius: 28px;
  padding: 22px;
}

.spotlight-card--wide {
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.14), transparent 38%),
    rgba(255, 255, 255, 0.8);
}

.v-theme--dark .spotlight-card--wide {
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.18), transparent 38%),
    rgba(19, 32, 59, 0.84);
}

.spotlight-card-grid,
.feature-grid {
  display: grid;
  gap: 16px;
}

.spotlight-card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.feature-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.integration-shell {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: 24px;
  align-items: center;
}

.integration-list {
  margin-top: 24px;
  display: grid;
  gap: 14px;
}

.integration-point {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.v-theme--dark .integration-point {
  background: rgba(19, 32, 59, 0.68);
}

.integration-diagram {
  position: relative;
  min-height: 520px;
}

.diagram-core,
.diagram-node {
  position: absolute;
  border-radius: 28px;
  padding: 22px;
  backdrop-filter: blur(16px);
}

.diagram-core {
  inset: 50% auto auto 50%;
  width: 270px;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 40%),
    rgba(255, 255, 255, 0.8);
}

.v-theme--dark .diagram-core {
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.2), transparent 40%),
    rgba(19, 32, 59, 0.84);
}

.diagram-core__title {
  margin: 10px 0 8px;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-text);
}

.diagram-core__text {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.diagram-node {
  width: 220px;
}

.diagram-node--zalo {
  top: 14px;
  left: 34px;
}

.diagram-node--facebook {
  top: 52px;
  right: 10px;
}

.diagram-node--pos {
  bottom: 26px;
  right: 34px;
}

.diagram-node--team {
  bottom: 12px;
  left: 0;
}

.closing-section {
  padding: 42px 0 56px;
}

.closing-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.72fr);
  gap: 24px;
  align-items: center;
  border-radius: 34px;
  padding: 28px;
}

.closing-panel__aside {
  display: grid;
  gap: 18px;
}

.closing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.landing-footer {
  position: relative;
  z-index: 1;
  padding: 10px 0 28px;
  background: transparent !important;
}

.landing-footer__inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding-top: 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.landing-footer__brand,
.landing-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.landing-footer__links {
  font-size: 0.92rem;
}

@media (max-width: 1279px) {
  .hero-grid,
  .feature-layout,
  .integration-shell,
  .proof-band,
  .closing-panel {
    grid-template-columns: 1fr;
  }

  .workflow-track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .proof-band__items {
    grid-template-columns: 1fr;
  }

  .integration-diagram {
    min-height: 560px;
    margin-top: 8px;
  }
}

@media (max-width: 959px) {
  .hero-section {
    padding-top: 26px;
  }

  .hero-title {
    max-width: none;
  }

  .hero-stats,
  .stage-window,
  .activity-grid,
  .spotlight-card-grid,
  .feature-grid,
  .workflow-track {
    grid-template-columns: 1fr;
  }

  .command-board {
    padding: 18px;
    border-radius: 28px;
  }

  .command-board__top,
  .assistant-footer,
  .landing-footer__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .integration-diagram {
    min-height: auto;
    display: grid;
    gap: 14px;
  }

  .diagram-core,
  .diagram-node {
    position: static;
    width: 100%;
    transform: none;
  }
}

@media (max-width: 599px) {
  .landing-navbar {
    padding-inline: 12px !important;
  }

  .landing-navbar__shell {
    grid-template-columns: 1fr;
    gap: 10px;
    align-items: stretch;
  }

  .brand-mark {
    gap: 10px;
  }

  .brand-mark__icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
  }

  .brand-mark__name {
    font-size: 0.94rem;
  }

  .brand-mark__copy {
    gap: 0;
  }

  .nav-actions {
    gap: 6px;
    justify-content: flex-end;
  }

  .nav-cta {
    min-width: 0;
    padding-inline: 1rem !important;
  }

  .landing-navbar--compact .nav-cta {
    padding-inline: 0.9rem !important;
  }

  .nav-links {
    justify-content: flex-start;
    padding-bottom: 2px;
  }

  .hero-actions .v-btn {
    width: 100%;
  }

  .eyebrow-chip,
  .hero-stat,
  .proof-item,
  .workflow-card,
  .feature-card,
  .spotlight-card,
  .integration-point,
  .closing-panel,
  .command-board,
  .queue-column,
  .assistant-panel,
  .activity-card {
    border-radius: 22px;
  }

  .proof-band {
    padding: 18px;
    border-radius: 24px;
  }

  .closing-panel {
    padding: 22px;
  }
}
</style>
