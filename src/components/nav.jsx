module.exports = () => (
  <div className="nav">
	  <input className="search search-query" type="text" placeholder="Query" />
	  <a href="/" className="logo">SCAVENGE</a>
	  <input className="search" id="google-search" type="text" placeholder="Location" />
  </div>
)

/*
// Logo image below
<div className="logo logo-container">
  <div className="logo logo-image">
    <img src={require('../images/scavengebird@2x.png')} />
  </div>
  <span className="logo logo-text">SCAVENGE</span>
</div>
*/