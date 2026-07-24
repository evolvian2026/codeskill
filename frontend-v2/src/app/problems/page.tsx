"use client";

import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { Search, Filter, Play, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { problemsAPI } from "@/config/api";

export default function ProblemsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    problemsAPI.getAll(currentPage, ITEMS_PER_PAGE, debouncedSearch, activeCategory).then(res => {
      setProblems(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalItems(res.data?.total || 0);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [currentPage, debouncedSearch, activeCategory]);

  const categories = ["All Topics", "Arrays", "Strings", "Dynamic Programming", "Trees", "Graphs", "Math"];

  const filtered = problems;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background w-full pt-24 pb-12 px-6 flex flex-col font-sans text-foreground">
      <div className="max-w-[1600px] mx-auto flex-1 flex flex-col w-full h-full">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full space-y-8 flex-1 flex flex-col">
        
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Problems</h1>
            <p className="text-muted-foreground">Master algorithms and data structures with our curated list.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search problems..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-transparent border-border text-foreground rounded-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground shadow-sm"
              />
            </div>
            <Button variant="outline" className="h-10 rounded-md bg-transparent border-border text-foreground hover:bg-muted shadow-sm font-medium">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              Filters
            </Button>
          </div>
        </motion.div>

        {/* Category Chips */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Table & Pagination Container */}
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-muted/30 backdrop-blur z-10 shadow-sm border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-muted-foreground w-16 text-center">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Title</th>
                  <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Difficulty</th>
                  <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Category</th>
                  <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-right">Acceptance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-foreground" />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No problems found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((problem) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        key={problem._id} 
                        className="group hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-center">
                          {problem.status === "solved" && <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />}
                          {problem.status === "attempted" && <Circle className="w-5 h-5 text-amber-500 mx-auto" />}
                          {(!problem.status || problem.status === "unsolved") && <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 mx-auto group-hover:border-foreground/50 transition-colors" />}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/problems/${problem.slug}`} className="font-semibold text-foreground group-hover:underline transition-colors flex items-center gap-2">
                            {problem.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                            {problem.categories && problem.categories.length > 0 ? problem.categories[0] : 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium">{problem.stats?.acceptanceRate || 0}%</span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Sticky Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-card sticky bottom-0 z-10 w-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              <div className="text-sm text-muted-foreground whitespace-nowrap text-center lg:text-left w-full lg:w-auto">
                Showing <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-medium text-foreground">{totalItems}</span> questions
              </div>
              
              <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-1 scrollbar-hide">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="shrink-0 bg-transparent border-border"
                >
                  Previous
                </Button>
                
                <div className="flex gap-1 items-center">
                  {getPageNumbers().map((pageNum, i) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={`${pageNum}-${i}`}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={`shrink-0 ${currentPage === pageNum ? "bg-foreground text-background hover:bg-foreground/90" : "bg-transparent border-border text-foreground hover:bg-muted"}`}
                        onClick={() => setCurrentPage(pageNum as number)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    )
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="shrink-0 bg-transparent border-border"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>

      </motion.div>
      </div>
    </div>
  );
}
