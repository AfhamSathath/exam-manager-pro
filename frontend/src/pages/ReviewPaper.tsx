import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getPaperById, savePaper } from '@/lib/storage';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import SignatureDisplay from '@/components/SignatureDisplay';
import { toast } from 'sonner';
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Download,
  ExternalLink,
} from 'lucide-react';

const ReviewPaper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paper] = useState(() => getPaperById(id || ''));
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const FILE_URL = API_URL.replace('/api', '');

  if (!paper) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Paper not found</h2>
          <Button variant="link" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const canReview =
    paper.status === 'pending_moderation' &&
    user?.role === 'examiner';

  const pdfUrl = `${FILE_URL}/uploads/papers/${paper.content}`;
  const isPdf = paper.content?.toLowerCase().endsWith('.pdf');

  const handleApprove = () => {
    setIsSubmitting(true);

    const updatedPaper = {
      ...paper,
      status: 'moderated' as const,
      examinerId: user!.id,
      examinerName: user!.fullName,
      moderationComments: comment
        ? [
            ...paper.moderationComments,
            {
              id: uuidv4(),
              userId: user!.id,
              userName: user!.fullName,
              comment,
              timestamp: new Date().toISOString(),
            },
          ]
        : paper.moderationComments,
      signatures: [
        ...paper.signatures,
        {
          userId: user!.id,
          userName: user!.fullName,
          role: user!.role,
          timestamp: new Date().toISOString(),
          action: 'Moderated and approved the paper',
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    savePaper(updatedPaper);
    toast.success('Paper approved and moderated');
    navigate('/dashboard/review');
    setIsSubmitting(false);
  };

  const handleRequestRevision = () => {
    if (!comment.trim()) {
      toast.error('Please provide feedback for the lecturer');
      return;
    }

    setIsSubmitting(true);

    const updatedPaper = {
      ...paper,
      status: 'revision_required' as const,
      examinerId: user!.id,
      examinerName: user!.fullName,
      moderationComments: [
        ...paper.moderationComments,
        {
          id: uuidv4(),
          userId: user!.id,
          userName: user!.fullName,
          comment,
          timestamp: new Date().toISOString(),
        },
      ],
      signatures: [
        ...paper.signatures,
        {
          userId: user!.id,
          userName: user!.fullName,
          role: user!.role,
          timestamp: new Date().toISOString(),
          action: 'Requested revision with feedback',
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    savePaper(updatedPaper);
    toast.success('Revision requested');
    navigate('/dashboard/review');
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Paper Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{paper.courseCode}</h1>
            <StatusBadge status={paper.status} />
          </div>
          <p className="text-muted-foreground">{paper.courseName}</p>
          <p className="text-sm text-muted-foreground">
            {paper.year} • {paper.semester} • {paper.lecturerName}
          </p>
        </div>

        {/* PDF Viewer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Paper Document
              </CardTitle>
              <CardDescription>Preview and download the paper</CardDescription>
            </div>
            {isPdf && (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </a>
                </Button>
                <Button asChild>
                  <a href={pdfUrl} download>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isPdf ? (
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                className="w-full h-[600px] rounded-md border"
              />
            ) : (
              <div className="p-6 bg-muted/50 rounded-md whitespace-pre-wrap">
                {paper.content}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Examiner Review */}
        {canReview && (
          <Card className="border-examiner/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Examiner Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="comment">Comments / Suggestions</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter feedback for lecturer..."
                className="min-h-[150px]"
              />
              <div className="flex gap-4">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRequestRevision}
                  disabled={isSubmitting}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  className="flex-1 bg-success hover:bg-success/90"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Sign
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previous Comments */}
        {paper.moderationComments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paper.moderationComments.map((c) => (
                <div key={c.id} className="p-4 bg-muted/50 rounded-md">
                  <div className="flex justify-between text-sm mb-1">
                    <strong>{c.userName}</strong>
                    <span className="text-muted-foreground">
                      {new Date(c.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p>{c.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Signature Trail */}
        <Card>
          <CardHeader>
            <CardTitle>Signature Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureDisplay signatures={paper.signatures} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReviewPaper;
