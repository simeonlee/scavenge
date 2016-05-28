var MODULE = (function (my) {

	$(document).ready(function(){

		$list_arrow = $('#list-arrow');
		$glyph = $('#list-arrow span');
		$list = $('#list-container');
		$grid = $('#grid-container');

	  $list_arrow.mouseover(function(event){
	    var $this = $(this);
	    $this.css({
	      'cursor': 'pointer'
	    });
	  });

	  $list_arrow.click(function(event) {
	    if ($glyph.hasClass('glyphicon-chevron-left')) {
	    	$glyph.removeClass('glyphicon-chevron-left');
	    	$glyph.addClass('glyphicon-chevron-right');

		    // keep the map centered upon window resize
		    // my.google_map.setCenter(my.pos);

		    
				var list_width = $list.width();
	  		
	  		$list.animate({
		    	right: list_width
		    },500);
	  		$grid.animate({
	  			right: list_width
	  		},500);
	  		$grid.css({
	  			'width': '45%'
	  		})

		  



	    	$('.grid-item').css({
	    		'width': '33.33%'
	    	})
	    	// resize grid image height to match width
		    $('.grid-image').each(function(){
		      var image_width = $(this).width();
		      $(this).css({'height': image_width+'px'});
		    })


	    } else if ($glyph.hasClass('glyphicon-chevron-right')) {
	    	$glyph.removeClass('glyphicon-chevron-right');
	    	$glyph.addClass('glyphicon-chevron-left');


				
		    $list.animate({
		    	right: 0,
		    },500);
		    $grid.animate({
	  			right: 0
	  		},500);
		    $grid.css({
	  			'width': '30%'
	  		})


	  		
		    




				$('.grid-item').css({
	    		'width': '50%'
	    	})
	    	// resize grid image height to match width
		    $('.grid-image').each(function(){
		      var image_width = $(this).width();
		      $(this).css({'height': image_width+'px'});
		    })
	    }
	  });

	});

	return my;
}(MODULE || {}));