/*
document.getElementById("MyElement").classList.add('class');

document.getElementById("MyElement").classList.remove('class');

if ( document.getElementById("MyElement").classList.contains('class') )

document.getElementById("MyElement").classList.toggle('class');
*/

/*! iScroll v5.1.3 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license */
/* two column version of wfinfinitelist 
	by jfwf@yeah.net 2014.10.
*/
(function (window, document, Math) {
var rAF = window.requestAnimationFrame	||
	window.webkitRequestAnimationFrame	||
	window.mozRequestAnimationFrame		||
	window.oRequestAnimationFrame		||
	window.msRequestAnimationFrame		||
	function (callback) { window.setTimeout(callback, 1000 / 60); };

var utils = (function () {
	var me = {};

	var _elementStyle = document.createElement('div').style;
	var _vendor = (function () {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;

		for ( ; i < l; i++ ) {
			transform = vendors[i] + 'ransform';
			if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
		}

		return false;
	})();

	function _prefixStyle (style) {
		if ( _vendor === false ) return false;
		if ( _vendor === '' ) return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	me.getTime = Date.now || function getTime () { return new Date().getTime(); };

	me.extend = function (target, obj) {
		for ( var i in obj ) {
			target[i] = obj[i];
		}
	};

	me.addEvent = function (el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	};

	me.removeEvent = function (el, type, fn, capture) {
		el.removeEventListener(type, fn, !!capture);
	};

	me.prefixPointerEvent = function (pointerEvent) {
		return window.MSPointerEvent ? 
			'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10):
			pointerEvent;
	};

	me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
		var distance = current - start,
			speed = Math.abs(distance) / time,
			destination,
			duration;

		deceleration = deceleration === undefined ? 0.0006 : deceleration;

		destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
		duration = speed / deceleration;

		if ( destination < lowerMargin ) {
			destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
			distance = Math.abs(destination - current);
			duration = distance / speed;
		} else if ( destination > 0 ) {
			destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
			distance = Math.abs(current) + destination;
			duration = distance / speed;
		}

		return {
			destination: Math.round(destination),
			duration: duration
		};
	};

	var _transform = _prefixStyle('transform');

	me.extend(me, {
		hasTransform: _transform !== false,
		hasPerspective: _prefixStyle('perspective') in _elementStyle,
		hasTouch: 'ontouchstart' in window,
		hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
		hasTransition: _prefixStyle('transition') in _elementStyle
	});

	// This should find all Android browsers lower than build 535.19 (both stock browser and webview)
	me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));

	me.extend(me.style = {}, {
		transform: _transform,
		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
		transitionDuration: _prefixStyle('transitionDuration'),
		transitionDelay: _prefixStyle('transitionDelay'),
		transformOrigin: _prefixStyle('transformOrigin')
	});

	me.hasClass = function (e, c) {
		var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
		return re.test(e.className);
	};

	me.addClass = function (e, c) {
		if ( me.hasClass(e, c) ) {
			return;
		}

		var newclass = e.className.split(' ');
		newclass.push(c);
		e.className = newclass.join(' ');
	};

	me.removeClass = function (e, c) {
		if ( !me.hasClass(e, c) ) {
			return;
		}

		var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
		e.className = e.className.replace(re, ' ');
	};

	me.offset = function (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;

		// jshint -W084
		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}
		// jshint +W084

		return {
			left: left,
			top: top
		};
	};

	me.preventDefaultException = function (el, exceptions) {
		for ( var i in exceptions ) {
			if ( exceptions[i].test(el[i]) ) {
				return true;
			}
		}

		return false;
	};

	me.extend(me.eventType = {}, {
		touchstart: 1,
		touchmove: 1,
		touchend: 1,

		mousedown: 2,
		mousemove: 2,
		mouseup: 2,

		pointerdown: 3,
		pointermove: 3,
		pointerup: 3,

		MSPointerDown: 3,
		MSPointerMove: 3,
		MSPointerUp: 3
	});

	me.extend(me.ease = {}, {
		quadratic: {
			style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			fn: function (k) {
				return k * ( 2 - k );
			}
		},
		circular: {
			style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
			fn: function (k) {
				return Math.sqrt( 1 - ( --k * k ) );
			}
		},
		back: {
			style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			fn: function (k) {
				var b = 4;
				return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
			}
		},
		bounce: {
			style: '',
			fn: function (k) {
				if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
					return 7.5625 * k * k;
				} else if ( k < ( 2 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
				} else if ( k < ( 2.5 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
				} else {
					return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
				}
			}
		},
		elastic: {
			style: '',
			fn: function (k) {
				var f = 0.22,
					e = 0.4;

				if ( k === 0 ) { return 0; }
				if ( k == 1 ) { return 1; }

				return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
			}
		}
	});

	me.tap = function (e, eventName) {
		var ev = document.createEvent('Event');
		ev.initEvent(eventName, true, true);
		ev.pageX = e.pageX;
		ev.pageY = e.pageY;
		e.target.dispatchEvent(ev);
	};

	me.click = function (e) {
		var target = e.target,
			ev;

		if ( !(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName) ) {
			ev = document.createEvent('MouseEvents');
			ev.initMouseEvent('click', true, true, e.view, 1,
				target.screenX, target.screenY, target.clientX, target.clientY,
				e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
				0, null);

			ev._constructed = true;
			target.dispatchEvent(ev);
		}
	};

	return me;
})();

function IScroll (options) {
	
	this.scroller = options.scroller ;//wf add.


	// rem this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
	this.scrollerStyle = this.scroller.style;		// cache style for better performance
	this.options = {
		mouseWheelSpeed: 20,
		snapThreshold: 0.334,
		infiniteUseTransform: true,
		deceleration: 0.004,
// INSERT POINT: OPTIONS 
		startX: 0,
		startY: 0,
		scrollY: true,
		directionLockThreshold: 5,
		momentum: true,
		bounce: true,
		bounceTime: 600,
		bounceEasing: '',
		preventDefault: true,
		preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },
		HWCompositing: true,
		useTransition: true,
		useTransform: true
	};
	for ( var i in options ) {
		this.options[i] = options[i];
	}


	//wf add
	this.wrapper = options.wrapper ;
	this.delegate = options.delegate ;
	this.pushCell = options.pushcell ;
	this.pullCell = options.pullcell ;
	this.pushEnable = (options.pushenable&&options.pushenable==='true')?true:false ;
	this.pullEnable = (options.pullenable&&options.pullenable==='true')?true:false ;
	this.setPushEnable(!this.pushEnable) ;
	this.setPullEnable(!this.pullEnable) ;
	this.setPushEnable(!this.pushEnable) ;
	this.setPullEnable(!this.pullEnable) ;
	//new
	this.lrDataIndex=[] ; this.lrDataIndex[0]=[] ;this.lrDataIndex[1]=[] ;
	this.datainfo = [] ;
	this.cells = options.cells ;
  this.two   = !options.twocolumn;
  this.setColumnMode(options.twocolumn,false) ;//include updateDataInfo and cleancells.
	//this.updateDataInfo(true) ;//force update when loaded.
	this.pullCell._scrollBottom = Math.max(this.calScrollHeightMax(),this.wrapper.offsetHeight) ;
	this.pullCell.style.top = this.pullCell._scrollBottom+'px' ;
	var tStartScrollY = options.startScrollY||0 ;
	this.options.startY =  parseInt(tStartScrollY) ;//wf add
	this.wrapperWidth	= this.wrapper.clientWidth;
	this.wrapperHeight	= this.wrapper.clientHeight;
	// end.


	// Normalize options
	this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

	this.options.useTransition = utils.hasTransition && this.options.useTransition;
	this.options.useTransform = utils.hasTransform && this.options.useTransform;

	this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
	this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

	// If you want eventPassthrough I have to lock one of the axes
	this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
	this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

	// With eventPassthrough we also need lockDirection mechanism
	this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
	this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

	this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

	this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

	if ( this.options.tap === true ) {
		this.options.tap = 'tap';
	}

	this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

	if ( true ) {
		this.options.probeType = 3;
	}
	this.options.infiniteUseTransform = this.options.infiniteUseTransform && this.options.useTransform;

	if ( this.options.probeType == 3 ) {
		this.options.useTransition = false;	}

// INSERT POINT: NORMALIZATION

	// Some defaults	
	this.x = 0;
	this.y = 0;
	this.directionX = 0;
	this.directionY = 0;
	this._events = {};

// INSERT POINT: DEFAULTS

	this._init();
	this.refresh();

	this.scrollTo(this.options.startX, this.options.startY);
	this.enable();
}

IScroll.prototype = {
	version: '5.1.3',

	_init: function () {
		this._initEvents();

		if ( this.options.mouseWheel ) {
			this._initWheel();
		}

		if ( this.options.snap ) {
			this._initSnap();
		}

		if ( this.options.keyBindings ) {
			this._initKeys();
		}

		if ( true ) {
			this._initInfinite();
		}

// INSERT POINT: _init

	},

	destroy: function () {
		this._initEvents(true);

		this._execEvent('destroy');
	},

	_transitionEnd: function (e) {
		if ( e.target != this.scroller || !this.isInTransition ) {
			return;
		}

		this._transitionTime();
		if ( !this.resetPosition(this.options.bounceTime) ) {
			this.isInTransition = false;
			this._execEvent('scrollEnd');
		}
	},

	_start: function (e) {
		// React to left mouse button only
		if ( utils.eventType[e.type] != 1 ) {
			if ( e.button !== 0 ) {
				return;
			}
		}

		if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
			return;
		}

		if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.touches ? e.touches[0] : e,
			pos;

		this.initiated	= utils.eventType[e.type];
		this.moved		= false;
		this.distX		= 0;
		this.distY		= 0;
		this.directionX = 0;
		this.directionY = 0;
		this.directionLocked = 0;

		this._transitionTime();

		this.startTime = utils.getTime();

		if ( this.options.useTransition && this.isInTransition ) {
			this.isInTransition = false;
			pos = this.getComputedPosition();
			this._translate(Math.round(pos.x), Math.round(pos.y));//n
			this._execEvent('scrollEnd');
		} else if ( !this.options.useTransition && this.isAnimating ) {
			this.isAnimating = false;
			this._execEvent('scrollEnd');
		}

		this.startX    = this.x;
		this.startY    = this.y;
		this.absStartX = this.x;
		this.absStartY = this.y;
		this.pointX    = point.pageX;
		this.pointY    = point.pageY;

		this._execEvent('beforeScrollStart');
	},

	_move: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}
		if ( this.options.preventDefault ) {	// increases performance on Android? TODO: check!
			e.preventDefault();
		}

		var point		= e.touches ? e.touches[0] : e,
			deltaX		= point.pageX - this.pointX,
			deltaY		= point.pageY - this.pointY,
			timestamp	= utils.getTime(),
			newX, newY,
			absDistX, absDistY;

		this.pointX		= point.pageX;
		this.pointY		= point.pageY;

		this.distX		+= deltaX;
		this.distY		+= deltaY;
		absDistX		= Math.abs(this.distX);
		absDistY		= Math.abs(this.distY);

		// We need to move at least 10 pixels for the scrolling to initiate
		if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
			return;
		}

		// If you are scrolling in one direction lock the other
		if ( !this.directionLocked && !this.options.freeScroll ) {
			if ( absDistX > absDistY + this.options.directionLockThreshold ) {
				this.directionLocked = 'h';		// lock horizontally
			} else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
				this.directionLocked = 'v';		// lock vertically
			} else {
				this.directionLocked = 'n';		// no lock
			}
		}

		if ( this.directionLocked == 'h' ) {
			if ( this.options.eventPassthrough == 'vertical' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'horizontal' ) {
				this.initiated = false;
				return;
			}
			deltaY = 0;
		} else if ( this.directionLocked == 'v' ) {
			if ( this.options.eventPassthrough == 'horizontal' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'vertical' ) {
				this.initiated = false;
				return;
			}

			deltaX = 0;
		}

		deltaX = this.hasHorizontalScroll ? deltaX : 0;
		deltaY = this.hasVerticalScroll ? deltaY : 0;

		newX = this.x + deltaX;
		newY = this.y + deltaY;

		// Slow down if outside of the boundaries
		if ( newX > 0 || newX < this.maxScrollX ) {
			newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
		}
		if ( newY > 0 || newY < this.maxScrollY ) {
			newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
		}

		this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		if ( !this.moved ) {
			this._execEvent('scrollStart');
		}

		this.moved = true;

		this._translate(newX, newY);//n

/* REPLACE START: _move */
		if ( timestamp - this.startTime > 300 ) {
			this.startTime = timestamp;
			this.startX = this.x;
			this.startY = this.y;

			if ( this.options.probeType == 1 ) {
				this._execEvent('scroll');
			}
		}
		if ( this.options.probeType > 1 ) {
			this._execEvent('scroll');
		}
/* REPLACE END: _move */

	},









	



	pushState0:-1,
	pullState0:-1,
	pushState:0, // 0-pushing ; 1-release ; 2-loading ; 
	pullState:0, // 0-pulling ; 1-release ; 2-loading ; 3-finished.
	pushPullLoadingFinished:function(isOk  , isAll )
	{
		if( this.pushState == 2 )
		{
			this.pushState = 0 ;
			if( isOk )
				this.pullState = 0 ;
		}
			
		if( this.pullState == 2 )
		{
			this.pullState = 0 ;
			if( isAll && isOk )
				this.pullState = 3 ;
		}
		this.updateDataInfo() ;
		this.updateMaxScrollY() ;
		if( isOk )
		{
			this.reorderInfinite() ;
		}
	},
	pushLoadBegin:function(){
		this.pushState=2 ;
		//this.refresh() ;
		this.options.delegate.onPushTriggered.call(this,this) ;
	},
	pullLoadBegin:function(){
		this.pullState=2 ;
		//this.refresh() ;
		this.options.delegate.onPullTriggered.call(this,this) ;
	},
	_end: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}

		if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.changedTouches ? e.changedTouches[0] : e,
			momentumX,
			momentumY,
			duration = utils.getTime() - this.startTime,
			newX = Math.round(this.x),
			newY = Math.round(this.y),
			distanceX = Math.abs(newX - this.startX),
			distanceY = Math.abs(newY - this.startY),
			time = 0,
			easing = '';

		this.isInTransition = 0;
		this.initiated = 0;
		this.endTime = utils.getTime();

























		/* : push pull trigger *******************************************************/ 
		/* : push pull trigger  *******************************************************/ 
		/* : push pull trigger  *******************************************************/ 
		/* : push pull trigger  *******************************************************/ 
		if( this.y > 0 &&
			 	(this.y-this.maxScrollY>this.options.pushTriggerOffset)
			 	&& this.pushState == 1 )
		{
			console.log('trigger push') ;
			this.pushLoadBegin() ;
		}
		else if( this.maxScrollY - this.y > this.options.pullTriggerOffset 
							&& this.pullState==1 )
		{
			console.log('trigger pull') ;
			this.pullLoadBegin() ;
		}





		// reset if we are outside of the boundaries
		if ( this.resetPosition(this.options.bounceTime) ) {
			return;
		}

		this.scrollTo(newX, newY);	// ensures that the last position is rounded 
		//possible


		// we scrolled less than 10 pixels
		if ( !this.moved ) {
			if ( this.options.tap ) {
				utils.tap(e, this.options.tap);
			}

			if ( this.options.click ) {
				utils.click(e);
			}

			this._execEvent('scrollCancel');
			return;
		}

		if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 ) {
			this._execEvent('flick');
			return;
		}

		// start momentum animation if needed
		if ( this.options.momentum && duration < 300 ) {
			momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
			momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
			newX = momentumX.destination;
			newY = momentumY.destination;
			time = Math.max(momentumX.duration, momentumY.duration);
			this.isInTransition = 1;
		}


		if ( this.options.snap ) {
			var snap = this._nearestSnap(newX, newY);
			this.currentPage = snap;
			time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(newX - snap.x), 1000),
						Math.min(Math.abs(newY - snap.y), 1000)
					), 300);
			newX = snap.x;
			newY = snap.y;

			this.directionX = 0;
			this.directionY = 0;
			easing = this.options.bounceEasing;
		}

// INSERT POINT: _end

		if ( newX != this.x || newY != this.y ) {
			// change easing function when scroller goes out of the boundaries
			if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
				easing = utils.ease.quadratic;
			}

			this.scrollTo(newX, newY, time, easing);

			return;
		}

		this._execEvent('scrollEnd');
	},

	_resize: function () {
		var that = this;

		clearTimeout(this.resizeTimeout);

		this.resizeTimeout = setTimeout(function () {
			that.refresh();
		}, this.options.resizePolling);
	},

	updateMaxScrollY:function() //wf add
	{
		var limit = -this.calScrollHeightMax()+this.wrapperHeight;
		if( limit < 0 )
			this.maxScrollY = limit ;
		else
			this.maxScrollY = -1 ;
	},

	resetPosition: function (time) {
		var x = this.x,
			y = this.y;

		time = time || 0;

		if ( !this.hasHorizontalScroll || this.x > 0 ) {
			x = 0;
		} else if ( this.x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( !this.hasVerticalScroll || this.y > 0 ) {
			if( this.pushState==2 )//wf add
			{
				y = this.options.pushTriggerOffset ;//wf add
			}else
				y = 0;
		} else if ( this.y < this.maxScrollY ) {
			y = this.maxScrollY;
		}
		if ( x == this.x && y == this.y ) {
			return false;
		}
		if( this.pushState==2 && this.y==this.options.pushTriggerOffset ){ //wf add
			return false ;//wf add
		}//wf add

		this.scrollTo(x, y, time, this.options.bounceEasing);

		return true;
	},

	disable: function () {
		this.enabled = false;
	},

	enable: function () {
		this.enabled = true;
	},

	refresh: function () {
		var rf = this.wrapper.offsetHeight;		// Force reflow

		this.wrapperWidth	= this.wrapper.clientWidth;
		this.wrapperHeight	= this.wrapper.clientHeight;

		this.updateMaxScrollY() ;

		this.hasHorizontalScroll	= this.options.scrollX && this.maxScrollX < 0;
		this.hasVerticalScroll		= this.options.scrollY && this.maxScrollY < 0;

		if ( !this.hasHorizontalScroll ) {
			this.maxScrollX = 0;
			this.scrollerWidth = this.wrapperWidth;
		}

		if ( !this.hasVerticalScroll ) {
			this.maxScrollY = 0;
			this.scrollerHeight = this.wrapperHeight;
		}

		this.endTime = 0;
		this.directionX = 0;
		this.directionY = 0;

		this.wrapperOffset = utils.offset(this.wrapper);

		this._execEvent('refresh');

		this.resetPosition();

// INSERT POINT: _refresh

	},

	on: function (type, fn) {
		if ( !this._events[type] ) {
			this._events[type] = [];
		}

		this._events[type].push(fn);
	},

	off: function (type, fn) {
		if ( !this._events[type] ) {
			return;
		}

		var index = this._events[type].indexOf(fn);

		if ( index > -1 ) {
			this._events[type].splice(index, 1);
		}
	},

	_execEvent: function (type) {
		if ( !this._events[type] ) {
			return;
		}

		var i = 0,
			l = this._events[type].length;

		if ( !l ) {
			return;
		}

		for ( ; i < l; i++ ) {
			this._events[type][i].apply(this, [].slice.call(arguments, 1));
		}
	},

	scrollBy: function (x, y, time, easing) {
		x = this.x + x;
		y = this.y + y;
		time = time || 0;

		this.scrollTo(x, y, time, easing);
	},

	scrollTo: function (x, y, time, easing) {
		easing = easing || utils.ease.circular;

		this.isInTransition = this.options.useTransition && time > 0;

		if ( !time || (this.options.useTransition && easing.style) ) {
			this._transitionTimingFunction(easing.style);
			this._transitionTime(time);
			this._translate(x, y);//maybe
		} else {
			this._animate(x, y, time, easing.fn);
		}
	},

	scrollToElement: function (el, time, offsetX, offsetY, easing) {
		el = el.nodeType ? el : this.scroller.querySelector(el);

		if ( !el ) {
			return;
		}

		var pos = utils.offset(el);

		pos.left -= this.wrapperOffset.left;
		pos.top  -= this.wrapperOffset.top;

		// if offsetX/Y are true we center the element to the screen
		if ( offsetX === true ) {
			offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
		}
		if ( offsetY === true ) {
			offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
		}

		pos.left -= offsetX || 0;
		pos.top  -= offsetY || 0;

		pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
		pos.top  = pos.top  > 0 ? 0 : pos.top  < this.maxScrollY ? this.maxScrollY : pos.top;

		time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x-pos.left), Math.abs(this.y-pos.top)) : time;

		this.scrollTo(pos.left, pos.top, time, easing);
	},

	_transitionTime: function (time) {
		time = time || 0;

		this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

		if ( !time && utils.isBadAndroid ) {
			this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
		}

// INSERT POINT: _transitionTime

	},

	_transitionTimingFunction: function (easing) {
		this.scrollerStyle[utils.style.transitionTimingFunction] = easing;

// INSERT POINT: _transitionTimingFunction

	},

	_translate: function (x, y) {
		if ( this.options.useTransform ) {

/* REPLACE START: _translate */

			this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

/* REPLACE END: _translate */

		} else {
			x = Math.round(x);
			y = Math.round(y);
			this.scrollerStyle.left = x + 'px';
			this.scrollerStyle.top = y + 'px';
		}

		this.x = x;
		this.y = y;

// INSERT POINT: _translate

	},

	_initEvents: function (remove) {
		var eventType = remove ? utils.removeEvent : utils.addEvent,
			target = this.options.bindToWrapper ? this.wrapper : window;

		eventType(window, 'orientationchange', this);
		eventType(window, 'resize', this);

		if ( this.options.click ) {
			eventType(this.wrapper, 'click', this, true);
		}

		if ( !this.options.disableMouse ) {
			eventType(this.wrapper, 'mousedown', this);
			eventType(target, 'mousemove', this);
			eventType(target, 'mousecancel', this);
			eventType(target, 'mouseup', this);
		}

		if ( utils.hasPointer && !this.options.disablePointer ) {
			eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
			eventType(target, utils.prefixPointerEvent('pointermove'), this);
			eventType(target, utils.prefixPointerEvent('pointercancel'), this);
			eventType(target, utils.prefixPointerEvent('pointerup'), this);
		}

		if ( utils.hasTouch && !this.options.disableTouch ) {
			eventType(this.wrapper, 'touchstart', this);
			eventType(target, 'touchmove', this);
			eventType(target, 'touchcancel', this);
			eventType(target, 'touchend', this);
		}

		eventType(this.scroller, 'transitionend', this);
		eventType(this.scroller, 'webkitTransitionEnd', this);
		eventType(this.scroller, 'oTransitionEnd', this);
		eventType(this.scroller, 'MSTransitionEnd', this);
	},

	getComputedPosition: function () {
		var matrix = window.getComputedStyle(this.scroller, null),
			x, y;

		if ( this.options.useTransform ) {
			matrix = matrix[utils.style.transform].split(')')[0].split(', ');
			x = +(matrix[12] || matrix[4]);
			y = +(matrix[13] || matrix[5]);
		} else {
			x = +matrix.left.replace(/[^-\d.]/g, '');
			y = +matrix.top.replace(/[^-\d.]/g, '');
		}

		return { x: x, y: y };
	},

	_initWheel: function () {
		utils.addEvent(this.wrapper, 'wheel', this);
		utils.addEvent(this.wrapper, 'mousewheel', this);
		utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

		this.on('destroy', function () {
			utils.removeEvent(this.wrapper, 'wheel', this);
			utils.removeEvent(this.wrapper, 'mousewheel', this);
			utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
		});
	},

	_wheel: function (e) {
		if ( !this.enabled ) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		var wheelDeltaX, wheelDeltaY,
			newX, newY,
			that = this;

		if ( this.wheelTimeout === undefined ) {
			that._execEvent('scrollStart');
		}

		// Execute the scrollEnd event after 400ms the wheel stopped scrolling
		clearTimeout(this.wheelTimeout);
		this.wheelTimeout = setTimeout(function () {
			that._execEvent('scrollEnd');
			that.wheelTimeout = undefined;
		}, 400);

		if ( 'deltaX' in e ) {
			if (e.deltaMode === 1) {
				wheelDeltaX = -e.deltaX * this.options.mouseWheelSpeed;
				wheelDeltaY = -e.deltaY * this.options.mouseWheelSpeed;
			} else {
				wheelDeltaX = -e.deltaX;
				wheelDeltaY = -e.deltaY;
			}
		} else if ( 'wheelDeltaX' in e ) {
			wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
			wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
		} else if ( 'wheelDelta' in e ) {
			wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
		} else if ( 'detail' in e ) {
			wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
		} else {
			return;
		}

		wheelDeltaX *= this.options.invertWheelDirection;
		wheelDeltaY *= this.options.invertWheelDirection;

		if ( !this.hasVerticalScroll ) {
			wheelDeltaX = wheelDeltaY;
			wheelDeltaY = 0;
		}

		if ( this.options.snap ) {
			newX = this.currentPage.pageX;
			newY = this.currentPage.pageY;

			if ( wheelDeltaX > 0 ) {
				newX--;
			} else if ( wheelDeltaX < 0 ) {
				newX++;
			}

			if ( wheelDeltaY > 0 ) {
				newY--;
			} else if ( wheelDeltaY < 0 ) {
				newY++;
			}

			this.goToPage(newX, newY);

			return;
		}

		newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
		newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

		if ( newX > 0 ) {
			newX = 0;
		} else if ( newX < this.maxScrollX ) {
			newX = this.maxScrollX;
		}

		if ( newY > 0 ) {
			newY = 0;
		} else if ( newY < this.maxScrollY ) {
			newY = this.maxScrollY;
		}

		this.scrollTo(newX, newY, 0);//n

		if ( this.options.probeType > 1 ) {
			this._execEvent('scroll');//no
		}

// INSERT POINT: _wheel
	},

	_initSnap: function () {
		this.currentPage = {};

		if ( typeof this.options.snap == 'string' ) {
			this.options.snap = this.scroller.querySelectorAll(this.options.snap);
		}

		this.on('refresh', function () {
			var i = 0, l,
				m = 0, n,
				cx, cy,
				x = 0, y,
				stepX = this.options.snapStepX || this.wrapperWidth,
				stepY = this.options.snapStepY || this.wrapperHeight,
				el;

			this.pages = [];

			if ( !this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight ) {
				return;
			}

			if ( this.options.snap === true ) {
				cx = Math.round( stepX / 2 );
				cy = Math.round( stepY / 2 );

				while ( x > -this.scrollerWidth ) {
					this.pages[i] = [];
					l = 0;
					y = 0;

					while ( y > -this.scrollerHeight ) {
						this.pages[i][l] = {
							x: Math.max(x, this.maxScrollX),
							y: Math.max(y, this.maxScrollY),
							width: stepX,
							height: stepY,
							cx: x - cx,
							cy: y - cy
						};

						y -= stepY;
						l++;
					}

					x -= stepX;
					i++;
				}
			} else {
				el = this.options.snap;
				l = el.length;
				n = -1;

				for ( ; i < l; i++ ) {
					if ( i === 0 || el[i].offsetLeft <= el[i-1].offsetLeft ) {
						m = 0;
						n++;
					}

					if ( !this.pages[m] ) {
						this.pages[m] = [];
					}

					x = Math.max(-el[i].offsetLeft, this.maxScrollX);
					y = Math.max(-el[i].offsetTop, this.maxScrollY);
					cx = x - Math.round(el[i].offsetWidth / 2);
					cy = y - Math.round(el[i].offsetHeight / 2);

					this.pages[m][n] = {
						x: x,
						y: y,
						width: el[i].offsetWidth,
						height: el[i].offsetHeight,
						cx: cx,
						cy: cy
					};

					if ( x > this.maxScrollX ) {
						m++;
					}
				}
			}

			this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

			// Update snap threshold if needed
			if ( this.options.snapThreshold % 1 === 0 ) {
				this.snapThresholdX = this.options.snapThreshold;
				this.snapThresholdY = this.options.snapThreshold;
			} else {
				this.snapThresholdX = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold);
				this.snapThresholdY = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold);
			}
		});

		this.on('flick', function () {
			var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.x - this.startX), 1000),
						Math.min(Math.abs(this.y - this.startY), 1000)
					), 300);

			this.goToPage(
				this.currentPage.pageX + this.directionX,
				this.currentPage.pageY + this.directionY,
				time
			);
		});
	},

	_nearestSnap: function (x, y) {
		if ( !this.pages.length ) {
			return { x: 0, y: 0, pageX: 0, pageY: 0 };
		}

		var i = 0,
			l = this.pages.length,
			m = 0;

		// Check if we exceeded the snap threshold
		if ( Math.abs(x - this.absStartX) < this.snapThresholdX &&
			Math.abs(y - this.absStartY) < this.snapThresholdY ) {
			return this.currentPage;
		}

		if ( x > 0 ) {
			x = 0;
		} else if ( x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( y > 0 ) {
			y = 0;
		} else if ( y < this.maxScrollY ) {
			y = this.maxScrollY;
		}

		for ( ; i < l; i++ ) {
			if ( x >= this.pages[i][0].cx ) {
				x = this.pages[i][0].x;
				break;
			}
		}

		l = this.pages[i].length;

		for ( ; m < l; m++ ) {
			if ( y >= this.pages[0][m].cy ) {
				y = this.pages[0][m].y;
				break;
			}
		}

		if ( i == this.currentPage.pageX ) {
			i += this.directionX;

			if ( i < 0 ) {
				i = 0;
			} else if ( i >= this.pages.length ) {
				i = this.pages.length - 1;
			}

			x = this.pages[i][0].x;
		}

		if ( m == this.currentPage.pageY ) {
			m += this.directionY;

			if ( m < 0 ) {
				m = 0;
			} else if ( m >= this.pages[0].length ) {
				m = this.pages[0].length - 1;
			}

			y = this.pages[0][m].y;
		}

		return {
			x: x,
			y: y,
			pageX: i,
			pageY: m
		};
	},

	goToPage: function (x, y, time, easing) {
		easing = easing || this.options.bounceEasing;

		if ( x >= this.pages.length ) {
			x = this.pages.length - 1;
		} else if ( x < 0 ) {
			x = 0;
		}

		if ( y >= this.pages[x].length ) {
			y = this.pages[x].length - 1;
		} else if ( y < 0 ) {
			y = 0;
		}

		var posX = this.pages[x][y].x,
			posY = this.pages[x][y].y;

		time = time === undefined ? this.options.snapSpeed || Math.max(
			Math.max(
				Math.min(Math.abs(posX - this.x), 1000),
				Math.min(Math.abs(posY - this.y), 1000)
			), 300) : time;

		this.currentPage = {
			x: posX,
			y: posY,
			pageX: x,
			pageY: y
		};

		this.scrollTo(posX, posY, time, easing);//n
	},

	next: function (time, easing) {
		var x = this.currentPage.pageX,
			y = this.currentPage.pageY;

		x++;

		if ( x >= this.pages.length && this.hasVerticalScroll ) {
			x = 0;
			y++;
		}

		this.goToPage(x, y, time, easing);
	},

	prev: function (time, easing) {
		var x = this.currentPage.pageX,
			y = this.currentPage.pageY;

		x--;

		if ( x < 0 && this.hasVerticalScroll ) {
			x = 0;
			y--;
		}

		this.goToPage(x, y, time, easing);
	},

	_initKeys: function (e) {
		// default key bindings
		var keys = {
			pageUp: 33,
			pageDown: 34,
			end: 35,
			home: 36,
			left: 37,
			up: 38,
			right: 39,
			down: 40
		};
		var i;

		// if you give me characters I give you keycode
		if ( typeof this.options.keyBindings == 'object' ) {
			for ( i in this.options.keyBindings ) {
				if ( typeof this.options.keyBindings[i] == 'string' ) {
					this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
				}
			}
		} else {
			this.options.keyBindings = {};
		}

		for ( i in keys ) {
			this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
		}

		utils.addEvent(window, 'keydown', this);

		this.on('destroy', function () {
			utils.removeEvent(window, 'keydown', this);
		});
	},

	_key: function (e) {
		if ( !this.enabled ) {
			return;
		}

		var snap = this.options.snap,	// we are using this alot, better to cache it
			newX = snap ? this.currentPage.pageX : this.x,
			newY = snap ? this.currentPage.pageY : this.y,
			now = utils.getTime(),
			prevTime = this.keyTime || 0,
			acceleration = 0.250,
			pos;

		if ( this.options.useTransition && this.isInTransition ) {
			pos = this.getComputedPosition();

			this._translate(Math.round(pos.x), Math.round(pos.y));//n
			this.isInTransition = false;
		}

		this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

		switch ( e.keyCode ) {
			case this.options.keyBindings.pageUp:
				if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
					newX += snap ? 1 : this.wrapperWidth;
				} else {
					newY += snap ? 1 : this.wrapperHeight;
				}
				break;
			case this.options.keyBindings.pageDown:
				if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
					newX -= snap ? 1 : this.wrapperWidth;
				} else {
					newY -= snap ? 1 : this.wrapperHeight;
				}
				break;
			case this.options.keyBindings.end:
				newX = snap ? this.pages.length-1 : this.maxScrollX;
				newY = snap ? this.pages[0].length-1 : this.maxScrollY;
				break;
			case this.options.keyBindings.home:
				newX = 0;
				newY = 0;
				break;
			case this.options.keyBindings.left:
				newX += snap ? -1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.up:
				newY += snap ? 1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.right:
				newX -= snap ? -1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.down:
				newY -= snap ? 1 : 5 + this.keyAcceleration>>0;
				break;
			default:
				return;
		}

		if ( snap ) {
			this.goToPage(newX, newY);
			return;
		}

		if ( newX > 0 ) {
			newX = 0;
			this.keyAcceleration = 0;
		} else if ( newX < this.maxScrollX ) {
			newX = this.maxScrollX;
			this.keyAcceleration = 0;
		}

		if ( newY > 0 ) {
			newY = 0;
			this.keyAcceleration = 0;
		} else if ( newY < this.maxScrollY ) {
			newY = this.maxScrollY;
			this.keyAcceleration = 0;
		}

		this.scrollTo(newX, newY, 0);//n

		this.keyTime = now;
	},

	_animate: function (destX, destY, duration, easingFn) {
		var that = this,
			startX = this.x,
			startY = this.y,
			startTime = utils.getTime(),
			destTime = startTime + duration;

		function step () {
			var now = utils.getTime(),
				newX, newY,
				easing;

			if ( now >= destTime ) {
				that.isAnimating = false;
				that._translate(destX, destY);//maybe
				
				if ( !that.resetPosition(that.options.bounceTime) ) {
					that._execEvent('scrollEnd');
				}

				return;
			}

			now = ( now - startTime ) / duration;
			easing = easingFn(now);
			newX = ( destX - startX ) * easing + startX;
			newY = ( destY - startY ) * easing + startY;
			that._translate(newX, newY);

			if ( that.isAnimating ) {
				rAF(step);
			}

			if ( that.options.probeType == 3 ) {
				that._execEvent('scroll');
			}
		}

		this.isAnimating = true;
		step();
	},




	_initInfinite: function () {
		//var el = this.options.infiniteElements;


















		// add:
		if( typeof(this.delegate)==='undefined' )
		{
			console.log('error: delegate is undefined.') ;
		}
		

		/*
		this.infiniteElements = typeof el == 'string' ? document.querySelectorAll(el) : el;
		this.infiniteLength = this.infiniteElements.length;
		this.infiniteMaster = this.infiniteElements[0];
		this.infiniteElementHeight = this.infiniteMaster.offsetHeight;
		this.infiniteHeight = this.infiniteLength * this.infiniteElementHeight;*/
		this.scrollerHeight = this.calScrollHeightMax() ;

		this.options.pullTriggerOffset = this.options.pullTriggerOffset || 60;
		this.options.pullStartHtml = this.options.pullStartHtml || 'pull to load more';
		this.options.pullReleaseHtml = this.options.pullReleaseHtml || 'releas to start loading';
		this.options.pullLoadingHtml = this.options.pullLoadingHtml || 'loading...';
		this.options.pullNothingHtml = this.options.pullNothingHtml || 'no more to load';

		this.options.pushTriggerOffset = this.options.pushTriggerOffset || 60;
		this.options.pushStartHtml = this.options.pushStartHtml || "push to refresh";
		this.options.pushReleaseHtml = this.options.pushReleaseHtml || 'release to start refresh';
		this.options.pushLoadingHtml = this.options.pushLoadingHtml || 'refreshing...';


		// end.

		












		


		this.options.cacheSize = this.options.cacheSize || 1000;
		this.infiniteCacheBuffer = Math.round(this.options.cacheSize / 4);

		//this.infiniteCache = {};
		//this.options.dataset.call(this, 0, this.options.cacheSize); .

		this.on('refresh', function () {
			var elementsPerPage = Math.ceil(this.wrapperHeight / this.infiniteElementHeight);
			this.infiniteUpperBufferSize = Math.floor((this.infiniteLength - elementsPerPage) / 2);
			this.reorderInfinite();
		});

		this.on('scroll', this.reorderInfinite);

		this.refresh() ;//wf add
	},



	midIndexbinSearch:function(midy){
		if( this.two==false )
		{//one
			var low = 0 , high = this.datainfo.length-1 ;
			var mid = 0 ;
			while(low<=high)
			{
				mid = Math.floor((low+high)/2) ;
				if(this.datainfo[mid].y>midy)
					high = mid-1 ;
				else if( this.datainfo[mid].y+this.datainfo[mid].h < midy )
					low = mid+1 ;
				else
					return [mid,mid] ;
			}
			return [mid , mid] ;
		}//end one.
		else
		{//two
			var ret = [0,0] ;
			for(var il = 0 ; il<2 ; il++ )
			{
				var low = 0 , high = this.lrDataIndex[il].length-1 ;
				var mid = 0 ;
				while(low<=high)
				{
					mid = Math.floor((low+high)/2) ;
					if(this.datainfo[this.lrDataIndex[il][mid]].y>midy)
						high = mid-1 ;
					else if( this.datainfo[this.lrDataIndex[il][mid]].y
										+ this.datainfo[this.lrDataIndex[il][mid]].h < midy )
						low = mid+1 ;
					else
						break ;
				}
				ret[il] = mid ;
			}
			return ret ;
		}//end two.
	},
	// TO-DO: clean up the mess
	
	reorderInfinite: function () {
		this.updateDataInfo() ;
		var fullwid = this.wrapperWidth ;
		var halfwid = parseInt(fullwid) ;
		var del = this.delegate ;
		var wmsY = this.wrapperHeight/2 - this.y ;// wmsY: the y-position of wrapper middle in scroll space.
		var wtsY =                      - this.y ;// wtsY: the y-position of wrapper top    in scroll space.
		var len = this.datainfo.length ;
		if( this.two==false )
		{//single begin:
			if( len > 0 )
			{
				//console.log('one column reorder:') ;
				var middleIndex = this.midIndexbinSearch(wmsY)[0] ;
				var vis0 = Math.max(middleIndex-7,0) ;
				var vis1 = Math.min(middleIndex+7,len-1) ;
				for(var vdi = vis0 ; vdi<=vis1 ; vdi++ ) //vdi : visible data index
				{
					var cind = this.datainfo[vdi].icell ; 
					if( this.cells[cind].dindex!=vdi || this.changingModeAnimation )
					{
						this.cells[cind].dindex = vdi ;
						this.cells[cind].style.height = this.datainfo[vdi].h + 'px';
						this.delegate.onData(this.cells[cind],vdi) ;
						if(!this.changingModeAnimation)
						{
							this.cells[cind].style.webkitTransition='0' ;
							this.cells[cind].style.transition='0' ;
						}
					}	
					var cy = this.datainfo[vdi].y ;
					if ( this.options.infiniteUseTransform ) {
						this.cells[cind].style[utils.style.transform] = 'translate(0, ' + cy + 'px)' + this.translateZ;
					} else {
						this.cells[cind].style.top = cy + 'px';
					}
				}//end for vdi
				// remove invisible cell's animation.
				if(this.changingModeAnimation)
				{
					for(var cind2 = 0 ; cind2<30 ; cind2++ )
					{
						if( this.cells[cind2].dindex>= vis0 && this.cells[cind2].dindex<= vis1 ) continue ;
						this.cells[cind2].style.webkitTransition='0' ;
						this.cells[cind2].style.transition='0' ;
					}
				}
			}
		}//single end.
		else
		{//two begin
			//console.log('two column reorder:') ;
			var middleIndex = this.midIndexbinSearch(wmsY) ;
			//console.log('wrapper-mid-in-scroll-y:'+wmsY) ;
			//console.log('this-y:'+this.y) ;
			//console.log('wrapper-hei:'+this.wrapperHeight) ;
			//console.log('middleIndex:'+middleIndex[0]+','+middleIndex[1]) ;
			for(var icol = 0 ; icol<2 ; icol++ )
			{
				var leni = this.lrDataIndex[icol].length ;
				if( leni > 0 )
				{
					var vis0i = Math.max(middleIndex[icol]-7,0) ;
					var vis1i = Math.min(middleIndex[icol]+7,leni-1) ;
					if( vis1i == leni-1 )
					{
						var tdi = this.lrDataIndex[icol][vis1i] ;
						if( this.datainfo[tdi].y+this.datainfo[tdi].h<wtsY-300 )
						{ vis0i = 0 ;	vis1i = -1 ;}
					}
					for(var vdii = vis0i ; vdii<=vis1i ; vdii++ ) //vdii : visible data index in lrDataIndex.
					{
						var di = this.lrDataIndex[icol][vdii] ;
						var cind = this.datainfo[di].icell ; 
						if( this.cells[cind].dindex!=di  )
						{
							this.cells[cind].dindex = di ;
							this.cells[cind].style.height = this.datainfo[di].h + 'px';
							this.delegate.onData(this.cells[cind],di) ;
							if(this.changingModeAnimation==false)
							{
								this.cells[cind].style.transition = '0' ;
								this.cells[cind].style.webkitTransition='0' ;
							}
						}
						var cy = this.datainfo[di].y ;
						if ( this.options.infiniteUseTransform ) {
							this.cells[cind].style[utils.style.transform] = 'translate(0, ' + cy + 'px)' + this.translateZ;
						} else {
							this.cells[cind].style.top = cy + 'px';
						}
					}
					// remove invisible cell's animation.
					if(this.changingModeAnimation)
					{
						for(var cind2 = icol ; cind2<30 ; cind2+=2 )
						{
							if( this.cells[cind2].dindex >= this.lrDataIndex[icol][vis0i] && this.cells[cind2].dindex<=this.lrDataIndex[icol][vis1i]) 
								continue ;
							this.cells[cind2].style.webkitTransition='0' ;
							this.cells[cind2].style.transition='0' ;
						}
					}
				}
			}				
		}//two end.
		//
		if(this.changingModeAnimation) this.changingModeAnimation=false ;

		var sbtm = Math.max(this.calScrollHeightMax(),this.wrapper.offsetHeight) ;
		if( this.pullCell._scrollBottom != sbtm )
		{
			this.pullCell._scrollBottom = sbtm ;
			this.pullCell.style.top = this.pullCell._scrollBottom+'px' ;
		}

		// push and pull stuffs:
		if( this.pushState==0 && this.pullState==0 )//push start ;
		{
			if( this.initiated > 0 )
			{
				if( this.y > this.options.pushTriggerOffset && this.pushEnable )
				{// trigger push
					this.pushState = 1; 
				}else if( this.maxScrollY - this.y > this.options.pullTriggerOffset
								&& this.pullEnable )
				{// trigger pull
					this.pullState = 1 ;
				}
			}
		}
		else if( this.pushState==0 && this.pullState==3 )
		{
			if( this.initiated > 0 && this.y > this.options.pushTriggerOffset && this.pushEnable )
			{// trigger push
				this.pushState = 1; 
			}
		}
		else if( this.pushState==1  )//push release
		{
			if(this.y>0 && this.y < this.options.pushTriggerOffset && this.pushEnable)
			{// cancel trigger.
				this.pushState = 0; 
			}
		}
		else if( this.pullState==1 && this.pullEnable)//pull release
		{
			if( this.maxScrollY - this.y < this.options.pullTriggerOffset )
			{//cancel trigger.
				this.pullState=0 ;
			}
		}


		if( this.pushState!=this.pushState0 && this.pushEnable )
		{//push pull state changed.
			if( this.pushState==0 )//push start ;
			{
				this.pushCell.innerHTML=this.options.pushStartHtml ;
			}
			else if( this.pushState==1 )//push release
			{
				this.pushCell.innerHTML=this.options.pushReleaseHtml ;
			}
			else if( this.pushState==2 )//push loading
			{
				this.pushCell.innerHTML=this.options.pushLoadingHtml ;
			}
			this.pushState0 = this.pushState ;
		} 
		if( this.pullState != this.pullState0 && this.pullEnable )
		{
			if( this.pullState==0 )//pull start
			{
				this.pullCell.innerHTML=this.options.pullStartHtml ;
			}
			else if( this.pullState==1 )//pull release
			{
				this.pullCell.innerHTML=this.options.pullReleaseHtml ;
			}
			else if( this.pullState==2 )//pull loading
			{
				this.pullCell.innerHTML=this.options.pullLoadingHtml ;
			}
			else if( this.pullState==3 )//pull nothing
			{
				this.pullCell.innerHTML=this.options.pullNothingHtml ;
			}
			this.pullState0 = this.pullState ;
		}
	},
	setPushEnable:function(usePush)
	{
		if( usePush && this.pushEnable == false )
		{
			this.pushEnable = true ;
			this.pushState = 0 ;
			this.pushState0=-1 ;
		}else if( usePush==false && this.pushEnable )
		{
			this.pushEnable = false ;
			this.pushState = 0 ;
			this.pushState0 = 0 ;
			this.pushCell.innerHTML = '' ;
		}
	},
	setPullEnable:function(usePull)
	{
		if( usePull && this.pullEnable==false )
		{
			this.pullEnable = true ;
			this.pullState = 0 ;
			this.pullState0 = -1 ;
		}else if( usePull==false && this.pullEnable )
		{
			this.pullEnable = false ;
			this.pullState = 0 ;
			this.pullState0 = 0 ;
			this.pullCell.innerHTML = '' ;
		}
	},
	lastDataCount:[0,0],
	cleanCells:function(){
		for(var i = 0 ; i<30 ; i++ )
		{
			this.cells[i].innerHTML= '' ;
			this.cells[i].dindex = -1 ;
			this.cells[i].style.height = '0px' ;
			if ( this.options.infiniteUseTransform ) {
				this.cells[i].style[utils.style.transform] = 'translate(0,0)' + this.translateZ;
			} else {
				this.cells[i].style.top = '0px';
			}
			this.cells[i].style.webkitTransition='0' ;
			this.cells[i].style.transition='0' ;
		}	
	},
	cleanDataInfo:function()
	{
		this.datainfo = [] ;
		this.lrDataIndex[0] = [] ;
		this.lrDataIndex[1] = [] ;
	},
	getCellElementByDataIndex:function(index)
	{
		for(var ic = 0 ; ic<30 ; ic++ )
		{
			if( this.cells[ic].dindex == index )
				return this.cells[ic];
		}
		return null ;
	},
	updateDataInfo:function(force)
	{
		var forceUpdate = (typeof(force)!=='undefined')?force:false ;
		var len0 = this.datainfo.length ;
		var len1 = this.delegate.getDataCount() ;
		if(forceUpdate || len0>len1 )
		{
			this.cleanDataInfo() ;
			this.cleanCells() ;
			len0 = 0 ;
		} 
		var btmDi = this.getBottomDataInfo() ;
		if( len0 < len1 )
		{
			if(this.two==false)
			{//single mode.
				var btm = 0 ; 
				var icell = -1 ; 
				if(btmDi[0]!=null){ icell = btmDi[0].icell ; btm = btmDi[0].y+btmDi[0].h ;} 
				for( var i = len0 ; i < len1 ; i++ )
				{
					icell++ ; if( icell==30 ) icell=0 ;
					var h = this.delegate.onCellHeight(i) ;
					var o = {y:btm,h:h,icell:icell,lr:0} ;
					this.datainfo[i] = o ;
					btm += h ;
				}
			}//single mode end.
			else
			{//two column mode.

				var btm = [0,0] ; 
				var icell=[-2,-1] ;
				for(var il = 0 ; il<2 ; il++ )
					if(btmDi[il]!=null){ icell[il] = btmDi[il].icell ; btm[il] = btmDi[il].y+btmDi[il].h ;} 
				for( var i = len0 ; i < len1 ; i++ )
				{
					var h = this.delegate.onCellHeight(i) ;
					//which side is shorter?
					if(btm[0]<=btm[1])
					{//left is lower.
						icell[0]+=2 ; if( icell[0]==30 ) icell[0]=0 ;
						var o =  {y:btm[0],h:h,icell:icell[0],lr:0} ;
						this.datainfo[i] = o ;
						this.lrDataIndex[0].push(i) ;
						btm[0]+=h ;
					}else
					{//right is lower.
						icell[1]+=2 ; if( icell[1]==31 ) icell[1]=1 ;
						var o =  {y:btm[1],h:h,icell:icell[1],lr:1} ;
						this.datainfo[i] = o ;
						this.lrDataIndex[1].push(i) ;
						btm[1]+=h ;
					}
				}

			}//two column mode end.
		}// len0 < len1 end.		
	},
	getBottomDataInfo:function()
	{
		var len = this.datainfo.length ;
		if( this.two==false )
		{//single column mode.
			if( len>0 )
			{
				var bobj = this.datainfo[len-1] ;
				return [bobj,bobj] ;
			}
			return [null,null] ;
		}else
		{//two column mode.
			var c = len-1 ;
			var left=null ;
			var right=null ;
			while( c >= 0 && (left==null||right==null) )
			{
				var di = this.datainfo[c] ;
				if( di.lr == 0 && left==null ){ left=di;} 
				else if( di.lr == 1 && right==null){ right=di;}
				c-- ;
			}
			return [left,right] ;
		}
	},
	calScrollHeight:function()
	{	
		var btmDi = this.getBottomDataInfo() ;
		var sh = [0,0] ;
		if( btmDi[0] != null ) sh[0] = btmDi[0].y+btmDi[0].h ;
		if( btmDi[1] != null ) sh[1] = btmDi[1].y+btmDi[1].h ;
		return sh ;
	},
	calScrollHeightMax:function()
	{	
		var sh = this.calScrollHeight() ;
		return Math.max(sh[0],sh[1]) ;
	},
	changingModeAnimation:false ,
	setColumnMode:function(useTwo,useAnim)//false-single, true-double.
	{
		//if( this.changingModeAnimation ) return ;//wait for last transiton.
		var full = this.wrapperWidth ; //window.innerWidth ;
		var half = parseInt(full/2) ;
		if(useTwo==false && this.two )
		{//change one column mode. 2->1
			//old double position.
			var oldLri = this.midIndexbinSearch(-this.y)[0] ;
			var oldTopDIndex = -1 ;
			var cy0 = 0 ;
			if( oldLri>=0 && oldLri<this.lrDataIndex[0].length )
			{
				oldTopDIndex = this.lrDataIndex[0][oldLri] ;
				cy0 = this.datainfo[oldTopDIndex].y + this.y ;
			}	
			//old end.
			this.two = false ;
			this.changingModeAnimation = useAnim || false ;
			this.updateDataInfo(true) ;
			this.updateMaxScrollY() ;
			//scroll new position.
			var newty = 9999 ;
			if( oldTopDIndex>=0 && oldTopDIndex<this.datainfo.length )
			{
				var cy1 = this.datainfo[oldTopDIndex].y + this.y ;
				newty = this.y-(cy1-cy0) ;
				console.log('2->1:ty,di,cy0,cy1,nty:'+this.y+','+oldTopDIndex+','+cy0+','+cy1+','+newty) ;
				this.scrollTo(0,newty,200) ; //no anim.
			}//scroll new end.

			var animstr = '0' ;
			if( this.changingModeAnimation ) {animstr='0.5s all';} 
			for(var i = 0 ; i<30 ; i++ )
			{
				this.cells[i].style.transition = animstr ;
				this.cells[i].style.webkitTransition = animstr ;
				this.cells[i].style.left = '0px' ;
				this.cells[i].style.width = full+'px' ;
			}
			
		}else if( useTwo && this.two==false )
		{//change two column mode. 1->2
			//old single position.
			var oldTop2 = this.midIndexbinSearch(-this.y) ;
			console.log('1->2:oldTop2:'+oldTop2[0]) ;
			var oldTopDIndex = oldTop2[0] ;
			var cy0 = 0 ;
			if( oldTopDIndex>=0 && oldTopDIndex<this.datainfo.length )
			{
				if( oldTop2[1]>=0 && oldTop2[1]<this.datainfo.length )
					if( this.datainfo[oldTop2[1]].y < this.datainfo[oldTop2[0]].y  )
					 oldTopDIndex = oldTop2[1] ;
				cy0 = this.datainfo[oldTopDIndex].y + this.y ;
				

			}	
			//old end.
			this.two = true ;
			this.changingModeAnimation = useAnim || false ;		
			this.updateDataInfo(true) ;
			this.updateMaxScrollY() ;
			//scroll new position.
			if( oldTopDIndex>=0 && oldTopDIndex<this.datainfo.length )
			{
				var cy1 = this.datainfo[oldTopDIndex].y + this.y ;
				var newty = this.y-(cy1-cy0) ;
				console.log('1->2:ty,di,cy0,cy1,nty:'+this.y+','+oldTopDIndex+','+cy0+','+cy1+','+newty) ;
				this.scrollTo(0,newty,200) ; //no anim.
			}//scroll new end. 
			//here. if one->two the cell go to right,then two->one can not go back to that position.


			var animstr = '0' ;
			if( this.changingModeAnimation ) {animstr='0.5s all';} 
			for(var i = 0 ; i<30 ; i++ )
			{
				this.cells[i].style.transition = animstr ;
				this.cells[i].style.webkitTransition = animstr ;
				if( i%2==0 )
					this.cells[i].style.left = '0px' ;
				else
					this.cells[i].style.left = half+'px' ;
				this.cells[i].style.width = half+'px' ;
			}
		}
	},
	isTwoColumnMode:function(){
		return this.two ;
	},
	calVisibleCellIndexRange:function()
	{
		var ty = this.y ;
		var wh = this.wrapperHeight ;
		var wtsY = -ty ;
		var wbsY = wtsY+wh ;
		if( this.two==false )
		{//single
			var ind0 = Math.max(this.midIndexbinSearch(wtsY)[0]-1,0) ;
			var ind1 = Math.min(this.midIndexbinSearch(wbsY)[0],this.datainfo.length-1) ;
			return [ind0,ind1] ;
		}else
		{//double
			var ind0 = Math.max(this.midIndexbinSearch(wtsY)[0]-1,0) ;//left
			var ind1 = Math.min(this.midIndexbinSearch(wbsY)[0],this.lrDataIndex[0].length-1) ;
			var ind2 = Math.max(this.midIndexbinSearch(wtsY)[1]-1,0) ;//right
			var ind3 = Math.min(this.midIndexbinSearch(wbsY)[1],this.lrDataIndex[1].length-1) ;
			return [ind0,ind1,ind2,ind3] ;
		}
	},

	































	updateContent: function (els) {
		if ( this.infiniteCache === undefined ) {
			return;
		}

		for ( var i = 0, l = els.length; i < l; i++ ) {
			//this.options.dataFiller.call(this, els[i], this.infiniteCache[els[i]._phase]);
			//this.options.delegate.onData.call(this,els[i],els[i]._phase) ;
		}
	},

	updateCache: function (start, data) {
		var firstRun = this.infiniteCache === undefined;

		this.infiniteCache = {};

		for ( var i = 0, l = data.length; i < l; i++ ) {
			this.infiniteCache[start++] = data[i];
		}

		if ( firstRun ) {
			this.updateContent(this.infiniteElements);
		}

	},


	handleEvent: function (e) {
		switch ( e.type ) {
			case 'touchstart':
			case 'pointerdown':
			case 'MSPointerDown':
			case 'mousedown':
				this._start(e);
				break;
			case 'touchmove':
			case 'pointermove':
			case 'MSPointerMove':
			case 'mousemove':
				this._move(e);
				break;
			case 'touchend':
			case 'pointerup':
			case 'MSPointerUp':
			case 'mouseup':
			case 'touchcancel':
			case 'pointercancel':
			case 'MSPointerCancel':
			case 'mousecancel':
				this._end(e);
				break;
			case 'orientationchange':
			case 'resize':
				this._resize();
				break;
			case 'transitionend':
			case 'webkitTransitionEnd':
			case 'oTransitionEnd':
			case 'MSTransitionEnd':
				this._transitionEnd(e);
				break;
			case 'wheel':
			case 'DOMMouseScroll':
			case 'mousewheel':
				this._wheel(e);
				break;
			case 'keydown':
				this._key(e);
				break;
			case 'click':
				if ( !e._constructed ) {
					e.preventDefault();
					e.stopPropagation();
				}
				break;
		}
	}
};
IScroll.utils = utils;

if ( typeof module != 'undefined' && module.exports ) {
	module.exports = IScroll;
} else {
	window.IScroll = IScroll;
}

})(window, document, Math);