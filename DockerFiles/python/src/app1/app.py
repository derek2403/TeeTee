import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from flask import Flask, request, jsonify
import requests
import logging
import time
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('node1')

app = Flask(__name__)

# Initialize tokenizer and model
logger.info("Initializing Node1 (first half of model)...")
model_name = "NousResearch/DeepHermes-3-Llama-3-3B-Preview"
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Load model with quantization to reduce memory usage - CPU version
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float32,  # Use float32 for CPU
    device_map="cpu",           # Force CPU
    low_cpu_mem_usage=True
)

# Get layer information - this is for the first half
num_layers = len(model.model.layers)
middle_layer = num_layers // 2
logger.info(f"Model has {num_layers} total layers")
logger.info(f"Node1 will use layers 0 to {middle_layer-1}")

# Save the original layers
original_layers = model.model.layers
# Keep only the first half
model.model.layers = original_layers[:middle_layer]

logger.info(f"Model initialized on CPU")

@app.route('/process', methods=['POST'])
def process_prompt():
    """Process the user prompt through the first half of the model"""
    start_time = time.time()
    try:
        # Get prompt from request
        data = request.get_json()
        prompt = data.get("prompt", "")
        logger.info(f"Processing prompt: {prompt[:50]}..." if len(prompt) > 50 else f"Processing prompt: {prompt}")
        
        # Format prompt with tokenizer
        messages = [{"role": "user", "content": prompt}]
        input_ids = tokenizer.apply_chat_template(
            messages, 
            add_generation_prompt=True, 
            return_tensors="pt"
        ).to(model.device)
        
        # Create attention mask
        attention_mask = torch.ones_like(input_ids)
        
        # Get position IDs
        seq_length = input_ids.shape[1]
        position_ids = torch.arange(0, seq_length, dtype=torch.long, device=model.device).unsqueeze(0)
        
        logger.info(f"Input shape: {input_ids.shape}")
        
        # Process through first half of the model
        with torch.inference_mode():
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                position_ids=position_ids,
                use_cache=True,
                output_hidden_states=True,
                return_dict=True
            )
            
            # Get hidden states from the last layer
            hidden_states = outputs.hidden_states[-1]
            logger.info(f"Hidden states shape: {hidden_states.shape}")
            
            # Get the key-value cache
            past_key_values = outputs.past_key_values
            logger.info(f"Generated KV cache with {len(past_key_values)} layer entries")
        
        # Convert tensors to lists for JSON serialization
        hidden_states_list = hidden_states.cpu().numpy().tolist()
        input_ids_list = input_ids.cpu().numpy().tolist()
        position_ids_list = position_ids.cpu().numpy().tolist()
        attention_mask_list = attention_mask.cpu().numpy().tolist()
        
        # Process key-value cache (carefully to maintain the structure)
        kv_cache_serialized = []
        for layer_idx, layer_cache in enumerate(past_key_values):
            layer_data = []
            for tensor_idx, tensor in enumerate(layer_cache):
                # Serialize each tensor in the key-value pair
                tensor_data = {
                    "shape": list(tensor.shape),
                    "data": tensor.cpu().numpy().tolist()
                }
                layer_data.append(tensor_data)
            kv_cache_serialized.append(layer_data)
        
        logger.info("Sending processed data to node2...")
        node2_start = time.time()
        
        # Send data to node2
        # For Docker, we use the service name instead of localhost
        response = requests.post(
            "http://app2:5001/generate",
            json={
                "input_ids": input_ids_list,
                "hidden_states": hidden_states_list,
                "hidden_shape": list(hidden_states.shape),
                "position_ids": position_ids_list,
                "attention_mask": attention_mask_list,
                "kv_cache": kv_cache_serialized,
                "total_layers": num_layers,
                "middle_layer": middle_layer
            },
            timeout=300
        )
        
        logger.info(f"Node2 processing time: {time.time() - node2_start:.2f}s")
        logger.info(f"Total request time: {time.time() - start_time:.2f}s")
        
        return jsonify(response.json())
        
    except Exception as e:
        import traceback
        logger.error(f"Error in node1: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"output": f"Error in node1: {str(e)}"})

# Add the client endpoint from input.py
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

if __name__ == "__main__":
    logger.info("Starting node1 server on port 5000...")
    app.run(host="0.0.0.0", port=5000, threaded=False) 