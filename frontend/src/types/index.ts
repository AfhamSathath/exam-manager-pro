// frontend/src/types.ts

// Departments
export type Department = "Computer Science" | "Physical Science";
export const DEPARTMENTS: Department[] = ["Computer Science", "Physical Science"];

// Academic Years
export type Year = "1st Year" | "2nd Year" | "3rd Year";
export const YEARS: Year[] = ["1st Year", "2nd Year", "3rd Year"];

// Semesters
export type Semester = "1st Semester" | "2nd Semester";
export const SEMESTERS: Semester[] = ["1st Semester", "2nd Semester"];

// User Roles
export type UserRole = "lecturer" | "examiner" | "hod";

// Paper Status
export type PaperStatus =
  | "draft"
  | "pending_moderation"
  | "moderated"
  | "revision_required"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "printed";

// Paper Types
export type PaperType = "exam" | "assessment";

// User Interface
export interface User {
  name: string;
  _id?: string;
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  department: Department;
  courses?: { code: string; name: string }[];
  createdAt: string;
}

// Signature Interface
export interface Signature {
  userId: string;
  userName: string;
  role: UserRole;
  timestamp: string;
  action: string;
}

// Moderation Comment Interface
export interface ModerationComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

// Paper Interface
export interface Paper {
  id: string;
  courseCode: string;
  courseName: string;
  department: Department;
  year: Year;
  semester: Semester;
  paperType: PaperType;
  content: string; // PDF file reference
  status: PaperStatus;
  lecturerId: string;
  lecturerName: string;
  examinerId?: string;
  examinerName?: string;
  signatures: Signature[];
  moderationComments: ModerationComment[];
  revisions: {
    id: string;
    content: string;
    timestamp: string;
    version: number;
  }[];
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
}

// Course Interface
export interface Course {
  code: string;
  name: string;
  department: Department;
  year: Year;
  semester: Semester;
}

// Courses Array
export const COURSES: Course[] = [
  // Computer Science
 
  // 1st Year - 1st Semester
  { code: "CO1121", name: "Basic Mathematics for Computing", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "CO1122", name: "Basic Computer Programming", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "CO1112", name: "Practical work on CO1122", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "CO1123", name: "Formal Methods for Problem Solving", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "CO1124", name: "Computer Systems & PC Applications", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "CO1114", name: "Practical work on CO1124", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "CO1125", name: "Statistics for Science and Technology", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "CO1115", name: "Practical work on CO1125", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "CO1126", name: "Management Information System", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  { code: "GEP - I", name: "General English Proficiency - I", department: "Computer Science", year: "1st Year", semester: "1st Semester" },
  // 1st Year - 2nd Semester
  { code: "CO1221", name: "Systems Analysis & Design", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  { code: "CO1222", name: "Data Structures & Algorithms", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  { code: "CO1212", name: "Practical work on CO1222", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  { code: "CO1223", name: "Data Base Management Systems", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  { code: "CO1213", name: "Practical work on CO1223", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  { code: "CO1224", name: "MultiMedia & HyperMedia Development", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  { code: "CO1214", name: "Practical work on CO1224", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  { code: "CO1225", name: "Computer Architecture", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  { code: "CO1226", name: "Social Harmony", department: "Computer Science", year: "1st Year", semester: "2nd Semester" },
  // 2nd Year - 1st Semester
  { code: "CO2121", name: "Advanced Mathematics for Computing", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "CO2122", name: "Operating Systems", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "CO2112", name: "Practical work on CO2122", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "CO2123", name: "Software Engineering", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "CO2124", name: "Internet and Web Design", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "CO2114", name: "Practical work on CO2124", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "CO2125", name: "Object Oriented Programming", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "CO2115", name: "Practical work on CO2125", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "CO2126", name: "Sri Lankan Studies", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  { code: "GEP - III", name: "General English Proficiency - III", department: "Computer Science", year: "2nd Year", semester: "1st Semester" },
  // 2nd Year - 2nd Semester
  { code: "CO2221", name: "Data Communication Systems", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  { code: "CO2222", name: "Visual System Development Tools", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  { code: "CO22212", name: "Practical work on CO2222", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  { code: "CO2223", name: "Computer Graphics", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  { code: "CO2213", name: "Practical work on CO2223", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  { code: "CO2224", name: "Human Computer Interaction", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  { code: "CO2214", name: "Practical work on CO2224", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  { code: "CO2225", name: "Software Management Techniques", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  { code: "CO2226", name: "Automata Theory", department: "Computer Science", year: "2nd Year", semester: "2nd Semester" },
  // 3rd Year - 1st Semester
  { code: "CS3121", name: "Logic Programming & Expert Systems", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "CS3111", name: "Practical work on CS3121", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "CS3122", name: "Advanced Database Management Systems", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "CS3112", name: "Practical work on CS3122", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "CS3123", name: "Systems & Network Administration", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "CS3113", name: "Practical work on CS3123", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "CS3124", name: "Data Security", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "CS3114", name: "Practical work on CS3124", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "CS3135", name: "Theory of Computing", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },
  { code: "EC3101", name: "Foundations of Management", department: "Computer Science", year: "3rd Year", semester: "1st Semester" },

  
  // Physical Science - 1st Year
  { code: "PS1121", name: "Classical Mechanics", department: "Physical Science", year: "1st Year", semester: "1st Semester" },
  { code: "PS1122", name: "General Chemistry", department: "Physical Science", year: "1st Year", semester: "1st Semester" },
  { code: "PS1221", name: "Thermodynamics", department: "Physical Science", year: "1st Year", semester: "2nd Semester" },
  // Physical Science - 2nd Year
  { code: "PS2121", name: "Electromagnetism", department: "Physical Science", year: "2nd Year", semester: "1st Semester" },
  { code: "PS2122", name: "Organic Chemistry", department: "Physical Science", year: "2nd Year", semester: "1st Semester" },
  { code: "PS2221", name: "Quantum Mechanics", department: "Physical Science", year: "2nd Year", semester: "2nd Semester" },
  // Physical Science - 3rd Year
  { code: "PS3121", name: "Statistical Mechanics", department: "Physical Science", year: "3rd Year", semester: "1st Semester" },
  { code: "PS3122", name: "Physical Chemistry", department: "Physical Science", year: "3rd Year", semester: "1st Semester" },
  { code: "PS3221", name: "Nuclear Physics", department: "Physical Science", year: "3rd Year", semester: "2nd Semester" },
];
