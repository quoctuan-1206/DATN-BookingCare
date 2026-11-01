export class DatabaseRetrievalError extends Error {
  constructor() {
    super("Database retrieval is temporarily unavailable");
    this.name = "DatabaseRetrievalError";
    this.statusCode = 503;
    this.code = "DATABASE_RETRIEVAL_FAILED";
  }
}
