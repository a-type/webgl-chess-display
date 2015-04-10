function Chess3D () {
	var WHITE = 0xffffff;
	var BLACK = 0x000000;

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 5, 5);

	var light = new THREE.PointLight(0x808080, 2, 100);
	light.position.set(0, 10, 0);
	scene.add(light);

	var ambient = new THREE.AmbientLight(0x808080);
	scene.add(light);

	var renderer = new THREE.WebGLRenderer({ canvas : document.getElementById("viewport") });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClearColor = 0x888888;

	var controls = new THREE.OrbitControls(camera);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	var loader = new THREE.OBJLoader();
	var pieces = Object.create(null);

	function createBoard () {
		var geometry = new THREE.PlaneBufferGeometry(8, 8);
		var material = new THREE.MeshPhongMaterial({ color : 0xff0000, side: THREE.DoubleSide });
		var plane = new THREE.Mesh(geometry, material);
		plane.rotation.x = 3.14 / 2;
		scene.add(plane);
	}

	createBoard();

	function loadPieces (done) {
		function loadPiece (pieceName) {
			loader.load("models/" + pieceName + ".obj", function (object) {
				pieces[pieceName] = object;

				// lazy...
				if (pieces["king"] && pieces["queen"] && pieces["rook"] && pieces["bishop"] && pieces["knight"] && pieces["pawn"]) {
					done();
				}
			});
		}

		// I don't want to think about closures right now so no loops for me
		loadPiece("king");
		loadPiece("queen");
		loadPiece("rook");
		loadPiece("bishop");
		loadPiece("pawn");
		loadPiece("knight");
	}

	function createPiece (pieceName, color, notation) {
		var material = new THREE.MeshPhongMaterial({ color : color, shading : THREE.SmoothShading, specular : 0xa0a0a0 });

		var object = new THREE.Mesh(pieces[pieceName].children[0].geometry, material);

		scene.add(object);

		object.scale.set(3, 3, 3);

		if (color === BLACK) {
			object.rotation.set(0, 3.14, 0);
		}

		var position = notationToPosition(notation);
		object.position.set(position.x, position.y, position.z);
	}

	var letters = "abcdefgh";
	function notationToPosition (notation) {
		if (!notation) {
			return new THREE.Vector3(0.5, 0, 0.5);
		}

		var letter = notation[0];
		var number = parseInt(notation[1]);

		return new THREE.Vector3(letters.indexOf(letter) - 3.5, 0, number - 4.5);
	}

	loadPieces(function () {
		function pawnRow(color, row) {
			_.each(letters, function (letter) {
				createPiece("pawn", color, letter + row);
			});
		}

		createPiece("king", WHITE, "e1");
		createPiece("queen", WHITE, "d1");
		createPiece("bishop", WHITE, "f1");
		createPiece("bishop", WHITE, "c1");
		createPiece("knight", WHITE, "b1");
		createPiece("knight", WHITE, "g1");
		createPiece("rook", WHITE, "h1");
		createPiece("rook", WHITE, "a1");
		pawnRow(WHITE, 2);

		createPiece("king", BLACK, "e8");
		createPiece("queen", BLACK, "d8");
		createPiece("bishop", BLACK, "f8");
		createPiece("bishop", BLACK, "c8");
		createPiece("knight", BLACK, "b8");
		createPiece("knight", BLACK, "g8");
		createPiece("rook", BLACK, "h8");
		createPiece("rook", BLACK, "a8");
		pawnRow(BLACK, 7);
	});

	var render = function () {
		requestAnimationFrame(render);

		controls.update(8);
		renderer.render(scene, camera);
	};

	render();
}