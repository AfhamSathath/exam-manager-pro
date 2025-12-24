import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getRepositoryPapers } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/StatusBadge';
import { Archive, FileText, Search, Filter, Calendar, BookOpen } from 'lucide-react';
import { YEARS, SEMESTERS, Year, Semester } from '@/types';

const Repository = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    year: '' as Year | '',
    semester: '' as Semester | '',
    search: '',
    paperType: '' as 'exam' | 'assessment' | '',
  });

  const allPapers = user ? getRepositoryPapers(user.department) : [];

  const filteredPapers = allPapers.filter(paper => {
    if (filters.year && paper.year !== filters.year) return false;
    if (filters.semester && paper.semester !== filters.semester) return false;
    if (filters.paperType && paper.paperType !== filters.paperType) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        paper.courseCode.toLowerCase().includes(searchLower) ||
        paper.courseName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const groupedPapers = filteredPapers.reduce((acc, paper) => {
    const key = `${paper.year} - ${paper.semester}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(paper);
    return acc;
  }, {} as Record<string, typeof filteredPapers>);

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by course..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.year}
                onValueChange={(value) => setFilters({ ...filters, year: value as Year })}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Years" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.semester}
                onValueChange={(value) => setFilters({ ...filters, semester: value as Semester })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Semesters</SelectItem>
                  {SEMESTERS.map(sem => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.paperType}
                onValueChange={(value) => setFilters({ ...filters, paperType: value as 'exam' | 'assessment' })}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Types" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="exam">Examination</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredPapers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No papers found</h3>
              <p className="text-muted-foreground">
                {allPapers.length === 0 
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
                    <Card key={paper.id} className="hover:shadow-md transition-shadow">
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
                                By {paper.lecturerName}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <StatusBadge status={paper.status} />
                                <span className="text-xs text-muted-foreground">
                                  {paper.signatures.length} signatures
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(paper.updatedAt).toLocaleDateString()}
                          </span>
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
                Showing {filteredPapers.length} of {allPapers.length} papers
              </span>
              <span className="text-sm text-muted-foreground">
                {user?.department} Department
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Repository;
