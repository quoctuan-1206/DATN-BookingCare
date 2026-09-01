import axiosClient from "../api/axios";

export const GENDER_LABEL = {
  Male: "Nam",
  Female: "Nữ",
  Other: "Khác",
};

export const RELATIONSHIP_LABEL = {
  Self: "Bản thân",
  Spouse: "Vợ/Chồng",
  Child: "Con",
  Parent: "Cha/Mẹ",
  Sibling: "Anh/Chị/Em",
  Other: "Khác",
};

export function mapPatientProfile(profile) {
  if (!profile) return null;

  const gender = profile.gender;
  const relationship = profile.relationship || "Self";

  return {
    ...profile,
    fullName: profile.full_name || profile.fullName,
    dateOfBirth: profile.date_of_birth || profile.dateOfBirth,
    gender,
    gender_label:
      profile.gender_label || GENDER_LABEL[gender] || gender,
    relationship,
    relationship_label:
      profile.relationship_label ||
      RELATIONSHIP_LABEL[relationship] ||
      relationship,
  };
}

export const patientProfileService = {
  getMyProfiles: async () => {
    const res = await axiosClient.get("/patient-profiles");
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    return list.map(mapPatientProfile);
  },

  createProfile: (payload) => axiosClient.post("/patient-profiles", payload),

  updateProfile: (id, payload) =>
    axiosClient.put(`/patient-profiles/${id}`, payload),

  deleteProfile: (id) => axiosClient.delete(`/patient-profiles/${id}`),
};

export default patientProfileService;
