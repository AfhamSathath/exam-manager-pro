// frontend/src/pages/PaperDetail.tsx
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
  lecturerId: string;
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
  const { user, token } = useAuth();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const FILE_URL = API_URL.replace('/api', '');

  // Fetch single paper
  useEffect(() => {
    if (!id || !token) return;

    const fetchPaper = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/papers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaper(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch paper");
        setPaper(null);
      } finally {
        setLoading(false);
      }
    };

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
          <h2 className="text-xl font-semibold">Paper not found</h2>
          <Button variant="link" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const normalizedPdfUrl = paper.pdfUrl.startsWith('E:') ? paper.pdfUrl.replace('E:/exam-manager-pro-main-main/backend', '') : paper.pdfUrl;
  const pdfUrl = `${FILE_URL}${encodeURI(normalizedPdfUrl)}`;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{paper.courseCode}</h1>
            <StatusBadge status={paper.status} />
          </div>
          <p className="text-muted-foreground">{paper.courseName}</p>
          <p className="text-sm text-muted-foreground">
            {paper.year} • {paper.semester} • {paper.paperType === "exam" ? "Exam" : "Assessment"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Version {paper.currentVersion}
          </p>
        </div>

        {/* PDF Actions */}
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open PDF
            </a>
          </Button>

          <Button asChild>
            <a href={pdfUrl} download>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>

        {/* PDF Preview */}
        <iframe
          src={pdfUrl}
          className="w-full h-[650px] border rounded"
          title="PDF Preview"
        />

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

       
        
      </div>
    </DashboardLayout>
  );
};

export default PaperDetail;
