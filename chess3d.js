function ChessBoard (scene) {
	var positions = [];
	var pieces = [];

	for (var i = 0; i < 8; i++) {
		positions[i] = [];
	}

	function createBoard () {
		var texture = THREE.ImageUtils.loadTexture("textures/board.png");
		var geometry = new THREE.PlaneBufferGeometry(8, 8);
		var material = new THREE.MeshPhongMaterial({ color : 0xffffff, side: THREE.DoubleSide, map : texture });
		var plane = new THREE.Mesh(geometry, material);
		plane.rotation.x = 3.14 / 2;
		scene.add(plane);
	}
	createBoard();

	this.add = function (piece, position) {
		positions[position.x][position.y] = piece;
		pieces.push(piece);
		scene.add(piece.object);

		this.move(position, position); //hacky
	}

	this.move = function (from, to) {
		// lookup piece
		var piece = positions[from.x][from.y];

		if (!piece) {
			return;
		}

		if (positions[to.x][to.y] && positions[to.x][to.y] !== piece) {
			this.remove(positions[to.x][to.y]);
		}
		positions[to.x][to.y] = piece;
		piece.targetPosition = this.transformPosition(to);
	};

	this.remove = function (piece) {
		// TODO: place on the side of board
		scene.remove(piece.object);
	};

	this.update = function () {
		_.each(pieces, function (piece) {
			piece.update();
		});
	};

	this.transformPosition = function (pos) {
		return new THREE.Vector3(pos.x - 3.5, 0, pos.y - 3.5);
	};
}

function ChessPiece (board, name, object) {
	var self = this;
	var name;

	Object.defineProperty(this, "object", {
		get : function () { return object; }
	});

	this.targetPosition = new THREE.Vector3();

	this.update = function () {
		if (object.position.distanceTo(this.targetPosition) < 0.00001) {
			return;
		}
		object.position = object.position.lerp(this.targetPosition, 0.2);
	};
}

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
	renderer.setClearColor(0x808080);

	var controls = new THREE.OrbitControls(camera);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	var loader = new THREE.OBJLoader();
	var pieces = Object.create(null);
	var board = new ChessBoard(scene);

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

	var blackMaterial = new THREE.MeshPhongMaterial({ color : BLACK, specular : 0x808080, shininess : 30 });
	var whiteMaterial = new THREE.MeshPhongMaterial({ color : WHITE, specular : 0x080808, shininess : 5 });

	function createPiece (pieceName, color, position) {
		var material = color === WHITE ? whiteMaterial : blackMaterial;

		var object = new THREE.Mesh(pieces[pieceName].children[0].geometry, material);

		object.scale.set(3, 3, 3);

		if (color === BLACK) {
			object.rotation.set(0, 3.14, 0);
		}

		var chessPiece = new ChessPiece(board, pieceName, object);
		board.add(chessPiece, position);
	}

	loadPieces(function () {
		function pawnRow(color, row) {
			for (var col = 0; col < 8; col++) {
				createPiece("pawn", color, { x : col, y : row });
			}
		}

		createPiece("rook", WHITE, { x : 0, y : 0 });
		createPiece("knight", WHITE, { x : 1, y : 0 });
		createPiece("bishop", WHITE, { x : 2, y : 0 });
		createPiece("queen", WHITE, { x : 3, y : 0 });
		createPiece("king", WHITE, { x : 4, y : 0 });
		createPiece("bishop", WHITE, { x : 5, y : 0 });
		createPiece("knight", WHITE, { x : 6, y : 0 });
		createPiece("rook", WHITE, { x : 7, y : 0 });
		pawnRow(WHITE, 1);

		createPiece("rook", BLACK, { x : 0, y : 7 });
		createPiece("knight", BLACK, { x : 1, y : 7 });
		createPiece("bishop", BLACK, { x : 2, y : 7 });
		createPiece("queen", BLACK, { x : 3, y : 7 });
		createPiece("king", BLACK, { x : 4, y : 7 });
		createPiece("bishop", BLACK, { x : 5, y : 7 });
		createPiece("knight", BLACK, { x : 6, y : 7 });
		createPiece("rook", BLACK, { x : 7, y : 7 });
		pawnRow(BLACK, 6);;
	});

	var render = function () {
		requestAnimationFrame(render);

		controls.update(8);
		board.update();
		renderer.render(scene, camera);
	};

	render();

	this.move = board.move.bind(board);
}