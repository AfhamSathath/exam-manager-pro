import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Archive } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import axios from 'axios';

const ApprovedPapers = () => {
  const { user } = useAuth();
  const [approvedPapers, setApprovedPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPapers = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/papers/hod/approved`, {
          withCredentials: true, // send cookies for auth
        });
        setApprovedPapers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [user]);

  if (loading) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Approved Papers</h1>
          <p className="text-muted-foreground mt-1">
            Papers approved and ready for print or archived
          </p>
        </div>

        {approvedPapers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No approved papers yet</h3>
              <p className="text-muted-foreground">Approved papers will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {approvedPapers.map((paper) => (
              <Link key={paper._id} to={`/dashboard/approval/${paper._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {paper.courseCode} - {paper.courseName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {paper.year} • {paper.semester} •{' '}
                            {paper.paperType === 'exam' ? 'Examination' : 'Assessment'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Lecturer: {paper.lecturerName} | Examiner: {paper.examinerName || 'N/A'}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <StatusBadge status={paper.status} />
                            <span className="text-xs text-muted-foreground">
                              {paper.signatures?.length || 0} signatures
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApprovedPapers;
