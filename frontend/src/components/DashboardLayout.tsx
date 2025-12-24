import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  LayoutDashboard, 
  FileText, 
  Send, 
  CheckSquare, 
  Archive, 
  LogOut, 
  User,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLecturerNavItems = () => [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'My Papers', path: '/dashboard/papers' },
    { icon: Send, label: 'Create Paper', path: '/dashboard/create-paper' },
    { icon: Archive, label: 'Repository', path: '/dashboard/repository' },
  ];

  const getExaminerNavItems = () => [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Pending Review', path: '/dashboard/review' },
    { icon: FileText, label: 'Moderated Papers', path: '/dashboard/moderated' },
    { icon: Archive, label: 'Repository', path: '/dashboard/repository' },
  ];

  const getHODNavItems = () => [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Pending Approval', path: '/dashboard/approval' },
    { icon: FileText, label: 'Approved Papers', path: '/dashboard/approved' },
    { icon: Archive, label: 'Repository', path: '/dashboard/repository' },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'lecturer':
        return getLecturerNavItems();
      case 'examiner':
        return getExaminerNavItems();
      case 'hod':
        return getHODNavItems();
      default:
        return [];
    }
  };

  const getRoleBadgeStyles = () => {
    switch (user?.role) {
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

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'lecturer':
        return 'Lecturer';
      case 'examiner':
        return '2nd Examiner';
      case 'hod':
        return 'Head of Department';
      default:
        return 'User';
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Exam Paper</h2>
              <p className="text-xs text-sidebar-foreground/70">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {getNavItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <span className={cn(
                'inline-block px-2 py-0.5 text-xs rounded-full mt-1',
                getRoleBadgeStyles()
              )}>
                {getRoleLabel()}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            <p className="text-sm text-muted-foreground">{user?.department}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
