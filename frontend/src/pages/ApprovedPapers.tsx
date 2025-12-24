import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Archive, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import axios from "axios";

interface Paper {
  _id: string;
  courseCode: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: "exam" | "assessment";
  status: string;
  lecturerName: string;
  examinerName?: string;
  updatedAt: string;
}

const ApprovedPapers = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovedPapers = async () => {
    if (!user || !token) {
      console.warn("User or token missing. Cannot fetch approved papers.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching approved papers from API...");
      const response = await axios.get<Paper[]>(
        `${import.meta.env.VITE_API_URL}/papers/hod/approved`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("API response:", response.data);
      setPapers(response.data);
    } catch (err: any) {
      console.error("Error fetching approved papers:", err);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
        setError(`Error ${err.response.status}: ${err.response.data?.message || "Failed to load approved papers"}`);
      } else {
        setError(err.message || "Failed to load approved papers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedPapers();
  }, [user, token]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <FileText className="w-10 h-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Approved Papers</h1>
            <p className="text-muted-foreground mt-1">
              Papers approved by HOD and ready for print or archive
            </p>
          </div>
          <button
            onClick={fetchApprovedPapers}
            className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded hover:bg-primary/90"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="py-10 text-center">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {papers.length === 0 && !error ? (
          <Card>
            <CardContent className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No approved papers yet</h3>
              <p className="text-muted-foreground">Approved papers will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {papers.map((paper) => (
              <Link key={paper._id} to={`/dashboard/approval/${paper._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 flex justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-success" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg">
                          {paper.courseCode} - {paper.courseName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {paper.year} • {paper.semester} •{" "}
                          {paper.paperType === "exam" ? "Examination" : "Assessment"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Lecturer: {paper.lecturerName} | Examiner: {paper.examinerName || "N/A"}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <StatusBadge status={paper.status} />
                        </div>
                      </div>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {new Date(paper.updatedAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApprovedPapers;
