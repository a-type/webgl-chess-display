$(document).ready(function () {
	var id;
	
	function fetchMoves () {
		return $.post("https://aitournament.com/api/chess/info", { ids : [ id ] })
		.done(function (info) {
			var moves = info.info.data.history;

			setInterval(function () {
				var move = moves.shift();
				var fr = { x : move[0], y : move[1] };
				var to = { x : move[2], y : move[3] };

				chess.move(fr, to);
			}, 3000);
		})
	}


	// get game id
	$("#idForm").submit(function () {
		id = $("#id").val();
		$("#idForm").hide(300);
		chess.enableControls();

		fetchMoves();

		return false;
	});
});