export class KnowledgeRetrievalError extends Error {
  constructor() {
    super("Knowledge retrieval is temporarily unavailable");
    this.name = "KnowledgeRetrievalError";
    this.statusCode = 503;
  }
}
