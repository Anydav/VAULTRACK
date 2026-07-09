import LoginImage from "../../assets/loginback.png";
import SignupImage from "../../assets/signupback.png";

type LeftPanelProps = {
  mode: "login" | "signup";
};

export function LeftPanel({ mode }: LeftPanelProps) {
  const image = mode === "login" ? LoginImage : SignupImage;

  return (
    <div className="hidden  overflow-hidden bg-[#F8FAFC] lg:flex lg:flex-[0.65]">
      <img
        src={image}
        alt={mode === "login" ? "Login illustration" : "Signup illustration"}
        className="h-full  w-full object-cover"
      />
    </div>
  );
}