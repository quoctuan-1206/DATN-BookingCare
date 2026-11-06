import axiosClient from "../api/axios.js";

const patientGuideService = {
  async list() {
    const response = await axiosClient.get("/ai/knowledge/guides");
    const guides = response.data?.data;
    if (!response.data?.success || !Array.isArray(guides)) {
      throw new Error("Invalid patient guide response");
    }
    return guides;
  },
};

export default patientGuideService;
