import axiosClient from "../api/axios";

export const reviewService = {
  getReviews: async (params = {}) => {
    const res = await axiosClient.get("/reviews", { params });
    const payload = res.data || {};
    return {
      data: payload.data || [],
      pagination: payload.pagination || { total: 0, page: 1, limit: 20, total_pages: 0 },
    };
  },

  getReviewById: async (id) => {
    const res = await axiosClient.get(`/reviews/${id}`);
    return res.data?.data;
  },

  getByAppointment: async (appointmentId) => {
    const res = await axiosClient.get(`/reviews/appointment/${appointmentId}`);
    return res.data?.data || null;
  },

  getDoctorStats: async (doctorId) => {
    const res = await axiosClient.get(`/reviews/doctor/${doctorId}/stats`);
    return res.data?.data || { average_rating: 0, total_reviews: 0 };
  },

  createReview: async (data) => {
    const res = await axiosClient.post("/reviews", data);
    return res.data?.data;
  },

  updateReview: async (id, data) => {
    const res = await axiosClient.patch(`/reviews/${id}`, data);
    return res.data?.data;
  },

  deleteReview: async (id) => {
    const res = await axiosClient.delete(`/reviews/${id}`);
    return res.data;
  },
};

export default reviewService;
