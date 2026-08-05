import { supabase } from "../config/supabase.js";

export interface ConversationMessage {
  id: string;
  question: string;
  answer: string;
}

interface MemoryContext {
  memory_summary: string;
  recent_messages: ConversationMessage[];
}

/**
 * Fetches everything needed to give the AI conversation context:
 * the rolling summary + the current unsummarized message window.
 */
export async function getMemoryContext(userId: string): Promise<MemoryContext> {
  const { data: memoryRow, error: memoryError } = await supabase
    .from("user_memory")
    .select("summary_text")
    .eq("user_id", userId)
    .maybeSingle();

  if (memoryError) {
    console.error("[conversation.service] Failed to fetch user_memory:", memoryError);
    throw new Error("Could not load conversation memory.");
  }

  const { data: recentRows, error: recentError } = await supabase
    .from("conversations")
    .select("id, question, answer")
    .eq("user_id", userId)
    .eq("folded_into_summary", false)
    .order("created_at", { ascending: true });

  if (recentError) {
    console.error("[conversation.service] Failed to fetch conversations:", recentError);
    throw new Error("Could not load conversation history.");
  }

  return {
    memory_summary: memoryRow?.summary_text ?? "",
    recent_messages: recentRows ?? [],
  };
}

/**
 * Saves the new Q&A pair, then applies any fold Flask determined was needed.
 */
export async function saveConversationTurn(
  userId: string,
  question: string,
  answer: string,
  updatedMemory: { summary_text: string; folded_message_id: string } | null
) {
  const { error: insertError } = await supabase
    .from("conversations")
    .insert({ user_id: userId, question, answer });

  if (insertError) {
    console.error("[conversation.service] Failed to save conversation:", insertError);
    throw new Error("Could not save conversation.");
  }

  if (!updatedMemory) {
    return;
  }

  const { error: upsertError } = await supabase
    .from("user_memory")
    .upsert(
      { user_id: userId, summary_text: updatedMemory.summary_text, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("[conversation.service] Failed to update user_memory:", upsertError);
    throw new Error("Could not update conversation memory.");
  }

  const { error: foldError } = await supabase
    .from("conversations")
    .update({ folded_into_summary: true })
    .eq("id", updatedMemory.folded_message_id);

  if (foldError) {
    console.error("[conversation.service] Failed to mark message as folded:", foldError);
    throw new Error("Could not update conversation memory.");
  }
}

/**
 * Returns a user's full conversation history for UI browsing (unfiltered by fold status).
 */
export async function getConversationHistory(userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, question, answer, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[conversation.service] Failed to fetch history:", error);
    throw new Error("Could not load conversation history.");
  }

  return data;
}