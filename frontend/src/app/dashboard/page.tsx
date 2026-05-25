"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  TrendingUp,
  Briefcase,
  Target,
  Brain,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  atsScore: number;
  resumeStrength: number;
  applicationsCount: number;
  skillsDetected: string[];
  missingSkills: string[];
  interviewProbability: number;
  industryMatch: number;
  applicationsByStatus: Record<string, number>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ stats?: DashboardStats } & DashboardStats>("/api/resumes/dashboard")
      .then((data) => setStats(data as DashboardStats))
      .catch(() =>
        setStats({
          atsScore: 0,
          resumeStrength: 0,
          applicationsCount: 0,
          skillsDetected: [],
          missingSkills: [],
          interviewProbability: 0,
          industryMatch: 0,
          applicationsByStatus: { APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 },
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const s = stats!;
  const chartData = Object.entries(s.applicationsByStatus || {}).map(([name, value]) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    count: value,
  }));

  const radialData = [{ name: "ATS", value: s.atsScore, fill: "#a855f7" }];

  const metrics = [
    { label: "ATS Score", value: s.atsScore, icon: Target, suffix: "/100" },
    { label: "Resume Strength", value: s.resumeStrength, icon: TrendingUp, suffix: "%" },
    { label: "Applications", value: s.applicationsCount, icon: Briefcase, suffix: "" },
    { label: "Interview Probability", value: s.interviewProbability, icon: Brain, suffix: "%" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your resume performance and application pipeline
          </p>
        </div>
        <Link href="/resume">
          <Button className="bg-purple-600 hover:bg-purple-700">Upload Resume</Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 border-border bg-card/60 backdrop-blur hover:border-purple-500/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <Icon className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-3xl font-bold">
                  {m.value}
                  <span className="text-lg text-muted-foreground font-normal">{m.suffix}</span>
                </p>
                <Progress value={typeof m.value === "number" ? m.value : 0} className="mt-3" />
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 border-border bg-gradient-to-br from-purple-500/10 to-blue-500/10">
          <h3 className="font-semibold mb-4">ATS Score Ring</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-center text-4xl font-bold text-purple-400">{s.atsScore}</p>
          <p className="text-center text-sm text-muted-foreground">Industry match: {s.industryMatch}%</p>
        </Card>

        <Card className="lg:col-span-2 p-6 border-border">
          <h3 className="font-semibold mb-4">Applications by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border-border">
          <h3 className="font-semibold mb-4">Detected Skills</h3>
          <div className="flex flex-wrap gap-2">
            {s.skillsDetected?.length ? (
              s.skillsDetected.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-purple-500/15 text-purple-300">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Upload a resume to detect skills</p>
            )}
          </div>
        </Card>
        <Card className="p-6 border-border">
          <h3 className="font-semibold mb-4">Missing Skills</h3>
          <div className="flex flex-wrap gap-2">
            {s.missingSkills?.length ? (
              s.missingSkills.map((skill) => (
                <Badge key={skill} variant="outline" className="border-amber-500/40 text-amber-400">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Run job match to find skill gaps</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
