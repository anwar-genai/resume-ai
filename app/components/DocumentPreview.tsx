"use client";
import { useState, useEffect } from "react";
import Button from "@/app/components/ui/Button";
import IconButton from "@/app/components/ui/IconButton";
import Badge from "@/app/components/ui/Badge";
import Skeleton from "@/app/components/ui/Skeleton";

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentType: "resume" | "cover" | "proposal";
  title: string;
  metadata?: {
    company?: string;
    jobTitle?: string;
    clientName?: string;
    createdAt: string;
  };
}

export default function DocumentPreview({
  isOpen,
  onClose,
  documentId,
  documentType,
  title,
  metadata,
}: DocumentPreviewProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"txt" | "pdf" | "docx">("pdf");

  useEffect(() => {
    if (isOpen && documentId) {
      fetchContent();
    }
  }, [isOpen, documentId]);

  async function fetchContent() {
    setLoading(true);
    try {
      const response = await fetch(`/api/preview/${documentType}/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || "");
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    const downloadUrl = `/api/export/${documentType}/${documentId}?format=${downloadFormat}`;
    
    if (downloadFormat === "pdf") {
      // For PDF, we need to fetch and create a blob
      try {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error("Download failed:", error);
      }
    } else {
      // For other formats, direct download
      window.location.href = downloadUrl;
    }
  }

  if (!isOpen) return null;

  const typeConfig = {
    resume: { color: "indigo", icon: "📄", label: "Resume" },
    cover: { color: "emerald", icon: "✉️", label: "Cover Letter" },
    proposal: { color: "purple", icon: "💼", label: "Proposal" },
  };

  const config = typeConfig[documentType];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 rounded-t-2xl">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${config.color}-100 dark:bg-${config.color}-900/30 flex items-center justify-center`}>
                    <span className="text-2xl">{config.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" size="sm">
                        {config.label}
                      </Badge>
                      {metadata?.company && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          @ {metadata.company}
                        </span>
                      )}
                      {metadata?.jobTitle && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          • {metadata.jobTitle}
                        </span>
                      )}
                      {metadata?.clientName && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Client: {metadata.clientName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <IconButton
                  onClick={onClose}
                  variant="ghost"
                  size="md"
                  className="hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </IconButton>
              </div>

              {/* Action Bar */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Created {new Date(metadata?.createdAt || Date.now()).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={downloadFormat}
                    onChange={(e) => setDownloadFormat(e.target.value as any)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">Word (DOCX)</option>
                    <option value="txt">Text (TXT)</option>
                  </select>
                  <Button
                    onClick={handleDownload}
                    variant="primary"
                    size="sm"
                    className="group"
                  >
                    <svg
                      className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton variant="text" height="20px" />
                  <Skeleton variant="text" height="20px" />
                  <Skeleton variant="text" height="20px" width="80%" />
                  <div className="h-4" />
                  <Skeleton variant="rectangular" height="100px" />
                  <div className="h-4" />
                  <Skeleton variant="text" height="20px" />
                  <Skeleton variant="text" height="20px" />
                  <Skeleton variant="text" height="20px" width="60%" />
                </div>
              ) : (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 leading-relaxed">
                    {content || "No content available"}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800 p-6 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(content)}
                    className="group"
                  >
                    <svg
                      className="w-4 h-4 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy to Clipboard
                  </Button>
                  {documentType === "resume" && (
                    <Button variant="ghost" size="sm">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Resume
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
