import { Client } from "@elastic/elasticsearch";
import { config } from "../config";

export const esClient = new Client({
  node: config.ELASTICSEARCH_URL,
});

const INDEX = "emails";

/**
 * Ensure the Elasticsearch index exists with the correct mapping.
 * Safe to call multiple times (idempotent).
 */
export async function ensureIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: INDEX });
  if (!exists) {
    await esClient.indices.create({
      index: INDEX,
      mappings: {
        properties: {
          emailId: { type: "keyword" },
          userId: { type: "keyword" },
          senderId: { type: "keyword" },
          sender: { type: "keyword" },
          recipient: { type: "keyword" },
          subject: { type: "text", analyzer: "standard" },
          body: { type: "text", analyzer: "standard" },
          status: { type: "keyword" },
          scheduledAt: { type: "date" },
          sentAt: { type: "date" },
          createdAt: { type: "date" },
        },
      },
    });
    console.log(`✅ Elasticsearch index "${INDEX}" created`);
  }
}

export interface EmailDocument {
  emailId: string;
  userId: string;
  senderId: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  createdAt: string;
}

/**
 * Upsert an email document into Elasticsearch.
 * Called on create (SCHEDULED) and on status update (SENT/FAILED).
 */
export async function indexEmail(doc: EmailDocument): Promise<void> {
  try {
    await esClient.index({
      index: INDEX,
      id: doc.emailId,
      document: doc,
    });
  } catch (err) {
    // Non-fatal — log and continue. ES indexing should not block sends.
    console.error("⚠️  Elasticsearch index error:", err);
  }
}

/**
 * Full-text search across subject, body, recipient, sender, and status.
 * Restricted to emails belonging to the given userId.
 */
export async function searchEmails(
  query: string,
  userId: string,
  from = 0,
  size = 20
): Promise<EmailDocument[]> {
  const response = await esClient.search<EmailDocument>({
    index: INDEX,
    from,
    size,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ["subject^3", "body", "recipient^2", "sender"],
              type: "best_fields",
              fuzziness: "AUTO",
            },
          },
        ],
        filter: [{ term: { userId } }],
      },
    },
    sort: [{ scheduledAt: { order: "desc" } }],
  });

  return response.hits.hits.map((hit) => hit._source as EmailDocument);
}
