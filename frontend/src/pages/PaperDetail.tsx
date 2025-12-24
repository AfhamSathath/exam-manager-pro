import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Download, ExternalLink } from "lucide-react";

interface Paper {
  _id: string;
  courseCode: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: string;
  status: string;
  pdfUrl: string;
}

const PaperDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) return;

    const fetchPaper = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/papers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Paper not found");

        const data = await res.json();
        setPaper(data);
      } catch (err) {
        console.error(err);
        setPaper(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPaper();
  }, [id, token]);

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

  // ✅ Encode the URL to handle spaces and special characters
  const pdfUrl = `${import.meta.env.VITE_API_URL}${encodeURI(paper.pdfUrl)}`;

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
            {paper.year} • {paper.semester} • {paper.paperType}
          </p>
        </div>

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

        <iframe
          src={pdfUrl}
          className="w-full h-[650px] border rounded"
          title="PDF Preview"
        />
      </div>
    </DashboardLayout>
  );
};

export default PaperDetail;
