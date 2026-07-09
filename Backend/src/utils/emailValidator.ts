export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return {
    isValid: emailRegex.test(email),
    message: "Please enter a valid email address",
  };
}