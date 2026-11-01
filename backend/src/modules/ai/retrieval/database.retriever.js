import { filterAnalysisSchema } from "../filters/filter.schema.js";
import { retrieveDoctors } from "./doctor.retriever.js";
import { retrieveClinics } from "./clinic.retriever.js";
import { retrieveSpecialties } from "./specialty.retriever.js";
import { noRetrievalResult } from "./retrieval.mapper.js";

const SEARCH_INTENTS = new Set(["SEARCH_DOCTOR", "SEARCH_CLINIC", "SEARCH_SPECIALTY"]);

export async function retrieveDatabase(input, dependencies = {}) {
  const analysis = filterAnalysisSchema.parse(input);
  const { intent, retrievalMode, filters } = analysis;

  // HYBRID is eligible only when the primary intent is an explicit directory
  // search. Medical questions and system guidance never query directory data.
  if (!SEARCH_INTENTS.has(intent) || !["DATABASE", "HYBRID"].includes(retrievalMode)) {
    return noRetrievalResult();
  }

  switch (intent) {
    case "SEARCH_DOCTOR":
      return (dependencies.retrieveDoctors || retrieveDoctors)(filters, dependencies.doctorOptions);
    case "SEARCH_CLINIC":
      return (dependencies.retrieveClinics || retrieveClinics)(filters, dependencies.clinicOptions);
    case "SEARCH_SPECIALTY":
      return (dependencies.retrieveSpecialties || retrieveSpecialties)(filters, dependencies.specialtyOptions);
    default:
      return noRetrievalResult();
  }
}
