function jsonId(value) {
  if (typeof value === "bigint") return value.toString();
  return value;
}

function numeric(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function displayName(user, degree = null) {
  const name = `${user.last_name || ""} ${user.first_name || ""}`.trim();
  return [degree, name].filter(Boolean).join(" ");
}

export function mapDoctorItem(user) {
  const profile = user.doctor_profiles;
  const workplaces = (profile?.doctor_workplaces || []).map((workplace) => {
    const fee = workplace.consultation_fee ?? profile.consultation_fee ?? 0;
    return {
      id: jsonId(workplace.id),
      clinic: {
        id: jsonId(workplace.clinics.id),
        name: workplace.clinics.name,
        address: workplace.clinics.address,
      },
      specialty: {
        id: jsonId(workplace.specialties.id),
        name: workplace.specialties.name,
      },
      consultation_fee: numeric(fee, 0),
      room: workplace.room || null,
    };
  });

  return {
    id: jsonId(user.id),
    name: displayName(user, profile?.degree),
    first_name: user.first_name,
    last_name: user.last_name,
    avatar: user.avatar || null,
    degree: profile?.degree || null,
    position: profile?.position || null,
    experience_years: profile?.experience_years ?? 0,
    workplaces,
  };
}

export function mapClinicItem(clinic) {
  const workplaces = clinic.doctor_workplaces || [];
  const specialties = new Map();
  const doctors = workplaces.map((workplace) => {
    const specialty = workplace.specialties;
    if (specialty) {
      specialties.set(String(specialty.id), {
        id: jsonId(specialty.id),
        name: specialty.name,
      });
    }

    const profile = workplace.doctor_profiles;
    const user = profile?.users;
    if (!user) return null;
    return {
      id: jsonId(user.id),
      name: displayName(user, profile?.degree),
      avatar: user.avatar || null,
      specialty: specialty ? { id: jsonId(specialty.id), name: specialty.name } : null,
      consultation_fee: numeric(
        workplace.consultation_fee ?? profile.consultation_fee ?? 0,
        0,
      ),
    };
  }).filter(Boolean);

  return {
    id: jsonId(clinic.id),
    name: clinic.name,
    address: clinic.address,
    image: clinic.image || null,
    description: clinic.description || null,
    specialties: [...specialties.values()],
    doctors,
  };
}

export function mapSpecialtyItem(specialty) {
  return {
    id: jsonId(specialty.id),
    name: specialty.name,
    description: specialty.description || null,
    image: specialty.image || null,
  };
}

export function makeRetrievalResult(entityType, items) {
  return {
    source: "DATABASE",
    entityType,
    // total is the number of matching items returned, capped by MAX_RESULTS.
    total: items.length,
    items,
  };
}

export function noRetrievalResult() {
  return { source: "NONE", entityType: null, total: 0, items: [] };
}
