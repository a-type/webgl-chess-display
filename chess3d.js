function Chess3D () {
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 10, 10);

	var light = new THREE.PointLight(0xffffff, 10, 1000);
	light.position.set(0, 10, 0);
	scene.add(light);

	var ambient = new THREE.AmbientLight(0x404040);
	scene.add(light);

	var renderer = new THREE.WebGLRenderer({ canvas : document.getElementById("viewport") });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClearColor = 0x888888;

	var controls = new THREE.DragControls(camera, renderer.domElement);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	var loader = new THREE.OBJLoader();
	var pieces = Object.create(null);

	function createBoard () {
		var geometry = new THREE.PlaneBufferGeometry(8, 8);
		var material = new THREE.MeshPhongMaterial({ color : 0x888888, side: THREE.DoubleSide });
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

	function createPiece (pieceName, color) {
		var material = new THREE.MeshPhongMaterial({ color : color });

		var object = new THREE.Mesh(pieces[pieceName].children[0].geometry, material);
		object.scale.set(3, 3, 3);
		scene.add(object);
	}

	loadPieces(function () {
		createPiece("king", 0xffffff);
		//createPiece("queen", 0xffffff);
	});

	var render = function () {
		requestAnimationFrame(render);

		controls.update(8);
		renderer.render(scene, camera);
	};

	render();
}