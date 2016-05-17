# ![alt text][logo] Scavenge

At the age of 23, it finally became important to me to eat healthy. I craved those beautiful Instagram salads and Instagram green juices, but all the people I followed were scattered around the world. I wanted to find places a tad closer to home. Like five steps out the door closer. And I didn't want to sift through pages of Yelp reviews to find Instagram-worthy snacks - _lazy_ - so I turned to APIs with the goal of making decisions easier.

[Scavenge][site] accomplishes this by serving up Instagram images automatically related to healthy eating on a map of your neighborhood with no clicking through links required. You can also search for any other topic all over the world.

### What I Used

Given that Instagram has restricted their API ([requiring a review process][instagram]), the Scavenge app accesses the Twitter API for recent, nearby tweets and pulls image metadata from embedded links. Google's API was used for the map and location search. The application uses Node.js and is hosted using Heroku. SSL certificate was required as Chrome browser recently deprecated geolocation on http (now restricted to https).



[logo]: https://github.com/simeonlee/scavenge/blob/master/public/images/scavengebird%402x.png "Scavenge logo"
[site]: https://www.scavenge.io "Scavenge site"
[instagram]: https://www.instagram.com/developer "Instagram developers"
