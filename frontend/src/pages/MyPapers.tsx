// frontend/src/pages/MyPapers.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ExternalLink, Download } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { io, type Socket } from "socket.io-client";

interface ModerationComment {
  commentByName: string;
  comment: string;
  createdAt?: string;
}

interface Paper {
  lecturerId: string;
  _id: string;
  year: string;
  semester: string;
  courseCode: string;
  courseName: string;
  paperType: "exam" | "assessment";
  status: string;
  currentVersion: number;
  signatures?: any[];
  moderationComments?: ModerationComment[];
  pdfUrl?: string;
}

const MyPapers = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const FILE_BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

  // Normalize PDF URL
  const getPdfUrl = (pdfUrl: string) => {
    if (!pdfUrl) return "";
    let url = pdfUrl.replace(/\\/g, "/");
    if (url.startsWith("E:/") || url.startsWith("e:/")) {
      const idx = url.indexOf("/uploads/");
      url = idx !== -1 ? url.substring(idx) : url;
    }
    if (!url.startsWith("http")) url = `${FILE_BASE_URL}${url}`;
    return encodeURI(url);
  };

  const openPdf = (pdfUrl: string) => {
    const url = getPdfUrl(pdfUrl);
    if (!url) return alert("PDF not available");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadPdf = (pdfUrl: string) => {
    const url = getPdfUrl(pdfUrl);
    if (!url) return alert("PDF not available");
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "paper.pdf";
    link.click();
  };

  // Fetch papers
  useEffect(() => {
    if (!user || !token) return;
    const fetchPapers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/papers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPapers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPapers();
  }, [user, token]);

  // Socket.IO setup
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
  
  
  if (!user)
    return (
      <DashboardLayout>
        <p>Loading user...</p>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Papers</h1>

        {loading ? (
          <p className="text-center py-6">Loading papers...</p>
        ) : papers.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">No papers yet.</p>
        ) : (
          <div className="grid gap-4">
            {papers.map((paper) => (
              <Card key={paper._id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">
                      {paper.courseCode} - {paper.courseName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {paper.year} • {paper.semester} •{" "}
                      {paper.paperType === "exam" ? "Examination" : "Assessment"}
                    </p>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <StatusBadge status={paper.status} />
                      <span className="text-xs text-muted-foreground">
                        Version {paper.currentVersion}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {paper.signatures?.length ?? 0} signatures
                      </span>
                    </div>

                    {paper.moderationComments && paper.moderationComments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground">
                          Reviewer Comments:
                        </p>
                        {paper.moderationComments.map((c, idx) => (
                          <p key={idx} className="text-xs text-muted-foreground">
                            <span className="font-medium">{c.commentByName}:</span> {c.comment}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link to={`/dashboard/papers/${paper._id}`}>
                      
                    </Link>

                    {paper.pdfUrl && (
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" variant="outline" onClick={() => openPdf(paper.pdfUrl!)}>
                          <ExternalLink className="w-4 h-4 mr-2" /> Open PDF
                        </Button>
                        <Button size="sm" onClick={() => downloadPdf(paper.pdfUrl!)}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyPapers;
