$(document).ready(function () {
	var id;
	var moveInterval = 100;

	function fetchMoves () {
		var ws = new WebSocket("wss://aitournament.com/chess/game?id=" + id);

		ws.onerror = function(event){
			console.log("wserror:", event);
		}
		ws.onclose = function(event){
			console.log("wsclose:", event);
		}

		ws.onmessage = function(event) {
			var data = JSON.parse(event.data);
			console.log("wsin: ",data);
			queueMoves(data.game_data || data.data);
		};

		function queueMoves (data) {
			var moves = data.history || [ data ];
			_.each(moves, function (move) {
				movesQueue.push(move);
			});
		}

		var movesQueue = [];
		var moveTimer = 0;

		function moveLoop () {
			moveTimer++;
			if (moveTimer > moveInterval) {
				moveTimer = 0;
			}
			requestAnimationFrame(moveLoop);

			if (moveTimer !== moveInterval || !movesQueue.length) {
				return;
			}

			var moveData = movesQueue.shift();
			var fr = { x : moveData.move[0], y : moveData.move[1] };
			var to = { x : moveData.move[2], y : moveData.move[3] };

			chess.move(fr, to, moveData.promotionPiece);
		}

		moveLoop();
	}

	function begin () {
		$("#idForm").hide(300);
		chess.enableControls();

		fetchMoves();
	}

	// from hash if available
	if (window.location.hash) {
		id = window.location.hash.substring(1);
		begin();
	}

	// get game id
	$("#idForm").submit(function () {
		id = $("#id").val();
		begin();

		return false;
	});

	$("#controlsForm").change(function () {
		var speed = $("input:radio[name='speed']:checked").val();
		if (speed === "slow") {
			moveInterval = 100;
		}
		else if (speed === "med") {
			moveInterval = 50;
		}
		else if (speed === "fast") {
			moveInterval = 10;
		}
		else if (speed === "instant") {
			moveInterval = 0;
		}
	});
});