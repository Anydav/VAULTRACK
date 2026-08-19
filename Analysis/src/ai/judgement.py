import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options=types.HttpOptions(timeout=120000)  # 120 seconds, in milliseconds
)

SYSTEM_PROMPT = """You are a financial assistant for VaulTrack, a personal portfolio tracking app.

You can answer two kinds of questions:
1. Questions about the user's specific portfolio (concentration, allocation, performance) — you'll be given a JSON summary of their holdings. Trust these numbers, don't recalculate.
2. General financial and investing questions (e.g. "what is dollar-cost averaging", "what's a stablecoin") — answer using your own knowledge.

For general questions, reference the user's actual holdings only when it genuinely makes the answer more useful (e.g. illustrating a concept with one of their real assets). Don't force a portfolio tie-in into every answer — if the question is purely conceptual, a clean general explanation beats a stretched personalization.

Your knowledge of current market conditions, prices, and news has a training cutoff and may not reflect real-time information. If a question depends on very recent events, say so rather than guessing. (Note: current values for the user's own holdings ARE live and accurate — that data comes from the portfolio summary, not your training.)

If a conversation summary and/or recent messages are provided below, use them to maintain continuity — refer back to what was already discussed rather than repeating yourself or asking questions the user already answered.

Answer in 3-4 sentences maximum unless the user asks for more detail. Be direct — lead with the answer, not a lead-up. No headers, no bullet lists unless the user asks for a breakdown."""

FOLD_THRESHOLD = 10


def get_ai_judgment(summary: dict, user_question: str, memory_summary: str = "", recent_messages: list = None) -> str:
    recent_messages = recent_messages or []

    context_block = ""
    if memory_summary:
        context_block += f"\nConversation summary so far:\n{memory_summary}\n"
    if recent_messages:
        history_lines = "\n".join(
            f"User: {m['question']}\nAssistant: {m['answer']}" for m in recent_messages
        )
        context_block += f"\nRecent messages:\n{history_lines}\n"

    prompt = f"""{SYSTEM_PROMPT}
{context_block}
Portfolio summary:
{summary}

User's question: {user_question}"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

    except Exception as e:
        print("[judgement] Gemini API error:", e)
        raise Exception("AI analysis is temporarily unavailable. Please try again.")

    if not response.text:
        raise Exception("AI analysis returned no response. Please try again.")

    return response.text


def fold_oldest_message(memory_summary: str, oldest_message: dict) -> str:
    """Folds a single oldest message into the running summary via Gemini."""
    fold_prompt = f"""You are maintaining a running memory summary of a user's conversation with a financial assistant.

Existing summary:
{memory_summary if memory_summary else "(none yet)"}

New message to fold in:
User: {oldest_message['question']}
Assistant: {oldest_message['answer']}

Write an updated, concise summary that incorporates this message into the existing summary. Keep only what would help the assistant maintain continuity in future turns (user's concerns, context, preferences, prior topics). Do not include a preamble — return only the updated summary text."""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=fold_prompt
        )
    except Exception as e:
        print("[judgement] Gemini fold error:", e)
        raise Exception("Memory update temporarily unavailable. Please try again.")

    if not response.text:
        raise Exception("Memory update returned no response. Please try again.")

    return response.text.strip()


def maybe_fold_memory(memory_summary: str, recent_messages: list, new_question: str, new_answer: str):
    """
    Checks if adding the new Q&A pushes the unsummarized window over the threshold.
    If so, folds the single oldest message and returns the update info; otherwise returns None.
    """
    total_after_new_message = len(recent_messages) + 1

    if total_after_new_message <= FOLD_THRESHOLD:
        return None

    if not recent_messages:
        # Shouldn't happen (threshold > 0), but guards against bad input
        return None

    oldest_message = recent_messages[0]
    updated_summary = fold_oldest_message(memory_summary, oldest_message)

    return {
        "summary_text": updated_summary,
        "folded_message_id": oldest_message["id"],
    }