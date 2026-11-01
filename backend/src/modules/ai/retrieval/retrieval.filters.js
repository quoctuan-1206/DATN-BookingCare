const DOCTOR_ROLE_ID = 2;

function nameTokens(value) {
  return value?.trim().split(/\s+/).filter(Boolean) || [];
}

export function buildDoctorNameWhere(value) {
  const tokens = nameTokens(value);
  if (tokens.length === 0) return undefined;
  return {
    AND: tokens.map((token) => ({
      OR: [
        { first_name: { contains: token } },
        { last_name: { contains: token } },
      ],
    })),
  };
}

function doctorProfileUserWhere(filters) {
  return {
    users: {
      is_active: true,
      role_id: DOCTOR_ROLE_ID,
      ...(buildDoctorNameWhere(filters.doctorName) || {}),
    },
  };
}

export function buildWorkplaceWhere(filters, { withUser = false } = {}) {
  const where = {
    is_active: true,
    clinics: { is_active: true },
    specialties: { is_active: true },
  };

  if (filters.specialty) {
    where.specialties = { is_active: true, name: { contains: filters.specialty } };
  }
  if (filters.clinicName) {
    where.clinics = { is_active: true, name: { contains: filters.clinicName } };
  }
  if (filters.district) {
    where.clinics = {
      ...where.clinics,
      address: { contains: filters.district },
    };
  }

  if (withUser) where.doctor_profiles = doctorProfileUserWhere(filters);

  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    where.OR = [
      { consultation_fee: { lte: filters.maxPrice } },
      {
        consultation_fee: null,
        doctor_profiles: { consultation_fee: { lte: filters.maxPrice } },
      },
      {
        consultation_fee: null,
        doctor_profiles: { consultation_fee: null },
      },
    ];
  }
  return where;
}

export function buildActiveDoctorWhere(filters) {
  const where = {
    role_id: DOCTOR_ROLE_ID,
    is_active: true,
    doctor_profiles: {
      doctor_workplaces: { some: buildWorkplaceWhere(filters) },
    },
  };
  const nameWhere = buildDoctorNameWhere(filters.doctorName);
  if (nameWhere) Object.assign(where, nameWhere);
  return where;
}

export function buildActiveClinicWhere(filters) {
  const where = { is_active: true };
  if (filters.clinicName) where.name = { contains: filters.clinicName };
  if (filters.district) where.address = { contains: filters.district };

  const workplaceWhere = buildWorkplaceWhere(filters, { withUser: true });
  const hasWorkplaceFilter = Boolean(
    filters.specialty || filters.doctorName || filters.maxPrice !== null && filters.maxPrice !== undefined,
  );
  if (hasWorkplaceFilter) {
    // A clinic is included only when one active workplace satisfies all of
    // the requested specialty, doctor and fee conditions together.
    delete workplaceWhere.clinics;
    where.doctor_workplaces = { some: workplaceWhere };
  }
  return where;
}

export function buildActiveSpecialtyWhere(filters) {
  const where = { is_active: true };
  if (filters.specialty) {
    where.name = { contains: filters.specialty };
  }
  return where;
}
