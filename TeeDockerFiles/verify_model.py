"""
Script to verify model integrity by connecting to both servers and 
comparing their verification hashes.
"""
import requests
import json
import time

def verify_models():
    print("Verifying model integrity across nodes...")
    
    try:
        # Wait for servers to be fully up
        print("Waiting for servers to be fully initialized...")
        time.sleep(5)
        
        # Get verification from node1
        print("Requesting verification from node1...")
        response1 = requests.get("http://localhost:5002/verify")
        verify1 = response1.json()
        
        # Get verification from node2
        print("Requesting verification from node2...")
        response2 = requests.get("http://localhost:5001/verify")
        verify2 = response2.json()
        
        print("\n--- Model Verification Results ---")
        print(f"Node1 (layers {verify1['layers_used']}):")
        print(f"  Model: {verify1['model_name']}")
        print(f"  Hash:  {verify1['model_hash']}")
        
        print(f"\nNode2 (layers {verify2['layers_used']}):")
        print(f"  Model: {verify2['model_name']}")
        print(f"  Hash:  {verify2['model_hash']}")
        
        # Check if models match
        same_model = verify1['model_name'] == verify2['model_name']
        print(f"\nSame model used across nodes: {same_model}")
        
        print("\nVerification complete.")
        
    except Exception as e:
        print(f"Error verifying models: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    # Give the servers time to start up
    print("Waiting for servers to start...")
    time.sleep(10)
    verify_models() 