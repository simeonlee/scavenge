module.exports = ({imageUrls}) => (
  <div className="grid">
    {imageUrls.map(function(imageUrl){
      return <img src={imageUrl} />;
      // return <div>{name}</div>;
    })}
  </div>
)