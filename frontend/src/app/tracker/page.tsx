"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

type AppStatus = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  status: AppStatus;
  matchPercentage?: number | null;
  notes?: string | null;
}

const COLUMNS: { status: AppStatus; label: string; color: string }[] = [
  { status: "APPLIED", label: "Applied", color: "border-blue-500/40" },
  { status: "INTERVIEW", label: "Interview", color: "border-purple-500/40" },
  { status: "OFFER", label: "Offer", color: "border-green-500/40" },
  { status: "REJECTED", label: "Rejected", color: "border-red-500/40" },
];

export default function TrackerPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");

  const load = () =>
    api
      .get<{ applications: Application[] }>("/api/applications")
      .then((d) => setApps(d.applications))
      .catch(() => toast.error("Failed to load applications"));

  useEffect(() => {
    load();
  }, []);

  const addApp = async () => {
    if (!company || !title) return;
    try {
      await api.post("/api/applications", { companyName: company, jobTitle: title });
      setCompany("");
      setTitle("");
      setShowForm(false);
      load();
      toast.success("Application added");
    } catch {
      toast.error("Failed to add");
    }
  };

  const moveApp = async (id: string, status: AppStatus) => {
    try {
      await api.patch(`/api/applications/${id}`, { status });
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Application Tracker</h1>
          <p className="text-muted-foreground mt-1">Kanban board for your job search pipeline</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700 gap-2">
          <Plus className="w-4 h-4" /> Add Application
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-border flex flex-wrap gap-3 items-end">
          <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button onClick={addApp}>Save</Button>
        </Card>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {col.label} ({apps.filter((a) => a.status === col.status).length})
            </h3>
            <div className={`min-h-[400px] rounded-xl border-2 border-dashed ${col.color} p-3 space-y-3`}>
              {apps
                .filter((a) => a.status === col.status)
                .map((app) => (
                  <motion.div key={app.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="p-4 border-border bg-card cursor-grab active:cursor-grabbing">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{app.companyName}</p>
                          <p className="text-sm text-muted-foreground truncate">{app.jobTitle}</p>
                          {app.matchPercentage != null && (
                            <p className="text-xs text-purple-400 mt-1">{app.matchPercentage}% match</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {COLUMNS.filter((c) => c.status !== app.status).map((c) => (
                          <button
                            key={c.status}
                            onClick={() => moveApp(app.id, c.status)}
                            className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
