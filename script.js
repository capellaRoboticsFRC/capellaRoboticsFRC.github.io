function runCode(){

let code = document.getElementById("codeInput").value;

try{

eval(code);

if(typeof growFlower === "function"){

let result = growFlower();

if(result === true){

plantFlower();

}

}

}catch(e){

alert("Kodda hata var!");

}

}



function plantFlower(){

const flowers = ["🌸","🌼","🌻","🌷","🌹"];

let flower = document.createElement("div");

flower.className = "flower";

flower.innerText = flowers[Math.floor(Math.random()*flowers.length)];

document.getElementById("field").appendChild(flower);

}
