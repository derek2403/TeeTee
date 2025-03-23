import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from flask import Flask, request, jsonify
import requests
import logging
import time
import traceback
import gc
import os
import hashlib
import json
import shutil
import subprocess
import sys
import gdown
# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('node1')

app = Flask(__name__)

# For storing the model verification hash
model_hash = None
model_info = {}

# Add this near the top with other global variables
node1_latest_ra_data = None  # For storing the latest RA report from Node1

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
    
    # Get a sample of model weights (first layer weights)
    # We'll use the first layer's weights as a representative sample
    param_sample = None
    for name, param in model.named_parameters():
        if 'layers.0' in name and param_sample is None:
            param_sample = param.data.flatten()[:1000].cpu().numpy().tolist()
            break
    
    # Combine architecture and weights sample
    hash_data = {
        "architecture": model_arch,
        "parameters_sample": param_sample,
        "model_name": "TinyLlama-1.1B-Chat-v1.0",
        "total_layers": len(model.model.layers),
        "node": "1"
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
    
    # Google Drive file IDs for each model file
    # The URLs are extracted from the folder shared: https://drive.google.com/drive/folders/1Iua1_n95NSgndooGFPfppaKTti5mmtEy
    drive_files = {
        "config.json": "1Iua1_n95NSgndooGFPfppaKTti5mmtEy",
        "generation_config.json": "1Iua1_n95NSgndooGFPfppaKTti5mmtEy", 
        "model.safetensors": "1Iua1_n95NSgndooGFPfppaKTti5mmtEy",
        "tokenizer.json": "1Iua1_n95NSgndooGFPfppaKTti5mmtEy",
        "tokenizer_config.json": "1Iua1_n95NSgndooGFPfppaKTti5mmtEy",
        "special_tokens_map.json": "1Iua1_n95NSgndooGFPfppaKTti5mmtEy",
        "tokenizer.model": "1Iua1_n95NSgndooGFPfppaKTti5mmtEy"
    }
    
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

# Initialize model
logger.info("Initializing Node1 (first half of model)...")
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
logger.info(f"Model has {total_layers} total layers")
logger.info(f"Node1 will use layers 0 to {middle_layer-1}")
logger.info(f"Model initialized on {model.device}")

# Add model verification endpoint
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

@app.route('/process', methods=['POST'])
def process_prompt():
    """Process a prompt through the first half of the model"""
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        
        logger.info(f"Processing prompt: {prompt[:50]}..." if len(prompt) > 50 else f"Processing prompt: {prompt}")
        start_time = time.time()
        
        # Format prompt with chat template
        chat_prompt = tokenizer.apply_chat_template([{"role": "user", "content": prompt}], tokenize=False)
        
        # Tokenize the input
        input_ids = tokenizer.encode(chat_prompt, return_tensors="pt").to(model.device)
        logger.info(f"Input shape: {input_ids.shape}")
        
        with torch.no_grad():
            # Process through the first half of the model layers
            outputs = model(input_ids, output_hidden_states=True)
            
            # Get the hidden states from the last layer of the first half
            hidden_states = outputs.hidden_states[middle_layer]
            logger.info(f"Hidden states shape: {hidden_states.shape}")
            
            # Convert to list for JSON serialization
            hidden_states_list = hidden_states.cpu().numpy().tolist()
            input_ids_list = input_ids.cpu().numpy().tolist()
            
            # Clean up memory
            del outputs
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        
        # Prepare data for node2
        node2_data = {
            "input_ids": input_ids_list,
            "hidden_states": hidden_states_list,
            "prompt": chat_prompt
        }
        
        logger.info("Sending processed data to node2...")
        node2_start = time.time()
        
        # Get Node2 URL from environment variable with fallback
        node2_url = os.environ.get('NODE2_URL', 'http://app2:5001')
        generate_endpoint = f"{node2_url}/generate"
        logger.info(f"Using Node2 endpoint: {generate_endpoint}")
        
        # Generate RA data using the processed data as custom data
        logger.info("Generating remote attestation data for processed output...")
        ra_custom_data = f"node1_process:prompt={prompt[:50]}...,hidden_states_shape={len(hidden_states_list)}x{len(hidden_states_list[0]) if hidden_states_list else 0},time:{time.time()}"
        ra_data = get_ra_data(ra_custom_data)
        
        # Store the RA data in the global variable for the new endpoint to access
        global node1_latest_ra_data
        node1_latest_ra_data = ra_data
        
        # Send to node2 for completion
        response = requests.post(
            generate_endpoint,
            json=node2_data,
            timeout=300  # 5 minute timeout
        )
        
        node2_time = time.time() - node2_start
        logger.info(f"Node2 processing time: {node2_time:.2f}s")
        
        total_time = time.time() - start_time
        logger.info(f"Total request time: {total_time:.2f}s")
        
        # Get the response from node2
        node2_response = response.json()
        
        # Add the RA data to the response
        if "attestation" in node2_response:
            # If node2 already has attestation data, combine both
            node2_response["attestation"]["node1_attestation"] = ra_data
        else:
            # Otherwise, add our attestation data
            node2_response["attestation"] = {"node1_attestation": ra_data}
        
        return jsonify(node2_response)
        
    except Exception as e:
        logger.error(f"Error processing prompt: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"output": f"Error: {str(e)}"})
      

# Add the client endpoint
@app.route('/generate', methods=['POST'])
def generate():
    """Client-facing endpoint for the complete model"""
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        
        logger.info(f"Received user prompt: {prompt[:50]}..." if len(prompt) > 50 else f"Received user prompt: {prompt}")
        start_time = time.time()
        
        # Process with the internal endpoint
        result = process_prompt()
        
        elapsed_time = time.time() - start_time
        logger.info(f"Response generated in {elapsed_time:.2f}s")
        
        return result
    
    except Exception as e:
        logger.error(f"Error in generate endpoint: {str(e)}")
        return jsonify({"output": f"Error: {str(e)}"})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/node1_ra_report', methods=['GET'])
def get_node1_ra_report():
    """Get the latest RA report from Node1"""
    if node1_latest_ra_data:
        return jsonify({
            "status": "success",
            "node1_attestation": node1_latest_ra_data
        })
    else:
        return jsonify({
            "status": "not_ready", 
            "message": "No RA report has been generated yet"
        })

if __name__ == "__main__":
    logger.info("Starting node1 server on port 5002...")
    app.run(host="0.0.0.0", port=5002) 