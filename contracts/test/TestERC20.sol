// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor(uint256 amount) ERC20("Route Test Token", "RTE") {
        _mint(msg.sender, amount);
    }
}
