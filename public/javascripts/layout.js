var MODULE = (function (my) {

	$(document).ready(function(){

		var $x_button = $('#x-button');
		var $y_button = $('#y-button');
		var $grid = $('#grid-container');
		var $map = $('#map-container');
		var $list = $('#list-container');
		var $glyph = $('#list-arrow span'); // for listOffPage logic

		$x_button.click(function(){
			$grid.css({
				'height': '100%',
				'width': '45%',
				'position': 'relative'
			})

			$map.css({
				'height': '100%',
				'width': '55%',
				'float': 'right',
				'position': 'absolute',
				'top': '0',
				'right': '0',
				'left': 'auto'
			})

			// slide the list off the page when changing the layout
			if ($glyph.hasClass('glyphicon-chevron-left')) {
				my.moveListOffPage();
			};
		});

		$y_button.click(function(){
			$grid.css({
				'height': '50%',
				'width': '100%',
				'position': 'absolute',
				'bottom': '0',
				'left': '0'
			})

			$map.css({
				'height': '50%',
				'width': '100%',
				'float': 'left',
				'position': 'absolute',
				'top': '0',
				'right': '0',
				'left': '0'
			})

			// slide the list off the page when changing the layout
			if ($glyph.hasClass('glyphicon-chevron-left')) {
				my.moveListOffPage();
			};
		});
	});

	return my;
}(MODULE || {}));

// #grid-container {
//   height: 100%;
//   width: 30%;
//   margin: 0;
//   padding: 0;
//   float: left;
//   position: relative;
//   background-color: rgba(30,30,30,1.0);
// }

// #map-container {
//   height: 100%;
//   width: 55%;
//   margin: 0;
//   padding: 0;
//   float: right;
//   position: absolute;
//   top: 0;
//   right: 0;
// }

// #list-container {
//   height: 100%;
//   width: 15%;
//   background-color: rgba(40,40,40,1.0);
//   padding: 0;
//   margin: 0;
//   position: relative;
//   float: left;
//   z-index: 20;
//   overflow: hidden;
// }