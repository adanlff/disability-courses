"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Loader2,
  CheckCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  EyeOff,
  Trophy,
  MessageSquare,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CourseReviewFormProps {
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
  onReviewSubmitted?: () => void;
}

interface ExistingReview {
  id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
}

export default function CourseReviewForm({
  courseId,
  courseTitle,
  isCompleted,
  onReviewSubmitted,
}: CourseReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null);
  const [checkingReview, setCheckingReview] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Check if user already reviewed
  useEffect(() => {
    const checkExistingReview = async () => {
      try {
        setCheckingReview(true);
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`/api/courses/${courseId}/reviews?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          // Get current user id from token
          const userResponse = await fetch(`/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const userId = userData.user?.id || userData.id;
            
            // Find user's review
            const userReview = data.reviews?.find((r: { user: { id: string } }) => r.user.id === userId);
            if (userReview) {
              setExistingReview(userReview);
              setRating(userReview.rating);
              setComment(userReview.comment || "");
              setIsAnonymous(userReview.is_anonymous);
            }
          }
        }
      } catch (err) {
        console.error("Error checking existing review:", err);
      } finally {
        setCheckingReview(false);
      }
    };

    if (courseId) {
      checkExistingReview();
    }
  }, [courseId, getAuthToken]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Silakan berikan rating terlebih dahulu");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      const url = existingReview 
        ? `/api/users/reviews/${existingReview.id}`
        : `/api/courses/${courseId}/reviews`;
      
      const method = existingReview ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment || null,
          is_anonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan review");
      }

      const data = await response.json();
      setExistingReview(data.review);
      setSuccess(true);
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan review");
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "Sangat Buruk";
      case 2: return "Buruk";
      case 3: return "Cukup";
      case 4: return "Baik";
      case 5: return "Sangat Baik";
      default: return "";
    }
  };

  if (checkingReview) {
    return (
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#005EB8]" />
            <span className="text-gray-600 dark:text-gray-400">Memuat review...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show encouragement if course is not completed
  if (!isCompleted) {
    return (
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#005EB8]/10">
              <Trophy className="h-6 w-6 text-[#005EB8]" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Selesaikan Kursus</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selesaikan semua materi kursus untuk dapat memberikan rating dan review.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <MessageSquare className="h-5 w-5 text-[#005EB8]" />
          {existingReview ? "Update Review Anda" : "Berikan Review"}
        </CardTitle>
        <CardDescription>
          Bagikan pengalaman Anda mengikuti kursus <span className="font-medium">{courseTitle}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-[#008A00] dark:text-[#008A00] rounded-lg border border-[#008A00]/20 dark:border-[#008A00]/30">
            <CheckCircle className="h-5 w-5 text-[#008A00]" />
            <span>Review Anda berhasil {existingReview ? "diperbarui" : "disimpan"}!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-[#D93025] dark:text-[#D93025] rounded-lg border border-[#D93025]/20 dark:border-[#D93025]/30">
            <span>{error}</span>
          </div>
        )}

        {/* Rating Stars */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Rating Anda <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "text-[#F4B400] fill-[#F4B400]"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoveredRating || rating) > 0 && (
              <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none font-medium">
                {getRatingLabel(hoveredRating || rating)}
              </Badge>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Komentar (Opsional)
          </Label>
          <Textarea
            placeholder="Bagikan pengalaman Anda tentang kursus ini..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
            {comment.length}/1000 karakter
          </p>
        </div>

        {/* Anonymous Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <EyeOff className="h-5 w-5 text-gray-500" />
            <div>
              <Label className="font-medium text-gray-900 dark:text-white">Review Anonim</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nama Anda tidak akan ditampilkan</p>
            </div>
          </div>
          <Switch
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
        </div>

        {/* Helpful Info */}
        {existingReview && existingReview.helpful_count > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <ThumbsUp className="h-4 w-4 text-[#008A00]" />
            <span>{existingReview.helpful_count} orang merasa review Anda membantu</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="w-full bg-[#005EB8] hover:bg-[#004A93] text-white font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {existingReview ? "Update Review" : "Kirim Review"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}