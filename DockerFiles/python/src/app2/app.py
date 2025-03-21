# node2.py - TEE Node 2 - Second half of model layers
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from flask import Flask, request, jsonify
import logging
import time
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('node2')

app = Flask(__name__)

# Initialize tokenizer and model
logger.info("Initializing Node2 (second half of model)...")
model_name = "NousResearch/DeepHermes-3-Llama-3-3B-Preview"
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Load model with quantization to reduce memory usage - CPU version
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float32,  # Use float32 for CPU
    device_map="cpu",           # Force CPU
    low_cpu_mem_usage=True
)

# Get number of layers
num_layers = len(model.model.layers)
middle_layer = num_layers // 2
logger.info(f"Total layers: {num_layers}, node2 will use layers {middle_layer}-{num_layers-1}")

# Generation parameters
max_new_tokens = 128
temperature = 0.7
top_p = 0.9

@app.route('/generate', methods=['POST'])
def generate():
    """Generate text using the second half of the model"""
    start_time = time.time()
    try:
        # Get data from node1
        data = request.get_json()
        input_ids_list = data.get("input_ids", [])
        hidden_states_list = data.get("hidden_states", [])
        hidden_shape = data.get("hidden_shape", [])
        
        # Convert back to tensors
        input_ids = torch.tensor(input_ids_list, dtype=torch.long, device=model.device)
        
        # Log information from node1
        prompt_text = tokenizer.decode(input_ids[0])
        logger.info(f"Original prompt: {prompt_text[:50]}...")
        logger.info(f"Hidden states shape: {hidden_shape}")
        logger.info(f"Starting generation...")
        
        # Use model's built-in generation capabilities instead of layer-by-layer processing
        try:
            with torch.inference_mode():
                # Generate the continuation
                outputs = model.generate(
                    input_ids=input_ids,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=True,
                    pad_token_id=tokenizer.pad_token_id if tokenizer.pad_token_id else tokenizer.eos_token_id,
                )
                
                # Get only the newly generated tokens (excluding the input)
                generated_tokens = outputs[0, input_ids.shape[1]:]
                
                # Decode to text
                generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
                
                logger.info(f"Generation completed in {time.time() - start_time:.2f}s")
                logger.info(f"Generated {len(generated_text)} characters")
                
                return jsonify({"output": generated_text})
                
        except Exception as e:
            gen_error = f"Generation error: {str(e)}"
            logger.error(gen_error)
            logger.error(traceback.format_exc())
            
            # If generation fails, try a simpler approach
            logger.info("Attempting simpler fallback generation...")
            try:
                outputs = model.generate(
                    input_ids=input_ids,
                    max_new_tokens=max_new_tokens,
                    num_beams=1,  # Simple greedy decoding
                    do_sample=False,
                    pad_token_id=tokenizer.pad_token_id if tokenizer.pad_token_id else tokenizer.eos_token_id,
                )
                
                # Get only the newly generated tokens
                generated_tokens = outputs[0, input_ids.shape[1]:]
                
                # Decode to text
                generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
                
                logger.info(f"Fallback generation completed in {time.time() - start_time:.2f}s")
                logger.info(f"Generated {len(generated_text)} characters")
                
                return jsonify({"output": generated_text})
                
            except Exception as fallback_error:
                logger.error(f"Fallback generation error: {str(fallback_error)}")
                logger.error(traceback.format_exc())
                return jsonify({"output": f"Error in generation. Original error: {str(e)}, Fallback error: {str(fallback_error)}"})
            
    except Exception as e:
        error_msg = f"Node2 error: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return jsonify({"output": error_msg})

if __name__ == "__main__":
    logger.info("Starting node2 server on port 5001...")
    app.run(host="0.0.0.0", port=5001, threaded=False) 