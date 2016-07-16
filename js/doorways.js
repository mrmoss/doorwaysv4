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
	var _this=this;

	this.win=document.createElement("div");
	this.constrain.appendChild(this.win);
	this.win.className="doorway_win doorway_win_active";

	this.bar=document.createElement("div");
	this.win.appendChild(this.bar);
	this.bar.className="doorway_bar doorway_bar_active";

	this.bar_text=document.createElement("div");
	this.bar.appendChild(this.bar_text);
	this.bar_text.innerHTML=this.title="";
	this.bar_text.className="doorway_bar_text";

	this.bar_close=document.createElement("button");
	this.bar.appendChild(this.bar_close);
	this.bar_close.innerHTML="X";
	this.bar_close.className="doorway_bar_button";
	this.bar_close.onclick=function(){alert("CLOSE!");};

	this.bar_help=document.createElement("button");
	this.bar.appendChild(this.bar_help);
	this.bar_help.innerHTML="?";
	this.bar_help.className="doorway_bar_button";
	this.bar_help.style.right=utils.get_el_size(this.bar_close).w+5+"px";
	this.bar_help.onclick=function(){alert("HELP!");};

	this.bar.addEventListener("mousedown",function(event){_this.down_m(event);});
	this.bar.addEventListener("touchstart",function(event){_this.down_m(event);});
	window.addEventListener("mousemove",function(event){_this.move_m(event);});
	window.addEventListener("touchmove",function(event){_this.move_m(event);});
	window.addEventListener("mouseup",function(event){_this.up_m(event);});
	window.addEventListener("touchend",function(event){_this.up_m(event);});

	this.resizers=
	{
		n:new resizer_t(this.win,"resizer resizer_n",function(change)
		{
			_this.grow_top(change.y,_this.resizers.n);
		}),
		e:new resizer_t(this.win,"resizer resizer_e",function(change)
		{
			_this.grow_right(change.x,_this.resizers.e);
		}),
		s:new resizer_t(this.win,"resizer resizer_s",function(change)
		{
			_this.grow_bottom(change.y,_this.resizers.s);
		}),
		w:new resizer_t(this.win,"resizer resizer_w",function(change)
		{
			_this.grow_left(change.x,_this.resizers.w);
		}),
		ne:new resizer_t(this.win,"resizer resizer_ne",function(change)
		{
			_this.grow_right(change.x,_this.resizers.ne);
			_this.grow_top(change.y,_this.resizers.ne);
		}),
		se:new resizer_t(this.win,"resizer resizer_se",function(change)
		{
			_this.grow_right(change.x,_this.resizers.se);
			_this.grow_bottom(change.y,_this.resizers.se);
		}),
		sw:new resizer_t(this.win,"resizer resizer_sw",function(change)
		{
			_this.grow_left(change.x,_this.resizers.sw);
			_this.grow_bottom(change.y,_this.resizers.sw);
		}),
		nw:new resizer_t(this.win,"resizer resizer_nw",function(change)
		{
			_this.grow_left(change.x,_this.resizers.nw);
			_this.grow_top(change.y,_this.resizers.nw);
		})
	};

	this.load(options);
};

doorway_t.prototype.destroy=function()
{
	var _this=this;
	if(this.constrain)
	{
		this.constrain.removeChild(this.win);
		this.constrain=null;
		window.removeEventListener("mousemove",function(event){_this.move_m(event);});
		window.removeEventListener("touchmove",function(event){_this.move_m(event);});
		window.removeEventListener("mouseup",function(event){_this.up_m(event);});
		window.removeEventListener("touchend",function(event){_this.up_m(event);});
	}
	if(this.resizers)
	{
		for(var ii in this.resizers)
			this.resizers[ii].destroy();
		this.resizers=null;
	}
}

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
		}
	};
	return data;
}

doorway_t.prototype.load=function(data)
{
	if(!data)
		data={};
	var data_copy=utils.copy(data);
	if(!data_copy.title)
		data_copy.title="";
	this.bar_text.innerHTML=this.title=data_copy.title;
	this.move(data.pos);
	this.resize(data.size);
}

doorway_t.prototype.move=function(pos)
{
	if(!pos)
		pos={};
	var pos_copy=utils.copy(pos);
	if(!pos_copy.x||pos_copy.x<0)
		pos_copy.x=0;
	if(!pos_copy.y||pos_copy.y<0)
		pos_copy.y=0;
	var size=utils.get_el_size(this.win);
	var parent_size=utils.get_el_size(this.constrain);
	if(pos_copy.x>parent_size.w-size.w)
		pos_copy.x=parent_size.w-size.w;
	if(pos_copy.y>parent_size.h-size.h)
		pos_copy.y=parent_size.h-size.h;
	this.win.style.left=pos_copy.x+"px";
	this.win.style.top=pos_copy.y+"px";
}

doorway_t.prototype.resize=function(size)
{
	if(!size)
		size={};
	var size_copy=utils.copy(size);
	if(!size_copy.w||size_copy.w<this.min_size.w)
		size_copy.w=this.min_size.w;
	if(!size_copy.h||size_copy.h<this.min_size.h)
		size_copy.h=this.min_size.h;
	var pos=utils.get_el_pos(this.win);
	var parent_size=utils.get_el_size(this.constrain);
	if(size_copy.w>parent_size.w-pos.x)
		size_copy.w=parent_size.w-pos.x;
	if(size_copy.h>parent_size.h-pos.y)
		size_copy.h=parent_size.h-pos.y;
	this.win.style.width=size_copy.w+"px";
	this.win.style.height=size_copy.h+"px";
}

doorway_t.prototype.down_m=function(event)
{
	event.preventDefault();
	this.down_offset=utils.get_event_pos(event);
	var offset=utils.get_el_pos(this.win);
	this.down_offset.x-=offset.x;
	this.down_offset.y-=offset.y;
};

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

doorway_t.prototype.up_m=function(event)
{
	this.down_offset=null;
};

doorway_t.prototype.grow_right=function(pos,resizer)
{
	var handle_size=utils.get_el_size(resizer.handle);
	var size=utils.get_el_size(this.win);
	size.w+=pos-resizer.down_offset.x+handle_size.w-size.w;
	this.resize(size);
}

doorway_t.prototype.grow_bottom=function(pos,resizer)
{
	var handle_size=utils.get_el_size(resizer.handle);
	var size=utils.get_el_size(this.win);
	size.h+=pos-resizer.down_offset.y+handle_size.h-size.h;
	this.resize(size);
}

doorway_t.prototype.grow_left=function(pos,resizer)
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

doorway_t.prototype.grow_top=function(pos,resizer)
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