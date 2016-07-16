function resizer_t(parent,className,onmove)
{
	if(!parent)
		return null;
	this.parent=parent;
	var _this=this;
	this.handle=document.createElement("div");
	this.parent.appendChild(this.handle);
	this.handle.className=className;
	this.onmove=onmove;

	this.handle.addEventListener("mousedown",function(event){_this.down_m(event);});
	this.handle.addEventListener("touchstart",function(event){_this.down_m(event);});
	window.addEventListener("mousemove",function(event){_this.move_m(event);});
	window.addEventListener("touchmove",function(event){_this.move_m(event);});
	window.addEventListener("mouseup",function(event){_this.up_m(event);});
	window.addEventListener("touchend",function(event){_this.up_m(event);});
}

resizer_t.prototype.destroy=function()
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

resizer_t.prototype.down_m=function(event)
{
	event.preventDefault();
	this.down_offset=utils.get_event_pos(event);
	var offset=utils.get_el_pos(this.handle);
	this.down_offset.x-=offset.x;
	this.down_offset.y-=offset.y;
};

resizer_t.prototype.move_m=function(event)
{
	if(this.down_offset)
	{
		var pos=utils.get_event_pos(event);
		if(this.onmove)
			this.onmove(pos);
	}
};

resizer_t.prototype.up_m=function(event)
{
	this.down_offset=null;
	this.parent_offset=null;
};