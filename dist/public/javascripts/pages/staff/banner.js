"use strict";$(document).on("click","#banUser",function(){var a=parseInt($("#isEnabled").val()),b=$("#bannerText").val();request("/staff/banner","PATCH",JSON.stringify({text:b,enabled:a})).then(function(){0===a?success("The banner has been disabled. Please wait about 10 seconds for this to take effect."):success("The banner text has been updated. Please wait about 10 seconds for this to take effect.")})["catch"](function(a){warning(a.responseJSON.message)})});
























