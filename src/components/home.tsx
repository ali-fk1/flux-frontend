import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  User,
  LogOut,
  Check,
  X as XIcon,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { sendCredentials, BASE_URL } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength calculation
interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = "Very Weak";
  let color = "bg-red-500";

  if (score === 5) {
    label = "Very Strong";
    color = "bg-green-500";
  } else if (score === 4) {
    label = "Strong";
    color = "bg-blue-500";
  } else if (score === 3) {
    label = "Medium";
    color = "bg-yellow-500";
  } else if (score === 2) {
    label = "Weak";
    color = "bg-orange-500";
  }

  return { score, label, color, requirements };
};

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isLoading: authLoading, checkAuth } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  const [activeTab, setActiveTab] = useState("login");
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very Weak",
    color: "bg-red-500",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");

    // Validate email on change
    if (field === "email") {
      if (value && !isValidEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }

    // Calculate password strength on change
    if (field === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleRegister = async () => {
    // Validate email
    if (!isValidEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Validate password strength
    if (passwordStrength.score < 3) {
      setError("Password is too weak. Please use a stronger password.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await sendCredentials(
        formData.email,
        formData.password,
        `${BASE_URL}/signup`,  // Updated to match backend URL structure
      );

      // If the call succeeds we proceed to the verification step
      setIsVerificationStep(true);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${BASE_URL}/verify`, {
        method: "POST",
        // Note: /verify is a public endpoint, so we don't send credentials
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
        }),
      });

      if (response.ok) {
        // Verification successful - backend sets cookies
        // Check auth state to update user info
        await checkAuth();
        setIsLoginOpen(false);
        setIsVerificationStep(false);
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          verificationCode: "",
        });
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const resetModal = () => {
    setIsVerificationStep(false);
    setActiveTab("login");
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      verificationCode: "",
    });
    setError("");
    setEmailError("");
    setPasswordStrength({
      score: 0,
      label: "Very Weak",
      color: "bg-red-500",
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
    });
  };

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description:
        "Schedule posts across multiple platforms with optimal timing",
    },
    {
      icon: Users,
      title: "Multi-Platform",
      description: "Manage Twitter, Facebook, and Instagram from one dashboard",
    },
    {
      icon: Zap,
      title: "Workflow Canvas",
      description: "Visual drag-and-drop interface for managing your content",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Flux
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`}
                      alt={user?.email || "User"}
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Login
                </Button>
              </Link>
              <Button
                size="lg"
                onClick={() => {
                  resetModal();
                  setActiveTab("signup");
                  setIsLoginOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent animate-fade-in">
            Social Media
            <br />
            <span className="text-blue-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Schedule, manage, and optimize your social media presence across
            multiple platforms with our intuitive workflow canvas.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm hover:bg-blue-100 transition-colors"
            >
              🚀 Multi-Platform
            </Badge>
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm hover:bg-purple-100 transition-colors"
            >
              📅 Smart Scheduling
            </Badge>
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm hover:bg-pink-100 transition-colors"
            >
              🎨 Visual Workflow
            </Badge>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Powerful Features
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Everything you need to manage your social media presence
              effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center group hover:scale-105 transition-transform duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of creators and businesses who trust Flux to manage
            their social media presence.
          </p>
          <Button
            size="lg"
            onClick={() => {
              resetModal();
              setActiveTab("signup");
              setIsLoginOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group px-8 py-4 text-lg"
          >
            Start Scheduling Posts
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </main>

      {/* Login/Signup Modal */}
      <Dialog
        open={isLoginOpen}
        onOpenChange={(open) => {
          setIsLoginOpen(open);
          if (!open) resetModal();
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isVerificationStep ? "Verify Your Email" : "Create Your Account"}
            </DialogTitle>
          </DialogHeader>

          {isVerificationStep ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                We've sent a verification email to {formData.email}. Please check your inbox and click the verification link to activate your account.
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                onClick={() => {
                  setIsLoginOpen(false);
                  resetModal();
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={emailError ? "border-red-500" : ""}
                />
                {emailError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                  />
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Password Strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score >= 4 ? "text-green-600" :
                          passwordStrength.score === 3 ? "text-blue-600" :
                          passwordStrength.score === 2 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      
                      {/* Strength bars */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <div
                            key={bar}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              bar <= passwordStrength.score
                                ? passwordStrength.color
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Requirements checklist */}
                      <div className="space-y-1 pt-2">
                        <p className="text-xs font-medium text-gray-700">Requirements:</p>
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex items-center gap-1 text-xs">
                            {passwordStrength.requirements.length ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <XIcon className="h-3 w-3 text-gray-400" />
                            )}
                            <span className={passwordStrength.requirements.length ? "text-green-600" : "text-gray-500"}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {passwordStrength.requirements.uppercase ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <XIcon className="h-3 w-3 text-gray-400" />
                            )}
                            <span className={passwordStrength.requirements.uppercase ? "text-green-600" : "text-gray-500"}>
                              One uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {passwordStrength.requirements.lowercase ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <XIcon className="h-3 w-3 text-gray-400" />
                            )}
                            <span className={passwordStrength.requirements.lowercase ? "text-green-600" : "text-gray-500"}>
                              One lowercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {passwordStrength.requirements.number ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <XIcon className="h-3 w-3 text-gray-400" />
                            )}
                            <span className={passwordStrength.requirements.number ? "text-green-600" : "text-gray-500"}>
                              One number
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {passwordStrength.requirements.special ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <XIcon className="h-3 w-3 text-gray-400" />
                            )}
                            <span className={passwordStrength.requirements.special ? "text-green-600" : "text-gray-500"}>
                              One special character (!@#$%^&*)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={
                      formData.confirmPassword && 
                      formData.password !== formData.confirmPassword
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formData.confirmPassword && 
                   formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Passwords do not match
                    </p>
                  )}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button
                  onClick={handleRegister}
                  disabled={
                    isLoading ||
                    !formData.email ||
                    !formData.password ||
                    !formData.confirmPassword ||
                    !!emailError ||
                    passwordStrength.score < 3 ||
                    formData.password !== formData.confirmPassword
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? "Registering..." : "Create Account"}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    onClick={() => setIsLoginOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Home;