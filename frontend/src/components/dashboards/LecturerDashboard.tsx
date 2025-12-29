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

/**
 * ENV:
 * VITE_API_URL = http://localhost:5001/api
 */
const API_URL = `${import.meta.env.VITE_API_URL}/papers`;
const FILE_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api$/, "");

interface ModerationComment {
  commentByName: string;
  comment: string;
  createdAt: string;
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

      const sorted = [...res.data].sort(
        (a: Paper, b: Paper) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPapers(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch papers");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Socket.IO
  // -----------------------------
  // -----------------------------
// Socket.IO (TS FIXED)
// -----------------------------
useEffect(() => {
  if (!user || !token) return;

  const socket = io(FILE_BASE_URL, {
    auth: { token },
  });

  socket.on("paperUpdated", (updatedPaper: Paper) => {
    setPapers((prev) => {
      const exists = prev.find((p) => p._id === updatedPaper._id);
      return exists
        ? prev.map((p) =>
            p._id === updatedPaper._id ? updatedPaper : p
          )
        : [updatedPaper, ...prev];
    });
  });

  socket.on("paperDeleted", (id: string) => {
    setPapers((prev) => prev.filter((p) => p._id !== id));
  });

  // ✅ MUST return a function (not the socket)
  return () => {
    socket.disconnect();
  };
}, [user, token]);


  useEffect(() => {
    fetchPapers();
  }, [user, token]);

  // -----------------------------
  // Submit paper
  // -----------------------------
  const handleSubmit = async (paperId: string) => {
    try {
      const res = await axios.patch(
        `${API_URL}/${paperId}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Paper submitted successfully");
      setPapers((prev) =>
        prev.map((p) => (p._id === paperId ? res.data.paper : p))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit paper");
    }
  };

  // -----------------------------
  // View PDF (🔥 FULLY FIXED 🔥)
  // -----------------------------
  const viewPdf = (pdfUrl: string) => {
    if (!pdfUrl) {
      toast.error("PDF not available");
      return;
    }

    let normalizedUrl = pdfUrl.replace(/\\/g, "/");

    
    if (!normalizedUrl.startsWith("/")) {
      const idx = normalizedUrl.indexOf("/uploads/");
      if (idx === -1) {
        toast.error("Invalid PDF path stored");
        return;
      }
      normalizedUrl = normalizedUrl.substring(idx);
    }

    window.open(`${FILE_BASE_URL}${normalizedUrl}`, "_blank");
  };

  const pendingStatuses = ["draft", "revision_required"];
  const inProgressStatuses = ["pending_moderation"];
  const completedStatuses = ["pending_approval", "approved", "printed"];
  const revisionRequiredPapers = papers.filter(
    (p) => p.status === "revision_required"
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-muted-foreground">
            Manage your examination papers
          </p>
        </div>

        <Link to="/dashboard/create-paper">
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Create Paper
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Papers" value={papers.length} icon={<FileText />} />
        <StatCard
          title="Pending Action"
          value={papers.filter((p) => pendingStatuses.includes(p.status)).length}
          icon={<Clock />}
        />
        <StatCard
          title="In Progress"
          value={papers.filter((p) => inProgressStatuses.includes(p.status)).length}
          icon={<AlertCircle />}
        />
        <StatCard
          title="Completed"
          value={papers.filter((p) => completedStatuses.includes(p.status)).length}
          icon={<CheckCircle />}
        />
      </div>

      {/* Revision Required */}
      {revisionRequiredPapers.length > 0 && (
        <Card className="border-red-400">
          <CardHeader>
            <CardTitle className="text-red-700">
              Revision Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revisionRequiredPapers.map((paper) => (
              <div
                key={paper._id}
                className="flex flex-col md:flex-row justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{paper.courseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {paper.year} • {paper.semester} • {paper.paperType}
                  </p>

                  {paper.moderationComments?.map((c, i) => (
                    <p key={i} className="text-sm text-yellow-800">
                      <strong>{c.commentByName}:</strong> {c.comment}
                    </p>
                  ))}
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewPdf(paper.pdfUrl)}
                  >
                    View PDF
                  </Button>

                  <Link to={`/dashboard/create-paper?revisionId=${paper._id}`}>
                    <Button size="sm">Revise</Button>
                  </Link>

                  <StatusBadge status={paper.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Papers */}
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
                className="flex justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{paper.courseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {paper.year} • {paper.semester} • {paper.paperType}
                  </p>
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewPdf(paper.pdfUrl)}
                  >
                    View PDF
                  </Button>
                  

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

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex justify-between items-center pb-2">
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default LecturerDashboard;
