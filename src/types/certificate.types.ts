// Certificate Types
import { CertificateStatus } from '@prisma/client';

// Certificate data
export interface CertificateData {
  id: string;
  user_id: string;
  enrollment_id: string;
  certificate_number: string;
  issued_at: Date;
  valid_until: Date | null;
  status: CertificateStatus;
  file_url: string | null;
}

// Certificate with relations
export interface CertificateWithRelations extends CertificateData {
  user: {
    full_name: string;
    email: string;
  };
  enrollment: {
    course: {
      title: string;
      thumbnail: string | null;
    };
  };
}

// Certificate generation request
export interface GenerateCertificateRequest {
  enrollment_id: string;
}

// Certificate verification
export interface CertificateVerification {
  valid: boolean;
  certificate?: CertificateWithRelations;
  message?: string;
}

// Certificate template data
export interface CertificateTemplateData {
  student_name: string;
  course_title: string;
  mentor_name: string;
  completion_date: string;
  certificate_number: string;
  valid_until?: string;
}

// Certificate download options
export interface CertificateDownloadOptions {
  format: 'pdf' | 'png';
  size?: 'A4' | 'letter';
}

// Certificate list item
export interface CertificateListItem {
  id: string;
  certificate_number: string;
  course_title: string;
  issued_at: Date;
  status: CertificateStatus;
  file_url: string | null;
}
