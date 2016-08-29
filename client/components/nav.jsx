module.exports = ({onSubjectQuery}) => (
  <div className="nav">
    <form className="topic topic-form" onSubmit={ (e) => {
      e.preventDefault();
      onSubjectQuery($('#subject-query').val());
    }}>
  	  <input className="search search-query" id="subject-query" type="text" placeholder="Topic" />
    </form>
	  <a href="/" className="logo">SCAVENGE</a>
	  <input className="search" id="google-search" type="text" placeholder="Location" />
  </div>
)