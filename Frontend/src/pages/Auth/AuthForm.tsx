import { Input } from "../../components/ui/input";
import { SocialButtons } from "./socialButton";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  fullName: string;
  email: string;
  password: string;
  isPending: boolean;
  errorMessage: string;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleMode: () => void;
};

export function AuthForm({
  mode,
  fullName,
  email,
  password,
  isPending,
  errorMessage,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
}: AuthFormProps) {
  const isLogin = mode === "login";
  const passwordRequirements = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className={`flex  w-full flex-1 justify-center bg-white px-5 py-6 sm:px-8 lg:flex-[0.35] lg:px-10 ${isLogin ? "items-center" : "items-center pt-5"}`}>
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#17352F]">
          {isLogin ? "Welcome back" : "Create account"}
        </h1>

        <p className="mt-2 text-xs text-gray-500">
          {isLogin
            ? "Sign in to continue managing your portfolio."
            : "Create your VaultTrack account and start tracking your assets."}
        </p>

        <div className="mt-2 space-y-1">
          {!isLogin && (
            <Input
              label="Full name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={onFullNameChange}
              required
            />
          )}

          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={onEmailChange}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={onPasswordChange}
            required
          />
          {!isLogin && (
            <div className="space-y-0.2 rounded-lg bg-gray-50 p-2.5">
              {passwordRequirements.map((requirement) => (
                <p
                  key={requirement.label}
                  className={`text-xs ${
                    requirement.valid ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {requirement.valid ? "✓" : "•"} {requirement.label}
                </p>
              ))}
            </div>
          )}

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </button>
        </div>

       {/* <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <SocialButtons />*/}

        <p className="mt-5 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-semibold text-[#22C55E]"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>
      </form>
    </div>
  );
}