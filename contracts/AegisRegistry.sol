// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AegisRegistry — Monad-native on-chain layer for the Aegis AI analyst
/// @notice Stores users' Pro subscriptions, personal watchlists, portfolio-snapshot
///         commitments, and publisher-signed AI market brief hashes. Every write is
///         a real Monad transaction — nothing is mocked.
contract AegisRegistry {
    // ---------------------------------------------------------------------
    // Types & storage
    // ---------------------------------------------------------------------
    struct Subscription { uint64 expiresAt; uint64 tier; }        // tier: 1 = Pro, 2 = Prime
    struct Snapshot     { uint64 timestamp; bytes32 portfolioHash; string uri; }
    struct Brief        { uint64 timestamp; bytes32 briefHash;    string uri; }

    address public owner;
    address public publisher;
    uint256 public monthlyPriceWei;

    mapping(address => Subscription) public subs;
    mapping(address => bytes32[])    private _watchlist;
    mapping(address => Snapshot[])   private _snapshots;

    uint256 public totalBriefs;
    mapping(uint256 => Brief) public briefs;
    mapping(bytes32 => uint256) public briefIndexByHash; // 1-indexed; 0 == not found

    // ---------------------------------------------------------------------
    // Events (indexers key off these)
    // ---------------------------------------------------------------------
    event Subscribed(address indexed user, uint64 tier, uint64 expiresAt, uint256 pricePaid);
    event WatchlistUpdated(address indexed user, bytes32[] symbols);
    event PortfolioSnapshot(address indexed user, uint256 index, bytes32 portfolioHash, string uri);
    event BriefPublished(uint256 indexed index, bytes32 indexed briefHash, string uri);
    event PublisherChanged(address indexed newPublisher);
    event PriceChanged(uint256 newPriceWei);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner()     { require(msg.sender == owner,     "not owner");     _; }
    modifier onlyPublisher() { require(msg.sender == publisher, "not publisher"); _; }

    constructor(uint256 _monthlyPriceWei, address _publisher) {
        owner            = msg.sender;
        publisher        = _publisher == address(0) ? msg.sender : _publisher;
        monthlyPriceWei  = _monthlyPriceWei;
    }

    // ---------------------------------------------------------------------
    // Subscriptions — Pro tier unlocks priority alerts + on-chain brief access
    // ---------------------------------------------------------------------
    function subscribe(uint64 months) external payable {
        require(months > 0 && months <= 24, "months out of range");
        uint256 due = monthlyPriceWei * months;
        require(msg.value >= due, "insufficient MON");
        Subscription storage s = subs[msg.sender];
        uint64 base = s.expiresAt > block.timestamp ? s.expiresAt : uint64(block.timestamp);
        s.expiresAt = base + uint64(months) * 30 days;
        s.tier      = 1;
        if (msg.value > due) {
            (bool ok, ) = msg.sender.call{value: msg.value - due}("");
            require(ok, "refund failed");
        }
        emit Subscribed(msg.sender, s.tier, s.expiresAt, due);
    }

    function isPro(address user) external view returns (bool) {
        return subs[user].tier >= 1 && subs[user].expiresAt > block.timestamp;
    }

    // ---------------------------------------------------------------------
    // Watchlist — up to 32 symbols, stored as bytes32 tickers
    // ---------------------------------------------------------------------
    function setWatchlist(bytes32[] calldata symbols) external {
        require(symbols.length <= 32, "too many symbols");
        _watchlist[msg.sender] = symbols;
        emit WatchlistUpdated(msg.sender, symbols);
    }

    function getWatchlist(address user) external view returns (bytes32[] memory) {
        return _watchlist[user];
    }

    // ---------------------------------------------------------------------
    // Portfolio snapshots — commit an integrity hash + optional IPFS/HTTPS uri
    // ---------------------------------------------------------------------
    function snapshotPortfolio(bytes32 portfolioHash, string calldata uri) external {
        _snapshots[msg.sender].push(Snapshot({
            timestamp: uint64(block.timestamp),
            portfolioHash: portfolioHash,
            uri: uri
        }));
        emit PortfolioSnapshot(msg.sender, _snapshots[msg.sender].length - 1, portfolioHash, uri);
    }

    function snapshotCount(address user) external view returns (uint256) {
        return _snapshots[user].length;
    }

    function snapshotAt(address user, uint256 index) external view returns (Snapshot memory) {
        return _snapshots[user][index];
    }

    // ---------------------------------------------------------------------
    // Publisher — commit AI market brief hashes on-chain for verifiability
    // ---------------------------------------------------------------------
    function publishBrief(bytes32 briefHash, string calldata uri) external onlyPublisher {
        require(briefIndexByHash[briefHash] == 0, "duplicate");
        totalBriefs += 1;
        briefs[totalBriefs] = Brief({ timestamp: uint64(block.timestamp), briefHash: briefHash, uri: uri });
        briefIndexByHash[briefHash] = totalBriefs;
        emit BriefPublished(totalBriefs, briefHash, uri);
    }

    function verifyBrief(bytes32 briefHash) external view returns (bool exists, uint64 timestamp) {
        uint256 idx = briefIndexByHash[briefHash];
        if (idx == 0) return (false, 0);
        return (true, briefs[idx].timestamp);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------
    function setPublisher(address p) external onlyOwner { publisher = p; emit PublisherChanged(p); }
    function setPrice(uint256 wei_)  external onlyOwner { monthlyPriceWei = wei_; emit PriceChanged(wei_); }
    function withdraw(address payable to) external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = to.call{value: bal}("");
        require(ok, "withdraw failed");
        emit Withdrawn(to, bal);
    }
}