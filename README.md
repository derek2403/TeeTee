# TeeTee
**LLM Sharing Across Multiple Verifiable TEE with Decentralized Inference**

![Logo](https://github.com/derek2403/TeeTee/blob/main/public/logo.png?raw=true)

A breakthrough infrastructure that splits massive large LLM across multiple TEE, allowing organizations to collectively access high-performance AI at a fraction of the cost while maintaining complete data privacy and security.

---

## Inspiration: How We Came Up with This Idea

At our solution provider company, we often wanted to leverage AI but were hesitant to send sensitive data to third-party LLM providers. We knew this was a common concern for many others as well. The obvious alternative was self-hosting, but we quickly realized the enormous cost involved.
Running a high-performance LLM required significant resources, and with a limited budget, we could only afford to host smaller models often at the expense of performance. Even when we considered hosting a mid-sized model, we needed a way to cover the costs.

We thought:

> *“What if we could break down a powerful AI model into smaller pieces, distribute them across secure environments, and create a secure network where everyone shares the costs while keeping their data private and enjoying uncompromised performance?”*

This exploration led us to the concept of distributed **LLM sharding** within **Trusted Execution Environments (TEEs)** by creating a secure, decentralized approach to AI inference that maintains low cost, high performance and privacy.

---

## The Problem

Organizations face several significant challenges when attempting to leverage advanced AI capabilities:

**1. Privacy Concerns:** Sending sensitive data to third-party LLM providers poses unacceptable risks for many organizations

**2. Prohibitive Costs:** Self-hosting large models (200B+ parameters or more) requires substantial computing resources, making it financially unfeasible for most

**3. Performance Limitations:** Budget constraints often force companies to use smaller, less capable models

**4. TEE Limitations:** Even when using TEE for secure sharing, memory constraints significantly limit the size of models that can be hosted, creating barriers when organizations want to offer their models to others while maintaining data protection

**5. Resource Underutilization:** Individual organizations purchasing dedicated infrastructure leads to inefficient resource allocation


---

## The Solution

TeeTee addresses these challenges by implementing distributed model sharding across multiple Trusted Execution Environments:

**1. Secure Model Partitioning:** We shard large-scale LLMs across multiple TEEs, with each TEE hosting specific layers of the model

**2. Decentralized Inference:** The inference process is distributed across these shards, ensuring data and parameters remain confidential

**3. Resource Pooling:** Organizations contribute to hosting model shards, sharing the infrastructure costs

**4. Economic Incentives:** Contributors gain access to higher-quality models than they could afford individually, plus revenue from API access sold to non-contributors

**5. Performance Without Compromise:** This approach bypasses individual TEE memory limitations while maintaining high performance and data security

In short, TeeTee enables contributors to gain access to higher-quality models than they could afford individually. For example, if Company A has only $50K to invest in hosting an LLM (when a high-performance model costs $100K), they can join forces with Company B (who also has $50K). By splitting the model into two shards, each company hosting one shard but both companies can access the $100K performance model while only paying half the cost individually. This principle scales with more participants (3+ companies), enabling access to even more powerful models that would otherwise be financially out of reach for any single organization.

---

## How Our Project Works
This is done by 2 tracks: either users pay for LLM tokens usage or host their own LLM shard in a TEE.


### Project Flow 1: Self-Hosting

1. **Choose Model & Slot**
   - Select an available slot for hosting half of a Tiny Llama model shard from the Pool Contribution website.

2. **Setup Environment**
   - Connect your wallet for authentication.
   - Copy the provided YAML file and host it on Phala Network via [Phala Cloud](https://cloud.phala.network/register?invite=PHALAWIKI).

3. **Finalize Hosting**
   - After deployment, copy the generated URL from Phala Network.
   - Our backend verifies the model hash and functionality, and the hash is publicly verifiable for transparency and trust.
   - After verification, a dashboard will be shown to see the usage of the shard of the model.

4. **Profit Sharing & Access**
   - Model shard details are stored in a smart contract, automatically managing profit-sharing of all the users that hosted the LLM shard.
   - Users who top up their LLM tokens with ETH can utilize their hosted model without additional costs.

### Project Flow 2: Token-Based Usage

1. **Purchase Tokens**
   - Connect your wallet via the AI Chat interface and buy LLM tokens using ETH.

2. **Use AI Service**
   - Spend tokens to generate responses directly in AI Chat.
   - Each query and response cost tokens and require an on-chain transaction signing, ensuring traceability and security.

3. **Verification**
   - All inputs and outputs have on-chain attestations, visible on Phala's on-chain report explorer, enabling secure verification of responses.

---


## System Architecture

![System Architecture Diagram](https://github.com/derek2403/TeeTee/blob/main/public/systemArchitecture.png?raw=true)

Self-hosting involves downloading an opensource LLM such as GPT-2 or TinyLlma from Ollama, DeepSeek, or Hugging Face, and splitting its layers into shards. For instance, our code and demo with Tiny Llama:

- **Shard 1 (Layers 1–11)**: Uploaded into a Docker image and hosted on the first TEE (TEE 1) on Phala Network, generating an accessible URL.
- **Shard 2 (Layers 12–22)**: Hosted similarly on a second TEE (TEE 2), which takes the URL from TEE 1 as input and generates a final URL.

This final URL can then be accessed via POST requests to perform inference across the sharded LLM securely and efficiently.

### URL and Data Flow

Here's an illustration of this process clearly showing paths and ports:

![Data Diagram](https://raw.githubusercontent.com/derek2403/TeeTee/refs/heads/main/public/HowItWorks.png)


**Endpoint Communication Flow (Top Diagram)**:

1. **User Request**: User sends a request to TEE 1 at `TEE1URL/generate` (Port 5002).
2. **Internal Processing (TEE 1)**: Converts user input into a tensor (machine-readable) internally via the `/process` path.
3. **Forward to TEE 2**: Processed tensor is sent to TEE 2 at `TEE2URL/generate` (Port 5001).
4. **TEE 2 Generation**: TEE 2 generates a response from tensor input and sends it back to TEE 1.
5. **Response Back to User**: TEE 1 returns TEE 2’s output directly back to the user through the original `TEE1URL/generate` endpoint.

**Data Flow with Attestation (Bottom Diagram)**:

1. **User Query**: User submits a query (e.g., \"What is Ethereum?\") to TEE 1.
2. **TEE 1 Attestation**: TEE 1 processes and converts the query to tensor form and generates an **On Chain Attestation Report**, verifying authenticity.
3. **Data to TEE 2**: TEE 1 forwards this tensor data to TEE 2.
4. **TEE 2 Processing and Attestation**: TEE 2 processes tensor data, generates a human-readable response, and attaches its own **On Chain Attestation Report**.
5. **Final Response**: TEE 2's output (with attestation) is sent back through TEE 1 to the user. TEE 1 merely acts as a relay with no further processing.

**Why this Design?**  
Passing responses through TEE 1 ensures users interact with a single endpoint, simplifying integration and improving overall usability and convenience.

> ⚠️ **Note:** This is an early-stage PoC implemented over a focused 3-day sprint. It serves as a foundational demo of our concept. For a look at the complete system architecture we're building toward, see the [Future Implementation](#future-implementation) section below.

---

## Tech Stack Overview

- **Next.js 15** – Front-end framework
- **Three.js** – Interactive front-end visuals
- **Tailwind CSS** – UI styling
- **Hero UI (formerly NextUI)** – UI components library
- **RainbowKit** – Wallet integration
- **Base Blockchain** – Payments for LLM tokens and profit splitting
- **Phala Network** – TEE hosting and on chain attestation proofs
- **Docker** – Containerization for hosting code securely in Phala TEEs
- **Ethers.js** – Blockchain interaction and smart contract integration

---

## How We Are Different

---

We recognized a key gap: many teams want to securely wrap LLMs within a Trusted Execution Environment (TEE), but existing TEEs have strict size limits, preventing large models from being fully hosted. Moreover, current GPU providers, although helpful in hosting models, operate centralized services and cannot fully guarantee data privacy.

Here's how TeeTee is uniquely positioned:

| **Feature**                      | **Traditional GPU Providers**                         | **TeeTee**                                  |
|----------------------------------|-------------------------------------------------------|---------------------------------------------|
| **LLM Hosting Capability**       | Constrained by single GPU or TEE memory limits, availability, and high costs | Flexible and scalable via model sharding across multiple TEEs, overcoming memory limitations |
| **Privacy & Security Assurance** | Limited privacy guarantees due to centralized infrastructure | Fully secure through decentralized TEEs with verifiable on-chain attestations |
| **Infrastructure Centralization**| Completely centralized; dependent on a single provider's infrastructure | Fully decentralized; operates similarly to blockchain nodes with independent TEEs |
| **Fault Tolerance**              | High risk of downtime or failure due to single provider dependency | Robust fault tolerance; automatic replacement and redundancy if any single TEE fails |
| **Decentralization & Control**   | Provider-controlled GPU servers, causing dependency and centralization | Community-driven and decentralized; the more participants hosting TEEs, the greater the network resilience |


In summary, TeeTee provides a secure, scalable, and fully decentralized approach to LLM inference, overcoming limitations faced by current GPU and TEE-based solutions.


## Future Implementations


---


## Team

- **Derek Liew Qi Jian**  
  - *Role*: Project Lead, AI & 
  - [LinkedIn](https://www.linkedin.com/in/derek2403/) | [Twitter](https://x.com/derek2403)

- **Phen Jing Yuan**  
  - *Role*: TEE & Frontend Integration  
  - [LinkedIn](https://www.linkedin.com/in/jing-yuan-phen-b42266295/) | [Twitter](https://x.com/ilovedahmo)

