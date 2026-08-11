import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login, signup } from "../../services/auth.service";
import { AuthForm } from "./AuthForm";
import { LeftPanel } from "./leftPanel";
import axios from "axios";
import { useToast } from "../../context/toastContext";

type AuthMode = "login" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("")

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
    onError: (error) => {
      console.error("[auth] Full error object:", error);

      let message = "Something went wrong. Please try again.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The server was reached and responded, just with an error status
          console.error(
            "[auth] Server responded with error:",
            error.response.status,
            error.response.data
          );
          message =
            error.response.data?.message || `Request failed (${error.response.status})`;
        } else if (error.request) {
          // Request was sent but no response ever came back — usually
          // means CORS blocked it, the backend crashed, or the URL is wrong.
          console.error("[auth] No response received:", error.message);
          message = "Could not reach the server. Check your connection and try again.";
        } else {
          console.error("[auth] Error setting up the request:", error.message);
        }
      }

      showToast(message, "error");
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
    setConfirmPassword("");
  }
 



  return (
  <div className="flex bg-white  h-screen">
    <LeftPanel mode={mode} />

    <AuthForm
      mode={mode}
      fullName={fullName}
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      isPending={authMutation.isPending}
      onFullNameChange={setFullName}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
      onToggleMode={toggleMode}
    />
  </div>
);
}