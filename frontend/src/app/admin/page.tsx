"use client";

import { useEffect, useState } from "react";
import { Shield, Users, FileText, Briefcase, Zap, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [users, setUsers] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    Promise.all([
      api.get<Record<string, unknown>>("/api/admin/stats"),
      api.get<{ users: unknown[] }>("/api/admin/users"),
    ])
      .then(([s, u]) => {
        setStats(s);
        setUsers(u.users);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const cards = [
    { label: "Users", value: stats?.users, icon: Users },
    { label: "Resumes", value: stats?.resumes, icon: FileText },
    { label: "Applications", value: stats?.applications, icon: Briefcase },
    { label: "AI Tokens", value: stats?.totalTokens, icon: Zap },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-amber-400" />
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Platform analytics and user management</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5 border-border">
              <Icon className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{String(c.value ?? 0)}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 border-border overflow-x-auto">
        <h2 className="font-semibold mb-4">Users</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-2">Email</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Resumes</th>
              <th className="pb-2">Apps</th>
            </tr>
          </thead>
          <tbody>
            {(users as { email: string; role: string; _count: { resumes: number; applications: number } }[]).map(
              (u) => (
                <tr key={u.email} className="border-b border-border/50">
                  <td className="py-3">{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u._count?.resumes}</td>
                  <td>{u._count?.applications}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
