from flask import Flask, request, jsonify
from compute.portfolio_summary import compute_portfolio_summary
from ai.judgement import get_ai_judgment

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

    print("[flask] Received holdings:", data.get("holdings"))
    print("[flask] Received question:", data.get("question"))

    summary = compute_portfolio_summary(data["holdings"])
    print("[flask] Computed summary:", summary)

    answer = get_ai_judgment(summary, data["question"])
    print("[flask] AI answer:", answer[:100], "...")  # first 100 chars, avoid flooding terminal

    return jsonify({"summary": summary, "answer": answer})

if __name__ == "__main__":
    app.run(port=5001)