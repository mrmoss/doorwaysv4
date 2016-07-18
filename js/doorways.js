//doorways.js
//Version 4
//Mike Moss
//07/18/2016

//Manages doorways.
//  Appends and constrains windows to constrain.
function doorway_manager_t(constrain)
{
	if(!constrain)
		constrain=window;
	this.constrain=constrain;
	this.doorways={};
}

//Cleans up windows and manager.
doorway_manager_t.prototype.destroy=function()
{
	for(var key in this.doorways)
		this.doorways[key].destroy();
	this.doorways=null;
}

//Adds a doorway under title and returns it.
//  Note, if doorway exists, it is simply reloaded with given options.
doorway_manager_t.prototype.add=function(options)
{
	if(!options)
		options={};
	if(!options.title)
		return null;
	if(!this.doorways[options.title])
	{
		var _this=this;
		this.doorways[options.title]=new doorway_t(this.constrain);
		this.doorways[options.title].addEventListener("active",
			function(){_this.restack();});
	}
	this.doorways[options.title].load(options);
	return this.doorways[options.title];
}

//Removes a doorway with the given title.
doorway_manager_t.prototype.remove=function(title)
{
	var new_doorways={};
	for(var key in this.doorways)
		if(key!=title)
			new_doorways[key]=this.doorways[key];
		else
			this.doorways[key].destroy();
	this.doorways=new_doorways;
	this.restack();

}

//Used to update window z-index ordering.
doorway_manager_t.prototype.restack=function()
{
	//Sort windows by zIndex.
	//  Note: Doesn't include new windows or top most window (zIndex=="").
	var arr=[];
	for(var key in this.doorways)
		if(this.doorways[key].win.style.zIndex!="")
			arr.push(this.doorways[key]);
	arr.sort(function(lhs,rhs)
	{
		return lhs.win.style.zIndex>rhs.win.style.zIndex;
	});

	//Set zIndex, make inactive.
	for(var ii=0;ii<arr.length;++ii)
	{
		arr[ii].win.style.zIndex=ii;
		arr[ii].set_active(false);
	}

	//Set new windows.
	var count=arr.length;
	for(var key in this.doorways)
		if(this.doorways[key].win.style.zIndex=="")
			this.doorways[key].win.style.zIndex=count++;

	//Set top most window to active if there were no new windows.
	if(count==arr.length&&arr.length>0)
		arr[arr.length-1].set_active(true);
}

//Saves windows into a JSON array of the save format specified in doorways.save().
doorway_manager_t.prototype.save=function()
{
	var arr=[];
	for(var key in this.doorways)
	{
		var data=this.doorways[key].save();
		data.z=this.doorways[key].win.style.zIndex;
		arr.push(data);
	}
	return arr;
}

//Loads windows from a JSON array of the save format specified in doorways.save().
//  Note, does not delete old doorways before loading data.
doorway_manager_t.prototype.load=function(data)
{
	for(var key in data)
		this.add(data[key]);
}

//Creates a window.
//  Appends and constrains window to constrain.
//  Argument options is a JSON object that should look like the object
//  specified in .save().
function doorway_t(constrain,options)
{
	if(!constrain)
		constrain=window;
	this.constrain=constrain;
	this.min_size=
	{
		w:200,
		h:200
	};
	this.active=false;
	this.minimized=false;
	var _this=this;

	//Client event_listeners.
	this.event_listeners={active:[]};

	//Create window and bar.
	this.win=document.createElement("div");
	this.constrain.appendChild(this.win);
	this.bar=document.createElement("div");
	this.win.appendChild(this.bar);

	//Create resizers.
	this.resizers=
	{
		n:new doorway_resizer_t(this.win,"doorway resizer n",function(change)
		{
			_this.grow_top_m(change.y,_this.resizers.n);
		}),
		e:new doorway_resizer_t(this.win,"doorway resizer e",function(change)
		{
			_this.grow_right_m(change.x,_this.resizers.e);
		}),
		s:new doorway_resizer_t(this.win,"doorway resizer s",function(change)
		{
			_this.grow_bottom_m(change.y,_this.resizers.s);
		}),
		w:new doorway_resizer_t(this.win,"doorway resizer w",function(change)
		{
			_this.grow_left_m(change.x,_this.resizers.w);
		}),
		ne:new doorway_resizer_t(this.win,"doorway resizer ne",function(change)
		{
			_this.grow_right_m(change.x,_this.resizers.ne);
			_this.grow_top_m(change.y,_this.resizers.ne);
		}),
		se:new doorway_resizer_t(this.win,"doorway resizer se",function(change)
		{
			_this.grow_right_m(change.x,_this.resizers.se);
			_this.grow_bottom_m(change.y,_this.resizers.se);
		}),
		sw:new doorway_resizer_t(this.win,"doorway resizer sw",function(change)
		{
			_this.grow_left_m(change.x,_this.resizers.sw);
			_this.grow_bottom_m(change.y,_this.resizers.sw);
		}),
		nw:new doorway_resizer_t(this.win,"doorway resizer nw",function(change)
		{
			_this.grow_left_m(change.x,_this.resizers.nw);
			_this.grow_top_m(change.y,_this.resizers.nw);
		})
	};

	//Resizer set active event listenr.
	for(var key in this.resizers)
		this.resizers[key].addEventListener("down",function()
		{
			_this.set_active(true);
		});

	//Make buttons.
	this.buttons=[];
	this.make_button_m("X",function(){_this.set_minimized(true);});
	this.make_button_m("?",function(){alert("HELP! "+_this.title);});

	//Set title.
	this.bar_text=document.createElement("span");
	this.bar.appendChild(this.bar_text);
	this.bar_text.innerHTML=this.title="";
	this.bar_text.className="doorway bar text";

	//Create right side border.
	this.bar_right_border=document.createElement("div");
	this.bar.appendChild(this.bar_right_border);

	//Event listeners...
	this.resize_ev_m=function()
	{
		//Move and resize.
		_this.load(_this.save());

		//Get current size and parent's size.
		var save=_this.save();
		var parent_size=utils.get_el_size(this.constrain);

		//Constrain.
		if(save.pos.x<0)
			save.pos.x=0;
		if(save.pos.y<0)
			save.pos.y=0;
		if(save.size.w>parent_size.w)
			save.size.w=parent_size.w;
		if(save.size.h>parent_size.h)
			save.size.h=parent_size.h;

		//Do it again.
		_this.move(save.pos);
		_this.resize(save.size);
		_this.move(save.pos);
	};

	window.addEventListener("resize",this.resize_ev_m);
	this.win.addEventListener("mousedown",function(event){_this.set_active(true);});
	this.bar.addEventListener("mousedown",function(event){_this.down_m(event);});
	this.bar.addEventListener("touchstart",function(event){_this.down_m(event);});
	this.move_ev_m=function(event){_this.move_m(event);};
	window.addEventListener("mousemove",this.move_ev_m);
	window.addEventListener("touchmove",this.move_ev_m);
	this.up_ev_m=function(event){_this.up_m(event);};
	window.addEventListener("mouseup",this.up_ev_m);
	window.addEventListener("touchend",this.up_ev_m);

	//Load to actually move and resize.
	this.load(options);
};

//Cleans up and removes this window.
doorway_t.prototype.destroy=function()
{
	var _this=this;

	//Cleanup window.
	if(this.constrain)
	{
		this.constrain.removeChild(this.win);
		this.constrain=null;
		window.removeEventListener("resize",this.resize_ev_m);
		window.removeEventListener("mousemove",this.move_ev_m);
		window.removeEventListener("touchmove",this.move_ev_m);
		window.removeEventListener("mouseup",this.up_ev_m);
		window.removeEventListener("touchend",this.up_ev_m);
		this.move_ev_m=this.up_ev_m=null;
	}

	//Cleanup resizers.
	if(this.resizers)
	{
		for(var key in this.resizers)
			this.resizers[key].destroy();
		this.resizers=null;
	}
}

//Add event listener member.
doorway_t.prototype.addEventListener=function(listener,callback)
{
	utils.setEventListener(this,listener,callback);
}

//Remove event listener member.
doorway_t.prototype.removeEventListener=function(listener,callback)
{
	utils.removeEventListener(this,listener,callback);
}

//Saves window into a JSON object.
// Object looks like:
// {title:STRING,size:{w:INT,h:INT},pos:{x:INT,y:INT},active:BOOL,minimized:BOOL}
doorway_t.prototype.save=function()
{
	var data=
	{
		title:this.title,
		pos:utils.get_el_pos(this.win),
		size:utils.get_el_size(this.win),
		active:this.active,
		minimized:this.minimized
	};
	return data;
}

//Loads window from a saved JSON object.
//  Format shown in doorways_manager_t.save().
doorway_t.prototype.load=function(data)
{
	if(!data)
		data={};
	var data_copy=utils.copy(data);
	if(!data_copy.title)
		data_copy.title="";
	this.set_minimized(data_copy.minimized);
	this.set_active(data_copy.active);
	this.bar_text.innerHTML=this.title=data_copy.title;
	this.resize(data.size);
	this.move(data.pos);
}

//Moves window to given position.
//  Position should look like: {x:INT,y:INT}
doorway_t.prototype.move=function(pos)
{
	//Set default values.
	if(!pos)
		pos={};
	var pos_copy=utils.copy(pos);

	//Constrain position.
	var size=utils.get_el_size(this.win);
	var parent_size=utils.get_el_size(this.constrain);
	if(!pos_copy.x||pos_copy.x<0)
		pos_copy.x=0;
	if(!pos_copy.y||pos_copy.y<0)
		pos_copy.y=0;
	if(pos_copy.x>parent_size.w-size.w)
		pos_copy.x=parent_size.w-size.w;
	if(pos_copy.y>parent_size.h-size.h)
		pos_copy.y=parent_size.h-size.h;

	//Move.
	this.win.style.left=pos_copy.x+"px";
	this.win.style.top=pos_copy.y+"px";
}

//Resizes window to given size.
//  Size should look like: {w:INT,h:INT}
doorway_t.prototype.resize=function(size)
{
	//Set default values.
	if(!size)
		size={};
	var size_copy=utils.copy(size);

	//Constrain size.
	var pos=utils.get_el_pos(this.win);
	var parent_size=utils.get_el_size(this.constrain);
	if(!size_copy.w||size_copy.w<this.min_size.w)
		size_copy.w=this.min_size.w;
	if(!size_copy.h||size_copy.h<this.min_size.h)
		size_copy.h=this.min_size.h;
	if(size_copy.w>parent_size.w-Math.min(0,pos.x))
		size_copy.w=parent_size.w-Math.min(0,pos.x);
	if(size_copy.h>parent_size.h-Math.min(0,pos.y))
		size_copy.h=parent_size.h-Math.min(0,pos.y);

	//Resize.
	this.win.style.width=size_copy.w+"px";
	this.win.style.height=size_copy.h+"px";
}

//Make window active or inactive.
doorway_t.prototype.set_active=function(active)
{
	if(active)
	{
		this.active=true;
		this.win.className="doorway win active";
		this.bar.className="doorway bar active";
		this.bar_right_border.className="doorway bar right_border active";
		for(var key in this.buttons)
			this.buttons[key].className="doorway bar button active";
		this.win.style.zIndex="";
		for(var key in this.event_listeners.active)
			this.event_listeners.active[key](active);
	}
	else
	{
		this.active=false;
		this.win.className="doorway win inactive";
		this.bar.className="doorway bar inactive";
		this.bar_right_border.className="doorway bar right_border inactive";
		for(var key in this.buttons)
			this.buttons[key].className="doorway bar button inactive";
	}
}

//Make window hidden or shown.
doorway_t.prototype.set_minimized=function(minimized)
{
	if(minimized)
	{
		this.minimized=true;
		this.win.style.visibility="hidden";
		this.set_active(false);
	}
	else
	{
		this.minimized=false;
		this.win.style.visibility="visible";
	}
}

//Make a button with the given text and callback.
doorway_t.prototype.make_button_m=function(text,callback)
{
	//Create button.
	var button=document.createElement("button");
	this.bar.appendChild(button);
	button.innerHTML=text;
	var _this=this;

	//Onclick event listener.
	button.addEventListener("click",function(event)
	{
		_this.set_active(true);
		if(callback)
			callback(event);
	});

	//Prevent dragging when clicking on a button.
	var no_drag=function(event)
	{
		event.stopPropagation();
		_this.set_active(true);
	}
	button.addEventListener("mousedown",no_drag);
	button.addEventListener("touchstart",no_drag);

	//Add button...
	this.buttons.push(button);
}

//Grow window right side right with constraining.
doorway_t.prototype.grow_right_m=function(pos,resizer)
{
	var handle_size=utils.get_el_size(resizer.handle);
	var size=utils.get_el_size(this.win);
	size.w+=pos-resizer.down_offset.x+handle_size.w-size.w;
	var pos=utils.get_el_pos(this.win);
	var parent_size=utils.get_el_size(this.constrain);
	if(size.w>parent_size.w-pos.x)
		size.w=parent_size.w-pos.x;
	this.resize(size);
}

//Grow window bottom down with constraining.
doorway_t.prototype.grow_bottom_m=function(pos,resizer)
{
	var handle_size=utils.get_el_size(resizer.handle);
	var size=utils.get_el_size(this.win);
	size.h+=pos-resizer.down_offset.y+handle_size.h-size.h;
	var parent_size=utils.get_el_size(this.constrain);
	var pos=utils.get_el_pos(this.win);
	if(size.h>parent_size.h-pos.y)
		size.h=parent_size.h-pos.y;
	this.resize(size);
}

//Grow window lect side left with constraining.
doorway_t.prototype.grow_left_m=function(pos,resizer)
{
	var our_pos=utils.get_el_pos(this.win);
	if(!resizer.parent_offset)
		resizer.parent_offset=utils.copy(our_pos);
	var size=utils.get_el_size(this.win);
	var new_pos=
	{
		x:pos-resizer.down_offset.x+resizer.parent_offset.x,
		y:our_pos.y
	}
	var right_side=our_pos.x+size.w;
	if(new_pos.x>right_side-this.min_size.w)
		new_pos.x=right_side-this.min_size.w;
	if(new_pos.x<0)
		new_pos.x=0;
	size.w=right_side-new_pos.x;
	this.move(new_pos);
	this.resize(size);
	this.move(new_pos);
}

//Grow window top up with constraining.
doorway_t.prototype.grow_top_m=function(pos,resizer)
{
	var our_pos=utils.get_el_pos(this.win);
	if(!resizer.parent_offset)
		resizer.parent_offset=utils.copy(our_pos);
	var size=utils.get_el_size(this.win);
	var new_pos=
	{
		x:our_pos.x,
		y:pos-resizer.down_offset.y+resizer.parent_offset.y
	}
	var bottom_side=our_pos.y+size.h;
	if(new_pos.y>bottom_side-this.min_size.h)
		new_pos.y=bottom_side-this.min_size.h;
	if(new_pos.y<0)
		new_pos.y=0;
	size.h=bottom_side-new_pos.y;
	this.move(new_pos);
	this.resize(size);
	this.move(new_pos);
}

//Event listener for mousedown/touchdown.
doorway_t.prototype.down_m=function(event)
{
	if(!this.down_offset)
	{
		event.preventDefault();
		this.down_offset=utils.get_event_pos(event);
		var offset=utils.get_el_pos(this.win);
		this.down_offset.x-=offset.x;
		this.down_offset.y-=offset.y;
		this.set_active(true);
	}
};

//Event listener move mousemove/touchmove.
doorway_t.prototype.move_m=function(event)
{
	if(this.down_offset)
	{
		var pos=utils.get_event_pos(event);
		this.move
		({
			x:pos.x-this.down_offset.x,
			y:pos.y-this.down_offset.y
		});
	}
};

//Event listener move mouseup/touchend.
doorway_t.prototype.up_m=function(event)
{
	this.down_offset=null;
};

//Creates a resizer handle for parent with the given className and
//  calls onmove when moved.
//  onmove({x:INT,y:INT}) - Called when clicked on, passes coordinates of click.
//  Event listeners:
//  down(event) - Called when the the handle is pressed or touched.
function doorway_resizer_t(parent,className,onmove)
{
	if(!parent)
		return null;
	this.parent=parent;
	var _this=this;
	this.handle=document.createElement("div");
	this.parent.appendChild(this.handle);
	this.handle.className=className;
	this.onmove=onmove;

	//Client event_listeners.
	this.event_listeners={down:[]};

	//Event listeners.
	this.handle.addEventListener("mousedown",function(event){_this.down_m(event);});
	this.handle.addEventListener("touchstart",function(event){_this.down_m(event);});
	window.addEventListener("mousemove",function(event){_this.move_m(event);});
	window.addEventListener("touchmove",function(event){_this.move_m(event);});
	window.addEventListener("mouseup",function(event){_this.up_m(event);});
	window.addEventListener("touchend",function(event){_this.up_m(event);});
}


//Cleans up resizer.
doorway_resizer_t.prototype.destroy=function()
{
	var _this=this;
	if(this.parent)
	{
		window.removeEventListener("mousemove",function(event){_this.move_m(event);});
		window.removeEventListener("touchmove",function(event){_this.move_m(event);});
		window.removeEventListener("mouseup",function(event){_this.up_m(event);});
		window.removeEventListener("touchend",function(event){_this.up_m(event);});
		this.parent.removeChild(this.handle);
		this.parent=null;
	}
}

//Add event listener member.
doorway_resizer_t.prototype.addEventListener=function(listener,callback)
{
	utils.setEventListener(this,listener,callback);
}

//Remove event listener member.
doorway_resizer_t.prototype.removeEventListener=function(listener,callback)
{
	utils.removeEventListener(this,listener,callback);
}

//Mouse/touch down event listener.
doorway_resizer_t.prototype.down_m=function(event)
{
	event.preventDefault();
	for(var key in this.event_listeners.down)
		this.event_listeners.down[key](event);
	this.down_offset=utils.get_event_pos(event);
	var offset=utils.get_el_pos(this.handle);
	this.down_offset.x-=offset.x;
	this.down_offset.y-=offset.y;
};

//Mouse/touch move event listener.
doorway_resizer_t.prototype.move_m=function(event)
{
	if(this.down_offset)
	{
		var pos=utils.get_event_pos(event);
		if(this.onmove)
			this.onmove(pos);
	}
};

//Mouse/touch up listener.
doorway_resizer_t.prototype.up_m=function(event)
{
	this.down_offset=null;
	this.parent_offset=null;
};