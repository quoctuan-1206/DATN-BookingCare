import dotenv from "dotenv";
import bcrypt from "bcrypt";
import prisma from "./config/prisma.js";

dotenv.config();

async function seed() {
  console.log("🌱 Bắt đầu tạo dữ liệu mẫu (Seed Data)...");

  try {
    // 1. Kiểm tra và nạp danh sách vai trò (roles)
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

    // 2. Nạp danh sách chuyên khoa (specialties)
    console.log("Nạp danh sách chuyên khoa...");
    const spec1 = await prisma.specialties.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "Tim mạch",
        description: "Khám và điều trị các bệnh về tim, huyết áp và hệ tuần hoàn.",
        image: "https://picsum.photos/600/400?spec1",
      },
    });

    const spec2 = await prisma.specialties.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: "Da liễu",
        description: "Khám các bệnh về da, tóc, móng và thẩm mỹ da liễu.",
        image: "https://picsum.photos/600/400?spec2",
      },
    });

    const spec3 = await prisma.specialties.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: "Nhi khoa",
        description: "Chăm sóc sức khỏe trẻ em từ sơ sinh đến vị thành niên.",
        image: "https://picsum.photos/600/400?spec3",
      },
    });

    const spec4 = await prisma.specialties.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4,
        name: "Tai Mũi Họng",
        description: "Khám và điều trị bệnh tai, mũi, họng.",
        image: "https://picsum.photos/600/400?spec4",
      },
    });

    // 3. Nạp danh sách phòng khám / cơ sở y tế (clinics)
    console.log("Nạp danh sách phòng khám...");
    const clinic1 = await prisma.clinics.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "Bệnh viện Chợ Rẫy",
        address: "201B Nguyễn Chí Thanh, Quận 5, TP. Hồ Chí Minh",
        phone: "02838554137",
        email: "info@choray.vn",
        description: "Bệnh viện đa khoa trung ương hàng đầu phía Nam.",
        image: "https://picsum.photos/600/400?clinic1",
        is_active: true,
      },
    });

    const clinic2 = await prisma.clinics.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: "Bệnh viện Bạch Mai",
        address: "78 Giải Phóng, Đống Đa, Hà Nội",
        phone: "02438693731",
        email: "info@bachmai.vn",
        description: "Bệnh viện đa khoa hạng đặc biệt tại Hà Nội.",
        image: "https://picsum.photos/600/400?clinic2",
        is_active: true,
      },
    });

    const clinic3 = await prisma.clinics.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: "Bệnh viện Đại học Y Dược",
        address: "215 Hồng Bàng, Quận 5, TP. Hồ Chí Minh",
        phone: "02838554269",
        email: "info@umc.edu.vn",
        description: "Bệnh viện trường đại học y khoa uy tín.",
        image: "https://picsum.photos/600/400?clinic3",
        is_active: true,
      },
    });

    // 4. Nạp 2 tài khoản Admin (cấp seed — Admin sẽ cấp tài khoản Doctor)
    console.log("Nạp tài khoản Admin...");
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
      const existing = await prisma.users.findUnique({
        where: { email: admin.email },
      });

      if (!existing) {
        await prisma.users.create({
          data: {
            email: admin.email,
            password: passwordHash,
            first_name: admin.first_name,
            last_name: admin.last_name,
            phone: admin.phone,
            gender: admin.gender,
            address: admin.address,
            role_id: 1, // Admin
            is_active: true,
          },
        });
        console.log(`✅ Đã tạo Admin: ${admin.email}`);
      } else {
        console.log(`⏭️  Admin đã tồn tại: ${admin.email}`);
      }
    }

    // 5. Nạp danh sách bác sĩ mẫu (users, doctor_profiles, doctor_workplaces)
    console.log("Nạp danh sách bác sĩ...");

    const doctorsData = [
      {
        email: "bs.nguyenvana@gmail.com",
        first_name: "Văn A",
        last_name: "Nguyễn",
        phone: "0901111001",
        gender: "Male",
        date_of_birth: new Date("1980-05-12"),
        address: "Quận 1, TP. Hồ Chí Minh",
        avatar: "https://picsum.photos/300/300?1",
        position: "Trưởng khoa",
        degree: "TS.BS",
        experience_years: 18,
        consultation_fee: 500000,
        biography: "Chuyên gia tim mạch với 18 năm kinh nghiệm điều trị bệnh lý mạch vành.",
        clinic_id: clinic1.id,
        specialty_id: spec1.id,
        room: "P.201",
      },
      {
        email: "bs.tranthib@gmail.com",
        first_name: "Thị B",
        last_name: "Trần",
        phone: "0901111002",
        gender: "Female",
        date_of_birth: new Date("1985-03-20"),
        address: "Đống Đa, Hà Nội",
        avatar: "https://picsum.photos/300/300?2",
        position: "Bác sĩ điều trị",
        degree: "BS.CKII",
        experience_years: 12,
        consultation_fee: 400000,
        biography: "Chuyên khám và điều trị các bệnh da liễu thường gặp và thẩm mỹ da.",
        clinic_id: clinic2.id,
        specialty_id: spec2.id,
        room: "P.105",
      },
      {
        email: "bs.levanc@gmail.com",
        first_name: "Văn C",
        last_name: "Lê",
        phone: "0901111003",
        gender: "Male",
        date_of_birth: new Date("1978-08-15"),
        address: "Quận 5, TP. Hồ Chí Minh",
        avatar: "https://picsum.photos/300/300?3",
        position: "Phó Trưởng khoa",
        degree: "PGS.TS.BS",
        experience_years: 20,
        consultation_fee: 600000,
        biography: "Chuyên gia Nhi khoa, tư vấn và khám bệnh nhi sơ sinh đến 15 tuổi.",
        clinic_id: clinic3.id,
        specialty_id: spec3.id,
        room: "P.302",
      },
      {
        email: "bs.phamthid@gmail.com",
        first_name: "Thị D",
        last_name: "Phạm",
        phone: "0901111004",
        gender: "Female",
        date_of_birth: new Date("1988-11-05"),
        address: "Quận 3, TP. Hồ Chí Minh",
        avatar: "https://picsum.photos/300/300?4",
        position: "Bác sĩ điều trị",
        degree: "BS",
        experience_years: 9,
        consultation_fee: 350000,
        biography: "Khám và điều trị nội soi Tai Mũi Họng kỹ thuật cao.",
        clinic_id: clinic1.id,
        specialty_id: spec4.id,
        room: "P.112",
      },
    ];

    for (const d of doctorsData) {
      const existing = await prisma.users.findUnique({ where: { email: d.email } });
      if (!existing) {
        const user = await prisma.users.create({
          data: {
            email: d.email,
            password: passwordHash,
            first_name: d.first_name,
            last_name: d.last_name,
            phone: d.phone,
            gender: d.gender,
            date_of_birth: d.date_of_birth,
            address: d.address,
            avatar: d.avatar,
            role_id: 2, // Bác sĩ
            is_active: true,
          },
        });

        await prisma.doctor_profiles.create({
          data: {
            user_id: user.id,
            position: d.position,
            degree: d.degree,
            experience_years: d.experience_years,
            consultation_fee: d.consultation_fee,
            biography: d.biography,
          },
        });

        await prisma.doctor_workplaces.create({
          data: {
            doctor_id: user.id,
            clinic_id: d.clinic_id,
            specialty_id: d.specialty_id,
            room: d.room,
            consultation_fee: d.consultation_fee,
            is_active: true,
          },
        });

        console.log(`✅ Đã tạo bác sĩ: ${d.last_name} ${d.first_name} (${d.email})`);
      }
    }

    console.log("🎉 Hoàn tất nạp dữ liệu mẫu thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi seed data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
