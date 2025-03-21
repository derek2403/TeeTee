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

def send_prompt(prompt, host="localhost", port=5000):
    """Send a prompt to the distributed model"""
    logger.info(f"Sending prompt: {prompt[:50]}..." if len(prompt) > 50 else f"Sending prompt: {prompt}")
    start_time = time.time()
    
    try:
        # Send prompt to app1 (first half of the model)
        url = f"http://{host}:{port}/generate"
        logger.info(f"Sending request to {url}")
        
        response = requests.post(
            url,
            json={"prompt": prompt},
            timeout=300  # 5 minute timeout for long generations
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

def interactive_mode(host, port):
    """Run in interactive mode, asking for prompts"""
    logger.info("Starting TEE distributed LLM client in interactive mode...")
    logger.info(f"Connecting to model at {host}:{port}")
    logger.info("This client will send prompts to a model split across multiple containers")
    
    while True:
        user_prompt = input("\nEnter your prompt (or 'quit' to exit): ")
        if user_prompt.lower() in ('quit', 'exit'):
            logger.info("Shutting down client")
            break
        
        response = send_prompt(user_prompt, host, port)
        print("\nResponse:", response)

def single_query(prompt, host, port):
    """Run a single query and exit"""
    logger.info(f"Running single query to model at {host}:{port}")
    response = send_prompt(prompt, host, port)
    print("\nResponse:", response)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Client for sharded LLM model')
    parser.add_argument('--host', default='localhost', help='Host address where app1 is running')
    parser.add_argument('--port', default=5000, type=int, help='Port where app1 is running')
    parser.add_argument('--prompt', help='Run a single query with this prompt and exit')
    
    args = parser.parse_args()
    
    if args.prompt:
        single_query(args.prompt, args.host, args.port)
    else:
        interactive_mode(args.host, args.port) 