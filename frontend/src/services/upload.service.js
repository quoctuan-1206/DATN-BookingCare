import axiosClient from "../api/axios";

export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await axiosClient.post("/upload", formData);
    return res.data?.data?.url || "";
  },
};

export default uploadService;
