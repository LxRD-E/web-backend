"use strict";function _typeof(a){"@babel/helpers - typeof";return _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},_typeof(a)}(function(a,b){"object"===("undefined"==typeof exports?"undefined":_typeof(exports))&&"undefined"!=typeof module?b():"function"==typeof define&&define.amd?define(b):b()})(void 0,function(){'use strict';if("undefined"==typeof Chart)throw new Error("Shards Dashboard requires the Chart.js library in order to function properly.");window.ShardsDashboards=window.ShardsDashboards?window.ShardsDashboards:{},$.extend($.easing,{easeOutSine:function(a,e,f,b,c){return b*Math.sin(e/c*(Math.PI/2))+f}}),Chart.defaults.LineWithLine=Chart.defaults.line,Chart.controllers.LineWithLine=Chart.controllers.line.extend({draw:function(a){if(Chart.controllers.line.prototype.draw.call(this,a),this.chart.tooltip._active&&this.chart.tooltip._active.length){var b=this.chart.tooltip._active[0],c=this.chart.ctx,d=b.tooltipPosition().x,e=this.chart.scales["y-axis-0"].top,f=this.chart.scales["y-axis-0"].bottom;c.save(),c.beginPath(),c.moveTo(d,e),c.lineTo(d,f),c.lineWidth=.5,c.strokeStyle="#ddd",c.stroke(),c.restore()}}}),$(document).ready(function(){$("#divNotifBalance").html("Dashboard"),$("#redirect-to-login").click(function(){window.location.replace("https://www.bloxshop.net/shop/login.php")}),$("#go-back").click(function(){window.history.back()});var a={duration:270,easing:"easeOutSine"};$(":not(.main-sidebar--icons-only) .dropdown").on("show.bs.dropdown",function(){$(this).find(".dropdown-menu").first().stop(!0,!0).slideDown(a)}),$(":not(.main-sidebar--icons-only) .dropdown").on("hide.bs.dropdown",function(){$(this).find(".dropdown-menu").first().stop(!0,!0).slideUp(a)}),$(".toggle-sidebar").click(function(){$(".main-sidebar").toggleClass("open")})})});















