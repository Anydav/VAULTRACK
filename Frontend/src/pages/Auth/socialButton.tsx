import GoogleIcon from "../../assets/google.png";
import AppleIcon from "../../assets/apple.png";

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-1 rounded-xl border border-gray-300 bg-white px-4 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <img
          src={GoogleIcon}
          alt="Google"
          className="h-5 w-6 object-contain"
        />
        <span>Sign in with Google</span>
      </button>

      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <img
          src={AppleIcon}
          alt="Apple"
          className="h-5 w-5 object-contain"
        />
        <span>Sign in with Apple</span>
      </button>
    </div>
  );
}