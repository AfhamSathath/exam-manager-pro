// frontend/src/pages/ExaminerDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

const API_URL = import.meta.env.VITE_API_URL + "/papers";
const FILE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

interface Paper {
  _id: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: string;
  pdfUrl: string;
  status: string;
  moderationComments?: { commentByName: string; comment: string; date?: string }[];
}

const ExaminerDashboard = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  // Fetch papers pending moderation
  const fetchPapers = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pending = res.data.filter((p: Paper) => p.status === "pending_moderation");
      setPapers(pending);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [user, token]);

  // Examiner: Request revision
  const requestRevision = async (id: string) => {
    try {
      await axios.patch(
        `${API_URL}/${id}/revision`,
        { comment: comments[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPapers(prev => prev.filter(p => p._id !== id));
      setComments(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      alert("Revision requested successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to request revision");
    }
  };

  // Examiner: Approve paper (send to HOD)
  const approvePaper = async (id: string) => {
    try {
      await axios.patch(
        `${API_URL}/${id}/approve/examiner`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPapers(prev => prev.filter(p => p._id !== id));
      alert("Paper approved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to approve paper");
    }
  };

  const viewPdf = (url: string) => {
    if (!url) return alert("PDF not available");
    let fullUrl;
    if (url.startsWith('http')) {
      fullUrl = url;
    } else if (url.startsWith('/')) {
      fullUrl = `${FILE_URL}${url}`;
    } else {
      // Assume full path starting with E:
      const normalizedUrl = url.replace('E:/exam-manager-pro-main-main/backend', '');
      fullUrl = `${FILE_URL}${normalizedUrl}`;
    }
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-800">Examiner Dashboard</h1>

      {loading ? (
        <p>Loading papers...</p>
      ) : papers.length === 0 ? (
        <p className="text-muted-foreground">No papers pending moderation</p>
      ) : (
        <div className="grid gap-4">
          {papers.map(paper => (
            <Card key={paper._id} className="shadow-sm">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-xl">{paper.courseName}</CardTitle>
                <StatusBadge status={paper.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {paper.year} • {paper.semester} • {paper.paperType}
                </p>

                {paper.moderationComments?.length > 0 && (
                  <div className="text-sm text-yellow-800 space-y-1">
                    {paper.moderationComments.map((c, i) => (
                      <p key={i}>
                        <strong>{c.commentByName}:</strong> {c.comment}
                      </p>
                    ))}
                  </div>
                )}

                <input
                  className="border rounded p-1 w-full text-sm"
                  placeholder="Add suggestion/comment"
                  value={comments[paper._id] || ""}
                  onChange={e =>
                    setComments(prev => ({ ...prev, [paper._id]: e.target.value }))
                  }
                />

                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => viewPdf(paper.pdfUrl)}>
                    View PDF
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => requestRevision(paper._id)}
                    disabled={!comments[paper._id]}
                  >
                    Request Revision
                  </Button>

                  <Button size="sm" className="bg-slate-900 text-white" onClick={() => approvePaper(paper._id)}>
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExaminerDashboard;
