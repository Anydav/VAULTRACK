export function validatePassword(password: string) {
  const requirements = [
    {
      valid: password.length >= 8,
      message: "Password must be at least 8 characters long",
    },
    {
      valid: /[A-Z]/.test(password),
      message: "Password must contain at least one uppercase letter",
    },
    {
      valid: /[a-z]/.test(password),
      message: "Password must contain at least one lowercase letter",
    },
    {
      valid: /[0-9]/.test(password),
      message: "Password must contain at least one number",
    },
    {
      valid: /[^A-Za-z0-9]/.test(password),
      message: "Password must contain at least one special character",
    },
  ];

  const failedRequirement = requirements.find((requirement) => !requirement.valid);

  return {
    isValid: !failedRequirement,
    message: failedRequirement?.message,
  };
}