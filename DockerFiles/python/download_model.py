import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import os
import gc
import time
import sys

# Set environment variables for longer timeouts and configure retries
os.environ["HUGGINGFACE_HUB_DOWNLOAD_TIMEOUT"] = "1800"  # 30 minutes
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Set a smaller but reliable model
model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

print(f"Downloading {model_name} tokenizer...")
max_retries = 5
retry_count = 0

# Try downloading tokenizer with retries
while retry_count < max_retries:
    try:
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            local_files_only=False,
            resume_download=True
        )
        print("Tokenizer downloaded successfully")
        break
    except Exception as e:
        retry_count += 1
        print(f"Download attempt {retry_count} failed: {str(e)}")
        if retry_count >= max_retries:
            print("Max retries exceeded. Exiting.")
            sys.exit(1)
        print(f"Retrying in 10 seconds...")
        time.sleep(10)

# Force garbage collection
gc.collect()
if torch.cuda.is_available():
    torch.cuda.empty_cache()

print("Downloading model (this may take a while)...")
# Reset retry counter
retry_count = 0

# Try downloading model with retries
while retry_count < max_retries:
    try:
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="cpu",
            low_cpu_mem_usage=True,
            local_files_only=False,
            resume_download=True
        )
        print("Model downloaded successfully")
        break
    except Exception as e:
        retry_count += 1
        print(f"Download attempt {retry_count} failed: {str(e)}")
        if retry_count >= max_retries:
            print("Max retries exceeded. Exiting.")
            sys.exit(1)
        print(f"Retrying in 10 seconds...")
        time.sleep(10)

print("Download process completed successfully")
