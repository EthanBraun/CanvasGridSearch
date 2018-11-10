window.onload = function(){
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var colors = ['#FF0000', '#FFA500', '#FFFF00', '#00CC00', '#0066FF', '#BB00FF'];
	var mouseX = 0, mouseY = 0;
	var frameCount = 0;

	var clicked = 0;
	var freshClick = 0;

	resizeCanvas();
	
	function drawBackground(){
		ctx.fillStyle = '#333';
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
		//console.log("keycode: " + e.keyCode);
	}, false);

	document.addEventListener("mousemove", function(e){
		var mousePos = getMousePos(e);
		mouseX = mousePos.x;
		mouseY = mousePos.y;
	}, false);

	document.addEventListener('mousedown', function(event){
		if(!clicked){
			clicked = 1;
			freshClick = 1;
		}
	}, false);

	document.addEventListener('mouseup', function(event){
		clicked = 0;
		freshClick = 0;
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
	var Grid = function(canvasScale){
		this.grid = [];
		this.dim = 0;
		this.canvasScale = canvasScale;
		this.squareScale = 0.9;
		this.squareOffsetScale = (1 - this.squareScale) / 2;
		// 0 - Open, 1 - Walls
		this.toggleType = 0;
		
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

		this.resetSearch = function(){
			this.searched = {};
			this.searchDS = [this.start];
			this.minHeap = new MinHeap([{'dist': this._estimateDistance(this.start, this.end), 'coords': this.start}]);
			this.finished = false;
		};

		this.clearWalls = function(){
			this.walls = {};
		};

		this.setControlReference = function(ref){
			this.controls = ref;
		};

		// Returns square of euclidean distance between coords without accounting for walls
		this._estimateDistance = function(a, b){
			var squaredRowDist = (a[0] - b[0]) ** 2;
			var squaredColDist = (a[1] - b[1]) ** 2;
			return squaredRowDist + squaredColDist;
		};
	
		this.mouseInGrid = function(){
			if(mouseX > this.xOffset && mouseX < this.xOffset + this.gridSize){
				if(mouseY > this.yOffset && mouseY < this.yOffset + this.gridSize){
					return true;
				}
			}
			return false;
		};

		this.update = function(canvasWidth, canvasHeight){
			this.updateDrawingVars(canvasWidth, canvasHeight);
			// Controls in stop mode
			if(this.controls.mode === 1){
				if(this.mouseInGrid()){
					var col = Math.floor(this.dim * (mouseX - this.xOffset) / this.gridSize);
					var row = Math.floor(this.dim * (mouseY - this.yOffset) / this.gridSize);
					switch(this.controls.fillType){
						case 0:
							if(freshClick){
								this.toggleType = this.walls[[row, col]] ? 0 : 1;   	
							}
							if(clicked){
								if(this.toggleType === 0){
									this.walls[[row, col]] = false;
								}
								else{
									this.walls[[row, col]] = true;
								}
							}
							break;
						case 1:
							if(freshClick){
								this.start = [row, col];
								this.resetSearch();
							}
							break;
						case 2:
							if(freshClick){
								this.end = [row, col];
							}
							break;
					}
				}
			}
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
			ctx.fillStyle = '#444';
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
						//ctx.shadowColor = ctx.fillStyle;
						ctx.shadowBlur = 0;
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
		this.bestFirst = function(){
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

	// Controls prototype
	var Controls = function(controlScale, gridScale, grid){
		this.controlScale = controlScale;
		this.gridScale = gridScale;
		this.grid = grid;
		this.buttonScale = 0.8;
		this.iconScale = 0.5;
		this.buttonHover = null;
		this.buttonClick = null;
		// Inactive buttons
		this.inactive = {1: true, 3: true};

		// Modes - 0: play, 1: stop
		this.mode = 1;
		
		// Fill types - 0: wall toggle, 1: start, 2: end
		this.fillType = 0;

		this.updateDrawingVars = function(){
			this.xOffset = this.controlScale * this.canvasHeight;
			this.yOffset = this.canvasHeight * (1 - this.gridScale) / 2;
			this.width = this.controlScale * this.canvasHeight;
			this.height = this.gridScale * this.canvasHeight;
			this.buttonWidth = this.width * this.buttonScale;
			this.buttonOffset = (1 - this.buttonScale) * this.width / 2;
			this.buttonHeight = (this.height - 7 * this.buttonOffset) / 6;
			this.iconDims = this.buttonWidth < this.buttonHeight ? this.iconScale * this.buttonWidth : this.iconScale * this.buttonHeight; 
			this.iconOffsetX = (this.buttonWidth - this.iconDims) / 2;
			this.iconOffsetY = (this.buttonHeight - this.iconDims) / 2;
		};
		
		this.updateButtonHover = function(){
			if(mouseX < this.buttonOffset || mouseX > this.buttonOffset + this.buttonWidth){
				this.buttonHover = null;
				return;
			}
			for(var i = 0; i < 6; i++){
				var curTop = this.yOffset + this.buttonOffset + i * (this.buttonOffset + this.buttonHeight);
				if(mouseY > curTop && mouseY < curTop + this.buttonHeight){
					this.buttonHover = i;
					return;
				}
			}
			this.buttonHover = null;			
		};
	
		this.registerButtonClick = function(){
			switch(this.buttonClick){
				case 0:
					// Set to play mode
					this.mode = 0;
					this.inactive = {0: true, 1: false, 2: true, 3: true, 4: true, 5: true};
					break;
				case 1:
					// Set to stop mode
					this.mode = 1;
					this.inactive = {0: false, 1: true, 2: false, 3: false, 4: false, 5: false};
					this.inactive[this.fillType + 3] = true;
					this.grid.resetSearch();
					break;
				case 2:
					// Clear walls
					this.grid.clearWalls();
					break;
				case 3:
					// Set fill type to toggle
					this.inactive[this.fillType + 3] = false;
					this.fillType = 0;
					this.inactive[this.fillType + 3] = true;
					break;
				case 4:
					// Set fill type to start
					this.inactive[this.fillType + 3] = false;
					this.fillType = 1;
					this.inactive[this.fillType + 3] = true;
					break;
				case 5:
					// Set fill type to end
					this.inactive[this.fillType + 3] = false;
					this.fillType = 2;
					this.inactive[this.fillType + 3] = true;
					break;
			}
		};

		this.update = function(canvasWidth, canvasHeight){
			if(canvasWidth !== this.canvasWidth || canvasHeight !== this.canvasHeight){
				this.canvasWidth = canvasWidth;
				this.canvasHeight = canvasHeight;
				this.updateDrawingVars();	
			}
			this.updateButtonHover();
			if(clicked){
				if(this.buttonClick === null){
					this.buttonClick = this.buttonHover;
					if(!this.inactive[this.buttonClick]){
						this.registerButtonClick();
					}
				}
			}
			else if(this.buttonClick !== null){
				this.buttonClick = null;
			}
		};

		this.drawButtons = function(){
			for(var i = 0; i < 6; i++){
				var buttonTop = this.yOffset + this.buttonOffset + (this.buttonHeight + this.buttonOffset) * i;
				var iconLeft = this.buttonOffset + this.iconOffsetX;
				var iconTop = buttonTop + this.iconOffsetY;
				ctx.fillStyle = this.inactive[i] ? '#444' : (i === this.buttonHover ? (i === this.buttonClick ? '#333' : '#444') : '#222');
				ctx.shadowBlur = 0;
				ctx.fillRect(this.buttonOffset, buttonTop, this.buttonWidth, this.buttonHeight);
				this.drawIcon(i, iconLeft, iconTop);
			}
		};
		
		this.drawIcon = function(i, iconLeft, iconTop){
			switch(i){
				case 0:
					this.drawPlay(iconLeft, iconTop);
					break;
				case 1:
					this.drawStop(iconLeft, iconTop);
					break;
				case 2:
					this.drawReset(iconLeft, iconTop);
					break;
				case 3:
					this.drawToggle(iconLeft, iconTop);
					break;
				case 4:
					this.drawStart(iconLeft, iconTop);
					break;
				case 5:
					this.drawEnd(iconLeft, iconTop);
					break;
			}	
		};

		this.drawPlay = function(iLeft, iTop){
			ctx.fillStyle = '#0F0';
			ctx.shadowColor = '#0F0';
			ctx.shadowBlur = 10;
			ctx.beginPath();
			ctx.moveTo(iLeft, iTop);
			ctx.lineTo(iLeft + this.iconDims, iTop + this.iconDims / 2);
			ctx.lineTo(iLeft, iTop + this.iconDims);
			ctx.fill();
		};

		this.drawStop = function(iLeft, iTop){
			ctx.fillStyle = '#F00';
			ctx.shadowColor = '#F00';
			ctx.shadowBlur = 10;
			ctx.fillRect(iLeft, iTop, this.iconDims, this.iconDims);
		};

		this.drawReset = function(iLeft, iTop){
			ctx.strokeStyle = '#0CF';
			ctx.shadowColor = '#0CF';
			ctx.shadowBlur = 10;
			ctx.lineWidth = 8;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(iLeft, iTop);
			ctx.lineTo(iLeft + this.iconDims, iTop + this.iconDims);
			ctx.moveTo(iLeft, iTop + this.iconDims);
			ctx.lineTo(iLeft + this.iconDims, iTop);
			ctx.stroke();
		};

		this.drawToggle = function(iLeft, iTop){
			var squareScale = 0.7;
			ctx.shadowBlur = 10;
			ctx.fillStyle = '#BBB';
			ctx.shadowColor = '#BBB';
			ctx.fillRect(iLeft, iTop, squareScale * this.iconDims, squareScale * this.iconDims);
			ctx.fillStyle = '#666';
			ctx.shadowColor = '#666';
			ctx.fillRect(iLeft + (1 - squareScale) * this.iconDims, iTop + (1 - squareScale) * this.iconDims, squareScale * this.iconDims, squareScale * this.iconDims);
		};

		this.drawStart = function(iLeft, iTop){
			var squareScale = 0.7;
			ctx.fillStyle = '#0F0';
			ctx.shadowColor = '#0F0';
			ctx.shadowBlur = 10;
			var xOffset = iLeft + (1 - squareScale) * this.iconDims / 2;
			var yOffset = iTop + (1 - squareScale) * this.iconDims / 2;
			ctx.fillRect(xOffset, yOffset, squareScale * this.iconDims, squareScale * this.iconDims);
		};

		this.drawEnd = function(iLeft, iTop){
			var squareScale = 0.7;
			ctx.fillStyle = '#FF0';
			ctx.shadowColor = '#FF0';
			ctx.shadowBlur = 10;
			var xOffset = iLeft + (1 - squareScale) * this.iconDims / 2;
			var yOffset = iTop + (1 - squareScale) * this.iconDims / 2;
			ctx.fillRect(xOffset, yOffset, squareScale * this.iconDims, squareScale * this.iconDims);
		};

		this.draw = function(){
			ctx.fillStyle = '#111';
			ctx.shadowColor = '#111';
			ctx.shadowBlur = 10;
			ctx.fillRect(0, this.yOffset, this.width, this.height);
			this.drawButtons();
		};
	};

	var gridDim = 30;
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

	var gridScale = 0.75;
	var controlsScale = 0.10;

	var grid = new Grid(gridScale);
	var controls = new Controls(controlsScale, gridScale, grid);
	grid.init(gridDim, start, end, walls);
	grid.setControlReference(controls);

	//main functions

	function update(){
		frameCount++;
		grid.update(canvas.width, canvas.height);
		controls.update(canvas.width, canvas.height);
		//if(grid.seachDS.length){
		//	grid.bfs();
			//grid.dfs();
		//}
		if(controls.mode === 0 && grid.minHeap.heap && grid.minHeap.heap.length){
			grid.bestFirst();
		}
		freshClick = 0;
	}

	function draw(){
		drawBackground();
		grid.draw();
		controls.draw();
	}

	function loop(){
		update();
		draw();		
	}

	setInterval(loop, 1000 / 30);
}
