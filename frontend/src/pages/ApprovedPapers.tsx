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
  status: string; // approved or printed
  lecturerName?: string;
  examinerName?: string;
  updatedAt: string;
}

const ApprovedPapers = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovedPapers = async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch approved papers
      const res = await axios.get<Paper[]>(
        `${import.meta.env.VITE_API_URL}/papers/hod/approved`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let combinedPapers = res.data;

      // Placeholder: if backend adds /hod/printed, merge here
      // const printedRes = await axios.get<Paper[]>(`${import.meta.env.VITE_API_URL}/papers/hod/printed`, { headers: { Authorization: `Bearer ${token}` } });
      // combinedPapers = [...combinedPapers, ...printedRes.data];

      // Sort by updatedAt descending
      combinedPapers.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setPapers(combinedPapers);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load approved papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedPapers();
  }, [user, token]);

  // Map status to badge color
  const getBadgeStatus = (status: string) => {
    if (status === "approved") return "success";
    if (status === "printed") return "info";
    return "default";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Approved Papers</h1>
            <p className="text-muted-foreground mt-1">
              Papers approved by HOD
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
            <CardContent className="py-10 text-center text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Empty State */}
        {papers.length === 0 && !error ? (
          <Card>
            <CardContent className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No approved papers</h3>
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
                          Lecturer: {paper.lecturerName || "N/A"} | Examiner: {paper.examinerName || "N/A"}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <StatusBadge status={getBadgeStatus(paper.status)} />
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
