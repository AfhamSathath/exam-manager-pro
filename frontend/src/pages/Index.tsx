import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, FileText, CheckSquare, Archive, ArrowRight, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">FAS Exam System</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Register
              </Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-8 shadow-glow animate-pulse-glow">
            <GraduationCap className="w-10 h-10 text-secondary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
            Examination Paper
            <span className="block text-gradient">Management System</span>
          </h1>
          
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Streamline the moderation, approval, and archival of examination papers 
            for the Faculty of Applied Sciences
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto">
          {[
            { icon: FileText, title: 'Paper Creation', desc: 'Create and manage examination papers with version control' },
            { icon: CheckSquare, title: 'Moderation Workflow', desc: 'Seamless review process with digital signatures' },
            { icon: Archive, title: 'Secure Repository', desc: 'Archive approved papers by department, year, and course' },
          ].map((feature, i) => (
            <div 
              key={i} 
              className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <feature.icon className="w-10 h-10 text-secondary mb-4" />
              <h3 className="text-lg font-semibold text-primary-foreground mb-2">{feature.title}</h3>
              <p className="text-primary-foreground/70 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Roles */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-8">Role-Based Access</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Lecturer', '2nd Examiner', 'Head of Department'].map((role, i) => (
              <div key={i} className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
                <Users className="w-4 h-4 text-secondary" />
                <span className="text-primary-foreground text-sm">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
