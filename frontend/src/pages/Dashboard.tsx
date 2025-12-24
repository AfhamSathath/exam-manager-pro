import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import LecturerDashboard from '@/components/dashboards/LecturerDashboard';
import ExaminerDashboard from '@/components/dashboards/ExaminerDashboard';
import HODDashboard from '@/components/dashboards/HODDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'lecturer':
        return <LecturerDashboard />;
      case 'examiner':
        return <ExaminerDashboard />;
      case 'hod':
        return <HODDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;
