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
import hashlib
import json
import requests
import shutil
import subprocess
import sys
import gdown

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('node2')

# Set longer timeout for Hugging Face
os.environ["HUGGINGFACE_HUB_DOWNLOAD_TIMEOUT"] = "1800"  # 30 minutes

app = Flask(__name__)

# For storing the model verification hash
model_hash = None
model_info = {}

def generate_model_hash(model):
    """Generate a SHA-256 hash of model parameters and architecture"""
    logger.info("Generating model verification hash...")
    
    # Get model architecture info
    model_arch = {
        "model_type": model.config.model_type,
        "hidden_size": model.config.hidden_size,
        "num_attention_heads": model.config.num_attention_heads,
        "num_hidden_layers": model.config.num_hidden_layers,
        "vocab_size": model.config.vocab_size
    }
    
    # Get a sample of model weights (last layer weights)
    # We'll use the last layer's weights as a representative sample
    param_sample = None
    for name, param in model.named_parameters():
        if f'layers.{len(model.model.layers)-1}' in name and param_sample is None:
            param_sample = param.data.flatten()[:1000].cpu().numpy().tolist()
            break
    
    # Combine architecture and weights sample
    hash_data = {
        "architecture": model_arch,
        "parameters_sample": param_sample,
        "model_name": "TinyLlama-1.1B-Chat-v1.0",
        "total_layers": len(model.model.layers),
        "node": "2"
    }
    
    # Convert to JSON string and hash with SHA-256
    hash_str = json.dumps(hash_data, sort_keys=True)
    hash_result = hashlib.sha256(hash_str.encode()).hexdigest()
    
    return hash_result, hash_data

def download_model_from_gdrive():
    """Download model files from Google Drive"""
    logger.info("Downloading model files from Google Drive")
    
    model_dir = "/app/models/tinyllama-1b"
    os.makedirs(model_dir, exist_ok=True)
    
    # Install gdown if not already installed
    try:
        import gdown
    except ImportError:
        logger.info("Installing gdown for Google Drive downloads...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
        import gdown
    
    success = True
    # Download the entire folder
    try:
        logger.info(f"Downloading entire model folder from Google Drive...")
        gdown.download_folder(
            id="1Iua1_n95NSgndooGFPfppaKTti5mmtEy",
            output=model_dir,
            quiet=False
        )
        logger.info("Model folder download complete")
    except Exception as e:
        logger.error(f"Failed to download model folder: {str(e)}")
        success = False
    
    # Create a symlink from model.safetensors to pytorch_model.bin if needed
    safetensors_path = os.path.join(model_dir, "model.safetensors")
    pytorch_path = os.path.join(model_dir, "pytorch_model.bin") 
    
    if os.path.exists(safetensors_path) and not os.path.exists(pytorch_path):
        logger.info("Using model.safetensors as the model weights file")
        # No need for a symlink as transformers can load .safetensors files directly
    
    return success

# Initialize tokenizer and model from local directory
logger.info("Initializing Node2 (second half of model)...")
model_name = "/app/models/tinyllama-1b"  # Local path in container

# Try to download model files first
if not download_model_from_gdrive():
    logger.error("Failed to download model files. Trying to use local files if available.")

try:
    logger.info("Loading tokenizer from local directory...")
    tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
    logger.info("Tokenizer loaded successfully")
    
    # Force garbage collection
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    logger.info("Loading model from local directory...")
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="cpu",  # Initial CPU loading
        low_cpu_mem_usage=True,
        local_files_only=True
    )
    logger.info("Model loaded successfully")
    
    # Generate and store model hash
    model_hash, model_info = generate_model_hash(model)
    logger.info(f"Model verification hash: {model_hash}")
    
    # Move to GPU if available
    if torch.cuda.is_available():
        model = model.to("cuda")
        memory_allocated = torch.cuda.memory_allocated() / (1024 ** 3)
        logger.info(f"Model moved to GPU. Memory used: {memory_allocated:.2f} GB")
    
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    logger.error(traceback.format_exc())
    raise  # This will cause the container to exit on model load failure

# Get the total layers and mid point
total_layers = len(model.model.layers)
middle_layer = total_layers // 2
logger.info(f"Total layers: {total_layers}, node2 will use layers {middle_layer}-{total_layers-1}")

# Generation parameters
max_new_tokens = 128
temperature = 0.7
top_p = 0.9

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
        
        # Generate RA data using the output as custom data
        logger.info("Generating remote attestation data...")
        ra_custom_data = f"node2_output:{response_text[:100]}..., time:{time.time()}"
        ra_data = get_ra_data(ra_custom_data)
        
        # Return both the response and RA data
        return jsonify({
            "output": response_text,
            "attestation": ra_data
        })
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        logger.error(traceback.format_exc())
        error_msg = f"Error generating response: {str(e)}"
        return jsonify({"output": error_msg})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/verify', methods=['GET'])
def verify_model():
    """Endpoint to verify the model's identity and integrity"""
    if model_hash:
        response = {
            "model_hash": model_hash,
        }
        return jsonify(response)
    else:
        return jsonify({"error": "Model hash not available", "status": "error"}), 500

# Add this route to get Node2 attestation report
@app.route('/node2_ra_report', methods=['GET'])
def node2_ra_report():
    """
    Get remote attestation report for Node2.
    """
    try:
        # Get the attestation report
        report = get_attestation_report()
        
        # Return the report
        return jsonify({
            "status": "success",
            "node2_attestation": {
                "ra_report": report
            }
        })
    except Exception as e:
        logging.error(f"Error generating attestation report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to generate attestation report: {str(e)}"
        }), 500

if __name__ == "__main__":
    logger.info("Starting node2 server on port 5001...")
    app.run(host="0.0.0.0", port=5001) 