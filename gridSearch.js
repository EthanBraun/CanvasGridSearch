window.onload = function(){
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var colors = ['#FF0000', '#FFA500', '#FFFF00', '#00CC00', '#0066FF', '#BB00FF'];
	var mouseX, mouseY;
	var frameCount = 0;

	var clicked = 0;

	resizeCanvas();
	
	function drawBackground(){
		ctx.fillStyle = '#E0E0E0';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	
	//Event Listeners
	function getMousePos(e){
		return {
			x: e.clientX,
			y: e.clientY
		};
	}
	document.addEventListener("keydown", function(e){
		console.log("keycode: " + e.keyCode);
		
		
	}, false);

	document.addEventListener("mousemove", function(e){
		var mousePos = getMousePos(e);
		mouseX = mousePos.x;
		mouseY = mousePos.y;
	}, false);

	document.addEventListener('mousedown', function(event){
		if(!clicked){
			clicked = 1;
		}
	}, false);

	document.addEventListener('mouseup', function(event){
		clicked = 0;
	}, false);

	window.addEventListener('resize', resizeCanvas, false);
	function resizeCanvas(){
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}


	//main functions

	function update(){
		frameCount++;
	}

	function draw(){
		drawBackground();
	}

	function loop(){
		update();
		draw();		
	}

	setInterval(loop, 1000/60);
}
