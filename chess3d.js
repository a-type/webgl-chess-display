function Clouds (scene, numParticles, fieldSpan) {
	var defaultColor = 0x0a0a0a;

	var particles = new THREE.Geometry();
	var texture = THREE.ImageUtils.loadTexture("textures/cloud.jpg");
	var material = new THREE.PointCloudMaterial({
		color: defaultColor, size: 10, map : texture, blending : THREE.AdditiveBlending, transparent : true, sizeAttenuation : true
	});

	material.depthWrite = false;

	for (var p = 0; p < numParticles; p++) {
		var x = Math.random() * fieldSpan - (fieldSpan / 2);
		var z = Math.random() * fieldSpan - (fieldSpan / 2);
		var y = Math.random() * 2 - 4;
		var particle = new THREE.Vector3(x, y, z);
		particles.vertices.push(particle);
	}

	var particleSystem = new THREE.PointCloud(particles, material);
	particleSystem.sortParticles = true;
	scene.add(particleSystem);

	this.flash = function () {
		material.color = new THREE.Color(0xffffff);
		setTimeout(function () { material.color = new THREE.Color(0xf0f0f0); }, 150);
	}

	this.update = function () {
		material.color.lerp(new THREE.Color(defaultColor), 0.03);
	};
}

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

	this.move = function (from, to, dontResetMove) {
		// lookup piece
		var piece = positions[from.x][from.y];

		if (!piece) {
			return;
		}

		// en passant : special case. calculated first before move state is reset
		function enPassant (position) {
			var candidate = positions[position];
			if (candidate && candidate.name === "pawn" && candidate.movedLast) {
				if ((position.y > to.y && candidate.color === WHITE) ||
						(position.y < to.y && candidate.color === BLACK)) {
					this.remove(position);
				}
			}
		}

		enPassant({ to.x, to.y + 1 });
		enPassant({ to.x, to.y - 1 });

		if (!dontResetMove) {
			_.each(pieces, function (piece) { piece.movedLast = false; });
		}

		// castling : special case
		if (piece.name === "king" && Math.abs(from.x - to.x) >= 2) {
			// infer rook and position from direction
			if (from.x > to.x) {
				this.move({ x : 0, y : to.y }, { x : 3, y : to.y }, true);
			}
			else {
				this.move({ x : 7, y : to.y }, { x : 5, y : to.y }, true);
			}
		}

		if (positions[to.x][to.y] && positions[to.x][to.y] !== piece) {
			if (this.onTaken) {
				this.onTaken();
			}
			this.remove(to);
		}
		delete positions[from.x][from.y];
		positions[to.x][to.y] = piece;
		piece.targetPosition = this.transformPosition(to);
		piece.movedLast = true;
	};

	this.remove = function (position) {
		var piece = positions[position.x][position.y];
		delete positions[position.x][position.y];
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

	Object.defineProperty(this, "name", {
		get : function () { return name; }
	});

	this.targetPosition = new THREE.Vector3();
	this.movedLast = false;

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

	var blackMaterial = new THREE.MeshPhongMaterial({ color : BLACK, specular : 0x808080, shininess : 30 });
	var whiteMaterial = new THREE.MeshPhongMaterial({ color : WHITE, specular : 0x080808, shininess : 5 });

	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(BLACK, 0.08);

	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 5, 5);

	var light = new THREE.PointLight(0x808080, 2, 100);
	light.position.set(0, 10, 0);
	scene.add(light);

	var ambient = new THREE.AmbientLight(0x808080);
	scene.add(light);

	var clouds = new Clouds(scene, 500, 30);

	var renderer = new THREE.WebGLRenderer({ canvas : document.getElementById("viewport") });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(BLACK);

	var controls = new THREE.OrbitControls(camera);
	controls.noPan = true;
	controls.enabled = false;
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	var loader = new THREE.OBJLoader();
	var pieces = Object.create(null);
	var board = new ChessBoard(scene);
	board.onTaken = clouds.flash.bind(clouds);

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
		clouds.update();
		renderer.render(scene, camera);
	};

	render();

	this.enableControls = function () { controls.enabled = true };
	this.move = board.move.bind(board);
}