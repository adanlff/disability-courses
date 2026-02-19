// Course Types
import { CourseStatus, CourseLevel, MaterialType } from '@prisma/client';

// Course data
export interface CourseData {
  id: string;
  mentor_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  thumbnail: string | null;
  preview_video_url: string | null;
  level: CourseLevel;
  language: string;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  is_featured: boolean;
  is_premium: boolean;
  status: CourseStatus;
  requirements: string[];
  what_you_will_learn: string[];
  target_audience: string[];
  tags: string[];
  total_duration: number;
  total_lessons: number;
  total_students: number;
  average_rating: number;
  total_reviews: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Course with mentor
export interface CourseWithMentor extends CourseData {
  mentor: {
    id: string;
    user: {
      full_name: string;
      avatar_url: string | null;
    };
  };
}

// Course with full relations
export interface CourseWithRelations extends CourseWithMentor {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  sections: SectionData[];
}

// Section data
export interface SectionData {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number;
  materials: MaterialData[];
}

// Material data
export interface MaterialData {
  id: string;
  section_id: string;
  title: string;
  type: MaterialType;
  content: string | null;
  duration: number;
  order: number;
  is_free: boolean;
  video_id: string | null;
}

// Course list item
export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  level: CourseLevel;
  average_rating: number;
  total_students: number;
  mentor_name: string;
  category_name: string;
}

// Course create/update input
export interface CourseInput {
  title: string;
  description: string;
  short_description?: string;
  category_id: string;
  level: CourseLevel;
  language?: string;
  price?: number;
  discount_price?: number | null;
  is_free?: boolean;
  is_premium?: boolean;
  requirements?: string[];
  what_you_will_learn?: string[];
  target_audience?: string[];
  tags?: string[];
}

// Section input
export interface SectionInput {
  title: string;
  description?: string;
  order?: number;
}

// Material input
export interface MaterialInput {
  title: string;
  type: MaterialType;
  content?: string;
  duration?: number;
  order?: number;
  is_free?: boolean;
}

// Course filter
export interface CourseFilter {
  category?: string;
  level?: CourseLevel;
  is_free?: boolean;
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  mentor_id?: string;
  status?: CourseStatus;
}

// Course statistics
export interface CourseStatistics {
  total_students: number;
  total_reviews: number;
  average_rating: number;
  completion_rate: number;
  revenue: number;
}

// Course progress
export interface CourseProgress {
  course_id: string;
  total_materials: number;
  completed_materials: number;
  progress_percentage: number;
  last_accessed_material_id: string | null;
}

// Category data
export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  order: number;
  is_active: boolean;
  course_count?: number;
}

// Review data
export interface ReviewData {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  comment: string | null;
  is_helpful: number;
  created_at: Date;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}
