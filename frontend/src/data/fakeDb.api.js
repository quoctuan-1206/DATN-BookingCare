
import { CURRENT_PATIENT_USER_ID, fakeDb } from "./fakeDb";

export const GENDER_LABEL = {
    Male: "Nam",
    Female: "Nữ",
    Other: "Khác",
};

export const RELATIONSHIP_LABEL = {
    Self: "Bản thân",
    Mother: "Mẹ",
    Father: "Bố",
    Child: "Con",
    Spouse: "Vợ/Chồng",
    Other: "Khác",
};

export const STATUS_LABEL = {
    PENDING: "Đang chờ",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
};

export const STATUS_CLASS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

export function formatDate(isoDate) {
    if (!isoDate) return "—";
    const [y, m, d] = String(isoDate).split("-");
    if (!d) return isoDate;
    return `${d}/${m}/${y}`;
}

export function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
}

export function formatMoneyShort(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

export function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN");
}

function doctorDisplayName(user, profile) {
    const degree = profile?.degree ? `${profile.degree} ` : "";
    return `${degree}${user.last_name} ${user.first_name}`.trim();
}

function avgRating(doctorUserId) {
    const list = fakeDb.reviews.filter((r) => r.doctor_id === doctorUserId);
    if (!list.length) return 4.8;
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / list.length).toFixed(1));
}

export function getUserById(id) {
    return fakeDb.users.find((u) => u.id === Number(id));
}

export function getClinicById(id) {
    return fakeDb.clinics.find((c) => c.id === Number(id));
}

export function getSpecialtyById(id) {
    return fakeDb.specialties.find((s) => s.id === Number(id));
}

export function getDoctorProfileByUserId(userId) {
    return fakeDb.doctor_profiles.find((d) => d.user_id === Number(userId));
}

export function getWorkplaceById(id) {
    return fakeDb.doctor_workplaces.find((w) => w.id === Number(id));
}

export function getScheduleById(id) {
    return fakeDb.schedules.find((s) => s.id === Number(id));
}

export function getProfileById(id) {
    return fakeDb.patient_profiles.find((p) => p.id === Number(id));
}

export function getAppointmentById(id) {
    return fakeDb.appointments.find((a) => a.id === Number(id));
}

export function getInvoiceByAppointmentId(appointmentId) {
    return fakeDb.invoices.find(
        (i) => i.appointment_id === Number(appointmentId)
    );
}

export function getMedicalRecordById(id) {
    return fakeDb.medical_records.find((r) => r.id === Number(id));
}

export function getMedicalRecordByAppointmentId(appointmentId) {
    return fakeDb.medical_records.find(
        (r) => r.appointment_id === Number(appointmentId)
    );
}

export function getClinics() {
    return fakeDb.clinics.map((clinic) => {
        const addressShort = clinic.address.includes("Hà Nội")
            ? "Hà Nội"
            : "TP Hồ Chí Minh";
        return {
            ...clinic,
            address_full: clinic.address,
            address: addressShort,
        };
    });
}

export function getClinicDetail(id) {
    const clinic = getClinicById(id);
    if (!clinic) return null;

    const doctors = getDoctorsByClinicId(id).map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
    }));

    return {
        ...clinic,
        address: clinic.address.includes("Hà Nội")
            ? "Hà Nội"
            : "TP Hồ Chí Minh",
        address_full: clinic.address,
        mapQuery: encodeURIComponent(clinic.name),
        images: [
            clinic.image,
            `https://picsum.photos/400/300?c${clinic.id}a`,
            `https://picsum.photos/400/300?c${clinic.id}b`,
        ],
        doctors,
    };
}

export function getSpecialtyDetail(id) {
    const specialty = getSpecialtyById(id);
    if (!specialty) return null;

    const doctors = getDoctorsBySpecialtyId(id).map((d) => ({
        id: d.id,
        name: d.name,
        hospital: d.clinic,
    }));

    const clinicIds = [
        ...new Set(
            fakeDb.doctor_workplaces
                .filter((w) => w.specialty_id === Number(id) && w.is_active)
                .map((w) => w.clinic_id)
        ),
    ];

    const clinics = clinicIds
        .map((clinicId) => getClinicById(clinicId))
        .filter(Boolean)
        .map((c) => ({ id: c.id, name: c.name }));

    return {
        ...specialty,
        doctors,
        clinics,
    };
}

export function getSpecialties() {
    return [...fakeDb.specialties];
}

export function getDoctors() {
    return fakeDb.doctor_profiles.map((profile) => {
        const user = getUserById(profile.user_id);
        const workplace =
            fakeDb.doctor_workplaces.find(
                (w) => w.doctor_id === profile.user_id && w.is_active
            ) || null;
        const specialty = workplace
            ? getSpecialtyById(workplace.specialty_id)
            : null;
        const clinic = workplace ? getClinicById(workplace.clinic_id) : null;
        const fee = workplace?.consultation_fee ?? profile.consultation_fee;

        return {
            id: profile.user_id,
            profile_id: profile.id,
            name: doctorDisplayName(user, profile),
            first_name: user.first_name,
            last_name: user.last_name,
            degree: profile.degree,
            position: profile.position,
            experience_years: profile.experience_years,
            biography: profile.biography,
            specialty: specialty?.name || "—",
            specialty_id: specialty?.id || null,
            clinic: clinic?.name || "—",
            clinic_id: clinic?.id || null,
            workplace_id: workplace?.id || null,
            image: user.avatar,
            avatar: user.avatar,
            rating: avgRating(profile.user_id),
            consultation_fee: fee,
            price: formatMoneyShort(fee),
        };
    });
}

export function getDoctorById(id) {
    return getDoctors().find((d) => d.id === Number(id)) || null;
}

export function getDoctorsBySpecialtyId(specialtyId) {
    return getDoctors().filter((d) => d.specialty_id === Number(specialtyId));
}

export function getDoctorsByClinicId(clinicId) {
    const doctorIds = fakeDb.doctor_workplaces
        .filter((w) => w.clinic_id === Number(clinicId) && w.is_active)
        .map((w) => w.doctor_id);
    return getDoctors().filter((d) => doctorIds.includes(d.id));
}

export function getSchedulesForDoctor(doctorUserId, workplaceId) {
    const workplaces = fakeDb.doctor_workplaces.filter((w) => {
        if (workplaceId) return w.id === Number(workplaceId);
        return w.doctor_id === Number(doctorUserId) && w.is_active;
    });
    const workplaceIds = workplaces.map((w) => w.id);

    return fakeDb.schedules
        .filter((s) => workplaceIds.includes(s.doctor_workplace_id))
        .map((s) => ({
            ...s,
            date_display: formatDate(s.work_date),
            time: `${s.start_time} - ${s.end_time}`,
            available: s.booked_patients < s.max_patients,
        }))
        .sort((a, b) =>
            `${a.work_date}${a.start_time}`.localeCompare(
                `${b.work_date}${b.start_time}`
            )
        );
}

export function getScheduleDateOptions(doctorUserId) {
    const schedules = getSchedulesForDoctor(doctorUserId);
    const unique = [...new Set(schedules.map((s) => s.work_date))];
    return unique.map((work_date) => ({
        value: work_date,
        label: formatDate(work_date),
    }));
}

export function getSlotsByDoctorAndDate(doctorUserId, workDate) {
    return getSchedulesForDoctor(doctorUserId).filter(
        (s) => s.work_date === workDate
    );
}

export function getCurrentAccount() {
    return getUserById(CURRENT_PATIENT_USER_ID);
}

export function getPatientProfiles(accountId = CURRENT_PATIENT_USER_ID) {
    return fakeDb.patient_profiles.filter(
        (p) => p.account_id === Number(accountId)
    );
}

/** Shape dùng cho Booking PatientSelector */
export function getBookingPatients(accountId = CURRENT_PATIENT_USER_ID) {
    return getPatientProfiles(accountId).map((p) => ({
        id: p.id,
        fullName: p.full_name,
        relationship: RELATIONSHIP_LABEL[p.relationship] || p.relationship,
        gender: GENDER_LABEL[p.gender] || p.gender,
        dateOfBirth: formatDate(p.date_of_birth),
        phone: p.phone,
        raw: p,
    }));
}

export function enrichAppointment(appointment) {
    const schedule = getScheduleById(appointment.schedule_id);
    const workplace = schedule
        ? getWorkplaceById(schedule.doctor_workplace_id)
        : null;
    const doctor = workplace ? getDoctorById(workplace.doctor_id) : null;
    const profile = getProfileById(appointment.patient_profile_id);
    const invoice = getInvoiceByAppointmentId(appointment.id);

    return {
        ...appointment,
        schedule_id: appointment.schedule_id,
        work_date: schedule?.work_date,
        start_time: schedule?.start_time,
        end_time: schedule?.end_time,
        time: schedule
            ? `${schedule.start_time} - ${schedule.end_time}`
            : "—",
        date_display: formatDate(schedule?.work_date),
        doctor_id: doctor?.id,
        doctor_name: doctor?.name || "—",
        specialty: doctor?.specialty || "—",
        clinic: doctor?.clinic || "—",
        consultation_fee:
            invoice?.amount ??
            workplace?.consultation_fee ??
            doctor?.consultation_fee ??
            0,
        patient_name: profile?.full_name || "—",
        patient_phone: profile?.phone || "—",
        payment_method: invoice?.payment_method || "CASH",
        payment_status: invoice?.payment_status || "UNPAID",
    };
}

export function getAppointments() {
    return fakeDb.appointments.map(enrichAppointment);
}

export function getEnrichedAppointmentById(id) {
    const raw = getAppointmentById(id);
    return raw ? enrichAppointment(raw) : null;
}

export function enrichMedicalRecord(record) {
    const appointment = getEnrichedAppointmentById(record.appointment_id);
    const prescription = fakeDb.prescriptions.find(
        (p) => p.medical_record_id === record.id
    );

    return {
        ...record,
        appointment,
        doctor_name: appointment?.doctor_name || "—",
        clinic: appointment?.clinic || "—",
        specialty: appointment?.specialty || "—",
        patient_name: appointment?.patient_name || "—",
        booking_code: appointment?.booking_code || "—",
        work_date: appointment?.work_date,
        date_display: appointment?.date_display || "—",
        has_prescription: Boolean(prescription),
    };
}

export function getMedicalRecords() {
    return fakeDb.medical_records.map(enrichMedicalRecord);
}

export function getNotifications(userId = CURRENT_PATIENT_USER_ID) {
    return fakeDb.notifications.filter((n) => n.user_id === Number(userId));
}

export function getDashboardStats(userId = CURRENT_PATIENT_USER_ID) {
    const appointments = getAppointments().filter((a) => {
        const profile = getProfileById(a.patient_profile_id);
        return profile?.account_id === Number(userId);
    });

    return {
        total: appointments.length,
        pending: appointments.filter((a) => a.status === "PENDING").length,
        confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
        completed: appointments.filter((a) => a.status === "COMPLETED").length,
        unread: getNotifications(userId).filter((n) => !n.is_read).length,
    };
}

export function getUpcomingAppointments(userId = CURRENT_PATIENT_USER_ID) {
    return getAppointments()
        .filter((a) => {
            const profile = getProfileById(a.patient_profile_id);
            if (profile?.account_id !== Number(userId)) return false;
            return a.status === "PENDING" || a.status === "CONFIRMED";
        })
        .sort((a, b) =>
            `${a.work_date}${a.start_time}`.localeCompare(
                `${b.work_date}${b.start_time}`
            )
        );
}

export function getNextAppointmentLabel(userId = CURRENT_PATIENT_USER_ID) {
    const next = getUpcomingAppointments(userId)[0];
    if (!next) return "Chưa có lịch";
    return `${next.date_display} - ${next.start_time}`;
}

export function getReviewsByDoctorId(doctorUserId) {
    return fakeDb.reviews
        .filter((r) => r.doctor_id === Number(doctorUserId))
        .map((r) => {
            const profile = getProfileById(r.patient_profile_id);
            return {
                ...r,
                patient_name: profile?.full_name || "Ẩn danh",
            };
        });
}

export function getDefaultBookingPayload() {
    const doctor = getDoctorById(10);
    const schedule = getScheduleById(11);
    return {
        doctor: {
            id: doctor.id,
            name: doctor.name,
            avatar: doctor.avatar,
            specialty: doctor.specialty,
            clinic: doctor.clinic,
            consultationFee: doctor.consultation_fee,
        },
        schedule: {
            id: schedule.id,
            date: formatDate(schedule.work_date),
            work_date: schedule.work_date,
            start: schedule.start_time,
            end: schedule.end_time,
            time: `${schedule.start_time} - ${schedule.end_time}`,
        },
    };
}

/** Alias tương thích patientMock cũ */
export const db = {
    get account() {
        return getCurrentAccount();
    },
    get patient_profiles() {
        return getPatientProfiles();
    },
    get appointments() {
        return getAppointments();
    },
    get medical_records() {
        return fakeDb.medical_records;
    },
    get notifications() {
        return getNotifications();
    },
};
