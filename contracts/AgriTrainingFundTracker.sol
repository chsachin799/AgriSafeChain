// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AgriTrainingFundTracker {
    address public government;

    constructor() {
        government = msg.sender;
    }

    modifier onlyGov() {
        require(msg.sender == government, "Only government can call this");
        _;
    }

    modifier onlyRegisteredCenter() {
        require(centers[msg.sender].isRegistered, "Not a registered center");
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
    }

    struct UsageReport {
        uint256 amount;
        string purpose;
        uint256 timestamp;
    }

    struct Farmer {
        string name;
        address center;
        bool isRegistered;
        bool trainingCompleted;
        uint256 attendanceCount;
    }

    struct Trainer {
        string name;
        address center;
        bool isRegistered;
    }

    mapping(address => TrainingCenter) public centers;
    mapping(address => UsageReport[]) public usageLogs;
    mapping(address => Farmer) public farmers;
    mapping(address => Trainer) public trainers;

    event CenterRegistered(address center, string name);
    event FundAllocated(address center, uint256 amount);
    event UsageReported(address center, uint256 amount, string purpose);
    event FarmerRegistered(address farmer, string name, address center);
    event TrainerRegistered(address trainer, string name, address center);
    event TrainingMarkedCompleted(address farmer);
    event AttendanceMarked(address farmer, uint256 totalAttendance);
    event CenterStatusChanged(address center, bool isActive);

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
}