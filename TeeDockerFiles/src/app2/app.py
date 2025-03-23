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
from transformers.modeling_outputs import BaseModelOutputWithPast, CausalLMOutputWithPast

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
    
    try:
        import gdown
    except ImportError:
        logger.info("Installing gdown for Google Drive downloads...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
        import gdown
    
    success = True
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
    
    return success

# Create a custom class for Node2 model that starts from the middle layer
class Node2Model(torch.nn.Module):
    def __init__(self, base_model, middle_layer):
        super().__init__()
        self.config = base_model.config
        self.embed_tokens = base_model.model.embed_tokens  # Needed for vocab projections
        self.norm = base_model.model.norm
        self.lm_head = base_model.lm_head
        
        # Only include the second half of layers
        self.layers = base_model.model.layers[middle_layer:]
        
        logger.info(f"Node2 initialized with layers {middle_layer} to {len(base_model.model.layers)-1}")

    def forward(self, hidden_states, attention_mask=None, position_ids=None, output_hidden_states=True):
        # Store all hidden states if requested
        all_hidden_states = () if output_hidden_states else None
        
        # Process through the second half of layers
        for idx, layer in enumerate(self.layers):
            if output_hidden_states:
                all_hidden_states = all_hidden_states + (hidden_states,)
                
            # Process through this layer
            hidden_states = layer(hidden_states, attention_mask)[0]
            
        # Apply final normalization
        hidden_states = self.norm(hidden_states)
        
        # Get logits from the final hidden states
        logits = self.lm_head(hidden_states)
        
        # Return the output and the hidden_states
        return CausalLMOutputWithPast(
            logits=logits,
            past_key_values=None,
            hidden_states=all_hidden_states,
            attentions=None
        )
    
    def generate(self, hidden_states, input_ids, attention_mask=None, position_ids=None, 
                max_new_tokens=128, temperature=0.7, top_p=0.9):
        """
        Generate text by continuing from the provided hidden states
        """
        batch_size = hidden_states.shape[0]
        device = hidden_states.device
        
        # Start with initial hidden states and input_ids from Node1
        current_hidden_states = hidden_states
        current_input_ids = input_ids
        all_input_ids = input_ids.clone()
        
        # Keep track of attention_mask and position_ids
        if attention_mask is None:
            attention_mask = torch.ones_like(input_ids, device=device)
        else:
            attention_mask = attention_mask.to(device)
            
        if position_ids is None:
            position_ids = torch.arange(input_ids.shape[1], device=device).unsqueeze(0)
        else:
            position_ids = position_ids.to(device)
            
        # Start generation loop
        for i in range(max_new_tokens):
            with torch.no_grad():
                # Process current hidden states through our layers
                outputs = self.forward(
                    current_hidden_states, 
                    attention_mask=attention_mask,
                    position_ids=position_ids,
                    output_hidden_states=False
                )
                
                # Get next token logits from the last position
                next_token_logits = outputs.logits[:, -1, :]
                
                # Apply temperature
                next_token_logits = next_token_logits / temperature
                
                # Apply top-p sampling
                sorted_logits, sorted_indices = torch.sort(next_token_logits, descending=True)
                cumulative_probs = torch.cumsum(torch.softmax(sorted_logits, dim=-1), dim=-1)
                
                # Remove tokens with cumulative probability above the threshold
                sorted_indices_to_remove = cumulative_probs > top_p
                # Shift the indices to the right to keep the first token above threshold
                sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                sorted_indices_to_remove[..., 0] = 0
                
                for batch_idx in range(batch_size):
                    indices_to_remove = sorted_indices[batch_idx][sorted_indices_to_remove[batch_idx]]
                    next_token_logits[batch_idx, indices_to_remove] = -float("Inf")
                
                # Sample from the filtered distribution
                probs = torch.softmax(next_token_logits, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1)
                
                # Append to the sequence
                all_input_ids = torch.cat([all_input_ids, next_token], dim=-1)
                
                # Check if we've hit the end of sequence token
                if next_token[0, 0].item() == self.config.eos_token_id:
                    break
                
                # Prepare for the next iteration
                # Expand attention_mask and position_ids
                attention_mask = torch.cat([
                    attention_mask, 
                    torch.ones((batch_size, 1), device=device)
                ], dim=-1)
                
                position_ids = torch.cat([
                    position_ids, 
                    (position_ids[0, -1] + 1).unsqueeze(0).unsqueeze(0)
                ], dim=-1)
                
                # Embed the new token to create the next hidden state
                token_embeds = self.embed_tokens(next_token)
                
                # Process this token through all layers 
                current_hidden_states = token_embeds
                
        
        return all_input_ids

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
    full_model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="cpu",  # Initial CPU loading
        low_cpu_mem_usage=True,
        local_files_only=True
    )
    logger.info("Model loaded successfully")
    
    # Get the total layers and mid point
    total_layers = len(full_model.model.layers)
    middle_layer = total_layers // 2
    logger.info(f"Total layers: {total_layers}, node2 will use layers {middle_layer}-{total_layers-1}")
    
    # Create Node2 specific model with just the second half of layers
    model = Node2Model(full_model, middle_layer)
    
    # Generate and store model hash
    model_hash, model_info = generate_model_hash(full_model)
    logger.info(f"Model verification hash: {model_hash}")
    
    # Release memory from the full model
    del full_model
    gc.collect()
    
    # Move to GPU if available
    if torch.cuda.is_available():
        model = model.to("cuda")
        memory_allocated = torch.cuda.memory_allocated() / (1024 ** 3)
        logger.info(f"Model moved to GPU. Memory used: {memory_allocated:.2f} GB")
    
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    logger.error(traceback.format_exc())
    raise  # This will cause the container to exit on model load failure

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
        
        # Extract information about the intermediate state
        layer_info = data.get("layer_info", {})
        mid_layer = layer_info.get("middle_layer", 0)
        
        # Get the hidden states from Node1
        hidden_states = torch.tensor(data.get("hidden_states", []), dtype=torch.float16)
        input_ids = torch.tensor(data.get("input_ids", []), dtype=torch.long)
        attention_mask = torch.tensor(data.get("attention_mask", []), dtype=torch.long)
        position_ids = torch.tensor(data.get("position_ids", []), dtype=torch.long)
        prompt = data.get("prompt", "")
        
        logger.info(f"Original prompt: {prompt[:50]}..." if len(prompt) > 50 else f"Original prompt: {prompt}")
        logger.info(f"Hidden states shape: {hidden_states.shape}")
        logger.info(f"Continuing from layer: {mid_layer}")
        
        # Move tensors to the same device as the model
        hidden_states = hidden_states.to(model.layers[0].parameters().__next__().device)
        input_ids = input_ids.to(model.layers[0].parameters().__next__().device)
        attention_mask = attention_mask.to(model.layers[0].parameters().__next__().device)
        position_ids = position_ids.to(model.layers[0].parameters().__next__().device)
        
        logger.info("Starting generation...")
        start_time = time.time()
        
        # Generate response using the provided hidden states
        with torch.no_grad():
            generated_ids = model.generate(
                hidden_states=hidden_states,
                input_ids=input_ids,
                attention_mask=attention_mask,
                position_ids=position_ids,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p
            )
        
        # Decode the generated tokens
        generated_text = tokenizer.decode(generated_ids[0], skip_special_tokens=True)
        
        # Extract just the assistant's response by removing the prompt
        response_text = generated_text.split("assistant")[-1].strip()
        
        # Clean up memory
        del hidden_states, input_ids, attention_mask, position_ids, generated_ids
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        generation_time = time.time() - start_time
        logger.info(f"Generation completed in {generation_time:.2f}s")
        logger.info(f"Generated {len(response_text)} characters")
        
        # Generate RA data with detailed information about the layer splitting
        logger.info("Generating remote attestation data...")
        ra_custom_data = (
            f"node2_layer_split:continuing_from_layer={mid_layer},"
            f"layers_used={mid_layer}-{mid_layer+len(model.layers)-1},"
            f"hidden_state_shape={hidden_states.shape if 'hidden_states' in locals() else 'freed'},"
            f"output_preview={response_text[:50]}...,time:{time.time()}"
        )
        ra_data = get_ra_data(ra_custom_data)
        
        # Return both the response and RA data
        return jsonify({
            "output": response_text,
            "attestation": ra_data,
            "layer_split_info": {
                "node1_layers": f"0-{mid_layer-1}",
                "node2_layers": f"{mid_layer}-{mid_layer+len(model.layers)-1}",
                "generation_time_ms": int(generation_time * 1000)
            }
        })
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        logger.error(traceback.format_exc())
        error_msg = f"Error generating response: {str(e)}"
        return jsonify({"output": error_msg})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "model_type": "TinyLlama-1.1B-Chat-v1.0 (Node2)",
        "layers": f"{len(model.layers)} layers (second half)",
        "memory_usage": f"{torch.cuda.memory_allocated() / (1024 ** 3):.2f} GB" if torch.cuda.is_available() else "CPU only"
    })

@app.route('/verify', methods=['GET'])
def verify_model():
    """Endpoint to verify the model's identity and integrity"""
    if model_hash:
        response = {
            "model_hash": model_hash,
            "model_info": {
                "total_layers": len(model.layers),
                "model_type": "TinyLlama-1.1B-Chat-v1.0 (Node2 - Second Half)"
            }
        }
        return jsonify(response)
    else:
        return jsonify({"error": "Model hash not available", "status": "error"}), 500

@app.route('/node2_ra_report', methods=['GET'])
def node2_ra_report():
    """
    Get remote attestation report for Node2.
    """
    try:
        # Generate a report with basic node info
        custom_data = f"node2_status:layers={len(model.layers)},time:{time.time()}"
        ra_data = get_ra_data(custom_data)
        
        # Return the report
        return jsonify({
            "status": "success",
            "node2_attestation": ra_data
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