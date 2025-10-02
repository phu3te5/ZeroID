// contracts/MPCRecovery.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MPCRecovery {
    struct SaltShare {
        address owner;
        bytes32 share;
        bool exists;
    }

    mapping(address => mapping(uint8 => SaltShare)) public userShares; // e.g. part 1, 2, ...

    event ShareStored(address indexed user, uint8 part, bytes32 share);
    event SaltRecovered(address indexed user, bytes32 recovered);

    function storeShare(uint8 part, bytes32 share) external {
        require(!userShares[msg.sender][part].exists, "Already stored");

        userShares[msg.sender][part] = SaltShare({
            owner: msg.sender,
            share: share,
            exists: true
        });

        emit ShareStored(msg.sender, part, share);
    }

    function getShare(uint8 part) external view returns (bytes32) {
        require(userShares[msg.sender][part].exists, "Share not found");
        return userShares[msg.sender][part].share;
    }

    // Optional: recover via XOR if using that scheme
    function recoverSalt(uint8 part1, uint8 part2) external view returns (bytes32) {
        require(userShares[msg.sender][part1].exists, "Missing part1");
        require(userShares[msg.sender][part2].exists, "Missing part2");

        return userShares[msg.sender][part1].share ^ userShares[msg.sender][part2].share;
    }
}
