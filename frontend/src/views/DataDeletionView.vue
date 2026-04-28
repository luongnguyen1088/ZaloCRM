<template>
  <div class="legal-page">
    <v-container class="py-10">
      <v-card class="legal-card mx-auto" max-width="920" rounded="xl" elevation="0">
        <v-card-text class="pa-8 pa-md-10">
          <div class="eyebrow mb-4">Claro</div>
          <h1 class="text-h3 font-weight-bold mb-3">Hướng dẫn xóa dữ liệu</h1>
          <p class="text-body-1 text-medium-emphasis mb-8">
            Nếu bạn đã kết nối Facebook Fanpage hoặc dùng Claro và muốn yêu cầu xóa dữ liệu liên quan đến tài khoản,
            hãy làm theo một trong các cách dưới đây.
          </p>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">1. Xóa từ trong hệ thống</h2>
            <p class="text-body-1 mb-0">
              Quản trị viên hoặc người có quyền quản lý tài khoản có thể đăng nhập vào Claro, vào mục
              <strong>Tài khoản Zalo</strong> và ngắt kết nối hoặc xóa tài khoản/Fanpage khỏi workspace.
            </p>
          </section>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">2. Gửi yêu cầu thủ công</h2>
            <p class="text-body-1 mb-3">
              Nếu bạn không còn truy cập vào workspace, hãy gửi email tới
              <a class="legal-link" href="mailto:contact@claro.vn">contact@claro.vn</a> với các thông tin:
            </p>
            <ul class="text-body-1 list">
              <li>Tên Fanpage hoặc tài khoản đã kết nối</li>
              <li>ID Fanpage hoặc thông tin nhận diện liên quan</li>
              <li>Mô tả yêu cầu xóa dữ liệu</li>
              <li>Email hoặc số điện thoại để xác minh quyền sở hữu</li>
            </ul>
          </section>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">3. Phạm vi xóa</h2>
            <p class="text-body-1 mb-0">
              Sau khi xác minh yêu cầu hợp lệ, chúng tôi sẽ xóa hoặc vô hiệu hóa dữ liệu liên quan trong phạm vi hệ
              thống Claro, bao gồm cấu hình kết nối, dữ liệu đồng bộ và dữ liệu CRM gắn với tài khoản đó nếu phù hợp
              với chính sách vận hành và yêu cầu pháp lý.
            </p>
          </section>

          <section>
            <h2 class="text-h6 font-weight-bold mb-3">4. Thời gian xử lý</h2>
            <p class="text-body-1 mb-0">
              Yêu cầu hợp lệ thường được phản hồi trong thời gian hợp lý sau khi hoàn tất xác minh.
            </p>
          </section>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100%;
}

.legal-card {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-md);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.legal-link {
  color: var(--color-primary);
  text-decoration: none;
}

.legal-link:hover {
  text-decoration: underline;
}

.list {
  padding-left: 20px;
}
</style>
