import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { SignupInput } from "../types/auth.types.js";
import { LoginInput } from "../types/auth.types.js";



const JWT_SECRET: string = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

export async function signupUser(input: SignupInput) {
  const { fullName, email, password } = input;

  const normalizedEmail = email.toLowerCase().trim();

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingProfile) {
    throw new Error("Email already exists");
  }

  

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      full_name: fullName,
      email: normalizedEmail,
      preferred_currency: "NGN",
    })
    .select("id, email, full_name, preferred_currency, created_at")
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: credentialError } = await supabase
    .from("auth_credentials")
    .insert({
      user_id: profile.id,
      password_hash: passwordHash,
    });

  if (credentialError) {
    throw new Error(credentialError.message);
  }

  const token = jwt.sign(
    {
      userId: profile.id,
      email: profile.email,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions
  );

  return {
    user: profile,
    token,
  };
}

export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  const normalizedEmail = email.toLowerCase().trim();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, preferred_currency, created_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    throw new Error("Invalid email or password");
  }

  const { data: credentials, error: credentialsError } = await supabase
    .from("auth_credentials")
    .select("password_hash")
    .eq("user_id", profile.id)
    .single();

  if (credentialsError) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    credentials.password_hash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      userId: profile.id,
      email: profile.email,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );

  return {
    user: profile,
    token,
  };
}