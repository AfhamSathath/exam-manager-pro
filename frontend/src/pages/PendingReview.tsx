// frontend/src/pages/PendingReview.tsx
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";

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
    if (!user?.id || !token) return;

    const fetchPendingPapers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/papers/pending-review/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setPendingPapers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch papers");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPapers();
  }, [user, token]);

  if (!user) return <DashboardLayout><div className="text-center py-12">Loading user info...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending Review</h1>
          <p className="text-muted-foreground mt-1">Papers awaiting your moderation</p>
        </div>

        {loading && <Card><CardContent className="text-center py-12">Loading pending papers...</CardContent></Card>}
        {error && <Card><CardContent className="text-center py-12"><p className="text-red-500">{error}</p></CardContent></Card>}
        {!loading && !error && pendingPapers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success/50" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No papers pending review</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && pendingPapers.length > 0 && (
          <div className="grid gap-4">
            {pendingPapers.map(paper => (
              <Link key={paper._id} to={`/dashboard/review/${paper._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{paper.courseCode} - {paper.courseName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{paper.year} • {paper.semester} • {paper.paperType === "exam" ? "Examination" : "Assessment"}</p>
                        <p className="text-sm text-muted-foreground">Submitted by {paper.lecturerName}</p>
                        <div className="mt-3"><StatusBadge status={paper.status} /></div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(paper.createdAt).toLocaleDateString()}</span>
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
