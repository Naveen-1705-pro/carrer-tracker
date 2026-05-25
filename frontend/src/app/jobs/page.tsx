"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, FileText, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function JobsPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tone, setTone] = useState("professional");
  const [match, setMatch] = useState<Record<string, unknown> | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Software Engineer");
  const [searchLocation, setSearchLocation] = useState("Remote");

  const runMatch = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Paste resume and job description");
      return;
    }
    setLoadingMatch(true);
    try {
      const data = await api.post<{ data: Record<string, unknown> }>("/api/jobs/match", {
        resumeText,
        jobDescription,
      });
      setMatch(data.data);
      toast.success("Match analysis complete");
    } catch {
      toast.error("Match failed");
    } finally {
      setLoadingMatch(false);
    }
  };

  const runCoverLetter = async () => {
    setLoadingLetter(true);
    try {
      const data = await api.post<{ coverLetter: string }>("/api/jobs/cover-letter", {
        resumeText,
        jobDescription,
        companyName,
        tone,
      });
      setCoverLetter(data.coverLetter);
      toast.success("Cover letter generated");
    } catch {
      toast.error("Generation failed");
    } finally {
      setLoadingLetter(false);
    }
  };

  const copyLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const matchPct = (match?.matchPercentage as number) || 0;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Briefcase className="text-purple-400" /> Job Matcher
        </h1>
        <p className="text-muted-foreground mt-1">
          Semantic similarity + AI analysis against job descriptions
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-border space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Resume text
          </h2>
          <textarea
            className="w-full h-40 rounded-lg border border-border bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Paste your resume text..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
          <h2 className="font-semibold">Job description</h2>
          <textarea
            className="w-full h-40 rounded-lg border border-border bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Paste the job description..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <Button onClick={runMatch} disabled={loadingMatch} className="bg-purple-600 hover:bg-purple-700">
            {loadingMatch ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Match"}
          </Button>
        </Card>

        <div className="space-y-6">
          {match && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-6 border-border">
                <p className="text-sm text-muted-foreground mb-1">Match score</p>
                <p className="text-5xl font-bold text-purple-400 mb-4">{matchPct}%</p>
                <Progress value={matchPct} className="mb-6" />
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2 text-green-400">Matching keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {(match.matchingKeywords as string[])?.map((k) => (
                        <Badge key={k} className="bg-green-500/15 text-green-300">{k}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 text-amber-400">Missing skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(match.missingSkills as string[])?.map((k) => (
                        <Badge key={k} variant="outline" className="border-amber-500/40 text-amber-300">{k}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <Card className="p-6 border-border space-y-4">
            <h2 className="font-semibold">Cover letter generator</h2>
            <input
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              placeholder="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
            <Button variant="outline" onClick={runCoverLetter} disabled={loadingLetter}>
              {loadingLetter ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Cover Letter"}
            </Button>
            {coverLetter && (
              <div className="relative">
                <pre className="whitespace-pre-wrap text-sm bg-muted/40 p-4 rounded-lg max-h-64 overflow-auto">
                  {coverLetter}
                </pre>
                <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copyLetter}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </Card>

          {/* Quick Apply Portals Card */}
          <Card className="p-6 border-border space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              Quick Apply Portals
            </h2>
            <p className="text-xs text-muted-foreground">
              Search and apply for jobs instantly across major platforms with your custom parameters:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Job Title (e.g. React Developer)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Location (e.g. Remote)"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
                  searchQuery + (searchLocation ? " " + searchLocation : "")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <Button variant="outline" className="w-full justify-between hover:bg-[#0077b5]/10 hover:text-[#0077b5] border-border hover:border-[#0077b5]/30">
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>

              <a
                href={`https://www.naukri.com/${encodeURIComponent(searchQuery).replace(/%20/g, '-')}-jobs${
                  searchLocation ? `-in-${encodeURIComponent(searchLocation).replace(/%20/g, '-')}` : ""
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <Button variant="outline" className="w-full justify-between hover:bg-[#ff7555]/10 hover:text-[#ff7555] border-border hover:border-[#ff7555]/30">
                  <span>Naukri</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>

              <a
                href={`https://www.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(
                  searchLocation
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <Button variant="outline" className="w-full justify-between hover:bg-[#2164f3]/10 hover:text-[#2164f3] border-border hover:border-[#2164f3]/30">
                  <span>Indeed</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  searchQuery + " " + searchLocation + " jobs"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <Button variant="outline" className="w-full justify-between hover:bg-green-500/10 hover:text-green-400 border-border hover:border-green-500/30">
                  <span>Google Jobs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
