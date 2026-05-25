"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  FileText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { api, API_URL } from "@/lib/api";

interface ResumeItem {
  id: string;
  title: string;
  createdAt: string;
  atsScore?: number;
}

export default function LatexBuilderPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [latexCode, setLatexCode] = useState<string>("");
  const [loadingList, setLoadingList] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  // File Upload state
  const [file, setFile] = useState<File | null>(null);

  // Load user's resumes
  const fetchResumes = async (selectLatest = false) => {
    try {
      const data = await api.get<{ resumes: ResumeItem[] }>("/api/resumes");
      const list = data.resumes || [];
      setResumes(list);
      
      // Select resume from URL parameter if provided
      const params = new URLSearchParams(window.location.search);
      const urlResumeId = params.get("id");
      
      if (urlResumeId && list.some(r => r.id === urlResumeId)) {
        setSelectedResumeId(urlResumeId);
      } else if (list.length > 0) {
        if (selectLatest) {
          setSelectedResumeId(list[0].id);
        } else if (!selectedResumeId) {
          setSelectedResumeId(list[0].id);
        }
      }
    } catch {
      toast.error("Failed to load your resumes");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Fetch LaTeX for selected resume
  const handleGenerateLatex = async (regenerate = false) => {
    if (!selectedResumeId) {
      toast.error("Please select or upload a resume first");
      return;
    }
    setGenerating(true);
    try {
      const token = localStorage.getItem("resumeiq_token");
      const response = await fetch(`${API_URL}/api/resumes/${selectedResumeId}/latex`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ regenerate }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate LaTeX");
      setLatexCode(data.latexCode || "");
      toast.success(regenerate ? "LaTeX regenerated successfully" : "LaTeX loaded successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate LaTeX");
    } finally {
      setGenerating(false);
    }
  };

  // Upload new resume and generate LaTeX
  const handleUploadAndGenerate = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("targetRole", "Software Engineer"); // Default target role
    const token = localStorage.getItem("resumeiq_token");

    try {
      const res = await fetch(`${API_URL}/api/resumes`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast.success("Resume parsed successfully");
      setFile(null);
      
      // Refresh list and select the new resume
      const newResume = data.resume;
      if (newResume && newResume.id) {
        setSelectedResumeId(newResume.id);
        await fetchResumes(true);
        // Automatically generate LaTeX for it
        setGenerating(true);
        const latexRes = await fetch(`${API_URL}/api/resumes/${newResume.id}/latex`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ regenerate: false }),
        });
        const latexData = await latexRes.json();
        if (latexRes.ok && latexData.latexCode) {
          setLatexCode(latexData.latexCode);
          toast.success("LaTeX generated successfully");
        } else {
          toast.error("Failed to automatically build LaTeX after upload");
        }
        setGenerating(false);
      } else {
        await fetchResumes();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload and parse resume");
    } finally {
      setUploading(false);
    }
  };

  // Automatically fetch LaTeX when selected resume changes (if we haven't generated yet)
  useEffect(() => {
    if (selectedResumeId) {
      // Clear current LaTeX first
      setLatexCode("");
      // Fetch
      handleGenerateLatex(false);
    }
  }, [selectedResumeId]);

  // Copy to clipboard
  const handleCopy = () => {
    if (!latexCode) return;
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    toast.success("LaTeX source copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .tex file
  const handleDownload = () => {
    if (!latexCode) return;
    const blob = new Blob([latexCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const resumeName = resumes.find(r => r.id === selectedResumeId)?.title || "resume";
    const baseName = resumeName.replace(/\.[^/.]+$/, "");
    link.setAttribute("download", `${baseName}_latex.tex`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("LaTeX file downloaded successfully");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileCode className="w-8 h-8 text-purple-500" />
            LaTeX Resume Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Convert your uploaded resume into a compiles-successfully, professional LaTeX document.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 flex-1 items-stretch">
        {/* Left Side: Select/Upload Resume */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 border-border bg-card/60 backdrop-blur space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Select Resume</h2>
              <p className="text-xs text-muted-foreground">Select a previously uploaded resume to build LaTeX</p>
            </div>

            {loadingList ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 border border-dashed border-border rounded-xl">
                No resumes found. Please upload one below.
              </p>
            ) : (
              <div className="space-y-3">
                <label htmlFor="resume-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Choose Active Resume
                </label>
                <select
                  id="resume-select"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.atsScore ? `ATS ${r.atsScore}` : "Unscored"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground font-semibold uppercase tracking-widest bg-card px-2">
                or upload new
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Quick Upload Panel */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload New Resume</label>
                <label className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-purple-500/50 hover:bg-muted/10 transition-all duration-200">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-center">Drag & drop or click</span>
                  <span className="text-xs text-muted-foreground mt-1">PDF, DOCX — max 5MB</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-xl">
                  <span className="text-xs truncate max-w-[200px] font-medium text-muted-foreground">{file.name}</span>
                  <Button
                    onClick={handleUploadAndGenerate}
                    disabled={uploading}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 h-8 rounded-lg"
                  >
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Upload & Build
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Interactive Code Workspace */}
        <div className="lg:col-span-8 flex flex-col">
          <Card className="border-border bg-card/60 backdrop-blur flex-1 flex flex-col overflow-hidden min-h-[500px]">
            {/* Header / Actions toolbar */}
            <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-muted/20">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>resume_source.tex</span>
              </div>

              {latexCode && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateLatex(true)}
                    disabled={generating}
                    className="h-9 border-border bg-background hover:bg-muted text-xs font-semibold"
                    title="Regenerate LaTeX with AI"
                  >
                    {generating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1 text-purple-400" />
                    )}
                    Regenerate AI
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-9 border-border bg-background hover:bg-muted text-xs font-semibold"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 mr-1 text-green-500 animate-bounce" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1 text-purple-400" />
                    )}
                    Copy
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-9 border-border bg-background hover:bg-muted text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-purple-400" />
                    Download
                  </Button>

                  {/* Overleaf Direct Submission Form */}
                  <form
                    action="https://www.overleaf.com/docs"
                    method="POST"
                    target="_blank"
                    className="inline-block"
                  >
                    <input type="hidden" name="snip" value={latexCode} />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Open in Overleaf
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Code Body Editor */}
            <div className="flex-1 relative overflow-hidden bg-black/45 p-4 flex flex-col font-mono text-sm leading-relaxed min-h-[400px]">
              {generating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                    Synthesizing LaTeX document with AI...
                  </p>
                </div>
              ) : !latexCode ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <FileCode className="w-16 h-16 text-muted-foreground/20 mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No LaTeX Code Yet</h3>
                  <p className="text-xs max-w-sm">
                    Select a resume from the list or upload a new one to generate clean LaTeX resume markup.
                  </p>
                </div>
              ) : null}

              <textarea
                value={latexCode}
                onChange={(e) => setLatexCode(e.target.value)}
                disabled={generating}
                placeholder="% Type or paste LaTeX code here..."
                className="w-full flex-1 bg-transparent text-slate-100 placeholder-slate-600 border-none outline-none focus:ring-0 resize-none font-mono text-sm leading-relaxed overflow-y-auto min-h-[400px]"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255,255,255,0.1) transparent",
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
