"use client";

import { motion } from "framer-motion";
import { ArrowRight, FileText, Upload, CheckCircle, Kanban, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30">
      <PublicNavbar />
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 mt-16">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 mb-6 py-1 px-4 rounded-full bg-purple-500/10">
              AI-Powered Career Intelligence 🚀
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              Optimize Your Resume. <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                Land Your Dream Job.
              </span>
            </h1>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your resume and let our advanced AI analyze, score, and optimize it for ATS systems. Match with job descriptions and track your applications all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 rounded-full px-8 w-full h-14 text-lg font-semibold">
                  Start Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="rounded-full px-8 w-full h-14 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise-grade career tools</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {[
              { icon: BarChart3, label: "Analytics Dashboard" },
              { icon: Upload, label: "PDF & DOCX Parse" },
              { icon: CheckCircle, label: "ATS Scoring" },
              { icon: FileText, label: "Cover Letters" },
              { icon: Kanban, label: "App Tracker" },
              { icon: MessageSquare, label: "Career AI Chat" },
            ].map((f) => (
              <Card key={f.label} className="p-4 text-center border-border bg-card/50">
                <f.icon className="w-6 h-6 mx-auto text-purple-400 mb-2" />
                <p className="text-xs font-medium">{f.label}</p>
              </Card>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-black/50 border-white/10 p-8 h-full backdrop-blur-sm hover:border-purple-500/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6">
                  <Upload className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Smart Parsing</h3>
                <p className="text-white/60 leading-relaxed">
                  Simply upload your PDF or DOCX. Our AI extracts your experience, skills, and education with pixel-perfect accuracy.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-black/50 border-white/10 p-8 h-full backdrop-blur-sm hover:border-blue-500/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">ATS Scoring</h3>
                <p className="text-white/60 leading-relaxed">
                  Get instant feedback on your resume's ATS compatibility. Fix formatting issues and missing keywords before you apply.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-black/50 border-white/10 p-8 h-full backdrop-blur-sm hover:border-pink-500/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">AI Generation</h3>
                <p className="text-white/60 leading-relaxed">
                  Generate optimized bullet points and personalized cover letters tailored to specific job descriptions.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
