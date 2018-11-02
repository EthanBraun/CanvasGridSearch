window.onload = function(){
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var colors = ['#FF0000', '#FFA500', '#FFFF00', '#00CC00', '#0066FF', '#BB00FF'];
	var mouseX, mouseY;
	var frameCount = 0;

	var clicked = 0;

	resizeCanvas();
	
	function drawBackground(){
		ctx.fillStyle = '#222';
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

	// Grid prototype
	var Grid = function(){
		this.grid = [];
		this.dim = 0;
		this.canvasScale = 0.9;
		
		this.init = function(dim, start, end, walls){
			this.dim = dim;
		};

		this.update = function(canvasWidth, canvasHeight){
			this.updateDrawingVars(canvasWidth, canvasHeight);
		};
		
		this.updateDrawingVars = function(canvasWidth, canvasHeight){
			var minDim = canvasWidth < canvasHeight ? canvasWidth : canvasHeight;
			this.gridSize = minDim * this.canvasScale;
			this.xOffset = (canvasWidth - this.gridSize) / 2;
			this.yOffset = (canvasHeight - this.gridSize) / 2;
		};

		this.draw = function(){
			this.drawGridBackground();
			if(this.dim !== 0){	
				this.drawGridSquares();	
			}
		};

		this.drawGridBackground = function(){
			ctx.fillStyle = '#AAA';
			ctx.shadowColor = ctx.fillStyle;
			ctx.shadowBlur = 10;
			console.log(this.xOffset, this.yOffset, this.gridSize, this.gridSize);
			ctx.rect(this.xOffset, this.yOffset, this.gridSize, this.gridSize);
			ctx.fill();
		};

		this.drawGridSquares = function(){
			
		};
	};

	var grid = new Grid();

	//main functions

	function update(){
		frameCount++;
		grid.update(canvas.width, canvas.height);
	}

	function draw(){
		drawBackground();
		grid.draw();
	}

	function loop(){
		update();
		draw();		
	}

	setInterval(loop, 1000/60);
}
