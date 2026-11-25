import {map} from "./CityMap.js"
let canvas=document.querySelector("#screen")
canvas.width=31
canvas.height=31
let ctx=canvas.getContext("2d")
function downloadCanvasAsPNG(canvasId, filename = 'canvas-image.png') {
  const canvas = document.getElementById(canvasId);
  
  // Convert canvas content to a PNG data URL (default format is image/png)
  const dataURL = canvas.toDataURL('image/png');
  
  // Create a temporary link element and trigger the download
  const link = document.createElement('a');
  link.innerHTML="Download"
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link)
  link.click();
}
let colors={
road:"white",
Billboard:"black",
building:"red",
tree:"rgb(0,255,0)",
barrier:"rgb(180,122,87)",
Seat:"rgb(0,0,255)"
}
ctx.fillStyle="cyan"
ctx.fillRect(0,0,31,31)
for(let i=0;i<map.length;i++)
{   
	let data=map[i]
	let entity=data[0]
	
	
	let cell=[data[3],data[4]]
	ctx.fillStyle=colors[entity]
	ctx.fillRect(cell[0],cell[1],1,1)
	
}
