// frontend/src/components/dashboards/LecturerDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL + "/papers";
const FILE_URL = API_URL.replace('/api', '');

interface ModerationComment {
  commentByName: string;
  comment: string;
  date: string;
}

interface Paper {
  _id: string;
  lecturerId: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: string;
  pdfUrl: string;
  status: string;
  moderationComments?: ModerationComment[];
  createdAt: string;
}

const LecturerDashboard = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // -----------------------------
  // Fetch papers
  // -----------------------------
  const fetchPapers = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lecturerPapers = res.data;
      lecturerPapers.sort(
        (a: Paper, b: Paper) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPapers(lecturerPapers);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch papers");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Socket.IO setup
  // -----------------------------
  useEffect(() => {
    if (!user || !token) return;

    const socketClient: Socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      auth: { token },
    });
    setSocket(socketClient);

    socketClient.on("paperUpdated", (updatedPaper: Paper) => {
      setPapers((prev) => {
        const exists = prev.find((p) => p._id === updatedPaper._id);
        if (exists) {
          return prev.map((p) => (p._id === updatedPaper._id ? updatedPaper : p));
        } else {
          return [updatedPaper, ...prev];
        }
      });
    });

    socketClient.on("paperDeleted", (id: string) => {
      setPapers((prev) => prev.filter((p) => p._id !== id));
    });

    return () => {
      socketClient.disconnect();
    };
  }, [user, token]);

  useEffect(() => {
    fetchPapers();
  }, [user, token]);

  // -----------------------------
  // Submit draft/revision
  // -----------------------------
  const handleSubmit = async (paperId: string) => {
    try {
      const res = await axios.patch(
        `${API_URL}/${paperId}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Paper submitted successfully");
      // Update locally
      setPapers((prev) =>
        prev.map((p) => (p._id === paperId ? res.data.paper : p))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit paper");
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

  const pendingStatuses = ["draft", "revision_required"];
  const inProgressStatuses = ["pending_moderation"];
  const completedStatuses = ["pending_approval", "approved", "printed"];
  const revisionRequiredPapers = papers.filter((p) => p.status === "revision_required");

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.fullName}</h1>
          <p className="text-muted-foreground mt-1">Manage your examination papers</p>
        </div>
        <Link to="/dashboard/create-paper">
          <Button>
            <FileText className="w-4 h-4 mr-2" /> Create Paper
          </Button>
        </Link>
      </div>

      {/* Paper Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Papers</CardTitle>
            <FileText className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{papers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Action</CardTitle>
            <Clock className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {papers.filter((p) => pendingStatuses.includes(p.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle>
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {papers.filter((p) => inProgressStatuses.includes(p.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {papers.filter((p) => completedStatuses.includes(p.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===========================================
          REVISION WORKFLOW:
          1. Examiner reviews paper and requests revision with comments
          2. Paper status changes to "revision_required"
          3. Lecturer sees paper in "Revision Required" section
          4. Lecturer clicks "Revise Paper" -> navigates to CreatePaper with revisionId
          5. CreatePaper form shows only PDF upload (other details preserved)
          6. Lecturer uploads new PDF, form submits to updatePaper endpoint
          7. Backend keeps existing metadata, updates PDF URL, resets status to "pending_moderation"
          8. Paper goes back to examiner for re-moderation
          =========================================== */}

      {/* Revision Required Section */}
      {revisionRequiredPapers.length > 0 && (
        <Card className="border-red-400">
          <CardHeader>
            <CardTitle className="text-red-700">Revision Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revisionRequiredPapers.map((paper) => (
              <div
                key={paper._id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-red-50 transition"
              >
                <div>
                  <p className="font-medium">{paper.courseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {paper.year} • {paper.semester} • {paper.paperType}
                  </p>

                  {/* Moderation Comments */}
                  {paper.moderationComments?.length ? (
                    <div className="text-sm text-yellow-800 mt-1 space-y-1">
                      {paper.moderationComments.map((c, i) => (
                        <p key={i}>
                          <strong>{c.commentByName}:</strong> {c.comment}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No comments yet</p>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0">
                  <Button size="sm" variant="outline" onClick={() => viewPdf(paper.pdfUrl)}>
                    View PDF
                  </Button>

                  <Link to={`/dashboard/create-paper?revisionId=${paper._id}`}>
                    <Button size="sm">Revise Paper</Button>
                  </Link>

                  <StatusBadge status={paper.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Other Papers */}
      <Card>
        <CardHeader>
          <CardTitle>All Papers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {papers
            .filter((p) => p.status !== "revision_required")
            .map((paper) => (
              <div
                key={paper._id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-muted/40 transition"
              >
                <div>
                  <p className="font-medium">{paper.courseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {paper.year} • {paper.semester} • {paper.paperType}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0">
                  <Link to={`/dashboard/papers/${paper._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                  </Link>

                  {pendingStatuses.includes(paper.status) && (
                    <Button size="sm" onClick={() => handleSubmit(paper._id)}>
                      {paper.status === "draft" ? "Submit" : "Resubmit"}
                    </Button>
                  )}

                  <StatusBadge status={paper.status} />
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LecturerDashboard;



