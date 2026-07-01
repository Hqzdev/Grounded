"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
  AiChat01Icon,
  Alert01Icon,
  Analytics01Icon,
  Cancel01Icon,
  CheckListIcon,
  Delete02Icon,
  DocumentAttachmentIcon,
  EyeIcon,
  FilterIcon,
  Logout01Icon,
  RefreshIcon,
  RepeatIcon,
  Search01Icon,
  Settings01Icon,
  Upload01Icon,
  ViewSidebarLeftIcon,
  ViewSidebarRightIcon
} from "@hugeicons/core-free-icons";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Logo } from "@/components/Chrome";
import { ApiError, AnswerResponse, DocumentSummary, IngestionJobSummary, ProviderStatus, TenantSummary, UserSummary, askQuestion, deleteDocument, getMe, getProviderStatus, listDocumentJobs, listDocuments, logout, queueDocument, reindexDocument, retryIngestionJob } from "@/lib/api";

const navGroups = [
  {
    label: "Work",
    items: [
      { label: "Chat", href: "/app", view: "chat", icon: AiChat01Icon },
      { label: "Documents", href: "/app/documents", view: "documents", icon: DocumentAttachmentIcon },
      { label: "Usage", href: "/app/usage", view: "usage", icon: Analytics01Icon }
    ]
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/app/settings", view: "settings", icon: Settings01Icon }
    ]
  }
] as const;
const documentSortOptions = ["updated", "created", "title", "status"] as const;
const maxDocumentBytes = 1_000_000;

export type WorkspaceView = "chat" | "documents" | "usage" | "settings";

type DocumentSort = typeof documentSortOptions[number];

type WorkspaceStatus = {
  tone: "success" | "error";
  message: string;
};

type DocumentAction = {
  documentId: string;
  type: "delete" | "reindex" | "retry";
};

type WorkspaceProps = {
  view?: WorkspaceView;
};

type WorkspaceIconProps = {
  icon: IconSvgElement;
  size?: number;
};

function WorkspaceIcon({ icon, size = 18 }: WorkspaceIconProps) {
  return <HugeiconsIcon className="icon" color="currentColor" icon={icon} size={size} strokeWidth={1.7} />;
}

export function Workspace({ view = "chat" }: WorkspaceProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [documentAction, setDocumentAction] = useState<DocumentAction | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentJobs, setSelectedDocumentJobs] = useState<IngestionJobSummary[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobHistoryError, setJobHistoryError] = useState<string | null>(null);
  const [documentQuery, setDocumentQuery] = useState("");
  const [documentStatusFilter, setDocumentStatusFilter] = useState("all");
  const [documentSort, setDocumentSort] = useState<DocumentSort>("updated");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isRefreshingDocuments, setIsRefreshingDocuments] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [documentContent, setDocumentContent] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId]
  );

  const usageMetrics = useMemo(
    () => [
      { label: "Indexed docs", value: documents.filter((document) => document.status === "indexed").length },
      { label: "Total docs", value: documents.length },
      { label: "Citations", value: answer?.citations.length ?? 0 },
      { label: "Current tenant", value: tenant ? 1 : 0 }
    ],
    [answer, documents, tenant]
  );

  const documentStatuses = useMemo(
    () => Array.from(new Set(documents.map((document) => document.status))).sort(),
    [documents]
  );

  const documentStatusCounts = useMemo(
    () => documents.reduce<Record<string, number>>((counts, document) => ({
      ...counts,
      [document.status]: (counts[document.status] ?? 0) + 1
    }), {}),
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = documentQuery.trim().toLowerCase();

    return [...documents]
      .filter((document) => {
        const matchesQuery = normalizedQuery.length === 0
          || document.title.toLowerCase().includes(normalizedQuery)
          || document.filename.toLowerCase().includes(normalizedQuery)
          || document.content_type.toLowerCase().includes(normalizedQuery);
        const matchesStatus = documentStatusFilter === "all" || document.status === documentStatusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((left, right) => compareDocuments(left, right, documentSort));
  }, [documentQuery, documentSort, documentStatusFilter, documents]);

  const visibleDocumentIds = useMemo(
    () => filteredDocuments.map((document) => document.id),
    [filteredDocuments]
  );

  const selectedVisibleDocumentIds = useMemo(
    () => visibleDocumentIds.filter((documentId) => selectedDocumentIds.includes(documentId)),
    [selectedDocumentIds, visibleDocumentIds]
  );

  const areAllVisibleDocumentsSelected = filteredDocuments.length > 0 && selectedVisibleDocumentIds.length === filteredDocuments.length;
  const documentContentBytes = byteSize(documentContent);
  const isDocumentContentTooLarge = documentContentBytes > maxDocumentBytes;
  const failedDocumentCount = documentStatusCounts.failed ?? 0;
  const queuedDocumentCount = documentStatusCounts.queued ?? 0;
  const processingDocumentCount = documentStatusCounts.processing ?? 0;
  const indexedDocumentCount = documentStatusCounts.indexed ?? 0;
  const activeIngestionCount = queuedDocumentCount + processingDocumentCount;
  const canAskQuestions = indexedDocumentCount > 0;

  const dashboardMetrics = useMemo(
    () => [
      { label: "Indexed", value: indexedDocumentCount, tone: "good" },
      { label: "In flight", value: activeIngestionCount, tone: "attention" },
      { label: "Failed", value: failedDocumentCount, tone: failedDocumentCount > 0 ? "danger" : "neutral" },
      { label: "Selected", value: selectedDocumentIds.length, tone: selectedDocumentIds.length > 0 ? "attention" : "neutral" }
    ],
    [activeIngestionCount, failedDocumentCount, indexedDocumentCount, selectedDocumentIds.length]
  );
  const isChatView = view === "chat";
  const isDocumentsView = view === "documents";
  const isUsageView = view === "usage";
  const isSettingsView = view === "settings";

  const applyDocuments = useCallback((nextDocuments: DocumentSummary[]) => {
    const nextDocumentIds = new Set(nextDocuments.map((document) => document.id));
    setDocuments(nextDocuments);
    setSelectedDocumentIds((currentIds) => currentIds.filter((documentId) => nextDocumentIds.has(documentId)));

    if (selectedDocumentId && !nextDocumentIds.has(selectedDocumentId)) {
      setSelectedDocumentId(null);
      setSelectedDocumentJobs([]);
      setJobHistoryError(null);
    }
  }, [selectedDocumentId]);

  useEffect(() => {
    let isActive = true;

    async function loadWorkspace() {
      try {
        const [me, nextDocuments, nextProviderStatus] = await Promise.all([
          getMe(),
          listDocuments(),
          getProviderStatus().catch(() => null)
        ]);

        if (!isActive) {
          return;
        }

        setUser(me.user);
        setTenant(me.current_tenant);
        setDocuments(nextDocuments);
        setProviderStatus(nextProviderStatus);
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

  useEffect(() => {
    if (!user || activeIngestionCount === 0) {
      return;
    }

    let isActive = true;
    const intervalId = window.setInterval(() => {
      void listDocuments()
        .then((nextDocuments) => {
          if (isActive) {
            applyDocuments(nextDocuments);
          }
        })
        .catch((error) => {
          if (isActive && !(error instanceof ApiError && error.status === 401)) {
            setStatus({ tone: "error", message: resolveWorkspaceError(error) });
          }
        });
    }, 2500);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [activeIngestionCount, applyDocuments, user]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timeoutId = window.setTimeout(() => setStatus(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const uploadForm = event.currentTarget;

    if (!user) {
      router.replace("/login");
      return;
    }

    const form = new FormData(event.currentTarget);
    const title = getFormValue(form, "title");
    const content = getFormValue(form, "content");
    setStatus(null);

    if (byteSize(content) > maxDocumentBytes) {
      setStatus({ tone: "error", message: "Document content is larger than the 1 MB upload limit." });
      return;
    }

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
      const nextDocuments = await listDocuments();
      applyDocuments(nextDocuments);
      setStatus({ tone: "success", message: "Document queued for indexing." });
      setDocumentContent("");
      uploadForm.reset();
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

    if (!canAskQuestions) {
      setStatus({ tone: "error", message: "Upload and index at least one source before asking a question." });
      return;
    }

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
      setSelectedDocumentIds((currentIds) => currentIds.filter((documentId) => documentId !== document.id));
      if (selectedDocumentId === document.id) {
        setSelectedDocumentId(null);
        setSelectedDocumentJobs([]);
        setJobHistoryError(null);
      }
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
      applyDocuments(await listDocuments());
      if (selectedDocumentId === document.id) {
        setSelectedDocumentJobs(await listDocumentJobs(document.id));
      }
      setStatus({ tone: "success", message: "Ingestion retry queued." });
    } catch (error) {
      setStatus({ tone: "error", message: resolveWorkspaceError(error) });
    } finally {
      setDocumentAction(null);
    }
  }

  async function handleReindexDocument(document: DocumentSummary) {
    setStatus(null);
    setDocumentAction({ documentId: document.id, type: "reindex" });

    try {
      await reindexDocument(document.id);
      applyDocuments(await listDocuments());
      if (selectedDocumentId === document.id) {
        setSelectedDocumentJobs(await listDocumentJobs(document.id));
      }
      setStatus({ tone: "success", message: "Re-index queued." });
    } catch (error) {
      setStatus({ tone: "error", message: resolveWorkspaceError(error) });
    } finally {
      setDocumentAction(null);
    }
  }

  async function handleRefreshDocuments() {
    setStatus(null);
    setIsRefreshingDocuments(true);

    try {
      applyDocuments(await listDocuments());
      setStatus({ tone: "success", message: "Documents refreshed." });
    } catch (error) {
      setStatus({ tone: "error", message: resolveWorkspaceError(error) });
    } finally {
      setIsRefreshingDocuments(false);
    }
  }

  async function handleBulkDeleteDocuments() {
    const selectedDocuments = documents.filter((document) => selectedDocumentIds.includes(document.id));

    if (selectedDocuments.length === 0) {
      return;
    }

    if (!confirm(`Delete ${selectedDocuments.length} selected document${selectedDocuments.length === 1 ? "" : "s"} from this workspace?`)) {
      return;
    }

    setStatus(null);
    setIsBulkDeleting(true);

    try {
      await Promise.all(selectedDocuments.map((document) => deleteDocument(document.id)));
      const deletedIds = new Set(selectedDocuments.map((document) => document.id));
      setDocuments((currentDocuments) => currentDocuments.filter((document) => !deletedIds.has(document.id)));
      setSelectedDocumentIds([]);

      if (selectedDocumentId && deletedIds.has(selectedDocumentId)) {
        setSelectedDocumentId(null);
        setSelectedDocumentJobs([]);
        setJobHistoryError(null);
      }

      setStatus({ tone: "success", message: `${selectedDocuments.length} document${selectedDocuments.length === 1 ? "" : "s"} deleted.` });
    } catch (error) {
      setStatus({ tone: "error", message: resolveWorkspaceError(error) });
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleSelectDocument(document: DocumentSummary) {
    setSelectedDocumentId(document.id);
    setSelectedDocumentJobs([]);
    setJobHistoryError(null);
    setIsLoadingJobs(true);

    try {
      setSelectedDocumentJobs(await listDocumentJobs(document.id));
    } catch (error) {
      setJobHistoryError(resolveWorkspaceError(error));
    } finally {
      setIsLoadingJobs(false);
    }
  }

  function toggleDocumentSelection(documentId: string) {
    setSelectedDocumentIds((currentIds) => currentIds.includes(documentId)
      ? currentIds.filter((currentId) => currentId !== documentId)
      : [...currentIds, documentId]);
  }

  function toggleVisibleDocumentSelection() {
    if (areAllVisibleDocumentsSelected) {
      setSelectedDocumentIds((currentIds) => currentIds.filter((documentId) => !visibleDocumentIds.includes(documentId)));
      return;
    }

    setSelectedDocumentIds((currentIds) => Array.from(new Set([...currentIds, ...visibleDocumentIds])));
  }

  function focusUploadTitle() {
    globalThis.document.getElementById("title")?.focus();
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
    <main className={`workspace ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <button className="sidebar-toggle" data-tooltip={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setIsSidebarCollapsed((value) => !value)} type="button">
          <WorkspaceIcon icon={isSidebarCollapsed ? ViewSidebarRightIcon : ViewSidebarLeftIcon} size={16} />
        </button>
        <div className="sidebar-profile">
          <div className="avatar">{initials(user?.name ?? user?.email ?? "G")}</div>
          <div>
            <strong>{user?.name ?? "Grounded"}</strong>
            <span>{tenant?.name ?? "Workspace"}</span>
          </div>
        </div>
        <div className="side-nav">
          {navGroups.map((group) => (
            <div className="side-nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map((item) => (
                <Link className={view === item.view ? "active" : ""} data-tooltip={isSidebarCollapsed ? item.label : undefined} href={item.href} key={item.href}>
                  <WorkspaceIcon icon={item.icon} size={18} />
                  <span>{item.label}</span>
                  {item.label === "Documents" && failedDocumentCount > 0 ? <small>{failedDocumentCount}</small> : null}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto" }}>
          {failedDocumentCount > 0 ? (
            <div className="sidebar-notice">
              <strong>{failedDocumentCount} failed source{failedDocumentCount === 1 ? "" : "s"}</strong>
              <button onClick={() => {
                setDocumentStatusFilter("failed");
                router.push("/app/documents");
              }} type="button">
                <WorkspaceIcon icon={Alert01Icon} size={15} />
                Review
              </button>
            </div>
          ) : null}
          <div className="workspace-card" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)", color: "var(--paper)" }}>
            <strong>{tenant?.name ?? "Workspace"}</strong>
            <p style={{ color: "var(--soft)", fontSize: 13, margin: "8px 0 12px" }}>{user?.email}</p>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ width: "100%" }} type="button">
              <WorkspaceIcon icon={Logout01Icon} size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>
      <section className="workspace-main">
        <div className="topbar">
          <label className="search-field">
            <WorkspaceIcon icon={Search01Icon} size={18} />
            <input
              aria-label="Search source library"
              onChange={(event) => setDocumentQuery(event.target.value)}
              placeholder="Search source library..."
              value={documentQuery}
            />
          </label>
          <span className="pill">{tenant?.slug ?? "No tenant"}</span>
          <button className="btn btn-primary" onClick={() => {
            if (isChatView || isDocumentsView) {
              focusUploadTitle();
              return;
            }
            router.push("/app/documents");
          }} type="button" disabled={(isChatView || isDocumentsView) && (isUploading || isDocumentContentTooLarge)}>
            <WorkspaceIcon icon={Upload01Icon} size={17} />
            {isUploading ? "Uploading..." : "Upload document"}
          </button>
        </div>
        {isChatView ? (
          <section className="dashboard-overview" id="usage">
            <div className="overview-card wide">
              <div>
                <p className="eyebrow">Workspace health</p>
                <h1>Source health at a glance.</h1>
              </div>
              <div className="health-bars">
                {documentStatuses.length > 0 ? documentStatuses.map((statusOption) => (
                  <button className="health-row" data-tooltip={`Show ${statusOption} sources`} key={statusOption} onClick={() => {
                    setDocumentStatusFilter(statusOption);
                    router.push("/app/documents");
                  }} type="button">
                    <span>{statusOption}</span>
                    <strong>{documentStatusCounts[statusOption] ?? 0}</strong>
                    <i style={{ width: `${percentage(documentStatusCounts[statusOption] ?? 0, documents.length)}%` }} />
                  </button>
                )) : (
                  <div className="health-empty">No source data yet.</div>
                )}
              </div>
            </div>
            {dashboardMetrics.map((metric) => (
              <div className={`overview-card metric-card ${metric.tone}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </section>
        ) : null}
        {isChatView ? (
        <section className="workspace-grid" id="chat">
          <div className="chat-panel">
            <p className="eyebrow">Chat</p>
            <h1 style={{ fontSize: 36, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
              Ask questions. Inspect the <span className="display" style={{ color: "#0b7d52" }}>source trail</span>.
            </h1>
            <div className="workflow-strip">
              <span className={documents.length > 0 ? "done" : "active"}>Upload source</span>
              <span className={indexedDocumentCount > 0 ? "done" : activeIngestionCount > 0 ? "active" : ""}>Index evidence</span>
              <span className={canAskQuestions && !answer ? "active" : answer ? "done" : ""}>Ask question</span>
              <span className={answer ? "done" : ""}>Inspect citations</span>
            </div>
            <form className="workspace-form" onSubmit={handleAsk}>
              <input name="question" placeholder="What does the document say?" required />
              <button className="btn btn-primary" disabled={isAsking || !canAskQuestions} data-tooltip={canAskQuestions ? "Ask against indexed sources" : "Upload and index a source first"} type="submit">
                {isAsking ? "Asking..." : "Ask"}
              </button>
            </form>
            {answer ? (
              <>
                <div className="message ai">{answer.answer}</div>
                <p className="source-trail-label">Evidence trail</p>
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
              <div className="message ai action-message">
                <span>{activeIngestionCount > 0 ? "Indexing is running. Questions unlock as soon as one source is indexed." : "Start with one real source. Grounded will only answer from indexed evidence."}</span>
                {!canAskQuestions ? (
                  <button className="btn btn-ghost btn-small" onClick={focusUploadTitle} type="button">
                    <WorkspaceIcon icon={Upload01Icon} size={15} />
                    Add source text
                  </button>
                ) : null}
              </div>
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
                <textarea id="content" name="content" onChange={(event) => setDocumentContent(event.target.value)} placeholder="Paste Markdown or plain text..." required rows={8} value={documentContent} />
                <div className={`upload-meter ${isDocumentContentTooLarge ? "error" : ""}`} data-tooltip="The ingestion service currently accepts up to 1 MB of text per upload">
                  <span>{formatBytes(documentContentBytes)} / {formatBytes(maxDocumentBytes)}</span>
                  <span>{isDocumentContentTooLarge ? "Too large" : "Ready"}</span>
                </div>
              </div>
              <button className="btn btn-primary" disabled={isUploading || isDocumentContentTooLarge} type="submit">
                <WorkspaceIcon icon={Upload01Icon} size={17} />
                {isUploading ? "Uploading..." : "Queue for indexing"}
              </button>
            </form>
          </aside>
        </section>
        ) : null}
        {isDocumentsView ? (
        <section className="documents-page" id="documents">
          <div className="workspace-card document-library-card">
          <div className="document-section-head">
            <div>
              <p className="eyebrow">Documents</p>
              <h2>Source library</h2>
            </div>
            <div className="document-head-actions">
              <span className="pill">{filteredDocuments.length} / {documents.length}</span>
              <button className="btn btn-ghost btn-small" data-tooltip="Reload the source list from the server" disabled={isRefreshingDocuments} onClick={() => void handleRefreshDocuments()} type="button">
                <WorkspaceIcon icon={RefreshIcon} size={15} />
                {isRefreshingDocuments ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
          <div className="status-filter-row">
            <button className={`status-filter ${documentStatusFilter === "all" ? "active" : ""}`} data-tooltip="Show every source status" onClick={() => setDocumentStatusFilter("all")} type="button">
              All <span>{documents.length}</span>
            </button>
            {documentStatuses.map((statusOption) => (
              <button className={`status-filter ${documentStatusFilter === statusOption ? "active" : ""}`} data-tooltip={`Filter to ${statusOption} sources`} key={statusOption} onClick={() => setDocumentStatusFilter(statusOption)} type="button">
                {statusOption} <span>{documentStatusCounts[statusOption] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="document-intent-row">
            <button className="intent-chip danger" data-tooltip="Jump to sources that need action" disabled={failedDocumentCount === 0} onClick={() => setDocumentStatusFilter("failed")} type="button">
              <WorkspaceIcon icon={Alert01Icon} size={16} />
              Review failed <span>{failedDocumentCount}</span>
            </button>
            <button className="intent-chip" data-tooltip="Show sources still moving through ingestion" disabled={queuedDocumentCount + processingDocumentCount === 0} onClick={() => {
              setDocumentQuery("");
              setDocumentStatusFilter(queuedDocumentCount > 0 ? "queued" : "processing");
            }} type="button">
              <WorkspaceIcon icon={RefreshIcon} size={16} />
              Watch indexing <span>{queuedDocumentCount + processingDocumentCount}</span>
            </button>
            <button className="intent-chip" data-tooltip="Reset to the newest source activity" disabled={documents.length === 0} onClick={() => {
              setDocumentQuery("");
              setDocumentStatusFilter("all");
              setDocumentSort("updated");
            }} type="button">
              <WorkspaceIcon icon={DocumentAttachmentIcon} size={16} />
              Recent sources
            </button>
          </div>
          <div className="doc-toolbar">
            <label className="toolbar-search">
              <WorkspaceIcon icon={Search01Icon} size={17} />
              <input
                aria-label="Search documents"
                onChange={(event) => setDocumentQuery(event.target.value)}
                placeholder="Search title, filename, type..."
                value={documentQuery}
              />
            </label>
            <select aria-label="Filter document status" onChange={(event) => setDocumentStatusFilter(event.target.value)} value={documentStatusFilter}>
              <option value="all">All statuses</option>
              {documentStatuses.map((statusOption) => (
                <option key={statusOption} value={statusOption}>{statusOption}</option>
              ))}
            </select>
            <select aria-label="Sort documents" onChange={(event) => setDocumentSort(resolveDocumentSort(event.target.value))} value={documentSort}>
              <option value="updated">Recently updated</option>
              <option value="created">Recently created</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </select>
            <button className="btn btn-ghost btn-small" data-tooltip="Select every source currently visible after filters" disabled={filteredDocuments.length === 0} onClick={toggleVisibleDocumentSelection} type="button">
              <WorkspaceIcon icon={CheckListIcon} size={15} />
              {areAllVisibleDocumentsSelected ? "Clear shown" : "Select shown"}
            </button>
            <button className="btn btn-ghost btn-small" data-tooltip="Reset search, filters, and sort" disabled={documentQuery.length === 0 && documentStatusFilter === "all" && documentSort === "updated"} onClick={() => {
              setDocumentQuery("");
              setDocumentStatusFilter("all");
              setDocumentSort("updated");
            }} type="button">
              <WorkspaceIcon icon={Cancel01Icon} size={15} />
              Clear
            </button>
          </div>
          {selectedDocumentIds.length > 0 ? (
            <div className="doc-bulk-bar">
              <span>{selectedDocumentIds.length} selected</span>
              <button className="btn btn-ghost btn-small danger" disabled={isBulkDeleting} onClick={() => void handleBulkDeleteDocuments()} type="button">
                <WorkspaceIcon icon={Delete02Icon} size={15} />
                {isBulkDeleting ? "Deleting..." : "Delete selected"}
              </button>
            </div>
          ) : null}
          <div className="doc-table">
            {filteredDocuments.length > 0 ? filteredDocuments.map((document) => (
              <div className={`doc-row ${selectedDocumentId === document.id ? "selected" : ""}`} key={document.id}>
                <label className="doc-select" aria-label={`Select ${document.title}`} data-tooltip="Include this source in bulk actions">
                  <input checked={selectedDocumentIds.includes(document.id)} onChange={() => toggleDocumentSelection(document.id)} type="checkbox" />
                </label>
                <div className="doc-name">
                  <strong>{document.title}</strong>
                  <span>{document.filename}</span>
                </div>
                <span>{document.content_type}</span>
                <span className={`status-badge ${document.status}`} data-tooltip={statusTooltip(document.status)}>{document.status}</span>
                <span className="mono numeric">{formatShortDate(document.updated_at)}</span>
                <div className="doc-actions">
                  <button className="btn btn-ghost btn-small" disabled={isLoadingJobs} onClick={() => void handleSelectDocument(document)} type="button">
                    <WorkspaceIcon icon={EyeIcon} size={15} />
                    {isLoadingJobs && selectedDocumentId === document.id ? "Loading..." : "Details"}
                  </button>
                  {document.status === "failed" ? (
                    <button className="btn btn-ghost btn-small row-secondary" data-tooltip="Queue a new ingestion attempt" disabled={isDocumentActionActive(documentAction, document.id)} onClick={() => void handleRetryDocument(document)} type="button">
                      <WorkspaceIcon icon={RepeatIcon} size={15} />
                      {isDocumentAction(documentAction, document.id, "retry") ? "Retrying..." : "Retry"}
                    </button>
                  ) : null}
                  <button className="btn btn-ghost btn-small row-secondary" data-tooltip="Rebuild vectors for this source with the current embedding provider" disabled={isDocumentActionActive(documentAction, document.id)} onClick={() => void handleReindexDocument(document)} type="button">
                    <WorkspaceIcon icon={RefreshIcon} size={15} />
                    {isDocumentAction(documentAction, document.id, "reindex") ? "Queueing..." : "Re-index"}
                  </button>
                  <button className="btn btn-ghost btn-small danger row-secondary" data-tooltip="Soft delete this source from the workspace" disabled={isDocumentActionActive(documentAction, document.id)} onClick={() => void handleDeleteDocument(document)} type="button">
                    <WorkspaceIcon icon={Delete02Icon} size={15} />
                    {isDocumentAction(documentAction, document.id, "delete") ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )) : documents.length > 0 ? (
              <div className="empty-state">
                <strong>No matching sources</strong>
                <span>Clear the filters or search for another title, filename, or type.</span>
                <button className="btn btn-ghost btn-small" onClick={() => {
                  setDocumentQuery("");
                  setDocumentStatusFilter("all");
                  setDocumentSort("updated");
                }} type="button">
                  <WorkspaceIcon icon={FilterIcon} size={15} />
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="empty-state primary">
                <strong>Upload your first source</strong>
                <span>Grounded needs at least one text or Markdown source before answers can cite evidence.</span>
                <button className="btn btn-primary btn-small" onClick={focusUploadTitle} type="button">
                  <WorkspaceIcon icon={Add01Icon} size={15} />
                  Add source text
                </button>
              </div>
            )}
          </div>
          {selectedDocument ? (
            <div className="document-detail">
              <div className="document-detail-head">
                <div>
                  <p className="eyebrow">Job history</p>
                  <h3>{selectedDocument.title}</h3>
                </div>
                <span className={`status-badge ${selectedDocument.status}`} data-tooltip={statusTooltip(selectedDocument.status)}>{selectedDocument.status}</span>
              </div>
              <div className="document-meta-grid">
                <div>
                  <span>Filename</span>
                  <strong>{selectedDocument.filename}</strong>
                </div>
                <div>
                  <span>Type</span>
                  <strong>{selectedDocument.content_type}</strong>
                </div>
                <div>
                  <span>Version</span>
                  <strong>v{selectedDocument.current_version}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDate(selectedDocument.updated_at)}</strong>
                </div>
              </div>
              {jobHistoryError ? (
                <div className="empty-state error" role="alert">
                  <strong>Job history could not load</strong>
                  <span>{jobHistoryError}</span>
                  <button className="btn btn-ghost btn-small" onClick={() => void handleSelectDocument(selectedDocument)} type="button">
                    <WorkspaceIcon icon={RefreshIcon} size={15} />
                    Try again
                  </button>
                </div>
              ) : null}
              {isLoadingJobs ? (
                <div className="timeline-loading">
                  <span />
                  <span />
                  <span />
                </div>
              ) : selectedDocumentJobs.length > 0 ? (
                <div className="job-timeline">
                  {selectedDocumentJobs.map((job) => (
                    <div className="timeline-row" key={job.id}>
                      <span className={`timeline-dot ${job.status}`} />
                      <div className="timeline-card">
                        <div className="timeline-head">
                          <span className={`status-badge ${job.status}`} data-tooltip={statusTooltip(job.status)}>{job.status}</span>
                          <strong className="mono">{job.id}</strong>
                        </div>
                        <div className="timeline-meta">
                          <span className="numeric">attempts {job.attempts}</span>
                          <span className="numeric">{formatDate(job.finished_at ?? job.started_at ?? job.queued_at)}</span>
                        </div>
                        {job.error_message ? <p>{job.error_code ? `${job.error_code}: ` : ""}{job.error_message}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>No ingestion jobs yet</strong>
                  <span>This source has no recorded ingestion attempts. Refresh documents or upload it again if it never queued.</span>
                  <button className="btn btn-ghost btn-small" onClick={() => void handleRefreshDocuments()} type="button">
                    <WorkspaceIcon icon={RefreshIcon} size={15} />
                    Refresh documents
                  </button>
                </div>
              )}
            </div>
          ) : null}
          </div>
          <aside className="workspace-card document-upload-card">
            <p className="eyebrow">Add source</p>
            <h2>Upload source text</h2>
            <form className="upload-form" id="document-upload" onSubmit={handleUpload}>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" name="title" placeholder="Security Policy" required />
              </div>
              <div className="field">
                <label htmlFor="content">Content</label>
                <textarea id="content" name="content" onChange={(event) => setDocumentContent(event.target.value)} placeholder="Paste Markdown or plain text..." required rows={10} value={documentContent} />
                <div className={`upload-meter ${isDocumentContentTooLarge ? "error" : ""}`} data-tooltip="The ingestion service currently accepts up to 1 MB of text per upload">
                  <span>{formatBytes(documentContentBytes)} / {formatBytes(maxDocumentBytes)}</span>
                  <span>{isDocumentContentTooLarge ? "Too large" : "Ready"}</span>
                </div>
              </div>
              <button className="btn btn-primary" disabled={isUploading || isDocumentContentTooLarge} type="submit">
                <WorkspaceIcon icon={Upload01Icon} size={17} />
                {isUploading ? "Uploading..." : "Queue for indexing"}
              </button>
            </form>
          </aside>
        </section>
        ) : null}
        {isUsageView ? (
        <section className="usage-page" id="usage-ledger">
          <div className="workspace-card usage-summary">
            <div>
              <p className="eyebrow">Usage</p>
              <h2>Operational readiness</h2>
            </div>
            <div className="stats-grid usage-ledger">
              {usageMetrics.map((metric) => (
                <div className="metric" key={metric.label}>
                  <strong>
                    <AnimatedNumber value={metric.value} />
                  </strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="usage-columns">
            <div className="workspace-card">
              <p className="eyebrow">Ingestion</p>
              <div className="usage-status-list">
                {dashboardMetrics.map((metric) => (
                  <button className={`usage-status ${metric.tone}`} key={metric.label} onClick={() => {
                    if (metric.label === "Indexed") {
                      setDocumentStatusFilter("indexed");
                    }
                    if (metric.label === "Failed") {
                      setDocumentStatusFilter("failed");
                    }
                    if (metric.label === "In flight") {
                      setDocumentStatusFilter(queuedDocumentCount > 0 ? "queued" : "processing");
                    }
                    router.push("/app/documents");
                  }} type="button">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </button>
                ))}
              </div>
            </div>
            <div className="workspace-card">
              <p className="eyebrow">Providers</p>
              {providerStatus ? (
                <div className="provider-settings compact">
                  <div>
                    <span>Embedding</span>
                    <strong>{providerStatus.embedding.provider}</strong>
                    <small>{providerStatus.embedding.model}</small>
                    <b className={providerStatus.embedding.ready ? "ready" : "blocked"}>{providerStatus.embedding.status}</b>
                  </div>
                  <div>
                    <span>Answer</span>
                    <strong>{providerStatus.answer.provider}</strong>
                    <small>{providerStatus.answer.model}</small>
                    <b className={providerStatus.answer.ready ? "ready" : "blocked"}>{providerStatus.answer.status}</b>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <strong>Provider status unavailable</strong>
                  <span>Refresh the workspace after backend services are reachable.</span>
                </div>
              )}
            </div>
          </div>
        </section>
        ) : null}
        {isSettingsView ? (
          <section className="workspace-card settings-panel" id="settings">
            <p className="eyebrow">Settings</p>
            <h2>Workspace controls</h2>
            <div className="settings-list">
              <div>
                <span>Signed in as</span>
                <strong>{user?.email}</strong>
              </div>
              <div>
                <span>Current tenant</span>
                <strong>{tenant?.name ?? "No tenant"}</strong>
              </div>
              <div>
                <span>Source upload limit</span>
                <strong>{formatBytes(maxDocumentBytes)}</strong>
              </div>
            </div>
            {providerStatus ? (
              <div className="provider-settings">
                <div>
                  <span>Embedding</span>
                  <strong>{providerStatus.embedding.provider}</strong>
                  <small>{providerStatus.embedding.model}</small>
                  <b className={providerStatus.embedding.ready ? "ready" : "blocked"}>{providerStatus.embedding.status}</b>
                </div>
                <div>
                  <span>Answer</span>
                  <strong>{providerStatus.answer.provider}</strong>
                  <small>{providerStatus.answer.model}</small>
                  <b className={providerStatus.answer.ready ? "ready" : "blocked"}>{providerStatus.answer.status}</b>
                </div>
                <div>
                  <span>Vector index</span>
                  <strong>{providerStatus.qdrant_collection}</strong>
                  <small>{providerStatus.retrieval_limit} retrieval limit</small>
                  <b className="ready">configured</b>
                </div>
              </div>
            ) : null}
            <button className="btn btn-ghost danger" onClick={handleLogout} type="button">
              <WorkspaceIcon icon={Logout01Icon} size={16} />
              Logout
            </button>
          </section>
        ) : null}
      </section>
      {status ? (
        <div className={`toast ${status.tone}`} role={status.tone === "error" ? "alert" : "status"}>
          {status.message}
        </div>
      ) : null}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function byteSize(value: string) {
  return new TextEncoder().encode(value).length;
}

function formatBytes(value: number) {
  if (value < 1_000) {
    return `${value} B`;
  }

  if (value < 1_000_000) {
    return `${(value / 1_000).toFixed(1)} KB`;
  }

  return `${(value / 1_000_000).toFixed(2)} MB`;
}

function percentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.max(4, Math.round((value / total) * 100));
}

function initials(value: string) {
  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "G";
}

function compareDocuments(left: DocumentSummary, right: DocumentSummary, sort: DocumentSort) {
  if (sort === "title") {
    return left.title.localeCompare(right.title);
  }

  if (sort === "status") {
    return left.status.localeCompare(right.status) || left.title.localeCompare(right.title);
  }

  const leftDate = sort === "created" ? left.created_at : left.updated_at;
  const rightDate = sort === "created" ? right.created_at : right.updated_at;
  return new Date(rightDate).getTime() - new Date(leftDate).getTime();
}

function resolveDocumentSort(value: string): DocumentSort {
  return documentSortOptions.find((option) => option === value) ?? "updated";
}

function statusTooltip(status: string) {
  if (status === "indexed" || status === "completed") {
    return "Ready for citation-backed answers";
  }

  if (status === "failed") {
    return "Needs review or retry";
  }

  if (status === "queued") {
    return "Waiting for ingestion";
  }

  if (status === "processing" || status === "running") {
    return "Currently indexing";
  }

  if (status === "deleted") {
    return "Hidden from retrieval";
  }

  return "Current source status";
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
