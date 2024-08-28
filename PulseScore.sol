// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract PulseScore {
    
    struct User {
        uint256 ratingSum;
        uint256 ratingCount;
        mapping(address => uint8) ratingsGiven;
    }

    mapping(address => User) public users;

    event Rated(address indexed from, address indexed to, uint8 rating);

    modifier validRating(uint8 _rating) {
        require(_rating > 0 && _rating <= 5, "Rating must be between 1 and 5");
        _;
    }

    function rateUser(address _user, uint8 _rating)
        external
        validRating(_rating)
    {
        require(_user != msg.sender, "You cannot rate yourself");

        User storage rater = users[msg.sender];
        User storage ratee = users[_user];

        // Check if the rater has already rated this user
        uint8 previousRating = rater.ratingsGiven[_user];
        if (previousRating != 0) {
            ratee.ratingSum -= previousRating;
            ratee.ratingCount--;
        }

        // Update the user's rating
        rater.ratingsGiven[_user] = _rating;
        ratee.ratingSum += _rating;
        ratee.ratingCount++;

        emit Rated(msg.sender, _user, _rating);
    }

    function getAverageRating(address _user) external view returns (uint256) {
        User storage user = users[_user];
        require(user.ratingCount > 0, "No ratings available for this user");

        return user.ratingSum / user.ratingCount;
    }

    function hasRated(address _user) external view returns (bool) {
        return users[msg.sender].ratingsGiven[_user] != 0;
    }

    function getRating(address _rater, address _ratee)
        external
        view
        returns (uint8)
    {
        return users[_rater].ratingsGiven[_ratee];
    }
}
