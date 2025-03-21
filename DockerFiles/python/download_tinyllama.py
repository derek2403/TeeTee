import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import os
import gc
import sys

# Create models directory if it doesn't exist
os.makedirs("./models", exist_ok=True)

# Set longer timeouts
os.environ["HUGGINGFACE_HUB_DOWNLOAD_TIMEOUT"] = "1800"

model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
output_dir = "./models/tinyllama-1b"

print(f"Downloading {model_name} to {output_dir}...")

try:
    # Download tokenizer
    print("Downloading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.save_pretrained(output_dir)
    print(f"Tokenizer saved to {output_dir}")
    
    # Force cleanup
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    # Download model
    print("Downloading model...")
    model = AutoModelForCausalLM.from_pretrained(
        model_name, 
        torch_dtype=torch.float16,
        device_map="cpu",
        low_cpu_mem_usage=True
    )
    
    # Save model to local directory
    print(f"Saving model to {output_dir}...")
    model.save_pretrained(output_dir)
    print("Model downloaded and saved successfully")
    
except Exception as e:
    print(f"Error downloading model: {str(e)}")
    sys.exit(1) 