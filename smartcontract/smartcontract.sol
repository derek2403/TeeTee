// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title AIQuotaToken
 * @dev Smart contract to manage AI token quotas based on ETH payments
 */
contract AIQuotaToken {
    address public owner;
    uint256 public constant TOKEN_RATE = 100000; // Tokens per 0.002 ETH
    uint256 public constant MINIMUM_PAYMENT = 2000000000000000 ether;

    // Mapping to store user token balances
    mapping(address => uint256) public tokenBalances;

    // Total ETH collected in the pool
    uint256 public totalPoolBalance;

    // Events
    event TokensPurchased(
        address indexed user,
        uint256 ethAmount,
        uint256 tokenAmount
    );
    event TokensUsed(address indexed user, uint256 tokenAmount);
    event WithdrawalByOwner(uint256 amount);

    constructor() {
        owner = msg.sender;
        totalPoolBalance = 0;
    }

    // Modifier to restrict certain functions to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    /**
 * @dev Function to purchase tokens by specifying wei amount
 * @param weiAmount The amount of wei to spend on tokens
 */
function purchaseTokens(uint256 weiAmount) external payable {
    require(weiAmount >= 2000000000000000, "Minimum payment is 0.002 ETH (2000000000000000 wei)");
    require(msg.value >= weiAmount, "Sent ETH must be at least the specified amount");
    
    // Calculate tokens to mint based on wei specified (100000 tokens per 0.002 ETH)
    uint256 tokensToMint = (weiAmount * TOKEN_RATE) / 2000000000000000;
    
    // Update user's token balance
    tokenBalances[msg.sender] += tokensToMint;
    
    // Update the pool balance
    totalPoolBalance += weiAmount;
    
    // If user sent more ETH than specified, refund the difference
    if (msg.value > weiAmount) {
        payable(msg.sender).transfer(msg.value - weiAmount);
    }
    
    emit TokensPurchased(msg.sender, weiAmount, tokensToMint);
}

    /**
     * @dev Function to use tokens (called by authorized service)
     * @param user The address of the user whose tokens will be used
     * @param tokenAmount The amount of tokens to use
     */
    function useTokens(address user, uint256 tokenAmount) external onlyOwner {
        require(
            tokenBalances[user] >= tokenAmount,
            "Insufficient token balance"
        );

        // Deduct tokens from user's balance
        tokenBalances[user] -= tokenAmount;

        emit TokensUsed(user, tokenAmount);
    }

    /**
     * @dev Function to check token balance
     * @return The token balance of the caller
     */
    function checkBalance() external view returns (uint256) {
        return tokenBalances[msg.sender];
    }

    /**
     * @dev Function for owner to withdraw ETH from the pool
     * @param amount The amount of ETH to withdraw
     */
    function withdrawPool(uint256 amount) external onlyOwner {
        require(
            amount <= totalPoolBalance,
            "Cannot withdraw more than the pool balance"
        );

        totalPoolBalance -= amount;
        payable(owner).transfer(amount);

        emit WithdrawalByOwner(amount);
    }

    /**
     * @dev Function to transfer contract ownership
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        owner = newOwner;
    }
}
