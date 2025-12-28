// frontend/src/pages/HODDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

const API_URL = import.meta.env.VITE_API_URL + "/papers";
const FILE_URL = import.meta.env.VITE_API_URL?.replace("/api", "");

interface Paper {
  _id: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: string;
  pdfUrl: string;
  status: string;
  lecturerName?: string;
  examinerName?: string;
  moderationComments?: { commentByName: string; comment: string }[];
}

const HODDashboard = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial papers
  const fetchPapers = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/pending-approvals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPapers(res.data);
    } catch (err: any) {
      console.error("Error fetching papers:", err);
      alert(err.response?.data?.message || "Failed to fetch papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [user, token]);

  // Connect to Socket.IO
  useEffect(() => {
  const socket = io(import.meta.env.VITE_API_URL!.replace("/api", ""));

  socket.on("connect", () => console.log("Connected to socket server:", socket.id));

  socket.on("paperUpdated", (updatedPaper: Paper) => {
    setPapers(prev => {
      if (updatedPaper.status === "printed") {
        return prev.filter(p => p._id !== updatedPaper._id);
      }
      const exists = prev.find(p => p._id === updatedPaper._id);
      if (exists) {
        return prev.map(p => (p._id === updatedPaper._id ? updatedPaper : p));
      }
      return [...prev, updatedPaper];
    });
  });

  return () => {
    socket.disconnect(); // ✅ Wrapped in a void function
  };
}, []);


  // Approve paper
  const approvePaper = async (id: string) => {
    if (!token) {
      alert("Authentication required");
      return;
    }
    try {
      const res = await axios.patch(
        `${API_URL}/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPapers(prev =>
        prev.map(p => (p._id === id ? { ...p, status: res.data.paper.status } : p))
      );
      alert("Paper approved successfully");
    } catch (err: any) {
      console.error("Error approving paper:", err);
      alert(err.response?.data?.message || "Failed to approve paper");
    }
  };

  // Mark paper as printed
  const printPaper = async (id: string) => {
    if (!token) {
      alert("Authentication required");
      return;
    }
    try {
      await axios.patch(
        `${API_URL}/${id}/print`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Paper removal is handled via Socket.IO
      alert("Paper marked as printed");
    } catch (err: any) {
      console.error("Error marking paper as printed:", err);
      alert(err.response?.data?.message || "Failed to mark as printed");
    }
  };

  // View PDF
  const viewPdf = (url: string) => {
    if (!url) {
      alert("PDF not available");
      return;
    }

    let fullUrl = url;
    if (url.startsWith("http")) fullUrl = url;
    else if (url.startsWith("/")) fullUrl = FILE_URL + url;
    else if (FILE_URL) fullUrl = `${FILE_URL}${url.replace(/^.*backend[\\/]/, "/")}`;
    else fullUrl = import.meta.env.VITE_API_URL?.replace("/api", "") + url;

    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  // Show only pending or approved papers
  const filteredPapers = papers.filter(
    paper => paper.status === "pending_approval" || paper.status === "approved"
  );

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
      ) : filteredPapers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No papers pending approval or printing</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPapers.map(paper => (
            <Card key={paper._id} className="overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{paper.courseName}</CardTitle>
                  <StatusBadge status={paper.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Lecturer:</strong> {paper.lecturerName || "N/A"}</p>
                  <p><strong>Examiner:</strong> {paper.examinerName || "N/A"}</p>
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
                    {paper.status === "pending_approval" && (
                      <Button className="flex-1" size="sm" onClick={() => approvePaper(paper._id)}>
                        Approve
                      </Button>
                    )}
                    {paper.status === "approved" && (
                      <Button
                        className="flex-1"
                        size="sm"
                        variant="secondary"
                        onClick={() => printPaper(paper._id)}
                      >
                        Mark Printed
                      </Button>
                    )}
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
