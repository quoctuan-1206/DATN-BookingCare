# Guide RAG Scope Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make website how-to questions retrieve and answer from the matching Booking Care patient guide without a runtime scope error.

**Architecture:** Build each SYSTEM_GUIDE knowledge record inside the existing `PATIENT_GUIDES.flatMap` callback, where its parent guide metadata remains available. Use the existing knowledge retriever test to protect the public RAG result.

**Tech Stack:** Node.js ESM, native `node:test`, Prisma-independent in-memory guide retrieval.

**Spec:** `docs/superpowers/specs/2026-11-07-guide-rag-scope-design.md`

## Global Constraints

- Keep the `/api/ai/chat` response contract unchanged.
- Do not alter intent classification, scoring thresholds, guide content, or unrelated retrieval paths.
- Preserve validated SYSTEM_GUIDE URLs in context sources.

## Review Focus

- A section chunk must retain its own guide id, title, category and `/help/<guide-id>` URL; covered by Task 1.
- FAQ chunks must retain the same parent-guide metadata; covered by Task 1.
- Queries restricted to `SYSTEM_GUIDE` must not query the article repository; covered by Task 1.
- Article-only queries must remain functional while guide chunks are computed; covered by Task 1.
- The public chat route must return deterministic guide content for a how-to question; covered by Task 1.

---

### Task 1: Preserve parent-guide metadata during RAG chunk construction

**Files:**

- Modify: `backend/src/modules/ai/knowledge/knowledge.retriever.js:60-84`
- Modify: `backend/test/ai-knowledge-retriever.test.js:68-81`

**Interfaces:**

- Consumes: `PATIENT_GUIDES` guide objects (`id`, `title`, `category`, `sections`, `faqs`, `sourceUrl`, `updatedAt`).
- Produces: `retrieveKnowledge({ query, sourceTypes })` records with `sourceType: "SYSTEM_GUIDE"` and a matching parent-guide `documentId`/URL.

- [ ] **Step 1: Write the failing test**

Extend `knowledge retriever indexes published patient guides through the existing RAG scorer` to assert that the returned booking-guide chunk contains the expected title and source URL after a real `retrieveKnowledge` call.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- test/ai-knowledge-retriever.test.js`

Expected: FAIL with `ReferenceError: guide is not defined` while constructing SYSTEM_GUIDE chunks.

- [ ] **Step 3: Build complete SYSTEM_GUIDE records inside `PATIENT_GUIDES.flatMap`**

Map each parent guide's sections and FAQs to final records within its callback, including `documentId`, `title`, `category`, `score`, `url`, and `updatedAt`; remove the post-flatten reference to `guide`.

- [ ] **Step 4: Run focused tests to verify the fix**

Run: `npm test -- test/ai-knowledge-retriever.test.js`

Expected: all retriever tests pass, except any explicitly reported environment-only failure.

- [ ] **Step 5: Run the backend suite**

Run: `npm test`

Expected: all project tests pass; report any pre-existing/environment-only failures separately.

- [ ] **Step 6: Commit**

Stage the retriever, its tests, design and plan documents, then create commit `fix: preserve guide metadata in RAG retrieval`.
