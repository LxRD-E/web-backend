"use strict";var canvas=document.getElementById("renderCanvas"),engine=new BABYLON.Engine(canvas,!0),createScene=function(){var a=new BABYLON.Scene(engine),b=new BABYLON.FreeCamera("camera",new BABYLON.Vector3(0,5,-10),a);b.setTarget(BABYLON.Vector3.Zero()),b.attachControl(canvas,!1);var c=new BABYLON.HemisphericLight("light1",new BABYLON.Vector3(0,1,0),a),d=BABYLON.MeshBuilder.CreateSphere("sphere",{segments:16,diameter:2},a);d.position.y=1;BABYLON.MeshBuilder.CreateGround("ground1",{height:6,width:6,subdivisions:2},a);return a},scene=createScene();engine.runRenderLoop(function(){scene.render()}),window.addEventListener("resize",function(){engine.resize()}),$(document).keypress(function(){});












