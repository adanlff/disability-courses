// Enrollment Types
import { EnrollmentStatus } from '@prisma/client';

// Enrollment data
export interface EnrollmentData {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress: number;
  last_accessed_at: Date | null;
  completed_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Enrollment with course
export interface EnrollmentWithCourse extends EnrollmentData {
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    total_duration: number;
    total_lessons: number;
    mentor: {
      user: {
        full_name: string;
      };
    };
  };
}

// Enrollment with full details
export interface EnrollmentWithDetails extends EnrollmentWithCourse {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  progress_items: ProgressData[];
  certificate?: {
    id: string;
    certificate_number: string;
  };
}

// Progress data
export interface ProgressData {
  id: string;
  enrollment_id: string;
  material_id: string;
  user_id: string;
  is_completed: boolean;
  watched_duration: number;
  last_position: number;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Enrollment check result
export interface EnrollmentCheck {
  enrolled: boolean;
  enrollment?: EnrollmentData;
}

// Enrollment list item
export interface EnrollmentListItem {
  id: string;
  course_title: string;
  course_thumbnail: string | null;
  mentor_name: string;
  progress: number;
  status: EnrollmentStatus;
  last_accessed_at: Date | null;
  enrolled_at: Date;
}

// Progress update input
export interface ProgressUpdateInput {
  material_id: string;
  is_completed?: boolean;
  watched_duration?: number;
  last_position?: number;
}

// Enrollment statistics
export interface EnrollmentStatistics {
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  completion_rate: number;
  average_progress: number;
}

// Continue learning item
export interface ContinueLearningItem {
  enrollment_id: string;
  course_id: string;
  course_title: string;
  course_thumbnail: string | null;
  progress: number;
  next_material: {
    id: string;
    title: string;
    type: string;
  } | null;
  last_accessed_at: Date | null;
}

// Material completion
export interface MaterialCompletion {
  material_id: string;
  completed: boolean;
  completed_at: Date | null;
}

// Course completion
export interface CourseCompletion {
  course_id: string;
  enrollment_id: string;
  completed: boolean;
  completed_at: Date | null;
  certificate_generated: boolean;
}
