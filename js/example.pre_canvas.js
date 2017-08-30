var key_up_flag=false;
var current_canvas=false;
var current_orientation=false;
var last_number_of_canvas=0;
var images=[];
var current_canvas_id="";
var scale=2;
var canvasMap = {
  
  
};

$(document).ready(function(){
	
	

	openPreloader();
	loadCanvasFromLocalStorage();
	//Если в локальном хранилище не было холстов то просто добавляем пустой холст.
	if($("canvas").length==0){
		addCanvas();
	}
	
	setProjectPrice();
	
	$("body").on("change",".c_width",function(e){
		var val=parseInt($(this).val());
		if(val<150){openError("Минимальная ширина 150см");
			$(this).val(e.target.defaultValue);
			return false;
		}
		val=val*scale;
		
		console.log(val);
		$(this).closest(".kit__item").find(".canvas-container,canvas").width(val);
		$(this).closest(".kit__item").find("canvas").attr("width",val);
		var id=$(this).closest(".kit__item").find("canvas").attr("id");
		saveCanvas(id);
		canvasMap[id]["instance"].setWidth(val);
		updateGrid(id);
		setProjectPrice();
	})
	

	
	$("body").on("change",".c_name",function(){
		var val=$(this).val();
		console.log(val);
		var id=$(this).closest(".kit__item").find("canvas").attr("id");
		canvasMap[id]["instance"]["c_name"]=val;
		$("#add_text_canvas option[value='"+id+"']").text(val);
		
		saveCanvas(id);
		
		
	})
	
	
	
	
	
	
	$("body").on("change",".c_height",function(e){
		var val=parseInt($(this).val());
		console.log(val);
		if(val<150){openError("Минимальная высота 150см");
			$(this).val(e.target.defaultValue);
			return false;
		}
		val=val*scale;
		$(this).closest(".kit").find(".canvas-container,canvas,.kit__item-height").height(val);
		console.log($(this).closest(".kit__item").find("canvas"));
		$(this).closest(".kit__inner").find("canvas").attr("height",val);
		$(this).closest(".kit").find("canvas").each(function(){
			
			var id=$(this).attr("id");
			if(id){
				saveCanvas(id);
				canvasMap[id]["instance"].setHeight(val);
				
				
			}
		
		updateGrid();
	
		})
		setProjectPrice();
		
	})
	
	$("body").on("click",".kit__item-edit",function(){
			var canvas_id=$(this).attr("data-canvas_id");
			$("input[name='current_canvas_id']").val(canvas_id);
			var inst = $('[data-remodal-id=orientation_modal]').remodal();
			inst.open();
	})
	
	$("body").on("click",".orientation_form button",function(){
		
		
			
			
			var current_canvas_id=$(this).closest("form").find("input[name='current_canvas_id']").val();
			saveCanvas(current_canvas_id);
			var orientation=$(this).closest("form").find("input[name='orientation']:checked").val();
			var inst = $('[data-remodal-id=orientation_modal]').remodal();
			
			
			current_canvas = canvasMap[current_canvas_id]["instance"];
			canvasMap[current_canvas_id]["orientation"]=orientation;
			canvasMap[current_canvas_id]["instance"]["orientation"]=orientation;
			// create grid
			var width=$("#"+current_canvas_id).attr("width");
			var height=$("#"+current_canvas_id).attr("height");;
			
			RemoveGrid(current_canvas);
			makeGrid(current_canvas,width,height,orientation);
			
			inst.close();
			return false;
	})
	
	$(".main-inner .kit__add-button").click(function(){
		var new_canvas_id=addCanvas();
	$(".kit__item-edit[data-canvas_id="+new_canvas_id+"]").click();
		setProjectPrice();
		toLastCanvas();
	})
	
	$("body").on("click",".kit__item",function(){
		console.log("now");
		$(".kit__item.is_active").removeClass("is_active");
		$(this).addClass("is_active");	
	})
	
	$("body").on("click",".kit__item-wall-close",function(){
		var id=$(this).closest(".kit__item").find("canvas").attr("id");
		var template='<div>Вы уверены что хотите удалить данные этой поверхности?</div><br><button class="site_btn green" onclick="deleteCanvas(\''+id+'\');">Удалить</button><button style="float:right" data-remodal-action="close" class="site_btn green">Отмена</button>';
		openError(template);
	})
	
	

	
	
	
	set_drag_and_drop_events();
	
	
	
	$("body").on("click",".cancel_last_action",function(){
		var canvas_id=$(this).attr("data-canvas_id");
		var json=localStorage.getItem("canvas_"+canvas_id);
		json=JSON.parse(json);
		var canvas=canvasMap[canvas_id]["instance"];
            if(json!="" && json.length>0){
      			console.log(json);
      			var back_height=json[0]["height"];
      			var back_width=json[0]["width"];
      			canvas.loadFromJSON(json[0], function(){
      				canvas.renderAll();canvas.calcOffset();
      				
      				for(elem in canvasMap){
      					canvasMap[elem]["instance"].setHeight(back_height);
      				}
      			
      				canvas.setWidth(back_width);
      				
      				
      			}, function(o, object) {});
      				$(".kit").find(".kit__item-height").height(json[0]["height"]);
      				$(".c_height").val(json[0]["height"]/scale);
      				$(this).closest(".kit__item").find(".c_width").val(json[0]["width"]/scale);
      			
      			json.shift();
      			
      			if(json.length>0){
      				saveCanvas(canvas_id,json);	
      			}else{
      				localStorage.removeItem("canvas_"+canvas_id);
      				$(".cancel_last_action[data-canvas_id='"+canvas_id+"']").hide();
      			}
      			
	      	}
	})
  
	closePreloader();
	

	
	
	
})





function makeGrid(canvas,width, height,orientation,color) {
  console.log(canvas,COLOR);
  color=COLOR?COLOR:"red";
  if(orientation=="horizontal"){
			  var grid_width = 50*scale;
			  var grid_height = 20*scale;
			  for (var i = 1; i <= (width / grid_width); i++) {
			    var obj=new fabric.Line([i * grid_width, 0, i * grid_width, height], {
			      stroke: color
			      , selectable: false,
			      strokeWidth:1
			    })
			    canvas.add(obj);
			    obj.moveTo(0);
			  }
			  
			  for (var i = 1; i <= (height / grid_height); i++) {
			  	var obj=new fabric.Line([0, i * grid_height, width, i * grid_height], {
			      stroke: color
			      , selectable: false,
			      strokeWidth:1
			    });
			    canvas.add(obj);
			    obj.moveTo(0);
			  }
  }else if(orientation=="vertical"){
  			  var grid_width = 20*scale;
			  var grid_height = 50*scale;
			  for (var i = 1; i <= (width / grid_width); i++) {
			  	var obj=new fabric.Line([i * grid_width, 0, i * grid_width, height], {
			      stroke: color
			      , selectable: false,
			      strokeWidth:1
			    });
			    canvas.add(obj);
			    obj.moveTo(0);
			  }
			  
			  for (var i = 1; i <= (height / grid_height); i++) {
			    var obj=new fabric.Line([0, i * grid_height, width, i * grid_height], {
			      stroke: color
			      , selectable: false,
			      strokeWidth:1
			    })
			    canvas.add(obj);
			    obj.moveTo(0);
			  }
  }else if(orientation=="with_step"){
  	 		  var grid_width = 50*scale;
			  var grid_height = 20*scale;
			  
			  for (var j = 0; j <= (height / grid_height); j++) {
				  for (var i = 1; i <= (width / grid_width); i++) {
				  	if(j&1){
				  		var x1=x2=i * grid_width-(grid_width/2);				  		
				  	}else{
						var x1=x2=i * grid_width;
				  	}
				  	var obj=new fabric.Line([x1, j*grid_height, x2, grid_height*(j+1)], {
				      stroke: color
				      , selectable: false,
				      strokeWidth:1,
				      
				    })
				  	
				    canvas.add(obj);
				    obj.moveTo(0);
				  }
			}
			
			for (var j = 0; j <= (width / grid_width); j++) {
				  for (var i = 1; i <= (height / grid_height); i++) {
				  	if(i&1){
				  		var y1=y2=i * grid_height;				  		
				  	}else{
						var y1=y2=i * grid_height;
				  	}
				  	
				  	var obj=new fabric.Line([j*grid_width, y1, grid_width*(j+1), y2], {
				      stroke: color
				      , selectable: false,
				      strokeWidth:1,
				      index:0
				    })
				  	
				    canvas.add(obj);
				    obj.moveTo(0);
				    
				  }
			}
			
			  
			  
			  
			  
			  
  }
}



function RemoveGrid(canvas) {
    var objects = canvas.getObjects('line');
    for (let i in objects) {
        canvas.remove(objects[i]);
    }
    
}

function addCanvas(canvas_id_from_storage){
	if($("body .kit__item").length==12){
		openError("Количество стен не может превышать 12 штук.");
		return false;
	}
	
	++last_number_of_canvas;
	var canvas_template='<div class="kit__item">'+
                                        '<div class="kit__item-wall">'+
                                            '<div class="kit__item-wall-close"></div>'+
                                           ' <div class="kit__item-width">'+
                                          '      <div class="line"></div><input type="text" name="kit_item_width" class="c_width" value="<%width_input%>"></div>'+
                                         '   <canvas id="<%canvas_id%>" class="kit__item-wall-elem" style="width: <%width%>px; height:<%height%>px;" width="<%width%>" height="<%height%>"></canvas>'+
                                        '</div>'+
                                       ' <div class="kit__item-name"><input class="c_name" name="c_name" value="<%name%>"></small>'+
                                      '      <div class="kit__item-edit" data-canvas_id="<%canvas_id%>"><img src="/d/1327015/t/images/images/images/edit_white.svg" alt=""></div>'+
                                     '   </div><a class="cancel_last_action" data-canvas_id="<%canvas_id%>" style="display:none;">Отменить последнее действие</a>'+
                                    '</div>';
                                    
	
	if(canvas_id_from_storage){
		last_number_of_canvas=canvas_id_from_storage;
		var storage_canvas=localStorage.getItem("canvas_canvas_"+canvas_id_from_storage);
		storage_canvas=JSON.parse(storage_canvas);
		
		var canvas_id="canvas_"+(last_number_of_canvas);
		if(typeof storage_canvas[0]["c_name"]!="undefined"){
			var canvas_name=storage_canvas[0]["c_name"];
		}else{
			var canvas_name="Стена "+(last_number_of_canvas);	
		}
		
		var canvas_height=(typeof storage_canvas[0]["height"]!="undefined"?storage_canvas[0]["height"]:500);
		var canvas_width=(typeof storage_canvas[0]["width"]!="undefined"?storage_canvas[0]["width"]:500);
		$(".kit__item-height").height(canvas_height);
		$(".kit__item-height .c_height").val(canvas_height/scale);
	}else{
		var canvas_id="canvas_"+(last_number_of_canvas);
		var canvas_name="Стена "+(last_number_of_canvas);
		var canvas_height=parseInt($(".c_height").val())*scale;	
		var canvas_width=1000;
	}
	
	canvas_template=replaceTemplate(canvas_template,{"canvas_id":canvas_id,"name":canvas_name,"height":canvas_height,"width":canvas_width,"width_input":canvas_width/scale})
	$(".kit__inner .flex_container").append(canvas_template);
	$(".kit__item.is_active").removeClass("is_active");
	$("#"+canvas_id).closest(".kit__item").addClass("is_active");
	
	
	if(canvas_id_from_storage){
		canvasMap[canvas_id]={"instance":new fabric.Canvas(canvas_id)};
		canvasMap[canvas_id]["instance"]["height"]=canvas_height;
		canvasMap[canvas_id]["instance"]["width"]=canvas_width;
		
		if(typeof storage_canvas[0]["orientation"]!="undefined"){
			canvasMap[canvas_id]["instance"]["orientation"]=storage_canvas[0]["orientation"];
		}
		
		canvasMap[canvas_id]["instance"]["c_name"]=canvas_name;
	}else{
		canvasMap[canvas_id]={"instance":new fabric.Canvas(canvas_id)};
	}
	
	
	
	
	
	
	
	
	
	
	$("<option value='"+canvas_id+"'>"+canvas_name+"</option>").insertAfter("#add_text_canvas option:last-child");
	
	
	updateGrid();
	
	
	
	
	//canvasMap[canvas_id]["instance"].on('after:render', function (e) {
		canvasMap[canvas_id]["instance"].on('mouse:up', function (e) {
  		console.log("mouse:up");
  			saveCanvas(canvas_id);
  		
  			
		});
		
		

		
		
		
		canvasMap[canvas_id]["instance"].on('object:selected', function (e) {
  		console.log("object:selected",e.target);
  		setTimeout(function(){$(".active_object_settings").fadeIn();
  			$("#up_btn").unbind().click(function(){
  				objectUp(canvas_id,e.target);
  				return false;
  			})
  			$("#down_btn").unbind().click(function(){
  				objectDown(canvas_id,e.target);
  				return false;
  			})
  			
  		},500)
  			
		});
		
		canvasMap[canvas_id]["instance"].on('selection:cleared', function (e) {
  		console.log("before:selection:cleared");
  			$(".active_object_settings").hide();
		});
		
		
		
		
		
		
		canvasMap[canvas_id]["instance"].on('mouse:down', function (e) {
		//	$("body").on("click","canvas",function(){
		console.log("click_canvas");
			var id=canvas_id;//$(this).closest(".kit__item").find("canvas").attr("id");
			if(id && current_canvas_id!=id){
				setActiveCanvas(id);
				current_canvas_id=id;
			}
		})
		
		

		
		
		$('html').keyup(function(e){
				if(e.keyCode == 46 && e.target.nodeName!="INPUT") {
					
					if(key_up_flag){
						key_up_flag=false;
						return false;
					}else{
						key_up_flag=true;
					}
					
					
    				console.log(e);
					var delete_objects=deleteObjects();
					if(!delete_objects){
						openError("Не выбран объект для удаления.");
					}
    			}
			});
		
		
	//});

	
	
	set_drag_and_drop_events();
	
	return canvas_id;
}

function deleteCanvas(canvas_id){
	$('#'+canvas_id).closest(".kit__item").replaceWith("");
	delete canvasMap[canvas_id];
	localStorage.removeItem("canvas_"+canvas_id);
	closeError();
	$("canvas").first().click();
	setProjectPrice();
	Ps.update($('.kit__inner .nicescroll').get(0));
}

function updateGrid(canvas_id){
	if(canvas_id){
		if(canvasMap[canvas_id].hasOwnProperty("orientation")  || canvasMap[canvas]["instance"].hasOwnProperty("orientation")){
				RemoveGrid(canvasMap[canvas_id]["instance"]);
				var width=canvasMap[canvas_id]["instance"].getWidth();
				var height=canvasMap[canvas_id]["instance"].getHeight();
				makeGrid(canvasMap[canvas_id]["instance"],width,height,canvasMap[canvas_id]["orientation"]);
			}
	}else{
		for(canvas in canvasMap){
			if(canvasMap[canvas].hasOwnProperty("orientation") || canvasMap[canvas]["instance"].hasOwnProperty("orientation")){
				var orientation=canvasMap[canvas]["orientation"]?canvasMap[canvas]["orientation"]:canvasMap[canvas]["instance"]["orientation"];
				RemoveGrid(canvasMap[canvas]["instance"]);
				var width=canvasMap[canvas]["instance"].getWidth();
				var height=canvasMap[canvas]["instance"].getHeight();
				makeGrid(canvasMap[canvas]["instance"],width,height,orientation);
			}
		}
	}	
}


function set_drag_and_drop_events(){
		
	//DRAG_AND_DROP_PART
	

if (Modernizr.draganddrop) {
    // Browser supports HTML5 DnD.

    // Bind the event listeners for the image elements
    images = document.querySelectorAll('.kit__add-bodyes img');
    [].forEach.call(images, function (img) {
        img.addEventListener('dragstart', handleDragStart, false);
        img.addEventListener('dragend', handleDragEnd, false);
    });
    // Bind the event listeners for the canvas
    var canvasContainer = document.getElementsByClassName('canvas-container');
   
    [].forEach.call(canvasContainer, function (container) {
        container.addEventListener('dragenter', handleDragEnter, false);
    	container.addEventListener('dragover', handleDragOver, false);
    	container.addEventListener('dragleave', handleDragLeave, false);
    	container.addEventListener('drop', handleDrop, false);
    });
    
    
} else {
    // Replace with a fallback to a library solution.
    alert("This browser doesn't support the HTML5 Drag and Drop API.");
}
	//DRAG_AND_DROP_PART

}

function saveCanvas(canvas_id,json){
	if(!json){
		json=localStorage.getItem("canvas_"+canvas_id);
		
		if(!json){json= new Array();}else{json=JSON.parse(json);}
		
		var tmp_json=canvasMap[canvas_id]["instance"].toJSON(['width', 'height','orientation','selection','selectable','c_name']);
		console.log(json[0],tmp_json);
		if(	!jSonCmp(json[0],tmp_json)){
			json.unshift(tmp_json);
		}else{
			return 0;
		}
		
	}
	
	whileLimitStorage(json,canvas_id); // рекурсивно выполняем функцию если у нас выходит за пределы лимита локальное хранилище (убираем по одному сохранению пока лимит не останется.)
	
	$(".cancel_last_action[data-canvas_id='"+canvas_id+"']").show();
	console.log("save_canvas");
}

function loadCanvasFromLocalStorage(){
	

	for(var i=1;i<=12;i++){
		elem="canvas_canvas_"+i;
		if(localStorage.hasOwnProperty(elem)){
			
			var canvas_id=elem.split("_");
			addCanvas(canvas_id[2]);
			canvas_id=canvas_id[1]+"_"+canvas_id[2];
		//	console.log(localStorage[elem]);
			var json=JSON.parse(localStorage[elem]);
			var canvas=canvasMap[canvas_id]["instance"];
			if(json.length>0){
				$(".cancel_last_action[data-canvas_id='"+canvas_id+"']").show();
				canvas.loadFromJSON(json[0], function(){canvas.renderAll();canvas.calcOffset(); }, function(o, object) {});
			}
		}
	}
	
}

function whileLimitStorage(json,canvas_id){
	try{
		localStorage.setItem("canvas_"+canvas_id,JSON.stringify(json));
	}catch(e){
		//if(e== QUOTA_EXCEEDED_ERR){
		
			json.pop(json.length-1);

		//	whileLimitStorage(canvas_id,json);
			
			console.log('Length: ', JSON.stringify(json).byteLength(), ' byte(s)');
			
		//}
		
	}
}

function addText(){
	
	
	var txt=$("#get_text").val();
	var canvas_id=$("#add_text_canvas option:selected").attr("value");
	var font=$("#get_font option:selected").attr("value");
	font=font?font:"Arial";
	if(!txt || txt==""){
		openError("Нельзя добавить пустой текст");
		return 0;
	}
	if(!canvas_id || canvas_id==""){
		openError("Выберите существующую стену");
		return 0;
	}
	
	var text = new fabric.Text(txt, { 
    		left: 20, 
    		top: 30, 
    		fontFamily: font,
    		fontSize: 65
	});
	
			canvasMap[canvas_id]["instance"].discardActiveObject().renderAll();	
	saveCanvas(canvas_id);
		canvasMap[canvas_id]["instance"].add(text);
		canvasMap[canvas_id]["instance"].bringToFront(text);
	
}


// select all objects
function deleteObjects(delete_true){
	for(canvas_elem in  canvasMap){
			var canvas=canvasMap[canvas_elem]["instance"];
			var activeObject = canvas.getActiveObject();
		    if (activeObject) {
		    	
		    	if(delete_true==true){
		    		canvas.remove(activeObject);
		    		closeError();
		    	}else{
		    			var template='<div>Вы уверены что хотите удалить объект?</div><br><button class="site_btn green" onclick="deleteObjects(true);">Удалить</button><button style="float:right" data-remodal-action="close" class="site_btn green">Отмена</button>';
		    		openError(template);
		    		
		    	}
		        
		        
				break;	        
		    }
		    
		    
	}
	if(activeObject){return true;}else{
    return false;		
	}

}

function setActiveCanvas(id){
	$(".canvas-container").removeClass("active");
	$("#"+id).parent().addClass("active");
	
	for(canvas_elem in canvasMap){
		if(canvas_elem==id){continue;}
		var canvas=canvasMap[canvas_elem]["instance"];	
		canvas.discardActiveObject().renderAll();	
	}
	
//	canvas.deactivateAll().renderAll();
}


function objectUp(canvas_id,object){
	//var object=canvasMap[canvas_id]["instance"].getActiveObject();
	canvasMap[canvas_id]["instance"].bringToFront(object);
	canvasMap[canvas_id]["instance"].discardActiveObject().renderAll();	
	saveCanvas(canvas_id);
}
function objectDown(canvas_id,object){
	//var object=canvasMap[canvas_id]["instance"].getActiveObject();
	canvasMap[canvas_id]["instance"].sendToBack(object);
	canvasMap[canvas_id]["instance"].discardActiveObject().renderAll();	
	saveCanvas(canvas_id);
}

function setProjectPrice(){
	var price=0;
	var height=parseInt($(".c_height").val());
	$('.c_width').each(function(){
		price+=parseInt($(this).val())*height*3000/100/100;
	})
	$('.sum strong').text(price.formatMoney(0, '.', ',')+" Р");
}

Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };
 
 
function toLastCanvas(){
	
$('.kit__inner .nicescroll').get(0).scrollLeft=999999999;
Ps.update($('.kit__inner .nicescroll').get(0));
}
