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

	// MinHeap prototype
	var MinHeap = function(initList=[]){
		this.heap = initList;

		this._swap = function(a, b){
			var temp = this.heap[a];
			this.heap[a] = this.heap[b];
			this.heap[b] = temp;
		};
		
		this.getLen = function(){
			return this.heap.length;
		};

		this.add = function(x){
			var idx = this.heap.length;
			this.heap.push(x);
			while(idx !== 0){
				var parIdx = Math.floor((idx - 1) / 2);
				if(this.heap[parIdx]['dist'] > this.heap[idx]['dist']){
					this._swap(parIdx, idx);
					idx = parIdx;
				}
				else{
					return;
				}
			}
		};

		// Enforce the min-heap condition with respect to estimated distance
		this.heapify = function(){
			var heapLen = this.heap.length;
			var stack = [];
			for(i in this.heap){
				stack.push(i);
			}
			
			while(stack.length !== 0){
				var curIdx = stack.pop();
				var cur = this.heap[curIdx]['dist'];
				var leftIdx = 2 * curIdx + 1;
				var rightIdx = 2 * curIdx + 2;
				var left = leftIdx > heapLen - 1 ? cur : this.heap[leftIdx]['dist'];
				var right = rightIdx > heapLen - 1 ? cur : this.heap[rightIdx]['dist'];
				if(left < right){
					if(left < cur){
						this._swap(curIdx, leftIdx);
						stack.push(leftIdx);
					}
				}
				else{
					if(right < cur){
						this._swap(curIdx, rightIdx);
						stack.push(rightIdx);
					}
				}
			}
		};

		// Get coords of valid move estimated to be closest to the end
		this.popTop = function(){
			if(this.heap.length === 0){
				return null;
			}
			var heapTop = this.heap.splice(0, 1)[0]['coords'];
			this.heapify();
			return heapTop;
		};			

		if(this.heap.length !== 0){
			this.heapify();
		}
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
			this.minHeap = new MinHeap([{'dist': this._estimateDistance(start, end), 'coords': start}]);
			this.finished = false;
		};

		// Returns square of euclidean distance between coords without accounting for walls
		this._estimateDistance = function(a, b){
			var squaredRowDist = (a[0] - b[0]) ** 2;
			var squaredColDist = (a[1] - b[1]) ** 2;
			return squaredRowDist + squaredColDist;
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
						ctx.fillStyle = this.finished ? '#FF0000': '#FFFF00';
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
			var cur = this.searchDS.pop();	
			var validNeighbors = this.getValidNeighbors(cur);
			for(i in validNeighbors){
				if(validNeighbors[i][0] === this.end[0] && validNeighbors[i][1] === this.end[1]){
					this.searchDS = [];
					this.searched[validNeighbors[i]] = true;
					this.finished = true;
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
					this.finished = true;
					return;
				}
				this.searched[validNeighbors[i]] = true;
				this.searchDS.push(validNeighbors[i]);
			}
		};

		// Maintain min-heap of valid search spaces by distance heuristic
		this.aStar = function(){
			var cur = this.minHeap.popTop();
			var validNeighbors = this.getValidNeighbors(cur);
			for(i in validNeighbors){
				var neighbor = validNeighbors[i];
				if(neighbor[0] === this.end[0] && neighbor[1] === this.end[1]){
					this.minHeap = [];
					this.searched[neighbor] = true;
					this.finished = true;
					return;
				}
				this.searched[neighbor] = true;
				var estDist = this._estimateDistance(neighbor, this.end);
				this.minHeap.add({'dist': estDist, 'coords': neighbor});
			}
		};
	};

	var gridDim = 20;
	var start = [13, 18];
	var end = [3, 2];

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
		//if(grid.seachDS.length){
		//	grid.bfs();
			//grid.dfs();
		//}
		if(grid.minHeap.getLen()){
			grid.aStar();
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
