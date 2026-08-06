import articleRepository from "../repositories/article.repository.js";

const TYPE_LABELS = {
  DOCTOR: "Bác sĩ",
  CLINIC: "Phòng khám",
  SPECIALTY: "Chuyên khoa",
  NEWS: "Tin tức",
};

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

class ArticleService {
  formatArticleResponse(article) {
    if (!article) return null;

    const author = article.users;
    const authorName = author
      ? [author.last_name, author.first_name].filter(Boolean).join(" ").trim()
      : null;

    const content =
      article.content_html || article.content_markdown || null;

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      description: article.description || null,
      content,
      content_html: article.content_html || null,
      content_markdown: article.content_markdown || null,
      image:
        article.image ||
        `https://picsum.photos/600/400?article=${article.id}`,
      article_type: article.article_type,
      article_type_label: TYPE_LABELS[article.article_type] || article.article_type,
      reference_id: article.reference_id || null,
      is_published: article.is_published === true,
      is_active: article.is_active !== false,
      author_id: article.author_id || null,
      author: authorName,
      author_email: author?.email || null,
      created_at: article.created_at,
      updated_at: article.updated_at,
    };
  }

  parseId(id) {
    const articleId = Number(id);
    if (!Number.isInteger(articleId) || articleId <= 0) {
      const error = new Error("ID bài viết không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return articleId;
  }

  async ensureUniqueSlug(baseSlug, excludeId = null) {
    let slug = baseSlug || `bai-viet-${Date.now()}`;
    let suffix = 0;

    while (true) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const existing = await articleRepository.findBySlug(candidate);
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      suffix += 1;
    }
  }

  async getAllArticles(queryParams, { isAdmin = false } = {}) {
    const params = { ...queryParams };

    if (isAdmin) {
      params.include_inactive = true;
    }

    const { total, articles, page, limit } =
      await articleRepository.findAll(params);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: articles.map((a) => this.formatArticleResponse(a)),
    };
  }

  async getArticleById(id, { isAdmin = false } = {}) {
    const articleId = this.parseId(id);
    const article = await articleRepository.findById(articleId);

    if (!article || article.is_active === false) {
      const error = new Error("Không tìm thấy bài viết");
      error.statusCode = 404;
      throw error;
    }

    if (!isAdmin && article.is_published !== true) {
      const error = new Error("Không tìm thấy bài viết");
      error.statusCode = 404;
      throw error;
    }

    return this.formatArticleResponse(article);
  }

  async createArticle(data, authorId) {
    const content =
      data.content_html ||
      data.content_markdown ||
      data.content ||
      null;

    const baseSlug = slugify(data.slug || data.title);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const payload = {
      title: data.title,
      slug,
      description: data.description || null,
      content_html: content,
      content_markdown: data.content_markdown || content,
      image: data.image || null,
      article_type: data.article_type,
      reference_id: data.reference_id || null,
      is_published: data.is_published === true,
      is_active: true,
      author_id: authorId || null,
    };

    const article = await articleRepository.create(payload);
    return this.formatArticleResponse(article);
  }

  async updateArticle(id, data) {
    const articleId = this.parseId(id);
    const existing = await articleRepository.findById(articleId);

    if (!existing || existing.is_active === false) {
      const error = new Error("Không tìm thấy bài viết");
      error.statusCode = 404;
      throw error;
    }

    const payload = {};

    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.image !== undefined) payload.image = data.image;
    if (data.article_type !== undefined) payload.article_type = data.article_type;
    if (data.reference_id !== undefined) {
      payload.reference_id = data.reference_id || null;
    }
    if (data.is_published !== undefined) payload.is_published = data.is_published;
    if (data.is_active !== undefined) payload.is_active = data.is_active;

    const content =
      data.content_html ?? data.content_markdown ?? data.content;
    if (content !== undefined) {
      payload.content_html = content;
      if (data.content_markdown !== undefined) {
        payload.content_markdown = data.content_markdown;
      } else {
        payload.content_markdown = content;
      }
    }

    if (data.slug !== undefined || data.title !== undefined) {
      const baseSlug = slugify(
        data.slug || data.title || existing.title,
      );
      payload.slug = await this.ensureUniqueSlug(baseSlug, articleId);
    }

    const article = await articleRepository.update(articleId, payload);
    return this.formatArticleResponse(article);
  }

  async deleteArticle(id) {
    const articleId = this.parseId(id);
    const existing = await articleRepository.findById(articleId);

    if (!existing) {
      const error = new Error("Không tìm thấy bài viết");
      error.statusCode = 404;
      throw error;
    }

    if (existing.is_active === false) {
      const error = new Error("Bài viết đã bị xóa");
      error.statusCode = 400;
      throw error;
    }

    await articleRepository.softDelete(articleId);

    return {
      message: `Đã xóa bài viết ID ${articleId} thành công`,
    };
  }
}

export default new ArticleService();
