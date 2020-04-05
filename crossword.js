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

	function onLoad() {
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

		var colors = ['#61210F', '#086788', '#FF3C38', '#370031', 'green'];

		var overlays = {};

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

		/**
		 * Returns a hash code for a string.
		 * (Compatible to Java's String.hashCode())
		 *
		 * The hash code for a string object is computed as
		 *     s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]
		 * using number arithmetic, where s[i] is the i th character
		 * of the given string, n is the length of the string,
		 * and ^ indicates exponentiation.
		 * (The hash value of the empty string is zero.)
		 *
		 * @param {string} s a string
		 * @return {number} a hash code value for the given string.
		 */
		function hashCode(s) {
		  var h = 0, l = s.length, i = 0;
		  if ( l > 0 )
		    while (i < l)
		      h = (h << 5) - h + s.charCodeAt(i++) | 0;
		  return Math.abs(h);
		};

		function getOverlayForPlayer(player_id) {
			if (!(player_id in overlays)) {
				var color = colors[hashCode(player_id) % colors.length];
				overlays[player_id] = [];
				$('svg>g>g').each((i, element) => {
					element = $(element);
					var children = element.children();
					var main_letter = $(children[children.length - 1]);
					var overlay_letter =
						$(document.createElementNS('http://www.w3.org/2000/svg', 'text'))
							.attr('x', main_letter.attr('x'))
							.attr('y', main_letter.attr('y'))
							.attr('font-size', main_letter.attr('font-size'))
							.attr('text-anchor', main_letter.attr('text-anchor'))
							.css('opacity', 0.3)
							.css('pointer-events', 'none')
							.css('fill', color);
					overlays[player_id].push(overlay_letter);
					$('svg').append(overlay_letter);
				});
			}
			return overlays[player_id];
		}

		function appendHighlight(cell, color, opacity = 0.3) {
			$('svg').append(
				$(document.createElementNS('http://www.w3.org/2000/svg', 'rect'))
				.addClass('colab_mod')
				.attr('x', cell.attr('x'))
				.attr('y', cell.attr('y'))
				.attr('width', cell.attr('width'))
				.attr('height', cell.attr('height'))
				.attr('fill', color)
				.css('opacity', opacity)
				.css('pointer-events', 'none'));
		}

		function getPresenceSelected() {
			var highlighted_cell = $('.Cell-selected--2PAbF');
			return highlighted_cell.attr('id');
		}

		function getPresenceHighlighted() {
			var highlighted_cells = $('.Cell-highlighted--2YbzJ');
			var cell_ids = highlighted_cells.map((i, item) => {
				return $(item).attr('id');
			});
			return cell_ids.toArray();
		}

		var last_state = null;
		function syncWithFirebase(doc) {
			var other_participants = doc.data();
			if (other_participants[myId]) {
		        delete other_participants[myId];
			}
			// If there was no change (ie it was just us typing), then don't
			// update the overlay.
			if (JSON.stringify(other_participants) == JSON.stringify(last_state)) {
				return;
			}
			last_state = other_participants;
	        
	        var index = 0;
	        for (key in other_participants) {
	        	var color = colors[index % colors.length];
	        	index++;

	        	var overlay = getOverlayForPlayer(key);

				var their_letters = other_participants[key].letters;
				if (their_letters) {
					for (var i = 0; i < their_letters.length; i++) {
						overlay[i].text(their_letters[i]);
					}
				}
				
				var their_presence = other_participants[key].presence;
				if (their_presence) {
					var their_location = their_presence.selected_cell;
					var selected_cell = $(`#${their_location}`);
					appendHighlight(selected_cell, color);

					var highlighted_cells = their_presence.highlighted_cells;
					highlighted_cells.forEach((cell) => {
						var highlighted_cell = $(`#${cell}`);
						appendHighlight(highlighted_cell, color, 0.1);
					});
				}
	        }
		}

		function updatePresence() {
			var presence_cell_id = getPresenceSelected();
			var highlighted_cells = getPresenceHighlighted();
			
			var docData = {
				[myId]: {
					presence: {
						selected_cell: presence_cell_id,
						highlighted_cells: highlighted_cells
					}
				}
			};
			db.collection('crosswords')
				.doc(docId)
				.set(docData, {merge: true});
		}

		var myId = getCookie('nyt-a');
		var docId = window.location.pathname.replace(/\//g,'_');

		document.addEventListener('keyup', () => {
			var doc = {
				[myId]: {
					letters: getLetters()
				}
			};
			
			db.collection('crosswords').doc(docId).set(doc, {merge: true});
		});

		document.addEventListener('keydown', updatePresence);
		document.addEventListener('click', updatePresence);

		db.collection('crosswords').doc(docId).onSnapshot(function(doc) {
	        syncWithFirebase(doc);
	    });
	}

	/* Add a delay so dependencies can load */
	var interval = setInterval(() => {
		console.log("Waiting for dependencies to load");
		if (("$" in window) && ("firebase" in window) && firebase.firestore) {
			console.log("Dependencies loaded");
			clearInterval(interval);
			onLoad();
		}
	}, 10);
})();
