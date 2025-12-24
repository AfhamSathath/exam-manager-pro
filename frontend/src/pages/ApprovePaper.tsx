// frontend/src/pages/ApprovedPapers.tsx
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";

interface Paper {
  _id: string;
  courseCode: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: "exam" | "assessment";
  status: string;
  lecturerName: string;
  createdAt: string;
}

const ApprovedPapers = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !token) return;

    const fetchApproved = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/papers/approved/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setPapers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch papers");
      } finally {
        setLoading(false);
      }
    };

    fetchApproved();
  }, [user, token]);

  if (!user) return <DashboardLayout><div className="text-center py-12">Loading user info...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">Approved Papers</h1>
        {loading && <p className="text-muted-foreground py-6">Loading papers...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && papers.length === 0 && <p className="text-muted-foreground py-6">No approved papers.</p>}

        <div className="grid gap-4">
          {papers.map(p => (
            <Link key={p._id} to={`/dashboard/papers/${p._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{p.courseCode} - {p.courseName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{p.year} • {p.semester} • {p.paperType === "exam" ? "Examination" : "Assessment"}</p>
                      <p className="text-sm text-muted-foreground">Submitted by {p.lecturerName}</p>
                      <div className="mt-3"><StatusBadge status={p.status} /></div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApprovedPapers;
