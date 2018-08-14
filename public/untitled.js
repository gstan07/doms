var app = {
	config:{
		db_path:"doms.json"
	},
	init:function(){
		app.bindStuff();
		app.loadDB(app.displayDoms);
	},
	loadDB:function(callback){
		var database = firebase.database();
		var domref = database.ref('domains').orderByChild("expires");
		var ret = [];
		domref.once("value").then(function(snapshot) {
			snapshot.forEach(function(childSnapshot) {
				var key = childSnapshot.key;
				// console.log(key)
			  // console.log(childSnapshot.val());
			 
			  
			  	ret.push(childSnapshot.val())
			   
			});
		});
		app["domains"] = ret.domains;
		console.log(app.domains);
		if(callback){
			//callback();
		}
		
	},
	bindStuff:function(){
		$(document).on("click","a.check",function(event){
			event.preventDefault();
			var element = $(event.target)
			app.whois(element.data("domain"),element.data("key"));
		});
		$(document).on("click","a.fab",function(event){
			app.openProbeModal();
		})
		$(document).on("click","#probeCancel",function(event){
			app.closeProbeModal();
		})
		$(document).on("click","#probeNext",function(event){
			app.probeNext();
		})
		$(document).on("keyup","#domainname",function(event){
			$("#modal_overlay .message").removeClass("error").html("");
			if($(this).val()!=""){
				$("#probeNext").removeAttr("disabled");
				if(event.keyCode == 13){
					app.probeNext();
				}//enter
			}else{
				$("#probeNext").attr("disabled","disabled");
			}

		})
		$(document).on("keyup","body",function(event){
			if(event.keyCode == 27){
					app.closeProbeModal();
				}//escape
		})
		$(document).on("change","select.rating",function(){
			alert("aici")
		});
		$(document).on("mouseenter",".star i",function(event){
			$(this).addClass("currenthover");
			$(this).closest(".star").find("i").each(function(k,v){
				$(v).addClass("tmpactive");
				if($(v).hasClass("currenthover")){
					
				}
			});
		})
		$(document).on("mouseout",".star i",function(event){
			$(this).removeClass("tmpactive currenthover");
			$(this).closest(".star").find("i").each(function(k,v){
				$(v).removeClass("tmpactive");
				
			});
		})
	},
	probeNext:function(){
		var domain = $("#domainname").val();

		if(!app["domain_to_add"]){
			if($('[data-domain="'+domain+'"]').length == 0){
				$("#modal_overlay .message").removeClass("error").html("");
				$("#modal_overlay .content").html("...checking");
				$.ajax("/whois",{
					data:{
						domain:domain
					},
					success:function(data){
						app["domain_to_add"] = {
							"name":domain,
							"expires":data,
							"lastchecked":new Date().valueOf()
						}
						var now = new Date().valueOf();
						var expires = moment(data).valueOf();
						var expired_class = ""
						if(expires<now){
							expired_class = "expired"
						}
						$("#modal_overlay .content").html('<strong>'+domain+'</strong> will expire on<br/><h1 class="'+expired_class+'">'+moment(data).fromNow()+'</h1><br/>('+moment(data).format('MM-DD-YYYY')+')');
						$("#probeNext").html("Add to list");
					},
					error:function(data){
						$("#modal_overlay .content").html('<input type="text" id="domainname" placeholder="Domain Name"/>');
						$("#modal_overlay .message").addClass("error").html("wrong domain");
						$("#domainname").focus();
					}
				});
			}else{
				$("#modal_overlay .message").addClass("error").html("This domain is already in the list.");
				$("#domainname").focus();
			}
		}else{
			app.addDomain(app["domain_to_add"]);
		}
		
	},
	addDomain:function(data){
		data.expires = moment(data.expires).valueOf()
		var ref = firebase.database().ref('domains');
		ref.push(data,function(error){
			if (error)
			    alert('Error has occured during saving process')
			 else{
			 	//kill the modal
			 	$("#modal_overlay").remove();
			 	//add domain entry
			 	window.location.reload();//:)
			 }
			    
		});   // Creates a new ref with a new "push key"
	},
	openProbeModal:function(){
		$("#modal_overlay").remove();
		var template = _.template($('#probe_modal_template').html());
		$("body").append(template());
		$("#domainname").focus();
	},
	closeProbeModal:function(){
		app["domain_to_add"] = null;
		$("#modal_overlay").remove();
	},
	whois:function(domain,id){

		$.ajax("/whois",{
			data:{
				"domain":domain
			},
			success:function(data){
				app.updateDomainRow(domain,id,data);
			}
		})
		// console.log(domain,id)
	},
	updateDomainRow:function(domain,id,expires){
		//update UI
		
		var now = new Date().valueOf()
		var expires = moment(expires).valueOf()

		var expires_cell = $("div[data-key='"+id+"'] .expires");
		expires_cell.html(moment(expires).format('MM-DD-YYYY'));
		if(expires<now){
			expires_cell.addClass("expired");
		}else{
			expires_cell.removeClass("expired");
		}
		$("div[data-key='"+id+"'] .lastchecked").html(moment(now).fromNow());



		firebase.database().ref('domains').orderByChild('name').equalTo(domain).on("value", function(snapshot) {
		    snapshot.forEach(function(data) {
				firebase.database().ref('domains/' + data.key).update({
				    expires: expires,
				    lastchecked:now
				 });
		    });
		});
		
		
	},
	displayDoms:function(){
		console.log(app.domains);
		var template = _.template(
		 	 $('#domain_list_template').html()
		);
		 _.templateSettings.variable = 'domains';
		$("#appcontainer").html(template(app.domains))
	}

	

}
$(document).ready(function(){
	app.init();
});