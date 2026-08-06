import axiosClient from "../api/axios";

const DEFAULT_IMAGE = "https://picsum.photos/600/400?article";

export function mapArticleFromApi(article) {
  if (!article) return null;

  return {
    ...article,
    image: article.image || DEFAULT_IMAGE,
    content: article.content || article.content_html || "",
    author: article.author || "Không rõ",
    category: article.article_type_label || article.article_type,
    status: article.is_published ? "published" : "draft",
  };
}

export const articleService = {
  getArticles: async (params = {}) => {
    const res = await axiosClient.get("/articles", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];

    return {
      ...payload,
      data: list.map(mapArticleFromApi),
      pagination: payload.pagination || {
        total: list.length,
        page: 1,
        limit: list.length,
        total_pages: 1,
      },
    };
  },

  getArticleById: async (id) => {
    const res = await axiosClient.get(`/articles/${id}`);
    return mapArticleFromApi(res.data?.data);
  },

  createArticle: (payload) => axiosClient.post("/articles", payload),

  updateArticle: (id, payload) =>
    axiosClient.put(`/articles/${id}`, payload),

  deleteArticle: (id) => axiosClient.delete(`/articles/${id}`),
};

export default articleService;
