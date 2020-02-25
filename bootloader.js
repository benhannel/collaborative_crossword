(function() {
	/* Load the source of the bookmarklet, then execute it. Allows for updates. */
	var jqry = document.createElement('script');
	jqry.src = 'https://code.jquery.com/jquery-3.3.1.min.js';
	document.getElementsByTagName('head')[0].appendChild(jqry);

	setTimeout(() => {
		$.get('https://raw.githubusercontent.com/benhannel/collaborative_crossword/master/crossword.js')
			.then(result => {
			eval(result);
		});
	}, 300);
})();