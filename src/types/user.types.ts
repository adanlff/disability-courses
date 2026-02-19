// User Types
import { UserRole, UserStatus, MentorStatus, DisabilityType } from '@prisma/client';

// User data
export interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  date_of_birth: Date | null;
  address: string | null;
  city: string | null;
  disability_type: DisabilityType | null;
  role: UserRole;
  status: UserStatus;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// User profile (public)
export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
}

// User with mentor
export interface UserWithMentor extends UserData {
  mentor?: MentorData;
}

// Mentor data
export interface MentorData {
  id: string;
  user_id: string;
  expertise: string[];
  experience: string | null;
  education: string | null;
  certificates: string[];
  portfolio_url: string | null;
  linkedin_url: string | null;
  status: MentorStatus;
  approved_at: Date | null;
  rejection_reason: string | null;
  total_students: number;
  total_courses: number;
  total_revenue: number;
  average_rating: number;
  created_at: Date;
  updated_at: Date;
}

// Mentor with user
export interface MentorWithUser extends MentorData {
  user: UserProfile;
}

// Mentor profile (public)
export interface MentorProfile {
  id: string;
  user: UserProfile;
  expertise: string[];
  experience: string | null;
  education: string | null;
  total_students: number;
  total_courses: number;
  average_rating: number;
}

// User list item
export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
}

// Mentor list item
export interface MentorListItem {
  id: string;
  user: UserProfile;
  expertise: string[];
  total_courses: number;
  total_students: number;
  average_rating: number;
  status: MentorStatus;
}

// Profile update input
export interface ProfileUpdateInput {
  full_name?: string;
  phone?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  city?: string | null;
  disability_type?: DisabilityType | null;
}

// Admin user update input
export interface AdminUserUpdateInput extends ProfileUpdateInput {
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

// Mentor application input
export interface MentorApplicationInput {
  expertise: string[];
  experience?: string;
  education?: string;
  certificates?: string[];
  portfolio_url?: string;
  linkedin_url?: string;
}

// Mentor profile update input
export interface MentorProfileUpdateInput extends MentorApplicationInput {
  // Same fields, for update
}

// User statistics
export interface UserStatistics {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  by_role: Record<UserRole, number>;
  by_status: Record<UserStatus, number>;
}

// Mentor statistics
export interface MentorStatistics {
  total_mentors: number;
  approved_mentors: number;
  pending_mentors: number;
  by_status: Record<MentorStatus, number>;
}

// Activity log entry
export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

// Wishlist item
export interface WishlistItem {
  id: string;
  course_id: string;
  course: {
    title: string;
    slug: string;
    thumbnail: string | null;
    price: number;
    is_free: boolean;
  };
  created_at: Date;
}
