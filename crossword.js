(function () {
	/* Wrap everything in a closure, to avoid polluting the global namespace */
	/* Install jQuery */
	var jqry = document.createElement('script');
	jqry.src = 'https://code.jquery.com/jquery-3.3.1.min.js';
	document.getElementsByTagName('head')[0].appendChild(jqry);

	/* Install firebase */
	var firebs = document.createElement('script');
	firebs.src = 'https://www.gstatic.com/firebasejs/7.9.1/firebase-app.js';
	document.getElementsByTagName('head')[0].appendChild(firebs);

	var firest = document.createElement('script');
	firest.src = 'https://www.gstatic.com/firebasejs/7.9.1/firebase-firestore.js';
	document.getElementsByTagName('head')[0].appendChild(firest);

	/* Add a delay so dependencies can load */
	setTimeout(() => {
		var firebaseConfig = {
		apiKey: 'AIzaSyBVFhBn2-ssqHMGIgW8KRj3HbnrIMN6sYk',
		authDomain: 'crosswords-44d95.firebaseapp.com',
		databaseURL: 'https://crosswords-44d95.firebaseio.com',
		projectId: 'crosswords-44d95',
		storageBucket: 'crosswords-44d95.appspot.com',
		messagingSenderId: '794243401614',
		appId: '1:794243401614:web:dc2fc93575091367af46df'
		};
		firebase.initializeApp(firebaseConfig);

		var db = firebase.firestore();

		var colors = ['red', 'blue', 'green', 'orange', 'purple'];

		function getLetters() {
			return $('svg>g>g').map((i, item) => {
			    return $($(item).find('text:last-child text')[0]).text();
			}).toArray();
		}

		function getCookie(name) {
		  var value = '; ' + document.cookie;
		  var parts = value.split('; ' + name + '=');
		  if (parts.length == 2) return parts.pop().split(';').shift();
		}

		function clearAuxillaryLetters() {
			$('.colab_mod').remove();
		}

		function appendLetter(index, letter, color) {
			if (letter.length == 0) {
				return;
			}
			var last = $('svg>g>g:nth-child(' + (index+1) + ')>text:last-child');
			$('svg').append(
				$(document.createElementNS('http://www.w3.org/2000/svg', 'text'))
				.text(letter)
				.addClass('colab_mod')
				.attr('x', last.attr('x'))
				.attr('y', last.attr('y'))
				.attr('font-size', last.attr('font-size') / letter.length)
				.attr('text-anchor', last.attr('text-anchor'))
				.css('opacity', 0.4)
				.css('pointer-events', 'none')
				.css('fill', color));
		}

		function appendHighlight(cell) {
			$('svg').append(
				$(document.createElementNS('http://www.w3.org/2000/svg', 'rect'))
				.addClass('colab_mod')
				.attr('x', cell.attr('x'))
				.attr('y', cell.attr('y'))
				.attr('width', cell.attr('width'))
				.attr('height', cell.attr('height'))
				.attr('fill', '#f0f')
				.css('opacity', 0.3)
				.css('pointer-events', 'none'));
		}

		function getPresence() {
			var highlighted_cell = $('.Cell-selected--2PAbF');
			return highlighted_cell.attr('id');
		}

		function syncWithFirebase(doc) {
			var other_participants = doc.data();
			if (other_participants[myId]) {
		        delete other_participants[myId];
			}
	        console.log('Current data: ', other_participants);
	        var my_letters = getLetters();
	        clearAuxillaryLetters();
	        var index = 0;
	        for (key in other_participants) {
	        	var their_letters = other_participants[key].letters;
	        	var color = colors[index % colors.length];
	        	index++;
	        	for (var i = 0; i < my_letters.length; i++) {
	        		if (my_letters[i] != their_letters[i]) {
	        			appendLetter(i, their_letters[i], color);
	        		}
				}
				
				var their_presence = other_participants[key].presence;
				var their_location = their_presence.selected_cell;
				var selected_cell = $(`#${their_location}`);
				appendHighlight(selected_cell);
	        }
		}

		function subscribeToEvents(eventNames, callback) {
			eventNames.forEach(eventName => document.addEventListener(eventName, callback));
		}

		var myId = getCookie('nyt-a');
		var docId = window.location.pathname.replace(/\//g,'_');

		document.addEventListener('keyup', () => {
			var letters = getLetters();
			console.log('Sending board to Firebase.', letters);
			var doc = {
				[myId]: {
					letters: letters
				}
			};
			db.collection('crosswords')
				.doc(docId)
				.set(doc, {merge: true});
		});

		subscribeToEvents(['keydown', 'mouseup'], () => {
			var presence_cell_id = getPresence();
			console.log('Setting presence: ', presence_cell_id);

			var docData = {
				[myId]: {
					presence: {
						selected_cell: presence_cell_id
					}
				}
			};
			db.collection('crosswords')
				.doc(docId)
				.set(docData, {merge: true});
		});

		db.collection('crosswords').doc(docId).onSnapshot(function(doc) {
	        syncWithFirebase(doc);
	    });
	}, 300);
})();
