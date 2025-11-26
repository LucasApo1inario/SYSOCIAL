export interface Course {
  id: string;
  name: string;
}

export interface ClassItem {
  id: string;
  courseId: string;
  name: string;
}

export interface EnrollmentPayload {
  student: any;
  guardians: any[];
  courses: any[];
  documents: any[];
}