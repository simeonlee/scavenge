import React from 'react';
import Nav from './nav.jsx';
import Map from './map.jsx';

// const url = 'https://www.scavenge.io';
// const socket = io.connect(url);

const instagram_logo_path = 'client/images/instagramlogo.png';
const twitter_logo_path = 'client/images/twitterbird.png';

export default class App extends React.Component {
	constructor(props) {
    super(props);

    this.state = {
      currentPosition: null,
      searchRadius: null,
      topic: 'juice',
      searchRadius: 2,
      userLocation: {
        // Washington Square Park
        lat: 40.7308,
        lng: -73.9973
      },
      // previousUserLocation: {
      //   lat: 0.0,
      //   lng: 0.0
      // },
      queryTerms: [
        // search for all instagram pics
        'instagram',

        // search for healthy eating tips
        // 'paleo',
        // 'healthy',
        // 'keto',
        // 'ketogenic',
        // 'avocado',
        // 'juice',
        // 'juicepress',
        // 'smoothies',
        // 'chia',
        // 'salad',
        // 'salmon',
        // 'organic',
        // 'usdaorganic',
        // 'vegan',
        // 'raw',
        // 'glutenfree',
        // 'noGMO',
        // 'eatclean',
        // 'wholefoods',
        // 'kale',
        // 'broccoli',
        // 'cucumber',
        // 'ginger',
        // 'protein',
        // 'fiber'

        // search for fitness inspiration
        // 'fitness',
        // 'fitfam',
        // 'fitspo',
        // 'gym',
        // 'crossfit',
        // 'barre',
        // 'yoga',
        // 'pilates',
        // 'lifting',
        // 'training',
        // 'running',
        // 'boxing',
        // 'sweat',
      ]
      // tweets: [],
      // markers: {
      //   user: null,
      //   tweets: []
      // }
    }

    // Use socket to communicate between client & server
    this.socket = io.connect('https://www.scavenge.io');
    // this.socket = io.connect('127.0.0.1:8080');

    // Locate position of user
    this.geolocate();
  }

  setAndSendDataToServer(location) {
    // TODO: clear markers
    // TODO: clear grid
    this.socket.emit('my_geolocation', JSON.stringify({
      pos: location || this.state.userLocation,
      radius: this.state.searchRadius,
      topic: this.state.topic
    }));
  }

  onSubjectQuery(topic) {
    this.setState({topic: topic})
    this.setAndSendDataToServer();
  }

  geolocate() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {        
        var userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        // console.log('User located at ' + position.lat + ', ' + position.lng);

        this.setState({'previousUserLocation': this.state.userLocation});
        this.setState({'userLocation': userLocation});
        // Attach user geolocation data and twitter query terms to a data object
        // that we will send to the server to make API calls with based on user context
        this.setAndSendDataToServer();
      }, function() {
        alert('Geolocation failed');
      });
    } else {
      alert('Your browser doesn\'t support geolocation');
    }
  }

  render() {
    return (
      <div>
        <Nav
          onSubjectQuery={this.onSubjectQuery.bind(this)}
        />
        <div className="body-container">
          <Map
            userLocation={this.state.userLocation}
            setAndSendDataToServer={this.setAndSendDataToServer.bind(this)}
            // previousUserLocation={this.state.previousUserLocation}
          />
        </div>
      </div>
    );
  }
}