from flask import Flask, jsonify
import time

app = Flask(__name__)

@app.route('/calculate', methods=['GET'])
def calculate():
    # Perform calculation
    x = 1 + 1
    print(f"App1 calculated: x = {x}")
    return jsonify({"result": x})

if __name__ == '__main__':
    # Add a small delay to ensure the server is ready for connections
    time.sleep(5)
    print("App1 is starting up...")
    app.run(host='0.0.0.0', port=5000) 