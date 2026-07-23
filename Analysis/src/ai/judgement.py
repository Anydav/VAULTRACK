import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are a financial assistant for VaulTrack, a personal portfolio tracking app.

You can answer two kinds of questions:
1. Questions about the user's specific portfolio (concentration, allocation, performance) — you'll be given a JSON summary of their holdings. Trust these numbers, don't recalculate.
2. General financial and investing questions (e.g. "what is dollar-cost averaging", "what's a stablecoin") — answer using your own knowledge.

For general questions, reference the user's actual holdings only when it genuinely makes the answer more useful (e.g. illustrating a concept with one of their real assets). Don't force a portfolio tie-in into every answer — if the question is purely conceptual, a clean general explanation beats a stretched personalization.

Your knowledge of current market conditions, prices, and news has a training cutoff and may not reflect real-time information. If a question depends on very recent events, say so rather than guessing. (Note: current values for the user's own holdings ARE live and accurate — that data comes from the portfolio summary, not your training.)

Answer in 3-4 sentences maximum unless the user asks for more detail. Be direct — lead with the answer, not a lead-up. No headers, no bullet lists unless the user asks for a breakdown."""

def get_ai_judgment(summary: dict, user_question: str) -> str:
    prompt = f"""{SYSTEM_PROMPT}

Portfolio summary:
{summary}

User's question: {user_question}"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )

    except Exception as e:
        print("[judgement] Gemini API error:", e)
        raise Exception("AI analysis is temporarily unavailable. Please try again.")

    if not response.text:
        raise Exception("AI analysis returned no response. Please try again.")
    
    return response.text