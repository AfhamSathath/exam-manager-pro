import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { Archive, FileText, Search, Filter, Calendar, BookOpen, Download, Eye } from 'lucide-react';
import { YEARS, SEMESTERS, Year, Semester, COURSES } from '@/types';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL + "/papers";
const FILE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

interface Paper {
  _id: string;
  lecturerId: { _id: string; name: string };
  examinerId?: { _id: string; name: string };
  courseCode: string;
  courseName: string;
  year: string;
  semester: string;
  paperType: string;
  pdfUrl: string;
  status: string;
  createdAt: string;
}

const Repository = () => {
  const { user, token } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: '' as Year | '',
    semester: '' as Semester | '',
    search: '',
    paperType: '' as 'exam' | 'assessment' | '',
    courseCode: '',
  });

  // Fetch approved papers based on role
  const fetchPapers = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?status=approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Role-based filtering is now done in backend
      setPapers(res.data);
    } catch (err) {
      console.error("Error fetching repository papers:", err);
      toast.error("Failed to load repository");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [user, token]);

  const filteredPapers = papers.filter(paper => {
    if (filters.year && paper.year !== filters.year) return false;
    if (filters.semester && paper.semester !== filters.semester) return false;
    if (filters.courseCode && paper.courseCode !== filters.courseCode) return false;
    if (filters.paperType && paper.paperType !== filters.paperType) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        paper.courseCode.toLowerCase().includes(searchLower) ||
        paper.courseName.toLowerCase().includes(searchLower) ||
        paper.lecturerId?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const filteredCourses = COURSES.filter(
    (c) =>
      c.department === user?.department &&
      (!filters.year || c.year === filters.year) &&
      (!filters.semester || c.semester === filters.semester) &&
      (user?.role !== 'examiner' || user.courses?.some(uc => uc.code === c.code))
  );

  const groupedPapers = filteredPapers.reduce((acc, paper) => {
    const key = `${paper.year} - ${paper.semester}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(paper);
    return acc;
  }, {} as Record<string, Paper[]>);

  const viewPdf = (url: string) => {
    if (!url) return toast.error("PDF not available");
    let fullUrl;
    if (url.startsWith('http')) {
      fullUrl = url;
    } else if (url.startsWith('/')) {
      fullUrl = `${FILE_URL}${url}`;
    } else {
      const normalizedUrl = url.replace('E:/exam-manager-pro-main-main/backend', '');
      fullUrl = `${FILE_URL}${normalizedUrl}`;
    }
    window.open(fullUrl, "_blank");
  };

  const downloadPdf = (url: string, filename: string) => {
    if (!url) return toast.error("PDF not available");
    let fullUrl;
    if (url.startsWith('http')) {
      fullUrl = url;
    } else if (url.startsWith('/')) {
      fullUrl = `${FILE_URL}${url}`;
    } else {
      const normalizedUrl = url.replace('E:/exam-manager-pro-main-main/backend', '');
      fullUrl = `${FILE_URL}${normalizedUrl}`;
    }
    
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = filename || 'paper.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Archive className="w-8 h-8" />
            Paper Repository
          </h1>
          <p className="text-muted-foreground mt-1">
            Archive of approved examination and assessment papers - {user?.department}
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by course or lecturer..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.year}
                onValueChange={(value) => setFilters({ ...filters, year: value as Year, courseCode: '' })}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Years" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.semester}
                onValueChange={(value) => setFilters({ ...filters, semester: value as Semester, courseCode: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(sem => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.courseCode}
                onValueChange={(value) => setFilters({ ...filters, courseCode: value })}
                disabled={!filters.year || !filters.semester}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Courses" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {filteredCourses.map((course) => (
                    <SelectItem key={course.code} value={course.code}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.paperType}
                onValueChange={(value) => setFilters({ ...filters, paperType: value as 'exam' | 'assessment' })}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Types" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">Examination</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50 animate-pulse" />
              <p className="text-muted-foreground">Loading repository...</p>
            </CardContent>
          </Card>
        ) : filteredPapers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No papers found</h3>
              <p className="text-muted-foreground">
                {papers.length === 0 
                  ? 'No approved papers in the repository yet'
                  : 'Try adjusting your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPapers).map(([group, papers]) => (
              <div key={group}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {group}
                </h3>
                <div className="grid gap-3">
                  {papers.map((paper) => (
                    <Card key={paper._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">
                                {paper.courseCode} - {paper.courseName}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {paper.paperType === 'exam' ? 'Examination' : 'Assessment'} • 
                                Lecturer: {paper.lecturerId?.name || 'Unknown'}
                                {paper.examinerId?.name && ` • Examiner: ${paper.examinerId.name}`}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <StatusBadge status={paper.status} />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewPdf(paper.pdfUrl)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPdf(paper.pdfUrl, `${paper.courseCode}_${paper.paperType}.pdf`)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {filteredPapers.length} of {papers.length} papers
              </span>
              <span className="text-sm text-muted-foreground">
                {user?.role === 'hod' ? 'All Departments' : `${user?.department} Department`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Repository;
