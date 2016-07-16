function utils_t()
{}

utils_t.prototype.numify=function(value)
{
	var num=parseFloat(value);
	if(!num)
		num=0;
	return num;
}

utils_t.prototype.copy=function(obj)
{
	return JSON.parse(JSON.stringify(obj));
}

utils_t.prototype.get_event_pos=function(event)
{
	var pos=null;
	if(event.touches&&event.touches.size==1)
		pos={x:event.touches[0].pageX,y:event.touches[0].pageY};
	else
		pos={x:event.pageX,y:event.pageY};
	return pos;
}

utils_t.prototype.get_el_pos=function(el)
{
	var pos=
	{
		x:null,
		y:null
	};
	if(el)
	{
		pos.x=this.numify(el.offsetLeft);
		pos.y=this.numify(el.offsetTop);
	}
	return pos;
}

utils_t.prototype.get_el_size=function(el)
{
	var size=
	{
		w:null,
		h:null
	};
	if(el)
	{
		size.w=this.numify(el.offsetWidth);
		size.h=this.numify(el.offsetHeight);
	}
	return size;
}

var utils=new utils_t();