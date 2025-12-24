import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
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
  status: "approved" | "rejected";
  lecturerName: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const ModeratedPapers = () => {
  const { user, token } = useAuth();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------
  // Fetch ALL moderated papers
  // -----------------------------
  const fetchModeratedPapers = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        `${API_URL}/papers/moderated`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.papers || [];

      setPapers(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load moderated papers");
    } finally {
      setLoading(false);
    }
  };

  // Wait for auth
  useEffect(() => {
    if (!user || !token) return;
    fetchModeratedPapers();
  }, [user, token]);

  // -----------------------------
  // AUTH LOADING
  // -----------------------------
  if (!user || !token) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">
            Moderated Papers
          </h1>
          <p className="text-muted-foreground">
            All approved and rejected papers
          </p>
        </div>

        {/* ---------------- LOADING ---------------- */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ---------------- ERROR ---------------- */}
        {!loading && error && (
          <Card className="border-destructive">
            <CardContent className="py-10 text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* ---------------- EMPTY ---------------- */}
        {!loading && !error && papers.length === 0 && (
          <Card>
            <CardContent className="py-20 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success" />
              <p className="text-muted-foreground">
                No moderated papers found
              </p>
            </CardContent>
          </Card>
        )}

        {/* ---------------- LIST ---------------- */}
        {!loading && !error && papers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {papers.map((p) => {
              const borderColor =
                p.status === "approved"
                  ? "border-l-success"
                  : "border-l-destructive";

              return (
                <Link
                  key={p._id}
                  to={`/dashboard/review/${p._id}`}
                >
                  <Card
                    className={`hover:shadow-md transition border-l-4 ${borderColor}`}
                  >
                    <CardContent className="p-6 flex justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>

                        <div>
                          <h3 className="font-semibold">
                            {p.courseCode} – {p.courseName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {p.year} • {p.semester} • {p.paperType}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Lecturer:{" "}
                            <span className="font-medium">
                              {p.lecturerName}
                            </span>
                          </p>

                          <div className="mt-3">
                            <StatusBadge status={p.status} />
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ModeratedPapers;
