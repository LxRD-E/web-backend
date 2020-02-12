"use strict";(function b(c,d,e){function a(h,i){if(!d[h]){if(!c[h]){var j="function"==typeof require&&require;if(!i&&j)return j(h,!0);if(g)return g(h,!0);var k=new Error("Cannot find module '"+h+"'");throw k.code="MODULE_NOT_FOUND",k}var f=d[h]={exports:{}};c[h][0].call(f.exports,function(b){var d=c[h][1][b];return a(d?d:b)},f,f.exports,b,c,d,e)}return d[h].exports}for(var g="function"==typeof require&&require,f=0;f<e.length;f++)a(e[f]);return a})({1:[function(a,b,c){function d(){return{a:["target","href","title"],abbr:["title"],address:[],area:["shape","coords","href","alt"],article:[],aside:[],audio:["autoplay","controls","loop","preload","src"],b:[],bdi:["dir"],bdo:["dir"],big:[],blockquote:["cite"],br:[],caption:[],center:[],cite:[],code:[],col:["align","valign","span","width"],colgroup:["align","valign","span","width"],dd:[],del:["datetime"],details:["open"],div:[],dl:[],dt:[],em:[],font:["color","size","face"],footer:[],h1:[],h2:[],h3:[],h4:[],h5:[],h6:[],header:[],hr:[],i:[],img:["src","alt","title","width","height"],ins:["datetime"],li:[],mark:[],nav:[],ol:[],p:[],pre:[],s:[],section:[],small:[],span:[],sub:[],sup:[],strong:[],table:["width","border","align","valign"],tbody:["align","valign"],td:["width","rowspan","colspan","align","valign"],tfoot:["align","valign"],th:["width","rowspan","colspan","align","valign"],thead:["align","valign"],tr:["rowspan","align","valign"],tt:[],u:[],ul:[],video:["autoplay","controls","loop","preload","src","height","width"]}}function e(a){return a.replace(q,"&lt;").replace(r,"&gt;")}function f(a){return a.replace(s,"&quot;")}function g(a){return a.replace(t,"\"")}function h(a){return a.replace(u,function(a,b){return"x"===b[0]||"X"===b[0]?String.fromCharCode(parseInt(b.substr(1),16)):String.fromCharCode(parseInt(b,10))})}function i(a){return a.replace(v,":").replace(w," ")}function j(a){for(var b="",c=0,d=a.length;c<d;c++)b+=32>a.charCodeAt(c)?" ":a.charAt(c);return o.trim(b)}function k(a){return a=g(a),a=h(a),a=i(a),a=j(a),a}function l(a){return a=f(a),a=e(a),a}var m=a("cssfilter").FilterCSS,n=a("cssfilter").getDefaultWhiteList,o=a("./util"),p=new m,q=/</g,r=/>/g,s=/"/g,t=/&quot;/g,u=/&#([a-zA-Z0-9]*);?/gim,v=/&colon;?/gim,w=/&newline;?/gim,x=/\/\*|\*\//gm,y=/((j\s*a\s*v\s*a|v\s*b|l\s*i\s*v\s*e)\s*s\s*c\s*r\s*i\s*p\s*t\s*|m\s*o\s*c\s*h\s*a)\:/gi,z=/^[\s"'`]*(d\s*a\s*t\s*a\s*)\:/gi,A=/^[\s"'`]*(d\s*a\s*t\s*a\s*)\:\s*image\//gi,B=/e\s*x\s*p\s*r\s*e\s*s\s*s\s*i\s*o\s*n\s*\(.*/gi,C=/u\s*r\s*l\s*\(.*/gi,D=/<!--[\s\S]*?-->/g;c.whiteList=d(),c.getDefaultWhiteList=d,c.onTag=function(){},c.onIgnoreTag=function(){},c.onTagAttr=function(){},c.onIgnoreTagAttr=function(){},c.safeAttrValue=function(a,b,c,d){if(c=k(c),"href"===b||"src"===b){if(c=o.trim(c),"#"===c)return"#";if("http://"!==c.substr(0,7)&&"https://"!==c.substr(0,8)&&"mailto:"!==c.substr(0,7)&&"tel:"!==c.substr(0,4)&&"#"!==c[0]&&"/"!==c[0])return""}else if("background"===b){if(y.lastIndex=0,y.test(c))return"";}else if("style"===b){if(B.lastIndex=0,B.test(c))return"";if(C.lastIndex=0,C.test(c)&&(y.lastIndex=0,y.test(c)))return"";!1!==d&&(d=d||p,c=d.process(c))}return c=l(c),c},c.escapeHtml=e,c.escapeQuote=f,c.unescapeQuote=g,c.escapeHtmlEntities=h,c.escapeDangerHtml5Entities=i,c.clearNonPrintableCharacter=j,c.friendlyAttrValue=k,c.escapeAttrValue=l,c.onIgnoreTagStripAll=function(){return""},c.StripTagBody=function(a,b){function c(b){return!!d||-1!==o.indexOf(a,b)}"function"!=typeof b&&(b=function(){});var d=!Array.isArray(a),e=[],f=!1;return{onIgnoreTag:function onIgnoreTag(a,d,g){if(c(a)){if(g.isClosing){var h=g.position+10;return e.push([!1===f?g.position:f,h]),f=!1,"[/removed]"}return f||(f=g.position),"[removed]"}return b(a,d,g)},remove:function remove(a){var b="",c=0;return o.forEach(e,function(d){b+=a.slice(c,d[0]),c=d[1]}),b+=a.slice(c),b}}},c.stripCommentTag=function(a){return a.replace(D,"")},c.stripBlankChar=function(a){var b=a.split("");return b=b.filter(function(a){var b=a.charCodeAt(0);return 127!==b&&(!(31>=b)||10===b||13===b)}),b.join("")},c.cssFilter=p,c.getDefaultCSSWhiteList=n},{"./util":4,cssfilter:8}],2:[function(a,b,c){function d(a,b){var c=new g(b);return c.process(a)}var e=a("./default"),f=a("./parser"),g=a("./xss");for(var h in c=b.exports=d,c.filterXSS=d,c.FilterXSS=g,e)c[h]=e[h];for(var h in f)c[h]=f[h];"undefined"!=typeof window&&(window.filterXSS=b.exports),function(){return"undefined"!=typeof self&&"undefined"!=typeof DedicatedWorkerGlobalScope&&self instanceof DedicatedWorkerGlobalScope}()&&(self.filterXSS=b.exports)},{"./default":1,"./parser":3,"./xss":5}],3:[function(a,b,c){function d(a){var b=l.spaceIndex(a);if(-1===b)var c=a.slice(1,-1);else var c=a.slice(1,b+1);return c=l.trim(c).toLowerCase(),"/"===c.slice(0,1)&&(c=c.slice(1)),"/"===c.slice(-1)&&(c=c.slice(0,-1)),c}function e(a){return"</"===a.slice(0,2)}function f(a,b){for(;b<a.length;b++){var d=a[b];if(" "!==d)return"="===d?b:-1}}function g(a,b){for(;0<b;b--){var d=a[b];if(" "!==d)return"="===d?b:-1}}function h(a){return!(("\""!==a[0]||"\""!==a[a.length-1])&&("'"!==a[0]||"'"!==a[a.length-1]))}function k(a){return h(a)?a.substr(1,a.length-2):a}var l=a("./util"),i=/[^a-zA-Z0-9_:\.\-]/gim;c.parseTag=function(a,b,f){"use strict";var g="",h=0,i=!1,j=!1,k=0,l=a.length,m="",n="";for(k=0;k<l;k++){var o=a.charAt(k);if(!1===i){if("<"===o){i=k;continue}}else if(!1===j){if("<"===o){g+=f(a.slice(h,k)),i=k,h=k;continue}if(">"===o){g+=f(a.slice(h,i)),n=a.slice(i,k+1),m=d(n),g+=b(i,g.length,m,n,e(n)),h=k+1,i=!1;continue}if(("\""===o||"'"===o)&&"="===a.charAt(k-1)){j=o;continue}}else if(o===j){j=!1;continue}}return h<a.length&&(g+=f(a.substr(h))),g},c.parseAttr=function(a,b){"use strict";function d(a,c){if(a=l.trim(a),a=a.replace(i,"").toLowerCase(),!(1>a.length)){var d=b(a,c||"");d&&h.push(d)}}for(var e=0,h=[],m=!1,n=a.length,o=0;o<n;o++){var p,q,r=a.charAt(o);if(!1===m&&"="===r){m=a.slice(e,o),e=o+1;continue}if(!1!==m&&o===e&&("\""===r||"'"===r)&&"="===a.charAt(o-1))if(q=a.indexOf(r,o+1),-1===q)break;else{p=l.trim(a.slice(e+1,q)),d(m,p),m=!1,o=q,e=o+1;continue}if(/\s|\n|\t/.test(r))if(a=a.replace(/\s|\n|\t/g," "),!1===m){if(q=f(a,o),-1===q){p=l.trim(a.slice(e,o)),d(p),m=!1,e=o+1;continue}else{o=q-1;continue}}else if(q=g(a,o-1),-1===q){p=l.trim(a.slice(e,o)),p=k(p),d(m,p),m=!1,e=o+1;continue}else continue}return e<a.length&&(!1===m?d(a.slice(e)):d(m,k(l.trim(a.slice(e))))),l.trim(h.join(" "))}},{"./util":4}],4:[function(a,b){b.exports={indexOf:function indexOf(a,b){var c,d;if(Array.prototype.indexOf)return a.indexOf(b);for(c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return-1},forEach:function forEach(a,b,c){var d,e;if(Array.prototype.forEach)return a.forEach(b,c);for(d=0,e=a.length;d<e;d++)b.call(c,a[d],d,a)},trim:function trim(a){return String.prototype.trim?a.trim():a.replace(/(^\s*)|(\s*$)/g,"")},spaceIndex:function spaceIndex(a){var b=/\s|\n|\t/,c=b.exec(a);return c?c.index:-1}}},{}],5:[function(a,b){function c(a){return a===void 0||null===a}function d(a){var b=l.spaceIndex(a);if(-1===b)return{html:"",closing:"/"===a[a.length-2]};a=l.trim(a.slice(b+1,-1));var c="/"===a[a.length-1];return c&&(a=l.trim(a.slice(0,-1))),{html:a,closing:c}}function e(a){var b={};for(var c in a)b[c]=a[c];return b}function f(a){a=e(a||{}),a.stripIgnoreTag&&(a.onIgnoreTag&&void 0,a.onIgnoreTag=h.onIgnoreTagStripAll),a.whiteList=a.whiteList||h.whiteList,a.onTag=a.onTag||h.onTag,a.onTagAttr=a.onTagAttr||h.onTagAttr,a.onIgnoreTag=a.onIgnoreTag||h.onIgnoreTag,a.onIgnoreTagAttr=a.onIgnoreTagAttr||h.onIgnoreTagAttr,a.safeAttrValue=a.safeAttrValue||h.safeAttrValue,a.escapeHtml=a.escapeHtml||h.escapeHtml,this.options=a,!1===a.css?this.cssFilter=!1:(a.css=a.css||{},this.cssFilter=new g(a.css))}var g=a("cssfilter").FilterCSS,h=a("./default"),i=a("./parser"),j=i.parseTag,k=i.parseAttr,l=a("./util");f.prototype.process=function(a){if(a=a||"",a=a.toString(),!a)return"";var b=this,e=b.options,f=e.whiteList,g=e.onTag,i=e.onIgnoreTag,m=e.onTagAttr,n=e.onIgnoreTagAttr,o=e.safeAttrValue,p=e.escapeHtml,q=b.cssFilter;e.stripBlankChar&&(a=h.stripBlankChar(a)),e.allowCommentTag||(a=h.stripCommentTag(a));var r=!1;if(e.stripIgnoreTagBody){var r=h.StripTagBody(e.stripIgnoreTagBody,i);i=r.onIgnoreTag}var s=j(a,function(a,b,e,h,j){var r={sourcePosition:a,position:b,isClosing:j,isWhite:f.hasOwnProperty(e)},s=g(e,h,r);if(!c(s))return s;if(r.isWhite){if(r.isClosing)return"</"+e+">";var t=d(h),u=f[e],v=k(t.html,function(a,b){var d=-1!==l.indexOf(u,a),f=m(e,a,b,d);if(!c(f))return f;if(d)return b=o(e,a,b,q),b?a+"=\""+b+"\"":a;var f=n(e,a,b,d);return c(f)?void 0:f}),h="<"+e;return v&&(h+=" "+v),t.closing&&(h+=" /"),h+=">",h}var s=i(e,h,r);return c(s)?p(h):s},p);return r&&(s=r.remove(s)),s},b.exports=f},{"./default":1,"./parser":3,"./util":4,cssfilter:8}],6:[function(a,b){function c(a){return a===void 0||null===a}function d(a){var b={};for(var c in a)b[c]=a[c];return b}function e(a){a=d(a||{}),a.whiteList=a.whiteList||f.whiteList,a.onAttr=a.onAttr||f.onAttr,a.onIgnoreAttr=a.onIgnoreAttr||f.onIgnoreAttr,a.safeAttrValue=a.safeAttrValue||f.safeAttrValue,this.options=a}var f=a("./default"),g=a("./parser"),h=a("./util");e.prototype.process=function(a){if(a=a||"",a=a.toString(),!a)return"";var b=this,d=b.options,e=d.whiteList,f=d.onAttr,h=d.onIgnoreAttr,i=d.safeAttrValue,j=g(a,function(a,b,d,g,j){var k=e[d],l=!1;if(!0===k?l=k:"function"==typeof k?l=k(g):k instanceof RegExp&&(l=k.test(g)),!0!==l&&(l=!1),g=i(d,g),!!g){var m={position:b,sourcePosition:a,source:j,isWhite:l};if(l){var n=f(d,g,m);return c(n)?d+":"+g:n}var n=h(d,g,m);if(!c(n))return n}});return j},b.exports=e},{"./default":7,"./parser":9,"./util":10}],7:[function(a,b,c){function d(){return{"align-content":!1,"align-items":!1,"align-self":!1,"alignment-adjust":!1,"alignment-baseline":!1,all:!1,"anchor-point":!1,animation:!1,"animation-delay":!1,"animation-direction":!1,"animation-duration":!1,"animation-fill-mode":!1,"animation-iteration-count":!1,"animation-name":!1,"animation-play-state":!1,"animation-timing-function":!1,azimuth:!1,"backface-visibility":!1,background:!0,"background-attachment":!0,"background-clip":!0,"background-color":!0,"background-image":!0,"background-origin":!0,"background-position":!0,"background-repeat":!0,"background-size":!0,"baseline-shift":!1,binding:!1,bleed:!1,"bookmark-label":!1,"bookmark-level":!1,"bookmark-state":!1,border:!0,"border-bottom":!0,"border-bottom-color":!0,"border-bottom-left-radius":!0,"border-bottom-right-radius":!0,"border-bottom-style":!0,"border-bottom-width":!0,"border-collapse":!0,"border-color":!0,"border-image":!0,"border-image-outset":!0,"border-image-repeat":!0,"border-image-slice":!0,"border-image-source":!0,"border-image-width":!0,"border-left":!0,"border-left-color":!0,"border-left-style":!0,"border-left-width":!0,"border-radius":!0,"border-right":!0,"border-right-color":!0,"border-right-style":!0,"border-right-width":!0,"border-spacing":!0,"border-style":!0,"border-top":!0,"border-top-color":!0,"border-top-left-radius":!0,"border-top-right-radius":!0,"border-top-style":!0,"border-top-width":!0,"border-width":!0,bottom:!1,"box-decoration-break":!0,"box-shadow":!0,"box-sizing":!0,"box-snap":!0,"box-suppress":!0,"break-after":!0,"break-before":!0,"break-inside":!0,"caption-side":!1,chains:!1,clear:!0,clip:!1,"clip-path":!1,"clip-rule":!1,color:!0,"color-interpolation-filters":!0,"column-count":!1,"column-fill":!1,"column-gap":!1,"column-rule":!1,"column-rule-color":!1,"column-rule-style":!1,"column-rule-width":!1,"column-span":!1,"column-width":!1,columns:!1,contain:!1,content:!1,"counter-increment":!1,"counter-reset":!1,"counter-set":!1,crop:!1,cue:!1,"cue-after":!1,"cue-before":!1,cursor:!1,direction:!1,display:!0,"display-inside":!0,"display-list":!0,"display-outside":!0,"dominant-baseline":!1,elevation:!1,"empty-cells":!1,filter:!1,flex:!1,"flex-basis":!1,"flex-direction":!1,"flex-flow":!1,"flex-grow":!1,"flex-shrink":!1,"flex-wrap":!1,float:!1,"float-offset":!1,"flood-color":!1,"flood-opacity":!1,"flow-from":!1,"flow-into":!1,font:!0,"font-family":!0,"font-feature-settings":!0,"font-kerning":!0,"font-language-override":!0,"font-size":!0,"font-size-adjust":!0,"font-stretch":!0,"font-style":!0,"font-synthesis":!0,"font-variant":!0,"font-variant-alternates":!0,"font-variant-caps":!0,"font-variant-east-asian":!0,"font-variant-ligatures":!0,"font-variant-numeric":!0,"font-variant-position":!0,"font-weight":!0,grid:!1,"grid-area":!1,"grid-auto-columns":!1,"grid-auto-flow":!1,"grid-auto-rows":!1,"grid-column":!1,"grid-column-end":!1,"grid-column-start":!1,"grid-row":!1,"grid-row-end":!1,"grid-row-start":!1,"grid-template":!1,"grid-template-areas":!1,"grid-template-columns":!1,"grid-template-rows":!1,"hanging-punctuation":!1,height:!0,hyphens:!1,icon:!1,"image-orientation":!1,"image-resolution":!1,"ime-mode":!1,"initial-letters":!1,"inline-box-align":!1,"justify-content":!1,"justify-items":!1,"justify-self":!1,left:!1,"letter-spacing":!0,"lighting-color":!0,"line-box-contain":!1,"line-break":!1,"line-grid":!1,"line-height":!1,"line-snap":!1,"line-stacking":!1,"line-stacking-ruby":!1,"line-stacking-shift":!1,"line-stacking-strategy":!1,"list-style":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,margin:!0,"margin-bottom":!0,"margin-left":!0,"margin-right":!0,"margin-top":!0,"marker-offset":!1,"marker-side":!1,marks:!1,mask:!1,"mask-box":!1,"mask-box-outset":!1,"mask-box-repeat":!1,"mask-box-slice":!1,"mask-box-source":!1,"mask-box-width":!1,"mask-clip":!1,"mask-image":!1,"mask-origin":!1,"mask-position":!1,"mask-repeat":!1,"mask-size":!1,"mask-source-type":!1,"mask-type":!1,"max-height":!0,"max-lines":!1,"max-width":!0,"min-height":!0,"min-width":!0,"move-to":!1,"nav-down":!1,"nav-index":!1,"nav-left":!1,"nav-right":!1,"nav-up":!1,"object-fit":!1,"object-position":!1,opacity:!1,order:!1,orphans:!1,outline:!1,"outline-color":!1,"outline-offset":!1,"outline-style":!1,"outline-width":!1,overflow:!1,"overflow-wrap":!1,"overflow-x":!1,"overflow-y":!1,padding:!0,"padding-bottom":!0,"padding-left":!0,"padding-right":!0,"padding-top":!0,page:!1,"page-break-after":!1,"page-break-before":!1,"page-break-inside":!1,"page-policy":!1,pause:!1,"pause-after":!1,"pause-before":!1,perspective:!1,"perspective-origin":!1,pitch:!1,"pitch-range":!1,"play-during":!1,position:!1,"presentation-level":!1,quotes:!1,"region-fragment":!1,resize:!1,rest:!1,"rest-after":!1,"rest-before":!1,richness:!1,right:!1,rotation:!1,"rotation-point":!1,"ruby-align":!1,"ruby-merge":!1,"ruby-position":!1,"shape-image-threshold":!1,"shape-outside":!1,"shape-margin":!1,size:!1,speak:!1,"speak-as":!1,"speak-header":!1,"speak-numeral":!1,"speak-punctuation":!1,"speech-rate":!1,stress:!1,"string-set":!1,"tab-size":!1,"table-layout":!1,"text-align":!0,"text-align-last":!0,"text-combine-upright":!0,"text-decoration":!0,"text-decoration-color":!0,"text-decoration-line":!0,"text-decoration-skip":!0,"text-decoration-style":!0,"text-emphasis":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-height":!0,"text-indent":!0,"text-justify":!0,"text-orientation":!0,"text-overflow":!0,"text-shadow":!0,"text-space-collapse":!0,"text-transform":!0,"text-underline-position":!0,"text-wrap":!0,top:!1,transform:!1,"transform-origin":!1,"transform-style":!1,transition:!1,"transition-delay":!1,"transition-duration":!1,"transition-property":!1,"transition-timing-function":!1,"unicode-bidi":!1,"vertical-align":!1,visibility:!1,"voice-balance":!1,"voice-duration":!1,"voice-family":!1,"voice-pitch":!1,"voice-range":!1,"voice-rate":!1,"voice-stress":!1,"voice-volume":!1,volume:!1,"white-space":!1,widows:!1,width:!0,"will-change":!1,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"wrap-flow":!1,"wrap-through":!1,"writing-mode":!1,"z-index":!1}}var e=/javascript\s*\:/img;c.whiteList=d(),c.getDefaultWhiteList=d,c.onAttr=function(){},c.onIgnoreAttr=function(){},c.safeAttrValue=function(a,b){return e.test(b)?"":b}},{}],8:[function(a,b,c){function d(a,b){var c=new f(b);return c.process(a)}var e=a("./default"),f=a("./css");for(var g in c=b.exports=d,c.FilterCSS=f,e)c[g]=e[g];"undefined"!=typeof window&&(window.filterCSS=b.exports)},{"./css":6,"./default":7}],9:[function(a,b){var d=a("./util");b.exports=function(a,b){function e(){if(!g){var c=d.trim(a.slice(h,k)),e=c.indexOf(":");if(-1!==e){var f=d.trim(c.slice(0,e)),i=d.trim(c.slice(e+1));if(f){var j=b(h,l.length,f,i,c);j&&(l+=j+"; ")}}}h=k+1}a=d.trimRight(a),";"!==a[a.length-1]&&(a+=";");for(var f=a.length,g=!1,h=0,k=0,l="";k<f;k++){var m=a[k];if("/"===m&&"*"===a[k+1]){var c=a.indexOf("*/",k+2);if(-1===c)break;k=c+1,h=k+1,g=!1}else"("===m?g=!0:")"===m?g=!1:";"===m?g||e():"\n"===m&&e()}return d.trim(l)}},{"./util":10}],10:[function(a,b){b.exports={indexOf:function indexOf(a,b){var c,d;if(Array.prototype.indexOf)return a.indexOf(b);for(c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return-1},forEach:function forEach(a,b,c){var d,e;if(Array.prototype.forEach)return a.forEach(b,c);for(d=0,e=a.length;d<e;d++)b.call(c,a[d],d,a)},trim:function trim(a){return String.prototype.trim?a.trim():a.replace(/(^\s*)|(\s*$)/g,"")},trimRight:function trimRight(a){return String.prototype.trimRight?a.trimRight():a.replace(/(\s*$)/g,"")}}},{}]},{},[2]);












