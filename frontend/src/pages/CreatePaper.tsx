// frontend/src/pages/CreatePaper.tsx
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Send, Save, Calendar, BookOpen } from "lucide-react";
import axios from "axios";
import { COURSES, YEARS, SEMESTERS, Year, Semester, PaperType } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL + "/papers";

const CreatePaper = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const revisionId = searchParams.get("revisionId");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [papers, setPapers] = useState<any[]>([]);
  const [revisionPaper, setRevisionPaper] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    year: "" as Year,
    semester: "" as Semester,
    courseCode: "",
    paperType: "exam" as PaperType,
  });

  // Fetch all lecturer papers
  useEffect(() => {
    if (!user) return;
    const fetchPapers = async () => {
      try {
        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const lecturerPapers = res.data.filter((p: any) => p.lecturerId === user.id);
        setPapers(lecturerPapers);

        if (revisionId) {
          const revPaper = lecturerPapers.find((p) => p._id === revisionId);
          if (revPaper) {
            setRevisionPaper(revPaper);
            setFormData({
              year: revPaper.year,
              semester: revPaper.semester,
              courseCode: COURSES.find((c) => c.name === revPaper.courseName)?.code || "",
              paperType: revPaper.paperType,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch papers:", err);
      }
    };
    fetchPapers();
  }, [user, token, revisionId]);

  const filteredCourses = COURSES.filter(
    (c) =>
      c.department === user?.department &&
      c.year === formData.year &&
      c.semester === formData.semester
  );

  const selectedCourse = COURSES.find((c) => c.code === formData.courseCode);

  const validate = () => {
    if (!revisionPaper) {
      if (!formData.year || !formData.semester) {
        toast.error("Please select year and semester");
        return false;
      }
      if (!selectedCourse) {
        toast.error("Please select a course");
        return false;
      }
    }
    if (!pdfFile) {
      toast.error("Please upload a PDF file");
      return false;
    }
    if (!user) {
      toast.error("User not authenticated");
      return false;
    }
    return true;
  };

  const handleSubmit = async (status: "draft" | "pending_moderation") => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      if (revisionPaper) {
        payload.append("year", revisionPaper.year);
        payload.append("semester", revisionPaper.semester);
        payload.append("courseName", revisionPaper.courseName);
        payload.append("paperType", revisionPaper.paperType);
      } else {
        payload.append("year", formData.year);
        payload.append("semester", formData.semester);
        payload.append("courseName", selectedCourse!.name);
        payload.append("paperType", formData.paperType);
      }
      payload.append("pdf", pdfFile!);
      payload.append("status", status);
      payload.append("lecturerId", user!.id);

      let res;
      if (revisionPaper) {
        res = await axios.put(`${API_URL}/${revisionPaper._id}`, payload, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
        });
        toast.success("Revision uploaded successfully!");
      } else {
        res = await axios.post(API_URL, payload, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
        });
        toast.success(status === "draft" ? "Draft saved!" : "Submitted for review!");
      }

      // Update paper list immediately
      setPapers((prev) => [res.data, ...prev]);

      // Reset form
      setFormData({
        year: "" as Year,
        semester: "" as Semester,
        courseCode: "",
        paperType: "exam" as PaperType,
      });
      setPdfFile(null);
      setRevisionPaper(null);

      // Navigate or stay on dashboard
      navigate("/dashboard"); // or stay here if you prefer
    } catch (err: any) {
      console.error("CreatePaper Error:", err);
      toast.error(err.response?.data?.message || "Failed to upload paper");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {revisionPaper ? "Upload Revision PDF" : "Create Paper"}
            </CardTitle>
            <CardDescription>
              {revisionPaper
                ? "Upload new PDF for revision. Year, semester, course & type are preserved."
                : "Upload examination or assessment paper"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!revisionPaper && (
              <>
                {/* Year & Semester */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Academic Year</Label>
                    <Select
                      value={formData.year}
                      onValueChange={(value) =>
                        setFormData({ ...formData, year: value as Year, courseCode: "" })
                      }
                    >
                      <SelectTrigger>
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={formData.semester}
                      disabled={!formData.year}
                      onValueChange={(value) =>
                        setFormData({ ...formData, semester: value as Semester, courseCode: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTERS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Course & Paper Type */}
                <div>
                  <Label>Course</Label>
                  <Select
                    value={formData.courseCode}
                    disabled={!formData.year || !formData.semester}
                    onValueChange={(value) => setFormData({ ...formData, courseCode: value })}
                  >
                    <SelectTrigger>
                      <BookOpen className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCourses.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Paper Type</Label>
                  <Select
                    value={formData.paperType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paperType: value as PaperType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam">Examination</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* PDF Upload */}
            <div>
              <Label>Upload PDF</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => e.target.files && setPdfFile(e.target.files[0])}
              />
              {pdfFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => handleSubmit("draft")}
                className="flex-1"
                disabled={isSubmitting || !pdfFile}
              >
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit("pending_moderation")}
                className="flex-1"
                disabled={isSubmitting || !pdfFile}
              >
                <Send className="w-4 h-4 mr-2" /> Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Your Papers List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Papers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {papers.length === 0 ? (
              <p className="text-muted-foreground">No papers yet.</p>
            ) : (
              papers.map((paper) => (
                <div
                  key={paper._id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{paper.courseName}</p>
                      <p className="text-sm text-muted-foreground">
                        {paper.year} • {paper.semester}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={paper.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreatePaper;
