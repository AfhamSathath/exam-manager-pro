// frontend/src/pages/HODDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

const API_URL = import.meta.env.VITE_API_URL + "/papers";

interface Paper {
  _id: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: string;
  pdfUrl: string;
  status: string;
  moderationComments?: { commentByName: string; comment: string }[];
}

const HODDashboard = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPapers = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for papers waiting for HOD approval
      const pending = res.data.filter((p: Paper) => p.status === "pending_approval");
      setPapers(pending);
    } catch (err) {
      console.error("Error fetching papers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [user, token]);

  const approvePaper = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/${id}/approve`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setPapers(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to approve paper");
    }
  };

  const printPaper = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/${id}/print`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setPapers(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to mark as printed");
    }
  };

  const viewPdf = (url: string) => {
    if (!url) return alert("PDF not available");
    window.open(url, "_blank");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">HOD Dashboard</h1>
        <p className="text-muted-foreground">Manage and approve departmental exam papers.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground animate-pulse">Loading papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No papers pending approval</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {papers.map((paper) => (
            <Card key={paper._id} className="overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{paper.courseName}</CardTitle>
                  <StatusBadge status={paper.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Year:</strong> {paper.year}</p>
                  <p><strong>Semester:</strong> {paper.semester}</p>
                  <p><strong>Type:</strong> {paper.paperType}</p>
                </div>

                {paper.moderationComments && paper.moderationComments.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
                    <p className="text-xs font-bold text-amber-800 mb-1">Moderator Comments:</p>
                    {paper.moderationComments.map((c, i) => (
                      <p key={i} className="text-xs text-amber-900 leading-relaxed">
                        <span className="font-medium">{c.commentByName}:</span> {c.comment}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => viewPdf(paper.pdfUrl)}>
                    View PDF
                  </Button>
                  <div className="flex gap-2">
                    <Button className="flex-1" size="sm" onClick={() => approvePaper(paper._id)}>
                      Approve
                    </Button>
                    <Button className="flex-1" size="sm" variant="secondary" onClick={() => printPaper(paper._id)}>
                      Mark Printed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HODDashboard;