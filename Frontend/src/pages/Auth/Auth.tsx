import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login, signup } from "../../services/auth.service";
import { AuthForm } from "./AuthForm";
import { LeftPanel } from "./leftPanel";
import axios from "axios";

type AuthMode = "login" | "signup";

export default function Auth() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isLogin = mode === "login";

  const authMutation = useMutation({
    mutationFn: () => {
      if (isLogin) {
        return login({ email, password });
      }

      return signup({
        fullName,
        email,
        password,
      });
    },
    onSuccess: () => {
      navigate("/dashboard");
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    authMutation.mutate();
  }

  function toggleMode() {
    setMode(isLogin ? "signup" : "login");
    setFullName("");
    setEmail("");
    setPassword("");
  }
  let errorMessage = "";

if (authMutation.isError) {
  if (axios.isAxiosError(authMutation.error)) {
    errorMessage =
      authMutation.error.response?.data?.message ||
      "Something went wrong. Please try again.";
  } else {
    errorMessage = "Something went wrong. Please try again.";
  }
}

  return (
  <div className="flex h-screen">
    <LeftPanel mode={mode} />

    <AuthForm
      mode={mode}
      fullName={fullName}
      email={email}
      password={password}
      isPending={authMutation.isPending}
      errorMessage={errorMessage}
      onFullNameChange={setFullName}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onToggleMode={toggleMode}
    />
  </div>
);
}