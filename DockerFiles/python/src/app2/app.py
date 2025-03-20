from flask import Flask
import requests
import time

app = Flask(__name__)

def get_value_from_app1():
    try:
        # Make request to app1
        response = requests.get('http://app1:5000/calculate')
        data = response.json()
        return data['result']
    except Exception as e:
        print(f"Error connecting to app1: {e}")
        return None

@app.route('/', methods=['GET'])
def calculate():
    # Get value from app1
    x = get_value_from_app1()
    
    if x is not None:
        # Perform calculation using the value from app1
        y = x + 1
        print(f"App2 received: x = {x}")
        print(f"App2 calculated: y = {y}")
        return f"App1 calculated x = {x}, App2 calculated y = {y}"
    else:
        return "Error: Could not get value from app1"

if __name__ == '__main__':
    # Wait for app1 to be ready
    print("App2 is waiting for app1 to be ready...")
    time.sleep(10)
    
    # Try to get value from app1
    print("App2 is starting up...")
    app.run(host='0.0.0.0', port=5001) 