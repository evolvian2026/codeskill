"use client";

import { useEffect, useState } from "react";
import { campusBatchesAPI, campusAPI } from "@/config/api";
import { Search, Plus, BookOpen, Trash2, Copy, Users, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CampusBatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    graduationYear: new Date().getFullYear() + 1
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await campusAPI.getMyUniversities();
      if (res.data.universities.length > 0) {
        const id = res.data.universities[0].university._id;
        setUniversityId(id);
        fetchBatches(id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load university context", err);
      setLoading(false);
    }
  };

  const fetchBatches = async (uId: string) => {
    try {
      const res = await campusBatchesAPI.getAll(uId);
      setBatches(res.data.batches);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId) return;

    try {
      setCreating(true);
      await campusBatchesAPI.create(universityId, formData);
      setShowCreateForm(false);
      setFormData({ name: "", department: "", graduationYear: new Date().getFullYear() + 1 });
      fetchBatches(universityId);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create batch");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (batchId: string, batchName: string) => {
    if (!universityId) return;
    if (confirm(`Are you sure you want to delete ${batchName}?`)) {
      try {
        await campusBatchesAPI.delete(universityId, batchId);
        fetchBatches(universityId);
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete batch");
      }
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      if (typeof document !== "undefined" && document.hasFocus() && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        alert(`Invite Code copied: ${code}\nShare this code with your students!`);
        return;
      }
    } catch (e) {
      // Fallback
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      alert(`Invite Code copied: ${code}\nShare this code with your students!`);
    } catch (err) {
      console.warn("Copy failed", err);
    }
  };

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.department.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading batches...</div>
      </div>
    );
  }

  if (!universityId) {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">No University Found</h1>
        <p className="text-muted-foreground mb-8">Please create a university profile first before managing batches.</p>
        <Link href="/campus/profile" className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium">Create University Profile</Link>
      </div>
    );
  }

  return (
    <div className="p-8 font-sans max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batches & Cohorts</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize your students into graduation batches to track their performance.</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create New Batch
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
          <h2 className="text-lg font-bold text-foreground mb-4">Create a new batch</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Batch Name *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Class of 2026 - CS"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Department</label>
              <input 
                type="text" 
                placeholder="e.g. Computer Science"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Graduation Year *</label>
              <input 
                type="number" 
                required
                min="2020"
                max="2040"
                value={formData.graduationYear}
                onChange={e => setFormData({...formData, graduationYear: parseInt(e.target.value)})}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-foreground"
              />
            </div>
            <div className="flex gap-2 h-[38px]">
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={creating}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? "Creating..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search batches..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-foreground transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {filteredBatches.length} {filteredBatches.length === 1 ? 'batch' : 'batches'}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Batch Details</th>
                <th className="px-6 py-3">Invite Code</th>
                <th className="px-6 py-3">Created By</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium">No batches found</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Create a new batch to start organizing students.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground text-base">{batch.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {batch.department || "No Department"} • Class of {batch.graduationYear}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg font-mono text-xs font-medium text-foreground">
                        {batch.inviteCode}
                        <button 
                          onClick={() => handleCopyCode(batch.inviteCode)}
                          className="text-muted-foreground hover:text-emerald-500 transition-colors ml-1"
                          title="Copy Invite Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {batch.createdBy?.name || batch.createdBy?.email}
                      <div className="text-[10px] uppercase mt-0.5">{new Date(batch.createdAt).toLocaleDateString('en-GB')}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/campus/batches/${batch._id}`}
                          className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                          title="View Students"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(batch._id, batch.name)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" 
                          title="Delete Batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
