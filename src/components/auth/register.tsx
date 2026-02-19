import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export enum DisabilityType {
  BUTA_WARNA = "BUTA_WARNA",
  DISLEKSIA = "DISLEKSIA",
  KOGNITIF = "KOGNITIF",
  LOW_VISION = "LOW_VISION",
  MENTOR = "MENTOR",
  MOTORIK = "MOTORIK",
  TUNARUNGU = "TUNARUNGU",
}

export enum UserRole {
  STUDENT = "STUDENT",
  MENTOR = "MENTOR",
}

interface RegisterPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onRegister?: (formData: RegisterFormData) => void;
  onLogin?: () => void;
  isLoading?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string; // Changed from 'name' to 'full_name'
  disability_type: DisabilityType;
}

// --- VALIDATION UTILS ---
const validateFullName = (fullName: string): string => {
  if (!fullName.trim()) return "Nama lengkap harus diisi.";
  const regex = /^[a-zA-Z\s]*$/;
  if (!regex.test(fullName)) return "Nama tidak boleh mengandung simbol atau angka";
  return "";
};

const validateEmail = (email: string): string => {
  if (!email.trim()) return "Email harus diisi.";
  const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!regex.test(email)) return "Email tidak valid. Harus menggunakan domain @gmail.com";
  return "";
};

const validateDisabilityType = (type: string): string => {
  if (!type) return "Jenis pengguna harus dipilih.";
  return "";
};

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

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <Card className="rounded-lg border bg-card/5 text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 backdrop-blur-sm focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    <CardContent className="p-0">
      {children}
    </CardContent>
  </Card>
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
  message: string | string[];
  type?: "error" | "info";
}) => {
  if (Array.isArray(message)) {
    return (
      <div
        className={`mt-1 space-y-1 ${
          type === "error" ? "text-red-500" : "text-blue-500"
        }`}
      >
        {message.map((msg, index) => (
          <p key={index} className="text-xs flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                type === "error" ? "bg-red-500" : "bg-blue-500"
              }`}
            ></span>
            {msg}
          </p>
        ))}
      </div>
    );
  }

  return (
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
};

// --- MAIN COMPONENT ---

export const RegisterPage: React.FC<RegisterPageProps> = ({
  title = (
    <span className="font-light text-foreground tracking-tighter">
      Buat Akun Baru
    </span>
  ),
  description = "Daftar untuk memulai perjalanan pembelajaran Anda",
  heroImageSrc,
  testimonials = [],
  onRegister,
  onLogin,
  isLoading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "", // Changed from 'name' to 'full_name'
    email: "",
    disability_type: "" as DisabilityType,
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    full_name: "", // Changed from 'name' to 'full_name'
    email: "",
    disability_type: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    full_name: false, // Changed from 'name' to 'full_name'
    email: false,
    disability_type: false,
    password: false,
    confirmPassword: false,
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Update role based on disability type selection
  useEffect(() => {
    if (formData.disability_type === DisabilityType.MENTOR) {
      setSelectedRole(UserRole.MENTOR);
    } else {
      setSelectedRole(UserRole.STUDENT);
    }
  }, [formData.disability_type]);

  // Real-time validation on input change
  useEffect(() => {
    const validateForm = () => {
      const newErrors = {
        full_name: touched.full_name ? validateFullName(formData.full_name) : "", // Changed
        email: touched.email ? validateEmail(formData.email) : "",
        disability_type: touched.disability_type
          ? validateDisabilityType(formData.disability_type)
          : "",
        password: touched.password ? validatePassword(formData.password) : "",
        confirmPassword: touched.confirmPassword
          ? validateConfirmPassword(formData.password, formData.confirmPassword)
          : "",
      };
      setValidationErrors(newErrors);
    };

    validateForm();
  }, [formData, touched]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched when user starts typing
    if (!touched[name as keyof typeof touched]) {
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched to show all errors
    setTouched({
      full_name: true, // Changed
      email: true,
      disability_type: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields
    const fullNameError = validateFullName(formData.full_name); // Changed
    const emailError = validateEmail(formData.email);
    const disabilityError = validateDisabilityType(formData.disability_type);
    const passwordError = validatePassword(formData.password);
    const confirmError = validateConfirmPassword(
      formData.password,
      formData.confirmPassword
    );

    const newValidationErrors = {
      full_name: fullNameError, // Changed
      email: emailError,
      disability_type: disabilityError,
      password: passwordError,
      confirmPassword: confirmError,
    };

    setValidationErrors(newValidationErrors);

    // Check if there are any errors
    const hasErrors =
      fullNameError ||
      emailError ||
      disabilityError ||
      passwordError ||
      confirmError;

    if (hasErrors) {
      return;
    }

    // Prepare data for backend (role is determined by backend)
    const registerData: RegisterFormData = {
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name, // Changed from 'name' to 'full_name'
      disability_type: formData.disability_type,
    };

    // Call the onRegister callback with the formatted data
    onRegister?.(registerData);
  };

  // Check if password meets all criteria for progress indicator
  const getPasswordStrength = () => {
    const criteria = [
      formData.password.length >= 8,
      /[A-Z]/.test(formData.password),
      /[a-z]/.test(formData.password),
      /[0-9]/.test(formData.password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password),
    ];
    return criteria.filter(Boolean).length;
  };

  return (
    <div className="h-screen flex flex-col md:flex-row font-geist bg-background overflow-hidden">
      {/* Left column: register form */}
      <section className="flex-1 flex items-center justify-center p-0 md:p-8">
        <div 
          ref={formContainerRef}
          className="w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto"
        >
          <div className="w-full max-w-md mx-auto p-6 md:p-0">
            <div className="flex flex-col gap-6">
              <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
                {title}
              </h1>
              <p className="animate-element animate-delay-200 text-muted-foreground">
                {description}
              </p>

              {/* Role indicator */}
              <Card className="animate-element animate-delay-250 rounded-lg border bg-card/5 text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedRole === UserRole.MENTOR ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium">
                      {selectedRole === UserRole.MENTOR ? 'Anda mendaftar sebagai Mentor' : 'Anda mendaftar sebagai Siswa'}
                    </span>
                  </div>
                  {selectedRole === UserRole.MENTOR && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sebagai mentor, Anda akan dapat membuat kursus dan membimbing siswa
                    </p>
                  )}
                  {selectedRole === UserRole.STUDENT && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sebagai siswa, Anda akan dapat mengakses kursus dan materi pembelajaran
                    </p>
                  )}
                </CardContent>
              </Card>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Nama Lengkap */}
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">
                    Nama Lengkap
                  </label>
                  <GlassInputWrapper>
                    <input
                      name="full_name" // Changed from 'name' to 'full_name'
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none"
                      value={formData.full_name} // Changed
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("full_name")} // Changed
                      required
                    />
                  </GlassInputWrapper>
                  {touched.full_name && validationErrors.full_name && ( // Changed
                    <ValidationMessage
                      message={validationErrors.full_name} // Changed
                      type="error"
                    />
                  )}
                  {touched.full_name && !validationErrors.full_name && formData.full_name && ( // Changed
                    <ValidationMessage message="Nama valid" type="info" />
                  )}
                </div>

                {/* Email */}
                <div className="animate-element animate-delay-400">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <GlassInputWrapper>
                    <input
                      name="email"
                      type="email"
                      placeholder="nama@gmail.com"
                      className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("email")}
                      required
                    />
                  </GlassInputWrapper>
                  {touched.email && validationErrors.email && (
                    <ValidationMessage
                      message={validationErrors.email}
                      type="error"
                    />
                  )}
                  {touched.email && !validationErrors.email && formData.email && (
                    <ValidationMessage message="Format email valid" type="info" />
                  )}
                </div>

                {/* Jenis Pengguna */}
                <div className="animate-element animate-delay-500">
                  <label className="text-sm font-medium text-muted-foreground">
                    Jenis Pengguna
                  </label>
                  <GlassInputWrapper>
                    <select
                      name="disability_type"
                      className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none appearance-none"
                      value={formData.disability_type}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("disability_type")}
                      required
                    >
                      <option
                        value=""
                        disabled
                        className="bg-background text-foreground"
                      >
                        Pilih jenis pengguna
                      </option>
                      <option
                        value={DisabilityType.MENTOR}
                        className="bg-background text-foreground"
                      >
                        Mentor
                      </option>
                      <option
                        value="STUDENT"
                        className="bg-background text-foreground"
                      >
                        Siswa
                      </option>
                    </select>
                  </GlassInputWrapper>
                  {touched.disability_type &&
                    validationErrors.disability_type && (
                      <ValidationMessage
                        message={validationErrors.disability_type}
                        type="error"
                      />
                    )}
                  {touched.disability_type &&
                    !validationErrors.disability_type &&
                    formData.disability_type && (
                      <ValidationMessage
                        message={
                          formData.disability_type === DisabilityType.MENTOR
                            ? "Anda terdaftar sebagai Mentor"
                            : "Anda terdaftar sebagai Siswa"
                        }
                        type="info"
                      />
                    )}
                </div>

                {/* Password */}
                <div className="animate-element animate-delay-600">
                  <label className="text-sm font-medium text-muted-foreground">
                    Password
                  </label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter dengan huruf kapital, huruf kecil, angka, dan simbol"
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur("password")}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        ) : (
                          <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </button>
                    </div>
                  </GlassInputWrapper>

                  {/* Password strength indicator */}
                  {formData.password && (
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
                  {touched.password &&
                    !validationErrors.password &&
                    formData.password && (
                      <ValidationMessage
                        message="Password memenuhi semua kriteria"
                        type="info"
                      />
                    )}
                </div>

                {/* Konfirmasi Password */}
                <div className="animate-element animate-delay-700">
                  <label className="text-sm font-medium text-muted-foreground">
                    Konfirmasi Password
                  </label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Masukkan password kembali"
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur("confirmPassword")}
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        ) : (
                          <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </button>
                    </div>
                  </GlassInputWrapper>
                  {touched.confirmPassword &&
                    validationErrors.confirmPassword && (
                      <ValidationMessage
                        message={validationErrors.confirmPassword}
                        type="error"
                      />
                    )}
                  {touched.confirmPassword &&
                    !validationErrors.confirmPassword &&
                    formData.confirmPassword && (
                      <ValidationMessage message="Password cocok" type="info" />
                    )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="animate-element animate-delay-800 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mendaftar...
                    </>
                  ) : (
                    "Daftar"
                  )}
                </button>
              </form>

              <div className="animate-element animate-delay-900 relative flex items-center justify-center">
                <span className="w-full border-t border-border"></span>
                <span className="px-4 text-sm text-muted-foreground bg-background absolute">
                  Atau
                </span>
              </div>

              <p className="animate-element animate-delay-1000 text-center text-sm text-muted-foreground pb-8">
                Sudah punya akun?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onLogin?.();
                  }}
                  className="text-violet-400 hover:underline transition-colors"
                >
                  Masuk di sini
                </a>
              </p>
            </div>
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
                delay="animate-delay-1100"
              />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[1]}
                    delay="animate-delay-1300"
                  />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[2]}
                    delay="animate-delay-1500"
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