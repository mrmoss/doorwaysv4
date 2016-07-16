//Creates a resizer handle for parent with the given className and
//  calls onmove when moved.
//  onmove({x:INT,y:INT}) - Called when clicked on, passes coordinates of click.
//  Event listeners:
//  down(event) - Called when the the handle is pressed or touched.
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

//Add event listener member.
resizer_t.prototype.addEventListener=function(listener,callback)
{
	utils.setEventListener(this,listener,callback);
}

//Remove event listener member.
resizer_t.prototype.removeEventListener=function(listener,callback)
{
	utils.removeEventListener(this,listener,callback);
}






//Mouse/touch down event listener.
resizer_t.prototype.down_m=function(event)
{
	for(var key in this.event_listeners.down)
		this.event_listeners.down[key](event);
	this.down_offset=utils.get_event_pos(event);
	var offset=utils.get_el_pos(this.handle);
	this.down_offset.x-=offset.x;
	this.down_offset.y-=offset.y;
};

//Mouse/touch move event listener.
resizer_t.prototype.move_m=function(event)
{
	if(this.down_offset)
	{
		var pos=utils.get_event_pos(event);
		if(this.onmove)
			this.onmove(pos);
	}
};

//Mouse/touch up listener.
resizer_t.prototype.up_m=function(event)
{
	this.down_offset=null;
	this.parent_offset=null;
};