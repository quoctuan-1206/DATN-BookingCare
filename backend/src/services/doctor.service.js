import bcrypt from "bcrypt";
import doctorRepository from "../repositories/doctor.repository.js";

class DoctorService {
  // Chuẩn hóa định dạng dữ liệu bác sĩ trả về cho API
  formatDoctorResponse(user) {
    if (!user) return null;

    const profile = user.doctor_profiles || {};
    const workplaces = profile.doctor_workplaces || [];
    const activeWorkplace = workplaces[0] || null;
    const specialty = activeWorkplace?.specialties || null;
    const clinic = activeWorkplace?.clinics || null;

      const reviews = user.reviews || [];
    let avgRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      avgRating = Number((sum / reviews.length).toFixed(1));
    }

    const degreeStr = profile.degree ? `${profile.degree} ` : "";
    const name = `${degreeStr}${user.last_name || ""} ${user.first_name || ""}`.trim();
    const fee = activeWorkplace?.consultation_fee ?? profile.consultation_fee ?? 0;

    return {
      id: user.id,
      profile_id: profile.id || null,
      email: user.email,
      name,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || null,
      gender: user.gender || null,
      date_of_birth: user.date_of_birth ? user.date_of_birth.toISOString().split("T")[0] : null,
      address: user.address || null,
      avatar: user.avatar || null,
      is_active: user.is_active,
      degree: profile.degree || null,
      position: profile.position || null,
      experience_years: profile.experience_years ?? 0,
      biography: profile.biography || null,
      consultation_fee: Number(fee),
      specialty: specialty?.name || null,
      specialty_id: specialty?.id || null,
      clinic: clinic?.name || null,
      clinic_id: clinic?.id || null,
      room: activeWorkplace?.room || null,
      clinic_address: clinic?.address || null,
      workplaces: workplaces.map((w) => ({
        id: w.id,
        clinic_id: w.clinic_id,
        clinic_name: w.clinics?.name,
        clinic_address: w.clinics?.address,
        specialty_id: w.specialty_id,
        specialty_name: w.specialties?.name,
        room: w.room,
        consultation_fee: Number(w.consultation_fee),
      })),
      rating: avgRating,
      review_count: reviews.length,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        patient_name: r.patient_profiles?.full_name || "Bệnh nhân",
      })),
    };
  }

  // Lấy danh sách bác sĩ
  async getAllDoctors(queryParams) {
    const { total, users, page, limit } = await doctorRepository.findAll(queryParams);

    const doctors = users.map((u) => this.formatDoctorResponse(u));

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      data: doctors,
    };
  }

  // Lấy thông tin chi tiết bác sĩ theo ID
  async getDoctorById(id) {
    const user = await doctorRepository.findById(id);
    if (!user) {
      const error = new Error("Không tìm thấy bác sĩ");
      error.statusCode = 404;
      throw error;
    }
    return this.formatDoctorResponse(user);
  }

  // Tạo mới bác sĩ
  async createDoctor(data) {
    // 1. Kiểm tra email đã tồn tại hay chưa
    const existingUser = await doctorRepository.findByEmail(data.email);
    if (existingUser) {
      const error = new Error("Email đã tồn tại trong hệ thống");
      error.statusCode = 400;
      throw error;
    }

    // 2. Kiểm tra phòng khám / chuyên khoa tồn tại
    const [clinic, specialty] = await Promise.all([
      doctorRepository.findClinicById(data.clinic_id),
      doctorRepository.findSpecialtyById(data.specialty_id),
    ]);

    if (!clinic || clinic.is_active === false) {
      const error = new Error("Phòng khám không tồn tại hoặc đã bị khóa");
      error.statusCode = 400;
      throw error;
    }

    if (!specialty || specialty.is_active === false) {
      const error = new Error("Chuyên khoa không tồn tại hoặc đã bị khóa");
      error.statusCode = 400;
      throw error;
    }

    // 3. Mã hóa mật khẩu bằng bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // 4. Phân tách dữ liệu tài khoản, hồ sơ và nơi làm việc
    const userData = {
      email: data.email,
      password: hashedPassword,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      gender: data.gender,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      address: data.address,
      avatar: data.avatar,
    };

    const profileData = {
      position: data.position,
      degree: data.degree,
      experience_years: data.experience_years,
      consultation_fee: data.consultation_fee,
      biography: data.biography,
    };

    const workplaceData = {
      clinic_id: data.clinic_id,
      specialty_id: data.specialty_id,
      room: data.room,
    };

    // Loại bỏ các trường undefined
    Object.keys(userData).forEach((key) => userData[key] === undefined && delete userData[key]);
    Object.keys(profileData).forEach((key) => profileData[key] === undefined && delete profileData[key]);
    Object.keys(workplaceData).forEach((key) => workplaceData[key] === undefined && delete workplaceData[key]);

    try {
      const createdUser = await doctorRepository.create(
        userData,
        profileData,
        workplaceData,
      );
      return this.formatDoctorResponse(createdUser);
    } catch (error) {
      if (error.code === "P2003") {
        const err = new Error(
          "Phòng khám hoặc chuyên khoa không hợp lệ",
        );
        err.statusCode = 400;
        throw err;
      }
      throw error;
    }
  }

  // Cập nhật thông tin bác sĩ
  async updateDoctor(id, data) {
    // 1. Kiểm tra bác sĩ có tồn tại hay không
    const existingUser = await doctorRepository.findById(id);
    if (!existingUser) {
      const error = new Error("Không tìm thấy bác sĩ");
      error.statusCode = 404;
      throw error;
    }

    // 2. Phân tách các trường dữ liệu cập nhật
    const userData = {};
    if (data.first_name !== undefined) userData.first_name = data.first_name;
    if (data.last_name !== undefined) userData.last_name = data.last_name;
    if (data.phone !== undefined) userData.phone = data.phone;
    if (data.gender !== undefined) userData.gender = data.gender;
    if (data.date_of_birth !== undefined) userData.date_of_birth = data.date_of_birth ? new Date(data.date_of_birth) : null;
    if (data.address !== undefined) userData.address = data.address;
    if (data.avatar !== undefined) userData.avatar = data.avatar;
    if (data.is_active !== undefined) userData.is_active = data.is_active;

    const profileData = {};
    if (data.position !== undefined) profileData.position = data.position;
    if (data.degree !== undefined) profileData.degree = data.degree;
    if (data.experience_years !== undefined) profileData.experience_years = data.experience_years;
    if (data.consultation_fee !== undefined) profileData.consultation_fee = data.consultation_fee;
    if (data.biography !== undefined) profileData.biography = data.biography;

    const workplaceData = {};
    if (data.clinic_id !== undefined) workplaceData.clinic_id = data.clinic_id;
    if (data.specialty_id !== undefined) workplaceData.specialty_id = data.specialty_id;
    if (data.room !== undefined) workplaceData.room = data.room;

    const updatedUser = await doctorRepository.update(id, userData, profileData, workplaceData);

    return this.formatDoctorResponse(updatedUser);
  }

  // Kiểm tra quyền quản lý bác sĩ (Admin hoặc chính bác sĩ đó)
  assertCanManageDoctor(doctorId, currentUser) {
    const role = currentUser?.role?.name;
    if (role === "Admin") return;
    if (role === "Doctor" && Number(doctorId) === Number(currentUser.id)) return;

    const error = new Error("Bạn không có quyền quản lý bác sĩ này");
    error.statusCode = 403;
    throw error;
  }

  // Thêm nơi làm việc cho bác sĩ
  async addWorkplace(doctorId, data, currentUser) {
    this.assertCanManageDoctor(doctorId, currentUser);

    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor || doctor.is_active === false) {
      const error = new Error("Không tìm thấy bác sĩ");
      error.statusCode = 404;
      throw error;
    }

    const [clinic, specialty] = await Promise.all([
      doctorRepository.findClinicById(data.clinic_id),
      doctorRepository.findSpecialtyById(data.specialty_id),
    ]);

    if (!clinic || clinic.is_active === false) {
      const error = new Error("Phòng khám không tồn tại hoặc đã bị khóa");
      error.statusCode = 400;
      throw error;
    }

    if (!specialty || specialty.is_active === false) {
      const error = new Error("Chuyên khoa không tồn tại hoặc đã bị khóa");
      error.statusCode = 400;
      throw error;
    }

    try {
      const user = await doctorRepository.addWorkplace(doctorId, data);
      return this.formatDoctorResponse(user);
    } catch (error) {
      if (error.code === "P2002") {
        const err = new Error(
          "Bác sĩ đã đăng ký phòng khám + chuyên khoa này",
        );
        err.statusCode = 409;
        throw err;
      }
      throw error;
    }
  }

  // Cập nhật nơi làm việc của bác sĩ
  async updateWorkplace(doctorId, workplaceId, data, currentUser) {
    this.assertCanManageDoctor(doctorId, currentUser);
    const user = await doctorRepository.updateWorkplace(
      doctorId,
      workplaceId,
      data,
    );
    return this.formatDoctorResponse(user);
  }

  // Xóa (ngưng) nơi làm việc của bác sĩ
  async removeWorkplace(doctorId, workplaceId, currentUser) {
    this.assertCanManageDoctor(doctorId, currentUser);
    const user = await doctorRepository.removeWorkplace(doctorId, workplaceId);
    return this.formatDoctorResponse(user);
  }

  // Xóa mềm bác sĩ
  async deleteDoctor(id) {
    const existingUser = await doctorRepository.findById(id);
    if (!existingUser) {
      const error = new Error("Không tìm thấy bác sĩ");
      error.statusCode = 404;
      throw error;
    }

    // Thực hiện xóa mềm (is_active = false)
    await doctorRepository.softDelete(id);

    return {
      message: `Đã vô hiệu hóa (xóa mềm) bác sĩ ID ${id} thành công`,
    };
  }
}

export default new DoctorService();
