import prisma from "../../../config/prisma.js";
import { buildActiveSpecialtyWhere } from "./retrieval.filters.js";
import { DatabaseRetrievalError } from "./retrieval.error.js";
import { makeRetrievalResult, mapSpecialtyItem } from "./retrieval.mapper.js";
import { MAX_RESULTS } from "./retrieval.constants.js";

export async function retrieveSpecialties(filters, { db = prisma } = {}) {
  try {
    const specialties = await db.specialties.findMany({
      where: buildActiveSpecialtyWhere(filters),
      take: MAX_RESULTS,
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
      },
    });
    return makeRetrievalResult("SPECIALTY", specialties.map(mapSpecialtyItem));
  } catch {
    throw new DatabaseRetrievalError();
  }
}
