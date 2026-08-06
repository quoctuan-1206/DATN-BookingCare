import prisma from "../config/prisma.js";

const authorSelect = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
  avatar: true,
};

class ArticleRepository {
  async findAll({
    search,
    article_type,
    is_published,
    include_inactive = false,
    page = 1,
    limit = 10,
  }) {
    const skip = (page - 1) * limit;
    const where = {
      // Soft-deleted luôn ẩn; Admin vẫn xem được nháp
      is_active: true,
    };

    if (!include_inactive) {
      where.is_published = true;
    }

    if (typeof is_published === "boolean") {
      where.is_published = is_published;
    }

    if (article_type) {
      where.article_type = article_type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [total, articles] = await prisma.$transaction([
      prisma.articles.count({ where }),
      prisma.articles.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          users: { select: authorSelect },
        },
      }),
    ]);

    return { total, articles, page, limit };
  }

  async findById(id) {
    return prisma.articles.findFirst({
      where: { id: Number(id) },
      include: {
        users: { select: authorSelect },
      },
    });
  }

  async findBySlug(slug) {
    return prisma.articles.findFirst({
      where: { slug },
      include: {
        users: { select: authorSelect },
      },
    });
  }

  async create(data) {
    return prisma.articles.create({
      data,
      include: {
        users: { select: authorSelect },
      },
    });
  }

  async update(id, data) {
    return prisma.articles.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        users: { select: authorSelect },
      },
    });
  }

  async softDelete(id) {
    return prisma.articles.update({
      where: { id: Number(id) },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }
}

export default new ArticleRepository();
