// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AgriTrainingFundTracker {
    address public government;
    uint256 public consensusThreshold = 3; // Minimum validators for consensus
    uint256 public constant MAX_FUND_AMOUNT = 1000 ether; // Maximum fund allocation per center
    uint256 public constant MIN_FUND_AMOUNT = 0.01 ether; // Minimum fund allocation
    
    // KYC and Compliance
    mapping(address => bool) public kycVerified;
    mapping(address => bool) public complianceApproved;
    mapping(address => uint256) public kycTimestamp;
    
    // Consensus and Validation
    mapping(bytes32 => mapping(address => bool)) public validators;
    mapping(bytes32 => uint256) public validationCount;
    mapping(bytes32 => bool) public consensusReached;
    
    // Audit Trail
    struct AuditEntry {
        address actor;
        string action;
        uint256 timestamp;
        bytes32 dataHash;
        bool isEncrypted;
    }
    
    AuditEntry[] public auditTrail;
    mapping(bytes32 => bool) public processedTransactions;
    
    // Real-time Monitoring
    struct MonitoringData {
        uint256 totalTransactions;
        uint256 totalFundsAllocated;
        uint256 totalFundsUsed;
        uint256 activeCenters;
        uint256 activeFarmers;
        uint256 activeTrainers;
        uint256 lastUpdate;
    }
    
    MonitoringData public monitoringData;

    constructor() {
        government = msg.sender;
        kycVerified[government] = true;
        complianceApproved[government] = true;
        kycTimestamp[government] = block.timestamp;
    }

    modifier onlyGov() {
        require(msg.sender == government, "Only government can call this");
        _;
    }

    modifier onlyRegisteredCenter() {
        require(centers[msg.sender].isRegistered, "Not a registered center");
        _;
    }
    
    modifier onlyKYCVerified() {
        require(kycVerified[msg.sender], "KYC verification required");
        _;
    }
    
    modifier onlyComplianceApproved() {
        require(complianceApproved[msg.sender], "Compliance approval required");
        _;
    }
    
    modifier validFundAmount(uint256 amount) {
        require(amount >= MIN_FUND_AMOUNT && amount <= MAX_FUND_AMOUNT, "Invalid fund amount");
        _;
    }

    struct TrainingCenter {
        string name;
        bool isRegistered;
        uint256 totalAllocated;
        uint256 totalUsed;
        address[] trainers;
        address[] farmers;
        address linkedGov;
        bool isActive;
        bool kycVerified;
        bool complianceApproved;
        uint256 registrationTimestamp;
        string location;
        string contactInfo;
    }

    struct UsageReport {
        uint256 amount;
        string purpose;
        uint256 timestamp;
        bytes32 dataHash;
        bool isEncrypted;
        address reporter;
        string[] attachments; // IPFS hashes for supporting documents
    }

    struct Farmer {
        string name;
        address center;
        bool isRegistered;
        bool trainingCompleted;
        uint256 attendanceCount;
        bool kycVerified;
        uint256 registrationTimestamp;
        string aadharNumber;
        string contactInfo;
        string[] certificates; // IPFS hashes for certificates
    }

    struct Trainer {
        string name;
        address center;
        bool isRegistered;
        bool kycVerified;
        uint256 registrationTimestamp;
        string qualifications;
        string contactInfo;
        uint256 experienceYears;
        string[] certifications; // IPFS hashes for certifications
    }
    
    struct ComplianceRule {
        string ruleId;
        string description;
        bool isActive;
        uint256 createdTimestamp;
        address createdBy;
    }
    
    struct FundingSource {
        string sourceId;
        string name;
        uint256 totalAmount;
        uint256 usedAmount;
        bool isActive;
        address sourceAddress;
    }

    mapping(address => TrainingCenter) public centers;
    mapping(address => UsageReport[]) public usageLogs;
    mapping(address => Farmer) public farmers;
    mapping(address => Trainer) public trainers;
    mapping(string => ComplianceRule) public complianceRules;
    mapping(string => FundingSource) public fundingSources;
    mapping(address => bool) public validators;
    mapping(address => uint256) public validatorStake;
    
    // Events for KYC and Compliance
    event KYCVerified(address indexed user, uint256 timestamp);
    event ComplianceApproved(address indexed user, uint256 timestamp);
    event ComplianceRuleCreated(string ruleId, string description, address createdBy);
    
    // Events for Consensus and Validation
    event TransactionValidated(bytes32 indexed transactionHash, address validator);
    event ConsensusReached(bytes32 indexed transactionHash, uint256 validationCount);
    event ValidatorAdded(address indexed validator, uint256 stake);
    event ValidatorRemoved(address indexed validator);
    
    // Events for Audit Trail
    event AuditEntryCreated(address indexed actor, string action, bytes32 dataHash);
    event DataEncrypted(bytes32 indexed dataHash, string encryptionKey);
    
    // Events for Real-time Monitoring
    event MonitoringDataUpdated(uint256 totalTransactions, uint256 totalFundsAllocated);
    event AnomalyDetected(string description, uint256 severity);
    
    // Enhanced existing events
    event CenterRegistered(address center, string name, string location);
    event FundAllocated(address center, uint256 amount, string source);
    event UsageReported(address center, uint256 amount, string purpose, bytes32 dataHash);
    event FarmerRegistered(address farmer, string name, address center, string aadharNumber);
    event TrainerRegistered(address trainer, string name, address center, string qualifications);
    event TrainingMarkedCompleted(address farmer, uint256 timestamp);
    event AttendanceMarked(address farmer, uint256 totalAttendance, uint256 timestamp);
    event CenterStatusChanged(address center, bool isActive, uint256 timestamp);
    
    // New events for enhanced functionality
    event CertificateIssued(address farmer, string certificateHash);
    event ComplianceViolation(address user, string ruleId, string description);
    event FundingSourceAdded(string sourceId, string name, uint256 amount);
    event DataValidated(bytes32 dataHash, bool isValid, string reason);

    // Register a training center
    function registerCenter(address centerAddress, string memory name) public onlyGov {
        require(!centers[centerAddress].isRegistered, "Already registered");
        centers[centerAddress] = TrainingCenter(
            name,
            true,
            0,
            0,
            new address[](0),
            new address[](0),
            msg.sender,
            true
        );
        emit CenterRegistered(centerAddress, name);
    }

    // Activate or deactivate a center
    function setCenterStatus(address centerAddress, bool status) public onlyGov {
        require(centers[centerAddress].isRegistered, "Center not registered");
        centers[centerAddress].isActive = status;
        emit CenterStatusChanged(centerAddress, status);
    }

    // Allocate funds to a center
    function allocateFunds(address centerAddress, uint256 amount) public payable onlyGov {
        require(centers[centerAddress].isRegistered, "Center not registered");
        require(centers[centerAddress].isActive, "Center is not active");
        require(msg.value == amount, "Sent ETH amount must match the allocated amount");
        
        // Transfer ETH directly to the center's wallet
        (bool sent, ) = centerAddress.call{value: amount}("");
        require(sent, "Failed to send Ether");

        centers[centerAddress].totalAllocated += amount;
        emit FundAllocated(centerAddress, amount);
    }

    // Report usage by training center
    function reportUsage(uint256 amount, string memory purpose) public onlyRegisteredCenter {
        require(centers[msg.sender].isActive, "Center is inactive");
        require(amount <= centers[msg.sender].totalAllocated - centers[msg.sender].totalUsed, "Insufficient balance");

        centers[msg.sender].totalUsed += amount;
        usageLogs[msg.sender].push(UsageReport(amount, purpose, block.timestamp));

        emit UsageReported(msg.sender, amount, purpose);
    }

    // Register a trainer
    function registerTrainer(address trainerAddress, string memory name) public onlyRegisteredCenter {
        require(!trainers[trainerAddress].isRegistered, "Trainer already registered");
        trainers[trainerAddress] = Trainer(name, msg.sender, true);
        centers[msg.sender].trainers.push(trainerAddress);
        emit TrainerRegistered(trainerAddress, name, msg.sender);
    }

    // Register a farmer
    function registerFarmer(address farmerAddress, string memory name) public onlyRegisteredCenter {
        require(!farmers[farmerAddress].isRegistered, "Farmer already registered");
        farmers[farmerAddress] = Farmer(name, msg.sender, true, false, 0);
        centers[msg.sender].farmers.push(farmerAddress);
        emit FarmerRegistered(farmerAddress, name, msg.sender);
    }

    // Mark farmer training as completed
    function markTrainingCompleted(address farmerAddress) public {
        require(trainers[msg.sender].isRegistered, "Only registered trainer can mark");
        require(farmers[farmerAddress].isRegistered, "Farmer not registered");
        require(trainers[msg.sender].center == farmers[farmerAddress].center, "Trainer and farmer must belong to same center");

        farmers[farmerAddress].trainingCompleted = true;
        emit TrainingMarkedCompleted(farmerAddress);
    }

    // Mark attendance for a farmer
    function markAttendance(address farmerAddress) public {
        require(trainers[msg.sender].isRegistered, "Only trainer can mark attendance");
        require(farmers[farmerAddress].isRegistered, "Farmer not registered");
        require(trainers[msg.sender].center == farmers[farmerAddress].center, "Mismatch center");

        farmers[farmerAddress].attendanceCount++;
        emit AttendanceMarked(farmerAddress, farmers[farmerAddress].attendanceCount);
    }

    // View usage logs
    function getUsageReports(address center) public view returns (UsageReport[] memory) {
        return usageLogs[center];
    }

    // View center details
    function getCenterDetails(address center) public view returns (TrainingCenter memory) {
        return centers[center];
    }

    // View farmer details
    function getFarmerDetails(address farmer) public view returns (Farmer memory) {
        return farmers[farmer];
    }

    // View trainer details
    function getTrainerDetails(address trainer) public view returns (Trainer memory) {
        return trainers[trainer];
    }

    // List trainers of a center
    function listCenterTrainers(address center) public view returns (address[] memory) {
        return centers[center].trainers;
    }

    // List farmers of a center
    function listCenterFarmers(address center) public view returns (address[] memory) {
        return centers[center].farmers;
    }
    
    // ========== KYC AND COMPLIANCE FUNCTIONS ==========
    
    function verifyKYC(address user) public onlyGov {
        require(!kycVerified[user], "Already KYC verified");
        kycVerified[user] = true;
        kycTimestamp[user] = block.timestamp;
        _addAuditEntry(user, "KYC_VERIFIED", keccak256(abi.encodePacked(user, block.timestamp)));
        emit KYCVerified(user, block.timestamp);
    }
    
    function approveCompliance(address user) public onlyGov {
        require(kycVerified[user], "KYC verification required first");
        require(!complianceApproved[user], "Already compliance approved");
        complianceApproved[user] = true;
        _addAuditEntry(user, "COMPLIANCE_APPROVED", keccak256(abi.encodePacked(user, block.timestamp)));
        emit ComplianceApproved(user, block.timestamp);
    }
    
    function createComplianceRule(string memory ruleId, string memory description) public onlyGov {
        require(bytes(complianceRules[ruleId].ruleId).length == 0, "Rule already exists");
        complianceRules[ruleId] = ComplianceRule(ruleId, description, true, block.timestamp, msg.sender);
        _addAuditEntry(msg.sender, "COMPLIANCE_RULE_CREATED", keccak256(abi.encodePacked(ruleId, description)));
        emit ComplianceRuleCreated(ruleId, description, msg.sender);
    }
    
    // ========== CONSENSUS AND VALIDATION FUNCTIONS ==========
    
    function addValidator(address validator, uint256 stake) public onlyGov {
        require(!validators[validator], "Already a validator");
        validators[validator] = true;
        validatorStake[validator] = stake;
        _addAuditEntry(msg.sender, "VALIDATOR_ADDED", keccak256(abi.encodePacked(validator, stake)));
        emit ValidatorAdded(validator, stake);
    }
    
    function removeValidator(address validator) public onlyGov {
        require(validators[validator], "Not a validator");
        validators[validator] = false;
        validatorStake[validator] = 0;
        _addAuditEntry(msg.sender, "VALIDATOR_REMOVED", keccak256(abi.encodePacked(validator)));
        emit ValidatorRemoved(validator);
    }
    
    function validateTransaction(bytes32 transactionHash) public {
        require(validators[msg.sender], "Not a validator");
        require(!processedTransactions[transactionHash], "Transaction already processed");
        require(!validators[transactionHash][msg.sender], "Already validated by this validator");
        
        validators[transactionHash][msg.sender] = true;
        validationCount[transactionHash]++;
        
        _addAuditEntry(msg.sender, "TRANSACTION_VALIDATED", transactionHash);
        emit TransactionValidated(transactionHash, msg.sender);
        
        if (validationCount[transactionHash] >= consensusThreshold) {
            consensusReached[transactionHash] = true;
            processedTransactions[transactionHash] = true;
            emit ConsensusReached(transactionHash, validationCount[transactionHash]);
        }
    }
    
    // ========== AUDIT TRAIL FUNCTIONS ==========
    
    function _addAuditEntry(address actor, string memory action, bytes32 dataHash) internal {
        auditTrail.push(AuditEntry(actor, action, block.timestamp, dataHash, false));
        emit AuditEntryCreated(actor, action, dataHash);
    }
    
    function addEncryptedAuditEntry(address actor, string memory action, bytes32 dataHash, string memory encryptionKey) public onlyGov {
        auditTrail.push(AuditEntry(actor, action, block.timestamp, dataHash, true));
        emit AuditEntryCreated(actor, action, dataHash);
        emit DataEncrypted(dataHash, encryptionKey);
    }
    
    function getAuditTrail(uint256 startIndex, uint256 count) public view returns (AuditEntry[] memory) {
        require(startIndex < auditTrail.length, "Start index out of bounds");
        uint256 endIndex = startIndex + count;
        if (endIndex > auditTrail.length) {
            endIndex = auditTrail.length;
        }
        
        AuditEntry[] memory result = new AuditEntry[](endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = auditTrail[i];
        }
        return result;
    }
    
    // ========== REAL-TIME MONITORING FUNCTIONS ==========
    
    function updateMonitoringData() public {
        monitoringData.totalTransactions = auditTrail.length;
        monitoringData.totalFundsAllocated = _calculateTotalFundsAllocated();
        monitoringData.totalFundsUsed = _calculateTotalFundsUsed();
        monitoringData.activeCenters = _calculateActiveCenters();
        monitoringData.activeFarmers = _calculateActiveFarmers();
        monitoringData.activeTrainers = _calculateActiveTrainers();
        monitoringData.lastUpdate = block.timestamp;
        
        emit MonitoringDataUpdated(monitoringData.totalTransactions, monitoringData.totalFundsAllocated);
    }
    
    function _calculateTotalFundsAllocated() internal view returns (uint256) {
        uint256 total = 0;
        // This would need to be implemented based on your specific logic
        return total;
    }
    
    function _calculateTotalFundsUsed() internal view returns (uint256) {
        uint256 total = 0;
        // This would need to be implemented based on your specific logic
        return total;
    }
    
    function _calculateActiveCenters() internal view returns (uint256) {
        uint256 count = 0;
        // This would need to be implemented based on your specific logic
        return count;
    }
    
    function _calculateActiveFarmers() internal view returns (uint256) {
        uint256 count = 0;
        // This would need to be implemented based on your specific logic
        return count;
    }
    
    function _calculateActiveTrainers() internal view returns (uint256) {
        uint256 count = 0;
        // This would need to be implemented based on your specific logic
        return count;
    }
    
    function detectAnomaly(string memory description, uint256 severity) public onlyGov {
        emit AnomalyDetected(description, severity);
        _addAuditEntry(msg.sender, "ANOMALY_DETECTED", keccak256(abi.encodePacked(description, severity)));
    }
    
    // ========== ENHANCED DATA VALIDATION FUNCTIONS ==========
    
    function validateData(bytes32 dataHash, string memory reason) public onlyGov returns (bool) {
        bool isValid = true; // Add your validation logic here
        emit DataValidated(dataHash, isValid, reason);
        _addAuditEntry(msg.sender, "DATA_VALIDATED", dataHash);
        return isValid;
    }
    
    // ========== FUNDING SOURCE MANAGEMENT ==========
    
    function addFundingSource(string memory sourceId, string memory name, uint256 amount, address sourceAddress) public onlyGov {
        require(bytes(fundingSources[sourceId].sourceId).length == 0, "Source already exists");
        fundingSources[sourceId] = FundingSource(sourceId, name, amount, 0, true, sourceAddress);
        _addAuditEntry(msg.sender, "FUNDING_SOURCE_ADDED", keccak256(abi.encodePacked(sourceId, name, amount)));
        emit FundingSourceAdded(sourceId, name, amount);
    }
    
    // ========== ENHANCED EXISTING FUNCTIONS ==========
    
    function registerCenterEnhanced(address centerAddress, string memory name, string memory location, string memory contactInfo) public onlyGov {
        require(!centers[centerAddress].isRegistered, "Already registered");
        require(kycVerified[centerAddress], "KYC verification required");
        
        centers[centerAddress] = TrainingCenter(
            name,
            true,
            0,
            0,
            new address[](0),
            new address[](0),
            msg.sender,
            true,
            true,
            true,
            block.timestamp,
            location,
            contactInfo
        );
        
        _addAuditEntry(msg.sender, "CENTER_REGISTERED", keccak256(abi.encodePacked(centerAddress, name)));
        emit CenterRegistered(centerAddress, name, location);
    }
    
    function allocateFundsEnhanced(address centerAddress, uint256 amount, string memory sourceId) public payable onlyGov validFundAmount(amount) {
        require(centers[centerAddress].isRegistered, "Center not registered");
        require(centers[centerAddress].isActive, "Center is not active");
        require(kycVerified[centerAddress], "Center KYC verification required");
        require(complianceApproved[centerAddress], "Center compliance approval required");
        require(msg.value == amount, "Sent ETH amount must match the allocated amount");
        
        // Transfer ETH directly to the center's wallet
        (bool sent, ) = centerAddress.call{value: amount}("");
        require(sent, "Failed to send Ether");
        
        centers[centerAddress].totalAllocated += amount;
        
        // Update funding source if provided
        if (bytes(sourceId).length > 0) {
            require(fundingSources[sourceId].isActive, "Invalid funding source");
            fundingSources[sourceId].usedAmount += amount;
        }
        
        _addAuditEntry(msg.sender, "FUNDS_ALLOCATED", keccak256(abi.encodePacked(centerAddress, amount, sourceId)));
        emit FundAllocated(centerAddress, amount, sourceId);
    }
    
    function reportUsageEnhanced(uint256 amount, string memory purpose, string[] memory attachments) public onlyRegisteredCenter onlyKYCVerified {
        require(centers[msg.sender].isActive, "Center is inactive");
        require(amount <= centers[msg.sender].totalAllocated - centers[msg.sender].totalUsed, "Insufficient balance");
        
        bytes32 dataHash = keccak256(abi.encodePacked(amount, purpose, block.timestamp, msg.sender));
        
        centers[msg.sender].totalUsed += amount;
        usageLogs[msg.sender].push(UsageReport(amount, purpose, block.timestamp, dataHash, false, msg.sender, attachments));
        
        _addAuditEntry(msg.sender, "USAGE_REPORTED", dataHash);
        emit UsageReported(msg.sender, amount, purpose, dataHash);
    }
}