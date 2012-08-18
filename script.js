debug = {}; /* This object is here to bring whatever you want out into the global space to look at.
	There are probably more elegant ways to do it, but meh.
*/


/*
	Creates an alert element with the message and specified type.
	
	@messge - The message you'd like to display in the alert
	@type - error, info, success
	returns - HTML element
*/
function createAlert(message,type){

	var alertMessage = $(document.createElement('span'))
						.attr("id","loginAlertMessage")
						.html(message);
						
	var alertClose = $(document.createElement('a'))
						.addClass("close")
						.attr('data-dismiss','alert')
						.attr("href","#")
						.append("&times;");
						
	var alertContainer = $(document.createElement('div'))
							.addClass("span4 offset4 alert alert-"+type);

							
	alertContainer
		.append(alertMessage)
		.append(alertClose);
	
	return alertContainer;
							
/*
<div id="displayAlert" class="span4 offset4 alert">
	<span id="loginAlertMessage"></span>
	<a class="close" data-dismiss="alert" href="#">&times;</a>
</div>
*/

}

/*
	Function showSection
		Displays the related section on the page when a tab has been clicked. The click binding is done in the index document
		
		object @eventOb - The event object generated by the click. Passed by the anonymous function in the click bind.
*/

function showSection(eventOb){
	$(".section").hide();
	$("#"+eventOb.target.getAttribute("data-section")).show();
}


/*
	Method: displayWishlist
	
	Builds and displays current User's wishlist. Requrires JSON userlist object.
	If the user listed in object is the current user, we can display edit buttons.
	
	@displayData
		boolean @isCurrentUser - the toggle to determine which toolset to display
		String @toolset - the name of the toolset to include (edit, shop)
		Object @list - the javascript object item list: contains information to build rows.
		String @targetTable - where to put this list. 
*/
function displayWishlist(displayData){
	//debug = displayData;
	//The table we're plugging this into.
	table = $("#"+displayData.targetTable);
		
	/*
	Builds the Table header and puts the columns into a definable order.
	*/
	if(displayData.skipHeader == true){
		jQuery("#"+displayData.targetTable+" tr.itemRow").remove();
		
	}else{
		table.html("");	
		
		hRow = $(document.createElement("tr"));

		for(columnName in displayData.columns){
			hRow.append(
				$(document.createElement("th")).append(columnName)
				.toggle(
					displayData.columns[columnName].sortFunctions[0],
					displayData.columns[columnName].sortFunctions[1]
				)
			);
		}

		table.append(hRow);		
	}

	//Loop through each item on the user list and add it to a row, which is then added to the table.
	$(displayData.list).each(function(i,e){
		row = $(document.createElement("tr"))
			.attr("data-itemId",e.itemid)
			.attr("id","item_"+e.itemid+"_row")
			.attr("data-toggle","collapse")
			.attr("data-target","detail"+i)
			.addClass("itemRow");
		
		//Generates any needed display versions of properties. Builds display-specific items depending on toolset value.
		e.toolset = displayData.toolset;
		e = generateDisplayElements(e);
		
		/*
		This loops through our table structure and puts the data in the right order. Allows users
		to change the column order, or add/remove columns if they care to without resorting to the
		code. There will need to be a tool to change column order to make this valuable.
		*/	

		for(column in displayData.columns){
			
			displayVal = e[displayData.columns[column].displayColumn];
			
			//Uses a predefined alternative display Value if the display value isn't populated.
			if(displayVal == null){ 
				displayVal = displayData.columns[column].altDisplay;
			}
						
			var cell =	$(document.createElement("td"))
						.append(displayVal)
						.attr("id","item_"+e.itemid+"_"+displayData.columns[column].displayColumn)
						.addClass("item_"+displayData.columns[column].displayColumn)
	
			if(column != "Tools"){
				cell.click(function(){
					//displayItemsDetails(e);
					getItemDetailInfo(e.itemid);
					//debug = e;
				});
			}

			row.append(cell);
		}
		
		table.append(row);
		//table.append(detailRow);
	});	

	
	
}

function displayItemsDetails(itemInfo){

	$("#itemDetailName").html(itemInfo.itemid);
	$("#itemDetailComment").html(itemInfo.comment);
	
	$("#itemDetailsModal").modal('show');
}

/* --------------------- This break separates functions that were made after the move to bootstrap. -------------------------------------*/

function login(){

	userVal = jQuery("#username").val();
	passVal = jQuery("#password").val();

	if(userVal == null || userVal.length == 0 || passVal == null || passVal.length == 0){
		$("#alertLocation").append(createAlert("You must enter a username and password","error"));
		return false;
	}

	data = {
		interact:'user',
		action:'loginUser',
		username: userVal, 
		password: passVal
	}
	
	jQuery.post('ajaxCalls.php',data,function(response){
		
		if(response == "true"){
			window.location.reload();
		}else{
			$("#alertLocation").append(createAlert("Incorrect login.","error"));
		}
	});
}

function logout(){

	data = {
		interact:'user',
		action:'logoutUser'
	}
	
	jQuery.post('ajaxCalls.php',data,function(response){
		if(response){
			window.location.reload();
		}
	});
	
}

function getCurrentUserList(){
	data = {
		interact:'wishlist',
		action:'getCurrentUserWishlist'
	}
	
	jQuery.post('ajaxCalls.php',data,function(response){
		
		storedData.userWishlist = response;
		
		wishlistData = {};
		wishlistData.isCurrentUser = true;
		wishlistData.toolset = "edit";		
		wishlistData.list = response;		
		wishlistData.targetTable = "userWishlist";
		wishlistData.skipHeader = false;
		wishlistData.columns = storedData.columns;
		/*
		wishlistData.columns = [
			{"Description":"displayDescription"},
			{"Ranking":"displayRanking"},
			{"Price":"price"},
			{"Category":"category"},
			{"Tools":"displayToolbox"}
		];
		*/

		displayWishlist(wishlistData);
				
	},"json");
}


/*
Function: getUserWishlist
	fetches the wishlist of a particular user and displays it in the "otherUserWishlist" table.
	
	@forUserId - The id of the user you would like to get the list for.
*/
function getUserWishlist(forUserId){
	data = {
		interact:'wishlist',
		action:'getShoppingForList',
		args:{shopForId:forUserId}
	}
	
	jQuery.post('ajaxCalls.php',data,function(response){
		
		if(response.responseType != undefined && response.responseType == "error"){
			errorMessage(response);
			//return false;
		}else{
			wishlistData = {};
			wishlistData.isCurrentUser = false;
			wishlistData.toolset = "shop";
			wishlistData.list = response;		
			wishlistData.skipHeader = false;			
			wishlistData.targetTable = "otherUserWishlist";
			wishlistData.columns = storedData.columns;
			/*
			[
				{"Description":"displayDescription"},
				{"Ranking":"displayRanking"},
				{"Price":"price"},
				{"Category":"category"},
				{"Quantity":"quantity"},			
				{"Tools":"displayToolbox"}
			]; 
			*/
			displayWishlist(wishlistData);
			
			//create trigger foreach item row to display detail info
			// we do this here because we don't want to provide this detail function for the currentUserWishlist
			$(".item_description").click(function(clickEvent){showMoreInfo(clickEvent);});
			$("#myCarousel").carousel('next');
		}			
	},"json");	
}

/*
Javascript sort functions
*/

function sortByDescriptionDesc(){	
	wishlistData.list.sort(function(a,b){
			if(a.description > b.description){
				return -1;
			}else if(a.description < b.description) {
				return 1
			}else{
				return 0;
			}
		});
	wishlistData.skipHeader = true;
	displayWishlist(wishlistData);

}

function sortByDescriptionAsc(){	
	wishlistData.list.sort(function(a,b){
		if(a.description > b.description){
			return 1;
		}else if(a.description < b.description) {
			return -1
		}else{
			return 0;
		}
	});
	wishlistData.skipHeader = true;
	displayWishlist(wishlistData);
}

function sortByRankingDesc(){	
	wishlistData.list.sort(function(a,b){return a.ranking - b.ranking});
	wishlistData.skipHeader = true;
	displayWishlist(wishlistData);
}

function sortByRankingAsc(){
	wishlistData.list.sort(function(a,b){return b.ranking - a.ranking});
	wishlistData.skipHeader = true;
	displayWishlist(wishlistData);	
}

function sortByPriceDesc(wishlistObject){
	wishlistData.list.sort(function(a,b){return a.price - b.price});
	wishlistData.skipHeader = true;
	displayWishlist(wishlistData);
}

function sortByPriceAsc(wishlistObject){
	wishlistData.list.sort(function(a,b){return b.price - a.price});
	wishlistData.skipHeader = true;
	displayWishlist(wishlistData);	
}


/*
	Method: generateDisplayElements
	This method takes a data object returned from the database and generates appropriate display data. 
	Returns the object
	If you want to add controls, images, etc to individual list items on the list, this is the place to do it.
	

	object @itemObject - The item returned from the database.
	
*/
function generateDisplayElements(itemObject){

	switch(itemObject.toolset){
		case "shop":
			itemObject.displayToolbox = renderItemTools(itemObject,"shop");

			itemObject.displayDescription = $(document.createElement("span"))
				.append(itemObject.description);
				/*
				.click(function(){
					getItemDetailInfo(itemObject.id);
				}
				
				);*/
			
		break;
		case "edit":
		
			itemObject.displayToolbox = renderItemTools(itemObject,"edit");
			itemObject.displayDescription = $(document.createElement("span")).append(itemObject.description);
		break;
	}
	
	itemObject.displayRanking = renderRanking(itemObject.ranking);

	return itemObject
}



function showMoreInfo(eventObject){
	//infoContainer = jQuery("#itemDetailRow");
	itemRow = jQuery(eventObject.target).closest('tr');
	//itemRow.after(infoContainer);
	
	getItemDetailInfo(itemRow.attr("data-itemid"));
}


/*
	Method: getItemDetailInfo
	This method takes an itemId and fetches detailed information about it: Images, Sources (shops), Reservation info, and Comments.

	int @itemId - the id of the item to be requested.

*/
function getItemDetailInfo(itemId){
	//jQuery(".itemDetailContainer").html("");
	
	data = {
		interact:'wishlist',
		action:'getItemDetails',
		args:{itemid:itemId}
	}
	
	jQuery.post('ajaxCalls.php',data,function(response){
		
		debug = response;
		jQuery('#itemDetailName').html(response.itemDescription);
		jQuery('#itemDetailComment').html(response.itemComment);
		jQuery('#itemDetailRanking').html(renderRanking(response.itemRanking));
		
		
		//Sources Data
		if(response.sources != undefined){
			jQuery("#itemDetailSourcesTable").html("");
		
			jQuery(response.sources).each(function(i,e){
			sourceRow = jQuery(document.createElement('tr'));
			sourceNameCell = jQuery(document.createElement('td'));
			sourcePriceCell = jQuery(document.createElement('td'));
			
			//Add a url source or just the sourcename.
			if(e.itemSourceUrl != null){ 
				sourceName = jQuery(document.createElement('a'))
								.attr('href',e.itemSourceUrl)
								.attr("target","_blank")
								.append(e.itemSource);
			}else{
				sourceName = e.itemSource;
			}
			
			sourceNameCell.append(sourceName);
			sourcePriceCell.append(e.itemSourcePrice);
			
			sourceRow.append(sourceNameCell)
					.append(sourcePriceCell);
			
			jQuery("#itemDetailSourcesTable").append(sourceRow);
		});
		
		}else{
			jQuery('#itemDetailSourcesTable').html("No Stores/Shops have been provided for this item.");
		}
		
		
		//Image data for Galleria
		imageData = [];

		if(response.images != undefined){
			jQuery(response.images).each(function(i,e){
				imgObj = {"image":"uploads/"+e.itemImageFilename};			
				imageData.push(imgObj);
			});
	
			jQuery('#imageDetailGallery').galleria({
			    data_source: imageData,
				height:300,
				width:400
			});
		}else{
			jQuery('#imageDetailGallery').html("No images have been provided for this item.");
		}
		
		//Alloc Section
		allocElement = jQuery(document.createElement("div"));
		
		if(response.allocs != undefined){
			jQuery(response.allocs).each(function(i,e){
				if(response.allocs.length > 1){
					allocElement.html(e.itemAllocUserName+" has reserved "+e.itemAllocQuantity+"of this item");
				}else{
					allocElement.html(e.itemAllocUserName+" has reserved this item");
				}	
			});
		}else{
			allocElement.html("This item has not be reserved yet.");
		}

		jQuery("#itemDetailAlloc").html(allocElement);
		
		$("#itemDetailsModal").modal();
		
		
	},"json");	
	
}


/*
Function: renderRanking
	Currently takes an integer and turns it into a series of asterisks. In the future this should render an 
	image.
	
	int @rankValue - The ranking of an item as a number.
*/
function renderRanking(rankValue){
	var rankReturn = "";
	while(rankValue > 0){
		rankReturn +="*";
		rankValue--;
	}
	return rankReturn;
}

/*

-----DEPRECATED! RenderCategory is currently doing nothing!-------------

Function renderCategory
	Takes a category id and returns the category display name. Fetches the category set and populates the storedData.categories object if it's empty.
	
	int @categoryId - the id (interger) of the category
*/
/*
function renderCategory(categoryId){
	if(storedData.categories.length == 0){
		console.log("preparing to request data");
		data = {
			interact:'wishlist',
			action:'getCategories'
		}
		jQuery.post('ajaxCalls.php',data,function(response){
			storedData.categories = response;
			return storedData.categories[categoryId];
		},"json");
	}else{
		console.log("data is local");
	}
}
*/

/*
Function renderItemTools
	Produces HTML buttons/icons for interacting with the item in the row.
	
	JS Object @itemObject - A Javascript object returned from the wishlist system.
	JS Object @toolInfo - A Javscript object with owner,  
*/
function renderItemTools(itemObject, toolInfo){
	
	toolBox = $(document.createElement("div"));
	
	switch(toolInfo){
		
		case "edit":
		
			itemReceive = $(document.createElement("img")).attr("src","images/refresh_nav.gif");
			itemEdit = $(document.createElement("img")).attr("src","images/write_obj.gif");
			itemDelete = $(document.createElement("img")).attr("src","images/cross.png");		

			//data-itemId is stored on the row element: tool->div->td->tr

			itemReceive.click(function(){
				alert("Marked Received: "+
				$(this).closest("tr").attr("data-itemId"))
			});

			itemEdit.click(function(){
				populateManageItemForm($(this).closest("tr").attr("data-itemId"));
			});

			itemDelete.click(function(){
				deleteItem($(this).closest("tr").attr("data-itemId"));
			});

			toolBox.append(itemReceive);
			toolBox.append(itemEdit);
			toolBox.append(itemDelete);				
		break;
		case "shop":
		
			//Reserve, Copy, Buy, Return
		
			itemReserve = $(document.createElement("img")).attr("src","images/lock_co.gif");
			itemCopy = $(document.createElement("img")).attr("src","images/toolbar_replace.gif");
			itemReturn = $(document.createElement("img")).attr("src","images/cross.png");		
			itemBuy = $(document.createElement("img")).attr("src","images/step_done.gif");		


			itemReserve.click(function(){
				alert("Reserve: "+
				this.parentNode.parentNode.parentNode.getAttribute("data-itemId"));
			});

			itemCopy.click(function(){
				alert("Copy: "+
				this.parentNode.parentNode.parentNode.getAttribute("data-itemId"));
			});

			itemReturn.click(function(){
				alert("Return: "+
				this.parentNode.parentNode.parentNode.getAttribute("data-itemId"));
			});

			itemBuy.click(function(){
				alert("Buy: "+
				this.parentNode.getAttribute("data-itemId"));
			});

			toolBox.append(itemReserve);
			toolBox.append(itemCopy);
		break;		
	}
	
	return toolBox;
	
}

/*
Function buildShopForSet
	Builds a set of html option elements and places them in the shop for select element on the "Other's lists" tab.

*/

function buildShopForSet(){
	data = {
		interact:'user',
		action:'getShopForUsers'
	}
	
	jQuery.post('ajaxCalls.php',data,function(response){
		userSelect = $("#listOfUsers");
		listOfUsersTable = $("#listOfUsersTable");
		
		$(response).each(function(i,e){
			userOption = $(document.createElement("option"))
							.html(e.fullname).attr("value",e.userid);
				
				
			userSelect.append(userOption);
			
			userRow = $(document.createElement("tr"));
			nameCell = $(document.createElement("td"))
						.html(e.fullname)
						.attr("data-userid",e.userid);
			userRow.append(nameCell);
			
			nameCell.click(function(e){
				
				getUserWishlist($(e.target).attr("data-userid"));
			})
			
			listOfUsersTable.append(userRow);
			
			
			//getUserWishlist(this.value);
			
		});
		
		
		$("#listOfUsers").change(function(e){
				getUserWishlist(this.value);
			});
		
	},"json");
}


/*
	Method: getCategories 
		Gets a list of categories. Puts them into the storedData component.
*/
/*
function getCategories(callbackFunction){
	data = {
		interact:'wishlist',
		action:'getCategories'
	}
	
	jQuery.post('ajaxCalls.php',data,function(response){
		storedData.categories = response;
		
		//A callback function if we want it.
		if(callbackFunction != undefined){
			callbackFunction.func.apply(callbackFunction.func,callbackFunction.args);
		}
	},"json");
}
*/

/*
	Method: buildCategorySelect
		Builds option elements with category names and their ids as values. Appends them to the second argument Element.
		
		array @categoryObject - a javascript array of objects that contain category names and ids.
		string @parentElement - the element where these items should be appened to.
*/
function buildCategorySelect(categoryObject,parentElement){

	//Set these to defaults if they're not defined in the call
	//I don't think these are necessary any longer because this is no longer generated on the fly.
	
//	categoryObject = (categoryObject == undefined)? storedData.categories: categoryObject;
//	parentElement = (parentElement == undefined)?".categorySelect": parentElement;

	jQuery(categoryObject).each(function(i,e){
		var option =  jQuery(document.createElement("option"))
							.attr("value",e.categoryid)
							.html(e.category);
		jQuery(parentElement).append(option);
	});
		
}


/*
	Method: buildRankSelect
		Builds option elements with Rank display, Appends them to the second argument Element. Depends on renderRanking

		array @rankObject - a javascript array of objects that contain category names and ids.
		string @parentElement - the element where these items should be appened to.
*/
function buildRankSelect(rankCount,parentElement){
	var rankOptionsList = "";
	
	for(var i = 1; i <= rankCount; i++){
		var rankOption = '<option value="'+i+'">'+renderRanking(i)+'</option>';
		jQuery(parentElement).append(rankOption);
	}
}

/*
	Method: deleteItem
		Deletes an item from the user's wishlist
		
		int @itemId - The id of the item to delete.
*/
function deleteItem(itemId){
	
	data = {
		interact:'wishlist',
		action:'manageItem',
		args:{
			itemAction:'delete',				
			itemid:itemId
		}
	}
	
	//Get the Categories.
	jQuery.post('ajaxCalls.php',data,function(response){
		if(response){
			getCurrentUserList();
		}
		
	});
}


/*	Method: manageItem
	Takes data from manageItemForm and sends it to the database via AJAX
				
*/
function manageItem(){
	
	data = {
		interact:'wishlist',
		action:'manageItem',
		args:{}
	}
	currentItemId = jQuery("#manageItemForm #itemId").val();
	
	//Ternary operation to determine whether we're editing or adding an item.
	data.args.itemAction = (currentItemId == "") ? "add" : "edit";
	
	data.args.itemid = currentItemId;
	data.args.description = jQuery("#itemDescriptionInput").val();
	data.args.category = jQuery("#itemCategoryInput").val();
	data.args.quantity = jQuery("#itemQuantityInput").val();
	data.args.comment = jQuery("#itemCommentInput").val();
	data.args.ranking = jQuery("#itemRankInput").val();
	
	jQuery.post('ajaxCalls.php',data,function(response){
		
		getCurrentUserList();
		$("#manageItemFormBlock").modal('hide');
	});	
}

/* Method: clearMangeItemForm
	Clears unique inputs on manageItemForm
	
*/
function clearManageItemForm(){
	jQuery('#itemId').val("");
	jQuery('#itemDescriptionInput').val("");
	jQuery('#itemQuantityInput').val("");
	jQuery('#itemRankInput').val("1");
	jQuery('#itemCategoryInput').val("1");
	jQuery('#itemSourcesEdit').html("");
	jQuery('#itemCommentinput').val("");	
	
	//console.log("form cleared");
}

/* Method: populateManageItemForm
	Gets the itemDetails and puts them into the #manageItemForm form, then calls the modal to display.
*/
function populateManageItemForm(itemId){
	
	clearManageItemForm(); //Clears the form of any previous data. 
	
	data = {
		interact:'wishlist',
		action:'getItemDetails',
		args:{itemid:itemId}
	}
	
	jQuery.post('ajaxCalls.php',data,function(response){
		debug = response;
		
		jQuery('#itemId').val(itemId);
		jQuery('#itemDescriptionInput').val(response.itemDescription);
		jQuery('#itemQuantityInput').val(response.itemQuantity);
		jQuery('#itemRankInput').val(response.itemRanking);
		jQuery('#itemCategoryInput').val(response.itemCategory);
		
		//Sources Data
		if(response.sources != undefined){
			jQuery(response.sources).each(function(i,e){
			
				sourceOption = jQuery(document.createElement('option'))
								.html(e.itemSource)
								.dblclick(function(){
									$("#manageItemFormBlock").modal('hide');
									$("#itemSourceFormBlock").modal('show');
								})
				
				jQuery("#itemSourcesEdit").append(sourceOption);
			});
		
		}else{
			jQuery('#itemDetailSourcesTable').html("No Stores/Shops have been provided for this item.");
		}		
		
		
		$('#manageItemFormBlock').modal('show');
	},"json");
}


/* Method populateItemSourceForm
	Gets itemSource details and puts them into the #itemSourceForm form, then calls teh modal to display.
*/
function populateItemSourceForm(sourceId){
// Note to developer: This should probably also get the name of the related item, so it's available to the user for context.

}










