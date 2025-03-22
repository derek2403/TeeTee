import requests
import logging
import time
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('client')

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Client for TEE distributed LLM')
    parser.add_argument('--prompt', type=str, help='Text prompt to send to the model')
    parser.add_argument('--host', type=str, default='localhost', help='Host where the model is running')
    parser.add_argument('--port', type=int, default=5002, help='Port number for the model')  # Changed from 5000 to 5002
    
    args = parser.parse_args()
    
    if args.prompt:
        # Run in single query mode
        logger.info(f"Running single query to model at {args.host}:{args.port}")
        response = send_prompt(args.prompt, args.host, args.port)
        print("\nResponse:", response)
    else:
        # Run in interactive mode
        logger.info(f"Starting interactive session with model at {args.host}:{args.port}")
        print("\nTEE Distributed LLM Client")
        print("Type 'quit' or 'exit' to end the session")
        
        while True:
            user_input = input("\nEnter your prompt (or 'quit' to exit): ")
            if user_input.lower() in ('quit', 'exit'):
                logger.info("Ending session")
                break
                
            response = send_prompt(user_input, args.host, args.port)
            print("\nResponse:", response)

def send_prompt(prompt, host='localhost', port=5002):  # Changed from 5000 to 5002
    """Send a prompt to the distributed model"""
    logger.info(f"Sending prompt: {prompt}")
    url = f"http://{host}:{port}/generate"
    logger.info(f"Sending request to {url}")
    
    try:
        start_time = time.time()
        
        # Send prompt to the model
        response = requests.post(
            url,
            json={"prompt": prompt},
            timeout=300  # 5 minute timeout
        )
        response.raise_for_status()
        
        # Get model's response
        result = response.json().get("output", "")
        
        elapsed_time = time.time() - start_time
        logger.info(f"Response received in {elapsed_time:.2f}s")
        logger.info(f"Response length: {len(result)} chars")
        
        return result
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error: {str(e)}")
        return f"Error: {str(e)}"

if __name__ == "__main__":
    main() 