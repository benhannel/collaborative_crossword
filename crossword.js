// Wrap everything in a closure, to avoid polluting the global namespace
(() => {
	// Install jQuery
	var jqry = document.createElement('script');
	jqry.src = "https://code.jquery.com/jquery-3.3.1.min.js";
	document.getElementsByTagName('head')[0].appendChild(jqry);

	// Install firebase
	var firebs = document.createElement('script');
	firebs.src = "https://www.gstatic.com/firebasejs/7.9.1/firebase-app.js";
	document.getElementsByTagName('head')[0].appendChild(firebs);

	var firest = document.createElement('script');
	firest.src = "https://www.gstatic.com/firebasejs/7.9.1/firebase-firestore.js";
	document.getElementsByTagName('head')[0].appendChild(firest);

	// Add a delay so dependencies can load
	setTimeout(() => {
		// Your web app's Firebase configuration
		var firebaseConfig = {
		apiKey: "AIzaSyBVFhBn2-ssqHMGIgW8KRj3HbnrIMN6sYk",
		authDomain: "crosswords-44d95.firebaseapp.com",
		databaseURL: "https://crosswords-44d95.firebaseio.com",
		projectId: "crosswords-44d95",
		storageBucket: "crosswords-44d95.appspot.com",
		messagingSenderId: "794243401614",
		appId: "1:794243401614:web:dc2fc93575091367af46df"
		};
		// Initialize Firebase
		firebase.initializeApp(firebaseConfig);

		var db = firebase.firestore();

		function getLetters() {
			return $('svg>g>g').map((i, item) => {
			    return $($(item).find('text:last-child text')[0]).text();
			}).toArray();
		}

		function getCookie(name) {
		  var value = "; " + document.cookie;
		  var parts = value.split("; " + name + "=");
		  if (parts.length == 2) return parts.pop().split(";").shift();
		}

		function clearAuxillaryLetters() {
			$('.colab_mod').remove();
			// $('svg>g>g').map((i, item) => {
			// 	var children = $(item).children();
			// 	if (children.length > 1) {
			// 		var last_text = $(children.get(-1));
			// 		var hidden_text = $(last_text.children()[0]).text();
			// 		var shown_text = last_text.text();
			// 		console.log(last_text, hidden_text, shown_text);

			// 		var new_html = last_text.html();
			// 		console.log(new_html);
			// 		new_html = new_html.substring(0, new_html.length - (shown_text.length - hidden_text.length));
			// 		new_html += hidden_text;
			// 		last_text.html(new_html);
			// 	}
			// });
		}

		function appendLetter(index, letter) {
			// var last_text = $($($('svg>g>g')[index]).children().get(-1));
			// last_text.append(letter);
			var pos = $($('svg>g>g')[index]).position();
			$('body').append(
				$('<div class=".colab_mod">' + letter + '</div>')
				.css('position', 'absolute')
				.css('left', pos.left + 5)
				.css('top', pos.top + 5)
				.css('color', "grey")
				.css('font-family', 'arial')
				.css('font-size', '14px'));
		}

		function syncWithFirebase(doc) {
			var other_participants = doc.data();
	        delete other_participants[myId];
	        console.log("Current data: ", other_participants);
	        var my_letters = getLetters();
	        clearAuxillaryLetters();
	        for (key in other_participants) {
	        	var their_letters = other_participants[key];
	        	console.log(key, their_letters);
	        	for (var i = 0; i < my_letters.length; i++) {
	        		if (my_letters[i] != their_letters[i]) {
	        			appendLetter(i, their_letters[i]);
	        		}
	        	}
	        }
		}

		var myId = getCookie("nyt-a");
		var docId = window.location.pathname.replace(/\//g,"_");

		document.addEventListener('keyup', () => {
			var letters = getLetters();
			console.log('Letter updates. Sending board to Firebase.', letters);
			var doc = {};
			doc[myId] = letters;
			console.log(docId);
			db.collection('crosswords')
				.doc(docId)
				.update(doc);
			// db.collection("crosswords").doc(docId).get().then(function(doc) {
		 //        syncWithFirebase(doc);
		 //    });
		});

		// document.addEventListener('keydown', () => {
		// 	clearAuxillaryLetters();
		// });

		db.collection("crosswords").doc(docId).onSnapshot(function(doc) {
	        syncWithFirebase(doc);
	    });
	}, 100);
})();
