"use client";

import { useEffect, useState } from "react";
import { adminProblemsAPI } from "@/config/api";
import Link from "next/link";
import { Plus, Search, MoreVertical, Edit2, Trash2, Eye } from "lucide-react";

export default function QuestionsAdminPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const res = await adminProblemsAPI.getAll();
      setProblems(res.data.problems || []);
    } catch (err) {
      console.error("Failed to fetch problems", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (problem: any) => {
    const isCurrentlyPublished = problem.visibility === "Published" || Boolean(problem.isPublished);
    const newVisibility = isCurrentlyPublished ? "Draft" : "Published";
    try {
      await adminProblemsAPI.update(problem._id, {
        publishing: { visibility: newVisibility, publishImmediately: newVisibility === "Published" },
        metadata: { visibility: newVisibility }
      });
      fetchProblems();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this problem?")) {
      try {
        await adminProblemsAPI.delete(id);
        fetchProblems();
      } catch (err) {
        console.error("Failed to delete problem", err);
      }
    }
  };

  const filteredProblems = problems.filter((p) => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 font-sans max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage coding problems, test cases, and editorials.</p>
        </div>
        <Link 
          href="/admin/questions/create" 
          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-red-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Question
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search questions by title or slug..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-foreground transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {filteredProblems.length} {filteredProblems.length === 1 ? 'question' : 'questions'}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Difficulty</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading questions...</td>
                </tr>
              ) : filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-1">No questions found</p>
                      <p className="text-xs text-muted-foreground/70">Try adjusting your search criteria or create a new question.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProblems.map((problem) => (
                  <tr key={problem._id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{problem.title}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{problem.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        problem.difficulty === "Easy" ? "bg-green-500/10 text-green-500" :
                        problem.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const isPublished = problem.visibility === "Published" || Boolean(problem.isPublished);
                        return (
                          <button 
                            type="button"
                            onClick={() => handleTogglePublish(problem)}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                            title="Click to toggle Published / Draft"
                          >
                            <div className={`w-2 h-2 rounded-full ${isPublished ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-amber-500/80'}`} />
                            <span className={`text-xs font-semibold ${isPublished ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {isPublished ? 'Published' : 'Draft'}
                            </span>
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(problem.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(problem)}
                          className="px-2 py-1 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
                          title="Toggle Publish / Draft"
                        >
                          {problem.visibility === "Published" || Boolean(problem.isPublished) ? 'Unpublish' : 'Publish'}
                        </button>
                        <Link 
                          href={`/problems/${problem.slug}`} 
                          target="_blank"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          title="View Problem"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          href={`/admin/questions/${problem._id}/edit`} 
                          className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(problem._id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete"
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
