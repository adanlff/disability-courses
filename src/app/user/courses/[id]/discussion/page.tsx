"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  MessageSquare,
  Send,
  Calendar,
  Search,
  Loader2,
  Reply,
  User as UserIcon,
  BookOpen,
  Sparkles,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import { useParams } from "next/navigation";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user: User;
  parent_id: string | null;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

interface Course {
  id: string;
  title: string;
  mentor: {
    id: string;
    user: User;
  };
}

export default function CourseDiscussion() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Get current user from token
  const getCurrentUser = useCallback(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }, []);

  // Fetch course and comments
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!courseResponse.ok) {
        throw new Error("Gagal mengambil data kursus");
      }

      const courseResult = await courseResponse.json();
      setCourse(courseResult.data || courseResult.course || courseResult);

      // Fetch comments for this course
      const commentsResponse = await fetch(
        `/api/courses/${courseId}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (commentsResponse.ok) {
        const commentsResult = await commentsResponse.json();
        setComments(commentsResult.comments || commentsResult.data || []);
      } else {
        setComments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [courseId, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter comments by search term
  const filteredComments = comments.filter(
    (comment) =>
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Post new comment
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSubmitting(true);
      const token = getAuthToken();

      const response = await fetch(`/api/courses/${courseId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim komentar");
      }

      const result = await response.json();
      const newComment = result.comment || result.data;

      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
      }

      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim komentar");
    } finally {
      setSubmitting(false);
    }
  };

  // Post reply
  const handleSendReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const token = getAuthToken();

      const response = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          parent_id: parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim balasan");
      }

      const result = await response.json();
      const newReply = result.comment || result.data;

      if (newReply) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              };
            }
            return comment;
          })
        );
      }

      setReplyContent("");
      setReplyingTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim balasan");
    } finally {
      setSubmitting(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
    return date.toLocaleDateString("id-ID");
  };

  // Check if user is mentor
  const isMentor = (userId: string) => {
    return course?.mentor?.user?.id === userId;
  };

  const currentUser = getCurrentUser();

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat diskusi...</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/user/courses/${courseId}/player`}>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                  <MessageSquare className="h-8 w-8 text-[#005EB8]" />
                  Diskusi Kursus
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{course?.title || "Memuat..."}</p>
              </div>
            </div>
            <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none text-sm px-3 py-1 mx-auto md:mx-0">
              {comments.length} Diskusi
            </Badge>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Discussion List - Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Cari dalam diskusi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* New Message Input */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Send className="h-5 w-5 text-[#005EB8]" />
                    Tulis Pertanyaan
                  </CardTitle>
                  <CardDescription>Ajukan pertanyaan atau mulai diskusi baru</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {currentUser?.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.full_name}
                          className="w-10 h-10 rounded-full border-2 border-[#005EB8]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#005EB8]/10 flex items-center justify-center border-2 border-[#005EB8]">
                          <UserIcon className="h-5 w-5 text-[#005EB8]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Textarea
                        placeholder="Ketik pertanyaan atau komentar Anda..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="resize-none border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                        rows={4}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {newMessage.length} karakter
                        </p>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || submitting}
                          className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Kirim Pertanyaan
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Discussion Threads */}
              <div className="space-y-4">
                {filteredComments.length === 0 ? (
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                    <CardContent className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <MessageSquare className="h-10 w-10 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {searchTerm ? "Diskusi tidak ditemukan" : "Belum ada diskusi"}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {searchTerm ? "Coba ubah kata kunci pencarian Anda" : "Jadilah yang pertama memulai diskusi!"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredComments.map((comment) => (
                    <Card
                      key={comment.id}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {comment.user.avatar_url ? (
                              <img
                                src={comment.user.avatar_url}
                                alt={comment.user.full_name}
                                className={`w-10 h-10 rounded-full border-2 ${isMentor(comment.user.id) ? 'border-[#008A00]' : 'border-[#005EB8]'}`}
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isMentor(comment.user.id) ? 'bg-[#008A00]/10 border-[#008A00]' : 'bg-[#005EB8]/10 border-[#005EB8]'}`}>
                                <UserIcon className={`h-5 w-5 ${isMentor(comment.user.id) ? 'text-[#008A00]' : 'text-[#005EB8]'}`} />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                {comment.user.full_name}
                              </h3>
                              <Badge className={`pointer-events-none text-xs ${
                                isMentor(comment.user.id)
                                  ? "bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20"
                                  : "bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20"
                              }`}>
                                {isMentor(comment.user.id) ? "Mentor" : "Student"}
                              </Badge>
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatTimeAgo(comment.created_at)}
                              </span>
                              {comment.is_edited && (
                                <span className="text-xs text-gray-400">(diedit)</span>
                              )}
                            </div>

                            <div className="text-gray-700 dark:text-gray-300 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 whitespace-pre-wrap">
                              {comment.content}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReplyingTo(comment.id)}
                                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                              >
                                <Reply className="h-4 w-4 mr-1" />
                                Balas
                              </Button>
                              {comment.replies && comment.replies.length > 0 && (
                                <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 pointer-events-none">
                                  {comment.replies.length} balasan
                                </Badge>
                              )}
                            </div>

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                              <Card className="mt-4 border-[#005EB8]/20 bg-[#005EB8]/5">
                                <CardContent className="p-4">
                                  <Textarea
                                    placeholder="Tulis balasan..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="mb-3 resize-none border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSendReply(comment.id)}
                                      disabled={!replyContent.trim() || submitting}
                                      size="sm"
                                      className="bg-[#005EB8] hover:bg-[#004A93] text-white"
                                    >
                                      {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Send className="h-4 w-4 mr-1" />
                                          Kirim Balasan
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent("");
                                      }}
                                      className="border-gray-300 dark:border-gray-600"
                                    >
                                      Batal
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4 space-y-3 pl-4 border-l-2 border-[#005EB8]/20">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                                    <div className="flex gap-3">
                                      {reply.user.avatar_url ? (
                                        <img
                                          src={reply.user.avatar_url}
                                          alt={reply.user.full_name}
                                          className={`w-8 h-8 rounded-full flex-shrink-0 border-2 ${isMentor(reply.user.id) ? 'border-[#008A00]' : 'border-[#005EB8]'}`}
                                        />
                                      ) : (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${isMentor(reply.user.id) ? 'bg-[#008A00]/10 border-[#008A00]' : 'bg-[#005EB8]/10 border-[#005EB8]'}`}>
                                          <UserIcon className={`h-4 w-4 ${isMentor(reply.user.id) ? 'text-[#008A00]' : 'text-[#005EB8]'}`} />
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {reply.user.full_name}
                                          </h4>
                                          <Badge className={`pointer-events-none text-xs ${
                                            isMentor(reply.user.id)
                                              ? "bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20"
                                              : "bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20"
                                          }`}>
                                            {isMentor(reply.user.id) ? "Mentor" : "Student"}
                                          </Badge>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatTimeAgo(reply.created_at)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                          {reply.content}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Mentor Card */}
              {course?.mentor && (
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <UserIcon className="h-5 w-5 text-[#005EB8]" />
                      Mentor Kursus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center">
                      {course.mentor.user.avatar_url ? (
                        <img
                          src={course.mentor.user.avatar_url}
                          alt={course.mentor.user.full_name}
                          className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-[#008A00]"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#008A00]/10 flex items-center justify-center mx-auto mb-4 border-4 border-[#008A00]">
                          <UserIcon className="h-10 w-10 text-[#008A00]" />
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {course.mentor.user.full_name}
                      </h3>
                      <Badge className="bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mentor
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips Card */}
              <Card className="rounded-lg border bg-gradient-to-br from-[#005EB8]/5 to-[#005EB8]/10 border-[#005EB8]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-bold">
                    <HelpCircle className="h-5 w-5 text-[#005EB8]" />
                    Tips Bertanya
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#005EB8] mt-2 flex-shrink-0"></div>
                      <span>Jelaskan masalah dengan spesifik dan sertakan kode jika perlu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#005EB8] mt-2 flex-shrink-0"></div>
                      <span>Sebutkan materi atau video yang terkait dengan pertanyaan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#005EB8] mt-2 flex-shrink-0"></div>
                      <span>Sebutkan langkah-langkah yang sudah dicoba</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#005EB8] mt-2 flex-shrink-0"></div>
                      <span>Bersikap sopan dan menghargai jawaban dari mentor</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Course Link Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-[#005EB8]/10">
                      <BookOpen className="h-6 w-6 text-[#005EB8]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Kursus</p>
                      <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{course?.title}</p>
                    </div>
                  </div>
                  <Link href={`/user/courses/${courseId}/player`}>
                    <Button 
                      variant="outline" 
                      className="w-full border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                    >
                      Kembali ke Kelas
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom CTA Card */}
          <Card className="rounded-lg border bg-gradient-to-r from-[#005EB8] to-[#004A93] text-white shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                    <Sparkles className="h-5 w-5 text-white" />
                    <h3 className="text-2xl font-bold text-white">
                      Butuh Bantuan Lebih?
                    </h3>
                  </div>
                  <p className="text-white/90">
                    Jelajahi materi kursus atau hubungi mentor untuk bantuan langsung
                  </p>
                </div>
                <Link href={`/user/courses/${courseId}/player`}>
                  <Button
                    size="lg"
                    className="bg-white text-[#005EB8] hover:bg-gray-100 font-semibold"
                  >
                    Lanjutkan Belajar
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}