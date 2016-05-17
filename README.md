# ![alt text][logo] Scavenge

At the age of 23, it became important to me to start eating healthy. However, it was Manhattan, no one cooked, and whatever's convenient usually ends up being something unhealthy.

I could be pretty happy living on Instagram salads and Instagram green juices, but all the people I followed were scattered around the world. I wanted to find places a tad closer to home. Like five steps out the door closer. And I didn't want to sift through pages of reviews to find solid places to make my decision - **_lazy_** - so I turned to social media with the goal of making decisions easier.

[Scavenge][site] accomplishes this by serving up Instagram images automatically related to healthy eating on a map of your neighborhood with no clicking through links required. You can also search for any other topic(s) in any location.

### What I Used

Given that Instagram has restricted their API, this app accesses the Twitter API for recent, nearby tweets and pulls image metadata from embedded links. The application uses some Node.js and npm and is hosted using Heroku. SSL certificate required as Chrome browser recently deprecated geolocation on http (now restricted to https).



[site]: https://www.scavenge.io "Scavenge site"
[logo]: https://github.com/simeonlee/scavenge/blob/master/public/images/scavengebird%402x.png "Scavenge logo"