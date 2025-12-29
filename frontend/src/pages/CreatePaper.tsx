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
import axios, { AxiosResponse } from "axios";
import { COURSES, YEARS, SEMESTERS, Year, Semester, PaperType } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL + "/papers";

interface Paper {
  _id: string;
  year: Year;
  semester: Semester;
  courseCode: string;
  courseName: string;
  paperType: PaperType;
  pdfUrl: string;
  lecturerId: string;
  status: "draft" | "pending_moderation" | "approved" | string;
}

const CreatePaper = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const revisionId = searchParams.get("revisionId");
  const isRevisionMode = !!revisionId;

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [prevPdfName, setPrevPdfName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [revisionPaper, setRevisionPaper] = useState<Paper | null>(null);

  const [formData, setFormData] = useState({
    year: "" as Year,
    semester: "" as Semester,
    courseCode: "",
    paperType: "exam" as PaperType,
  });

  // -----------------------------
  // Fetch lecturer papers & prefill revision
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    const fetchPapers = async () => {
      try {
        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const lecturerPapers: Paper[] = res.data.filter(
          (p: Paper) => p.lecturerId === user.id
        );
        setPapers(lecturerPapers);

        if (revisionId) {
          const revPaper = lecturerPapers.find((p) => p._id === revisionId);
          if (revPaper) {
            setRevisionPaper(revPaper);
            setFormData({
              year: revPaper.year,
              semester: revPaper.semester,
              courseCode:
                COURSES.find((c) => c.name === revPaper.courseName)?.code || "",
              paperType: revPaper.paperType,
            });

            const parts = revPaper.pdfUrl.split("/");
            setPrevPdfName(parts[parts.length - 1]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch papers:", err);
        toast.error("Failed to load papers");
      }
    };

    fetchPapers();
  }, [user, token, revisionId]);

  // -----------------------------
  // Filter courses based on selection
  // -----------------------------
  const filteredCourses = COURSES.filter(
    (c) =>
      c.department === user?.department &&
      String(c.year) === String(formData.year) &&
      c.semester === formData.semester
  );

  // -----------------------------
  // Validation
  // -----------------------------
  const validate = () => {
    if (!pdfFile && !isRevisionMode) {
      toast.error("Please upload a PDF file");
      return false;
    }
    if (!user) {
      toast.error("User not authenticated");
      return false;
    }
    if (!isRevisionMode) {
      if (!formData.year || !formData.semester) {
        toast.error("Please select year and semester");
        return false;
      }
      const selectedCourse = filteredCourses.find(
        (c) => c.code === formData.courseCode
      );
      if (!selectedCourse) {
        toast.error("Please select a course before submitting");
        return false;
      }
    }
    return true;
  };

  // -----------------------------
  // View PDF
  // -----------------------------
  const viewPdf = () => {
    if (!revisionPaper?.pdfUrl) return toast.error("No PDF available");
    const url = revisionPaper.pdfUrl.startsWith("http")
      ? revisionPaper.pdfUrl
      : `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}${revisionPaper.pdfUrl}`;
    window.open(url, "_blank");
  };

  // -----------------------------
  // Handle create or revise
  // -----------------------------
  const handleSubmit = async (status: "draft" | "pending_moderation") => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      if (pdfFile) payload.append("pdf", pdfFile);
      payload.append("status", status);

      let res: AxiosResponse<Paper>;

      if (isRevisionMode && revisionPaper) {
        // ✅ REVISION MODE: only update PDF & status
        res = await axios.patch(
          `${API_URL}/${revisionPaper._id}/revise`,
          payload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Revision PDF uploaded successfully!");
      } else {
        // ✅ CREATION MODE: append all required fields
        const selectedCourse = filteredCourses.find(
          (c) => c.code === formData.courseCode
        );

        if (!selectedCourse) {
          toast.error("Please select a course before submitting");
          setIsSubmitting(false);
          return;
        }

        payload.append("year", formData.year);
        payload.append("semester", formData.semester);
        payload.append("courseCode", selectedCourse.code);
        payload.append("courseName", selectedCourse.name);
        payload.append("paperType", formData.paperType);
        payload.append("lecturerId", user.id);

        res = await axios.post(API_URL, payload, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success(
          status === "draft" ? "Draft saved!" : "Submitted for review!"
        );
      }

      // Update papers list
      setPapers((prev) => {
        if (isRevisionMode && revisionPaper) {
          return prev.map((p) => (p._id === revisionPaper._id ? res.data : p));
        } else {
          return [res.data, ...prev];
        }
      });

      // Reset form only in creation mode
      if (!isRevisionMode) {
        setFormData({
          year: "" as Year,
          semester: "" as Semester,
          courseCode: "",
          paperType: "exam" as PaperType,
        });
      }

      setPdfFile(null);
      setRevisionPaper(null);
      setPrevPdfName(null);

      if (!isRevisionMode) navigate("/dashboard");
    } catch (err: any) {
      console.error("CreatePaper Error:", err);
      toast.error(err.response?.data?.message || "Failed to upload paper");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Paper Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {isRevisionMode ? "Upload Revision PDF" : "Create Paper"}
            </CardTitle>
            <CardDescription>
              {isRevisionMode
                ? "Upload new PDF for revision. Year, semester, course & type are preserved."
                : "Upload examination or assessment paper."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Only show selections when not revising */}
            {!isRevisionMode && (
              <>
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
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
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
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                onChange={(e) => {
                  if (e.target.files) setPdfFile(e.target.files[0]);
                }}
              />

              {pdfFile ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                </p>
              ) : isRevisionMode && prevPdfName ? (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">Current PDF: {prevPdfName}</p>
                  <Button size="sm" variant="outline" onClick={viewPdf}>
                    View
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit("draft")}
                className="flex-1"
                disabled={
                  isSubmitting || (!pdfFile && !isRevisionMode) || (!isRevisionMode && !formData.courseCode)
                }
              >
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit("pending_moderation")}
                className="flex-1"
                disabled={
                  isSubmitting || (!pdfFile && !isRevisionMode) || (!isRevisionMode && !formData.courseCode)
                }
              >
                <Send className="w-4 h-4 mr-2" /> Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Papers List */}
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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={paper.status} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/create-paper?revisionId=${paper._id}`)
                      }
                    >
                      Revision
                    </Button>
                  </div>
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
