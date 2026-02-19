import React, { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface ResetPasswordPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSubmit?: (password: string) => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <Card className="rounded-lg border bg-card/5 text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 backdrop-blur-sm focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    <CardContent className="p-0">
      {children}
    </CardContent>
  </Card>
);

const PasswordInput = ({
  name,
  placeholder,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
}: {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
}) => (
  <div className="relative">
    <input
      name={name}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none"
      required
    />
    <button
      type="button"
      onClick={onToggleVisibility}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
    >
      {showPassword ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>
  </div>
);

const TestimonialCard = ({
  testimonial,
  delay,
}: {
  testimonial: Testimonial;
  delay: string;
}) => (
  <Card className={`animate-testimonial ${delay} rounded-lg border bg-card/40 text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-xl border-white/10 w-64`}>
    <CardContent className="p-5">
      <div className="flex items-start gap-3">
        <img
          src={testimonial.avatarSrc}
          className="h-10 w-10 object-cover rounded-lg"
          alt="avatar"
        />
        <div className="text-sm leading-snug">
          <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
          <p className="text-muted-foreground">{testimonial.handle}</p>
          <p className="mt-1 text-foreground/80">{testimonial.text}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ValidationMessage = ({
  message,
  type = "error",
}: {
  message: string;
  type?: "error" | "info";
}) => (
  <p
    className={`text-xs mt-1 ${
      type === "error" ? "text-red-500" : "text-blue-500"
    } flex items-center gap-1`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        type === "error" ? "bg-red-500" : "bg-blue-500"
      }`}
    ></span>
    {message}
  </p>
);

// --- VALIDATION UTILS ---

const validatePassword = (password: string): string => {
  if (!password) return "Password harus diisi.";

  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Minimal 8 karakter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("huruf kapital");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("huruf kecil");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("angka");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("simbol");
  }

  if (errors.length > 0) {
    return `Password tidak memenuhi kriteria (${errors.join(", ")}).`;
  }

  return "";
};

const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string => {
  if (!confirmPassword) return "Konfirmasi password harus diisi.";
  if (password !== confirmPassword) return "Konfirmasi password tidak cocok.";
  return "";
};

// --- MAIN COMPONENT ---

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  title = (
    <span className="font-light text-foreground tracking-tighter">
      Reset Password
    </span>
  ),
  description = "Masukkan password baru Anda",
  heroImageSrc,
  testimonials = [],
  onSubmit,
  onBackToLogin,
  isLoading = false,
  error = null,
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  const [validationErrors, setValidationErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  // Real-time validation on input change
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: keyof typeof touched) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      
      // Mark field as touched when user starts typing
      if (!touched[field]) {
        setTouched(prev => ({ ...prev, [field]: true }));
      }
    };
  };

  // Validate form on submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ password: true, confirmPassword: true });

    // Validate all fields
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

    setValidationErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    // If there are validation errors, don't submit
    if (passwordError || confirmPasswordError) {
      return;
    }

    // Submit the form with the new password
    onSubmit?.(password);
  };

  // Check if password meets all criteria for progress indicator
  const getPasswordStrength = () => {
    const criteria = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    ];
    return criteria.filter(Boolean).length;
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: reset password form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {title}
            </h1>

            <>
              <p className="animate-element animate-delay-200 text-muted-foreground">
                {description}
              </p>

              {/* Global Error Message */}
              {error && (
                <Card className="rounded-lg border bg-red-500/10 text-card-foreground shadow-sm border-red-500/20 animate-element animate-delay-250">
                  <CardContent className="p-4">
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  </CardContent>
                </Card>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">
                    Password Baru
                  </label>
                  <GlassInputWrapper>
                    <PasswordInput
                      name="password"
                      placeholder="Minimal 8 karakter dengan huruf kapital, huruf kecil, angka, dan simbol"
                      value={password}
                      onChange={handleInputChange(setPassword, "password")}
                      showPassword={showPassword}
                      onToggleVisibility={() =>
                        setShowPassword(!showPassword)
                      }
                    />
                  </GlassInputWrapper>

                  {/* Password strength indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">
                          Kekuatan password:
                        </span>
                        <span className="text-xs font-medium">
                          {getPasswordStrength()}/5 kriteria terpenuhi
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            getPasswordStrength() === 5
                              ? "bg-green-500"
                              : getPasswordStrength() === 4
                              ? "bg-yellow-500"
                              : getPasswordStrength() === 3
                              ? "bg-orange-500"
                              : getPasswordStrength() === 2
                              ? "bg-orange-400"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${(getPasswordStrength() / 5) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {touched.password && validationErrors.password && (
                    <ValidationMessage
                      message={validationErrors.password}
                      type="error"
                    />
                  )}
                </div>

                <div className="animate-element animate-delay-400">
                  <label className="text-sm font-medium text-muted-foreground">
                    Konfirmasi Password Baru
                  </label>
                  <GlassInputWrapper>
                    <PasswordInput
                      name="confirmPassword"
                      placeholder="Konfirmasi password baru"
                      value={confirmPassword}
                      onChange={handleInputChange(setConfirmPassword, "confirmPassword")}
                      showPassword={showConfirmPassword}
                      onToggleVisibility={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />
                  </GlassInputWrapper>
                  {touched.confirmPassword && validationErrors.confirmPassword && (
                    <ValidationMessage
                      message={validationErrors.confirmPassword}
                      type="error"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="animate-element animate-delay-500 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengatur Ulang...
                    </>
                  ) : (
                    "Atur Ulang Password"
                  )}
                </button>

                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="animate-element animate-delay-600 w-full flex items-center justify-center gap-2 border border-border rounded-lg py-4 hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Login
                </button>
              </form>
            </>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard
                testimonial={testimonials[0]}
                delay="animate-delay-1000"
              />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[1]}
                    delay="animate-delay-1200"
                  />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[2]}
                    delay="animate-delay-1400"
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};