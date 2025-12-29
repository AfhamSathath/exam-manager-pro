import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Download, ExternalLink, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast } from "sonner";

interface ModerationComment {
  commentByName: string;
  comment: string;
}

interface Paper {
  _id: string;
  lecturerId: string | { name: string; _id: string };
  examinerId?: string | { name: string; _id: string };
  courseCode: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: string;
  status: string;
  pdfUrl: string;
  moderationComments?: ModerationComment[];
  currentVersion: number;
}

const PaperDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const FILE_BASE_URL = API_URL.replace("/api", "");

  // Fetch paper by ID
  const fetchPaper = async () => {
    if (!id || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/papers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaper(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error("You do not have permission to view this paper");
      } else if (err.response?.status === 404) {
        toast.error("Paper not found");
      } else {
        toast.error("Failed to fetch paper");
      }
      setPaper(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaper();
  }, [id, token]);

  // Handle revision upload
  const handleRevisionUpload = async () => {
    if (!pdfFile || !paper) return toast.error("Select a PDF to upload");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("year", paper.year);
      formData.append("semester", paper.semester);
      formData.append("courseName", paper.courseName);
      formData.append("paperType", paper.paperType);

      const res = await axios.patch(`${API_URL}/papers/${paper._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setPaper(res.data);
      toast.success("Revision uploaded successfully!");
      setPdfFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getPdfUrl = (pdfUrl: string) => {
    if (!pdfUrl) return "";
    let url = pdfUrl.replace(/\\/g, "/"); // normalize slashes

    // Remove backend path if present
    if (url.startsWith("E:/") || url.startsWith("e:/")) {
      const idx = url.indexOf("/uploads/");
      url = idx !== -1 ? url.substring(idx) : url;
    }

    // Ensure full URL
    if (!url.startsWith("http")) url = `${FILE_BASE_URL}${url}`;
    return encodeURI(url);
  };

  const openPdf = (pdfUrl: string) => {
    const url = getPdfUrl(pdfUrl);
    if (!url) return toast.error("PDF not available");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadPdf = (pdfUrl: string) => {
    const url = getPdfUrl(pdfUrl);
    if (!url) return toast.error("PDF not available");
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "paper.pdf";
    link.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-center py-10">Loading paper...</p>
      </DashboardLayout>
    );
  }

  if (!paper) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold">Paper not found or access denied</h2>
          <Button variant="link" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const pdfUrl = getPdfUrl(paper.pdfUrl);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Paper Info */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{paper.courseCode}</h1>
            <StatusBadge status={paper.status} />
          </div>
          <p className="text-muted-foreground">{paper.courseName}</p>
          <p className="text-sm text-muted-foreground">
            Lecturer: {typeof paper.lecturerId === "object" ? paper.lecturerId.name : paper.lecturerId}
          </p>
          <p className="text-sm text-muted-foreground">
            {paper.year} • {paper.semester} • {paper.paperType === "exam" ? "Exam" : "Assessment"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Version {paper.currentVersion}</p>
        </div>

        {/* PDF Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => openPdf(pdfUrl)}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open PDF
          </Button>

          <Button onClick={() => downloadPdf(pdfUrl)}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        {/* PDF Preview */}
        <iframe src={pdfUrl} className="w-full h-[650px] border rounded" title="PDF Preview" />

        {/* Moderation Comments */}
        {paper.moderationComments && paper.moderationComments.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="font-semibold">Revision Requests:</h3>
            {paper.moderationComments.map((c, idx) => (
              <p key={idx} className="text-sm text-muted-foreground">
                <span className="font-medium">{c.commentByName}:</span> {c.comment}
              </p>
            ))}
          </div>
        )}

        {/* Upload Revision */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Upload Revision (PDF only)</h3>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />
          <Button
            className="mt-2"
            onClick={handleRevisionUpload}
            disabled={submitting || !pdfFile}
          >
            <Upload className="w-4 h-4 mr-2" />
            {submitting ? "Uploading..." : "Upload Revision"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaperDetail;
