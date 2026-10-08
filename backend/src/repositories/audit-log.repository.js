import prisma from "../config/prisma.js";

const auditUserSelect = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  role: {
    select: { name: true },
  },
};

const auditListSelect = {
  id: true,
  user_id: true,
  action: true,
  resource: true,
  resource_id: true,
  ip_address: true,
  created_at: true,
  user: { select: auditUserSelect },
};

const auditDetailSelect = {
  ...auditListSelect,
  old_value: true,
  new_value: true,
  user_agent: true,
  metadata: true,
};

function buildWhere({
  search,
  userId,
  action,
  resource,
  resourceId,
  dateFrom,
  dateTo,
}) {
  const where = {};

  if (userId !== undefined) where.user_id = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (resourceId) where.resource_id = resourceId;

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at.gte = dateFrom;
    if (dateTo) where.created_at.lte = dateTo;
  }

  if (search) {
    const numericSearch = Number(search);
    where.OR = [
      { action: { contains: search } },
      { resource: { contains: search } },
      { resource_id: { contains: search } },
      { ip_address: { contains: search } },
      { user: { is: { email: { contains: search } } } },
      { user: { is: { first_name: { contains: search } } } },
      { user: { is: { last_name: { contains: search } } } },
    ];
    if (Number.isInteger(numericSearch) && numericSearch > 0) {
      where.OR.push({ user_id: numericSearch });
    }
  }

  return where;
}

class AuditLogRepository {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  create(data) {
    return this.prisma.audit_logs.create({
      data,
      select: auditDetailSelect,
    });
  }

  async findAll(filters) {
    const { page, limit, sortOrder } = filters;
    const where = buildWhere(filters);
    const skip = (page - 1) * limit;

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.audit_logs.count({ where }),
      this.prisma.audit_logs.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { created_at: sortOrder },
          { id: sortOrder },
        ],
        select: auditListSelect,
      }),
    ]);

    return { total, logs, page, limit };
  }

  findById(id) {
    return this.prisma.audit_logs.findUnique({
      where: { id },
      select: auditDetailSelect,
    });
  }
}

export { AuditLogRepository, buildWhere };
export default new AuditLogRepository();
