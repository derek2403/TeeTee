import requests
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('client')

def send_prompt(prompt):
    """Send a prompt to the distributed model"""
    logger.info(f"Sending prompt: {prompt[:50]}..." if len(prompt) > 50 else f"Sending prompt: {prompt}")
    start_time = time.time()
    
    try:
        # Send prompt to node1 (first half of the model)
        response = requests.post(
            "http://127.0.0.1:5002/process",
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

if __name__ == "__main__":
    logger.info("Starting TEE distributed LLM client...")
    logger.info("This client will send prompts to a model split across multiple Trusted Execution Environments")
    
    while True:
        user_prompt = input("\nEnter your prompt (or 'quit' to exit): ")
        if user_prompt.lower() in ('quit', 'exit'):
            logger.info("Shutting down client")
            break
        
        response = send_prompt(user_prompt)
        print("\nResponse:", response)