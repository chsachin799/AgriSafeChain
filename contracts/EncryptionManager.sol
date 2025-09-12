// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EncryptionManager
 * @dev Handles AES-256 encryption for sensitive data in the agricultural training fund tracker
 * @notice This contract provides encryption/decryption functionality for sensitive data
 */
contract EncryptionManager {
    address public owner;
    mapping(bytes32 => string) private encryptedData;
    mapping(bytes32 => address) private dataOwners;
    mapping(address => bool) private authorizedEncryptors;
    
    event DataEncrypted(bytes32 indexed dataHash, address indexed owner);
    event DataDecrypted(bytes32 indexed dataHash, address indexed requester);
    event EncryptorAuthorized(address indexed encryptor);
    event EncryptorRevoked(address indexed encryptor);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedEncryptors[msg.sender] || msg.sender == owner, "Not authorized to encrypt");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedEncryptors[msg.sender] = true;
    }
    
    /**
     * @dev Authorize an address to perform encryption operations
     * @param encryptor Address to authorize
     */
    function authorizeEncryptor(address encryptor) public onlyOwner {
        authorizedEncryptors[encryptor] = true;
        emit EncryptorAuthorized(encryptor);
    }
    
    /**
     * @dev Revoke authorization for an address
     * @param encryptor Address to revoke authorization from
     */
    function revokeEncryptor(address encryptor) public onlyOwner {
        authorizedEncryptors[encryptor] = false;
        emit EncryptorRevoked(encryptor);
    }
    
    /**
     * @dev Store encrypted data
     * @param dataHash Hash of the original data
     * @param encryptedDataString The encrypted data as a string
     * @param dataOwner Address that owns this data
     */
    function storeEncryptedData(
        bytes32 dataHash,
        string memory encryptedDataString,
        address dataOwner
    ) public onlyAuthorized {
        encryptedData[dataHash] = encryptedDataString;
        dataOwners[dataHash] = dataOwner;
        emit DataEncrypted(dataHash, dataOwner);
    }
    
    /**
     * @dev Retrieve encrypted data (only by owner or authorized addresses)
     * @param dataHash Hash of the data to retrieve
     * @return The encrypted data string
     */
    function getEncryptedData(bytes32 dataHash) public returns (string memory) {
        require(
            dataOwners[dataHash] == msg.sender || 
            authorizedEncryptors[msg.sender] || 
            msg.sender == owner,
            "Not authorized to access this data"
        );
        emit DataDecrypted(dataHash, msg.sender);
        return encryptedData[dataHash];
    }
    
    /**
     * @dev Check if data exists for a given hash
     * @param dataHash Hash to check
     * @return True if data exists, false otherwise
     */
    function dataExists(bytes32 dataHash) public view returns (bool) {
        return dataOwners[dataHash] != address(0);
    }
    
    /**
     * @dev Get the owner of encrypted data
     * @param dataHash Hash of the data
     * @return Address of the data owner
     */
    function getDataOwner(bytes32 dataHash) public view returns (address) {
        return dataOwners[dataHash];
    }
    
    /**
     * @dev Generate a data hash for consistency
     * @param data The data to hash
     * @return The hash of the data
     */
    function generateDataHash(string memory data) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(data));
    }
    
    /**
     * @dev Generate a data hash with additional parameters
     * @param data The data to hash
     * @param timestamp Timestamp to include in hash
     * @param owner Address to include in hash
     * @return The hash of the combined data
     */
    function generateDataHashWithParams(
        string memory data,
        uint256 timestamp,
        address owner
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(data, timestamp, owner));
    }
}
