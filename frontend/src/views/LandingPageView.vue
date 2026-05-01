<template>
  <div class="landing-page">
    <div class="landing-noise"></div>

    <header :class="['landing-navbar', { 'landing-navbar--scrolled': isScrolled }]">
      <div class="landing-navbar__container">
        <div class="landing-navbar__shell">
          <div class="brand-mark" @click="$router.push('/')">
            <div class="brand-mark__icon">
              <div class="brand-mark__glow"></div>
              <v-icon size="20">mdi-lightning-bolt</v-icon>
            </div>
            <div class="brand-mark__copy">
              <div class="brand-mark__name">Claro</div>
              <div class="brand-mark__meta">AI workspace</div>
            </div>
          </div>

          <nav class="nav-links">
            <a href="#overview">Tổng quan</a>
            <a href="#workflow">Vận hành</a>
            <a href="#features">Tính năng</a>
            <a href="#integrations">Tích hợp</a>
          </nav>

          <div class="nav-actions">
            <v-btn
              v-if="!isAuthenticated"
              variant="outlined"
              class="text-none nav-button--secondary d-none d-sm-flex"
              to="/login"
            >
              Đăng nhập
            </v-btn>
            <v-btn
              v-if="!isAuthenticated"
              color="primary"
              class="text-none nav-button--primary shimmer-btn"
              to="/register"
            >
              Tạo workspace
            </v-btn>
            <v-btn
              v-else
              color="primary"
              class="text-none nav-button--primary"
              to="/dashboard"
            >
              Vào dashboard
            </v-btn>
          </div>
        </div>
      </div>
    </header>

    <main class="landing-main">
      <section id="overview" class="hero-section">
        <v-container class="hero-shell">
          <div class="hero-grid">
            <div class="hero-copy">
              <div class="eyebrow-chip reveal-on-scroll">
                <span class="eyebrow-chip__dot"></span>
                Hệ điều hành Zalo + AI cho doanh nghiệp
              </div>

              <h1 class="hero-title reveal-on-scroll">
                Biến Zalo thành
                <span>Cỗ máy chốt đơn AI</span>
              </h1>

              <div class="hero-value-grid reveal-on-scroll">
                <div class="value-block">
                  <div class="value-block__header">VẬN HÀNH TẬP TRUNG</div>
                  <p>Hợp nhất Zalo OA, Facebook và POS vào một luồng làm việc duy nhất.</p>
                </div>
                <div class="value-block">
                  <div class="value-block__header">OMNICHANNEL AI</div>
                  <p>AI hiểu ngữ cảnh toàn diện từ mọi kênh để đề xuất phản hồi tối ưu.</p>
                </div>
                <div class="value-block">
                  <div class="value-block__header">CLEAN CRM</div>
                  <p>Tự động hóa việc phân loại lead và làm sạch dữ liệu khách hàng.</p>
                </div>
              </div>

              <div class="hero-actions reveal-on-scroll">
                <v-btn
                  size="x-large"
                  color="primary"
                  class="text-none hero-primary shimmer-btn"
                  :to="isAuthenticated ? '/dashboard' : '/register'"
                >
                  {{ isAuthenticated ? 'Mở dashboard' : 'Tạo workspace ngay' }}
                  <v-icon end>mdi-arrow-top-right</v-icon>
                </v-btn>
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

                      <div class="assistant-suggestion">
                        <div class="suggestion-header">
                          <v-icon color="primary" size="18">mdi-lightbulb-outline</v-icon>
                          <span>Insight từ hệ thống</span>
                        </div>
                        <div class="suggestion-body">
                          "Khách hàng hỏi giá sỉ mẫu Summer M. Hệ thống ghi nhận còn 240 sản phẩm tại Kho HCM. Áp dụng bảng giá Đại lý cấp 1 (-15%)."
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
            <div class="section-header text-center mb-12">
              <div class="section-kicker mx-auto">Năng lực cốt lõi</div>
              <h2 class="section-title">Hệ điều hành bán hàng thế hệ mới</h2>
              <p class="section-subtitle mx-auto">
                Không chỉ là inbox hợp kênh, Claro cung cấp bộ công cụ toàn diện để vận hành đội ngũ sale chuyên nghiệp.
              </p>
            </div>

            <div class="bento-grid">
              <!-- Cột trái: AI Knowledge (Lớn) -->
              <div class="bento-item bento-item--large reveal-on-scroll">
                <div class="bento-content">
                  <div class="bento-label">AI Knowledge Base</div>
                  <h3>Huấn luyện AI từ tri thức riêng</h3>
                  <p>Tải lên PDF, Word hoặc liên kết Website. AI sẽ tự học chính sách, bảng giá để tư vấn khách hàng chuẩn xác như một chuyên gia thực thụ.</p>
                  <div class="bento-visual bento-visual--ai">
                    <div class="ai-node ai-node--1"></div>
                    <div class="ai-node ai-node--2"></div>
                    <div class="ai-node ai-node--3"></div>
                  </div>
                </div>
              </div>

              <!-- Cột phải: Grid các tính năng nhỏ -->
              <div class="bento-subgrid">
                <div class="bento-item reveal-on-scroll">
                  <div class="bento-content">
                    <v-icon color="primary" class="mb-4">mdi-target-variant</v-icon>
                    <h3>Lead Scoring</h3>
                    <p>Tự động chấm điểm và ưu tiên khách hàng có khả năng chốt đơn cao nhất.</p>
                  </div>
                </div>
                <div class="bento-item reveal-on-scroll">
                  <div class="bento-content">
                    <v-icon color="warning" class="mb-4">mdi-calendar-check</v-icon>
                    <h3>Lịch hẹn thông minh</h3>
                    <p>Đặt lịch tư vấn, nhắc việc và tự động follow-up khách hàng cũ.</p>
                  </div>
                </div>
                <div class="bento-item bento-item--wide reveal-on-scroll">
                  <div class="bento-content">
                    <div class="d-flex align-center gap-4 mb-4">
                      <v-icon color="success">mdi-sync</v-icon>
                      <h3>Đồng bộ Pancake POS</h3>
                    </div>
                    <p>Kiểm tra tồn kho, tạo đơn hàng và cập nhật trạng thái vận chuyển ngay trong màn hình chat mà không cần chuyển ứng dụng.</p>
                  </div>
                </div>
              </div>

              <!-- Hàng dưới: 3 tính năng còn lại -->
              <div class="bento-footer-grid">
                <div v-for="(feature, idx) in featureCards.slice(3)" :key="feature.title" 
                     class="bento-item bento-item--small reveal-on-scroll"
                     :style="{ transitionDelay: (idx * 100) + 'ms' }">
                  <div class="bento-content">
                    <v-icon :icon="feature.icon" size="20" class="mb-3"></v-icon>
                    <h4>{{ feature.title }}</h4>
                    <p>{{ feature.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-container>
      </section>

      <section id="integrations" class="integration-section">
        <v-container>
          <div class="section-header text-center mb-12 mx-auto">
            <div class="section-kicker mx-auto">Tích hợp thực dụng</div>
            <h2 class="section-title">Kết nối hoàn hảo với hệ sinh thái của bạn</h2>
          </div>

          <div class="integration-grid">
            <div class="integration-info reveal-on-scroll">
              <div class="info-card">
                <h3>Pancake POS Sync</h3>
                <p>Tra cứu tồn kho và lên đơn hàng ngay trong hội thoại chat.</p>
              </div>
              <div class="info-card">
                <h3>Zalo & FB Hub</h3>
                <p>Gom tin nhắn và bình luận từ tất cả fanpage về một nơi.</p>
              </div>
            </div>

            <div class="integration-visual reveal-on-scroll">
              <div class="diagram-shell">
                <div class="diagram-center">Claro Hub</div>
                <div class="diagram-orbit">
                  <div class="orbit-node node--zalo">Zalo</div>
                  <div class="orbit-node node--fb">FB</div>
                  <div class="orbit-node node--pos">POS</div>
                </div>
              </div>
            </div>

            <div class="integration-points reveal-on-scroll">
              <div v-for="point in integrationPoints" :key="point" class="point-item">
                <v-icon size="18" color="primary">mdi-check-circle-outline</v-icon>
                <span>{{ point }}</span>
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
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isScrolled = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    observer.observe(el);
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const liveQueue = [
  {
    name: 'Thảo Vy Fashion',
    channel: 'Zalo OA • Lead sỉ',
    score: '92',
  },
  {
    name: 'Minh Anh Boutique',
    channel: 'Facebook • Khách cũ',
    score: '81',
  },
];

const stageActivities = [
  { title: 'Đơn hàng đồng bộ', meta: 'Pancake POS • 2 phút trước', icon: 'mdi-sync' },
  { title: 'Kiểm kho tự động', meta: 'Kho HCM • 5 phút trước', icon: 'mdi-warehouse' },
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  min-height: 90px;
  display: flex;
  align-items: center;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  background: transparent;
}

.landing-navbar__container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  transition: all 0.5s ease;
}

.landing-navbar--scrolled {
  top: 16px;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 1100px;
  min-height: 72px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  box-shadow: 
    0 20px 40px rgba(15, 23, 42, 0.08);
}

.landing-navbar--scrolled .landing-navbar__container {
  max-width: 100%;
  padding: 0 16px;
}

.v-theme--dark .landing-navbar--scrolled {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.35),
    0 1px 2px rgba(255, 255, 255, 0.05);
}

.landing-main {
  padding-top: 132px;
}

.landing-navbar__shell {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
}

.v-theme--dark .landing-navbar {
  background: rgba(8, 17, 33, 0.9);
  box-shadow: 0 14px 32px rgba(2, 6, 23, 0.34);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-button--primary,
.nav-button--secondary {
  height: 42px !important;
  padding-inline: 20px !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  letter-spacing: -0.01em !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.nav-button--secondary {
  border: 1px solid rgba(148, 163, 184, 0.3) !important;
  color: var(--color-text) !important;
}

.nav-button--secondary:hover {
  background: rgba(148, 163, 184, 0.08) !important;
  border-color: #2563eb !important;
  color: #2563eb !important;
}

.nav-button--primary {
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.15) !important;
}

.nav-button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 15px 30px rgba(37, 99, 235, 0.25) !important;
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.brand-mark__copy {
  display: grid;
  gap: 2px;
}

.brand-mark__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.brand-mark__icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.brand-mark:hover .brand-mark__icon {
  transform: scale(1.05) rotate(-3deg);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
}

.brand-mark:hover .brand-mark__icon::after {
  opacity: 1;
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
  padding: 8px 16px;
  border-radius: 999px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-links a:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.v-theme--dark .nav-links a:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.12);
}

.hero-section {
  position: relative;
  padding: 100px 0 120px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.hero-copy {
  display: flex;
  flex-direction: column;
}

.hero-value-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  margin: 48px 0;
}

.value-block {
  padding-left: 24px;
  border-left: 2px solid rgba(37, 99, 235, 0.2);
  transition: all 0.3s ease;
}

.value-block:hover {
  border-left-color: #2563eb;
  transform: translateX(8px);
}

.value-block__header {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #2563eb;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.value-block p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
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
  margin: 22px 0 24px;
  max-width: 12ch;
  font-size: clamp(3.5rem, 8vw, 6.2rem);
  line-height: 0.9;
  font-weight: 950;
  letter-spacing: -0.07em;
  color: var(--color-text);
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-subtitle {
  max-width: 54ch;
  font-size: 1.15rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 40px;
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
}

/* Bento Grid System */
.bento-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  margin-top: 48px;
}

.bento-subgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 24px;
}

.bento-footer-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.bento-item {
  position: relative;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 32px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.v-theme--dark .bento-item {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(255, 255, 255, 0.05);
}

.bento-item:hover {
  transform: translateY(-8px);
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.7);
}

.v-theme--dark .bento-item:hover {
  background: rgba(15, 23, 42, 0.6);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.bento-content {
  padding: 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bento-item--large .bento-content {
  padding: 48px;
}

.bento-label {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #2563eb;
  margin-bottom: 16px;
}

.bento-item h3 {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
  line-height: 1.2;
}

.bento-item p {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.bento-item--wide {
  grid-column: 1 / -1;
}

/* AI Visual Decoration */
.bento-visual--ai {
  margin-top: auto;
  padding-top: 40px;
  height: 180px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-node {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.2), transparent 70%);
  filter: blur(20px);
  animation: float 6s infinite ease-in-out;
}

.ai-node--1 { left: 10%; animation-delay: 0s; }
.ai-node--2 { right: 10%; animation-delay: -2s; background: radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%); }
.ai-node--3 { bottom: 0; animation-delay: -4s; background: radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 70%); }

/* Animations */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10px, -15px); }
}

.reveal-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-on-scroll.active {
  opacity: 1;
  transform: translateY(0);
}

/* Section Header Styles */
.section-header {
  max-width: 800px;
}

.section-title {
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.1;
  margin: 16px 0 24px;
}

.section-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

@media (max-width: 960px) {
  .bento-grid, .bento-footer-grid {
    grid-template-columns: 1fr;
  }
  .bento-subgrid {
    grid-template-columns: 1fr;
  }
  .section-title {
    font-size: 2.5rem;
  }
}

.hero-secondary {
  padding-inline: 1.5rem !important;
  border-radius: 999px !important;
  border-width: 1px !important;
}

/* Integration Grid System */
.integration-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 60px;
  align-items: center;
  margin-top: 80px;
}

.info-card {
  padding: 40px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 32px;
  margin-bottom: 32px;
  transition: all 0.4s ease;
}

.v-theme--dark .info-card {
  background: rgba(15, 23, 42, 0.4);
}

.info-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-5px);
}

.info-card h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.diagram-shell {
  height: 460px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.diagram-center {
  width: 160px;
  height: 160px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-weight: 900;
  font-size: 1.2rem;
  box-shadow: 0 30px 60px rgba(37, 99, 235, 0.35);
  z-index: 5;
}

.diagram-orbit {
  position: absolute;
  width: 400px;
  height: 400px;
  border: 1.5px dashed rgba(37, 99, 235, 0.15);
  border-radius: 50%;
  animation: rotateOrbit 60s linear infinite;
}

@keyframes rotateOrbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orbit-node {
  position: absolute;
  padding: 14px 24px;
  background: white;
  border-radius: 99px;
  font-weight: 800;
  font-size: 0.9rem;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
  white-space: nowrap;
}

.v-theme--dark .orbit-node {
  background: #1e293b;
  color: white;
}

.node--zalo { top: -20px; left: 50%; transform: translateX(-50%); }
.node--fb { bottom: 20%; right: -30px; }
.node--pos { bottom: 20%; left: -30px; }

.point-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  font-weight: 600;
  color: var(--color-text-secondary);
}

@media (max-width: 1100px) {
  .integration-grid {
    grid-template-columns: 1fr;
  }
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

.assistant-suggestion {
  margin-top: 20px;
  background: rgba(37, 99, 235, 0.04);
  border: 1px dashed rgba(37, 99, 235, 0.2);
  border-radius: 24px;
  overflow: hidden;
}

.v-theme--dark .assistant-suggestion {
  background: rgba(37, 99, 235, 0.08);
}

.suggestion-header {
  padding: 12px 18px;
  background: rgba(37, 99, 235, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.suggestion-body {
  padding: 18px;
  font-size: 0.96rem;
  line-height: 1.6;
  color: var(--color-text);
  font-weight: 500;
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

/* Bento Grid System */
.bento-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  margin-top: 48px;
}

.bento-subgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 24px;
}

.bento-footer-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.bento-item {
  position: relative;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 32px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.v-theme--dark .bento-item {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(255, 255, 255, 0.05);
}

.bento-item:hover {
  transform: translateY(-8px);
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.7);
}

.v-theme--dark .bento-item:hover {
  background: rgba(15, 23, 42, 0.6);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.bento-content {
  padding: 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bento-item--large .bento-content {
  padding: 48px;
}

.bento-label {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #2563eb;
  margin-bottom: 16px;
}

.bento-item h3 {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
  line-height: 1.2;
}

.bento-item p {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.bento-item--wide {
  grid-column: 1 / -1;
}

/* AI Visual Decoration */
.bento-visual--ai {
  margin-top: auto;
  padding-top: 40px;
  height: 180px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-node {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.2), transparent 70%);
  filter: blur(20px);
  animation: float 6s infinite ease-in-out;
}

.ai-node--1 { left: 10%; animation-delay: 0s; }
.ai-node--2 { right: 10%; animation-delay: -2s; background: radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%); }
.ai-node--3 { bottom: 0; animation-delay: -4s; background: radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 70%); }

/* Animations */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10px, -15px); }
}

.reveal-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-on-scroll.active {
  opacity: 1;
  transform: translateY(0);
}

/* Section Header Styles */
.section-header {
  max-width: 800px;
}

.section-title {
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.1;
  margin: 16px 0 24px;
}

.section-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

@media (max-width: 960px) {
  .bento-grid, .bento-footer-grid {
    grid-template-columns: 1fr;
  }
  .bento-subgrid {
    grid-template-columns: 1fr;
  }
  .section-title {
    font-size: 2.5rem;
  }
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

@media (max-width: 960px) {
  .landing-main {
    padding-top: 100px;
  }

  .hero-section {
    padding: 40px 0 60px;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .hero-title {
    font-size: 3rem;
    line-height: 1.1;
  }

  .hero-value-grid {
    gap: 20px;
    margin: 32px 0;
  }

  .value-block {
    padding-left: 18px;
  }

  .value-block p {
    font-size: 1rem;
  }

  .integration-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .diagram-shell {
    height: auto;
    padding: 20px 0;
  }

  .diagram-orbit {
    display: none;
  }

  .diagram-center {
    width: 120px;
    height: 120px;
    margin: 0 auto 32px;
  }

  .orbit-node {
    position: static;
    transform: none !important;
    margin-bottom: 12px;
    width: 100%;
    text-align: center;
  }

  .info-card {
    padding: 24px;
  }

  .section-title {
    font-size: 2.4rem;
  }
}

@media (max-width: 599px) {
  .nav-links {
    display: none;
  }

  .landing-navbar--scrolled {
    width: calc(100% - 20px);
    top: 10px;
  }

  .brand-mark__meta {
    display: none;
  }

  .hero-actions .v-btn {
    width: 100%;
  }

  .bento-content, .bento-item--large .bento-content {
    padding: 24px;
  }

  .bento-item h3 {
    font-size: 1.4rem;
  }
}
</style>
