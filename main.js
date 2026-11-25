
import {map }  from "./CityMap.js"
let sg
try{
	const {Siger}=await import("./Siger/Siger.js")
	sg=new Siger()
}
catch{
	const {Siger}=await import("Siger")
	sg=new Siger()
}




const MeshToLoad={
	Karts:{
		directory:"models/Cars",
		type:"obj",
		Map:{
			Orange:"Race_Orange",
			Cooper:"Race_Cooper",
			Sky:"Race_Sky",
			Blue:"Race_Blue",
			White:"Race_White",
		}
	},
	Buildings:{
		directory:"models/buildings",
		type:"obj",
		Map:{
			E:"E",
			F:"F",
			D:"D",
		},
	},
	Roads:{
		directory:"models/Roads",
		type:"obj",
		Map:{	
			A:"A",
			B:"B",
			C:"C",
			D:"D",
			E:"E",
			F:"F",
			G:"G",
			H:"H",
			I:"I",
			J:"J",
			K:"K",
			L:"L",
			M:"M",
			N:"N",
			Goal:"Goal",
		},
	},
	Trees:{
		directory:"models/Trees",
		type:"obj",
		Map:{
			A:"A",
			B:"B",
			C:"C",
			D:"D"
		},
	},

	
}
let LoadedMeshes=await sg.LoadMultiMesh.FromSubObjects(MeshToLoad)
let Sounds={
	StartBeep:new Audio("sounds/StartBeep.mp3"),
	BgStart:new Audio("sounds/CityBgStart.mp3"),
	BgLoop:new Audio("sounds/CityBgLoop.mp3"),
	Kart:new Audio("sounds/kart_loop.mp3")

}
document.addEventListener("click",()=>{
		if(!Game.countDown) return
		Sounds.StartBeep.play()
		Game.readySetGo()
		Sounds.StartBeep.onended=()=>{
			Sounds.BgStart.play()
			Sounds.Kart.play()
			Sounds.Kart.loop=true

		}
			

		
		Sounds.BgStart.onended=()=>{
			Sounds.BgLoop.play()
			
			Sounds.BgLoop.loop=true
			
		}
	
})
class SeededRandom{
	 constructor(seed){
		this.globalSeed = seed
		this.getNextRandom=this.mulBerry32()
	}
		
	mulBerry32() {
		    return function() {
		        this.globalSeed |= 0; // Ensure seed is a 32-bit integer
		        this.globalSeed = this.globalSeed + 0x6D2B79F5 | 0;
		        let t = Math.imul(this.globalSeed ^ this.globalSeed >>> 15, 1 | this.globalSeed);
		        t = t ^ t >>> 7;
		        t = t ^ t >>> 15;
		        return (t >>> 0) / 4294967296; // Number between 0 and 1
		    }
		}
	
	rand(min, max) {
		    let seededRandom = this.getNextRandom();
		  	
		  
		  return Math.floor(seededRandom * (max - min + 1)) + min;
		}

	chooseRand(list){
		  return list[parseInt(this.rand(0,list.length-1))]
		  
		  
		}
}

let allSeeds={
	map:99,
	karts:Math.random()*99,
	coins:Math.random()*99,

}
let mapBuilderRandom=new SeededRandom(allSeeds.map)
let kartChooser=new SeededRandom(allSeeds.karts)
let coinChooser=new SeededRandom(allSeeds.coins)
const engine=new sg.SigerEngine()
engine.init()




let allKarts=['Orange',"Cooper","Sky","White"]
let userCar="Blue"
var CarSizes={
	Orange:[1.4,2,1.4,-55],
	Cooper:[6.7,9.3,8,-55],
	Sky:[6.7,8.3,8,-55],
	Blue:[2,4.4,2,-55],
	White:[4,8,4,-55],
	
}
function getRange(percent,min,max,dividend=10){
	return ((percent * (max - min + 1)) + min)/dividend
}
class AICar {
    constructor(vehicleBody, nodeMap,map,roadMap,smartness=0.8) {
        this.car = vehicleBody;
        this.car.useMap(map)
        this.rank=1
        this.driveSide=this.rank%2
        this.car.update()
        this.nodeMap = nodeMap;
        this.roadMap=roadMap;
        this.currentIndex = 0;
        this.waypointThreshold =3.3//smartness>0.5 ?getRange(smartness,10,30,10) : 4*smartness/0.5; // Distance threshold to switch to the next node
        this.stopDistance=6
        this.angleThreshold=2.5
        this.reverseTillDistance=0
        this.roadTileData=roadMap[this.car.cell.z][this.car.cell.x]
        this.currentNode=this.getLaneTargetNode(this.nodeMap[this.roadTileData[1][0]])
        this.targetNode=this.nodeMap[this.roadTileData[1][1]]
        console.log(this.roadTileData)

        

    }

    update() {
        //this.roadTileData=this.roadMap[this.car.cell.z][this.car.cell.x]
    	
       	if(this.car.collideObject) this.reverseTillDistance	=0.005*Game.MapCellSize
       	if(this.reverseTillDistance>0){	
       			this.reverseTillDistance-=Math.abs(this.car.velocity.x/Game.MapCellSize)
       			this.car.steerStop()
       			this.car.backGear();
       			
       			return
       		}
       	this.car.forwardGear()
      
     
      //  Check distance to the target node
        let pos=this.car.cell
     
        let distance = pos.distanceTo(this.targetNode);
      //Get steering angle
        let directionVector = this.targetNode.minus(this.currentNode);
        let deltaAngle = this.car.velocity.angleWith(directionVector)
        // Switch to the next node when close to the current one
        this.car.checkCollison=true
        if (distance < this.waypointThreshold) {
            this.targetNode =this.nodeMap[this.roadTileData[1][2]];
            this.currentNode=this.nodeMap[this.roadTileData[1][1]]
            
        }
   
        
        let degreesToTurn=(this.car.steering.angle-(this.car.steering.angle-deltaAngle))*180/Math.PI
        if(degreesToTurn>170) return//if car was going reverse wait and then took forwardGear untill velocity vector get in forward direction
        if (degreesToTurn>0) 
        	{this.car.steerLeft(0.02);this.car.backGear();
    }
        else if (degreesToTurn<0) 
        	{this.car.steerRight(0.02);this.car.backGear();}
        
        if (Math.abs(degreesToTurn)<this.angleThreshold) 
        	{this.car.steerStop();
        	this.car.forwardGear()
        	this.car.checkCollison=true
        	}
        pos=this.car.mapPos
        
       // document.querySelector("#debugger").innerHTML=`from:${this.currentNode.x},${this.currentNode.z} To:${this.targetNode.x},${this.targetNode.z}<br /> Angle:${this.car.steering.angle*180/Math.PI} targetAngle	:${Math.abs(this.car.steering.angle-(this.car.steering.angle-deltaAngle))*180/Math.PI} Distance:${distance.toFixed(2)}:`
           
        


      
    }
   getLaneTargetNode(rawNode) {
	    

	    const rad = this.roadTileData[0];
	

	    

	    // Perpendicular vector to the travel direction in XZ
	    // If left/right looks inverted on your map, negate both components
	    const perpX = -Math.sin(rad) * this.laneSide * this.laneOffset;
	    const perpZ =  Math.cos(rad) * this.laneSide * this.laneOffset;

	    // Match whether car.cell is in grid-cell units or world units
	    const scale = this.car.cell.distanceTo(new sg.Vector3([0, 0, 0])) < 50 ? 1 : Game.MapCellSize;

	    return new sg.Vector3([
	        rawNode.x + perpX * scale,
	        rawNode.y ?? 0,
	        rawNode.z + perpZ * scale
	    ]);
    }
}
let CityWorld	
export let Game={
	Camera:null,
	ScreenWidth:718,
	ScreenHeight:384,
	MapCellSize:135,
	MapCellCounts:61,
	Frame:0,
	Score:0,
	countDown:5,
   
	
	Player:{
		tile:[3,27,0],
		car:null,
		rank:2,
		points:0,
		powerup:null,
		coins:0,
		update(){
			
			Sounds.Kart.volume=Math.abs(this.car.speed/this.car.maxSpeed)
			//document.querySelector("#debugger").innerHTML=CityWorld.monitor.data[this.car.cell.z][this.car.cell.x][0]*180/Math.PI+"<br>Pos:"+this.car.mapPos.x.toFixed(3)+","+this.car.mapPos.z.toFixed(3)
		}
	},
	Opponents:[],
	async addCar(model,pos){
		let car=await sg.Object3D(LoadedMeshes.Karts[model])
		car.position=new sg.Vector3( [pos[0]*Game.MapCellSize, 0, pos[1]*Game.MapCellSize+12])
		car.scale=new sg.Vector3(CarSizes[model])
		car=new sg.VehicleBody3D(car)
		car.steering.angle=270*Math.PI/180
		car=CityWorld.SigerWorld.add(car)
		return car
	},
	animateCamera(){
		Game.Camera.position.x+=0.1
		Game.Camera.position.y+=0.1
		if(Game.Camera.position.x>0) requestAnimationFrame(animateCamera)
		else Main()
	},

	readySetGo(){
		this.countDown-=1
		console.log(this.countDown)
		let trafficLightMaterials=['redLight',"yellowLight","greenLight"]// The material to be changed 
		let lightOnColors=[[9,0,0],[9,9,0],[0,9,0]]//the diffusive colors of those material when respective light is on 
		let lightOffColors=[[1.1059,1.1059,1.1059],[1.1059,1.1059,1.1059],[1.1059,1.1059,1.1059]]//the diffusive colors of those material when respective light is off
		if(trafficLightMaterials[3-this.countDown])Game.trafficSignal.Mesh.materials.changeProperty(trafficLightMaterials[3-this.countDown],"diffuse",lightOnColors[3-this.countDown])// set the diffusive color of light using Material.Mesh.changeProperty 
		if(trafficLightMaterials[2-this.countDown])Game.trafficSignal.Mesh.materials.changeProperty(trafficLightMaterials[2-this.countDown],"diffuse",lightOffColors[2-this.countDown])
		if(this.countDown)setTimeout(this.readySetGo.bind(this),1000)
		else Game.Player.car.invokeFPSControll()
		
	},
	async start(){
		
		this.ScreenWidth=window.innerWidth
		this.ScreenHeight=window.innerHeight

		if(this.ScreenWidth<this.ScreenHeight)
		{
			this.ScreenWidth=window.innerHeight
			this.ScreenHeight=window.innerWidth
		}
		engine.invokeRenderer(document.querySelector("#renderer"),this.ScreenWidth,this.ScreenHeight)
		CityWorld= new getGameWorld("City",engine.getDefaultWorld(),map)
		let fog=new sg.Fog( [0.8, 0.9, 1, 1],15,700)
		CityWorld.SigerWorld.add(fog)						

		
		Game.Player.car=await Game.addCar(userCar,[55,57])

		await CityWorld.init()
	
	}
}


class getGameWorld{
	constructor(name,sgWorld,map){
		this.name=name
		this.UnitSize=Game.MapCellSize
		this.rows=Game.MapCellCounts
		this.columns=Game.MapCellCounts
		this.width=this.UnitSize*this.rows/2
		this.height=this.UnitSize*this.columns/2
		this.SigerWorld=sgWorld
		this.Enteties={A:0,B:0,C:0}
		this.mapData=map
		this.NodeMap=[
			new sg.Vector3([28,0,28]),
			new sg.Vector3([2,0,28]),
			new sg.Vector3([2,0,2]),
			new sg.Vector3([27,0,2]),
			new sg.Vector3([27,0,25]),
			new sg.Vector3([6,0,25]),
			new sg.Vector3([6,0,5]),
			new sg.Vector3([24,0,5]),
			new sg.Vector3([24,0,21]),
			new sg.Vector3([9,0,21]),
			new sg.Vector3([9,0,9]),
			new sg.Vector3([20,0,9]),
			new sg.Vector3([20,0,18]),
			new sg.Vector3([14,0,18])
		]
		this.monitor={
			rows:78,
			columns:73,
		    unitSize:3,
			canvas:document.querySelector("#monitor"),
			ctx:document.querySelector("#monitor").getContext("2d"),
			data:[],
			bg:new Image(),
			playerIcon:new Image(),
			opponentIcon:new Image(),
			async boot(){
				let row=[]
		        for(let i=0;i<=Game.MapCellCounts;i++) row.push(0)		        
		        for (let i=0;i<=Game.MapCellCounts;i++) this.data.push([...row])
		       //set canvas size
		        this.canvas.width=(this.rows)*this.unitSize
		    	this.canvas.height=(this.columns)*this.unitSize
		    //load bg
		    	this.bg.src="images/Monitor.png"
		    	this.playerIcon.src="images/playerMiniMapIcon.png"
		    	this.opponentIcon.src="images/opponentMiniMapIcon.png"

		    // load font
		    	const customFont = new FontFace("Digital7", "url(fonts/digital.ttf)");
  				const loadedFont = await customFont.load();
  				document.fonts.add(loadedFont);		
  				this.ctx.font = "35px Digital7";

		        				
		   },
		   scanRoadmap(){
		   	return
		   	CityWorld.NodeMap.forEach((currentNode,i)=>{
		   		if(i>=CityWorld.NodeMap.length-1) return
		   		currentNode=sg.Vector2.fromVector3(currentNode,"xz")
		   		
		   		let nextNode=sg.Vector2.fromVector3(CityWorld.NodeMap[i+1],"xz")
		   		
		   		let angle=nextNode.minus(currentNode).signedAngleWith(new sg.Vector2([1,0]))
		   		
		   		for(let y=Math.min(currentNode.y,nextNode.y);y<=Math.max(currentNode.y,nextNode.y);y++){
		   			for(let x=Math.min(currentNode.x,nextNode.x);x<=Math.max(currentNode.x,nextNode.x);x++){
		   					let coin=coinChooser.rand(0,100)>=30?0:[x+coinChooser.rand(1,Game.UnitSize)/Game.UnitSize,y+coinChooser.rand(1,Game.UnitSize)/Game.UnitSize]//30%chance of coin on roadblock Data:[x,z of cioin object]
		   					this.data[y][x]=[angle,[i,i+1,i+2],coin]
		   				}
		   		}

		   	})
		   	console.log(this.data)
		   },
		   draw(){
		   	let u=this.unitSize
		   	let w=this.rows*u
		   	let h=this.columns*u
		 //draw speed,rank and points

		   	this.ctx.drawImage(this.bg,0,0,w,h)
		   	this.ctx.fillStyle='white'
		   	  
  			
		   	this.ctx.fillText(`${Math.abs(Game.Player.car.speed*14).toFixed(0)}`,5*u,34*u)
		   	this.ctx.fillText(`${Math.abs(Game.Player.rank)}`,10*u,7*u)
		 // draw minimap
		   	for (var y = 0; y <= Game.MapCellCounts; y++) 
		   	{
		   		for (var x = 0; x <= Game.MapCellCounts; x++) 
		   		{
		   			let road=this.data[y][x]
		   			if (road) this.ctx.fillRect((x+17)*u,(y+5)*u,u,u)
		   		}
		   	}
		   	this.ctx.strokeStyle="lime"
		  let hd=Math.floor(Game.Camera.maxRange.z/135)-Math.floor(Game.Camera.minRange.z/135)
		  let wd=Math.floor(Game.Camera.maxRange.x/135)-Math.floor(Game.Camera.minRange.x/135)
		  this.ctx.strokeRect(Math.floor(Game.Camera.minRange.x/135)*u,Math.floor(Game.Camera.minRange.z/135)*u,wd*u,hd*u)
		 //show opponents on mini map
		   	this.ctx.fillStyle="red"
		   	Game.Opponents.forEach((o)=>{
			   	let ox=o.car.mapPos.x
			   	let oy=o.car.mapPos.z
			   	this.ctx.fillRect((ox+17)*u,(oy+5)*u,u,u)
			})
		//show player on mini map

		   	let cx=Game.Player.car.mapPos.x
		   	let cy=Game.Player.car.mapPos.z
		   	this.ctx.fillStyle="green"
		   	
		   	this.ctx.fillRect((cx+17)*u,(cy+5)*u,u,u)
		   	if(!this.data[cy]?.[cx]) Game.Player.car.maxSpeed=18
		   	else Game.Player.car.maxSpeed=14
		   }
		}
	
		this.SigerMap=new sg.SimpleGridMap(Game.MapCellCounts,Game.MapCellCounts,this.UnitSize,{autoScale:false,padding:0,plane:"xz"})
		this.addedEntities={
			roadBlocksCount:0,
			buildings:{},
			roads:{},
			trees:{},
			seat:{}
		}
this.background = {
    canvas: null,
    ctx: null,
    // Store just the starting X offset for each layer
    offsets: [0, 0, 0], 
    layer1: new Image(), // sky
    layer2: new Image(), // hills
    layer3: new Image(), // trees
    
    load() {
        this.canvas = document.querySelector("#background");
        this.ctx = this.canvas.getContext("2d");
        
        this.layer1 = new Image();
        this.layer1.src = "images/sky.png";
        
        this.layer2 = new Image();
        this.layer2.src = "images/hills.png";
        
        this.layer3 = new Image();
        this.layer3.src = "images/trees.png";
    },
    
    draw() {
        let speed = Game.Player.car.steering.deltaAngle * (-100);
        this.ctx.clearRect(0, 0, Game.ScreenWidth, Game.ScreenHeight);

        let imgWidth = 630;

        // Update offsets based on parallax speeds
        this.offsets[0] = (this.offsets[0] + speed) % imgWidth;
        this.offsets[1] = (this.offsets[1] + speed * 1.7) % imgWidth;
        this.offsets[2] = (this.offsets[2] + speed * 2.3) % imgWidth;

        // Draw each layer twice (side-by-side) to create the seamless loop
        for (let i = 0; i < 3; i++) {
            let img, yPos;
            if (i === 0) { img = this.layer1; yPos = 0; }
            if (i === 1) { img = this.layer2; yPos = 0; }
            if (i === 2) { img = this.layer3; yPos = -10; }

            let currentOffset = this.offsets[i];

            // Draw primary image and the repeating clone to fill the gap
            this.ctx.drawImage(img, currentOffset, yPos, imgWidth, 200);
            this.ctx.drawImage(img, currentOffset + imgWidth, yPos, imgWidth, 200);
            this.ctx.drawImage(img, currentOffset - imgWidth, yPos, imgWidth, 200);
        }

   
    }
};


	}
	render(){
	
		
		this.SigerWorld.render()
		this.background.draw()
		Game.Player.update()
		if(!Game.countDown)Game.Opponents.forEach((o)=>{
			o.update()
		})

		
	}
	async addRoad(cell,angleY,specialByte){
		this.addedEntities.roadBlocksCount+=1
		this.monitor.data[cell[1]][cell[0]]=1
		angleY=specialByte=="OOOO"?30:0
		let roadBlocks={
			AAAA:"B",
			OAOA:['H','E'],
			AOAO:['G',"F"],
			OAAO:'A',
			OOAA:"I",
			AOOA:"J",
			AAOO:"K",
			AAOA:"N",
			AAAO:"C",
			OAAA:"L",
			AOAA:"M",
			OOOA:"H",
			OAOO:"H",
			AOOO:"G",
			OOAO:"G",
			Goal:"Goal"


		}

		let size=[1,1.5,1]
		let choosen=roadBlocks[specialByte.replace("0","O")]?roadBlocks[specialByte.replace("0","O")]:"A" // randomly choose a road from the list
		if(specialByte=="OAOA"|| specialByte=="AOAO")choosen=choosen[((cell[0]+cell[1])%4?0:1)]
		

		let roadEntity=this.addedEntities.roads[choosen] // get its object3d
		if(roadEntity) {
			roadEntity=roadEntity.duplicate(cell,{ //duplicate entiy if already present at new cell
				rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
			})

			roadEntity.colliders=[]
			 if(this.addedEntities.roadBlocksCount%2==0 && roadEntity.Mesh.materials.hasMaterial("Black_StraightTrack01_001"))roadEntity.Mesh.materials.changeProperty("Black_StraightTrack01_001","diffuse",[0,0,0])
			if(roadEntity.Mesh.groups.base) roadEntity.colliders=["base","base2"]
				if (choosen=="Goal")roadEntity.Mesh.materials.changeProperty("redLight","diffuse",[1.105900 ,1.105900 ,1.105900])
			if(roadEntity.Mesh.materials.hasMaterial("redLight"))Game.trafficSignal =roadEntity

			return
		}

		let roadObj=await sg.Object3D(LoadedMeshes.Roads[choosen],{
			rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
		})

	
		if(choosen=="E") console.log(roadObj.dimension.center)
		roadEntity=this.SigerMap.addObject(roadObj,cell,new sg.Vector3(size))
		roadEntity.colliders=[]

		if(roadEntity.Mesh.groups.base) {roadEntity.colliders=["base","base2"]}
		this.addedEntities.roads[choosen]=roadEntity // store the entity for future duplication
		
	}
	async addTree(cell,angleY,specialByte){
		let trees=["A","B","C",'D']
		let choosen=mapBuilderRandom.chooseRand(trees) // randomly choose a tree from the list
		let treeEntity=this.addedEntities.trees[choosen] // get its object3d 
		if(treeEntity) {
			treeEntity=treeEntity.duplicate(cell,{ //duplicate entiy if already present at new cell
				rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
			})
			treeEntity.colliders=['base']
			return
		}
		treeEntity=await sg.Object3D(LoadedMeshes.Trees[choosen],{
			rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
		})
		treeEntity=this.SigerMap.addObject(treeEntity,cell,new sg.Vector3([0.8,42,0.8]))
		treeEntity.colliders=['base']
		
		this.addedEntities.trees[choosen]=treeEntity // store the entity for future duplication
	}
	async addBuilding(cell,angleY,specialByte){
		let buildings=["E","F","D"]
		let sizes={E:[1.8,40,0.8],F:[0.8,17,0.8],C:[0.8,50,0.8],D:[0.8,60,0.8]}
		let choosen=mapBuilderRandom.chooseRand(buildings) // randomly choose a building from the list
		let buildingEntity=this.addedEntities.buildings[choosen] // get its object3d 
		if(buildingEntity) {
			buildingEntity.duplicate(cell,{ //duplicate entiy if already present at new cell
				rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
			})
			return
		}
		buildingEntity=await sg.Object3D(LoadedMeshes.Buildings[choosen],{
			rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
		})
		buildingEntity=this.SigerMap.addObject(buildingEntity,cell,new sg.Vector3(sizes[choosen]))
		this.addedEntities.buildings[choosen]=buildingEntity // store the entity for future duplication
	}
	async addBarrier(cell,angleY,specialByte){
		this.monitor.data[cell[1]][cell[0]]=1
		let Barrier=this.addedEntities.barrier
		if(Barrier){
			Barrier=Barrier.duplicate(cell,{ //duplicate entiy if already present at new cell
				rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
			})
			Barrier.colliders=["Barrier"]
			return
		}
		Barrier=await sg.Object3D(`models/Decorations/Barrier.obj`,{
			rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
		})
		Barrier.colliders=["Barrier"]
		Barrier=this.SigerMap.addObject(Barrier,cell,new sg.Vector3([1,30,1]))
		
		
		this.addedEntities.barrier=Barrier // store the entity for future duplication

	}
	async addBoundry(cell,angleY,_specialByte){
	
		let boundry=this.addedEntities.boundry
		if(boundry){
			boundry=boundry.duplicate(cell,{ //duplicate entiy if already present at new cell
				rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
			})
		
			return
		}
		boundry=await sg.Object3D(`models/Decorations/Boundry.obj`,{
			rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
		})
		
		boundry=this.SigerMap.addObject(boundry,cell,new sg.Vector3([0.96,10,0.5]))
		
		
		this.addedEntities.boundry=boundry // store the entity for future duplication

	}
	async addBillBoard(cell,angleY,specialByte){
		let BillBoard=this.addedEntities.billboard
		if(BillBoard){
			BillBoard=BillBoard.duplicate(cell,{ //duplicate entiy if already present at new cell
				rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
			})
		BillBoard.colliders=["base"]//sg.BoundingBox.bindSubMesh(BillBoard,BillBoard.Mesh.groups['base'])

			return
		}
		BillBoard=await sg.Object3D(`models/Decorations/Billboard.obj`,{
			rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
		})
		BillBoard=this.SigerMap.addObject(BillBoard,cell,new sg.Vector3([1,30,1]))
		BillBoard.colliders=["base"]
		BillBoard.BoundingBox=null//sg.BoundingBox.bindSubMesh(BillBoard,BillBoard.Mesh.groups['base'])
	
		this.addedEntities.billboard=BillBoard // store the entity for future duplication


	}
	async addSeat(cell,angleY,specialByte){
		let seats=["A","B"]
		let choosen=mapBuilderRandom.chooseRand(seats) 
		let Seat=this.addedEntities.seat[choosen]
		if(Seat){
			Seat=Seat.duplicate(cell,{ //duplicate entiy if already present at new cell
				rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
			})
		
			return
		}
		Seat=await sg.Object3D(`models/Decorations/Seat${choosen}.obj`,{
			rotation:new sg.Vector3([0,angleY*Math.PI/180,0])
		})
		Seat=this.SigerMap.addObject(Seat,cell,new sg.Vector3([1,6,1]))
		
		
		this.addedEntities.seat[choosen]=Seat // store the entity for future duplication


	}
	async init(){
		await this.monitor.boot()
	//Load background 
		this.background.load()
	//Store world camera as global var	
		Game.Camera=this.SigerWorld.Camera
	//get and add floor	
		this.floor=await sg.Object3D("models/GrassBase.obj")
		this.floor.scale=new sg.Vector3([this.width+this.UnitSize,2,this.height+this.UnitSize])
		this.floor.position=new sg.Vector3([this.width,-2,this.height])
		this.floor=this.SigerWorld.add(this.floor)
	//Add entites to map 
		let objectAdder={
			building:this.addBuilding.bind(this),
			tree:this.addTree.bind(this),
			road:this.addRoad.bind(this),
			Billboard:this.addBillBoard.bind(this),
			barrier:this.addBarrier.bind(this),
			Seat:this.addSeat.bind(this),
			Boundry:this.addBoundry.bind(this)
		}
		
		for(let i=0;i<this.mapData.length;i++)
		{   
			let data=this.mapData[i]
			let entity=data[0]
			let angleY=data[1]
			let specialByte=data[2]
			let cell=[data[3],data[4]]
			if(objectAdder[entity]) await objectAdder[entity](cell,angleY,specialByte)
		}
		this.monitor.scanRoadmap()
			Game.Camera.mountTo(Game.Player.car,new sg.Vector3( [0,15,CarSizes[userCar][3]]))

	for(let i=0;i<0;i++){
			let car=await Game.addCar(kartChooser.chooseRand(allKarts),[27.96,27.8])
			Game.Camera.mountTo(Game.Player.car,new sg.Vector3( [0,15,CarSizes[userCar][3]]))
 			Game.Opponents.push(new AICar(car,CityWorld.NodeMap,this.SigerMap,this.monitor.data ))
		
	}

	    
	this.SigerWorld.add(this.SigerMap)
	Game.Player.car.useMap(this.SigerMap)
	this.monitor.draw()
	

	
	
	}
}
function Main(){
	Game.Frame++	
	let perThen=performance.now()	
		
		requestAnimationFrame(Main)
		CityWorld.render()
	
		
	let now=performance.now()
	if (Game.Frame%20==0)document.querySelector("fps").innerHTML=`FPS:${parseInt(1000/(now-perThen))}`
	
}


await Game.start()

Main()
setInterval(CityWorld.monitor.draw.bind(CityWorld.monitor),10)