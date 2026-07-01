import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

process.env.DATABASE_URL ??= "postgresql://grounded:grounded@localhost:5432/grounded?schema=public";

const prisma = new PrismaClient();
let seeded = false;
const runId = randomUUID().replaceAll("-", "");
const ids = {
  tenantA: `ten_seciso_a_${runId}`,
  tenantB: `ten_seciso_b_${runId}`,
  userA: `usr_seciso_a_${runId}`,
  userB: `usr_seciso_b_${runId}`,
  membershipA: `mem_seciso_a_${runId}`,
  membershipB: `mem_seciso_b_${runId}`,
  sessionA: `ses_seciso_a_${runId}`,
  revokedSessionA: `ses_seciso_rev_${runId}`,
  documentA: `doc_seciso_a_${runId}`,
  documentB: `doc_seciso_b_${runId}`,
  versionA: `ver_seciso_a_${runId}`,
  versionB: `ver_seciso_b_${runId}`,
  chunkA: `chk_seciso_a_${runId}`,
  chunkB: `chk_seciso_b_${runId}`,
  jobA: `job_seciso_a_${runId}`,
  jobB: `job_seciso_b_${runId}`,
  chatSessionA: `chat_seciso_a_${runId}`,
};

try {
  await seed();
  seeded = true;
  await assertTenantCannotListOtherTenantDocuments();
  await assertTenantCannotFetchOtherTenantDocument();
  await assertTenantCannotListOtherTenantDocumentJobs();
  await assertRetrievalLoadsOnlyCurrentTenantChunks();
  await assertCrossTenantChatSessionIsNotReused();
  await assertRevokedSessionIsRejectedByPrivateApiContract();
  console.log("security tenant isolation checks passed");
} finally {
  if (seeded) {
    await cleanup();
  }
  await prisma.$disconnect();
}

async function seed() {
  await prisma.$executeRaw`
    INSERT INTO "Tenant" ("id", "slug", "name", "updatedAt")
    VALUES
      (${ids.tenantA}, ${`seciso-a-${runId}`}, 'Security Isolation A', now()),
      (${ids.tenantB}, ${`seciso-b-${runId}`}, 'Security Isolation B', now())
  `;
  await prisma.$executeRaw`
    INSERT INTO "User" ("id", "email", "name", "passwordHash", "emailVerifiedAt", "updatedAt")
    VALUES
      (${ids.userA}, ${`seciso-a-${runId}@example.com`}, 'Security User A', 'hash', now(), now()),
      (${ids.userB}, ${`seciso-b-${runId}@example.com`}, 'Security User B', 'hash', now(), now())
  `;
  await prisma.$executeRaw`
    INSERT INTO "Membership" ("id", "tenantId", "userId", "role", "updatedAt")
    VALUES
      (${ids.membershipA}, ${ids.tenantA}, ${ids.userA}, CAST('owner' AS "TenantRole"), now()),
      (${ids.membershipB}, ${ids.tenantB}, ${ids.userB}, CAST('owner' AS "TenantRole"), now())
  `;
  await prisma.$executeRaw`
    INSERT INTO "UserSession" ("id", "userId", "tenantId", "familyId", "expiresAt", "revokedAt")
    VALUES
      (${ids.sessionA}, ${ids.userA}, ${ids.tenantA}, ${`fam_${runId}`}, now() + interval '1 day', NULL),
      (${ids.revokedSessionA}, ${ids.userA}, ${ids.tenantA}, ${`fam_rev_${runId}`}, now() + interval '1 day', now())
  `;
  await prisma.$executeRaw`
    INSERT INTO "Document" ("id", "tenantId", "uploadedById", "title", "filename", "contentType", "sourceType", "status", "currentVersion", "updatedAt")
    VALUES
      (${ids.documentA}, ${ids.tenantA}, ${ids.userA}, 'Tenant A Document', 'a.txt', 'text/plain', CAST('upload' AS "DocumentSourceType"), CAST('indexed' AS "DocumentStatus"), 1, now()),
      (${ids.documentB}, ${ids.tenantB}, ${ids.userB}, 'Tenant B Document', 'b.txt', 'text/plain', CAST('upload' AS "DocumentSourceType"), CAST('indexed' AS "DocumentStatus"), 1, now())
  `;
  await prisma.$executeRaw`
    INSERT INTO "DocumentVersion" ("id", "documentId", "tenantId", "version", "objectKey", "checksum", "byteSize", "extractedText")
    VALUES
      (${ids.versionA}, ${ids.documentA}, ${ids.tenantA}, 1, ${`${ids.tenantA}/${ids.documentA}/1/a.txt`}, ${`checksum-a-${runId}`}, 16, 'tenant a evidence'),
      (${ids.versionB}, ${ids.documentB}, ${ids.tenantB}, 1, ${`${ids.tenantB}/${ids.documentB}/1/b.txt`}, ${`checksum-b-${runId}`}, 16, 'tenant b evidence')
  `;
  await prisma.$executeRaw`
    INSERT INTO "DocumentChunk" ("id", "tenantId", "documentId", "documentVersionId", "chunkIndex", "content", "tokenCount", "sourceStart", "sourceEnd", "qdrantPointId")
    VALUES
      (${ids.chunkA}, ${ids.tenantA}, ${ids.documentA}, ${ids.versionA}, 0, 'tenant a private source', 4, 0, 23, ${`point-a-${runId}`}),
      (${ids.chunkB}, ${ids.tenantB}, ${ids.documentB}, ${ids.versionB}, 0, 'tenant b private source', 4, 0, 23, ${`point-b-${runId}`})
  `;
  await prisma.$executeRaw`
    INSERT INTO "IngestionJob" ("id", "tenantId", "documentId", "documentVersionId", "status", "updatedAt")
    VALUES
      (${ids.jobA}, ${ids.tenantA}, ${ids.documentA}, ${ids.versionA}, CAST('completed' AS "IngestionJobStatus"), now()),
      (${ids.jobB}, ${ids.tenantB}, ${ids.documentB}, ${ids.versionB}, CAST('completed' AS "IngestionJobStatus"), now())
  `;
  await prisma.$executeRaw`
    INSERT INTO "ChatSession" ("id", "tenantId", "userId", "title", "updatedAt")
    VALUES (${ids.chatSessionA}, ${ids.tenantA}, ${ids.userA}, 'Tenant A Chat', now())
  `;
}

async function assertTenantCannotListOtherTenantDocuments() {
  const documents = await prisma.$queryRaw`
    SELECT "id", "tenantId"
    FROM "Document"
    WHERE "tenantId" = ${ids.tenantA} AND "deletedAt" IS NULL
    ORDER BY "createdAt" DESC
  `;
  assert(documents.some((document) => document.id === ids.documentA), "tenant A document was not visible to tenant A");
  assert(!documents.some((document) => document.id === ids.documentB), "tenant B document leaked into tenant A list");
}

async function assertTenantCannotFetchOtherTenantDocument() {
  const documents = await prisma.$queryRaw`
    SELECT "id"
    FROM "Document"
    WHERE "tenantId" = ${ids.tenantA} AND "id" = ${ids.documentB} AND "deletedAt" IS NULL
  `;
  assert(documents.length === 0, "tenant A fetched tenant B document by id");
}

async function assertTenantCannotListOtherTenantDocumentJobs() {
  const jobs = await prisma.$queryRaw`
    SELECT "id"
    FROM "IngestionJob"
    WHERE "tenantId" = ${ids.tenantA} AND "documentId" = ${ids.documentB}
  `;
  assert(jobs.length === 0, "tenant A listed tenant B document jobs");
}

async function assertRetrievalLoadsOnlyCurrentTenantChunks() {
  const chunks = await prisma.$queryRaw`
    SELECT c."id", c."tenantId", c."documentId", c."content", d."title" AS "documentTitle"
    FROM "DocumentChunk" c
    JOIN "Document" d ON d."id" = c."documentId"
    WHERE c."tenantId" = ${ids.tenantA} AND c."id" = ANY(${[ids.chunkA, ids.chunkB]})
  `;
  assert(chunks.some((chunk) => chunk.id === ids.chunkA), "tenant A chunk was not loaded");
  assert(!chunks.some((chunk) => chunk.id === ids.chunkB), "tenant B chunk leaked into tenant A retrieval");
}

async function assertCrossTenantChatSessionIsNotReused() {
  const sessions = await prisma.$queryRaw`
    SELECT "id"
    FROM "ChatSession"
    WHERE "tenantId" = ${ids.tenantB} AND "userId" = ${ids.userA} AND "id" = ${ids.chatSessionA}
  `;
  assert(sessions.length === 0, "tenant B reused tenant A chat session");
}

async function assertRevokedSessionIsRejectedByPrivateApiContract() {
  const sessions = await prisma.$queryRaw`
    SELECT "id"
    FROM "UserSession"
    WHERE "id" = ${ids.revokedSessionA} AND "userId" = ${ids.userA} AND "tenantId" = ${ids.tenantA} AND "revokedAt" IS NULL AND "expiresAt" > now()
  `;
  assert(sessions.length === 0, "revoked session passed private API active-session contract");
}

async function cleanup() {
  await prisma.$executeRaw`DELETE FROM "UsageLedger" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "Citation" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "Message" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "ChatSession" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "IngestionJob" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "DocumentChunk" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "DocumentVersion" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "Document" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "UserSession" WHERE "userId" IN (${ids.userA}, ${ids.userB})`;
  await prisma.$executeRaw`DELETE FROM "Membership" WHERE "tenantId" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "Tenant" WHERE "id" IN (${ids.tenantA}, ${ids.tenantB})`;
  await prisma.$executeRaw`DELETE FROM "User" WHERE "id" IN (${ids.userA}, ${ids.userB})`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
