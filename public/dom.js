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
		
		app["domains"] = {"domains":[]};
		domref.once("value").then(function(snapshot) {
			snapshot.forEach(function(childSnapshot) {
				var key = childSnapshot.key;
				// console.log(key)
			  // console.log(childSnapshot.val());
			 
			  	app.domains.domains.push(childSnapshot.val())
			   
			});
			if(callback){
				callback();
			}
		});
		
		
		
	},
	bindStuff:function(){
		$(document).on("click","a.check",function(event){
			event.preventDefault();
			var element = $(event.target)
			app.whois(element.data("domain"),element.data("key"),function(){
				app.updateDomainRow(element.data("domain"));
			});
		});
		$(document).on("click","a.remove",function(event){
			event.preventDefault();
			var element = $(event.target)
			var domain = element.data("domain");
			if(window.confirm("Remove " + domain + "?")){
				app.removeDomain(domain,function(){
					$("div[data-domain='"+domain+"']").remove();
				});
			}
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
			var domain = $(this).closest("[data-domain]").attr("data-domain");
			var rating = $(this).val();
			app.updateDomain(domain,{
				"rating":rating
			});
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
	removeDomain:function(domain,callback){
		firebase.database().ref('domains')
		.orderByChild('name')
		.equalTo(domain)
		.once("value",function(snapshot){
			snapshot.forEach(function(data) {
				firebase.database().ref('domains/' + data.key).remove(function(error){

					//remove from local obj
					$(app.domains.domains).each(function(k,v){
						if(v.name == domain){
							app.domains.domains.slice(k);
						}
					});
					if(callback){
						callback();
					}
				});
			})

				
		});
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
				$("#modal_overlay .message").addClass("error").html("This domain is already in the list (Expires: "+$('[data-domain="'+domain+'"] .expires').html()+")");
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
	whois:function(domain,id,callback){
		$.ajax("/whois",{
			data:{
				"domain":domain
			},
			success:function(data){
				var now = new Date().valueOf()
				var expires = moment(expires).valueOf()
				app.updateDomain(domain,{
					"expires":moment(data).valueOf(),
					"lastchecked":now
				},function(){
					if(callback){
						callback();
					}
				});
			}
		})
		// console.log(domain,id)
	},
	updateDomain(domname,obj,callback){
		// console.log(domname,obj);
		firebase.database().ref('domains')
		.orderByChild('name')
		.equalTo(domname)
		.limitToFirst(1)
		.once("value", function(snapshot) {
			snapshot.forEach(function(data) {

				firebase.database().ref('domains/' + data.key).update(obj).then(function(newobj){
					// update local model
					$(app.domains.domains).each(function(k,v){
						if(v.name == domname){
							app.domains.domains[k] = $.extend( v, obj);
						}
					});
					if(callback){
						callback(data);
					}
				}).catch(function(error){
					 console.log("Data could not be saved.",error);
				});
		    });
		});
	},
	createRow:function(domain){
		var template = _.template(
		 	 $('#row_template').html()
		);
		return template(domain);
	},
	updateDomainRow:function(domain){
		$(app.domains.domains).each(function(k,v){
			if(v.name == domain){
				$("div[data-domain='"+domain+"']").replaceWith(app.createRow(v));
			}
		})
	},
	displayDoms:function(settings){
		if(!settings){var settings = {}}
		if(!settings["orderBy"]){
			settings["orderBy"] = "expires";
		}
		if(!settings["direction"]){
			settings["direction"] = "desc"
		}
		var data = app.domains;

		data.domains = data.domains.sort(function(a,b){
			if(settings.direction == "asc"){
				return b[settings.orderBy]-a[settings.orderBy]	
			}else{
				return a[settings.orderBy]-b[settings.orderBy]
			}
			
		})
		
		// switch(orderBy){
		// 	case "rating":
		// 	data.domains = data.domains.sort(function(a,b){return b["rating"]-a["rating"]})
		// 	break;
		// 	default:
		// 	data.domains = data.domains.sort(function(a,b){return a["expires"]-b["expires"]})
		// 	break;
		// }
		
		var template = _.template(
		 	 $('#domain_list_template').html()
		);
		
		$("#appcontainer").html(template(data))



		
	}

	

}
$(document).ready(function(){
	app.init();
});