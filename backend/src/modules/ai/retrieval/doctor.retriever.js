import prisma from "../../../config/prisma.js";
import { buildActiveDoctorWhere, buildWorkplaceWhere } from "./retrieval.filters.js";
import { DatabaseRetrievalError } from "./retrieval.error.js";
import { makeRetrievalResult, mapDoctorItem } from "./retrieval.mapper.js";
import { MAX_RESULTS } from "./retrieval.constants.js";

export async function retrieveDoctors(filters, { db = prisma } = {}) {
  const workplaceWhere = buildWorkplaceWhere(filters);
  try {
    const users = await db.users.findMany({
      where: buildActiveDoctorWhere(filters),
      take: MAX_RESULTS,
      orderBy: { id: "asc" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        avatar: true,
        doctor_profiles: {
          select: {
            degree: true,
            position: true,
            experience_years: true,
            consultation_fee: true,
            doctor_workplaces: {
              where: workplaceWhere,
              take: MAX_RESULTS,
              orderBy: { id: "asc" },
              select: {
                id: true,
                consultation_fee: true,
                room: true,
                clinics: { select: { id: true, name: true, address: true } },
                specialties: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    return makeRetrievalResult("DOCTOR", users.map(mapDoctorItem));
  } catch {
    throw new DatabaseRetrievalError();
  }
}
