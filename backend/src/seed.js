import dotenv from "dotenv";
import bcrypt from "bcrypt";
import prisma from "./config/prisma.js";

dotenv.config();

async function seed() {
  console.log("🌱 Seed: chỉ roles + Admin...");

  try {
    // 1. Roles (bắt buộc để gắn role_id Admin)
    const roles = [
      { name: "Admin", description: "Quản trị viên" },
      { name: "Doctor", description: "Bác sĩ" },
      { name: "Patient", description: "Bệnh nhân" },
      { name: "Receptionist", description: "Tiếp tân" },
      { name: "STAFF", description: "Nhân viên xét nghiệm" },
    ];
    console.log("Nạp danh sách vai trò (roles)...");
    for (const role of roles) {
      await prisma.roles.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: role,
      });
    }

    // 2. Xóa toàn bộ dữ liệu nghiệp vụ / mẫu (giữ roles + sẽ tạo lại Admin)
    console.log("Dọn dữ liệu mẫu (giữ roles)...");

    await prisma.lab_results.deleteMany();
    await prisma.lab_orders.deleteMany();
    await prisma.lab_tests.deleteMany();
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

    console.log("Nạp danh mục thuốc mẫu...");
    await prisma.medicines.createMany({
      data: [
        {
          name: "Paracetamol 500mg",
          unit: "viên",
          price: 1500,
          description: "Hạ sốt, giảm đau",
        },
        {
          name: "Amoxicillin 500mg",
          unit: "viên",
          price: 3500,
          description: "Kháng sinh",
        },
        {
          name: "Omeprazole 20mg",
          unit: "viên",
          price: 2800,
          description: "Điều trị viêm loét dạ dày",
        },
        {
          name: "Vitamin C 500mg",
          unit: "viên",
          price: 1200,
          description: "Bổ sung vitamin C",
        },
        {
          name: "Salbutamol 2mg",
          unit: "viên",
          price: 4200,
          description: "Giãn phế quản",
        },
      ],
    });
    console.log("✅ Đã thêm 5 thuốc mẫu.");
  } catch (error) {
    console.error("❌ Lỗi khi seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
