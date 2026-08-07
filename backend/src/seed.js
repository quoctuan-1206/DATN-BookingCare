import dotenv from "dotenv";
import bcrypt from "bcrypt";
import prisma from "./config/prisma.js";

dotenv.config();

async function seed() {
  console.log("🌱 Seed: chỉ roles + Admin...");

  try {
    // 1. Roles (bắt buộc để gắn role_id Admin)
    const rolesCount = await prisma.roles.count();
    if (rolesCount === 0) {
      console.log("Nạp danh sách vai trò (roles)...");
      await prisma.roles.createMany({
        data: [
          { id: 1, name: "Admin", description: "Quản trị viên" },
          { id: 2, name: "Doctor", description: "Bác sĩ" },
          { id: 3, name: "Patient", description: "Bệnh nhân" },
          { id: 4, name: "Receptionist", description: "Tiếp tân" },
        ],
      });
    }

    // 2. Xóa toàn bộ dữ liệu nghiệp vụ / mẫu (giữ roles + sẽ tạo lại Admin)
    console.log("Dọn dữ liệu mẫu (giữ roles)...");

    await prisma.invoices.deleteMany();
    await prisma.medical_records.deleteMany();
    await prisma.prescription_details.deleteMany();
    await prisma.prescriptions.deleteMany();
    await prisma.reviews.deleteMany();
    await prisma.appointments.deleteMany();
    await prisma.schedules.deleteMany();
    await prisma.doctor_workplaces.deleteMany();
    await prisma.doctor_profiles.deleteMany();
    await prisma.patient_profiles.deleteMany();
    await prisma.notifications.deleteMany();
    await prisma.refresh_tokens.deleteMany();
    await prisma.otp_verifications.deleteMany();
    await prisma.articles.deleteMany();
    await prisma.medicines.deleteMany();
    await prisma.clinics.deleteMany();
    await prisma.specialties.deleteMany();
    await prisma.users.deleteMany();

    // 3. Tạo lại Admin
    console.log("Tạo tài khoản Admin...");
    const passwordHash = await bcrypt.hash("123456", 10);

    const adminsData = [
      {
        email: "admin@bookingcare.vn",
        first_name: "System",
        last_name: "Admin",
        phone: "0900000001",
        gender: "Male",
        address: "TP. Hồ Chí Minh",
      },
      {
        email: "admin2@bookingcare.vn",
        first_name: "Quản Trị",
        last_name: "Viên",
        phone: "0900000002",
        gender: "Female",
        address: "Hà Nội",
      },
    ];

    for (const admin of adminsData) {
      await prisma.users.create({
        data: {
          email: admin.email,
          password: passwordHash,
          first_name: admin.first_name,
          last_name: admin.last_name,
          phone: admin.phone,
          gender: admin.gender,
          address: admin.address,
          role_id: 1,
          is_active: true,
        },
      });
      console.log(`✅ Admin: ${admin.email} / 123456`);
    }

    console.log("🎉 Xong. Chỉ còn roles + 2 Admin.");
  } catch (error) {
    console.error("❌ Lỗi khi seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
