"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, Upload, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, API_URL } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ChangeLogItem {
  section: string;
  original: string;
  improved: string;
  reason?: string;
}

export default function ImprovePage() {
  const [activeTab, setActiveTab] = useState<"full" | "bullet">("full");

  // Full Resume Optimizer State
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [improvedText, setImprovedText] = useState("");
  const [changes, setChanges] = useState<ChangeLogItem[]>([]);
  const [loadingFull, setLoadingFull] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [copiedImproved, setCopiedImproved] = useState(false);

  // Single Bullet Optimizer State
  const [bullet, setBullet] = useState("Worked on web development projects");
  const [context, setContext] = useState("Software Engineer role");
  const [improvedBullet, setImprovedBullet] = useState("");
  const [loadingBullet, setLoadingBullet] = useState(false);
  const [copiedBullet, setCopiedBullet] = useState(false);

  // Handle PDF/DOCX upload text extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    const formData = new FormData();
    formData.append("resume", file);

    const token = localStorage.getItem("resumeiq_token");

    try {
      const res = await fetch(`${API_URL}/api/jobs/extract-text`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Text extraction failed");
      setResumeText(data.text || "");
      toast.success("Resume text extracted! You can edit it below.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to extract text");
    } finally {
      setExtracting(false);
    }
  };

  // Full Resume AI Optimization
  const handleImproveFullResume = async () => {
    if (!resumeText.trim()) {
      toast.error("Please enter or upload a resume to improve");
      return;
    }
    setLoadingFull(true);
    try {
      const res = await api.post<{ data: { improvedText: string; changes: ChangeLogItem[] } }>(
        "/api/jobs/improve-resume",
        { resumeText, targetRole }
      );
      setImprovedText(res.data.improvedText);
      setChanges(res.data.changes || []);
      toast.success("Resume optimized successfully!");
    } catch {
      toast.error("Failed to optimize resume");
    } finally {
      setLoadingFull(false);
    }
  };

  // Single Bullet AI Optimization
  const handleImproveBullet = async () => {
    if (!bullet.trim()) {
      toast.error("Please enter a bullet point to improve");
      return;
    }
    setLoadingBullet(true);
    try {
      const data = await api.post<{ improved: string }>("/api/jobs/improve-bullet", {
        bullet,
        context,
      });
      setImprovedBullet(data.improved);
      toast.success("Bullet improved!");
    } catch {
      toast.error("Failed to improve bullet");
    } finally {
      setLoadingBullet(false);
    }
  };

  const copyImprovedFull = () => {
    navigator.clipboard.writeText(improvedText);
    setCopiedImproved(true);
    setTimeout(() => setCopiedImproved(false), 2000);
  };

  const copyImprovedBullet = () => {
    navigator.clipboard.writeText(improvedBullet);
    setCopiedBullet(true);
    setTimeout(() => setCopiedBullet(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="text-purple-400" /> AI Resume Improver
          </h1>
          <p className="text-muted-foreground mt-1">
            Transform weak sections or full resumes into quantified, role-targeted achievements
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-muted/40 p-1 rounded-xl border border-border">
          <Button
            variant={activeTab === "full" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("full")}
            className="rounded-lg"
          >
            Full Resume
          </Button>
          <Button
            variant={activeTab === "bullet" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("bullet")}
            className="rounded-lg"
          >
            Bullet Points
          </Button>
        </div>
      </div>

      {activeTab === "full" ? (
        <div className="space-y-8">
          {/* Setup / Settings */}
          <Card className="p-6 border-border bg-card/60 backdrop-blur-sm space-y-6">
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="role-input">Target Job Role</Label>
                <Input
                  id="role-input"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="bg-muted/20"
                />
              </div>

              <div>
                <Label className="border border-dashed border-border rounded-lg h-[40px] px-4 flex items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors gap-2 text-sm text-muted-foreground">
                  {extracting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-purple-400" />
                  )}
                  <span>{extracting ? "Extracting..." : "Upload PDF/DOCX"}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={extracting}
                  />
                </Label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleImproveFullResume}
                disabled={loadingFull || !resumeText.trim()}
                className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
              >
                {loadingFull ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Optimizing with AI...
                  </>
                ) : (
                  <>
                    Optimize Resume <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Side-by-Side Comparison */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Original Resume Text Area */}
            <Card className="p-6 border-border bg-card/40 backdrop-blur-sm space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-red-400">
                <FileText className="w-5 h-5" /> Original Resume
              </h3>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your original resume text here, or upload a file above to extract text..."
                className="w-full h-[400px] bg-muted/20 border border-border rounded-lg p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </Card>

            {/* AI Improved Resume */}
            <Card className="p-6 border-border bg-card/40 backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-green-400">
                  <Sparkles className="w-5 h-5" /> AI Optimized Resume
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyImprovedFull}
                  disabled={!improvedText}
                >
                  {copiedImproved ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiedImproved ? "Copied" : "Copy Resume"}
                </Button>
              </div>
              <textarea
                value={improvedText}
                readOnly
                placeholder="AI optimized resume will appear here once analysis is run..."
                className="w-full h-[400px] bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 text-sm font-mono resize-none focus:outline-none"
              />
            </Card>
          </div>

          {/* Difference Changelog */}
          {changes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 border-border bg-card/40 backdrop-blur-sm space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-purple-400">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" /> Detailed Improvement Changelog
                </h3>
                <div className="space-y-6">
                  {changes.map((c, i) => (
                    <div key={i} className="border-b border-border/60 pb-6 last:border-none last:pb-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/5">
                          {c.section}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Before */}
                        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
                          <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Before</p>
                          <p className="text-sm line-through text-muted-foreground">{c.original}</p>
                        </div>
                        {/* After */}
                        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-2">
                          <p className="text-xs text-green-400 font-bold uppercase tracking-wider">Optimized</p>
                          <p className="text-sm font-medium text-foreground">{c.improved}</p>
                        </div>
                      </div>
                      {c.reason && (
                        <p className="text-xs text-muted-foreground mt-3 italic">
                          💡 <strong>Reason:</strong> {c.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 border-border space-y-4 bg-card/60 backdrop-blur-sm">
            <div>
              <Label>Original Bullet Point</Label>
              <Input
                value={bullet}
                onChange={(e) => setBullet(e.target.value)}
                className="mt-1.5 bg-muted/20"
              />
            </div>
            <div>
              <Label>Target Role Context</Label>
              <Input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="mt-1.5 bg-muted/20"
              />
            </div>
            <Button
              onClick={handleImproveBullet}
              disabled={loadingBullet}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loadingBullet ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loadingBullet ? "Improving..." : "Improve with AI"}
            </Button>
          </Card>

          {improvedBullet && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 border-purple-500/30 bg-purple-500/5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs text-purple-400 font-medium mb-2 uppercase tracking-wider">Optimized Bullet</p>
                    <p className="text-lg leading-relaxed">{improvedBullet}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyImprovedBullet}>
                    {copiedBullet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          <Card className="p-6 border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Example:</strong> &quot;Worked on web development&quot; →
              &quot;Developed scalable web applications using React and Node.js, improving user engagement by 35%.&quot;
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
