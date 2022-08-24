// SPDX-License-Identifier: MIT

pragma solidity >=0.8.16;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/libraries/NativeMetaTransaction/EIP712Base.sol";

contract RewardVault is EIP712Base, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public rewardToken;

    constructor(address _rewardToken) {
        rewardToken = _rewardToken;
        _initializeEIP712("RewardVault");
    }

    function addRewards(uint256 rewardAmount) external onlyOwner returns (bool) {
        IERC20(rewardToken).safeTransferFrom(_msgSender(), address(this), rewardAmount);
        return true;
    }

    function increaseAllowance(address spenderAddress, uint256 amount) external onlyOwner returns (bool) {
        IERC20(rewardToken).safeIncreaseAllowance(spenderAddress, amount);
        return true;
    }

    function decreaseAllowance(address spenderAddress, uint256 amount) external onlyOwner returns (bool) {
        IERC20(rewardToken).safeDecreaseAllowance(spenderAddress, amount);
        return true;
    }

    function rescueFunds(
        address token,
        address receiver,
        uint256 amount
    ) external onlyOwner returns (bool) {
        IERC20(token).safeTransfer(receiver, amount);
        return true;
    }
}
