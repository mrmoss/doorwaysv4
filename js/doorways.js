//doorways.js
//Version 4
//Mike Moss
//07/16/2016

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
		w:100,
		h:100
	};
	this.active=false;
	this.minimized=false;
	var _this=this;

	//Create window and bar.
	this.win=document.createElement("div");
	this.constrain.appendChild(this.win);
	this.bar=document.createElement("div");
	this.win.appendChild(this.bar);

	//Set title.
	this.bar_text=document.createElement("div");
	this.bar.appendChild(this.bar_text);
	this.bar_text.innerHTML=this.title="";
	this.bar_text.className="doorway_bar_text";

	//Make buttons.
	this.button_offset=0;
	this.buttons=[];
	this.make_button_m("X",function(){_this.set_minimized(true);});
	this.make_button_m("?",function(){alert("HELP! "+_this.title);});

	//Event listeners...
	this.bar.addEventListener("mousedown",function(event){_this.down_m(event);});
	this.bar.addEventListener("touchstart",function(event){_this.down_m(event);});
	this.move_ev_m=function(event){_this.move_m(event);};
	window.addEventListener("mousemove",this.move_ev_m);
	window.addEventListener("touchmove",this.move_ev_m);
	this.up_ev_m=function(event){_this.up_m(event);};
	window.addEventListener("mouseup",this.up_ev_m);
	window.addEventListener("touchend",this.up_ev_m);

	//Create resizers.
	this.resizers=
	{
		n:new resizer_t(this.win,"resizer resizer_n",function(change)
		{
			_this.grow_top_m(change.y,_this.resizers.n);
		}),
		e:new resizer_t(this.win,"resizer resizer_e",function(change)
		{
			_this.grow_right_m(change.x,_this.resizers.e);
		}),
		s:new resizer_t(this.win,"resizer resizer_s",function(change)
		{
			_this.grow_bottom_m(change.y,_this.resizers.s);
		}),
		w:new resizer_t(this.win,"resizer resizer_w",function(change)
		{
			_this.grow_left_m(change.x,_this.resizers.w);
		}),
		ne:new resizer_t(this.win,"resizer resizer_ne",function(change)
		{
			_this.grow_right_m(change.x,_this.resizers.ne);
			_this.grow_top_m(change.y,_this.resizers.ne);
		}),
		se:new resizer_t(this.win,"resizer resizer_se",function(change)
		{
			_this.grow_right_m(change.x,_this.resizers.se);
			_this.grow_bottom_m(change.y,_this.resizers.se);
		}),
		sw:new resizer_t(this.win,"resizer resizer_sw",function(change)
		{
			_this.grow_left_m(change.x,_this.resizers.sw);
			_this.grow_bottom_m(change.y,_this.resizers.sw);
		}),
		nw:new resizer_t(this.win,"resizer resizer_nw",function(change)
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
		window.removeEventListener("mousemove",this.move_ev_m);
		window.removeEventListener("touchmove",this.move_ev_m);
		window.removeEventListener("mouseup",this.up_ev_m);
		window.removeEventListener("touchend",this.up_ev_m);
		this.move_ev_m=this.up_ev_m=null;
	}

	//Cleanup resizers.
	if(this.resizers)
	{
		for(var ii in this.resizers)
			this.resizers[ii].destroy();
		this.resizers=null;
	}
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
		size:
		{
			w:utils.numify(this.win.offsetWidth),
			h:utils.numify(this.win.offsetHeight)
		},
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
	if(size_copy.w>parent_size.w-pos.x)
		size_copy.w=parent_size.w-pos.x;
	if(size_copy.h>parent_size.h-pos.y)
		size_copy.h=parent_size.h-pos.y;

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
		this.win.className="doorway_win doorway_win_active";
		this.bar.className="doorway_bar doorway_bar_active";
		for(var key in this.buttons)
			this.buttons[key].className="doorway_bar_button doorway_bar_button_active";
	}
	else
	{
		this.active=true;
		this.win.className="doorway_win doorway_win_inactive";
		this.bar.className="doorway_bar doorway_bar_inactive";
		for(var key in this.buttons)
			this.buttons[key].className="doorway_bar_button doorway_bar_button_inactive";
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
	button.style.right=this.button_offset+"px";
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

	//Add to offset from right of window...
	this.button_offset+=utils.get_el_size(button).w+5
	this.buttons.push(button);
}

//Grow window right side right with constraining.
doorway_t.prototype.grow_right_m=function(pos,resizer)
{
	var handle_size=utils.get_el_size(resizer.handle);
	var size=utils.get_el_size(this.win);
	size.w+=pos-resizer.down_offset.x+handle_size.w-size.w;
	this.resize(size);
}

//Grow window bottom down with constraining.
doorway_t.prototype.grow_bottom_m=function(pos,resizer)
{
	var handle_size=utils.get_el_size(resizer.handle);
	var size=utils.get_el_size(this.win);
	size.h+=pos-resizer.down_offset.y+handle_size.h-size.h;
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
		this.win.style.zIndex="";
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