import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Toast } from "../../components/ui/errorToast";
import { SocialButtons } from "./socialButton";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  isPending: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleMode: () => void;
};

export function AuthForm({
  mode,
  fullName,
  email,
  password,
  confirmPassword,
  isPending,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onToggleMode,
}: AuthFormProps) {
  const isLogin = mode === "login";
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRequirements = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const allRequirementsMet = passwordRequirements.every((r) => r.valid);
  const showRequirements =
    !isLogin && (passwordFocused || password.length > 0);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const showMismatch = !isLogin && confirmPassword.length > 0 && !passwordsMatch;

  const isFormValid = isLogin
    ? isEmailValid && password.length > 0
    : isEmailValid &&
      fullName.trim().length > 0 &&
      allRequirementsMet &&
      confirmPassword.length > 0 &&
      password === confirmPassword;

  return (
    <div className={`flex w-full flex-1 items-center justify-center bg-white px-5 py-6 sm:px-8 lg:flex-[0.35] lg:px-10 ${!isLogin ? "pt-5" : ""}`}>
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-primary">
          {isLogin ? "Welcome back" : "Create account"}
        </h1>

        <p className="mt-2 text-xs text-gray-500">
          {isLogin
            ? "Sign in to continue managing your portfolio."
            : "Create your VaultTrack account and start tracking your assets."}
        </p>

        <div className="mt-2 space-y-1">
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: !isLogin ? "1fr" : "0fr" }}
            aria-hidden={isLogin}
          >
            <div className="overflow-hidden">
              <Input
                label="Full name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={onFullNameChange}
                required={!isLogin}
                tabIndex={isLogin ? -1 : 0}
              />
            </div>
          </div>

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
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            required
          />
           {isLogin && (
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-accent-secondary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {!isLogin && (
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: showRequirements ? "1fr" : "0fr" }}
              aria-hidden={!showRequirements}
            >
              <div className="overflow-hidden">
                {allRequirementsMet ? (
                  <p className="flex items-center gap-1 pt-1 text-xs font-medium text-success">
                    ✓ Strong password
                  </p>
                ) : (
                  <div className="space-y-0.5 rounded-lg bg-gray-50 p-2.5">
                    {passwordRequirements.map((requirement) => (
                      <p
                        key={requirement.label}
                        className={`text-xs ${
                          requirement.valid ? "text-success" : "text-gray-400"
                        }`}
                      >
                        {requirement.valid ? "✓" : "•"} {requirement.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLogin && (
            <>
              <Input
                label="Confirm password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={onConfirmPasswordChange}
                required
              />
              {showMismatch && (
                <p className="text-xs text-danger">Passwords do not match</p>
              )}
            </>
          )}
          <button
            type="submit"
            disabled={isPending || !isFormValid}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="font-semibold text-accent-secondary"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>
      </form>
    </div>
  );
}