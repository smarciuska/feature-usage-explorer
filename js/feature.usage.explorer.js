var explorer = explorer || {};
getFeatureName = function (feature) {
	var feature_name = $(feature).attr("title") || $(feature).val() || $(feature).text();
	return feature_name;
}
 
getDOMPath = function (element) {
	var tagName = element.tagName.toLowerCase();
	var path = []; 
	while ( (element.nodeName.toLowerCase() != "html") && 
			(element = element.parentNode) && 
			path.unshift(element.nodeName.toLowerCase() + 
			(element.id ? "#" + element.id : "") + 
			(element.className ? "." + element.className.replace(/s+/g, ".") : "")));
	return path.join(" > ")+": "+ tagName;
}
 
filterElementsByEvent = function (event_name) { 
	return $("*").toArray().filter(function(el) { return $(el).attr(event_name) }); 
}

explorer.getFeatures = function  (eventString) {
	var eventArray = getJqueryEvents(eventString);
	var elementArray = new Array();
	for (var i = 0; i < eventArray.length; i++){ 
		elementArray = elementArray.concat(filterElementsByEvent(eventArray[i])); 
	} 
	elementArray = elementArray.concat($("*").find("input[type!='hidden']").toArray()); 
	elementArray = elementArray.concat($("*").find("a").toArray()); 
	elementArray = elementArray.concat($("*").find("textarea").toArray());
	var features = new Array();
	for (var i = 0; i < elementArray.length; i++){
		var feature_path = getDOMPath(elementArray[i]);
		var feature_name = getFeatureName(elementArray[i]);
		features.push({path: feature_path, name: feature_name, element: elementArray[i]});
	}
	return features;
}

getJqueryEvents = function (events) {
	var jqueryEvents=events.split(" ");
	for (var i=0; i<events.length;i++)
		jqueryEvents[i]="on"+jqueryEvents[i];
	return jqueryEvents;
}

/****************************************************************************************/

explorer.monitorFeatures = function (event) {
	if ($(event.target).attr("on" + event.type) != undefined||(event.target.tagName=="A"||event.target.tagName=="INPUT"||event.target.tagName=="TEXTAREA"&&event.type=="click")) {  
		var feature_path = getDOMPath(event.target);
		var feature_name = getFeatureName(event.target);
		return {path: feature_path, name: feature_name, eventType: event.type,  element: event.target};		
	}
	return false;
}

/****************************************************************************************/

		var canvasw = 800;
		var canvash = 1000;
		var canvas = new fabric.Canvas('canvas');
		canvas.lockRotation = true;
		var classgroup;
		var classes;
		var featuregroupid = new Array();
		var featuregrouprect = new Array();
		var isSiblings = false;
		var featuregroupobjects = new Array();
		var featurgrpname = new Array();
		var featuregrouprectsize = new Array();
		var rtidx = -1;//root index 
		var fgidx = 0; //feature group index.
		
		explorer.initDiagram = function(url) {
			jQuery.ajax({
				url: url,
				dataType: "jsonp",
				error: function (jqXHR, textStatus, errorThrown) {
					switch (jqXHR.status) {
					case 400:
						var excp = $.parseJSON(jqXHR.responseText).error;
						console.log("UnableToComplyException:" + excp.message, 'warning');
						break;
					case 500:
						var excp = $.parseJSON(jqXHR.responseText).error;
						console.log("PanicException:" + excp.message, 'panic');
						break;
					default:
						console.log("HTTP status=" + jqXHR.status + "," + textStatus + "," + errorThrown + "," + jqXHR.responseText);
					}
				},
				success: function (data) {
					buildClassDiagram(data);
				}
			});
		}

		function getfeaturegrouprectsize(siblings) {
			var size = new Object;
			var totalpids = 0;
			var curpid = 0;
			var noofchild = 0;
			var tempnoofchild = 0;
			for (var i = 0; i < siblings.length; i++) {
				if (curpid != siblings[i].pid) {
					totalpids++;
					if (noofchild > tempnoofchild) {
						tempnoofchild = noofchild;
					}
					noofchild = 0;
				}
				noofchild++;
				curpid = siblings[i].pid;
			}
			if (noofchild > tempnoofchild) {
				tempnoofchild = noofchild;
			}
			if (tempnoofchild == 1) {
				tempnoofchild = noofchild;
			}
			size.height = totalpids * 100;
			size.width = tempnoofchild * 200;
			return size;
		}
		
		var lastelementX;
		var lastelementY;		
		var firstGroupWidth = 0;

		function buildClassDiagram(jsonData) {
			debugger;
			classes = jsonData;
			for (var i = 0; i < classes.length; i++) {
				if (classes[i].siblings) {
					//for feature groups.
					if(!featuregroupobjects[rtidx]) {
						featuregroupobjects[rtidx] = new Array();
						featuregrouprectsize[rtidx] = new Array();					
						featuregroupid[rtidx] = new Array();
						featuregrouprect[rtidx] = new Array();
						featurgrpname[rtidx] = new Array();
					}
					featuregroupobjects[rtidx][fgidx] = new Array();
					featuregrouprectsize[rtidx][fgidx] = new Array();					
					featuregroupid[rtidx][fgidx] = new Array();
					featuregrouprect[rtidx][fgidx] = new Array();
					featurgrpname[rtidx][fgidx] = new Array();
										
					isSiblings = true;
					featuregrouprectsize[rtidx][fgidx] = getfeaturegrouprectsize(classes[i].siblings);
					featuregrouprect[rtidx][fgidx] = new fabric.Rect({
						width: featuregrouprectsize[rtidx][fgidx].width,
						height: featuregrouprectsize[rtidx][fgidx].height,
						fill: '',
						left: lastelementX,
						top: lastelementY + featuregrouprectsize[rtidx][fgidx].height / 2 + 100,
						strokeDashArray: [5, 5],
						stroke: 'red'
					});
					
					firstGroupWidth = featuregrouprectsize[rtidx][fgidx].width;
					
					featuregrouprect[rtidx][fgidx].id = "featuregrouprect";
					featuregrouprect[rtidx][fgidx].oldleft = featuregrouprect[rtidx][fgidx].left;
					featuregrouprect[rtidx][fgidx].oldtop = featuregrouprect[rtidx][fgidx].top;
					featuregrouprect[rtidx][fgidx].rtidx = rtidx;
					featuregrouprect[rtidx][fgidx].fgidx = fgidx;
					
					canvas.add(featuregrouprect[rtidx][fgidx]);
					featurgrpname[rtidx][fgidx] = new fabric.Text("Name: " + classes[i].name, {
						'fontSize': 20,
						'fontWeight': "bold",
						left: featuregrouprect[rtidx][fgidx].left,
						top: featuregrouprect[rtidx][fgidx].top - featuregrouprectsize[rtidx][fgidx].height / 2 + 10,
						lockMovementX: true,
						lockMovementY: true
					});
					featurgrpname[rtidx][fgidx].oldleft = featurgrpname[rtidx][fgidx].left;
					featurgrpname[rtidx][fgidx].oldtop = featurgrpname[rtidx][fgidx].top;
					featurgrpname[rtidx][fgidx].id = classes[i].id;
					featuregroupid[rtidx][fgidx] = classes[i].id;
					canvas.add(featurgrpname[rtidx][fgidx]);
					featuregroupobjects[rtidx][fgidx][featuregroupobjects[rtidx][fgidx].length] = featurgrpname[rtidx][fgidx];
					siblings = classes[i].siblings;
					for (var j = 0; j < siblings.length; j++) {
						siblings[j].rtidx = rtidx;
						siblings[j].fgidx = fgidx;
						
						var legendgroup = buildFeatureGroup(siblings[j].name, siblings[j].usage, j);
						legendgroup.set({
							hasControls: false,
							lockRotation: true
						});
						legendgroup.id = siblings[j].id;
						legendgroup.set(getNextLeftTopSibilings(i, j));
						var pgroup;
						if (siblings[j].pid) pgroup = siblings[siblings[j].pid - 1];
						if (pgroup && j != 0) {
							var inflag = true;
							for (pgi = 0; pgi < pgroup.linksIn.length; pgi++) {
								if (pgroup.linksIn[pgi].id == siblings[j].id) {
									addDirectedLink(pgroup, legendgroup, inflag, pgroup.linksIn[pgi].cardinality);
								}
							}
							inflag = false;
							for (pgo = 0; pgo < pgroup.linksOut.length; pgo++) {
								if (pgroup.linksOut[pgo].id == siblings[j].id) {
									addDirectedLink(pgroup, legendgroup, inflag, pgroup.linksOut[pgo].cardinality);
								}
							}
						}
						canvas.add(legendgroup);
						siblings[j].object = legendgroup;
					}
					isSiblings = false;
					classes[i].rtidx = rtidx;
					classes[i].fgidx = fgidx;
					fgidx++;
				} else {
					var legendgroup = buildFeature(classes[i].name, classes[i].usage, i);
					legendgroup.set({
						hasControls: false,
						lockRotation: true
					});
					legendgroup.id = classes[i].id;
					legendgroup.set(getNextLeftTop(i));
					var pgroup;
					if (classes[i].pid) {
						pgroup = classes[classes[i].pid - 1];
						if (!pgroup) {
							pgroup = classes[classes[i].pid - featuregroupid[rtidx - 1] + 1];
						}
					}
					if (pgroup && classes[i].pid) {
						var inflag = true;
						if (pgroup.linksIn) for (pgi = 0; pgi < pgroup.linksIn.length; pgi++) {
								if (pgroup.linksIn[pgi].id == classes[i].id) {
									addDirectedLink(pgroup, legendgroup, inflag, pgroup.linksIn[pgi].cardinality);
								}
						}
						inflag = false;
						if (pgroup.linksOut) for (pgo = 0; pgo < pgroup.linksOut.length; pgo++) {
								if (pgroup.linksOut[pgo].id == classes[i].id) {
									addDirectedLink(pgroup, legendgroup, inflag, pgroup.linksOut[pgo].cardinality);
								}
						}
					}
					canvas.add(legendgroup);
					classes[i].object = legendgroup;
					classes[i].rtidx = rtidx;
					classes[i].fgidx = fgidx;
				}
			}
			canvas.renderAll();			
			
			arrowinc = -75;
			for (var i = 0; i < classes.length; i++) {
				pid = classes[i].pid;
				if(classes[i].type == "group" && pid) {
					var ri = classes[i].rtidx;
					var fi = classes[i].fgidx;
					if(classes[i].linksIn)
					for (var j = 0; j < classes[i].linksIn.length; j++) {
					}
					if(classes[i].linksOut)
					for (var j = 0; j < classes[i].linksOut.length; j++) {
						arrowinc += 25;
						x1 = featuregrouprect[ri][fi].getLeft();
						y1 = featuregrouprect[ri][fi].getTop();
						x2 = featuregrouprect[ri][classes[pid-1].fgidx].getLeft();
						y2 = featuregrouprect[ri][classes[pid-1].fgidx].getTop();
						var line = new fabric.Line([x1 + arrowinc, y1 - featuregrouprect[ri][fi].getHeight() / 2, x2, y2 +  featuregrouprect[ri][classes[pid-1].fgidx].getHeight() / 2]);
						line.strokeWidth = '1';
						line.selectable = false;
						line.fill = "red";
						line.arrowinc = 0;						
						canvas.add(line);
						line.linkToGrp = true;
						featuregroupobjects[ri][fi][featuregroupobjects[ri][fi].length] = line;						
						//line.linkGrptoGrp = true;
						//featuregroupobjects[ri][classes[pid-1].fgidx][featuregroupobjects[ri][classes[pid-1].fgidx].length] = line;
						line.sendToBack();
						
						classes[pid-1].object = featuregrouprect[ri][classes[pid-1].fgidx];
						if (classes[pid-1].object.lineIns) {
							classes[pid-1].object.lineIns[classes[pid-1].object.lineIns.length] = line;
						} else {
							classes[pid-1].object.lineIns = new Array();
							classes[pid-1].object.lineIns[0] = line;
						}
						//add arrow			
						// create arrow points
						var arrow = new fabric.Triangle({
							opacity: 1,
							width: 10,
							height: 10,
							fill: 'red',
							selectable: false
						});
						var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
						arrow.set({
							left: line.get('x2'),
							top: line.get('y2')
						});
						arrow.setAngle(angle + 90);
						arrow.lockScalingX = arrow.lockScalingY = arrow.lockRotation = true;
						arrow.lockRotation = true;
						arrow.hasControls = false;
						arrow.arrowinc = 0;
						arrow.line = line;
						canvas.add(arrow);
						if (classes[pid-1].object.arrows) {
							classes[pid-1].object.arrows[classes[pid-1].object.arrows.length] = arrow;
						} else {
							classes[pid-1].object.arrows = new Array();
							classes[pid-1].object.arrows[0] = arrow;
						}
					}
				}
			}
			canvas.renderAll();
			
			//draw link to featured group.		
			//reset arrow increment.
			arrowinc = -75;
			for (var i = 0; i < classes.length; i++) {
				var ri = classes[i].rtidx;
				var fi = classes[i].fgidx;
				if (ri == undefined || fi == undefined || featuregroupid[ri] == undefined || featuregroupid[ri][fi] == undefined) break;
				if(classes[i].linksOut)
				for (var j = 0; j < classes[i].linksOut.length; j++) {
					if (classes[i].id != featuregroupid[ri][fi] && classes[i].linksOut[j] && classes[i].linksOut[j].cardinality == "" && classes[i].linksOut[j].id == featuregroupid[ri][fi]) {
						arrowinc += 25;
						x1 = classes[i].object.getLeft();
						y1 = classes[i].object.getTop();
						x2 = featuregrouprect[ri][fi].getLeft();
						y2 = featuregrouprect[ri][fi].getTop();
						var line = new fabric.Line([x1, y1 + 25, x2 + arrowinc, y2 - featuregrouprect[ri][fi].getHeight() / 2]);
						line.strokeWidth = '1';
						line.selectable = false;
						line.fill = "red";
						line.arrowinc = arrowinc;
						canvas.add(line);
						line.linkToGrp = true;
						line.linkToGrpLinksOut = true;
						featuregroupobjects[ri][fi][featuregroupobjects[ri][fi].length] = line;
						line.sendToBack();
						if (classes[i].object.lineOuts) {
							classes[i].object.lineOuts[classes[i].object.lineOuts.length] = line;
						} else {
							classes[i].object.lineOuts = new Array();
							classes[i].object.lineOuts[0] = line;
						}
						//add arrow		
						// create arrow points
						var arrow = new fabric.Triangle({
							opacity: 1,
							width: 10,
							height: 10,
							fill: 'red',
							selectable: false
						});
						var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
						arrow.set({
							left: line.get('x2'),
							top: line.get('y2')
						});
						arrow.setAngle(angle + 90);
						arrow.lockScalingX = arrow.lockScalingY = arrow.lockRotation = true;
						arrow.lockRotation = true;
						arrow.hasControls = false;
						arrow.arrowinc = arrowinc;
						arrow.line = line;
						canvas.add(arrow);
						featuregroupobjects[ri][fi][featuregroupobjects[ri][fi].length] = arrow;
						classes[i].object.arrow = arrow;
					}
				}
				if(classes[i].linksIn)
				for (var j = 0; j < classes[i].linksIn.length; j++) {					
					if (classes[i].id != featuregroupid[ri][fi] && classes[i].linksIn[j] && classes[i].linksIn[j].cardinality == "" && classes[i].linksIn[j].id == featuregroupid[ri][fi]) {
						arrowinc += 25;
						x1 = featuregrouprect[ri][fi].getLeft();
						y1 = featuregrouprect[ri][fi].getTop();
						x2 = classes[i].object.getLeft();
						y2 = classes[i].object.getTop();
						
						var line = new fabric.Line([x1 + arrowinc, y1 - featuregrouprect[ri][fi].getHeight() / 2, x2, y2 + 25]);
						line.strokeWidth = '1';
						line.selectable = false;
						line.fill = "red";
						line.arrowinc = 0;						
						canvas.add(line);
						line.linkToGrp = true;
						featuregroupobjects[ri][fi][featuregroupobjects[ri][fi].length] = line;
						line.sendToBack();
						if (classes[i].object.lineIns) {
							classes[i].object.lineIns[classes[i].object.lineIns.length] = line;
						} else {
							classes[i].object.lineIns = new Array();
							classes[i].object.lineIns[0] = line;
						}
						//add arrow			
						// create arrow points
						var arrow = new fabric.Triangle({
							opacity: 1,
							width: 10,
							height: 10,
							fill: 'red',
							selectable: false
						});
						var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
						arrow.set({
							left: line.get('x2'),
							top: line.get('y2')
						});
						arrow.setAngle(angle + 90);
						arrow.lockScalingX = arrow.lockScalingY = arrow.lockRotation = true;
						arrow.lockRotation = true;
						arrow.hasControls = false;
						arrow.arrowinc = 0;
						arrow.line = line;
						canvas.add(arrow);
						if (classes[i].object.arrows) {
							classes[i].object.arrows[classes[i].object.arrows.length] = arrow;
						} else {
							classes[i].object.arrows = new Array();
							classes[i].object.arrows[0] = arrow;
						}
					}
				}
			}
			canvas.renderAll();
		}
		
		var arrowinc = -100;
		
		function getNextLeftTop(index) {
			var options = new Object;
			if (!classes[index].pid) {
				canvasw += firstGroupWidth;
				options = {
					left: canvasw,
					top: 50
				};
				
				rtidx++;
				fgidx = 0;
			} else {
				if (isChild(classes[index], classes[index - 1])) {
					options = {
						left: classes[index - 1].object.getLeft() - 100,
						top: classes[index - 1].object.getTop() + 100
					};
					arrowinc = -75;
				} else {
					options = {
						left: classes[index - 1].object.getLeft() + 200,
						top: classes[index - 1].object.getTop()
					};
					arrowinc += 25;
				}
			}
			lastelementX = options.left;
			lastelementY = options.top;
			return options;
		}

		function getNextLeftTopSibilings(index, sibindex) {
			var options = new Object;
			if (sibindex == 0) {
				options = {
					left: featuregrouprect[rtidx][fgidx].left,
					top: featuregrouprect[rtidx][fgidx].top - featuregrouprectsize[rtidx][fgidx].height / 2 + 50,
				};
				arrowinc = -75;
			} else {
				if (isChild(classes[index].siblings[sibindex], classes[index].siblings[sibindex - 1])) {
					options = {
						left: featuregrouprect[rtidx][fgidx].getLeft() - featuregrouprect[rtidx][fgidx].getWidth() / 2 + 100,
						top: classes[index].siblings[sibindex - 1].object.getTop() + 100
					};
					arrowinc = -75;
				} else {
					options = {
						left: classes[index].siblings[sibindex - 1].object.getLeft() + 200,
						top: classes[index].siblings[sibindex - 1].object.getTop()
					};
					arrowinc += 25;
				}
			}
			lastelementX = options.left;
			lastelementY = options.top;
			return options;
		}

		function isChild(currentobj, prevobj) {
			var ischild = false;
			for (var i = 0; i < currentobj.linksOut.length; i++) {
				if (currentobj.linksOut[i].id == prevobj.id) ischild = true;
			}
			if (!ischild) for (var i = 0; i < currentobj.linksIn.length; i++) {
					if (currentobj.linksIn[i].id == prevobj.id) ischild = true;
			}
			return ischild;
		}

		function buildFeature(name, usage, index) {
			var textele1 = new fabric.Text("Name: " + name, {
				'fontSize': 15,
				'fontWeight': "bold",
				left: 0,
				top: -10
			});
			var textele2 = new fabric.Text("Usage: " + usage, {
				'fontSize': 15,
				'fontWeight': "bold",
				left: 10,
				top: 10
			});
			var rect = new fabric.Rect({
				width: 150,
				height: 50,
				fill: '#eef',
				stroke: '#eef',
				strokeWidth: 2,
				opacity: 0.7
			});
			var legendgroup = new fabric.Group([rect], {
				left: -400 + (index * 250),
				top: 100
			});
			legendgroup.add(textele1);
			legendgroup.add(textele2);
			return legendgroup;
		}

		function buildFeatureGroup(name, usage, index) {
			var textele1 = new fabric.Text("Name: " + name, {
				'fontSize': 15,
				'fontWeight': "bold",
				left: 0,
				top: -10
			});
			var textele2 = new fabric.Text("Usage: " + usage, {
				'fontSize': 15,
				'fontWeight': "bold",
				left: 10,
				top: 10
			});
			var rect = new fabric.Rect({
				width: 200,
				height: 50,
				fill: '#eef',
				stroke: '#eef',
				strokeWidth: 2,
				opacity: 0.7
			});
			var legendgroup = new fabric.Group([rect], {
				left: -400 + (index * 250),
				top: 100
			});
			legendgroup.add(textele1);
			legendgroup.add(textele2);
			return legendgroup;
		}

		function addDirectedLink(pgroup, group, inflag, cardli) {
			x1 = group.getLeft();
			y1 = group.getTop();
			x2 = pgroup.object.getLeft();
			y2 = pgroup.object.getTop();
			var line = new fabric.Line([x1, y1 - 25, x2 + arrowinc, y2 + 25]);
			line.strokeWidth = '1';
			line.selectable = false;
			line.arrowinc = arrowinc;
			canvas.add(line);
			if (isSiblings) featuregroupobjects[rtidx][fgidx][featuregroupobjects[rtidx][fgidx].length] = line;
			if (pgroup.object.lineIns) {
				pgroup.object.lineIns[pgroup.object.lineIns.length] = line;
			} else {
				pgroup.object.lineIns = new Array();
				pgroup.object.lineIns[0] = line;
			}
			if (group.lineOuts) {
				group.lineOuts[group.lineOuts.length] = line;
			} else {
				group.lineOuts = new Array();
				group.lineOuts[0] = line;
			}
			// create arrow points
			var arrow = new fabric.Triangle({
				opacity: 1,
				width: 10,
				height: 10,
				fill: '#000',
				selectable: false
			});
			var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
			if (inflag) {
				arrow.set({
					left: line.get('x2'),
					top: line.get('y2')
				});
				arrow.setAngle(angle + 90);
			} else {
				arrow.set({
					left: line.get('x1'),
					top: line.get('y1')
				});
				arrow.setAngle(angle - 90);
			}
			arrow.lockScalingX = arrow.lockScalingY = arrow.lockRotation = true;
			arrow.lockRotation = true;
			arrow.hasControls = false;
			arrow.arrowinc = arrowinc;
			arrow.line = line;
			canvas.add(arrow);
			if (isSiblings) featuregroupobjects[rtidx][fgidx][featuregroupobjects[rtidx][fgidx].length] = arrow;
			var cardinality;
			if (cardli != "") {
				if (inflag) {
					cardinality = new fabric.Text(cardli, {
						'fontSize': 15,
						'fontWeight': "bold",
						left: x2 + 10 + arrowinc,
						top: y2 + 25,
						selectable: false
					});
					cardinality.arrowinc = arrowinc;
					if (pgroup.object.cards) {
						pgroup.object.cards[pgroup.object.cards.length] = cardinality;
					} else {
						pgroup.object.cards = new Array();
						pgroup.object.cards[0] = cardinality;
					}
					if (pgroup.object.arrows) {
						pgroup.object.arrows[pgroup.object.arrows.length] = arrow;
					} else {
						pgroup.object.arrows = new Array();
						pgroup.object.arrows[0] = arrow;
					}
				} else {
					cardinality = new fabric.Text(cardli, {
						'fontSize': 15,
						'fontWeight': "bold",
						left: x1 - 20,
						top: y1 - 25,
						selectable: false
					});
					cardinality.arrowinc = arrowinc;
					group.card = cardinality;
					group.arrow = arrow;
				}
				canvas.add(cardinality);
				if (isSiblings) featuregroupobjects[rtidx][fgidx][featuregroupobjects[rtidx][fgidx].length] = cardinality;
			}
		}

		canvas.on('object:moving', function (e) {
			//document.getElementById('edittextpopbox').style.display = 'none';
			//Selected Object 	
			var s = e.target;
			var ri = s.rtidx;
			var fgidx = s.fgidx;
			
			if (s.type == "text" && s.oldleft) {
				s.left = s.oldleft;
				s.top = s.oldtop;
				return;
			} else if (s.id == "featuregrouprect") {
				featurgrpname[ri][fgidx].oldleft = featurgrpname[ri][fgidx].left - (featuregrouprect[ri][fgidx].oldleft - s.getLeft());
				featurgrpname[ri][fgidx].oldtop = featurgrpname[ri][fgidx].top - (featuregrouprect[ri][fgidx].oldtop - s.getTop());
			}
			if (s.id == "featuregrouprect") {
				for (var i = 0; i < featuregroupobjects[ri][fgidx].length; i++) {
					//update set left / top of all the featured group elements.
					if (featuregroupobjects[ri][fgidx][i].linkToGrp) {
						if (featuregroupobjects[ri][fgidx][i].linkToGrpLinksOut) {
							featuregroupobjects[ri][fgidx][i].set({
								'x2': featuregroupobjects[ri][fgidx][i].x2 - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()),
								'y2': featuregroupobjects[ri][fgidx][i].y2 - (featuregrouprect[ri][fgidx].oldtop - s.getTop())
							});
						} else {
							featuregroupobjects[ri][fgidx][i].set({
								'x1': featuregroupobjects[ri][fgidx][i].x1 - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()),
								'y1': featuregroupobjects[ri][fgidx][i].y1 - (featuregrouprect[ri][fgidx].oldtop - s.getTop())
							});
						}
					} else {
						featuregroupobjects[ri][fgidx][i].setLeft(featuregroupobjects[ri][fgidx][i].getLeft() - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()));
						featuregroupobjects[ri][fgidx][i].setTop(featuregroupobjects[ri][fgidx][i].getTop() - (featuregrouprect[ri][fgidx].oldtop - s.getTop()));
					}
				}
				siblings = classes[featuregroupid[ri][fgidx] - 1].siblings;
				for (var j = 0; j < siblings.length; j++) {
					siblings[j].object.set({
						"left": siblings[j].object.getLeft() - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()),
						"top": siblings[j].object.getTop() - (featuregrouprect[ri][fgidx].oldtop - s.getTop())
					});
					if (siblings[j].object.lineIns) for (var k = 0; k < siblings[j].object.lineIns.length; k++) {
							var line = siblings[j].object.lineIns[k];
							line.set({
								'x2': line.get("x2") - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()),
								'y2': line.get("y2") - (featuregrouprect[ri][fgidx].oldtop - s.getTop())
							});
					}
					if (siblings[j].object.lineOuts) for (var k = 0; k < siblings[j].object.lineOuts.length; k++) {
							var line = siblings[j].object.lineOuts[k];
							line.set({
								'x1': line.get("x1") - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()),
								'y1': line.get("y1") - (featuregrouprect[ri][fgidx].oldtop - s.getTop())
							});
					}
				}
				
				if(siblings) {
					object = classes[featuregroupid[ri][fgidx] - 1].object;
					if(object) {
						
						if (object.lineIns) 
						for (var k = 0; k < object.lineIns.length; k++) {
								var line = object.lineIns[k];
								line.set({
									'x2': line.get("x2") - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()),
									'y2': line.get("y2") - (featuregrouprect[ri][fgidx].oldtop - s.getTop())
								});
						}
						if (object.lineOuts) 
						for (var k = 0; k < object.lineOuts.length; k++) {
								var line = object.lineOuts[k];
								line.set({
									'x1': line.get("x1") - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()),
									'y1': line.get("y1") - (featuregrouprect[ri][fgidx].oldtop - s.getTop())
								});
						}
						if (object.arrows) for (var i = 0; i < object.arrows.length; i++) {
								var arrow = object.arrows[i];
							
								var angle = Math.atan2(arrow.line.y2 - arrow.line.y1, arrow.line.x2 - arrow.line.x1) * 180 / Math.PI;					
								arrow && arrow.set({
									'left': arrow.left - (featuregrouprect[ri][fgidx].oldleft - s.getLeft()),
									'top': arrow.top - (featuregrouprect[ri][fgidx].oldtop - s.getTop()),
									'angle': angle+90
								});
						}
					}					
				}
				
				featuregrouprect[ri][fgidx].oldleft = s.getLeft();
				featuregrouprect[ri][fgidx].oldtop = s.getTop();
			} else {
				if (s.lineIns) {
					for (var i = 0; i < s.lineIns.length; i++) {
						var line = s.lineIns[i];
						line.set({
							'x2': s.left + line.arrowinc,
							'y2': s.top + 25
						});
					}
				}
				if (s.cards) for (var i = 0; i < s.cards.length; i++) {
						var card = s.cards[i];
						card && card.set({
							'left': s.left + 20 + card.arrowinc,
							'top': s.top + 25
						});
				}
				if (s.arrows) for (var i = 0; i < s.arrows.length; i++) {
						var arrow = s.arrows[i];
					
						var angle = Math.atan2(arrow.line.y2 - arrow.line.y1, arrow.line.x2 - arrow.line.x1) * 180 / Math.PI;					
						arrow && arrow.set({
							'left': s.left + arrow.arrowinc,
							'top': s.top + 25,
							'angle': angle+90
						});
				}
				if (s.lineOuts) {
					for (var i = 0; i < s.lineOuts.length; i++) {
						var line = s.lineOuts[i];
						line.set({
							'x1': s.left,
							'y1': s.top - 25
						});
					}			
					
					var angle = Math.atan2(s.arrow.line.y2 - s.arrow.line.y1, s.arrow.line.x2 - s.arrow.line.x1) * 180 / Math.PI;					
					s.arrow && s.arrow.set({
						'left': s.left,
						'top': s.top - 25,
						'angle': angle-90
					});
					
					s.card && s.card.set({
						'left': s.left - 20,
						'top': s.top - 25
					});
				}
			}
			canvas.renderAll();
		});