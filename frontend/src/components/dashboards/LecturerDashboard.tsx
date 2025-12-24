// frontend/src/components/dashboards/LecturerDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const API_URL = import.meta.env.VITE_API_URL + "/papers";

interface Paper {
  _id: string;
  lecturerId: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: string;
  pdfUrl: string;
  status: string;
  moderationComments?: { commentByName: string; comment: string }[];
  createdAt: string;
}

const LecturerDashboard = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(false);

  // Fetch all lecturer papers
  const fetchPapers = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lecturerPapers = res.data.filter((p: Paper) => p.lecturerId === user.id);
      lecturerPapers.sort(
        (a: Paper, b: Paper) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPapers(lecturerPapers);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [user, token, refreshFlag]);

  // Submit draft/revision
  const handleSubmit = async (paperId: string) => {
    try {
      await axios.patch(`${API_URL}/${paperId}/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshFlag(prev => !prev);
    } catch (err) {
      console.error(err);
      alert("Failed to submit paper");
    }
  };

  // Open PDF
  const viewPdf = (url: string) => {
    if (!url) return alert("PDF not available");
    window.open(url, "_blank");
  };

  // Status categories
  const pendingStatuses = ["draft", "revision_required"];
  const inProgressStatuses = ["pending_moderation"];
  const completedStatuses = ["pending_approval", "approved", "printed"];

  // Papers needing revision
  const revisionRequiredPapers = papers.filter(p => p.status === "revision_required");

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
              {papers.filter(p => pendingStatuses.includes(p.status)).length}
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
              {papers.filter(p => inProgressStatuses.includes(p.status)).length}
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
              {papers.filter(p => completedStatuses.includes(p.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revision Required Section */}
      {revisionRequiredPapers.length > 0 && (
        <Card className="border-red-400">
          <CardHeader>
            <CardTitle className="text-red-700">Revision Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revisionRequiredPapers.map(paper => (
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
                  {paper.moderationComments?.length > 0 && (
                    <div className="text-sm text-yellow-800 mt-1 space-y-1">
                      {paper.moderationComments.map((c, i) => (
                        <p key={i}>
                          <strong>{c.commentByName}:</strong> {c.comment}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0">
                  <Button size="sm" variant="outline" onClick={() => viewPdf(paper.pdfUrl)}>
                    View PDF
                  </Button>

                  <Link
                    to={`/dashboard/create-paper?revisionId=${paper._id}`}
                  >
                    <Button size="sm">Create New Paper for Revision</Button>
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
            .filter(p => p.status !== "revision_required")
            .map(paper => (
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
