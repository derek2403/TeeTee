from flask import Flask, jsonify, request
import os
import subprocess
import json
import time

app = Flask(__name__)

# Initialize counter
counter = 0

def get_ra_data(custom_data):
    """
    Call the Node script with custom data and return the RA report.
    """
    try:
        result = subprocess.run(
            ["node", "generate_ra.js", custom_data],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            text=True
        )
        ra_report = json.loads(result.stdout)
        return {"ra_report": ra_report, "custom_data_used": custom_data}
    except subprocess.CalledProcessError as e:
        return {"error": "Error generating RA report", "details": e.stderr}
    except json.JSONDecodeError as je:
        return {"error": "Invalid JSON returned from Node script", "details": str(je)}

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Welcome to the Counter & RA Service",
        "endpoints": {
            "/counter": "Get current counter value with RA report",
            "/counter/increment": "Increment the counter and get RA report",
            "/counter/reset": "Reset the counter and get RA report"
        }
    })

@app.route("/counter", methods=["GET"])
def get_counter():
    # Build custom data from current counter and timestamp.
    custom_data = f"counter:{counter}, time:{time.time()}"
    ra_data = get_ra_data(custom_data)
    return jsonify({
        "counter": counter,
        **ra_data
    })

@app.route("/counter/increment", methods=["GET", "POST"])
def increment_counter():
    global counter
    counter += 1
    custom_data = f"counter:{counter}, time:{time.time()}"
    ra_data = get_ra_data(custom_data)
    return jsonify({
        "counter": counter,
        "message": "Counter incremented",
        **ra_data
    })

@app.route("/counter/reset", methods=["GET", "POST"])
def reset_counter():
    global counter
    counter = 0
    custom_data = f"counter:{counter}, time:{time.time()}"
    ra_data = get_ra_data(custom_data)
    return jsonify({
        "counter": counter,
        "message": "Counter reset to 0",
        **ra_data
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
