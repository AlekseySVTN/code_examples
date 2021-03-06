var afterBuild={
	
	data_project:null,
	price_project:0,
	data_previews:{},
	project_name:"",
	
	sendOrder : function(){
		openPreloader();
		var self=this;
		self.getAllCanvas();
		
		if(self.project_name==""){
			closePreloader();
			openError("Введите название проекта");
			return false;
		}else{
		
			if(USER_INFO["user_id"]==0){
				closePreloader();
				self.anonymAction();		
			}else{
				self.autorizedAction();
			}
			
		}

	},
	
	getAllCanvas : function(){
		var all_project_in_json=new Object();
		var all_project_in_previews=new Object();
		for(canvas_id in canvasMap){
			var tmp_json=canvasMap[canvas_id]["instance"].toJSON(['width', 'height','orientation','selection','selectable','c_name']);
			
			var tmp_preview=canvasMap[canvas_id]["instance"].toDataURL('png');
		//	console.log(tmp_preview);
			all_project_in_json[canvas_id]=tmp_json;
			all_project_in_previews[canvas_id]=tmp_preview;
		}
		this.data_project=JSON.stringify(all_project_in_json);
		this.data_previews=JSON.stringify(all_project_in_previews);
		this.project_name=$("#project_name").val();
		this.price_project=parseInt($(".sum strong").text().replace(",",""))
		
		
	},
	
	autorizedAction : function(){
		var self=this;
		var data=self.data_project;
		$.ajax({url:"/users?mode=send_order",
			type:"POST",
			
			data:{"data_project":data,"price_project":self.price_project,"data_previews":self.data_previews,"project_name":self.project_name}
		}).then(function(data){
			
			data=$(data).find(".lk").html();
			openError(data);
			
			self.afterSendProject();
			self.reloadOnCloseModal();
				closePreloader();
			
			
		})
	},
	
	anonymAction : function(){
		var inst = $('[data-remodal-id=reg_modal]').remodal();
		inst.open();		
	},
	
	authAction : function(){
		load_block("/users?ajax=1","#order_form_w","[data-remodal-id='error_modal'] .error_text",false,"GET",false,true);
		openError();
		
		
	},
	clearAll :function(){
		var template='<div>Вы уверены что хотите очистить проект?</div><br><button class="site_btn red" onclick="afterBuild.clearProject();">Очистить</button><button style="float:right" data-remodal-action="close" class="site_btn green">Отмена</button>';
		openError(template);
	},
	clearProject :function(){
		localStorage.clear();
		window.location.reload();
	},
	afterSendProject:function(){
		localStorage.clear();
	},
	regAction : function(){
		load_block("/users/register?ajax=1","#order_form_w","[data-remodal-id='error_modal'] .error_text",false,"GET",false,true);
		openError();
	},
	reloadOnCloseModal : function(){
		self=this;
		$(document).on('closed', '.remodal', function (e) {
			setTimeout(function(){self.clearProject();},2000);
 			
  			
		});
	}

}



