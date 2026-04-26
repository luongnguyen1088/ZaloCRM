<template>
  <div class="legal-page">
    <v-container class="py-10">
      <v-card class="legal-card mx-auto" max-width="980" rounded="xl" elevation="0">
        <v-card-text class="pa-8 pa-md-10">
          <div class="eyebrow mb-4">ZaloCRM</div>
          <h1 class="text-h3 font-weight-bold mb-3">Chính sách bảo mật</h1>
          <p class="text-body-1 text-medium-emphasis mb-8">
            Chính sách này áp dụng cho webapp ZaloCRM tại <strong>zalo.claro.vn</strong> và các kết nối
            Facebook Fanpage, Zalo cá nhân được người dùng chủ động cấp quyền trong hệ thống.
          </p>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">1. Dữ liệu chúng tôi xử lý</h2>
            <p class="text-body-1 mb-0">
              Hệ thống có thể lưu trữ thông tin tài khoản kết nối, nội dung hội thoại, thông tin liên hệ khách hàng,
              lịch hẹn, dữ liệu đồng bộ từ nền tảng bên thứ ba và nhật ký hoạt động cần thiết để vận hành CRM.
            </p>
          </section>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">2. Mục đích sử dụng dữ liệu</h2>
            <p class="text-body-1 mb-0">
              Dữ liệu được sử dụng để hiển thị hội thoại, đồng bộ tin nhắn, quản lý khách hàng, phân quyền người dùng,
              vận hành các tính năng tự động hóa và hỗ trợ báo cáo nội bộ của tổ chức sử dụng ZaloCRM.
            </p>
          </section>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">3. Chia sẻ dữ liệu</h2>
            <p class="text-body-1 mb-0">
              Chúng tôi không bán dữ liệu cá nhân. Dữ liệu chỉ được chia sẻ khi cần để cung cấp tính năng đã được
              người dùng kích hoạt, đáp ứng yêu cầu pháp lý, hoặc theo chỉ đạo của tổ chức sở hữu workspace.
            </p>
          </section>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">4. Lưu trữ và bảo mật</h2>
            <p class="text-body-1 mb-0">
              Dữ liệu được lưu trên hạ tầng máy chủ của hệ thống và được bảo vệ bằng xác thực người dùng, phân quyền
              truy cập, cơ chế mã hóa khóa bí mật và các biện pháp kiểm soát vận hành phù hợp với CRM nội bộ.
            </p>
          </section>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">5. Quyền của người dùng</h2>
            <p class="text-body-1 mb-0">
              Người dùng có thể yêu cầu cập nhật, xuất hoặc xóa dữ liệu do mình quản lý thông qua quản trị viên của tổ
              chức hoặc theo hướng dẫn tại trang xóa dữ liệu.
            </p>
          </section>

          <section class="mb-7">
            <h2 class="text-h6 font-weight-bold mb-3">6. Xóa dữ liệu</h2>
            <p class="text-body-1 mb-0">
              Hướng dẫn yêu cầu xóa dữ liệu được công bố tại
              <router-link class="legal-link" to="/data-deletion">/data-deletion</router-link>.
            </p>
          </section>

          <section>
            <h2 class="text-h6 font-weight-bold mb-3">7. Liên hệ</h2>
            <p class="text-body-1 mb-2">
              Nếu bạn cần hỗ trợ về quyền riêng tư hoặc dữ liệu, vui lòng liên hệ:
            </p>
            <p class="text-body-1 mb-0">
              Email: <a class="legal-link" href="mailto:contact@claro.vn">contact@claro.vn</a><br>
              Website: <a class="legal-link" href="https://www.claro.vn" target="_blank" rel="noreferrer">www.claro.vn</a>
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
</style>
