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

## Architecture & Tech Stack



### Architectural Diagram


---

### Tech Stack Overview



---

## Future Implementations


---

## How We Are Different


---

## Team

- **Derek Liew Qi Jian**  
  - *Role*: Project Lead, AI & 
  - [LinkedIn](https://www.linkedin.com/in/derek2403/) | [Twitter](https://x.com/derek2403)

- **Phen Jing Yuan**  
  - *Role*: TEE & Frontend Integration  
  - [LinkedIn](https://www.linkedin.com/in/jing-yuan-phen-b42266295/) | [Twitter](https://x.com/ilovedahmo)

