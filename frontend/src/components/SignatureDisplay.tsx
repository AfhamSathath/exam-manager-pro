import { Signature } from '@/types';
import { CheckCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureDisplayProps {
  signatures: Signature[];
}

const SignatureDisplay = ({ signatures }: SignatureDisplayProps) => {
  if (signatures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No signatures yet
      </p>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lecturer':
        return 'bg-lecturer text-lecturer-foreground';
      case 'examiner':
        return 'bg-examiner text-examiner-foreground';
      case 'hod':
        return 'bg-hod text-hod-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'lecturer':
        return 'Lecturer';
      case 'examiner':
        return '2nd Examiner';
      case 'hod':
        return 'HOD';
      default:
        return role;
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border" />

      <div className="space-y-6">
        {signatures.map((signature, index) => (
          <div key={index} className="flex items-start gap-4 relative">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center z-10',
              getRoleColor(signature.role)
            )}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{signature.userName}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    getRoleColor(signature.role)
                  )}>
                    {getRoleLabel(signature.role)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(signature.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{signature.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignatureDisplay;
