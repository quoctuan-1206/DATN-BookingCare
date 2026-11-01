import prisma from "../../../config/prisma.js";
import { buildActiveClinicWhere, buildWorkplaceWhere } from "./retrieval.filters.js";
import { DatabaseRetrievalError } from "./retrieval.error.js";
import { makeRetrievalResult, mapClinicItem } from "./retrieval.mapper.js";
import { MAX_RESULTS } from "./retrieval.constants.js";

export async function retrieveClinics(filters, { db = prisma } = {}) {
  const workplaceWhere = buildWorkplaceWhere(filters, { withUser: true });
  const hasWorkplaceFilter = Boolean(
    filters.specialty || filters.doctorName || filters.maxPrice !== null && filters.maxPrice !== undefined,
  );
  try {
    const clinics = await db.clinics.findMany({
      where: buildActiveClinicWhere(filters),
      take: MAX_RESULTS,
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        image: true,
        description: true,
        doctor_workplaces: {
          ...(hasWorkplaceFilter ? { where: workplaceWhere } : {
            where: {
              is_active: true,
              specialties: { is_active: true },
              doctor_profiles: {
                users: { role_id: 2, is_active: true },
              },
            },
          }),
          take: MAX_RESULTS,
          orderBy: { id: "asc" },
          select: {
            id: true,
            consultation_fee: true,
            room: true,
            specialties: { select: { id: true, name: true } },
            doctor_profiles: {
              select: {
                degree: true,
                consultation_fee: true,
                users: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return makeRetrievalResult("CLINIC", clinics.map(mapClinicItem));
  } catch {
    throw new DatabaseRetrievalError();
  }
}
