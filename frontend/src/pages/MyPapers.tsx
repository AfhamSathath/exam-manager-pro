// frontend/src/pages/MyPapers.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

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
  moderationComments?: ModerationComment[]; // optional
}

const MyPapers = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    const fetchPapers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/papers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPapers(data.filter((p: Paper) => String(p.lecturerId) === String(user.id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
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

                    {/* Moderation / Reviewer Comments */}
                    {paper.moderationComments && paper.moderationComments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground">
                          Reviewer Comments:
                        </p>
                        {paper.moderationComments.map((c, idx) => (
                          <p key={idx} className="text-xs text-muted-foreground">
                            <span className="font-medium">{c.commentByName}:</span>{" "}
                            {c.comment}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link to={`/dashboard/papers/${paper._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                  </Link>
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
