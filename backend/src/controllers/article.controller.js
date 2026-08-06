import articleService from "../services/article.service.js";
import {
  createArticleSchema,
  updateArticleSchema,
  queryArticleSchema,
} from "../validators/article.validator.js";

class ArticleController {
  // GET /api/articles — public: chỉ bài đã đăng
  async getAllArticles(req, res, next) {
    try {
      const validatedQuery = queryArticleSchema.parse(req.query);
      const isAdmin = req.user?.role?.name === "Admin";
      const result = await articleService.getAllArticles(validatedQuery, {
        isAdmin,
      });

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách bài viết thành công",
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          total_pages: result.total_pages,
        },
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/articles/:id
  async getArticleById(req, res, next) {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role?.name === "Admin";
      const article = await articleService.getArticleById(id, { isAdmin });

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết bài viết thành công",
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/articles
  async createArticle(req, res, next) {
    try {
      const validatedData = createArticleSchema.parse(req.body);
      const article = await articleService.createArticle(
        validatedData,
        req.user.id,
      );

      return res.status(201).json({
        success: true,
        message: validatedData.is_published
          ? "Đăng bài viết thành công"
          : "Lưu nháp bài viết thành công",
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/articles/:id
  async updateArticle(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = updateArticleSchema.parse(req.body);
      const article = await articleService.updateArticle(id, validatedData);

      return res.status(200).json({
        success: true,
        message: "Cập nhật bài viết thành công",
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/articles/:id
  async deleteArticle(req, res, next) {
    try {
      const { id } = req.params;
      const result = await articleService.deleteArticle(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ArticleController();
