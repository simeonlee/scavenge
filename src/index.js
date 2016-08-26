import './styles/style.css';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app.jsx';

// socket.on('userLocationServerConfirmation', function(data) {
//   console.log(data);
// })

ReactDOM.render(
  <App />,
  document.querySelector('.root')
);