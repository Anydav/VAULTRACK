from flask import Flask, request, jsonify
from compute.portfolio_summary import compute_portfolio_summary
from ai.judgement import get_ai_judgment, maybe_fold_memory

app = Flask(__name__)

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json

    if data is None:
        return jsonify({"error": "Request body is missing or invalid"}), 400

    if "holdings" not in data or not isinstance(data["holdings"], list):
        return jsonify({"error": "Holdings are required and must be a list"}), 400

    if "question" not in data or not isinstance(data["question"], str):
        return jsonify({"error": "Please enter a question"}), 400

    memory_summary = data.get("memory_summary", "")
    if not isinstance(memory_summary, str):
        return jsonify({"error": "memory_summary must be a string"}), 400

    recent_messages = data.get("recent_messages", [])
    if not isinstance(recent_messages, list):
        return jsonify({"error": "recent_messages must be a list"}), 400

    print("[flask] Received holdings:", data.get("holdings"))
    print("[flask] Received question:", data.get("question"))
    print("[flask] Recent messages count:", len(recent_messages))

    summary = compute_portfolio_summary(data["holdings"])
    print("[flask] Computed summary:", summary)

    answer = get_ai_judgment(summary, data["question"], memory_summary, recent_messages)
    print("[flask] AI answer:", answer[:100], "...")  # first 100 chars, avoid flooding terminal

    updated_memory = maybe_fold_memory(memory_summary, recent_messages, data["question"], answer)
    if updated_memory:
        print("[flask] Memory folded, new summary length:", len(updated_memory["summary_text"]))

    return jsonify({"summary": summary, "answer": answer, "updated_memory": updated_memory})

if __name__ == "__main__":
    app.run(port=5001)