"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Logo } from "@/components/Chrome";
import { ApiError, AnswerResponse, DocumentSummary, TenantSummary, UserSummary, askQuestion, deleteDocument, getMe, listDocumentJobs, listDocuments, logout, queueDocument, retryIngestionJob } from "@/lib/api";

const navItems = ["Chat", "Documents", "Usage", "Settings"];

type WorkspaceStatus = {
  tone: "success" | "error";
  message: string;
};

type DocumentAction = {
  documentId: string;
  type: "delete" | "retry";
};

export function Workspace() {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [documentAction, setDocumentAction] = useState<DocumentAction | null>(null);

  const usageMetrics = useMemo(
    () => [
      { label: "Indexed docs", value: documents.filter((document) => document.status === "indexed").length },
      { label: "Total docs", value: documents.length },
      { label: "Citations", value: answer?.citations.length ?? 0 },
      { label: "Current tenant", value: tenant ? 1 : 0 }
    ],
    [answer, documents, tenant]
  );

  useEffect(() => {
    let isActive = true;

    async function loadWorkspace() {
      try {
        const me = await getMe();
        const nextDocuments = await listDocuments();

        if (!isActive) {
          return;
        }

        setUser(me.user);
        setTenant(me.current_tenant);
        setDocuments(nextDocuments);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }

        if (isActive) {
          setStatus({ tone: "error", message: resolveWorkspaceError(error) });
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      router.replace("/login");
      return;
    }

    const form = new FormData(event.currentTarget);
    const title = getFormValue(form, "title");
    const content = getFormValue(form, "content");
    setStatus(null);
    setIsUploading(true);

    try {
      await queueDocument(
        {
          filename: `${slugify(title)}.md`,
          title,
          content_type: "text/markdown",
          content
        }
      );
      setDocuments(await listDocuments());
      setStatus({ tone: "success", message: "Document queued for indexing." });
      event.currentTarget.reset();
    } catch (error) {
      setStatus({ tone: "error", message: resolveWorkspaceError(error) });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      router.replace("/login");
      return;
    }

    const form = new FormData(event.currentTarget);
    const question = getFormValue(form, "question");
    setStatus(null);
    setIsAsking(true);

    try {
      setAnswer(await askQuestion({ question }));
      event.currentTarget.reset();
    } catch (error) {
      setStatus({ tone: "error", message: resolveWorkspaceError(error) });
    } finally {
      setIsAsking(false);
    }
  }

  async function handleDeleteDocument(document: DocumentSummary) {
    if (!confirm(`Delete "${document.title}" from this workspace?`)) {
      return;
    }

    setStatus(null);
    setDocumentAction({ documentId: document.id, type: "delete" });

    try {
      await deleteDocument(document.id);
      setDocuments((currentDocuments) => currentDocuments.filter((item) => item.id !== document.id));
      setStatus({ tone: "success", message: "Document deleted." });
    } catch (error) {
      setStatus({ tone: "error", message: resolveWorkspaceError(error) });
    } finally {
      setDocumentAction(null);
    }
  }

  async function handleRetryDocument(document: DocumentSummary) {
    setStatus(null);
    setDocumentAction({ documentId: document.id, type: "retry" });

    try {
      const jobs = await listDocumentJobs(document.id);
      const failedJob = jobs.find((job) => job.status === "failed");

      if (!failedJob) {
        throw new Error("No failed ingestion job found for this document.");
      }

      await retryIngestionJob(document.id, failedJob.id);
      setDocuments(await listDocuments());
      setStatus({ tone: "success", message: "Ingestion retry queued." });
    } catch (error) {
      setStatus({ tone: "error", message: resolveWorkspaceError(error) });
    } finally {
      setDocumentAction(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className="workspace-loading">
        <Logo />
        <p className="eyebrow">Loading workspace</p>
      </main>
    );
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <Logo />
        <div className="side-nav">
          {navItems.map((item, index) => (
            <Link className={index === 0 ? "active" : ""} href={`#${item.toLowerCase()}`} key={item}>
              {item}
            </Link>
          ))}
        </div>
        <div style={{ marginTop: "auto" }}>
          <div className="workspace-card" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)", color: "var(--paper)" }}>
            <strong>{tenant?.name ?? "Workspace"}</strong>
            <p style={{ color: "var(--soft)", fontSize: 13, margin: "8px 0 12px" }}>{user?.email}</p>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ width: "100%" }} type="button">Logout</button>
          </div>
        </div>
      </aside>
      <section className="workspace-main">
        <div className="topbar">
          <div className="search-box">Search documents, sources, questions...</div>
          <span className="pill">{tenant?.slug ?? "No tenant"}</span>
          <button className="btn btn-primary" form="document-upload" type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload document"}
          </button>
        </div>
        {status ? (
          <div className={`auth-message ${status.tone}`} role={status.tone === "error" ? "alert" : "status"}>
            {status.message}
          </div>
        ) : null}
        <section className="workspace-grid" id="chat">
          <div className="chat-panel">
            <p className="eyebrow">Chat</p>
            <h1 style={{ fontSize: 36, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
              Ask questions. Inspect the <span className="display" style={{ color: "#0b7d52" }}>source trail</span>.
            </h1>
            <form className="workspace-form" onSubmit={handleAsk}>
              <input name="question" placeholder="What does the document say?" required />
              <button className="btn btn-primary" disabled={isAsking} type="submit">
                {isAsking ? "Asking..." : "Ask"}
              </button>
            </form>
            {answer ? (
              <>
                <div className="message ai">{answer.answer}</div>
                <div className="source-list">
                  {answer.citations.map((source, index) => (
                    <div className="citation-card" data-cursor="interactive" key={`${source.chunk_id}-${index}`}>
                      <div className="citation-head">
                        <span>
                          <span className="citation-index">{index + 1}</span>
                          {source.document_title}
                        </span>
                        <strong className="mono" style={{ color: "#0b7d52", fontSize: 11 }}>{source.score.toFixed(2)}</strong>
                      </div>
                      <p>{source.snippet}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="message ai">Upload a document, wait for indexing, then ask a question grounded in that source.</div>
            )}
          </div>
          <aside className="inspector-panel">
            <p className="eyebrow">Upload</p>
            <h2 style={{ margin: "0 0 18px" }}>Add source text</h2>
            <form className="upload-form" id="document-upload" onSubmit={handleUpload}>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" name="title" placeholder="Security Policy" required />
              </div>
              <div className="field">
                <label htmlFor="content">Content</label>
                <textarea id="content" name="content" placeholder="Paste Markdown or plain text..." required rows={8} />
              </div>
            </form>
          </aside>
        </section>
        <section className="workspace-card" id="documents">
          <p className="eyebrow">Documents</p>
          <div className="doc-table">
            {documents.length > 0 ? documents.map((document) => (
              <div className="doc-row" key={document.id}>
                <strong>{document.title}</strong>
                <span>{document.content_type}</span>
                <span className={`status-badge ${document.status}`}>{document.status}</span>
                <span className="mono">v{document.current_version}</span>
                <div className="doc-actions">
                  {document.status === "failed" ? (
                    <button className="btn btn-ghost btn-small" disabled={isDocumentActionActive(documentAction, document.id)} onClick={() => void handleRetryDocument(document)} type="button">
                      {isDocumentAction(documentAction, document.id, "retry") ? "Retrying..." : "Retry"}
                    </button>
                  ) : null}
                  <button className="btn btn-ghost btn-small danger" disabled={isDocumentActionActive(documentAction, document.id)} onClick={() => void handleDeleteDocument(document)} type="button">
                    {isDocumentAction(documentAction, document.id, "delete") ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )) : (
              <div className="doc-row">
                <strong>No documents yet</strong>
                <span>Upload Markdown or text to start retrieval.</span>
              </div>
            )}
          </div>
        </section>
        <section className="stats-grid" id="usage">
          {usageMetrics.map((metric) => (
            <div className="metric" key={metric.label}>
              <strong>
                <AnimatedNumber value={metric.value} />
              </strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

function isDocumentAction(action: DocumentAction | null, documentId: string, type: DocumentAction["type"]) {
  return action?.documentId === documentId && action.type === type;
}

function isDocumentActionActive(action: DocumentAction | null, documentId: string) {
  return action?.documentId === documentId;
}

function getFormValue(form: FormData, key: string) {
  const value = form.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Fill in all required fields.");
  }

  return value.trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "document";
}

function resolveWorkspaceError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Workspace request failed.";
}
