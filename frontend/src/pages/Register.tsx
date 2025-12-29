import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import {
  Department,
  DEPARTMENTS,
  Year,
  YEARS,
  Semester,
  SEMESTERS,
  UserRole,
  COURSES,
} from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import {
  GraduationCap,
  User,
  Mail,
  Lock,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "" as UserRole,
    department: null as Department | null,
    year: null as Year | null,
    semester: null as Semester | null,
    courses: [] as string[],
  });

  const availableCourses =
    formData.department && formData.year && formData.semester
      ? COURSES.filter(
          (c) =>
            c.department === formData.department &&
            c.year === formData.year &&
            c.semester === formData.semester
        )
      : [];

  const isFormValid =
    formData.fullName &&
    formData.email &&
    formData.password &&
    formData.password === formData.confirmPassword &&
    formData.role &&
    formData.department !== null &&
    (formData.role !== "examiner" ||
      (formData.year &&
        formData.semester &&
        formData.courses.length > 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return toast.error("Please fill all required fields");

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        courses:
          formData.role === "examiner"
            ? formData.courses.map((code) => {
                const c = COURSES.find((x) => x.code === code);
                return c ? { code: c.code, name: c.name } : null;
              }).filter(Boolean)
            : undefined,
      });

      toast.success("Registration successful");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4 shadow-glow animate-pulse-glow">
            <GraduationCap className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">
            Create Account
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            Exam Paper Management System
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-center">Register</CardTitle>
            <CardDescription className="text-center text-sm">
              Fill in the details to get started
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2 relative">
                <Label>Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 py-2 text-sm"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 relative">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    className="pl-10 py-2 text-sm"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 relative">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10 py-2 text-sm"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-3 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 relative">
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-3 pr-10 py-2 text-sm"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-2 top-3 text-muted-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) =>
                    setFormData({
                      ...formData,
                      role: value,
                      department: null,
                      year: null,
                      semester: null,
                      courses: [],
                    })
                  }
                >
                  <SelectTrigger className="text-sm py-2">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                    <SelectItem value="examiner">Examiner</SelectItem>
                    <SelectItem value="hod">HOD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              {formData.role && (
                <div>
                  <Label>Department</Label>
                  <Select
                    value={formData.department ?? ""}
                    onValueChange={(value: Department) =>
                      setFormData({
                        ...formData,
                        department: value,
                        year: null,
                        semester: null,
                        courses: [],
                      })
                    }
                  >
                    <SelectTrigger className="text-sm py-2">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="text-sm">
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Examiner Fields */}
              {formData.role === "examiner" && (
                <>
                  <div>
                    <Label>Year</Label>
                    <Select
                      value={formData.year ?? ""}
                      onValueChange={(value: Year) =>
                        setFormData({ ...formData, year: value, courses: [] })
                      }
                    >
                      <SelectTrigger className="text-sm py-2">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="text-sm">
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={formData.semester ?? ""}
                      onValueChange={(value: Semester) =>
                        setFormData({
                          ...formData,
                          semester: value,
                          courses: [],
                        })
                      }
                    >
                      <SelectTrigger className="text-sm py-2">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent className="text-sm">
                        {SEMESTERS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Courses</Label>
                    <div className="grid gap-2 mt-1 text-sm">
                      {availableCourses.map((course) => (
                        <label
                          key={course.code}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            checked={formData.courses.includes(course.code)}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                courses: checked
                                  ? [...formData.courses, course.code]
                                  : formData.courses.filter(
                                      (c) => c !== course.code
                                    ),
                              })
                            }
                          />
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          {course.code} – {course.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-gradient-primary hover:opacity-90 text-sm py-2"
              >
                {isLoading ? "Creating account..." : "Register"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
