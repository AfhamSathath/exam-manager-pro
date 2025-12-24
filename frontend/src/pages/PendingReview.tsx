// frontend/src/pages/PendingReview.tsx
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import axios from "axios";

interface Paper {
  _id: string;
  year: string;
  semester: string;
  courseCode: string;
  courseName: string;
  paperType: "exam" | "assessment";
  status: string;
  lecturerName: string;
  createdAt: string;
}

const PendingReview = () => {
  const { user, token } = useAuth();
  const [pendingPapers, setPendingPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we don't have a token yet, don't attempt the fetch
    if (!token) {
        console.warn("No token found, waiting for authentication...");
        return;
    }

    const fetchPendingPapers = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        console.log(`Fetching from: ${apiUrl}/papers`);

        const res = await axios.get(
          `${apiUrl}/papers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Debugging: See exactly what the backend is sending
        console.log("Backend Response:", res.data);

        // Ensure data is an array before filtering
        const rawData = Array.isArray(res.data) ? res.data : (res.data.papers || []);
        
        // Filter papers that are pending moderation
        // Note: Check your backend to ensure the string is exactly "pending_moderation"
        const pending = rawData.filter(
          (p: Paper) => p.status === "pending_moderation"
        );
        
        setPendingPapers(pending);
      } catch (err: any) {
        console.error("Fetch error details:", err.response || err);
        setError(err.response?.data?.message || err.message || "Failed to fetch papers");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPapers();
  }, [user, token]);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           <p className="mt-4 text-muted-foreground">Verifying session...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending Review</h1>
          <p className="text-muted-foreground mt-1">Papers awaiting your moderation</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground font-medium">Loading pending papers...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/50">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive">Connection Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm"
              >
                Retry Connection
              </button>
            </CardContent>
          </Card>
        ) : pendingPapers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success/50" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No papers currently require your moderation.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingPapers.map((paper) => (
              <Link key={paper._id} to={`/dashboard/review/${paper._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-warning">
                  <CardContent className="p-6 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {paper.courseCode} - {paper.courseName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {paper.year} • {paper.semester} •{" "}
                          <span className="capitalize">{paper.paperType}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Submitted by <span className="font-medium">{paper.lecturerName}</span>
                        </p>
                        <div className="mt-3">
                          <StatusBadge status={paper.status} />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {new Date(paper.createdAt).toLocaleDateString()}
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

export default PendingReview;