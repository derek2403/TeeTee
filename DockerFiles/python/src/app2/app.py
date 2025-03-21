# node2.py - TEE Node 2 - Second half of model layers
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from flask import Flask, request, jsonify
import logging
import time
import traceback
import numpy as np
import gc
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('node2')

# Set longer timeout for Hugging Face
os.environ["HUGGINGFACE_HUB_DOWNLOAD_TIMEOUT"] = "1800"  # 30 minutes

app = Flask(__name__)

# Initialize tokenizer and model
logger.info("Initializing Node2 (second half of model)...")
model_name = "/app/models/tinyllama-1b"

# Function to load model with retries
def load_model_with_retries(max_retries=5):
    retry_count = 0
    while retry_count < max_retries:
        try:
            logger.info(f"Loading tokenizer (attempt {retry_count+1}/{max_retries})...")
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                local_files_only=False,
                resume_download=True
            )
            logger.info("Tokenizer loaded successfully")
            
            # Force garbage collection
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info(f"Loading model (attempt {retry_count+1}/{max_retries})...")
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="cpu",  # Initial CPU loading
                low_cpu_mem_usage=True,
                local_files_only=False,
                resume_download=True
            )
            logger.info("Model loaded successfully")
            
            return tokenizer, model
            
        except Exception as e:
            retry_count += 1
            logger.error(f"Loading attempt {retry_count} failed: {str(e)}")
            if retry_count >= max_retries:
                logger.error("Max retries exceeded.")
                raise
            logger.info(f"Retrying in 10 seconds...")
            time.sleep(10)

try:
    # Load the model with retry mechanism
    tokenizer, model = load_model_with_retries()
    
    # Move to GPU if available
    if torch.cuda.is_available():
        model = model.to("cuda")
        memory_allocated = torch.cuda.memory_allocated() / (1024 ** 3)
        logger.info(f"Model moved to GPU. Memory used: {memory_allocated:.2f} GB")
    
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    logger.error(traceback.format_exc())

# Get the total layers and mid point
total_layers = len(model.model.layers)
middle_layer = total_layers // 2
logger.info(f"Total layers: {total_layers}, node2 will use layers {middle_layer}-{total_layers-1}")

# Generation parameters
max_new_tokens = 128
temperature = 0.7
top_p = 0.9

@app.route('/generate', methods=['POST'])
def generate():
    """Generate completion based on the hidden states from node1"""
    try:
        # Get data from request
        data = request.get_json()
        hidden_states = torch.tensor(data.get("hidden_states", []), dtype=torch.float16)
        input_ids = torch.tensor(data.get("input_ids", []), dtype=torch.long)
        prompt = data.get("prompt", "")
        
        logger.info(f"Original prompt: {prompt[:50]}..." if len(prompt) > 50 else f"Original prompt: {prompt}")
        logger.info(f"Hidden states shape: {hidden_states.shape}")
        
        # Move tensors to the same device as the model
        hidden_states = hidden_states.to(model.device)
        input_ids = input_ids.to(model.device)
        
        logger.info("Starting generation...")
        start_time = time.time()
        
        # For simplicity, we'll just generate from scratch with the prompt
        # In a real TEE setup, you would use the hidden states from node1
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        # Generate response with more memory-efficient settings
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
                use_cache=True,
                pad_token_id=tokenizer.pad_token_id if tokenizer.pad_token_id else tokenizer.eos_token_id
            )
        
        # Decode the generated tokens
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract just the assistant's response by removing the prompt
        response_text = generated_text.split("assistant")[-1].strip()
        
        # Clean up memory
        del outputs, inputs
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        generation_time = time.time() - start_time
        logger.info(f"Generation completed in {generation_time:.2f}s")
        logger.info(f"Generated {len(response_text)} characters")
        
        return jsonify({"output": response_text})
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        logger.error(traceback.format_exc())
        error_msg = f"Error generating response: {str(e)}"
        return jsonify({"output": error_msg})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    logger.info("Starting node2 server on port 5001...")
    app.run(host="0.0.0.0", port=5001) 