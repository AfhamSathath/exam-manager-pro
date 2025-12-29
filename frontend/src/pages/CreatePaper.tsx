import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { FileText, Send, Save, Calendar, BookOpen, AlertCircle, XCircle, CloudUpload, Loader2 } from "lucide-react";
import axios from "axios";
import { COURSES, YEARS, SEMESTERS, Year, Semester, PaperType } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL + "/papers";

const CreatePaper = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL detection for Revision
  const searchParams = new URLSearchParams(location.search);
  const revisionId = searchParams.get("revisionId");
  const isRevisionMode = !!revisionId;

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [papers, setPapers] = useState<any[]>([]);
  const [revisionPaper, setRevisionPaper] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    year: "" as Year | "",
    semester: "" as Semester | "",
    courseCode: "",
    paperType: "exam" as PaperType,
  });

  // Load papers and find specific revision target
  useEffect(() => {
    if (!user || !token) return;

    const loadData = async () => {
      try {
        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const myPapers = res.data.filter((p: any) => {
          const lId = typeof p.lecturerId === "object" ? p.lecturerId._id : p.lecturerId;
          return lId === user.id;
        });
        setPapers(myPapers);

        if (isRevisionMode && revisionId) {
          const target = myPapers.find((p: any) => p._id === revisionId);
          if (target) {
            setRevisionPaper(target);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    loadData();
  }, [user, token, revisionId, isRevisionMode]);

  const filteredCourses = COURSES.filter(
    (c) =>
      c.department === user?.department &&
      String(c.year) === String(formData.year) &&
      c.semester === formData.semester
  );

  const handleSubmit = async (status: "draft" | "pending_moderation") => {
    // Validation
    if (!pdfFile) return toast.error("Please upload a PDF file");
    if (!isRevisionMode && !formData.courseCode) return toast.error("Please select a course");

    setIsSubmitting(true);
    const payload = new FormData();
    payload.append("status", status);
    payload.append("pdf", pdfFile);

    try {
      const config = {
        headers: { 
          "Content-Type": "multipart/form-data", 
          Authorization: `Bearer ${token}` 
        },
      };

      if (isRevisionMode && revisionId) {
        // --- REVISION: Only PATCH PDF and Status ---
        await axios.patch(`${API_URL}/${revisionId}/revise`, payload, config);
        toast.success("Revision uploaded successfully");
      } else {
        // --- NEW PAPER: POST everything ---
        const selected = COURSES.find((c) => c.code === formData.courseCode);
        payload.append("year", formData.year);
        payload.append("semester", formData.semester);
        payload.append("courseCode", formData.courseCode);
        payload.append("courseName", selected?.name || "");
        payload.append("paperType", formData.paperType);
        payload.append("lecturerId", user!.id);

        await axios.post(API_URL, payload, config);
        toast.success(status === "draft" ? "Draft saved" : "Paper created successfully need to moderation");
      }

      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className={isRevisionMode ? "border-2 border-amber-500 shadow-sm" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-primary" />
              {isRevisionMode ? "Revise Existing Paper" : "Upload New Paper"}
            </CardTitle>
            {isRevisionMode && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/create-paper")}>
                <XCircle className="w-4 h-4 mr-2" /> Exit Revision
              </Button>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isRevisionMode ? (
              /* --- REVISION MODE UI: ONLY SHOW PDF UPLOAD --- */
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 border rounded-lg">
                  <div className="p-2 bg-white rounded shadow-sm">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Revising: {revisionPaper?.courseCode}</p>
                    <p className="text-xs text-muted-foreground">{revisionPaper?.courseName}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Upload Corrected PDF</Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    className="h-24 border-dashed border-2 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    onChange={(e) => e.target.files && setPdfFile(e.target.files[0])}
                  />
                  <div className="flex gap-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Metadata (Course, Year) cannot be changed during revision.
                  </div>
                </div>
              </div>
            ) : (
              /* --- CREATE MODE UI: SHOW FULL FORM --- */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select
                      value={formData.year || undefined}
                      onValueChange={(v) => setFormData({ ...formData, year: v as Year, courseCode: "" })}
                    >
                      <SelectTrigger><Calendar className="w-4 h-4 mr-2" /><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select
                      value={formData.semester || undefined}
                      disabled={!formData.year}
                      onValueChange={(v) => setFormData({ ...formData, semester: v as Semester, courseCode: "" })}
                    >
                      <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                      <SelectContent>
                        {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={formData.courseCode || undefined}
                    disabled={!formData.semester}
                    onValueChange={(v) => setFormData({ ...formData, courseCode: v })}
                  >
                    <SelectTrigger><BookOpen className="w-4 h-4 mr-2" /><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {filteredCourses.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label>Upload Paper PDF</Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => e.target.files && setPdfFile(e.target.files[0])}
                  />
                </div>
              </>
            )}

            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                className="flex-1" 
                disabled={isSubmitting} 
                onClick={() => handleSubmit("draft")}
              >
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </Button>
              <Button 
                className="flex-1" 
                disabled={isSubmitting} 
                onClick={() => handleSubmit("pending_moderation")}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {isRevisionMode ? "Upload Revision" : "Create the Paper "}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Submissions List - only shown in Create Mode */}
        {!isRevisionMode && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Submissions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {papers.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No papers uploaded yet.</p>
              ) : (
                papers.map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{p.courseCode}</p>
                        <p className="text-xs text-muted-foreground">{p.year} • {p.semester}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.status} />
                      {(p.status === "draft" || p.status === "revision_required") && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => navigate(`/dashboard/create-paper?revisionId=${p._id}`)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreatePaper;