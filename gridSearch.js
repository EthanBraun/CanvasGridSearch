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
		ctx.shadowBlur = 0;
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

	var MinHeap = function(initList=[]){
		this.heap = initList;
		if(this.heap.length !== 0){
			this.heapify();
		}

		this._swap = function(a, b){
			var temp = this.heap[a];
			this.heap[a] = this.heap[b];
			this.heap[b] = temp;
		};

		this.add = function(x){
			var idx = self.heap.length;
			this.heap.push(x);
			while(idx !== 0){
				var parIdx = Math.floor((idx - 1) / 2);
				if(this.heap[parIdx] > this.heap[idx]){
					this._swap(parIdx, idx);
					idx = parIdx;
				}
				else{
					return;
				}
			}
		};
	};

	// Grid prototype
	var Grid = function(){
		this.grid = [];
		this.dim = 0;
		this.canvasScale = 0.9;
		this.squareScale = 0.9;
		this.squareOffsetScale = (1 - this.squareScale) / 2;
		
		this.init = function(dim, start, end, walls){
			this.dim = dim;
			this.start = start;
			this.end = end;
			this.walls = {};
			for(i in walls){
				this.walls[walls[i]] = true;
			}
			this.searched = {};
			this.searchDS = [start];
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
			//this.drawGridBackground();
			if(this.dim !== 0){	
				this.drawGridSquares();	
			}
		};

		this.drawGridBackground = function(){
			ctx.fillStyle = '#333';
			ctx.shadowColor = ctx.fillStyle;
			ctx.shadowBlur = 10;
			ctx.fillRect(this.xOffset, this.yOffset, this.gridSize, this.gridSize);
		};

		this.drawGridSquares = function(){
			var squareSize = this.gridSize / this.dim;
			var squareOffset = this.squareOffsetScale * squareSize;
			var squareInnerSize = this.squareScale * squareSize;

			for(var row = 0; row < this.dim; row++){
				for(var col = 0; col < this.dim; col++){
					if(this.start[0] === row && this.start[1] === col){
						ctx.fillStyle = '#00FF00';
						ctx.shadowColor = ctx.fillStyle;
						ctx.shadowBlur = 20;
					}
					else if(this.end[0] === row && this.end[1] === col){
						ctx.fillStyle = this.searchDS.length ? '#FF0000' : '#AA00FF';
						ctx.shadowColor = ctx.fillStyle;
						ctx.shadowBlur = 20;
					}
					else if(this.walls[[row, col]]){
						ctx.fillStyle = '#666';
						ctx.shadowColor = ctx.fillStyle;
						ctx.shadowBlur = 0;
					}
					else if(this.searched[[row, col]]){
						ctx.fillStyle = '#0000FF';
						ctx.shadowColor = ctx.fillStyle;
						ctx.shadowBlur = 10;
					}
					else{
						ctx.fillStyle = '#BBB';
						ctx.shadowColor = ctx.fillStyle;
						ctx.shadowBlur = 0;
					}
					var squareX = (col * squareSize) + this.xOffset + squareOffset; 
					var squareY = (row * squareSize) + this.yOffset + squareOffset; 
					ctx.fillRect(squareX, squareY, squareInnerSize, squareInnerSize);
				}
			}
		};

		this.getValidNeighbors = function(cur){
			var neighbors = [];
			var directions = [[-1, 0], [0, -1], [1, 0], [0, 1]];
			for(i in directions){
				var dir = directions[i];
				var row = cur[0] + dir[0];
				var col = cur[1] + dir[1];
				var rowValid = row > -1 && row < this.dim;
				var colValid = col > -1 && col < this.dim;
				if(rowValid && colValid && !this.walls[[row, col]] && !this.searched[[row, col]]){
					neighbors.push([row, col]);	
				}
			}
			return neighbors;
		};
	
		// Treat searchDS as a queue	
		this.bfs = function(){
			console.log(this.searchDS);
			var cur = this.searchDS.pop();	
			var validNeighbors = this.getValidNeighbors(cur);
			for(i in validNeighbors){
				if(validNeighbors[i][0] === this.end[0] && validNeighbors[i][1] === this.end[1]){
					this.searchDS = [];
					this.searched[validNeighbors[i]] = true;
					return;
				}
				this.searched[validNeighbors[i]] = true;
				this.searchDS.splice(0, 0, validNeighbors[i]);
			}
		};

		// Treat searchDS as a stack
		this.dfs = function(){
			var cur = this.searchDS.pop();	
			var validNeighbors = this.getValidNeighbors(cur);
			for(i in validNeighbors){
				if(validNeighbors[i][0] === this.end[0] && validNeighbors[i][1] === this.end[1]){
					this.searchDS = [];
					this.searched[validNeighbors[i]] = true;
					return;
				}
				this.searched[validNeighbors[i]] = true;
				this.searchDS.push(validNeighbors[i]);
			}
		};
	};

	var gridDim = 20;
	var start = [13, 18];
	var end = [8, 10];

	var walls = [];
	for(var row = 0; row < gridDim; row++){
		if(row !== 17){
			walls.push([row, 13]);
		}
	}
	for(var col = 0; col < gridDim; col++){
		if(col !== 11){
			walls.push([5, col]);
		}
	}

	var grid = new Grid();
	grid.init(gridDim, start, end, walls);

	//main functions

	function update(){
		frameCount++;
		grid.update(canvas.width, canvas.height);
		if(grid.searchDS.length){
			//grid.bfs();
			grid.dfs();
		}
	}

	function draw(){
		drawBackground();
		grid.draw();
	}

	function loop(){
		update();
		draw();		
	}

	setInterval(loop, 1000 / 30);
}
