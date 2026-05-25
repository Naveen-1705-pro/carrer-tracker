"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, FileCode } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";

interface Problem {
  area: string;
  severity: "High" | "Medium" | "Low";
  description: string;
  fix: string;
}

interface ResumeAnalysis {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    bullets?: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  atsScore: number;
  targetRoleEvaluated?: string;
  matchedSkillsForRole?: string[];
  missingSkillsForRole?: string[];
  highlightedProblems?: Problem[];
  recommendations?: string[];
  interviewProbability?: number;
  industryMatch?: number;
  atsDetails?: Record<string, number>;
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [uploadedResumeId, setUploadedResumeId] = useState<string>("");

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("targetRole", targetRole);
    const token = localStorage.getItem("resumeiq_token");
    const endpoint = token ? `${API_URL}/api/resumes` : `${API_URL}/api/upload`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      const resultData = data.resume?.data || data.data || data.resume;
      setResult(resultData as ResumeAnalysis);
      setUploadedResumeId(data.resume?.id || data.id || "");
      toast.success("Resume analyzed successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to process resume");
    } finally {
      setLoading(false);
    }
  };

  const atsScore = result?.atsScore || 0;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Resume Analyzer</h1>
        <p className="text-muted-foreground mt-1">Upload PDF or DOCX for critical target-role ATS scoring and problem highlights</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border-border h-fit space-y-4">
          <h2 className="font-semibold text-lg">Analysis Settings</h2>
          
          <div className="space-y-2">
            <label htmlFor="target-role" className="text-sm font-medium text-muted-foreground">
              Target Job Role
            </label>
            <input
              type="text"
              id="target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Select Resume File</label>
            <label className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-purple-500/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-center">Drag & drop or click</span>
              <span className="text-xs text-muted-foreground mt-1">PDF, DOCX — max 5MB</span>
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {file && (
            <p className="text-sm truncate text-muted-foreground font-medium bg-muted/40 p-2 rounded border border-border">{file.name}</p>
          )}

          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!file || loading}
            onClick={handleUpload}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Resume"}
          </Button>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {!result && !loading && (
            <Card className="p-12 flex flex-col items-center text-center border-border min-h-[400px] justify-center">
              <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Upload your resume to see ATS score and role-specific analysis</p>
            </Card>
          )}

          {loading && (
            <Card className="p-12 flex flex-col items-center border-border min-h-[400px] justify-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="animate-pulse text-muted-foreground">Evaluating resume for &quot;{targetRole}&quot;...</p>
            </Card>
          )}

          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card className="p-8 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Role Alignment Score</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Evaluated specifically for{" "}
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-none">
                        {result.targetRoleEvaluated || targetRole}
                      </Badge>
                    </p>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-6xl font-black text-purple-400">{atsScore}</span>
                    <span className="text-muted-foreground mb-2">/ 100</span>
                  </div>
                </div>
                <Progress value={atsScore} className="h-3" />
                {uploadedResumeId && (
                  <div className="mt-4 flex justify-end">
                    <Link href={`/latex?id=${uploadedResumeId}`}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full gap-2 text-xs font-semibold py-1.5 h-8">
                        <FileCode className="w-3.5 h-3.5" />
                        Build LaTeX Version
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>

              {/* Role Skills Analysis */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 border-border">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-green-400">
                    <CheckCircle className="w-5 h-5" /> Matched Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedSkillsForRole?.length ? (
                      result.matchedSkillsForRole.map((s, i) => (
                        <Badge key={i} variant="secondary" className="bg-green-500/15 text-green-300 border-none">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No matching role-specific skills found.</p>
                    )}
                  </div>
                </Card>
                <Card className="p-6 border-border">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-amber-400">
                    <AlertTriangle className="w-5 h-5" /> Missing Critical Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingSkillsForRole?.length ? (
                      result.missingSkillsForRole.map((s, i) => (
                        <Badge key={i} variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-500/5">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No critical skill gaps identified.</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Highlighted Problems */}
              {result.highlightedProblems && result.highlightedProblems.length > 0 && (
                <Card className="p-6 border-border">
                  <h3 className="font-semibold flex items-center gap-2 mb-4 text-purple-400 text-lg">
                    <AlertTriangle className="w-5 h-5 text-purple-400" /> Highlighted Resume Problems
                  </h3>
                  <div className="space-y-4">
                    {result.highlightedProblems.map((prob, i) => (
                      <div key={i} className="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground capitalize">{prob.area}</span>
                          <Badge 
                            variant="secondary" 
                            className={
                              prob.severity === 'High' 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                : prob.severity === 'Medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }
                          >
                            {prob.severity} Severity
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{prob.description}</p>
                        <div className="p-3 bg-purple-500/5 border border-dashed border-purple-500/20 rounded-lg text-sm text-purple-300">
                          <strong>Fix:</strong> {prob.fix}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* General Extracted Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 border-border">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-muted-foreground" /> All Extracted Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skills?.map((s, i) => (
                      <Badge key={i} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </Card>
                <Card className="p-6 border-border">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-muted-foreground" /> Recommendations
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    {result.recommendations?.map((r, i) => (
                      <li key={i} className="leading-relaxed">{r}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
