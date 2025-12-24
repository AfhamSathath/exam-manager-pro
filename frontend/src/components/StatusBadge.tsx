import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'pending_moderation':
        return 'bg-warning/10 text-warning border border-warning/20';
      case 'moderated':
        return 'bg-info/10 text-info border border-info/20';
      case 'revision_required':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'pending_approval':
        return 'bg-warning/10 text-warning border border-warning/20';
      case 'approved':
        return 'bg-success/10 text-success border border-success/20';
      case 'printed':
        return 'bg-hod/10 text-hod border border-hod/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending_moderation':
        return 'Pending Review';
      case 'moderated':
        return 'Moderated';
      case 'revision_required':
        return 'Revision Required';
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'printed':
        return 'Sent to Print';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <span className={cn(
      'px-3 py-1 rounded-full text-xs font-medium',
      getStatusStyles(),
      className
    )}>
      {getStatusLabel()}
    </span>
  );
};

export default StatusBadge;
