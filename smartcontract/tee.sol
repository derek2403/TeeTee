// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract HostedLLM {
    address public contractOwner;
    
    // Token constants
    uint256 public constant TOKEN_RATE = 100000; // Tokens per 0.002 ETH
    uint256 public constant MINIMUM_PAYMENT = 2000000000000000; // 0.002 ETH in wei

    // Structure to hold owner details, URL and pool balance in one record.
    struct HostedLLMEntry {
        address owner1;
        address owner2;
        string url;
        uint256 poolBalance;
    }

    HostedLLMEntry[] public hostedLLMs;
    
    // Mapping to store user token balances
    mapping(address => uint256) public tokenBalances;

    // Events for logging
    event HostedLLMCreated(uint256 indexed llmId, address owner1, address owner2, string url);
    event HostedLLMEdited(uint256 indexed llmId, address owner1, address owner2, string url);
    event HostedLLMRemoved(uint256 indexed llmId);
    event PoolDeposited(uint256 indexed llmId, uint256 amount);
    event PoolWithdrawn(uint256 indexed llmId, uint256 amount, address to1, address to2);
    event TokensPurchased(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event TokensUsed(address indexed user, uint256 tokenAmount);

    constructor() {
        contractOwner = msg.sender;
    }

    /**
     * @dev Create a new HostedLLM entry with two owners and a URL.
     * @param _owner1 Address of owner 1.
     * @param _owner2 Address of owner 2.
     * @param _url URL associated with this entry.
     */
    function createHostedLLM(address _owner1, address _owner2, string calldata _url) external {
        require(_owner1 != address(0), "Invalid owner1 address");
        require(_owner2 != address(0), "Invalid owner2 address");
        require(bytes(_url).length > 0, "URL is required");

        hostedLLMs.push(HostedLLMEntry({
            owner1: _owner1,
            owner2: _owner2,
            url: _url,
            poolBalance: 0
        }));

        emit HostedLLMCreated(hostedLLMs.length - 1, _owner1, _owner2, _url);
    }
    
    /**
     * @dev Edit the HostedLLM entry to update owner addresses and URL if needed.
     *      Pass in address(0) for any owner field you do not want to change.
     *      For URL, pass in "0" (as a string) if no change is needed.
     * @param llmId The ID of the HostedLLM entry.
     * @param _newOwner1 New address for owner1. If address(0), no change.
     * @param _newOwner2 New address for owner2. If address(0), no change.
     * @param _newUrl New URL. If "0", no change.
     */
    function editHostedLLM(uint256 llmId, address _newOwner1, address _newOwner2, string calldata _newUrl) external {
        require(llmId < hostedLLMs.length, "Invalid LLM id");
        HostedLLMEntry storage entry = hostedLLMs[llmId];
        
        // Update owner1 if a new valid address is provided
        if (_newOwner1 != address(0)) {
            entry.owner1 = _newOwner1;
        }
        // Update owner2 if a new valid address is provided
        if (_newOwner2 != address(0)) {
            entry.owner2 = _newOwner2;
        }
        // Update URL if _newUrl is not "0"
        if (keccak256(bytes(_newUrl)) != keccak256(bytes("0"))) {
            entry.url = _newUrl;
        }
        
        emit HostedLLMEdited(llmId, entry.owner1, entry.owner2, entry.url);
    }

    /**
     * @dev Remove a HostedLLM entry if its pool balance is zero.
     * @param llmId The ID of the HostedLLM entry to remove.
     */
    function removeHostedLLM(uint256 llmId) external {
        require(llmId < hostedLLMs.length, "Invalid LLM id");
        require(hostedLLMs[llmId].poolBalance == 0, "Pool balance must be zero");

        // If this is not the last element, move the last element to the position of the removed one
        if (llmId < hostedLLMs.length - 1) {
            hostedLLMs[llmId] = hostedLLMs[hostedLLMs.length - 1];
        }

        // Remove the last element
        hostedLLMs.pop();
        
        emit HostedLLMRemoved(llmId);
    }

    /**
     * @dev Deposit ETH to a specific HostedLLM pool and receive tokens.
     * For every 0.002 ETH deposited, user receives 100,000 tokens.
     * @param llmId The ID of the HostedLLM entry.
     */
    function depositToPool(uint256 llmId) external payable {
        require(llmId < hostedLLMs.length, "Invalid LLM id");
        require(msg.value >= MINIMUM_PAYMENT, "Minimum payment is 0.002 ETH");

        // Calculate tokens based on deposit (100,000 tokens per 0.002 ETH)
        uint256 tokensToMint = (msg.value * TOKEN_RATE) / MINIMUM_PAYMENT;
        
        // Update user's token balance
        tokenBalances[msg.sender] += tokensToMint;
        
        // Update pool balance
        hostedLLMs[llmId].poolBalance += msg.value;
        
        emit PoolDeposited(llmId, msg.value);
        emit TokensPurchased(msg.sender, msg.value, tokensToMint);
    }

    /**
     * @dev Withdraw all funds from a specific HostedLLM pool and split them between the two owners.
     * @param llmId The ID of the HostedLLM entry.
     */
    function withdrawFromPool(uint256 llmId) external {
        require(llmId < hostedLLMs.length, "Invalid LLM id");
        
        HostedLLMEntry storage entry = hostedLLMs[llmId];
        uint256 amount = entry.poolBalance;
        
        require(amount > 0, "Pool is empty");
        
        // Ensure both owner addresses are valid
        require(entry.owner1 != address(0) && entry.owner2 != address(0), "Invalid owner addresses");
        
        // Update pool balance to zero
        entry.poolBalance = 0;
        
        // Split the amount equally between the two owners
        uint256 halfAmount = amount / 2;
        uint256 remainingAmount = amount - halfAmount; // In case of odd amount, owner2 gets the extra wei
        
        // Transfer to both owners
        payable(entry.owner1).transfer(halfAmount);
        payable(entry.owner2).transfer(remainingAmount);
        
        emit PoolWithdrawn(llmId, amount, entry.owner1, entry.owner2);
    }

    /**
     * @dev Use tokens from the caller's balance.
     * Any user can call this function to use their own tokens.
     * @param tokenAmount The amount of tokens to use.
     */
    function useTokens(uint256 tokenAmount) external {
        require(tokenBalances[msg.sender] >= tokenAmount, "Insufficient token balance");
        
        // Deduct tokens from user's balance
        tokenBalances[msg.sender] -= tokenAmount;
        
        emit TokensUsed(msg.sender, tokenAmount);
    }
    
    /**
     * @dev Check token balance of caller.
     * @return User's token balance.
     */
    function checkBalance() external view returns (uint256) {
        return tokenBalances[msg.sender];
    }

    function getHostedLLM(uint256 llmId) external view returns (
        address owner1,
        address owner2,
        string memory url,
        uint256 poolBalance
    ) {
        require(llmId < hostedLLMs.length, "Invalid LLM id");
        HostedLLMEntry storage entry = hostedLLMs[llmId];
        return (entry.owner1, entry.owner2, entry.url, entry.poolBalance);
    }

    /**
     * @dev Returns the total number of HostedLLM entries.
     */
    function totalHostedLLMs() external view returns (uint256) {
        return hostedLLMs.length;
    }

    function getAllHostedLLMs() external view returns (HostedLLMEntry[] memory) {
        return hostedLLMs;
    }
}
