/*!
 * jQuery Migrate - v3.3.2 - 2020-11-18T08:29Z
 * Copyright OpenJS Foundation and other contributors
 */
( function( factory ) {
	"use strict";

	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], function( jQuery ) {
			return factory( jQuery, window );
		} );
	} else if ( typeof module === "object" && module.exports ) {

		// Node/CommonJS
		// eslint-disable-next-line no-undef
		module.exports = factory( require( "jquery" ), window );
	} else {

		// Browser globals
		factory( jQuery, window );
	}
} )( function( jQuery, window ) {
"use strict";

jQuery.migrateVersion = "3.3.2";

// Returns 0 if v1 == v2, -1 if v1 < v2, 1 if v1 > v2
function compareVersions( v1, v2 ) {
	var i,
		rVersionParts = /^(\d+)\.(\d+)\.(\d+)/,
		v1p = rVersionParts.exec( v1 ) || [ ],
		v2p = rVersionParts.exec( v2 ) || [ ];

	for ( i = 1; i <= 3; i++ ) {
		if ( +v1p[ i ] > +v2p[ i ] ) {
			return 1;
		}
		if ( +v1p[ i ] < +v2p[ i ] ) {
			return -1;
		}
	}
	return 0;
}

function jQueryVersionSince( version ) {
	return compareVersions( jQuery.fn.jquery, version ) >= 0;
}

( function() {

	// Support: IE9 only
	// IE9 only creates console object when dev tools are first opened
	// IE9 console is a host object, callable but doesn't have .apply()
	if ( !window.console || !window.console.log ) {
		return;
	}

	// Need jQuery 3.0.0+ and no older Migrate loaded
	if ( !jQuery || !jQueryVersionSince( "3.0.0" ) ) {
		window.console.log( "JQMIGRATE: jQuery 3.0.0+ REQUIRED" );
	}
	if ( jQuery.migrateWarnings ) {
		window.console.log( "JQMIGRATE: Migrate plugin loaded multiple times" );
	}

	// Show a message on the console so devs know we're active
	window.console.log( "JQMIGRATE: Migrate is installed" +
		( jQuery.migrateMute ? "" : " with logging active" ) +
		", version " + jQuery.migrateVersion );

} )();

var warnedAbout = {};

// By default each warning is only reported once.
jQuery.migrateDeduplicateWarnings = true;

// List of warnings already given; public read only
jQuery.migrateWarnings = [];

// Set to false to disable traces that appear with warnings
if ( jQuery.migrateTrace === undefined ) {
	jQuery.migrateTrace = true;
}

// Forget any warnings we've already given; public
jQuery.migrateReset = function() {
	warnedAbout = {};
	jQuery.migrateWarnings.length = 0;
};

function migrateWarn( msg ) {
	var console = window.console;
	if ( !jQuery.migrateDeduplicateWarnings || !warnedAbout[ msg ] ) {
		warnedAbout[ msg ] = true;
		jQuery.migrateWarnings.push( msg );
		if ( console && console.warn && !jQuery.migrateMute ) {
			console.warn( "JQMIGRATE: " + msg );
			if ( jQuery.migrateTrace && console.trace ) {
				console.trace();
			}
		}
	}
}

function migrateWarnProp( obj, prop, value, msg ) {
	Object.defineProperty( obj, prop, {
		configurable: true,
		enumerable: true,
		get: function() {
			migrateWarn( msg );
			return value;
		},
		set: function( newValue ) {
			migrateWarn( msg );
			value = newValue;
		}
	} );
}

function migrateWarnFunc( obj, prop, newFunc, msg ) {
	obj[ prop ] = function() {
		migrateWarn( msg );
		return newFunc.apply( this, arguments );
	};
}

if ( window.document.compatMode === "BackCompat" ) {

	// JQuery has never supported or tested Quirks Mode
	migrateWarn( "jQuery is not compatible with Quirks Mode" );
}

var findProp,
	class2type = {},
	oldInit = jQuery.fn.init,
	oldFind = jQuery.find,

	rattrHashTest = /\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/,
	rattrHashGlob = /\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/g,

	// Support: Android <=4.0 only
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

jQuery.fn.init = function( arg1 ) {
	var args = Array.prototype.slice.call( arguments );

	if ( typeof arg1 === "string" && arg1 === "#" ) {

		// JQuery( "#" ) is a bogus ID selector, but it returned an empty set before jQuery 3.0
		migrateWarn( "jQuery( '#' ) is not a valid selector" );
		args[ 0 ] = [];
	}

	return oldInit.apply( this, args );
};
jQuery.fn.init.prototype = jQuery.fn;

jQuery.find = function( selector ) {
	var args = Array.prototype.slice.call( arguments );

	// Support: PhantomJS 1.x
	// String#match fails to match when used with a //g RegExp, only on some strings
	if ( typeof selector === "string" && rattrHashTest.test( selector ) ) {

		// The nonstandard and undocumented unquoted-hash was removed in jQuery 1.12.0
		// First see if qS thinks it's a valid selector, if so avoid a false positive
		try {
			window.document.querySelector( selector );
		} catch ( err1 ) {

			// Didn't *look* valid to qSA, warn and try quoting what we think is the value
			selector = selector.replace( rattrHashGlob, function( _, attr, op, value ) {
				return "[" + attr + op + "\"" + value + "\"]";
			} );

			// If the regexp *may* have created an invalid selector, don't update it
			// Note that there may be false alarms if selector uses jQuery extensions
			try {
				window.document.querySelector( selector );
				migrateWarn( "Attribute selector with '#' must be quoted: " + args[ 0 ] );
				args[ 0 ] = selector;
			} catch ( err2 ) {
				migrateWarn( "Attribute selector with '#' was not fixed: " + args[ 0 ] );
			}
		}
	}

	return oldFind.apply( this, args );
};

// Copy properties attached to original jQuery.find method (e.g. .attr, .isXML)
for ( findProp in oldFind ) {
	if ( Object.prototype.hasOwnProperty.call( oldFind, findProp ) ) {
		jQuery.find[ findProp ] = oldFind[ findProp ];
	}
}

// The number of elements contained in the matched element set
migrateWarnFunc( jQuery.fn, "size", function() {
	return this.length;
},
"jQuery.fn.size() is deprecated and removed; use the .length property" );

migrateWarnFunc( jQuery, "parseJSON", function() {
	return JSON.parse.apply( null, arguments );
},
"jQuery.parseJSON is deprecated; use JSON.parse" );

migrateWarnFunc( jQuery, "holdReady", jQuery.holdReady,
	"jQuery.holdReady is deprecated" );

migrateWarnFunc( jQuery, "unique", jQuery.uniqueSort,
	"jQuery.unique is deprecated; use jQuery.uniqueSort" );

// Now jQuery.expr.pseudos is the standard incantation
migrateWarnProp( jQuery.expr, "filters", jQuery.expr.pseudos,
	"jQuery.expr.filters is deprecated; use jQuery.expr.pseudos" );
migrateWarnProp( jQuery.expr, ":", jQuery.expr.pseudos,
	"jQuery.expr[':'] is deprecated; use jQuery.expr.pseudos" );

// Prior to jQuery 3.1.1 there were internal refs so we don't warn there
if ( jQueryVersionSince( "3.1.1" ) ) {
	migrateWarnFunc( jQuery, "trim", function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},
	"jQuery.trim is deprecated; use String.prototype.trim" );
}

// Prior to jQuery 3.2 there were internal refs so we don't warn there
if ( jQueryVersionSince( "3.2.0" ) ) {
	migrateWarnFunc( jQuery, "nodeName", function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},
	"jQuery.nodeName is deprecated" );

	migrateWarnFunc( jQuery, "isArray", Array.isArray,
		"jQuery.isArray is deprecated; use Array.isArray"
	);
}

if ( jQueryVersionSince( "3.3.0" ) ) {

	migrateWarnFunc( jQuery, "isNumeric", function( obj ) {

			// As of jQuery 3.0, isNumeric is limited to
			// strings and numbers (primitives or objects)
			// that can be coerced to finite numbers (gh-2662)
			var type = typeof obj;
			return ( type === "number" || type === "string" ) &&

				// parseFloat NaNs numeric-cast false positives ("")
				// ...but misinterprets leading-number strings, e.g. hex literals ("0x...")
				// subtraction forces infinities to NaN
				!isNaN( obj - parseFloat( obj ) );
		},
		"jQuery.isNumeric() is deprecated"
	);

	// Populate the class2type map
	jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".
		split( " " ),
	function( _, name ) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	} );

	migrateWarnFunc( jQuery, "type", function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}

		// Support: Android <=2.3 only (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ Object.prototype.toString.call( obj ) ] || "object" :
			typeof obj;
	},
	"jQuery.type is deprecated" );

	migrateWarnFunc( jQuery, "isFunction",
		function( obj ) {
			return typeof obj === "function";
		},
		"jQuery.isFunction() is deprecated" );

	migrateWarnFunc( jQuery, "isWindow",
		function( obj ) {
			return obj != null && obj === obj.window;
		},
		"jQuery.isWindow() is deprecated"
	);
}

// Support jQuery slim which excludes the ajax module
if ( jQuery.ajax ) {

var oldAjax = jQuery.ajax,
	rjsonp = /(=)\?(?=&|$)|\?\?/;

jQuery.ajax = function( ) {
	var jQXHR = oldAjax.apply( this, arguments );

	// Be sure we got a jQXHR (e.g., not sync)
	if ( jQXHR.promise ) {
		migrateWarnFunc( jQXHR, "success", jQXHR.done,
			"jQXHR.success is deprecated and removed" );
		migrateWarnFunc( jQXHR, "error", jQXHR.fail,
			"jQXHR.error is deprecated and removed" );
		migrateWarnFunc( jQXHR, "complete", jQXHR.always,
			"jQXHR.complete is deprecated and removed" );
	}

	return jQXHR;
};

// Only trigger the logic in jQuery <4 as the JSON-to-JSONP auto-promotion
// behavior is gone in jQuery 4.0 and as it has security implications, we don't
// want to restore the legacy behavior.
if ( !jQueryVersionSince( "4.0.0" ) ) {

	// Register this prefilter before the jQuery one. Otherwise, a promoted
	// request is transformed into one with the script dataType and we can't
	// catch it anymore.
	jQuery.ajaxPrefilter( "+json", function( s ) {

		// Warn if JSON-to-JSONP auto-promotion happens.
		if ( s.jsonp !== false && ( rjsonp.test( s.url ) ||
				typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data )
		) ) {
			migrateWarn( "JSON-to-JSONP auto-promotion is deprecated" );
		}
	} );
}

}

var oldRemoveAttr = jQuery.fn.removeAttr,
	oldToggleClass = jQuery.fn.toggleClass,
	rmatchNonSpace = /\S+/g;

jQuery.fn.removeAttr = function( name ) {
	var self = this;

	jQuery.each( name.match( rmatchNonSpace ), function( _i, attr ) {
		if ( jQuery.expr.match.bool.test( attr ) ) {
			migrateWarn( "jQuery.fn.removeAttr no longer sets boolean properties: " + attr );
			self.prop( attr, false );
		}
	} );

	return oldRemoveAttr.apply( this, arguments );
};

jQuery.fn.toggleClass = function( state ) {

	// Only deprecating no-args or single boolean arg
	if ( state !== undefined && typeof state !== "boolean" ) {
		return oldToggleClass.apply( this, arguments );
	}

	migrateWarn( "jQuery.fn.toggleClass( boolean ) is deprecated" );

	// Toggle entire class name of each element
	return this.each( function() {
		var className = this.getAttribute && this.getAttribute( "class" ) || "";

		if ( className ) {
			jQuery.data( this, "__className__", className );
		}

		// If the element has a class name or if we're passed `false`,
		// then remove the whole classname (if there was one, the above saved it).
		// Otherwise bring back whatever was previously saved (if anything),
		// falling back to the empty string if nothing was stored.
		if ( this.setAttribute ) {
			this.setAttribute( "class",
				className || state === false ?
				"" :
				jQuery.data( this, "__className__" ) || ""
			);
		}
	} );
};

function camelCase( string ) {
	return string.replace( /-([a-z])/g, function( _, letter ) {
		return letter.toUpperCase();
	} );
}

var oldFnCss,
	internalSwapCall = false,
	ralphaStart = /^[a-z]/,

	// The regex visualized:
	//
	//                         /----------\
	//                        |            |    /-------\
	//                        |  / Top  \  |   |         |
	//         /--- Border ---+-| Right  |-+---+- Width -+---\
	//        |                 | Bottom |                    |
	//        |                  \ Left /                     |
	//        |                                               |
	//        |                              /----------\     |
	//        |          /-------------\    |            |    |- END
	//        |         |               |   |  / Top  \  |    |
	//        |         |  / Margin  \  |   | | Right  | |    |
	//        |---------+-|           |-+---+-| Bottom |-+----|
	//        |            \ Padding /         \ Left /       |
	// BEGIN -|                                               |
	//        |                /---------\                    |
	//        |               |           |                   |
	//        |               |  / Min \  |    / Width  \     |
	//         \--------------+-|       |-+---|          |---/
	//                           \ Max /       \ Height /
	rautoPx = /^(?:Border(?:Top|Right|Bottom|Left)?(?:Width|)|(?:Margin|Padding)?(?:Top|Right|Bottom|Left)?|(?:Min|Max)?(?:Width|Height))$/;

// If this version of jQuery has .swap(), don't false-alarm on internal uses
if ( jQuery.swap ) {
	jQuery.each( [ "height", "width", "reliableMarginRight" ], function( _, name ) {
		var oldHook = jQuery.cssHooks[ name ] && jQuery.cssHooks[ name ].get;

		if ( oldHook ) {
			jQuery.cssHooks[ name ].get = function() {
				var ret;

				internalSwapCall = true;
				ret = oldHook.apply( this, arguments );
				internalSwapCall = false;
				return ret;
			};
		}
	} );
}

jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	if ( !internalSwapCall ) {
		migrateWarn( "jQuery.swap() is undocumented and deprecated" );
	}

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};

if ( jQueryVersionSince( "3.4.0" ) && typeof Proxy !== "undefined" ) {

	jQuery.cssProps = new Proxy( jQuery.cssProps || {}, {
		set: function() {
			migrateWarn( "JQMIGRATE: jQuery.cssProps is deprecated" );
			return Reflect.set.apply( this, arguments );
		}
	} );
}

// Create a dummy jQuery.cssNumber if missing. It won't be used by jQuery but
// it will prevent code adding new keys to it unconditionally from crashing.
if ( !jQuery.cssNumber ) {
	jQuery.cssNumber = {};
}

function isAutoPx( prop ) {

	// The first test is used to ensure that:
	// 1. The prop starts with a lowercase letter (as we uppercase it for the second regex).
	// 2. The prop is not empty.
	return ralphaStart.test( prop ) &&
		rautoPx.test( prop[ 0 ].toUpperCase() + prop.slice( 1 ) );
}

oldFnCss = jQuery.fn.css;

jQuery.fn.css = function( name, value ) {
	var camelName,
		origThis = this;
	if ( name && typeof name === "object" && !Array.isArray( name ) ) {
		jQuery.each( name, function( n, v ) {
			jQuery.fn.css.call( origThis, n, v );
		} );
		return this;
	}
	if ( typeof value === "number" ) {
		camelName = camelCase( name );
		if ( !isAutoPx( camelName ) && !jQuery.cssNumber[ camelName ] ) {
			migrateWarn( "Number-typed values are deprecated for jQuery.fn.css( \"" +
				name + "\", value )" );
		}
	}

	return oldFnCss.apply( this, arguments );
};

var oldData = jQuery.data;

jQuery.data = function( elem, name, value ) {
	var curData, sameKeys, key;

	// Name can be an object, and each entry in the object is meant to be set as data
	if ( name && typeof name === "object" && arguments.length === 2 ) {
		curData = jQuery.hasData( elem ) && oldData.call( this, elem );
		sameKeys = {};
		for ( key in name ) {
			if ( key !== camelCase( key ) ) {
				migrateWarn( "jQuery.data() always sets/gets camelCased names: " + key );
				curData[ key ] = name[ key ];
			} else {
				sameKeys[ key ] = name[ key ];
			}
		}

		oldData.call( this, elem, sameKeys );

		return name;
	}

	// If the name is transformed, look for the un-transformed name in the data object
	if ( name && typeof name === "string" && name !== camelCase( name ) ) {
		curData = jQuery.hasData( elem ) && oldData.call( this, elem );
		if ( curData && name in curData ) {
			migrateWarn( "jQuery.data() always sets/gets camelCased names: " + name );
			if ( arguments.length > 2 ) {
				curData[ name ] = value;
			}
			return curData[ name ];
		}
	}

	return oldData.apply( this, arguments );
};

// Support jQuery slim which excludes the effects module
if ( jQuery.fx ) {

var intervalValue, intervalMsg,
	oldTweenRun = jQuery.Tween.prototype.run,
	linearEasing = function( pct ) {
		return pct;
	};

jQuery.Tween.prototype.run = function( ) {
	if ( jQuery.easing[ this.easing ].length > 1 ) {
		migrateWarn(
			"'jQuery.easing." + this.easing.toString() + "' should use only one argument"
		);

		jQuery.easing[ this.easing ] = linearEasing;
	}

	oldTweenRun.apply( this, arguments );
};

intervalValue = jQuery.fx.interval || 13;
intervalMsg = "jQuery.fx.interval is deprecated";

// Support: IE9, Android <=4.4
// Avoid false positives on browsers that lack rAF
// Don't warn if document is hidden, jQuery uses setTimeout (#292)
if ( window.requestAnimationFrame ) {
	Object.defineProperty( jQuery.fx, "interval", {
		configurable: true,
		enumerable: true,
		get: function() {
			if ( !window.document.hidden ) {
				migrateWarn( intervalMsg );
			}
			return intervalValue;
		},
		set: function( newValue ) {
			migrateWarn( intervalMsg );
			intervalValue = newValue;
		}
	} );
}

}

var oldLoad = jQuery.fn.load,
	oldEventAdd = jQuery.event.add,
	originalFix = jQuery.event.fix;

jQuery.event.props = [];
jQuery.event.fixHooks = {};

migrateWarnProp( jQuery.event.props, "concat", jQuery.event.props.concat,
	"jQuery.event.props.concat() is deprecated and removed" );

jQuery.event.fix = function( originalEvent ) {
	var event,
		type = originalEvent.type,
		fixHook = this.fixHooks[ type ],
		props = jQuery.event.props;

	if ( props.length ) {
		migrateWarn( "jQuery.event.props are deprecated and removed: " + props.join() );
		while ( props.length ) {
			jQuery.event.addProp( props.pop() );
		}
	}

	if ( fixHook && !fixHook._migrated_ ) {
		fixHook._migrated_ = true;
		migrateWarn( "jQuery.event.fixHooks are deprecated and removed: " + type );
		if ( ( props = fixHook.props ) && props.length ) {
			while ( props.length ) {
				jQuery.event.addProp( props.pop() );
			}
		}
	}

	event = originalFix.call( this, originalEvent );

	return fixHook && fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
};

jQuery.event.add = function( elem, types ) {

	// This misses the multiple-types case but that seems awfully rare
	if ( elem === window && types === "load" && window.document.readyState === "complete" ) {
		migrateWarn( "jQuery(window).on('load'...) called after load event occurred" );
	}
	return oldEventAdd.apply( this, arguments );
};

jQuery.each( [ "load", "unload", "error" ], function( _, name ) {

	jQuery.fn[ name ] = function() {
		var args = Array.prototype.slice.call( arguments, 0 );

		// If this is an ajax load() the first arg should be the string URL;
		// technically this could also be the "Anything" arg of the event .load()
		// which just goes to show why this dumb signature has been deprecated!
		// jQuery custom builds that exclude the Ajax module justifiably die here.
		if ( name === "load" && typeof args[ 0 ] === "string" ) {
			return oldLoad.apply( this, args );
		}

		migrateWarn( "jQuery.fn." + name + "() is deprecated" );

		args.splice( 0, 0, name );
		if ( arguments.length ) {
			return this.on.apply( this, args );
		}

		// Use .triggerHandler here because:
		// - load and unload events don't need to bubble, only applied to window or image
		// - error event should not bubble to window, although it does pre-1.7
		// See http://bugs.jquery.com/ticket/11820
		this.triggerHandler.apply( this, args );
		return this;
	};

} );

jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function( _i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		migrateWarn( "jQuery.fn." + name + "() event shorthand is deprecated" );
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
} );

// Trigger "ready" event only once, on document ready
jQuery( function() {
	jQuery( window.document ).triggerHandler( "ready" );
} );

jQuery.event.special.ready = {
	setup: function() {
		if ( this === window.document ) {
			migrateWarn( "'ready' event is deprecated" );
		}
	}
};

jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		migrateWarn( "jQuery.fn.bind() is deprecated" );
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		migrateWarn( "jQuery.fn.unbind() is deprecated" );
		return this.off( types, null, fn );
	},
	delegate: function( selector, types, data, fn ) {
		migrateWarn( "jQuery.fn.delegate() is deprecated" );
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		migrateWarn( "jQuery.fn.undelegate() is deprecated" );
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	},
	hover: function( fnOver, fnOut ) {
		migrateWarn( "jQuery.fn.hover() is deprecated" );
		return this.on( "mouseenter", fnOver ).on( "mouseleave", fnOut || fnOver );
	}
} );

var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
	origHtmlPrefilter = jQuery.htmlPrefilter,
	makeMarkup = function( html ) {
		var doc = window.document.implementation.createHTMLDocument( "" );
		doc.body.innerHTML = html;
		return doc.body && doc.body.innerHTML;
	},
	warnIfChanged = function( html ) {
		var changed = html.replace( rxhtmlTag, "<$1></$2>" );
		if ( changed !== html && makeMarkup( html ) !== makeMarkup( changed ) ) {
			migrateWarn( "HTML tags must be properly nested and closed: " + html );
		}
	};

jQuery.UNSAFE_restoreLegacyHtmlPrefilter = function() {
	jQuery.htmlPrefilter = function( html ) {
		warnIfChanged( html );
		return html.replace( rxhtmlTag, "<$1></$2>" );
	};
};

jQuery.htmlPrefilter = function( html ) {
	warnIfChanged( html );
	return origHtmlPrefilter( html );
};

var oldOffset = jQuery.fn.offset;

jQuery.fn.offset = function() {
	var elem = this[ 0 ];

	if ( elem && ( !elem.nodeType || !elem.getBoundingClientRect ) ) {
		migrateWarn( "jQuery.fn.offset() requires a valid DOM element" );
		return arguments.length ? this : undefined;
	}

	return oldOffset.apply( this, arguments );
};

// Support jQuery slim which excludes the ajax module
// The jQuery.param patch is about respecting `jQuery.ajaxSettings.traditional`
// so it doesn't make sense for the slim build.
if ( jQuery.ajax ) {

var oldParam = jQuery.param;

jQuery.param = function( data, traditional ) {
	var ajaxTraditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;

	if ( traditional === undefined && ajaxTraditional ) {

		migrateWarn( "jQuery.param() no longer uses jQuery.ajaxSettings.traditional" );
		traditional = ajaxTraditional;
	}

	return oldParam.call( this, data, traditional );
};

}

var oldSelf = jQuery.fn.andSelf || jQuery.fn.addBack;

jQuery.fn.andSelf = function() {
	migrateWarn( "jQuery.fn.andSelf() is deprecated and removed, use jQuery.fn.addBack()" );
	return oldSelf.apply( this, arguments );
};

// Support jQuery slim which excludes the deferred module in jQuery 4.0+
if ( jQuery.Deferred ) {

var oldDeferred = jQuery.Deferred,
	tuples = [

		// Action, add listener, callbacks, .then handlers, final state
		[ "resolve", "done", jQuery.Callbacks( "once memory" ),
			jQuery.Callbacks( "once memory" ), "resolved" ],
		[ "reject", "fail", jQuery.Callbacks( "once memory" ),
			jQuery.Callbacks( "once memory" ), "rejected" ],
		[ "notify", "progress", jQuery.Callbacks( "memory" ),
			jQuery.Callbacks( "memory" ) ]
	];

jQuery.Deferred = function( func ) {
	var deferred = oldDeferred(),
		promise = deferred.promise();

	deferred.pipe = promise.pipe = function( /* fnDone, fnFail, fnProgress */ ) {
		var fns = arguments;

		migrateWarn( "deferred.pipe() is deprecated" );

		return jQuery.Deferred( function( newDefer ) {
			jQuery.each( tuples, function( i, tuple ) {
				var fn = typeof fns[ i ] === "function" && fns[ i ];

				// Deferred.done(function() { bind to newDefer or newDefer.resolve })
				// deferred.fail(function() { bind to newDefer or newDefer.reject })
				// deferred.progress(function() { bind to newDefer or newDefer.notify })
				deferred[ tuple[ 1 ] ]( function() {
					var returned = fn && fn.apply( this, arguments );
					if ( returned && typeof returned.promise === "function" ) {
						returned.promise()
							.done( newDefer.resolve )
							.fail( newDefer.reject )
							.progress( newDefer.notify );
					} else {
						newDefer[ tuple[ 0 ] + "With" ](
							this === promise ? newDefer.promise() : this,
							fn ? [ returned ] : arguments
						);
					}
				} );
			} );
			fns = null;
		} ).promise();

	};

	if ( func ) {
		func.call( deferred, deferred );
	}

	return deferred;
};

// Preserve handler of uncaught exceptions in promise chains
jQuery.Deferred.exceptionHook = oldDeferred.exceptionHook;

}

return jQuery;
} );
;
(function(a){'use strict'})(jQuery);
(function(a){'use strict';a(function(){let c=0;a.ajax({type:'POST',dataType:'json',url:bs_vars.ajaxUrl,data:{action:'bs_get_validation_meta'},beforeSend:function(){},success:function(b){b.status==='ok'?(c=b.nonce,a('form.wpcf7-form').append('<input type="hidden" value="'+c+'" name="bs_hf_nonce">'),a('form.wpcf7-form').append('<input type="hidden" value="'+b.expiration+'" name="bs_hf_expiration">'),a('form.wpcf7-form').append('<input type="hidden" value="" name="bs_hf_validation_key" class="bs_hf-validation-key">'),a('form.wpcf7-form').append('<input type="hidden" value="" name="bs_hf_form_id" class="bs_hf-form-id">')):(a('form.wpcf7-form').append('<input type="hidden" value="" name="bs_hf_nonce">'),a('form.wpcf7-form').append('<input type="hidden" value="" name="bs_hf_expiration">'),a('form.wpcf7-form').append('<input type="hidden" value="" name="bs_hf_validation_key" class="bs_hf-validation-key">'),a('form.wpcf7-form').append('<input type="hidden" value="" name="bs_hf_form_id" class="bs_hf-form-id">'))},error:function(a){console.log(a)}});let b=[];a('form.wpcf7-form input').on('focus',function(){d(this)}),a('form.wpcf7-form textarea').on('focus',function(){d(this)});function d(c){const d=a(c).closest("div.wpcf7[role='form']").attr('id');if(a(c).closest('form.wpcf7-form').find('.bs_hf-form-id').val(d),typeof b[d]!='undefined'&&b[d]===!0)return;const e=a(c).closest('form.wpcf7-form').find('[name="bs_hf_expiration"]').val(),f=a(c).closest('form.wpcf7-form').find('[name="bs_hf_nonce"]').val();a.ajax({type:'POST',dataType:'json',url:bs_vars.ajaxUrl,data:{action:'bs_get_validation_key',nonce:f,form_id:d,expiration:e},beforeSend:function(){a(c).closest('form.wpcf7-form').find('input.wpcf7-submit').attr('disable','true')},success:function(e){a(c).closest('form.wpcf7-form').find('.bs_hf-validation-key').val(e.validationKey),e.status==='ok'?b[d]=!0:b[d]=!1},error:function(a){console.log(a),b[d]=!1},complete:function(){a(c).closest('form.wpcf7-form').find('input.wpcf7-submit').attr('disable','false')}})}})})(jQuery);
(function(a){'use strict'})(jQuery);
!function(t){var e={};function n(r){if(e[r])return e[r].exports;var i=e[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)n.d(r,i,function(e){return t[e]}.bind(null,i));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=1)}([function(t,e){t.exports=jQuery},function(t,e,n){n(2),n(6),t.exports=n(4)},function(t,e,n){var r,i,u,s;
/*!
 * @fileOverview TouchSwipe - jQuery Plugin @version 1.6.18 / SANDBOXED VERSION FOR TP
 * @author Matt Bryson http://www.github.com/mattbryson
 * @see https://github.com/mattbryson/TouchSwipe-Jquery-Plugin
 * @see http://labs.rampinteractive.co.uk/touchSwipe/
 * @see http://plugins.jquery.com/project/touchSwipe
 * @license
 * Copyright (c) 2010-2015 Matt Bryson
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */s=function(t){"use strict";var e="left",n="right",r="up",i="down",u="none",s="doubletap",o="longtap",a="horizontal",l="vertical",h="all",f="move",D="end",p="cancel",c="ontouchstart"in window,d=window.navigator.msPointerEnabled&&!window.PointerEvent&&!c,g=(window.PointerEvent||window.navigator.msPointerEnabled)&&!c,_="TouchSwipe";function m(m,v){v=t.extend({},v);var y=c||g||!v.fallbackToMouseEvents,C=y?g?d?"MSPointerDown":"pointerdown":"touchstart":"mousedown",x=y?g?d?"MSPointerMove":"pointermove":"touchmove":"mousemove",F=y?g?d?"MSPointerUp":"pointerup":"touchend":"mouseup",w=y?g?"mouseleave":null:"mouseleave",E=g?d?"MSPointerCancel":"pointercancel":"touchcancel",b=0,T=null,A=null,M=0,O=0,S=0,P=1,B=0,k=0,L=null,N=t(m),R="start",I=0,z={},Y=0,X=0,j=0,V=0,U=0,W=null,q=null;try{N.on(C,G),N.on(E,K)}catch(m){t.error("events not supported "+C+","+E+" on jQuery.swipe")}function G(u){if(!0!==N.data(_+"_intouch")&&!(0<t(u.target).closest(v.excludedElements,N).length)){var s=u.originalEvent?u.originalEvent:u;if(!s.pointerType||"mouse"!=s.pointerType||0!=v.fallbackToMouseEvents){var o,a,l=s.touches,f=l?l[0]:s;return R="start",l?I=l.length:!1!==v.preventDefaultEvents&&u.preventDefault(),k=A=T=null,P=1,B=S=O=M=b=0,(a={})[e]=yt(e),a[n]=yt(n),a.up=yt(r),a[i]=yt(i),L=a,ct(),_t(0,f),!l||I===v.fingers||v.fingers===h||st()?(Y=wt(),2==I&&(_t(1,l[1]),O=S=xt(z[0].start,z[1].start)),(v.swipeStatus||v.pinchStatus)&&(o=tt(s,R))):o=!1,!1===o?(tt(s,R=p),o):(v.hold&&(q=setTimeout(t.proxy((function(){N.trigger("hold",[s.target]),v.hold&&(o=v.hold.call(N,s,s.target))}),this),v.longTapThreshold)),gt(!0),null)}}}function H(s){var o=s.originalEvent?s.originalEvent:s;if(R!==D&&R!==p&&!dt()){var c,d,g,_,m,y,C,x=o.touches,F=mt(x?x[0]:o);if(X=wt(),x&&(I=x.length),v.hold&&clearTimeout(q),R=f,2==I&&(0==O?(_t(1,x[1]),O=S=xt(z[0].start,z[1].start)):(mt(x[1]),S=xt(z[0].end,z[1].end),z[0].end,z[1].end,k=P<1?"out":"in"),P=(S/O*1).toFixed(2),B=Math.abs(O-S)),I===v.fingers||v.fingers===h||!x||st()){if(T=Ft(F.start,F.end),function(t,s){if(!1!==v.preventDefaultEvents)if(v.allowPageScroll===u)t.preventDefault();else{var o="auto"===v.allowPageScroll;switch(s){case e:(v.swipeLeft&&o||!o&&v.allowPageScroll!=a)&&t.preventDefault();break;case n:(v.swipeRight&&o||!o&&v.allowPageScroll!=a)&&t.preventDefault();break;case r:(v.swipeUp&&o||!o&&v.allowPageScroll!=l)&&t.preventDefault();break;case i:(v.swipeDown&&o||!o&&v.allowPageScroll!=l)&&t.preventDefault()}}}(s,A=Ft(F.last,F.end)),y=F.start,C=F.end,b=Math.round(Math.sqrt(Math.pow(C.x-y.x,2)+Math.pow(C.y-y.y,2))),M=Ct(),function(t,e){t!=u&&(e=Math.max(e,vt(t)),L[t].distance=e)}(T,b),c=tt(o,R),!v.triggerOnTouchEnd||v.triggerOnTouchLeave){var w=!0;v.triggerOnTouchLeave&&(g={left:(m=(_=t(_=this)).offset()).left,right:m.left+_.outerWidth(),top:m.top,bottom:m.top+_.outerHeight()},w=(d=F.end).x>g.left&&d.x<g.right&&d.y>g.top&&d.y<g.bottom),!v.triggerOnTouchEnd&&w?R=J(f):v.triggerOnTouchLeave&&!w&&(R=J(D)),R!=p&&R!=D||tt(o,R)}}else tt(o,R=p);!1===c&&tt(o,R=p)}}function Q(t){var e,n=t.originalEvent?t.originalEvent:t,r=n.touches;if(r){if(r.length&&!dt())return e=n,j=wt(),V=e.touches.length+1,!0;if(r.length&&dt())return!0}return dt()&&(I=V),X=wt(),M=Ct(),rt()||!nt()?tt(n,R=p):v.triggerOnTouchEnd||!1===v.triggerOnTouchEnd&&R===f?(!1!==v.preventDefaultEvents&&!1!==t.cancelable&&t.preventDefault(),tt(n,R=D)):!v.triggerOnTouchEnd&&ft()?et(n,R=D,"tap"):R===f&&tt(n,R=p),gt(!1),null}function K(){S=O=Y=X=I=0,P=1,ct(),gt(!1)}function Z(t){var e=t.originalEvent?t.originalEvent:t;v.triggerOnTouchLeave&&tt(e,R=J(D))}function $(){N.off(C,G),N.off(E,K),N.off(x,H),N.off(F,Q),w&&N.off(w,Z),gt(!1)}function J(t){var e=t,n=it(),r=nt(),i=rt();return!n||i?e=p:!r||t!=f||v.triggerOnTouchEnd&&!v.triggerOnTouchLeave?!r&&t==D&&v.triggerOnTouchLeave&&(e=p):e=D,e}function tt(t,e){var n,r=t.touches;return(ot()&&at()||at())&&(n=et(t,e,"swipe")),(ut()&&st()||st())&&!1!==n&&(n=et(t,e,"pinch")),pt()&&Dt()&&!1!==n?n=et(t,e,s):M>v.longTapThreshold&&b<10&&v.longTap&&!1!==n?n=et(t,e,o):1!==I&&c||!(isNaN(b)||b<v.threshold)||!ft()||!1===n||(n=et(t,e,"tap")),e===p&&K(),e===D&&(r&&r.length||K()),n}function et(u,a,l){var h;if("swipe"==l){if(N.trigger("swipeStatus",[a,T||null,b||0,M||0,I,z,A]),v.swipeStatus&&!1===(h=v.swipeStatus.call(N,u,a,T||null,b||0,M||0,I,z,A)))return!1;if(a==D&&ot()){if(clearTimeout(W),clearTimeout(q),N.trigger("swipe",[T,b,M,I,z,A]),v.swipe&&!1===(h=v.swipe.call(N,u,T,b,M,I,z,A)))return!1;switch(T){case e:N.trigger("swipeLeft",[T,b,M,I,z,A]),v.swipeLeft&&(h=v.swipeLeft.call(N,u,T,b,M,I,z,A));break;case n:N.trigger("swipeRight",[T,b,M,I,z,A]),v.swipeRight&&(h=v.swipeRight.call(N,u,T,b,M,I,z,A));break;case r:N.trigger("swipeUp",[T,b,M,I,z,A]),v.swipeUp&&(h=v.swipeUp.call(N,u,T,b,M,I,z,A));break;case i:N.trigger("swipeDown",[T,b,M,I,z,A]),v.swipeDown&&(h=v.swipeDown.call(N,u,T,b,M,I,z,A))}}}if("pinch"==l){if(N.trigger("pinchStatus",[a,k||null,B||0,M||0,I,P,z]),v.pinchStatus&&!1===(h=v.pinchStatus.call(N,u,a,k||null,B||0,M||0,I,P,z)))return!1;if(a==D&&ut())switch(k){case"in":N.trigger("pinchIn",[k||null,B||0,M||0,I,P,z]),v.pinchIn&&(h=v.pinchIn.call(N,u,k||null,B||0,M||0,I,P,z));break;case"out":N.trigger("pinchOut",[k||null,B||0,M||0,I,P,z]),v.pinchOut&&(h=v.pinchOut.call(N,u,k||null,B||0,M||0,I,P,z))}}return"tap"==l?a!==p&&a!==D||(clearTimeout(W),clearTimeout(q),Dt()&&!pt()?(U=wt(),W=setTimeout(t.proxy((function(){U=null,N.trigger("tap",[u.target]),v.tap&&(h=v.tap.call(N,u,u.target))}),this),v.doubleTapThreshold)):(U=null,N.trigger("tap",[u.target]),v.tap&&(h=v.tap.call(N,u,u.target)))):l==s?a!==p&&a!==D||(clearTimeout(W),clearTimeout(q),U=null,N.trigger("doubletap",[u.target]),v.doubleTap&&(h=v.doubleTap.call(N,u,u.target))):l==o&&(a!==p&&a!==D||(clearTimeout(W),U=null,N.trigger("longtap",[u.target]),v.longTap&&(h=v.longTap.call(N,u,u.target)))),h}function nt(){var t=!0;return null!==v.threshold&&(t=b>=v.threshold),t}function rt(){var t=!1;return null!==v.cancelThreshold&&null!==T&&(t=vt(T)-b>=v.cancelThreshold),t}function it(){return!(v.maxTimeThreshold&&M>=v.maxTimeThreshold)}function ut(){var t=lt(),e=ht(),n=null===v.pinchThreshold||B>=v.pinchThreshold;return t&&e&&n}function st(){return v.pinchStatus||v.pinchIn||v.pinchOut}function ot(){var t=it(),e=nt(),n=lt(),r=ht();return!rt()&&r&&n&&e&&t}function at(){return v.swipe||v.swipeStatus||v.swipeLeft||v.swipeRight||v.swipeUp||v.swipeDown}function lt(){return I===v.fingers||v.fingers===h||!c}function ht(){return 0!==z[0].end.x}function ft(){return v.tap}function Dt(){return!!v.doubleTap}function pt(){if(null==U)return!1;var t=wt();return Dt()&&t-U<=v.doubleTapThreshold}function ct(){V=j=0}function dt(){var t=!1;return j&&wt()-j<=v.fingerReleaseThreshold&&(t=!0),t}function gt(t){N&&(!0===t?(N.on(x,H),N.on(F,Q),w&&N.on(w,Z)):(N.off(x,H,!1),N.off(F,Q,!1),w&&N.off(w,Z,!1)),N.data(_+"_intouch",!0===t))}function _t(t,e){var n={start:{x:0,y:0},last:{x:0,y:0},end:{x:0,y:0}};return n.start.x=n.last.x=n.end.x=e.pageX||e.clientX,n.start.y=n.last.y=n.end.y=e.pageY||e.clientY,z[t]=n}function mt(t){var e=void 0!==t.identifier?t.identifier:0,n=z[e]||null;return null===n&&(n=_t(e,t)),n.last.x=n.end.x,n.last.y=n.end.y,n.end.x=t.pageX||t.clientX,n.end.y=t.pageY||t.clientY,n}function vt(t){if(L[t])return L[t].distance}function yt(t){return{direction:t,distance:0}}function Ct(){return X-Y}function xt(t,e){var n=Math.abs(t.x-e.x),r=Math.abs(t.y-e.y);return Math.round(Math.sqrt(n*n+r*r))}function Ft(t,s){if(a=s,(o=t).x==a.x&&o.y==a.y)return u;var o,a,l,h,f,D,p,c,d=(h=s,f=(l=t).x-h.x,D=h.y-l.y,p=Math.atan2(D,f),(c=Math.round(180*p/Math.PI))<0&&(c=360-Math.abs(c)),c);return d<=45&&0<=d||d<=360&&315<=d?e:135<=d&&d<=225?n:45<d&&d<135?i:r}function wt(){return(new Date).getTime()}this.enable=function(){return this.disable(),N.on(C,G),N.on(E,K),N},this.disable=function(){return $(),N},this.destroy=function(){$(),N.data(_,null),N=null},this.option=function(e,n){if("object"==typeof e)v=t.extend(v,e);else if(void 0!==v[e]){if(void 0===n)return v[e];v[e]=n}else{if(!e)return v;t.error("Option "+e+" does not exist on jQuery.swipe.options")}return null}}t.fn.rsswipe=function(e){var n=t(this),r=n.data(_);if(r&&"string"==typeof e){if(r[e])return r[e].apply(r,Array.prototype.slice.call(arguments,1));t.error("Method "+e+" does not exist on jQuery.rsswipe")}else if(r&&"object"==typeof e)r.option.apply(r,arguments);else if(!(r||"object"!=typeof e&&e))return function(e){return!e||void 0!==e.allowPageScroll||void 0===e.swipe&&void 0===e.swipeStatus||(e.allowPageScroll=u),void 0!==e.click&&void 0===e.tap&&(e.tap=e.click),e=e||{},e=t.extend({},t.fn.rsswipe.defaults,e),this.each((function(){var n=t(this),r=n.data(_);r||(r=new m(this,e),n.data(_,r))}))}.apply(this,arguments);return n},t.fn.rsswipe.version="1.6.18",t.fn.rsswipe.defaults={fingers:1,threshold:75,cancelThreshold:null,pinchThreshold:20,maxTimeThreshold:null,fingerReleaseThreshold:250,longTapThreshold:500,doubleTapThreshold:200,swipe:null,swipeLeft:null,swipeRight:null,swipeUp:null,swipeDown:null,swipeStatus:null,pinchIn:null,pinchOut:null,pinchStatus:null,click:null,tap:null,doubleTap:null,longTap:null,hold:null,triggerOnTouchEnd:!0,triggerOnTouchLeave:!1,allowPageScroll:"auto",fallbackToMouseEvents:!0,excludedElements:".noSwipe",preventDefaultEvents:!0},t.fn.rsswipe.phases={PHASE_START:"start",PHASE_MOVE:f,PHASE_END:D,PHASE_CANCEL:p},t.fn.rsswipe.directions={LEFT:e,RIGHT:n,UP:r,DOWN:i,IN:"in",OUT:"out"},t.fn.rsswipe.pageScroll={NONE:u,HORIZONTAL:a,VERTICAL:l,AUTO:"auto"},t.fn.rsswipe.fingers={ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5,ALL:h}},n(3).jQuery?(i=[n(0)],void 0===(u="function"==typeof(r=s)?r.apply(e,i):r)||(t.exports=u)):t.exports?s(n(0)):s(jQuery)},function(t,e){(function(e){t.exports=e}).call(this,{})},function(t,e){var n;(n=jQuery).waitForImages={hasImageProperties:["backgroundImage","listStyleImage","borderImage","borderCornerImage"]},n.expr.pseudos.uncached=function(t){var e=document.createElement("img");return e.src=t.src,n(t).is('img[src!=""]')&&!e.complete},n.fn.waitForImages=function(t,e,r){if(n.isPlainObject(t)&&(e=t.each,r=t.waitForAll,t=t.finished),t=t||n.noop,e=e||n.noop,r=!!r,!n.isFunction(t)||!n.isFunction(e))throw new TypeError("An invalid callback was supplied.");return this.each((function(){var i=n(this),u=[];if(r){var s=n.waitForImages.hasImageProperties||[],o=/url\((['"]?)(.*?)\1\)/g;i.find("*").each((function(){var t=n(this);t.is("img:uncached")&&u.push({src:t.attr("src"),element:t[0]}),n.each(s,(function(e,n){var r,i=t.css(n);if(!i)return!0;for(;r=o.exec(i);)u.push({src:r[2],element:t[0]})}))}))}else i.find("img:uncached").each((function(){u.push({src:this.src,element:this})}));var a=u.length,l=0;0==a&&t.call(i[0]),n.each(u,(function(r,u){var s=new Image;n(s).bind("load error",(function(n){if(l++,e.call(u.element,l,a,"load"==n.type),l==a)return t.call(i[0]),!1})),s.src=u.src}))}))}},,function(t,e,n){"use strict";function r(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function i(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,t.__proto__=e}
/*!
 * GSAP 3.5.1
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/n.r(e);var u,s,o,a,l,h,f,D,p,c,d,g,_,m,v,y,C,x,F,w,E,b,T,A,M,O,S,P={autoSleep:120,force3D:"auto",nullTargetWarn:1,units:{lineHeight:""}},B={duration:.5,overwrite:!1,delay:0},k=1e8,L=2*Math.PI,N=L/4,R=0,I=Math.sqrt,z=Math.cos,Y=Math.sin,X=function(t){return"string"==typeof t},j=function(t){return"function"==typeof t},V=function(t){return"number"==typeof t},U=function(t){return void 0===t},W=function(t){return"object"==typeof t},q=function(t){return!1!==t},G=function(){return"undefined"!=typeof window},H=function(t){return j(t)||X(t)},Q="function"==typeof ArrayBuffer&&ArrayBuffer.isView||function(){},K=Array.isArray,Z=/(?:-?\.?\d|\.)+/gi,$=/[-+=.]*\d+[.e\-+]*\d*[e\-\+]*\d*/g,J=/[-+=.]*\d+[.e-]*\d*[a-z%]*/g,tt=/[-+=.]*\d+(?:\.|e-|e)*\d*/gi,et=/[+-]=-?[\.\d]+/,nt=/[#\-+.]*\b[a-z\d-=+%.]+/gi,rt={},it={},ut=function(t){return(it=St(t,rt))&&cn},st=function(t,e){return console.warn("Invalid property",t,"set to",e,"Missing plugin? gsap.registerPlugin()")},ot=function(t,e){return!e&&console.warn(t)},at=function(t,e){return t&&(rt[t]=e)&&it&&(it[t]=e)||rt},lt=function(){return 0},ht={},ft=[],Dt={},pt={},ct={},dt=30,gt=[],_t="",mt=function(t){var e,n,r=t[0];if(W(r)||j(r)||(t=[t]),!(e=(r._gsap||{}).harness)){for(n=gt.length;n--&&!gt[n].targetTest(r););e=gt[n]}for(n=t.length;n--;)t[n]&&(t[n]._gsap||(t[n]._gsap=new Ie(t[n],e)))||t.splice(n,1);return t},vt=function(t){return t._gsap||mt(ie(t))[0]._gsap},yt=function(t,e,n){return(n=t[e])&&j(n)?t[e]():U(n)&&t.getAttribute&&t.getAttribute(e)||n},Ct=function(t,e){return(t=t.split(",")).forEach(e)||t},xt=function(t){return Math.round(1e5*t)/1e5||0},Ft=function(t,e){for(var n=e.length,r=0;t.indexOf(e[r])<0&&++r<n;);return r<n},wt=function(t,e,n){var r,i=V(t[1]),u=(i?2:1)+(e<2?0:1),s=t[u];if(i&&(s.duration=t[1]),s.parent=n,e){for(r=s;n&&!("immediateRender"in r);)r=n.vars.defaults||{},n=q(n.vars.inherit)&&n.parent;s.immediateRender=q(r.immediateRender),e<2?s.runBackwards=1:s.startAt=t[u-1]}return s},Et=function(){var t,e,n=ft.length,r=ft.slice(0);for(Dt={},ft.length=0,t=0;t<n;t++)(e=r[t])&&e._lazy&&(e.render(e._lazy[0],e._lazy[1],!0)._lazy=0)},bt=function(t,e,n,r){ft.length&&Et(),t.render(e,n,r),ft.length&&Et()},Tt=function(t){var e=parseFloat(t);return(e||0===e)&&(t+"").match(nt).length<2?e:X(t)?t.trim():t},At=function(t){return t},Mt=function(t,e){for(var n in e)n in t||(t[n]=e[n]);return t},Ot=function(t,e){for(var n in e)n in t||"duration"===n||"ease"===n||(t[n]=e[n])},St=function(t,e){for(var n in e)t[n]=e[n];return t},Pt=function t(e,n){for(var r in n)e[r]=W(n[r])?t(e[r]||(e[r]={}),n[r]):n[r];return e},Bt=function(t,e){var n,r={};for(n in t)n in e||(r[n]=t[n]);return r},kt=function(t){var e=t.parent||u,n=t.keyframes?Ot:Mt;if(q(t.inherit))for(;e;)n(t,e.vars.defaults),e=e.parent||e._dp;return t},Lt=function(t,e,n,r){void 0===n&&(n="_first"),void 0===r&&(r="_last");var i=e._prev,u=e._next;i?i._next=u:t[n]===e&&(t[n]=u),u?u._prev=i:t[r]===e&&(t[r]=i),e._next=e._prev=e.parent=null},Nt=function(t,e){t.parent&&(!e||t.parent.autoRemoveChildren)&&t.parent.remove(t),t._act=0},Rt=function(t,e){if(t&&(!e||e._end>t._dur||e._start<0))for(var n=t;n;)n._dirty=1,n=n.parent;return t},It=function(t){for(var e=t.parent;e&&e.parent;)e._dirty=1,e.totalDuration(),e=e.parent;return t},zt=function(t){return t._repeat?Yt(t._tTime,t=t.duration()+t._rDelay)*t:0},Yt=function(t,e){return(t/=e)&&~~t===t?~~t-1:~~t},Xt=function(t,e){return(t-e._start)*e._ts+(e._ts>=0?0:e._dirty?e.totalDuration():e._tDur)},jt=function(t){return t._end=xt(t._start+(t._tDur/Math.abs(t._ts||t._rts||1e-8)||0))},Vt=function(t,e){var n=t._dp;return n&&n.smoothChildTiming&&t._ts&&(t._start=xt(t._dp._time-(t._ts>0?e/t._ts:((t._dirty?t.totalDuration():t._tDur)-e)/-t._ts)),jt(t),n._dirty||Rt(n,t)),t},Ut=function(t,e){var n;if((e._time||e._initted&&!e._dur)&&(n=Xt(t.rawTime(),e),(!e._dur||Jt(0,e.totalDuration(),n)-e._tTime>1e-8)&&e.render(n,!0)),Rt(t,e)._dp&&t._initted&&t._time>=t._dur&&t._ts){if(t._dur<t.duration())for(n=t;n._dp;)n.rawTime()>=0&&n.totalTime(n._tTime),n=n._dp;t._zTime=-1e-8}},Wt=function(t,e,n,r){return e.parent&&Nt(e),e._start=xt(n+e._delay),e._end=xt(e._start+(e.totalDuration()/Math.abs(e.timeScale())||0)),function(t,e,n,r,i){void 0===n&&(n="_first"),void 0===r&&(r="_last");var u,s=t[r];if(i)for(u=e[i];s&&s[i]>u;)s=s._prev;s?(e._next=s._next,s._next=e):(e._next=t[n],t[n]=e),e._next?e._next._prev=e:t[r]=e,e._prev=s,e.parent=e._dp=t}(t,e,"_first","_last",t._sort?"_start":0),t._recent=e,r||Ut(t,e),t},qt=function(t,e){return(rt.ScrollTrigger||st("scrollTrigger",e))&&rt.ScrollTrigger.create(e,t)},Gt=function(t,e,n,r){return We(t,e),t._initted?!n&&t._pt&&(t._dur&&!1!==t.vars.lazy||!t._dur&&t.vars.lazy)&&h!==Ee.frame?(ft.push(t),t._lazy=[e,r],1):void 0:1},Ht=function(t,e,n,r){var i=t._repeat,u=xt(e)||0,s=t._tTime/t._tDur;return s&&!r&&(t._time*=u/t._dur),t._dur=u,t._tDur=i?i<0?1e10:xt(u*(i+1)+t._rDelay*i):u,s&&!r?Vt(t,t._tTime=t._tDur*s):t.parent&&jt(t),n||Rt(t.parent,t),t},Qt=function(t){return t instanceof Ye?Rt(t):Ht(t,t._dur)},Kt={_start:0,endTime:lt},Zt=function t(e,n){var r,i,u=e.labels,s=e._recent||Kt,o=e.duration()>=k?s.endTime(!1):e._dur;return X(n)&&(isNaN(n)||n in u)?"<"===(r=n.charAt(0))||">"===r?("<"===r?s._start:s.endTime(s._repeat>=0))+(parseFloat(n.substr(1))||0):(r=n.indexOf("="))<0?(n in u||(u[n]=o),u[n]):(i=+(n.charAt(r-1)+n.substr(r+1)),r>1?t(e,n.substr(0,r-1))+i:o+i):null==n?o:+n},$t=function(t,e){return t||0===t?e(t):e},Jt=function(t,e,n){return n<t?t:n>e?e:n},te=function(t){return(t=(t+"").substr((parseFloat(t)+"").length))&&isNaN(t)?t:""},ee=[].slice,ne=function(t,e){return t&&W(t)&&"length"in t&&(!e&&!t.length||t.length-1 in t&&W(t[0]))&&!t.nodeType&&t!==s},re=function(t,e,n){return void 0===n&&(n=[]),t.forEach((function(t){var r;return X(t)&&!e||ne(t,1)?(r=n).push.apply(r,ie(t)):n.push(t)}))||n},ie=function(t,e){return!X(t)||e||!o&&be()?K(t)?re(t,e):ne(t)?ee.call(t,0):t?[t]:[]:ee.call(a.querySelectorAll(t),0)},ue=function(t){return t.sort((function(){return.5-Math.random()}))},se=function(t){if(j(t))return t;var e=W(t)?t:{each:t},n=Be(e.ease),r=e.from||0,i=parseFloat(e.base)||0,u={},s=r>0&&r<1,o=isNaN(r)||s,a=e.axis,l=r,h=r;return X(r)?l=h={center:.5,edges:.5,end:1}[r]||0:!s&&o&&(l=r[0],h=r[1]),function(t,s,f){var D,p,c,d,g,_,m,v,y,C=(f||e).length,x=u[C];if(!x){if(!(y="auto"===e.grid?0:(e.grid||[1,k])[1])){for(m=-k;m<(m=f[y++].getBoundingClientRect().left)&&y<C;);y--}for(x=u[C]=[],D=o?Math.min(y,C)*l-.5:r%y,p=o?C*h/y-.5:r/y|0,m=0,v=k,_=0;_<C;_++)c=_%y-D,d=p-(_/y|0),x[_]=g=a?Math.abs("y"===a?d:c):I(c*c+d*d),g>m&&(m=g),g<v&&(v=g);"random"===r&&ue(x),x.max=m-v,x.min=v,x.v=C=(parseFloat(e.amount)||parseFloat(e.each)*(y>C?C-1:a?"y"===a?C/y:y:Math.max(y,C/y))||0)*("edges"===r?-1:1),x.b=C<0?i-C:i,x.u=te(e.amount||e.each)||0,n=n&&C<0?Se(n):n}return C=(x[t]-x.min)/x.max||0,xt(x.b+(n?n(C):C)*x.v)+x.u}},oe=function(t){var e=t<1?Math.pow(10,(t+"").length-2):1;return function(n){return Math.floor(Math.round(parseFloat(n)/t)*t*e)/e+(V(n)?0:te(n))}},ae=function(t,e){var n,r,i=K(t);return!i&&W(t)&&(n=i=t.radius||k,t.values?(t=ie(t.values),(r=!V(t[0]))&&(n*=n)):t=oe(t.increment)),$t(e,i?j(t)?function(e){return r=t(e),Math.abs(r-e)<=n?r:e}:function(e){for(var i,u,s=parseFloat(r?e.x:e),o=parseFloat(r?e.y:0),a=k,l=0,h=t.length;h--;)(i=r?(i=t[h].x-s)*i+(u=t[h].y-o)*u:Math.abs(t[h]-s))<a&&(a=i,l=h);return l=!n||a<=n?t[l]:e,r||l===e||V(e)?l:l+te(e)}:oe(t))},le=function(t,e,n,r){return $t(K(t)?!e:!0===n?!!(n=0):!r,(function(){return K(t)?t[~~(Math.random()*t.length)]:(n=n||1e-5)&&(r=n<1?Math.pow(10,(n+"").length-2):1)&&Math.floor(Math.round((t+Math.random()*(e-t))/n)*n*r)/r}))},he=function(t,e,n){return $t(n,(function(n){return t[~~e(n)]}))},fe=function(t){for(var e,n,r,i,u=0,s="";~(e=t.indexOf("random(",u));)r=t.indexOf(")",e),i="["===t.charAt(e+7),n=t.substr(e+7,r-e-7).match(i?nt:Z),s+=t.substr(u,e-u)+le(i?n:+n[0],i?0:+n[1],+n[2]||1e-5),u=r+1;return s+t.substr(u,t.length-u)},De=function(t,e,n,r,i){var u=e-t,s=r-n;return $t(i,(function(e){return n+((e-t)/u*s||0)}))},pe=function(t,e,n){var r,i,u,s=t.labels,o=k;for(r in s)(i=s[r]-e)<0==!!n&&i&&o>(i=Math.abs(i))&&(u=r,o=i);return u},ce=function(t,e,n){var r,i,u=t.vars,s=u[e];if(s)return r=u[e+"Params"],i=u.callbackScope||t,n&&ft.length&&Et(),r?s.apply(i,r):s.call(i)},de=function(t){return Nt(t),t.progress()<1&&ce(t,"onInterrupt"),t},ge=function(t){var e=(t=!t.name&&t.default||t).name,n=j(t),r=e&&!n&&t.init?function(){this._props=[]}:t,i={init:lt,render:un,add:Ve,kill:on,modifier:sn,rawVars:0},u={targetTest:0,get:0,getSetter:tn,aliases:{},register:0};if(be(),t!==r){if(pt[e])return;Mt(r,Mt(Bt(t,i),u)),St(r.prototype,St(i,Bt(t,u))),pt[r.prop=e]=r,t.targetTest&&(gt.push(r),ht[e]=1),e=("css"===e?"CSS":e.charAt(0).toUpperCase()+e.substr(1))+"Plugin"}at(e,r),t.register&&t.register(cn,r,hn)},_e={aqua:[0,255,255],lime:[0,255,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,255],navy:[0,0,128],white:[255,255,255],olive:[128,128,0],yellow:[255,255,0],orange:[255,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[255,0,0],pink:[255,192,203],cyan:[0,255,255],transparent:[255,255,255,0]},me=function(t,e,n){return 255*(6*(t=t<0?t+1:t>1?t-1:t)<1?e+(n-e)*t*6:t<.5?n:3*t<2?e+(n-e)*(2/3-t)*6:e)+.5|0},ve=function(t,e,n){var r,i,u,s,o,a,l,h,f,D,p=t?V(t)?[t>>16,t>>8&255,255&t]:0:_e.black;if(!p){if(","===t.substr(-1)&&(t=t.substr(0,t.length-1)),_e[t])p=_e[t];else if("#"===t.charAt(0))4===t.length&&(r=t.charAt(1),i=t.charAt(2),u=t.charAt(3),t="#"+r+r+i+i+u+u),p=[(t=parseInt(t.substr(1),16))>>16,t>>8&255,255&t];else if("hsl"===t.substr(0,3))if(p=D=t.match(Z),e){if(~t.indexOf("="))return p=t.match($),n&&p.length<4&&(p[3]=1),p}else s=+p[0]%360/360,o=+p[1]/100,r=2*(a=+p[2]/100)-(i=a<=.5?a*(o+1):a+o-a*o),p.length>3&&(p[3]*=1),p[0]=me(s+1/3,r,i),p[1]=me(s,r,i),p[2]=me(s-1/3,r,i);else p=t.match(Z)||_e.transparent;p=p.map(Number)}return e&&!D&&(r=p[0]/255,i=p[1]/255,u=p[2]/255,a=((l=Math.max(r,i,u))+(h=Math.min(r,i,u)))/2,l===h?s=o=0:(f=l-h,o=a>.5?f/(2-l-h):f/(l+h),s=l===r?(i-u)/f+(i<u?6:0):l===i?(u-r)/f+2:(r-i)/f+4,s*=60),p[0]=~~(s+.5),p[1]=~~(100*o+.5),p[2]=~~(100*a+.5)),n&&p.length<4&&(p[3]=1),p},ye=function(t){var e=[],n=[],r=-1;return t.split(xe).forEach((function(t){var i=t.match(J)||[];e.push.apply(e,i),n.push(r+=i.length+1)})),e.c=n,e},Ce=function(t,e,n){var r,i,u,s,o="",a=(t+o).match(xe),l=e?"hsla(":"rgba(",h=0;if(!a)return t;if(a=a.map((function(t){return(t=ve(t,e,1))&&l+(e?t[0]+","+t[1]+"%,"+t[2]+"%,"+t[3]:t.join(","))+")"})),n&&(u=ye(t),(r=n.c).join(o)!==u.c.join(o)))for(s=(i=t.replace(xe,"1").split(J)).length-1;h<s;h++)o+=i[h]+(~r.indexOf(h)?a.shift()||l+"0,0,0,0)":(u.length?u:a.length?a:n).shift());if(!i)for(s=(i=t.split(xe)).length-1;h<s;h++)o+=i[h]+a[h];return o+i[s]},xe=function(){var t,e="(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3}){1,2}\\b";for(t in _e)e+="|"+t+"\\b";return new RegExp(e+")","gi")}(),Fe=/hsl[a]?\(/,we=function(t){var e,n=t.join(" ");if(xe.lastIndex=0,xe.test(n))return e=Fe.test(n),t[1]=Ce(t[1],e),t[0]=Ce(t[0],e,ye(t[1])),!0},Ee=(v=Date.now,y=500,C=33,x=v(),F=x,E=w=1e3/240,T=function t(e){var n,r,i,u,s=v()-F,o=!0===e;if(s>y&&(x+=s-C),((n=(i=(F+=s)-x)-E)>0||o)&&(u=++g.frame,_=i-1e3*g.time,g.time=i/=1e3,E+=n+(n>=w?4:w-n),r=1),o||(p=c(t)),r)for(m=0;m<b.length;m++)b[m](i,_,u,e)},g={time:0,frame:0,tick:function(){T(!0)},deltaRatio:function(t){return _/(1e3/(t||60))},wake:function(){l&&(!o&&G()&&(s=o=window,a=s.document||{},rt.gsap=cn,(s.gsapVersions||(s.gsapVersions=[])).push(cn.version),ut(it||s.GreenSockGlobals||!s.gsap&&s||{}),d=s.requestAnimationFrame),p&&g.sleep(),c=d||function(t){return setTimeout(t,E-1e3*g.time+1|0)},D=1,T(2))},sleep:function(){(d?s.cancelAnimationFrame:clearTimeout)(p),D=0,c=lt},lagSmoothing:function(t,e){y=t||1/1e-8,C=Math.min(e,y,0)},fps:function(t){w=1e3/(t||240),E=1e3*g.time+w},add:function(t){b.indexOf(t)<0&&b.push(t),be()},remove:function(t){var e;~(e=b.indexOf(t))&&b.splice(e,1)&&m>=e&&m--},_listeners:b=[]}),be=function(){return!D&&Ee.wake()},Te={},Ae=/^[\d.\-M][\d.\-,\s]/,Me=/["']/g,Oe=function(t){for(var e,n,r,i={},u=t.substr(1,t.length-3).split(":"),s=u[0],o=1,a=u.length;o<a;o++)n=u[o],e=o!==a-1?n.lastIndexOf(","):n.length,r=n.substr(0,e),i[s]=isNaN(r)?r.replace(Me,"").trim():+r,s=n.substr(e+1).trim();return i},Se=function(t){return function(e){return 1-t(1-e)}},Pe=function t(e,n){for(var r,i=e._first;i;)i instanceof Ye?t(i,n):!i.vars.yoyoEase||i._yoyo&&i._repeat||i._yoyo===n||(i.timeline?t(i.timeline,n):(r=i._ease,i._ease=i._yEase,i._yEase=r,i._yoyo=n)),i=i._next},Be=function(t,e){return t&&(j(t)?t:Te[t]||function(t){var e,n,r,i,u=(t+"").split("("),s=Te[u[0]];return s&&u.length>1&&s.config?s.config.apply(null,~t.indexOf("{")?[Oe(u[1])]:(e=t,n=e.indexOf("(")+1,r=e.indexOf(")"),i=e.indexOf("(",n),e.substring(n,~i&&i<r?e.indexOf(")",r+1):r)).split(",").map(Tt)):Te._CE&&Ae.test(t)?Te._CE("",t):s}(t))||e},ke=function(t,e,n,r){void 0===n&&(n=function(t){return 1-e(1-t)}),void 0===r&&(r=function(t){return t<.5?e(2*t)/2:1-e(2*(1-t))/2});var i,u={easeIn:e,easeOut:n,easeInOut:r};return Ct(t,(function(t){for(var e in Te[t]=rt[t]=u,Te[i=t.toLowerCase()]=n,u)Te[i+("easeIn"===e?".in":"easeOut"===e?".out":".inOut")]=Te[t+"."+e]=u[e]})),u},Le=function(t){return function(e){return e<.5?(1-t(1-2*e))/2:.5+t(2*(e-.5))/2}},Ne=function t(e,n,r){var i=n>=1?n:1,u=(r||(e?.3:.45))/(n<1?n:1),s=u/L*(Math.asin(1/i)||0),o=function(t){return 1===t?1:i*Math.pow(2,-10*t)*Y((t-s)*u)+1},a="out"===e?o:"in"===e?function(t){return 1-o(1-t)}:Le(o);return u=L/u,a.config=function(n,r){return t(e,n,r)},a},Re=function t(e,n){void 0===n&&(n=1.70158);var r=function(t){return t?--t*t*((n+1)*t+n)+1:0},i="out"===e?r:"in"===e?function(t){return 1-r(1-t)}:Le(r);return i.config=function(n){return t(e,n)},i};Ct("Linear,Quad,Cubic,Quart,Quint,Strong",(function(t,e){var n=e<5?e+1:e;ke(t+",Power"+(n-1),e?function(t){return Math.pow(t,n)}:function(t){return t},(function(t){return 1-Math.pow(1-t,n)}),(function(t){return t<.5?Math.pow(2*t,n)/2:1-Math.pow(2*(1-t),n)/2}))})),Te.Linear.easeNone=Te.none=Te.Linear.easeIn,ke("Elastic",Ne("in"),Ne("out"),Ne()),A=7.5625,O=1/(M=2.75),ke("Bounce",(function(t){return 1-S(1-t)}),S=function(t){return t<O?A*t*t:t<.7272727272727273?A*Math.pow(t-1.5/M,2)+.75:t<.9090909090909092?A*(t-=2.25/M)*t+.9375:A*Math.pow(t-2.625/M,2)+.984375}),ke("Expo",(function(t){return t?Math.pow(2,10*(t-1)):0})),ke("Circ",(function(t){return-(I(1-t*t)-1)})),ke("Sine",(function(t){return 1===t?1:1-z(t*N)})),ke("Back",Re("in"),Re("out"),Re()),Te.SteppedEase=Te.steps=rt.SteppedEase={config:function(t,e){void 0===t&&(t=1);var n=1/t,r=t+(e?0:1),i=e?1:0;return function(t){return((r*Jt(0,1-1e-8,t)|0)+i)*n}}},B.ease=Te["quad.out"],Ct("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt",(function(t){return _t+=t+","+t+"Params,"}));var Ie=function(t,e){this.id=R++,t._gsap=this,this.target=t,this.harness=e,this.get=e?e.get:yt,this.set=e?e.getSetter:tn},ze=function(){function t(t,e){var n=t.parent||u;this.vars=t,this._delay=+t.delay||0,(this._repeat=t.repeat||0)&&(this._rDelay=t.repeatDelay||0,this._yoyo=!!t.yoyo||!!t.yoyoEase),this._ts=1,Ht(this,+t.duration,1,1),this.data=t.data,D||Ee.wake(),n&&Wt(n,this,e||0===e?e:n._time,1),t.reversed&&this.reverse(),t.paused&&this.paused(!0)}var e=t.prototype;return e.delay=function(t){return t||0===t?(this.parent&&this.parent.smoothChildTiming&&this.startTime(this._start+t-this._delay),this._delay=t,this):this._delay},e.duration=function(t){return arguments.length?this.totalDuration(this._repeat>0?t+(t+this._rDelay)*this._repeat:t):this.totalDuration()&&this._dur},e.totalDuration=function(t){return arguments.length?(this._dirty=0,Ht(this,this._repeat<0?t:(t-this._repeat*this._rDelay)/(this._repeat+1))):this._tDur},e.totalTime=function(t,e){if(be(),!arguments.length)return this._tTime;var n=this._dp;if(n&&n.smoothChildTiming&&this._ts){for(Vt(this,t);n.parent;)n.parent._time!==n._start+(n._ts>=0?n._tTime/n._ts:(n.totalDuration()-n._tTime)/-n._ts)&&n.totalTime(n._tTime,!0),n=n.parent;!this.parent&&this._dp.autoRemoveChildren&&(this._ts>0&&t<this._tDur||this._ts<0&&t>0||!this._tDur&&!t)&&Wt(this._dp,this,this._start-this._delay)}return(this._tTime!==t||!this._dur&&!e||this._initted&&1e-8===Math.abs(this._zTime)||!t&&!this._initted&&(this.add||this._ptLookup))&&(this._ts||(this._pTime=t),bt(this,t,e)),this},e.time=function(t,e){return arguments.length?this.totalTime(Math.min(this.totalDuration(),t+zt(this))%this._dur||(t?this._dur:0),e):this._time},e.totalProgress=function(t,e){return arguments.length?this.totalTime(this.totalDuration()*t,e):this.totalDuration()?Math.min(1,this._tTime/this._tDur):this.ratio},e.progress=function(t,e){return arguments.length?this.totalTime(this.duration()*(!this._yoyo||1&this.iteration()?t:1-t)+zt(this),e):this.duration()?Math.min(1,this._time/this._dur):this.ratio},e.iteration=function(t,e){var n=this.duration()+this._rDelay;return arguments.length?this.totalTime(this._time+(t-1)*n,e):this._repeat?Yt(this._tTime,n)+1:1},e.timeScale=function(t){if(!arguments.length)return-1e-8===this._rts?0:this._rts;if(this._rts===t)return this;var e=this.parent&&this._ts?Xt(this.parent._time,this):this._tTime;return this._rts=+t||0,this._ts=this._ps||-1e-8===t?0:this._rts,It(this.totalTime(Jt(-this._delay,this._tDur,e),!0))},e.paused=function(t){return arguments.length?(this._ps!==t&&(this._ps=t,t?(this._pTime=this._tTime||Math.max(-this._delay,this.rawTime()),this._ts=this._act=0):(be(),this._ts=this._rts,this.totalTime(this.parent&&!this.parent.smoothChildTiming?this.rawTime():this._tTime||this._pTime,1===this.progress()&&(this._tTime-=1e-8)&&1e-8!==Math.abs(this._zTime)))),this):this._ps},e.startTime=function(t){if(arguments.length){this._start=t;var e=this.parent||this._dp;return e&&(e._sort||!this.parent)&&Wt(e,this,t-this._delay),this}return this._start},e.endTime=function(t){return this._start+(q(t)?this.totalDuration():this.duration())/Math.abs(this._ts)},e.rawTime=function(t){var e=this.parent||this._dp;return e?t&&(!this._ts||this._repeat&&this._time&&this.totalProgress()<1)?this._tTime%(this._dur+this._rDelay):this._ts?Xt(e.rawTime(t),this):this._tTime:this._tTime},e.globalTime=function(t){for(var e=this,n=arguments.length?t:e.rawTime();e;)n=e._start+n/(e._ts||1),e=e._dp;return n},e.repeat=function(t){return arguments.length?(this._repeat=t,Qt(this)):this._repeat},e.repeatDelay=function(t){return arguments.length?(this._rDelay=t,Qt(this)):this._rDelay},e.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},e.seek=function(t,e){return this.totalTime(Zt(this,t),q(e))},e.restart=function(t,e){return this.play().totalTime(t?-this._delay:0,q(e))},e.play=function(t,e){return null!=t&&this.seek(t,e),this.reversed(!1).paused(!1)},e.reverse=function(t,e){return null!=t&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},e.pause=function(t,e){return null!=t&&this.seek(t,e),this.paused(!0)},e.resume=function(){return this.paused(!1)},e.reversed=function(t){return arguments.length?(!!t!==this.reversed()&&this.timeScale(-this._rts||(t?-1e-8:0)),this):this._rts<0},e.invalidate=function(){return this._initted=0,this._zTime=-1e-8,this},e.isActive=function(){var t,e=this.parent||this._dp,n=this._start;return!(e&&!(this._ts&&this._initted&&e.isActive()&&(t=e.rawTime(!0))>=n&&t<this.endTime(!0)-1e-8))},e.eventCallback=function(t,e,n){var r=this.vars;return arguments.length>1?(e?(r[t]=e,n&&(r[t+"Params"]=n),"onUpdate"===t&&(this._onUpdate=e)):delete r[t],this):r[t]},e.then=function(t){var e=this;return new Promise((function(n){var r=j(t)?t:At,i=function(){var t=e.then;e.then=null,j(r)&&(r=r(e))&&(r.then||r===e)&&(e.then=t),n(r),e.then=t};e._initted&&1===e.totalProgress()&&e._ts>=0||!e._tTime&&e._ts<0?i():e._prom=i}))},e.kill=function(){de(this)},t}();Mt(ze.prototype,{_time:0,_start:0,_end:0,_tTime:0,_tDur:0,_dirty:0,_repeat:0,_yoyo:!1,parent:null,_initted:!1,_rDelay:0,_ts:1,_dp:0,ratio:0,_zTime:-1e-8,_prom:0,_ps:!1,_rts:1});var Ye=function(t){function e(e,n){var i;return void 0===e&&(e={}),(i=t.call(this,e,n)||this).labels={},i.smoothChildTiming=!!e.smoothChildTiming,i.autoRemoveChildren=!!e.autoRemoveChildren,i._sort=q(e.sortChildren),i.parent&&Ut(i.parent,r(i)),e.scrollTrigger&&qt(r(i),e.scrollTrigger),i}i(e,t);var n=e.prototype;return n.to=function(t,e,n){return new Qe(t,wt(arguments,0,this),Zt(this,V(e)?arguments[3]:n)),this},n.from=function(t,e,n){return new Qe(t,wt(arguments,1,this),Zt(this,V(e)?arguments[3]:n)),this},n.fromTo=function(t,e,n,r){return new Qe(t,wt(arguments,2,this),Zt(this,V(e)?arguments[4]:r)),this},n.set=function(t,e,n){return e.duration=0,e.parent=this,kt(e).repeatDelay||(e.repeat=0),e.immediateRender=!!e.immediateRender,new Qe(t,e,Zt(this,n),1),this},n.call=function(t,e,n){return Wt(this,Qe.delayedCall(0,t,e),Zt(this,n))},n.staggerTo=function(t,e,n,r,i,u,s){return n.duration=e,n.stagger=n.stagger||r,n.onComplete=u,n.onCompleteParams=s,n.parent=this,new Qe(t,n,Zt(this,i)),this},n.staggerFrom=function(t,e,n,r,i,u,s){return n.runBackwards=1,kt(n).immediateRender=q(n.immediateRender),this.staggerTo(t,e,n,r,i,u,s)},n.staggerFromTo=function(t,e,n,r,i,u,s,o){return r.startAt=n,kt(r).immediateRender=q(r.immediateRender),this.staggerTo(t,e,r,i,u,s,o)},n.render=function(t,e,n){var r,i,s,o,a,l,h,f,D,p,c,d,g=this._time,_=this._dirty?this.totalDuration():this._tDur,m=this._dur,v=this!==u&&t>_-1e-8&&t>=0?_:t<1e-8?0:t,y=this._zTime<0!=t<0&&(this._initted||!m);if(v!==this._tTime||n||y){if(g!==this._time&&m&&(v+=this._time-g,t+=this._time-g),r=v,D=this._start,l=!(f=this._ts),y&&(m||(g=this._zTime),(t||!e)&&(this._zTime=t)),this._repeat&&(c=this._yoyo,a=m+this._rDelay,r=xt(v%a),v===_?(o=this._repeat,r=m):((o=~~(v/a))&&o===v/a&&(r=m,o--),r>m&&(r=m)),p=Yt(this._tTime,a),!g&&this._tTime&&p!==o&&(p=o),c&&1&o&&(r=m-r,d=1),o!==p&&!this._lock)){var C=c&&1&p,x=C===(c&&1&o);if(o<p&&(C=!C),g=C?0:m,this._lock=1,this.render(g||(d?0:xt(o*a)),e,!m)._lock=0,!e&&this.parent&&ce(this,"onRepeat"),this.vars.repeatRefresh&&!d&&(this.invalidate()._lock=1),g!==this._time||l!==!this._ts)return this;if(m=this._dur,_=this._tDur,x&&(this._lock=2,g=C?m:-1e-4,this.render(g,!0),this.vars.repeatRefresh&&!d&&this.invalidate()),this._lock=0,!this._ts&&!l)return this;Pe(this,d)}if(this._hasPause&&!this._forcing&&this._lock<2&&(h=function(t,e,n){var r;if(n>e)for(r=t._first;r&&r._start<=n;){if(!r._dur&&"isPause"===r.data&&r._start>e)return r;r=r._next}else for(r=t._last;r&&r._start>=n;){if(!r._dur&&"isPause"===r.data&&r._start<e)return r;r=r._prev}}(this,xt(g),xt(r)))&&(v-=r-(r=h._start)),this._tTime=v,this._time=r,this._act=!f,this._initted||(this._onUpdate=this.vars.onUpdate,this._initted=1,this._zTime=t),!g&&r&&!e&&ce(this,"onStart"),r>=g&&t>=0)for(i=this._first;i;){if(s=i._next,(i._act||r>=i._start)&&i._ts&&h!==i){if(i.parent!==this)return this.render(t,e,n);if(i.render(i._ts>0?(r-i._start)*i._ts:(i._dirty?i.totalDuration():i._tDur)+(r-i._start)*i._ts,e,n),r!==this._time||!this._ts&&!l){h=0,s&&(v+=this._zTime=-1e-8);break}}i=s}else{i=this._last;for(var F=t<0?t:r;i;){if(s=i._prev,(i._act||F<=i._end)&&i._ts&&h!==i){if(i.parent!==this)return this.render(t,e,n);if(i.render(i._ts>0?(F-i._start)*i._ts:(i._dirty?i.totalDuration():i._tDur)+(F-i._start)*i._ts,e,n),r!==this._time||!this._ts&&!l){h=0,s&&(v+=this._zTime=F?-1e-8:1e-8);break}}i=s}}if(h&&!e&&(this.pause(),h.render(r>=g?0:-1e-8)._zTime=r>=g?1:-1,this._ts))return this._start=D,jt(this),this.render(t,e,n);this._onUpdate&&!e&&ce(this,"onUpdate",!0),(v===_&&_>=this.totalDuration()||!v&&g)&&(D!==this._start&&Math.abs(f)===Math.abs(this._ts)||this._lock||((t||!m)&&(v===_&&this._ts>0||!v&&this._ts<0)&&Nt(this,1),e||t<0&&!g||!v&&!g||(ce(this,v===_?"onComplete":"onReverseComplete",!0),this._prom&&!(v<_&&this.timeScale()>0)&&this._prom())))}return this},n.add=function(t,e){var n=this;if(V(e)||(e=Zt(this,e)),!(t instanceof ze)){if(K(t))return t.forEach((function(t){return n.add(t,e)})),this;if(X(t))return this.addLabel(t,e);if(!j(t))return this;t=Qe.delayedCall(0,t)}return this!==t?Wt(this,t,e):this},n.getChildren=function(t,e,n,r){void 0===t&&(t=!0),void 0===e&&(e=!0),void 0===n&&(n=!0),void 0===r&&(r=-k);for(var i=[],u=this._first;u;)u._start>=r&&(u instanceof Qe?e&&i.push(u):(n&&i.push(u),t&&i.push.apply(i,u.getChildren(!0,e,n)))),u=u._next;return i},n.getById=function(t){for(var e=this.getChildren(1,1,1),n=e.length;n--;)if(e[n].vars.id===t)return e[n]},n.remove=function(t){return X(t)?this.removeLabel(t):j(t)?this.killTweensOf(t):(Lt(this,t),t===this._recent&&(this._recent=this._last),Rt(this))},n.totalTime=function(e,n){return arguments.length?(this._forcing=1,!this._dp&&this._ts&&(this._start=xt(Ee.time-(this._ts>0?e/this._ts:(this.totalDuration()-e)/-this._ts))),t.prototype.totalTime.call(this,e,n),this._forcing=0,this):this._tTime},n.addLabel=function(t,e){return this.labels[t]=Zt(this,e),this},n.removeLabel=function(t){return delete this.labels[t],this},n.addPause=function(t,e,n){var r=Qe.delayedCall(0,e||lt,n);return r.data="isPause",this._hasPause=1,Wt(this,r,Zt(this,t))},n.removePause=function(t){var e=this._first;for(t=Zt(this,t);e;)e._start===t&&"isPause"===e.data&&Nt(e),e=e._next},n.killTweensOf=function(t,e,n){for(var r=this.getTweensOf(t,n),i=r.length;i--;)Xe!==r[i]&&r[i].kill(t,e);return this},n.getTweensOf=function(t,e){for(var n,r=[],i=ie(t),u=this._first,s=V(e);u;)u instanceof Qe?Ft(u._targets,i)&&(s?(!Xe||u._initted&&u._ts)&&u.globalTime(0)<=e&&u.globalTime(u.totalDuration())>e:!e||u.isActive())&&r.push(u):(n=u.getTweensOf(i,e)).length&&r.push.apply(r,n),u=u._next;return r},n.tweenTo=function(t,e){e=e||{};var n=this,r=Zt(n,t),i=e,u=i.startAt,s=i.onStart,o=i.onStartParams,a=Qe.to(n,Mt(e,{ease:"none",lazy:!1,time:r,overwrite:"auto",duration:e.duration||Math.abs((r-(u&&"time"in u?u.time:n._time))/n.timeScale())||1e-8,onStart:function(){n.pause();var t=e.duration||Math.abs((r-n._time)/n.timeScale());a._dur!==t&&Ht(a,t,0,1).render(a._time,!0,!0),s&&s.apply(a,o||[])}}));return a},n.tweenFromTo=function(t,e,n){return this.tweenTo(e,Mt({startAt:{time:Zt(this,t)}},n))},n.recent=function(){return this._recent},n.nextLabel=function(t){return void 0===t&&(t=this._time),pe(this,Zt(this,t))},n.previousLabel=function(t){return void 0===t&&(t=this._time),pe(this,Zt(this,t),1)},n.currentLabel=function(t){return arguments.length?this.seek(t,!0):this.previousLabel(this._time+1e-8)},n.shiftChildren=function(t,e,n){void 0===n&&(n=0);for(var r,i=this._first,u=this.labels;i;)i._start>=n&&(i._start+=t,i._end+=t),i=i._next;if(e)for(r in u)u[r]>=n&&(u[r]+=t);return Rt(this)},n.invalidate=function(){var e=this._first;for(this._lock=0;e;)e.invalidate(),e=e._next;return t.prototype.invalidate.call(this)},n.clear=function(t){void 0===t&&(t=!0);for(var e,n=this._first;n;)e=n._next,this.remove(n),n=e;return this._time=this._tTime=this._pTime=0,t&&(this.labels={}),Rt(this)},n.totalDuration=function(t){var e,n,r,i=0,s=this,o=s._last,a=k;if(arguments.length)return s.timeScale((s._repeat<0?s.duration():s.totalDuration())/(s.reversed()?-t:t));if(s._dirty){for(r=s.parent;o;)e=o._prev,o._dirty&&o.totalDuration(),(n=o._start)>a&&s._sort&&o._ts&&!s._lock?(s._lock=1,Wt(s,o,n-o._delay,1)._lock=0):a=n,n<0&&o._ts&&(i-=n,(!r&&!s._dp||r&&r.smoothChildTiming)&&(s._start+=n/s._ts,s._time-=n,s._tTime-=n),s.shiftChildren(-n,!1,-Infinity),a=0),o._end>i&&o._ts&&(i=o._end),o=e;Ht(s,s===u&&s._time>i?s._time:i,1,1),s._dirty=0}return s._tDur},e.updateRoot=function(t){if(u._ts&&(bt(u,Xt(t,u)),h=Ee.frame),Ee.frame>=dt){dt+=P.autoSleep||120;var e=u._first;if((!e||!e._ts)&&P.autoSleep&&Ee._listeners.length<2){for(;e&&!e._ts;)e=e._next;e||Ee.sleep()}}},e}(ze);Mt(Ye.prototype,{_lock:0,_hasPause:0,_forcing:0});var Xe,je=function(t,e,n,r,i,u,s){var o,a,l,h,f,D,p,c,d=new hn(this._pt,t,e,0,1,rn,null,i),g=0,_=0;for(d.b=n,d.e=r,n+="",(p=~(r+="").indexOf("random("))&&(r=fe(r)),u&&(u(c=[n,r],t,e),n=c[0],r=c[1]),a=n.match(tt)||[];o=tt.exec(r);)h=o[0],f=r.substring(g,o.index),l?l=(l+1)%5:"rgba("===f.substr(-5)&&(l=1),h!==a[_++]&&(D=parseFloat(a[_-1])||0,d._pt={_next:d._pt,p:f||1===_?f:",",s:D,c:"="===h.charAt(1)?parseFloat(h.substr(2))*("-"===h.charAt(0)?-1:1):parseFloat(h)-D,m:l&&l<4?Math.round:0},g=tt.lastIndex);return d.c=g<r.length?r.substring(g,r.length):"",d.fp=s,(et.test(r)||p)&&(d.e=0),this._pt=d,d},Ve=function(t,e,n,r,i,u,s,o,a){j(r)&&(r=r(i||0,t,u));var l,h=t[e],f="get"!==n?n:j(h)?a?t[e.indexOf("set")||!j(t["get"+e.substr(3)])?e:"get"+e.substr(3)](a):t[e]():h,D=j(h)?a?$e:Ze:Ke;if(X(r)&&(~r.indexOf("random(")&&(r=fe(r)),"="===r.charAt(1)&&(r=parseFloat(f)+parseFloat(r.substr(2))*("-"===r.charAt(0)?-1:1)+(te(f)||0))),f!==r)return isNaN(f*r)?(!h&&!(e in t)&&st(e,r),je.call(this,t,e,f,r,D,o||P.stringFilter,a)):(l=new hn(this._pt,t,e,+f||0,r-(f||0),"boolean"==typeof h?nn:en,0,D),a&&(l.fp=a),s&&l.modifier(s,this,t),this._pt=l)},Ue=function(t,e,n,r,i,u){var s,o,a,l;if(pt[t]&&!1!==(s=new pt[t]).init(i,s.rawVars?e[t]:function(t,e,n,r,i){if(j(t)&&(t=qe(t,i,e,n,r)),!W(t)||t.style&&t.nodeType||K(t)||Q(t))return X(t)?qe(t,i,e,n,r):t;var u,s={};for(u in t)s[u]=qe(t[u],i,e,n,r);return s}(e[t],r,i,u,n),n,r,u)&&(n._pt=o=new hn(n._pt,i,t,0,1,s.render,s,0,s.priority),n!==f))for(a=n._ptLookup[n._targets.indexOf(i)],l=s._props.length;l--;)a[s._props[l]]=o;return s},We=function t(e,n){var r,i,s,o,a,l,h,f,D,p,c,d,g,_=e.vars,m=_.ease,v=_.startAt,y=_.immediateRender,C=_.lazy,x=_.onUpdate,F=_.onUpdateParams,w=_.callbackScope,E=_.runBackwards,b=_.yoyoEase,T=_.keyframes,A=_.autoRevert,M=e._dur,O=e._startAt,S=e._targets,P=e.parent,k=P&&"nested"===P.data?P.parent._targets:S,L="auto"===e._overwrite,N=e.timeline;if(N&&(!T||!m)&&(m="none"),e._ease=Be(m,B.ease),e._yEase=b?Se(Be(!0===b?m:b,B.ease)):0,b&&e._yoyo&&!e._repeat&&(b=e._yEase,e._yEase=e._ease,e._ease=b),!N){if(d=(f=S[0]?vt(S[0]).harness:0)&&_[f.prop],r=Bt(_,ht),O&&O.render(-1,!0).kill(),v){if(Nt(e._startAt=Qe.set(S,Mt({data:"isStart",overwrite:!1,parent:P,immediateRender:!0,lazy:q(C),startAt:null,delay:0,onUpdate:x,onUpdateParams:F,callbackScope:w,stagger:0},v))),y)if(n>0)A||(e._startAt=0);else if(M&&!(n<0&&O))return void(n&&(e._zTime=n))}else if(E&&M)if(O)!A&&(e._startAt=0);else if(n&&(y=!1),s=Mt({overwrite:!1,data:"isFromStart",lazy:y&&q(C),immediateRender:y,stagger:0,parent:P},r),d&&(s[f.prop]=d),Nt(e._startAt=Qe.set(S,s)),y){if(!n)return}else t(e._startAt,1e-8);for(e._pt=0,C=M&&q(C)||C&&!M,i=0;i<S.length;i++){if(h=(a=S[i])._gsap||mt(S)[i]._gsap,e._ptLookup[i]=p={},Dt[h.id]&&ft.length&&Et(),c=k===S?i:k.indexOf(a),f&&!1!==(D=new f).init(a,d||r,e,c,k)&&(e._pt=o=new hn(e._pt,a,D.name,0,1,D.render,D,0,D.priority),D._props.forEach((function(t){p[t]=o})),D.priority&&(l=1)),!f||d)for(s in r)pt[s]&&(D=Ue(s,r,e,c,a,k))?D.priority&&(l=1):p[s]=o=Ve.call(e,a,s,"get",r[s],c,k,0,_.stringFilter);e._op&&e._op[i]&&e.kill(a,e._op[i]),L&&e._pt&&(Xe=e,u.killTweensOf(a,p,e.globalTime(0)),g=!e.parent,Xe=0),e._pt&&C&&(Dt[h.id]=1)}l&&ln(e),e._onInit&&e._onInit(e)}e._from=!N&&!!_.runBackwards,e._onUpdate=x,e._initted=(!e._op||e._pt)&&!g},qe=function(t,e,n,r,i){return j(t)?t.call(e,n,r,i):X(t)&&~t.indexOf("random(")?fe(t):t},Ge=_t+"repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase",He=(Ge+",id,stagger,delay,duration,paused,scrollTrigger").split(","),Qe=function(t){function e(e,n,i,s){var o;"number"==typeof n&&(i.duration=n,n=i,i=null);var a,l,h,f,D,p,c,d,g=(o=t.call(this,s?n:kt(n),i)||this).vars,_=g.duration,m=g.delay,v=g.immediateRender,y=g.stagger,C=g.overwrite,x=g.keyframes,F=g.defaults,w=g.scrollTrigger,E=g.yoyoEase,b=o.parent,T=(K(e)||Q(e)?V(e[0]):"length"in n)?[e]:ie(e);if(o._targets=T.length?mt(T):ot("GSAP target "+e+" not found. https://greensock.com",!P.nullTargetWarn)||[],o._ptLookup=[],o._overwrite=C,x||y||H(_)||H(m)){if(n=o.vars,(a=o.timeline=new Ye({data:"nested",defaults:F||{}})).kill(),a.parent=r(o),x)Mt(a.vars.defaults,{ease:"none"}),x.forEach((function(t){return a.to(T,t,">")}));else{if(f=T.length,c=y?se(y):lt,W(y))for(D in y)~Ge.indexOf(D)&&(d||(d={}),d[D]=y[D]);for(l=0;l<f;l++){for(D in h={},n)He.indexOf(D)<0&&(h[D]=n[D]);h.stagger=0,E&&(h.yoyoEase=E),d&&St(h,d),p=T[l],h.duration=+qe(_,r(o),l,p,T),h.delay=(+qe(m,r(o),l,p,T)||0)-o._delay,!y&&1===f&&h.delay&&(o._delay=m=h.delay,o._start+=m,h.delay=0),a.to(p,h,c(l,p,T))}a.duration()?_=m=0:o.timeline=0}_||o.duration(_=a.duration())}else o.timeline=0;return!0===C&&(Xe=r(o),u.killTweensOf(T),Xe=0),b&&Ut(b,r(o)),(v||!_&&!x&&o._start===xt(b._time)&&q(v)&&function t(e){return!e||e._ts&&t(e.parent)}(r(o))&&"nested"!==b.data)&&(o._tTime=-1e-8,o.render(Math.max(0,-m))),w&&qt(r(o),w),o}i(e,t);var n=e.prototype;return n.render=function(t,e,n){var r,i,u,s,o,a,l,h,f,D=this._time,p=this._tDur,c=this._dur,d=t>p-1e-8&&t>=0?p:t<1e-8?0:t;if(c){if(d!==this._tTime||!t||n||this._startAt&&this._zTime<0!=t<0){if(r=d,h=this.timeline,this._repeat){if(s=c+this._rDelay,r=xt(d%s),d===p?(u=this._repeat,r=c):((u=~~(d/s))&&u===d/s&&(r=c,u--),r>c&&(r=c)),(a=this._yoyo&&1&u)&&(f=this._yEase,r=c-r),o=Yt(this._tTime,s),r===D&&!n&&this._initted)return this;u!==o&&(h&&this._yEase&&Pe(h,a),!this.vars.repeatRefresh||a||this._lock||(this._lock=n=1,this.render(xt(s*u),!0).invalidate()._lock=0))}if(!this._initted){if(Gt(this,t<0?t:r,n,e))return this._tTime=0,this;if(c!==this._dur)return this.render(t,e,n)}for(this._tTime=d,this._time=r,!this._act&&this._ts&&(this._act=1,this._lazy=0),this.ratio=l=(f||this._ease)(r/c),this._from&&(this.ratio=l=1-l),r&&!D&&!e&&ce(this,"onStart"),i=this._pt;i;)i.r(l,i.d),i=i._next;h&&h.render(t<0?t:!r&&a?-1e-8:h._dur*l,e,n)||this._startAt&&(this._zTime=t),this._onUpdate&&!e&&(t<0&&this._startAt&&this._startAt.render(t,!0,n),ce(this,"onUpdate")),this._repeat&&u!==o&&this.vars.onRepeat&&!e&&this.parent&&ce(this,"onRepeat"),d!==this._tDur&&d||this._tTime!==d||(t<0&&this._startAt&&!this._onUpdate&&this._startAt.render(t,!0,!0),(t||!c)&&(d===this._tDur&&this._ts>0||!d&&this._ts<0)&&Nt(this,1),e||t<0&&!D||!d&&!D||(ce(this,d===p?"onComplete":"onReverseComplete",!0),this._prom&&!(d<p&&this.timeScale()>0)&&this._prom()))}}else!function(t,e,n,r){var i,u,s=t.ratio,o=e<0||!e&&s&&!t._start&&t._zTime>1e-8&&!t._dp._lock||(t._ts<0||t._dp._ts<0)&&"isFromStart"!==t.data&&"isStart"!==t.data?0:1,a=t._rDelay,l=0;if(a&&t._repeat&&(l=Jt(0,t._tDur,e),Yt(l,a)!==(u=Yt(t._tTime,a))&&(s=1-o,t.vars.repeatRefresh&&t._initted&&t.invalidate())),o!==s||r||1e-8===t._zTime||!e&&t._zTime){if(!t._initted&&Gt(t,e,r,n))return;for(u=t._zTime,t._zTime=e||(n?1e-8:0),n||(n=e&&!u),t.ratio=o,t._from&&(o=1-o),t._time=0,t._tTime=l,n||ce(t,"onStart"),i=t._pt;i;)i.r(o,i.d),i=i._next;t._startAt&&e<0&&t._startAt.render(e,!0,!0),t._onUpdate&&!n&&ce(t,"onUpdate"),l&&t._repeat&&!n&&t.parent&&ce(t,"onRepeat"),(e>=t._tDur||e<0)&&t.ratio===o&&(o&&Nt(t,1),n||(ce(t,o?"onComplete":"onReverseComplete",!0),t._prom&&t._prom()))}else t._zTime||(t._zTime=e)}(this,t,e,n);return this},n.targets=function(){return this._targets},n.invalidate=function(){return this._pt=this._op=this._startAt=this._onUpdate=this._act=this._lazy=0,this._ptLookup=[],this.timeline&&this.timeline.invalidate(),t.prototype.invalidate.call(this)},n.kill=function(t,e){if(void 0===e&&(e="all"),!(t||e&&"all"!==e)&&(this._lazy=0,this.parent))return de(this);if(this.timeline){var n=this.timeline.totalDuration();return this.timeline.killTweensOf(t,e,Xe&&!0!==Xe.vars.overwrite)._first||de(this),this.parent&&n!==this.timeline.totalDuration()&&Ht(this,this._dur*this.timeline._tDur/n,0,1),this}var r,i,u,s,o,a,l,h=this._targets,f=t?ie(t):h,D=this._ptLookup,p=this._pt;if((!e||"all"===e)&&function(t,e){for(var n=t.length,r=n===e.length;r&&n--&&t[n]===e[n];);return n<0}(h,f))return"all"===e&&(this._pt=0),de(this);for(r=this._op=this._op||[],"all"!==e&&(X(e)&&(o={},Ct(e,(function(t){return o[t]=1})),e=o),e=function(t,e){var n,r,i,u,s=t[0]?vt(t[0]).harness:0,o=s&&s.aliases;if(!o)return e;for(r in n=St({},e),o)if(r in n)for(i=(u=o[r].split(",")).length;i--;)n[u[i]]=n[r];return n}(h,e)),l=h.length;l--;)if(~f.indexOf(h[l]))for(o in i=D[l],"all"===e?(r[l]=e,s=i,u={}):(u=r[l]=r[l]||{},s=e),s)(a=i&&i[o])&&("kill"in a.d&&!0!==a.d.kill(o)||Lt(this,a,"_pt"),delete i[o]),"all"!==u&&(u[o]=1);return this._initted&&!this._pt&&p&&de(this),this},e.to=function(t,n){return new e(t,n,arguments[2])},e.from=function(t,n){return new e(t,wt(arguments,1))},e.delayedCall=function(t,n,r,i){return new e(n,0,{immediateRender:!1,lazy:!1,overwrite:!1,delay:t,onComplete:n,onReverseComplete:n,onCompleteParams:r,onReverseCompleteParams:r,callbackScope:i})},e.fromTo=function(t,n,r){return new e(t,wt(arguments,2))},e.set=function(t,n){return n.duration=0,n.repeatDelay||(n.repeat=0),new e(t,n)},e.killTweensOf=function(t,e,n){return u.killTweensOf(t,e,n)},e}(ze);Mt(Qe.prototype,{_targets:[],_lazy:0,_startAt:0,_op:0,_onInit:0}),Ct("staggerTo,staggerFrom,staggerFromTo",(function(t){Qe[t]=function(){var e=new Ye,n=ee.call(arguments,0);return n.splice("staggerFromTo"===t?5:4,0,0),e[t].apply(e,n)}}));var Ke=function(t,e,n){return t[e]=n},Ze=function(t,e,n){return t[e](n)},$e=function(t,e,n,r){return t[e](r.fp,n)},Je=function(t,e,n){return t.setAttribute(e,n)},tn=function(t,e){return j(t[e])?Ze:U(t[e])&&t.setAttribute?Je:Ke},en=function(t,e){return e.set(e.t,e.p,Math.round(1e4*(e.s+e.c*t))/1e4,e)},nn=function(t,e){return e.set(e.t,e.p,!!(e.s+e.c*t),e)},rn=function(t,e){var n=e._pt,r="";if(!t&&e.b)r=e.b;else if(1===t&&e.e)r=e.e;else{for(;n;)r=n.p+(n.m?n.m(n.s+n.c*t):Math.round(1e4*(n.s+n.c*t))/1e4)+r,n=n._next;r+=e.c}e.set(e.t,e.p,r,e)},un=function(t,e){for(var n=e._pt;n;)n.r(t,n.d),n=n._next},sn=function(t,e,n,r){for(var i,u=this._pt;u;)i=u._next,u.p===r&&u.modifier(t,e,n),u=i},on=function(t){for(var e,n,r=this._pt;r;)n=r._next,r.p===t&&!r.op||r.op===t?Lt(this,r,"_pt"):r.dep||(e=1),r=n;return!e},an=function(t,e,n,r){r.mSet(t,e,r.m.call(r.tween,n,r.mt),r)},ln=function(t){for(var e,n,r,i,u=t._pt;u;){for(e=u._next,n=r;n&&n.pr>u.pr;)n=n._next;(u._prev=n?n._prev:i)?u._prev._next=u:r=u,(u._next=n)?n._prev=u:i=u,u=e}t._pt=r},hn=function(){function t(t,e,n,r,i,u,s,o,a){this.t=e,this.s=r,this.c=i,this.p=n,this.r=u||en,this.d=s||this,this.set=o||Ke,this.pr=a||0,this._next=t,t&&(t._prev=this)}return t.prototype.modifier=function(t,e,n){this.mSet=this.mSet||this.set,this.set=an,this.m=t,this.mt=n,this.tween=e},t}();Ct(_t+"parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger",(function(t){return ht[t]=1})),rt.TweenMax=rt.TweenLite=Qe,rt.TimelineLite=rt.TimelineMax=Ye,u=new Ye({sortChildren:!1,defaults:B,autoRemoveChildren:!0,id:"root",smoothChildTiming:!0}),P.stringFilter=we;var fn={registerPlugin:function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];e.forEach((function(t){return ge(t)}))},timeline:function(t){return new Ye(t)},getTweensOf:function(t,e){return u.getTweensOf(t,e)},getProperty:function(t,e,n,r){X(t)&&(t=ie(t)[0]);var i=vt(t||{}).get,u=n?At:Tt;return"native"===n&&(n=""),t?e?u((pt[e]&&pt[e].get||i)(t,e,n,r)):function(e,n,r){return u((pt[e]&&pt[e].get||i)(t,e,n,r))}:t},quickSetter:function(t,e,n){if((t=ie(t)).length>1){var r=t.map((function(t){return cn.quickSetter(t,e,n)})),i=r.length;return function(t){for(var e=i;e--;)r[e](t)}}t=t[0]||{};var u=pt[e],s=vt(t),o=s.harness&&(s.harness.aliases||{})[e]||e,a=u?function(e){var r=new u;f._pt=0,r.init(t,n?e+n:e,f,0,[t]),r.render(1,r),f._pt&&un(1,f)}:s.set(t,o);return u?a:function(e){return a(t,o,n?e+n:e,s,1)}},isTweening:function(t){return u.getTweensOf(t,!0).length>0},defaults:function(t){return t&&t.ease&&(t.ease=Be(t.ease,B.ease)),Pt(B,t||{})},config:function(t){return Pt(P,t||{})},registerEffect:function(t){var e=t.name,n=t.effect,r=t.plugins,i=t.defaults,u=t.extendTimeline;(r||"").split(",").forEach((function(t){return t&&!pt[t]&&!rt[t]&&ot(e+" effect requires "+t+" plugin.")})),ct[e]=function(t,e,r){return n(ie(t),Mt(e||{},i),r)},u&&(Ye.prototype[e]=function(t,n,r){return this.add(ct[e](t,W(n)?n:(r=n)&&{},this),r)})},registerEase:function(t,e){Te[t]=Be(e)},parseEase:function(t,e){return arguments.length?Be(t,e):Te},getById:function(t){return u.getById(t)},exportRoot:function(t,e){void 0===t&&(t={});var n,r,i=new Ye(t);for(i.smoothChildTiming=q(t.smoothChildTiming),u.remove(i),i._dp=0,i._time=i._tTime=u._time,n=u._first;n;)r=n._next,!e&&!n._dur&&n instanceof Qe&&n.vars.onComplete===n._targets[0]||Wt(i,n,n._start-n._delay),n=r;return Wt(u,i,0),i},utils:{wrap:function t(e,n,r){var i=n-e;return K(e)?he(e,t(0,e.length),n):$t(r,(function(t){return(i+(t-e)%i)%i+e}))},wrapYoyo:function t(e,n,r){var i=n-e,u=2*i;return K(e)?he(e,t(0,e.length-1),n):$t(r,(function(t){return e+((t=(u+(t-e)%u)%u||0)>i?u-t:t)}))},distribute:se,random:le,snap:ae,normalize:function(t,e,n){return De(t,e,0,1,n)},getUnit:te,clamp:function(t,e,n){return $t(n,(function(n){return Jt(t,e,n)}))},splitColor:ve,toArray:ie,mapRange:De,pipe:function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];return function(t){return e.reduce((function(t,e){return e(t)}),t)}},unitize:function(t,e){return function(n){return t(parseFloat(n))+(e||te(n))}},interpolate:function t(e,n,r,i){var u=isNaN(e+n)?0:function(t){return(1-t)*e+t*n};if(!u){var s,o,a,l,h,f=X(e),D={};if(!0===r&&(i=1)&&(r=null),f)e={p:e},n={p:n};else if(K(e)&&!K(n)){for(a=[],l=e.length,h=l-2,o=1;o<l;o++)a.push(t(e[o-1],e[o]));l--,u=function(t){t*=l;var e=Math.min(h,~~t);return a[e](t-e)},r=n}else i||(e=St(K(e)?[]:{},e));if(!a){for(s in n)Ve.call(D,e,s,"get",n[s]);u=function(t){return un(t,D)||(f?e.p:e)}}}return $t(r,u)},shuffle:ue},install:ut,effects:ct,ticker:Ee,updateRoot:Ye.updateRoot,plugins:pt,globalTimeline:u,core:{PropTween:hn,globals:at,Tween:Qe,Timeline:Ye,Animation:ze,getCache:vt,_removeLinkedListItem:Lt}};Ct("to,from,fromTo,delayedCall,set,killTweensOf",(function(t){return fn[t]=Qe[t]})),Ee.add(Ye.updateRoot),f=fn.to({},{duration:0});var Dn=function(t,e){for(var n=t._pt;n&&n.p!==e&&n.op!==e&&n.fp!==e;)n=n._next;return n},pn=function(t,e){return{name:t,rawVars:1,init:function(t,n,r){r._onInit=function(t){var r,i;if(X(n)&&(r={},Ct(n,(function(t){return r[t]=1})),n=r),e){for(i in r={},n)r[i]=e(n[i]);n=r}!function(t,e){var n,r,i,u=t._targets;for(n in e)for(r=u.length;r--;)(i=t._ptLookup[r][n])&&(i=i.d)&&(i._pt&&(i=Dn(i,n)),i&&i.modifier&&i.modifier(e[n],t,u[r],n))}(t,n)}}}},cn=fn.registerPlugin({name:"attr",init:function(t,e,n,r,i){var u,s;for(u in e)(s=this.add(t,"setAttribute",(t.getAttribute(u)||0)+"",e[u],r,i,0,0,u))&&(s.op=u),this._props.push(u)}},{name:"endArray",init:function(t,e){for(var n=e.length;n--;)this.add(t,n,t[n]||0,e[n])}},pn("roundProps",oe),pn("modifiers"),pn("snap",ae))||fn;Qe.version=Ye.version=cn.version="3.5.1",l=1,G()&&be();Te.Power0,Te.Power1,Te.Power2,Te.Power3,Te.Power4,Te.Linear,Te.Quad,Te.Cubic,Te.Quart,Te.Quint,Te.Strong,Te.Elastic,Te.Back,Te.SteppedEase,Te.Bounce,Te.Sine,Te.Expo,Te.Circ;
/*!
 * CSSPlugin 3.5.1
 * https://greensock.com
 *
 * Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/var dn,gn,_n,mn,vn,yn,Cn,xn,Fn={},wn=180/Math.PI,En=Math.PI/180,bn=Math.atan2,Tn=/([A-Z])/g,An=/(?:left|right|width|margin|padding|x)/i,Mn=/[\s,\(]\S/,On={autoAlpha:"opacity,visibility",scale:"scaleX,scaleY",alpha:"opacity"},Sn=function(t,e){return e.set(e.t,e.p,Math.round(1e4*(e.s+e.c*t))/1e4+e.u,e)},Pn=function(t,e){return e.set(e.t,e.p,1===t?e.e:Math.round(1e4*(e.s+e.c*t))/1e4+e.u,e)},Bn=function(t,e){return e.set(e.t,e.p,t?Math.round(1e4*(e.s+e.c*t))/1e4+e.u:e.b,e)},kn=function(t,e){var n=e.s+e.c*t;e.set(e.t,e.p,~~(n+(n<0?-.5:.5))+e.u,e)},Ln=function(t,e){return e.set(e.t,e.p,t?e.e:e.b,e)},Nn=function(t,e){return e.set(e.t,e.p,1!==t?e.b:e.e,e)},Rn=function(t,e,n){return t.style[e]=n},In=function(t,e,n){return t.style.setProperty(e,n)},zn=function(t,e,n){return t._gsap[e]=n},Yn=function(t,e,n){return t._gsap.scaleX=t._gsap.scaleY=n},Xn=function(t,e,n,r,i){var u=t._gsap;u.scaleX=u.scaleY=n,u.renderTransform(i,u)},jn=function(t,e,n,r,i){var u=t._gsap;u[e]=n,u.renderTransform(i,u)},Vn="transform",Un=Vn+"Origin",Wn=function(t,e){var n=gn.createElementNS?gn.createElementNS((e||"http://www.w3.org/1999/xhtml").replace(/^https/,"http"),t):gn.createElement(t);return n.style?n:gn.createElement(t)},qn=function t(e,n,r){var i=getComputedStyle(e);return i[n]||i.getPropertyValue(n.replace(Tn,"-$1").toLowerCase())||i.getPropertyValue(n)||!r&&t(e,Hn(n)||n,1)||""},Gn="O,Moz,ms,Ms,Webkit".split(","),Hn=function(t,e,n){var r=(e||vn).style,i=5;if(t in r&&!n)return t;for(t=t.charAt(0).toUpperCase()+t.substr(1);i--&&!(Gn[i]+t in r););return i<0?null:(3===i?"ms":i>=0?Gn[i]:"")+t},Qn=function(){"undefined"!=typeof window&&window.document&&(dn=window,gn=dn.document,_n=gn.documentElement,vn=Wn("div")||{style:{}},yn=Wn("div"),Vn=Hn(Vn),Un=Vn+"Origin",vn.style.cssText="border-width:0;line-height:0;position:absolute;padding:0",xn=!!Hn("perspective"),mn=1)},Kn=function t(e){var n,r=Wn("svg",this.ownerSVGElement&&this.ownerSVGElement.getAttribute("xmlns")||"http://www.w3.org/2000/svg"),i=this.parentNode,u=this.nextSibling,s=this.style.cssText;if(_n.appendChild(r),r.appendChild(this),this.style.display="block",e)try{n=this.getBBox(),this._gsapBBox=this.getBBox,this.getBBox=t}catch(t){}else this._gsapBBox&&(n=this._gsapBBox());return i&&(u?i.insertBefore(this,u):i.appendChild(this)),_n.removeChild(r),this.style.cssText=s,n},Zn=function(t,e){for(var n=e.length;n--;)if(t.hasAttribute(e[n]))return t.getAttribute(e[n])},$n=function(t){var e;try{e=t.getBBox()}catch(n){e=Kn.call(t,!0)}return e&&(e.width||e.height)||t.getBBox===Kn||(e=Kn.call(t,!0)),!e||e.width||e.x||e.y?e:{x:+Zn(t,["x","cx","x1"])||0,y:+Zn(t,["y","cy","y1"])||0,width:0,height:0}},Jn=function(t){return!(!t.getCTM||t.parentNode&&!t.ownerSVGElement||!$n(t))},tr=function(t,e){if(e){var n=t.style;e in Fn&&e!==Un&&(e=Vn),n.removeProperty?("ms"!==e.substr(0,2)&&"webkit"!==e.substr(0,6)||(e="-"+e),n.removeProperty(e.replace(Tn,"-$1").toLowerCase())):n.removeAttribute(e)}},er=function(t,e,n,r,i,u){var s=new hn(t._pt,e,n,0,1,u?Nn:Ln);return t._pt=s,s.b=r,s.e=i,t._props.push(n),s},nr={deg:1,rad:1,turn:1},rr=function t(e,n,r,i){var u,s,o,a,l=parseFloat(r)||0,h=(r+"").trim().substr((l+"").length)||"px",f=vn.style,D=An.test(n),p="svg"===e.tagName.toLowerCase(),c=(p?"client":"offset")+(D?"Width":"Height"),d="px"===i,g="%"===i;return i===h||!l||nr[i]||nr[h]?l:("px"!==h&&!d&&(l=t(e,n,r,"px")),a=e.getCTM&&Jn(e),g&&(Fn[n]||~n.indexOf("adius"))?xt(l/(a?e.getBBox()[D?"width":"height"]:e[c])*100):(f[D?"width":"height"]=100+(d?h:i),s=~n.indexOf("adius")||"em"===i&&e.appendChild&&!p?e:e.parentNode,a&&(s=(e.ownerSVGElement||{}).parentNode),s&&s!==gn&&s.appendChild||(s=gn.body),(o=s._gsap)&&g&&o.width&&D&&o.time===Ee.time?xt(l/o.width*100):((g||"%"===h)&&(f.position=qn(e,"position")),s===e&&(f.position="static"),s.appendChild(vn),u=vn[c],s.removeChild(vn),f.position="absolute",D&&g&&((o=vt(s)).time=Ee.time,o.width=s[c]),xt(d?u*l/100:u&&l?100/u*l:0))))},ir=function(t,e,n,r){var i;return mn||Qn(),e in On&&"transform"!==e&&~(e=On[e]).indexOf(",")&&(e=e.split(",")[0]),Fn[e]&&"transform"!==e?(i=dr(t,r),i="transformOrigin"!==e?i[e]:gr(qn(t,Un))+" "+i.zOrigin+"px"):(!(i=t.style[e])||"auto"===i||r||~(i+"").indexOf("calc("))&&(i=ar[e]&&ar[e](t,e,n)||qn(t,e)||yt(t,e)||("opacity"===e?1:0)),n&&!~(i+"").indexOf(" ")?rr(t,e,i,n)+n:i},ur=function(t,e,n,r){if(!n||"none"===n){var i=Hn(e,t,1),u=i&&qn(t,i,1);u&&u!==n?(e=i,n=u):"borderColor"===e&&(n=qn(t,"borderTopColor"))}var s,o,a,l,h,f,D,p,c,d,g,_,m=new hn(this._pt,t.style,e,0,1,rn),v=0,y=0;if(m.b=n,m.e=r,n+="","auto"===(r+="")&&(t.style[e]=r,r=qn(t,e)||r,t.style[e]=n),we(s=[n,r]),r=s[1],a=(n=s[0]).match(J)||[],(r.match(J)||[]).length){for(;o=J.exec(r);)D=o[0],c=r.substring(v,o.index),h?h=(h+1)%5:"rgba("!==c.substr(-5)&&"hsla("!==c.substr(-5)||(h=1),D!==(f=a[y++]||"")&&(l=parseFloat(f)||0,g=f.substr((l+"").length),(_="="===D.charAt(1)?+(D.charAt(0)+"1"):0)&&(D=D.substr(2)),p=parseFloat(D),d=D.substr((p+"").length),v=J.lastIndex-d.length,d||(d=d||P.units[e]||g,v===r.length&&(r+=d,m.e+=d)),g!==d&&(l=rr(t,e,f,d)||0),m._pt={_next:m._pt,p:c||1===y?c:",",s:l,c:_?_*p:p-l,m:h&&h<4?Math.round:0});m.c=v<r.length?r.substring(v,r.length):""}else m.r="display"===e&&"none"===r?Nn:Ln;return et.test(r)&&(m.e=0),this._pt=m,m},sr={top:"0%",bottom:"100%",left:"0%",right:"100%",center:"50%"},or=function(t,e){if(e.tween&&e.tween._time===e.tween._dur){var n,r,i,u=e.t,s=u.style,o=e.u,a=u._gsap;if("all"===o||!0===o)s.cssText="",r=1;else for(i=(o=o.split(",")).length;--i>-1;)n=o[i],Fn[n]&&(r=1,n="transformOrigin"===n?Un:Vn),tr(u,n);r&&(tr(u,Vn),a&&(a.svg&&u.removeAttribute("transform"),dr(u,1),a.uncache=1))}},ar={clearProps:function(t,e,n,r,i){if("isFromStart"!==i.data){var u=t._pt=new hn(t._pt,e,n,0,0,or);return u.u=r,u.pr=-10,u.tween=i,t._props.push(n),1}}},lr=[1,0,0,1,0,0],hr={},fr=function(t){return"matrix(1, 0, 0, 1, 0, 0)"===t||"none"===t||!t},Dr=function(t){var e=qn(t,Vn);return fr(e)?lr:e.substr(7).match($).map(xt)},pr=function(t,e){var n,r,i,u,s=t._gsap||vt(t),o=t.style,a=Dr(t);return s.svg&&t.getAttribute("transform")?"1,0,0,1,0,0"===(a=[(i=t.transform.baseVal.consolidate().matrix).a,i.b,i.c,i.d,i.e,i.f]).join(",")?lr:a:(a!==lr||t.offsetParent||t===_n||s.svg||(i=o.display,o.display="block",(n=t.parentNode)&&t.offsetParent||(u=1,r=t.nextSibling,_n.appendChild(t)),a=Dr(t),i?o.display=i:tr(t,"display"),u&&(r?n.insertBefore(t,r):n?n.appendChild(t):_n.removeChild(t))),e&&a.length>6?[a[0],a[1],a[4],a[5],a[12],a[13]]:a)},cr=function(t,e,n,r,i,u){var s,o,a,l=t._gsap,h=i||pr(t,!0),f=l.xOrigin||0,D=l.yOrigin||0,p=l.xOffset||0,c=l.yOffset||0,d=h[0],g=h[1],_=h[2],m=h[3],v=h[4],y=h[5],C=e.split(" "),x=parseFloat(C[0])||0,F=parseFloat(C[1])||0;n?h!==lr&&(o=d*m-g*_)&&(a=x*(-g/o)+F*(d/o)-(d*y-g*v)/o,x=x*(m/o)+F*(-_/o)+(_*y-m*v)/o,F=a):(x=(s=$n(t)).x+(~C[0].indexOf("%")?x/100*s.width:x),F=s.y+(~(C[1]||C[0]).indexOf("%")?F/100*s.height:F)),r||!1!==r&&l.smooth?(v=x-f,y=F-D,l.xOffset=p+(v*d+y*_)-v,l.yOffset=c+(v*g+y*m)-y):l.xOffset=l.yOffset=0,l.xOrigin=x,l.yOrigin=F,l.smooth=!!r,l.origin=e,l.originIsAbsolute=!!n,t.style[Un]="0px 0px",u&&(er(u,l,"xOrigin",f,x),er(u,l,"yOrigin",D,F),er(u,l,"xOffset",p,l.xOffset),er(u,l,"yOffset",c,l.yOffset)),t.setAttribute("data-svg-origin",x+" "+F)},dr=function(t,e){var n=t._gsap||new Ie(t);if("x"in n&&!e&&!n.uncache)return n;var r,i,u,s,o,a,l,h,f,D,p,c,d,g,_,m,v,y,C,x,F,w,E,b,T,A,M,O,S,B,k,L,N=t.style,R=n.scaleX<0,I=qn(t,Un)||"0";return r=i=u=a=l=h=f=D=p=0,s=o=1,n.svg=!(!t.getCTM||!Jn(t)),g=pr(t,n.svg),n.svg&&(b=!n.uncache&&t.getAttribute("data-svg-origin"),cr(t,b||I,!!b||n.originIsAbsolute,!1!==n.smooth,g)),c=n.xOrigin||0,d=n.yOrigin||0,g!==lr&&(y=g[0],C=g[1],x=g[2],F=g[3],r=w=g[4],i=E=g[5],6===g.length?(s=Math.sqrt(y*y+C*C),o=Math.sqrt(F*F+x*x),a=y||C?bn(C,y)*wn:0,(f=x||F?bn(x,F)*wn+a:0)&&(o*=Math.cos(f*En)),n.svg&&(r-=c-(c*y+d*x),i-=d-(c*C+d*F))):(L=g[6],B=g[7],M=g[8],O=g[9],S=g[10],k=g[11],r=g[12],i=g[13],u=g[14],l=(_=bn(L,S))*wn,_&&(b=w*(m=Math.cos(-_))+M*(v=Math.sin(-_)),T=E*m+O*v,A=L*m+S*v,M=w*-v+M*m,O=E*-v+O*m,S=L*-v+S*m,k=B*-v+k*m,w=b,E=T,L=A),h=(_=bn(-x,S))*wn,_&&(m=Math.cos(-_),k=F*(v=Math.sin(-_))+k*m,y=b=y*m-M*v,C=T=C*m-O*v,x=A=x*m-S*v),a=(_=bn(C,y))*wn,_&&(b=y*(m=Math.cos(_))+C*(v=Math.sin(_)),T=w*m+E*v,C=C*m-y*v,E=E*m-w*v,y=b,w=T),l&&Math.abs(l)+Math.abs(a)>359.9&&(l=a=0,h=180-h),s=xt(Math.sqrt(y*y+C*C+x*x)),o=xt(Math.sqrt(E*E+L*L)),_=bn(w,E),f=Math.abs(_)>2e-4?_*wn:0,p=k?1/(k<0?-k:k):0),n.svg&&(b=t.getAttribute("transform"),n.forceCSS=t.setAttribute("transform","")||!fr(qn(t,Vn)),b&&t.setAttribute("transform",b))),Math.abs(f)>90&&Math.abs(f)<270&&(R?(s*=-1,f+=a<=0?180:-180,a+=a<=0?180:-180):(o*=-1,f+=f<=0?180:-180)),n.x=((n.xPercent=r&&Math.round(t.offsetWidth/2)===Math.round(-r)?-50:0)?0:r)+"px",n.y=((n.yPercent=i&&Math.round(t.offsetHeight/2)===Math.round(-i)?-50:0)?0:i)+"px",n.z=u+"px",n.scaleX=xt(s),n.scaleY=xt(o),n.rotation=xt(a)+"deg",n.rotationX=xt(l)+"deg",n.rotationY=xt(h)+"deg",n.skewX=f+"deg",n.skewY=D+"deg",n.transformPerspective=p+"px",(n.zOrigin=parseFloat(I.split(" ")[2])||0)&&(N[Un]=gr(I)),n.xOffset=n.yOffset=0,n.force3D=P.force3D,n.renderTransform=n.svg?yr:xn?vr:mr,n.uncache=0,n},gr=function(t){return(t=t.split(" "))[0]+" "+t[1]},_r=function(t,e,n){var r=te(e);return xt(parseFloat(e)+parseFloat(rr(t,"x",n+"px",r)))+r},mr=function(t,e){e.z="0px",e.rotationY=e.rotationX="0deg",e.force3D=0,vr(t,e)},vr=function(t,e){var n=e||this,r=n.xPercent,i=n.yPercent,u=n.x,s=n.y,o=n.z,a=n.rotation,l=n.rotationY,h=n.rotationX,f=n.skewX,D=n.skewY,p=n.scaleX,c=n.scaleY,d=n.transformPerspective,g=n.force3D,_=n.target,m=n.zOrigin,v="",y="auto"===g&&t&&1!==t||!0===g;if(m&&("0deg"!==h||"0deg"!==l)){var C,x=parseFloat(l)*En,F=Math.sin(x),w=Math.cos(x);x=parseFloat(h)*En,C=Math.cos(x),u=_r(_,u,F*C*-m),s=_r(_,s,-Math.sin(x)*-m),o=_r(_,o,w*C*-m+m)}"0px"!==d&&(v+="perspective("+d+") "),(r||i)&&(v+="translate("+r+"%, "+i+"%) "),(y||"0px"!==u||"0px"!==s||"0px"!==o)&&(v+="0px"!==o||y?"translate3d("+u+", "+s+", "+o+") ":"translate("+u+", "+s+") "),"0deg"!==a&&(v+="rotate("+a+") "),"0deg"!==l&&(v+="rotateY("+l+") "),"0deg"!==h&&(v+="rotateX("+h+") "),"0deg"===f&&"0deg"===D||(v+="skew("+f+", "+D+") "),1===p&&1===c||(v+="scale("+p+", "+c+") "),_.style[Vn]=v||"translate(0, 0)"},yr=function(t,e){var n,r,i,u,s,o=e||this,a=o.xPercent,l=o.yPercent,h=o.x,f=o.y,D=o.rotation,p=o.skewX,c=o.skewY,d=o.scaleX,g=o.scaleY,_=o.target,m=o.xOrigin,v=o.yOrigin,y=o.xOffset,C=o.yOffset,x=o.forceCSS,F=parseFloat(h),w=parseFloat(f);D=parseFloat(D),p=parseFloat(p),(c=parseFloat(c))&&(p+=c=parseFloat(c),D+=c),D||p?(D*=En,p*=En,n=Math.cos(D)*d,r=Math.sin(D)*d,i=Math.sin(D-p)*-g,u=Math.cos(D-p)*g,p&&(c*=En,s=Math.tan(p-c),i*=s=Math.sqrt(1+s*s),u*=s,c&&(s=Math.tan(c),n*=s=Math.sqrt(1+s*s),r*=s)),n=xt(n),r=xt(r),i=xt(i),u=xt(u)):(n=d,u=g,r=i=0),(F&&!~(h+"").indexOf("px")||w&&!~(f+"").indexOf("px"))&&(F=rr(_,"x",h,"px"),w=rr(_,"y",f,"px")),(m||v||y||C)&&(F=xt(F+m-(m*n+v*i)+y),w=xt(w+v-(m*r+v*u)+C)),(a||l)&&(s=_.getBBox(),F=xt(F+a/100*s.width),w=xt(w+l/100*s.height)),s="matrix("+n+","+r+","+i+","+u+","+F+","+w+")",_.setAttribute("transform",s),x&&(_.style[Vn]=s)},Cr=function(t,e,n,r,i,u){var s,o,a=X(i),l=parseFloat(i)*(a&&~i.indexOf("rad")?wn:1),h=u?l*u:l-r,f=r+h+"deg";return a&&("short"===(s=i.split("_")[1])&&(h%=360)!==h%180&&(h+=h<0?360:-360),"cw"===s&&h<0?h=(h+36e9)%360-360*~~(h/360):"ccw"===s&&h>0&&(h=(h-36e9)%360-360*~~(h/360))),t._pt=o=new hn(t._pt,e,n,r,h,Pn),o.e=f,o.u="deg",t._props.push(n),o},xr=function(t,e,n){var r,i,u,s,o,a,l,h=yn.style,f=n._gsap;for(i in h.cssText=getComputedStyle(n).cssText+";position:absolute;display:block;",h[Vn]=e,gn.body.appendChild(yn),r=dr(yn,1),Fn)(u=f[i])!==(s=r[i])&&"perspective,force3D,transformOrigin,svgOrigin".indexOf(i)<0&&(o=te(u)!==(l=te(s))?rr(n,i,u,l):parseFloat(u),a=parseFloat(s),t._pt=new hn(t._pt,f,i,o,a-o,Sn),t._pt.u=l||0,t._props.push(i));gn.body.removeChild(yn)};Ct("padding,margin,Width,Radius",(function(t,e){var n="Top",r="Right",i="Bottom",u="Left",s=(e<3?[n,r,i,u]:[n+u,n+r,i+r,i+u]).map((function(n){return e<2?t+n:"border"+n+t}));ar[e>1?"border"+t:t]=function(t,e,n,r,i){var u,o;if(arguments.length<4)return u=s.map((function(e){return ir(t,e,n)})),5===(o=u.join(" ")).split(u[0]).length?u[0]:o;u=(r+"").split(" "),o={},s.forEach((function(t,e){return o[t]=u[e]=u[e]||u[(e-1)/2|0]})),t.init(e,o,i)}}));var Fr,wr,Er={name:"css",register:Qn,targetTest:function(t){return t.style&&t.nodeType},init:function(t,e,n,r,i){var u,s,o,a,l,h,f,D,p,c,d,g,_,m,v,y,C,x,F,w=this._props,E=t.style;for(f in mn||Qn(),e)if("autoRound"!==f&&(s=e[f],!pt[f]||!Ue(f,e,n,r,t,i)))if(l=typeof s,h=ar[f],"function"===l&&(l=typeof(s=s.call(n,r,t,i))),"string"===l&&~s.indexOf("random(")&&(s=fe(s)),h)h(this,t,f,s,n)&&(v=1);else if("--"===f.substr(0,2))this.add(E,"setProperty",getComputedStyle(t).getPropertyValue(f)+"",s+"",r,i,0,0,f);else if("undefined"!==l){if(u=ir(t,f),a=parseFloat(u),(c="string"===l&&"="===s.charAt(1)?+(s.charAt(0)+"1"):0)&&(s=s.substr(2)),o=parseFloat(s),f in On&&("autoAlpha"===f&&(1===a&&"hidden"===ir(t,"visibility")&&o&&(a=0),er(this,E,"visibility",a?"inherit":"hidden",o?"inherit":"hidden",!o)),"scale"!==f&&"transform"!==f&&~(f=On[f]).indexOf(",")&&(f=f.split(",")[0])),d=f in Fn)if(g||((_=t._gsap).renderTransform||dr(t),m=!1!==e.smoothOrigin&&_.smooth,(g=this._pt=new hn(this._pt,E,Vn,0,1,_.renderTransform,_,0,-1)).dep=1),"scale"===f)this._pt=new hn(this._pt,_,"scaleY",_.scaleY,c?c*o:o-_.scaleY),w.push("scaleY",f),f+="X";else{if("transformOrigin"===f){C=void 0,x=void 0,F=void 0,C=(y=s).split(" "),x=C[0],F=C[1]||"50%","top"!==x&&"bottom"!==x&&"left"!==F&&"right"!==F||(y=x,x=F,F=y),C[0]=sr[x]||x,C[1]=sr[F]||F,s=C.join(" "),_.svg?cr(t,s,0,m,0,this):((p=parseFloat(s.split(" ")[2])||0)!==_.zOrigin&&er(this,_,"zOrigin",_.zOrigin,p),er(this,E,f,gr(u),gr(s)));continue}if("svgOrigin"===f){cr(t,s,1,m,0,this);continue}if(f in hr){Cr(this,_,f,a,s,c);continue}if("smoothOrigin"===f){er(this,_,"smooth",_.smooth,s);continue}if("force3D"===f){_[f]=s;continue}if("transform"===f){xr(this,s,t);continue}}else f in E||(f=Hn(f)||f);if(d||(o||0===o)&&(a||0===a)&&!Mn.test(s)&&f in E)o||(o=0),(D=(u+"").substr((a+"").length))!==(p=te(s)||(f in P.units?P.units[f]:D))&&(a=rr(t,f,u,p)),this._pt=new hn(this._pt,d?_:E,f,a,c?c*o:o-a,"px"!==p||!1===e.autoRound||d?Sn:kn),this._pt.u=p||0,D!==p&&(this._pt.b=u,this._pt.r=Bn);else if(f in E)ur.call(this,t,f,u,s);else{if(!(f in t)){st(f,s);continue}this.add(t,f,t[f],s,r,i)}w.push(f)}v&&ln(this)},get:ir,aliases:On,getSetter:function(t,e,n){var r=On[e];return r&&r.indexOf(",")<0&&(e=r),e in Fn&&e!==Un&&(t._gsap.x||ir(t,"x"))?n&&Cn===n?"scale"===e?Yn:zn:(Cn=n||{})&&("scale"===e?Xn:jn):t.style&&!U(t.style[e])?Rn:~e.indexOf("-")?In:tn(t,e)},core:{_removeProperty:tr,_getMatrix:pr}};cn.utils.checkPrefix=Hn,wr=Ct("x,y,z,scale,scaleX,scaleY,xPercent,yPercent,"+(Fr="rotation,rotationX,rotationY,skewX,skewY")+",transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective",(function(t){Fn[t]=1})),Ct(Fr,(function(t){P.units[t]="deg",hr[t]=1})),On[wr[13]]="x,y,z,scale,scaleX,scaleY,xPercent,yPercent,"+Fr,Ct("0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY",(function(t){var e=t.split(":");On[e[1]]=wr[e[0]]})),Ct("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective",(function(t){P.units[t]="px"})),cn.registerPlugin(Er);var br,Tr,Ar,Mr=cn.registerPlugin(Er)||cn,Or=Mr.core.Tween,Sr=function(){return br||"undefined"!=typeof window&&(br=window.gsap)&&br.registerPlugin&&br},Pr=function(t){br=Sr(),(Ar=br&&br.parseEase("_CE"))?(Tr=1,br.parseEase("bounce").config=function(t){return"object"==typeof t?kr("",t):kr("bounce("+t+")",{strength:+t})}):t&&console.warn("Please gsap.registerPlugin(CustomEase, CustomBounce)")},Br=function(t){var e,n=t.length,r=1/t[n-2];for(e=2;e<n;e+=2)t[e]=~~(t[e]*r*1e3)/1e3;t[n-2]=1},kr=function(t,e){Tr||Pr(1),e=e||{};var n,r,i,u,s,o,a,l=Math.min(.999,e.strength||.7),h=l,f=(e.squash||0)/100,D=f,p=1/.03,c=.2,d=1,g=.1,_=[0,0,.07,0,.1,1,.1,1],m=[0,0,0,0,.1,0,.1,0];for(s=0;s<200&&(o=g+(c*=h*((h+1)/2)),u=1-(d*=l*l),r=(i=g+.49*c)+.8*(i-(n=g+d/p)),f&&(g+=f,n+=f,i+=f,r+=f,o+=f,a=f/D,m.push(g-f,0,g-f,a,g-f/2,a,g,a,g,0,g,0,g,-.6*a,g+(o-g)/6,0,o,0),_.push(g-f,1,g,1,g,1),f*=l*l),_.push(g,1,n,u,i,u,r,u,o,1,o,1),l*=.95,p=d/(o-r),g=o,!(u>.999));s++);if(e.endAtStart&&"false"!==e.endAtStart){if(i=-.1,_.unshift(i,1,i,1,-.07,0),D)for(i-=f=2.5*D,_.unshift(i,1,i,1,i,1),m.splice(0,6),m.unshift(i,0,i,0,i,1,i+f/2,1,i+f,1,i+f,0,i+f,0,i+f,-.6,i+f+.033,0),s=0;s<m.length;s+=2)m[s]-=i;for(s=0;s<_.length;s+=2)_[s]-=i,_[s+1]=1-_[s+1]}return f&&(Br(m),m[2]="C"+m[2],Ar(e.squashID||t+"-squash","M"+m.join(","))),Br(_),_[2]="C"+_[2],Ar(t,"M"+_.join(","))},Lr=function(){function t(t,e){this.ease=kr(t,e)}return t.create=function(t,e){return kr(t,e)},t.register=function(t){br=t,Pr()},t}();
/*!
 * CustomBounce 3.5.1
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/Sr()&&br.registerPlugin(Lr),Lr.version="3.5.1";
/*!
 * paths 3.5.1
 * https://greensock.com
 *
 * Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/
var Nr=/[achlmqstvz]|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,Rr=/(?:(-)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,Ir=/[\+\-]?\d*\.?\d+e[\+\-]?\d+/gi,zr=/(^[#\.][a-z]|[a-y][a-z])/i,Yr=Math.PI/180,Xr=180/Math.PI,jr=Math.sin,Vr=Math.cos,Ur=Math.abs,Wr=Math.sqrt,qr=Math.atan2,Gr=function(t){return"string"==typeof t},Hr=function(t){return"number"==typeof t},Qr={},Kr={},Zr=function(t){return Math.round((t+1e8)%1*1e5)/1e5||(t<0?0:1)},$r=function(t){return Math.round(1e5*t)/1e5||0},Jr=function(t,e,n,r){var i=t[e],u=1===r?6:hi(i,n,r);if(u&&u+n+2<i.length)return t.splice(e,0,i.slice(0,n+u+2)),i.splice(0,n+u),1},ti=function(t,e){return e.totalLength=t.totalLength,t.samples?(e.samples=t.samples.slice(0),e.lookup=t.lookup.slice(0),e.minLength=t.minLength,e.resolution=t.resolution):e.totalPoints=t.totalPoints,e},ei=function(t,e){var n=t.length,r=t[n-1]||[],i=r.length;e[0]===r[i-2]&&e[1]===r[i-1]&&(e=r.concat(e.slice(2)),n--),t[n]=e};function ni(t){var e,n=(t=Gr(t)&&zr.test(t)&&document.querySelector(t)||t).getAttribute?t:0;return n&&(t=t.getAttribute("d"))?(n._gsPath||(n._gsPath={}),(e=n._gsPath[t])&&!e._dirty?e:n._gsPath[t]=di(t)):t?Gr(t)?di(t):Hr(t[0])?[t]:t:console.warn("Expecting a <path> element or an SVG path data string")}function ri(t){var e,n=0;for(t.reverse();n<t.length;n+=2)e=t[n],t[n]=t[n+1],t[n+1]=e;t.reversed=!t.reversed}var ii={rect:"rx,ry,x,y,width,height",circle:"r,cx,cy",ellipse:"rx,ry,cx,cy",line:"x1,x2,y1,y2"};function ui(t,e){var n,r,i,u,s,o,a,l,h,f,D,p,c,d,g,_,m,v,y,C,x,F,w=t.tagName.toLowerCase(),E=.552284749831;return"path"!==w&&t.getBBox?(o=function(t,e){var n,r=document.createElementNS("http://www.w3.org/2000/svg","path"),i=[].slice.call(t.attributes),u=i.length;for(e=","+e+",";--u>-1;)n=i[u].nodeName.toLowerCase(),e.indexOf(","+n+",")<0&&r.setAttributeNS(null,n,i[u].nodeValue);return r}(t,"x,y,width,height,cx,cy,rx,ry,r,x1,x2,y1,y2,points"),F=function(t,e){for(var n=e?e.split(","):[],r={},i=n.length;--i>-1;)r[n[i]]=+t.getAttribute(n[i])||0;return r}(t,ii[w]),"rect"===w?(u=F.rx,s=F.ry||u,r=F.x,i=F.y,f=F.width-2*u,D=F.height-2*s,n=u||s?"M"+(_=(d=(c=r+u)+f)+u)+","+(v=i+s)+" V"+(y=v+D)+" C"+[_,C=y+s*E,g=d+u*E,x=y+s,d,x,d-(d-c)/3,x,c+(d-c)/3,x,c,x,p=r+u*(1-E),x,r,C,r,y,r,y-(y-v)/3,r,v+(y-v)/3,r,v,r,m=i+s*(1-E),p,i,c,i,c+(d-c)/3,i,d-(d-c)/3,i,d,i,g,i,_,m,_,v].join(",")+"z":"M"+(r+f)+","+i+" v"+D+" h"+-f+" v"+-D+" h"+f+"z"):"circle"===w||"ellipse"===w?("circle"===w?l=(u=s=F.r)*E:(u=F.rx,l=(s=F.ry)*E),n="M"+((r=F.cx)+u)+","+(i=F.cy)+" C"+[r+u,i+l,r+(a=u*E),i+s,r,i+s,r-a,i+s,r-u,i+l,r-u,i,r-u,i-l,r-a,i-s,r,i-s,r+a,i-s,r+u,i-l,r+u,i].join(",")+"z"):"line"===w?n="M"+F.x1+","+F.y1+" L"+F.x2+","+F.y2:"polyline"!==w&&"polygon"!==w||(n="M"+(r=(h=(t.getAttribute("points")+"").match(Rr)||[]).shift())+","+(i=h.shift())+" L"+h.join(","),"polygon"===w&&(n+=","+r+","+i+"z")),o.setAttribute("d",mi(o._gsRawPath=di(n))),e&&t.parentNode&&(t.parentNode.insertBefore(o,t),t.parentNode.removeChild(t)),o):t}function si(t,e,n){var r,i=t[e],u=t[e+2],s=t[e+4];return i+=(u-i)*n,i+=((u+=(s-u)*n)-i)*n,r=u+(s+(t[e+6]-s)*n-u)*n-i,i=t[e+1],i+=((u=t[e+3])-i)*n,i+=((u+=((s=t[e+5])-u)*n)-i)*n,$r(qr(u+(s+(t[e+7]-s)*n-u)*n-i,r)*Xr)}function oi(t,e,n){void 0===n&&(n=1);var r=(e=e||0)>n,i=Math.max(0,~~(Ur(n-e)-1e-8));if(r&&(r=n,n=e,e=r,r=1,i-=i?1:0),e<0||n<0){var u=1+~~Math.min(e,n);e+=u,n+=u}var s,o,a,l,h,f,D,p=function(t){for(var e=[],n=0;n<t.length;n++)e[n]=ti(t[n],t[n].slice(0));return ti(t,e)}(t.totalLength?t:li(t)),c=n>1,d=fi(p,e,Qr,!0),g=fi(p,n,Kr),_=g.segment,m=d.segment,v=g.segIndex,y=d.segIndex,C=g.i,x=d.i,F=y===v,w=C===x&&F,E=F&&x>C||w&&d.t>g.t;if(c||i){if(Jr(p,y,x,d.t)&&(s=1,y++,w?E?g.t/=d.t:(g.t=(g.t-d.t)/(1-d.t),v++,C=0):y<=v+1&&!E&&(v++,F&&(C-=x))),g.t?Jr(p,v,C,g.t)&&(E&&s&&y++,r&&v++):(v--,r&&y--),l=[],f=1+(h=p.length)*i,D=y,r)for(f+=(h-(v=(v||h)-1)+y)%h,a=0;a<f;a++)ei(l,p[D]),D=(D||h)-1;else for(f+=(h-y+v)%h,a=0;a<f;a++)ei(l,p[D++%h]);p=l}else if(o=1===g.t?6:hi(_,C,g.t),e!==n)for(s=hi(m,x,w?d.t/g.t:d.t),F&&(o+=s),_.splice(C+o+2),(s||x)&&m.splice(0,x+s),a=p.length;a--;)(a<y||a>v)&&p.splice(a,1);else _.angle=si(_,C+o,0),d=_[C+=o],g=_[C+1],_.length=_.totalLength=0,_.totalPoints=p.totalPoints=8,_.push(d,g,d,g,d,g,d,g);return r&&function(t,e){var n=t.length;for(e||t.reverse();n--;)t[n].reversed||ri(t[n])}(p,c||i),p.totalLength=0,p}function ai(t,e,n){e=e||0,t.samples||(t.samples=[],t.lookup=[]);var r,i,u,s,o,a,l,h,f,D,p,c,d,g,_,m,v,y=~~t.resolution||12,C=1/y,x=n?e+6*n+1:t.length,F=t[e],w=t[e+1],E=e?e/6*y:0,b=t.samples,T=t.lookup,A=(e?t.minLength:1e8)||1e8,M=b[E+n*y-1],O=e?b[E-1]:0;for(b.length=T.length=0,i=e+2;i<x;i+=6){if(u=t[i+4]-F,s=t[i+2]-F,o=t[i]-F,h=t[i+5]-w,f=t[i+3]-w,D=t[i+1]-w,a=l=p=c=0,Ur(u)<1e-5&&Ur(h)<1e-5&&Ur(o)+Ur(D)<1e-5)t.length>8&&(t.splice(i,6),i-=6,x-=6);else for(r=1;r<=y;r++)a=l-(l=((g=C*r)*g*u+3*(d=1-g)*(g*s+d*o))*g),p=c-(c=(g*g*h+3*d*(g*f+d*D))*g),(m=Wr(p*p+a*a))<A&&(A=m),O+=m,b[E++]=O;F+=u,w+=h}if(M)for(M-=O;E<b.length;E++)b[E]+=M;if(b.length&&A)for(t.totalLength=v=b[b.length-1]||0,t.minLength=A,m=_=0,r=0;r<v;r+=A)T[m++]=b[_]<r?++_:_;else t.totalLength=b[0]=0;return e?O-b[e/2-1]:O}function li(t,e){var n,r,i;for(i=n=r=0;i<t.length;i++)t[i].resolution=~~e||12,r+=t[i].length,n+=ai(t[i]);return t.totalPoints=r,t.totalLength=n,t}function hi(t,e,n){if(n<=0||n>=1)return 0;var r=t[e],i=t[e+1],u=t[e+2],s=t[e+3],o=t[e+4],a=t[e+5],l=r+(u-r)*n,h=u+(o-u)*n,f=i+(s-i)*n,D=s+(a-s)*n,p=l+(h-l)*n,c=f+(D-f)*n,d=o+(t[e+6]-o)*n,g=a+(t[e+7]-a)*n;return h+=(d-h)*n,D+=(g-D)*n,t.splice(e+2,4,$r(l),$r(f),$r(p),$r(c),$r(p+(h-p)*n),$r(c+(D-c)*n),$r(h),$r(D),$r(d),$r(g)),t.samples&&t.samples.splice(e/6*t.resolution|0,0,0,0,0,0,0,0),6}function fi(t,e,n,r){n=n||{},t.totalLength||li(t),(e<0||e>1)&&(e=Zr(e));var i,u,s,o,a,l,h,f=0,D=t[0];if(t.length>1){for(s=t.totalLength*e,a=l=0;(a+=t[l++].totalLength)<s;)f=l;e=(s-(o=a-(D=t[f]).totalLength))/(a-o)||0}return i=D.samples,u=D.resolution,s=D.totalLength*e,o=(l=D.lookup[~~(s/D.minLength)]||0)?i[l-1]:0,(a=i[l])<s&&(o=a,a=i[++l]),h=1/u*((s-o)/(a-o)+l%u),l=6*~~(l/u),r&&1===h&&(l+6<D.length?(l+=6,h=0):f+1<t.length&&(l=h=0,D=t[++f])),n.t=h,n.i=l,n.path=t,n.segment=D,n.segIndex=f,n}function Di(t,e,n,r){var i,u,s,o,a,l,h,f,D,p=t[0],c=r||{};if((e<0||e>1)&&(e=Zr(e)),t.length>1){for(s=t.totalLength*e,a=l=0;(a+=t[l++].totalLength)<s;)p=t[l];e=(s-(o=a-p.totalLength))/(a-o)||0}return i=p.samples,u=p.resolution,s=p.totalLength*e,o=(l=p.lookup[~~(s/p.minLength)]||0)?i[l-1]:0,(a=i[l])<s&&(o=a,a=i[++l]),D=1-(h=1/u*((s-o)/(a-o)+l%u)||0),f=p[l=6*~~(l/u)],c.x=$r((h*h*(p[l+6]-f)+3*D*(h*(p[l+4]-f)+D*(p[l+2]-f)))*h+f),c.y=$r((h*h*(p[l+7]-(f=p[l+1]))+3*D*(h*(p[l+5]-f)+D*(p[l+3]-f)))*h+f),n&&(c.angle=p.totalLength?si(p,l,h>=1?1-1e-9:h||1e-9):p.angle||0),c}function pi(t,e,n,r,i,u,s){for(var o,a,l,h,f,D=t.length;--D>-1;)for(a=(o=t[D]).length,l=0;l<a;l+=2)h=o[l],f=o[l+1],o[l]=h*e+f*r+u,o[l+1]=h*n+f*i+s;return t._dirty=1,t}function ci(t,e,n,r,i,u,s,o,a){if(t!==o||e!==a){n=Ur(n),r=Ur(r);var l=i%360*Yr,h=Vr(l),f=jr(l),D=Math.PI,p=2*D,c=(t-o)/2,d=(e-a)/2,g=h*c+f*d,_=-f*c+h*d,m=g*g,v=_*_,y=m/(n*n)+v/(r*r);y>1&&(n=Wr(y)*n,r=Wr(y)*r);var C=n*n,x=r*r,F=(C*x-C*v-x*m)/(C*v+x*m);F<0&&(F=0);var w=(u===s?-1:1)*Wr(F),E=w*(n*_/r),b=w*(-r*g/n),T=(t+o)/2+(h*E-f*b),A=(e+a)/2+(f*E+h*b),M=(g-E)/n,O=(_-b)/r,S=(-g-E)/n,P=(-_-b)/r,B=M*M+O*O,k=(O<0?-1:1)*Math.acos(M/Wr(B)),L=(M*P-O*S<0?-1:1)*Math.acos((M*S+O*P)/Wr(B*(S*S+P*P)));isNaN(L)&&(L=D),!s&&L>0?L-=p:s&&L<0&&(L+=p),k%=p,L%=p;var N,R=Math.ceil(Ur(L)/(p/4)),I=[],z=L/R,Y=4/3*jr(z/2)/(1+Vr(z/2)),X=h*n,j=f*n,V=f*-r,U=h*r;for(N=0;N<R;N++)g=Vr(i=k+N*z),_=jr(i),M=Vr(i+=z),O=jr(i),I.push(g-Y*_,_+Y*g,M+Y*O,O-Y*M,M,O);for(N=0;N<I.length;N+=2)g=I[N],_=I[N+1],I[N]=g*X+_*V+T,I[N+1]=g*j+_*U+A;return I[N-2]=o,I[N-1]=a,I}}function di(t){var e,n,r,i,u,s,o,a,l,h,f,D,p,c,d,g=(t+"").replace(Ir,(function(t){var e=+t;return e<1e-4&&e>-1e-4?0:e})).match(Nr)||[],_=[],m=0,v=0,y=g.length,C=0,x="ERROR: malformed path: "+t,F=function(t,e,n,r){h=(n-t)/3,f=(r-e)/3,o.push(t+h,e+f,n-h,r-f,n,r)};if(!t||!isNaN(g[0])||isNaN(g[1]))return console.log(x),_;for(e=0;e<y;e++)if(p=u,isNaN(g[e])?s=(u=g[e].toUpperCase())!==g[e]:e--,r=+g[e+1],i=+g[e+2],s&&(r+=m,i+=v),e||(a=r,l=i),"M"===u)o&&(o.length<8?_.length-=1:C+=o.length),m=a=r,v=l=i,o=[r,i],_.push(o),e+=2,u="L";else if("C"===u)o||(o=[0,0]),s||(m=v=0),o.push(r,i,m+1*g[e+3],v+1*g[e+4],m+=1*g[e+5],v+=1*g[e+6]),e+=6;else if("S"===u)h=m,f=v,"C"!==p&&"S"!==p||(h+=m-o[o.length-4],f+=v-o[o.length-3]),s||(m=v=0),o.push(h,f,r,i,m+=1*g[e+3],v+=1*g[e+4]),e+=4;else if("Q"===u)h=m+2/3*(r-m),f=v+2/3*(i-v),s||(m=v=0),m+=1*g[e+3],v+=1*g[e+4],o.push(h,f,m+2/3*(r-m),v+2/3*(i-v),m,v),e+=4;else if("T"===u)h=m-o[o.length-4],f=v-o[o.length-3],o.push(m+h,v+f,r+2/3*(m+1.5*h-r),i+2/3*(v+1.5*f-i),m=r,v=i),e+=2;else if("H"===u)F(m,v,m=r,v),e+=1;else if("V"===u)F(m,v,m,v=r+(s?v-m:0)),e+=1;else if("L"===u||"Z"===u)"Z"===u&&(r=a,i=l,o.closed=!0),("L"===u||Ur(m-r)>.5||Ur(v-i)>.5)&&(F(m,v,r,i),"L"===u&&(e+=2)),m=r,v=i;else if("A"===u){if(c=g[e+4],d=g[e+5],h=g[e+6],f=g[e+7],n=7,c.length>1&&(c.length<3?(f=h,h=d,n--):(f=d,h=c.substr(2),n-=2),d=c.charAt(1),c=c.charAt(0)),D=ci(m,v,+g[e+1],+g[e+2],+g[e+3],+c,+d,(s?m:0)+1*h,(s?v:0)+1*f),e+=n,D)for(n=0;n<D.length;n++)o.push(D[n]);m=o[o.length-2],v=o[o.length-1]}else console.log(x);return(e=o.length)<6?(_.pop(),e=0):o[0]===o[e-2]&&o[1]===o[e-1]&&(o.closed=!0),_.totalPoints=C+e,_}function gi(t,e){void 0===e&&(e=1);for(var n=t[0],r=0,i=[n,r],u=2;u<t.length;u+=2)i.push(n,r,t[u],r=(t[u]-n)*e/2,n=t[u],-r);return i}function _i(t,e,n){var r,i,u,s,o,a,l,h,f,D,p,c,d,g,_=t.length-2,m=+t[0],v=+t[1],y=+t[2],C=+t[3],x=[m,v,m,v],F=y-m,w=C-v,E=Math.abs(t[_]-m)<.001&&Math.abs(t[_+1]-v)<.001;for(isNaN(n)&&(n=Math.PI/10),E&&(t.push(y,C),y=m,C=v,m=t[_-2],v=t[_-1],t.unshift(m,v),_+=4),e=e||0===e?+e:1,o=2;o<_;o+=2)r=m,i=v,m=y,v=C,c=(a=F)*a+(h=w)*h,d=(F=(y=+t[o+2])-m)*F+(w=(C=+t[o+3])-v)*w,g=(l=y-r)*l+(f=C-i)*f,p=(u=Math.acos((c+d-g)/Wr(4*c*d)))/Math.PI*e,D=Wr(c)*p,p*=Wr(d),m===r&&v===i||(u>n?(s=qr(f,l),x.push($r(m-Vr(s)*D),$r(v-jr(s)*D),$r(m),$r(v),$r(m+Vr(s)*p),$r(v+jr(s)*p))):(s=qr(h,a),x.push($r(m-Vr(s)*D),$r(v-jr(s)*D)),s=qr(w,F),x.push($r(m),$r(v),$r(m+Vr(s)*p),$r(v+jr(s)*p))));return x.push($r(y),$r(C),$r(y),$r(C)),E&&(x.splice(0,6),x.length=x.length-6),x}function mi(t){Hr(t[0])&&(t=[t]);var e,n,r,i,u="",s=t.length;for(n=0;n<s;n++){for(i=t[n],u+="M"+$r(i[0])+","+$r(i[1])+" C",e=i.length,r=2;r<e;r++)u+=$r(i[r++])+","+$r(i[r++])+" "+$r(i[r++])+","+$r(i[r++])+" "+$r(i[r++])+","+$r(i[r])+" ";i.closed&&(u+="z")}return u}
/*!
 * CustomEase 3.5.1
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/var vi,yi,Ci=function(){return vi||"undefined"!=typeof window&&(vi=window.gsap)&&vi.registerPlugin&&vi},xi=function(){(vi=Ci())?(vi.registerEase("_CE",Ti.create),yi=1):console.warn("Please gsap.registerPlugin(CustomEase)")},Fi=function(t){return~~(1e3*t+(t<0?-.5:.5))/1e3},wi=/[-+=\.]*\d+[\.e\-\+]*\d*[e\-\+]*\d*/gi,Ei=/[cLlsSaAhHvVtTqQ]/g,bi=function t(e,n,r,i,u,s,o,a,l,h,f){var D,p=(e+r)/2,c=(n+i)/2,d=(r+u)/2,g=(i+s)/2,_=(u+o)/2,m=(s+a)/2,v=(p+d)/2,y=(c+g)/2,C=(d+_)/2,x=(g+m)/2,F=(v+C)/2,w=(y+x)/2,E=o-e,b=a-n,T=Math.abs((r-o)*b-(i-a)*E),A=Math.abs((u-o)*b-(s-a)*E);return h||(h=[{x:e,y:n},{x:o,y:a}],f=1),h.splice(f||h.length-1,0,{x:F,y:w}),(T+A)*(T+A)>l*(E*E+b*b)&&(D=h.length,t(e,n,p,c,v,y,F,w,l,h,f),t(F,w,C,x,_,m,o,a,l,h,f+1+(h.length-D))),h},Ti=function(){function t(t,e,n){yi||xi(),this.id=t,this.setData(e,n)}var e=t.prototype;return e.setData=function(t,e){e=e||{};var n,r,i,u,s,o,a,l,h,f=(t=t||"0,0,1,1").match(wi),D=1,p=[],c=[],d=e.precision||1,g=d<=1;if(this.data=t,(Ei.test(t)||~t.indexOf("M")&&t.indexOf("C")<0)&&(f=di(t)[0]),4===(n=f.length))f.unshift(0,0),f.push(1,1),n=8;else if((n-2)%6)throw"Invalid CustomEase";for(0==+f[0]&&1==+f[n-2]||function(t,e,n){n||0===n||(n=Math.max(+t[t.length-1],+t[1]));var r,i=-1*+t[0],u=-n,s=t.length,o=1/(+t[s-2]+i),a=-e||(Math.abs(+t[s-1]-+t[1])<.01*(+t[s-2]-+t[0])?function(t){var e,n=t.length,r=1e20;for(e=1;e<n;e+=6)+t[e]<r&&(r=+t[e]);return r}(t)+u:+t[s-1]+u);for(a=a?1/a:-o,r=0;r<s;r+=2)t[r]=(+t[r]+i)*o,t[r+1]=(+t[r+1]+u)*a}(f,e.height,e.originY),this.segment=f,u=2;u<n;u+=6)r={x:+f[u-2],y:+f[u-1]},i={x:+f[u+4],y:+f[u+5]},p.push(r,i),bi(r.x,r.y,+f[u],+f[u+1],+f[u+2],+f[u+3],i.x,i.y,1/(2e5*d),p,p.length-1);for(n=p.length,u=0;u<n;u++)a=p[u],l=p[u-1]||a,(a.x>l.x||l.y!==a.y&&l.x===a.x||a===l)&&a.x<=1?(l.cx=a.x-l.x,l.cy=a.y-l.y,l.n=a,l.nx=a.x,g&&u>1&&Math.abs(l.cy/l.cx-p[u-2].cy/p[u-2].cx)>2&&(g=0),l.cx<D&&(l.cx?D=l.cx:(l.cx=.001,u===n-1&&(l.x-=.001,D=Math.min(D,.001),g=0)))):(p.splice(u--,1),n--);if(s=1/(n=1/D+1|0),o=0,a=p[0],g){for(u=0;u<n;u++)h=u*s,a.nx<h&&(a=p[++o]),r=a.y+(h-a.x)/a.cx*a.cy,c[u]={x:h,cx:s,y:r,cy:0,nx:9},u&&(c[u-1].cy=r-c[u-1].y);c[n-1].cy=p[p.length-1].y-r}else{for(u=0;u<n;u++)a.nx<u*s&&(a=p[++o]),c[u]=a;o<p.length-1&&(c[u-1]=p[p.length-2])}return this.ease=function(t){var e=c[t*n|0]||c[n-1];return e.nx<t&&(e=e.n),e.y+(t-e.x)/e.cx*e.cy},this.ease.custom=this,this.id&&vi.registerEase(this.id,this.ease),this},e.getSVGData=function(e){return t.getSVGData(this,e)},t.create=function(e,n,r){return new t(e,n,r).ease},t.register=function(t){vi=t,xi()},t.get=function(t){return vi.parseEase(t)},t.getSVGData=function(e,n){var r,i,u,s,o,a,l,h,f,D,p=(n=n||{}).width||100,c=n.height||100,d=n.x||0,g=(n.y||0)+c,_=vi.utils.toArray(n.path)[0];if(n.invert&&(c=-c,g=0),"string"==typeof e&&(e=vi.parseEase(e)),e.custom&&(e=e.custom),e instanceof t)r=mi(pi([e.segment],p,0,0,-c,d,g));else{for(r=[d,g],s=1/(l=Math.max(5,200*(n.precision||1))),h=5/(l+=2),f=Fi(d+s*p),i=((D=Fi(g+e(s)*-c))-g)/(f-d),u=2;u<l;u++)o=Fi(d+u*s*p),a=Fi(g+e(u*s)*-c),(Math.abs((a-D)/(o-f)-i)>h||u===l-1)&&(r.push(f,D),i=(a-D)/(o-f)),f=o,D=a;r="M"+r.join(",")}return _&&_.setAttribute("d",r),r},t}();Ci()&&vi.registerPlugin(Ti),Ti.version="3.5.1";
/*!
 * CustomWiggle 3.5.1
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/
var Ai,Mi,Oi,Si=function(){return Ai||"undefined"!=typeof window&&(Ai=window.gsap)&&Ai.registerPlugin&&Ai},Pi={easeOut:"M0,1,C0.7,1,0.6,0,1,0",easeInOut:"M0,0,C0.1,0,0.24,1,0.444,1,0.644,1,0.6,0,1,0",anticipate:"M0,0,C0,0.222,0.024,0.386,0,0.4,0.18,0.455,0.65,0.646,0.7,0.67,0.9,0.76,1,0.846,1,1",uniform:"M0,0,C0,0.95,0,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0"},Bi=function(t){return t},ki=function(t){if(!Mi)if(Ai=Si(),Oi=Ai&&Ai.parseEase("_CE")){for(var e in Pi)Pi[e]=Oi("",Pi[e]);Mi=1,Ni("wiggle").config=function(t){return"object"==typeof t?Ni("",t):Ni("wiggle("+t+")",{wiggles:+t})}}else t&&console.warn("Please gsap.registerPlugin(CustomEase, CustomWiggle)")},Li=function(t,e){return"function"!=typeof t&&(t=Ai.parseEase(t)||Oi("",t)),t.custom||!e?t:function(e){return 1-t(e)}},Ni=function(t,e){Mi||ki(1);var n,r,i,u,s,o,a,l,h,f=0|((e=e||{}).wiggles||10),D=1/f,p=D/2,c="anticipate"===e.type,d=Pi[e.type]||Pi.easeOut,g=Bi;if(c&&(g=d,d=Pi.easeOut),e.timingEase&&(g=Li(e.timingEase)),e.amplitudeEase&&(d=Li(e.amplitudeEase,!0)),l=[0,0,(o=g(p))/4,0,o/2,a=c?-d(p):d(p),o,a],"random"===e.type){for(l.length=4,n=g(D),r=2*Math.random()-1,h=2;h<f;h++)p=n,a=r,n=g(D*h),r=2*Math.random()-1,i=Math.atan2(r-l[l.length-3],n-l[l.length-4]),u=Math.cos(i)*D,s=Math.sin(i)*D,l.push(p-u,a-s,p,a,p+u,a+s);l.push(n,0,1,0)}else{for(h=1;h<f;h++)l.push(g(p+D/2),a),p+=D,a=(a>0?-1:1)*d(h*D),o=g(p),l.push(g(p-D/2),a,o,a);l.push(g(p+D/4),a,g(p+D/4),0,1,0)}for(h=l.length;--h>-1;)l[h]=~~(1e3*l[h])/1e3;return l[2]="C"+l[2],Oi(t,"M"+l.join(","))},Ri=function(){function t(t,e){this.ease=Ni(t,e)}return t.create=function(t,e){return Ni(t,e)},t.register=function(t){Ai=t,ki()},t}();Si()&&Ai.registerPlugin(Ri),Ri.version="3.5.1";
/*!
 * DrawSVGPlugin 3.5.1
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/
var Ii,zi,Yi,Xi,ji,Vi=function(){return"undefined"!=typeof window},Ui=function(){return Ii||Vi()&&(Ii=window.gsap)&&Ii.registerPlugin&&Ii},Wi=/[-+=\.]*\d+[\.e\-\+]*\d*[e\-\+]*\d*/gi,qi={rect:["width","height"],circle:["r","r"],ellipse:["rx","ry"],line:["x2","y2"]},Gi=function(t){return Math.round(1e4*t)/1e4},Hi=function(t){return parseFloat(t||0)},Qi=function(t,e){return Hi(t.getAttribute(e))},Ki=Math.sqrt,Zi=function(t,e,n,r,i,u){return Ki(Math.pow((Hi(n)-Hi(t))*i,2)+Math.pow((Hi(r)-Hi(e))*u,2))},$i=function(t){return console.warn(t)},Ji=function(t){return"non-scaling-stroke"===t.getAttribute("vector-effect")},tu=function(t){if(!(t=zi(t)[0]))return 0;var e,n,r,i,u,s,o,a=t.tagName.toLowerCase(),l=t.style,h=1,f=1;Ji(t)&&(f=t.getScreenCTM(),h=Ki(f.a*f.a+f.b*f.b),f=Ki(f.d*f.d+f.c*f.c));try{n=t.getBBox()}catch(t){$i("Some browsers won't measure invisible elements (like display:none or masks inside defs).")}var D=n||{x:0,y:0,width:0,height:0},p=D.x,c=D.y,d=D.width,g=D.height;if(n&&(d||g)||!qi[a]||(d=Qi(t,qi[a][0]),g=Qi(t,qi[a][1]),"rect"!==a&&"line"!==a&&(d*=2,g*=2),"line"===a&&(p=Qi(t,"x1"),c=Qi(t,"y1"),d=Math.abs(d-p),g=Math.abs(g-c))),"path"===a)i=l.strokeDasharray,l.strokeDasharray="none",e=t.getTotalLength()||0,h!==f&&$i("Warning: <path> length cannot be measured when vector-effect is non-scaling-stroke and the element isn't proportionally scaled."),e*=(h+f)/2,l.strokeDasharray=i;else if("rect"===a)e=2*d*h+2*g*f;else if("line"===a)e=Zi(p,c,p+d,c+g,h,f);else if("polyline"===a||"polygon"===a)for(r=t.getAttribute("points").match(Wi)||[],"polygon"===a&&r.push(r[0],r[1]),e=0,u=2;u<r.length;u+=2)e+=Zi(r[u-2],r[u-1],r[u],r[u+1],h,f)||0;else"circle"!==a&&"ellipse"!==a||(s=d/2*h,o=g/2*f,e=Math.PI*(3*(s+o)-Ki((3*s+o)*(s+3*o))));return e||0},eu=function(t,e){if(!(t=zi(t)[0]))return[0,0];e||(e=tu(t)+1);var n=Yi.getComputedStyle(t),r=n.strokeDasharray||"",i=Hi(n.strokeDashoffset),u=r.indexOf(",");return u<0&&(u=r.indexOf(" ")),(r=u<0?e:Hi(r.substr(0,u))||1e-5)>e&&(r=e),[Math.max(0,-i),Math.max(0,r-i)]},nu=function(){Vi()&&(document,Yi=window,ji=Ii=Ui(),zi=Ii.utils.toArray,Xi=-1!==((Yi.navigator||{}).userAgent||"").indexOf("Edge"))},ru={version:"3.5.1",name:"drawSVG",register:function(t){Ii=t,nu()},init:function(t,e,n,r,i){if(!t.getBBox)return!1;ji||nu();var u,s,o,a,l=tu(t)+1;return this._style=t.style,this._target=t,e+""=="true"?e="0 100%":e?-1===(e+"").indexOf(" ")&&(e="0 "+e):e="0 0",s=function(t,e,n){var r,i,u=t.indexOf(" ");return u<0?(r=void 0!==n?n+"":t,i=t):(r=t.substr(0,u),i=t.substr(u+1)),(r=~r.indexOf("%")?Hi(r)/100*e:Hi(r))>(i=~i.indexOf("%")?Hi(i)/100*e:Hi(i))?[i,r]:[r,i]}(e,l,(u=eu(t,l))[0]),this._length=Gi(l+10),0===u[0]&&0===s[0]?(o=Math.max(1e-5,s[1]-l),this._dash=Gi(l+o),this._offset=Gi(l-u[1]+o),this._offsetPT=this.add(this,"_offset",this._offset,Gi(l-s[1]+o))):(this._dash=Gi(u[1]-u[0])||1e-6,this._offset=Gi(-u[0]),this._dashPT=this.add(this,"_dash",this._dash,Gi(s[1]-s[0])||1e-5),this._offsetPT=this.add(this,"_offset",this._offset,Gi(-s[0]))),Xi&&(a=Yi.getComputedStyle(t)).strokeLinecap!==a.strokeLinejoin&&(s=Hi(a.strokeMiterlimit),this.add(t.style,"strokeMiterlimit",s,s+.01)),this._live=Ji(t)||~(e+"").indexOf("live"),this._props.push("drawSVG"),1},render:function(t,e){var n,r,i,u,s=e._pt,o=e._style;if(s){for(e._live&&(n=tu(e._target)+11)!==e._length&&(r=n/e._length,e._length=n,e._offsetPT.s*=r,e._offsetPT.c*=r,e._dashPT?(e._dashPT.s*=r,e._dashPT.c*=r):e._dash*=r);s;)s.r(t,s.d),s=s._next;i=e._dash,u=e._offset,n=e._length,o.strokeDashoffset=e._offset,1!==t&&t?o.strokeDasharray=i+"px,"+n+"px":(i-u<.001&&n-i<=10&&(o.strokeDashoffset=u+1),o.strokeDasharray=u<.001&&n-i<=10?"none":u===i?"0px, 999999px":i+"px,"+n+"px")}},getLength:tu,getPosition:eu};Ui()&&Ii.registerPlugin(ru);
/*!
 * matrix 3.5.1
 * https://greensock.com
 *
 * Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/
var iu,uu,su,ou,au,lu,hu,fu,Du="transform",pu=Du+"Origin",cu=function(t){var e=t.ownerDocument||t;!(Du in t.style)&&"msTransform"in t.style&&(pu=(Du="msTransform")+"Origin");for(;e.parentNode&&(e=e.parentNode););if(uu=window,hu=new Cu,e){iu=e,su=e.documentElement,ou=e.body;var n=e.createElement("div"),r=e.createElement("div");ou.appendChild(n),n.appendChild(r),n.style.position="static",n.style[Du]="translate3d(0,0,1px)",fu=r.offsetParent!==n,ou.removeChild(n)}return e},du=[],gu=[],_u=function(t){return t.ownerSVGElement||("svg"===(t.tagName+"").toLowerCase()?t:null)},mu=function t(e,n){if(e.parentNode&&(iu||cu(e))){var r=_u(e),i=r?r.getAttribute("xmlns")||"http://www.w3.org/2000/svg":"http://www.w3.org/1999/xhtml",u=r?n?"rect":"g":"div",s=2!==n?0:100,o=3===n?100:0,a="position:absolute;display:block;pointer-events:none;",l=iu.createElementNS?iu.createElementNS(i.replace(/^https/,"http"),u):iu.createElement(u);return n&&(r?(lu||(lu=t(e)),l.setAttribute("width",.01),l.setAttribute("height",.01),l.setAttribute("transform","translate("+s+","+o+")"),lu.appendChild(l)):(au||((au=t(e)).style.cssText=a),l.style.cssText=a+"width:0.1px;height:0.1px;top:"+o+"px;left:"+s+"px",au.appendChild(l))),l}throw"Need document and parent."},vu=function(t,e){var n,r,i,u,s,o=_u(t),a=t===o,l=o?du:gu;if(t===uu)return t;if(l.length||l.push(mu(t,1),mu(t,2),mu(t,3)),n=o?lu:au,o)i=a?{x:0,y:0}:t.getBBox(),(r=t.transform?t.transform.baseVal:{}).numberOfItems?(u=(r=r.numberOfItems>1?function(t){for(var e=new Cu,n=0;n<t.numberOfItems;n++)e.multiply(t.getItem(n).matrix);return e}(r):r.getItem(0).matrix).a*i.x+r.c*i.y,s=r.b*i.x+r.d*i.y):(r=hu,u=i.x,s=i.y),e&&"g"===t.tagName.toLowerCase()&&(u=s=0),n.setAttribute("transform","matrix("+r.a+","+r.b+","+r.c+","+r.d+","+(r.e+u)+","+(r.f+s)+")"),(a?o:t.parentNode).appendChild(n);else{if(u=s=0,fu)for(r=t.offsetParent,i=t;i&&(i=i.parentNode)&&i!==r&&i.parentNode;)(uu.getComputedStyle(i)[Du]+"").length>4&&(u=i.offsetLeft,s=i.offsetTop,i=0);(i=n.style).top=t.offsetTop-s+"px",i.left=t.offsetLeft-u+"px",r=uu.getComputedStyle(t),i[Du]=r[Du],i[pu]=r[pu],i.border=r.border,i.borderLeftStyle=r.borderLeftStyle,i.borderTopStyle=r.borderTopStyle,i.borderLeftWidth=r.borderLeftWidth,i.borderTopWidth=r.borderTopWidth,i.position="fixed"===r.position?"fixed":"absolute",t.parentNode.appendChild(n)}return n},yu=function(t,e,n,r,i,u,s){return t.a=e,t.b=n,t.c=r,t.d=i,t.e=u,t.f=s,t},Cu=function(){function t(t,e,n,r,i,u){void 0===t&&(t=1),void 0===e&&(e=0),void 0===n&&(n=0),void 0===r&&(r=1),void 0===i&&(i=0),void 0===u&&(u=0),yu(this,t,e,n,r,i,u)}var e=t.prototype;return e.inverse=function(){var t=this.a,e=this.b,n=this.c,r=this.d,i=this.e,u=this.f,s=t*r-e*n||1e-10;return yu(this,r/s,-e/s,-n/s,t/s,(n*u-r*i)/s,-(t*u-e*i)/s)},e.multiply=function(t){var e=this.a,n=this.b,r=this.c,i=this.d,u=this.e,s=this.f,o=t.a,a=t.c,l=t.b,h=t.d,f=t.e,D=t.f;return yu(this,o*e+l*r,o*n+l*i,a*e+h*r,a*n+h*i,u+f*e+D*r,s+f*n+D*i)},e.clone=function(){return new t(this.a,this.b,this.c,this.d,this.e,this.f)},e.equals=function(t){var e=this.a,n=this.b,r=this.c,i=this.d,u=this.e,s=this.f;return e===t.a&&n===t.b&&r===t.c&&i===t.d&&u===t.e&&s===t.f},e.apply=function(t,e){void 0===e&&(e={});var n=t.x,r=t.y,i=this.a,u=this.b,s=this.c,o=this.d,a=this.e,l=this.f;return e.x=n*i+r*s+a||0,e.y=n*u+r*o+l||0,e},t}();function xu(t,e,n){if(!t||!t.parentNode||(iu||cu(t)).documentElement===t)return new Cu;var r=function(t){for(var e,n;t&&t!==ou;)(n=t._gsap)&&!n.scaleX&&!n.scaleY&&n.renderTransform&&(n.scaleX=n.scaleY=1e-4,n.renderTransform(1,n),e?e.push(n):e=[n]),t=t.parentNode;return e}(t.parentNode),i=_u(t)?du:gu,u=vu(t,n),s=i[0].getBoundingClientRect(),o=i[1].getBoundingClientRect(),a=i[2].getBoundingClientRect(),l=u.parentNode,h=function t(e){return"fixed"===uu.getComputedStyle(e).position||((e=e.parentNode)&&1===e.nodeType?t(e):void 0)}(t),f=new Cu((o.left-s.left)/100,(o.top-s.top)/100,(a.left-s.left)/100,(a.top-s.top)/100,s.left+(h?0:uu.pageXOffset||iu.scrollLeft||su.scrollLeft||ou.scrollLeft||0),s.top+(h?0:uu.pageYOffset||iu.scrollTop||su.scrollTop||ou.scrollTop||0));if(l.removeChild(u),r)for(s=r.length;s--;)(o=r[s]).scaleX=o.scaleY=0,o.renderTransform(1,o);return e?f.inverse():f}
/*!
 * MotionPathPlugin 3.5.1
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/var Fu,wu,Eu,bu,Tu=["x","translateX","left","marginLeft"],Au=["y","translateY","top","marginTop"],Mu=Math.PI/180,Ou=function(t,e,n,r){for(var i=e.length,u=2===r?0:r,s=0;s<i;s++)t[u]=parseFloat(e[s][n]),2===r&&(t[u+1]=0),u+=2;return t},Su=function(t,e,n){return parseFloat(t._gsap.get(t,e,n||"px"))||0},Pu=function(t){var e,n=t[0],r=t[1];for(e=2;e<t.length;e+=2)n=t[e]+=n,r=t[e+1]+=r},Bu=function(t,e,n,r,i,u,s){"cubic"===s.type?e=[e]:(e.unshift(Su(n,r,s.unitX),i?Su(n,i,s.unitY):0),s.relative&&Pu(e),e=[(i?_i:gi)(e,s.curviness)]);return e=u(Iu(e,n,s)),zu(t,n,r,e,"x",s.unitX),i&&zu(t,n,i,e,"y",s.unitY),li(e,s.resolution||(0===s.curviness?20:12))},ku=function(t){return t},Lu=/[-+\.]*\d+[\.e\-\+]*\d*[e\-\+]*\d*/g,Nu=function(t,e,n){var r,i,u,s=xu(t);return"svg"===(t.tagName+"").toLowerCase()?(i=(r=t.viewBox.baseVal).x,u=r.y,r.width||(r={width:+t.getAttribute("width"),height:+t.getAttribute("height")})):(r=e&&t.getBBox&&t.getBBox(),i=u=0),e&&"auto"!==e&&(i+=e.push?e[0]*(r?r.width:t.offsetWidth||0):e.x,u+=e.push?e[1]*(r?r.height:t.offsetHeight||0):e.y),n.apply(i||u?s.apply({x:i,y:u}):{x:s.e,y:s.f})},Ru=function(t,e,n,r){var i,u=xu(t.parentNode,!0,!0),s=u.clone().multiply(xu(e)),o=Nu(t,n,u),a=Nu(e,r,u),l=a.x,h=a.y;return s.e=s.f=0,"auto"===r&&e.getTotalLength&&"path"===e.tagName.toLowerCase()&&(i=e.getAttribute("d").match(Lu)||[],l+=(i=s.apply({x:+i[0],y:+i[1]})).x,h+=i.y),(i||e.getBBox&&t.getBBox&&e.ownerSVGElement===t.ownerSVGElement)&&(l-=(i=s.apply(e.getBBox())).x,h-=i.y),s.e=l-o.x,s.f=h-o.y,s},Iu=function(t,e,n){var r,i,u,s=n.align,o=n.matrix,a=n.offsetX,l=n.offsetY,h=n.alignOrigin,f=t[0][0],D=t[0][1],p=Su(e,"x"),c=Su(e,"y");return t&&t.length?(s&&("self"===s||(r=bu(s)[0]||e)===e?pi(t,1,0,0,1,p-f,c-D):(h&&!1!==h[2]?Fu.set(e,{transformOrigin:100*h[0]+"% "+100*h[1]+"%"}):h=[Su(e,"xPercent")/-100,Su(e,"yPercent")/-100],u=(i=Ru(e,r,h,"auto")).apply({x:f,y:D}),pi(t,i.a,i.b,i.c,i.d,p+i.e-(u.x-i.e),c+i.f-(u.y-i.f)))),o?pi(t,o.a,o.b,o.c,o.d,o.e,o.f):(a||l)&&pi(t,1,0,0,1,a||0,l||0),t):ni("M0,0L0,0")},zu=function(t,e,n,r,i,u){var s=e._gsap,o=s.harness,a=o&&o.aliases&&o.aliases[n],l=a&&a.indexOf(",")<0?a:n,h=t._pt=new wu(t._pt,e,l,0,0,ku,0,s.set(e,l,t));h.u=Eu(s.get(e,l,u))||0,h.path=r,h.pp=i,t._props.push(l)},Yu={version:"3.5.1",name:"motionPath",register:function(t,e,n){Eu=(Fu=t).utils.getUnit,bu=Fu.utils.toArray,wu=n},init:function(t,e){if(!Fu)return console.warn("Please gsap.registerPlugin(MotionPathPlugin)"),!1;"object"==typeof e&&!e.style&&e.path||(e={path:e});var n,r,i,u,s,o,a=[],l=e.path,h=l[0],f=e.autoRotate,D=(s=e.start,o="end"in e?e.end:1,function(t){return s||1!==o?oi(t,s,o):t});if(this.rawPaths=a,this.target=t,(this.rotate=f||0===f)&&(this.rOffset=parseFloat(f)||0,this.radians=!!e.useRadians,this.rProp=e.rotation||"rotation",this.rSet=t._gsap.set(t,this.rProp,this),this.ru=Eu(t._gsap.get(t,this.rProp))||0),Array.isArray(l)&&!("closed"in l)&&"number"!=typeof h){for(r in h)~Tu.indexOf(r)?i=r:~Au.indexOf(r)&&(u=r);for(r in i&&u?a.push(Bu(this,Ou(Ou([],l,i,0),l,u,1),t,e.x||i,e.y||u,D,e)):i=u=0,h)r!==i&&r!==u&&a.push(Bu(this,Ou([],l,r,2),t,r,0,D,e))}else li(n=D(Iu(ni(e.path),t,e)),e.resolution),a.push(n),zu(this,t,e.x||"x",n,"x",e.unitX||"px"),zu(this,t,e.y||"y",n,"y",e.unitY||"px")},render:function(t,e){var n=e.rawPaths,r=n.length,i=e._pt;for(t>1?t=1:t<0&&(t=0);r--;)Di(n[r],t,!r&&e.rotate,n[r]);for(;i;)i.set(i.t,i.p,i.path[i.pp]+i.u,i.d,t),i=i._next;e.rotate&&e.rSet(e.target,e.rProp,n[0].angle*(e.radians?Mu:1)+e.rOffset+e.ru,e,t)},getLength:function(t){return li(ni(t)).totalLength},sliceRawPath:oi,getRawPath:ni,pointsToSegment:_i,stringToRawPath:di,rawPathToString:mi,transformRawPath:pi,getGlobalMatrix:xu,getPositionOnPath:Di,cacheRawPathMeasurements:li,convertToPath:function(t,e){return bu(t).map((function(t){return ui(t,!1!==e)}))},convertCoordinates:function(t,e,n){var r=xu(e,!0,!0).multiply(xu(t));return n?r.apply(n):r},getAlignMatrix:Ru,getRelativePosition:function(t,e,n,r){var i=Ru(t,e,n,r);return{x:i.e,y:i.f}},arrayToRawPath:function(t,e){var n=Ou(Ou([],t,(e=e||{}).x||"x",0),t,e.y||"y",1);return e.relative&&Pu(n),["cubic"===e.type?n:_i(n,e.curviness)]}};(Fu||"undefined"!=typeof window&&(Fu=window.gsap)&&Fu.registerPlugin&&Fu)&&Fu.registerPlugin(Yu);
/*!
 * ScrollToPlugin 3.5.1
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/
var Xu,ju,Vu,Uu,Wu,qu,Gu,Hu=function(){return"undefined"!=typeof window},Qu=function(){return Xu||Hu()&&(Xu=window.gsap)&&Xu.registerPlugin&&Xu},Ku=function(t){return"string"==typeof t},Zu=function(t,e){var n="x"===e?"Width":"Height",r="scroll"+n,i="client"+n;return t===Vu||t===Uu||t===Wu?Math.max(Uu[r],Wu[r])-(Vu["inner"+n]||Uu[i]||Wu[i]):t[r]-t["offset"+n]},$u=function(t,e){var n="scroll"+("x"===e?"Left":"Top");return t===Vu&&(null!=t.pageXOffset?n="page"+e.toUpperCase()+"Offset":t=null!=Uu[n]?Uu:Wu),function(){return t[n]}},Ju=function(t,e){var n=qu(t)[0].getBoundingClientRect(),r=!e||e===Vu||e===Wu,i=r?{top:Uu.clientTop-(Vu.pageYOffset||Uu.scrollTop||Wu.scrollTop||0),left:Uu.clientLeft-(Vu.pageXOffset||Uu.scrollLeft||Wu.scrollLeft||0)}:e.getBoundingClientRect(),u={x:n.left-i.left,y:n.top-i.top};return!r&&e&&(u.x+=$u(e,"x")(),u.y+=$u(e,"y")()),u},ts=function(t,e,n,r,i){return isNaN(t)||"object"==typeof t?Ku(t)&&"="===t.charAt(1)?parseFloat(t.substr(2))*("-"===t.charAt(0)?-1:1)+r-i:"max"===t?Zu(e,n)-i:Math.min(Zu(e,n),Ju(t,e)[n]-i):parseFloat(t)-i},es=function(){Xu=Qu(),Hu()&&Xu&&document.body&&(Vu=window,Wu=document.body,Uu=document.documentElement,qu=Xu.utils.toArray,Xu.config({autoKillThreshold:7}),Gu=Xu.config(),ju=1)},ns={version:"3.5.1",name:"scrollTo",rawVars:1,register:function(t){Xu=t,es()},init:function(t,e,n,r,i){ju||es();this.isWin=t===Vu,this.target=t,this.tween=n,"object"!=typeof e?Ku((e={y:e}).y)&&"max"!==e.y&&"="!==e.y.charAt(1)&&(e.x=e.y):e.nodeType&&(e={y:e,x:e}),this.vars=e,this.autoKill=!!e.autoKill,this.getX=$u(t,"x"),this.getY=$u(t,"y"),this.x=this.xPrev=this.getX(),this.y=this.yPrev=this.getY(),null!=e.x?(this.add(this,"x",this.x,ts(e.x,t,"x",this.x,e.offsetX||0),r,i,Math.round),this._props.push("scrollTo_x")):this.skipX=1,null!=e.y?(this.add(this,"y",this.y,ts(e.y,t,"y",this.y,e.offsetY||0),r,i,Math.round),this._props.push("scrollTo_y")):this.skipY=1},render:function(t,e){for(var n,r,i,u,s,o=e._pt,a=e.target,l=e.tween,h=e.autoKill,f=e.xPrev,D=e.yPrev,p=e.isWin;o;)o.r(t,o.d),o=o._next;n=p||!e.skipX?e.getX():f,i=(r=p||!e.skipY?e.getY():D)-D,u=n-f,s=Gu.autoKillThreshold,e.x<0&&(e.x=0),e.y<0&&(e.y=0),h&&(!e.skipX&&(u>s||u<-s)&&n<Zu(a,"x")&&(e.skipX=1),!e.skipY&&(i>s||i<-s)&&r<Zu(a,"y")&&(e.skipY=1),e.skipX&&e.skipY&&(l.kill(),e.vars.onAutoKill&&e.vars.onAutoKill.apply(l,e.vars.onAutoKillParams||[]))),p?Vu.scrollTo(e.skipX?n:e.x,e.skipY?r:e.y):(e.skipY||(a.scrollTop=e.y),e.skipX||(a.scrollLeft=e.x)),e.xPrev=e.x,e.yPrev=e.y},kill:function(t){var e="scrollTo"===t;(e||"scrollTo_x"===t)&&(this.skipX=1),(e||"scrollTo_y"===t)&&(this.skipY=1)}};ns.max=Zu,ns.getOffset=Ju,ns.buildGetter=$u,Qu()&&Xu.registerPlugin(ns);
/*!
 * strings: 3.5.1
 * https://greensock.com
 *
 * Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/
var rs=/([\uD800-\uDBFF][\uDC00-\uDFFF](?:[\u200D\uFE0F][\uD800-\uDBFF][\uDC00-\uDFFF]){2,}|\uD83D\uDC69(?:\u200D(?:(?:\uD83D\uDC69\u200D)?\uD83D\uDC67|(?:\uD83D\uDC69\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]\uFE0F|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC6F\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3C-\uDD3E\uDDD6-\uDDDF])\u200D[\u2640\u2642]\uFE0F|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F\u200D[\u2640\u2642]|(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642])\uFE0F|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\uD83D\uDC69\u200D[\u2695\u2696\u2708]|\uD83D\uDC68(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708]))\uFE0F|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83D\uDC69\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|\uD83D\uDC68(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]))|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\u200D(?:(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F)/;
/*!
 * SplitText: 3.5.1
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/
var is,us,ss,os,as=/(?:\r|\n|\t\t)/g,ls=/(?:\s\s+)/g,hs=function(t){return us.getComputedStyle(t)},fs=Array.isArray,Ds=[].slice,ps=function(t,e){var n;return fs(t)?t:"string"==(n=typeof t)&&!e&&t?Ds.call(is.querySelectorAll(t),0):t&&"object"===n&&"length"in t?Ds.call(t,0):t?[t]:[]},cs=function(t){return"absolute"===t.position||!0===t.absolute},ds=function(t,e){for(var n,r=e.length;--r>-1;)if(n=e[r],t.substr(0,n.length)===n)return n.length},gs=function(t,e){void 0===t&&(t="");var n=~t.indexOf("++"),r=1;return n&&(t=t.split("++").join("")),function(){return"<"+e+" style='position:relative;display:inline-block;'"+(t?" class='"+t+(n?r++:"")+"'>":">")}},_s=function t(e,n,r){var i=e.nodeType;if(1===i||9===i||11===i)for(e=e.firstChild;e;e=e.nextSibling)t(e,n,r);else 3!==i&&4!==i||(e.nodeValue=e.nodeValue.split(n).join(r))},ms=function(t,e){for(var n=e.length;--n>-1;)t.push(e[n])},vs=function(t,e,n){for(var r;t&&t!==e;){if(r=t._next||t.nextSibling)return r.textContent.charAt(0)===n;t=t.parentNode||t._parent}},ys=function t(e){var n,r,i=ps(e.childNodes),u=i.length;for(n=0;n<u;n++)(r=i[n])._isSplit?t(r):(n&&3===r.previousSibling.nodeType?r.previousSibling.nodeValue+=3===r.nodeType?r.nodeValue:r.firstChild.nodeValue:3!==r.nodeType&&e.insertBefore(r.firstChild,r),e.removeChild(r))},Cs=function(t,e){return parseFloat(e[t])||0},xs=function(t,e,n,r,i,u,s){var o,a,l,h,f,D,p,c,d,g,_,m,v=hs(t),y=Cs("paddingLeft",v),C=-999,x=Cs("borderBottomWidth",v)+Cs("borderTopWidth",v),F=Cs("borderLeftWidth",v)+Cs("borderRightWidth",v),w=Cs("paddingTop",v)+Cs("paddingBottom",v),E=Cs("paddingLeft",v)+Cs("paddingRight",v),b=Cs("fontSize",v)*(e.lineThreshold||.2),T=v.textAlign,A=[],M=[],O=[],S=e.wordDelimiter||" ",P=e.tag?e.tag:e.span?"span":"div",B=e.type||e.split||"chars,words,lines",k=i&&~B.indexOf("lines")?[]:null,L=~B.indexOf("words"),N=~B.indexOf("chars"),R=cs(e),I=e.linesClass,z=~(I||"").indexOf("++"),Y=[];for(z&&(I=I.split("++").join("")),l=(a=t.getElementsByTagName("*")).length,f=[],o=0;o<l;o++)f[o]=a[o];if(k||R)for(o=0;o<l;o++)((D=(h=f[o]).parentNode===t)||R||N&&!L)&&(m=h.offsetTop,k&&D&&Math.abs(m-C)>b&&("BR"!==h.nodeName||0===o)&&(p=[],k.push(p),C=m),R&&(h._x=h.offsetLeft,h._y=m,h._w=h.offsetWidth,h._h=h.offsetHeight),k&&((h._isSplit&&D||!N&&D||L&&D||!L&&h.parentNode.parentNode===t&&!h.parentNode._isSplit)&&(p.push(h),h._x-=y,vs(h,t,S)&&(h._wordEnd=!0)),"BR"===h.nodeName&&(h.nextSibling&&"BR"===h.nextSibling.nodeName||0===o)&&k.push([])));for(o=0;o<l;o++)D=(h=f[o]).parentNode===t,"BR"!==h.nodeName?(R&&(d=h.style,L||D||(h._x+=h.parentNode._x,h._y+=h.parentNode._y),d.left=h._x+"px",d.top=h._y+"px",d.position="absolute",d.display="block",d.width=h._w+1+"px",d.height=h._h+"px"),!L&&N?h._isSplit?(h._next=h.nextSibling,h.parentNode.appendChild(h)):h.parentNode._isSplit?(h._parent=h.parentNode,!h.previousSibling&&h.firstChild&&(h.firstChild._isFirst=!0),h.nextSibling&&" "===h.nextSibling.textContent&&!h.nextSibling.nextSibling&&Y.push(h.nextSibling),h._next=h.nextSibling&&h.nextSibling._isFirst?null:h.nextSibling,h.parentNode.removeChild(h),f.splice(o--,1),l--):D||(m=!h.nextSibling&&vs(h.parentNode,t,S),h.parentNode._parent&&h.parentNode._parent.appendChild(h),m&&h.parentNode.appendChild(is.createTextNode(" ")),"span"===P&&(h.style.display="inline"),A.push(h)):h.parentNode._isSplit&&!h._isSplit&&""!==h.innerHTML?M.push(h):N&&!h._isSplit&&("span"===P&&(h.style.display="inline"),A.push(h))):k||R?(h.parentNode&&h.parentNode.removeChild(h),f.splice(o--,1),l--):L||t.appendChild(h);for(o=Y.length;--o>-1;)Y[o].parentNode.removeChild(Y[o]);if(k){for(R&&(g=is.createElement(P),t.appendChild(g),_=g.offsetWidth+"px",m=g.offsetParent===t?0:t.offsetLeft,t.removeChild(g)),d=t.style.cssText,t.style.cssText="display:none;";t.firstChild;)t.removeChild(t.firstChild);for(c=" "===S&&(!R||!L&&!N),o=0;o<k.length;o++){for(p=k[o],(g=is.createElement(P)).style.cssText="display:block;text-align:"+T+";position:"+(R?"absolute;":"relative;"),I&&(g.className=I+(z?o+1:"")),O.push(g),l=p.length,a=0;a<l;a++)"BR"!==p[a].nodeName&&(h=p[a],g.appendChild(h),c&&h._wordEnd&&g.appendChild(is.createTextNode(" ")),R&&(0===a&&(g.style.top=h._y+"px",g.style.left=y+m+"px"),h.style.top="0px",m&&(h.style.left=h._x-m+"px")));0===l?g.innerHTML="&nbsp;":L||N||(ys(g),_s(g,String.fromCharCode(160)," ")),R&&(g.style.width=_,g.style.height=h._h+"px"),t.appendChild(g)}t.style.cssText=d}R&&(s>t.clientHeight&&(t.style.height=s-w+"px",t.clientHeight<s&&(t.style.height=s+x+"px")),u>t.clientWidth&&(t.style.width=u-E+"px",t.clientWidth<u&&(t.style.width=u+F+"px"))),ms(n,A),L&&ms(r,M),ms(i,O)},Fs=function(t,e,n,r){var i,u,s,o,a,l,h,f,D=e.tag?e.tag:e.span?"span":"div",p=~(e.type||e.split||"chars,words,lines").indexOf("chars"),c=cs(e),d=e.wordDelimiter||" ",g=" "!==d?"":c?"&#173; ":" ",_="</"+D+">",m=1,v=e.specialChars?"function"==typeof e.specialChars?e.specialChars:ds:null,y=is.createElement("div"),C=t.parentNode;for(C.insertBefore(y,t),y.textContent=t.nodeValue,C.removeChild(t),h=-1!==(i=function t(e){var n=e.nodeType,r="";if(1===n||9===n||11===n){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)r+=t(e)}else if(3===n||4===n)return e.nodeValue;return r}(t=y)).indexOf("<"),!1!==e.reduceWhiteSpace&&(i=i.replace(ls," ").replace(as,"")),h&&(i=i.split("<").join("{{LT}}")),a=i.length,u=(" "===i.charAt(0)?g:"")+n(),s=0;s<a;s++)if(l=i.charAt(s),v&&(f=v(i.substr(s),e.specialChars)))l=i.substr(s,f||1),u+=p&&" "!==l?r()+l+"</"+D+">":l,s+=f-1;else if(l===d&&i.charAt(s-1)!==d&&s){for(u+=m?_:"",m=0;i.charAt(s+1)===d;)u+=g,s++;s===a-1?u+=g:")"!==i.charAt(s+1)&&(u+=g+n(),m=1)}else"{"===l&&"{{LT}}"===i.substr(s,6)?(u+=p?r()+"{{LT}}</"+D+">":"{{LT}}",s+=5):l.charCodeAt(0)>=55296&&l.charCodeAt(0)<=56319||i.charCodeAt(s+1)>=65024&&i.charCodeAt(s+1)<=65039?(o=((i.substr(s,12).split(rs)||[])[1]||"").length||2,u+=p&&" "!==l?r()+i.substr(s,o)+"</"+D+">":i.substr(s,o),s+=o-1):u+=p&&" "!==l?r()+l+"</"+D+">":l;t.outerHTML=u+(m?_:""),h&&_s(C,"{{LT}}","<")},ws=function t(e,n,r,i){var u,s,o=ps(e.childNodes),a=o.length,l=cs(n);if(3!==e.nodeType||a>1){for(n.absolute=!1,u=0;u<a;u++)(3!==(s=o[u]).nodeType||/\S+/.test(s.nodeValue))&&(l&&3!==s.nodeType&&"inline"===hs(s).display&&(s.style.display="inline-block",s.style.position="relative"),s._isSplit=!0,t(s,n,r,i));return n.absolute=l,void(e._isSplit=!0)}Fs(e,n,r,i)},Es=function(){function t(t,e){ss||(is=document,us=window,ss=1),this.elements=ps(t),this.chars=[],this.words=[],this.lines=[],this._originals=[],this.vars=e||{},this.split(e)}var e=t.prototype;return e.split=function(t){this.isSplit&&this.revert(),this.vars=t=t||this.vars,this._originals.length=this.chars.length=this.words.length=this.lines.length=0;for(var e,n,r,i=this.elements.length,u=t.tag?t.tag:t.span?"span":"div",s=gs(t.wordsClass,u),o=gs(t.charsClass,u);--i>-1;)r=this.elements[i],this._originals[i]=r.innerHTML,e=r.clientHeight,n=r.clientWidth,ws(r,t,s,o),xs(r,t,this.chars,this.words,this.lines,n,e);return this.chars.reverse(),this.words.reverse(),this.lines.reverse(),this.isSplit=!0,this},e.revert=function(){var t=this._originals;if(!t)throw"revert() call wasn't scoped properly.";return this.elements.forEach((function(e,n){return e.innerHTML=t[n]})),this.chars=[],this.words=[],this.lines=[],this.isSplit=!1,this},t.create=function(e,n){return new t(e,n)},t}();Es.version="3.5.1",Mr.registerPlugin(Qe,Or,Ye,Ye,Lr,Ti,Ri,ru,Yu,ns,Er);var bs=os=window.punchgs=window.tpGS={};for(var Ts in bs.gsap=Mr,bs.TweenLite=Qe,bs.TweenMax=Or,bs.TimelineLite=Ye,bs.TimelineMax=Ye,bs.CustomBounce=Lr,bs.CustomEase=Ti,bs.CustomWiggle=Ri,bs.DrawSVGPlugin=ru,bs.MotionPathPlugin=Yu,bs.ScrollToPlugin=ns,bs.CSSPlugin=Er,
/*! Map SplitText to tpGS TPGSSPLITTEXT */
bs.SplitText=Es,bs.RAD2DEG=180/Math.PI,bs.DEG2RAD=Math.PI/180,
/*! REGISTER MOTION PATH (BEZIER) */
bs.gsap.registerPlugin(bs.MotionPathPlugin),bs.gsap.config({nullTargetWarn:!1}),
/*!FallBack for old and new Eases*/
bs.eases=bs.gsap.parseEase(),bs.eases)bs.eases.hasOwnProperty(Ts)&&void 0===bs[Ts]&&(bs[Ts]=bs.eases[Ts])
/*! FallBack for Essential Grid */;void 0!==os&&void 0!==os.TweenLite&&void 0===os.TweenLite.lagSmoothing&&(os.TweenLite.lagSmoothing=function(){});var As=[];function Ms(t,e,n){var r=document.createElement("canvas"),i=r.getContext("2d");if(r.width=100,r.height=200,0===t.length)i.fillStyle=n;else{for(var u=i.createLinearGradient(0,0,100,0),s=0;s<t.length;s++)u.addColorStop(t[s].stop/100,t[s].color);i.fillStyle=u}i.fillRect(0,0,100,200);var o=i.getImageData(0,0,100,2).data,a="";for(s=0;s<e.length;s++){var l=Math.ceil(e[s]),h=4*(0!==l?l-1:l);a+="rgba("+o[h]+","+o[h+1]+","+o[h+2]+","+o[h+3]/255+")",a+=" "+l+(e.length-1===s?"%":"%,")}return r.remove(),a}function Os(t,e,n,r){for(var i="",u=bs.gsap.utils.mapRange(0,r.length-1,0,t.length-1),s=0;s<r.length;s++){var o=Math.round(u(s));i+=t[o].color,i+=" "+t[o].stop+(r.length-1===s?"%":"%,")}return i}function Ss(t){var e=/rgb([\s\S]*?)%/g,n=[],r=[],i=[];do{(s=e.exec(t))&&n.push(s[0])}while(s);for(var u=0;u<n.length;u++){var s=n[u],o=(t=/rgb([\s\S]*?)\)/.exec(s),/\)([\s\S]*?)%/.exec(s));t[0]&&(t=t[0]),o[1]&&(o=o[1]),i.push(parseFloat(o)),r.push({color:t,stop:parseFloat(o)})}return 0===r.length&&(r.push({color:t,stop:0}),i.push(0),r.push({color:t,stop:100}),i.push(100)),{points:r,stops:i}}bs.getSSGColors=function(t,e,n){if(n=void 0===n?"fading":n,-1===t.indexOf("gradient")&&-1===e.indexOf("gradient"))return{from:t,to:e};for(var r={from:t,to:e},i=0;i<As.length;i++){if(As[i].from===t&&As[i].to===e&&As[i].type===n)return{from:As[i].rFrom,to:As[i].rTo};if(As[i].from===e&&As[i].to===t&&As[i].type===n)return{from:As[i].rTo,to:As[i].rFrom}}var u=Ss(t),s=Ss(e);if(u.stops.length===s.stops.length&&-1!==t.indexOf("gradient")&&-1!==e.indexOf("gradient"))return{from:t,to:e};var o,a,l=u.stops;for(i=0;i<s.stops.length;i++)-1===l.indexOf(s.stops[i])&&l.push(s.stops[i]);if(l.sort((function(t,e){return t-e})),-1!==t.indexOf("gradient(")){var h=-1!==t.indexOf("deg,")?t.indexOf("deg,")+4:-1!==t.indexOf("at center,")?t.indexOf("at center,")+10:t.indexOf("gradient(")+9;o=t.substring(0,h),-1===e.indexOf("gradient(")&&(a=t.substring(0,h))}if(-1!==e.indexOf("gradient(")){h=-1!==e.indexOf("deg,")?e.indexOf("deg,")+4:-1!==e.indexOf("at center,")?e.indexOf("at center,")+10:e.indexOf("gradient(")+9;a=e.substring(0,h),-1===t.indexOf("gradient(")&&(o=e.substring(0,h))}return"fading"===n?(u.stops.length,s.stops.length,o+=Ms(u.points,l,t),a+=Ms(s.points,l,e)):"sliding"===n&&(u.stops.length>s.stops.length?a+=Os(s.points,l,e,u.points):o+=Os(u.points,l,t,s.points)),o+=")",a+=")","sliding"===n&&(u.stops.length>s.stops.length?o=t:a=e),r.rFrom=o,r.rTo=a,r.tyep=n,As.push(r),{from:o,to:a}}}]);


window.RS_MODULES = window.RS_MODULES || {};
window.RS_MODULES.tpGS = {loaded:true, version:"6.4.11"};
if (window.RS_MODULES.checkMinimal) window.RS_MODULES.checkMinimal();;
/*!

  - Slider Revolution JavaScript Plugin -

..........................xXXXXX.................
................. xXXXXX..xXXXXX..xXXXXX.........
..................xXXXXX..xXXXXX..xXXXXX.........
..........xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
..........xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
..........xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
..........xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
..........xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
.........,xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
.........,xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
.........,xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
..........xXXXXX..xXXXXX..xXXXXX..xXXXXX.........
.....................xxxxxxxxxxxxxxxxxxx.........
.....................xxxxxxxxxxxxxxxxxxx.........
.....................xxxxxxxxxxxxxxxxxxx.........

			   DATE: 2021-08-20
	@author: Krisztian Horvath, ThemePunch OHG.

INTRODUCING GIT
UPDATES AND DOCS AT:
https://www.themepunch.com/support-center

GET LICENSE AT:
https://www.themepunch.com/links/slider_revolution_wordpress_regular_license

LICENSE:
Copyright (c) 2009-2019, ThemePunch. All rights reserved.
This work is subject to the terms at https://www.themepunch.com/links/slider_revolution_wordpress_regular_license (Regular / Extended)

*/
!function(e,i){"use strict";var t="Slider Revolution 6.5.9";window.RSANYID=window.RSANYID===i?[]:window.RSANYID,window.RSANYID_sliderID=window.RSANYID_sliderID===i?[]:window.RSANYID_sliderID,e.fn.revolution=e.fn.revolution||{};var a=e.fn.revolution;e.fn.revolutionInit=function(t){return this.each(function(){a.ISM=a.ISM||a.is_mobile();for(var s=document.getElementsByClassName("rs-p-wp-fix");s[0];)s[0].parentNode.removeChild(s[0]);this.id!==i?(a[n]={anyid:[]},this.id=a.revCheckIDS(n,this,!0)):this.id="rs_module_"+Math.round(1e7*Math.random());var n=this.id,d=a.clone(t);a[n]=G(t),a[n].ignoreHeightChange=a.ISM&&"fullscreen"===a[n].sliderLayout&&a[n].ignoreHeightChange,a[n].option_export=d,a[n].anyid=[],a[n]._Lshortcuts={},a[n].computedStyle={},a[n].c=e(this),a[n].cpar=a[n].c.parent(),a[n].canvas=a[n].c.find("rs-slides"),a[n].caches={calcResponsiveLayersList:[],contWidthManager:{}},a[n].sbgs={},window.RSBrowser=window.RSBrowser===i?a.get_browser():window.RSBrowser,a.setIsIOS(),a.setIsChrome8889(),a.useBackdrop===i&&a.checkBackdrop(),a[n].noDetach=a[n].BUG_ie_clipPath="Edge"===window.RSBrowser||"IE"===window.RSBrowser,a.getByTag=r(),a[n].indexhelper=0,a[n].fullScreenOffsetResult=0,a[n].level=0,a[n].rtl=e("body").hasClass("rtl"),a[n]._L=a[n]._L===i?{}:a[n]._L,a[n].emptyObject="{}",a[n].dimensionReCheck={},a.globalListener===i&&a.pageHandler(n),a[n].stopAfterLoops!=i&&a[n].stopAfterLoops>-1?a[n].looptogo=a[n].stopAfterLoops:a[n].looptogo="disabled",window.T=a[n],a[n].BUG_safari_clipPath="Safari"===a.get_browser()&&a.get_browser_version()>"12",a[n].minHeight="fullwidth"===a[n].sliderLayout||"carousel"===a[n].sliderType?0:a[n].minHeight!=i&&""!==a[n].minHeight?parseInt(a[n].minHeight,0):0,a[n].minHeight=a[n].minHeight===i?0:a[n].minHeight,a[n].isEdge="Edge"===a.get_browser(),o(n),a.updateVisibleArea(n),B(n),a.mesuredScrollBarDone||a.mesureScrollBar(),window.requestAnimationFrame(function(){if("fullscreen"===a[n].sliderLayout){var e=a.getFullscreenOffsets(n);0!==e&&a[n].cpar.height(a.getWinH(n)-e)}a[n].cpar[0].style.visibility="visible"}),"hero"==a[n].sliderType&&a[n].c.find("rs-slide").each(function(i){i>0&&e(this).remove()}),a[n].navigation.use="hero"!==a[n].sliderType&&("carousel"==a[n].sliderType||a[n].navigation.keyboardNavigation||"on"==a[n].navigation.mouseScrollNavigation||"carousel"==a[n].navigation.mouseScrollNavigation||a[n].navigation.touch.touchenabled||a[n].navigation.arrows.enable||a[n].navigation.bullets.enable||a[n].navigation.thumbnails.enable||a[n].navigation.tabs.enable),a[n].c.find("rs-bgvideo").each(function(){"RS-BGVIDEO"!==this.tagName||this.id!==i&&""!==this.id||(this.id="rs-bg-video-"+Math.round(1e6*Math.random()))}),tpGS.force3D="auto",!0===a[n].modal.useAsModal&&-1===a.RS_prioList.indexOf(n)&&(a.RS_toInit[n]=!1,a.RS_prioList.push(n)),a.RS_killedlist!==i&&-1!==a.RS_killedlist.indexOf(n)&&(a.RS_toInit[n]=!1,a.RS_prioList.push(n)),!0===a.RS_prioListFirstInit&&!0!==a[n].modal.useAsModal&&-1===a.RS_prioList.indexOf(n)&&(a.RS_toInit[n]=!1,a.RS_prioList.push(n)),a.initNextRevslider(n)})};a=window.RS_F;e.fn.extend({getRSJASONOptions:function(e){console.log(JSON.stringify(a[e].option_export))},getRSVersion:function(e){var i,t,a=window.SliderRevolutionVersion;if(!e){for(var r in i=t="---------------------------------------------------------\n",i+="    Currently Loaded Slider Revolution & SR Modules :\n"+t,a)a.hasOwnProperty(r)&&(i+=a[r].alias+": "+a[r].ver+"\n");i+=t}return e?a:i},revremoveslide:function(i){return this.each(function(){var t=this.id;if(!(i<0||i>a[t].slideamount)&&a[t]&&a[t].slides.length>0&&(i>0||i<=a[t].slides.length)){var r=a.gA(a[t].slides[i],"key");a[t].slideamount=a[t].slideamount-1,a[t].realslideamount=a[t].realslideamount-1,n("rs-bullet",r,t),n("rs-tab",r,t),n("rs-thumb",r,t),e(a[t].slides[i]).remove(),a[t].thumbs=s(a[t].thumbs,i),a.updateNavIndexes&&a.updateNavIndexes(t),i<=a[t].pr_active_key&&(a[t].pr_active_key=a[t].pr_active_key-1)}})},revaddcallback:function(e){return this.each(function(){a[this.id]&&(a[this.id].callBackArray===i&&(a[this.id].callBackArray=[]),a[this.id].callBackArray.push(e))})},revgetparallaxproc:function(){if(a[this[0].id])return a[this[0].id].scrollproc},revdebugmode:function(){},revscroll:function(i){return this.each(function(){var t=e(this);e("body,html").animate({scrollTop:t.offset().top+t.height()-i+"px"},{duration:400})})},revredraw:function(){return this.each(function(){m(this.id,i,!0)})},revkill:function(){return this.each(function(){if(this!=i&&null!=this){var t=this.id;a[t].c.data("conthover",1),a[t].c.data("conthoverchanged",1),a[t].c.trigger("revolution.slide.onpause"),a[t].tonpause=!0,a[t].c.trigger("stoptimer"),a[t].sliderisrunning=!1;var r="updateContainerSizes."+a[t].c.attr("id");a.window.off(r),tpGS.gsap.killTweensOf(a[t].c.find("*"),!1),tpGS.gsap.killTweensOf(a[t].c,!1),a[t].c.off("hover, mouseover, mouseenter,mouseleave, resize"),a[t].c.find("*").each(function(){var t=e(this);t.off("on, hover, mouseenter,mouseleave,mouseover, resize,restarttimer, stoptimer"),t.data("mySplitText",null),t.data("ctl",null),t.data("tween")!=i&&t.data("tween").kill(),t.data("pztl")!=i&&t.data("pztl").kill(),t.data("timeline_out")!=i&&t.data("timeline_out").kill(),t.data("timeline")!=i&&t.data("timeline").kill(),t.remove(),t.empty(),t=null}),tpGS.gsap.killTweensOf(a[t].c.find("*"),!1),tpGS.gsap.killTweensOf(a[t].c,!1),a[t].progressC.remove();try{a[t].c.closest(".rev_slider_wrapper").detach()}catch(e){}try{a[t].c.closest("rs-fullwidth-wrap").remove()}catch(e){}try{a[t].c.closest("rs-module-wrap").remove()}catch(e){}try{a[t].c.remove()}catch(e){}a[t].cpar.detach(),a[t].c.html(""),a[t].c=null,window[a[t].revapi]=i,delete a[t],delete a.RS_swapList[t],delete a.slidersToScroll[t],delete a.RS_toInit[t],a.nextSlider==t&&delete a.nextSlider,a.RS_prioList.splice(a.RS_prioList.indexOf(t),1),a.RS_killedlist=a.RS_killedlist===i?[]:a.RS_killedlist,-1===a.RS_killedlist.indexOf(t)&&a.RS_killedlist.push(t)}})},revpause:function(){return this.each(function(){var t=e(this);t!=i&&t.length>0&&e("body").find("#"+t.attr("id")).length>0&&(t.data("conthover",1),t.data("conthoverchanged",1),t.trigger("revolution.slide.onpause"),a[this.id].tonpause=!0,t.trigger("stoptimer"))})},revresume:function(){return this.each(function(){if(a[this.id]!==i){var t=e(this);t.data("conthover",0),t.data("conthoverchanged",1),t.trigger("revolution.slide.onresume"),a[this.id].tonpause=!1,t.trigger("starttimer")}})},revmodal:function(t){var r=this instanceof e?this[0]:this,o=r.id;a[r.id]!==i&&a.revModal(o,t)},revstart:function(){var t=this instanceof e?this[0]:this;return a[t.id]===i?(console.log("Slider is Not Existing"),!1):a[t.id].sliderisrunning||!0===a[t.id].initEnded?(console.log("Slider Is Running Already"),!1):(a[t.id].c=e(t),a[t.id].canvas=a[t.id].c.find("rs-slides"),u(t.id),!0)},revnext:function(){return this.each(function(){a[this.id]!==i&&a.callingNewSlide(this.id,1,"carousel"===a[this.id].sliderType)})},revprev:function(){return this.each(function(){a[this.id]!==i&&a.callingNewSlide(this.id,-1,"carousel"===a[this.id].sliderType)})},revmaxslide:function(){return e(this).find("rs-slide").length},revcurrentslide:function(){if(a[e(this)[0].id]!==i)return parseInt(a[e(this)[0].id].pr_active_key,0)+1},revlastslide:function(){return e(this).find("rs-slide").length},revshowslide:function(e){return this.each(function(){a[this.id]!==i&&e!==i&&a.callingNewSlide(this.id,"to"+(e-1))})},revcallslidewithid:function(e){return this.each(function(){a[this.id]!==i&&a.callingNewSlide(this.id,e,"carousel"===a[this.id].sliderType)})}}),a=e.fn.revolution,e.extend(!0,a,{isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},trim:function(e){return e!==i&&null!==e&&"string"==typeof e?e.trim():e},setCookie:function(e,i,t){var a=new Date;a.setTime(a.getTime()+60*t*60*1e3);var r="expires="+a.toUTCString();document.cookie=e+"="+i+";"+r+";path=/"},getCookie:function(e){for(var i=e+"=",t=document.cookie.split(";"),a=0;a<t.length;a++){for(var r=t[a];" "==r.charAt(0);)r=r.substring(1);if(0==r.indexOf(i))return decodeURIComponent(r.substring(i.length,r.length))}return""},mesureScrollBar:function(){a.mesuredScrollBarDone=!0,requestAnimationFrame(function(){var e=document.createElement("div");e.className="RSscrollbar-measure",document.body.appendChild(e),a.mesuredScrollbarWidth=e.offsetWidth-e.clientWidth,document.body.removeChild(e)})},pageHandler:function(t){a.globalListener=!0,a.window=e(window),a.document=e(document),a.RS_toInit={},a.RS_prioList=[],a.RS_swapping=[],a.RS_swapList={},window.isSafari11===i&&(window.isSafari11=a.isSafari11()),a.ISM?(window.addEventListener("orientationchange",function(){a.getWindowDimension(!1,!0),setTimeout(function(){a.getWindowDimension(!0,!0)},400)}),window.addEventListener("resize",a.getWindowDimension),tpGS.gsap.delayedCall(3,function(){window.removeEventListener("resize",a.getWindowDimension)})):window.addEventListener("resize",a.getWindowDimension),a.getWindowDimension(!1),a.stickySupported=!1,"IE"!==window.RSBrowser&&(a.stickySupported=!0),a.checkParrentOverflows(t);var r=a.getByTag(document,"RS-MODULE");for(var o in r)r.hasOwnProperty(o)&&(a.RS_toInit[r[o].id]=!1,a.RS_prioList.push(r[o].id));a.nextSlider=t,a.RS_prioListFirstInit=!0,a.hasNavClickListener===i&&(a.document.on(a.is_mobile()?"touchstart":"mouseenter",".tparrows, .tp-bullets, .tp-bullet, .tp-tab, .tp-thumb, .tp-thumbs, .tp-tabs, .tp-rightarrow, .tp-leftarrow",function(e){this.classList.add("rs-touchhover")}),a.document.on(a.is_mobile()?"touchend":"mouseleave",".tparrows, .tp-bullets, .tp-bullet, .tp-tab, .tp-thumb, .tp-tabs,  .tp-rightarrow, .tp-leftarrow",function(e){var i=this;requestAnimationFrame(function(){i.classList.remove("rs-touchhover")})}),a.hasNavClickListener=!0),window.addEventListener("unload",function(e){for(var i in a.RS_toInit)if(a.hasOwnProperty(i)){for(var r in a[i].sbgs)if(a[t].sbgs.hasOwnProperty(r)){var o=a[t].sbgs[r];a.destroyCanvas(o.canvas),a.destroyCanvas(o.shadowCanvas),o.three&&a.destroyCanvas(o.three.canvas),a.destroyCanvas(o.patternImageCanvas),a.destroyCanvas(o.fmShadow),a.destroyCanvas(o.help_canvas)}a.destroyCanvas(a[i].createPattern)}var s=document.querySelectorAll("canvas");for(var i in s)s.hasOwnProperty(i)&&a.destroyCanvas(s[i])})},destroyCanvas:function(e){e&&(e.width=e.height=0,e.remove(),e=null)},checkParrentOverflows:function(e){window.requestAnimationFrame(function(){for(var i=a[e].cpar[0];i.parentNode&&!1!==a.stickySupported;){if("RS-MODULE-WRAP"!==i.tagName&&"RS-FULLWIDTH-WRAP"!==i.tagName&&"RS-MODULE-WRAP"!==i.tagName&&-1===i.className.indexOf("wp-block-themepunch-revslider")){var t=window.getComputedStyle(i);a.stickySupported="hidden"!==t.overflow&&"hidden"!==t.overflowX&&"hidden"!==t.overflowY}i=i.parentNode}})},observeRemoved:function(e){new MutationObserver(function(i){try{document.body.contains(i[0].target)||a[e].c.revkill()}catch(i){}}).observe(a[e].cpar[0],{childList:!0})},initNextRevslider:function(e){a.RS_prioList[0]===e&&!1===a.RS_toInit[e]?(a.RS_toInit[e]="waiting",c(e),setTimeout(function(){a.initNextRevslider(e)},19)):a.RS_prioList[0]===e&&"waiting"===a.RS_toInit[e]?setTimeout(function(){a.initNextRevslider(e)},19):a.RS_prioList[0]===e&&!0===a.RS_toInit[e]?(a.RS_prioList.shift(),0!==a.RS_prioList.length&&setTimeout(function(){a.initNextRevslider(e)},19)):a.RS_prioList[0]!==e&&!1===a.RS_toInit[e]?setTimeout(function(){a.initNextRevslider(e)},19):0===a.RS_prioList.length&&!0===a.RS_toInit[e]&&c(e)},scrollTicker:function(e){1!=a.scrollTickerAdded&&(a.slidersToScroll=[],a.scrollTickerAdded=!0,a.ISM?(tpGS.gsap.ticker.fps(150),tpGS.gsap.ticker.add(function(){a.generalObserver()})):document.addEventListener("scroll",function(e){a.scrollRaF===i&&(a.scrollRaF=requestAnimationFrame(a.generalObserver.bind(this,!0)))},{passive:!0})),a.slidersToScroll.push(e),a.generalObserver(a.ISM)},generalObserver:function(e,t){for(var r in a.scrollRaF&&(a.scrollRaF=cancelAnimationFrame(a.scrollRaF)),a.lastwindowheight=a.lastwindowheight||a.winH,a.scrollY=window.scrollY,a.slidersToScroll)a.slidersToScroll.hasOwnProperty(r)&&a.scrollHandling(a.slidersToScroll[r],e,i,t)},wrapObserver:{targets:[],init:function(e){var i=1,t=0,r=0,o=s.bind(a.wrapObserver);function s(){if(r++,requestAnimationFrame(o),!(r-t<30/i)){t=r;for(var s=0;s<a.wrapObserver.targets.length;s++)if(a.wrapObserver.targets.hasOwnProperty(s)){var n=a.wrapObserver.targets[s],d=n.elem.getBoundingClientRect();n.lw===d.width&&n.lh===d.height||0===d.width||(n.callback&&(n.callback.pause(),n.callback.kill(),n.callback=null),n.callback=tpGS.gsap.to({},{duration:.2,onComplete:e.bind(window,n.elem,n.id)})),n.lw=d.width,n.lh=d.height}}}s()},observe:function(e,i){if(""!==(e=e.getBoundingClientRect?e:e[0].getBoundingClientRect?e[0]:"")){var t=e.getBoundingClientRect();a.wrapObserver.targets.push({elem:e,id:i,lw:t.width,lh:t.height})}}},enterViewPort:function(t,r){!0!==a[t].started?(a[t].started=!0,a.lazyLoadAllSlides(t),a[t].c.trigger("revolution.slide.firstrun"),setTimeout(function(){k(t),"hero"!==a[t].sliderType&&a.manageNavigation&&a[t].navigation.use&&!0===a[t].navigation.createNavigationDone&&a.manageNavigation(t),a[t].slideamount>1&&C(t),setTimeout(function(){a[t]!==i&&(a[t].revolutionSlideOnLoaded=!0,a[t].c.trigger("revolution.slide.onloaded"))},50)},a[t].startDelay),a[t].startDelay=0,window.requestAnimationFrame(function(){h(t)})):(a[t].waitForCountDown&&(C(t),a[t].waitForCountDown=!1),"playing"!=a[t].sliderlaststatus&&a[t].sliderlaststatus!=i||a[t].c.trigger("starttimer"),a[t].lastplayedvideos!=i&&a[t].lastplayedvideos.length>0&&e.each(a[t].lastplayedvideos,function(e,i){a.playVideo(i,t)}))},leaveViewPort:function(t){a[t].sliderlaststatus=a[t].sliderstatus,a[t].c.trigger("stoptimer"),a[t].playingvideos!=i&&a[t].playingvideos.length>0&&(a[t].lastplayedvideos=e.extend(!0,[],a[t].playingvideos),a[t].playingvideos&&e.each(a[t].playingvideos,function(e,i){a[t].leaveViewPortBasedStop=!0,a.stopVideo&&a.stopVideo(i,t)}))},scrollHandling:function(e,t,r,o){if(a[e]!==i){var s=a[e].topc!==i?a[e].topc[0].getBoundingClientRect():0===a[e].canv.height?a[e].cpar[0].getBoundingClientRect():a[e].c[0].getBoundingClientRect();s.hheight=0===s.height?0===a[e].canv.height?a[e].module.height:a[e].canv.height:s.height,a[e].scrollproc=s.top<0||s.hheight>a.lastwindowheight&&s.top<a.lastwindowheight?s.top/s.hheight:s.bottom>a.lastwindowheight?(s.bottom-a.lastwindowheight)/s.hheight:0;var n=Math.max(0,1-Math.abs(a[e].scrollproc));a[e].viewPort.enable&&("%"===a[e].viewPort.vaType[a[e].level]&&(a[e].viewPort.visible_area[a[e].level]<=n||n>0&&n<=1&&a[e].sbtimeline.fixed)||"px"===a[e].viewPort.vaType[a[e].level]&&(s.top<=0&&s.bottom>=a.lastwindowheight||s.top>=0&&s.bottom<=a.lastwindowheight||s.top>=0&&s.top<a.lastwindowheight-a[e].viewPort.visible_area[a[e].level]||s.bottom>=a[e].viewPort.visible_area[a[e].level]&&s.bottom<a.lastwindowheight)?a[e].inviewport||(a[e].inviewport=!0,a.enterViewPort(e,!0),a[e].c.trigger("enterviewport")):a[e].inviewport&&(a[e].inviewport=!1,a.leaveViewPort(e),a[e].c.trigger("leftviewport"))),a[e].inviewport&&(a.callBackHandling&&a.callBackHandling(e,"parallax","start"),requestAnimationFrame(function(){"fullscreen"===a[e].sliderLayout&&a.getFullscreenOffsets(e)}),a.parallaxProcesses(e,s,o,r),a.callBackHandling&&a.callBackHandling(e,"parallax","end"))}},clone:function(e,t){if(t===i&&e===i)return{};return function e(t,a){var r=Array.isArray(t)?[]:{};for(var o in t)t.hasOwnProperty(o)&&(t[o]!==i&&"object"==typeof t[o]&&a?r[o]=e(t[o],!0):t[o]!==i&&(r[o]=t[o]));return r}(e,t)},closest:function(e,i){return e&&(i(e)?e:a.closest(e.parentNode,i))},closestNode:function(e,i){return a.closest(e,function(e){return e.nodeName===i})},closestClass:function(e,i){return a.closest(e,function(e){return(" "+e.className+" ").indexOf(" "+i+" ")>=0})},getWinH:function(e){return a[e].ignoreHeightChange?a.mobileWinH:a.winH},getWindowDimension:function(e,t){!1===e?(a.rAfScrollbar="skip",a.winWAll=window.innerWidth,a.winWSbar=document.documentElement.clientWidth,a.ISM?(a.zoom=t?1:a.winWSbar/a.winWAll,a.winW=1!==a.zoom?a.winWSbar*a.zoom:Math.min(a.winWAll,a.winWSbar),a.winH=1!==a.zoom?window.innerHeight*a.zoom:window.innerHeight,t&&window.visualViewport&&(a.winH*=window.visualViewport.scale,a.winWAll*=window.visualViewport.scale),a.scrollBarWidth=0):(a.isModalOpen&&a.openModalId!==i&&a[a.openModalId]!==i&&a[a.openModalId].canv.height>a.winH?a.scrollBarWidth=a.mesuredScrollbarWidth:a.scrollBarWidth=a.winWAll-a.winWSbar,a.winW=Math.min(a.winWAll,a.winWSbar),a.winH=window.innerHeight),a.ISM&&a.winH>125&&(a.lastwindowheight!==i&&Math.abs(a.lastwindowheight-a.winH)<125?a.mobileWinH=a.lastwindowheight:a.mobileWinH=a.winH)):clearTimeout(a.windowDimenstionDelay),a.windowDimenstionDelay=setTimeout(function(){a.rAfScrollbar=i,a.winWAll=window.innerWidth,a.winWSbar=document.documentElement.clientWidth,a.ISM?(a.zoom=t?1:a.winWSbar/a.winWAll,a.RS_px_ratio=window.devicePixelRatio||window.screen.availWidth/document.documentElement.clientWidth,a.winW=1!==a.zoom?a.winWSbar*a.zoom:Math.min(a.winWAll,a.winWSbar),a.winH=1!==a.zoom?window.innerHeight*a.zoom:window.innerHeight,t&&window.visualViewport&&(a.winH*=window.visualViewport.scale,a.winWAll*=window.visualViewport.scale),a.scrollBarWidth=0,t&&tpGS.gsap.delayedCall(.1,function(){a.getWindowDimension()})):(a.isModalOpen&&a.openModalId!==i&&a[a.openModalId]!==i&&a[a.openModalId].canv.height>a.winH?a.scrollBarWidth=a.mesuredScrollbarWidth:a.scrollBarWidth=a.winWAll-a.winWSbar,a.winW=Math.min(a.winWAll,a.winWSbar),a.winH=window.innerHeight),a.ISM&&a.winH>125&&(a.lastwindowheight!==i&&Math.abs(a.lastwindowheight-a.winH)<125?a.mobileWinH=a.lastwindowheight:a.mobileWinH=a.winH),!1!==e&&a.document.trigger("updateContainerSizes")},100)},aC:function(i,t){i&&(i.classList&&i.classList.add?i.classList.add(""+t):e(i).addClass(t))},rC:function(i,t){i&&(i.classList&&i.classList.remove?i.classList.remove(""+t):e(i).removeClass(t))},sA:function(e,i,t){e&&e.setAttribute&&e.setAttribute("data-"+i,t)},gA:function(e,t,a){return e===i?i:e.hasAttribute&&e.hasAttribute("data-"+t)&&e.getAttribute("data-"+t)!==i&&null!==e.getAttribute("data-"+t)?e.getAttribute("data-"+t):a!==i?a:i},rA:function(e,i){e&&e.removeAttribute&&e.removeAttribute("data-"+i)},iWA:function(e,t){return a[e].justifyCarousel?"static"===t?a[e].carousel.wrapwidth:a[e].carousel.slide_widths[t!==i?t:a[e].carousel.focused]:a[e].gridwidth[a[e].level]},iHE:function(e,i){return a[e].useFullScreenHeight?a[e].canv.height:Math.max(a[e].currentRowsHeight,a[e].gridheight[a[e].level])},updateFixedScrollTimes:function(e){!0===a[e].sbtimeline.set&&!0===a[e].sbtimeline.fixed&&"auto"!==a[e].sliderLayout&&(a[e].sbtimeline.rest=a[e].duration-a[e].sbtimeline.fixEnd,a[e].sbtimeline.time=a[e].duration-(a[e].sbtimeline.fixStart+a[e].sbtimeline.rest),a[e].sbtimeline.extended=a[e].sbtimeline.time/10)},addSafariFix:function(e){!0===window.isSafari11&&!0!==a[e].safari3dFix&&(a[e].safari3dFix=!0,a[e].c[0].className+=" safarifix")},openModalAPI:function(t,r,o,s,n,d){if(window.RS_60_MODALS!==i&&-1!=e.inArray(t,window.RS_60_MODALS)||window.RS_60_MODAL_API_CALLS!==i&&-1!=e.inArray(t,window.RS_60_MODAL_API_CALLS))e.inArray(t,window.RS_60_MODALS)>=0&&e.fn.revolution.document.trigger("RS_OPENMODAL_"+t,r);else{window.RS_60_MODAL_API_CALLS=window.RS_60_MODAL_API_CALLS||[],window.RS_60_MODAL_API_CALLS.push(t),s&&a.showModalCover(n,d,"show");var l={action:"revslider_ajax_call_front",client_action:"get_slider_html",alias:t,usage:"modal"};e.ajax({type:"post",url:o,dataType:"json",data:l,success:function(o,l,c){if(null!==o&&1==o.success){var p;if(n=n==i?o.htmlid:n,o.waiting!==i)for(p in o.waiting)-1==e.inArray(o.waiting[p],RS_MODULES.waiting)&&(RS_MODULES.waiting.push(o.waiting[p]),window.RS_MODULES.minimal=!1);if(o.toload!==i){var g="";for(p in RS_MODULES=RS_MODULES||{},RS_MODULES.requestedScripts=[],o.toload)o.toload.hasOwnProperty(p)&&(RS_MODULES!=i&&RS_MODULES[p]!=i&&!0===RS_MODULES[p].loaded||-1===e.inArray(p,RS_MODULES.requestedScripts)&&(RS_MODULES.requestedScripts.push(p),g+=o.toload[p]));""!==g&&e("body").append(g)}RS_MODULES!==i&&RS_MODULES.modules[o.htmlid]!=i||e("body").append(o.data),s&&a.showModalCover(n,d,"hide"),a[t]!==i&&a[t].openModalApiListener?e.fn.revolution.document.trigger("RS_OPENMODAL_"+t,r):e(document).on("RS_MODALOPENLISTENER_"+t,function(){e.fn.revolution.document.trigger("RS_OPENMODAL_"+t,r)})}else s&&a.showModalCover(n,d,"hide")},error:function(e){s&&a.showModalCover(n,d,"hide"),console.log("Modal Can not be Loaded"),console.log(e)}})}},showModalCover:function(t,r,o){switch(o){case"show":var s;if(r.spin!==i&&"off"!==r.spin&&(s=a.buildSpinner(t,"spinner"+r.spin,r.spinc,"modalspinner")),r.bg!==i&&!1!==r.bg&&"false"!==r.bg&&"transparent"!==r.bg){var n=e('<rs-modal-cover data-alias="'+r.alias+'" data-rid="'+t+'" id="'+t+'_modal_bg" style="display:none;opacity:0;background:'+r.bg+'"></rs-modal-cover>');e("body").append(n),r.speed=parseFloat(r.speed),r.speed=r.speed>200?r.speed/1e3:r.speed,r.speed=Math.max(Math.min(3,r.speed),.3),tpGS.gsap.to(n,r.speed,{display:"block",opacity:1,ease:"power3.inOut"}),a.isModalOpen=!0,s!==i&&n.append(s)}else s!==i&&a[t].c.append(s);break;case"hide":(n=e('rs-modal-cover[data-alias="'+r.alias+'"] .modalspinner'))!==i&&n.length>0?n.remove():t!==i&&a[t].c.find(".modalspinner").remove()}},revModal:function(t,r){if(t!==i&&a[t]!==i&&"clicked"!==a[t].modal.closeProtection){if(!0===a[t].modal.closeProtection)return a[t].modal.closeProtection,void setTimeout(function(){a[t].modal.closeProtection=!1,a.revModal(t,r)},750);switch(r.mode){case"show":if(!0===a[t].modal.isLive)return;if(!0===a.anyModalclosing)return;a[t].modal.isLive=!0,r.slide=r.slide===i?"to0":r.slide,a[t].modal.bodyclass!==i&&a[t].modal.bodyclass.length>=0&&document.body.classList.add(a[t].modal.bodyclass),a[t].modal.bg.attr("data-rid",t),tpGS.gsap.to(a[t].modal.bg,a[t].modal.coverSpeed,{display:"block",opacity:1,ease:"power3.inOut"}),tpGS.gsap.set(a[t].modal.c,{display:"auto"===a[t].sliderLayout?"inline-block":"block",opacity:0}),a[t].cpar.removeClass("hideallscrollbars"),tpGS.gsap.set(a[t].cpar,{display:"block",opacity:1});var o={a:0};a.isModalOpen=!0,a[t].clearModalBG=!0,"carousel"===a[t].sliderType&&a[t].pr_active_bg!==i&&a[t].pr_active_bg.length>0&&tpGS.gsap.to(a[t].pr_active_bg,.5,{opacity:1}),tpGS.gsap.fromTo(o,a[t].modal.coverSpeed/5,{a:0},{a:10,ease:"power3.inOut",onComplete:function(){a.openModalId=t,a[t].sliderisrunning?a.callingNewSlide(t,r.slide):("to0"!==r.slide&&(a[t].startWithSlideKey=r.slide),u(t))}}),setTimeout(function(){tpGS.gsap.fromTo([a[t].modal.c],.01,{opacity:0},{opacity:1,delay:a[t].modal.coverSpeed/4,ease:"power3.inOut",onComplete:function(){}}),window.overscrollhistory=document.body.style.overflow,document.body.style.overflow="hidden","fullscreen"===a[t].sliderLayout&&a.getWindowDimension()},250),"fullscreen"!==a[t].sliderLayout&&a.getWindowDimension();break;case"close":if(!0===a.anyModalclosing)return;a.anyModalclosing=!0,a.openModalId=i,x(t),document.body.style.overflow=window.overscrollhistory,a[t].cpar.addClass("hideallscrollbars"),a[t].modal.bodyclass!==i&&a[t].modal.bodyclass.length>=0&&document.body.classList.remove(a[t].modal.bodyclass),tpGS.gsap.to(a[t].modal.bg,a[t].modal.coverSpeed,{display:"none",opacity:0,ease:"power3.inOut"}),tpGS.gsap.to(a[t].modal.c,a[t].modal.coverSpeed/6.5,{display:"none",delay:a[t].modal.coverSpeed/4,opacity:0,onComplete:function(){tpGS.gsap.set(a[t].cpar,{display:"none",opacity:0}),a.document.trigger("revolution.all.resize"),a.document.trigger("revolution.modal.close",[a[t].modal]),a.getWindowDimension(),a.isModalOpen=!1}}),a[t].modal.closeProtection=!0,clearTimeout(a[t].modal.closeTimer),a[t].modal.closeTimer=setTimeout(function(){a.anyModalclosing=!1,a[t].modal.isLive=!1,a[t].modal.closeProtection=!1},Math.max(750,1020*a[t].modal.coverSpeed));break;case"init":if(window.RS_60_MODALS=window.RS_60_MODALS===i?[]:window.RS_60_MODALS,-1===e.inArray(a[t].modal.alias,window.RS_60_MODALS)&&window.RS_60_MODALS.push(a[t].modal.alias),a[t].modal.listener===i&&(a[t].modal.c=e("#"+t+"_modal"),!1!==a[t].modal.cover&&"false"!==a[t].modal.cover||(a[t].modal.coverColor="transparent"),a[t].modal.bg=e('rs-modal-cover[data-alias="'+r.alias+'"]'),a[t].modal.bg===i||0===a[t].modal.bg.length?(a[t].modal.bg=e('<rs-modal-cover style="display:none;opacity:0;background:'+a[t].modal.coverColor+'" data-rid="'+t+'" id="'+t+'_modal_bg"></rs-modal-cover>'),"auto"===a[t].sliderLayout&&a[t].modal.cover?e("body").append(a[t].modal.bg):a[t].modal.c.append(a[t].modal.bg)):a[t].modal.bg.attr("data-rid",t),a[t].modal.c[0].className+="rs-modal-"+a[t].sliderLayout,a[t].modal.calibration={left:"auto"===a[t].sliderLayout?"center"===a[t].modal.horizontal?"50%":"left"===a[t].modal.horizontal?"0px":"auto":"0px",right:"auto"===a[t].sliderLayout?"center"===a[t].modal.horizontal?"auto":"left"===a[t].modal.horizontal?"auto":"0px":"0px",top:"auto"===a[t].sliderLayout||"fullwidth"===a[t].sliderLayout?"middle"===a[t].modal.vertical?"50%":"top"===a[t].modal.vertical?"0px":"auto":"0px",bottom:"auto"===a[t].sliderLayout||"fullwidth"===a[t].sliderLayout?"middle"===a[t].modal.vertical?"auto":"top"===a[t].modal.vertical?"auto":"0px":"0px",y:("auto"===a[t].sliderLayout||"fullwidth"===a[t].sliderLayout)&&"middle"===a[t].modal.vertical?"-50%":0,x:"auto"===a[t].sliderLayout&&"center"===a[t].modal.horizontal?"-50%":0},"-50%"===a[t].modal.calibration.y&&(a[t].modal.calibration.filter="blur(0px)"),tpGS.gsap.set(a[t].modal.c,"auto"===a[t].sliderLayout||"fullscreen"===a[t].sliderLayout?e.extend(!0,a[t].modal.calibration,{opacity:0,display:"none"}):{opacity:0,display:"none"}),"fullwidth"===a[t].sliderLayout&&tpGS.gsap.set(a[t].modal.c.find("rs-module-wrap"),a[t].modal.calibration),a.document.on("RS_OPENMODAL_"+a[t].modal.alias,function(e,i){a[t].initEnded=!0,a.revModal(t,{mode:"show",slide:i})}),a[a[t].modal.alias]=a[a[t].modal.alias]||{},a[a[t].modal.alias].openModalApiListener=!0,a.document.trigger("RS_MODALOPENLISTENER_"+a[t].modal.alias),a.document.on("click","rs-modal-cover",function(){a.revModal(a.gA(this,"rid"),{mode:"close"})}),a[t].modal.listener=!0,a[t].modal.trigger!==i)){var s,n=a[t].modal.trigger.split(";");for(o in a[t].modal.trigger={},n)if(n.hasOwnProperty(o))switch((s=n[o].split(":"))[0]){case"t":a[t].modal.trigger.time=parseInt(s[1],0);break;case"s":a[t].modal.trigger.scroll=s[1];break;case"so":a[t].modal.trigger.scrollo=parseInt(s[1],0);break;case"e":a[t].modal.trigger.event=s[1];break;case"ha":a[t].modal.trigger.hash=s[1];break;case"co":a[t].modal.trigger.cookie=s[1]}var d=!0;if(a[t].modal.trigger.cookie!==i?d="true"!==a.getCookie(a[t].modal.alias+"_modal_one_time"):"true"==a.getCookie(a[t].modal.alias+"_modal_one_time")&&a.setCookie(a[t].modal.alias+"_modal_one_time",!1,10),d&&(a[t].modal.trigger.time!==i&&0!==a[t].modal.trigger.time&&(a[t].modal.trigger.cookie!==i&&a.setCookie(a[t].modal.alias+"_modal_one_time",!0,a[t].modal.trigger.cookie),setTimeout(function(){a.document.trigger("RS_OPENMODAL_"+a[t].modal.alias)},a[t].modal.trigger.time)),a[t].modal.trigger.scrollo!==i||a[t].modal.trigger.scroll!==i)){a[t].modal.trigger.scroll!==i&&e(a[t].modal.trigger.scroll)[0]!==i&&(a[t].modal.trigger.scroll=e(a[t].modal.trigger.scroll)[0]);var l=function(){if(a[t].modal.trigger.scroll!==i)var e=a[t].modal.trigger.scroll.getBoundingClientRect();(a[t].modal.trigger.scroll!==i&&Math.abs(e.top+(e.bottom-e.top)/2-a.getWinH(t)/2)<50||a[t].modal.trigger.scrollo!==i&&Math.abs(a[t].modal.trigger.scrollo-(a.scrollY!==i?a.scrollY:window.scrollY))<100)&&(a.document.trigger("RS_OPENMODAL_"+a[t].modal.alias),a[t].modal.trigger.cookie!==i&&a.setCookie(a[t].modal.alias+"_modal_one_time",!0,a[t].modal.trigger.cookie),document.removeEventListener("scroll",l))};document.addEventListener("scroll",l,{id:t,passive:!0})}a[t].modal.trigger.event!==i&&a.document.on(a[t].modal.trigger.event,function(){a.document.trigger("RS_OPENMODAL_"+a[t].modal.alias)}),"t"==a[t].modal.trigger.hash&&window.location.hash.substring(1)==a[t].modal.alias&&a.document.trigger("RS_OPENMODAL_"+a[t].modal.alias)}}}},smartConvertDivs:function(e){var i="";if("string"==typeof e&&e.indexOf("#")>=0){var t=e.split(","),a=t.length-1;for(var r in t)i="string"==typeof t[r]&&"#"===t[r][0]?i+t[r][1]/t[r][3]*100+"%"+(r<a?",":""):i+t[r]+(r<a?",":"")}else i=e;return i},revToResp:function(e,t,a,r){if((e=e===i?a:e)!==i){if(r=r===i?",":r,"boolean"!=typeof e&&("object"!=typeof e||Array.isArray(e))){try{e=e.replace(/[[\]]/g,"").replace(/\'/g,"").split(r)}catch(e){}for(e=Array.isArray(e)?e:[e];e.length<t;)e[e.length]=e[e.length-1]}return e}},loadImages:function(t,r,o,s){if(t!==i&&0!==t.length){var n=[];if(Array.isArray(t))for(var d in t)t.hasOwnProperty(d)&&t[d]!==i&&n.push(t[d]);else n.push(t);for(var l in n)if(n.hasOwnProperty(l)){var c=n[l].querySelectorAll("img, rs-sbg, .rs-svg"),p=a[r].lazyOnBg?n[l].querySelectorAll("rs-bg-elem, rs-column, rs-layer"):[];for(var d in c)if(c.hasOwnProperty(d)){c[d]!==i&&c[d].dataset!==i&&c[d].dataset.src!==i&&c[d].dataset.src.indexOf("dummy.png")>=0&&c[d].src.indexOf("data")>=0&&delete c[d].dataset.src;var u=g(c[d],i,r),h=u!==i?u:a.gA(c[d],"svg_src")!=i?a.gA(c[d],"svg_src"):c[d].src===i?e(c[d]).data("src"):c[d].src,m=a.gA(c[d],"svg_src")!=i?"svg":"img";h!==i&&a[r].loadqueue!==i&&0==a[r].loadqueue.filter(function(e){return e.src===h}).length&&a[r].loadqueue.push({src:h,img:c[d],index:d,starttoload:Date.now(),type:m||"img",prio:o,progress:c[d].complete&&h===c[d].src?"loaded":"prepared",static:s,width:c[d].complete&&h===c[d].src?c[d].width:i,height:c[d].complete&&h===c[d].src?c[d].height:i})}for(var d in p)p.hasOwnProperty(d)&&p[d]!==i&&p[d].dataset!==i&&p[d].dataset.bglazy!==i&&p[d].style.backgroundImage.indexOf("dummy.png")>=0&&(p[d].style.backgroundImage='url("'+p[d].dataset.bglazy+'")')}b(r)}},waitForCurrentImages:function(t,r,o){if(t!==i&&0!==t.length&&a[r]!==i){var s=!1,n=[];if(Array.isArray(t))for(var d in t)t.hasOwnProperty(d)&&t[d]!==i&&n.push(t[d]);else n.push(t);for(var l in n)if(n.hasOwnProperty(l)){var c=n[l].querySelectorAll("img, rs-sbg, .rs-svg");for(d in c)if(c.hasOwnProperty(d)&&"length"!==d&&!(c[d].className.indexOf("rs-pzimg")>=0)){var p=e(c[d]).data(),u=g(c[d],i,r),h=u!==i?u:a.gA(c[d],"svg_src")!=i?a.gA(c[d],"svg_src"):c[d].src===i?p.src:c[d].src,m=a.getLoadObj(r,h);if(a.sA(c[d],"src-rs-ref",h),p.loaded===i&&m!==i&&m.progress&&"loaded"==m.progress){if("img"==m.type){if(c[d].src.slice(c[d].src.length-10)!==m.src.slice(m.src.length-10)&&(c[d].src=m.src),p.slidebgimage){-1==m.src.indexOf("images/transparent.png")&&-1==m.src.indexOf("assets/transparent.png")||p.bgcolor===i||p.bgcolor!==i&&"transparent"!==p.bgcolor&&(m.bgColor=!0,m.useBGColor=!0),a.sA(n[l],"owidth",m.width),a.sA(n[l],"oheight",m.height);var v=a.getByTag(n[l],"RS-SBG-WRAP"),f=a.gA(n[l],"key");if(a[r].sbgs[f].loadobj=m,v.length>0&&(a.sA(v[0],"owidth",m.width),a.sA(v[0],"oheight",m.height)),"carousel"===a[r].sliderType){var y=e(v),w=a.getSlideIndex(r,f);(a[r].carousel.justify&&a[r].carousel.slide_widths===i||a[r].carousel.slide_width===i)&&a.setCarouselDefaults(r,!0),y.data("panzoom")===i||a[r].panzoomTLs!==i&&a[r].panzoomTLs[w]!==i||a.startPanZoom(y,r,0,w,"prepare",f),a[r].sbgs[f].isHTML5&&!a[r].sbgs[f].videoisplaying&&(a[r].sbgs[f].video=a[r].sbgs[f].loadobj.img),n[l].getAttribute("data-iratio")!==i&&!n[l].getAttribute("data-iratio")&&m.img&&m.img.naturalWidth&&(n[l].setAttribute("data-iratio",m.img.naturalWidth/m.img.naturalHeight),a.setCarouselDefaults(r,"redraw"),!0===a[r].carousel.ocfirsttun&&a.organiseCarousel(r,"right",!0,!1,!1)),a.updateSlideBGs(r,f,a[r].sbgs[f])}}}else"svg"==m.type&&"loaded"==m.progress&&(c[d].innerHTML=m.innerHTML);p.loaded=!0}m&&m.progress&&m.progress.match(/inprogress|inload|prepared/g)&&(!m.error&&Date.now()-m.starttoload<15e3?s=!0:(m.progress="failed",m.reported_img||(m.reported_img=!0,console.log(h+"  Could not be loaded !")))),1!=a[r].youtubeapineeded||window.YT&&YT.Player!=i||(s=S("youtube",r)),1!=a[r].vimeoapineeded||window.Vimeo||(s=S("vimeo",r))}}!a.ISM&&a[r].audioqueue&&a[r].audioqueue.length>0&&e.each(a[r].audioqueue,function(e,i){i.status&&"prepared"===i.status&&Date.now()-i.start<i.waittime&&(s=!0)}),e.each(a[r].loadqueue,function(e,i){!0===i.static&&("loaded"!=i.progress&&"done"!==i.progress||"failed"===i.progress)&&("failed"!=i.progress||i.reported?!i.error&&Date.now()-i.starttoload<5e3?s=!0:i.reported||(i.reported=_(i.src,i.error)):i.reported=_(i.src,i.error))}),s?tpGS.gsap.delayedCall(.02,a.waitForCurrentImages,[t,r,o]):o!==i&&tpGS.gsap.delayedCall(1e-4,o)}},updateVisibleArea:function(e){for(var t in a[e].viewPort.visible_area=a.revToResp(a[e].viewPort.visible_area,a[e].rle,"0px"),a[e].viewPort.vaType=new Array(4),a[e].viewPort.visible_area)a[e].viewPort.visible_area.hasOwnProperty(t)&&(!1===a[e].viewPort.local&&!0===a[e].viewPort.global?(a[e].viewPort.vaType[t]=a[e].viewPort.globalDist.indexOf("%")>=0?"%":"px",a[e].viewPort.visible_area[t]=parseInt(a[e].viewPort.globalDist)):(a.isNumeric(a[e].viewPort.visible_area[t])&&(a[e].viewPort.visible_area[t]+="%"),a[e].viewPort.visible_area[t]!==i&&(a[e].viewPort.vaType[t]=a[e].viewPort.visible_area[t].indexOf("%")>=0?"%":"px"),a[e].viewPort.visible_area[t]=parseInt(a[e].viewPort.visible_area[t],0)),a[e].viewPort.visible_area[t]="%"==a[e].viewPort.vaType[t]?a[e].viewPort.visible_area[t]/100:a[e].viewPort.visible_area[t])},observeFonts:function(e,t,r){r=r===i?0:r,a.fonts===i&&(a.fonts={},a.monoWidth=d("monospace"),a.sansWidth=d("sans-serif"),a.serifWidth=d("serif")),r++;var o=a.fonts[e];!0!==a.fonts[e]&&(a.fonts[e]=a.monoWidth!==d(e+",monospace")||a.sansWidth!==d(e+",sans-serif")||a.serifWidth!==d(e+",serif")),100===r||(!1===o||o===i)&&!0===a.fonts[e]?(d(e+",monospace",!0),d(e+",sans-serif",!0),d(e+",serif",!0),t()):setTimeout(function(){a.observeFonts(e,t,r)},19)},getversion:function(){return t},currentSlideIndex:function(e){return a[e].pr_active_key},iOSVersion:function(){return!!(navigator.userAgent.match(/iPhone/i)||navigator.userAgent.match(/iPod/i)||navigator.userAgent.match(/iPad/i))&&navigator.userAgent.match(/OS 4_\d like Mac OS X/i)},setIsIOS:function(){a.isiPhone=/iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,a.isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream||"MacIntel"===navigator.platform&&void 0!==navigator.standalone},setIsChrome8889:function(){a.isChrome8889=a.isChrome8889===i?navigator.userAgent.indexOf("Chrome/88")>=0||navigator.userAgent.indexOf("Chrome/89")>=0:a.isChrome8889},isIE:function(){if(a.isIERes===i){var t=e('<div style="display:none;"/>').appendTo(e("body"));t.html("\x3c!--[if IE 8]><a>&nbsp;</a><![endif]--\x3e"),a.isIERes=t.find("a").length,t.remove()}return a.isIERes},is_mobile:function(){var e=["android","webos","iphone","ipad","blackberry","Android","webos","iPod","iPhone","iPad","Blackberry","BlackBerry"],t=!1;if(window.orientation!==i)t=!0;else for(var a in e)e.hasOwnProperty(a)&&(t=!!(t||navigator.userAgent.split(e[a]).length>1)||t);return t&&document.body&&-1===document.body.className.indexOf("rs-ISM")&&(document.body.className+=" rs-ISM"),t},is_android:function(){var e=["android","Android"],i=!1;for(var t in e)e.hasOwnProperty(t)&&(i=!!(i||navigator.userAgent.split(e[t]).length>1)||i);return i},callBackHandling:function(i,t,r){a[i].callBackArray&&e.each(a[i].callBackArray,function(e,i){i&&i.inmodule&&i.inmodule===t&&i.atposition&&i.atposition===r&&i.callback&&i.callback.call()})},get_browser:function(){var e,i=navigator.userAgent,t=i.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i)||[];return/trident/i.test(t[1])?(e=/\brv[ :]+(\d+)/g.exec(i)||[],"IE"):"Chrome"===t[1]&&null!=(e=i.match(/\b(OPR|Edge)\/(\d+)/))?e[1].replace("OPR","Opera"):(t=t[2]?[t[1],t[2]]:[navigator.appName,navigator.appVersion,"-?"],null!=(e=i.match(/version\/(\d+)/i))&&t.splice(1,1,e[1]),t[0])},get_browser_version:function(){var e,i=navigator.appName,t=navigator.userAgent,a=t.match(/(edge|opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);return a&&null!=(e=t.match(/version\/([\.\d]+)/i))&&(a[2]=e[1]),(a=a?[a[1],a[2]]:[i,navigator.appVersion,"-?"])[1]},isFaceBook:function(){return a.isFaceBookApp==i&&(a.isFaceBookApp=navigator.userAgent||navigator.vendor||window.opera,a.isFaceBookApp=a.isFaceBookApp.indexOf("FBAN")>-1||a.isFaceBookApp.indexOf("FBAV")>-1),a.isFaceBookApp},isFirefox:function(e){return a[e].isFirefox=a[e].isFirefox===i?"Firefox"===a.get_browser():a[e].isFirefox,a.isFF=a[e].isFirefox,a[e].isFirefox},isSafari11:function(){return"safari"===a.trim(a.get_browser().toLowerCase())&&parseFloat(a.get_browser_version())>=11},isWebkit:function(){var e=/(webkit)[ \/]([\w.]+)/.exec(navigator.userAgent.toLowerCase());return e&&e[1]&&"webkit"===e[1]},isIE11:function(){return a.IE11=a.IE11===i?!!navigator.userAgent.match(/Trident.*rv\:11\./):a.IE11,a.IE11},checkBackdrop:function(){var e=document.createElement("div");e.style.cssText="-webkit-backdrop-filter: blur(2px)";var t=0!=e.style.length,r=document.documentMode===i||document.documentMode>9;t&&r||(e.style.cssText="backdrop-filter: blur(2px)",t=0!=e.style.length),e=null,a.useBackdrop=t&&r},deepLink:function(e,t){if(t!==i){var r=parseInt(t.toString().replace(/^slide/,"").replace("-",""),10);if(isNaN(r))for(var o in a[e].slides)if(a[e].slides.hasOwnProperty(o)&&a.gA(a[e].slides[o],"deeplink")===t){r=parseInt(a.gA(a[e].slides[o],"originalindex"),10);break}return isNaN(r)||r<1||r>a[e].realslideamount?void 0:r}},getHorizontalOffset:function(e,i){var t=l(e,".outer-left"),a=l(e,".outer-right");return"left"==i?t:"right"==i?a:"all"==i?{left:t,right:a,both:t+a,inuse:t+a!=0}:t+a},getComingSlide:function(e,t){var r=a[e].pr_next_key!==i?a[e].pr_next_key:a[e].pr_processing_key!==i?a[e].pr_processing_key:a[e].pr_active_key,o=0;if(o=0,a[e].pr_active_slide!==i&&"true"==a.gA(a[e].pr_active_slide[0],"not_in_nav")&&(r=a[e].pr_lastshown_key),t!==i&&a.isNumeric(t)||t!==i&&t.match(/to/g))o=1===t||-1===t?parseInt(r,0)+t<0?a[e].slideamount-1:parseInt(r,0)+t>=a[e].slideamount?0:parseInt(r,0)+t:(t=a.isNumeric(t)?t:parseInt(t.split("to")[1],0))<0?0:t>a[e].slideamount-1?a[e].slideamount-1:t;else if(t)for(var s in a[e].slides)a[e].slides.hasOwnProperty(s)&&(o=a[e].slides&&a[e].slides[s]&&(a.gA(a[e].slides[s],"key")===t||a[e].slides[s].id===t)?s:o);return{nindex:o,aindex:r}},callingNewSlide:function(e,t,r){var o=a.getComingSlide(e,t);a[e].pr_next_key=o.nindex,a[e].sdir=a[e].pr_next_key<a[e].pr_active_key?1:0,r&&a[e].carousel!==i&&(a[e].carousel.focused=a[e].pr_next_key),a[e].ctNavElement?a[e].ctNavElement=!1:a[e].c.trigger("revolution.nextslide.waiting"),(a[e].started&&o.aindex===a[e].pr_next_key&&o.aindex===a[e].pr_lastshown_key||a[e].pr_next_key!==o.aindex&&-1!=a[e].pr_next_key&&a[e].pr_lastshown_key!==i)&&k(e,r)},getLoadObj:function(e,t){var r=a[e].loadqueue!==i&&a[e].loadqueue.filter(function(e){return e.src===t})[0];return r===i?{src:t}:r},getResponsiveLevel:function(e){var i=9999,t=0,r=0,o=0;if(a[e].responsiveLevels&&a[e].responsiveLevels.length)for(var s in a[e].responsiveLevels)a[e].responsiveLevels.hasOwnProperty(s)&&(a.winWAll<a[e].responsiveLevels[s]&&(0==t||t>parseInt(a[e].responsiveLevels[s]))&&(i=parseInt(a[e].responsiveLevels[s]),o=parseInt(s),t=parseInt(a[e].responsiveLevels[s])),a.winWAll>a[e].responsiveLevels[s]&&t<a[e].responsiveLevels[s]&&(t=parseInt(a[e].responsiveLevels[s]),r=parseInt(s)));return t<i?r:o},getSizeMultpilicator:function(e,i,t){var r={h:0,w:0};return a[e].justifyCarousel?r.h=r.w=1:(r.w=t.width/a[e].gridwidth[a[e].level],r.h=t.height/a[e].gridheight[a[e].level],r.w=isNaN(r.w)?1:r.w,r.h=isNaN(r.h)?1:r.h,1==a[e].enableUpscaling?r.h=r.w:(r.h>r.w?r.h=r.w:r.w=r.h,(r.h>1||r.w>1)&&(r.w=1,r.h=1))),r},updateDims:function(e,t){var r=a[e].pr_processing_key||a[e].pr_active_key||0,o=a[e].pr_active_key||0,s=a[e].modal!==i&&a[e].modal.useAsModal,n=s?a.winWAll:a.winW,d=!1;if(a[e].lastScrollBarWidth=a.scrollBarWidth,a[e].redraw=a[e].redraw===i?{}:a[e].redraw,a[e].module=a[e].module===i?{}:a[e].module,a[e].canv=a[e].canv===i?{}:a[e].canv,a[e].content=a[e].content===i?{}:a[e].content,a[e].drawUpdates={c:{},cpar:{},canv:{}},"carousel"==a[e].sliderType?a[e].module.margins={top:parseInt(a[e].carousel.padding_top||0,0),bottom:parseInt(a[e].carousel.padding_bottom||0,0)}:a[e].module.margins={top:0,bottom:0},a[e].module.paddings===i&&(a[e].module.paddings={top:parseInt(a[e].cpar.css("paddingTop"),0)||0,bottom:parseInt(a[e].cpar.css("paddingBottom"),0)||0}),a[e].blockSpacing!==i?(a[e].block={bottom:a[e].blockSpacing.bottom!==i?parseInt(a[e].blockSpacing.bottom[a[e].level],0):0,top:a[e].blockSpacing.top!==i?parseInt(a[e].blockSpacing.top[a[e].level],0):0,left:a[e].blockSpacing.left!==i?parseInt(a[e].blockSpacing.left[a[e].level],0):0,right:a[e].blockSpacing.right!==i?parseInt(a[e].blockSpacing.right[a[e].level],0):0},a[e].block.hor=a[e].block.left+a[e].block.right,a[e].block.ver=a[e].block.top+a[e].block.bottom):a[e].block===i&&(a[e].block={top:0,left:0,right:0,bottom:0,hor:0,ver:0}),a[e].blockSpacing!==i){var l={paddingLeft:a[e].block.left,paddingRight:a[e].block.right,marginTop:a[e].block.top,marginBottom:a[e].block.bottom},c=JSON.stringify(l);l!==a[e].emptyObject&&c!==a[e].caches.setsizeBLOCKOBJ&&(tpGS.gsap.set(a[e].blockSpacing.block,l),a[e].caches.setsizeBLOCKOBJ=c,d=!0)}if(a[e].levelForced=a[e].level=a.getResponsiveLevel(e),a[e].rowHeights=a.getRowHeights(e),a[e].aratio=a[e].gridheight[a[e].level]/a[e].gridwidth[a[e].level],a[e].module.width="auto"===a[e].sliderLayout||1==a[e].disableForceFullWidth?a[e].cpar.width():n-a[e].block.hor,a[e].outNavDims=a.getOuterNavDimension(e),a[e].canv.width=a[e].module.width-a[e].outNavDims.horizontal-(s?a.scrollBarWidth:0),s&&"auto"===a[e].sliderLayout&&(a[e].canv.width=Math.min(a[e].gridwidth[a[e].level],n)),"fullscreen"===a[e].sliderLayout||a[e].infullscreenmode){var p=a.getWinH(e)-(!0===a[e].modal.useAsModal?0:a.getFullscreenOffsets(e));a[e].canv.height=Math.max(a[e].rowHeights.cur,Math.max(p-a[e].outNavDims.vertical,a[e].minHeight)),o!==r&&(a[e].currentSlideHeight=Math.max(a[e].rowHeights.last,Math.max(p-a[e].outNavDims.vertical,a[e].minHeight)),a[e].redraw.maxHeightOld=!0),a[e].drawUpdates.c.height="100%"}else a[e].canv.height=a[e].keepBPHeight?a[e].gridheight[a[e].level]:Math.round(a[e].canv.width*a[e].aratio),a[e].canv.height=a[e].autoHeight?a[e].canv.height:Math.min(a[e].canv.height,a[e].gridheight[a[e].level]),a[e].canv.height=Math.max(Math.max(a[e].rowHeights.cur,a[e].canv.height),a[e].minHeight),a[e].drawUpdates.c.height=a[e].canv.height;"fullscreen"!==a[e].sliderLayout&&"fullwidth"!==a[e].sliderLayout||(a[e].canv.width-=a[e].cpar.outerWidth()-a[e].cpar.width(),"fullscreen"===a[e].sliderLayout&&(a[e].canv.height-=a[e].cpar.outerHeight()-a[e].cpar.height())),a[e].module.height=a[e].canv.height,"fullwidth"!=a[e].sliderLayout||a[e].fixedOnTop||(a[e].drawUpdates.c.maxHeight=0!=a[e].maxHeight?Math.min(a[e].canv.height,a[e].maxHeight):a[e].canv.height),a[e].CM=a.getSizeMultpilicator(e,a[e].enableUpscaling,{width:a[e].canv.width,height:a[e].canv.height}),a[e].content.width=a[e].gridwidth[a[e].level]*a[e].CM.w,a[e].content.height=Math.round(Math.max(a[e].rowHeights.cur,a[e].gridheight[a[e].level]*a[e].CM.h));var g=a[e].module.margins.top+a[e].module.margins.bottom+("fullscreen"===a[e].sliderLayout?0:a[e].outNavDims.vertical)+a[e].canv.height+a[e].module.paddings.top+a[e].module.paddings.bottom;a[e].drawUpdates.cpar.height=g,a[e].drawUpdates.cpar.width="auto"===a[e].sliderLayout?"auto":a[e].module.width,"auto"===a[e].sliderLayout||"fullscreen"===a[e].sliderLayout&&!0===a[e].disableForceFullWidth||a[e].rsFullWidthWrap===i?"fullscreen"==a[e].sliderLayout&&1==a[e].disableForceFullWidth&&(a[e].drawUpdates.cpar.left=0):a[e].drawUpdates.cpar.left=0-Math.ceil(a[e].rsFullWidthWrap.offset().left-(a[e].outNavDims.left+a[e].block.left)),a[e].sbtimeline.set&&a[e].sbtimeline.fixed?(a[e].sbtimeline.extended===i&&a.updateFixedScrollTimes(e),a[e].forcerHeight=2*g+a[e].sbtimeline.extended):a[e].forcerHeight=g,a[e].forcerHeight!==a[e].caches.setsizeForcerHeight&&a[e].forcer!==i&&(a[e].caches.setsizeForcerHeight=a[e].forcerHeight,d=!0,a[e].redraw.forcer=!0),a[e].drawUpdates.c.width=a[e].canv.width,"auto"===a[e].sliderLayout&&(a[e].drawUpdates.c.left=a[e].outNavDims.left),a[e].drawUpdates.c!==a[e].emptyObject&&JSON.stringify(a[e].drawUpdates.c)!==a[e].caches.setsizeCOBJ&&(a[e].caches.setsizeCOBJ=JSON.stringify(a[e].drawUpdates.c),d=!0,a[e].redraw.c=!0),a[e].drawUpdates.cpar!==a[e].emptyObject&&JSON.stringify(a[e].drawUpdates.cpar)!==a[e].caches.setsizeCPAROBJ&&(a[e].caches.setsizeCPAROBJ=JSON.stringify(a[e].drawUpdates.cpar),d=!0,a[e].redraw.cpar=!0),s&&"auto"===a[e].sliderLayout&&a[e].caches.canWidth!==a[e].canv.width&&(a[e].caches.canWidth=a[e].canv.width,d=!0,a[e].redraw.modalcanvas=!0),a[e].slayers&&a[e].slayers.length>0&&a[e].outNavDims.left!==a[e].caches.outNavDimsLeft&&"fullwidth"!=a[e].sliderLayout&&"fullscreen"!=a[e].sliderLayout&&(a[e].caches.outNavDimsLeft=a[e].outNavDims.left,a[e].redraw.slayers=!0),s&&a[e].modal.calibration!==i&&"middle"===a[e].modal.vertical&&(a[e].modal.calibration.top=a.getWinH(e)<g?"0%":"50%",a[e].modal.calibration.y=a.getWinH(e)<g?"0px":"-50%","fullwidth"===a[e].sliderLayout&&(d=!0,a[e].redraw.modulewrap=!0)),a[e].gridOffsetWidth=(a[e].module.width-a[e].gridwidth[a[e].level])/2,a[e].gridOffsetHeight=(a[e].module.height-a[e].content.height)/2,a[e].caches.curRowsHeight=a[e].currentRowsHeight=a[e].rowHeights.cur,a[e].caches.moduleWidth=a[e].width=a[e].module.width,a[e].caches.moduleHeight=a[e].height=a[e].module.height,a[e].caches.canWidth=a[e].conw=a[e].canv.width,a[e].caches.canHeight=a[e].conh=a[e].canv.height,a[e].bw=a[e].CM.w,a[e].bh=a[e].CM.h,a[e].caches.outNavDimsLeft=a[e].outNavDims.left,window.requestAnimationFrame(function(){a[e].redraw.forcer&&tpGS.gsap.set(a[e].forcer,{height:a[e].forcerHeight}),a[e].redraw.c&&tpGS.gsap.set(a[e].c,a[e].drawUpdates.c),a[e].redraw.cpar&&tpGS.gsap.set(a[e].cpar,a[e].drawUpdates.cpar),a[e].redraw.modalcanvas&&tpGS.gsap.set([a[e].modal.c,a[e].canvas],{width:a[e].canv.width}),a[e].redraw.maxHeightOld&&(a[e].slides[o].style.maxHeight=a[e].currentSlideHeight!==a[e].canv.height?a[e].currentSlideHeight+"px":"none"),a[e].redraw.slayers&&tpGS.gsap.set(a[e].slayers,{left:a[e].outNavDims.left}),a[e].redraw.modulewrap&&tpGS.gsap.set(a[e].modal.c.find("rs-module-wrap"),a[e].modal.calibration),!0!==a[e].navigation.initialised&&"prepared"===t&&("hero"!==a[e].sliderType&&a.createNavigation&&a[e].navigation.use&&!0!==a[e].navigation.createNavigationDone&&a.createNavigation(e),a.resizeThumbsTabs&&a.resizeThumbsTabs&&a[e].navigation.use&&a.resizeThumbsTabs(e)),a[e].rebuildProgressBar&&O(e),a[e].redraw={}});var u=a[e].inviewport&&(a[e].heightInLayers!==i&&a[e].module.height!==a[e].heightInLayers||a[e].widthInLayers!==i&&a[e].module.width!==a[e].widthInLayers);return"ignore"!==t&&u&&(a[e].heightInLayers=i,a[e].widthInLayers=i,"carousel"!==a[e].sliderType&&(a[e].pr_next_key!==i?a.animateTheLayers({slide:a[e].pr_next_key,id:e,mode:"rebuild",caller:"swapSlideProgress_1"}):a[e].pr_processing_key!==i?a.animateTheLayers({slide:a[e].pr_processing_key,id:e,mode:"rebuild",caller:"swapSlideProgress_2"}):a[e].pr_active_key!==i&&a.animateTheLayers({slide:a[e].pr_active_key,id:e,mode:"rebuild",caller:"swapSlideProgress_3"})),d=!0),d&&"ignore"!==t&&a.requestLayerUpdates(e,"enterstage"),a[e].module.height!==a[e].module.lastHeight&&(a[e].module.lastHeight=a[e].module.height,window.requestAnimationFrame(function(){window.innerHeight!==screen.height&&Math.round(window.innerHeight*window.devicePixelRatio)!==screen.height&&m(e,i,!1)})),tpGS.gsap.delayedCall(.1,function(){a[e].lastScrollBarWidth!==a.scrollBarWidth?(a.updateDims(e,"ignore"),m(e)):a.isModalOpen||a.scrollBarWidth===window.innerWidth-document.documentElement.clientWidth||a.rAfScrollbar===i&&(a.rAfScrollbar=requestAnimationFrame(function(){a.rAfScrollbar=i,a.getWindowDimension(e,!1)}))}),d},getSlideIndex:function(e,i){var t=!1;for(var r in a[e].slides){if(!a[e].slides.hasOwnProperty(r)||!1!==t)continue;t=a.gA(a[e].slides[r],"key")===i?r:t}return!1===t?0:t},loadUpcomingContent:function(e){if("smart"==a[e].lazyType){var i=[],t=parseInt(a.getSlideIndex(e,a.gA(a[e].pr_next_slide[0],"key")),0),r=t-1<0?a[e].realslideamount-1:t-1,o=t+1==a[e].realslideamount?0:t+1;r!==t&&i.push(a[e].slides[r]),o!==t&&i.push(a[e].slides[o]),i.length>0&&(a.loadImages(i,e,2),a.waitForCurrentImages(i,e,function(){}))}},lazyLoadAllSlides:function(e){if("all"==a[e].lazyType&&!0!==a[e].lazyLoad_AllDone&&(a[e].viewPort.enable&&a[e].inviewport||!a[e].viewPort.enable)){for(var i in a[e].slides)a[e].slides.hasOwnProperty(i)&&(a.loadImages(a[e].slides[i],e,i),a.waitForCurrentImages(a[e].slides[i],e,function(){}));a[e].lazyLoad_AllDone=!0}},getFullscreenOffsets:function(t){var r=0;if(a[t].fullScreenOffsetContainer!=i){var o=(""+a[t].fullScreenOffsetContainer).split(",");for(var s in o)o.hasOwnProperty(s)&&(r+=e(o[s]).outerHeight(!0)||0)}return a[t].fullScreenOffset!=i&&(!a.isNumeric(a[t].fullScreenOffset)&&a[t].fullScreenOffset.split("%").length>1?r+=a.getWinH(t)*parseInt(a[t].fullScreenOffset,0)/100:a.isNumeric(parseInt(a[t].fullScreenOffset,0))&&(r+=parseInt(a[t].fullScreenOffset,0)||0)),a[t].fullScreenOffsetResult=r,r},unToggleState:function(e){if(e!==i)for(var t=0;t<e.length;t++)try{document.getElementById(e[t]).classList.remove("rs-tc-active")}catch(e){}},toggleState:function(e){if(e!==i)for(var t=0;t<e.length;t++)try{document.getElementById(e[t]).classList.add("rs-tc-active")}catch(e){}},swaptoggleState:function(e){if(e!=i&&e.length>0)for(var t=0;t<e.length;t++){var r=document.getElementById(e[t]);if(a.gA(r,"toggletimestamp")!==i&&(new Date).getTime()-a.gA(r,"toggletimestamp")<250)return;a.sA(r,"toggletimestamp",(new Date).getTime()),null!==r&&(r.className.indexOf("rs-tc-active")>=0?r.classList.remove("rs-tc-active"):r.classList.add("rs-tc-active"))}},lastToggleState:function(e){var t;if(e!==i)for(var a=0;a<e.length;a++){var r=document.getElementById(e[a]);t=!0===t||null!==r&&r.className.indexOf("rs-tc-active")>=0||t}return t},revCheckIDS:function(t,r){if(a.gA(r,"idcheck")===i){var o=r.id,s=e.inArray(r.id,window.RSANYID),n=-1;-1!==s&&(n=e.inArray(r.id,a[t].anyid),window.RSANYID_sliderID[s]===t&&-1===n||(r.id=r.id+"_"+Math.round(9999*Math.random()),console.log("Warning - ID:"+o+" exists already. New Runtime ID:"+r.id),s=n=-1)),-1===n&&a[t].anyid.push(r.id),-1===s&&(window.RSANYID.push(r.id),window.RSANYID_sliderID.push(t))}return a.sA(r,"idcheck",!0),r.id},buildSpinner:function(t,a,r,o){var s;if("off"!==a){o=o===i?"":o,r=r===i?"#ffffff":r;var n=parseInt(a.replace("spinner",""),10);if(isNaN(n)||n<6){var d='style="background-color:'+r+'"',l=o===i||3!==n&&4!=n?"":d;s=e("<rs-loader "+(o===i||1!==n&&2!=n?"":d)+' class="'+a+" "+o+'"><div '+l+' class="dot1"></div><div '+l+' class="dot2"></div><div '+l+' class="bounce1"></div><div '+l+' class="bounce2"></div><div '+l+' class="bounce3"></div></rs-loader>')}else{var c,p='<div class="rs-spinner-inner"';if(7===n)-1!==r.search("#")?(c=r.replace("#",""),c="rgba("+parseInt(c.substring(0,2),16)+", "+parseInt(c.substring(2,4),16)+", "+parseInt(c.substring(4,6),16)+", "):-1!==r.search("rgb")&&(c=r.substring(r.indexOf("(")+1,r.lastIndexOf(")")).split(",")).length>2&&(c="rgba("+c[0].trim()+", "+c[1].trim()+", "+c[2].trim()+", "),c&&"string"==typeof c&&(p+=' style="border-top-color: '+c+"0.65); border-bottom-color: "+c+"0.15); border-left-color: "+c+"0.65); border-right-color: "+c+'0.15)"');else 12===n&&(p+=' style="background:'+r+'"');p+=">";for(var g=[10,0,4,2,5,9,0,4,4,2][n-6],u=0;u<g;u++)u>0&&(p+=" "),p+='<span style="background:'+r+'"></span>';s=e('<rs-loader class="'+a+" "+o+'">'+(p+="</div>")+"</div></rs-loader>")}return s}},addStaticLayerTo:function(e,i,t){if(a[e].slayers.length<2){var r=document.createElement("rs-static-layers");r.className="rs-stl-"+i,r.appendChild(t[0]),a[e].c[0].appendChild(r),a[e].slayers.push(r)}else a[e].slayers[1].appendChild(t[0])}});var r=function(){return a.isIE11()?function(e,i){return e.querySelectorAll(i)}:function(e,i){return e.getElementsByTagName(i)}},o=function(e){a[e].responsiveLevels=a.revToResp(a[e].responsiveLevels,a[e].rle),a[e].visibilityLevels=a.revToResp(a[e].visibilityLevels,a[e].rle),a[e].responsiveLevels[0]=9999,a[e].rle=a[e].responsiveLevels.length||1,a[e].gridwidth=a.revToResp(a[e].gridwidth,a[e].rle),a[e].gridheight=a.revToResp(a[e].gridheight,a[e].rle),a[e].editorheight!==i&&(a[e].editorheight=a.revToResp(a[e].editorheight,a[e].rle)),a.updateDims(e)},s=function(i,t){var a=[];return e.each(i,function(e,i){e!=t&&a.push(i)}),a},n=function(i,t,r){a[r].c.find(i).each(function(){var i=e(this);i.data("key")===t&&i.remove()})},d=function(e,t){if(a["rsfont_"+e]==i&&(a["rsfont_"+e]=document.createElement("span"),a["rsfont_"+e].innerHTML=Array(100).join("wi"),a["rsfont_"+e].style.cssText=["position:absolute","width:auto","font-size:128px","left:-99999px"].join(" !important;"),a["rsfont_"+e].style.fontFamily=e,document.body.appendChild(a["rsfont_"+e])),t===i)return a["rsfont_"+e].clientWidth;document.body.removeChild(a["rsfont_"+e])},l=function(i,t){var a=0;return i.find(t).each(function(){var i=e(this);!i.hasClass("tp-forcenotvisible")&&a<i.outerWidth()&&(a=i.outerWidth())}),a},c=function(t){if(t===i||a[t]===i||a[t].c===i)return!1;if(a[t].cpar!==i&&a[t].cpar.data("aimg")!=i&&("enabled"==a[t].cpar.data("aie8")&&a.isIE(8)||"enabled"==a[t].cpar.data("amobile")&&a.ISM))a[t].c.html('<img class="tp-slider-alternative-image" src="'+a[t].cpar.data("aimg")+'">');else{window._rs_firefox13=!1,window._rs_firefox=a.isFirefox(),window._rs_ie=window._rs_ie===i?!e.support.opacity:window._rs_ie,window._rs_ie9=window._rs_ie9===i?9==document.documentMode:window._rs_ie9;var r=e.fn.jquery.split("."),o=parseFloat(r[0]),s=parseFloat(r[1]);1==o&&s<7&&a[t].c.html('<div style="text-align:center; padding:40px 0px; font-size:20px; color:#992222;"> The Current Version of jQuery:'+r+" <br>Please update your jQuery Version to min. 1.7 in Case you wish to use the Revolution Slider Plugin</div>"),o>1&&(window._rs_ie=!1),a[t].realslideamount=a[t].slideamount=0;var n=a.getByTag(a[t].canvas[0],"RS-SLIDE"),d=[];for(var l in a[t].notInNav=[],a[t].slides=[],n)n.hasOwnProperty(l)&&("on"==a.gA(n[l],"hsom")&&a.ISM?d.push(n[l]):(a.gA(n[l],"invisible")||1==a.gA(n[l],"invisible")?a[t].notInNav.push(n[l]):(a[t].slides.push(n[l]),a[t].slideamount++),a[t].realslideamount++,a.sA(n[l],"originalindex",a[t].realslideamount),a.sA(n[l],"origindex",a[t].realslideamount-1)));for(l in d)d.hasOwnProperty(l)&&d[l].remove();for(l in a[t].notInNav)a[t].notInNav.hasOwnProperty(l)&&(a.sA(a[t].notInNav[l],"not_in_nav",!0),a[t].canvas[0].appendChild(a[t].notInNav[l]));if(a[t].canvas.css({visibility:"visible"}),a[t].slayers=a[t].c.find("rs-static-layers"),a[t].slayers[0]&&a[t].slayers.className&&-1!==a[t].slayers[0].className.indexOf("rs-stl-visible")&&a[t].c.addClass("rs-stl-visible"),a[t].slayers.length>0&&a.sA(a[t].slayers[0],"key","staticlayers"),!0===a[t].modal.useAsModal&&(a[t].cpar.wrap('<rs-modal id="'+a[t].c[0].id+'_modal"></rs-modal>'),a[t].modal.c=e(a.closestNode(a[t].cpar[0],"RS-MODAL")),a[t].modal.c.appendTo(e("body")),a[t].modal!==i&&a[t].modal.alias!==i&&a.revModal(t,{mode:"init"})),1==a[t].waitForInit||1==a[t].modal.useAsModal)return a.RS_toInit!==i&&(a.RS_toInit[t]=!0),a[t].c.trigger("revolution.slide.waitingforinit"),void(a[t].waitingForInit=!0);window.requestAnimationFrame(function(){u(t)}),a[t].initEnded=!0}},p=function(){e("body").data("rs-fullScreenMode",!e("body").data("rs-fullScreenMode")),e("body").data("rs-fullScreenMode")&&setTimeout(function(){a.window.trigger("resize")},200)},g=function(e,t,r){return a.gA(e,"lazyload")!==i?a.gA(e,"lazyload"):a[r].lazyloaddata!==i&&a[r].lazyloaddata.length>0&&a.gA(e,a[r].lazyloaddata)!==i?a.gA(e,a[r].lazyloaddata):a.gA(e,"lazy-src")!==i?a.gA(e,"lazy-src"):a.gA(e,"lazy-wpfc-original-src")!==i?a.gA(e,"lazy-wpfc-original-src"):a.gA(e,"lazy")!==i?a.gA(e,"lazy"):t},u=function(t){if(a[t]!==i){if(a[t].sliderisrunning=!0,!0!==a[t].noDetach&&a[t].c.detach(),a[t].shuffle){for(var r=a[t].canvas.find("rs-slide:first-child"),o=a.gA(r[0],"firstanim"),s=0;s<a[t].slideamount;s++)a[t].canvas.find("rs-slide:eq("+Math.round(Math.random()*a[t].slideamount)+")").prependTo(a[t].canvas);a.sA(a[t].canvas.find("rs-slide:first-child")[0],"firstanim",o)}a[t].slides=a.getByTag(a[t].canvas[0],"RS-SLIDE"),a[t].thumbs=new Array(a[t].slides.length),a[t].slots=1,a[t].firststart=1,a[t].loadqueue=[],a[t].syncload=0;var n=0,d="carousel"===a[t].sliderType&&a[t].carousel.border_radius!==i?parseInt(a[t].carousel.border_radius,0):0;for(var l in a[t].slides)if(a[t].slides.hasOwnProperty(l)&&"length"!==l){var c=a[t].slides[l],u=a.getByTag(c,"IMG")[0];a.gA(c,"key")===i&&a.sA(c,"key","rs-"+Math.round(999999*Math.random()));var h={params:Array(12),id:a.gA(c,"key"),src:a.gA(c,"thumb")!==i?a.gA(c,"thumb"):g(u,u!==i?u.src:i,t)};a.gA(c,"title")===i&&a.sA(c,"title",""),a.gA(c,"description")===i&&a.sA(c,"description",""),h.params[0]={from:RegExp("\\{\\{title\\}\\}","g"),to:a.gA(c,"title")},h.params[1]={from:RegExp("\\{\\{description\\}\\}","g"),to:a.gA(c,"description")};for(var v=1;v<=10;v++)a.gA(c,"p"+v)!==i?h.params[v+1]={from:RegExp("\\{\\{param"+v+"\\}\\}","g"),to:a.gA(c,"p"+v)}:h.params[v+1]={from:RegExp("\\{\\{param"+v+"\\}\\}","g"),to:""};if(a[t].thumbs[n]=e.extend({},!0,h),d>0&&tpGS.gsap.set(c,{borderRadius:d+"px"}),a.gA(c,"link")!=i||a.gA(c,"linktoslide")!==i){var y=a.gA(c,"link"),w=y!==i?y:"slide",b="slide"!=w?"no":a.gA(c,"linktoslide"),_=a.gA(c,"seoz"),S=a.gA(c,"tag");if(b!=i&&"no"!=b&&"next"!=b&&"prev"!=b)for(var x in a[t].slides)a[t].slides.hasOwnProperty(x)&&parseInt(a.gA(a[t].slides[x],"origindex"),0)+1==a.gA(c,"linktoslide")&&(b=a.gA(a[t].slides[x],"key"));"slide"==w||"a"!=S?e(c).prepend('<rs-layer class="rs-layer slidelink" id="rs_slidelink_'+Math.round(1e5*Math.random())+'" data-zindex="'+("back"===_?0:"front"===_?95:_!==i?parseInt(_,0):100)+'" dataxy="x:c;y:c" data-dim="w:100%;h:100%" data-basealign="slide"'+("no"==b?"slide"==w||a.ISM?"":"  data-actions='o:click;a:simplelink;target:"+(a.gA(c,"target")||"_self")+";url:"+w+";'":"  data-actions='"+("scroll_under"===b?"o:click;a:scrollbelow;offset:100px;":"prev"===b?"o:click;a:jumptoslide;slide:prev;d:0.2;":"next"===b?"o:click;a:jumptoslide;slide:next;d:0.2;":"o:click;a:jumptoslide;slide:"+b+";d:0.2;")+"'")+" data-frame_1='e:power3.inOut;st:100;sp:100' data-frame_999='e:power3.inOut;o:0;st:w;sp:100'>"+(a.ISM?"<a "+("slide"!=w?("_blank"===a.gA(c,"target")?'rel="noopener" ':"")+'target="'+(a.gA(c,"target")||"_self")+'" href="'+w+'"':"")+"><span></span></a>":"")+"</rs-layer>"):e(c).prepend('<a class="rs-layer slidelink" id="rs_slidelink_'+Math.round(1e5*Math.random())+'" data-zindex="'+("back"===_?0:"front"===_?95:_!==i?parseInt(_,0):100)+'" dataxy="x:c;y:c" data-dim="w:100%;h:100%" data-basealign="slide" href="'+w+'" target="'+(a.gA(c,"target")||"_self")+'" rel="noopener" data-frame_1="e:power3.inOut;st:100;sp:100" data-frame_999="e:power3.inOut;o:0;st:w;sp:100"><span></span></a>')}n++}if(a[t].simplifyAll&&(a.isIE(8)||a.iOSVersion())&&(a[t].c.find(".rs-layer").each(function(){var i=e(this);i.removeClass("customin customout").addClass("fadein fadeout"),i.data("splitin",""),i.data("speed",400)}),a[t].c.find("rs-slide").each(function(){var i=e(this);i.data("transition","fade"),i.data("masterspeed",500),i.data("slotamount",1),(i.find(".rev-slidebg")||i.find(">img").first()).data("panzoom",null)})),window._rs_desktop=window._rs_desktop===i?!navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i):window._rs_desktop,a[t].autoHeight="fullscreen"==a[t].sliderLayout||a[t].autoHeight,"fullwidth"!=a[t].sliderLayout||a[t].autoHeight||a[t].c.css({maxHeight:a[t].gridheight[a[t].level]+"px"}),"auto"==a[t].sliderLayout||null!==a.closestNode(a[t].c[0],"RS-FULLWIDTH-WRAP")||"fullscreen"===a[t].sliderLayout&&1==a[t].disableForceFullWidth)a[t].topc=a[t].cpar;else{var k=a[t].cpar[0].style.marginTop,L=a[t].cpar[0].style.marginBottom;k=k===i||""===k?"":"margin-top:"+k+";",L=L===i||""===L?"":"margin-bottom:"+L+";",a[t].rsFullWidthWrap=a[t].topc=e('<rs-fullwidth-wrap id="'+a[t].c[0].id+'_forcefullwidth" style="'+k+L+'"></rs-fullwidth-wrap>'),a[t].forcer=e('<rs-fw-forcer style="height:'+(a[t].forcerHeight===i?a[t].cpar.height():a[t].forcerHeight)+'px"></rs-fw-forcer>'),a[t].topc.append(a[t].forcer),a[t].topc.insertBefore(a[t].cpar),a[t].cpar.detach(),a[t].cpar.css({marginTop:"0px",marginBottom:"0px",position:"absolute"}),a[t].cpar.prependTo(a[t].topc)}if(a[t].forceOverflow&&a[t].topc[0].classList.add("rs-forceoverflow"),"carousel"===a[t].sliderType&&!0!==a[t].overflowHidden&&a[t].c.css({overflow:"visible"}),0!==a[t].maxHeight&&tpGS.gsap.set([a[t].cpar,a[t].c,a[t].topc],{maxHeight:a[t].maxHeight+"px"}),a[t].fixedOnTop&&tpGS.gsap.set(a[t].blockSpacing!==i&&a[t].blockSpacing.block!==i?a[t].blockSpacing.block:a[t].topc,{position:"fixed",top:"0px",left:"0px",pointerEvents:"none",zIndex:5e3}),a[t].shadow!==i&&a[t].shadow>0&&a[t].cpar.addClass("tp-shadow"+a[t].shadow).append('<div class="tp-shadowcover" style="background-color:'+a[t].cpar.css("backgroundColor")+";background-image:"+a[t].cpar.css("backgroundImage")+'"></div>'),a.updateDims(t,"prepared"),a.observeWraps===i&&(a.observeWraps=new a.wrapObserver.init(function(e,t){m(t,i,!0)})),!a[t].c.hasClass("revslider-initialised")){a[t].c[0].classList.add("revslider-initialised"),a[t].c[0].id=a[t].c[0].id===i?"revslider-"+Math.round(1e3*Math.random()+5):a[t].c[0].id,a.revCheckIDS(t,a[t].c[0]),a[t].origcd=parseInt(a[t].duration,0),a[t].scrolleffect._L=[],a[t].sbas=a[t].sbas===i?{}:a[t].sbas,a[t].layers=a[t].layers||{},a[t].sortedLayers=a[t].sortedLayers||{};var R=a[t].c[0].querySelectorAll("rs-layer, rs-row, rs-column, rs-group,  rs-bgvideo, .rs-layer");for(var O in R)if(R.hasOwnProperty(O)){var I,M,C=e(R[O]),T=C.data();if(T.startclasses=R[O].className,T.startclasses=T.startclasses===i||null===T.startclasses?"":T.startclasses,T.animationonscroll=!!a[t].sbtimeline.set&&a[t].sbtimeline.layers,T.animationonscroll=!0===T.animationonscroll||"true"==T.animationonscroll,T.filteronscroll=!!a[t].scrolleffect.set&&a[t].scrolleffect.layers,T.pxundermask=T.startclasses.indexOf("rs-pxmask")>=0&&"off"!==a[t].parallax.type&&T.startclasses.indexOf("rs-pxl-")>=0,T.noPevents=T.startclasses.indexOf("rs-noevents")>=0,T.sba)for(var v in I=T.sba.split(";"))I.hasOwnProperty(v)&&("t"==(M=I[v].split(":"))[0]&&(T.animationonscroll=M[1],"false"==M[1]&&(T.animOnScrollForceDisable=!0)),"e"==M[0]&&(T.filteronscroll=M[1]),"so"==M[0]&&(T.scrollBasedOffset=parseInt(M[1])/1e3));if("true"!=T.animationonscroll&&1!=T.animationonscroll||(T.startclasses+=" rs-sba",C[0].className+=" rs-sba"),T.startclasses.indexOf("rs-layer-static")>=0&&a.handleStaticLayers&&a.handleStaticLayers(C,t),"RS-BGVIDEO"!==C[0].tagName){if(C[0].classList.add("rs-layer"),"column"===T.type&&(T.columnwidth="33.33%",T.verticalalign="top",T.column!==i))for(var A in I=T.column.split(";"))I.hasOwnProperty(A)&&("w"===(M=I[A].split(":"))[0]&&(T.columnwidth=M[1]),"a"===M[0]&&(T.verticalalign=M[1]));var B=T.startclasses.indexOf("slidelink")>=0?"z-index:"+T.zindex+";width:100% !important;height:100% !important;":"",z="column"!==T.type?"":T.verticalalign===i?" vertical-align:top;":" vertical-align:"+T.verticalalign+";",G="row"===T.type||"column"===T.type?"position:relative;":"position:absolute;",E="",F="row"===T.type?"rs-row-wrap":"column"===T.type?"rs-column-wrap":"group"===T.type?"rs-group-wrap":"rs-layer-wrap",H="",N="",j=(T.noPevents,";pointer-events:none");"row"===T.type||"column"===T.type||"group"===T.type?(C[0].classList.remove("tp-resizeme"),"column"===T.type&&(T.width="auto",C[0].group="row",tpGS.gsap.set(C,{width:"auto"}),T.filteronscroll=!1)):(H="display:"+("inline-block"===C[0].style.display?"inline-block":"block")+";",null!==a.closestNode(C[0],"RS-COLUMN")?(C[0].group="column",T.filteronscroll=!1):null!==a.closestNode(C[0],"RS-GROUP-WRAP")&&(C[0].group="group",T.filteronscroll=!1)),T.wrpcls!==i&&(E=E+" "+T.wrpcls),T.wrpid!==i&&(N='id="'+T.wrpid+'"'),C.wrap("<"+F+" "+N+' class="rs-parallax-wrap '+E+'" style="'+z+" "+B+G+H+j+'"><rs-loop-wrap style="'+B+G+H+'"><rs-mask-wrap style="'+B+G+H+'">'+(T.pxundermask?"<rs-px-mask></rs-px-mask>":"")+"</rs-mask-wrap></rs-loop-wrap></"+F+">"),!0!==T.filteronscroll&&"true"!=T.filteronscroll||a[t].scrolleffect._L.push(C.parent()),C[0].id=C[0].id===i?"layer-"+Math.round(999999999*Math.random()):C[0].id,a.revCheckIDS(t,C[0]),T.pxundermask?a[t]._Lshortcuts[C[0].id]={p:e(C[0].parentNode.parentNode.parentNode.parentNode),lp:e(C[0].parentNode.parentNode.parentNode),m:e(C[0].parentNode.parentNode)}:a[t]._Lshortcuts[C[0].id]={p:e(C[0].parentNode.parentNode.parentNode),lp:e(C[0].parentNode.parentNode),m:e(C[0].parentNode)},"column"===T.type&&a[t]._Lshortcuts[C[0].id].p.append('<rs-cbg-mask-wrap><rs-column-bg id="'+C[0].id+'_rs_cbg"></rs-column-bg></rs-cbg-mask-wrap>'),"text"===T.type&&a.getByTag(C[0],"IFRAME").length>0&&(a[t].slideHasIframe=!0,C[0].classList.add("rs-ii-o")),a[t].BUG_safari_clipPath&&"true"!=T.animationonscroll&&1!=T.animationonscroll&&C[0].classList.add("rs-pelock"),C[0].dataset.staticz!==i&&"row"!==T.type&&"row"!==C[0].group&&"column"!==C[0].group&&a.addStaticLayerTo(t,C[0].dataset.staticz,a[t]._Lshortcuts[C[0].id].p)}a.gA(C[0],"actions")&&a.checkActions&&a.checkActions(C,t,a[t]),!a.checkVideoApis||window.rs_addedvim&&window.rs_addedyt||a[t].youtubeapineeded&&a[t].vimeoapineeded||a.checkVideoApis(C,t)}a.checkActions&&a.checkActions(i,t),a[t].c[0].addEventListener("mousedown",function(){if(!0!==a[t].onceClicked&&(a[t].onceClicked=!0,!0!==a[t].onceVideoPlayed&&a[t].activeRSSlide!==i&&a[t].slides!==i&&a[t].slides[a[t].activeRSSlide]!==i)){var r=e(a[t].slides[a[t].activeRSSlide]).find("rs-bgvideo");r!==i&&null!==r&&r.length>0&&a.playVideo(r,t)}}),a[t].c[0].addEventListener("mouseenter",function(){a[t].c.trigger("tp-mouseenter"),a[t].overcontainer=!0},{passive:!0}),a[t].c[0].addEventListener("mouseover",function(){a[t].c.trigger("tp-mouseover"),a[t].overcontainer=!0},{passive:!0}),a[t].c[0].addEventListener("mouseleave",function(){a[t].c.trigger("tp-mouseleft"),a[t].overcontainer=!1},{passive:!0}),a[t].c.find(".rs-layer video").each(function(i){var t=e(this);t.removeClass("video-js vjs-default-skin"),t.attr("preload",""),t.css({display:"none"})}),a[t].rs_static_layer=a.getByTag(a[t].c[0],"RS-STATIC-LAYERS"),a.preLoadAudio&&a[t].rs_static_layer.length>0&&a.preLoadAudio(e(a[t].rs_static_layer),t,1),a[t].rs_static_layer.length>0&&(a.loadImages(a[t].rs_static_layer[0],t,0,!0),a.waitForCurrentImages(a[t].rs_static_layer[0],t,function(){a[t]!==i&&a[t].c.find("rs-static-layers img").each(function(){this.src=a.getLoadObj(t,a.gA(this,"src")!=i?a.gA(this,"src"):this.src).src})})),a[t].rowzones=[],a[t].rowzonesHeights=[],a[t].topZones=[],a[t].middleZones=[],a[t].bottomZones=[];var W=a.deepLink(t,P("#")[0]);W!==i&&(a[t].startWithSlide=W,a[t].deepLinkListener=!0,window.addEventListener("hashchange",function(){if(!0!==a[t].ignoreDeeplinkChange){var e=a.deepLink(t,P("#")[0]);e!==i&&a.callingNewSlide(t,e,!0)}a[t].ignoreDeeplinkChange=!1})),a[t].loader=a.buildSpinner(t,a[t].spinner,a[t].spinnerclr),a[t].loaderVisible=!0,a[t].c.append(a[t].loader),f(t),("off"!==a[t].parallax.type||a[t].scrolleffect.set||a[t].sbtimeline.set)&&a.checkForParallax&&a.checkForParallax(t),a[t].fallbacks.disableFocusListener||"true"==a[t].fallbacks.disableFocusListener||!0===a[t].fallbacks.disableFocusListener||(a[t].c.addClass("rev_redraw_on_blurfocus"),D());var V=a[t].viewPort;for(var v in"on"===a[t].navigation.mouseScrollNavigation&&(V.enable=!0),a[t].slides)if(a[t].slides.hasOwnProperty(v)){var U=e(a[t].slides[v]);a[t].rowzones[v]=[],a[t].rowzonesHeights[v]=[],a[t].topZones[v]=[],a[t].middleZones[v]=[],a[t].bottomZones[v]=[],U.find("rs-zone").each(function(){a[t].rowzones[v].push(e(this)),this.className.indexOf("rev_row_zone_top")>=0&&a[t].topZones[v].push(this),this.className.indexOf("rev_row_zone_middle")>=0&&a[t].middleZones[v].push(this),this.className.indexOf("rev_row_zone_bottom")>=0&&a[t].bottomZones[v].push(this)})}a.lazyLoadAllSlides(t),a[t].srowzones=[],a[t].smiddleZones=[],a[t].slayers&&a[t].slayers.find("rs-zone").each(function(){a[t].srowzones.push(e(this)),this.className.indexOf("rev_row_zone_middle")>=0&&a[t].smiddleZones.push(this)}),"carousel"===a[t].sliderType&&tpGS.gsap.set(a[t].canvas,{scale:1,perspective:1200,transformStyle:"flat",opacity:0}),a[t].c.prependTo(a[t].cpar),e("body").data("rs-fullScreenMode",!1),window.addEventListener("fullscreenchange",p,{passive:!0}),window.addEventListener("mozfullscreenchange",p,{passive:!0}),window.addEventListener("webkitfullscreenchange",p,{passive:!0}),a.document.on("updateContainerSizes."+a[t].c.attr("id"),function(){if(a[t]!==i)return a[t].c!=i&&void(a.updateDims(t,"ignore")&&window.requestAnimationFrame(function(){a.updateDims(t,"ignore"),a[t].fullScreenMode=a.checkfullscreenEnabled(t),a.lastwindowheight=a.getWinH(t),m(t)}))}),V.presize&&(a[t].pr_next_slide=e(a[t].slides[0]),a.loadImages(a[t].pr_next_slide[0],t,0,!0),a.waitForCurrentImages(a[t].pr_next_slide.find(".tp-layers"),t,function(){a.animateTheLayers&&a.animateTheLayers({slide:a[t].pr_next_key,id:t,mode:"preset",caller:"runSlider"})})),("off"!=a[t].parallax.type||a[t].sbtimeline.set||!0===V.enable)&&a.scrollTicker(t),!0!==V.enable&&(a[t].inviewport=!0,a.enterViewPort(t)),a.RS_toInit!==i&&(a.RS_toInit[t]=!0),a[t].observeWrap&&a.observeWraps&&a.wrapObserver.observe(a[t].rsFullWidthWrap!==i?a[t].rsFullWidthWrap[0]:a[t].cpar[0],t)}}},h=function(e,t){a.winW<a[e].hideSliderAtLimit?(a[e].c.trigger("stoptimer"),!0!==a[e].sliderIsHidden&&(a.sA(a[e].cpar[0],"displaycache","none"!=a[e].cpar.css("display")?a[e].cpar.css("display"):a.gA(a[e].cpar[0],"displaycache")),a[e].cpar.css({display:"none"}),a[e].sliderIsHidden=!0)):(!0===a[e].sliderIsHidden||a[e].sliderIsHidden===i&&a[e].c.is(":hidden"))&&t&&(a[e].cpar[0].style.display=a.gA(a[e].cpar[0],"displaycache")!=i&&"none"!=a.gA(a[e].cpar[0],"displaycache")?a.gA(a[e].cpar[0],"displaycache"):"block",a[e].sliderIsHidden=!1,a[e].c.trigger("restarttimer"),window.requestAnimationFrame(function(){m(e,!0)})),a.hideUnHideNav&&a[e].navigation.use&&a.hideUnHideNav(e)},m=function(e,t,r){if(a[e].c===i)return!1;if(a[e].dimensionReCheck={},a[e].c.trigger("revolution.slide.beforeredraw"),1==a[e].infullscreenmode&&(a[e].minHeight=a.getWinH(e)),a.ISM&&(a[e].lastMobileHeight=a.getWinH(e)),r&&a.updateDims(e),!a.resizeThumbsTabs||!0===a.resizeThumbsTabs(e)){if(window.requestAnimationFrame(function(){h(e,!0!==t),O(e)}),a[e].started){if("carousel"==a[e].sliderType)for(var o in a.prepareCarousel(e),a[e].sbgs)a[e].sbgs.hasOwnProperty(o)&&a[e].sbgs[o].mDIM!==i&&a.updateSlideBGs(e,a[e].sbgs[o].key,a[e].sbgs[o]);else a.updateSlideBGs(e);if("carousel"===a[e].sliderType&&a[e].carCheckconW!=a[e].canv.width){for(var s in clearTimeout(a[e].pcartimer),a[e].sbgs)a[e].sbgs[s].loadobj!==i&&a.updateSlideBGs(e,a[e].sbgs[s].key,a[e].sbgs[s]);a[e].pcartimer=setTimeout(function(){a.prepareCarousel(e),a.animateTheLayers({slide:"individual",id:e,mode:"rebuild",caller:"containerResized_1"}),a[e].carCheckconW=a[e].canv.width},100),a[e].lastconw=a[e].canv.width}if(a[e].pr_processing_key!==i?a.animateTheLayers({slide:a[e].pr_processing_key,id:e,mode:"rebuild",caller:"containerResized_2"}):a[e].pr_active_key!==i&&a.animateTheLayers({slide:a[e].pr_active_key,id:e,mode:"rebuild",caller:"containerResized_3"}),"carousel"===a[e].sliderType){for(var s in a[e].panzoomTLs)if(a[e].panzoomTLs.hasOwnProperty(s)){var n=a.gA(a[e].panzoomBGs[s][0],"key");a.startPanZoom(a[e].panzoomBGs[s],e,a[e].panzoomTLs[s].progress(),s,a[e].panzoomTLs[s].isActive()?"play":"reset",n)}}else a[e].pr_active_bg!==i&&a[e].pr_active_bg[0]!==i&&v(e,a[e].pr_active_bg,a[e].pr_active_bg[0].dataset.key),a[e].pr_next_bg!==i&&a[e].pr_next_bg[0]!==i&&v(e,a[e].pr_next_bg,a[e].pr_next_bg[0].dataset.key);clearTimeout(a[e].mNavigTimeout),a.manageNavigation&&(a[e].mNavigTimeout=setTimeout(function(){a.manageNavigation(e)},20))}a.prepareCoveredVideo(e)}a[e].c.trigger("revolution.slide.afterdraw",[{id:e}])},v=function(e,t,r){if(a[e].panzoomTLs!==i){var o=a.getSlideIndex(e,r);a.startPanZoom(t,e,a[e].panzoomTLs[o]!==i?a[e].panzoomTLs[o].progress():0,o,"play",r)}},f=function(t){!0!==a[t].noDetach&&a[t].canvas.detach();var r=a.isFaceBook()?"visible":"hidden";if(a[t].autoHeight&&tpGS.gsap.set([a[t].c,a[t].cpar],{maxHeight:"none"}),tpGS.gsap.set(a[t].canvas,a[t].modal!==i&&a[t].modal.useAsModal?{overflow:r,width:"100%",height:"100%"}:{overflow:r,width:"100%",height:"100%",maxHeight:a[t].autoHeight?"none":a[t].cpar.css("maxHeight")}),"carousel"===a[t].sliderType){var o="margin-top:"+parseInt(a[t].carousel.padding_top||0,0)+"px;";a[t].canvas.css({overflow:"visible"}).wrap('<rs-carousel-wrap style="'+o+'"></rs-carousel-wrap>'),a[t].cpar.prepend("<rs-carousel-space></rs-carousel-space>").append("<rs-carousel-space></rs-carousel-space>"),a.defineCarouselElements(t)}a[t].startWithSlide=a[t].startWithSlide===i?i:Math.max(1,(a[t].sliderType,parseInt(a[t].startWithSlide))),a[t].cpar.css({overflow:"visible"}),a[t].scrolleffect.bgs=[];for(var s=0;s<a[t].slides.length;s++){var n=e(a[t].slides[s]),d=a.gA(n[0],"key"),l=n.find(".rev-slidebg")||n.find(">img"),c=a[t].sbgs[d]=y(l.data(),t),p=n.data("mediafilter");if(c.skeyindex=a.getSlideIndex(t,d),c.bgvid=n.find("rs-bgvideo"),l.detach(),c.bgvid.detach(),(a[t].startWithSlide!=i&&a.gA(a[t].slides[s],"originalindex")==a[t].startWithSlide||a[t].startWithSlide===i&&0==s)&&(a[t].pr_next_key=n.index()),tpGS.gsap.set(n,{width:"100%",height:"100%",overflow:r}),l.wrap('<rs-sbg-px><rs-sbg-wrap data-key="'+d+'"></rs-sbg-wrap></rs-sbg-px>'),c.wrap=e(a.closestNode(l[0],"RS-SBG-WRAP")),c.src=l[0].src,c.lazyload=c.lazyload=g(l[0],i,t),c.slidebgimage=!0,c.loadobj=c.loadobj===i?{}:c.loadobj,c.mediafilter=p="none"===p||p===i?"":p,c.sbg=document.createElement("rs-sbg"),a[t].overlay!==i&&"none"!=a[t].overlay.type&&a[t].overlay.type!=i){var u=a.createOverlay(t,a[t].overlay.type,a[t].overlay.size,{0:a[t].overlay.colora,1:a[t].overlay.colorb});c.wrap.append('<rs-dotted style="background-image:'+u+'"></rs-dotted>')}l.data("mediafilter",p),c.canvas=document.createElement("canvas"),c.sbg.appendChild(c.canvas),c.canvas.style.width="100%",c.canvas.style.height="100%",c.ctx=c.canvas.getContext("2d"),c.lazyload!==i&&(c.sbg.dataset.lazyload=c.lazyload),c.sbg.className=p,c.sbg.src=c.src,c.sbg.dataset.bgcolor=c.bgcolor,c.sbg.style.width="100%",c.sbg.style.height="100%",c.key=d,c.wrap[0].dataset.key=d,e(c.sbg).data(c),c.wrap.data(c),c.wrap[0].appendChild(c.sbg);var h=document.createComment("Runtime Modification - Img tag is Still Available for SEO Goals in Source - "+l.get(0).outerHTML);l.replaceWith(h),a.gA(n[0],"sba")===i&&a.sA(n[0],"sba","");var m={},v=a.gA(n[0],"sba").split(";");for(var f in v)if(v.hasOwnProperty(f)){var w=v[f].split(":");switch(w[0]){case"f":m.f=w[1];break;case"b":m.b=w[1];break;case"g":m.g=w[1];break;case"t":m.s=w[1]}}a.sA(n[0],"scroll-based",!!a[t].sbtimeline.set&&(m.s!==i&&m.s)),c.bgvid.length>0&&(c.bgvidid=c.bgvid[0].id,c.animateDirection="idle",c.bgvid.addClass("defaultvid").css({zIndex:30}),p!==i&&""!==p&&"none"!==p&&c.bgvid.addClass(p),c.bgvid.appendTo(c.wrap),c.parallax!=i&&(c.bgvid.data("parallax",c.parallax),c.bgvid.data("showcoveronpause","on"),c.bgvid.data("mediafilter",p)),c.poster=!1,(c.src!==i&&-1==c.src.indexOf("assets/dummy.png")&&-1==c.src.indexOf("assets/transparent.png")||c.lazyload!==i&&-1==c.lazyload.indexOf("assets/transparent.png")&&-1==c.lazyload.indexOf("assets/dummy.png"))&&(c.poster=!0),c.bgvid.data("bgvideo",1),c.bgvid[0].dataset.key=d,0==c.bgvid.find(".rs-fullvideo-cover").length&&c.bgvid.append('<div class="rs-fullvideo-cover"></div>')),a[t].scrolleffect.set?(a[t].scrolleffect.bgs.push({fade:m.f!==i?m.f:!!a[t].scrolleffect.slide&&a[t].scrolleffect.fade,blur:m.b!==i?m.b:!!a[t].scrolleffect.slide&&a[t].scrolleffect.blur,grayscale:m.g!==i?m.g:!!a[t].scrolleffect.slide&&a[t].scrolleffect.grayscale,c:c.wrap.wrap("<rs-sbg-effectwrap></rs-sbg-effectwrap>").parent()}),n.prepend(c.wrap.parent().parent())):n.prepend(c.wrap.parent())}"carousel"===a[t].sliderType?(tpGS.gsap.set(a[t].carousel.wrap,{opacity:0}),a[t].c[0].appendChild(a[t].carousel.wrap[0])):a[t].c[0].appendChild(a[t].canvas[0])},y=function(t,r){t.bg=t.bg===i?"":t.bg;var o=t.bg.split(";"),s={bgposition:"50% 50%",bgfit:"cover",bgrepeat:"no-repeat",bgcolor:"transparent"};for(var n in o)if(o.hasOwnProperty(n)){var d=o[n].split(":"),l=d[0],c=d[1],p="";switch(l){case"p":p="bgposition";break;case"f":p="bgfit";break;case"r":p="bgrepeat";break;case"c":p="bgcolor"}p!==i&&(s[p]=c)}return a[r].fallbacks.panZoomDisableOnMobile&&a.ISM&&(s.panzoom=i,s.bgfit="cover",t.panzoom=i),e.extend(!0,t,s)},w=function(e,t,r){if(a[t]!==i){a[t].syncload--;var o=a.gA(e,"reference");for(var s in a[t].loadqueue)a[t].loadqueue.hasOwnProperty(s)&&"loaded"!==a[t].loadqueue[s].progress&&o==a[t].loadqueue[s].src&&(a[t].loadqueue[s].img=e,a[t].loadqueue[s].progress=r,a[t].loadqueue[s].width=e.naturalWidth,a[t].loadqueue[s].height=e.naturalHeight);b(t)}},b=function(t){4!=a[t].syncload&&a[t].loadqueue&&e.each(a[t].loadqueue,function(r,o){if("prepared"==o.progress&&a[t].syncload<=4){if(a[t].syncload++,"img"==o.type){var s="IMG"==o.img.tagName?o.img:new Image;a.sA(s,"reference",o.src),/^([\w]+\:)?\/\//.test(o.src)&&-1===o.src.indexOf(location.host)&&""!==a[t].imgCrossOrigin&&a[t].imgCrossOrigin!==i&&(s.crossOrigin=a[t].imgCrossOrigin),s.onload=function(){w(this,t,"loaded"),o.error=!1},s.onerror=function(){w(this,t,"failed"),o.error=!0},s.src=o.src,o.starttoload=Date.now()}else e.get(o.src,function(e){o.innerHTML=(new XMLSerializer).serializeToString(e.documentElement),o.progress="loaded",a[t].syncload--,b(t)}).fail(function(){o.progress="failed",a[t].syncload--,b(t)});o.progress="inload"}})},_=function(e,i){return console.log("Static Image "+e+"  Could not be loaded in time. Error Exists:"+i),!0},S=function(e,i){if(Date.now()-a[i][e+"starttime"]>5e3&&1!=a[i][e+"warning"]){a[i][e+"warning"]=!0;var t=e+" Api Could not be loaded !";"https:"===location.protocol&&(t+=" Please Check and Renew SSL Certificate !"),console.error(t),a[i].c.append('<div style="position:absolute;top:50%;width:100%;color:#e74c3c;  font-size:16px; text-align:center; padding:15px;background:#000; display:block;"><strong>'+t+"</strong></div>")}return!0},x=function(t){a[t]!==i&&(a[t].pr_active_slide=e(a[t].slides[a[t].pr_active_key]),a[t].pr_next_slide=e(a[t].slides[a[t].pr_processing_key]),a[t].pr_active_bg=a[t].pr_active_slide.find("rs-sbg-wrap"),a[t].pr_next_bg=a[t].pr_next_slide.find("rs-sbg-wrap"),a[t].pr_active_bg!==i&&a[t].pr_active_bg.length>0&&tpGS.gsap.to(a[t].pr_active_bg,.5,{opacity:0}),a[t].pr_next_bg!==i&&a[t].pr_next_bg.length>0&&tpGS.gsap.to(a[t].pr_next_bg,.5,{opacity:0}),tpGS.gsap.set(a[t].pr_active_slide,{zIndex:18}),a[t].pr_next_slide!==i&&a[t].pr_next_slide.length>0&&tpGS.gsap.set(a[t].pr_next_slide,{autoAlpha:0,zIndex:20}),a[t].tonpause=!1,a[t].pr_active_key!==i&&a.removeTheLayers(a[t].pr_active_slide,t,!0),a[t].firststart=1,setTimeout(function(){delete a[t].pr_active_key,delete a[t].pr_processing_key},200))},k=function(t,r){if(a[t]!==i)if(clearTimeout(a[t].waitWithSwapSlide),a[t].pr_processing_key===i||!0!==a[t].firstSlideShown){if(clearTimeout(a[t].waitWithSwapSlide),a[t].startWithSlideKey!==i&&(a[t].pr_next_key=a.getComingSlide(t,a[t].startWithSlideKey).nindex,delete a[t].startWithSlideKey),a[t].pr_active_slide=e(a[t].slides[a[t].pr_active_key]),a[t].pr_next_slide=e(a[t].slides[a[t].pr_next_key]),a[t].pr_next_key==a[t].pr_active_key)return delete a[t].pr_next_key;var o=a.gA(a[t].pr_next_slide[0],"key");a[t].sbgs[o].bgvid&&a[t].sbgs[o].bgvid.length>0&&(a[t].videos==i||a[t].videos[a[t].sbgs[o].bgvid[0].id]===i)&&a.manageVideoLayer(a[t].sbgs[o].bgvid,t,o),a[t].pr_processing_key=a[t].pr_next_key,a[t].pr_cache_pr_next_key=a[t].pr_next_key,delete a[t].pr_next_key,a[t].pr_next_slide!==i&&a[t].pr_next_slide[0]!==i&&a.gA(a[t].pr_next_slide[0],"hal")!==i&&a.sA(a[t].pr_next_slide[0],"sofacounter",a.gA(a[t].pr_next_slide[0],"sofacounter")===i?1:parseInt(a.gA(a[t].pr_next_slide[0],"sofacounter"),0)+1),a[t].stopLoop&&a[t].pr_processing_key==a[t].lastslidetoshow-1&&(a[t].progressC.css({visibility:"hidden"}),a[t].c.trigger("revolution.slide.onstop"),a[t].noloopanymore=1),a[t].pr_next_slide.index()===a[t].slideamount-1&&a[t].looptogo>0&&"disabled"!==a[t].looptogo&&(a[t].looptogo--,a[t].looptogo<=0&&(a[t].stopLoop=!0)),a[t].tonpause=!0,a[t].slideInSwapTimer=!0,a[t].c.trigger("stoptimer"),"off"===a[t].spinner?a[t].loader!==i&&!0===a[t].loaderVisible&&(a[t].loader.css({display:"none"}),a[t].loaderVisible=!1):a[t].loadertimer=setTimeout(function(){a[t].loader!==i&&!0!==a[t].loaderVisible&&(a[t].loader.css({display:"block"}),a[t].loaderVisible=!0)},100);var s="carousel"===a[t].sliderType&&"all"!==a[t].lazyType?a.loadVisibleCarouselItems(t):a[t].pr_next_slide[0];a.loadImages(s,t,1),a.preLoadAudio&&a.preLoadAudio(a[t].pr_next_slide,t,1),a.waitForCurrentImages(s,t,function(){a[t].firstSlideShown=!0,a[t].pr_next_slide.find("rs-bgvideo").each(function(){a.prepareCoveredVideo(t)}),a.loadUpcomingContent(t),window.requestAnimationFrame(function(){L(a[t].pr_next_slide.find("rs-sbg"),t,r)})})}else a[t].waitWithSwapSlide=setTimeout(function(){k(t,r)},18)},L=function(t,r,o){if(a[r]!==i){O(r),a[r].pr_active_slide=e(a[r].slides[a[r].pr_active_key]),a[r].pr_next_slide=e(a[r].slides[a[r].pr_processing_key]),a[r].pr_active_bg=a[r].pr_active_slide.find("rs-sbg-wrap"),a[r].pr_next_bg=a[r].pr_next_slide.find("rs-sbg-wrap"),a[r].tonpause=!1,clearTimeout(a[r].loadertimer),a[r].loader!==i&&!0===a[r].loaderVisible&&(window.requestAnimationFrame(function(){a[r].loader.css({display:"none"})}),a[r].loaderVisible=!1),a[r].onBeforeSwap={slider:r,slideIndex:parseInt(a[r].pr_active_key,0)+1,slideLIIndex:a[r].pr_active_key,nextSlideIndex:parseInt(a[r].pr_processing_key,0)+1,nextSlideLIIndex:a[r].pr_processing_key,nextslide:a[r].pr_next_slide,slide:a[r].pr_active_slide,currentslide:a[r].pr_active_slide,prevslide:a[r].pr_lastshown_key!==i?a[r].slides[a[r].pr_lastshown_key]:""},a[r].c.trigger("revolution.slide.onbeforeswap",a[r].onBeforeSwap);var s=a.gA(a[r].pr_active_slide[0],"key"),n=a[r].sbgs[s];if(n&&n.panzoom&&n.pzAnim&&(n.pzLastFrame=!0,a.pzDrawShadow(r,n,n.pzAnim.start)),a[r].transition=1,a[r].stopByVideo=!1,a[r].pr_next_slide[0]!==i&&a.gA(a[r].pr_next_slide[0],"duration")!=i&&""!=a.gA(a[r].pr_next_slide[0],"duration")?a[r].duration=parseInt(a.gA(a[r].pr_next_slide[0],"duration"),0):a[r].duration=a[r].origcd,a[r].pr_next_slide[0]===i||"true"!=a.gA(a[r].pr_next_slide[0],"ssop")&&!0!==a.gA(a[r].pr_next_slide[0],"ssop")?a[r].ssop=!1:a[r].ssop=!0,a[r].sbtimeline.set&&a[r].sbtimeline.fixed&&a.updateFixedScrollTimes(r),a[r].c.trigger("nulltimer"),a[r].sdir=a[r].pr_processing_key<a[r].pr_active_key?1:0,"arrow"==a[r].sc_indicator&&(0==a[r].pr_active_key&&a[r].pr_processing_key==a[r].slideamount-1&&(a[r].sdir=1),a[r].pr_active_key==a[r].slideamount-1&&0==a[r].pr_processing_key&&(a[r].sdir=0)),a[r].lsdir=a[r].sdir,a[r].pr_active_key!=a[r].pr_processing_key&&1!=a[r].firststart&&"carousel"!==a[r].sliderType&&a.removeTheLayers&&a.removeTheLayers(a[r].pr_active_slide,r),1!==a.gA(a[r].pr_next_slide[0],"rspausetimeronce")&&1!==a.gA(a[r].pr_next_slide[0],"rspausetimeralways")?a[r].c.trigger("restarttimer"):(a[r].stopByVideo=!0,a.unToggleState(a[r].slidertoggledby)),a.sA(a[r].pr_next_slide[0],"rspausetimeronce",0),a[r].pr_next_slide[0]!==i&&a.sA(a[r].c[0],"slideactive",a.gA(a[r].pr_next_slide[0],"key")),"carousel"==a[r].sliderType){if(a[r].mtl=tpGS.gsap.timeline(),a.prepareCarousel(r),R(r),a.updateSlideBGs(r),!0!==a[r].carousel.checkFVideo){var d=a.gA(a[r].pr_next_slide[0],"key");a[r].sbgs[d]!==i&&a[r].sbgs[d].bgvid!==i&&0!==a[r].sbgs[d].bgvid.length&&a.playBGVideo(r,d),a[r].carousel.checkFVideo=!0}a[r].transition=0}else{a[r].pr_lastshown_key=a[r].pr_lastshown_key===i?a[r].pr_next_key!==i?a[r].pr_next_key:a[r].pr_processing_key!==i?a[r].pr_processing_key:a[r].pr_active_key!==i?a[r].pr_active_key:a[r].pr_lastshown_key:a[r].pr_lastshown_key,a[r].mtl=tpGS.gsap.timeline({paused:!0,onComplete:function(){R(r)}}),a[r].pr_next_key!==i?a.animateTheLayers({slide:a[r].pr_next_key,id:r,mode:"preset",caller:"swapSlideProgress_1"}):a[r].pr_processing_key!==i?a.animateTheLayers({slide:a[r].pr_processing_key,id:r,mode:"preset",caller:"swapSlideProgress_2"}):a[r].pr_active_key!==i&&a.animateTheLayers({slide:a[r].pr_active_key,id:r,mode:"preset",caller:"swapSlideProgress_3"}),1==a[r].firststart&&(a[r].pr_active_slide[0]!==i&&tpGS.gsap.set(a[r].pr_active_slide,{autoAlpha:0}),a[r].firststart=0),a[r].pr_active_slide[0]!==i&&tpGS.gsap.set(a[r].pr_active_slide,{zIndex:18}),a[r].pr_next_slide[0]!==i&&tpGS.gsap.set(a[r].pr_next_slide,{autoAlpha:0,zIndex:20});d=a.gA(a[r].pr_next_slide[0],"key");a[r].sbgs[d].alt===i&&(a[r].sbgs[d].alt=a.gA(a[r].pr_next_slide[0],"alttrans")||!1,a[r].sbgs[d].alt=!1!==a[r].sbgs[d].alt&&a[r].sbgs[d].alt.split(","),a[r].sbgs[d].altIndex=0,a[r].sbgs[d].altLen=!1!==a[r].sbgs[d].alt?a[r].sbgs[d].alt.length:0);a[r].firstSlideAnimDone===i&&a[r].fanim!==i&&!1!==a[r].fanim||(a[r].sbgs[d].slideanimation===i||a[r].sbgs[d].slideanimationRebuild||(a[r].sbgs[d].random!==i&&a.SLTR!==i||a[r].sbgs[d].altLen>0&&a.SLTR));a[r].sbgs[d].slideanimation=a[r].firstSlideAnimDone===i&&a[r].fanim!==i&&!1!==a[r].fanim?a.convertSlideAnimVals(e.extend(!0,{},a.getSlideAnim_EmptyObject(),a[r].fanim)):a[r].sbgs[d].slideanimation===i||a[r].sbgs[d].slideanimationRebuild||a[r].sbgs[d].altLen>0&&"default_first_anim"==a[r].sbgs[d].alt[a[r].sbgs[d].altIndex]?a.getSlideAnimationObj(r,{anim:a.gA(a[r].pr_next_slide[0],"anim"),filter:a.gA(a[r].pr_next_slide[0],"filter"),in:a.gA(a[r].pr_next_slide[0],"in"),out:a.gA(a[r].pr_next_slide[0],"out"),d3:a.gA(a[r].pr_next_slide[0],"d3")},d):a[r].sbgs[d].random!==i&&a.SLTR!==i?a.convertSlideAnimVals(e.extend(!0,{},a.getSlideAnim_EmptyObject(),a.getAnimObjectByKey(a.getRandomSlideTrans(a[r].sbgs[d].random.rndmain,a[r].sbgs[d].random.rndgrp,a.SLTR),a.SLTR))):a[r].sbgs[d].altLen>0&&a.SLTR!==i?a.convertSlideAnimVals(e.extend(!0,{altAnim:a[r].sbgs[d].alt[a[r].sbgs[d].altIndex]},a.getSlideAnim_EmptyObject(),a.getAnimObjectByKey(a[r].sbgs[d].alt[a[r].sbgs[d].altIndex],a.SLTR))):a[r].sbgs[d].slideanimation,a[r].sbgs[d].altLen>0&&(a[r].sbgs[d].firstSlideAnimDone!==i?(a[r].sbgs[d].altIndex++,a[r].sbgs[d].altIndex=a[r].sbgs[d].altIndex>=a[r].sbgs[d].altLen?0:a[r].sbgs[d].altIndex):(a[r].sbgs[d].firstSlideAnimDone=!0,a.SLTR===i&&a.SLTR_loading===i&&a.loadSlideAnimLibrary(r),a[r].sbgs[d].alt.push("default_first_anim"),a[r].sbgs[d].altLen++)),a[r].sbgs[d].currentState="animating",a.animateSlide(r,a[r].sbgs[d].slideanimation),a[r].firstSlideAnimDone===i&&a[r].fanim!==i&&!1!==a[r].fanim&&(a[r].sbgs[d].slideanimationRebuild=!0),a[r].firstSlideAnimDone=!0,a[r].pr_next_bg.data("panzoom")!==i&&requestAnimationFrame(function(){var e=a.gA(a[r].pr_next_slide[0],"key");a.startPanZoom(a[r].pr_next_bg,r,0,a.getSlideIndex(r,e),"first",e)}),a[r].mtl.pause()}if(a.animateTheLayers?"carousel"===a[r].sliderType?(!1!==a[r].carousel.showLayersAllTime&&(a[r].carousel.allLayersStarted?a.animateTheLayers({slide:"individual",id:r,mode:"rebuild",caller:"swapSlideProgress_5"}):a.animateTheLayers({slide:"individual",id:r,mode:"start",caller:"swapSlideProgress_4"}),a[r].carousel.allLayersStarted=!0),0!==a[r].firststart?a.animateTheLayers({slide:0,id:r,mode:"start",caller:"swapSlideProgress_6"}):!0!==o&&a.animateTheLayers({slide:a[r].pr_next_key!==i?a[r].pr_next_key:a[r].pr_processing_key!==i?a[r].pr_processing_key:a[r].pr_active_key,id:r,mode:"start",caller:"swapSlideProgress_7"}),a[r].firststart=0):a.animateTheLayers({slide:a[r].pr_next_key!==i?a[r].pr_next_key:a[r].pr_processing_key!==i?a[r].pr_processing_key:a[r].pr_active_key,id:r,mode:"start",caller:"swapSlideProgress_8"}):a[r].mtl!=i&&setTimeout(function(){a[r].mtl.resume()},18),"carousel"!==a[r].sliderType)if(a[r].scwDur=.001,Array.isArray(a[r].scwCallback)&&a[r].scwCallback.length>0){a[r].scwDone=!1,a[r].scwCount=a[r].scwCallback.length;for(var l=0;l<a[r].scwCallback.length;l++)a[r].scwCallback[l]();a[r].scwTimeout=tpGS.gsap.delayedCall(2,function(){a[r].scwCount>0&&(a[r].scwTween&&"function"==typeof a[r].scwTween.kill&&(a[r].scwTween.kill(),a[r].scwTween=null),a[r].scwTween=tpGS.gsap.to(a[r].pr_next_slide,{duration:a[r].scwDur,autoAlpha:1}))})}else tpGS.gsap.to(a[r].pr_next_slide,{duration:a[r].scwDur,autoAlpha:1})}},R=function(t){if(a[t]!==i){if("done"!==a.RS_swapList[t]){a.RS_swapList[t]="done";var r=e.inArray(t,a.RS_swapping);a.RS_swapping.splice(r,1)}if(a[t].firstSlideAvailable===i&&(a[t].firstSlideAvailable=!0,window.requestAnimationFrame(function(){"hero"!==a[t].sliderType&&a.createNavigation&&a[t].navigation.use&&!0!==a[t].navigation.createNavigationDone&&a.createNavigation(t)})),"carousel"===a[t].sliderType&&tpGS.gsap.to(a[t].carousel.wrap,1,{opacity:1}),a[t].pr_active_key=a[t].pr_processing_key!==i?a[t].pr_processing_key:a[t].pr_active_key,delete a[t].pr_processing_key,"scroll"!=a[t].parallax.type&&"scroll+mouse"!=a[t].parallax.type&&"mouse+scroll"!=a[t].parallax.type||(a[t].lastscrolltop=-999,a.generalObserver(a.ISM)),a[t].mtldiff=a[t].mtl.time(),delete a[t].mtl,a[t].pr_active_key!==i){a.gA(a[t].slides[a[t].pr_active_key],"sloop")!==i&&function(e){if(a[e]!==i){a[e].sloops=a[e].sloops===i?{}:a[e].sloops;var t=a.gA(a[e].slides[a[e].pr_active_key],"key"),r=a[e].sloops[t];if(r===i){r={s:2500,e:4500,r:"unlimited"};var o=a.gA(a[e].slides[a[e].pr_active_key],"sloop").split(";");for(var s in o)if(o.hasOwnProperty(s)){var n=o[s].split(":");switch(n[0]){case"s":r.s=parseInt(n[1],0)/1e3;break;case"e":r.e=parseInt(n[1],0)/1e3;break;case"r":r.r=n[1]}}r.r="unlimited"===r.r?-1:parseInt(r.r,0),a[e].sloops[t]=r,r.key=t}r.ct={time:r.s},r.tl=tpGS.gsap.timeline({}),r.timer=tpGS.gsap.fromTo(r.ct,r.e-r.s,{time:r.s},{time:r.e,ease:"none",onRepeat:function(){for(var t in a[e].layers[r.key])a[e].layers[r.key].hasOwnProperty(t)&&a[e]._L[t].timeline.play(r.s);var o=a[e].progressC;o!==i&&o[0]!==i&&o[0].tween!==i&&o[0].tween.time(r.s)},onUpdate:function(){},onComplete:function(){}}).repeat(r.r),r.tl.add(r.timer,r.s),r.tl.time(a[e].mtldiff)}}(t),a.sA(a[t].slides[a[t].activeRSSlide],"isactiveslide",!1),a[t].activeRSSlide=a[t].pr_active_key,a.sA(a[t].slides[a[t].activeRSSlide],"isactiveslide",!0);var o=a.gA(a[t].slides[a[t].pr_active_key],"key"),s=a.gA(a[t].slides[a[t].pr_lastshown_key],"key");a.sA(a[t].c[0],"slideactive",o),s!==i&&a[t].panzoomTLs!==i&&a[t].panzoomTLs[a.getSlideIndex(t,s)]!==i&&("carousel"===a[t].sliderType?(a[t].panzoomTLs[a.getSlideIndex(t,s)].timeScale(3),a[t].panzoomTLs[a.getSlideIndex(t,s)].reverse()):a[t].panzoomTLs[a.getSlideIndex(t,s)].pause()),a[t].pr_next_bg.data("panzoom")!==i&&(a[t].panzoomTLs!==i&&a[t].panzoomTLs[a.getSlideIndex(t,o)]!==i?(a[t].panzoomTLs[a.getSlideIndex(t,o)].timeScale(1),a[t].panzoomTLs[a.getSlideIndex(t,o)].play()):a.startPanZoom(a[t].pr_next_bg,t,0,a.getSlideIndex(t,o),"play",o));var n={slider:t,slideIndex:parseInt(a[t].pr_active_key,0)+1,slideLIIndex:a[t].pr_active_key,slide:a[t].pr_next_slide,currentslide:a[t].pr_next_slide,prevSlideIndex:a[t].pr_lastshown_key!==i&&parseInt(a[t].pr_lastshown_key,0)+1,prevSlideLIIndex:a[t].pr_lastshown_key!==i&&parseInt(a[t].pr_lastshown_key,0),prevSlide:a[t].pr_lastshown_key!==i&&a[t].slides[a[t].pr_lastshown_key]};if(a[t].c.trigger("revolution.slide.onchange",n),a[t].c.trigger("revolution.slide.onafterswap",n),a[t].deepLinkListener||a[t].enableDeeplinkHash){var d=a.gA(a[t].slides[a[t].pr_active_key],"deeplink");d!==i&&d.length>0&&(a[t].ignoreDeeplinkChange=!0,window.location.hash=a.gA(a[t].slides[a[t].pr_active_key],"deeplink"))}a[t].pr_lastshown_key=a[t].pr_active_key,a[t].startWithSlide!==i&&"done"!==a[t].startWithSlide&&"carousel"===a[t].sliderType&&(a[t].firststart=0),a[t].duringslidechange=!1,a[t].pr_active_slide.length>0&&0!=a.gA(a[t].pr_active_slide[0],"hal")&&a.gA(a[t].pr_active_slide[0],"hal")<=a.gA(a[t].pr_active_slide[0],"sofacounter")&&a[t].c.revremoveslide(a[t].pr_active_slide.index());var l=a[t].pr_processing_key||a[t].pr_active_key||0;a[t].rowzones!=i&&(l=l>a[t].rowzones.length?a[t].rowzones.length:l),(a[t].rowzones!=i&&a[t].rowzones.length>0&&a[t].rowzones[l]!=i&&l>=0&&l<=a[t].rowzones.length&&a[t].rowzones[l].length>0||a.winH<a[t].module.height)&&a.updateDims(t),delete a[t].sc_indicator,delete a[t].sc_indicator_dir,a[t].firstLetItFree===i&&(a.generalObserver(a.ISM),a[t].firstLetItFree=!0),a[t].skipAttachDetach=!1}}},O=function(t){var r=a[t].progressBar;if(a[t].progressC===i||0==a[t].progressC.length)if(a[t].progressC=e('<rs-progress style="visibility:hidden;"></rs-progress>'),"horizontal"===r.style||"vertical"===r.style){if("module"===r.basedon){for(var o="",s=0;s<a[t].slideamount;s++)o+="<rs-progress-bar></rs-progress-bar>";o+="<rs-progress-bgs>";for(s=0;s<a[t].slideamount;s++)o+="<rs-progress-bg></rs-progress-bg>";if(o+="</rs-progress-bgs>","nogap"!==r.gaptype)for(s=0;s<a[t].slideamount;s++)o+="<rs-progress-gap></rs-progress-gap>";a[t].progressC[0].innerHTML=o,!0===a[t].noDetach&&a[t].c.append(a[t].progressC),a[t].progressCBarBGS=a.getByTag(a[t].progressC[0],"RS-PROGRESS-BG"),a[t].progressCBarGAPS=a.getByTag(a[t].progressC[0],"RS-PROGRESS-GAP"),"nogap"!==r.gaptype&&tpGS.gsap.set(a[t].progressCBarGAPS,{backgroundColor:r.gapcolor,zIndex:"gapbg"===r.gaptype?17:27}),tpGS.gsap.set(a[t].progressCBarBGS,{backgroundColor:r.bgcolor})}else a[t].progressC[0].innerHTML="<rs-progress-bar></rs-progress-bar>",!0===a[t].noDetach&&a[t].c.append(a[t].progressC);a[t].progressCBarInner=a.getByTag(a[t].progressC[0],"RS-PROGRESS-BAR"),tpGS.gsap.set(a[t].progressCBarInner,{background:r.color})}else a[t].progressC[0].innerHTML='<canvas width="'+2*r.radius+'" height="'+2*r.radius+'" style="position:absolute" class="rs-progress-bar"></canvas>',!0===a[t].noDetach&&a[t].c.append(a[t].progressC),a[t].progressCBarInner=a[t].progressC[0].getElementsByClassName("rs-progress-bar")[0],a[t].progressBCanvas=a[t].progressCBarInner.getContext("2d"),a[t].progressBar.degree="cw"===a[t].progressBar.style?360:0,I(t);if(!0!==a[t].noDetach&&a[t].progressC.detach(),a[t].progressBar.visibility[a[t].level]&&1!=a[t].progressBar.disableProgressBar)if("horizontal"===r.style||"vertical"===r.style){var n,d,l=a[t].slideamount-1;if("horizontal"===r.style){var c="grid"===r.alignby?a[t].gridwidth[a[t].level]:a[t].module.width;n=Math.ceil(c/a[t].slideamount),d=Math.ceil((c-l*r.gapsize)/a[t].slideamount),tpGS.gsap.set(a[t].progressC,{visibility:"visible",top:"top"===r.vertical?r.y+("grid"===r.alignby&&a[t].gridOffsetHeight!==i?Math.max(0,a[t].gridOffsetHeight):0):"center"===r.vertical?"50%":"auto",bottom:"top"===r.vertical||"center"===r.vertical?"auto":r.y+("grid"===r.alignby&&a[t].gridOffsetHeight!==i?Math.max(0,a[t].gridOffsetHeight):0),left:"left"===r.horizontal&&"grid"===r.alignby&&a[t].gridOffsetWidth!==i?Math.max(0,a[t].gridOffsetWidth):"auto",right:"right"===r.horizontal&&"grid"===r.alignby&&a[t].gridOffsetWidth!==i?Math.max(0,a[t].gridOffsetWidth):"auto",y:"center"===r.vertical?r.y:0,height:r.size,backgroundColor:"module"===r.basedon?"transparent":r.bgcolor,marginTop:"bottom"===r.vertical?0:"top"===r.vertical?0:parseInt(r.size,0)/2,width:"grid"===r.alignby?a[t].gridwidth[a[t].level]:"100%"}),tpGS.gsap.set(a[t].progressCBarInner,{x:"module"===r.basedon?r.gap?function(e){return("right"===r.horizontal?l-e:e)*(d+r.gapsize)}:function(e){return("right"===r.horizontal?l-e:e)*n}:0,width:"module"===r.basedon?r.gap?d+"px":100/a[t].slideamount+"%":"100%"}),"module"===r.basedon&&(tpGS.gsap.set(a[t].progressCBarBGS,{x:"module"===r.basedon?r.gap?function(e){return e*(d+r.gapsize)}:function(e){return e*n}:0,width:"module"===r.basedon?r.gap?d+"px":100/a[t].slideamount+"%":"100%"}),tpGS.gsap.set(a[t].progressCBarGAPS,{width:r.gap?r.gapsize+"px":0,x:r.gap?function(e){return(e+1)*d+parseInt(r.gapsize,0)*e}:0}))}else if("vertical"===r.style){c="grid"===r.alignby?a[t].gridheight[a[t].level]:a[t].module.height;n=Math.ceil(c/a[t].slideamount),d=Math.ceil((c-l*r.gapsize)/a[t].slideamount),tpGS.gsap.set(a[t].progressC,{visibility:"visible",left:"left"===r.horizontal?r.x+("grid"===r.alignby&&a[t].gridOffsetWidth!==i?Math.max(0,a[t].gridOffsetWidth):0):"center"===r.horizontal?"50%":"auto",right:"left"===r.horizontal||"center"===r.horizontal?"auto":r.x+("grid"===r.alignby&&a[t].gridOffsetWidth!==i?Math.max(0,a[t].gridOffsetWidth):0),x:"center"===r.horizontal?r.x:0,top:"top"===r.vertical&&"grid"===r.alignby&&a[t].gridOffsetHeight!==i?Math.max(a[t].gridOffsetHeight,0):"auto",bottom:"bottom"===r.vertical&&"grid"===r.alignby&&a[t].gridOffsetHeight!==i?Math.max(a[t].gridOffsetHeight,0):"auto",width:r.size,marginLeft:"left"===r.horizontal?0:"right"===r.horizontal?0:parseInt(r.size,0)/2,backgroundColor:"module"===r.basedon?"transparent":r.bgcolor,height:"grid"===r.alignby?a[t].gridheight[a[t].level]:"100%"}),tpGS.gsap.set(a[t].progressCBarInner,{y:"module"===r.basedon?r.gap?function(e){return("bottom"===r.vertical?l-e:e)*(d+r.gapsize)}:function(e){return("bottom"===r.vertical?l-e:e)*n}:0,height:"module"===r.basedon?r.gap?d+"px":100/a[t].slideamount+"%":"100%"}),"module"===r.basedon&&(tpGS.gsap.set(a[t].progressCBarBGS,{y:"module"===r.basedon?r.gap?function(e){return e*(d+r.gapsize)}:function(e){return e*n}:0,height:"module"===r.basedon?r.gap?d+"px":100/a[t].slideamount+"%":"100%"}),tpGS.gsap.set(a[t].progressCBarGAPS,{height:r.gap?r.gapsize+"px":0,y:r.gap?function(e){return(e+1)*d+parseInt(r.gapsize,0)*e}:0}))}}else tpGS.gsap.set(a[t].progressC,{top:"top"===r.vertical?r.y+("grid"===r.alignby&&a[t].gridOffsetHeight!==i?Math.max(0,a[t].gridOffsetHeight):0):"center"===r.vertical?"50%":"auto",bottom:"top"===r.vertical||"center"===r.vertical?"auto":r.y+("grid"===r.alignby&&a[t].gridOffsetHeight!==i?Math.max(0,a[t].gridOffsetHeight):0),left:"left"===r.horizontal?r.x+("grid"===r.alignby&&a[t].gridOffsetWidth!==i?Math.max(0,a[t].gridOffsetWidth):0):"center"===r.horizontal?"50%":"auto",right:"left"===r.horizontal||"center"===r.horizontal?"auto":r.x+("grid"===r.alignby&&a[t].gridOffsetWidth!==i?Math.max(0,a[t].gridOffsetWidth):0),y:"center"===r.vertical?r.y:0,x:"center"===r.horizontal?r.x:0,width:2*r.radius,height:2*r.radius,marginTop:"center"===r.vertical?0-r.radius:0,marginLeft:"center"===r.horizontal?0-r.radius:0,backgroundColor:"transparent",visibility:"visible"});else a[t].progressC[0].style.visibility="hidden";!0!==a[t].noDetach&&a[t].c.append(a[t].progressC),a[t].gridOffsetWidth===i&&"grid"===r.alignby?a[t].rebuildProgressBar=!0:a[t].rebuildProgressBar=!1},I=function(e){var i=a[e].progressBar;i.radius-parseInt(i.size,0)<=0&&(i.size=i.radius/4);var t=parseInt(i.radius),r=parseInt(i.radius);a[e].progressBCanvas.lineCap="round",a[e].progressBCanvas.clearRect(0,0,2*i.radius,2*i.radius),a[e].progressBCanvas.beginPath(),a[e].progressBCanvas.arc(t,r,i.radius-parseInt(i.size,0),Math.PI/180*270,Math.PI/180*630),a[e].progressBCanvas.strokeStyle=i.bgcolor,a[e].progressBCanvas.lineWidth=parseInt(i.size,0)-1,a[e].progressBCanvas.stroke(),a[e].progressBCanvas.beginPath(),a[e].progressBCanvas.strokeStyle=i.color,a[e].progressBCanvas.lineWidth=parseInt(i.size,0),a[e].progressBCanvas.arc(t,r,i.radius-parseInt(i.size,0),Math.PI/180*270,Math.PI/180*(270+a[e].progressBar.degree),"cw"!==i.style),a[e].progressBCanvas.stroke()},M=function(t){var r=function(){t!==i&&a!==i&&a[t]!==i&&(0==e("body").find(a[t].c).length||null===a[t]||null===a[t].c||a[t].c===i||0===a[t].length?(!function(i){a[i].c.children().each(function(){try{e(this).die("click")}catch(e){}try{e(this).die("mouseenter")}catch(e){}try{e(this).die("mouseleave")}catch(e){}try{e(this).off("hover")}catch(e){}});try{a[i].c.die("click","mouseenter","mouseleave")}catch(e){}clearInterval(a[i].cdint),a[i].c=null}(t),clearInterval(a[t].cdint)):(a[t].c.trigger("revolution.slide.slideatend"),1==a[t].c.data("conthoverchanged")&&(a[t].conthover=a[t].c.data("conthover"),a[t].c.data("conthoverchanged",0)),a.callingNewSlide(t,1,!0)))},o=tpGS.gsap.timeline({paused:!0}),s="reset"===a[t].progressBar.reset||a[t].progressBar.notnew===i?0:.2,n="slide"===a[t].progressBar.basedon?0:a[t].pr_processing_key!==i?a[t].pr_processing_key:a[t].pr_active_key;if(n=n===i?0:n,"horizontal"===a[t].progressBar.style){if(o.add(tpGS.gsap.to(a[t].progressCBarInner[n],s,{scaleX:0,transformOrigin:"right"===a[t].progressBar.horizontal?"100% 50%":"0% 50%"})),o.add(tpGS.gsap.to(a[t].progressCBarInner[n],a[t].duration/1e3,{transformOrigin:"right"===a[t].progressBar.horizontal?"100% 50%":"0% 50%",force3D:"auto",scaleX:1,onComplete:r,delay:.5,ease:a[t].progressBar.ease})),"module"===a[t].progressBar.basedon)for(var d=0;d<a[t].slideamount;d++)d!==n&&o.add(tpGS.gsap.set(a[t].progressCBarInner[d],{scaleX:d<n?1:0,transformOrigin:"right"===a[t].progressBar.horizontal?"100% 50%":"0% 50%"}),0)}else if("vertical"===a[t].progressBar.style){if(a[t].progressCBarInner[n]!==i&&o.add(tpGS.gsap.to(a[t].progressCBarInner[n],s,{scaleY:0,transformOrigin:"bottom"===a[t].progressBar.vertical?"50% 100%":"50% 0%"})),a[t].progressCBarInner[n]!==i&&o.add(tpGS.gsap.to(a[t].progressCBarInner[n],a[t].duration/1e3,{transformOrigin:"bottom"===a[t].progressBar.vertical?"50% 100%":"50% 0%",force3D:"auto",scaleY:1,onComplete:r,delay:.5,ease:a[t].progressBar.ease})),"module"===a[t].progressBar.basedon)for(d=0;d<a[t].slideamount;d++)d!==n&&a[t].progressCBarInner[d]!==i&&o.add(tpGS.gsap.set(a[t].progressCBarInner[d],{scaleY:d<n?1:0,transformOrigin:"botton"===a[t].progressBar.vertical?"50% 100%":"50% 0%"}),0)}else{var l="slide"===a[t].progressBar.basedon?0:Math.max(0,360/a[t].slideamount*n),c="slide"===a[t].progressBar.basedon?360:360/a[t].slideamount*(n+1);"ccw"===a[t].progressBar.style&&"slide"!==a[t].progressBar.basedon&&(l=360-c,c=360-360/a[t].slideamount*n),o.add(tpGS.gsap.to(a[t].progressBar,s,{degree:"cw"===a[t].progressBar.style?l:c,onUpdate:function(){I(t)}})),o.add(tpGS.gsap.to(a[t].progressBar,a[t].duration/1e3,{degree:"cw"===a[t].progressBar.style?c:l,onUpdate:function(){I(t)},onComplete:r,delay:.5,ease:a[t].progressBar.ease}))}return a[t].progressBar.notnew=!0,o},C=function(e){a[e].progressC==i&&O(e),a[e].loop=0,a[e].stopAtSlide!=i&&a[e].stopAtSlide>-1?a[e].lastslidetoshow=a[e].stopAtSlide:a[e].lastslidetoshow=999,a[e].stopLoop=!1,0==a[e].looptogo&&(a[e].stopLoop=!0),a[e].c.on("stoptimer",function(){a[e].progressC!=i&&(a[e].progressC[0].tween.pause(),a[e].progressBar.disableProgressBar&&(a[e].progressC[0].style.visibility="hidden"),a[e].sliderstatus="paused",a[e].slideInSwapTimer||a.unToggleState(a[e].slidertoggledby),a[e].slideInSwapTimer=!1)}),a[e].c.on("starttimer",function(){a[e].progressC!=i&&(a[e].forcepaused||(1!=a[e].conthover&&1!=a[e].stopByVideo&&a[e].module.width>a[e].hideSliderAtLimit&&1!=a[e].tonpause&&1!=a[e].overnav&&1!=a[e].ssop&&(1===a[e].noloopanymore||a[e].viewPort.enable&&!a[e].inviewport||(a[e].progressBar.visibility[a[e].level]||(a[e].progressC[0].style.visibility="visible"),a[e].progressC[0].tween.resume(),a[e].sliderstatus="playing")),!a[e].progressBar.disableProgressBar&&a[e].progressBar.visibility[a[e].level]||(a[e].progressC[0].style.visibility="hidden"),a.toggleState(a[e].slidertoggledby)))}),a[e].c.on("restarttimer",function(){if(a[e].progressC!=i&&!a[e].forcepaused){if(a[e].mouseoncontainer&&"on"==a[e].navigation.onHoverStop&&!a.ISM)return!1;1===a[e].noloopanymore||a[e].viewPort.enable&&!a[e].inviewport||1==a[e].ssop?a.unToggleState(a[e].slidertoggledby):(a[e].progressBar.visibility[a[e].level]||(a[e].progressC[0].style.visibility="visible"),a[e].progressC[0].tween!==i&&a[e].progressC[0].tween.kill(),a[e].progressC[0].tween=M(e),a[e].progressC[0].tween.play(),a[e].sliderstatus="playing",a.toggleState(a[e].slidertoggledby)),!a[e].progressBar.disableProgressBar&&a[e].progressBar.visibility[a[e].level]||(a[e].progressC[0].style.visibility="hidden"),a[e].mouseoncontainer&&1==a[e].navigation.onHoverStop&&!a.ISM&&(a[e].c.trigger("stoptimer"),a[e].c.trigger("revolution.slide.onpause"))}}),a[e].c.on("nulltimer",function(){a[e].progressC!=i&&a[e].progressC[0]!==i&&(a[e].progressC[0].tween!==i&&a[e].progressC[0].tween.kill(),a[e].progressC[0].tween=M(e),a[e].progressC[0].tween.pause(0),!a[e].progressBar.disableProgressBar&&a[e].progressBar.visibility[a[e].level]||(a[e].progressC[0].style.visibility="hidden"),a[e].sliderstatus="paused")}),a[e].progressC!==i&&(a[e].progressC[0].tween=M(e)),a[e].slideamount>1&&(0!=a[e].stopAfterLoops||1!=a[e].stopAtSlide)?a[e].c.trigger("starttimer"):(a[e].noloopanymore=1,a[e].c.trigger("nulltimer")),a[e].c.on("tp-mouseenter",function(){a[e].mouseoncontainer=!0,1!=a[e].navigation.onHoverStop||a.ISM||(a[e].c.trigger("stoptimer"),a[e].c.trigger("revolution.slide.onpause"))}),a[e].c.on("tp-mouseleft",function(){a[e].mouseoncontainer=!1,1!=a[e].c.data("conthover")&&1==a[e].navigation.onHoverStop&&(1==a[e].viewPort.enable&&a[e].inviewport||0==a[e].viewPort.enable)&&(a[e].c.trigger("revolution.slide.onresume"),a[e].c.trigger("starttimer"))})},T=function(){e(".rev_redraw_on_blurfocus").each(function(){var e=this.id;if(a[e]==i||a[e].c==i||0===a[e].c.length)return!1;1!=a[e].windowfocused&&(a[e].windowfocused=!0,tpGS.gsap.delayedCall(.1,function(){a[e].fallbacks.nextSlideOnWindowFocus&&a[e].c.revnext(),a[e].c.revredraw(),"playing"==a[e].lastsliderstatus&&a[e].c.revresume(),a[e].c.trigger("revolution.slide.tabfocused")}))})},A=function(){document.hasFocus()||e(".rev_redraw_on_blurfocus").each(function(e){var i=this.id;a[i].windowfocused=!1,a[i].lastsliderstatus=a[i].sliderstatus,a[i].c.revpause(),a[i].c.trigger("revolution.slide.tabblured")})},D=function(){var e=document.documentMode===i,t=window.chrome;1!==a.revslider_focus_blur_listener&&(a.revslider_focus_blur_listener=1,e&&!t?a.window.on("focusin",function(){!0!==a.windowIsFocused&&T(),a.windowIsFocused=!0}).on("focusout",function(){!0!==a.windowIsFocused&&a.windowIsFocused!==i||A(),a.windowIsFocused=!1}):window.addEventListener?(window.addEventListener("focus",function(e){!0!==a.windowIsFocused&&T(),a.windowIsFocused=!0},{capture:!1,passive:!0}),window.addEventListener("blur",function(e){!0!==a.windowIsFocused&&a.windowIsFocused!==i||A(),a.windowIsFocused=!1},{capture:!1,passive:!0})):(window.attachEvent("focus",function(e){!0!==a.windowIsFocused&&T(),a.windowIsFocused=!0}),window.attachEvent("blur",function(e){!0!==a.windowIsFocused&&a.windowIsFocused!==i||A(),a.windowIsFocused=!1})))},P=function(e){for(var i,t=[],a=window.location.href.slice(window.location.href.indexOf(e)+1).split("_"),r=0;r<a.length;r++)a[r]=a[r].replace("%3D","="),i=a[r].split("="),t.push(i[0]),t[i[0]]=i[1];return t},B=function(t){if(a[t].blockSpacing!==i){var r=a[t].blockSpacing.split(";");for(var o in a[t].blockSpacing={},r)if(r.hasOwnProperty(o)){var s=r[o].split(":");switch(s[0]){case"t":a[t].blockSpacing.top=a.revToResp(s[1],4,0);break;case"b":a[t].blockSpacing.bottom=a.revToResp(s[1],4,0);break;case"l":a[t].blockSpacing.left=a.revToResp(s[1],4,0);break;case"r":a[t].blockSpacing.right=a.revToResp(s[1],4,0)}}a[t].blockSpacing.block=e(a.closestClass(a[t].c[0],"wp-block-themepunch-revslider")),a[t].level!==i&&a[t].blockSpacing!==i&&tpGS.gsap.set(a[t].blockSpacing.block,{paddingLeft:a[t].blockSpacing.left[a[t].level],paddingRight:a[t].blockSpacing.right[a[t].level],marginTop:a[t].blockSpacing.top[a[t].level],marginBottom:a[t].blockSpacing.bottom[a[t].level]})}},z=function(e){return e.charAt(0).toUpperCase()+e.slice(1)},G=function(t){return function(e){for(var t in e.minHeight=e.minHeight!==i?"none"===e.minHeight||"0"===e.minHeight||"0px"===e.minHeight||""==e.minHeight||" "==e.minHeight?0:parseInt(e.minHeight,0):0,e.maxHeight="none"===e.maxHeight||"0"===e.maxHeight?0:parseInt(e.maxHeight,0),e.carousel.maxVisibleItems=e.carousel.maxVisibleItems<1?999:e.carousel.maxVisibleItems,e.carousel.vertical_align="top"===e.carousel.vertical_align?"0%":"bottom"===e.carousel.vertical_align?"100%":"50%",e.carousel.space=parseInt(e.carousel.space,0),e.carousel.maxOpacity=parseInt(e.carousel.maxOpacity,0),e.carousel.maxOpacity=e.carousel.maxOpacity>1?e.carousel.maxOpacity/100:e.carousel.maxOpacity,e.carousel.showLayersAllTime="true"===e.carousel.showLayersAllTime||!0===e.carousel.showLayersAllTime?"all":e.carousel.showLayersAllTime,e.carousel.maxRotation=parseInt(e.carousel.maxRotation,0),e.carousel.minScale=parseInt(e.carousel.minScale,0),e.carousel.minScale=e.carousel.minScale>.9?e.carousel.minScale/100:e.carousel.minScale,e.carousel.speed=parseInt(e.carousel.speed,0),e.navigation.maintypes=["arrows","tabs","thumbnails","bullets"],e.perspective=parseInt(e.perspective,0),e.navigation.maintypes)e.navigation.maintypes.hasOwnProperty(t)&&e.navigation[e.navigation.maintypes[t]]!==i&&(e.navigation[e.navigation.maintypes[t]].animDelay=e.navigation[e.navigation.maintypes[t]].animDelay===i?1e3:e.navigation[e.navigation.maintypes[t]].animDelay,e.navigation[e.navigation.maintypes[t]].animSpeed=e.navigation[e.navigation.maintypes[t]].animSpeed===i?1e3:e.navigation[e.navigation.maintypes[t]].animSpeed,e.navigation[e.navigation.maintypes[t]].animDelay=parseInt(e.navigation[e.navigation.maintypes[t]].animDelay,0)/1e3,e.navigation[e.navigation.maintypes[t]].animSpeed=parseInt(e.navigation[e.navigation.maintypes[t]].animSpeed,0)/1e3);if(a.isNumeric(e.scrolleffect.tilt)||-1!==e.scrolleffect.tilt.indexOf("%")&&(e.scrolleffect.tilt=parseInt(e.scrolleffect.tilt)),e.scrolleffect.tilt=e.scrolleffect.tilt/100,e.navigation.thumbnails.position="outer-horizontal"==e.navigation.thumbnails.position?"bottom"==e.navigation.thumbnails.v_align?"outer-bottom":"outer-top":"outer-vertical"==e.navigation.thumbnails.position?"left"==e.navigation.thumbnails.h_align?"outer-left":"outer-right":e.navigation.thumbnails.position,e.navigation.tabs.position="outer-horizontal"==e.navigation.tabs.position?"bottom"==e.navigation.tabs.v_align?"outer-bottom":"outer-top":"outer-vertical"==e.navigation.tabs.position?"left"==e.navigation.tabs.h_align?"outer-left":"outer-right":e.navigation.tabs.position,e.sbtimeline.speed=parseInt(e.sbtimeline.speed,0)/1e3||.5,!0===e.sbtimeline.set&&!0===e.sbtimeline.fixed&&"auto"!==e.sliderLayout?(e.sbtimeline.fixStart=parseInt(e.sbtimeline.fixStart),e.sbtimeline.fixEnd=parseInt(e.sbtimeline.fixEnd)):e.sbtimeline.fixed=!1,e.progressBar===i||"true"!=e.progressBar.disableProgressBar&&1!=e.progressBar.disableProgressBar||(e.progressBar.disableProgressBar=!0),e.startDelay=parseInt(e.startDelay,0)||0,e.navigation!==i&&e.navigation.arrows!=i&&e.navigation.arrows.hide_under!=i&&(e.navigation.arrows.hide_under=parseInt(e.navigation.arrows.hide_under)),e.navigation!==i&&e.navigation.bullets!=i&&e.navigation.bullets.hide_under!=i&&(e.navigation.bullets.hide_under=parseInt(e.navigation.bullets.hide_under)),e.navigation!==i&&e.navigation.thumbnails!=i&&e.navigation.thumbnails.hide_under!=i&&(e.navigation.thumbnails.hide_under=parseInt(e.navigation.thumbnails.hide_under)),e.navigation!==i&&e.navigation.tabs!=i&&e.navigation.tabs.hide_under!=i&&(e.navigation.tabs.hide_under=parseInt(e.navigation.tabs.hide_under)),e.navigation!==i&&e.navigation.arrows!=i&&e.navigation.arrows.hide_over!=i&&(e.navigation.arrows.hide_over=parseInt(e.navigation.arrows.hide_over)),e.navigation!==i&&e.navigation.bullets!=i&&e.navigation.bullets.hide_over!=i&&(e.navigation.bullets.hide_over=parseInt(e.navigation.bullets.hide_over)),e.navigation!==i&&e.navigation.thumbnails!=i&&e.navigation.thumbnails.hide_over!=i&&(e.navigation.thumbnails.hide_over=parseInt(e.navigation.thumbnails.hide_over)),e.navigation!==i&&e.navigation.tabs!=i&&e.navigation.tabs.hide_over!=i&&(e.navigation.tabs.hide_over=parseInt(e.navigation.tabs.hide_over)),e.lazyloaddata!==i&&e.lazyloaddata.length>0&&e.lazyloaddata.indexOf("-")>0){var r=e.lazyloaddata.split("-");for(e.lazyloaddata=r[0],t=1;t<r.length;t++)e.lazyloaddata+=z(r[t])}return e.duration=parseInt(e.duration),"single"===e.lazyType&&"carousel"===e.sliderType&&(e.lazyType="smart"),"carousel"===e.sliderType&&e.carousel.justify&&(e.justifyCarousel=!0,e.keepBPHeight=!0),e.enableUpscaling=1==e.enableUpscaling&&"carousel"!==e.sliderType&&"fullwidth"===e.sliderLayout,e.useFullScreenHeight="carousel"===e.sliderType&&"fullscreen"===e.sliderLayout&&!0===e.useFullScreenHeight,e.progressBar.y=parseInt(e.progressBar.y,0),e.progressBar.x=parseInt(e.progressBar.x,0),
/*! Custom Eases */
"IE"!==window.RSBrowser&&e.customEases!==i&&(!e.customEases.SFXBounceLite&&"true"!=e.customEases.SFXBounceLite||tpGS.SFXBounceLite!==i||(tpGS.SFXBounceLite=tpGS.CustomBounce.create("SFXBounceLite",{strength:.3,squash:1,squashID:"SFXBounceLite-squash"})),!e.customEases.SFXBounceSolid&&"true"!=e.customEases.SFXBounceSolid||tpGS.SFXBounceSolid!==i||(tpGS.SFXBounceSolid=tpGS.CustomBounce.create("SFXBounceSolid",{strength:.5,squash:2,squashID:"SFXBounceSolid-squash"})),!e.customEases.SFXBounceStrong&&"true"!=e.customEases.SFXBounceStrong||tpGS.SFXBounceStrong!==i||(tpGS.SFXBounceStrong=tpGS.CustomBounce.create("SFXBounceStrong",{strength:.7,squash:3,squashID:"SFXBounceStrong-squash"})),!e.customEases.SFXBounceExtrem&&"true"!=e.customEases.SFXBounceExtrem||tpGS.SFXBounceExtrem!==i||(tpGS.SFXBounceExtrem=tpGS.CustomBounce.create("SFXBounceExtrem",{strength:.9,squash:4,squashID:"SFXBounceExtrem-squash"})),!e.customEases.BounceLite&&"true"!=e.customEases.BounceLite||tpGS.BounceLite!==i||(tpGS.BounceLite=tpGS.CustomBounce.create("BounceLite",{strength:.3})),!e.customEases.BounceSolid&&"true"!=e.customEases.BounceSolid||tpGS.BounceSolid!==i||(tpGS.BounceSolid=tpGS.CustomBounce.create("BounceSolid",{strength:.5})),!e.customEases.BounceStrong&&"true"!=e.customEases.BounceStrong||tpGS.BounceStrong!==i||(tpGS.BounceStrong=tpGS.CustomBounce.create("BounceStrong",{strength:.7})),!e.customEases.BounceExtrem&&"true"!=e.customEases.BounceExtrem||tpGS.BounceExtrem!==i||(tpGS.BounceExtrem=tpGS.CustomBounce.create("BounceExtrem",{strength:.9}))),e.modal.coverSpeed=parseFloat(e.modal.coverSpeed),e.modal.coverSpeed=e.modal.coverSpeed>200?e.modal.coverSpeed/1e3:e.modal.coverSpeed,e.modal.coverSpeed=Math.max(Math.min(3,e.modal.coverSpeed),.3),e.navigation.wheelViewPort=e.navigation.wheelViewPort===i?.5:e.navigation.wheelViewPort/100,e.navigation.wheelCallDelay=e.navigation.wheelCallDelay===i?1e3:parseInt(e.navigation.wheelCallDelay),e.autoDPR="string"==typeof e.DPR&&-1!==e.DPR.indexOf("ax"),e.DPR=e.DPR.replace("ax",""),e.DPR=parseInt(e.DPR.replace("x","")),e.DPR=isNaN(e.DPR)?window.devicePixelRatio:e.autoDPR?Math.min(window.devicePixelRatio,e.DPR):e.DPR,e.DPR=1!=e.onedpronmobile&&"true"!=e.onedpronmobile||!a.ISM?e.DPR:1,!1===e.viewPort.global?e.viewPort.enable=!1:!0===e.viewPort.global&&(e.viewPort.local=e.viewPort.enable,e.viewPort.enable=!0),e}(e.extend(!0,{DPR:"dpr",sliderType:"standard",sliderLayout:"auto",overlay:{type:"none",size:1,colora:"transparent",colorb:"#000000"},duration:9e3,imgCrossOrigin:"",modal:{useAsModal:!1,cover:!0,coverColor:"rgba(0,0,0,0.5)",horizontal:"center",vertical:"middle",coverSpeed:1},navigation:{keyboardNavigation:!1,keyboard_direction:"horizontal",mouseScrollNavigation:"off",wheelViewPort:50,wheelCallDelay:"1000ms",onHoverStop:!0,mouseScrollReverse:"default",target:"window",threshold:50,touch:{touchenabled:!1,touchOnDesktop:!1,swipe_treshold:75,swipe_min_touches:1,swipe_direction:"horizontal",drag_block_vertical:!1,mobileCarousel:!0,desktopCarousel:!0},arrows:{style:"",enable:!1,hide_onmobile:!1,hide_under:0,hide_onleave:!1,hide_delay:200,hide_delay_mobile:1200,hide_over:9999,tmp:"",rtl:!1,left:{h_align:"left",v_align:"center",h_offset:20,v_offset:0,container:"slider"},right:{h_align:"right",v_align:"center",h_offset:20,v_offset:0,container:"slider"}},bullets:{enable:!1,hide_onmobile:!1,hide_onleave:!1,hide_delay:200,hide_delay_mobile:1200,hide_under:0,hide_over:9999,direction:"horizontal",h_align:"center",v_align:"bottom",space:5,h_offset:0,v_offset:20,tmp:'<span class="tp-bullet-image"></span><span class="tp-bullet-title"></span>',container:"slider",rtl:!1,style:""},thumbnails:{container:"slider",rtl:!1,style:"",enable:!1,width:100,height:50,min_width:100,wrapper_padding:2,wrapper_color:"transparent",tmp:'<span class="tp-thumb-image"></span><span class="tp-thumb-title"></span>',visibleAmount:5,hide_onmobile:!1,hide_onleave:!1,hide_delay:200,hide_delay_mobile:1200,hide_under:0,hide_over:9999,direction:"horizontal",span:!1,position:"inner",space:2,h_align:"center",v_align:"bottom",h_offset:0,v_offset:20,mhoff:0,mvoff:0},tabs:{container:"slider",rtl:!1,style:"",enable:!1,width:100,min_width:100,height:50,wrapper_padding:10,wrapper_color:"transparent",tmp:'<span class="tp-tab-image"></span>',visibleAmount:5,hide_onmobile:!1,hide_onleave:!1,hide_delay:200,hide_delay_mobile:1200,hide_under:0,hide_over:9999,direction:"horizontal",span:!1,space:0,position:"inner",h_align:"center",v_align:"bottom",h_offset:0,v_offset:20,mhoff:0,mvoff:0}},responsiveLevels:4064,visibilityLevels:[2048,1024,778,480],gridwidth:960,gridheight:500,minHeight:0,maxHeight:0,keepBPHeight:!1,useFullScreenHeight:!0,overflowHidden:!1,forceOverflow:!1,fixedOnTop:!1,autoHeight:!1,gridEQModule:!1,disableForceFullWidth:!1,fullScreenOffsetContainer:"",fullScreenOffset:"0",hideLayerAtLimit:0,hideAllLayerAtLimit:0,hideSliderAtLimit:0,progressBar:{disableProgressBar:!1,style:"horizontal",size:"5px",radius:10,vertical:"bottom",horizontal:"left",x:0,y:0,color:"rgba(255,255,255,0.5)",bgcolor:"transparent",basedon:"slide",gapsize:0,reset:"reset",gaptype:"gapboth",gapcolor:"rgba(255,255,255,0.5)",ease:"none",visibility:{0:!0,1:!0,2:!0,3:!0}},stopAtSlide:-1,stopAfterLoops:0,shadow:0,startDelay:0,lazyType:"none",lazyOnBg:!1,spinner:"off",shuffle:!1,perspective:"600px",perspectiveType:"local",viewPort:{enable:!1,global:!1,globalDist:"-400px",outof:"wait",visible_area:"200px",presize:!1},fallbacks:{isJoomla:!1,panZoomDisableOnMobile:!1,simplifyAll:!0,nextSlideOnWindowFocus:!1,disableFocusListener:!1,allowHTML5AutoPlayOnAndroid:!0},fanim:!1,parallax:{type:"off",levels:[10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85],origo:"enterpoint",disable_onmobile:!1,ddd_shadow:!1,ddd_bgfreeze:!1,ddd_overflow:"visible",ddd_layer_overflow:"visible",ddd_z_correction:65,speed:400,speedbg:0,speedls:0},scrolleffect:{set:!1,fade:!1,blur:!1,scale:!1,grayscale:!1,maxblur:10,layers:!1,slide:!1,direction:"both",multiplicator:1.35,multiplicator_layers:.5,tilt:30,disable_onmobile:!1},sbtimeline:{set:!1,fixed:!1,fixStart:0,fixEnd:0,layers:!1,slide:!1,ease:"none",speed:500},carousel:{easing:"power3.inOut",speed:800,showLayersAllTime:!1,horizontal_align:"center",vertical_align:"center",infinity:!1,space:0,maxVisibleItems:3,stretch:!1,fadeout:!0,maxRotation:0,maxOpacity:100,minScale:0,offsetScale:!1,vary_fade:!1,vary_rotation:!1,vary_scale:!1,border_radius:"0px",padding_top:0,padding_bottom:0},observeWrap:!1,extensions:"extensions/",extensions_suffix:".min.js",stopLoop:!1,waitForInit:!1,ignoreHeightChange:!0,onedpronmobile:!1},t))};window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.waiting=window.RS_MODULES.waiting||[];var E=["DOM","main","parallax","video","slideanims","actions","layeranimation","navigation","carousel","panzoom"];for(var F in E)-1==window.RS_MODULES.waiting.indexOf(E[F])&&window.RS_MODULES.waiting.push(E[F]);function H(e){window.elementorFrontend!==i&&elementorFrontend.hooks!==i&&elementorFrontend.hooks.removeAction("frontend/element_ready/global",H),window.RS_MODULES.elementor={loaded:!0,version:"6.5.0"},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}function N(){if(window.elementorFrontend===i||window.elementorFrontend.hooks===i||window.elementorFrontend.hooks.addAction===i)return window.RS_MODULES.elementorCounter++,window.RS_MODULES.elementorCounterCheck&&window.RS_MODULES.elementorCounter>20?void H():void requestAnimationFrame(N);window.elementorFrontend.config.environmentMode.edit?elementorFrontend.hooks.addAction("frontend/element_ready/widget",H):H()}function j(){1!=RS_MODULES.checkElementorCalled&&(RS_MODULES.checkElementorCalled=!0,document.body&&(document.body.className.indexOf("elementor-page")>=0||document.body.className.indexOf("elementor-default")>=0)&&(window.RS_MODULES.waiting=window.RS_MODULES.waiting===i?[]:window.RS_MODULES.waiting,-1==window.RS_MODULES.waiting.indexOf("elementor")&&window.RS_MODULES.waiting.push("elementor"),document.body&&-1==document.body.className.indexOf("elementor-editor-active")&&(window.RS_MODULES.elementorCounterCheck=!0),window.RS_MODULES.elementorCounter=0,N()))}window.RS_MODULES.main={loaded:!0,version:t},window.RS_MODULES.minimal=!1,window.RS_MODULES.callSliders=function(){for(var e in RS_MODULES.modules)!0!==RS_MODULES.modules[e].once&&window.RS_MODULES!==i&&window.RS_MODULES.minimal&&(RS_MODULES.modules[e].once=!0,RS_MODULES.modules[e].init())},"loading"===document.readyState?document.addEventListener("readystatechange",function(){"interactive"!==document.readyState&&"complete"!==document.readyState||(j(),window.RS_MODULES.DOM={loaded:!0},window.RS_MODULES.checkMinimal())}):"complete"!==document.readyState&&"interactive"!==document.readyState||(j(),window.RS_MODULES.DOM={loaded:!0}),window.RS_MODULES.checkMinimal=function(){if(0==window.RS_MODULES.minimal){var t=1==window.RS_MODULES.minimal||window.RS_MODULES.waiting!==i&&e.fn.revolution!==i&&window.tpGS!==i&&window.tpGS.gsap!==i;if(t)for(var a in window.RS_MODULES.waiting)window.RS_MODULES.waiting.hasOwnProperty(a)&&t&&window.RS_MODULES[window.RS_MODULES.waiting[a]]===i&&(t=!1);t&&(!0!==window.RS_MODULES.minimal&&e(document).trigger("REVSLIDER_READY_TO_USE"),window.RS_MODULES.minimal=!0)}else window.RS_MODULES.minimal=!0;!0===window.RS_MODULES.minimal&&window.RS_MODULES.callSliders()},window.RS_MODULES.checkMinimal()}(jQuery),function($,undefined){"use strict";var version="6.2.14";jQuery.fn.revolution=jQuery.fn.revolution||{};var _R=jQuery.fn.revolution;jQuery.extend(!0,_R,{checkActions:function(e,i){e===undefined?moduleEnterLeaveActions(i):checkActions_intern(e,i)},delayer:function(e,i,t){_R[e].timeStamps=_R[e].timeStamps===undefined?{}:_R[e].timeStamps;var a=(new Date).getTime(),r=_R[e].timeStamps[t]===undefined?parseInt(i)+100:a-_R[e].timeStamps[t],o=parseInt(r)>i;return o&&(_R[e].timeStamps[t]=a),o},getURLDetails:function(e){(e=e===undefined?{}:e).url=e.url===undefined?window.location.href:e.url,e.url=e.url.replace("www",""),e.protocol=0===e.url.indexOf("http://")?"http://":0===e.url.indexOf("https://")?"https://":0===e.url.indexOf("//")?"//":"relative";var i=e.url.replace("https://","");i=i.replace("http://",""),"relative"===e.protocol&&(i=i.replace("//","")),i=i.split("#"),e.anchor=(e.anchor===undefined||""==e.anchor||0==e.anchor.length)&&i.length>1?i[1]:e.anchor===undefined?"":e.anchor.replace("#",""),e.anchor=e.anchor.split("?"),e.queries=i[0].split("?"),e.queries=e.queries.length>1?e.queries[1]:"",e.queries=e.queries.length>1?e.queries[1]:e.anchor.length>1?e.anchor[1]:e.queries,e.anchor=e.anchor[0];(i=i[0]).split("/");var t=i.split("/");return e.host=t[0],t.splice(0,1),e.path="/"+t.join("/"),"/"==e.path[e.path.length-1]&&(e.path=e.path.slice(0,-1)),e.origin="relative"!==e.protocol?e.protocol+e.host:window.location.origin.replace("www","")+window.location.pathname,e.hash=(""!==e.queries&&e.queries!==undefined?"?"+e.queries:"")+(""!==e.anchor&&e.anchor!==undefined?"#"+e.anchor:""),e},scrollToId:function(e){var i="scrollbelow"===e.action?(getOffContH(_R[e.id].fullScreenOffsetContainer)||0)-(parseInt(e.offset,0)||0)||0:0-(parseInt(e.offset,0)||0),t="scrollbelow"===e.action?_R[e.id].c:jQuery("#"+e.anchor),a=t.length>0?t.offset().top:0,r={_y:_R[e.id].modal.useAsModal?_R[e.id].cpar[0].scrollTop:window.pageYOffset!==document.documentElement.scrollTop?0!==window.pageYOffset?window.pageYOffset:document.documentElement.scrollTop:window.pageYOffset};if(a+="scrollbelow"===e.action?_R[e.id].sbtimeline.fixed?_R[e.id].cpar.parent().height()+_R[e.id].fullScreenOffsetResult:jQuery(_R[e.id].slides[0]).height():0,!window.isSafari11){var o=tpGS.gsap.getProperty("html","scrollBehavior"),s=tpGS.gsap.getProperty("body","scrollBehavior");tpGS.gsap.set("html,body",{scrollBehavior:"auto"})}tpGS.gsap.to(r,e.speed/1e3,{_y:a-i,ease:e.ease,onUpdate:function(){_R[e.id].modal.useAsModal?_R[e.id].cpar.scrollTop(r._y):_R.document.scrollTop(r._y)},onComplete:function(){e.hash!==undefined&&(window.location.hash=e.hash),window.isSafari11||(tpGS.gsap.set("html",{scrollBehavior:o}),tpGS.gsap.set("body",{scrollBehavior:s}))}})}});var moduleEnterLeaveActions=function(e){!_R[e].moduleActionsPrepared&&_R[e].c[0].getElementsByClassName("rs-on-sh").length>0&&(_R[e].c.on("tp-mouseenter",function(){_R[e].mouseoncontainer=!0;var i,t=_R[e].pr_next_key!==undefined?_R[e].pr_next_key:_R[e].pr_processing_key!==undefined?_R[e].pr_processing_key:_R[e].pr_active_key!==undefined?_R[e].pr_active_key:_R[e].pr_next_key;if("none"!==t&&t!==undefined){if((t=_R.gA(_R[e].slides[t],"key"))!==undefined&&_R[e].layers[t])for(i in _R[e].layers[t])_R[e].layers[t][i].className.indexOf("rs-on-sh")>=0&&_R.renderLayerAnimation({layer:jQuery(_R[e].layers[t][i]),frame:"frame_1",mode:"trigger",id:e});for(i in _R[e].layers.static)_R[e].layers.static[i].className.indexOf("rs-on-sh")>=0&&_R.renderLayerAnimation({layer:jQuery(_R[e].layers.static[i]),frame:"frame_1",mode:"trigger",id:e})}}),_R[e].c.on("tp-mouseleft",function(){_R[e].mouseoncontainer=!0;var i,t=_R[e].pr_next_key!==undefined?_R[e].pr_next_key:_R[e].pr_processing_key!==undefined?_R[e].pr_processing_key:_R[e].pr_active_key!==undefined?_R[e].pr_active_key:_R[e].pr_next_key;if("none"!==t&&t!==undefined){if((t=_R.gA(_R[e].slides[t],"key"))!==undefined&&_R[e].layers[t])for(i in _R[e].layers[t])_R[e].layers[t][i].className.indexOf("rs-on-sh")>=0&&_R.renderLayerAnimation({layer:jQuery(_R[e].layers[t][i]),frame:"frame_999",mode:"trigger",id:e});for(i in _R[e].layers.static)_R[e].layers.static[i].className.indexOf("rs-on-sh")>=0&&_R.renderLayerAnimation({layer:jQuery(_R[e].layers.static[i]),frame:"frame_999",mode:"trigger",id:e})}})),_R[e].moduleActionsPrepared=!0},checkActions_intern=function(layer,id){var actions=_R.gA(layer[0],"actions"),_L=layer.data();for(var ei in actions=actions.split("||"),layer.addClass("rs-waction"),_L.events=_L.events===undefined?[]:_L.events,_R[id].lastMouseDown={},actions)if(actions.hasOwnProperty(ei)){var event=getEventParams(actions[ei].split(";"));_L.events.push(event),"click"===event.on&&layer[0].classList.add("rs-wclickaction"),_R[id].fullscreen_esclistener||"exitfullscreen"!=event.action&&"togglefullscreen"!=event.action||(_R.document.keyup(function(e){27==e.keyCode&&jQuery("#rs-go-fullscreen").length>0&&layer.trigger(event.on)}),_R[id].fullscreen_esclistener=!0);var targetlayer="backgroundvideo"==event.layer?jQuery("rs-bgvideo"):"firstvideo"==event.layer?jQuery("rs-slide").find(".rs-layer-video"):jQuery("#"+event.layer);switch(-1!=jQuery.inArray(event.action,["toggleslider","toggle_mute_video","toggle_global_mute_video","togglefullscreen"])&&(_L._togglelisteners=!0),event.action){case"togglevideo":jQuery.each(targetlayer,function(){updateToggleByList(jQuery(this),"videotoggledby",layer[0].id)});break;case"togglelayer":jQuery.each(targetlayer,function(){updateToggleByList(jQuery(this),"layertoggledby",layer[0].id),jQuery(this).data("triggered_startstatus",event.togglestate)});break;case"toggle_global_mute_video":case"toggle_mute_video":jQuery.each(targetlayer,function(){updateToggleByList(jQuery(this),"videomutetoggledby",layer[0].id)});break;case"toggleslider":_R[id].slidertoggledby==undefined&&(_R[id].slidertoggledby=[]),_R[id].slidertoggledby.push(layer[0].id);break;case"togglefullscreen":_R[id].fullscreentoggledby==undefined&&(_R[id].fullscreentoggledby=[]),_R[id].fullscreentoggledby.push(layer[0].id)}}_R[id].actionsPrepared=!0,layer.on("mousedown",function(e){e.touches&&(e=e.touches[0]),_R[id].lastMouseDown.pageX=e.pageX,_R[id].lastMouseDown.pageY=e.pageY}),layer.on("click mouseenter mouseleave",function(e){if("click"===e.type){var evt=e.touches?e.touches[0]:e;if(Math.abs(evt.pageX-_R[id].lastMouseDown.pageX)>5||Math.abs(evt.pageY-_R[id].lastMouseDown.pageY)>5)return}for(var i in _L.events)if(_L.events.hasOwnProperty(i)&&_L.events[i].on===e.type){var event=_L.events[i];if(!(event.repeat!==undefined&&event.repeat>0)||_R.delayer(id,1e3*event.repeat,_L.c[0].id+"_"+event.action)){if("click"===event.on&&layer.hasClass("tp-temporarydisabled"))return!1;var targetlayer="backgroundvideo"==event.layer?jQuery(_R[id].slides[_R[id].pr_active_key]).find("rs-sbg-wrap rs-bgvideo"):"firstvideo"==event.layer?jQuery(_R[id].slides[_R[id].pr_active_key]).find(".rs-layer-video").first():jQuery("#"+event.layer),tex=targetlayer.length>0;switch(event.action){case"menulink":var linkto=_R.getURLDetails({url:event.url,anchor:event.anchor}),linkfrom=_R.getURLDetails();linkto.host==linkfrom.host&&linkto.path==linkfrom.path&&"_self"===event.target?_R.scrollToId({id:id,offset:event.offset,action:event.action,anchor:event.anchor,hash:linkto.hash,speed:event.speed,ease:event.ease}):"_self"===event.target?window.location=linkto.url+(linkto.anchor!==undefined&&""!==linkto.anchor?"#"+linkto.anchor:""):window.open(linkto.url+(linkto.anchor!==undefined&&""!==linkto.anchor?"#"+linkto.anchor:"")),e.preventDefault();break;case"nextframe":case"prevframe":case"gotoframe":case"togglelayer":case"toggleframes":case"startlayer":case"stoplayer":if(targetlayer[0]===undefined)continue;var _=_R[id]._L[targetlayer[0].id],frame=event.frame,tou="triggerdelay";if("click"===e.type&&_.clicked_time_stamp!==undefined&&(new Date).getTime()-_.clicked_time_stamp<300)return;if("mouseenter"===e.type&&_.mouseentered_time_stamp!==undefined&&(new Date).getTime()-_.mouseentered_time_stamp<300)return;if(clearTimeout(_.triggerdelayIn),clearTimeout(_.triggerdelayOut),clearTimeout(_.triggerdelay),"click"===e.type&&(_.clicked_time_stamp=(new Date).getTime()),"mouseenter"===e.type&&(_.mouseentered_time_stamp=(new Date).getTime()),"mouseleave"===e.type&&(_.mouseentered_time_stamp=undefined),"nextframe"===event.action||"prevframe"===event.action){_.forda=_.forda===undefined?getFordWithAction(_):_.forda;var inx=jQuery.inArray(_.currentframe,_.ford);for("nextframe"===event.action&&inx++,"prevframe"===event.action&&inx--;"skip"!==_.forda[inx]&&inx>0&&inx<_.forda.length-1;)"nextframe"===event.action&&inx++,"prevframe"===event.action&&inx--,inx=Math.min(Math.max(0,inx),_.forda.length-1);frame=_.ford[inx]}jQuery.inArray(event.action,["toggleframes","togglelayer","startlayer","stoplayer"])>=0&&(_.triggeredstate="startlayer"===event.action||"togglelayer"===event.action&&"frame_1"!==_.currentframe||"toggleframes"===event.action&&_.currentframe!==event.frameN,"togglelayer"===event.action&&!0===_.triggeredstate&&_.currentframe!==undefined&&"frame_999"!==_.currentframe&&(_.triggeredstate=!1),frame=_.triggeredstate?"toggleframes"===event.action?event.frameN:"frame_1":"toggleframes"===event.action?event.frameM:"frame_999",tou=_.triggeredstate?"triggerdelayIn":"triggerdelayOut",_.triggeredstate?_R.toggleState(_.layertoggledby):(_R.stopVideo&&_R.stopVideo(targetlayer,id),_R.unToggleState(_.layertoggledby)));var pars={layer:targetlayer,frame:frame,mode:"trigger",id:id};!0===event.children&&(pars.updateChildren=!0,pars.fastforward=!0),_R.renderLayerAnimation&&(clearTimeout(_[tou]),_[tou]=setTimeout(function(e){_R.renderLayerAnimation(e)},1e3*event.delay,pars));break;case"playvideo":tex&&_R.playVideo(targetlayer,id);break;case"stopvideo":tex&&_R.stopVideo&&_R.stopVideo(targetlayer,id);break;case"togglevideo":tex&&(_R.isVideoPlaying(targetlayer,id)?_R.stopVideo&&_R.stopVideo(targetlayer,id):_R.playVideo(targetlayer,id));break;case"mutevideo":tex&&_R.Mute(targetlayer,id,!0);break;case"unmutevideo":tex&&_R.Mute&&_R.Mute(targetlayer,id,!1);break;case"toggle_mute_video":tex&&(_R.Mute(targetlayer,id)?_R.Mute(targetlayer,id,!1):_R.Mute&&_R.Mute(targetlayer,id,!0));break;case"toggle_global_mute_video":var pvl=_R[id].playingvideos!=undefined&&_R[id].playingvideos.length>0;pvl&&(_R[id].globalmute?jQuery.each(_R[id].playingvideos,function(e,i){_R.Mute&&_R.Mute(i,id,!1)}):jQuery.each(_R[id].playingvideos,function(e,i){_R.Mute&&_R.Mute(i,id,!0)})),_R[id].globalmute=!_R[id].globalmute;break;default:tpGS.gsap.delayedCall(event.delay,function(targetlayer,id,event,layer){switch(event.action){case"openmodal":_R.openModalAPI(event.modal,event.modalslide===undefined?0:event.modalslide,_R[id].ajaxUrl,!0,id,event);break;case"closemodal":_R.revModal(id,{mode:"close"});break;case"callback":eval(event.callback);break;case"simplelink":window.open(event.url,event.target);break;case"simulateclick":targetlayer.length>0&&targetlayer.trigger("click");break;case"toggleclass":targetlayer.length>0&&targetlayer.toggleClass(event.classname);break;case"scrollbelow":case"scrollto":"scrollbelow"===event.action&&layer.addClass("tp-scrollbelowslider"),_R.scrollToId({id:id,offset:event.offset,action:event.action,anchor:event.id,speed:event.speed,ease:event.ease});break;case"jumptoslide":switch(_R[id].skipAttachDetach=!0,event.slide.toLowerCase()){case"rs-random":var ts=Math.min(Math.max(0,Math.ceil(Math.random()*_R[id].realslideamount)-1));ts=_R[id].activeRSSlide==ts?ts>0?ts-1:ts+1:ts,_R.callingNewSlide(id,_R[id].slides[ts].dataset.key,"carousel"===_R[id].sliderType);break;case"+1":case"next":case"rs-next":_R[id].sc_indicator="arrow",_R[id].sc_indicator_dir=0,_R.callingNewSlide(id,1,"carousel"===_R[id].sliderType);break;case"rs-previous":case"rs-prev":case"previous":case"prev":case"-1":_R[id].sc_indicator="arrow",_R[id].sc_indicator_dir=1,_R.callingNewSlide(id,-1,"carousel"===_R[id].sliderType);break;case"first":case"rs-first":_R[id].sc_indicator="arrow",_R[id].sc_indicator_dir=1,_R.callingNewSlide(id,0,"carousel"===_R[id].sliderType);break;case"last":case"rs-last":_R[id].sc_indicator="arrow",_R[id].sc_indicator_dir=0,_R.callingNewSlide(id,_R[id].slideamount-1,"carousel"===_R[id].sliderType);break;default:var ts=_R.isNumeric(event.slide)?parseInt(event.slide,0):event.slide;_R.callingNewSlide(id,ts,"carousel"===_R[id].sliderType)}break;case"toggleslider":_R[id].noloopanymore=0,"playing"==_R[id].sliderstatus?(_R[id].c.revpause(),_R[id].forcepaused=!0,_R.unToggleState(_R[id].slidertoggledby)):(_R[id].forcepaused=!1,_R[id].c.revresume(),_R.toggleState(_R[id].slidertoggledby));break;case"pauseslider":_R[id].c.revpause(),_R.unToggleState(_R[id].slidertoggledby);break;case"playslider":_R[id].noloopanymore=0,_R[id].c.revresume(),_R.toggleState(_R[id].slidertoggledby);break;case"gofullscreen":case"exitfullscreen":case"togglefullscreen":var gf;tpGS.gsap.set(_R[id].parallax.bgcontainers,{y:0}),jQuery(".rs-go-fullscreen").length>0&&("togglefullscreen"==event.action||"exitfullscreen"==event.action)?(jQuery(".rs-go-fullscreen").removeClass("rs-go-fullscreen"),gf=_R[id].c.closest("rs-fullwidth-wrap").length>0?_R[id].c.closest("rs-fullwidth-wrap"):_R[id].c.closest("rs-module-wrap"),_R[id].minHeight=_R[id].oldminheight,_R[id].infullscreenmode=!1,_R[id].c.revredraw(),_R[id].c.revredraw(),jQuery(window).trigger("resize"),_R.unToggleState(_R[id].fullscreentoggledby)):0!=jQuery(".rs-go-fullscreen").length||"togglefullscreen"!=event.action&&"gofullscreen"!=event.action||(gf=_R[id].c.closest("rs-fullwidth-wrap").length>0?_R[id].c.closest("rs-fullwidth-wrap"):_R[id].c.closest("rs-module-wrap"),gf.addClass("rs-go-fullscreen"),_R[id].oldminheight=_R[id].minHeight,_R[id].minHeight=_R.getWinH(id),_R[id].infullscreenmode=!0,jQuery(window).trigger("resize"),_R.toggleState(_R[id].fullscreentoggledby),_R[id].c.revredraw());break;default:_R[id].c.trigger("layeraction",[event.action,layer,event])}},[targetlayer,id,event,layer])}}}})};function getFordWithAction(e){var i=[];for(var t in e.ford)e.frames[e.ford[t]].timeline.waitoncall?i.push(e.ford[t]):i.push("skip");return i}function updateToggleByList(e,i,t){var a=e.data(i);a===undefined&&(a=[]),a.push(t),e.data(i,a)}function getEventParams(e){var i={on:"click",delay:0,ease:"power2.out",speed:400};for(var t in e)if(e.hasOwnProperty(t)){var a=e[t].split(":");switch(a.length>2&&"call"===a[0]&&(a[1]=a.join(":").replace(a[0]+":","")),a[0]){case"modal":i.modal=a[1];break;case"ms":i.modalslide=a[1];break;case"m":i.frameM=a[1];break;case"n":i.frameN=a[1];break;case"o":i.on="click"===a[1]||"c"===a[1]?"click":"ml"===a[1]||"mouseleave"===a[1]?"mouseleave":"mouseenter"===a[1]||"me"===a[1]?"mouseenter":a[1];break;case"d":i.delay=parseInt(a[1],0)/1e3,i.delay="NaN"===i.delay||isNaN(i.delay)?0:i.delay;break;case"rd":i.repeat=parseInt(a[1],0)/1e3,i.repeat="NaN"===i.repeat||isNaN(i.repeat)?0:i.repeat;break;case"a":i.action=a[1];break;case"f":i.frame=a[1];break;case"slide":i.slide=a[1];break;case"layer":i.layer=a[1];break;case"sp":i.speed=parseInt(a[1],0);break;case"e":i.ease=a[1];break;case"ls":i.togglestate=a[1];break;case"offset":i.offset=a[1];break;case"call":i.callback=a[1];break;case"url":i.url="";for(var r=1;r<a.length;r++)i.url+=a[r]+(r===a.length-1?"":":");break;case"target":i.target=a[1];break;case"class":i.classname=a[1];break;case"ch":i.children="true"==a[1]||1==a[1]||"t"==a[1];break;default:a[0].length>0&&""!==a[0]&&(i[a[0]]=a[1])}}return i}var getOffContH=function(e){if(e==undefined)return 0;if(e.split(",").length>1){var i=e.split(","),t=0;return i&&jQuery.each(i,function(e,i){jQuery(i).length>0&&(t+=jQuery(i).outerHeight(!0))}),t}return jQuery(e).height()};window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.actions={loaded:!0,version:version},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}(jQuery),function(e){"use strict";jQuery.fn.revolution=jQuery.fn.revolution||{};var i=jQuery.fn.revolution;jQuery.extend(!0,i,{prepareCarousel:function(e,t,a){if(void 0!==e){var o=i[e].carousel;o.slidepositions=void 0===o.slidepositions?[]:o.slidepositions,o.slideFakePositions=void 0===o.slideFakePositions?[]:o.slideFakePositions,t=o.lastdirection=r(t,o.lastdirection),i.setCarouselDefaults(e),void 0===o.slidepositions[0]&&(o.slideAnims=[],i.organiseCarousel(e,"right",!0,!1,!1),o.focused=0,o.keepFocusedFirst=!0),o.slide_offset=void 0!==o.slide_offset&&i.isNumeric(o.slide_offset)?o.slide_offset:0,o.swipeTo=o.slide_offset+s(e),o.swipeToDistance=Math.abs(o.slide_offset)+Math.abs(s(e)),void 0!==o.swipeTo&&i.isNumeric(o.swipeTo)?void 0!==a?i.swipeAnimate({id:e,to:o.swipeTo,distance:o.swipeToDistance,direction:t,fix:!0,speed:a}):i.swipeAnimate({id:e,to:o.swipeTo,distance:o.swipeToDistance,direction:t,fix:!0}):i.swipeAnimate({id:e,to:0,direction:t,speed:0})}},carouselToEvalPosition:function(e,a,o){var s=i[e].carousel;if(s.justify)s.focused=void 0===s.focused?0:s.focused,s.slidepositions[s.focused]=void 0===s.slidepositions[s.focused]?0:s.slidepositions[s.focused],s.slide_offset_target=t(e,s.focused);else{a=s.lastdirection=r(a,s.lastdirection);var n="center"===s.horizontal_align?(s.wrapwidth/2-s.slide_width/2-s.slide_offset)/s.slide_width:(0-s.slide_offset)/s.slide_width,d=n%i[e].slideamount,l=d-Math.floor(d),c=-1*(Math.ceil(d)-d),p=-1*(Math.floor(d)-d),g=l*s.slide_width,u=g>=20&&"left"===a?1:g>=s.slide_width-20&&"right"===a?2:g<20&&"left"===a?3:g<s.slide_width-20&&"right"===a?4:5,h=1===u||2===u?c:3===u||4===u?p:0;s.slide_offset_target=(s.infinity?h:d<0?d:n>i[e].slideamount-1?n-(i[e].slideamount-1):h)*s.slide_width}return s.slide_offset_target!==s.slide_offset_targetCACHE&&!0!==o&&(0!==Math.abs(s.slide_offset_target)?i.animateCarousel(e,a,!0):i.organiseCarousel(e,a),s.slide_offset_targetCACHE=s.slide_offset_target),s.slide_offset_target},loadVisibleCarouselItems:function(e,t){var a=[];i[e].carousel.focused=parseInt(i[e].carousel.focused,0),i[e].carousel.focused=i.isNumeric(i[e].carousel.focused)?i[e].carousel.focused:0;for(var r=0;r<Math.ceil(i[e].carousel.maxVisibleItems/2);r++){var o="right"===i[e].carousel.horizontal_align?i[e].carousel.focused-r:i[e].carousel.focused+r,s="center"===i[e].carousel.horizontal_align?i[e].carousel.focused-r:"left"===i[e].carousel.horizontal_align?i[e].carousel.maxVisibleItems+o-1:o-i[e].carousel.maxVisibleItems+1;o=o>=i[e].slideamount?o-i[e].slideamount+0:o,s=s>=i[e].slideamount?s-i[e].slideamount+0:s,o=o<0?i[e].slideamount+o:o,s=s<0?i[e].slideamount+s:s,a.push(i[e].slides[o]),o!==s&&a.push(i[e].slides[s])}return t&&(i.loadImages(a,e,1),i.waitForCurrentImages(a,e)),a},organiseCarousel:function(e,t,a,r,o){Math.round(1e5*Math.random());var s=i[e].carousel,n="center"===s.horizontal_align?2:1,d=Math.ceil(s.maxVisibleItems/n),l="center"===s.horizontal_align?s.wrapwidth/2+s.maxwidth/2:s.maxwidth-s.slide_width,c="center"===s.horizontal_align?s.wrapwidth/2-s.maxwidth/2:0-s.slide_width,p=0,g=0,u=0;if(s.ocfirsttun=!0,t=s.slide_offset<s.cached_slide_offset?"left":"right",s.cached_slide_offset=s.slide_offset,!0!==s.justify&&"center"===s.horizontal_align){var h=2*(s.windhalf-s.wrapoffset)+s.slide_width;h>=s.maxwidth&&("left"===t&&(l=2*s.windhalf,c=0-(s.slide_width-(h-s.maxwidth))),"right"===t&&(l=2*s.windhalf-(h-s.maxwidth),c=0-s.slide_width))}for(var m=2*s.windhalf,v=0,f=-1,y=0;y<s.len;y++)!0===s.justify?(p+=y>0?s.slide_widths[y-1]+s.space:s.slide_offset,s.wrapwidth>=s.maxwidth&&"center"!==s.horizontal_align&&(s.slideFakePositions[y]=p-s.slide_offset),c=0-s.slide_widths[y],l=s.maxwidth-s.slide_widths[y],s.inneroffset=0):(p=y*s.slide_width+s.slide_offset,s.wrapwidth>=s.maxwidth&&"left"===s.horizontal_align&&(s.slideFakePositions[y]=y*s.slide_width),s.wrapwidth>=s.maxwidth&&"right"===s.horizontal_align&&(s.slideFakePositions[y]=s.wrapwidth-(y+1)*s.slide_width)),u=g=p,s.infinity&&(g=g>=l-s.inneroffset?g-s.maxwidth:g<=c-s.inneroffset?g+s.maxwidth:g),m>g&&(m=g,y),v<g&&(v=g,f=y),s.slidepositions[y]=u>s.maxwidth+l?g-s.maxwidth:u<c-s.maxwidth?g+s.maxwidth:g;s.infinity&&m>0&&v>s.wrapwidth&&(s.slidepositions[f]-=s.maxwidth);var w=999,b=0,_=(i[e].module.width,!1),S="right"===s.horizontal_align?0:s.wrapwidth;if(i[e].slides)for(y=0;y<i[e].slides.length;y++){var x={left:(g=s.slidepositions[y])+s.inneroffset,width:!0===s.justify?s.slide_widths[y]:s.slide_width,x:0},k=0;if(void 0===s.slideAnims[y]&&(x.transformOrigin="50% "+s.vertical_align,x.scale=1,x.force3D=!0,x.transformStyle="3D"!=i[e].parallax.type&&"3d"!=i[e].parallax.type?"flat":"preserve-3d"),s.justify)x.opacity=1,x.visibility="visible",s.wrapwidth>=s.maxwidth&&"center"!==s.horizontal_align||("center"===s.horizontal_align&&s.slidepositions[y]<s.windhalf&&s.slidepositions[y]+s.slide_widths[y]>s.windhalf?s.focused=y:"left"===s.horizontal_align&&s.slidepositions[y]>=-25&&s.slidepositions[y]<s.windhalf&&(!_||s.slidepositions[y]<S)?(s.focused=y,_=!0,S=s.slidepositions[y]):"right"===s.horizontal_align&&s.slidepositions[y]+s.slide_widths[y]<=s.wrapwidth+25&&(s.slide_widths[y]<s.windhalf&&s.slidepositions[y]>s.windhalf||s.slidepositions[y]>s.wrapwidth-s.slide_widths[y])&&(!_||s.slidepositions[y]>S)&&(s.focused=y,_=!0,S=s.slidepositions[y]),s.focused=s.focused>=s.len?s.infinity?0:s.len-1:s.focused<0?s.infinity?s.len-1:0:s.focused);else{k="center"===s.horizontal_align?(Math.abs(s.wrapwidth/2)-(x.left+s.slide_width/2))/s.slide_width:(s.inneroffset-x.left)/s.slide_width,(Math.abs(k)<w||0===k)&&(w=Math.abs(k),s.focused=y),void 0!==s.minScale&&s.minScale>0&&(s.vary_scale?x.scale=1-Math.abs((1-s.minScale)/d*k):x.scale=k>=1||k<=-1?s.minScale:s.minScale+(1-s.minScale)*(1-Math.abs(k)),b=k*(x.width-x.width*x.scale)/2),s.fadeout&&(s.vary_fade?x.opacity=1-Math.abs(s.maxOpacity/d*k):x.opacity=k>=1||k<=-1?s.maxOpacity:s.maxOpacity+(1-s.maxOpacity)*(1-Math.abs(k)));var L=Math.ceil(s.maxVisibleItems/n)-Math.abs(k);x.opacity=void 0===x.opacity?1:x.opacity,x.opacity=Math.max(0,Math.min(L,x.opacity)),x.opacity>0&&(x.visibility="visible"),void 0===s.maxRotation||0==Math.abs(s.maxRotation)||i.isiPhone||(s.vary_rotation?(x.rotationY=Math.abs(s.maxRotation)-Math.abs((1-Math.abs(1/d*k))*s.maxRotation),x.opacity=Math.abs(x.rotationY)>90?0:x.opacity):x.rotationY=k>=1||k<=-1?s.maxRotation:Math.abs(k)*s.maxRotation,x.rotationY=k<0?-1*x.rotationY:x.rotationY,i.isSafari11()&&(x.z=0!==k?0-Math.abs(x.rotationY):0)),x.x=Math.floor(-1*s.space*k*(s.offsetScale?x.scale:1)),void 0!==x.scale&&(x.x=x.x+b)}x.x+=s.wrapwidth>=s.maxwidth&&("left"===s.horizontal_align||"right"===s.horizontal_align)?s.slideFakePositions[y]:Math.floor(x.left),delete x.left,x.zIndex=s.justify?95:Math.round(100-Math.abs(5*k)),!0!==o&&(void 0!==s.slideAnims[y]&&(x.width===s.slideAnims[y].width&&delete x.width,x.x===s.slideAnims[y].x&&delete x.x,x.opacity===s.slideAnims[y].opacity&&delete x.opacity,x.scale===s.slideAnims[y].scale&&delete x.scale,x.zIndex===s.slideAnims[y].zIndex&&delete x.zIndex,x.rotationY===s.slideAnims[y].rotationY&&delete x.rotationY),tpGS.gsap.set(i[e].slides[y],x),s.slideAnims[y]=jQuery.extend(!0,s.slideAnims[y],x))}if(i.loadVisibleCarouselItems(e,!0),r&&!0!==o){if(s.focused=void 0===s.focused?0:s.focused,s.oldfocused=void 0===s.oldfocused?0:s.oldfocused,i[e].pr_next_key=s.focused,s.focused!==s.oldfocused)for(var R in void 0!==s.oldfocused&&i.removeTheLayers(jQuery(i[e].slides[s.oldfocused]),e),i.animateTheLayers({slide:s.focused,id:e,mode:"start"}),i.animateTheLayers({slide:"individual",id:e,mode:i[e].carousel.allLayersStarted?"rebuild":"start"}),i[e].sbgs)i[e].sbgs.hasOwnProperty(R)&&void 0!==i[e].sbgs[R].bgvid&&0!==i[e].sbgs[R].bgvid.length&&(""+i[e].sbgs[R].skeyindex==""+s.focused?i.playBGVideo(e,i.gA(i[e].pr_next_slide[0],"key")):i.stopBGVideo(e,i[e].sbgs[R].key));s.oldfocused=s.focused,i[e].c.trigger("revolution.nextslide.waiting")}},swipeAnimate:function(e){var t=i[e.id].carousel,r={from:t.slide_offset,to:e.to},o=void 0===e.speed?.5:e.speed;if(t.distance=void 0!==e.distance?e.distance:e.to,void 0!==t.positionanim&&t.positionanim.pause(),e.fix){if(!1!==t.snap){var s=t.slide_offset,n="end"===e.phase?t.focusedBeforeSwipe:t.focused;t.slide_offset=e.to,i.organiseCarousel(e.id,e.direction,!0,!1,!1),Math.abs(t.swipeDistance)>40&&n==t.focused&&(t.focused="right"===e.direction?t.focused-1:t.focused+1,t.focused=t.focused>=t.len?t.infinity?0:t.len-1:t.focused<0?t.infinity?t.len-1:0:t.focused),r.to+=i.carouselToEvalPosition(e.id,e.direction,!0),t.slide_offset=s,i.organiseCarousel(e.id,e.direction,!0,!1,!1),t.keepFocusedFirst&&(t.keepFocusedFirst=!1,t.focused=0)}else!0!==t.infinity?(r.to>0&&(r.to=0),r.to<t.wrapwidth-t.maxwidth&&(r.to=t.wrapwidth-t.maxwidth)):"end"===e.phase?t.dragModeJustEnded=!0:!0!==t.dragModeJustEnded?r.to+=i.carouselToEvalPosition(e.id,e.direction,!0):t.dragModeJustEnded=!1;0!==(o=t.speed/1e3*a(Math.abs(Math.abs(r.from)-Math.abs(t.distance))/t.wrapwidth))&&o<.1&&Math.abs(r.to)>25&&(o=.3)}t.swipeDistance=0,o=!0!==t.firstSwipedDone?0:o,t.firstSwipedDone=!0,t.positionanim=tpGS.gsap.to(r,o,{from:r.to,onUpdate:function(){t.slide_offset=r.from%t.maxwidth,i.organiseCarousel(e.id,e.direction,!0!==e.fix,!0!==e.fix),t.slide_offset=r.from},onComplete:function(){t.slide_offset=r.from%t.maxwidth,"carousel"!==i[e.id].sliderType||t.fadein||(tpGS.gsap.to(i[e.id].canvas,1,{scale:1,opacity:1}),t.fadein=!0),t.lastNotSimplifedSlideOffset=t.slide_offset,t.justDragged=!1,e.fix&&(t.focusedAfterAnimation=t.focused,e.newSlide&&t.focusedBeforeSwipe!==t.focused&&i.callingNewSlide(e.id,jQuery(i[e.id].slides[t.focused]).data("key"),!0),i.organiseCarousel(e.id,e.direction,!0,!0),i[e.id].c.trigger("revolution.slide.carouselchange",{slider:e.id,slideIndex:parseInt(i[e.id].pr_active_key,0)+1,slideLIIndex:i[e.id].pr_active_key,slide:i[e.id].pr_next_slide,currentslide:i[e.id].pr_next_slide,prevSlideIndex:void 0!==i[e.id].pr_lastshown_key&&parseInt(i[e.id].pr_lastshown_key,0)+1,prevSlideLIIndex:void 0!==i[e.id].pr_lastshown_key&&parseInt(i[e.id].pr_lastshown_key,0),prevSlide:void 0!==i[e.id].pr_lastshown_key&&i[e.id].slides[i[e.id].pr_lastshown_key]}))},ease:e.easing?e.easing:t.easing})},defineCarouselElements:function(e){var t=i[e].carousel;t.infbackup=t.infinity,t.maxVisiblebackup=t.maxVisibleItems,t.slide_offset="none",t.slide_offset=0,t.cached_slide_offset=0,t.wrap=jQuery(i[e].canvas[0].parentNode),0!==t.maxRotation&&("3D"!==i[e].parallax.type&&"3d"!==i[e].parallax.type||tpGS.gsap.set(t.wrap,{perspective:"1600px",transformStyle:"preserve-3d"}))},setCarouselDefaults:function(e,t){var a=i[e].carousel;if(a.slide_width=!0!==a.stretch?i[e].gridwidth[i[e].level]*(0===i[e].CM.w?1:i[e].CM.w):i[e].canv.width,a.slide_height=!0!==a.stretch?i[e].infullscreenmode?i.getWinH(e)-i.getFullscreenOffsets(e):i[e].gridheight[i[e].level]*(0===i[e].CM.w?1:i[e].CM.w):i[e].canv.height,a.ratio=a.slide_width/a.slide_height,a.len=i[e].slides.length,a.maxwidth=i[e].slideamount*a.slide_width,1!=a.justify&&a.maxVisiblebackup>a.len&&(a.maxVisibleItems=a.len%2?a.len:a.len+1),a.wrapwidth=a.maxVisibleItems*a.slide_width+(a.maxVisibleItems-1)*a.space,a.wrapwidth="auto"!=i[e].sliderLayout?a.wrapwidth>i[e].canv.width?i[e].canv.width:a.wrapwidth:a.wrapwidth>i[e].module.width?0!==i[e].module.width?i[e].module.width:i[e].canv.width:a.wrapwidth,!0===a.justify){a.slide_height="fullscreen"===i[e].sliderLayout?i[e].module.height:i[e].gridheight[i[e].level],a.slide_widths=[],a.slide_widthsCache=void 0===a.slide_widthsCache?[]:a.slide_widthsCache,a.maxwidth=0;for(var r=0;r<a.len;r++)if(i[e].slides.hasOwnProperty(r)){var o=i.gA(i[e].slides[r],"iratio");o=void 0===o||0===o||null===o?a.ratio:o,o=parseFloat(o),a.slide_widths[r]=Math.round(a.slide_height*o),!1!==a.justifyMaxWidth&&(a.slide_widths[r]=Math.min(a.wrapwidth,a.slide_widths[r])),a.slide_widths[r]!==a.slide_widthsCache[r]&&(a.slide_widthsCache[r]=a.slide_widths[r],!0!==t&&tpGS.gsap.set(i[e].slides[r],{width:a.slide_widths[r]})),a.maxwidth+=a.slide_widths[r]+a.space}}if(a.infinity=!(a.wrapwidth>=a.maxwidth)&&a.infbackup,!0!==a.quickmode){a.wrapoffset="center"===a.horizontal_align?(i[e].canv.width-i[e].outNavDims.right-i[e].outNavDims.left-a.wrapwidth)/2:0,a.wrapoffset="auto"!=i[e].sliderLayout&&i[e].outernav?0:a.wrapoffset<i[e].outNavDims.left?i[e].outNavDims.left:a.wrapoffset;var s="3D"==i[e].parallax.type||"3d"==i[e].parallax.type?"visible":"hidden",n="right"===a.horizontal_align?{left:"auto",right:a.wrapoffset+"px",width:a.wrapwidth,overflow:s}:"left"===a.horizontal_align||a.wrapwidth<i.winW?{right:"auto",left:a.wrapoffset+"px",width:a.wrapwidth,overflow:s}:{right:"auto",left:"auto",width:"100%",overflow:s};void 0!==a.cacheWrapObj&&n.left===a.cacheWrapObj.left&&n.right===a.cacheWrapObj.right&&n.width===a.cacheWrapObj.width||(window.requestAnimationFrame(function(){tpGS.gsap.set(a.wrap,n),i[e].carousel.wrapoffset>0&&tpGS.gsap.set(i[e].canvas,{left:0})}),a.cacheWrapObj=jQuery.extend(!0,{},n)),a.inneroffset="right"===a.horizontal_align?a.wrapwidth-a.slide_width:0,a.windhalf="auto"===i[e].sliderLayout?i[e].module.width/2:i.winW/2}}});var t=function(e,t){var a=i[e].carousel;return"center"===a.horizontal_align?a.windhalf-a.slide_widths[t]/2-a.slidepositions[t]:"left"===a.horizontal_align?0-a.slidepositions[t]:a.wrapwidth-a.slide_widths[t]-a.slidepositions[t]},a=function(e){return e<1?Math.sqrt(1-(e-=1)*e):Math.sqrt(e)},r=function(e,i){return null===e||jQuery.isEmptyObject(e)?i:void 0===e?"right":e},o=function(e,i){return Math.abs(e)>Math.abs(i)?e>0?e-Math.abs(Math.floor(e/i)*i):e+Math.abs(Math.floor(e/i)*i):e},s=function(e){var t,a,r,s,n,d=0,l=i[e].carousel;if(void 0!==l.positionanim&&l.positionanim.pause(),l.justify)"center"===l.horizontal_align?d=l.windhalf-l.slide_widths[l.focused]/2-l.slidepositions[l.focused]:"left"===l.horizontal_align?d=0-l.slidepositions[l.focused]:"right"===l.horizontal_align&&(d=l.wrapwidth-l.slide_widths[l.focused]-l.slidepositions[l.focused]),d=d>l.maxwidth/2?l.maxwidth-d:d<0-l.maxwidth/2?d+l.maxwidth:d;else{var c=i[e].pr_processing_key>=0?i[e].pr_processing_key:i[e].pr_active_key>=0?i[e].pr_active_key:0,p=("center"===l.horizontal_align?(l.wrapwidth/2-l.slide_width/2-l.slide_offset)/l.slide_width:(0-l.slide_offset)/l.slide_width)%i[e].slideamount;d=(l.infinity?(t=p,a=c,r=i[e].slideamount,n=a-r-t,s=o(s=a-t,r),n=o(n,r),-(Math.abs(s)>Math.abs(n)?n:s)):p-c)*l.slide_width}return!1===l.snap&&l.justDragged&&(d=0),l.justDragged=!1,d};window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.carousel={loaded:!0,version:"6.5.8"},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}(jQuery),function(e){"use strict";var i=["chars","words","lines"],t=["Top","Right","Bottom","Left"],a=["TopLeft","TopRight","BottomRight","BottomLeft"],r=["top","right","bottom","left"];jQuery.fn.revolution=jQuery.fn.revolution||{};var o=jQuery.fn.revolution;jQuery.extend(!0,o,{checkLayerDimensions:function(e){var i=!1;for(var t in o[e.id].layers[e.skey])if(o[e.id].layers[e.skey].hasOwnProperty(t)){var a=o[e.id].layers[e.skey][t],r=o[e.id]._L[a.id];r.eow!==a.offsetWidth&&"true"!==o.gA(a,"vary-layer-dims")&&(i=!0),r.lastknownwidth=r.eow,r.lastknownheight=r.eoh,r._slidelink||o[e.id].caches.calcResponsiveLayersList.push({a:o[e.id]._L[a.id].c,b:e.id,c:0,d:r.rsp_bd,e:e.slideIndex})}return i},requestLayerUpdates:function(e,i,t,a){var r,s,n,d;if(void 0!==t)r=t,o[e]._L[r].pVisRequest!==o[e]._L[r].pVisStatus&&(void 0===o[e]._L[r]._ligid||!0!==o[e]._L[o[e]._L[r]._ligid].childrenAtStartNotVisible?(o[e]._L[r].pVisStatus=o[e]._L[r].pVisRequest,d=("row"===o[e]._L[r].type||"column"===o[e]._L[r].type||"group"===o[e]._L[r].type)&&void 0!==o[e]._L[r].frames&&void 0!==o[e]._L[r].frames.frame_999&&void 0!==o[e]._L[r].frames.frame_999.transform&&""+o[e]._L[r].frames.frame_999.transform.opacity!="0",n=1===o[e]._L[r].pVisRequest?"remove":d?n:"add",s=1===o[e]._L[r].pVisRequest?"remove":d?"add":s):(n="add",s="remove"),"group"===o[e]._L[r].type&&"add"==s&&"hidden"==(1===o[e]._L[r].pVisStatus?"visible":0===o[e]._L[r].pVisStatus?"hidden":o[e]._L[r].pVisStatus)&&(n="add"),void 0!==s&&o[e]._L[r].p[0].classList[s]("rs-forceuntouchable"),void 0!==n&&o[e]._L[r].p[0].classList[n]("rs-forcehidden")),o[e]._L[r].pPointerStatus!==o[e]._L[r].pPeventsRequest&&(o[e]._L[r].pPointerStatus=o[e]._L[r].pPeventsRequest,tpGS.gsap.set(o[e]._L[r].p[0],{pointerEvents:o[e]._L[r].pPointerStatus,visibility:1===o[e]._L[r].pVisStatus?"visible":0===o[e]._L[r].pVisStatus?"hidden":o[e]._L[r].pVisStatus})),void 0!==a&&"ignore"!==a&&0!==a&&(a++,"enterstage"===i||"leavestage"===i||"framestarted"===i?o.isFirefox(e)?-1===o[e]._L[r].p[0].style.transform.indexOf("perspective")&&(o[e]._L[r].p[0].style.transform+=(0===o[e]._L[r].p[0].style.transform.length?" ":"")+"perspective("+a+"px)"):(!window.isSafari11&&!0!==o[e]._L[r].maskHasPerspective&&0===o[e]._L[r].p[0].style.perspective.length||"none"==o[e]._L[r].p[0].style.perspective)&&(o[e]._L[r].p[0].style.perspective=a+"px"):"frameended"===i&&(o.isFirefox(e)?o[e]._L[r].p[0].style.transform=o[e]._L[r].p[0].style.transform.replace("perspective("+a+"px)",""):window.isSafari11||(o[e]._L[r].p[0].style.perspective=o[e]._L[r].p[0].style.perspective.replace(a-1+"px",""))));else for(r in o[e]._L)o[e]._L.hasOwnProperty(r)&&(o[e]._L[r].pVisRequest!==o[e]._L[r].pVisStatus&&(o[e]._L[r].pVisStatus=o[e]._L[r].pVisRequest,0===o[e]._L[r].pVisStatus?o[e]._L[r].p[0].classList.add("rs-forcehidden"):o[e]._L[r].p[0].classList.remove("rs-forcehidden")),o[e]._L[r].pPointerStatus!==o[e]._L[r].pPeventsRequest&&(o[e]._L[r].pPointerStatus=o[e]._L[r].pPeventsRequest,tpGS.gsap.set(o[e]._L[r].p[0],{pointerEvents:o[e]._L[r].pPointerStatus,visibility:o[e]._L[r].pVisStatus})));"enterstage"===i&&void 0!==t&&void 0!==o[e]._L[t].esginside&&o[e]._L[t].esginside.length>0&&void 0!==o[e]._L[t].esginside.esredraw&&o[e]._L[t].esginside.esredraw()},updateMiddleZonesAndESG:function(e){var i,t=o[e].pr_processing_key||o[e].pr_active_key||0;if(o[e].middleZones&&o[e].middleZones.length>0&&void 0!==o[e].middleZones[t])for(i=0;i<o[e].middleZones[t].length;i++)tpGS.gsap.set(o[e].middleZones[t][i],{y:Math.round(o[e].module.height/2-o[e].middleZones[t][i].offsetHeight/2)+"px"});if(o[e].smiddleZones&&o[e].smiddleZones.length>0)for(i=0;i<o[e].smiddleZones.length;i++)tpGS.gsap.set(o[e].smiddleZones[i],{y:Math.round(o[e].module.height/2-o[e].smiddleZones[i].offsetHeight/2)+"px"})},getRowHeights:function(e){var i=0,t=0,a=0,r=o[e].pr_processing_key||o[e].pr_active_key||0,s=o[e].pr_active_key||0;if(o[e].rowzones&&o[e].rowzones.length>0){if(void 0!==o[e].rowzones[r])for(var n=0;n<o[e].rowzones[r].length;n++)o[e].rowzonesHeights[r][n]=o[e].rowzones[r][n][0].offsetHeight,i+=o[e].rowzonesHeights[r][n];if(s!==r)for(n=0;n<o[e].rowzones[s].length;n++)o[e].rowzonesHeights[s][n]=o[e].rowzones[s][n][0].offsetHeight,t+=o[e].rowzonesHeights[s][n]}if(o[e].srowzones&&o[e].srowzones.length>0)for(n=0;n<o[e].srowzones.length;n++)a+=o[e].srowzones[n][0].offsetHeight;i=i<a?a:i;var d=void 0===o[e].rowHeights?[]:o[e].rowHeights.cache,l=(new Date).getTime();return void 0!==o[e].rowHeights&&l-o[e].rowHeights.tz<300?o[e].rowHeights.cache.length>5&&(i=o[e].rowHeights.cache[o[e].rowHeights.cache.length-1]===i?o[e].rowHeights.cache[o[e].rowHeights.cache.length-2]:o[e].rowHeights.cache[o[e].rowHeights.cache.length-1],l=o[e].rowHeights.tz):d=[],d.push(i),{cur:i,last:t,cache:d,tz:l}},getGridOffset:function(e,i,t,a){var r="grid"===t?o[e].canv.width:"carousel"!==o[e].sliderType||a?o[e].canv.width:o[e].carousel.slide_width,s=o[e].useFullScreenHeight?o[e].module.height:"grid"===t?o[e].content.height:"carousel"!==o[e].sliderType||a?o[e].module.height:o[e].canv.height,n="slide"===t?0:Math.max(0,"fullscreen"==o[e].sliderLayout?o[e].module.height/2-o.iHE(e)*(o[e].keepBPHeight?1:o[e].CM.h)/2:o[e].autoHeight||null!=o[e].minHeight&&o[e].minHeight>0||o[e].keepBPHeight?o[e].canv.height/2-o.iHE(e)*o[e].CM.h/2:0),d="slide"===t?0:Math.max(0,"carousel"===o[e].sliderType?0:o[e].canv.width/2-o.iWA(e,i)*o[e].CM.w/2);return"slide"!==t&&"carousel"===o[e].sliderType&&a&&void 0!==o[e].carousel&&void 0!==o[e].carousel.horizontal_align&&(d=Math.max(0,"center"===o[e].carousel.horizontal_align?0+(o[e].module.width-o.iWA(e,"static")*o[e].CM.w)/2:"right"===o[e].carousel.horizontal_align?o[e].module.width-o[e].gridwidth[o[e].level]*o[e].CM.w:d)),[r,s,d,n]},initLayer:function(e){var i,t,a,r=e.id,s=e.skey;for(var n in o[r].layers[e.skey])if(o[r].layers[e.skey].hasOwnProperty(n)){var d=o[r].layers[e.skey][n],l=jQuery(d),c=o.gA(d,"initialised"),p=c?o[r]._L[d.id]:l.data();if("individual"===e.skey&&(p.slideKey=void 0===p.slideKey?o.gA(l.closest("rs-slide")[0],"key"):p.slideKey,p.slideIndex=void 0===p.slideIndex?o.getSlideIndex(r,p.slideKey):p.slideIndex,e.slideIndex=p.slideIndex,s=p.slideKey),void 0===c){if(o.revCheckIDS(r,d),o[r]._L[d.id]=p,p.ford=void 0===p.ford?"frame_0;frame_1;frame_999":p.ford,p.ford=";"==p.ford[p.ford.length-1]?p.ford.substring(0,p.ford.length-1):p.ford,p.ford=p.ford.split(";"),void 0!==p.clip)for(i in p.clipPath={use:!1,origin:"l",type:"rectangle"},p.clip=p.clip.split(";"),p.clip)p.clip.hasOwnProperty(i)&&("u"==(t=p.clip[i].split(":"))[0]&&(p.clipPath.use="true"==t[1]),"o"==t[0]&&(p.clipPath.origin=t[1]),"t"==t[0]&&(p.clipPath.type=t[1]));if(p.frames=k(p,r),p.caches={},p.OBJUPD={},p.c=l,p.p=o[r]._Lshortcuts[d.id].p,p.lp=o[r]._Lshortcuts[d.id].lp,p.m=o[r]._Lshortcuts[d.id].m,p.triggercache=void 0===p.triggercache?"reset":p.triggercache,p.rsp_bd=void 0===p.rsp_bd?"column"===p.type||"row"===p.type?"off":"on":p.rsp_bd,p.rsp_o=void 0===p.rsp_o?"on":p.rsp_o,p.basealign=void 0===p.basealign?"grid":p.basealign,p.group="group"!==p.type&&null!==o.closestNode(l[0],"RS-GROUP-WRAP")?"group":"column"!==p.type&&null!==o.closestNode(l[0],"RS-COLUMN")?"column":"row"!==p.type&&null!==o.closestNode(l[0],"RS-ROW")?"row":void 0,p._lig="group"===p.group?jQuery(o.closestNode(l[0],"RS-GROUP")):"column"===p.group?jQuery(o.closestNode(l[0],"RS-COLUMN")):"row"===p.group?jQuery(o.closestNode(l[0],"RS-ROW")):void 0,p._ligid=void 0!==p._lig?p._lig[0].id:void 0,p._column="RS-COLUMN"===l[0].tagName?jQuery(o.closestNode(l[0],"RS-COLUMN-WRAP")):"none",p._row="RS-COLUMN"===l[0].tagName&&jQuery(o.closestNode(l[0],"RS-ROW")),p._ingroup="group"===p.group,p._incolumn="column"===p.group,p._inrow="row"===p.group,p.fsom="true"==p.fsom||1==p.fsom,(p._ingroup||p._incolumn)&&p._lig[0].className.indexOf("rs-sba")>=0&&(!1!==p.animationonscroll||void 0===p.frames.loop)&&!0!==p.animOnScrollForceDisable&&(p.animationonscroll=!0,l[0].className+=" rs-sba",o[r].sbas[s][d.id]=l[0]),p.animOnScrollRepeats=0,p._isgroup="RS-GROUP"===l[0].tagName,p.type=p.type||"none","row"===p.type&&(void 0===p.cbreak&&(p.cbreak=2),void 0===p.zone&&(p.zone=o.closestNode(l[0],"RS-ZONE"),p.zone=null!==p.zone&&void 0!==p.zone?p.zone.className:"")),p.esginside=jQuery(l[0].getElementsByClassName("esg-grid")[0]),p._isnotext=-1!==jQuery.inArray(p.type,["video","image","audio","shape","row","group"]),p._mediatag="html5"==p.audio?"audio":"video",p.img=l.find("img"),p.deepiframe=o.getByTag(l[0],"iframe"),p.deepmedia=o.getByTag(l[0],p._mediatag),p.layertype="image"===p.type?"image":l[0].className.indexOf("rs-layer-video")>=0||l[0].className.indexOf("rs-layer-audio")>=0||p.deepiframe.length>0&&(p.deepiframe[0].src.toLowerCase().indexOf("youtube")>0||p.deepiframe[0].src.toLowerCase().indexOf("vimeo")>0)||p.deepmedia.length>0?"video":"html",p.deepiframe.length>0&&o.sA(p.deepiframe[0],"layertype",p.layertype),"column"===p.type&&(p.cbg=jQuery(o.getByTag(p.p[0],"RS-COLUMN-BG")[0]),p.cbgmask=jQuery(o.getByTag(p.p[0],"RS-CBG-MASK-WRAP")[0])),p._slidelink=l[0].className.indexOf("slidelink")>=0,p._isstatic=l[0].className.indexOf("rs-layer-static")>=0,p.slidekey=p._isstatic?"staticlayers":s,p._togglelisteners=l[0].getElementsByClassName("rs-toggled-content").length>0,"text"===p.type&&(-1!==p.c[0].innerHTML.indexOf("{{total_slide_count}}")&&(p.c[0].innerHTML=p.c[0].innerHTML.replace("{{total_slide_count}}",o[r].realslideamount)),p.c[0].innerHTML.indexOf("{{current_slide_index}}")>=0))if(p._isstatic)p.metas=p.metas||{},p.metas.csi={},p.c[0].innerHTML=p.c[0].innerHTML.replace("{{current_slide_index}}","<cusli>"+o[r].realslideamount+"</cusli>"),p.metas.csi.c=p.c[0].getElementsByTagName("CUSLI")[0];else{var g=parseInt(e.slideIndex)+1;p.c[0].innerHTML=p.c[0].innerHTML.replace("{{current_slide_index}}",(g<10&&o[r].realslideamount>9?"0":"")+g)}if(p.bgcol=void 0===p.bgcol?l[0].style.background.indexOf("gradient")>=0?l[0].style.background:l[0].style.backgroundColor:p.bgcol,p.bgcol=""===p.bgcol?"rgba(0, 0, 0, 0)":p.bgcol,p.bgcol=0===p.bgcol.indexOf("rgba(0, 0, 0, 0)")&&p.bgcol.length>18?p.bgcol.replace("rgba(0, 0, 0, 0)",""):p.bgcol,p.zindex=void 0===p.zindex?l[0].style.zIndex:p.zindex,p._isgroup&&(p.frames.frame_1.timeline.waitoncall&&(p.childrenAtStartNotVisible=!0),p.pVisRequest=0),p._togglelisteners&&l.on("click",function(){o.swaptoggleState([this.id])}),void 0!==p.border)for(i in p.border=p.border.split(";"),p.bordercolor="transparent",p.border)if(p.border.hasOwnProperty(i))switch((t=p.border[i].split(":"))[0]){case"boc":p.bordercolor=t[1];break;case"bow":p.borderwidth=o.revToResp(t[1],4,0);break;case"bos":p.borderstyle=o.revToResp(t[1],4,0);break;case"bor":p.borderradius=o.revToResp(t[1],4,0)}if("svg"===p.type&&(p.svg=l.find("svg"),p.svgI=f(p.svgi,r),p.svgPath=p.svg.find(p.svgI.svgAll?"path, circle, ellipse, line, polygon, polyline, rect":"path"),p.svgH=void 0!==p.svgi&&-1===p.svgi.indexOf("oc:t")?f(p.svgh,r):{}),void 0!==p.btrans){var u=p.btrans;for(i in p.btrans={rX:0,rY:0,rZ:0,o:1},u=u.split(";"))if(u.hasOwnProperty(i))switch((t=u[i].split(":"))[0]){case"rX":p.btrans.rX=t[1];break;case"rY":p.btrans.rY=t[1];break;case"rZ":p.btrans.rZ=t[1];break;case"o":p.btrans.o=t[1]}}if(void 0!==p.tsh)for(i in p.tshadow={c:"rgba(0,0,0,0.25)",v:0,h:0,b:0},p.tsh=p.tsh.split(";"),p.tsh)if(p.tsh.hasOwnProperty(i))switch((t=p.tsh[i].split(":"))[0]){case"c":p.tshadow.c=t[1];break;case"h":p.tshadow.h=t[1];break;case"v":p.tshadow.v=t[1];break;case"b":p.tshadow.b=t[1]}if(void 0!==p.tst)for(i in p.tstroke={c:"rgba(0,0,0,0.25)",w:1},p.tst=p.tst.split(";"),p.tst)if(p.tst.hasOwnProperty(i))switch((t=p.tst[i].split(":"))[0]){case"c":p.tstroke.c=t[1];break;case"w":p.tstroke.w=t[1]}if(void 0!==p.bsh)for(i in p.bshadow={e:"c",c:"rgba(0,0,0,0.25)",v:0,h:0,b:0,s:0},p.bsh=p.bsh.split(";"),p.bsh)if(p.bsh.hasOwnProperty(i))switch((t=p.bsh[i].split(":"))[0]){case"c":p.bshadow.c=t[1];break;case"h":p.bshadow.h=t[1];break;case"v":p.bshadow.v=t[1];break;case"b":p.bshadow.b=t[1];break;case"s":p.bshadow.s=t[1];break;case"e":p.bshadow.e=t[1]}if(void 0!==p.dim)for(i in p.dim=p.dim.split(";"),p.dim)if(p.dim.hasOwnProperty(i))switch((t=p.dim[i].split(":"))[0]){case"w":p.width=t[1];break;case"h":p.height=t[1];break;case"maxw":p.maxwidth=t[1];break;case"maxh":p.maxheight=t[1];break;case"minw":p.minwidth=t[1];break;case"minh":p.minheight=t[1]}if(void 0!==p.xy&&"row"!==p.type&&"column"!==p.type)for(i in p.xy=p.xy.split(";"),p.xy)if(p.xy.hasOwnProperty(i))switch((t=p.xy[i].split(":"))[0]){case"x":p.x=t[1].replace("px","");break;case"y":p.y=t[1].replace("px","");break;case"xo":p.hoffset=t[1].replace("px","");break;case"yo":p.voffset=t[1].replace("px","")}if(!p._isnotext&&void 0!==p.text)for(i in p.text=p.text.split(";"),p.text)if(p.text.hasOwnProperty(i))switch((t=p.text[i].split(":"))[0]){case"w":p.whitespace=t[1];break;case"td":p.textDecoration=t[1];break;case"c":p.clear=t[1];break;case"f":p.float=t[1];break;case"s":p.fontsize=t[1];break;case"l":p.lineheight=t[1];break;case"ls":p.letterspacing=t[1];break;case"fw":p.fontweight=t[1];break;case"a":p.textalign=t[1]}if("column"===p.type&&void 0!==p.textDecoration&&delete p.textDecoration,void 0!==p.flcr)for(i in p.flcr=p.flcr.split(";"),p.flcr)if(p.flcr.hasOwnProperty(i))switch((t=p.flcr[i].split(":"))[0]){case"c":p.clear=t[1];break;case"f":p.float=t[1]}if(void 0!==p.padding)for(i in p.padding=p.padding.split(";"),p.padding)if(p.padding.hasOwnProperty(i))switch((t=p.padding[i].split(":"))[0]){case"t":p.paddingtop=t[1];break;case"b":p.paddingbottom=t[1];break;case"l":p.paddingleft=t[1];break;case"r":p.paddingright=t[1]}if(void 0!==p.margin)for(i in p.margin=p.margin.split(";"),p.margin)if(p.margin.hasOwnProperty(i))switch((t=p.margin[i].split(":"))[0]){case"t":p.margintop=t[1];break;case"b":p.marginbottom=t[1];break;case"l":p.marginleft=t[1];break;case"r":p.marginright=t[1]}if(void 0!==p.spike&&(p.spike=z(p.spike)),void 0!==p.corners)for(i in a=p.corners.split(";"),p.corners={},a)a.hasOwnProperty(i)&&a[i].length>0&&(p.corners[a[i]]=jQuery("<"+a[i]+"></"+a[i]+">"),p.c.append(p.corners[a[i]]));p.textalign=y(p.textalign),p.vbility=o.revToResp(p.vbility,o[r].rle,!0),p.hoffset=o.revToResp(p.hoffset,o[r].rle,0),p.voffset=o.revToResp(p.voffset,o[r].rle,0),p.x=o.revToResp(p.x,o[r].rle,"l"),p.y=o.revToResp(p.y,o[r].rle,"t"),T(l,0,r),o.sA(d,"initialised",!0),o[r].c.trigger("layerinitialised",{layer:l[0].id,slider:r})}var h=p.x[o[r].level],m=p.y[o[r].level],v=o.getGridOffset(r,e.slideIndex,p.basealign,p._isstatic),w=v[0],b=v[1],_=v[2],S=v[3];if(p.slideIndex=e.slideIndex,"updateposition"!==e.mode){if(0==p.vbility[o[r].levelForced]||"f"==p.vbility[o[r].levelForced]||w<o[r].hideLayerAtLimit&&"on"==p.layeronlimit||w<o[r].hideAllLayerAtLimit?(!0!==p.layerIsHidden&&p.p[0].classList.add("rs-layer-hidden"),p.layerIsHidden=!0):(p.layerIsHidden&&p.p[0].classList.remove("rs-layer-hidden"),p.layerIsHidden=!1),p.poster=null==p.poster&&void 0!==p.thumbimage?p.thumbimage:p.poster,"image"===p.layertype)if(p.imgOBJ={},"cover-proportional"===p.img.data("c")){o.sA(p.img[0],"owidth",o.gA(p.img[0],"owidth",p.img[0].width)),o.sA(p.img[0],"oheight",o.gA(p.img[0],"oheight",p.img[0].height));var x=o.gA(p.img[0],"owidth")/o.gA(p.img[0],"oheight"),L=w/b;p.imgOBJ=x>L&&x<=1||x<L&&x>1?{width:"100%",height:"auto",left:"c"===h||"center"===h?"50%":"left"===h||"l"===h?"0":"auto",right:"r"===h||"right"===h?"0":"auto",top:"c"===m||"center"===m?"50%":"top"===m||"t"===m?"0":"auto",bottom:"b"===m||"bottom"===m?"0":"auto",x:"c"===h||"center"===h?"-50%":"0",y:"c"===m||"center"===h?"-50%":"0"}:{height:"100%",width:"auto",left:"c"===h||"center"===h?"50%":"left"===h||"l"===h?"0":"auto",right:"r"===h||"right"===h?"0":"auto",top:"c"===m||"center"===m?"50%":"top"===m||"t"===m?"0":"auto",bottom:"b"===m||"bottom"===m?"0":"auto",x:"c"===h||"center"===h?"-50%":"0",y:"c"===m||"center"===h?"-50%":"0"}}else void 0===p.group&&"auto"===p.width[o[r].level]&&"auto"===p.height[o[r].level]&&(p.width[o[r].level]=o.gA(p.img[0],"owidth",p.img[0].width),p.height[o[r].level]=o.gA(p.img[0],"owidth",p.img[0].height)),p.imgOBJ={width:"auto"!==p.width[o[r].level]||isNaN(p.width[o[r].level])&&p.width[o[r].level].indexOf("%")>=0?"100%":"auto",height:"auto"!==p.height[o[r].level]||isNaN(p.height[o[r].level])&&p.height[o[r].level].indexOf("%")>=0?"100%":"auto"};else if("video"===p.layertype){o.manageVideoLayer(l,r,s),"rebuild"!==e.mode&&o.resetVideo(l,r,e.mode),null!=p.aspectratio&&p.aspectratio.split(":").length>1&&1==p.bgvideo&&o.prepareCoveredVideo(r,l),p.media=void 0===p.media?p.deepiframe.length>0?jQuery(p.deepiframe[0]):jQuery(p.deepmedia[0]):p.media,p.html5vid=void 0===p.html5vid?!(p.deepiframe.length>0):p.html5vid,p.mediaOBJ={display:"block"};var R=p.width[o[r].level],O=p.height[o[r].level];if(R="auto"===R?R:!o.isNumeric(R)&&R.indexOf("%")>0?p._incolumn||p._ingroup?"100%":"grid"===p.basealign?o.iWA(r,e.slideIndex)*o[r].CM.w:w:"off"!==p.rsp_bd?parseFloat(R)*o[r].CM.w+"px":parseFloat(R)+"px",O="auto"===O?O:!o.isNumeric(O)&&O.indexOf("%")>0?"grid"===p.basealign?o.iHE(r)*o[r].CM.w:b:"off"!==p.rsp_bd?parseFloat(O)*o[r].CM.h+"px":parseFloat(O)+"px",p.vd=void 0===p.vd?o[r].videos[l[0].id].ratio.split(":").length>1?o[r].videos[l[0].id].ratio.split(":")[0]/o[r].videos[l[0].id].ratio.split(":")[1]:1:p.vd,!p._incolumn||"100%"!==R&&"auto"!==O||void 0===p.ytid)-1==l[0].className.indexOf("rs-fsv")?(O="auto"===O&&void 0!==p.vd&&"auto"!==R?"100%"===R?l.width()/p.vd:R/p.vd:O,p.vidOBJ={width:R,height:O}):("grid"!==p.basealign&&(_=0,S=0),p.x=o.revToResp(0,o[r].rle,0),p.y=o.revToResp(0,o[r].rle,0),p.vidOBJ={width:R,height:o[r].autoHeight?o[r].canv.height:O}),0!=p.html5vid&&l.hasClass("rs-fsv")||(p.mediaOBJ={width:R,height:O,display:"block"}),p._ingroup&&null!==p.vidOBJ.width&&void 0!==p.vidOBJ.width&&!o.isNumeric(p.vidOBJ.width)&&p.vidOBJ.width.indexOf("%")>0&&(p.OBJUPD.lppmOBJ={minWidth:R});else{var I=l.width(),M="auto"===O?I/p.vd:O;p.vidOBJ={width:"auto",height:M},p.heightSetByVideo=!0}}p._slidelink||o[r].caches.calcResponsiveLayersList.push({a:l,b:r,c:0,d:p.rsp_bd,e:e.slideIndex}),"on"===p.rsp_ch&&"row"!==p.type&&"column"!==p.type&&"group"!==p.type&&"image"!==p.type&&"video"!==p.type&&"shape"!==p.type&&l.find("*").each(function(){var i=jQuery(this);"true"!==o.gA(this,"stylerecorder")&&!0!==o.gA(this,"stylerecorder")&&T(i,"rekursive",r),o[r].caches.calcResponsiveLayersList.push({a:i,b:r,c:"rekursive",d:p.rsp_bd,e:e.slideIndex,RSL:l})})}if("preset"!==e.mode){if(p.oldeow=p.eow,p.oldeoh=p.eoh,p.eow=l.outerWidth(!0),p.eoh=l.outerHeight(!0),void 0!==p.metas&&void 0!==p.metas.csi&&p.metas.csi.change!==o[r].focusedSlideIndex){p.metas.csi.change=o[r].focusedSlideIndex;g=parseInt(p.metas.csi.change)+1;p.metas.csi.c.innerHTML=(o[r].realslideamount>9&&g<10?"0":"")+g}if(p.imgInFirefox="image"==p.type&&"auto"==p.width[o[r].level]&&"100%"==p.height[o[r].level]&&o.isFirefox(r),p.imgInFirefox){var C=p.img.width();p.eow=0!==C?C:p.eow}if(p.eow<=0&&void 0!==p.lastknownwidth&&(p.eow=p.lastknownwidth),p.eoh<=0&&void 0!==p.lastknownheight&&(p.eoh=p.lastknownheight),void 0!==p.corners&&("text"===p.type||"button"===p.type||"shape"===p.type)){for(a in p.corners)if(p.corners.hasOwnProperty(a)){p.corners[a].css("borderWidth",p.eoh+"px");var A="rs-fcrt"===a||"rs-fcr"===a;p.corners[a].css("border"+(A?"Right":"Left"),"0px solid transparent"),p.corners[a].css("border"+("rs-fcrt"==a||"rs-bcr"==a?"Bottom":"Top")+"Color",p.bgcol)}p.eow=l.outerWidth(!0)}0==p.eow&&0==p.eoh&&(p.eow="grid"===p.basealign?o[r].content.width:o[r].module.width,p.eoh="grid"===p.basealign?o[r].content.height:o[r].module.height),p.basealign=o[r].justifyCarousel?"grid":p.basealign;var D="on"===p.rsp_o?parseInt(p.voffset[o[r].level],0)*o[r].CM.w:parseInt(p.voffset[o[r].level],0),P="on"===p.rsp_o?parseInt(p.hoffset[o[r].level],0)*o[r].CM.h:parseInt(p.hoffset[o[r].level],0),B="grid"===p.basealign?o.iWA(r,e.slideIndex)*o[r].CM.w:w,G="grid"===p.basealign?o.iHE(r)*(o[r].keepBPHeight||o[r].currentRowsHeight>o[r].gridheight[o[r].level]?1:o[r].CM.h):b;(1==o[r].gridEQModule||void 0!==p._lig&&"row"!==p.type&&"column"!==p.type&&"group"!==p.type)&&(B=void 0!==p._lig?p._lig.width():o[r].module.width,G=void 0!==p._lig?p._lig.height():o[r].module.height,_=0,S=0),"video"===p.type&&null!=p.vidOBJ&&(p.vidOBJ.height>=0&&0===p.eoh&&(p.eoh=p.vidOBJ.height),p.vidOBJ.width>=0&&0===p.eow&&(p.eow=p.vidOBJ.width)),h="c"===h||"m"===h||"center"===h||"middle"===h?B/2-p.eow/2+P:"l"===h||"left"===h?P:"r"===h||"right"===h?B-p.eow-P:"off"!==p.rsp_o?h*o[r].CM.w:h,m="m"===m||"c"===m||"center"===m||"middle"===m?G/2-p.eoh/2+D:"t"===m||"top"==m?D:"b"===m||"bottom"==m?G-p.eoh-D:"off"!==p.rsp_o?m*o[r].CM.w:m,h=p._slidelink?0:o[r].rtl&&-1==(""+p.width[o[r].level]).indexOf("%")?parseInt(h)+p.eow:h,p.calcx=parseInt(h,0)+_,p.calcy=parseInt(m,0)+S,"row"!==p.type&&"column"!==p.type?p.OBJUPD.POBJ={zIndex:p.zindex,top:p.calcy,left:p.calcx,overwrite:"auto"}:"row"!==p.type?p.OBJUPD.POBJ={zIndex:p.zindex,width:p.columnwidth,top:0,left:0,overwrite:"auto"}:"row"===p.type&&(p.OBJUPD.POBJ={zIndex:p.zindex,width:"grid"===p.basealign?B+"px":"100%",top:0,left:o[r].rtl?-1*_:_,overwrite:"auto"},p.cbreak<=o[r].level?-1===l[0].className.indexOf("rev_break_columns")&&l[0].classList.add("rev_break_columns"):l[0].className.indexOf("rev_break_columns")>0&&l[0].classList.remove("rev_break_columns"),p.rowcalcx=p.OBJUPD.POBJ.left,p.pow=p.p.outerWidth(!0)),void 0!==p.blendmode&&(p.OBJUPD.POBJ.mixBlendMode="color"===p.blendmode&&window.isSafari11?"color-burn":p.blendmode),(void 0!==p.frames.loop||p.imgInFirefox)&&(p.OBJUPD.LPOBJ={width:p.eow,height:p.eoh}),p._ingroup&&(void 0!==p._groupw&&!o.isNumeric(p._groupw)&&p._groupw.indexOf("%")>0&&(p.OBJUPD.lppmOBJ.minWidth=p._groupw),void 0!==p._grouph&&!o.isNumeric(p._grouph)&&p._grouph.indexOf("%")>0&&(p.OBJUPD.lppmOBJ.minHeight=p._grouph)),"updateposition"===e.mode&&(p.caches.POBJ_LEFT===p.OBJUPD.POBJ.left&&p.caches.POBJ_TOP===p.OBJUPD.POBJ.top||(tpGS.gsap.set(p.p,p.OBJUPD.POBJ),p.caches.POBJ_LEFT=p.OBJUPD.POBJ.left,p.caches.POBJ_TOP=p.OBJUPD.POBJ.top)),e.animcompleted&&o.animcompleted(l,r)}}},hoverReverseDone:function(e){o[e.id]._L[e.L[0].id].textDecoration&&tpGS.gsap.set(o[e.id]._L[e.L[0].id].c,{textDecoration:o[e.id]._L[e.L[0].id].textDecoration})},animcompleted:function(e,i,t){if(void 0!==o[i].videos){var a=o[i].videos[e[0].id];null!=a&&null!=a.type&&"none"!=a.type&&(1==a.aplay||"true"==a.aplay||"on"==a.aplay||"1sttime"==a.aplay?(("static"===a.slideid||"carousel"!==o[i].sliderType||e.closest("rs-slide").index()==o[i].carousel.focused||e.closest("rs-slide").index()==o[i].activeRSSlide&&o[i].carousel.oldfocused==o[i].carousel.focused||t)&&o.playVideo(e,i),o.toggleState(e.data("videotoggledby")),(a.aplay1||"1sttime"==a.aplay)&&(a.aplay1=!1,a.aplay=!1)):("no1sttime"==a.aplay&&(a.aplay=!0),o.unToggleState(e.data("videotoggledby"))))}},handleStaticLayers:function(e,i){var t=0,a=o[i].realslideamount+1;if(void 0!==o.gA(e[0],"onslides")){var r=o.gA(e[0],"onslides").split(";");for(var s in r)if(r.hasOwnProperty(s)){var n=r[s].split(":");"s"===n[0]&&(t=parseInt(n[1],0)),"e"===n[0]&&(a=parseInt(n[1],0))}}t=Math.max(0,t),a=Math.min(o[i].realslideamount,a<0?o[i].realslideamount:a),a=1!==t&&0!==t||a!==o[i].realslideamount?a:o[i].realslideamount+1,e.data("startslide",t),e.data("endslide",a),o.sA(e[0],"startslide",t),o.sA(e[0],"endslide",a)},updateLayersOnFullStage:function(e){if(o[e].caches.calcResponsiveLayersList.length>0){!0!==o[e].slideHasIframe&&!0!==o[e].fullScreenMode&&!0!==o[e].skipAttachDetach&&("carousel"===o[e].sliderType?o[e].carousel.wrap.detach():o[e].canvas.detach());for(var i=0;i<o[e].caches.calcResponsiveLayersList.length;i++)void 0!==o[e].caches.calcResponsiveLayersList[i]&&B(o[e].caches.calcResponsiveLayersList[i]);!0!==o[e].slideHasIframe&&!0!==o[e].fullScreenMode&&!0!==o[e].skipAttachDetach&&("carousel"===o[e].sliderType?o[e].c[0].appendChild(o[e].carousel.wrap[0]):o[e].c[0].appendChild(o[e].canvas[0]))}},animateTheLayers:function(e){if(void 0===e.slide)return!1;var i=e.id;if(void 0===o[i].slides[e.slide]&&"individual"!==e.slide)return!1;if("carousel"===o[i].sliderType){if("start"===e.mode&&"start"===o[i].lastATLmode){if(e.slide===o[i].lastATLslide&&(new Date).getTime()-o[i].lastATLtime<1500)return;o[i].lastATLtime=(new Date).getTime()}o[i].lastATLmode=e.mode,o[i].lastATLslide=e.slide}var t="individual"!==e.slide?o.gA(o[i].slides[e.slide],"key"):"individual",a=o[i].pr_processing_key||o[i].pr_active_key||0;o[i].focusedSlideIndex=a,o[i].caches.calcResponsiveLayersList=[],o[i].layers=o[i].layers||{},"individual"===t?o[i].layers.individual=void 0===o[i].layers.individual?"all"===o[i].carousel.showLayersAllTime?M(jQuery(o[i].c),"rs-layer","rs-layer-static"):M(jQuery(o[i].c),"rs-on-car"):o[i].layers.individual:(o[i].layers[t]=void 0===o[i].layers[t]?"all"===o[i].carousel.showLayersAllTime?[]:M(jQuery(o[i].slides[e.slide]),"rs-layer","carousel"===o[i].sliderType?"rs-on-car":void 0):o[i].layers[t],o[i].layers.static=void 0===o[i].layers.static?M(jQuery(o[i].c.find("rs-static-layers")),"rs-layer","rs-on-car"):o[i].layers.static,o[i].sbas[t]=void 0===o[i].sbas[t]?M(jQuery(o[i].slides[e.slide]),"rs-sba"):o[i].sbas[t]);var r="rebuild"===e.mode&&"carousel"===o[i].sliderType&&"individual"===t;void 0!==t&&o[i].layers[t]&&o.initLayer({id:i,slideIndex:e.slide,skey:t,mode:e.mode,animcompleted:r}),o[i].layers.static&&o.initLayer({id:i,skey:"static",slideIndex:"static",mode:e.mode,animcompleted:r}),o.updateLayersOnFullStage(i),"preset"!==e.mode||void 0!==o[i].slidePresets&&void 0!==o[i].slidePresets[e.slide]||(o[i].slidePresets=void 0===o[i].slidePresets?{}:o[i].slidePresets,o[i].slidePresets[e.slide]=!0,o[i].c.trigger("revolution.slideprepared",{slide:e.slide,key:t})),o[i].heightInLayers=o[i].module.height,o[i].widthInLayers=o[i].module.width,o[i].levelInLayers=o[i].level;var s={id:i,skey:t,slide:e.slide,key:t,mode:e.mode,index:a};window.requestAnimationFrame(function(){if(void 0===o[i].dimensionReCheck[t]?(o.updateLayerDimensions(s),!0!==o[i].doubleDimensionCheck?setTimeout(function(){o.updateLayerDimensions(s),o.updateRowZones(s)},150):o.updateRowZones(s),o[i].doubleDimensionCheck=!0,o[i].dimensionReCheck[t]=!0):o.updateRowZones(s),void 0!==t&&o[i].layers[t])for(var a in o[i].layers[t])o[i].layers[t].hasOwnProperty(a)&&o.renderLayerAnimation({layer:jQuery(o[i].layers[t][a]),id:i,mode:e.mode,caller:e.caller});if(o[i].layers.static)for(var a in o[i].layers.static)o[i].layers.static.hasOwnProperty(a)&&o.renderLayerAnimation({layer:jQuery(o[i].layers.static[a]),id:i,mode:e.mode,caller:e.caller});null!=o[i].mtl&&o[i].mtl.resume()})},updateRowZones:function(e){(void 0!==o[e.id].rowzones&&o[e.id].rowzones.length>0&&e.index>=0&&o[e.id].rowzones[Math.min(e.index,o[e.id].rowzones.length)]&&o[e.id].rowzones[Math.min(e.index,o[e.id].rowzones.length)].length>0||void 0!==o[e.id].srowzones&&o[e.id].srowzones.length>0||void 0!==o[e.id].smiddleZones&&o[e.id].smiddleZones.length>0)&&(o.updateDims(e.id),o.initLayer({id:e.id,skey:e.key,slideIndex:e.slide,mode:"updateposition"}),o.initLayer({id:e.id,skey:"static",slideIndex:"static",mode:"updateposition"}),"start"!==e.mode&&"preset"!==e.mode||o.manageNavigation(e.id))},updateLayerDimensions:function(e){var i=!1;o[e.id].caches.calcResponsiveLayersList=[],void 0===e.key||"individual"!=e.key&&void 0===o[e.id].layers[e.key]||!o.checkLayerDimensions({id:e.id,skey:e.key,slideIndex:e.slide})||(i=!0),o.initLayer({id:e.id,skey:e.key,slideIndex:e.slide,mode:"updateAndResize"}),o[e.id].layers.static&&o.checkLayerDimensions({id:e.id,skey:"static",slideIndex:"static"})&&(i=!0,o.initLayer({id:e.id,skey:"static",slideIndex:"static",mode:"updateAndResize"})),i&&o.updateLayersOnFullStage(e.id)},updateAnimatingLayerPositions:function(e){o.initLayer({id:e.id,skey:e.key,slideIndex:e.slide,mode:"updateposition"})},removeTheLayers:function(e,i,t){var a=o.gA(e[0],"key");for(var r in o[i].sloops&&o[i].sloops[a]&&o[i].sloops[a].tl&&o[i].sloops[a].tl.pause(),o[i].layers[a])o[i].layers[a].hasOwnProperty(r)&&o.renderLayerAnimation({layer:jQuery(o[i].layers[a][r]),frame:"frame_999",mode:"continue",remove:!0,id:i,allforce:t});for(var r in o[i].layers.static)o[i].layers.static.hasOwnProperty(r)&&o.renderLayerAnimation({layer:jQuery(o[i].layers.static[r]),frame:"frame_999",mode:"continue",remove:!0,id:i,allforce:t})},renderLayerAnimation:function(e){var t,a=e.layer,r=e.id,u=o[r].level,m=o[r]._L[a[0].id],v=void 0!==m.timeline?m.timeline.time():void 0,f=!1,y=!1,_="none";if(("containerResized_2"!==e.caller&&"swapSlideProgress_2"!==e.caller||!0===m.animationRendered)&&(m.animationRendered=!0,"preset"!==e.mode||!0===m.frames.frame_1.timeline.waitoncall||void 0!==m.scrollBasedOffset)){if("trigger"==e.mode&&(m.triggeredFrame=e.frame),m._isstatic){var x="carousel"===o[r].sliderType&&void 0!==o[r].carousel.oldfocused?o[r].carousel.oldfocused:void 0===o[r].pr_lastshown_key?1:parseInt(o[r].pr_lastshown_key,0)+1,k="carousel"===o[r].sliderType?void 0===o[r].pr_next_key?0===x?1:x:parseInt(o[r].pr_next_key,0)+1:void 0===o[r].pr_processing_key?x:parseInt(o[r].pr_processing_key,0)+1,L=x>=m.startslide&&x<=m.endslide,R=k>=m.startslide&&k<=m.endslide;if(_=x===m.endslide&&"continue"===e.mode||("continue"===e.mode||x===m.endslide)&&"none",!0===e.allforce||!0===_){if("continue"===e.mode&&"frame_999"===e.frame&&(R||void 0===m.lastRequestedMainFrame))return}else{if("preset"===e.mode&&(m.elementHovered||!R))return;if("rebuild"===e.mode&&!L&&!R)return;if("start"===e.mode&&R&&"frame_1"===m.lastRequestedMainFrame)return;if(("start"===e.mode||"preset"===e.mode)&&"frame_999"===m.lastRequestedMainFrame&&!0!==m.leftstage)return;if("continue"===e.mode&&"frame_999"===e.frame&&(R||void 0===m.lastRequestedMainFrame))return;if("start"===e.mode&&!R)return;if("rebuild"===e.mode&&m.elementHovered&&m._isstatic&&m.hovertimeline)return}}else"start"===e.mode&&"keep"!==m.triggercache&&(m.triggeredFrame=void 0);for(var O in"start"===e.mode&&(void 0!==m.layerLoop&&(m.layerLoop.count=0),e.frame=void 0===m.triggeredFrame?0:m.triggeredFrame),"continue"===e.mode||"trigger"===e.mode||void 0===m.timeline||m._isstatic&&!0===m.leftstage||m.timeline.pause(0),"continue"!==e.mode&&"trigger"!==e.mode||void 0===m.timeline||m.timeline.pause(),m.timeline=tpGS.gsap.timeline({paused:!0}),"text"!==m.type&&"button"!==m.type||void 0!==m.splitText&&(void 0!==m.splitTextFix||"start"!==e.mode&&"preset"!==e.mode)||(w({layer:a,id:r}),"start"===e.mode&&(m.splitTextFix=!0)),m.ford)if(m.ford.hasOwnProperty(O)){var I=m.ford[O],M=!1;if("frame_0"!==I&&"frame_hover"!==I&&"loop"!==I){if("frame_999"===I&&!m.frames[I].timeline.waitoncall&&m.frames[I].timeline.start>=o[r].duration&&!0!==e.remove&&(m.frames[I].timeline.waitoncall=!0),"start"===e.mode&&"keep"!==m.triggercache&&(m.frames[I].timeline.callstate=m.frames[I].timeline.waitoncall?"waiting":""),"trigger"===e.mode&&m.frames[I].timeline.waitoncall&&(I===e.frame?(m.frames[I].timeline.triggered=!0,m.frames[I].timeline.callstate="called"):m.frames[I].timeline.triggered=!1),"rebuild"===e.mode||m.frames[I].timeline.triggered||(m.frames[I].timeline.callstate=m.frames[I].timeline.waitoncall?"waiting":""),!1!==e.fastforward){if(("continue"===e.mode||"trigger"===e.mode)&&!1===y&&I!==e.frame)continue;if(("rebuild"===e.mode||"preset"===e.mode)&&!1===y&&void 0!==m.triggeredFrame&&I!==m.triggeredFrame)continue;(I===e.frame||"rebuild"===e.mode&&I===m.triggeredFrame)&&(y=!0)}else I===e.frame&&(y=!0);if(I!==e.frame&&m.frames[I].timeline.waitoncall&&"called"!==m.frames[I].timeline.callstate&&(f=!0),I!==e.frame&&y&&(f=!0===f&&m.frames[I].timeline.waitoncall?"skiprest":!0!==f&&f),void 0===m.hideonfirststart&&"frame_1"===I&&m.frames[I].timeline.waitoncall&&(m.hideonfirststart=!0),f&&"waiting"===m.frames[I].timeline.callstate&&"preset"===e.mode&&1!=m.firstTimeRendered){if(m._isstatic&&void 0===m.currentframe)continue;M=!0,m.firstTimeRendered=!0}else if("skiprest"===f||"called"!==m.frames[I].timeline.callstate&&f&&e.toframe!==I)continue;if("frame_999"!==I||!1!==_||"continue"!==e.mode&&"start"!==e.mode&&"rebuild"!==e.mode){m.fff="frame_1"===I&&("trigger"!==e.mode||"frame_999"===m.currentframe||"frame_0"===m.currentframe||void 0===m.currentframe),"trigger"===e.mode&&"frame_1"===e.frame&&!1===m.leftstage&&(m.fff=!1),M||(m.frames[I].timeline.callstate="called",m.currentframe=I);var C=m.frames[I],T=m.fff?m.frames.frame_0:void 0,A=tpGS.gsap.timeline(),D=tpGS.gsap.timeline(),P=m.c,B=void 0!==C.sfx&&b(C.sfx.effect,m.m,C.timeline.ease),z=C.timeline.speed/1e3,G=0,E=S({id:r,frame:C,layer:a,ease:C.timeline.ease,splitAmount:P.length,target:I,forcefilter:void 0!==m.frames.frame_hover&&void 0!==m.frames.frame_hover.filter}),F=m.fff?S({id:r,frame:T,layer:a,ease:C.timeline.ease,splitAmount:P.length,target:"frame_0"}):void 0,H=void 0!==C.mask?S({id:r,frame:{transform:{x:C.mask.x,y:C.mask.y}},layer:a,ease:E.ease,target:"mask"}):void 0,N=void 0!==H&&m.fff?S({id:r,frame:{transform:{x:T.mask.x,y:T.mask.y}},layer:a,ease:E.ease,target:"frommask"}):void 0,j=E.ease;if(E.force3D=!0,"block"===B.type&&(B.ft[0].background=C.sfx.fxc,B.ft[0].visibility="visible",B.ft[1].visibility="visible",A.add(tpGS.gsap.fromTo(B.bmask_in,z/2,B.ft[0],B.ft[1],0)),A.add(tpGS.gsap.fromTo(B.bmask_in,z/2,B.ft[1],B.t,z/2)),"frame_0"!==I&&"frame_1"!==I||(F.opacity=0)),void 0!==C.color?E.color=C.color:void 0!==m.color&&"npc"!==m.color[u]&&(E.color=m.color[u]),void 0!==T&&void 0!==T.color?F.color=T.color:void 0!==T&&void 0!==m.color&&"npc"!==m.color[u]&&(F.color=m.color[u]),void 0!==C.bgcolor?C.bgcolor.indexOf("gradient")>=0?E.background=C.bgcolor:E.backgroundColor=C.bgcolor:!0===m.bgcolinuse&&(m.bgcol.indexOf("gradient")>=0?E.background=m.bgcol:E.backgroundColor=m.bgcol),void 0!==T&&(void 0!==T.bgcolor?T.bgcolor.indexOf("gradient")>=0?F.background=T.bgcolor:F.backgroundColor=T.bgcolor:!0===m.bgcolinuse&&(m.bgcol.indexOf("gradient")>=0?F.background=m.bgcol:F.backgroundColor=m.bgcol)),void 0!==m.splitText&&!1!==m.splitText)for(var W in i)if(void 0!==C[i[W]]&&!m.quickRendering){var V=m.splitText[i[W]],U=S({id:r,frame:C,source:i[W],ease:j,layer:a,splitAmount:V.length,target:I+"_"+i[W]}),X=m.fff?S({id:r,frame:T,ease:U.ease,source:i[W],layer:a,splitAmount:V.length,target:"frame_0_"+i[W]}):void 0,Y=m.frames[I].dosplit?void 0===C[i[W]].delay?.05:C[i[W]].delay/100:0;m.color[u]===E.color&&"frame_1"===I||(U.color=E.color),void 0!==F&&m.color[u]!==F.color&&(X.color=F.color),void 0!==X&&X.color!==E.color&&(U.color=E.color);var Q=o.clone(U),J=m.fff?o.clone(X):void 0,q=C[i[W]].dir;delete Q.dir,Q.data={splitted:!0},Q.stagger="center"===q||"edge"===q?l({each:Y,offset:Y/2,from:q}):{each:Y,from:q},Q.duration=z,void 0!==J&&(void 0!==J.opacity&&(o.ISM||window.isSafari11)&&(J.opacity=Math.max(.001,parseFloat(J.opacity))),delete J.dir),m.fff?A.add(D.fromTo(V,J,Q),0):A.add(D.to(V,Q),0),G=Math.max(G,V.length*Y)}if(z+=G,void 0===t&&(t="isometric"===o[r].perspectiveType?0:"local"===o[r].perspectiveType?void 0!==E.transformPerspective?E.transformPerspective:m.fff&&void 0!==F.transfromPerspective?F.transfromPerspective:o[r].perspective:o[r].perspective),m.knowTransformPerspective=t,m.fsom&&(void 0!==E.filter||m.fff&&void 0!==F.filter)?(H.filter=E.filter,H["-webkit-filter"]=E.filter,delete E.filter,delete E["-webkit-filter"],m.fff&&void 0!==F.filter&&((N=N||{}).filter=F.filter,N["-webkit-filter"]=F.filter,delete F.filter,delete F["-webkit-filter"]),m.forceFsom=!0):m.forceFsom=!1,m.useMaskAnimation=m.pxundermask||void 0!==H&&(void 0!==T&&"hidden"===T.mask.overflow||"hidden"===C.mask.overflow),m.useMaskAnimation||m.forceFsom)m.useMaskAnimation?A.add(tpGS.gsap.to(m.m,.001,{overflow:"hidden"}),0):A.add(tpGS.gsap.to(m.m,.001,{overflow:"visible"}),0),"column"===m.type&&m.useMaskAnimation&&A.add(tpGS.gsap.to(m.cbgmask,.001,{overflow:"hidden"}),0),m.btrans&&(N&&(N.rotationX=m.btrans.rX,N.rotationY=m.btrans.rY,N.rotationZ=m.btrans.rZ,N.opacity=m.btrans.o),H.rotationX=m.btrans.rX,H.rotationY=m.btrans.rY,H.rotationZ=m.btrans.rZ,H.opacity=m.btrans.o),m.fff?A.add(tpGS.gsap.fromTo([m.m,m.cbgmask],z,o.clone(N),o.clone(H)),.001):A.add(tpGS.gsap.to([m.m,m.cbgmask],z,o.clone(H)),.001);else if(void 0!==m.btrans){var Z={x:0,y:0,filter:"none",opacity:m.btrans.o,rotationX:m.btrans.rX,rotationY:m.btrans.rY,rotationZ:m.btrans.rZ,overflow:"visible"};0===m.btrans.rX&&0==m.btrans.rY||(m.maskHasPerspective=!0,Z.transformPerspective=t),A.add(tpGS.gsap.to(m.m,.001,Z),0)}else A.add(tpGS.gsap.to(m.m,.001,{clearProps:"transform",overflow:"visible"}),0);E.force3D="auto",m.fff?(E.visibility="visible",void 0!==m.cbg&&A.fromTo(m.cbg,z,F,E,0),o[r].BUG_safari_clipPath&&(F.clipPath||E.clipPath||m.spike),void 0!==m.cbg&&"column"===m.type?A.fromTo(P,z,s(F),s(E),0):A.fromTo(P,z,F,E,0),A.invalidate()):("frame_999"!==m.frame&&(E.visibility="visible"),void 0!==m.cbg&&A.to(m.cbg,z,E,0),void 0!==m.cbg&&"column"===m.type?A.to(P,z,s(E),0):A.to(P,z,E,0)),void 0!==j&&"object"!=typeof j&&"function"!=typeof j&&j.indexOf("SFXBounce")>=0&&A.to(P,z,{scaleY:.5,scaleX:1.3,ease:E.ease+"-squash",transformOrigin:"bottom"},1e-4);var K="trigger"!==e.mode&&(!0!==f&&"skiprest"!==f||"rebuild"!==e.mode)||e.frame===I||void 0===C.timeline.start||!o.isNumeric(C.timeline.start)?"+=0"===C.timeline.start||void 0===C.timeline.start?"+=0.05":parseInt(C.timeline.start,0)/1e3:"+="+parseInt(C.timeline.startRelative,0)/1e3;m.timeline.addLabel(I,K),m.timeline.add(A,K),m.timeline.addLabel(I+"_end","+=0.01"),A.eventCallback("onStart",c,[{id:r,frame:I,L:a,tPE:t}]),"true"==m.animationonscroll||1==m.animationonscroll?(A.eventCallback("onUpdate",p,[{id:r,frame:I,L:a}]),A.smoothChildTiming=!0):A.eventCallback("onUpdate",p,[{id:r,frame:I,L:a}]),A.eventCallback("onComplete",g,[{id:r,frame:I,L:a,tPE:t}])}}}if(void 0!==m.frames.loop){var $=parseInt(m.frames.loop.timeline.speed,0)/1e3,ee=parseInt(m.frames.loop.timeline.start)/1e3||0,ie="trigger"!==e.mode&&"frame_999"!==e.frame||"frame_999"!==e.frame?.2:0,te=ee+ie;m.loop={root:tpGS.gsap.timeline({}),preset:tpGS.gsap.timeline({}),move:tpGS.gsap.timeline({repeat:-1,yoyo:m.frames.loop.timeline.yoyo_move}),rotate:tpGS.gsap.timeline({repeat:-1,yoyo:m.frames.loop.timeline.yoyo_rotate}),scale:tpGS.gsap.timeline({repeat:-1,yoyo:m.frames.loop.timeline.yoyo_scale}),filter:tpGS.gsap.timeline({repeat:-1,yoyo:m.frames.loop.timeline.yoyo_filter})};var ae=m.frames.loop.frame_0,re=m.frames.loop.frame_999,oe="blur("+parseInt(ae.blur||0,0)+"px) grayscale("+parseInt(ae.grayscale||0,0)+"%) brightness("+parseInt(ae.brightness||100,0)+"%)",se="blur("+(re.blur||0)+"px) grayscale("+(re.grayscale||0)+"%) brightness("+(re.brightness||100)+"%)";if(m.loop.root.add(m.loop.preset,0),m.loop.root.add(m.loop.move,ie),m.loop.root.add(m.loop.rotate,ie),m.loop.root.add(m.loop.scale,ie),m.loop.root.add(m.loop.filter,ie),"blur(0px) grayscale(0%) brightness(100%)"===oe&&"blur(0px) grayscale(0%) brightness(100%)"===se&&(oe="none",se="none"),re.originX=ae.originX,re.originY=ae.originY,re.originZ=ae.originZ,void 0===t&&(t="isometric"===o[r].perspectiveType?0:"local"===o[r].perspectiveType&&void 0!==E?void 0!==E.transformPerspective?E.transformPerspective:m.fff&&void 0!==F.transfromPerspective?F.transfromPerspective:o[r].perspective:o[r].perspective),m.frames.loop.timeline.curved){var ne=parseInt(m.frames.loop.timeline.radiusAngle,0)||0,de=[{x:(ae.x-ae.xr)*o[r].CM.w,y:0,z:(ae.z-ae.zr)*o[r].CM.w},{x:0,y:(ae.y+ae.yr)*o[r].CM.w,z:0},{x:(re.x+re.xr)*o[r].CM.w,y:0,z:(re.z+re.zr)*o[r].CM.w},{x:0,y:(re.y-re.yr)*o[r].CM.w,z:0}],le={type:"thru",curviness:m.frames.loop.timeline.curviness,path:[],autoRotate:m.frames.loop.timeline.autoRotate};for(var ce in de)de.hasOwnProperty(ce)&&(le.path[ce]=de[ne],ne=++ne==de.length?0:ne);("trigger"!==e.mode&&"frame_999"!==e.frame||"frame_999"!==e.frame)&&m.loop.preset.fromTo(m.lp,ie,{"-webkit-filter":oe,filter:oe,x:0,y:0,z:0,minWidth:m._incolumn||m._ingroup?"100%":void 0===m.eow?0:m.eow,minHeight:m._incolumn||m._ingroup?"100%":void 0===m.eoh?0:m.eoh,scaleX:1,scaleY:1,skewX:0,skewY:0,rotationX:0,rotationY:0,rotationZ:0,transformPerspective:t,transformOrigin:re.originX+" "+re.originY+" "+re.originZ,opacity:1},d({x:le.path[3].x,y:le.path[3].y,z:le.path[3].z,scaleX:ae.scaleX,skewX:ae.skewX,skewY:ae.skewY,scaleY:ae.scaleY,rotationX:ae.rotationX,rotationY:ae.rotationY,rotationZ:ae.rotationZ,"-webkit-filter":oe,filter:oe,ease:"sine.inOut",opacity:ae.opacity}),0),n(le)&&m.loop.move.to(m.lp,m.frames.loop.timeline.yoyo_move?$/2:$,{motionPath:le,ease:m.frames.loop.timeline.ease})}else("trigger"!==e.mode&&"frame_999"!==e.frame||"frame_999"!==e.frame)&&m.loop.preset.fromTo(m.lp,ie,{"-webkit-filter":oe,filter:oe,x:0,y:0,z:0,minWidth:m._incolumn||m._ingroup?"100%":void 0===m.eow?0:m.eow,minHeight:m._incolumn||m._ingroup?"100%":void 0===m.eoh?0:m.eoh,scaleX:1,scaleY:1,skewX:0,skewY:0,rotationX:0,rotationY:0,rotationZ:0,transformPerspective:t,transformOrigin:re.originX+" "+re.originY+" "+re.originZ,opacity:1},d({x:ae.x*o[r].CM.w,y:ae.y*o[r].CM.w,z:ae.z*o[r].CM.w,scaleX:ae.scaleX,skewX:ae.skewX,skewY:ae.skewY,scaleY:ae.scaleY,rotationX:ae.rotationX,rotationY:ae.rotationY,rotationZ:ae.rotationZ,ease:"sine.out",opacity:ae.opacity,"-webkit-filter":oe,filter:oe}),0),m.loop.move.to(m.lp,m.frames.loop.timeline.yoyo_move?$/2:$,{x:re.x*o[r].CM.w,y:re.y*o[r].CM.w,z:re.z*o[r].CM.w,ease:m.frames.loop.timeline.ease});m.loop.rotate.to(m.lp,m.frames.loop.timeline.yoyo_rotate?$/2:$,{rotationX:re.rotationX,rotationY:re.rotationY,rotationZ:re.rotationZ,ease:m.frames.loop.timeline.ease}),m.loop.scale.to(m.lp,m.frames.loop.timeline.yoyo_scale?$/2:$,d({scaleX:re.scaleX,scaleY:re.scaleY,skewX:re.skewX,skewY:re.skewY,ease:m.frames.loop.timeline.ease}));var pe={opacity:re.opacity||1,ease:m.frames.loop.timeline.ease,"-webkit-filter":se,filter:se};m.loop.filter.to(m.lp,m.frames.loop.timeline.yoyo_filter?$/2:$,pe),m.timeline.add(m.loop.root,te)}if(void 0!==m.frames.frame_hover&&("start"===e.mode||void 0===m.hoverframeadded)){m.hoverframeadded=!0;var ge=m.frames.frame_hover.timeline.speed/1e3;ge=0===ge?1e-5:ge,m.hoverlistener||(m.hoverlistener=!0,o.document.on("mouseenter mousemove",("column"===m.type?"#"+m.cbg[0].id+",":"")+"#"+m.c[0].id,function(e){if("mousemove"!==e.type||!0!==m.ignoremousemove){if(m.animationonscroll||m.readyForHover){if(m.elementHovered=!0,m.hovertimeline||(m.hovertimeline=tpGS.gsap.timeline({paused:!0})),0==m.hovertimeline.progress()&&(void 0===m.lastHoveredTimeStamp||(new Date).getTime()-m.lastHoveredTimeStamp>150)&&(m.ignoremousemove=!0,m.hovertimeline.to([m.m,m.cbgmask],ge,{overflow:m.frames.frame_hover.mask?"hidden":"visible"},0),"column"===m.type&&m.hovertimeline.to(m.cbg,ge,o.clone(h(m.frames.frame_hover,m.cbg,{bgCol:m.bgcol,bg:m.styleProps.background})),0),"text"!==m.type&&"button"!==m.type||void 0===m.splitText||!1===m.splitText||m.hovertimeline.to([m.splitText.lines,m.splitText.words,m.splitText.chars],ge,{color:m.frames.frame_hover.color,ease:m.frames.frame_hover.transform.ease},0),"column"===m.type?m.hovertimeline.to(m.c,ge,s(o.clone(h(m.frames.frame_hover,m.c,{bgCol:m.bgcol,bg:m.styleProps.background}))),0):m.hovertimeline.to(m.c,ge,o.clone(h(m.frames.frame_hover,m.c,{bgCol:m.bgcol,bg:m.styleProps.background})),0),"svg"===m.type)){m.svgHTemp=o.clone(m.svgH),delete m.svgHTemp.svgAll;var i=Array.isArray(m.svgHTemp.fill)?m.svgHTemp.fill[o[r].level]:m.svgHTemp.fill;m.svgHTemp.fill=i,m.hovertimeline.to(m.svg,ge,m.svgHTemp,0),m.svg.length<=0&&(m.svg=a.find("svg")),m.svgPath.length<=0&&(m.svgPath=m.svg.find(m.svgI.svgAll?"path, circle, ellipse, line, polygon, polyline, rect":"path")),m.hovertimeline.to(m.svgPath,ge,{fill:i},0)}m.hovertimeline.play()}m.lastHoveredTimeStamp=(new Date).getTime()}}),o.document.on("mouseleave",("column"===m.type?"#"+m.cbg[0].id+",":"")+"#"+m.c[0].id,function(){m.elementHovered=!1,(m.animationonscroll||m.readyForHover)&&void 0!==m.hovertimeline&&(m.hovertimeline.reverse(),m.hovertimeline.eventCallback("onReverseComplete",o.hoverReverseDone,[{id:r,L:a}]))}))}if(M||(m.lastRequestedMainFrame="start"===e.mode?"frame_1":"continue"===e.mode?void 0===e.frame?m.currentframe:e.frame:m.lastRequestedMainFrame),void 0!==e.totime?m.tSTART=e.totime:void 0!==v&&void 0===e.frame?m.tSTART=v:void 0!==e.frame?m.tSTART=e.frame:m.tSTART=0,0===m.tSTART&&void 0===m.startedAnimOnce&&void 0===m.leftstage&&void 0===m.startedAnimOnce&&!0===m.hideonfirststart&&"preset"===e.mode&&(o[r]._L[a[0].id].pVisRequest=0,m.hideonfirststart=!1),"frame_999"!==m.tSTART&&"frame_999"!==m.triggeredFrame||!m.leftstage&&void 0!==m.startedAnimOnce){if("true"!=m.animationonscroll&&1!=m.animationonscroll?m.timeline.play(m.tSTART):m.timeline.time(m.tSTART),jQuery.inArray(m.type,["group","row","column"])>=0&&void 0!==e.frame){if(void 0===m.childrenJS)for(var W in m.childrenJS={},o[r]._L)void 0!==o[r]._L[W]._lig&&void 0!==o[r]._L[W]._lig[0]&&o[r]._L[W]._lig[0].id===a[0].id&&o[r]._L[W]._lig[0].id!==o[r]._L[W].c[0].id&&(m.childrenJS[o[r]._L[W].c[0].id]=o[r]._L[W].c);e.frame="0"==e.frame?"frame_0":e.frame,e.frame="1"==e.frame?"frame_1":e.frame,e.frame="999"==e.frame?"frame_999":e.frame;var ue=void 0===e.totime?void 0!==m.frames[e.frame].timeline.startAbsolute?parseInt(m.frames[e.frame].timeline.startAbsolute,0)/1e3:void 0!==m.frames[e.frame].timeline.start?o.isNumeric(m.frames[e.frame].timeline.start)?parseInt(m.frames[e.frame].timeline.start,0)/1e3:0:.001:e.totime;if(!0===e.updateChildren)for(var W in m.childrenJS)m.childrenJS.hasOwnProperty(W)&&o.renderLayerAnimation({layer:m.childrenJS[W],fastforward:!1,id:r,mode:"continue",updateChildren:!0,totime:ue});else for(var W in m.childrenJS)m.childrenJS.hasOwnProperty(W)&&o[r]._L[W].pausedTrueParrent&&(o.renderLayerAnimation({layer:m.childrenJS[W],fastforward:!1,id:r,mode:"continue",updateChildren:!0,totime:ue}),o[r]._L[W].pausedTrueParrent=!1)}}else;}}});var s=function(e){var i=o.clone(e);return delete i.backgroundColor,delete i.background,delete i.backgroundImage,delete i.borderSize,delete i.borderStyle,delete i["backdrop-filter"],i},n=function(e){if(void 0!==e&&void 0!==e.path&&Array.isArray(e.path)){var i=0,t=0;for(var a in e.path)!e.path.hasOwnProperty(a)||i>0||t>0||(i+=e.path[a].x,t+=e.path[a].y);return 0!=i||0!=t}},d=function(e){return void 0===e.skewX&&delete e.skewX,void 0===e.skewY&&delete e.skewY,e},l=function(e){e.from="edge"===e.from?"edges":e.from;var i=tpGS.gsap.utils.distribute(e);return function(t,a,r){return i(t,a,r)+(t<=r.length/2?0:e.offset||0)}},c=function(e){o[e.id].BUG_safari_clipPath&&e.L[0].classList.remove("rs-pelock"),(o[e.id]._L[e.L[0].id]._ingroup||o[e.id]._L[e.L[0].id]._incolumn||o[e.id]._L[e.L[0].id]._inrow)&&void 0!==o[e.id]._L[o[e.id]._L[e.L[0].id]._ligid]&&void 0!==o[e.id]._L[o[e.id]._L[e.L[0].id]._ligid].timeline&&(o[e.id]._L[o[e.id]._L[e.L[0].id]._ligid].timeline.isActive()||void 0===o[e.id]._L[e.L[0].id]||void 0===o[e.id]._L[e.L[0].id].frames[o[e.id]._L[e.L[0].id].timeline.currentLabel()]||(null==o[e.id]._L[o[e.id]._L[e.L[0].id]._ligid].timezone||o[e.id]._L[o[e.id]._L[e.L[0].id]._ligid].timezone.to<=parseInt(o[e.id]._L[e.L[0].id].frames[o[e.id]._L[e.L[0].id].timeline.currentLabel()].timeline.start,0))&&!0!==o[e.id]._L[e.L[0].id].animOnScrollForceDisable&&(o[e.id]._L[e.L[0].id].pausedTrueParrent=!0,o[e.id]._L[e.L[0].id].timeline.pause()));var i=o[e.id]._L[e.L[0].id],t=i.hovertimeline;t&&t.time()>0&&(t.pause(),t.time(0),t.kill(),delete i.hovertimeline),delete o[e.id]._L[e.L[0].id].childrenAtStartNotVisible,o[e.id]._L[e.L[0].id].pVisRequest=1;var a={layer:e.L};o[e.id]._L[e.L[0].id].ignoremousemove=!1,o[e.id]._L[e.L[0].id].leftstage=!1,o[e.id]._L[e.L[0].id].readyForHover=!1,void 0!==o[e.id]._L[e.L[0].id].layerLoop&&o[e.id]._L[e.L[0].id].layerLoop.from===e.frame&&o[e.id]._L[e.L[0].id].layerLoop.count++,"frame_1"===e.frame&&"Safari"===window.RSBrowser&&void 0===o[e.id]._L[e.L[0].id].safariRenderIssue&&(tpGS.gsap.set([o[e.id]._L[e.L[0].id].c],{opacity:1}),o[e.id]._L[e.L[0].id].safariRenderIssue=!0),"frame_999"!==e.frame&&(o[e.id]._L[e.L[0].id].startedAnimOnce=!0,o[e.id]._L[e.L[0].id].pPeventsRequest=o[e.id]._L[e.L[0].id].noPevents?"none":"auto"),a.eventtype="frame_0"===e.frame||"frame_1"===e.frame?"enterstage":"frame_999"===e.frame?"leavestage":"framestarted",o[e.id]._L[e.L[0].id]._ingroup&&!0!==o[e.id]._L[o[e.id]._L[e.L[0].id]._lig[0].id].frames.frame_1.timeline.waitoncall&&(o[e.id]._L[o[e.id]._L[e.L[0].id]._lig[0].id].pVisRequest=1),o.requestLayerUpdates(e.id,a.eventtype,e.L[0].id,void 0!==o[e.id]._L[e.L[0].id].frames[e.frame]&&void 0!==o[e.id]._L[e.L[0].id].frames[e.frame].timeline&&0==o[e.id]._L[e.L[0].id].frames[e.frame].timeline.usePerspective?e.tPE:"ignore"),a.id=e.id,a.layerid=e.L[0].id,a.layertype=o[e.id]._L[e.L[0].id].type,a.frame_index=e.frame,a.layersettings=o[e.id]._L[e.L[0].id],o[e.id].c.trigger("revolution.layeraction",[a]),"enterstage"===a.eventtype&&o.toggleState(o[e.id]._L[e.L[0].id].layertoggledby),"frame_1"===e.frame&&o.animcompleted(e.L,e.id)},p=function(e){"frame_999"===e.frame&&(o[e.id]._L[e.L[0].id].pVisRequest=1,o[e.id]._L[e.L[0].id].pPeventsRequest=o[e.id]._L[e.L[0].id].noPevents?"none":"auto",o[e.id]._L[e.L[0].id].leftstage=!1,window.requestAnimationFrame(function(){o.requestLayerUpdates(e.id,"update",e.L[0].id)}))},g=function(e){var i=!0;if("column"===o[e.id]._L[e.L[0].id].type||"row"===o[e.id]._L[e.L[0].id].type||"group"===o[e.id]._L[e.L[0].id].type){var t=o[e.id]._L[e.L[0].id].timeline.currentLabel(),a=jQuery.inArray(t,o[e.id]._L[e.L[0].id].ford);a++,a=o[e.id]._L[e.L[0].id].ford.length>a?o[e.id]._L[e.L[0].id].ford[a]:t,void 0!==o[e.id]._L[e.L[0].id].frames[a]&&void 0!==o[e.id]._L[e.L[0].id].frames[t]&&(o[e.id]._L[e.L[0].id].timezone={from:parseInt(o[e.id]._L[e.L[0].id].frames[t].timeline.startAbsolute,0),to:parseInt(o[e.id]._L[e.L[0].id].frames[a].timeline.startAbsolute,0)})}if("frame_999"!==e.frame&&o[e.id].isEdge&&"shape"===o[e.id]._L[e.L[0].id].type){var r=o[e.id]._L[e.L[0].id].c[0].style.opacity;o[e.id]._L[e.L[0].id].c[0].style.opacity=r-1e-4,tpGS.gsap.set(o[e.id]._L[e.L[0].id].c[0],{opacity:r-.001,delay:.05}),tpGS.gsap.set(o[e.id]._L[e.L[0].id].c[0],{opacity:r,delay:.1})}var s={};s.layer=e.L,s.eventtype="frame_0"===e.frame||"frame_1"===e.frame?"enteredstage":"frame_999"===e.frame?"leftstage":"frameended",o[e.id]._L[e.L[0].id].readyForHover=!0,s.layertype=o[e.id]._L[e.L[0].id].type,s.frame_index=e.frame,s.layersettings=o[e.id]._L[e.L[0].id],o[e.id].c.trigger("revolution.layeraction",[s]),"frame_999"===e.frame&&"leftstage"===s.eventtype?(o[e.id]._L[e.L[0].id].leftstage=!0,o[e.id]._L[e.L[0].id].pVisRequest=0,o[e.id]._L[e.L[0].id].pPeventsRequest="none",i=!1,window.requestAnimationFrame(function(){o.requestLayerUpdates(e.id,"leftstage",e.L[0].id)})):(e.L[0].id,void 0!==o[e.id]._L[e.L[0].id].frames[e.frame]&&void 0!==o[e.id]._L[e.L[0].id].frames[e.frame].timeline&&0==o[e.id]._L[e.L[0].id].frames[e.frame].timeline.usePerspective&&window.requestAnimationFrame(function(){o.requestLayerUpdates(e.id,"frameended",e.L[0].id,e.tPE)})),"leftstage"===s.eventtype&&void 0!==o[e.id].videos&&void 0!==o[e.id].videos[e.L[0].id]&&o.stopVideo&&o.stopVideo(e.L,e.id),"column"===o[e.id]._L[e.L[0].id].type&&tpGS.gsap.to(o[e.id]._L[e.L[0].id].cbg,.01,{visibility:"visible"}),"leftstage"===s.eventtype&&(o.unToggleState(e.layertoggledby),"video"===o[e.id]._L[e.L[0].id].type&&o.resetVideo&&setTimeout(function(){o.resetVideo(e.L,e.id)},100)),o[e.id].BUG_safari_clipPath&&!i&&e.L[0].classList.add("rs-pelock"),void 0!==o[e.id]._L[e.L[0].id].layerLoop&&o[e.id]._L[e.L[0].id].layerLoop.to===e.frame&&(-1==o[e.id]._L[e.L[0].id].layerLoop.repeat||o[e.id]._L[e.L[0].id].layerLoop.repeat>o[e.id]._L[e.L[0].id].layerLoop.count)&&o.renderLayerAnimation({layer:o[e.id]._L[e.L[0].id].c,frame:o[e.id]._L[e.L[0].id].layerLoop.from,updateChildren:o[e.id]._L[e.L[0].id].layerLoop.children,mode:"continue",fastforward:!0===o[e.id]._L[e.L[0].id].layerLoop.keep,id:e.id})},u=function(e){if(void 0===e)return"";var i="";return o.isChrome8889&&0===e.blur&&(e.blur=.05),i=void 0!==e.blur?"blur("+(e.blur||0)+"px)":"",i+=void 0!==e.grayscale?(i.length>0?" ":"")+"grayscale("+(e.grayscale||0)+"%)":"",""===(i+=void 0!==e.brightness?(i.length>0?" ":"")+"brightness("+(e.brightness||100)+"%)":"")?"none":i},h=function(e,i,t){var a,r=o.clone(e.transform);if((r.originX||r.originY||r.originZ)&&(r.transformOrigin=(void 0===r.originX?"50%":r.originX)+" "+(void 0===r.originY?"50%":r.originY)+" "+(void 0===r.originZ?"50%":r.originZ),delete r.originX,delete r.originY,delete r.originZ),void 0!==e&&void 0!==e.filter&&(r.filter=u(e.filter),r["-webkit-filter"]=r.filter),r.color=void 0===r.color?"rgba(255,255,255,1)":r.color,r.force3D="auto",void 0!==r.borderRadius&&((a=r.borderRadius.split(" ")).length,r.borderTopLeftRadius=a[0],r.borderTopRightRadius=a[1],r.borderBottomRightRadius=a[2],r.borderBottomLeftRadius=a[3],delete r.borderRadius),void 0!==r.borderWidth&&((a=r.borderWidth.split(" ")).length,r.borderTopWidth=a[0],r.borderRightWidth=a[1],r.borderBottomWidth=a[2],r.borderLeftWidth=a[3],delete r.borderWidth),void 0===t.bg||-1===t.bg.indexOf("url")){var s=-1!==t.bgCol.search("gradient"),n=r.backgroundImage&&"string"==typeof r.backgroundImage&&-1!==r.backgroundImage.search("gradient");n&&s?(180!==v(t.bgCol)&&180==v(r.backgroundImage)&&(r.backgroundImage=m(r.backgroundImage,180)),r.backgroundImage=tpGS.getSSGColors(t.bgCol,r.backgroundImage,void 0===r.gs?"fading":r.gs).to):n&&!s?r.backgroundImage=tpGS.getSSGColors(t.bgCol,r.backgroundImage,void 0===r.gs?"fading":r.gs).to:!n&&s&&(r.backgroundImage=tpGS.getSSGColors(t.bgCol,r.backgroundColor,void 0===r.gs?"fading":r.gs).to)}return delete r.gs,r},m=function(e,i){var t=(e=e.split("("))[0];return e.shift(),t+"("+i+"deg, "+e.join("(")},v=function(e){if(-1!==e.search("deg,")){var i=e.split("deg,")[0];if(-1!==i.search(/\(/))return parseInt(i.split("(")[1],10)}return 180},f=function(e,i){if(void 0!==e&&e.indexOf("oc:t")>=0)return{};e=void 0===e?"":e.split(";");var t={fill:o.revToResp("#ffffff",o[i].rle),stroke:"transparent","stroke-width":"0px","stroke-dasharray":"0","stroke-dashoffset":"0"};for(var a in e)if(e.hasOwnProperty(a)){var r=e[a].split(":");switch(r[0]){case"c":t.fill=o.revToResp(r[1],o[i].rle,void 0,"||");break;case"sw":t["stroke-width"]=r[1];break;case"sc":t.stroke=r[1];break;case"so":t["stroke-dashoffset"]=r[1];break;case"sa":t["stroke-dasharray"]=r[1];break;case"sall":t.svgAll=r[1]}}return t},y=function(e){return"c"===e?"center":"l"===e?"left":"r"===e?"right":e},w=function(e){var i=o[e.id]._L[e.layer[0].id],t=!1;if(i.splitText&&!1!==i.splitText&&i.splitText.revert(),"text"===i.type||"button"===i.type){for(var a in i.frames)if(void 0!==i.frames[a].chars||void 0!==i.frames[a].words||void 0!==i.frames[a].lines){t=!0;break}i.splitText=!!t&&new tpGS.SplitText(i.c,{type:"lines,words,chars",wordsClass:"rs_splitted_words",linesClass:"rs_splitted_lines",charsClass:"rs_splitted_chars"})}else i.splitText=!1},b=function(e,i,t){if(void 0!==e&&e.indexOf("block")>=0){var a={};switch(0===i[0].getElementsByClassName("tp-blockmask_in").length&&(i.append('<div class="tp-blockmask_in"></div>'),i.append('<div class="tp-blockmask_out"></div>')),t=void 0===t?"power3.inOut":t,a.ft=[{scaleY:1,scaleX:0,transformOrigin:"0% 50%"},{scaleY:1,scaleX:1,ease:t,immediateRender:!1}],a.t={scaleY:1,scaleX:0,transformOrigin:"100% 50%",ease:t,immediateRender:!1},a.bmask_in=i.find(".tp-blockmask_in"),a.bmask_out=i.find(".tp-blockmask_out"),a.type="block",e){case"blocktoleft":case"blockfromright":a.ft[0].transformOrigin="100% 50%",a.t.transformOrigin="0% 50%";break;case"blockfromtop":case"blocktobottom":a.ft=[{scaleX:1,scaleY:0,transformOrigin:"50% 0%"},{scaleX:1,scaleY:1,ease:t,immediateRender:!1}],a.t={scaleX:1,scaleY:0,transformOrigin:"50% 100%",ease:t,immediateRender:!1};break;case"blocktotop":case"blockfrombottom":a.ft=[{scaleX:1,scaleY:0,transformOrigin:"50% 100%"},{scaleX:1,scaleY:1,ease:t,immediateRender:!1}],a.t={scaleX:1,scaleY:0,transformOrigin:"50% 0%",ease:t,immediateRender:!1}}return a.ft[1].overwrite="auto",a.t.overwrite="auto",a}return!1},_=function(e,i,t,a,r){return 0===o[r].sdir||void 0===i?e:("mask"===t?a="x"===a?"mX":"y"===a?"mY":a:"chars"===t?a="x"===a?"cX":"y"===a?"cY":"dir"===a?"cD":a:"words"===t?a="x"===a?"wX":"y"===a?"wY":"dir"===a?"wD":a:"lines"===t&&(a="x"===a?"lX":"y"===a?"lY":"dir"===a?"lD":a),void 0===i[a]||!1===i[a]?e:void 0!==i&&!0===i[a]?"t"===e||"top"===e?"b":"b"===e||"bottom"===e?"t":"l"===e||"left"===e?"r":"r"===e||"right"===e?"l":-1*parseFloat(e)+((""+e).indexOf("px")>=0?"px":(""+e).indexOf("%")>=0?"%":""):void 0)},S=function(e){var i,t=o[e.id]._L[e.layer[0].id],a=void 0===e.source?o.clone(e.frame.transform):o.clone(e.frame[e.source]),r={originX:"50%",originY:"50%",originZ:"0"},s=void 0!==t._lig?o[e.id]._L[t._lig[0].id].eow:o[e.id].conw,n=void 0!==t._lig?o[e.id]._L[t._lig[0].id].eoh:o[e.id].conh;for(var d in a)if(a.hasOwnProperty(d)){if(a[d]="object"==typeof a[d]?a[d][o[e.id].level]:a[d],"inherit"===a[d]||"delay"===d||"direction"===d||"use"===d)delete a[d];else if("originX"===d||"originY"===d||"originZ"===d)r[d]=a[d],delete a[d];else if(o.isNumeric(a[d],0))a[d]=_(a[d],e.frame.reverse,e.target,d,e.id,e.id);else if("r"===a[d][0]&&"a"===a[d][1]&&"("===a[d][3])a[d]=a[d].replace("ran","random");else if(a[d].indexOf("cyc(")>=0){var l=a[d].replace("cyc(","").replace(")","").replace("[","").replace("]","").split("|");a[d]=new function(e){return tpGS.gsap.utils.wrap(l,void 0)}}else if(a[d].indexOf("%")>=0&&o.isNumeric(i=parseInt(a[d],0)))a[d]="x"===d?_((t.eow||0)*i/100,e.frame.reverse,e.target,d,e.id):"y"===d?_((t.eoh||0)*i/100,e.frame.reverse,e.target,d,e.id):a[d];else{a[d]=a[d].replace("[","").replace("]",""),a[d]=_(a[d],e.frame.reverse,e.target,d,e.id,e.id);var c={t:0,b:0};switch("row"===t.type&&("rev_row_zone_top"===t.zone&&void 0!==o[e.id].topZones[t.slideIndex]&&void 0!==o[e.id].topZones[t.slideIndex][0]?c={t:0,b:0}:"rev_row_zone_middle"===t.zone&&void 0!==o[e.id].middleZones[t.slideIndex]&&void 0!==o[e.id].middleZones[t.slideIndex][0]?c={t:Math.round(o[e.id].module.height/2-o[e.id].middleZones[t.slideIndex][0].offsetHeight/2),b:Math.round(o[e.id].module.height/2+o[e.id].middleZones[t.slideIndex][0].offsetHeight/2)}:"rev_row_zone_bottom"===t.zone&&void 0!==o[e.id].bottomZones[t.slideIndex]&&void 0!==o[e.id].bottomZones[t.slideIndex][0]&&(c={t:Math.round(o[e.id].module.height-o[e.id].bottomZones[t.slideIndex][0].offsetHeight),b:o[e.id].module.height+o[e.id].bottomZones[t.slideIndex][0].offsetHeight})),a[d]){case"t":case"top":a[d]=0-(t.eoh||0)-("column"===t.type?0:t.calcy||0)-o.getLayerParallaxOffset(e.id,e.layer[0].id,"v")-("row"===t.type&&void 0!==t.marginTop?t.marginTop[o[e.id].level]:0)-c.b;break;case"b":case"bottom":a[d]=n-("column"===t.type||"row"===t.type?0:t.calcy||0)+o.getLayerParallaxOffset(e.id,e.layer[0].id,"v")-c.t;break;case"l":case"left":a[d]=0-("row"===t.type?t.pow:t.eow||0)-("column"===t.type?0:"row"===t.type?t.rowcalcx:t.calcx||0)-o.getLayerParallaxOffset(e.id,e.layer[0].id,"h");break;case"r":case"right":a[d]=s-("column"===t.type?0:"row"===t.type?t.rowcalcx:t.calcx||0)+o.getLayerParallaxOffset(e.id,e.layer[0].id,"h");break;case"m":case"c":case"middle":case"center":a[d]="x"===d?_(s/2-("column"===t.type?0:t.calcx||0)-(t.eow||0)/2,e.frame.reverse,e.target,d,e.id):"y"===d?_(n/2-("column"===t.type?0:t.calcy||0)-(t.eoh||0)/2,e.frame.reverse,e.target,d,e.id):a[d]}}"skewX"===d&&void 0!==a[d]&&(a.scaleY=void 0===a.scaleY?1:parseFloat(a.scaleY),a.scaleY*=Math.cos(parseFloat(a[d])*tpGS.DEG2RAD)),"skewY"===d&&void 0!==a[d]&&(a.scaleX=void 0===a.scaleX?1:parseFloat(a.scaleX),a.scaleX*=Math.cos(parseFloat(a[d])*tpGS.DEG2RAD))}if(a.transformOrigin=r.originX+" "+r.originY+" "+r.originZ,!o[e.id].BUG_ie_clipPath&&void 0!==a.clip&&void 0!==t.clipPath&&t.clipPath.use){a.clipB=null==a.clipB?100:a.clipB;var p="rectangle"==t.clipPath.type,g=parseInt(a.clip,0),h=100-parseInt(a.clipB,0),m=Math.round(g/2);switch(t.clipPath.origin){case"invh":a.clipPath="polygon(0% 0%, 0% 100%, "+g+"% 100%, "+g+"% 0%, 100% 0%, 100% 100%, "+h+"% 100%, "+h+"% 0%, 0% 0%)";break;case"invv":a.clipPath="polygon(100% 0%, 0% 0%, 0% "+g+"%, 100% "+g+"%, 100% 100%, 0% 100%, 0% "+h+"%, 100% "+h+"%, 100% 0%)";break;case"cv":a.clipPath=p?"polygon("+(50-m)+"% 0%, "+(50+m)+"% 0%, "+(50+m)+"% 100%, "+(50-m)+"% 100%)":"circle("+g+"% at 50% 50%)";break;case"ch":a.clipPath=p?"polygon(0% "+(50-m)+"%, 0% "+(50+m)+"%, 100% "+(50+m)+"%, 100% "+(50-m)+"%)":"circle("+g+"% at 50% 50%)";break;case"l":a.clipPath=p?"polygon(0% 0%, "+g+"% 0%, "+g+"% 100%, 0% 100%)":"circle("+g+"% at 0% 50%)";break;case"r":a.clipPath=p?"polygon("+(100-g)+"% 0%, 100% 0%, 100% 100%, "+(100-g)+"% 100%)":"circle("+g+"% at 100% 50%)";break;case"t":a.clipPath=p?"polygon(0% 0%, 100% 0%, 100% "+g+"%, 0% "+g+"%)":"circle("+g+"% at 50% 0%)";break;case"b":a.clipPath=p?"polygon(0% 100%, 100% 100%, 100% "+(100-g)+"%, 0% "+(100-g)+"%)":"circle("+g+"% at 50% 100%)";break;case"lt":a.clipPath=p?"polygon(0% 0%,"+2*g+"% 0%, 0% "+2*g+"%)":"circle("+g+"% at 0% 0%)";break;case"lb":a.clipPath=p?"polygon(0% "+(100-2*g)+"%, 0% 100%,"+2*g+"% 100%)":"circle("+g+"% at 0% 100%)";break;case"rt":a.clipPath=p?"polygon("+(100-2*g)+"% 0%, 100% 0%, 100% "+2*g+"%)":"circle("+g+"% at 100% 0%)";break;case"rb":a.clipPath=p?"polygon("+(100-2*g)+"% 100%, 100% 100%, 100% "+(100-2*g)+"%)":"circle("+g+"% at 100% 100%)";break;case"clr":a.clipPath=p?"polygon(0% 0%, 0% "+g+"%, "+(100-g)+"% 100%, 100% 100%, 100% "+(100-g)+"%, "+g+"% 0%)":"circle("+g+"% at 50% 50%)";break;case"crl":a.clipPath=p?"polygon(0% "+(100-g)+"%, 0% 100%, "+g+"% 100%, 100% "+g+"%, 100% 0%, "+(100-g)+"% 0%)":"circle("+g+"% at 50% 50%)"}!0!==o.isFirefox(e.id)&&(a["-webkit-clip-path"]=a.clipPath),a["clip-path"]=a.clipPath,delete a.clip,delete a.clipB}else delete a.clip;return"mask"!==e.target&&(void 0===e.frame||void 0===e.frame.filter&&!e.forcefilter||(a.filter=u(e.frame.filter),a["-webkit-filter"]=a.filter,o.useBackdrop&&(a["backdrop-filter"]=function(e){if(void 0===e)return"";var i="";return o.isChrome8889&&0===e.b_blur&&(e.b_blur=.05),i=void 0!==e.b_blur?"blur("+(e.b_blur||0)+"px)":"",i+=void 0!==e.b_grayscale?(i.length>0?" ":"")+"grayscale("+(e.b_grayscale||0)+"%)":"",i+=void 0!==e.b_sepia?(i.length>0?" ":"")+"sepia("+(e.b_sepia||0)+"%)":"",i+=void 0!==e.b_invert?(i.length>0?" ":"")+"invert("+(e.b_invert||0)+"%)":"",""==(i+=void 0!==e.b_brightness?(i.length>0?" ":"")+"brightness("+(e.b_brightness||100)+"%)":"")?"none":i}(e.frame.filter)),window.isSafari11&&(a["-webkit-backdrop-filter"]=a["backdrop-filter"]),window.isSafari11&&void 0!==a.filter&&void 0===a.x&&void 0!==e.frame.filter&&void 0!==e.frame.filter.blur&&(a.x=1e-4)),jQuery.inArray(e.source,["chars","words","lines"])>=0&&(void 0!==e.frame[e.source].blur||e.forcefilter)&&(a.filter=u(e.frame[e.source]),a["-webkit-filter"]=a.filter),delete a.grayscale,delete a.blur,delete a.brightness),a.ease=void 0!==a.ease?a.ease:void 0===a.ease&&void 0!==e.ease||void 0!==a.ease&&void 0!==e.ease&&"inherit"===a.ease?e.ease:e.frame.timeline.ease,a.ease=void 0===a.ease||"default"===a.ease?"power3.inOut":a.ease,a},x=function(e,i,t,a,r){var s,n,d={},l={},c={};for(var p in a=void 0===a?"transform":a,"loop"===r?(c.autoRotate=!1,c.yoyo_filter=!1,c.yoyo_rotate=!1,c.yoyo_move=!1,c.yoyo_scale=!1,c.curved=!1,c.curviness=2,c.ease="none",c.speed=1e3,c.st=0,d.x=0,d.y=0,d.z=0,d.xr=0,d.yr=0,d.zr=0,d.scaleX=1,d.scaleY=1,d.originX="50%",d.originY="50%",d.originZ="0",d.rotationX="0deg",d.rotationY="0deg",d.rotationZ="0deg"):(c.speed=300,t?c.ease="default":d.ease="default"),"sfx"===r&&(d.fxc="#ffffff"),e=e.split(";"))if(e.hasOwnProperty(p)){var g=e[p].split(":");switch(g[0]){case"u":d.use="true"===g[1]||"t"===g[1]||fasle;break;case"c":s=g[1];break;case"fxc":d.fxc=g[1];break;case"bgc":n=g[1];break;case"auto":d.auto="t"===g[1]||void 0===g[1]||"true"===g[1];break;case"o":d.opacity=g[1];break;case"oX":d.originX=g[1];break;case"oY":d.originY=g[1];break;case"oZ":d.originZ=g[1];break;case"sX":d.scaleX=g[1];break;case"sY":d.scaleY=g[1];break;case"skX":d.skewX=g[1];break;case"skY":d.skewY=g[1];break;case"rX":d.rotationX=g[1],0!=g[1]&&"0deg"!==g[1]&&o.addSafariFix(i);break;case"rY":d.rotationY=g[1],0!=g[1]&&"0deg"!==g[1]&&o.addSafariFix(i);break;case"rZ":d.rotationZ=g[1];break;case"sc":d.color=g[1];break;case"se":d.effect=g[1];break;case"bos":d.borderStyle=g[1];break;case"boc":d.borderColor=g[1];break;case"td":d.textDecoration=g[1];break;case"zI":d.zIndex=g[1];break;case"tp":d.transformPerspective="isometric"===o[i].perspectiveType?0:"global"===o[i].perspectiveType?o[i].perspective:g[1];break;case"cp":d.clip=parseInt(g[1],0);break;case"cpb":d.clipB=parseInt(g[1],0);break;case"aR":c.autoRotate="t"==g[1];break;case"rA":c.radiusAngle=g[1];break;case"yyf":c.yoyo_filter="t"==g[1];break;case"yym":c.yoyo_move="t"==g[1];break;case"yyr":c.yoyo_rotate="t"==g[1];break;case"yys":c.yoyo_scale="t"==g[1];break;case"crd":c.curved="t"==g[1];break;case"x":d.x="reverse"===r?"t"===g[1]||!0===g[1]||"true"==g[1]:"loop"===r?parseInt(g[1],0):o.revToResp(g[1],o[i].rle);break;case"y":d.y="reverse"===r?"t"===g[1]||!0===g[1]||"true"==g[1]:"loop"===r?parseInt(g[1],0):o.revToResp(g[1],o[i].rle);break;case"z":d.z="loop"===r?parseInt(g[1],0):o.revToResp(g[1],o[i].rle),0!=g[1]&&o.addSafariFix(i);break;case"bow":d.borderWidth=o.revToResp(g[1],4,0).toString().replace(/,/g," ");break;case"bor":d.borderRadius=o.revToResp(g[1],4,0).toString().replace(/,/g," ");break;case"m":d.mask="t"===g[1]||"f"!==g[1]&&g[1];break;case"iC":d.instantClick="t"===g[1]||"f"!==g[1]&&g[1];break;case"xR":d.xr=parseInt(g[1],0),o.addSafariFix(i);break;case"yR":d.yr=parseInt(g[1],0),o.addSafariFix(i);break;case"zR":d.zr=parseInt(g[1],0);break;case"blu":"loop"===r?d.blur=parseInt(g[1],0):l.blur=parseInt(g[1],0);break;case"gra":"loop"===r?d.grayscale=parseInt(g[1],0):l.grayscale=parseInt(g[1],0);break;case"bri":"loop"===r?d.brightness=parseInt(g[1],0):l.brightness=parseInt(g[1],0);break;case"bB":l.b_blur=parseInt(g[1],0);break;case"bG":l.b_grayscale=parseInt(g[1],0);break;case"bR":l.b_brightness=parseInt(g[1],0);break;case"bI":l.b_invert=parseInt(g[1],0);break;case"bS":l.b_sepia=parseInt(g[1],0);break;case"sp":c.speed=parseInt(g[1],0);break;case"d":d.delay=parseInt(g[1],0);break;case"crns":c.curviness=parseInt(g[1],0);break;case"st":c.start="w"===g[1]||"a"===g[1]?"+=0":g[1],c.waitoncall="w"===g[1]||"a"===g[1];break;case"sA":c.startAbsolute=g[1];break;case"sR":c.startRelative=g[1];break;case"e":t?c.ease=g[1]:d.ease=g[1];break;default:g[0].length>0&&(d[g[0]]="t"===g[1]||"f"!==g[1]&&g[1])}}var u={timeline:c};return jQuery.isEmptyObject(l)||("split"===r?d=jQuery.extend(!0,d,l):u.filter=l),"split"===r&&(d.dir=void 0===d.dir?"start":"backward"===d.dir?"end":"middletoedge"===d.dir?"center":"edgetomiddle"===d.dir?"edge":d.dir),jQuery.isEmptyObject(s)||(u.color=s),jQuery.isEmptyObject(n)||(u.bgcolor=n),u[a]=d,u},k=function(e,i){var t={},a=0;if(void 0===o[i]._rdF0){var r=x("x:0;y:0;z:0;rX:0;rY:0;rZ:0;o:0;skX:0;skY:0;sX:0;sY:0;oX:50%;oY:50%;oZ:0;dir:forward;d:5",i).transform;o[i]._rdF0=o[i]._rdF1={transform:x("x:0;y:0;z:0;rX:0;rY:0;rZ:0;o:0;skX:0;skY:0;sX:0;sY:0;oX:50%;oY:50%;oZ:0;tp:600px",i,!0).transform,mask:x("x:0;y:0",i,!0).transform,chars:jQuery.extend(!0,{blur:0,grayscale:0,brightness:100},r),words:jQuery.extend(!0,{blur:0,grayscale:0,brightness:100},r),lines:jQuery.extend(!0,{blur:0,grayscale:0,brightness:100},r)},o[i]._rdF1.transform.opacity=o[i]._rdF1.chars.opacity=o[i]._rdF1.words.opacity=o[i]._rdF1.lines.opacity=o[i]._rdF1.transform.scaleX=o[i]._rdF1.chars.scaleX=o[i]._rdF1.words.scaleX=o[i]._rdF1.lines.scaleX=o[i]._rdF1.transform.scaleY=o[i]._rdF1.chars.scaleY=o[i]._rdF1.words.scaleY=o[i]._rdF1.lines.scaleY=1}for(var a in void 0===e.frame_0&&(e.frame_0="x:0"),void 0===e.frame_1&&(e.frame_1="x:0"),e.dddNeeded=!1,e.ford)if(e.ford.hasOwnProperty(a)){var s=e.ford[a];if(e[s]){if(t[s]=x(e[s],i,!0),void 0!==t[s].bgcolor&&(e.bgcolinuse=!0),o[i].BUG_ie_clipPath&&void 0!==e.clipPath&&e.clipPath.use&&void 0!==t[s].transform.clip){var n="rectangle"===e.clipPath.type?100-parseInt(t[s].transform.clip):100-Math.min(100,2*parseInt(t[s].transform.clip));switch(e.clipPath.origin){case"clr":case"rb":case"rt":case"r":e[s+"_mask"]="u:t;x:"+n+"%;y:0px;",t[s].transform.x=o.revToResp("-"+n+"%",o[i].rle);break;case"crl":case"lb":case"lt":case"cv":case"l":e[s+"_mask"]="u:t;x:-"+n+"%;y:0px;",t[s].transform.x=o.revToResp(n+"%",o[i].rle);break;case"ch":case"t":e[s+"_mask"]="u:t;y:-"+n+"%;y:0px;",t[s].transform.y=o.revToResp(n+"%",o[i].rle);break;case"b":e[s+"_mask"]="u:t;y:"+n+"%;y:0px;",t[s].transform.y=o.revToResp("-"+n+"%",o[i].rle)}delete t[s].transform.clip,delete t[s].transform.clipB}e[s+"_mask"]&&(t[s].mask=x(e[s+"_mask"],i).transform),null!=t[s].mask&&t[s].mask.use?(t[s].mask.x=void 0===t[s].mask.x?0:t[s].mask.x,t[s].mask.y=void 0===t[s].mask.y?0:t[s].mask.y,delete t[s].mask.use,t[s].mask.overflow="hidden"):t[s].mask={ease:"default",overflow:"visible"},e[s+"_chars"]&&(t[s].chars=x(e[s+"_chars"],i,void 0,void 0,"split").transform),e[s+"_words"]&&(t[s].words=x(e[s+"_words"],i,void 0,void 0,"split").transform),e[s+"_lines"]&&(t[s].lines=x(e[s+"_lines"],i,void 0,void 0,"split").transform),(e[s+"_chars"]||e[s+"_words"]||e[s+"_lines"])&&(t[s].dosplit=!0),t.frame_0=void 0===t.frame_0?{transform:{}}:t.frame_0,t[s].transform.auto&&(t[s].transform=o.clone(t.frame_0.transform),t[s].transform.opacity=void 0===t[s].transform.opacity?0:t[s].transform.opacity,void 0!==t.frame_0.filter&&(t[s].filter=o.clone(t.frame_0.filter)),void 0!==t.frame_0.mask&&(t[s].mask=o.clone(t.frame_0.mask)),void 0!==t.frame_0.chars&&(t[s].chars=o.clone(t.frame_0.chars)),void 0!==t.frame_0.words&&(t[s].words=o.clone(t.frame_0.words)),void 0!==t.frame_0.lines&&(t[s].lines=o.clone(t.frame_0.lines)),void 0===t.frame_0.chars&&void 0===t.frame_0.words&&void 0===t.frame_0.lines||(t[s].dosplit=!0)),e[s+"_sfx"]&&(t[s].sfx=x(e[s+"_sfx"],i,!1,void 0,"sfx").transform),e[s+"_reverse"]&&(t[s].reverse=x(e[s+"_reverse"],i,!1,void 0,"reverse").transform)}}if(t.frame_0.dosplit&&(t.frame_1.dosplit=!0),void 0===e.frame_hover&&void 0===e.svgh||(t.frame_hover=x(void 0===e.frame_hover?"":e.frame_hover,i),!o.ISM||"true"!=t.frame_hover.transform.instantClick&&1!=t.frame_hover.transform.instantClick?(delete t.frame_hover.transform.instantClick,t.frame_hover.transform.color=t.frame_hover.color,void 0===t.frame_hover.transform.color&&delete t.frame_hover.transform.color,void 0!==t.frame_hover.bgcolor&&t.frame_hover.bgcolor.indexOf("gradient")>=0?t.frame_hover.transform.backgroundImage=t.frame_hover.bgcolor:void 0!==t.frame_hover.bgcolor&&(t.frame_hover.transform.backgroundColor=t.frame_hover.bgcolor),void 0!==t.frame_hover.bgcolor&&(e.bgcolinuse=!0),t.frame_hover.transform.opacity=void 0===t.frame_hover.transform.opacity?1:t.frame_hover.transform.opacity,t.frame_hover.mask=void 0!==t.frame_hover.transform.mask&&t.frame_hover.transform.mask,delete t.frame_hover.transform.mask,void 0!==t.frame_hover.transform&&((t.frame_hover.transform.borderWidth||t.frame_hover.transform.borderStyle)&&(t.frame_hover.transform.borderColor=void 0===t.frame_hover.transform.borderColor?"transparent":t.frame_hover.transform.borderColor),"none"!==t.frame_hover.transform.borderStyle&&void 0===t.frame_hover.transform.borderWidth&&(t.frame_hover.transform.borderWidth=o.revToResp(0,4,0).toString().replace(/,/g," ")),void 0===e.bordercolor&&void 0!==t.frame_hover.transform.borderColor&&(e.bordercolor="transparent"),void 0===e.borderwidth&&void 0!==t.frame_hover.transform.borderWidth&&(e.borderwidth=o.revToResp(t.frame_hover.transform.borderWidth,4,0)),void 0===e.borderstyle&&void 0!==t.frame_hover.transform.borderStyle&&(e.borderstyle=o.revToResp(t.frame_hover.transform.borderStyle,4,0)))):delete t.frame_hover),void 0!==e.tloop){e.layerLoop={from:"frame_1",to:"frame_999",repeat:-1,keep:!0,children:!0};var d=e.tloop.split(";");for(var a in d)if(d.hasOwnProperty(a)){var l=d[a].split(":");switch(l[0]){case"f":e.layerLoop.from=l[1];break;case"t":e.layerLoop.to=l[1];break;case"k":e.layerLoop.keep=l[1];break;case"r":e.layerLoop.repeat=parseInt(l[1],0);break;case"c":e.layerLoop.children=l[1]}}e.layerLoop.count=0}for(var a in(e.loop_0||e.loop_999)&&(t.loop=x(e.loop_999,i,!0,"frame_999","loop"),t.loop.frame_0=x(e.loop_0||"",i,!1,void 0,"loop").transform),t.frame_0.transform.opacity=void 0===t.frame_0.transform.opacity?0:t.frame_0.transform.opacity,t.frame_1.transform.opacity=void 0===t.frame_1.transform.opacity?1:t.frame_1.transform.opacity,t.frame_999.transform.opacity=void 0===t.frame_999.transform.opacity?"inherit":t.frame_999.transform.opacity,e.clipPath&&e.clipPath.use&&(t.frame_0.transform.clip=void 0===t.frame_0.transform.clip?100:parseInt(t.frame_0.transform.clip),t.frame_1.transform.clip=void 0===t.frame_1.transform.clip?100:parseInt(t.frame_1.transform.clip)),e.resetfilter=!1,e.useFilter={blur:!1,grayscale:!1,brightness:!1,b_blur:!1,b_grayscale:!1,b_brightness:!1,b_invert:!1,b_sepia:!1},t)void 0!==t[a].filter&&(e.resetfilter=!0,e.useFilter=R(e.useFilter,t[a].filter));if(!0!==e.resetFilter&&void 0!==t.frame_hover&&(e.useFilter=R(e.useFilter,t.frame_hover)),e.resetfilter)for(var a in t.frame_0.filter=o.clone(t.frame_0.filter),t.frame_0.filter=L(e.useFilter,o.clone(t.frame_0.filter)),t)void 0!==t[a].filter&&"frame_1"!==a&&"frame_0"!==a&&(t[a].filter=o.clone(t[a].filter),t[a].filter=L(e.useFilter,o.clone(t[a].filter)));return void 0!==t.frame_0.filter&&(t.frame_1.filter=o.clone(t.frame_1.filter),void 0!==t.frame_0.filter.blur&&0!==t.frame_1.filter.blur&&(t.frame_1.filter.blur=void 0===t.frame_1.filter.blur?0:t.frame_1.filter.blur),void 0!==t.frame_0.filter.brightness&&100!==t.frame_1.filter.brightness&&(t.frame_1.filter.brightness=void 0===t.frame_1.filter.brightness?100:t.frame_1.filter.brightness),void 0!==t.frame_0.filter.grayscale&&0!==t.frame_1.filter.grayscale&&(t.frame_1.filter.grayscale=void 0===t.frame_1.filter.grayscale?0:t.frame_1.filter.grayscale),void 0!==t.frame_0.filter.b_blur&&0!==t.frame_1.filter.b_blur&&(t.frame_1.filter.b_blur=void 0===t.frame_1.filter.b_blur?0:t.frame_1.filter.b_blur),void 0!==t.frame_0.filter.b_brightness&&100!==t.frame_1.filter.b_brightness&&(t.frame_1.filter.b_brightness=void 0===t.frame_1.filter.b_brightness?100:t.frame_1.filter.b_brightness),void 0!==t.frame_0.filter.b_grayscale&&0!==t.frame_1.filter.b_grayscale&&(t.frame_1.filter.b_grayscale=void 0===t.frame_1.filter.b_grayscale?0:t.frame_1.filter.b_grayscale),void 0!==t.frame_0.filter.b_invert&&0!==t.frame_1.filter.b_invert&&(t.frame_1.filter.b_invert=void 0===t.frame_1.filter.b_invert?0:t.frame_1.filter.b_invert),void 0!==t.frame_0.filter.b_sepia&&0!==t.frame_1.filter.b_sepia&&(t.frame_1.filter.b_sepia=void 0===t.frame_1.filter.b_sepia?0:t.frame_1.filter.b_sepia)),I(t,i,e)},L=function(e,i){return e.blur?i.blur=void 0===i.blur?0:i.blur:delete i.blur,e.brightness?i.brightness=void 0===i.brightness?100:i.brightness:delete i.brightness,e.grayscale?i.grayscale=void 0===i.grayscale?0:i.grayscale:delete i.grayscale,e.b_blur?i.b_blur=void 0===i.b_blur?0:i.b_blur:delete i.b_blur,e.b_brightness?i.b_brightness=void 0===i.b_brightness?100:i.b_brightness:delete i.b_brightness,e.b_grayscale?i.b_grayscale=void 0===i.b_grayscale?0:i.b_grayscale:delete i.b_grayscale,e.b_invert?i.b_invert=void 0===i.b_invert?0:i.b_invert:delete i.b_invert,e.b_sepia?i.b_sepia=void 0===i.b_sepia?0:i.b_sepia:delete i.b_sepia,i},R=function(e,i){return e.blur=!0===e.blur||void 0!==i.blur&&0!==i.blur&&"0px"!==i.blur,e.grayscale=!0===e.grayscale||void 0!==i.grayscale&&0!==i.grayscale&&"0%"!==i.grayscale,e.brightness=!0===e.brightness||void 0!==i.brightness&&100!==i.brightness&&"100%"!==i.brightness,e.b_blur=!0===e.b_blur||void 0!==i.b_blur&&0!==i.b_blur&&"0px"!==i.b_blur,e.b_grayscale=!0===e.b_grayscale||void 0!==i.b_grayscale&&0!==i.b_grayscale&&"0%"!==i.b_grayscale,e.b_brightness=!0===e.b_brightness||void 0!==i.b_brightness&&100!==i.b_brightness&&"100%"!==i.b_brightness,e.b_invert=!0===e.b_invert||void 0!==i.b_invert&&0!==i.b_invert&&"0%"!==i.b_invert,e.b_sepia=!0===e.b_sepia||void 0!==i.b_sepia&&0!==i.b_sepia&&"0%"!==i.b_sepia,e},O=function(e){return void 0!==e&&(void 0!==e.rotationY||void 0!==e.rotationX||void 0!==e.z)},I=function(e,i,t){var a,r={},s=["transform","words","chars","lines","mask"],n="global"==o[i].perspectiveType?o[i].perspective:0,d=!0,l=!1;for(var c in e)"loop"!==c&&"frame_hover"!==c&&(r=jQuery.extend(!0,r,e[c]));for(var c in e)if(e.hasOwnProperty(c)&&(void 0!==e[c].timeline&&(e[c].timeline.usePerspective=!1),"loop"!==c&&"frame_hover"!==c)){for(a in r.transform)r.transform.hasOwnProperty(a)&&(r.transform[a]=void 0===e[c].transform[a]?"frame_0"===c?o[i]._rdF0.transform[a]:"frame_1"===c?o[i]._rdF1.transform[a]:r.transform[a]:e[c].transform[a],e[c].transform[a]=void 0===e[c].transform[a]?r.transform[a]:e[c].transform[a]);for(var p=1;p<=4;p++)for(a in r[s[p]])r[s[p]].hasOwnProperty(a)&&(e[c][s[p]]=void 0===e[c][s[p]]?{}:e[c][s[p]],r[s[p]][a]=void 0===e[c][s[p]][a]?"frame_0"===c?o[i]._rdF0[s[p]][a]:"frame_1"===c?o[i]._rdF1[s[p]][a]:r[s[p]][a]:e[c][s[p]][a],e[c][s[p]][a]=void 0===e[c][s[p]][a]?r[s[p]][a]:e[c][s[p]][a]);void 0!==e[c].timeline&&!1===e[c].timeline.usePerspective&&void 0!==e[c].transform&&(void 0!==e[c].transform.rotationY||void 0!==e[c].transform.rotationX||void 0!==e[c].transform.z||O(e[c].chars)||O(e[c].words)||O(e[c].lines))&&(n="local"==o[i].perspectiveType?void 0===e[c].transform.transformPerspective?600:e[c].transform.transformPerspective:n,e[c].timeline.usePerspective=!0,(O(e[c].chars)||O(e[c].words)||O(e[c].lines))&&!o.isFirefox(i)&&(l=!0),d=!1)}if(l&&requestAnimationFrame(function(){tpGS.gsap.set(t.c,{transformStyle:"preserve-3d"})}),void 0!==e.frame_0.timeline&&e.frame_0.timeline.usePerspective&&(e.frame_0.transform.transformPerspective="local"===o[i].perspectiveType?void 0===e.frame_0.transform.transformPerspective?n:e.frame_0.transform.transformPerspective:"isometric"===o[i].perspectiveType?0:o[i].perspective),d)for(var c in e){if(!e.hasOwnProperty(c)||void 0===e[c].transform)continue;delete e[c].transform.transformPerspective}return e},M=function(e,i,t){if(0===e.length)return{};for(var a=e[0].getElementsByClassName(i),r={},o=0;o<a.length;o++)void 0!==t&&-1!==a[o].className.indexOf(t)||(r[a[o].id]=a[o]);if(void 0!==e[1])for(a=e[1].getElementsByClassName(i),o=0;o<a.length;o++)void 0!==t&&-1!==a[o].className.indexOf(t)||(r[a[o].id]=a[o]);return r},C=function(e){return"thin"===(e=o.isNumeric(e)?e:e.toLowerCase())?"00":"extra light"===e?200:"light"===e?300:"normal"===e?400:"medium"===e?500:"semi bold"===e?600:"bold"===e?700:"extra bold"===e?800:"ultra bold"===e?900:"black"===e?900:e},T=function(e,i,s){if("BR"==e[0].nodeName||"br"==e[0].tagName||"object"!=typeof e[0].className&&e[0].className.indexOf("rs_splitted_")>=0)return!1;o.sA(e[0],"stylerecorder",!0),void 0===e[0].id&&(e[0].id="rs-layer-sub-"+Math.round(1e6*Math.random())),o[s].computedStyle[e[0].id]=window.getComputedStyle(e[0],null);var n=void 0!==e[0].id&&void 0!==o[s]._L[e[0].id]?o[s]._L[e[0].id]:e.data(),d="rekursive"===i?jQuery(o.closestClass(e[0],"rs-layer")):void 0;void 0!==d&&(o[s].computedStyle[d[0].id]=void 0===o[s].computedStyle[d[0].id]?window.getComputedStyle(d[0],null):o[s].computedStyle[d[0].id]);var l=void 0!==d&&o[s].computedStyle[e[0].id].fontSize==o[s].computedStyle[d[0].id].fontSize&&C(o[s].computedStyle[e[0].id].fontWeight)==C(o[s].computedStyle[d[0].id].fontWeight)&&o[s].computedStyle[e[0].id].lineHeight==o[s].computedStyle[d[0].id].lineHeight,c=l?void 0!==d[0].id&&void 0!==o[s]._L[d[0].id]?o[s]._L[d[0].id]:d.data():void 0,p=0;for(n.basealign=void 0===n.basealign?"grid":n.basealign,n._isnotext||(n.fontSize=o.revToResp(l?void 0===c.fontsize?parseInt(o[s].computedStyle[d[0].id].fontSize,0)||20:c.fontsize:void 0===n.fontsize?"rekursive"!==i?20:"inherit":n.fontsize,o[s].rle),n.fontWeight=o.revToResp(l?void 0===c.fontweight?o[s].computedStyle[d[0].id].fontWeight||"inherit":c.fontweight:void 0===n.fontweight?o[s].computedStyle[e[0].id].fontWeight||"inherit":n.fontweight,o[s].rle),n.whiteSpace=o.revToResp(l?void 0===c.whitespace?"nowrap":c.whitespace:void 0===n.whitespace?"nowrap":n.whitespace,o[s].rle),n.textAlign=o.revToResp(l?void 0===c.textalign?"left":c.textalign:void 0===n.textalign?"left":n.textalign,o[s].rle),n.letterSpacing=o.revToResp(l?void 0===c.letterspacing?parseInt(o[s].computedStyle[d[0].id].letterSpacing,0)||"inherit":c.letterspacing:void 0===n.letterspacing?parseInt("normal"===o[s].computedStyle[e[0].id].letterSpacing?0:o[s].computedStyle[e[0].id].letterSpacing,0)||"inherit":n.letterspacing,o[s].rle),n.textDecoration=l?void 0===c.textDecoration?"none":c.textDecoration:void 0===n.textDecoration?"none":n.textDecoration,p=25,p=void 0!==d&&"I"===e[0].tagName?"inherit":p,void 0!==n.tshadow&&(n.tshadow.b=o.revToResp(n.tshadow.b,o[s].rle),n.tshadow.h=o.revToResp(n.tshadow.h,o[s].rle),n.tshadow.v=o.revToResp(n.tshadow.v,o[s].rle))),void 0!==n.bshadow&&(n.bshadow.b=o.revToResp(n.bshadow.b,o[s].rle),n.bshadow.h=o.revToResp(n.bshadow.h,o[s].rle),n.bshadow.v=o.revToResp(n.bshadow.v,o[s].rle),n.bshadow.s=o.revToResp(n.bshadow.s,o[s].rle)),void 0!==n.tstroke&&(n.tstroke.w=o.revToResp(n.tstroke.w,o[s].rle)),n.display=l?void 0===c.display?o[s].computedStyle[d[0].id].display:c.display:void 0===n.display?o[s].computedStyle[e[0].id].display:n.display,n.float=o.revToResp(l?void 0===c.float?o[s].computedStyle[d[0].id].float||"none":c.float:void 0===n.float?"none":n.float,o[s].rle),n.clear=o.revToResp(l?void 0===c.clear?o[s].computedStyle[d[0].id].clear||"none":c.clear:void 0===n.clear?"none":n.clear,o[s].rle),n.lineHeight=o.revToResp(e.is("img")||-1!=jQuery.inArray(n.layertype,["video","image","audio"])?p:l?void 0===c.lineheight?parseInt(o[s].computedStyle[d[0].id].lineHeight,0)||p:c.lineheight:void 0===n.lineheight?p:n.lineheight,o[s].rle),n.zIndex=l?void 0===c.zindex?parseInt(o[s].computedStyle[d[0].id].zIndex,0)||"inherit":c.zindex:void 0===n.zindex?parseInt(o[s].computedStyle[e[0].id].zIndex,0)||"inherit":n.zindex,g=0;g<4;g++)n["padding"+t[g]]=o.revToResp(void 0===n["padding"+r[g]]?parseInt(o[s].computedStyle[e[0].id]["padding"+t[g]],0)||0:n["padding"+r[g]],o[s].rle),n["margin"+t[g]]=o.revToResp(void 0===n["margin"+r[g]]?parseInt(o[s].computedStyle[e[0].id]["margin"+t[g]],0)||0:n["margin"+r[g]],o[s].rle),n["border"+t[g]+"Width"]=void 0===n.borderwidth?parseInt(o[s].computedStyle[e[0].id]["border"+t[g]+"Width"],0)||0:n.borderwidth[g],n["border"+t[g]+"Color"]=void 0===n.bordercolor?o[s].computedStyle[e[0].id]["border-"+r[g]+"-color"]:n.bordercolor,n["border"+a[g]+"Radius"]=o.revToResp(void 0===n.borderradius?o[s].computedStyle[e[0].id]["border"+a[g]+"Radius"]||0:n.borderradius[g],o[s].rle);if(n.borderStyle=o.revToResp(void 0===n.borderstyle?o[s].computedStyle[e[0].id].borderStyle||0:n.borderstyle,o[s].rle),"rekursive"!==i?(n.color=o.revToResp(void 0===n.color?"#ffffff":n.color,o[s].rle,void 0,"||"),n.minWidth=o.revToResp(void 0===n.minwidth?parseInt(o[s].computedStyle[e[0].id].minWidth,0)||0:n.minwidth,o[s].rle),n.minHeight=o.revToResp(void 0===n.minheight?parseInt(o[s].computedStyle[e[0].id].minHeight,0)||0:n.minheight,o[s].rle),n.width=o.revToResp(void 0===n.width?"auto":o.smartConvertDivs(n.width),o[s].rle),n.height=o.revToResp(void 0===n.height?"auto":o.smartConvertDivs(n.height),o[s].rle),n.maxWidth=o.revToResp(void 0===n.maxwidth?parseInt(o[s].computedStyle[e[0].id].maxWidth,0)||"none":n.maxwidth,o[s].rle),n.maxHeight=o.revToResp(-1!==jQuery.inArray(n.type,["column","row"])?"none":void 0!==n.maxheight?parseInt(o[s].computedStyle[e[0].id].maxHeight,0)||"none":n.maxheight,o[s].rle)):"html"===n.layertype&&(n.width=o.revToResp(e[0].width,o[s].rle),n.height=o.revToResp(e[0].height,o[s].rle)),n._incolumn)for(var g=0;g<n.height.length;g++)-1!==n.height[g].indexOf("%")&&parseFloat(n.height[g])>98&&(n.height[g]=n.height[g].replace("%","px"));for(n.styleProps={background:e[0].style.background,"background-color":e[0].style["background-color"],color:e[0].style.color,cursor:e[0].style.cursor,"font-style":e[0].style["font-style"]},null==n.bshadow&&(n.styleProps.boxShadow=e[0].style.boxShadow),""!==n.styleProps.background&&void 0!==n.styleProps.background&&n.styleProps.background!==n.styleProps["background-color"]||delete n.styleProps.background,""==n.styleProps.color&&(n.styleProps.color=o[s].computedStyle[e[0].id].color),g=0;g<4;g++)A(n["padding"+t[g]],0)&&delete n["padding"+t[g]],A(n["margin"+t[g]],0)&&delete n["margin"+t[g]],A(n["border"+a[g]+"Radius"],"0px")?delete n["border"+a[g]+"Radius"]:A(n["border"+a[g]+"Radius"],"0")&&delete n["border"+a[g]+"Radius"];if(A(n.borderStyle,"none"))for(delete n.borderStyle,g=0;g<4;g++)delete n["border"+t[g]+"Width"],delete n["border"+t[g]+"Color"]},A=function(e,i){return i===e[0]&&i===e[1]&&i===e[2]&&i===e[3]},D=function(e,i,t,a,r){var s=o.isNumeric(e)||void 0===e?"":e.indexOf("px")>=0?"px":e.indexOf("%")>=0?"%":"";return e=o.isNumeric(parseInt(e))?parseInt(e):e,e=null==(e="full"===(e=o.isNumeric(e)?e*i+s:e)?a:"auto"===e||"none"===e?t:e)?r:e},P=function(e){return null!=e&&0!==parseInt(e,0)},B=function(e){var i,s,n,d,l,c,p,g,u,h,m=e.a,v=e.b,f=e.c,y=e.d,w=e.e,b={},_={},S=o[v]._L[m[0].id],x=m[0].className;if(S=void 0===S?{}:S,"object"==typeof x&&(x=""),void 0!==m&&void 0!==m[0]&&(x.indexOf("rs_splitted")>=0||"BR"==m[0].nodeName||"br"==m[0].tagName||m[0].tagName.indexOf("FCR")>0||m[0].tagName.indexOf("BCR")>0))return!1;w="individual"===w?S.slideIndex:w;e=function(e,i,r){if(void 0!==e){if("BR"==e[0].nodeName||"br"==e[0].tagName)return!1;var s,n=o[i].level,d=void 0!==e[0]&&void 0!==e[0].id&&void 0!==o[i]._L[e[0].id]?o[i]._L[e[0].id]:e.data();void 0===(d=void 0===d.basealign?r.data():d)._isnotext&&(d._isnotext=void 0!==r&&void 0!==r[0]&&r[0].length>0?o.gA(r[0],"_isnotext"):d._isnotext);var l={basealign:void 0===d.basealign?"grid":d.basealign,lineHeight:void 0===d.basealign?"inherit":parseInt(d.lineHeight[n]),color:void 0===d.color?void 0:d.color[n],width:void 0===d.width?void 0:"a"===d.width[n]?"auto":d.width[n],height:void 0===d.height?void 0:"a"===d.height[n]?"auto":d.height[n],minWidth:void 0===d.minWidth?void 0:"n"===d.minWidth[n]?"none":d.minWidth[n],minHeight:void 0===d.minHeight?void 0:"n"==d.minHeight[n]?"none":d.minHeight[n],maxWidth:void 0===d.maxWidth?void 0:"n"==d.maxWidth[n]?"none":d.maxWidth[n],maxHeight:void 0===d.maxHeight?void 0:"n"==d.maxHeight[n]?"none":d.maxHeight[n],float:d.float[n],clear:d.clear[n]};for(d.borderStyle&&(l.borderStyle=d.borderStyle[n]),s=0;s<4;s++)d["padding"+t[s]]&&(l["padding"+t[s]]=d["padding"+t[s]][n]),d["margin"+t[s]]&&(l["margin"+t[s]]=parseInt(d["margin"+t[s]][n])),d["border"+a[s]+"Radius"]&&(l["border"+a[s]+"Radius"]=d["border"+a[s]+"Radius"][n]),d["border"+t[s]+"Color"]&&(l["border"+t[s]+"Color"]=d["border"+t[s]+"Color"]),d["border"+t[s]+"Width"]&&(l["border"+t[s]+"Width"]=parseInt(d["border"+t[s]+"Width"]));return d._isnotext||(l.textDecoration=d.textDecoration,l.fontSize=parseInt(d.fontSize[n]),l.fontWeight=parseInt(d.fontWeight[n]),l.letterSpacing=parseInt(d.letterSpacing[n])||0,l.textAlign=d.textAlign[n],l.whiteSpace=d.whiteSpace[n],l.whiteSpace="normal"===l.whiteSpace&&"auto"===l.width&&!0!==d._incolumn?"nowrap":l.whiteSpace,l.display=d.display,void 0!==d.tshadow&&(l.textShadow=parseInt(d.tshadow.h[n],0)+"px "+parseInt(d.tshadow.v[n],0)+"px "+d.tshadow.b[n]+" "+d.tshadow.c),void 0!==d.tstroke&&(l.textStroke=parseInt(d.tstroke.w[n],0)+"px "+d.tstroke.c)),void 0!==d.bshadow&&(l.boxShadow=parseInt(d.bshadow.h[n],0)+"px "+parseInt(d.bshadow.v[n],0)+"px "+parseInt(d.bshadow.b[n],0)+"px "+parseInt(d.bshadow.s[n],0)+"px "+d.bshadow.c),l}}(m,v,e.RSL);var k,L="off"===y?1:o[v].CM.w;if(void 0===S._isnotext&&(S._isnotext=void 0!==e.RSL&&void 0!==e.RSL[0]&&e.RSL[0].length>0?o.gA(e.RSL[0],"_isnotext"):S._isnotext),S._incolumn&&("shape"===S.type||"text"===S.type||"button"===S.type)&&(""+e.height).indexOf(!1)&&(e.height=e.height),S.OBJUPD=null==S.OBJUPD?{}:S.OBJUPD,S.caches=null==S.caches?{}:S.caches,"column"===S.type){for(s={},k={},i=0;i<4;i++)void 0!==e["margin"+t[i]]&&(s["padding"+t[i]]=Math.round(e["margin"+t[i]]*L)+"px",k["margin"+t[i]]=e["margin"+t[i]],delete e["margin"+t[i]]);jQuery.isEmptyObject(s)||tpGS.gsap.set(S._column,s)}var R=o.clone(S.OBJUPD.POBJ),O=o.clone(S.OBJUPD.LPOBJ);if(-1===x.indexOf("rs_splitted_")){for(s={overwrite:"auto"},i=0;i<4;i++)void 0!==e["border"+a[i]+"Radius"]&&(s["border"+a[i]+"Radius"]=e["border"+a[i]+"Radius"]),void 0!==e["padding"+t[i]]&&(s["padding"+t[i]]=Math.round(e["padding"+t[i]]*L)+"px"),void 0===e["margin"+t[i]]||S._incolumn||(s["margin"+t[i]]="row"===S.type?0:Math.round(e["margin"+t[i]]*L)+"px");if(void 0!==S.spike&&(s["clip-path"]=s["-webkit-clip-path"]=S.spike),e.boxShadow&&(s.boxShadow=e.boxShadow),"column"!==S.type&&(void 0!==e.borderStyle&&"none"!==e.borderStyle&&(0!==e.borderTopWidth||e.borderBottomWidth>0||e.borderLeftWidth>0||e.borderRightWidth>0)?(s.borderTopWidth=Math.round(e.borderTopWidth*L)+"px",s.borderBottomWidth=Math.round(e.borderBottomWidth*L)+"px",s.borderLeftWidth=Math.round(e.borderLeftWidth*L)+"px",s.borderRightWidth=Math.round(e.borderRightWidth*L)+"px",s.borderStyle=e.borderStyle,s.borderTopColor=e.borderTopColor,s.borderBottomColor=e.borderBottomColor,s.borderLeftColor=e.borderLeftColor,s.borderRightColor=e.borderRightColor):("none"===e.borderStyle&&(s.borderStyle="none"),s.borderTopColor=e.borderTopColor,s.borderBottomColor=e.borderBottomColor,s.borderLeftColor=e.borderLeftColor,s.borderRightColor=e.borderRightColor)),"shape"!==S.type&&"image"!==S.type||!(P(e.borderTopLeftRadius)||P(e.borderTopRightRadius)||P(e.borderBottomLeftRadius)||P(e.borderBottomRightRadius))||(s.overflow="hidden"),S._isnotext||("column"!==S.type&&(s.fontSize=Math.round(e.fontSize*L)+"px",s.fontWeight=e.fontWeight,s.letterSpacing=e.letterSpacing*L+"px",e.textShadow&&(s.textShadow=e.textShadow),e.textStroke&&(s["-webkit-text-stroke"]=e.textStroke)),s.lineHeight=Math.round(e.lineHeight*L)+"px",s.textAlign=e.textAlign),"column"===S.type&&(void 0===S.cbg_set&&(S.cbg_set=S.styleProps["background-color"],S.cbg_set=""==S.cbg_set||void 0===S.cbg_set||0==S.cbg_set.length?"transparent":S.cbg_set,S.cbg_img=m.css("backgroundImage"),""!==S.cbg_img&&void 0!==S.cbg_img&&"none"!==S.cbg_img&&(S.cbg_img_r=m.css("backgroundRepeat"),S.cbg_img_p=m.css("backgroundPosition"),S.cbg_img_s=m.css("backgroundSize")),S.cbg_o=S.bgopacity?1:S.bgopacity,b.backgroundColor="transparent",b.backgroundImage=""),s.backgroundColor="transparent",s.backgroundImage="none"),S._isstatic&&S.elementHovered&&(p=m.data("frames"))&&p.frame_hover&&p.frame_hover.transform)for(g in s)s.hasOwnProperty(g)&&p.frame_hover.transform.hasOwnProperty(g)&&delete s[g];if("IFRAME"==m[0].nodeName&&"html"===o.gA(m[0],"layertype")&&(u="slide"==e.basealign?o[v].module.width:o.iWA(v,w),h="slide"==e.basealign?o[v].module.height:o.iHE(v),s.width=!o.isNumeric(e.width)&&e.width.indexOf("%")>=0?!S._isstatic||S._incolumn||S._ingroup?e.width:u*parseInt(e.width,0)/100:D(e.width,L,"auto",u,"auto"),s.height=!o.isNumeric(e.height)&&e.height.indexOf("%")>=0?!S._isstatic||S._incolumn||S._ingroup?e.height:h*parseInt(e.height,0)/100:D(e.height,L,"auto",u,"auto")),b=jQuery.extend(!0,b,s),"rekursive"!=f){u="slide"==e.basealign?o[v].module.width:o.iWA(v,w),h="slide"==e.basealign?o[v].module.height:o.iHE(v);var I=!o.isNumeric(e.width)&&e.width.indexOf("%")>=0?!S._isstatic||S._incolumn||S._ingroup?e.width:u*parseInt(e.width,0)/100:D(e.width,L,"auto",u,"auto"),M=!o.isNumeric(e.height)&&e.height.indexOf("%")>=0?!S._isstatic||S._incolumn||S._ingroup?e.height:h*parseInt(e.height,0)/100:D(e.height,L,"auto",u,"auto"),C={maxWidth:D(e.maxWidth,L,"none",u,"none"),maxHeight:D(e.maxHeight,L,"none",h,"none"),minWidth:D(e.minWidth,L,"0px",u,0),minHeight:D(e.minHeight,L,"0px",h,0),height:M,width:I,overwrite:"auto"};1==S.heightSetByVideo&&(C.height=S.vidOBJ.height);var T=!1;if(S._incolumn){for(R=jQuery.extend(!0,R,{minWidth:I,maxWidth:I,float:e.float,clear:e.clear}),i=0;i<4;i++)void 0!==e["margin"+t[i]]&&(R["margin"+t[i]]=e["margin"+t[i]]*L+"px");O.width="100%",void 0!==e.display&&"inline-block"!==e.display||(_={width:"100%"}),C.width=!o.isNumeric(e.width)&&e.width.indexOf("%")>=0?"100%":I,"image"===S.type&&tpGS.gsap.set(S.img,{width:"100%"})}else!o.isNumeric(e.width)&&e.width.indexOf("%")>=0&&(R.minWidth="slide"===S.basealign||!0===S._ingroup?I:o.iWA(v,w)*o[v].CM.w*parseInt(I)/100+"px",O.width="100%",_.width="100%");if(!o.isNumeric(e.height)&&e.height.indexOf("%")>=0&&(R.minHeight="slide"===S.basealign||!0===S._ingroup?M:o.iHE(v)*(o[v].currentRowsHeight>o[v].gridheight[o[v].level]?1:o[v].CM.w)*parseInt(M)/100+"px",O.height="100%",_.height="100%",T=!0),S._isnotext||(C.whiteSpace=e.whiteSpace,C.textAlign=e.textAlign,C.textDecoration=e.textDecoration),"npc"!=e.color&&void 0!==e.color&&(C.color=e.color),S._ingroup&&(S._groupw=C.minWidth,S._grouph=C.minHeight),"row"===S.type&&(o.isNumeric(C.minHeight)||C.minHeight.indexOf("px")>=0)&&"0px"!==C.minHeight&&0!==C.minHeight&&"0"!==C.minHeight&&"none"!==C.minHeight?C.height=C.minHeight:"row"===S.type&&(C.height="auto"),S._isstatic&&S.elementHovered&&(p=m.data("frames"))&&p.frame_hover&&p.frame_hover.transform)for(g in C)C.hasOwnProperty(g)&&p.frame_hover.transform.hasOwnProperty(g)&&delete C[g];"group"!==S.type&&"row"!==S.type&&"column"!==S.type&&(!o.isNumeric(C.width)&&C.width.indexOf("%")>=0&&(C.width="100%"),!o.isNumeric(C.height)&&C.height.indexOf("%")>=0&&(C.height="100%")),S._isgroup&&(!o.isNumeric(C.width)&&C.width.indexOf("%")>=0&&(C.width="100%"),R.height=T?"100%":C.height),b=jQuery.extend(!0,b,C),null!=S.svg_src&&void 0!==S.svgI&&("string"==typeof S.svgI.fill&&(S.svgI.fill=[S.svgI.fill]),S.svgTemp=o.clone(S.svgI),delete S.svgTemp.svgAll,void 0!==S.svgTemp.fill&&(S.svgTemp.fill=S.svgTemp.fill[o[v].level],S.svg.length<=0&&(S.svg=m.find("svg")),S.svgPath.length<=0&&(S.svgPath=S.svg.find(S.svgI.svgAll?"path, circle, ellipse, line, polygon, polyline, rect":"path")),tpGS.gsap.set(S.svgPath,{fill:S.svgI.fill[o[v].level]})),tpGS.gsap.set(S.svg,S.svgTemp))}if("row"===S.type)for(i=0;i<4;i++)void 0!==e["margin"+t[i]]&&(R["padding"+t[i]]=e["margin"+t[i]]*L+"px");if("column"===S.type&&S.cbg&&S.cbg.length>0){for(void 0!==S.cbg_img_s&&(S.cbg[0].style.backgroundSize=S.cbg_img_s),s={},""!==S.styleProps.cursor&&(s.cursor=S.styleProps.cursor),""!==S.cbg_set&&"transparent"!==S.cbg_set&&(s.backgroundColor=S.cbg_set),""!==S.cbg_img&&"none"!==S.cbg_img&&(s.backgroundImage=S.cbg_img,""!==S.cbg_img_r&&(s.backgroundRepeat=S.cbg_img_r),""!==S.cbg_img_p&&(s.backgroundPosition=S.cbg_img_p)),""!==S.cbg_o&&void 0!==S.cbg_o&&(s.opacity=S.cbg_o),i=0;i<4;i++)void 0!==e.borderStyle&&"none"!==e.borderStyle&&(void 0!==e["border"+t[i]+"Width"]&&(s["border"+t[i]+"Width"]=Math.round(parseInt(e["border"+t[i]+"Width"])*L)+"px"),void 0!==e["border"+t[i]+"Color"]&&(s["border"+t[i]+"Color"]=e["border"+t[i]+"Color"])),e["border"+a[i]+"Radius"]&&(s["border"+a[i]+"Radius"]=e["border"+a[i]+"Radius"]);for(void 0!==e.borderStyle&&"none"!==e.borderStyle&&(s.borderStyle=e.borderStyle),(n=JSON.stringify(s))!==o[v].emptyObject&&n!==S.caches.cbgS&&tpGS.gsap.set(S.cbg,s),S.caches.cbgS=n,s={},i=0;i<4;i++)k["margin"+t[i]]&&(s[r[i]]=k["margin"+t[i]]*L+"px");(n=JSON.stringify(s))!==o[v].emptyObject&&n!==S.caches.cbgmaskS&&(tpGS.gsap.set(S.cbgmask,s),S.caches.cbgmaskS=n)}"auto"===R.maxWidth&&(R.maxWidth="inherit"),"auto"===R.maxHeight&&(R.maxHeight="inherit"),"auto"===_.maxWidth&&(_.maxWidth="inherit"),"auto"===_.maxHeight&&(_.maxHeight="inherit"),"auto"===O.maxWidth&&(O.maxWidth="inherit"),"auto"===O.maxHeight&&(O.maxHeight="inherit"),void 0!==S.vidOBJ&&(b.width=S.vidOBJ.width,b.height=S.vidOBJ.height),void 0!==S.OBJUPD.lppmOBJ&&(void 0!==S.OBJUPD.lppmOBJ.minWidth&&(O.minWidth=S.OBJUPD.lppmOBJ.minWidth,_.minWidth=S.OBJUPD.lppmOBJ.minWidth,R.minWidth=S.OBJUPD.lppmOBJ.minWidth),void 0!==S.OBJUPD.lppmOBJ.minHeight&&(O.minHeight=S.OBJUPD.lppmOBJ.minHeight,_.minHeight=S.OBJUPD.lppmOBJ.minHeight,R.minHeight=S.OBJUPD.lppmOBJ.minHeight)),n=JSON.stringify(b),d=JSON.stringify(O),l=JSON.stringify(_),c=JSON.stringify(R),void 0===S.imgOBJ||void 0!==S.caches.imgOBJ&&S.caches.imgOBJ.width===S.imgOBJ.width&&S.caches.imgOBJ.height===S.imgOBJ.height&&S.caches.imgOBJ.left===S.imgOBJ.left&&S.caches.imgOBJ.right===S.imgOBJ.right&&S.caches.imgOBJ.top===S.imgOBJ.top&&S.caches.imgOBJ.bottom===S.imgOBJ.bottom||(S.caches.imgOBJ=o.clone(S.imgOBJ),S.imgOBJ.position="relative",tpGS.gsap.set(S.img,S.imgOBJ)),void 0===S.mediaOBJ||void 0!==S.caches.mediaOBJ&&S.caches.mediaOBJ.width===S.mediaOBJ.width&&S.caches.mediaOBJ.height===S.mediaOBJ.height&&S.caches.mediaOBJ.display===S.mediaOBJ.display||(S.caches.mediaOBJ=o.clone(S.mediaOBJ),S.media.css(S.mediaOBJ)),n!=o[v].emptyObject&&n!=S.caches.LOBJ&&(tpGS.gsap.set(m,b),S.caches.LOBJ=n),d!=o[v].emptyObject&&d!=S.caches.LPOBJ&&(tpGS.gsap.set(S.lp,O),S.caches.LPOBJ=d),l!=o[v].emptyObject&&l!=S.caches.MOBJ&&(tpGS.gsap.set(S.m,_),S.caches.MOBJ=l),c!=o[v].emptyObject&&c!=S.caches.POBJ&&(tpGS.gsap.set(S.p,R),S.caches.POBJ=c,S.caches.POBJ_LEFT=R.left,S.caches.POBJ_TOP=R.top)}},z=function(e){var i={l:"none",lw:10,r:"none",rw:10};for(var t in e=e.split(";"))if(e.hasOwnProperty(t)){var a=e[t].split(":");switch(a[0]){case"l":i.l=a[1];break;case"r":i.r=a[1];break;case"lw":i.lw=a[1];break;case"rw":i.rw=a[1]}}return"polygon("+G(i.l,0,parseFloat(i.lw))+","+G(i.r,100,100-parseFloat(i.rw),!0)+")"},G=function(e,i,t,a){var r;switch(e){case"none":r=i+"% 100%,"+i+"% 0%";break;case"top":r=t+"% 100%,"+i+"% 0%";break;case"middle":r=t+"% 100%,"+i+"% 50%,"+t+"% 0%";break;case"bottom":r=i+"% 100%,"+t+"% 0%";break;case"two":r=t+"% 100%,"+i+"% 75%,"+t+"% 50%,"+i+"% 25%,"+t+"% 0%";break;case"three":r=i+"% 100%,"+t+"% 75%,"+i+"% 50%,"+t+"% 25%,"+i+"% 0%";break;case"four":r=i+"% 100%,"+t+"% 87.5%,"+i+"% 75%,"+t+"% 62.5%,"+i+"% 50%,"+t+"% 37.5%,"+i+"% 25%,"+t+"% 12.5%,"+i+"% 0%";break;case"five":r=i+"% 100%,"+t+"% 90%,"+i+"% 80%,"+t+"% 70%,"+i+"% 60%,"+t+"% 50%,"+i+"% 40%,"+t+"% 30%,"+i+"% 20%,"+t+"% 10%,"+i+"% 0%"}if(a){var o=r.split(",");for(var t in r="",o)o.hasOwnProperty(t)&&(r+=o[o.length-1-t]+(t<o.length-1?",":""))}return r};window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.layeranimation={loaded:!0,version:"6.4.0"},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}(jQuery),function(e){"use strict";jQuery.fn.revolution=jQuery.fn.revolution||{};var i=jQuery.fn.revolution;function t(e,t){var a=new Object({single:".tp-"+t,c:i[e].cpar.find(".tp-"+t+"s")});return a.mask=a.c.find(".tp-"+t+"-mask"),a.wrap=a.c.find(".tp-"+t+"s-inner-wrapper"),a}jQuery.extend(!0,i,{hideUnHideNav:function(e){window.requestAnimationFrame(function(){var t=!1;c(i[e].navigation.arrows)&&(t=S(i[e].navigation.arrows,e,t)),c(i[e].navigation.bullets)&&(t=S(i[e].navigation.bullets,e,t)),c(i[e].navigation.thumbnails)&&(t=S(i[e].navigation.thumbnails,e,t)),c(i[e].navigation.tabs)&&(t=S(i[e].navigation.tabs,e,t)),t&&i.manageNavigation(e)})},getOuterNavDimension:function(e){i[e].navigation.scaler=Math.max(0,Math.min(1,(i.winW-480)/500));var t={left:0,right:0,horizontal:0,vertical:0,top:0,bottom:0};return i[e].navigation.thumbnails&&i[e].navigation.thumbnails.enable&&(i[e].navigation.thumbnails.isVisible=i[e].navigation.thumbnails.hide_under<i[e].module.width&&i[e].navigation.thumbnails.hide_over>i[e].module.width,i[e].navigation.thumbnails.cw=Math.max(Math.round(i[e].navigation.thumbnails.width*i[e].navigation.scaler),i[e].navigation.thumbnails.min_width),i[e].navigation.thumbnails.ch=Math.round(i[e].navigation.thumbnails.cw/i[e].navigation.thumbnails.width*i[e].navigation.thumbnails.height),i[e].navigation.thumbnails.isVisible&&"outer-left"===i[e].navigation.thumbnails.position?t.left=i[e].navigation.thumbnails.cw+2*i[e].navigation.thumbnails.wrapper_padding:i[e].navigation.thumbnails.isVisible&&"outer-right"===i[e].navigation.thumbnails.position?t.right=i[e].navigation.thumbnails.cw+2*i[e].navigation.thumbnails.wrapper_padding:i[e].navigation.thumbnails.isVisible&&"outer-top"===i[e].navigation.thumbnails.position?t.top=i[e].navigation.thumbnails.ch+2*i[e].navigation.thumbnails.wrapper_padding:i[e].navigation.thumbnails.isVisible&&"outer-bottom"===i[e].navigation.thumbnails.position&&(t.bottom=i[e].navigation.thumbnails.ch+2*i[e].navigation.thumbnails.wrapper_padding)),i[e].navigation.tabs&&i[e].navigation.tabs.enable&&(i[e].navigation.tabs.isVisible=i[e].navigation.tabs.hide_under<i[e].module.width&&i[e].navigation.tabs.hide_over>i[e].module.width,i[e].navigation.tabs.cw=Math.max(Math.round(i[e].navigation.tabs.width*i[e].navigation.scaler),i[e].navigation.tabs.min_width),i[e].navigation.tabs.ch=Math.round(i[e].navigation.tabs.cw/i[e].navigation.tabs.width*i[e].navigation.tabs.height),i[e].navigation.tabs.isVisible&&"outer-left"===i[e].navigation.tabs.position?t.left+=i[e].navigation.tabs.cw+2*i[e].navigation.tabs.wrapper_padding:i[e].navigation.tabs.isVisible&&"outer-right"===i[e].navigation.tabs.position?t.right+=i[e].navigation.tabs.cw+2*i[e].navigation.tabs.wrapper_padding:i[e].navigation.tabs.isVisible&&"outer-top"===i[e].navigation.tabs.position?t.top+=i[e].navigation.tabs.ch+2*i[e].navigation.tabs.wrapper_padding:i[e].navigation.tabs.isVisible&&"outer-bottom"===i[e].navigation.tabs.position&&(t.bottom+=i[e].navigation.tabs.ch+2*i[e].navigation.tabs.wrapper_padding)),{left:t.left,right:t.right,horizontal:t.left+t.right,vertical:t.top+t.bottom,top:t.top,bottom:t.bottom}},resizeThumbsTabs:function(e,t){if(void 0!==i[e]&&i[e].navigation.use&&(i[e].navigation&&i[e].navigation.bullets.enable||i[e].navigation&&i[e].navigation.tabs.enable||i[e].navigation&&i[e].navigation.thumbnails.enable)){var a=tpGS.gsap.timeline(),o=i[e].navigation.tabs,s=i[e].navigation.thumbnails,n=i[e].navigation.bullets;if(a.pause(),c(o)&&(t||o.width>o.min_width)&&r(e,a,i[e].c,o,i[e].slideamount,"tab"),c(s)&&(t||s.width>s.min_width)&&r(e,a,i[e].c,s,i[e].slideamount,"thumb",e),c(n)&&t){var d=i[e].c.find(".tp-bullets");d.find(".tp-bullet").each(function(e){var i=jQuery(this),t=e+1,a=i.outerWidth()+parseInt(void 0===n.space?0:n.space,0),r=i.outerHeight()+parseInt(void 0===n.space?0:n.space,0);"vertical"===n.direction?(i.css({top:(t-1)*r+"px",left:"0px"}),d.css({height:(t-1)*r+i.outerHeight(),width:i.outerWidth()})):(i.css({left:(t-1)*a+"px",top:"0px"}),d.css({width:(t-1)*a+i.outerWidth(),height:i.outerHeight()}))})}a.play()}return!0},updateNavIndexes:function(e){var t=i[e].c;function a(e){t.find(e).lenght>0&&t.find(e).each(function(e){jQuery(this).data("liindex",e)})}a("rs-tab"),a("rs-bullet"),a("rs-thumb"),i.resizeThumbsTabs(e,!0),i.manageNavigation(e)},manageNavigation:function(e,t){i[e].navigation.use&&(c(i[e].navigation.bullets)&&("fullscreen"!=i[e].sliderLayout&&"fullwidth"!=i[e].sliderLayout&&(i[e].navigation.bullets.h_offset_old=void 0===i[e].navigation.bullets.h_offset_old?parseInt(i[e].navigation.bullets.h_offset,0):i[e].navigation.bullets.h_offset_old,i[e].navigation.bullets.h_offset="center"===i[e].navigation.bullets.h_align?i[e].navigation.bullets.h_offset_old+i[e].outNavDims.left/2-i[e].outNavDims.right/2:i[e].navigation.bullets.h_offset_old+i[e].outNavDims.left),w(i[e].navigation.bullets,e)),c(i[e].navigation.thumbnails)&&w(i[e].navigation.thumbnails,e),c(i[e].navigation.tabs)&&w(i[e].navigation.tabs,e),c(i[e].navigation.arrows)&&("fullscreen"!=i[e].sliderLayout&&"fullwidth"!=i[e].sliderLayout&&(i[e].navigation.arrows.left.h_offset_old=void 0===i[e].navigation.arrows.left.h_offset_old?parseInt(i[e].navigation.arrows.left.h_offset,0):i[e].navigation.arrows.left.h_offset_old,i[e].navigation.arrows.left.h_offset=(i[e].navigation.arrows.left.h_align,i[e].navigation.arrows.left.h_offset_old),i[e].navigation.arrows.right.h_offset_old=void 0===i[e].navigation.arrows.right.h_offset_old?parseInt(i[e].navigation.arrows.right.h_offset,0):i[e].navigation.arrows.right.h_offset_old,i[e].navigation.arrows.right.h_offset=(i[e].navigation.arrows.right.h_align,i[e].navigation.arrows.right.h_offset_old)),w(i[e].navigation.arrows.left,e),w(i[e].navigation.arrows.right,e)),!1!==t&&(c(i[e].navigation.thumbnails)&&a(i[e].navigation.thumbnails,e),c(i[e].navigation.tabs)&&a(i[e].navigation.tabs,e)))},showFirstTime:function(e){g(e),i.hideUnHideNav(e)},selectNavElement:function(e,t,a,r){for(var o=i[e].cpar[0].getElementsByClassName(a),s=0;s<o.length;s++)i.gA(o[s],"key")===t?(o[s].classList.add("selected"),void 0!==r&&r()):o[s].classList.remove("selected")},transferParams:function(e,i){if(void 0!==i)for(var t in i.params)e=e.replace(i.params[t].from,i.params[t].to);return e},updateNavElementContent:function(e,t,r,o,s){if(void 0!==i[e].pr_next_key||void 0!==i[e].pr_active_key){var n=void 0===i[e].pr_next_key?void 0===i[e].pr_cache_pr_next_key?i[e].pr_active_key:i[e].pr_cache_pr_next_key:i[e].pr_next_key,d=i.gA(i[e].slides[n],"key"),l=0,c=!1;for(var p in r.enable&&i.selectNavElement(e,d,"tp-bullet"),o.enable&&i.selectNavElement(e,d,"tp-thumb",function(){a(o,e)}),s.enable&&i.selectNavElement(e,d,"tp-tab",function(){a(s,e)}),i[e].thumbs)l=!0===c?l:p,c=i[e].thumbs[p].id===d||p==d||c;var g=(l=parseInt(l,0))>0?l-1:i[e].slideamount-1,u=l+1==i[e].slideamount?0:l+1;if(!0===t.enable&&t.pi!==g&&t.ni!==u){if(t.pi=g,t.ni=u,t.left.c[0].innerHTML=i.transferParams(t.tmp,i[e].thumbs[g]),u>i[e].slideamount)return;t.right.c[0].innerHTML=i.transferParams(t.tmp,i[e].thumbs[u]),t.right.iholder=t.right.c.find(".tp-arr-imgholder"),t.left.iholder=t.left.c.find(".tp-arr-imgholder"),t.rtl?(void 0!==t.left.iholder[0]&&tpGS.gsap.set(t.left.iholder,{backgroundImage:"url("+i[e].thumbs[u].src+")"}),void 0!==i[e].thumbs[g]&&void 0!==t.right.iholder[0]&&tpGS.gsap.set(t.right.iholder,{backgroundImage:"url("+i[e].thumbs[g].src+")"})):(void 0!==i[e].thumbs[g]&&void 0!==t.left.iholder[0]&&tpGS.gsap.set(t.left.iholder,{backgroundImage:"url("+i[e].thumbs[g].src+")"}),void 0!==t.right.iholder[0]&&tpGS.gsap.set(t.right.iholder,{backgroundImage:"url("+i[e].thumbs[u].src+")"}))}}},createNavigation:function(e){var a=i[e].navigation.arrows,r=i[e].navigation.bullets,n=i[e].navigation.thumbnails,u=i[e].navigation.tabs,m=c(a),f=c(r),y=c(n),S=c(u);for(var x in o(e),s(e),m&&(v(a,e),a.c=i[e].cpar.find(".tparrows")),i[e].slides)if(i[e].slides.hasOwnProperty(x)&&"true"!=i.gA(i[e].slides[x],"not_in_nav")){var k=jQuery(i[e].slides[i[e].slides.length-1-x]),L=jQuery(i[e].slides[x]);f&&(i[e].navigation.bullets.rtl?b(i[e].c,r,k,e):b(i[e].c,r,L,e)),y&&(i[e].navigation.thumbnails.rtl?_(i[e].c,n,k,"tp-thumb",e):_(i[e].c,n,L,"tp-thumb",e)),S&&(i[e].navigation.tabs.rtl?_(i[e].c,u,k,"tp-tab",e):_(i[e].c,u,L,"tp-tab",e))}f&&w(r,e),y&&w(n,e),S&&w(u,e),(y||S)&&i.updateDims(e),i[e].navigation.createNavigationDone=!0,y&&jQuery.extend(!0,n,t(e,"thumb")),S&&jQuery.extend(!0,u,t(e,"tab")),i[e].c.on("revolution.slide.onafterswap revolution.nextslide.waiting",function(){i.updateNavElementContent(e,a,r,n,u)}),l(a),l(r),l(n),l(u),i[e].cpar.on("mouseenter mousemove",function(t){void 0!==t.target&&void 0!==t.target.className&&"string"==typeof t.target.className&&t.target.className.indexOf("rs-waction")>=0||!0!==i[e].tpMouseOver&&i[e].firstSlideAvailable&&(i[e].tpMouseOver=!0,g(e),i.ISM&&!0!==i[e].someNavIsDragged&&(p(i[e].hideAllNavElementTimer),i[e].hideAllNavElementTimer=setTimeout(function(){i[e].tpMouseOver=!1,h(e)},150)))}),i[e].cpar.on("mouseleave ",function(){i[e].tpMouseOver=!1,h(e)}),(y||S||"carousel"===i[e].sliderType||i[e].navigation.touch.touchOnDesktop||i[e].navigation.touch.touchenabled&&i.ISM)&&d(e),i[e].navigation.initialised=!0,i.updateNavElementContent(e,a,r,n,u),i.showFirstTime(e)}});var a=function(e,t){if(void 0!==e&&null!=e.mask){var a="vertical"===e.direction?e.mask.find(e.single).first().outerHeight(!0)+e.space:e.mask.find(e.single).first().outerWidth(!0)+e.space,r="vertical"===e.direction?e.mask.height():e.mask.width(),o=e.mask.find(e.single+".selected").data("liindex");o=(o=void 0===(o=e.rtl?i[t].slideamount-o:o)?0:o)>0&&1===i[t].sdir&&e.visibleAmount>1?o-1:o;var s=r/a,n="vertical"===e.direction?e.mask.height():e.mask.width(),d=0-o*a,l="vertical"===e.direction?e.wrap.height():e.wrap.width(),c=d<0-(l-n)?0-(l-n):d,p=i.gA(e.wrap[0],"offset");p=void 0===p?0:p,s>2&&(c=d-(p+a)<=0?d-(p+a)<0-a?p:c+a:c,c=d-a+p+r<a&&d+(Math.round(s)-2)*a<p?d+(Math.round(s)-2)*a:c),c="vertical"!==e.direction&&e.mask.width()>=e.wrap.width()||"vertical"===e.direction&&e.mask.height()>=e.wrap.height()?0:c<0-(l-n)?0-(l-n):c>0?0:c,e.c.hasClass("dragged")||("vertical"===e.direction?e.wrap.data("tmmove",tpGS.gsap.to(e.wrap,.5,{top:c+"px",ease:"power3.inOut"})):e.wrap.data("tmmove",tpGS.gsap.to(e.wrap,.5,{left:c+"px",ease:"power3.inOut"})),e.wrap.data("offset",c))}},r=function(e,t,a,r,o,s){var n=a.parent().find(".tp-"+s+"s"),d=n.find(".tp-"+s+"s-inner-wrapper"),l=n.find(".tp-"+s+"-mask"),c="vertical"===r.direction?r.cw:r.cw*o+parseFloat(r.space)*(o-1),p="vertical"===r.direction?r.ch*o+parseInt(r.space)*(o-1):r.ch,g="vertical"===r.direction?{width:r.cw+"px"}:{height:r.ch+"px"};if(t.add(tpGS.gsap.set(n,g)),t.add(tpGS.gsap.set(d,{width:c+"px",height:p+"px"})),"horizontal"===r.direction){var u=Math.min(c,r.cw*r.visibleAmount+parseFloat(r.space)*(r.visibleAmount-1));t.add(tpGS.gsap.set(l,{width:u+"px",height:p+"px"}))}else{var h=Math.min(p,r.ch*r.visibleAmount+parseFloat(r.space)*(r.visibleAmount-1));t.add(tpGS.gsap.set(l,{width:c+"px",height:h+"px"}))}null!==d.outerWidth()&&(i[e].thumbResized=!0);var m=d.find(".tp-"+s);return m&&jQuery.each(m,function(e,i){"vertical"===r.direction?t.add(tpGS.gsap.set(i,{top:e*(r.ch+parseInt(void 0===r.space?0:r.space,0)),width:r.cw+"px",height:r.ch+"px"})):"horizontal"===r.direction&&t.add(tpGS.gsap.set(i,{left:e*(r.cw+parseInt(void 0===r.space?0:r.space,0)),width:r.cw+"px",height:r.ch+"px"}))}),t},o=function(e){!0===i[e].navigation.keyboardNavigation&&i.document.on("keydown",function(t){if("horizontal"==i[e].navigation.keyboard_direction&&39==t.keyCode||"vertical"==i[e].navigation.keyboard_direction&&40==t.keyCode){if(void 0!==i[e].keydown_time_stamp&&(new Date).getTime()-i[e].keydown_time_stamp<1e3)return;i[e].sc_indicator="arrow",i[e].sc_indicator_dir=0,"carousel"===i[e].sliderType&&(i[e].ctNavElement=!0),i.callingNewSlide(e,1,"carousel"===i[e].sliderType)}if("horizontal"==i[e].navigation.keyboard_direction&&37==t.keyCode||"vertical"==i[e].navigation.keyboard_direction&&38==t.keyCode){if(void 0!==i[e].keydown_time_stamp&&(new Date).getTime()-i[e].keydown_time_stamp<1e3)return;i[e].sc_indicator="arrow",i[e].sc_indicator_dir=1,"carousel"===i[e].sliderType&&(i[e].ctNavElement=!0),i.callingNewSlide(e,-1,"carousel"===i[e].sliderType)}i[e].keydown_time_stamp=(new Date).getTime()})},s=function(e){!0!==i[e].navigation.mouseScrollNavigation&&"on"!==i[e].navigation.mouseScrollNavigation&&"carousel"!==i[e].navigation.mouseScrollNavigation||i[e].c.on("wheel mousewheel DOMMouseScroll",function(t){var a=function(e){var i=0;return"deltaY"in e||"deltaX"in e?i=0!=e.deltaY&&-0!=e.deltaY||!(e.deltaX<0||e.deltaX>0)?e.deltaY:e.deltaX:("detail"in e&&(i=e.detail),"wheelDelta"in e&&(i=-e.wheelDelta/120),"wheelDeltaY"in e&&(i=-e.wheelDeltaY/120)),((i=navigator.userAgent.match(/mozilla/i)?10*i:i)>300||i<-300)&&(i/=10),i}(t.originalEvent),r=!1,o=0==i[e].pr_active_key||0==i[e].pr_processing_key,s=i[e].pr_active_key==i[e].slideamount-1||i[e].pr_processing_key==i[e].slideamount-1,n=void 0!==i[e].topc?i[e].topc[0].getBoundingClientRect():0===i[e].canv.height?i[e].cpar[0].getBoundingClientRect():i[e].c[0].getBoundingClientRect(),d=n.top>=0&&n.bottom<=i.winH?1:n.top>=0&&n.bottom>=i.winH?(i.winH-Math.round(n.top))/n.height:n.top<=0&&n.bottom<=i.winH?Math.round(n.bottom)/n.height:1,l=a<0?-1:1,c=i[e].navigation.wheelViewPort;if(d=Math.round(100*d)/100,"reverse"==i[e].navigation.mouseScrollReverse){var p=s;s=o,o=p}if(!(c-d<=i[e].navigation.threshold/100)||d>=c||(n.top>=0&&-1===l||n.top<=0&&1===l)){if(d>=c)return"carousel"===i[e].sliderType&&!1===i[e].carousel.snap?i.swipeAnimate({id:e,to:i[e].carousel.slide_offset+5*a,direction:a<0?"left":"right",easing:"power2.out",phase:"move"}):(i[e].sc_indicator_dir="reverse"===i[e].navigation.mouseScrollReverse&&l<0||"reverse"!==i[e].navigation.mouseScrollReverse&&l>0?"reverse"!==i[e].navigation.mouseScrollReverse?0:1:"reverse"!==i[e].navigation.mouseScrollReverse?1:0,"carousel"==i[e].navigation.mouseScrollNavigation||0===i[e].sc_indicator_dir&&!s||1===i[e].sc_indicator_dir&&!o?void 0===i[e].pr_processing_key&&!0!==i[e].justmouseScrolled?(i[e].sc_indicator="arrow","carousel"===i[e].sliderType&&(i[e].ctNavElement=!0),i.callingNewSlide(e,0===i[e].sc_indicator_dir?"reverse"===i[e].navigation.mouseScrollReverse?-1:1:"reverse"===i[e].navigation.mouseScrollReverse?1:-1,"carousel"===i[e].sliderType),i[e].justmouseScrolled=!0,setTimeout(function(){i[e].justmouseScrolled=!1},i[e].navigation.wheelCallDelay)):delete i[e].sc_indicator_dir:!0!==i[e].justmouseScrolled&&(r=!0)),!!r||(t.preventDefault(t),!1)}else if(t.preventDefault(),!i[e].mScrollTween){var g="window"!==i[e].navigation.target&&i[e].navigation.target?i[e].navigation.target:window;i[e].mScrollTween=tpGS.gsap.to(g,{duration:jQuery.fn.revolution.isWebkit()?.1:.7,scrollTo:{y:i[e].topc},ease:"power2.out",onComplete:function(){i[e].mScrollTween.kill(),delete i[e].mScrollTween}})}})},n=function(e,t){var a=!1;for(var r in(void 0===t.path||i.ISM)&&(a=function(e,i){for(;e&&e!==document;e=e.parentNode)if(e.tagName===i)return e;return!1}(t.target,e)),t.path)t.path.hasOwnProperty(r)&&t.path[r].tagName===e&&(a=!0);return a},d=function(e){var t=i[e].carousel,a=i.is_android();jQuery(".bullet, .bullets, .tp-bullets, .tparrows").addClass("noSwipe"),i[e].navigation.touch=void 0===i[e].navigation.touch?{}:i[e].navigation.touch,i[e].navigation.touch.swipe_direction=void 0===i[e].navigation.touch.swipe_direction?"horizontal":i[e].navigation.touch.swipe_direction,i[e].cpar.find(".rs-nav-element").rsswipe({allowPageScroll:"vertical",triggerOnTouchLeave:!0,treshold:i[e].navigation.touch.swipe_treshold,fingers:i[e].navigation.touch.swipe_min_touches>5?1:i[e].navigation.touch.swipe_min_touches,excludedElements:"button, input, select, textarea, .noSwipe, .rs-waction",tap:function(e,i){if(void 0!==i)var t=jQuery(i).closest("rs-thumb");void 0!==t&&t.length>0?t.trigger("click"):(t=jQuery(i).closest("rs-tab")).length>0?t.trigger("click"):(t=jQuery(i).closest("rs-bullet")).length>0&&t.trigger("click")},swipeStatus:function(r,o,s,d,l,c,g){if("start"!==o&&"move"!==o&&"end"!==o&&"cancel"!=o)return!0;var h=n("RS-THUMB",r),m=n("RS-TAB",r);!1===h&&!1===m&&!0!==(h="RS-THUMBS-WRAP"===r.target.tagName||"RS-THUMBS"===r.target.tagName||r.target.className.indexOf("tp-thumb-mask")>=0)&&(m="RS-TABS-WRAP"===r.target.tagName||"RS-TABS"===r.target.tagName||r.target.className.indexOf("tp-tab-mask")>=0);var v="start"===o?0:a?g[0].end.x-g[0].start.x:r.pageX-t.screenX,f="start"===o?0:a?g[0].end.y-g[0].start.y:r.pageY-t.screenY,y=h?".tp-thumbs":".tp-tabs",w=h?".tp-thumb-mask":".tp-tab-mask",b=h?".tp-thumbs-inner-wrapper":".tp-tabs-inner-wrapper",_=h?".tp-thumb":".tp-tab",S=h?i[e].navigation.thumbnails:i[e].navigation.tabs,x=i[e].cpar.find(w),k=x.find(b),L=S.direction,R="vertical"===L?k.height():k.width(),O="vertical"===L?x.height():x.width(),I="vertical"===L?x.find(_).first().outerHeight(!0)+parseFloat(S.space):x.find(_).first().outerWidth(!0)+parseFloat(S.space),M=void 0===k.data("offset")?0:parseInt(k.data("offset"),0),C=0;switch(o){case"start":"vertical"===L&&r.preventDefault(),t.screenX=a?g[0].end.x:r.pageX,t.screenY=a?g[0].end.y:r.pageY,i[e].cpar.find(y).addClass("dragged"),M="vertical"===L?k.position().top:k.position().left,k.data("offset",M),k.data("tmmove")&&k.data("tmmove").pause(),i[e].someNavIsDragged=!0,u(e);break;case"move":if(R<=O)return!1;C=(C=M+("vertical"===L?f:v))>0?"horizontal"===L?C-k.width()*(C/k.width()*C/k.width()):C-k.height()*(C/k.height()*C/k.height()):C;var T="vertical"===L?0-(k.height()-x.height()):0-(k.width()-x.width());C=C<T?"horizontal"===L?C+k.width()*(C-T)/k.width()*(C-T)/k.width():C+k.height()*(C-T)/k.height()*(C-T)/k.height():C,"vertical"===L?tpGS.gsap.set(k,{top:C+"px"}):tpGS.gsap.set(k,{left:C+"px"}),p(i[e].hideAllNavElementTimer);break;case"end":case"cancel":return C=M+("vertical"===L?f:v),C=(C="vertical"===L?C<0-(k.height()-x.height())?0-(k.height()-x.height()):C:C<0-(k.width()-x.width())?0-(k.width()-x.width()):C)>0?0:C,C=Math.abs(d)>I/10?d<=0?Math.floor(C/I)*I:Math.ceil(C/I)*I:d<0?Math.ceil(C/I)*I:Math.floor(C/I)*I,C=(C="vertical"===L?C<0-(k.height()-x.height())?0-(k.height()-x.height()):C:C<0-(k.width()-x.width())?0-(k.width()-x.width()):C)>0?0:C,"vertical"===L?tpGS.gsap.to(k,.5,{top:C+"px",ease:"power3.out"}):tpGS.gsap.to(k,.5,{left:C+"px",ease:"power3.out"}),C=C||("vertical"===L?k.position().top:k.position().left),k.data("offset",C),k.data("distance",d),i[e].cpar.find(y).removeClass("dragged"),i[e].someNavIsDragged=!1,!0}}}),("carousel"!==i[e].sliderType&&(i.ISM&&i[e].navigation.touch.touchenabled||!0!==i.ISM&&i[e].navigation.touch.touchOnDesktop)||"carousel"===i[e].sliderType&&(i.ISM&&i[e].navigation.touch.mobileCarousel||!0!==i.ISM&&i[e].navigation.touch.desktopCarousel))&&(i[e].preventClicks=!1,i[e].c.on("click",function(t){i[e].preventClicks&&t.preventDefault()}),i[e].c.rsswipe({allowPageScroll:"vertical",triggerOnTouchLeave:!0,treshold:i[e].navigation.touch.swipe_treshold,fingers:i[e].navigation.touch.swipe_min_touches>5?1:i[e].navigation.touch.swipe_min_touches,excludedElements:"label, button, input, select, textarea, .noSwipe, .rs-nav-element",swipeStatus:function(r,o,s,n,d,l,c){i[e].preventClicks=!0;var p="start"===o?0:a?c[0].end.x-c[0].start.x:r.pageX-t.screenX,g="start"===o?0:a?c[0].end.x-c[0].start.y:r.pageY-t.screenY;if(!("carousel"===i[e].sliderType&&i[e].carousel.wrapwidth>i[e].carousel.maxwidth&&"center"!==i[e].carousel.horizontal_align)){if("carousel"!==i[e].sliderType){if("end"==o){if(i[e].sc_indicator="arrow","horizontal"==i[e].navigation.touch.swipe_direction&&"left"==s||"vertical"==i[e].navigation.touch.swipe_direction&&"up"==s)return i[e].sc_indicator_dir=0,i.callingNewSlide(e,1),!1;if("horizontal"==i[e].navigation.touch.swipe_direction&&"right"==s||"vertical"==i[e].navigation.touch.swipe_direction&&"down"==s)return i[e].sc_indicator_dir=1,i.callingNewSlide(e,-1),!1}return!0}switch((t.preventSwipe||i.ISM&&("left"===s||"right"===s))&&r.preventDefault(),void 0!==t.positionanim&&t.positionanim.pause(),t.carouselAutomatic=!1,o){case"start":clearTimeout(t.swipeMainTimer),t.beforeSwipeOffet=t.slide_offset,t.focusedBeforeSwipe=t.focused,t.beforeDragStatus=i[e].sliderstatus,i[e].c.trigger("stoptimer"),t.swipeStartPos=a?c[0].start.x:r.pageX,t.swipeStartTime=(new Date).getTime(),t.screenX=a?c[0].end.x:r.pageX,t.screenY=a?c[0].end.y:r.pageY,void 0!==t.positionanim&&(t.positionanim.pause(),t.carouselAutomatic=!1),t.overpull="none",t.wrap.addClass("dragged");break;case"move":if("left"!==s&&"right"!==s||(t.preventSwipe=!0),t.justDragged=!0,Math.abs(p)>=10||i[e].carousel.isDragged){if(i[e].carousel.isDragged=!0,i[e].c.find(".rs-waction").addClass("tp-temporarydisabled"),t.CACHE_slide_offset=t.beforeSwipeOffet+p,!t.infinity){var u="center"===t.horizontal_align?(t.wrapwidth/2-t.slide_width/2-t.CACHE_slide_offset)/t.slide_width:(0-t.CACHE_slide_offset)/t.slide_width;"none"!==t.overpull&&0!==t.overpull||!(u<0||u>i[e].slideamount-1)?u>=0&&u<=i[e].slideamount-1&&(u>=0&&p>t.overpull||u<=i[e].slideamount-1&&p<t.overpull)&&(t.overpull=0):t.overpull=p,t.CACHE_slide_offset=u<0?t.CACHE_slide_offset+(t.overpull-p)/1.5+Math.sqrt(Math.abs((t.overpull-p)/1.5)):u>i[e].slideamount-1?t.CACHE_slide_offset+(t.overpull-p)/1.5-Math.sqrt(Math.abs((t.overpull-p)/1.5)):t.CACHE_slide_offset}i.swipeAnimate({id:e,to:t.CACHE_slide_offset,direction:s,easing:"power2.out",phase:"move"})}break;case"end":case"cancel":if(clearTimeout(t.swipeMainTimer),t.swipeMainTimer=setTimeout(function(){t.preventSwipe=!1},500),i[e].carousel.isDragged=!1,t.wrap.removeClass("dragged"),t.swipeEndPos=a?c[0].end.x:r.pageX,t.swipeEndTime=(new Date).getTime(),t.swipeDuration=t.swipeEndTime-t.swipeStartTime,t.swipeDistance=i.ISM?t.swipeEndPos-t.swipeStartPos:(t.swipeEndPos-t.swipeStartPos)/1.5,t.swipePower=t.swipeDistance/t.swipeDuration,t.CACHE_slide_offset=t.slide_offset+t.swipeDistance*Math.abs(t.swipePower),Math.abs(p)<5&&Math.abs(g)<5)break;i.swipeAnimate({id:e,to:t.CACHE_slide_offset,direction:s,fix:!0,newSlide:!0,easing:"power2.out",phase:"end"}),"playing"===t.beforeDragStatus&&i[e].c.trigger("restarttimer"),setTimeout(function(){i[e].c.find(".rs-waction").removeClass("tp-temporarydisabled")},19)}}},tap:function(){i[e].preventClicks=!1}})),"carousel"===i[e].sliderType&&(i.ISM&&0==i[e].navigation.touch.mobileCarousel||!0!==i.ISM&&!1===i[e].navigation.touch.desktopCarousel)&&t.wrap.addClass("noswipe"),i[e].navigation.touch.drag_block_vertical&&i[e].c.addClass("disableVerticalScroll")},l=function(e){e.hide_delay=i.isNumeric(parseInt(e.hide_delay,0))?e.hide_delay:.2,e.hide_delay_mobile=i.isNumeric(parseInt(e.hide_delay_mobile,0))?e.hide_delay_mobile:.2},c=function(e){return e&&e.enable},p=function(e){clearTimeout(e)},g=function(e){var t=i[e].navigation.maintypes;for(var a in t)t.hasOwnProperty(a)&&c(i[e].navigation[t[a]])&&void 0!==i[e].navigation[t[a]].c&&(p(i[e].navigation[t[a]].showCall),i[e].navigation[t[a]].showCall=setTimeout(function(t){p(t.hideCall),t.hide_onleave&&!0!==i[e].tpMouseOver||(void 0===t.tween?t.tween=m(t):t.tween.play())},i[e].navigation[t[a]].hide_onleave&&!0!==i[e].tpMouseOver?0:parseInt(i[e].navigation[t[a]].animDelay),i[e].navigation[t[a]]))},u=function(e){var t=i[e].navigation.maintypes;for(var a in t)t.hasOwnProperty(a)&&void 0!==i[e].navigation[t[a]]&&i[e].navigation[t[a]].hide_onleave&&c(i[e].navigation[t[a]])&&p(i[e].navigation[t[a]].hideCall)},h=function(e,t){var a=i[e].navigation.maintypes;for(var r in a)a.hasOwnProperty(r)&&void 0!==i[e].navigation[a[r]]&&i[e].navigation[a[r]].hide_onleave&&c(i[e].navigation[a[r]])&&(p(i[e].navigation[a[r]].hideCall),i[e].navigation[a[r]].hideCall=setTimeout(function(e){p(e.showCall),e.tween&&e.tween.reverse()},i.ISM?parseInt(i[e].navigation[a[r]].hide_delay_mobile,0):parseInt(i[e].navigation[a[r]].hide_delay,0),i[e].navigation[a[r]]))},m=function(e){e.speed=void 0===e.animSpeed?.5:e.animSpeed,e.anims=[],void 0!==e.anim&&void 0===e.left&&e.anims.push(e.anim),void 0!==e.left&&e.anims.push(e.left.anim),void 0!==e.right&&e.anims.push(e.right.anim);var i=tpGS.gsap.timeline();for(var t in i.add(tpGS.gsap.to(e.c,e.speed,{delay:e.animDelay,opacity:1,ease:"power3.inOut"}),0),e.anims)if(e.anims.hasOwnProperty(t))switch(e.anims[t]){case"left":i.add(tpGS.gsap.fromTo(e.c[t],e.speed,{marginLeft:-50},{delay:e.animDelay,marginLeft:0,ease:"power3.inOut"}),0);break;case"right":i.add(tpGS.gsap.fromTo(e.c[t],e.speed,{marginLeft:50},{delay:e.animDelay,marginLeft:0,ease:"power3.inOut"}),0);break;case"top":i.add(tpGS.gsap.fromTo(e.c[t],e.speed,{marginTop:-50},{delay:e.animDelay,marginTop:0,ease:"power3.inOut"}),0);break;case"bottom":i.add(tpGS.gsap.fromTo(e.c[t],e.speed,{marginTop:50},{delay:e.animDelay,marginTop:0,ease:"power3.inOut"}),0);break;case"zoomin":i.add(tpGS.gsap.fromTo(e.c[t],e.speed,{scale:.5},{delay:e.animDelay,scale:1,ease:"power3.inOut"}),0);break;case"zoomout":i.add(tpGS.gsap.fromTo(e.c[t],e.speed,{scale:1.2},{delay:e.animDelay,scale:1,ease:"power3.inOut"}),0)}return i.play(),i},v=function(e,t){e.style=void 0===e.style?"":e.style,e.left.style=void 0===e.left.style?"":e.left.style,e.right.style=void 0===e.right.style?"":e.right.style,void 0===e.left.c&&(e.left.c=jQuery('<rs-arrow style="opacity:0" class="tp-leftarrow tparrows '+e.style+" "+e.left.style+'">'+e.tmp+"</rs-arrow>"),i[t].c.append(e.left.c)),void 0===e.right.c&&(e.right.c=jQuery('<rs-arrow style="opacity:0"  class="tp-rightarrow tparrows '+e.style+" "+e.right.style+'">'+e.tmp+"</rs-arrow>"),i[t].c.append(e.right.c)),e[e.rtl?"left":"right"].c.on("click",function(){"carousel"===i[t].sliderType&&(i[t].ctNavElement=!0),i[t].sc_indicator="arrow",i[t].sc_indicator_dir=0,i[t].c.revnext()}),e[e.rtl?"right":"left"].c.on("click",function(){"carousel"===i[t].sliderType&&(i[t].ctNavElement=!0),i[t].sc_indicator="arrow",i[t].sc_indicator_dir=1,i[t].c.revprev()}),e.padding_top=parseInt(i[t].carousel.padding_top||0,0),e.padding_bottom=parseInt(i[t].carousel.padding_bottom||0,0),w(e.left,t),w(e.right,t),"outer-left"!=e.position&&"outer-right"!=e.position||(i[t].outernav=!0)},f=function(e,t,a,r){r=void 0===r?e.outerHeight(!0):r;var o=null==i[a]?0:0==i[a].canv.height?i[a].module.height:i[a].canv.height,s="layergrid"==t.container?"fullscreen"==i[a].sliderLayout?i[a].module.height/2-i[a].gridheight[i[a].level]*i[a].CM.h/2:i[a].autoHeight||null!=i[a].minHeight&&i[a].minHeight>0?o/2-i[a].gridheight[i[a].level]*i[a].CM.h/2:0:0,n="top"===t.v_align?{top:"0px",y:Math.round(t.v_offset+s)+"px"}:"center"===t.v_align?{top:"50%",y:Math.round(0-r/2+t.v_offset)+"px"}:{top:"100%",y:Math.round(0-(r+t.v_offset+s))+"px"};e.hasClass("outer-bottom")||tpGS.gsap.set(e,n)},y=function(e,t,a,r){r=void 0===r?e.outerWidth():r;var o="layergrid"===t.container?i[a].module.width/2-i[a].gridwidth[i[a].level]*i[a].CM.w/2:0,s="left"===t.h_align?{left:"0px",x:Math.round(t.h_offset+o)+"px"}:"center"===t.h_align?{left:"50%",x:Math.round(0-r/2+t.h_offset)+"px"}:{left:"100%",x:Math.round(0-(r+t.h_offset+o))+"px"};tpGS.gsap.set(e,s)},w=function(e,t){if(null!=e&&void 0!==e.c){var a="fullwidth"==i[t].sliderLayout||"fullscreen"==i[t].sliderLayout?i[t].module.width:i[t].canv.width,r=e.c.outerWidth(),o=e.c.outerHeight();if(!(r<=0||o<=0)&&(f(e.c,e,t,o),y(e.c,e,t,r),"outer-left"===e.position?tpGS.gsap.set(e.c,{left:0-r+"px",x:e.h_offset+"px"}):"outer-right"===e.position&&tpGS.gsap.set(e.c,{right:0-r+"px",x:e.h_offset+"px"}),"tp-thumb"===e.type||"tp-tab"===e.type)){var s=parseInt(e.padding_top||0,0),n=parseInt(e.padding_bottom||0,0),d={},l={};e.maxw>a&&"outer-left"!==e.position&&"outer-right"!==e.position?(d.left="0px",d.x=0,d.maxWidth=a-2*e.wpad+"px",l.maxWidth=a-2*e.wpad+"px"):(d.maxWidth=e.maxw,l.maxWidth=a+"px"),e.maxh+2*e.wpad>i[t].conh&&"outer-bottom"!==e.position&&"outer-top"!==e.position?(d.top="0px",d.y=0,d.maxHeight=s+n+(i[t].conh-2*e.wpad)+"px",l.maxHeight=s+n+(i[t].conh-2*e.wpad)+"px"):(d.maxHeight=e.maxh+"px",l.maxHeight=e.maxh+"px"),e.mask=void 0===e.mask?e.c.find("rs-navmask"):e.mask,(e.mhoff>0||e.mvoff>0)&&(l.padding=e.mvoff+"px "+e.mhoff+"px"),e.span?("layergrid"==e.container&&"outer-left"!==e.position&&"outer-right"!==e.position&&(s=n=0),"vertical"===e.direction?(d.maxHeight=s+n+(i[t].conh-2*e.wpad)+"px",d.height=s+n+(i[t].conh-2*e.wpad)+"px",d.top=0,d.y=0,l.maxHeight=s+n+Math.min(e.maxh,i[t].conh-2*e.wpad)+"px",tpGS.gsap.set(e.c,d),tpGS.gsap.set(e.mask,l),f(e.mask,e,t)):"horizontal"===e.direction&&(d.maxWidth="100%",d.width=a-2*e.wpad+"px",d.left=0,d.x=0,l.maxWidth=e.maxw>=a?"100%":Math.min(e.maxw,a)+"px",tpGS.gsap.set(e.c,d),tpGS.gsap.set(e.mask,l),y(e.mask,e,t))):(tpGS.gsap.set(e.c,d),tpGS.gsap.set(e.mask,l))}}},b=function(e,t,a,r){0===e.find(".tp-bullets").length&&(t.style=void 0===t.style?"":t.style,t.c=jQuery('<rs-bullets style="opacity:0"  class="tp-bullets '+t.style+" "+t.direction+" nav-pos-hor-"+t.h_align+" nav-pos-ver-"+t.v_align+" nav-dir-"+t.direction+'"></rs-bullets>'));var o=a.data("key"),s=t.tmp;void 0!==i[r].thumbs[a.index()]&&jQuery.each(i[r].thumbs[a.index()].params,function(e,i){s=s.replace(i.from,i.to)});var n=jQuery('<rs-bullet data-key="'+o+'" class="tp-bullet">'+s+"</rs-bullet>");void 0!==i[r].thumbs[a.index()]&&n.find(".tp-bullet-image").css({backgroundImage:"url("+i[r].thumbs[a.index()].src+")"}),t.c.append(n),e.append(t.c);var d=t.c.find(".tp-bullet").length,l=n.outerWidth(),c=n.outerHeight(),p=l+parseInt(void 0===t.space?0:t.space,0),g=c+parseInt(void 0===t.space?0:t.space,0);"vertical"===t.direction?(n.css({top:(d-1)*g+"px",left:"0px"}),t.c.css({height:(d-1)*g+c,width:l})):(n.css({left:(d-1)*p+"px",top:"0px"}),t.c.css({width:(d-1)*p+l,height:c})),n.on("click",function(){"carousel"===i[r].sliderType&&(i[r].ctNavElement=!0),i[r].sc_indicator="bullet",e.revcallslidewithid(o),e.find(".tp-bullet").removeClass("selected"),jQuery(this).addClass("selected")}),t.padding_top=parseInt(i[r].carousel.padding_top||0,0),t.padding_bottom=parseInt(i[r].carousel.padding_bottom||0,0),"outer-left"!=t.position&&"outer-right"!=t.position||(i[r].outernav=!0)},_=function(e,t,a,r,o){var s="tp-thumb"===r?".tp-thumbs":".tp-tabs",n="tp-thumb"===r?".tp-thumb-mask":".tp-tab-mask",d="tp-thumb"===r?".tp-thumbs-inner-wrapper":".tp-tabs-inner-wrapper",l="tp-thumb"===r?".tp-thumb":".tp-tab",c="tp-thumb"===r?".tp-thumb-image":".tp-tab-image",p="tp-thumb"===r?"rs-thumb":"rs-tab";t.type=r,t.visibleAmount=t.visibleAmount>i[o].slideamount?i[o].slideamount:t.visibleAmount,t.sliderLayout=i[o].sliderLayout,void 0===t.c&&(t.wpad=t.wrapper_padding,t.c=jQuery("<"+p+'s style="opacity:0" class="nav-dir-'+t.direction+" nav-pos-ver-"+t.v_align+" nav-pos-hor-"+t.h_align+" rs-nav-element "+r+"s "+(!0===t.span?"tp-span-wrapper":"")+" "+t.position+" "+(void 0===t.style?"":t.style)+'"><rs-navmask class="'+r+'-mask" style="overflow:hidden;position:relative"><'+p+'s-wrap class="'+r+'s-inner-wrapper" style="position:relative;"></'+p+"s-wrap></rs-navmask></"+p+"s>"),t.c.css({overflow:"visible",position:"outer-top"===t.position||"outer-bottom"===t.position?"relative":"absolute",background:t.wrapper_color,padding:t.wpad+"px",boxSizing:"contet-box"}),"outer-top"===t.position?e.parent().prepend(t.c):"outer-bottom"===t.position?e.after(t.c):e.append(t.c),"outer-left"!==t.position&&"outer-right"!==t.position||tpGS.gsap.set(i[o].c,{overflow:"visible"}),t.padding_top=parseInt(i[o].carousel.padding_top||0,0),t.padding_bottom=parseInt(i[o].carousel.padding_bottom||0,0),"outer-left"!=t.position&&"outer-right"!=t.position||(i[o].outernav=!0));var g=a.data("key"),u=t.c.find(n),h=u.find(d),m=t.tmp;t.space=parseFloat(t.space)||0,t.maxw="horizontal"===t.direction?t.width*t.visibleAmount+t.space*(t.visibleAmount-1):t.width,t.maxh="horizontal"===t.direction?t.height:t.height*t.visibleAmount+t.space*(t.visibleAmount-1),t.maxw+=2*t.mhoff,t.maxh+=2*t.mvoff,void 0!==i[o].thumbs[a.index()]&&jQuery.each(i[o].thumbs[a.index()].params,function(e,i){m=m.replace(i.from,i.to)});var v=jQuery("<"+p+' data-liindex="'+a.index()+'" data-key="'+g+'" class="'+r+'" style="width:'+t.width+"px;height:"+t.height+'px;">'+m+"<"+p+">");void 0!==i[o].thumbs[a.index()]&&v.find(c).css({backgroundImage:"url("+i[o].thumbs[a.index()].src+")"}),h.append(v);var f=t.c.find(l).length,y=v.outerWidth(),w=v.outerHeight(),b=y+parseInt(void 0===t.space?0:t.space,0),_=w+parseInt(void 0===t.space?0:t.space,0);"vertical"===t.direction?(v.css({top:(f-1)*_+"px",left:"0px"}),h.css({height:(f-1)*_+w,width:y})):(v.css({left:(f-1)*b+"px",top:"0px"}),h.css({width:(f-1)*b+y,height:w})),u.css({maxWidth:t.maxw+"px",maxHeight:t.maxh+"px"}),t.c.css({maxWidth:t.maxw+"px",maxHeight:t.maxh+"px"}),v.on("click",function(){i[o].sc_indicator="bullet","carousel"===i[o].sliderType&&(i[o].ctNavElement=!0);var t=e.parent().find(d).data("distance");t=void 0===t?0:t,Math.abs(t)<10&&(e.revcallslidewithid(g),e.parent().find(s).removeClass("selected"),jQuery(this).addClass("selected"))})},S=function(e,t,a){return null==e||void 0===e.c?a:(e.hide_under>i[t].canv.width||i[t].canv.width>e.hide_over?(!0!==e.tpForceNotVisible&&(e.c.addClass("tp-forcenotvisible"),e.isVisible=!1,a=!0),e.tpForceNotVisible=!0):(!1!==e.tpForceNotVisible&&(e.c.removeClass("tp-forcenotvisible"),e.isVisible=!0,a=!0),e.tpForceNotVisible=!1),a)};window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.navigation={loaded:!0,version:"6.3.2"},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}(jQuery),function(e){"use strict";window._R_is_Editor?RVS._R=void 0===RVS._R?{}:RVS._R:window._R_is_Editor=!1,jQuery.fn.revolution=jQuery.fn.revolution||{};var i=_R_is_Editor?RVS._R:jQuery.fn.revolution;jQuery.extend(!0,i,{bgW:function(e,t){return _R_is_Editor?RVS.RMD.width:"carousel"===i[e].sliderType?i[e].justifyCarousel?i[e].carousel.slide_widths[void 0!==t?t:i[e].carousel.focused]:i[e].carousel.slide_width:i[e].module.width},bgH:function(e,t){return _R_is_Editor?RVS.RMD.height:"carousel"===i[e].sliderType?i[e].carousel.slide_height:i[e].module.height},getPZSides:function(e,i,t,a,r,o,s){var n=e*t,d=i*t,l=Math.abs(a-n),c=Math.abs(r-d),p=new Object;return p.l=(0-o)*l,p.r=p.l+n,p.t=(0-s)*c,p.b=p.t+d,p.h=o,p.v=s,p},getPZCorners:function(e,t,a,r){var o=e.bgposition.split(" ")||"center center",s="center"==o[0]?"50%":"left"==o[0]||"left"==o[1]?"0%":"right"==o[0]||"right"==o[1]?"100%":o[0],n="center"==o[1]?"50%":"top"==o[0]||"top"==o[1]?"0%":"bottom"==o[0]||"bottom"==o[1]?"100%":o[1];s=parseInt(s,0)/100||0,n=parseInt(n,0)/100||0;var d=new Object;return d.start=i.getPZSides(r.start.width,r.start.height,r.start.scale,t,a,s,n),d.end=i.getPZSides(r.start.width,r.start.height,r.end.scale,t,a,s,n),d},getPZValues:function(e){var i=e.panzoom.split(";"),t={duration:10,ease:"none",scalestart:1,scaleend:1,rotatestart:.01,rotateend:0,blurstart:0,blurend:0,offsetstart:"0/0",offsetend:"0/0"};for(var a in i)if(i.hasOwnProperty(a)){var r=i[a].split(":"),o=r[0],s=r[1];switch(o){case"d":t.duration=parseInt(s,0)/1e3;break;case"e":t.ease=s;break;case"ss":t.scalestart=parseInt(s,0)/100;break;case"se":t.scaleend=parseInt(s,0)/100;break;case"rs":t.rotatestart=parseInt(s,0);break;case"re":t.rotateend=parseInt(s,0);break;case"bs":t.blurstart=parseInt(s,0);break;case"be":t.blurend=parseInt(s,0);break;case"os":t.offsetstart=s;break;case"oe":t.offsetend=s}}return t.offsetstart=t.offsetstart.split("/")||[0,0],t.offsetend=t.offsetend.split("/")||[0,0],t.rotatestart=0===t.rotatestart?.01:t.rotatestart,e.panvalues=t,e.bgposition="center center"==e.bgposition?"50% 50%":e.bgposition,t},pzCalcL:function(e,t,a){var r,o,s,n,d,l,c=void 0===a.panvalues?jQuery.extend(!0,{},i.getPZValues(a)):jQuery.extend(!0,{},a.panvalues),p=c.offsetstart,g=c.offsetend,u={start:{width:e,height:_R_is_Editor?e/a.loadobj.width*a.loadobj.height:e/a.owidth*a.oheight,rotation:Math.PI/180*c.rotatestart,rotationV:c.rotatestart,scale:c.scalestart,transformOrigin:"0% 0%"},end:{rotation:Math.PI/180*c.rotateend,rotationV:c.rotateend,scale:c.scaleend}};c.scalestart,a.owidth,a.oheight,c.scaleend,a.owidth,a.oheight;return u.start.height<t&&(l=t/u.start.height,u.start.height=t,u.start.width=u.start.width*l),.01===c.rotatestart&&0===c.rotateend&&(delete u.start.rotation,delete u.end.rotation),r=i.getPZCorners(a,e,t,u),p[0]=parseFloat(p[0])+r.start.l,g[0]=parseFloat(g[0])+r.end.l,p[1]=parseFloat(p[1])+r.start.t,g[1]=parseFloat(g[1])+r.end.t,o=r.start.r-r.start.l,s=r.start.b-r.start.t,n=r.end.r-r.end.l,d=r.end.b-r.end.t,p[0]=p[0]>0?0:o+p[0]<e?e-o:p[0],g[0]=g[0]>0?0:n+g[0]<e?e-n:g[0],p[1]=p[1]>0?0:s+p[1]<t?t-s:p[1],g[1]=g[1]>0?0:d+g[1]<t?t-d:g[1],u.start.x=p[0],u.start.y=p[1],u.end.x=g[0],u.end.y=g[1],u.end.ease=c.ease,u},pzDrawShadow:function(e,t,a){("animating"===t.currentState||null==t.panFake||t.pzLastFrame)&&(t.pzLastFrame=!1,t.shadowCTX.clearRect(0,0,t.shadowCanvas.width,t.shadowCanvas.height),t.shadowCTX.save(),void 0!==a.rotation?t.shadowCTX.transform(Math.cos(a.rotation)*a.scale,Math.sin(a.rotation)*a.scale,Math.sin(a.rotation)*-a.scale,Math.cos(a.rotation)*a.scale,a.x,a.y):t.shadowCTX.transform(a.scale,0,0,a.scale,a.x,a.y),t.shadowCTX.drawImage(t.loadobj.img,0,0,a.width,a.height),t.shadowCTX.restore()),"animating"!==t.currentState?null!=t.panFake?(t.panFake.visible||(t.panFake.visible=!0,t.panFake.img.style.opacity=1,t.canvas.style.opacity=0),tpGS.gsap.set(t.panFake.img,{width:a.width,height:a.height,force3D:!0,x:a.x,y:a.y,transformOrigin:"0% 0%",rotationZ:a.rotationV+"deg",scale:a.scale}),void 0!==a.blur&&(t.panFake.img.style.filter=0===a.blur?"none":"blur("+a.blur+"px)")):(i.updateSlideBGs(e,a.slidekey,t,!0),void 0!==a.blur&&(t.canvas.style.filter=0===a.blur?"none":"blur("+a.blur+"px)")):(void 0!==t.panFake&&!1!==t.panFake.visible&&(t.panFake.visible=!1,t.panFake.img.style.opacity=0,t.canvas.style.opacity=1,t.panFake.img.style.filter="none"),void 0!==a.blur&&t.canvasFilter?t.canvasFilterBlur=a.blur:t.canvas.style.filter=0===a.blur?"none":"blur("+a.blur+"px)")},startPanZoom:function(e,t,a,r,o,s){var n=_R_is_Editor?e:e.data();if(void 0!==n.panzoom&&null!==n.panzoom){var d=_R_is_Editor?n:i[t].sbgs[s];_R_is_Editor||"carousel"!==i[t].sliderType||(i[t].carousel.justify&&void 0===i[t].carousel.slide_widths&&i.setCarouselDefaults(t,!0),i[t].carousel.justify||(void 0===i[t].carousel.slide_width&&(i[t].carousel.slide_width=!0!==i[t].carousel.stretch?i[t].gridwidth[i[t].level]*(0===i[t].CM.w?1:i[t].CM.w):i[t].canv.width),void 0===i[t].carousel.slide_height&&(i[t].carousel.slide_height=!0!==i[t].carousel.stretch?i[t].gridheight[i[t].level]*(0===i[t].CM.w?1:i[t].CM.w):i[t].canv.height)));var l,c=i.getmDim(t,r,d),p=i.pzCalcL(c.width,c.height,n);d.pzAnim=p,_R_is_Editor||(i[t].panzoomTLs=void 0===i[t].panzoomTLs?{}:i[t].panzoomTLs,i[t].panzoomBGs=void 0===i[t].panzoomBGs?{}:i[t].panzoomBGs,void 0===i[t].panzoomBGs[r]&&(i[t].panzoomBGs[r]=e),l=i[t].panzoomTLs[r]),a=a||0,void 0!==l&&(l.pause(),l.kill(),l=void 0),l=tpGS.gsap.timeline({paused:!0}),n.panvalues.duration=NaN===n.panvalues.duration||void 0===n.panvalues.duration?10:n.panvalues.duration,_R_is_Editor||void 0===n||void 0===d||(d.panvalues=n.panvalues),void 0!==d&&(void 0===d.shadowCanvas&&(d.shadowCanvas=document.createElement("canvas"),d.shadowCTX=d.shadowCanvas.getContext("2d"),d.shadowCanvas.style.background="transparent",d.shadowCanvas.style.opacity=1),d.shadowCanvas.width!==c.width&&(d.shadowCanvas.width=c.width),d.shadowCanvas.height!==c.height&&(d.shadowCanvas.height=c.height),p.slideindex=r,p.slidekey=_R_is_Editor?void 0:s,p.start.slidekey=p.slidekey,i.pzDrawShadow(t,d,p.start),p.end.onUpdate=function(){i.pzDrawShadow(t,d,p.start)},d.panStart=jQuery.extend(!0,{},p.start),void 0===n.panvalues.blurstart||void 0===n.panvalues.blurend||0===n.panvalues.blurstart&&0===n.panvalues.blurend||(p.start.blur=n.panvalues.blurstart,p.end.blur=n.panvalues.blurend),(!_R_is_Editor&&void 0===p.start.blur&&!i.isFF||window.isSafari11&&i.ISM)&&(d.panFake=void 0===d.panFake?{img:d.loadobj.img.cloneNode(!0)}:d.panFake,void 0!==d.panFake&&(!0!==d.panFake.appended&&(d.panFake.appended=!0,d.sbg.appendChild(d.panFake.img),d.panFake.img.style.position="absolute",d.panFake.img.style.display="block",d.panFake.img.style.zIndex=0,d.panFake.img.style.opacity=0,d.panFake.img.style.top="0px",d.panFake.img.style.left="0px"),d.panFake.img.width=p.start.width,d.panFake.img.height=p.start.height)),l.add(tpGS.gsap.to(p.start,n.panvalues.duration,p.end),0),l.progress(a),"play"!==o&&"first"!==o||l.play(),_R_is_Editor?RVS.TL[RVS.S.slideId].panzoom=l:i[t].panzoomTLs[r]=l)}}}),window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.panzoom={loaded:!0,version:"6.5.6"},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}(jQuery),function(e){"use strict";jQuery.fn.revolution=jQuery.fn.revolution||{};var i=jQuery.fn.revolution;jQuery.extend(!0,i,{checkForParallax:function(e){var r=i[e].parallax;if(!r.done){if(r.done=!0,i.ISM&&r.disable_onmobile)return!1;if("3D"==r.type||"3d"==r.type){if(i.addSafariFix(e),tpGS.gsap.set(i[e].c,{overflow:r.ddd_overflow}),tpGS.gsap.set(i[e].canvas,{overflow:r.ddd_overflow}),"carousel"!=i[e].sliderType&&r.ddd_shadow){var o=jQuery('<div class="dddwrappershadow"></div>');tpGS.gsap.set(o,{force3D:"auto",transformPerspective:1600,transformOrigin:"50% 50%",width:"100%",height:"100%",position:"absolute",top:0,left:0,zIndex:0}),i[e].c.prepend(o)}for(var s in i[e].slides)i[e].slides.hasOwnProperty(s)&&t(jQuery(i[e].slides[s]),e);i[e].c.find("rs-static-layers").length>0&&(tpGS.gsap.set(i[e].c.find("rs-static-layers"),{top:0,left:0,width:"100%",height:"100%"}),t(i[e].c.find("rs-static-layers"),e))}r.pcontainers={},r.bgcontainers=[],r.bgcontainer_depths=[],r.speed=void 0===r.speed?0:parseInt(r.speed,0),r.speedbg=void 0===r.speedbg?0:parseInt(r.speedbg,0),r.speedls=void 0===r.speedls?0:parseInt(r.speedls,0),i[e].c.find("rs-slide rs-sbg-wrap, rs-slide rs-bgvideo").each(function(){var t=jQuery(this),a=t.data("parallax");window.isSafari11||(i[e].parZ=1),void 0!==(a="on"==a||!0===a?1:a)&&"off"!==a&&!1!==a&&(r.bgcontainers.push(t.closest("rs-sbg-px")),r.bgcontainer_depths.push(i[e].parallax.levels[parseInt(a,0)-1]/100))});for(s=1;s<=r.levels.length;s++){for(var n in i[e].slides)if(i[e].slides.hasOwnProperty(n)){var d=(c=i[e].slides[n]).dataset.key;void 0===r.pcontainers[d]&&(r.pcontainers[d]={}),a(s,r,c,r.pcontainers[d])}d="static";void 0===r.pcontainers[d]&&(r.pcontainers[d]={}),a(s,r,i[e].slayers[0],r.pcontainers[d]),JSON.stringify(r.pcontainers[d])==JSON.stringify({})&&delete r.pcontainers[d]}if("mouse"==r.type||"mousescroll"==r.type||"3D"==r.type||"3d"==r.type){var l="rs-slide .dddwrapper, .dddwrappershadow, rs-slide .dddwrapper-layer, rs-static-layers .dddwrapper-layer";for(var n in"carousel"===i[e].sliderType&&(l="rs-slide .dddwrapper, rs-slide .dddwrapper-layer, rs-static-layers .dddwrapper-layer"),r.sctors={},i[e].slides)if(i[e].slides.hasOwnProperty(n)){var c;d=(c=i[e].slides[n]).dataset.key;r.sctors[d]=c.querySelectorAll(l)}i[e].slayers[0]&&(r.sctors.static=i[e].slayers[0].querySelectorAll(l)),r.mouseEntered=!1,i[e].c.on("mouseenter",function(t){var a=i[e].c.offset().top,o=i[e].c.offset().left;r.mouseEnterX=t.pageX-o,r.mouseEnterY=t.pageY-a,r.mouseEntered=!0});var p=this.updateParallax.bind(this,e,r);i[e].c.on("mousemove.hoverdir, mouseleave.hoverdir, trigger3dpath",function(e){r.eventData=e,void 0!==r.frame&&"mouseleave"!==e.type||(r.frame=window.requestAnimationFrame(p))}),i.ISM&&window.addEventListener("deviceorientation",function(e){r.eventData=e,void 0===r.frame&&(r.frame=window.requestAnimationFrame(p))})}var g=i[e].scrolleffect;g.set&&(g.multiplicator_layers=parseFloat(g.multiplicator_layers),g.multiplicator=parseFloat(g.multiplicator)),void 0!==g._L&&0===g._L.length&&(g._L=!1),void 0!==g.bgs&&0===g.bgs.length&&(g.bgs=!1)}},getLayerParallaxOffset:function(e,t,a){return void 0!==i[e].parallax&&void 0!==i[e].parallax.pcontainers&&void 0!==i[e].parallax.pcontainers[i[e]._L[t].slidekey]&&void 0!==i[e].parallax.pcontainers[i[e]._L[t].slidekey][t]?Math.abs(i[e].parallax.pcontainers[i[e]._L[t].slidekey][t]["offs"+a]):0},updateParallax:function(e,t){t.frame&&(t.frame=window.cancelAnimationFrame(t.frame));var a,r,o=t.eventData,s=i[e].c.offset().left,n=i[e].c.offset().top,d=i[e].canv.width,l=i[e].canv.height,c=t.speed/1e3||3;if("enterpoint"==t.origo&&"deviceorientation"!==o.type?(!1===t.mouseEntered&&(t.mouseEnterX=o.pageX-s,t.mouseEnterY=o.pageY-n,t.mouseEntered=!0),a=t.mouseEnterX-(o.pageX-s),r=t.mouseEnterY-(o.pageY-n),c=t.speed/1e3||.4):"deviceorientation"!==o.type&&(a=d/2-(o.pageX-s),r=l/2-(o.pageY-n)),"deviceorientation"==o.type){var p,g,u;p=o.beta-60,g=o.gamma,u=p;var h=Math.abs(t.orientationX-g)>1||Math.abs(t.orientationY-u)>1;if(t.orientationX=g,t.orientationY=u,!h)return;if(i.winW>i.getWinH(e)){var m=g;g=u,u=m}a=360/d*(g*=1.5),r=180/l*(u*=1.5)}for(var v in o.type,"mouseout"===o.type&&(a=0,r=0,t.mouseEntered=!1),t.pcontainers)if(t.pcontainers.hasOwnProperty(v)&&(void 0===i[e].activeRSSlide||"static"===v||i[e].slides[i[e].activeRSSlide].dataset.key===v))for(var f in t.pcontainers[v])if(t.pcontainers[v].hasOwnProperty(f)){var y=t.pcontainers[v][f];y.pl="3D"==t.type||"3d"==t.type?y.depth/200:y.depth/100,y.offsh=a*y.pl,y.offsv=r*y.pl,"mousescroll"==t.type?tpGS.gsap.to(y.tpw,c,{force3D:"auto",x:y.offsh,ease:"power3.out",overwrite:"all"}):tpGS.gsap.to(y.tpw,c,{force3D:"auto",x:y.offsh,y:y.offsv,ease:"power3.out",overwrite:"all"})}if("3D"==t.type||"3d"==t.type)for(var v in t.sctors)if(t.sctors.hasOwnProperty(v)&&(void 0===i[e].activeRSSlide||"static"===v||i[e].slides[i[e].activeRSSlide].dataset.key===v||i.isFF))for(var f in t.sctors[v])if(t.sctors[v].hasOwnProperty(f)){n=jQuery(t.sctors[v][f]);var w=i.isFirefox()?Math.min(25,t.levels[t.levels.length-1])/200:t.levels[t.levels.length-1]/200,b=a*w,_=r*w,S=0==i[e].canv.width?0:Math.round(a/i[e].canv.width*w*100)||0,x=0==i[e].canv.height?0:Math.round(r/i[e].canv.height*w*100)||0,k=n.closest("rs-slide"),L=0,R=!1;"deviceorientation"===o.type&&(b=a*(w=t.levels[t.levels.length-1]/200),_=r*w*3,S=0==i[e].canv.width?0:Math.round(a/i[e].canv.width*w*500)||0,x=0==i[e].canv.height?0:Math.round(r/i[e].canv.height*w*700)||0),n.hasClass("dddwrapper-layer")&&(L=t.ddd_z_correction||65,R=!0),n.hasClass("dddwrapper-layer")&&(b=0,_=0),k.index()===i[e].pr_active_key||"carousel"!=i[e].sliderType?!t.ddd_bgfreeze||R?tpGS.gsap.to(n,c,{rotationX:x,rotationY:-S,x:b,z:L,y:_,ease:"power3.out",overwrite:"all"}):tpGS.gsap.to(n,.5,{force3D:"auto",rotationY:0,rotationX:0,z:0,ease:"power3.out",overwrite:"all"}):tpGS.gsap.to(n,.5,{force3D:"auto",rotationY:0,x:0,y:0,rotationX:0,z:0,ease:"power3.out",overwrite:"all"}),"mouseleave"!=o.type&&"mouseout"!==o.type||tpGS.gsap.to(this,3.8,{z:0,ease:"power3.out"})}},parallaxProcesses:function(e,t,a,r){var o=i[e].fixedOnTop?Math.min(1,Math.max(0,window.scrollY/i.lastwindowheight)):Math.min(1,Math.max(0,(0-(t.top-i.lastwindowheight))/(t.hheight+i.lastwindowheight))),s=(t.top>=0&&t.top<=i.lastwindowheight||t.top<=0&&t.bottom>=0||t.top<=0&&t.bottom,i[e].slides[void 0===i[e].pr_active_key?0:i[e].pr_active_key]);if(i[e].scrollProg=o,i[e].scrollProgBasics={top:t.top,height:t.hheight,bottom:t.bottom},i[e].sbtimeline.fixed?(!1===i[e].fixedScrollOnState||0!==i[e].drawUpdates.cpar.left||!i.stickySupported||0!=i[e].fullScreenOffsetResult&&null!=i[e].fullScreenOffsetResult?i.stickySupported=!1:(i[e].topc.addClass("rs-stickyscrollon"),i[e].fixedScrollOnState=!0),void 0===i[e].sbtimeline.rest&&i.updateFixedScrollTimes(e),t.top>=i[e].fullScreenOffsetResult&&t.top<=i.lastwindowheight?(o=i[e].sbtimeline.fixStart*(1-t.top/i.lastwindowheight)/1e3,!0!==i.stickySupported&&!1!==i[e].fixedScrollOnState&&(i[e].topc.removeClass("rs-fixedscrollon"),tpGS.gsap.set(i[e].cpar,{top:0,y:0}),i[e].fixedScrollOnState=!1)):t.top<=i[e].fullScreenOffsetResult&&t.bottom>=i[e].module.height?(!0!==i.stickySupported&&!0!==i[e].fixedScrollOnState&&(i[e].fixedScrollOnState=!0,i[e].topc.addClass("rs-fixedscrollon"),tpGS.gsap.set(i[e].cpar,{top:0,y:i[e].fullScreenOffsetResult})),o=(i[e].sbtimeline.fixStart+i[e].sbtimeline.time*(Math.abs(t.top)/(t.hheight-i[e].module.height)))/1e3):(!0!==i.stickySupported&&(tpGS.gsap.set(i[e].cpar,{top:i[e].scrollproc>=0?0:t.height-i[e].module.height}),!1!==i[e].fixedScrollOnState&&(i[e].topc.removeClass("rs-fixedscrollon"),i[e].fixedScrollOnState=!1)),o=t.top>i.lastwindowheight?0:(i[e].sbtimeline.fixEnd+i[e].sbtimeline.rest*(1-t.bottom/i[e].module.height))/1e3)):o=i[e].duration*o/1e3,void 0!==s&&void 0!==i.gA(s,"key")&&!0!==a){var n=0;for(var d in i[e].sbas[i.gA(s,"key")])if(void 0!==i[e]._L[d]&&null==i[e]._L[d].timeline&&n++,void 0!==i[e]._L[d]&&void 0!==i[e]._L[d].timeline&&(1==i[e]._L[d].animationonscroll||"true"==i[e]._L[d].animationonscroll)){n=-9999;var l=void 0!==i[e]._L[d].scrollBasedOffset?o+i[e]._L[d].scrollBasedOffset:o;l=l<=0?0:l<.1?.1:l,i[e]._L[d].animteToTime!==l&&(i[e]._L[d].animteToTime=l,tpGS.gsap.to(i[e]._L[d].timeline,i[e].sbtimeline.speed,{time:l,ease:i[e].sbtimeline.ease}))}n>0&&requestAnimationFrame(function(){i.parallaxProcesses(e,t,a,r)}),i[e].c.trigger("timeline_scroll_processed",{id:e,mproc:o,speed:i[e].sbtimeline.speed})}if(i.ISM&&i[e].parallax.disable_onmobile)return!1;var c,p=i[e].parallax;if(void 0!==i[e].slides[i[e].pr_processing_key]&&void 0!==i[e].slides[i[e].pr_processing_key].dataset&&(c=i[e].slides[i[e].pr_processing_key].dataset.key),"3d"!=p.type&&"3D"!=p.type){if("scroll"==p.type||"mousescroll"==p.type)for(var g in p.pcontainers)if(p.pcontainers.hasOwnProperty(g)&&(void 0===i[e].activeRSSlide||"static"===g||i[e].slides[i[e].activeRSSlide].dataset.key===g||c===g))for(var u in p.pcontainers[g])if(p.pcontainers[g].hasOwnProperty(u)){var h=p.pcontainers[g][u],m=void 0!==r?r:p.speedls/1e3||0;h.pl=h.depth/100,h.offsv=Math.round(i[e].scrollproc*(-h.pl*i[e].canv.height)*10)/10||0,tpGS.gsap.to(h.tpw,m,{overwrite:"auto",force3D:"auto",y:h.offsv})}if(p.bgcontainers)for(u=0;u<p.bgcontainers.length;u++){var v=p.bgcontainers[u],f=p.bgcontainer_depths[u],y=i[e].scrollproc*(-f*i[e].canv.height)||0;m=void 0!==r?r:p.speedbg/1e3||.015;m=void 0!==i[e].parallax.lastBGY&&0===m&&Math.abs(y-i[e].parallax.lastBGY)>50?.15:m,tpGS.gsap.to(v,m,{position:"absolute",top:"0px",left:"0px",backfaceVisibility:"hidden",force3D:"true",y:y+"px"}),i[e].parallax.lastBGY=y}}var w=i[e].scrolleffect;if(w.set&&(!i.ISM||!1===w.disable_onmobile)){var b=Math.abs(i[e].scrollproc)-w.tilt/100;if(b=b<0?0:b,!1!==w._L){var _=1-b*w.multiplicator_layers,S={force3D:"true"};if("top"==w.direction&&i[e].scrollproc>=0&&(_=1),"bottom"==w.direction&&i[e].scrollproc<=0&&(_=1),_=_>1?1:_<0?0:_,w.fade&&(S.opacity=_),w.scale){var x=_;S.scale=1-x+1}if(w.blur)R=(R=(1-_)*w.maxblur)<=.03?0:R,S["-webkit-filter"]="blur("+R+"px)",S.filter="blur("+R+"px)";if(w.grayscale){var k="grayscale("+100*(1-_)+"%)";S["-webkit-filter"]=void 0===S["-webkit-filter"]?k:S["-webkit-filter"]+" "+k,S.filter=void 0===S.filter?k:S.filter+" "+k}tpGS.gsap.set(w._L,S)}if(!1!==w.bgs){_=1-b*w.multiplicator,S={backfaceVisibility:"hidden",force3D:"true"};for(var L in"top"==w.direction&&i[e].scrollproc>=0&&(_=1),"bottom"==w.direction&&i[e].scrollproc<=0&&(_=1),_=_>1?1:_<0?0:_,w.bgs)if(w.bgs.hasOwnProperty(L)){if(w.bgs[L].fade&&(S.opacity=_),w.bgs[L].blur){var R=(1-_)*w.maxblur;S["-webkit-filter"]="blur("+R+"px)",S.filter="blur("+R+"px)"}if(w.bgs[L].grayscale){k="grayscale("+100*(1-_)+"%)";S["-webkit-filter"]=void 0===S["-webkit-filter"]?k:S["-webkit-filter"]+" "+k,S.filter=void 0===S.filter?k:S.filter+" "+k}tpGS.gsap.set(w.bgs[L].c,S)}}}}});var t=function(e,t){var a=i[t].parallax;e.find("rs-sbg-wrap").wrapAll('<div class="dddwrapper" style="width:100%;height:100%;position:absolute;top:0px;left:0px;overflow:hidden"></div>');var r=e[0].querySelectorAll(".rs-parallax-wrap"),o=document.createElement("div");o.className="dddwrapper-layer",o.style.width="100%",o.style.height="100%",o.style.position="absolute",o.style.top="0px",o.style.left="0px",o.style.zIndex=5,o.style.overflow=a.ddd_layer_overflow;for(var s=0;s<r.length;s++)r.hasOwnProperty(s)&&null===i.closestNode(r[s],"RS-GROUP")&&null===i.closestNode(r[s],"RS-ROW")&&o.appendChild(r[s]);e[0].appendChild(o),e.find(".rs-pxl-tobggroup").closest(".rs-parallax-wrap").wrapAll('<div class="dddwrapper-layertobggroup" style="position:absolute;top:0px;left:0px;z-index:50;width:100%;height:100%"></div>');var n=e.find(".dddwrapper"),d=e.find(".dddwrapper-layer");e.find(".dddwrapper-layertobggroup").appendTo(n),"carousel"==i[t].sliderType&&(a.ddd_shadow&&n.addClass("dddwrappershadow"),tpGS.gsap.set(n,{borderRadius:i[t].carousel.border_radius})),tpGS.gsap.set(e,{overflow:"visible",transformStyle:"preserve-3d",perspective:1600}),tpGS.gsap.set(n,{force3D:"auto",transformOrigin:"50% 50%",transformStyle:"preserve-3d",transformPerspective:1600}),tpGS.gsap.set(d,{force3D:"auto",transformOrigin:"50% 50%",zIndex:5,transformStyle:"flat",transformPerspective:1600}),tpGS.gsap.set(i[t].canvas,{transformStyle:"preserve-3d",transformPerspective:1600})};function a(t,a,r,o){e(r).find(".rs-pxl-"+t).each(function(){var e=this.className.indexOf("rs-pxmask")>=0,r=e?i.closestNode(this,"RS-PX-MASK"):i.closestClass(this,"rs-parallax-wrap");r&&(e&&!window.isSafari11&&(tpGS.gsap.set(r,{z:1}),tpGS.gsap.set(i.closestNode(r,"RS-BG-ELEM"),{z:1})),r.dataset.parallaxlevel=a.levels[t-1],r.classList.add("tp-parallax-container"),o[this.id]={tpw:r,depth:a.levels[t-1],offsv:0,offsh:0})})}window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.parallax={loaded:!0,version:"6.2.24"},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}(jQuery),function(e){"use strict";window._R_is_Editor?RVS._R=void 0===RVS._R?{}:RVS._R:window._R_is_Editor=!1;jQuery.fn.revolution=jQuery.fn.revolution||{};var i=_R_is_Editor?RVS._R:jQuery.fn.revolution;_R_is_Editor&&(RVS._R.isNumeric=RVS.F.isNumeric),jQuery.extend(!0,i,{getSlideAnimationObj:function(e,t,a){var r,o={};for(var s in void 0===t.anim&&null==t.in&&(t.in="o:0"),t)if(t.hasOwnProperty(s)&&void 0!==t[s]){var n=t[s].split(";");for(var d in n)n.hasOwnProperty(d)&&void 0!==(r=n[d].split(":"))[0]&&void 0!==r[1]&&(o[s]=void 0===o[s]?{}:o[s],o[s][r[0]]="d3"===s&&"c"===r[0]?r[1]:r[1].split(",")[0])}return o.in=void 0===o.in?{}:o.in,o.anim=void 0===o.anim?{e:"basic"}:o.anim,_R_is_Editor||void 0===o.in||void 0===o.in.prst||i.loadSlideAnimLibrary(e,{key:a,prst:o.in.prst}),i[e].sbgs[a].slideanimationRebuild=!1,o},loadSlideAnimLibrary:function(e,t){void 0===i.SLTR&&!0!==i.SLTR_loading?(i.SLTR_loading=!0,jQuery.ajax({type:"post",url:i[e].ajaxUrl,dataType:"json",data:{action:"revslider_ajax_call_front",client_action:"get_transitions"},success:function(a,r,o){1==a.success&&(i.SLTR=a.transitions,void 0!==t&&i.setRandomDefaults(e,t.key,t.prst))},error:function(e){console.log("Transition Table can not be loaded"),console.log(e)}})):void 0!==t&&void 0!==i.SLTR&&i.setRandomDefaults(e,t.key,t.prst)},convertSlideAnimVals:function(e){return{anim:{eng:e.eng,ms:parseInt(e.speed,0),o:e.o,e:e.e,f:e.f,p:e.p,d:parseInt(e.d,0),adpr:e.adpr},d3:{f:e.d3.f,d:e.d3.d,z:e.d3.z,t:e.d3.t,c:e.d3.c,e:e.d3.e,fdi:e.d3.fdi,fdo:e.d3.fdo,fz:e.d3.fz,su:e.d3.su,smi:e.d3.smi,sma:e.d3.sma,sc:e.d3.sc,sl:e.d3.sl},in:{eng:e.in.eng,o:_R_is_Editor&&void 0!==e.preset&&0===e.preset.indexOf("rnd")?0:i.valBeau(e.in.o),x:i.valBeau(e.in.x),y:i.valBeau(e.in.y),r:i.valBeau(e.in.r),sx:i.valBeau(e.in.sx),sy:i.valBeau(e.in.sy),m:e.in.m,e:e.in.e,row:e.in.row,col:e.in.col,mo:"false"!==e.in.mou&&!1!==e.in.mou?i.valBeau(e.in.mo):0,moo:"false"!==e.in.mou&&!1!==e.in.mou?i.valBeau(e.in.moo):"none",mou:e.in.mou},out:void 0===e.out.a||"true"==e.out.a||!0===e.out.a?void 0:{a:d(e.out.a),o:i.valBeau(e.out.o),x:i.valBeau(e.out.x),y:i.valBeau(e.out.y),r:i.valBeau(e.out.r),sx:i.valBeau(e.out.sx),sy:i.valBeau(e.out.sy),m:e.out.m,e:e.out.e,row:i.valBeau(e.out.row),col:i.valBeau(e.out.col)},filter:{u:e.filter.u,e:e.filter.e,b:e.filter.b,g:e.filter.g,h:e.filter.h,s:e.filter.s,c:e.filter.c,i:e.filter.i},addOns:e.addOns}},setRandomDefaults:function(e,t,a){i[e].sbgs[t].random=i.getAnimObjectByKey(a,i.SLTR)},getSlideAnim_AddonDefaults:function(){var e={};for(var t in i.enabledSlideAnimAddons)e=jQuery.extend(!0,e,i[i.enabledSlideAnimAddons[t]].defaults());return e},getSlideAnim_EmptyObject:function(){return{speed:1e3,o:"inout",e:"basic",f:"start",p:"none",d:15,eng:"animateCore",adpr:!1,d3:{f:"none",d:"horizontal",z:300,t:0,c:"#ccc",e:"power2.inOut",fdi:1.5,fdo:2,fz:0,su:!1,smi:0,sma:.5,sc:"#000",sl:1},filter:{u:!1,e:"default",b:0,g:0,h:100,s:0,c:100,i:0},in:{o:1,x:0,y:0,r:0,sx:1,sy:1,m:!1,e:"power2.inOut",row:1,col:1,mo:80,mou:!1},out:{a:"true",o:1,x:0,y:0,r:0,sx:1,sy:1,m:!1,e:"power2.inOut",row:1,col:1},addOns:i.getSlideAnim_AddonDefaults()}},getAnimObjectByKey:function(e,t){if(i.getAnimObjectCacheKey===e)return i.getAnimObjectCache;var a;for(var r in i.getAnimObjectCacheKey=e,t)if(t.hasOwnProperty(r)&&void 0===a)for(var o in t[r])if(t[r].hasOwnProperty(o)&&void 0===a)if(e===o&&0===e.indexOf("rnd"))(a=t[r][o]).main=r,a.group=o;else for(var s in t[r][o])t[r][o].hasOwnProperty(s)&&void 0===a&&s===e&&((a=t[r][o][s]).main=r,a.group=o);return i.getAnimObjectCache=jQuery.extend(!0,{},a),a},getRandomSlideTrans:function(e,t,a){if(void 0!==i.randomSlideAnimCache&&void 0!==i.randomSlideAnimCache[e]&&void 0!==i.randomSlideAnimCache[e][t])return i.randomSlideAnimCache[e][t][Math.floor(Math.random()*i.randomSlideAnimCache[e][t].length)];for(var r in i.randomSlideAnimCache=void 0===i.randomSlideAnimCache?{}:i.randomSlideAnimCache,i.randomSlideAnimCache[e]=void 0===i.randomSlideAnimCache[e]?{}:i.randomSlideAnimCache[e],i.randomSlideAnimCache[e][t]=void 0===i.randomSlideAnimCache[e][t]?[]:i.randomSlideAnimCache[e][t],a)if(a.hasOwnProperty(r)&&"random"!==r&&"custom"!==r&&("all"==e||r==e))for(var o in a[r])if(a[r].hasOwnProperty(o)&&"icon"!==o&&(""+t=="undefined"||t.indexOf(o)>=0))for(var s in a[r][o])a[r][o].hasOwnProperty(s)&&-1==jQuery.inArray(a[r][o][s].title,["*north*","*south*","*east*","*west*"])&&i.randomSlideAnimCache[e][t].push(s);return i.randomSlideAnimCache[e][t][Math.floor(Math.random()*i.randomSlideAnimCache[e][t].length)]},cbgW:function(e,t){return _R_is_Editor?RVS.RMD.width:"carousel"===i[e].sliderType?i[e].justifyCarousel?i[e].carousel.slide_widths[void 0!==t?t:i[e].carousel.focused]:i[e].carousel.slide_width:i[e].canv.width},cbgH:function(e,t){return _R_is_Editor?RVS.RMD.height:"carousel"===i[e].sliderType?!0===i[e].carousel.justify?i[e].carousel.slide_height:"fullscreen"===i[e].sliderLayout?i[e].module.height:Math.min(i[e].canv.height,i[e].gridheight[i[e].level]):void 0!==i[e].maxHeight&&i[e].maxHeight>0&&!i[e].fixedOnTop?Math.min(i[e].canv.height,i[e].maxHeight):i[e].canv.height},valBeau:function(e){return e=(""+(e=(""+(e=(""+(e=(""+(e=(""+e).split(",").join("|"))).replace("{","ran("))).replace("}",")"))).replace("[","cyc("))).replace("]",")")},animateSlide:function(e,i){return _R_is_Editor&&RVS.F.resetSlideTL(),void 0===tpGS.eases.late&&(tpGS.CustomEase.create("late","M0,0,C0,0,0.474,0.078,0.724,0.26,0.969,0.438,1,1,1,1"),tpGS.CustomEase.create("late2","M0,0 C0,0 0.738,-0.06 0.868,0.22 1,0.506 1,1 1,1 "),tpGS.CustomEase.create("late3","M0,0,C0,0,0.682,0.157,0.812,0.438,0.944,0.724,1,1,1,1")),o(e,i)},getBasic:function(e){return jQuery.extend(!0,{attr:null==e||void 0===e.attr?["o","r","sx","sy","x","y","m","e","row","col","mo","moo"]:e.attr,in:{f:"start",m:!1,o:1,r:0,sx:1,sy:1,x:0,y:0,row:1,col:1,e:"power2.inOut",ms:1e3,mo:0,moo:"none"},out:{f:"start",m:!1,o:1,r:0,sx:1,sy:1,x:0,y:0,row:1,col:1,e:"power2.inOut",ms:1e3}},e)},playBGVideo:function(e,t,a){if(_R_is_Editor)a=void 0===a?RVS.SBGS[RVS.S.slideId].n:a;else{if(void 0===a&&(void 0===i[e].pr_next_bg||0===i[e].pr_next_bg.length))return;a=void 0===a?i[e].sbgs[void 0===t?i[e].pr_next_bg[0].dataset.key:t]:a}void 0!==a.bgvid&&a.bgvid.length>0&&(c(e,{},a,"in"),i.resetVideo(a.bgvid,e),i.playVideo(a.bgvid,e,!0),tpGS.gsap.to(a.bgvid[0],.2,{zIndex:30,display:"block",autoAlpha:1,delay:.075,overwrite:"all"}))},stopBGVideo:function(e,t,a){if(_R_is_Editor)a=void 0===a?RVS.SBGS[RVS.S.slideId].n:a;else{if(void 0===a&&(void 0===i[e].pr_next_bg||0===i[e].pr_next_bg.length))return;a=void 0===a?i[e].sbgs[void 0===t?i[e].pr_next_bg[0].dataset.key:t]:a}void 0!==a.bgvid&&a.bgvid.length>0&&(a.drawVideoCanvasImagesRecall=!1,i.stopVideo(a.bgvid,e),tpGS.gsap.to(a.bgvid[0],.2,{autoAlpha:0,zIndex:0,display:"none"}))},SATools:{getOffset:function(e,t,a,r){var o=(""+e).indexOf("%")>=0;return 0==(e=i.SATools.getSpecialValue(e,r,a))||void 0===e?0:o?t*(parseInt(e)/100):parseInt(e)},getSpecialValue:function(e,t,a,r){if(i.isNumeric(parseFloat(e,0)))return parseFloat(e,0);var o=(""+e).split("ran(").length>1?"random":(""+e).split("cyc(").length>1?"wrap":(""+e).split("(").length>1?"dir":"unknown",s=("random"===o?e.slice(4,-1):"wrap"===o?e.slice(4,-1):e.slice(1,-1)).split("|");if("random"===o)return tpGS.gsap.utils.random(parseFloat(s[0]),parseFloat(s.length>1?s[1]:0-s[0]));if("wrap"===o){var n=tpGS.gsap.utils.wrap(s,t);return(""+n).split("(").length>1?parseFloat(n.slice(1,-1))*a+(r?"%":""):n}return"dir"===o?parseFloat(s[0])*a+(r?"%":""):void 0}},getmDim:function(e,t,a){var r=i.cbgW(e,t),o=i.cbgH(e,t);return a.DPR=_R_is_Editor?Math.min(window.devicePixelRatio,2):i[e].DPR,i.maxDimCheck(a,r,o)},maxDimCheck:function(e,t,a){var r,o;void 0!==e.video&&("img"===e.video.tagName||null==e.video.videoWidth||e.video.videoWidth);if("animating"!==e.currentState&&null==e.panzoom||"animating"===e.currentState&&null==e.panzoom&&(null==e.slideanimation||null==e.slideanimation.anim||"true"!==e.slideanimation.anim.adpr))if(e.DPR>1&&i.ISM&&a>1024)e.DPR=1,r=t,o=a;else{var s={w:null==e.video||e.isVidImg?e.loadobj.width:0==e.video.videoWidth?e.loadobj.width:e.video.videoWidth,h:null==e.video||e.isVidImg?e.loadobj.height:0==e.video.videoHeight?e.loadobj.height:e.video.videoHeight};void 0===s.w&&(s.w=e.loadobj.width),void 0===s.h&&(s.h=e.loadobj.height);var n=a/s.w,d=t/s.h,l=Math.max(n,d);if(l>e.DPR||n>=1&&d>=1?e.DPR=1:e.DPR>l&&(e.DPR=Math.min(e.DPR,e.DPR/l)),r=t*e.DPR,o=a*e.DPR,e.DPR>1){var c=t/a;s.w>s.h&&s.w<r?(o=(r=Math.max(t,s.w))/c,e.DPR=1):s.h>s.w&&s.h<o&&(r=(o=Math.max(a,s.h))*c,e.DPR=1)}}else e.DPR=1,r=t,o=a;return{width:Math.round(r),height:Math.round(o),w:t,h:a}},updateSlideBGs:function(e,t,a,r){if(_R_is_Editor)a=void 0===a?RVS.SBGS[RVS.S.slideId].n:a;else{if(void 0===a&&(void 0===i[e].pr_next_bg||0===i[e].pr_next_bg.length))return;a=void 0===a?i[e].sbgs[void 0===t?i[e].pr_next_bg[0].dataset.key:t]:a}(r=void 0!==a.mDIM&&r)||(a.mDIM=i.getmDim(e,a.skeyindex,a)),void 0!==a.video?("IMG"!==a.video.tagName&&(a.isVidImg=""),a.cDIMS=i.getBGCanvasDetails(e,a),a.canvas.width=a.mDIM.width,a.canvas.height=a.mDIM.height,a.ctx.clearRect(0,0,a.mDIM.width,a.mDIM.height),a.ctx.drawImage(a.shadowCanvas,0,0)):(a.cDIMS=i.getBGCanvasDetails(e,a,r),a.canvas.width=a.mDIM.width,a.canvas.height=a.mDIM.height,"panzoom"===a.currentState||"animating"===a.currentState||void 0===a.currentState&&!_R_is_Editor&&"carousel"!=i[e].sliderType||(a.ctx.clearRect(0,0,a.mDIM.width,a.mDIM.height),0!==a.shadowCanvas.width&&0!==a.shadowCanvas.height&&a.ctx.drawImage(a.shadowCanvas,0,0))),"animating"===a.currentState&&"carousel"!==i[e].sliderType&&i.animatedCanvasUpdate(e,a)},addCanvas:function(){var e=document.createElement("canvas");return x=e.getContext("2d"),e.style.background="transparent",e.style.opacity=1,x},updateVideoFrames:function(e,t,a){if(t.now=Date.now(),t.then=void 0===t.then?t.now-500:t.then,t.elapsed=t.now-t.then,t.fps="animating"===t.currentState&&window._rs_firefox?50:33,t.elapsed>t.fps){t.then=t.now-t.elapsed%t.fps;var r="img"===t.video.tagName||null==t.video.videoWidth||0==t.video.videoWidth;void 0!==t.video&&!t.video.BGrendered&&void 0!==t.loadobj&&void 0!==t.loadobj.img||i.ISM&&i.isFirefox(e)?(t.mDIM=i.getmDim(e,t.skeyindex,t),t.pDIMS=s(t.mDIM,t,{width:t.mDIM.width,height:t.mDIM.height,x:0,y:0,contw:t.loadobj.width,conth:t.loadobj.height}),t.shadowCanvas.width!==t.mDIM.width&&(t.shadowCanvas.width=t.mDIM.width),t.shadowCanvas.height!==t.mDIM.height&&(t.shadowCanvas.height=t.mDIM.height),t.shadowCTX.drawImage(t.loadobj.img,t.pDIMS.x,t.pDIMS.y,t.pDIMS.width,t.pDIMS.height)):((a||void 0===t.sDIMS||r!==t.isVidImg||0===t.sDIMS.width||0===t.sDIMS.height)&&(t.isVidImg=r,t.mDIM=i.getmDim(e,t.skeyindex,t),t.sDIMS=s(t.mDIM,t,{width:t.mDIM.width,height:t.mDIM.height,x:0,y:0,contw:t.isVidImg?t.loadobj.width:t.video.videoWidth,conth:t.isVidImg?t.loadobj.height:t.video.videoHeight})),void 0!==t.sDIMS&&0!==t.sDIMS.width&&0!==t.sDIMS.height&&("animating"===t.currentState?(t.shadowCanvas.width!==t.mDIM.width&&(t.shadowCanvas.width=t.mDIM.width),t.shadowCanvas.height!==t.mDIM.height&&(t.shadowCanvas.height=t.mDIM.height),t.shadowCTX.drawImage(t.video,t.sDIMS.x,t.sDIMS.y,t.sDIMS.width,t.sDIMS.height)):void 0===t.animateDirection&&(t.canvas.width!==t.mDIM.width&&(t.canvas.width=t.mDIM.width),t.canvas.height!==t.mDIM.height&&(t.canvas.height=t.mDIM.height),t.ctx.drawImage(t.video,t.sDIMS.x,t.sDIMS.y,t.sDIMS.width,t.sDIMS.height)),t.shadowCanvas_Drawn=!0))}(a||t.drawVideoCanvasImagesRecall&&"animating"===t.currentState||"animating"===t.currentState&&void 0===t.shadowCanvas_Drawn)&&window.requestAnimationFrame(function(){i.updateVideoFrames(e,t)})},createOverlay:function(e,t,a,r){if("none"===t)return"none";a=void 0===a?1:a;r=void 0===r?{0:"rgba(0, 0, 0, 0)",1:"rgba(0, 0, 0, 1)"}:r;var o={none:[[0]],1:[[1,0],[0,0]],2:[[1,0,0],[0,0,0],[0,0,0]],3:[[1,0,0,0],[0,0,0,0],[0,0,0,0]],4:[[1],[0]],5:[[1],[0],[0]],6:[[1],[0],[0],[0]],7:[[1,0]],8:[[1,0,0]],9:[[1,0,0,0]],10:[[1,0,0,0,0],[0,1,0,1,0],[0,0,0,0,0],[0,1,0,1,0],[0,0,0,0,1]],11:[[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0]],12:[[1,0,0],[0,1,0],[0,0,1]],13:[[0,0,1],[0,1,0],[1,0,0]],14:[[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,0]],15:[[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,0,0,0,0]],16:[[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]]},s=void 0===o[t=void 0===t?1:t]?o[2]:o[t];_R_is_Editor&&(i[e]=void 0===i[e]?{}:i[e]),i[e].patternCanvas=document.createElement("canvas"),i[e].patternCtx=i[e].patternCanvas.getContext("2d"),i[e].patternCanvas.width=s[0].length*a,i[e].patternCanvas.height=s.length*a;for(var n=0;n<s.length;n++)for(var d=0;d<s[n].length;d++)"transparent"!=r[s[n][d]]&&(i[e].patternCtx.fillStyle=r[s[n][d]],i[e].patternCtx.fillRect(d*a,n*a,a,a));return"url("+i[e].patternCanvas.toDataURL()+")"},getBGCanvasDetails:function(e,t,a){var r;return a||(t.mDIM=i.getmDim(e,t.skeyindex,t)),t.usepattern=("auto"===t.bgfit||t.bgfit.indexOf("%")>=0)&&(void 0===t.loadobj||!0!==t.loadobj.useBGColor),_R_is_Editor&&void 0===t.panzoom&&delete t.shadowCanvas,void 0===t.shadowCanvas&&(t.shadowCanvas=document.createElement("canvas"),t.shadowCTX=t.shadowCanvas.getContext("2d"),t.shadowCanvas.style.background="transparent",t.shadowCanvas.style.opacity=1),!0===t.replaceShadowCanvas||!0===t.loadobj.bgColor||!0===t.usebgColor||void 0!==t.panzoom||null!=t.isHTML5&&1!=t.poster||t.usepattern?(r={width:t.mDIM.width,height:t.mDIM.height,x:0,y:0},t.usepattern&&void 0!==t.loadobj&&void 0!==t.loadobj.img?i.getCanvasPattern(e,t,{ratio:t.loadobj.height/t.loadobj.width}):(t.loadobj.bgColor||t.usebgColor)&&(t.shadowCanvas.width!==t.mDIM.width&&(t.shadowCanvas.width=t.mDIM.width),t.shadowCanvas.height!==t.mDIM.height&&(t.shadowCanvas.height=t.mDIM.height),i.getCanvasGradients(e,t))):(r=s(t.mDIM,t,{width:t.mDIM.width,height:t.mDIM.height,x:0,y:0,contw:t.loadobj.width,conth:t.loadobj.height}),t.shadowCanvas.width!==t.mDIM.width&&(t.shadowCanvas.width=t.mDIM.width),t.shadowCanvas.height!==t.mDIM.height&&(t.shadowCanvas.height=t.mDIM.height),void 0!==t.loadobj&&void 0!==t.loadobj.img&&t.shadowCTX.drawImage(t.loadobj.img,r.x,r.y,r.width,r.height),r={width:t.mDIM.width,height:t.mDIM.height,x:0,y:0}),r},getCanvasPattern:function(e,t,a){void 0===t.patternImageCanvas&&(t.patternImageCanvas=document.createElement("canvas"),t.patternImageCTX=t.patternImageCanvas.getContext("2d"));var r=t.bgfit.split(" ");1===r.length&&(r[1]=r[0]),a.width="auto"===r[0]?t.loadobj.width:t.loadobj.width*(parseInt(r[0],0)/100),a.height="auto"===r[1]?t.loadobj.height:a.width*a.ratio,t.DPR=_R_is_Editor?Math.min(window.devicePixelRatio,2):i[e].DPR;var o=a.width/a.height;a.width=a.width*t.DPR,a.height=a.height*t.DPR,i.isIOS&&a.width*a.height>15728640&&(t.mDIM.width>t.mDIM.height?(a.width=t.mDIM.width,a.height=Math.round(t.mDIM.width/o)):(a.height=t.mDIM.height,a.width=Math.round(t.mDIM.height*o))),t.patternImageCanvas.width=a.width,t.patternImageCanvas.height=a.height,t.patternImageCTX.drawImage(t.loadobj.img,0,0,a.width,a.height),t.shadowCanvas.width!==t.mDIM.width&&(t.shadowCanvas.width=t.mDIM.width),t.shadowCanvas.height!==t.mDIM.height&&(t.shadowCanvas.height=t.mDIM.height),t.shadowCTX.clearRect(0,0,t.shadowCTX.canvas.width,t.shadowCTX.canvas.height),t.pattern=t.shadowCTX.createPattern(t.patternImageCanvas,t.bgrepeat),t.shadowCTX.fillStyle=t.pattern,t.shadowShifts={h:t.bgposition.split(" ")[0],v:t.bgposition.split(" ")[1]},t.shadowShifts.hperc=i.isNumeric(parseInt(t.shadowShifts.h))?parseInt(t.shadowShifts.h)/100*t.mDIM.width:0,t.shadowShifts.vperc=i.isNumeric(parseInt(t.shadowShifts.v))?parseInt(t.shadowShifts.v)/100*t.mDIM.height:0,t.shadowShifts.x="left"===t.shadowShifts.h?0:"center"===t.shadowShifts.h||"50%"==t.shadowShifts.h?"repeat"==t.bgrepeat||"repeat-x"==t.bgrepeat?t.mDIM.width/2-a.width/2-Math.ceil(t.mDIM.width/2/a.width)*a.width:t.mDIM.width/2-a.width/2:"right"===t.shadowShifts.h?"repeat"==t.bgrepeat||"repeat-x"==t.bgrepeat?-(a.width-t.mDIM.width%a.width):t.mDIM.width-a.width:"repeat"==t.bgrepeat||"repeat-x"==t.bgrepeat?-(a.width-t.shadowShifts.hperc%a.width):t.shadowShifts.hperc,t.shadowShifts.y="top"===t.shadowShifts.v?0:"center"===t.shadowShifts.v||"50%"==t.shadowShifts.v?"repeat"==t.bgrepeat||"repeat-y"==t.bgrepeat?t.mDIM.height/2-a.height/2-Math.ceil(t.mDIM.height/2/a.height)*a.height:t.mDIM.height/2-a.height/2:"bottom"===t.shadowShifts.v?"repeat"==t.bgrepeat||"repeat-y"==t.bgrepeat?-(a.height-t.mDIM.height%a.height):t.mDIM.height-a.height:"repeat"==t.bgrepeat||"repeat-y"==t.bgrepeat?-(a.height-t.shadowShifts.vperc%a.height):t.shadowShifts.vperc,t.shadowCTX.save(),t.shadowCTX.translate(t.shadowShifts.x,t.shadowShifts.y),t.shadowCTX.fillRect(0,0,t.mDIM.width-t.shadowShifts.x,t.mDIM.height-t.shadowShifts.y),t.shadowCTX.restore()},getCanvasGradients:function(e,t){if(t.bgcolor.indexOf("gradient")>=0){t.gradient=null==t.gradient||_R_is_Editor?i.getGradients(t.bgcolor):t.gradient,t.shadowGrd="radialGradient"===t.gradient.type?t.shadowCTX.createRadialGradient(t.mDIM.width/2,t.mDIM.height/2,0,t.mDIM.width/2,t.mDIM.height/2,Math.max(t.mDIM.width/2,t.mDIM.height/2)):i.calcLinearGradient(t.shadowCTX,t.shadowCanvas.width,t.shadowCanvas.height,t.gradient.deg);for(var a=0;a<t.gradient.stops.length;a+=2)t.shadowGrd.addColorStop(t.gradient.stops[a+1],t.gradient.stops[a]);t.shadowCTX.clearRect(0,0,t.mDIM.width,t.mDIM.height),t.shadowCTX.fillStyle=t.shadowGrd,t.shadowCTX.fillRect(0,0,t.mDIM.width,t.mDIM.height)}else t.shadowCTX.clearRect(0,0,t.mDIM.width,t.mDIM.height),t.shadowCTX.fillStyle=t.bgcolor,t.shadowCTX.fillRect(0,0,t.mDIM.width,t.mDIM.height)},cNS:function(e){var i;for(i in e.n=document.createElementNS("http://www.w3.org/2000/svg",e.n),e.v)e.n.setAttributeNS(null,i.replace(/[A-Z]/g,function(e,i,t,a){return"-"+e.toLowerCase()}),e.v[i]);for(i in void 0!==e.c&&e.n.setAttribute("class",e.c),void 0!==e.id&&(e.n.id=e.id),void 0!==e.t&&(e.n.textContent=e.t),e.s)e.s.hasOwnProperty(i)&&(e.n.style[i]=e.s[i]);return e.n},rgbToHex:function(e){return"#"+l(e[0])+l(e[1])+l(e[2])},getSVGGradient:function(e){if(void 0===e)return e;if(_R_is_Editor&&(e=RSColor.convert(e)),-1==e.indexOf("gradient"))return e;var t=i.getGradients(e);void 0===i.gradSVG&&(i.gradSVG=i.cNS({n:"svg",id:"tp_svg_gradients",s:{width:"100%",height:"100%",opacity:0,pointerEvents:"none"}}),i.gradSVG.setAttribute("viewBox","0 0 1 1"),i.gradSVG.setAttribute("preserveAspectRatio","none"),document.body.appendChild(i.gradSVG),i.svgGradients=[]);for(var a=!1,r=JSON.stringify(e),o=0;o<i.svgGradients.length;o++)a||i.svgGradients[o].src==r&&(a=!0,e=i.svgGradients[o].url);if(!a){var s,n,d,l="radialGradient"===t.type?0:t.deg*(Math.PI/180),c="radialGradient"===t.type?0:{x1:Math.round(50+50*Math.sin(l))+"%",y1:Math.round(50+50*Math.cos(l))+"%",x2:Math.round(50+50*Math.sin(l+Math.PI))+"%",y2:Math.round(50+50*Math.cos(l+Math.PI))+"%"};d=i.cNS({n:t.type,id:"tp_svg_gradient_"+i.svgGradients.length,v:"radialGradient"===t.type?void 0:{gradientUnits:"userSpaceOnUse",x1:c.x1,y1:c.y1,x2:c.x2,y2:c.y2}});for(var p=0;p<=t.stops.length/2;p+=2)n=tpGS.gsap.utils.splitColor(t.stops[p]),s=i.cNS({n:"stop",v:{offset:100*t.stops[p+1]+"%",stopColor:i.rgbToHex(n),stopOpacity:n.length>3?n[3]:1}}),d.appendChild(s);i.gradSVG.appendChild(d),e="url(#tp_svg_gradient_"+i.svgGradients.length+")",i.svgGradients.push({url:e,src:r,g:d})}return e},getGradients:function(e){return e.indexOf("radial-gradient")>=0?{stops:i.getGradientColorStopPoints(e.split("radial-gradient(ellipse at center, ")[1]),type:"radialGradient",deg:0}:-1!==e.indexOf("gradient")?i.getLinearGradientStops(e):e},getLinearGradientStops:function(e){var i=e.split("linear-gradient(")[1];_R_is_Editor&&(i=(i=i.split(", ").join(",")).split(",rgba").join(", rgba"));var t=i.split("deg, ");for(var a in i=(t.length>1?t[1]:t[0]).split(" "),t=t.length>1?t[0]:180,i)i.hasOwnProperty(a)&&i[a].indexOf("%")>=0&&(i[a]=""+Math.round(100*parseFloat(i[a].split("%,")[0].split("%)")[0]))/1e4);return{stops:i,deg:t,type:"linearGradient"}},getGradientColorStopPoints:function(e){var i=/rgb([\s\S]*?)%/g,t=[],a=[];do{(o=i.exec(e))&&t.push(o[0])}while(o);for(var r=0;r<t.length;r++){var o=t[r],s=(e=/rgb([\s\S]*?)\)/.exec(o),/\)([\s\S]*?)%/.exec(o));e[0]&&(e=e[0]),s[1]&&(s=s[1]),a.push(e),a.push(parseFloat(s)/100)}return a},calcLinearGradient:function(e,i,t,a){a=a*Math.PI/180+Math.PI/2;for(var r,o,s,n,d=i/2,l=t/2,c=Math.sqrt(d*d+l*l),h={x1:Math.cos(a)*c+d,y1:Math.sin(a)*c+l,x2:d,y2:l},m=[g({x:0,y:0},a),g({x:i,y:0},a),g({x:i,y:t},a),g({x:0,y:t},a)],v=[],f=0;f<m.length;f++)v.push(u(m[f],h));if(p(d,l,v[0].x,v[0].y)>p(d,l,v[1].x,v[1].y)?(r=v[0].x,o=v[0].y):(r=v[1].x,o=v[1].y),p(d,l,v[2].x,v[2].y)>p(d,l,v[3].x,v[3].y)?(s=v[2].x,n=v[2].y):(s=v[3].x,n=v[3].y),Math.round(100*Math.atan2(l-o,d-r))/100===Math.round(a%(2*Math.PI)*100)/100){var y=r,w=o;r=s,o=n,s=y,n=w}return e.createLinearGradient(Math.round(r),Math.round(o),Math.round(s),Math.round(n))},transitions:{filter:{update:function(e,i,t){if(void 0!==e&&void 0!==e.tl){var a=void 0!==t||void 0!==e.tl.blur?" blur("+(void 0!==t?t:0+e.tl.blur!==void 0?e.tl.blur:0)+"px)":"";i.canvas.style.filter=void 0===e.tl.filter?""+a:e.tl.filter+a}},extendTimeLine:function(e,i,t){if(null!=i){var a=void 0!==i.g&&"0%"!==i.g&&0!==i.g?(""===a?"":" ")+"grayscale(_g_%)":"";a+=void 0!==i.h&&"100%"!==i.h&&100!==i.h?(""===a?"":" ")+"brightness(_h_%)":"",a+=void 0!==i.s&&"0px"!==i.s&&0!==i.s?(""===a?"":" ")+"sepia(_s_%)":"",a+=void 0!==i.c&&100!==i.c?(""===a?"":" ")+"contrast(_c_%)":"",""!==(a+=void 0!==i.i&&0!==i.i?(""===a?"":" ")+"invert(_i_%)":"")&&(i.tl={filter:a.replace("_g_",parseFloat(i.g)).replace("_h_",parseFloat(i.h)).replace("_s_",parseFloat(i.s)).replace("_c_",parseFloat(i.c)).replace("_i_",parseFloat(i.i))}),void 0!==i.b&&"0px"!==i.b&&0!==i.b&&(void 0===i.tl?i.tl={blur:parseFloat(i.b)}:i.tl.blur=parseFloat(i.b)),void 0!==i.tl&&(e.add(tpGS.gsap.to(i.tl,i.ms/i.sec,void 0===i.tl.filter?{blur:0}:void 0===i.tl.blur?{filter:a.replace("_g_","0").replace("_h_","100").replace("_s_","0").replace("_c_",100).replace("_i_",0),ease:i.e}:{blur:0,filter:a.replace("_g_","0").replace("_h_","100").replace("_s_","0").replace("_c_",100).replace("_i_",0),ease:i.e}),0),t.canvasFilter=!0)}}},slidingoverlay:{getBasic:function(){return i.getBasic({attr:["x","y"],in:{m:!0,o:-1,_xy:20,_gxys:10,_gxye:-10,zIndex:20,e:"power1.inOut"},out:{m:!0,reversed:!1,_xy:-100,o:0,zIndex:10,e:"power1.inOut"}})},updateAnim:function(e,t,a){var r=void 0!==t.in.x&&0!==t.in.x&&"0%"!==t.in.x?"x":"y";t.in["g"+r+"s"]=i.SATools.getOffset(t.in[r],t.in._gxys,a,1)+"%",t.in["g"+r+"e"]=i.SATools.getOffset(t.in[r],t.in._gxye,a,1)+"%",t.out[r]=i.SATools.getOffset(t.in[r],t.out._xy,a,1)+"%",t.in[r]=i.SATools.getOffset(t.in[r],t.in._xy,a,1)+"%";var o=parseInt(t.in[r])>=0;return t.in.d="x"===r?o?"left":"right":o?"up":"down",t},beforeDraw:function(e,i,t,a){void 0!==t.d&&(t._dxs="right"===t.d?0+t.mw:"left"===t.d?0-t.mw:0,t._dys="down"===t.d?0+t.mh:"up"===t.d?0-t.mh:0,t._xs="left"===t.d?0-t.mw:0,t._ys="up"===t.d?0-t.mh:0,t._xe="right"===t.d?a.SLOT.OW+t.mw:"left"===t.d?a.SLOT.OW-t.mw:a.SLOT.OW,t._ye="down"===t.d?a.SLOT.OH+t.mh:"up"===t.d?a.SLOT.OH-t.mh:a.SLOT.OH,i.beginPath(),i.rect("left"===t.d?Math.max(0,t._xs):"right"===t.d?Math.min(0,t._xs):0,"up"===t.d?Math.max(0,t._ys):"down"===t.d?Math.min(0,t._ys):0,"left"===t.d?Math.max(a.SLOT.OW,t._xe):"right"===t.d?Math.min(a.SLOT.OW,t._xe):t._xe,"up"===t.d?Math.max(a.SLOT.OH,t._ye):"down"===t.d?Math.min(a.SLOT.OH,t._ye):t._ye),i.clip())},afterDraw:function(e,i,t,a,r){void 0!==t.d&&(i.save(),i.beginPath(),i.rect(Math.max(0,t._dxs),Math.max(0,t._dys),t._xe,t._ye),i.clip(),i.save(),i.transform(r.csx,r.ssx,r.ssy,r.csy,.5*a.SLOT.OW+t.x+t.sgx,.5*a.SLOT.OH+t.y+t.sgy),i.drawImage(void 0!==a.shadowCanvas?a.shadowCanvas:a.loadobj.img,0,0,a.SLOT.OW,a.SLOT.OH,t.sgx-a.SLOT.OW/2,t.sgy-a.SLOT.OH/2,a.SLOT.OW,a.SLOT.OH),i.restore(),i.fillStyle="rgba(0,0,0,0.6)",i.fillRect(t.gx,t.gy,a.SLOT.OW,a.SLOT.OH),i.restore())},extendTimeLine:function(e,t,a,r,o,s){"in"!==o.direction||void 0===r.gxe&&void 0===r.gye||(jQuery.extend(!0,a[0],{d:r.d,gx:void 0===r.gxs?0:2*i.SATools.getOffset(r.gxs,s.width,o.sdir,0),gy:void 0===r.gys?0:2*i.SATools.getOffset(r.gys,s.height,o.sdir,0),sgx:void 0===r.gxs?0:i.SATools.getOffset(r.gxs,s.width,o.sdir,0),sgy:void 0===r.gys?0:i.SATools.getOffset(r.gys,s.height,o.sdir,0),mw:0-s.width,mh:0-s.height}),t.add(tpGS.gsap.to(a,r.ms/r.sec,{gx:void 0===r.gxe?0:2*i.SATools.getOffset(r.gxe,s.width,o.sdir,0),gy:void 0===r.gye?0:2*i.SATools.getOffset(r.gye,s.height,o.sdir,0),sgx:void 0===r.gxe?0:2*i.SATools.getOffset(r.gxe,s.width,o.sdir,0),sgy:void 0===r.gye?0:2*i.SATools.getOffset(r.gye,s.height,o.sdir,0),mw:s.width,mh:s.height,ease:r.e}),0))}},motionFilter:{init:function(e,i){return void 0!==i&&parseFloat(i)>0?(i=parseFloat(i),e.fmExists=!0,e.fmShadow=void 0===e.fmShadow?document.createElement("canvas"):e.fmShadow,e.fmCtx=e.fmShadow.getContext("2d"),e.fmShadow.width=e.ctx.canvas.width,e.fmShadow.height=e.ctx.canvas.height,e.fmCtx.globalAlpha=tpGS.gsap.utils.mapRange(100,0,40,0,i)/100,e.fmCtx.clearRect(0,0,e.ctx.canvas.width,e.ctx.canvas.height)):e.fmExists=!1,i},render:function(e,i){"partial"===i&&(e.fmCtx.globalCompositeOperation="source-over"),e.fmCtx.drawImage(e.canvas,0,0,e.canvas.width,e.canvas.height),e.ctx.clearRect(0,0,e.canvas.width,e.canvas.height),e.ctx.drawImage(e.fmCtx.canvas,0,0,e.canvas.width,e.canvas.height),"partial"===i&&(e.fmCtx.globalCompositeOperation="source-atop"),"partial"!==i&&"full"!==i||(e.fmCtx.fillStyle="rgba(255, 255, 255, 0.1)",e.fmCtx.fillRect(0,0,e.canvas.width,e.canvas.height))},clearFull:function(e,i){e.fmExists&&void 0!==e.fmCtx&&(e.ctx.clearRect(0,0,e.canvas.width,e.canvas.height),e.fmCtx.clearRect(0,0,e.canvas.width,e.canvas.height),void 0!==i&&i.render(i.time(),!0,!0))},complete:function(e){e.fmShadow&&e.fmShadow.remove()}},d3:{ticker:function(e,i,t){if(void 0!==e.helper){var a=e.smi*("in"===t?e.helper.oo:e.helper.o),r=e.sma*("in"===t?e.helper.oo:e.helper.o);if(e.gradient="vertical"===e.d?"in"===t?i.ctx.createLinearGradient(0,0,0,i.canvas.height):i.ctx.createLinearGradient(0,i.canvas.height,0,0):"in"===t?i.ctx.createLinearGradient(0,0,i.canvas.width,0):i.ctx.createLinearGradient(i.canvas.width,0,0,0),e.gradient.addColorStop(0,"rgba("+e.sc+","+a+")"),e.gradient.addColorStop(e.sl,"rgba("+e.sc+","+r+")"),i.ctx.fillStyle=e.gradient,i.ctx.fillRect(0,0,i.canvas.width,i.canvas.height),void 0!==i.cube&&i.cube.ctx){var o=void 0!==e.roomhelper&&!1!==e.roomhelper&&(90-e.roomhelper.r)/90;a=!1!==o?o:e.smi*e.helper.o,r=!1!==o?o:e.sma*e.helper.o,i.cube.ctx.clearRect(0,0,i.cube.ctx.canvas.width,i.cube.ctx.canvas.height),e.gradientW=!1!==o?"vertical"===e.d?e.t<0&&1===e.sdir||e.t>0&&-1===e.sdir?i.ctx.createRadialGradient(0,i.cube.ctx.canvas.width/2,0,0,0,2*i.cube.ctx.canvas.width):i.ctx.createRadialGradient(i.cube.ctx.canvas.width,0,0,0,0,2*i.cube.ctx.canvas.width):e.t>0&&1===e.sdir||e.t<0&&-1===e.sdir?i.ctx.createRadialGradient(i.cube.ctx.canvas.width/2,i.cube.ctx.canvas.height,0,i.cube.ctx.canvas.width/2,i.cube.ctx.canvas.height,i.cube.ctx.canvas.width):i.ctx.createRadialGradient(i.cube.ctx.canvas.width/2,.2*i.cube.ctx.canvas.height,0,i.cube.ctx.canvas.width/2,.2*i.cube.ctx.canvas.height,i.cube.ctx.canvas.width):"vertical"===e.d?i.ctx.createLinearGradient(0,0,0,i.cube.ctx.canvas.height):i.ctx.createLinearGradient(0,0,i.cube.ctx.canvas.width,0),e.gradientW.addColorStop(0,"rgba("+e.sc+","+(!1!==o?"a"===e.DIR?r:0:"a"===e.DIR?0:r)+")"),e.gradientW.addColorStop(1,"rgba("+e.sc+","+(!1!==o?"a"===e.DIR?0:r:"a"===e.DIR?r:0)+")"),i.cube.ctx.fillStyle=e.gradientW,i.cube.ctx.fillRect(0,0,i.cube.ctx.canvas.width,i.cube.ctx.canvas.height)}}},setWall:function(e,i,t,a,r,o){return e.TL=tpGS.gsap.timeline(),e.TL.add(tpGS.gsap.to(e.c,.2,{display:"block"}),0),"rotationX"===t?(e.ctx.canvas.width=a.w,e.ctx.canvas.height=a.w,e.TL.add(tpGS.gsap.set(e.w,{backgroundColor:r,width:a.w,height:a.w,transformOrigin:"50% 50% -"+a.w/2+"px",x:0,y:i>0?-(a.w-a.h):0,rotationX:i>0?-90:90,rotationY:0}),0)):(e.ctx.canvas.width=o?a.w:a.h,e.ctx.canvas.height=a.h,e.TL.add(tpGS.gsap.set(e.w,{backgroundColor:r,width:o?a.w:a.h,height:a.h,transformOrigin:"50% 50% -"+(o?a.w:a.h)/2+"px",x:i<0?a.w-a.h:0,y:0,rotationX:0,rotationY:i>0?-90:90}),0)),e.TL},buildCube:function(e){e.cube={c:document.createElement("div"),w:document.createElement("canvas")},e.cube.ctx=e.cube.w.getContext("2d"),e.cube.c.className="rs_fake_cube",e.cube.w.className="rs_fake_cube_wall",tpGS.gsap.set(e.cube.c,{width:e.mDIM.w,height:e.mDIM.h}),tpGS.gsap.set(e.cube.w,{width:e.mDIM.w,height:e.mDIM.h,backgroundColor:"#ccc"}),e.cube.c.appendChild(e.cube.w),e.sbg.appendChild(e.cube.c)},cubeTL:function(e,t,a,r){if("none"!==t.f&&void 0!==t.f){a.sbg.style.transformStyle="preserve-3d";var o=tpGS.gsap.timeline(),s="incube"===t.f?1:-1,n="incube"===t.f||"cube"===t.f,d="fly"===t.f?-30:90,l="turn"!==t.f&&!1!==t.t&&(_R_is_Editor||!0===i[e].firstSlideAnimDone),c=-1*t.z,p={},g={z:l?0:c,ease:"power1.inOut"},u={ease:t.e},h=[a.canvas],m=n?"50% 50% ":"20% 20% ",v="rotationX",f="rotationY",y="y",w="height",b=t.fd;if("vertical"!==t.d?(v="rotationY",f="rotationX",y="x",w="width",t.DIR=1===t.sdir?"b":"a"):t.DIR=1===t.sdir?"a":"b",w="width"===w?"w":"height"===w?"h":w,"turn"===t.f?(d="vertical"===t.d?-120:120,m="vertical"===t.d?1===t.sdir?"in"===r?"0% 0% 0%":"0% 100% 0%":"in"===r?"0% 100% 0%":"0% 0% 0%":1===t.sdir?"in"===r?"0% 0% 0%":"100% 0% 0%":"in"===r?"100% 0% 0%":"0% 0% 0%",g.z=0,u.ease="out"===r?"power3.out":u.ease,b="out"===r?b/2:b):m+=s*a.mDIM[w]/2+"px",u[v]=0,u[y]=0,"in"===r?p[v]=d*t.sdir:u[v]=-d*t.sdir,"fly"===t.f){var _=void 0===t.fz?20*Math.random()-10:parseInt(t.fz);"in"===r?(p[y]=a.mDIM[w]*(void 0===t.fdi?1.5:parseFloat(t.fdi))*t.sdir,p.rotateZ=t.sdir*_,u.rotateZ=0):(u[y]=a.mDIM[w]*(void 0===t.fdo?2:parseFloat(t.fdo))*t.sdir*-1,u.rotateZ=t.sdir*_*-1)}if(a.sbg.style.perspective=l?"2500px":"1500px",l){var S={z:c*("fly"===t.f?1.5:3),ease:"power1.inOut"},x={z:0,ease:"power1.inOut"};S[f]=-1*t.t,x[f]=0,t.roomhelper={r:0},o.add(tpGS.gsap.set(_R_is_Editor?RVS.SBGS[RVS.S.slideId].wrap:a.wrap[0],{perspective:1200,transformStyle:"preserve-3d",transformOrigin:m}),0),o.add(tpGS.gsap.to(a.sbg,3*t.md,S),0),o.add(tpGS.gsap.to(a.sbg,3*t.md,x),b-t.md),o.add(tpGS.gsap.to(t.roomhelper,3*t.md,{r:Math.abs(t.t)}),0),o.add(tpGS.gsap.to(t.roomhelper,3*t.md,{r:0}),b-t.md),"in"===r&&1!==s&&n&&(void 0===a.cube&&i.transitions.d3.buildCube(a),o.add(i.transitions.d3.setWall(a.cube,S[f],f,a.mDIM,t.c),0),h.push(a.cube.c))}else t.roomhelper=!1,o.add(tpGS.gsap.set(_R_is_Editor?RVS.SBGS[RVS.S.slideId].wrap:a.wrap[0],{perspective:"none",transformStyle:"none",transformOrigin:"50% 50%"}),0),!_R_is_Editor&&!0!==i[e].firstSlideAnimDone&&n&&(void 0===a.cube&&i.transitions.d3.buildCube(a),o.add(i.transitions.d3.setWall(a.cube,p[v],v,a.mDIM,t.c,!0),0),o.add(tpGS.gsap.fromTo(a.cube.w,4*t.md,{opacity:0},{opacity:1}),0),h.push(a.cube.c));return t.helper={o:0,oo:1},o.add(tpGS.gsap.to(t.helper,b,{o:1,oo:0,ease:t.e}),t.md+0),o.add(tpGS.gsap.set(h,jQuery.extend(!0,{},p,{force3D:!0,transformOrigin:m})),0),"turn"!==t.f&&o.add(tpGS.gsap.to(h,3*t.md,g),0),o.add(tpGS.gsap.to(h,b,u),t.md+0),"turn"!==t.f&&o.add(tpGS.gsap.to(h,3*t.md,{z:0,ease:"power1.inOut"}),b-t.md),"out"===r&&1!==s&&o.add(tpGS.gsap.to(h,2*t.md,{opacity:0}),t.dur-2*t.md),o}}}},animatedCanvasUpdate:function(e,t){t.cDIMS=i.getBGCanvasDetails(e,t),t.canvas.style.backgroundColor="transparent",t.canvas.style.opacity=1,t.canvas.width!==t.mDIM.width&&(t.canvas.width=t.mDIM.width),t.canvas.height!==t.mDIM.height&&(t.canvas.height=t.mDIM.height),_R_is_Editor||!0!==i[e].clearModalBG||(t.ctx.clearRect(0,0,t.canvas.width,t.canvas.height),i[e].clearModalBG=!1,t.sbg.parentNode.style.opacity=1),t.col=t.col||1,t.row=t.row||1,t.SLOT=jQuery.extend(!0,{s:{},c:{}},a(e,t.col,t.row,t.mDIM,"OW","OH")),t.SLOT.DX=0-t.SLOT.OW/2,t.SLOT.DY=0-t.SLOT.OH/2,t.row=Math.ceil(t.mDIM.height/t.SLOT.OH)||1,void 0!==t.callFromAnimatedCanvasUpdate&&t.callFromAnimatedCanvasUpdate()},slideAnimFinished:function(e,t,a,r){void 0!==t&&(void 0!==t.bgvid&&t.bgvid.length>0&&"out"===a.direction&&(t.drawVideoCanvasImagesRecall=!1,i.stopVideo(t.bgvid,e),t.bgvid[0].style.display="none",t.bgvid[0].style.zIndex=0),t.panFake&&t.panFake.img&&("out"===a.direction?t.panFake.img.style.display="none":t.panFake.img.style.display="block"),"in"===a.direction&&(i.transitions.motionFilter.complete(t),t.ctx.canvas.style.filter="none",tpGS.gsap.set(a.slide,{zIndex:20}),delete t.animateDirection,t.bgvid.length>0&&(t.isHTML5?tpGS.gsap.set(t.bgvid[0],{zIndex:30,display:"block",opacity:1}):(i.resetVideo(t.bgvid,e),tpGS.gsap.delayedCall(.1,function(){i.playVideo(t.bgvid,e,!0),tpGS.gsap.set(t.bgvid[0],{zIndex:30,display:"block",opacity:1})})))),"out"===a.direction?(tpGS.gsap.set(a.slide,{zIndex:10}),tpGS.gsap.set(t.canvas,{rotationX:0,rotationY:0,rotationZ:0,x:0,y:0,z:0,opacity:1}),t.currentState=void 0):t.currentState="idle",void 0!==t.cube&&(t.cube.c.style.display="none"),"in"===a.direction&&(i.updateSlideBGs(e,t.skeyindex,t),void 0===t.panzoom||_R_is_Editor||i.startPanZoom(i[e].pr_next_bg,e,void 0!==i[e].panzoomTLs[t.skeyindex]?i[e].panzoomTLs[t.skeyindex].progress():0,t.skeyindex,"play",t.key),void 0!==a.BG&&!0!==r&&a.BG.ctx.clearRect(0,0,2*t.canvas.width,2*t.canvas.height)))},animateCore:function(e,t,a,r){var o,s,n,d,l=t.canvas,c=t.ctx,p=0;if(t.col=a.col,t.row=a.row,_R_is_Editor&&t.three){for(t.canvas.style.display="block";t.three.scene.children.length>0;)t.three.scene.remove(t.three.scene.children[0]);t.three.canvas.parentNode.removeChild(t.three.canvas),t.three=void 0}i.animatedCanvasUpdate(e,t),a.row=t.row,t.animateDirection=r.direction,r.delay=void 0===r.delay?0:r.delay,n=a.col*a.row,d=Array(n),void 0===t.help_canvas&&"out"===r.direction&&void 0!==r.bgColor&&(t.help_canvas=document.createElement("canvas"),t.help_ctx=t.help_canvas.getContext("2d")),"out"===r.direction&&void 0!==r.bgColor&&(t.help_canvas.width=t.mDIM.width,t.help_canvas.height=t.mDIM.height,t.help_ctx.fillStyle=r.bgColor,t.help_ctx.fillRect(0,0,t.mDIM.width,t.mDIM.height)),a.mo=i.transitions.motionFilter.init(t,a.mo),a.dur=a.ms/a.sec,void 0!==r.d3&&(r.d3.dur=a.dur,r.d3.fd=.7*a.dur,r.d3.md=.15*a.dur,r.d3.sdir=r.sdir),t.SLOT.c={ws:0,hs:0,wd:0,hd:0},a.mo>0&&_R_is_Editor&&c.clearRect(0,0,l.width,l.height);var g=tpGS.gsap.timeline({onUpdate:function(){if(p=0,a.mo>0?i.transitions.motionFilter.render(t,a.moo):c.clearRect(0,0,l.width,l.height),t.help_canvas&&"out"===r.direction&&c.drawImage(t.help_canvas,0,0),(r.filter&&r.filter.u||!_R_is_Editor)&&i.transitions.filter.update(r.filter,c,t.canvasFilterBlur),_R_is_Editor&&0!==a.zIndex&&void 0!==a.zIndex&&tpGS.gsap.set(r.slide,{zIndex:a.zIndex}),void 0!==t.shadowCanvas)for(o=0;o<a.col;o++)for(t.SLOT.SX=t.SLOT.OW*o,t.SLOT.tw=t.SLOT.OW*(o+.5),t.SLOT.c.wd=t.mDIM.width-(t.SLOT.tw+t.SLOT.DX+t.SLOT.OW),t.SLOT.c.wd=t.SLOT.c.wd<0?t.SLOT.c.wd:0,t.SLOT.DW=t.SLOT.SW=t.SLOT.OW+t.SLOT.c.wd,s=0;s<a.row;s++){c.save();var n=-Math.PI/180*d[p].r,g=0!==a.r?Math.cos(n)*d[p].sx:d[p].sx,u=0!==a.r?Math.cos(n)*d[p].sy:d[p].sy,h=0!==a.r?Math.sin(n)*d[p].sx:0,m=0!==a.r?Math.sin(n)*-d[p].sy:0;t.SLOT.SY=t.SLOT.OH*s,t.SLOT.th=t.SLOT.OH*(s+.5),i.transitions[r.effect]&&i.transitions[r.effect].beforeDraw&&i.transitions[r.effect].beforeDraw(e,c,d[p],t),a.m&&(c.beginPath(),c.rect(t.SLOT.OW*o,t.SLOT.OH*s,t.SLOT.OW,t.SLOT.OH),c.clip()),c.transform(g,h,m,u,t.SLOT.tw+d[p].x,t.SLOT.th+d[p].y),c.globalAlpha=Math.max(0,d[p].o),t.SLOT.c.hd=t.mDIM.height-(t.SLOT.th+t.SLOT.DY+t.SLOT.OH),t.SLOT.c.hd=t.SLOT.c.hd<0?t.SLOT.c.hd:0,t.SLOT.DH=t.SLOT.SH=t.SLOT.OH+t.SLOT.c.hd,t.SLOT.SW>1&&t.SLOT.SH>1&&c.drawImage(t.shadowCanvas,t.SLOT.SX,t.SLOT.SY,t.SLOT.SW,t.SLOT.SH,t.SLOT.DX,t.SLOT.DY,t.SLOT.DW,t.SLOT.DH),c.restore(),i.transitions[r.effect]&&i.transitions[r.effect].afterDraw&&i.transitions[r.effect].afterDraw(e,c,d[p],t,{csx:g,csy:u,ssx:h,ssy:m}),p++}void 0!==r.d3&&r.d3.su&&i.transitions.d3.ticker(r.d3,t,r.direction),t.currentState="animating"},onComplete:function(){i.slideAnimFinished(e,t,r)}});if(a.col*a.row<2&&(a.f="start"),0!==a.zIndex&&void 0!==a.zIndex&&g.add(tpGS.gsap.set(r.slide,{zIndex:parseInt(a.zIndex,0)}),0),a.m="false"!=a.m&&!1!==a.m,"in"===r.direction){for(o=0;o<n;o++)d[o]={x:i.SATools.getOffset(a.x,a.m?t.SLOT.OW:t.mDIM.width,r.sdir,o),y:i.SATools.getOffset(a.y,a.m?t.SLOT.OH:t.mDIM.height,r.sdir,o),o:i.SATools.getSpecialValue(a.o,o,r.sdir),sx:i.SATools.getSpecialValue(a.sx,o,r.sdir),sy:i.SATools.getSpecialValue(a.sy,o,r.sdir),r:0!==a.r?i.SATools.getSpecialValue(a.r,o,r.sdir):0};g.add(tpGS.gsap.to(d,a.dur,{o:1,sx:1,sy:1,r:0,x:0,y:0,ease:a.e,stagger:{amount:"nodelay"===a.f?0:a.ms/a.stasec,grid:[a.col,a.row],from:"nodelay"===a.f?"start":a.f}}),r.delay),void 0!==r.d3&&g.add(i.transitions.d3.cubeTL(e,r.d3,t,"in"),0),i.transitions.filter.extendTimeLine(g,r.filter,t)}else{for(o=0;o<n;o++)d[o]={x:0,y:0,o:1,sx:1,sy:1,r:0};g.add(tpGS.gsap.to(d,a.dur,{o:function(e){return i.SATools.getSpecialValue(a.o,e,r.sdir)},sx:function(e){return i.SATools.getSpecialValue(a.sx,e,r.sdir)},sy:function(e){return i.SATools.getSpecialValue(a.sy,e,r.sdir)},r:0!==a.r&&void 0!==a.r?function(e){return i.SATools.getSpecialValue(a.r,e,r.sdir)}:0,x:function(e){return i.SATools.getOffset(a.x,a.m?t.SLOT.OW:t.mDIM.width,r.sdir,e)*(a.reversed?-1:1)},y:function(e){return i.SATools.getOffset(a.y,a.m?t.SLOT.OH:t.mDIM.height,r.sdir,e)*(a.reversed?-1:1)},ease:a.e,stagger:{amount:"nodelay"===a.f?0:a.ms/a.stasec,grid:[a.col,a.row],from:"nodelay"===a.f?"start":a.f}}),r.delay+(void 0!==a.outdelay?a.outdelay:0)),void 0!==r.d3&&g.add(i.transitions.d3.cubeTL(e,r.d3,t,"out"),0)}i.transitions[r.effect]&&i.transitions[r.effect].extendTimeLine&&i.transitions[r.effect].extendTimeLine(e,g,d,a,r,t.mDIM),_R_is_Editor?RVS.TL[RVS.S.slideId].slide.add(g,0):i[e].mtl.add(g,r.delay)}});var t=function(e,t){return void 0!==t&&i.isNumeric(t)?parseFloat(t,0):null==t||"default"===t||"d"===t?e:t},a=function(e,i,t,a,r,o){var s={};return s[r]=Math.ceil(a.width/i),s[o]=(_R_is_Editor,Math.ceil(a.height/t)),s},r=function(e){return null==e||0===e||NaN===e?1:e},o=function(e,a){_R_is_Editor||(i[e].duringslidechange=!0);var o,s=_R_is_Editor?-1:"arrow"==i[e].sc_indicator?void 0===i[e].sc_indicator_dir?i[e].sdir:i[e].sc_indicator_dir:i[e].sdir,d=!!_R_is_Editor||void 0!==i[e].pr_next_bg&&i[e].pr_next_bg.length>0&&void 0!==i[e].pr_next_bg[0],l=!!_R_is_Editor||void 0!==i[e].pr_active_bg&&i[e].pr_active_bg.length>0&&void 0!==i[e].pr_active_bg[0],p=_R_is_Editor?RVS.SBGS[RVS.S.slideId].n:d?i[e].sbgs[i[e].pr_next_bg[0].dataset.key]:void 0,g=_R_is_Editor?RVS.SBGS[RVS.S.slideId].c:l?i[e].sbgs[i[e].pr_active_bg[0].dataset.key]:void 0;s=1===s?-1:1,o=jQuery.extend(!0,{},function(e,a,o){var s=void 0!==i.transitions[a.anim.e]&&void 0!==i.transitions[a.anim.e].getBasic?i.transitions[a.anim.e].getBasic():i.getBasic(),n="";s.out=null==s.out?{}:s.out,s.out.reversed=void 0===a.out&&(void 0===s.out.reversed||s.out.reversed);void 0!==a.iw&&parseInt(a.iw,0),void 0!==a.ow&&parseInt(a.ow,0);for(var d in s.attr)n=s.attr[d],s.in[n]=t(s.in[n],a.in[n]),s.out[n]=s.out.reversed?s.in[n]:void 0===a.out?s.out[n]:t(s.out[n],a.out[n]);return s.filter=void 0!==a.filter?jQuery.extend(!0,a.filter,a.filter):s.filter,i.transitions[a.anim.e]&&i.transitions[a.anim.e].updateAnim&&(s=i.transitions[a.anim.e].updateAnim(e,s,o)),s.e=a.anim.e,void 0!==s.in&&(s.in.col="random"===s.in.col?tpGS.gsap.utils.random(1,10,1):r(s.in.col),s.in.row="random"===s.in.row?tpGS.gsap.utils.random(1,10,1):r(s.in.row)),void 0!==s.out&&(s.out.col="random"===s.out.col?tpGS.gsap.utils.random(1,10,1):r(s.out.col),s.out.row="random"===s.out.row?tpGS.gsap.utils.random(1,10,1):r(s.out.row)),s}(e,a,s)),void 0!==p.random&&void 0!==i.SLTR&&void 0!==g&&(delete g.help_canvas,delete g.help_ctx),o.ms=t(void 0,void 0===a.anim.ms?1e3:a.anim.ms),o.f=t(void 0,a.anim.f),o.p=t(void 0,a.anim.p),o.d=t(void 0,a.anim.d),o.o=a.anim.o,void 0!==a.d3&&(a.d3.t=void 0!==a.d3.t&&0!==a.d3.t&&a.d3.t,a.d3.su="true"==a.d3.su||1==a.d3.su,a.d3.su&&(a.d3.smi=void 0===a.d3.smi?0:parseFloat(a.d3.smi),a.d3.sl=void 0===a.d3.sl?1:parseFloat(a.d3.sl),a.d3.sma=void 0===a.d3.sma?.5:parseFloat(a.d3.sma),a.d3.sc=void 0===a.d3.sc?"0,0,0":tpGS.gsap.utils.splitColor(a.d3.sc).join(",")),o.p="none",void 0!==o.in.row&&void 0!==o.in.col&&o.in.row*o.in.col>200&&(o.filter=void 0)),o.in.sec=void 0===o.in.sec?1e3:o.in.sec,o.in.stasec=void 0===o.in.stasec?void 0===o.d?1500:100*o.d:o.in.stasec,o.in.ms="default"===o.ms||"d"===o.ms?o.in.ms:"random"===o.ms?Math.round(1e3*Math.random()+300):null!=o.ms?parseInt(o.ms,0):o.in.ms,o.out.ms=o.in.ms,void 0!==o.filter&&(o.filter.ms=o.in.ms,o.filter.sec=o.in.sec,o.filter.e=void 0===o.filter.e||"default"===o.filter.e?o.in.e:o.filter.e),o.in.f=void 0===o.f||"default"===o.f||"d"===o.f?o.in.f:o.f,o.in.f="slidebased"===o.in.f?1==s?"start":"end":"oppslidebased"===o.in.f?1===s?"end":"start":o.in.f,o.out.f=o.in.f,o.out=jQuery.extend(!0,{},o.in,o.out),o.in.eng=o.out.eng=a.anim.eng,void 0!==o.out.eng&&null==i[o.out.eng]&&(o.out.o=0,o.in.o=0,o.in.ms=o.out.ms=1e3,o.in.eng=o.out.eng="animateCore"),void 0!==o.p&&"none"!==o.p&&(o.in.bg="dark"===o.p?"#000":"light"===o.p?"#fff":"transparent",o.out.delay="none"!==o.p?function(e,i){return e/2.5}:0,1===o.out.o&&0===o.out.x&&0===o.out.y&&(o.out.o=0)),"forceinout"===o.o?(o.in.zIndex=20,o.out.zIndex=10):"outin"!==o.o&&(1!==o.in.o||0!==o.in.x||0!==o.in.y||void 0===a.out||1===o.out.o&&0===o.out.x&&0===o.out.y)||(o.in.zIndex=10,o.out.zIndex=20),p.bgvid.length>0&&(o.in=c(e,o.in,p,"in")),l&&void 0!==g.bgvid&&g.bgvid.length>0&&(o.out=c(e,o.out,g,"out")),void 0!==o.out&&(o.out.simplify||o.in.simplify)&&(o.out=n(o.out)),o.in.simplify&&(o.in=n(o.in)),_R_is_Editor||requestAnimationFrame(function(){i.generalObserver(i.ISM,!0)}),o.in.eng=void 0===o.in.eng?"animateCore":o.in.eng,o.out.eng=void 0===o.out.eng?"animateCore":o.out.eng,l&&!0!==o.out.skip&&i[o.out.eng](e,g,o.out,{effect:o.e,slide:_R_is_Editor?RVS.SBGS[RVS.S.slideId].c.sbg:i[e].pr_active_slide,direction:"out",delay:0,bgColor:o.in.bg,sdir:s,filter:void 0,d3:a.d3,addOns:_R_is_Editor?a.addOns:void 0}),!0!==o.in.skip&&i[o.in.eng](e,p,o.in,{effect:o.e,slide:_R_is_Editor?RVS.SBGS[RVS.S.slideId].n.sbg:i[e].pr_next_slide,direction:"in",delay:l?"function"==typeof o.out.delay?o.out.delay(o.in.ms/1e3,o.out.row*o.out.col):o.out.delay:o.in.delay,BG:g,outslide:_R_is_Editor?RVS.SBGS[RVS.S.slideId].c.sbg:i[e].pr_active_slide,sdir:s,filter:o.filter,d3:a.d3,addOns:_R_is_Editor?a.addOns:void 0})},s=function(e,t,a){var r=e.height/e.width;if(a.ratio=a.conth/a.contw,a.ratio<r&&"contain"===t.bgfit||a.ratio>r&&"cover"===t.bgfit)a.height=e.width*a.ratio;else if(a.ratio>r&&"contain"===t.bgfit||a.ratio<r&&"cover"===t.bgfit)a.width=e.width*r/a.ratio;else if(a.ratio!==r||"contain"!==t.bgfit&&"cover"!==t.bgfit){var o=t.bgfit.split(" ");1===o.length&&(o[1]=o[0]),a.width="auto"===o[0]?a.contw:e.width*(parseInt(o[0],0)/100),a.height="auto"===o[1]?a.conth:a.width*a.ratio,t.usepattern=!0}else a.width=e.width;var s=function(e,t,a){return 1===(a=a.split(" ")).length&&(a[1]=a[0]),{x:"center"===a[0]||"50%"===a[0]?(e.width-t.width)/2:"left"===a[0]?0:"right"===a[0]?e.width-t.width:i.isNumeric(a[0])?0:a[0].indexOf("%")>=0?parseInt(a[0],0)/100*e.width-parseInt(a[0],0)/100*t.width:parseInt(a[0],0),y:"center"===a[1]||"50%"===a[1]?(e.height-t.height)/2:"top"===a[1]?0:"bottom"===a[1]?e.height-t.height:i.isNumeric(a[1])?0:a[1].indexOf("%")>=0?parseInt(a[1],0)/100*e.height-parseInt(a[1],0)/100*t.height:parseInt(a[1],0)}}(e,a,t.bgposition);return a.x=s.x,a.y=s.y,a},n=function(e){return e.o=0,e.r=0,e.row=1,e.col=1,e.x=0,e.y=0,e.sx=1,e.sy=1,e},d=function(e){return e="false"!==e&&!1!==e&&"off"!==e&&void 0!==e&&0!==e&&-1!==e},l=function(e){var i=e.toString(16);return 1==i.length?"0"+i:i},c=function(e,t,a,r){return t.skip=!1,"in"===r?a.isHTML5?(a.bgvid[0].style.display="none",i.resetVideo(a.bgvid,e),a.animateDirection="in",a.currentState="animating",a.drawVideoCanvasImagesRecall=!0,i.updateVideoFrames(e,a,!0),i.playVideo(a.bgvid,e)):(i[e].videos[a.bgvid[0].id].pauseCalled=!1,t.waitToSlideTrans=i[e].videos[a.bgvid[0].id].waitToSlideTrans,!0!==a.poster?(i.resetVideo(a.bgvid,e),i[e].videos[a.bgvid[0].id].prePlayForaWhile=!1,!0!==t.waitToSlideTrans&&i.playVideo(a.bgvid,e,!0),tpGS.gsap.fromTo(a.bgvid,t.ms/t.sec,{zIndex:30,display:"block",opacity:0},{opacity:1,zIndex:30,display:"block"}),a.loadobj.bgColor=!0,a.bgcolor="#000",t.simplify=!0):(i[e].videos[a.bgvid[0].id].prePlayForaWhile=!1,i.resetVideo(a.bgvid,e),i.playVideo(a.bgvid,e),a.bgvid[0].style.display="none",a.bgvid[0].style.zIndex=0,a.bgvid[0].style.opacity=0)):"out"===r&&(a.isHTML5?(a.currentState="animating",a.drawVideoCanvasImagesRecall=!0,i.updateVideoFrames(e,a,!0),window.requestAnimationFrame(function(){tpGS.gsap.to(a.bgvid,.1,{zIndex:0,display:"none"})})):(i.stopVideo(a.bgvid,e,!0),!0!==a.poster&&(a.loadobj.bgColor=!0,a.bgcolor="#000"))),t},p=function(e,i,t,a){return Math.sqrt(Math.pow(e-t,2)+Math.pow(i-a,2))},g=function(e,i){var t=i+Math.PI/2;return{x1:e.x,y1:e.y,x2:e.x+100*Math.cos(t),y2:e.y+100*Math.sin(t)}},u=function(e,i){var t=e.y2-e.y1,a=e.x1-e.x2,r=t*e.x1+a*e.y1,o=i.y2-i.y1,s=i.x1-i.x2,n=o*i.x1+s*i.y1,d=t*s-o*a;return 0!==d&&{x:Math.round((s*r-a*n)/d*100)/100,y:Math.round((t*n-o*r)/d*100)/100}};window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.slideanims={loaded:!0,version:"6.5.9"},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}(jQuery),function(e){"use strict";jQuery.fn.revolution=jQuery.fn.revolution||{};var i=jQuery.fn.revolution;function t(e){return null==e?-1:i.isNumeric(e)?e:e.split(":").length>1?60*parseInt(e.split(":")[0],0)+parseInt(e.split(":")[1],0):e}jQuery.extend(!0,i,{preLoadAudio:function(e,t){i[t].videos=void 0===i[t].videos?{}:i[t].videos,e.find(".rs-layer-audio").each(function(){var a=jQuery(this),r=i[t].videos[a[0].id]=void 0===i[t].videos[a[0].id]?f(a.data(),"audio",i.gA(e[0],"key")):i[t].videos[a[0].id],o={};0===a.find("audio").length&&(o.src=null!=r.mp4?r.mp4:"",o.pre=r.pload||"",this.id=void 0===this.id||""===this.id?a.attr("audio-layer-"+Math.round(199999*Math.random())):this.id,o.id=this.id,o.status="prepared",o.start=Date.now(),o.waittime=void 0!==r.ploadwait?1e3*r.ploadwait:5e3,"auto"!=o.pre&&"canplaythrough"!=o.pre&&"canplay"!=o.pre&&"progress"!=o.pre||(void 0===i[t].audioqueue&&(i[t].audioqueue=[]),i[t].audioqueue.push(o),i.manageVideoLayer(a,t,i.gA(e[0],"key"),!0)))})},preLoadAudioDone:function(e,t,a){var r=i[t].videos[e[0].id];i[t].audioqueue&&i[t].audioqueue.length>0&&jQuery.each(i[t].audioqueue,function(e,i){r.mp4!==i.src||i.pre!==a&&"auto"!==i.pre||(i.status="loaded")})},checkfullscreenEnabled:function(e){if(void 0!==window.fullScreen)return window.fullScreen;if(void 0!==document.fullscreen)return document.fullscreen;if(void 0!==document.mozFullScreen)return document.mozFullScreen;if(void 0!==document.webkitIsFullScreen)return document.webkitIsFullScreen;var t=i.isWebkit()&&/Apple Computer/.test(navigator.vendor)?42:5;return screen.width==i.winW&&Math.abs(screen.height-i.getWinH(e))<t},showVideo:function(e){tpGS.gsap.to(e,.3,{opacity:1,display:"block",ease:"power3.inOut"})},resetVideo:function(e,t,a){if("updateAndResize"!==a){var r=i[t].videos[e[0].id];if("resetVideo"!==r.cRS)switch(r.cRS="resetVideo",r.type){case"youtube":r.rwd&&null!=r.player&&void 0!==r.player.seekTo&&(r.player.seekTo(-1==r.ssec?0:r.ssec),r.player.pauseVideo()),r.bgvideo||"preset"===a||0!=r.jsposter.length||i.showVideo(e.find("iframe"));break;case"vimeo":void 0!==r.vimeoplayer&&r.rwd&&(0!==r.ssec&&-1!==r.ssec||r.bgvideo||r.jsposter.length>0)&&(r.vimeoplayer.setCurrentTime(-1==r.ssec?0:r.ssec),r.vimeoplayer.pause()),0!=r.jsposter.length||r.bgvideo||"preset"===a||i.showVideo(e.find("iframe"));break;case"html5":if(i.ISM&&r.notonmobile)return!1;r.bgvideo||i.showVideo(r.jvideo),r.rwd&&"playing"!==r.cSS&&!isNaN(r.video.duration)&&(r.justReseted=!0,r.video.currentTime=-1==r.ssec?0:r.ssec),("mute"==r.volume||i.lastToggleState(e.videomutetoggledby)||!0===i[t].globalmute)&&(r.video.muted=!0)}}},Mute:function(e,t,a){var r=!1,o=i[t].videos[e[0].id];switch(o.type){case"youtube":o.player&&(!0===a&&o.player.mute(),!1===a&&n(o,parseInt(o.volcache,0)),r=o.player.isMuted());break;case"vimeo":o.volcachecheck||(o.volcache=o.volcache>1?o.volcache/100:o.volcache,o.volcachecheck=!0),o.volume=!0===a?"mute":!1===a?o.volcache:o.volume,void 0!==a&&null!=o.vimeoplayer&&s(o,!0===a?0:o.volcache),r="mute"==o.volume||0===o.volume;break;case"html5":o.volcachecheck||(o.volcache=o.volcache>1?o.volcache/100:o.volcache,o.volcachecheck=!0),o.video.volume=o.volcache,void 0!==a&&o.video&&(o.video.muted=a),r=void 0!==o.video?o.video.muted:r}if(void 0===a)return r},stopVideo:function(e,t,a){if(void 0!==i[t]&&void 0!==i[t]){var r=i[t].videos[e[0].id];if(void 0!==r&&("stopVideo"!==r.cRS||"paused"!==r.cSS))switch(r.cRS="stopVideo",i[t].leaveViewPortBasedStop||(i[t].lastplayedvideos=[]),i[t].leaveViewPortBasedStop=!1,r.type){case"youtube":void 0!==r.player&&2!==r.player.getPlayerState()&&5!==r.player.getPlayerState()&&(r.player.pauseVideo(),void 0!==a&&p(t,r,"hide"));break;case"vimeo":void 0!==r.vimeoplayer&&(r.vimeoplayer.pause(),void 0!==a&&p(t,r,"hide"));break;case"html5":r.video&&(r.video.pause(),i.ISM&&b(r,1))}}},playVideo:function(e,t,r){var o=i[t].videos[e[0].id];if(clearTimeout(o.videoplaywait),"playVideo"!==o.cRS||"playing"!==o.cSS)switch(o.cRS="playVideo",o.type){case"youtube":if(0==e.find("iframe").length)e.append(o.videomarkup),u(e,t,!0);else if(void 0!==o.player&&null!=o.player.playVideo){var s=o.player.getCurrentTime();o.nseTriggered&&(s=-1,o.nseTriggered=!1),-1!=o.ssec&&o.ssec>s&&o.player.seekTo(o.ssec),c(o)}else o.videoplaywait=setTimeout(function(){i.playVideo(e,t)},50);break;case"vimeo":if(0==e.find("iframe").length)delete o.vimeoplayer,e.append(o.videomarkup),u(e,t,!0);else if(e.hasClass("rs-apiready"))if(o.vimeoplayer=null==o.vimeoplayer?new Vimeo.Player(e.find("iframe").attr("id")):o.vimeoplayer,o.vimeoplayer.getPaused()){s=void 0===o.currenttime?0:o.currenttime;o.nseTriggered&&(s=-1,o.nseTriggered=!1),-1!=o.ssec&&o.ssec>s&&o.vimeoplayer.setCurrentTime(o.ssec),("mute"==o.volume||0===o.volume||i.lastToggleState(e.data("videomutetoggledby"))||!0===i[t].globalmute)&&(o.volumetoken=!0,o.vimeoplayer.setVolume(0)),l(o)}else o.videoplaywait=setTimeout(function(){i.playVideo(e,t)},50);else o.videoplaywait=setTimeout(function(){i.playVideo(e,t)},50);break;case"html5":if(o.metaloaded){if((""+o.video.duration=="NaN"||o.video.readyState<4)&&!r)return o.loadRequested||(o.video.load(),o.loadRequested=!0),void setTimeout(function(){i.playVideo(e,t)},50);s=o.video.currentTime;o.nseTriggered&&(s=-1,o.nseTriggered=!1),-1!=o.ssec&&o.ssec>s&&o.ssec<o.video.duration&&(o.video.currentTime=o.ssec),d(o)}else a(o.video,"loadedmetadata",function(e){i.playVideo(e,t)}(e))}},isVideoPlaying:function(e,t){var a=!1;return null!=i[t].playingvideos&&jQuery.each(i[t].playingvideos,function(i,t){e.attr("id")==t.attr("id")&&(a=!0)}),a},removeMediaFromList:function(e,i){w(e,i)},prepareCoveredVideo:function(e){clearTimeout(i[e].resizePrepareCoverVideolistener);var t="carousel"===i[e].sliderType?i[e].carousel.justify?void 0===i[e].carousel.slide_widths?void 0:i[e].carousel.slide_widths[i[e].carousel.focused]:i[e].carousel.slide_width:i[e].canv.width,a="carousel"===i[e].sliderType?i[e].carousel.slide_height:i[e].canv.height;if(0!==t&&0!==a&&void 0!==t&&void 0!==a)for(var r in i[e].videos){var o=i[e].videos[r];if(void 0!==o.jvideo&&((o.bgvideo||o.jvideo.parent().hasClass("rs-fsv")||i.closestNode(o.video,"RS-LAYER")&&i.closestNode(o.video,"RS-LAYER").classList.contains("rs-fsv"))&&("html5"===o.type&&void 0!==o.jvideo&&tpGS.gsap.set(o.jvideo,{width:t}),void 0===i[e].activeRSSlide||o.slideid===i.gA(i[e].slides[i[e].activeRSSlide],"key")||void 0===i[e].pr_next_slide||o.slideid===i.gA(i[e].pr_next_slide[0],"key")))){o.vd=o.ratio.split(":").length>1?o.ratio.split(":")[0]/o.ratio.split(":")[1]:1;var s,n=t/a,d=o.vd*n*100,l=o.vd/n*100;"Edge"===i.get_browser()||"IE"===i.get_browser()?s=n>o.vd?{minWidth:"100%",height:d+"%",x:"-50%",y:"-50%",top:"50%",left:"50%",position:"absolute"}:{minHeight:"100%",width:l+"%",x:"-50%",y:"-50%",top:"50%",left:"50%",position:"absolute"}:(o.bgvideo&&void 0!==o.vimeoid&&"carousel"==i[e].sliderType&&(d=100,l=100),s=n>o.vd?{height:(o.fitCover?100:d)+"%",width:"100%",top:o.fitCover?0:-(d-100)/2+"%",left:"0px",position:"absolute"}:{width:(o.fitCover?100:l)+"%",height:"100%",left:o.fitCover?0:-(l-100)/2+"%",top:"0px",position:"absolute"}),void 0===o.vimeoid&&void 0===o.ytid||(s.maxWidth="none",s.maxHeight="none"),tpGS.gsap.set(o.jvideo,s)}}else i[e].resizePrepareCoverVideolistener=setTimeout(function(){i.prepareCoveredVideo(e)},100)},checkVideoApis:function(e,t){location.protocol;if(!i[t].youtubeapineeded){var a=e.find("iframe");if((null!=e.data("ytid")||a.length>0&&a.attr("src")&&a.attr("src").toLowerCase().indexOf("youtube")>0)&&(i[t].youtubeapineeded=!0),i[t].youtubeapineeded&&!window.rs_addedyt){i[t].youtubestarttime=Date.now(),window.rs_addedyt=!0;var r=document.createElement("script"),o=i.getByTag(document,"script")[0],s=!0;r.src="https://www.youtube.com/iframe_api",jQuery("head").find("*").each(function(){"https://www.youtube.com/iframe_api"==jQuery(this).attr("src")&&(s=!1)}),s&&o.parentNode.insertBefore(r,o)}}if(!i[t].vimeoapineeded){var n=e.find("iframe");if((null!=e.data("vimeoid")||n.length>0&&n.attr("src")&&n.attr("src").toLowerCase().indexOf("vimeo")>0)&&(i[t].vimeoapineeded=!0),i[t].vimeoapineeded&&!window.rs_addedvim){i[t].vimeostarttime=Date.now(),window.rs_addedvim=!0;var d=document.createElement("script");o=i.getByTag(document,"script")[0],s=!0;d.src="https://player.vimeo.com/api/player.js",jQuery("head").find("*").each(function(){"https://player.vimeo.com/api/player.js"==jQuery(this).attr("src")&&(s=!1)}),s&&o.parentNode.insertBefore(d,o)}}},manageVideoLayer:function(e,t,r,o){if(i[t].videos=void 0===i[t].videos?{}:i[t].videos,void 0===i[t].videos[e[0].id]||!0===o){var s=i[t].videos[e[0].id]=void 0===i[t].videos[e[0].id]?f(e.data(),void 0,r):i[t].videos[e[0].id];if(s.audio=void 0!==s.audio&&s.audio,i.ISM&&s.opom)0==e.find("rs-poster").length&&e.append('<rs-poster class="noSwipe" style="background-image:url('+s.poster+');"></rs-poster>');else{s.jsposter=e.find("rs-poster"),s.id=e[0].id,s.pload="auto"===s.pload||"canplay"===s.pload||"canplaythrough"===s.pload||"progress"===s.pload?"auto":s.pload,s.type=null!=s.mp4||null!=s.webm?"html5":null!=s.ytid&&String(s.ytid).length>1?"youtube":null!=s.vimeoid&&String(s.vimeoid).length>1?"vimeo":"none",s.newtype="html5"==s.type&&0==e.find(s.audio?"audio":"video").length?"html5":"youtube"==s.type&&0==e.find("iframe").length?"youtube":"vimeo"==s.type&&0==e.find("iframe").length?"vimeo":"none",s.extras="",s.posterMarkup=void 0===s.posterMarkup?"":s.posterMarkup,!s.audio&&"1sttime"==s.aplay&&s.pausetimer&&s.bgvideo&&i.sA(e.closest("rs-slide")[0],"rspausetimeronce",1),s.audio||!s.bgvideo||!s.pausetimer||1!=s.aplay&&"true"!=s.aplay&&"no1sttime"!=s.aplay||i.sA(e.closest("rs-slide")[0],"rspausetimeralways",1),s.noInt&&e.addClass("rs-nointeraction"),!(null!=s.poster&&s.poster.length>2)||i.ISM&&s.npom||0==s.jsposter.length&&(s.posterMarkup+='<rs-poster class="noSwipe" style="background-image:url('+s.poster+');"></rs-poster>');var n=!0;switch(s.cSS="created",s.cRS="created",s.newtype){case"html5":1==window.isSafari11&&(i[t].slideHasIframe=!0),s.audio&&e.addClass("rs-audio"),s.tag=s.audio?"audio":"video";var d="video"===s.tag&&(i.is_mobile()||i.isSafari11())?s.aplay||"true"===s.aplay?"muted playsinline autoplay":s.inline?" playsinline":"":"",l='<div class="html5vid rs_html5vidbasicstyles '+(!1===s.afs?"hidefullscreen":"")+'">';l+="<"+s.tag+" "+d+" "+(s.controls&&"none"!==s.controls?" controls":"")+(s.bgvideo&&-1==d.indexOf("autoplay")?" autoplay":"")+(s.bgvideo&&-1==d.indexOf("muted")?" muted":"")+' style="'+("Edge"!==i.get_browser()?(s.fitCover?"object-fit:cover;background-size:cover;":"")+"opacity:0;width:100%; height:100%":"")+'" class="" '+(s.loop?"loop":"")+' preload="'+s.pload+'">',"video"===s.tag&&null!=s.webm&&"firefox"==i.get_browser().toLowerCase()&&(l=l+'<source src="'+s.webm+'" type="video/webm" />'),null!=s.mp4&&(l=l+'<source src="'+s.mp4+'" type="'+("video"===s.tag?"video/mp4":s.mp4.toLowerCase().indexOf("m4a")>0?"audio/x-m4a":"audio/mpeg")+'" />'),null!=s.ogv&&(l=l+'<source src="'+s.mp4+'" type="'+s.tag+'/ogg" />'),l+="</"+s.tag+"></div>",l+=s.posterMarkup,s.controls&&!s.audio&&void 0===s.poster||s.bgvideo||(l+='<div class="tp-video-play-button"><i class="revicon-right-dir"></i><span class="tp-revstop">&nbsp;</span></div>'),s.videomarkup=l,n=!1,i.ISM&&s.notonmobile||i.isIE(8)||e.append(l),s.jvideo=e.find(s.tag),s.video=s.jvideo[0],s.html5vid=s.jvideo.parent(),a(s.video,"canplay",function(e){m(e,t),i.resetVideo(e,t)}(e));break;case"youtube":i[t].slideHasIframe=!0,s.controls&&"none"!==s.controls||(s.vatr=s.vatr.replace("controls=1","controls=0"),-1==s.vatr.toLowerCase().indexOf("controls")&&(s.vatr=s.vatr+"&controls=0")),(s.inline||"RS-BGVIDEO"===e[0].tagName)&&(s.vatr=s.vatr+"&playsinline=1"),-1!=s.ssec&&(s.vatr+="&start="+s.ssec),-1!=s.esec&&(s.vatr+="&end="+s.esec);var c=s.vatr.split("origin=https://");s.vatrnew=c.length>1?c[0]+"origin=https://"+(self.location.href.match(/www/gi)&&!c[1].match(/www/gi)?"www."+c[1]:c[1]):s.vatr,s.videomarkup='<iframe allow="autoplay; '+(!0===s.afs?"fullscreen":"")+'" type="text/html" src="https://www.youtube-nocookie.com/embed/'+s.ytid+"?"+s.vatrnew+'" '+(!0===s.afs?"allowfullscreen":"")+' width="100%" height="100%" class="intrinsic-ignore" style="opacity:0;visibility:visible;width:100%;height:100%"></iframe>';break;case"vimeo":i[t].slideHasIframe=!0,s.controls&&"none"!==s.controls?(s.vatr=s.vatr.replace("background=0","background=1"),-1==s.vatr.toLowerCase().indexOf("background")&&(s.vatr=s.vatr+"&background=1")):(s.vatr=s.vatr.replace("background=1","background=0"),-1==s.vatr.toLowerCase().indexOf("background")&&(s.vatr=s.vatr+"&background=0")),s.vatr="autoplay="+(!0===s.aplay?1:0)+"&"+s.vatr,s.bgvideo&&(s.prePlayForaWhile=!0),i.ISM&&!0===s.aplay&&(s.vatr="muted=1&"+s.vatr),s.loop&&(s.vatr="loop=1&"+s.vatr),s.videomarkup='<iframe  allow="autoplay; '+(!0===s.afs?"fullscreen":"")+'" src="https://player.vimeo.com/video/'+s.vimeoid+"?"+s.vatr+'" '+(!0===s.afs?"webkitallowfullscreen mozallowfullscreen allowfullscreen":"")+' width="100%" height="100%" class="intrinsic-ignore" style="opacity:0;visibility:visible;width:100%;height:100%"></iframe>'}if(!(null!=s.poster&&s.poster.length>2)||i.ISM&&s.npom){if(i.ISM&&s.notonmobile)return!1;0!=e.find("iframe").length||"youtube"!=s.type&&"vimeo"!=s.type||(delete s.vimeoplayer,e.append(s.videomarkup),u(e,t,!("vimeo"!==s.newtype||!s.bgvideo),!0))}else n&&0==e.find("rs-poster").length&&e.append(s.posterMarkup),0==e.find("iframe").length&&(s.jsposter=e.find("rs-poster"),s.jsposter.on("click",function(){if(i.playVideo(e,t,!0),i.ISM){if(s.notonmobile)return!1;tpGS.gsap.to(s.jsposter,.3,{opacity:0,visibility:"hidden",force3D:"auto",ease:"power3.inOut"}),i.showVideo(e.find("iframe"))}}));if("none"!==s.doverlay&&void 0!==s.doverlay){var p=i.createOverlay(t,s.doverlay,s.doverlaysize,{0:s.doverlaycolora,1:s.doverlaycolorb});s.bgvideo&&1!=e.closest("rs-sbg-wrap").find("rs-dotted").length?e.closest("rs-sbg-wrap").append('<rs-dotted style="background-image:'+p+'"></rs-dotted>'):s.bgvideo||1==e.find("rs-dotted").length||e.append('<rs-dotted style="background-image:'+p+'"></rs-dotted>')}s.bgvideo&&(e[0].style.display="none",e[0].style.zIndex=0,tpGS.gsap.set(e.find("video, iframe"),{opacity:0}))}}}});var a=function(e,i,t){e.addEventListener?e.addEventListener(i,t,{capture:!1,passive:!0}):e.attachEvent(i,t,{capture:!1,passive:!0})},r=function(e,i,t){var a={};return a.video=e,a.type=i,a.settings=t,a},o=function(e,t){var a=i[e].videos[t[0].id];(a.bgvideo||t.hasClass("rs-fsv"))&&((void 0===a.ratio||a.ratio.split(":").length<=1)&&(a.ratio="16:9"),requestAnimationFrame(function(){i.prepareCoveredVideo(e)}))},s=function(e,t){var a=e.vimeoplayer;a.getPaused().then(function(r){e.volumetoken=!0;var o=!r,s=a.setVolume(t);void 0!==s&&s.then(function(i){a.getPaused().then(function(i){o===i&&(e.volume="mute",e.volumetoken=!0,a.setVolume(0),a.play())}).catch(function(e){console.log("Get Paused Function Failed for Vimeo Volume Changes Inside the Promise")})}).catch(function(t){o&&(e.volume="mute",e.volumetoken=!0,a.setVolume(0),a.play()),i.ISM&&b(e,0)})}).catch(function(){console.log("Get Paused Function Failed for Vimeo Volume Changes")})},n=function(e,i){var t=e.player.getPlayerState();"mute"===i?e.player.mute():(e.player.unMute(),e.player.setVolume(i)),setTimeout(function(){1===t&&1!==e.player.getPlayerState()&&(e.player.mute(),e.player.playVideo())},39)},d=function(e,t){if("playVideo"===e.cRS){var a=e.video.play();void 0!==a&&a.then(function(e){}).catch(function(i){e.video.pause(),!0!==t&&d(e,!0)}),i.ISM&&b(e,0)}},l=function(e){if("playVideo"===e.cRS){var i=e.vimeoplayer.play();void 0!==i&&i.then(function(e){}).catch(function(i){e.vimeoplayer.volumetoken=!0,e.vimeoplayer.setVolume(0),e.vimeoplayer.play()})}},c=function(e){"playVideo"===e.cRS&&e.player.playVideo()},p=function(e,t,a,r){clearTimeout(t.repeatedPosterCalls),t.repeatedPosterCalls=setTimeout(function(){"show"===a||"playing"===t.cSS&&!0!==t.VideoIsVisible?(void 0!==t.showhideposter&&t.showhideposter.pause(),t.showhideposter=tpGS.gsap.timeline(),t.jsposter.length>0&&t.showhideposter.add(tpGS.gsap.to(t.jsposter,.3,{zIndex:5,autoAlpha:0,force3D:"auto",ease:"power3.inOut"}),0),t.jvideo.length>0&&t.showhideposter.add(tpGS.gsap.to(t.jvideo,void 0!==r?r:.001,{opacity:1,display:"block",ease:t.jsposter.length>0?"power3.inOut":"power3.out"}),0),t.VideoIsVisible=!0):("hide"===a||"paused"===t.cSS&&1!=i.checkfullscreenEnabled(e)&&t.jsposter.length>0&&!1!==t.VideoIsVisible&&!0!==t.seeking)&&(void 0!==t.showhideposter&&t.showhideposter.pause(),t.showhideposter=tpGS.gsap.timeline(),t.jsposter.length>0&&t.showhideposter.add(tpGS.gsap.to(t.jsposter,.3,{zIndex:5,autoAlpha:1,force3D:"auto",ease:"power3.inOut"}),0),t.jvideo.length>0&&t.showhideposter.add(tpGS.gsap.to(t.jvideo,void 0!==r?r:.001,{opacity:0,ease:t.jsposter.length>0?"power3.inOut":"power3.out"}),.3),t.bgvideo&&void 0!==t.nBG&&void 0!==t.nBG.loadobj&&(t.nBG.video=t.nBG.loadobj.img),t.VideoIsVisible=!1)},void 0!==a?0:100)},g=function(e,t,a){e.cSS="playing",e.vimeostarted=!0,e.nextslidecalled=!1,e.jsposter=void 0===e.jsposter||0===e.jsposter.length?t.find("rs-poster"):e.jsposter,e.jvideo=t.find("iframe"),i[a].c.trigger("revolution.slide.onvideoplay",r(e.vimeoplayer,"vimeo",e)),i[a].stopByVideo=e.pausetimer,y(t,a),"mute"==e.volume||0===e.volume||i.lastToggleState(t.data("videomutetoggledby"))||!0===i[a].globalmute?(e.volumetoken=!0,e.vimeoplayer.setVolume(0)):s(e,parseInt(e.volcache,0)/100||.75),i.toggleState(e.videotoggledby)},u=function(e,t,a,s){var d=i[t].videos[e[0].id],l="iframe"+Math.round(1e5*Math.random()+1);if(d.jvideo=e.find("iframe"),o(t,e),d.jvideo.attr("id",l),d.startvideonow=a,d.videolistenerexist){if(a)switch(d.type){case"youtube":i.playVideo(e,t),-1!=d.ssec&&d.player.seekTo(d.ssec);break;case"vimeo":i.playVideo(e,t),-1!=d.ssec&&d.vimeoplayer.seekTo(d.ssec)}}else switch(d.type){case"youtube":if("undefined"==typeof YT||void 0===YT.Player)return i.checkVideoApis(e,t),void setTimeout(function(){u(e,t,a,s)},50);d.player=new YT.Player(l,{events:{onStateChange:function(a){a.data==YT.PlayerState.PLAYING?(d.cSS="playing",i[t].onceVideoPlayed=!0,"mute"==d.volume||0===d.volume||i.lastToggleState(e.data("videomutetoggledby"))||!0===i[t].globalmute?d.player.mute():n(d,parseInt(d.volcache,0)||75),i[t].stopByVideo=!0,y(e,t),d.pausetimer?i[t].c.trigger("stoptimer"):i[t].stopByVideo=!1,i[t].c.trigger("revolution.slide.onvideoplay",r(d.player,"youtube",d)),i.toggleState(d.videotoggledby)):(d.cSS="paused",0==a.data&&d.loop&&(-1!=d.ssec&&d.player.seekTo(d.ssec),i.playVideo(e,t),i.toggleState(d.videotoggledby)),-1!=a.data&&3!=a.data&&(i[t].stopByVideo=!1,i[t].tonpause=!1,w(e,t),i[t].c.trigger("starttimer"),i[t].c.trigger("revolution.slide.onvideostop",r(d.player,"youtube",d)),null!=i[t].videoIsPlaying&&i[t].videoIsPlaying.attr("id")!=e.attr("id")||i.unToggleState(d.videotoggledby)),0==a.data&&d.nse?(h(),d.nseTriggered=!0,i[t].c.revnext(),w(e,t)):(w(e,t),i[t].stopByVideo=!1,3!==a.data&&(-1!=d.lasteventdata&&3!=d.lasteventdata&&void 0!==d.lasteventdata||-1!=a.data&&3!=a.data)&&i[t].c.trigger("starttimer"),i[t].c.trigger("revolution.slide.onvideostop",r(d.player,"youtube",d)),null!=i[t].videoIsPlaying&&i[t].videoIsPlaying.attr("id")!=e.attr("id")||i.unToggleState(d.videotoggledby))),clearTimeout(d.postOrVideoTimer),3!==a.data&&(d.postOrVideoTimer=setTimeout(function(){p(t,d)},1===d.lasteventdata&&2===a.data||2===d.lasteventdata&&3!==a.data?1e3:0),d.lasteventdata=a.data)},onReady:function(a){var r,o=i.is_mobile(),n=e.hasClass("rs-layer-video");d.ready=!0,!o&&(!i.isSafari11()||o&&n)||"RS-BGVIDEO"!==e[0].tagName&&(!n||!0!==d.aplay&&"true"!==d.aplay)||(r=!0,d.player.setVolume(0),d.volume="mute",d.player.mute(),clearTimeout(e.data("mobilevideotimr")),2!==d.player.getPlayerState()&&-1!==d.player.getPlayerState()||e.data("mobilevideotimr",setTimeout(function(){i.playVideo(e,t)},500))),r||"mute"!=d.volume||(d.player.setVolume(0),d.player.mute()),e.addClass("rs-apiready"),null==d.speed&&1===d.speed||a.target.setPlaybackRate(parseFloat(d.speed)),d.jsposter.off("click"),d.jsposter.on("click",function(){i.playVideo(e,t,!0)}),d.startvideonow?(i.playVideo(e,t),-1!=d.ssec&&d.player.seekTo(d.ssec)):s&&p(t,d,"show",.2),d.videolistenerexist=!0}}});break;case"vimeo":if("undefined"==typeof Vimeo||void 0===Vimeo.Player)return i.checkVideoApis(e,t),void setTimeout(function(){u(e,t,a,s)},50);for(var c,m=d.jvideo.attr("src"),v={},f=m,b=/([^&=]+)=([^&]*)/g;c=b.exec(f);)v[decodeURIComponent(c[1])]=decodeURIComponent(c[2]);m=(m=null!=v.player_id?m.replace(v.player_id,l):m+"&player_id="+l).replace(/&api=0|&api=1/g,"");var _,S=i.is_mobile()||i.isSafari11(),x="RS-BGVIDEO"===e[0].tagName;if(S&&x&&(m+="&background=1"),d.jvideo.attr("src",m),d.vimeoplayer=void 0===d.vimeoplayer||!1===d.vimeoplayer?new Vimeo.Player(l):d.vimeoplayer,S)x?_=!0:(d.aplay||"true"===d.aplay)&&(_=!0),_&&(d.volumetoken=!0,d.vimeoplayer.setVolume(0),d.volume="mute");d.vimeoplayer.on("play",function(a){i[t].onceVideoPlayed=!0,d.cSS="playing",d.vimeostarted||g(d,e,t)}),d.vimeoplayer.on("loaded",function(a){var r={};d.vimeoplayer.getVideoWidth().then(function(i){r.width=i,void 0!==r.width&&void 0!==r.height&&(d.ratio=r.width+":"+r.height,d.vimeoplayerloaded=!0,o(t,e))}),d.vimeoplayer.getVideoHeight().then(function(i){r.height=i,void 0!==r.width&&void 0!==r.height&&(d.ratio=r.width+":"+r.height,d.vimeoplayerloaded=!0,o(t,e))}),d.startvideonow?("mute"===d.volume&&(d.volumetoken=!0,d.vimeoplayer.setVolume(0)),i.playVideo(e,t),-1!=d.ssec&&d.vimeoplayer.setCurrentTime(d.ssec)):s&&p(t,d,"show",.2)}),e.addClass("rs-apiready"),d.vimeoplayer.on("volumechange",function(e){d.volumetoken&&(d.volume=e.volume),d.volumetoken=!1}),d.vimeoplayer.on("timeupdate",function(a){p(t,d),d.vimeostarted||0===a.percent||void 0!==i[t].activeRSSlide&&d.slideid!==i.gA(i[t].slides[i[t].activeRSSlide],"key")||g(d,e,t),d.pausetimer&&"playing"==i[t].sliderstatus&&(i[t].stopByVideo=!0,i[t].c.trigger("stoptimer")),d.currenttime=a.seconds,0!=d.esec&&-1!==d.esec&&d.esec<a.seconds&&!0!==d.nextslidecalled&&(d.loop?(i.playVideo(e,t),d.vimeoplayer.setCurrentTime(-1!==d.ssec?d.ssec:0)):(d.nse&&(d.nseTriggered=!0,d.nextslidecalled=!0,i[t].c.revnext()),d.vimeoplayer.pause())),d.prePlayForaWhile&&d.vimeoplayer.pause()}),d.vimeoplayer.on("ended",function(a){d.cSS="paused",p(t,d),d.vimeostarted=!1,w(e,t),i[t].stopByVideo=!1,i[t].c.trigger("starttimer"),i[t].c.trigger("revolution.slide.onvideostop",r(d.vimeoplayer,"vimeo",d)),d.nse&&(d.nseTriggered=!0,i[t].c.revnext()),null!=i[t].videoIsPlaying&&i[t].videoIsPlaying.attr("id")!=e.attr("id")||i.unToggleState(d.videotoggledby)}),d.vimeoplayer.on("pause",function(a){d.vimeostarted=!1,d.cSS="paused",p(t,d),i[t].stopByVideo=!1,i[t].tonpause=!1,w(e,t),i[t].c.trigger("starttimer"),i[t].c.trigger("revolution.slide.onvideostop",r(d.vimeoplayer,"vimeo",d)),null!=i[t].videoIsPlaying&&i[t].videoIsPlaying.attr("id")!=e.attr("id")||i.unToggleState(d.videotoggledby)}),d.jsposter.off("click"),d.jsposter.on("click",function(){if(!i.ISM)return i.playVideo(e,t,!0),!1}),d.videolistenerexist=!0}},h=function(){document.exitFullscreen&&document.fullscreen?document.exitFullscreen():document.mozCancelFullScreen&&document.mozFullScreen?document.mozCancelFullScreen():document.webkitExitFullscreen&&document.webkitIsFullScreen&&document.webkitExitFullscreen()},m=function(e,t,o){var s=i[t].videos[e[0].id];if(i.ISM&&s.notonmobile)return!1;if(s.metaloaded=!0,"html5"===s.newtype&&s.bgvideo&&(s.nBG=i[t].sbgs[e[0].dataset.key],void 0===s.nBG.shadowCanvas&&(s.nBG.shadowCanvas=document.createElement("canvas"),s.nBG.shadowCTX=s.nBG.shadowCanvas.getContext("2d"),s.nBG.shadowCanvas.style.background="transparent",s.nBG.shadowCanvas.style.opacity=1),s.nBG.isHTML5=!0,s.nBG.video=void 0!==s.nBG.loadobj&&void 0!==s.nBG.loadobj.img?s.nBG.loadobj.img:s.video,s.nBG.drawVideoCanvasImagesRecall=!1),!s.controls||s.audio||void 0!==s.poster){0!=e.find(".tp-video-play-button").length||i.ISM||e.append('<div class="tp-video-play-button"><i class="revicon-right-dir"></i><span class="tp-revstop">&nbsp;</span></div>');var n="video, rs-poster, .tp-video-play-button";void 0!==s.poster&&s.controls&&(n=".tp-video-play-button"),e.find(n).on("click",function(){!1===s.loop&&s.esec>0&&s.esec<=s.video.currentTime||(e.hasClass("videoisplaying")?i.stopVideo(e,t):i.playVideo(e,t,!0))})}(e.hasClass("rs-fsv")||s.bgvideo)&&(s.bgvideo||e.hasClass("rs-fsv")?(s.html5vid.addClass("fullcoveredvideo"),void 0!==s.ratio&&1!=s.ratio.split(":").length||(s.ratio="16:9"),i.prepareCoveredVideo(t)):s.html5vid.addClass("rs-fsv")),a(s.video,"canplaythrough",function(){i.preLoadAudioDone(e,t,"canplaythrough")}),a(s.video,"canplay",function(){i.preLoadAudioDone(e,t,"canplay")}),a(s.video,"progress",function(){i.preLoadAudioDone(e,t,"progress")}),a(s.video,"pause",function(){i.ISM&&b(s,1)}),a(s.video,"timeupdate",function(e){this.BGrendered=!0,p(t,s),-1===s.esec&&s.loop&&1==window.isSafari11&&(s.esec=s.video.duration-.075),void 0!==s.lastCurrentTime?s.fps=s.video.currentTime-s.lastCurrentTime:s.fps=.1,s.lastCurrentTime=s.video.currentTime,0!=s.esec&&-1!=s.esec&&s.esec<s.video.currentTime&&!s.nextslidecalled&&(s.loop?(d(s),s.video.currentTime=-1===s.ssec?.5:s.ssec):(s.nse&&(s.nseTriggered=!0,s.nextslidecalled=!0,i[t].jcnah=!0,i[t].c.revnext(),setTimeout(function(){i[t].jcnah=!1},1e3)),s.video.pause()))}),a(s.video,"play",function(){s.cSS="playing",p(t,s),s.bgvideo&&(s.nBG.drawVideoCanvasImagesRecall=!0,s.nBG.videoisplaying=!0,s.nBG.video=s.video,i.updateVideoFrames(t,s.nBG)),i[t].onceVideoPlayed=!0,s.nextslidecalled=!1,s.volume=null!=s.volume&&"mute"!=s.volume?parseFloat(s.volcache):s.volume,s.volcache=null!=s.volcache&&"mute"!=s.volcache?parseFloat(s.volcache):s.volcache,i.is_mobile()||(!0===i[t].globalmute?s.video.muted=!0:s.video.muted="mute"==s.volume,s.volcache=i.isNumeric(s.volcache)&&s.volcache>1?s.volcache/100:s.volcache,"mute"==s.volume?s.video.muted=!0:null!=s.volcache&&(s.video.volume=s.volcache)),e.addClass("videoisplaying"),y(e,t),clearTimeout(s.showCoverSoon),!0!==s.pausetimer||"audio"==s.tag?(i[t].stopByVideo=!1,i[t].c.trigger("revolution.slide.onvideostop",r(s.video,"html5",s))):(i[t].stopByVideo=!0,i[t].c.trigger("revolution.slide.onvideoplay",r(s.video,"html5",s))),s.pausetimer&&"playing"==i[t].sliderstatus&&(i[t].stopByVideo=!0,i[t].c.trigger("stoptimer")),i.toggleState(s.videotoggledby)}),a(s.video,"seeked",function(){s.seeking=!1}),a(s.video,"seeking",function(){s.seeking=!0}),a(s.video,"pause",function(a){s.cSS="paused",p(t,s),e.removeClass("videoisplaying"),s.bgvideo&&(s.nBG.drawVideoCanvasImagesRecall=!1,s.nBG.videoisplaying=!1),i[t].stopByVideo=!1,w(e,t),"audio"!=s.tag&&i[t].c.trigger("starttimer"),i[t].c.trigger("revolution.slide.onvideostop",r(s.video,"html5",s)),null!=i[t].videoIsPlaying&&i[t].videoIsPlaying.attr("id")!=e.attr("id")||i.unToggleState(s.videotoggledby)}),a(s.video,"ended",function(){s.cSS="paused",h(),p(t,s),w(e,t),i[t].stopByVideo=!1,w(e,t),"audio"!=s.tag&&i[t].c.trigger("starttimer"),i[t].c.trigger("revolution.slide.onvideostop",r(s.video,"html5",e.data())),s.nse&&s.video.currentTime>0&&(1==!i[t].jcnah&&(s.nseTriggered=!0,i[t].c.revnext(),i[t].jcnah=!0),setTimeout(function(){i[t].jcnah=!1},1500)),e.removeClass("videoisplaying"),s.bgvideo&&(s.nBG.drawVideoCanvasImagesRecall=!1,s.nBG.videoisplaying=!1),!0!==i[t].inviewport&&void 0!==i[t].inviewport||(i[t].lastplayedvideos=[])})},v=function(e){return"t"===e||!0===e||"true"===e||"f"!==e&&!1!==e&&"false"!==e&&e},f=function(e,i,a){e.audio="audio"===i;var r=void 0===e.video?[]:e.video.split(";"),o={volume:e.audio?1:"mute",pload:"auto",ratio:"16:9",loop:!0,aplay:"true",fitCover:!0,afs:!0,controls:!1,nse:!0,npom:!1,opom:!1,inline:!0,notonmobile:!1,start:-1,end:-1,doverlay:"none",doverlaysize:1,doverlaycolora:"transparent",doverlaycolorb:"#000000",scop:!1,rwd:!0,speed:1,ploadwait:5,stopAV:1!==e.bgvideo,noInt:!1,volcache:75};for(var s in r)if(r.hasOwnProperty(s)){var n=r[s].split(":");switch(n[0]){case"v":o.volume=n[1];break;case"vd":o.volcache=n[1];break;case"p":o.pload=n[1];break;case"ar":o.ratio=n[1]+(void 0!==n[2]?":"+n[2]:"");break;case"ap":o.aplay=v(n[1]);break;case"vfc":o.fitCover=v(n[1]);break;case"afs":o.afs=v(n[1]);break;case"vc":o.controls=n[1];break;case"nse":o.nse=v(n[1]);break;case"npom":o.npom=v(n[1]);break;case"opom":o.opom=v(n[1]);break;case"t":o.vtype=n[1];break;case"inl":o.inline=v(n[1]);break;case"nomo":o.notonmobile=v(n[1]);break;case"sta":o.start=n[1]+(void 0!==n[2]?":"+n[2]:"");break;case"end":o.end=n[1]+(void 0!==n[2]?":"+n[2]:"");break;case"do":o.doverlay=n[1];break;case"dos":o.doverlaysize=n[1];break;case"doca":o.doverlaycolora=n[1];break;case"docb":o.doverlaycolorb=n[1];break;case"scop":o.scop=v(n[1]);break;case"rwd":o.rwd=v(n[1]);break;case"sp":o.speed=n[1];break;case"vw":o.ploadwait=parseInt(n[1],0)||5;break;case"sav":o.stopAV=v(n[1]);break;case"noint":o.noInt=v(n[1]);break;case"l":o.loopcache=n[1],o.loop="loop"===n[1]||"loopandnoslidestop"===n[1]||"none"!==n[1]&&v(n[1]);break;case"ptimer":o.pausetimer=v(n[1]);break;case"sat":o.waitToSlideTrans=v(n[1])}}return null==e.mp4&&null==e.webm&&(o.fitCover=!1),void 0!==e.bgvideo&&(o.bgvideo=e.bgvideo),o.noInt&&(o.controls=!1),void 0!==e.mp4&&(o.mp4=e.mp4),void 0!==e.videomp4&&(o.mp4=e.videomp4),void 0!==e.ytid&&(o.ytid=e.ytid),void 0!==e.ogv&&(o.ogv=e.ogv),void 0!==e.webm&&(o.webm=e.webm),void 0!==e.vimeoid&&(o.vimeoid=e.vimeoid),void 0!==e.vatr&&(o.vatr=e.vatr),void 0!==e.videoattributes&&(o.vatr=e.videoattributes),void 0!==e.poster&&(o.poster=e.poster),o.slideid=a,o.aplay="true"===o.aplay||o.aplay,1===o.bgvideo&&(o.volume="mute"),o.ssec=t(o.start),o.esec=t(o.end),o.pausetimer=void 0===o.pausetimer?"loopandnoslidestop"!==o.loopcache:o.pausetimer,o.inColumn=e._incolumn,o.audio=e.audio,!0!==o.loop&&"true"!==o.loop||!0!==o.nse&&"true"!==o.nse||(o.loop=!1),o},y=function(e,t){if(i[t].playingvideos=void 0===i[t].playingvideos?new Array:i[t].playingvideos,i[t].videos[e[0].id].stopAV&&void 0!==i[t].playingvideos&&i[t].playingvideos.length>0)for(var a in i[t].lastplayedvideos=jQuery.extend(!0,[],i[t].playingvideos),i[t].playingvideos)i[t].playingvideos.hasOwnProperty(a)&&i.stopVideo(i[t].playingvideos[a],t);i[t].playingvideos.push(e),i[t].videoIsPlaying=e},w=function(e,t){void 0!==i[t]&&void 0!==i[t]&&null!=i[t].playingvideos&&jQuery.inArray(e,i[t].playingvideos)>=0&&i[t].playingvideos.splice(jQuery.inArray(e,i[t].playingvideos),1)},b=function(e,t){if(void 0!==e&&(void 0===t&&(t=0),i.ISM&&!e.bgvideo)){e.playPauseBtnTween&&e.playPauseBtnTween.kill&&e.playPauseBtnTween.kill();var a=i.closestNode(e.video,"RS-LAYER"),r=e.controls?1:0,o=e.controls?0:.3;e.controls&&e.poster&&0===t&&(o=0,r=0),a&&(e.playPauseBtnTween=tpGS.gsap.to(a.querySelector(".tp-video-play-button"),{duration:o,delay:r,opacity:t}))}};window.RS_MODULES=window.RS_MODULES||{},window.RS_MODULES.video={loaded:!0,version:"6.5.6"},window.RS_MODULES.checkMinimal&&window.RS_MODULES.checkMinimal()}(jQuery);;
(function(b,a){"function"==typeof define&&define.amd?define(a):"object"==typeof exports?module.exports=a():b.Blazy=a()})(this,function(){function j(b){var a=b._util;a.elements=r(b.options),a.count=a.elements.length,a.destroyed&&(a.destroyed=!1,b.options.container&&c(b.options.container,function(b){d(b,"scroll",a.validateT)}),d(window,"resize",a.saveViewportOffsetT),d(window,"resize",a.validateT),d(window,"scroll",a.validateT)),p(b)}function p(d){for(var e=d._util,f=0,h,a,c,j;f<e.count;f++)h=e.elements[f],a=h,c=d.options,j=a.getBoundingClientRect(),c.container&&q&&(a=a.closest(c.containerClass))?(a=a.getBoundingClientRect(),c=!!i(a,b)&&i(j,{top:a.top-c.offset,right:a.right+c.offset,bottom:a.bottom+c.offset,left:a.left-c.offset})):c=i(j,b),(c||g(h,d.options.successClass))&&(d.load(h),e.elements.splice(f,1),e.count--,f--);0===e.count&&d.destroy()}function i(a,b){return a.right>=b.left&&a.bottom>=b.top&&a.left<=b.right&&a.top<=b.bottom}function o(b,j,i){var n,q,r,s,k,o,p;!g(b,i.successClass)&&(j||i.loadInvisible||0<b.offsetWidth&&0<b.offsetHeight)&&((j=b.getAttribute(e)||b.getAttribute(i.src))?(j=j.split(i.separator),n=j[l&&1<j.length?1:0],q=b.getAttribute(i.srcset),r="img"===b.nodeName.toLowerCase(),s=(j=b.parentNode)&&"picture"===j.nodeName.toLowerCase(),r||void 0===b.src?(k=new Image,o=function(){i.error&&i.error(b,"invalid"),h(b,i.errorClass),a(k,"error",o),a(k,"load",p)},p=function(){r?s||m(b,n,q):b.style.backgroundImage='url("'+n+'")',f(b,i),a(k,"load",p),a(k,"error",o)},s&&(k=b,c(j.getElementsByTagName("source"),function(a){var b=i.srcset,c=a.getAttribute(b);c&&(a.setAttribute("srcset",c),a.removeAttribute(b))})),d(k,"error",o),d(k,"load",p),m(k,n,q)):(b.src=n,f(b,i))):"video"===b.nodeName.toLowerCase()?(c(b.getElementsByTagName("source"),function(a){var b=i.src,c=a.getAttribute(b);c&&(a.setAttribute("src",c),a.removeAttribute(b))}),b.load(),f(b,i)):(i.error&&i.error(b,"missing"),h(b,i.errorClass)))}function f(b,a){h(b,a.successClass),a.success&&a.success(b),b.removeAttribute(a.src),b.removeAttribute(a.srcset),c(a.breakpoints,function(a){b.removeAttribute(a.src)})}function m(a,c,b){b&&a.setAttribute("srcset",b),a.src=c}function g(a,b){return-1!==(" "+a.className+" ").indexOf(" "+b+" ")}function h(a,b){g(a,b)||(a.className+=" "+b)}function r(a){var b=[],c;a=a.root.querySelectorAll(a.selector);for(c=a.length;c--;b.unshift(a[c]));return b}function k(a){b.bottom=(window.innerHeight||document.documentElement.clientHeight)+a,b.right=(window.innerWidth||document.documentElement.clientWidth)+a}function d(a,b,c){a.attachEvent?a.attachEvent&&a.attachEvent("on"+b,c):a.addEventListener(b,c,{capture:!1,passive:!0})}function a(a,b,c){a.detachEvent?a.detachEvent&&a.detachEvent("on"+b,c):a.removeEventListener(b,c,{capture:!1,passive:!0})}function c(b,c){if(b&&c)for(var d=b.length,a=0;a<d&&!1!==c(b[a],a);a++);}function n(b,c,d){var a=0;return function(){var e=+new Date;e-a<c||(a=e,b.apply(d,arguments))}}var e,b,l,q;return function(h){var g,d,f;document.querySelectorAll||(g=document.createStyleSheet(),document.querySelectorAll=function(a,d,e,b,c){c=document.all,d=[],a=a.replace(/\[for\b/gi,"[htmlFor").split(",");for(e=a.length;e--;){g.addRule(a[e],"k:v");for(b=c.length;b--;)c[b].currentStyle.k&&d.push(c[b]);g.removeRule(0)}return d}),d=this,f=d._util={},f.elements=[],f.destroyed=!0,d.options=h||{},d.options.error=d.options.error||!1,d.options.offset=d.options.offset||100,d.options.root=d.options.root||document,d.options.success=d.options.success||!1,d.options.selector=d.options.selector||".b-lazy",d.options.separator=d.options.separator||"|",d.options.containerClass=d.options.container,d.options.container=!!d.options.containerClass&&document.querySelectorAll(d.options.containerClass),d.options.errorClass=d.options.errorClass||"b-error",d.options.breakpoints=d.options.breakpoints||!1,d.options.loadInvisible=d.options.loadInvisible||!1,d.options.successClass=d.options.successClass||"b-loaded",d.options.validateDelay=d.options.validateDelay||25,d.options.saveViewportOffsetDelay=d.options.saveViewportOffsetDelay||50,d.options.srcset=d.options.srcset||"data-srcset",d.options.src=e=d.options.src||"data-src",q=Element.prototype.closest,l=1<window.devicePixelRatio,b={},b.top=0-d.options.offset,b.left=0-d.options.offset,d.revalidate=function(){j(d)},d.load=function(a,b){var d=this.options;void 0===a.length?o(a,b,d):c(a,function(a){o(a,b,d)})},d.destroy=function(){var b=this._util;this.options.container&&c(this.options.container,function(c){a(c,"scroll",b.validateT)}),a(window,"scroll",b.validateT),a(window,"resize",b.validateT),a(window,"resize",b.saveViewportOffsetT),b.count=0,b.elements.length=0,b.destroyed=!0},f.validateT=n(function(){p(d)},d.options.validateDelay,d),f.saveViewportOffsetT=n(function(){k(d.options.offset)},d.options.saveViewportOffsetDelay,d),k(d.options.offset),c(d.options.breakpoints,function(a){if(a.width>=window.screen.width)return e=a.src,!1}),setTimeout(function(){j(d)})}});var WPacTime=WPacTime||{getTime:function(a,b,c){return"chat"==c?this.getChatTime(a,b||"en"):c?this.getFormatTime(a,c,b||"en"):this.getDefaultTime(a,b||"en")},getChatTime:function(a,b){var c=((new Date).getTime()-a)/1e3/60/60,d=c/24;return 24>c?this.getFormatTime(a,"HH:mm",b):365>d?this.getFormatTime(a,"dd.MM HH:mm",b):this.getFormatTime(a,"yyyy.MM.dd HH:mm",b)},getDefaultTime:function(a,b){return this.getTimeAgo(a,b)},getTimeAgo:function(c,a){c=((new Date).getTime()-c)/1e3;var d=c/60,e=d/60,b=e/24,f=b/365;return a=WPacTime.Messages[a]?a:"en",45>c?WPacTime.Messages[a].second:90>c?WPacTime.Messages[a].minute:45>d?WPacTime.Messages[a].minutes(d):90>d?WPacTime.Messages[a].hour:24>e?WPacTime.Messages[a].hours(e):48>e?WPacTime.Messages[a].day:30>b?WPacTime.Messages[a].days(b):60>b?WPacTime.Messages[a].month:365>b?WPacTime.Messages[a].months(b):2>f?WPacTime.Messages[a].year:WPacTime.Messages[a].years(f)},getTime12:function(a,b){return a=new Date(a),(a.getHours()%12?a.getHours()%12:12)+":"+a.getMinutes()+(12<=a.getHours()?" PM":" AM")},getFormatTime:function(b,d,c){var a=new Date(b),e={SS:a.getMilliseconds(),ss:a.getSeconds(),mm:a.getMinutes(),HH:a.getHours(),hh:(a.getHours()%12?a.getHours()%12:12)+(12<=a.getHours()?"PM":"AM"),dd:a.getDate(),MM:a.getMonth()+1,yyyy:a.getFullYear(),yy:String(a.getFullYear()).toString().substr(2,2),ago:this.getTimeAgo(b,c),12:this.getTime12(b,c)};return d.replace(/(SS|ss|mm|HH|hh|DD|dd|MM|yyyy|yy|ago|12)/g,function(a,b){return a=e[b],10>a?"0"+a:a})},declineNum:function(a,b,c,d){return a+" "+this.declineMsg(a,b,c,d)},declineMsg:function(a,c,d,e,f){var b=a%10;return 1==b&&(1==a||20<a)?c:1<b&&5>b&&(20<a||10>a)?d:a?e:f}};WPacTime.Messages={ru:{second:"\u0442\u043e\u043b\u044c\u043a\u043e \u0447\u0442\u043e",minute:"\u043c\u0438\u043d\u0443\u0442\u0443 \u043d\u0430\u0437\u0430\u0434",minutes:function(a){return WPacTime.declineNum(Math.round(a),"\u043c\u0438\u043d\u0443\u0442\u0430 \u043d\u0430\u0437\u0430\u0434","\u043c\u0438\u043d\u0443\u0442\u044b \u043d\u0430\u0437\u0430\u0434","\u043c\u0438\u043d\u0443\u0442 \u043d\u0430\u0437\u0430\u0434")},hour:"\u0447\u0430\u0441 \u043d\u0430\u0437\u0430\u0434",hours:function(a){return WPacTime.declineNum(Math.round(a),"\u0447\u0430\u0441 \u043d\u0430\u0437\u0430\u0434","\u0447\u0430\u0441\u0430 \u043d\u0430\u0437\u0430\u0434","\u0447\u0430\u0441\u043e\u0432 \u043d\u0430\u0437\u0430\u0434")},day:"\u0434\u0435\u043d\u044c \u043d\u0430\u0437\u0430\u0434",days:function(a){return WPacTime.declineNum(Math.round(a),"\u0434\u0435\u043d\u044c \u043d\u0430\u0437\u0430\u0434","\u0434\u043d\u044f \u043d\u0430\u0437\u0430\u0434","\u0434\u043d\u0435\u0439 \u043d\u0430\u0437\u0430\u0434")},month:"\u043c\u0435\u0441\u044f\u0446 \u043d\u0430\u0437\u0430\u0434",months:function(a){return WPacTime.declineNum(Math.round(a/30),"\u043c\u0435\u0441\u044f\u0446 \u043d\u0430\u0437\u0430\u0434","\u043c\u0435\u0441\u044f\u0446\u0430 \u043d\u0430\u0437\u0430\u0434","\u043c\u0435\u0441\u044f\u0446\u0435\u0432 \u043d\u0430\u0437\u0430\u0434")},year:"\u0433\u043e\u0434 \u043d\u0430\u0437\u0430\u0434",years:function(a){return WPacTime.declineNum(Math.round(a),"\u0433\u043e\u0434 \u043d\u0430\u0437\u0430\u0434","\u0433\u043e\u0434\u0430 \u043d\u0430\u0437\u0430\u0434","\u043b\u0435\u0442 \u043d\u0430\u0437\u0430\u0434")}},en:{second:"just now",minute:"1m ago",minutes:function(a){return Math.round(a)+"m ago"},hour:"1h ago",hours:function(a){return Math.round(a)+"h ago"},day:"a day ago",days:function(a){return Math.round(a)+" days ago"},month:"a month ago",months:function(a){return Math.round(a/30)+" months ago"},year:"a year ago",years:function(a){return Math.round(a)+" years ago"}},uk:{second:"\u0442\u0456\u043b\u044c\u043a\u0438 \u0449\u043e",minute:"\u0445\u0432\u0438\u043b\u0438\u043d\u0443 \u0442\u043e\u043c\u0443",minutes:function(a){return WPacTime.declineNum(Math.round(a),"\u0445\u0432\u0438\u043b\u0438\u043d\u0443 \u0442\u043e\u043c\u0443","\u0445\u0432\u0438\u043b\u0438\u043d\u0438 \u0442\u043e\u043c\u0443","\u0445\u0432\u0438\u043b\u0438\u043d \u0442\u043e\u043c\u0443")},hour:"\u0433\u043e\u0434\u0438\u043d\u0443 \u0442\u043e\u043c\u0443",hours:function(a){return WPacTime.declineNum(Math.round(a),"\u0433\u043e\u0434\u0438\u043d\u0443 \u0442\u043e\u043c\u0443","\u0433\u043e\u0434\u0438\u043d\u0438 \u0442\u043e\u043c\u0443","\u0433\u043e\u0434\u0438\u043d \u0442\u043e\u043c\u0443")},day:"\u0434\u0435\u043d\u044c \u0442\u043e\u043c\u0443",days:function(a){return WPacTime.declineNum(Math.round(a),"\u0434\u0435\u043d\u044c \u0442\u043e\u043c\u0443","\u0434\u043d\u0456 \u0442\u043e\u043c\u0443","\u0434\u043d\u0456\u0432 \u0442\u043e\u043c\u0443")},month:"\u043c\u0456\u0441\u044f\u0446\u044c \u0442\u043e\u043c\u0443",months:function(a){return WPacTime.declineNum(Math.round(a/30),"\u043c\u0456\u0441\u044f\u0446\u044c \u0442\u043e\u043c\u0443","\u043c\u0456\u0441\u044f\u0446\u0456 \u0442\u043e\u043c\u0443","\u043c\u0456\u0441\u044f\u0446\u0456\u0432 \u0442\u043e\u043c\u0443")},year:"\u0440\u0456\u043a \u0442\u043e\u043c\u0443",years:function(a){return WPacTime.declineNum(Math.round(a),"\u0440\u0456\u043a \u0442\u043e\u043c\u0443","\u0440\u043e\u043a\u0438 \u0442\u043e\u043c\u0443","\u0440\u043e\u043a\u0456\u0432 \u0442\u043e\u043c\u0443")}},ro:{second:"chiar acum",minute:"\u00een urm\u0103 minut",minutes:function(a){return WPacTime.declineNum(Math.round(a),"o minuta in urma","minute in urma","de minute in urma")},hour:"acum o ora",hours:function(a){return WPacTime.declineNum(Math.round(a),"acum o ora","ore in urma","de ore in urma")},day:"o zi in urma",days:function(a){return WPacTime.declineNum(Math.round(a),"o zi in urma","zile in urma","de zile in urma")},month:"o luna in urma",months:function(a){return WPacTime.declineNum(Math.round(a/30),"o luna in urma","luni in urma","de luni in urma")},year:"un an in urma",years:function(a){return WPacTime.declineNum(Math.round(a),"un an in urma","ani in urma","de ani in urma")}},lv:{second:"Maz\u0101k par min\u016bti",minute:"Pirms min\u016btes",minutes:function(a){return WPacTime.declineNum(Math.round(a),"pirms min\u016btes","pirms min\u016bt\u0113m","pirms min\u016bt\u0113m")},hour:"pirms stundas",hours:function(a){return WPacTime.declineNum(Math.round(a),"pirms stundas","pirms stund\u0101m","pirms stund\u0101m")},day:"pirms dienas",days:function(a){return WPacTime.declineNum(Math.round(a),"pirms dienas","pirms dien\u0101m","pirms dien\u0101m")},month:"pirms m\u0113ne\u0161a",months:function(a){return WPacTime.declineNum(Math.round(a/30),"pirms m\u0113ne\u0161a","pirms m\u0113ne\u0161iem","pirms m\u0113ne\u0161iem")},year:"pirms gada",years:function(a){return WPacTime.declineNum(Math.round(a),"pirms gada","pirms gadiem","pirms gadiem")}},lt:{second:"k\u0105 tik",minute:"prie\u0161 minut\u0119",minutes:function(a){return WPacTime.declineNum(Math.round(a),"minut\u0117 prie\u0161","minut\u0117s prie\u0161","minu\u010di\u0173 prie\u0161")},hour:"prie\u0161 valand\u0105",hours:function(a){return WPacTime.declineNum(Math.round(a),"valanda prie\u0161","valandos prie\u0161","valand\u0173 prie\u0161")},day:"prie\u0161 dien\u0105",days:function(a){return WPacTime.declineNum(Math.round(a),"diena prie\u0161","dienos prie\u0161","dien\u0173 prie\u0161")},month:"prie\u0161 m\u0117nes\u012f",months:function(a){return WPacTime.declineNum(Math.round(a/30),"m\u0117nes\u012f prie\u0161","m\u0117nesiai prie\u0161","m\u0117nesi\u0173 prie\u0161")},year:"prie\u0161 metus",years:function(a){return WPacTime.declineNum(Math.round(a),"metai prie\u0161","metai prie\u0161","met\u0173 prie\u0161")}},kk:{second:"\u0431\u0456\u0440 \u043c\u0438\u043d\u0443\u0442\u0442\u0430\u043d \u0430\u0437 \u0443\u0430\u049b\u044b\u0442 \u0431\u04b1\u0440\u044b\u043d",minute:"\u0431\u0456\u0440 \u043c\u0438\u043d\u0443\u0442 \u0431\u04b1\u0440\u044b\u043d",minutes:function(a){return WPacTime.declineNum(Math.round(a),"\u043c\u0438\u043d\u0443\u0442 \u0431\u04b1\u0440\u044b\u043d","\u043c\u0438\u043d\u0443\u0442 \u0431\u04b1\u0440\u044b\u043d","\u043c\u0438\u043d\u0443\u0442 \u0431\u04b1\u0440\u044b\u043d")},hour:"\u0431\u0456\u0440 \u0441\u0430\u0493\u0430\u0442 \u0431\u04b1\u0440\u044b\u043d",hours:function(a){return WPacTime.declineNum(Math.round(a),"\u0441\u0430\u0493\u0430\u0442 \u0431\u04b1\u0440\u044b\u043d","\u0441\u0430\u0493\u0430\u0442 \u0431\u04b1\u0440\u044b\u043d","\u0441\u0430\u0493\u0430\u0442 \u0431\u04b1\u0440\u044b\u043d")},day:"\u0431\u0456\u0440 \u043a\u04af\u043d \u0431\u04b1\u0440\u044b\u043d",days:function(a){return WPacTime.declineNum(Math.round(a),"\u043a\u04af\u043d \u0431\u04b1\u0440\u044b\u043d","\u043a\u04af\u043d \u0431\u04b1\u0440\u044b\u043d","\u043a\u04af\u043d \u0431\u04b1\u0440\u044b\u043d")},month:"\u0431\u0456\u0440 \u0430\u0439 \u0431\u04b1\u0440\u044b\u043d",months:function(a){return WPacTime.declineNum(Math.round(a/30),"\u0430\u0439 \u0431\u04b1\u0440\u044b\u043d","\u0430\u0439 \u0431\u04b1\u0440\u044b\u043d","\u0430\u0439 \u0431\u04b1\u0440\u044b\u043d")},year:"\u0431\u0456\u0440 \u0436\u044b\u043b \u0431\u04b1\u0440\u044b\u043d",years:function(a){return WPacTime.declineNum(Math.round(a),"\u0436\u044b\u043b \u0431\u04b1\u0440\u044b\u043d","\u0436\u044b\u043b \u0431\u04b1\u0440\u044b\u043d","\u0436\u044b\u043b \u0431\u04b1\u0440\u044b\u043d")}},ka:{second:"\u10ec\u10d0\u10db\u10d8\u10e1 \u10ec\u10d8\u10dc",minute:"\u10ec\u10e3\u10d7\u10d8\u10e1 \u10ec\u10d8\u10dc",minutes:function(a){return WPacTime.declineNum(Math.round(a),"\u10ec\u10e3\u10d7\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10ec\u10e3\u10d7\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10ec\u10e3\u10d7\u10d8\u10e1 \u10ec\u10d8\u10dc")},hour:"\u10e1\u10d0\u10d0\u10d7\u10d8\u10e1 \u10ec\u10d8\u10dc",hours:function(a){return WPacTime.declineNum(Math.round(a),"\u10e1\u10d0\u10d0\u10d7\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10e1\u10d0\u10d0\u10d7\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10e1\u10d0\u10d0\u10d7\u10d8\u10e1 \u10ec\u10d8\u10dc")},day:"\u10d3\u10e6\u10d8\u10e1 \u10ec\u10d8\u10dc",days:function(a){return WPacTime.declineNum(Math.round(a),"\u10d3\u10e6\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10d3\u10e6\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10d3\u10e6\u10d8\u10e1 \u10ec\u10d8\u10dc")},month:"\u10d7\u10d5\u10d8\u10e1 \u10ec\u10d8\u10dc",months:function(a){return WPacTime.declineNum(Math.round(a/30),"\u10d7\u10d5\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10d7\u10d5\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10d7\u10d5\u10d8\u10e1 \u10ec\u10d8\u10dc")},year:"\u10ec\u10da\u10d8\u10e1 \u10ec\u10d8\u10dc",years:function(a){return WPacTime.declineNum(Math.round(a),"\u10ec\u10da\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10ec\u10da\u10d8\u10e1 \u10ec\u10d8\u10dc","\u10ec\u10da\u10d8\u10e1 \u10ec\u10d8\u10dc")}},hy:{second:"\u0574\u056b \u0584\u0576\u056b \u057e\u0561\u0575\u0580\u056f\u0575\u0561\u0576 \u0561\u057c\u0561\u057b",minute:"\u0574\u0565\u056f \u0580\u0578\u057a\u0565 \u0561\u057c\u0561\u057b",minutes:function(a){return WPacTime.declineNum(Math.round(a),"\u0580\u0578\u057a\u0565 \u0561\u057c\u0561\u057b","\u0580\u0578\u057a\u0565 \u0561\u057c\u0561\u057b","\u0580\u0578\u057a\u0565 \u0561\u057c\u0561\u057b")},hour:"\u0574\u0565\u056f \u056a\u0561\u0574 \u0561\u057c\u0561\u057b",hours:function(a){return WPacTime.declineNum(Math.round(a),"\u056a\u0561\u0574 \u0561\u057c\u0561\u057b","\u056a\u0561\u0574 \u0561\u057c\u0561\u057b","\u056a\u0561\u0574 \u0561\u057c\u0561\u057b")},day:"\u0574\u0565\u056f \u0585\u0580 \u0561\u057c\u0561\u057b",days:function(a){return WPacTime.declineNum(Math.round(a),"\u0585\u0580 \u0561\u057c\u0561\u057b","\u0585\u0580 \u0561\u057c\u0561\u057b","\u0585\u0580 \u0561\u057c\u0561\u057b")},month:"\u0574\u0565\u056f \u0561\u0574\u056b\u057d \u0561\u057c\u0561\u057b",months:function(a){return WPacTime.declineNum(Math.round(a/30),"\u0561\u0574\u056b\u057d \u0561\u057c\u0561\u057b","\u0561\u0574\u056b\u057d \u0561\u057c\u0561\u057b","\u0561\u0574\u056b\u057d \u0561\u057c\u0561\u057b")},year:"\u0574\u0565\u056f \u057f\u0561\u0580\u056b \u0561\u057c\u0561\u057b",years:function(a){return WPacTime.declineNum(Math.round(a),"\u057f\u0561\u0580\u056b \u0561\u057c\u0561\u057b","\u057f\u0561\u0580\u056b \u0561\u057c\u0561\u057b","\u057f\u0561\u0580\u056b \u0561\u057c\u0561\u057b")}},fr:{second:"tout \u00e0 l'heure",minute:"environ une minute",minutes:function(a){return Math.round(a)+" minutes"},hour:"environ une heure",hours:function(a){return"environ "+Math.round(a)+" heures"},day:"un jour",days:function(a){return Math.round(a)+" jours"},month:"environ un mois",months:function(a){return Math.round(a/30)+" mois"},year:"environ un an",years:function(a){return Math.round(a)+" ans"}},es:{second:"ahora",minute:"hace un minuto",minutes:function(a){return"hace "+Math.round(a)+" minuts"},hour:"hace una hora",hours:function(a){return"hace "+Math.round(a)+" horas"},day:"hace un dia",days:function(a){return"hace "+Math.round(a)+" d\u00edas"},month:"hace un mes",months:function(a){return"hace "+Math.round(a/30)+" meses"},year:"hace a\u00f1os",years:function(a){return"hace "+Math.round(a)+" a\u00f1os"}},el:{second:"\u03bb\u03b9\u03b3\u03cc\u03c4\u03b5\u03c1\u03bf \u03b1\u03c0\u03cc \u03ad\u03bd\u03b1 \u03bb\u03b5\u03c0\u03c4\u03cc",minute:"\u03b3\u03cd\u03c1\u03c9 \u03c3\u03c4\u03bf \u03ad\u03bd\u03b1 \u03bb\u03b5\u03c0\u03c4\u03cc",minutes:function(a){return Math.round(a)+" minutes"},hour:"\u03b3\u03cd\u03c1\u03c9 \u03c3\u03c4\u03b7\u03bd \u03bc\u03b9\u03b1 \u03ce\u03c1\u03b1",hours:function(a){return"about "+Math.round(a)+" hours"},day:"\u03bc\u03b9\u03b1 \u03bc\u03ad\u03c1\u03b1",days:function(a){return Math.round(a)+" days"},month:"\u03b3\u03cd\u03c1\u03c9 \u03c3\u03c4\u03bf\u03bd \u03ad\u03bd\u03b1 \u03bc\u03ae\u03bd\u03b1",months:function(a){return Math.round(a/30)+" months"},year:"\u03b3\u03cd\u03c1\u03c9 \u03c3\u03c4\u03bf\u03bd \u03ad\u03bd\u03b1 \u03c7\u03c1\u03cc\u03bd\u03bf",years:function(a){return Math.round(a)+" years"}},de:{second:"soeben",minute:"vor einer Minute",minutes:function(a){return"vor "+Math.round(a)+" Minuten"},hour:"vor einer Stunde",hours:function(a){return"vor "+Math.round(a)+" Stunden"},day:"vor einem Tag",days:function(a){return"vor "+Math.round(a)+" Tagen"},month:"vor einem Monat",months:function(a){return"vor "+Math.round(a/30)+" Monaten"},year:"vor einem Jahr",years:function(a){return"vor "+Math.round(a)+" Jahren"}},be:{second:"\u043c\u0435\u043d\u0448 \u0437\u0430 \u0445\u0432\u0456\u043b\u0456\u043d\u0443 \u0442\u0430\u043c\u0443",minute:"\u0445\u0432\u0456\u043b\u0456\u043d\u0443 \u0442\u0430\u043c\u0443",minutes:function(a){return WPacTime.declineNum(Math.round(a),"\u0445\u0432\u0456\u043b\u0456\u043d\u0430 \u0442\u0430\u043c\u0443","\u0445\u0432\u0456\u043b\u0456\u043d\u044b \u0442\u0430\u043c\u0443","\u0445\u0432\u0456\u043b\u0456\u043d \u0442\u0430\u043c\u0443")},hour:"\u0433\u0430\u0434\u0437\u0456\u043d\u0443 \u0442\u0430\u043c\u0443",hours:function(a){return WPacTime.declineNum(Math.round(a),"\u0433\u0430\u0434\u0437\u0456\u043d\u0443 \u0442\u0430\u043c\u0443","\u0433\u0430\u0434\u0437\u0456\u043d\u044b \u0442\u0430\u043c\u0443","\u0433\u0430\u0434\u0437\u0456\u043d \u0442\u0430\u043c\u0443")},day:"\u0434\u0437\u0435\u043d\u044c \u0442\u0430\u043c\u0443",days:function(a){return WPacTime.declineNum(Math.round(a),"\u0434\u0437\u0435\u043d\u044c \u0442\u0430\u043c\u0443","\u0434\u043d\u0456 \u0442\u0430\u043c\u0443","\u0434\u0437\u0451\u043d \u0442\u0430\u043c\u0443")},month:"\u043c\u0435\u0441\u044f\u0446 \u0442\u0430\u043c\u0443",months:function(a){return WPacTime.declineNum(Math.round(a/30),"\u043c\u0435\u0441\u044f\u0446 \u0442\u0430\u043c\u0443","\u043c\u0435\u0441\u044f\u0446\u0430 \u0442\u0430\u043c\u0443","\u043c\u0435\u0441\u044f\u0446\u0430\u045e \u0442\u0430\u043c\u0443")},year:"\u0433\u043e\u0434 \u0442\u0430\u043c\u0443",years:function(a){return WPacTime.declineNum(Math.round(a),"\u0433\u043e\u0434 \u0442\u0430\u043c\u0443","\u0433\u0430\u0434\u044b \u0442\u0430\u043c\u0443","\u0433\u043e\u0434 \u0442\u0430\u043c\u0443")}},it:{second:"proprio ora",minute:"un minuto fa",minutes:function(a){return WPacTime.declineNum(Math.round(a),"un minuto fa","minuti fa","minuti fa")},hour:"un'ora fa",hours:function(a){return WPacTime.declineNum(Math.round(a),"un'ora fa","ore fa","ore fa")},day:"un giorno fa",days:function(a){return WPacTime.declineNum(Math.round(a),"un giorno fa","giorni fa","giorni fa")},month:"un mese fa",months:function(a){return WPacTime.declineNum(Math.round(a/30),"un mese fa","mesi fa","mesi fa")},year:"un anno fa",years:function(a){return WPacTime.declineNum(Math.round(a),"un anno fa","anni fa","anni fa")}},tr:{second:"az \u00f6nce",minute:"dakika \u00f6nce",minutes:function(a){return Math.round(a)+" dakika \u00f6nce"},hour:"saat \u00f6nce",hours:function(a){return Math.round(a)+" saat \u00f6nce"},day:"g\u00fcn \u00f6nce",days:function(a){return Math.round(a)+" g\u00fcn \u00f6nce"},month:"ay \u00f6nce",months:function(a){return Math.round(a/30)+" ay \u00f6nce"},year:"y\u0131l \u00f6nce",years:function(a){return Math.round(a)+" y\u0131l \u00f6nce"}},nb:{second:"n\u00e5 nettopp",minute:"ett minutt siden",minutes:function(a){return Math.round(a)+" minutter siden"},hour:"en time siden",hours:function(a){return Math.round(a)+" timer siden"},day:"en dag siden",days:function(a){return Math.round(a)+" dager siden"},month:"en m\u00e5ned siden",months:function(a){return Math.round(a/30)+" m\u00e5neder siden"},year:"ett \u00e5r siden",years:function(a){return Math.round(a)+" \u00e5r siden"}},da:{second:"lige nu",minute:"et minut siden",minutes:function(a){return Math.round(a)+" minutter siden"},hour:"en time siden",hours:function(a){return Math.round(a)+" timer siden"},day:"en dag siden",days:function(a){return Math.round(a)+" dage siden"},month:"en m\u00e5ned siden",months:function(a){return Math.round(a/30)+" m\u00e5neder siden"},year:"et \u00e5r siden",years:function(a){return Math.round(a)+" \u00e5r siden"}},nl:{second:"zojuist",minute:"minuten geleden",minutes:function(a){return Math.round(a)+" minuten geleden"},hour:"uur geleden",hours:function(a){return Math.round(a)+" uur geleden"},day:"1 dag geleden",days:function(a){return Math.round(a)+" dagen geleden"},month:"maand geleden",months:function(a){return Math.round(a/30)+" maanden geleden"},year:"jaar geleden",years:function(a){return Math.round(a)+" jaar geleden"}},ca:{second:"ara mateix",minute:"fa un minut",minutes:function(a){return"fa "+Math.round(a)+" minuts"},hour:"fa una hora",hours:function(a){return"fa "+Math.round(a)+" hores"},day:"fa un dia",days:function(a){return"fa "+Math.round(a)+" dies"},month:"fa un mes",months:function(a){return"fa "+Math.round(a/30)+" mesos"},year:"fa un any",years:function(a){return"fa "+Math.round(a)+" anys"}},sv:{second:"just nu",minute:"en minut sedan",minutes:function(a){return Math.round(a)+" minuter sedan"},hour:"en timme sedan",hours:function(a){return Math.round(a)+" timmar sedan"},day:"en dag sedan",days:function(a){return Math.round(a)+" dagar sedan"},month:"en m\u00e5nad sedan",months:function(a){return Math.round(a/30)+" m\u00e5nader sedan"},year:"ett \u00e5r sedan",years:function(a){return Math.round(a)+" \u00e5r sedan"}},pl:{second:"w\u0142a\u015bnie teraz",minute:"minut\u0119 temu",minutes:function(a){return Math.round(a)+" minut temu"},hour:"godzin\u0119 temu",hours:function(a){return Math.round(a)+" godzin temu"},day:"wczoraj",days:function(a){return Math.round(a)+" dni temu"},month:"miesi\u0105c temu",months:function(a){return Math.round(a/30)+" miesi\u0119cy temu"},year:"rok temu",years:function(a){return Math.round(a)+" lat temu"}},pt:{second:"agora",minute:"1 minuto atr\u00e1s",minutes:function(a){return Math.round(a)+" minutos atr\u00e1s"},hour:"1 hora atr\u00e1s",hours:function(a){return Math.round(a)+" horas atr\u00e1s"},day:"1 dia atr\u00e1s",days:function(a){return Math.round(a)+" dias atr\u00e1s"},month:"1 m\u00eas atr\u00e1s",months:function(a){return Math.round(a/30)+" meses atr\u00e1s"},year:"1 ano atr\u00e1s",years:function(a){return Math.round(a)+" anos atr\u00e1s"}},hu:{second:"\u00e9pp az im\u00e9nt",minute:"1 perccel ezel\u0151tt",minutes:function(a){return Math.round(a)+" perccel ezel\u0151tt"},hour:"\u00f3r\u00e1val ezel\u0151tt",hours:function(a){return Math.round(a)+" \u00f3r\u00e1val ezel\u0151tt"},day:"nappal ezel\u0151tt",days:function(a){return Math.round(a)+" nappal ezel\u0151tt"},month:"h\u00f3nappal ezel\u0151tt",months:function(a){return Math.round(a/30)+" h\u00f3nappal ezel\u0151tt"},year:"\u00e9vvel ezel\u0151tt",years:function(a){return Math.round(a)+" \u00e9vvel ezel\u0151tt"}},fi:{second:"juuri nyt",minute:"minuutti sitten",minutes:function(a){return Math.round(a)+" minuuttia sitten"},hour:"tunti sitten",hours:function(a){return Math.round(a)+" tuntia sitten"},day:"p\u00e4iv\u00e4 sitten",days:function(a){return Math.round(a)+" p\u00e4iv\u00e4\u00e4 sitten"},month:"kuukausi sitten",months:function(a){return Math.round(a/30)+" kuukautta sitten"},year:"vuosi sitten",years:function(a){return Math.round(a)+" vuotta sitten"}},he:{second:"\u05d4\u05e8\u05d2\u05e2",minute:"\u05dc\u05e4\u05e0\u05d9 \u05d3\u05e7\u05d4",minutes:function(a){return"\u05dc\u05e4\u05e0\u05d9 "+Math.round(a)+" \u05d3\u05e7\u05d5\u05ea"},hour:"\u05dc\u05e4\u05e0\u05d9 \u05e9\u05e2\u05d4",hours:function(a){return"\u05dc\u05e4\u05e0\u05d9 "+Math.round(a)+" \u05e9\u05e2\u05d5\u05ea"},day:"\u05dc\u05e4\u05e0\u05d9 \u05d9\u05d5\u05dd",days:function(a){return"\u05dc\u05e4\u05e0\u05d9 "+Math.round(a)+" \u05d9\u05de\u05d9\u05dd"},month:"\u05dc\u05e4\u05e0\u05d9 \u05d7\u05d5\u05d3\u05e9",months:function(a){return 2==Math.round(a/30)?"\u05dc\u05e4\u05e0\u05d9 \u05d7\u05d5\u05d3\u05e9\u05d9\u05d9\u05dd":"\u05dc\u05e4\u05e0\u05d9 "+Math.round(a/30)+" \u05d7\u05d5\u05d3\u05e9\u05d9\u05dd"},year:"\u05dc\u05e4\u05e0\u05d9 \u05e9\u05e0\u05d4",years:function(a){return"\u05dc\u05e4\u05e0\u05d9 "+Math.round(a)+" \u05e9\u05e0\u05d9\u05dd"}},bg:{second:"\u0432 \u043c\u043e\u043c\u0435\u043d\u0442\u0430",minute:"\u043f\u0440\u0435\u0434\u0438 1 \u043c\u0438\u043d\u0443\u0442\u0430",minutes:function(a){return"\u043f\u0440\u0435\u0434\u0438 "+Math.round(a)+" \u043c\u0438\u043d\u0443\u0442\u0438"},hour:"\u043f\u0440\u0435\u0434\u0438 1 \u0447\u0430\u0441",hours:function(a){return"\u043f\u0440\u0435\u0434\u0438 "+Math.round(a)+" \u0447\u0430\u0441\u0430"},day:"\u043f\u0440\u0435\u0434\u0438 1 \u0434\u0435\u043d",days:function(a){return"\u043f\u0440\u0435\u0434\u0438 "+Math.round(a)+" \u0434\u043d\u0438"},month:"\u043f\u0440\u0435\u0434\u0438 1 \u043c\u0435\u0441\u0435\u0446",months:function(a){return"\u043f\u0440\u0435\u0434\u0438 "+Math.round(a/30)+" \u043c\u0435\u0441\u0435\u0446\u0430"},year:"\u043f\u0440\u0435\u0434\u0438 1 \u0433\u043e\u0434\u0438\u043d\u0430",years:function(a){return"\u043f\u0440\u0435\u0434\u0438 "+Math.round(a)+" \u0433\u043e\u0434\u0438\u043d\u0438"}},sk:{second:"pr\u00e1ve teraz",minute:"pred min\u00fatov",minutes:function(a){return"pred "+Math.round(a)+" min\u00fatami"},hour:"pred hodinou",hours:function(a){return"pred "+Math.round(a)+" hodinami"},day:"v\u010dera",days:function(a){return"pred "+Math.round(a)+" d\u0148ami"},month:"pred mesiacom",months:function(a){return"pred "+Math.round(a/30)+" mesiacmi"},year:"pred rokom",years:function(a){return"pred "+Math.round(a)+" rokmi"}},lo:{second:"\u0ea7\u0eb1\u0ec8\u0e87\u0e81\u0eb5\u0ec9\u0e99\u0eb5\u0ec9",minute:"\u0edc\u0eb6\u0ec8\u0e87\u0e99\u0eb2\u0e97\u0eb5\u0e81\u0ec8\u0ead\u0e99",minutes:function(a){return Math.round(a)+" \u0e99\u0eb2\u0e97\u0eb5\u0e81\u0ec8\u0ead\u0e99"},hour:"\u0edc\u0eb6\u0ec8\u0e87\u0e8a\u0ebb\u0ec8\u0ea7\u0ec2\u0ea1\u0e87\u0e81\u0ec8\u0ead\u0e99",hours:function(a){return Math.round(a)+" \u0ebb\u0ec8\u0ea7\u0ec2\u0ea1\u0e87\u0e81\u0ec8\u0ead\u0e99"},day:"\u0edc\u0eb6\u0ec8\u0e87\u0ea1\u0eb7\u0ec9\u0e81\u0ec8\u0ead\u0e99",days:function(a){return Math.round(a)+" \u0ea1\u0eb7\u0ec9\u0e81\u0ec8\u0ead\u0e99"},month:"\u0edc\u0eb6\u0ec8\u0e87\u0ec0\u0e94\u0eb7\u0ead\u0e99\u0e81\u0ec8\u0ead\u0e99",months:function(a){return Math.round(a/30)+" \u0ec0\u0e94\u0eb7\u0ead\u0e99\u0e81\u0ec8\u0ead\u0e99"},year:"\u0edc\u0eb6\u0ec8\u0e87\u0e9b\u0eb5\u0e81\u0ec8\u0ead\u0e99",years:function(a){return Math.round(a)+" \u0e9b\u0eb5\u0e81\u0ec8\u0ead\u0e99"}},sl:{second:"pravkar",minute:"pred eno minuto",minutes:function(a){return"pred "+Math.round(a)+" minutami"},hour:"pred eno uro",hours:function(a){return"pred "+Math.round(a)+" urami"},day:"pred enim dnem",days:function(a){return"pred "+Math.round(a)+" dnevi"},month:"pred enim mesecem",months:function(a){return"pred "+Math.round(a/30)+" meseci"},year:"pred enim letom",years:function(a){return"pred "+Math.round(a)+" leti"}},et:{second:"just n\u00fc\u00fcd",minute:"minut tagasi",minutes:function(a){return Math.round(a)+" minutit tagasi"},hour:"tund tagasi",hours:function(a){return Math.round(a)+" tundi tagasi"},day:"p\u00e4ev tagasi",days:function(a){return Math.round(a)+" p\u00e4eva tagasi"},month:"kuu aega tagasi",months:function(a){return Math.round(a/30)+" kuud tagasi"},year:"aasta tagasi",years:function(a){return Math.round(a)+" aastat tagasi"}}};function rplg_badge_init(d,e,f){var b=d.querySelector(".wp-"+e+"-badge"),c=d.querySelector(".wp-"+e+"-form"),a;b&&c&&(a=document.createElement("div"),a.className=f+" wpac",-1<b.className.indexOf("-fixed")&&a.appendChild(b),a.appendChild(c),document.body.appendChild(a),b.onclick=function(){rplg_load_imgs(a),c.style.display="block"})}function rplg_load_imgs(a){a=a.querySelectorAll("img.rplg-blazy[data-src]");for(var b=0;b<a.length;b++)a[b].setAttribute("src",a[b].getAttribute("data-src")),a[b].removeAttribute("data-src")}function rplg_next_reviews(b,e){var c=this.parentNode,d=".wp-"+b+"-review.wp-"+b+"-hide",a;reviews=c.querySelectorAll(d);for(a=0;a<e&&a<reviews.length;a++)reviews[a]&&(reviews[a].className=reviews[a].className.replace("wp-"+b+"-hide"," "),rplg_load_imgs(reviews[a]));return reviews=c.querySelectorAll(d),1>reviews.length&&c.removeChild(this),window.rplg_blazy&&window.rplg_blazy.revalidate(),!1}function rplg_leave_review_window(){return _rplg_popup(this.getAttribute("href"),620,500),!1}function _rplg_lang(){var a=navigator;return(a.language||a.systemLanguage||a.userLanguage||"en").substr(0,2).toLowerCase()}function _rplg_popup(e,c,d,f,a,b){return a=a||screen.height/2-d/2,b=b||screen.width/2-c/2,window.open(e,"","location=1,status=1,resizable=yes,width="+c+",height="+d+",top="+a+",left="+b)}function _rplg_timeago(b){for(var a=0,c;a<b.length;a++)c=b[a].className,-1<c.indexOf("google")?(c=parseInt(b[a].getAttribute("data-time")),c*=1e3):c=-1<c.indexOf("facebook")?new Date(b[a].getAttribute("data-time").replace(/\+\d+$/,"")).getTime():new Date(b[a].getAttribute("data-time").replace(/ /,"T")).getTime(),b[a].innerHTML=WPacTime.getTime(c,_rplg_lang(),"ago")}function _rplg_init_blazy(a){window.Blazy?window.rplg_blazy=new Blazy({selector:"img.rplg-blazy"}):0<a&&setTimeout(function(){_rplg_init_blazy(a-1)},200)}function _rplg_read_more(){for(var b=document.querySelectorAll(".wp-more-toggle"),a=0;a<b.length;a++)(function(a){a.onclick=function(){a.parentNode.removeChild(a.previousSibling.previousSibling),a.previousSibling.className="",a.textContent=""}})(b[a])}document.addEventListener("DOMContentLoaded",function(){_rplg_timeago(document.querySelectorAll(".wpac [data-time]")),_rplg_read_more(),_rplg_init_blazy(10)});
var ajaxurl = "https://thegoodpainter.co.uk/wp-admin/admin-ajax.php";;
var script = document.createElement("script");script.async = true; script.type = "text/javascript";var target = 'https://www.clickcease.com/monitor/stat.js';script.src = target;var elem = document.head;elem.appendChild(script);;
window.RS_MODULES = window.RS_MODULES || {};
			window.RS_MODULES.modules = window.RS_MODULES.modules || {};
			window.RS_MODULES.waiting = window.RS_MODULES.waiting || [];
			window.RS_MODULES.defered = false;
			window.RS_MODULES.moduleWaiting = window.RS_MODULES.moduleWaiting || {};
			window.RS_MODULES.type = 'compiled';;
var sbiajaxurl = "https://thegoodpainter.co.uk/wp-admin/admin-ajax.php";;
/**
 *  PDFObject v2.1.1
 *  https://github.com/pipwerks/PDFObject
 *  @license
 *  Copyright (c) 2008-2018 Philip Hutchison
 *  MIT-style license: http://pipwerks.mit-license.org/
 *  UMD module pattern from https://github.com/umdjs/umd/blob/master/templates/returnExports.js
 */
!function(e,t){"function"==typeof define&&define.amd?define([],t):"object"==typeof module&&module.exports?module.exports=t():e.PDFObject=t()}(this,function(){"use strict";if("undefined"==typeof window||"undefined"==typeof navigator)return!1;var e=window.navigator.userAgent,t=void 0!==navigator.mimeTypes&&void 0!==navigator.mimeTypes["application/pdf"],v=void 0!==window.Promise,o=-1!==e.indexOf("irefox")&&-1===e.indexOf("Mobile")&&-1===e.indexOf("Tablet")&&18<parseInt(e.split("rv:")[1].split(".")[0],10),b=/iphone|ipad|ipod/i.test(e.toLowerCase()),n=function(e){var t;try{t=new ActiveXObject(e)}catch(e){t=null}return t},i=function(){return!!(window.ActiveXObject||"ActiveXObject"in window)},h=!b&&navigator.vendor&&-1!==navigator.vendor.indexOf("Apple")&&navigator.userAgent&&-1!==navigator.userAgent.indexOf("Safari"),r=function(){return!(!n("AcroPDF.PDF")&&!n("PDF.PdfCtrl"))},y=!b&&(o||t||i()&&r()),w=function(e){var t,o="";if(e){for(t in e)e.hasOwnProperty(t)&&(o+=encodeURIComponent(t)+"="+encodeURIComponent(e[t])+"&");o=o&&(o="#"+o).slice(0,o.length-1)}return o},d=function(e){"undefined"!=typeof console&&console.log&&console.log("[PDFObject] "+e)},P=function(e){return d(e),!1},D=function(e){var t=document.body;return"string"==typeof e?t=document.querySelector(e):"undefined"!=typeof jQuery&&e instanceof jQuery&&e.length?t=e.get(0):void 0!==e.nodeType&&1===e.nodeType&&(t=e),t},s=function(e){var t="pdfobject-container",o=e.className.split(/\s+/);-1===o.indexOf(t)&&(o.push(t),e.className=o.join(" "))},T=function(e,t,o,n,i){var r=n+"?file="+encodeURIComponent(t)+o,d="<div style='"+(b?"-webkit-overflow-scrolling: touch; overflow-y: scroll; ":"overflow: hidden; ")+"position: absolute; top: 0; right: 0; bottom: 0; left: 0;'><iframe  "+i+" src='"+r+"' style='border: none; width: 100%; height: 100%;' frameborder='0'></iframe></div>";return s(e),e.style.position="relative",e.style.overflow="auto",e.innerHTML=d,e.getElementsByTagName("iframe")[0]},j=function(e,t,o,n,i,r,d){var a="",a=t&&t!==document.body?"width: "+i+"; height: "+r+";":"position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%;";return s(e),e.innerHTML="<embed "+d+" class='pdfobject' src='"+o+n+"' type='application/pdf' style='overflow: auto; "+a+"'/>",e.getElementsByTagName("embed")[0]},F=function(e,t,o,n,i,r,d){var a="",a=t&&t!==document.body?"width: "+i+"; height: "+r+";":"position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%;";return e.className+=" pdfobject-container",e.innerHTML="<iframe "+d+" class='pdfobject' src='"+o+n+"' type='application/pdf' style='border: none; "+a+"'/>",e.getElementsByTagName("iframe")[0]};return{embed:function(e,t,o){if("string"!=typeof e)return P("URL is not valid");t=void 0!==t&&t;var n,i=(o=void 0!==o?o:{}).id&&"string"==typeof o.id?"id='"+o.id+"'":"",r=!!o.page&&o.page,d=o.pdfOpenParams?o.pdfOpenParams:{},a=void 0===o.fallbackLink||o.fallbackLink,s=o.width?o.width:"100%",f=o.height?o.height:"100%",p="boolean"!=typeof o.assumptionMode||o.assumptionMode,l="boolean"==typeof o.forcePDFJS&&o.forcePDFJS,c="boolean"==typeof o.supportRedirect&&o.supportRedirect,u=!!o.PDFJS_URL&&o.PDFJS_URL,m=D(t),g="";return m?(r&&(d.page=r),n=w(d),l&&u?T(m,e,n,u,i):y||p&&v&&!b?(c&&h?F:j)(m,t,e,n,s,f,i):u?T(m,e,n,u,i):(a&&(g="string"==typeof a?a:"<p>This browser does not support inline PDFs. Please download the PDF to view it: <a href='[url]'>Download PDF</a></p>",m.innerHTML=g.replace(/\[url\]/g,e)),P("This browser does not support embedded PDFs"))):P("Target element cannot be determined")},pdfobjectversion:"2.1.1",supportsPDFs:y}});;
jQuery(function(c){c(".ead-iframe-wrapper").each(function(){var e=c(this),t=e.find(".ead-iframe"),a=e.parent(".ead-document").data("viewer"),i=void 0!==a&&0<a.length&&a,d=t.data("src"),r=t.attr("loading"),n=!1;(void 0!==d&&0<d.length||void 0!==r&&"lazy"===r)&&(n=!0);var s=t;n||(s=c('<iframe class="ead-iframe"></iframe>')).attr({src:t.attr("src"),style:t.attr("style"),title:t.attr("title")}),i||s.css("visibility","visible"),s.on("load",function(){c(this).parents(".ead-document").find(".ead-document-loading").css("display","none")}),n||e.html(s)}),c(".ead-document[data-pdf-src]").each(function(){var e,t=c(this),a=t.find(".ead-iframe"),i=t.data("pdfSrc"),d=void 0!==(d=t.data("viewer"))&&0<i.length&&0<d.length&&d,r="pdfjs"in eadPublic&&0<eadPublic.pdfjs.length&&"built-in"===d;d&&("browser"===d||r)&&(PDFObject.supportsPDFs||r?(e={},e=r?{forcePDFJS:!0,PDFJS_URL:eadPublic.pdfjs}:{width:a.css("width"),height:a.css("height")},PDFObject.embed(i,t,e)):a.css("visibility","visible"))}),c(document).on("click",".ead-reload-btn",function(e){e.preventDefault();var t=c(this).parents(".ead-document"),a=t.find(".ead-iframe").attr("src");t.find(".ead-iframe").attr("src",a)})});;
function getURLParameter(b){const c=window.location.search.substring(1),a=c.split('&');for(let c=0;c<a.length;c++){const d=a[c].split('=');if(d[0]===b)return d[1]}return!1}function setCookie(b,c,d){const a=new Date;a.setTime(a.getTime()+d*24*60*60*1e3);let e="expires="+a.toUTCString();document.cookie=b+"="+c+";"+e+";path=/"}function getCookie(c){let a=c+"=",d=decodeURIComponent(document.cookie),b=d.split(';');for(let d=0;d<b.length;d++){let c=b[d];while(c.charAt(0)==' ')c=c.substring(1);if(c.indexOf(a)==0)return c.substring(a.length,c.length)}return!1}getURLParameter('utm_source')!==!1&&(setCookie('bs_utm_data',getURLParameter('utm_source')+'|'+getURLParameter('utm_medium')+'|'+getURLParameter('utm_term')+'|'+getURLParameter('utm_content')+'|'+getURLParameter('utm_campaign'),60),getCookie('bs_landing_page')===!1&&setCookie('bs_landing_page',window.location.href.split('?')[0],60),document.referrer!=''&&document.referrer.indexOf(location.protocol+"//"+location.host)!==0&&getCookie('bs_referer')===!1&&setCookie('bs_referer',document.referrer,60));
var wpcf7_redirect;(function(a){function b(){this.init=function(){this.wpcf7_redirect_mailsent_handler()},this.wpcf7_redirect_mailsent_handler=function(){document.addEventListener('wpcf7mailsent',function(d){var e=a(d.target),b,c;a(document.body).trigger('wpcf7r-mailsent',[d]),typeof d.detail.apiResponse!='undefined'&&d.detail.apiResponse&&(b=d.detail.apiResponse,c=0,typeof b.api_url_request!='undefined'&&b.api_url_request&&wpcf7_redirect.handle_api_action(b.api_url_request),typeof b.api_json_xml_request!='undefined'&&b.api_json_xml_request&&wpcf7_redirect.handle_api_action(b.api_json_xml_request),typeof b.FireScript!='undefined'&&b.FireScript&&(c=typeof b.FireScript.delay_redirect!='undefined'?b.FireScript.delay_redirect:c,window.setTimeout(function(){wpcf7_redirect.handle_javascript_action(b.FireScript)},c)),typeof b.popup!='undefined'&&b.popup&&wpcf7_redirect.handle_popups(b.popup),typeof b.redirect_to_paypal!='undefined'&&b.redirect_to_paypal&&(c=typeof b.redirect_to_paypal.delay_redirect!='undefined'?b.redirect_to_paypal.delay_redirect:c,window.setTimeout(function(){wpcf7_redirect.handle_redirect_action(b.redirect_to_paypal)},c)),typeof b.redirect!='undefined'&&b.redirect&&(c=typeof b.redirect.delay_redirect!='undefined'?b.redirect.delay_redirect:c,window.setTimeout(function(){wpcf7_redirect.handle_redirect_action(b.redirect)},c)))},!1),document.addEventListener('wpcf7invalid',function(b){var c=a(b.target);a(document.body).trigger('wpcf7r-invalid',[b]),typeof b.detail.apiResponse!='undefined'&&b.detail.apiResponse&&(response=b.detail.apiResponse,response.invalidFields&&wpcf7_redirect.ninja_multistep_mov_to_invalid_tab(b,response))})},this.handle_popups=function(b){a(document.body).trigger('wpcf7r-before-open-popup',[event]),a.each(b,function(d,c){var b=a(c['popup-template']);a(document.body).append(b),a(document.body).addClass(c['template-name']),window.setTimeout(function(){a(document.body).addClass('modal-popup-open'),b.addClass('is-open')},1e3),b.find('.close-button').on('click',function(){b.removeClass('is-open').addClass('fade'),a(document.body).removeClass('modal-popup-open'),window.setTimeout(function(){a('.wpcf7r-modal').remove(),a(document.body).trigger('wpcf7r-popup-removed',[b])},4e3)}),a(document.body).trigger('wpcf7r-popup-appended',[b])})},this.handle_api_action=function(b,c){a.each(b,function(b,a){if(!a.result_javascript)return;response=typeof a.api_response!='undefined'?a.api_response:'',c=typeof a.request!='undefined'?a.request:'',eval(a.result_javascript)})},this.ninja_multistep_mov_to_invalid_tab=function(e,f){var b,c,d;a('.fieldset-cf7mls-wrapper').length&&(b=a(e.target),c=f.invalidFields[0],d=a(c.into).parents('fieldset'),b.find('.fieldset-cf7mls').removeClass('cf7mls_current_fs'),d.addClass('cf7mls_current_fs').removeClass('cf7mls_back_fs'),b.find('.cf7mls_progress_bar').length&&(b.find('.cf7mls_progress_bar li').eq(b.find("fieldset.fieldset-cf7mls").index(previous_fs)).addClass("current"),b.find('.cf7mls_progress_bar li').eq(b.find("fieldset.fieldset-cf7mls").index(current_fs)).removeClass("active current")))},this.handle_redirect_action=function(b){a(document.body).trigger('wpcf7r-handle_redirect_action',[b]),a.each(b,function(d,b){var c=typeof b.delay!='undefined'&&b.delay?b.delay:'';c=c*1e3,window.setTimeout(function(b){var c=typeof b.redirect_url!='undefined'&&b.redirect_url?b.redirect_url:'',d=typeof b.type!='undefined'&&b.type?b.type:'';typeof b.form!='undefined'&&b.form?(a('body').append(b.form),a('#cf7r-result-form').submit()):c&&d=='redirect'?window.location=c:c&&d=='new_tab'&&window.open(c)},c,b)})},this.handle_javascript_action=function(b){a(document.body).trigger('wpcf7r-handle_javascript_action',[b]),a.each(b,function(b,a){eval(a)})},this.htmlspecialchars_decode=function(a){var b={'&amp;':'&','&#038;':"&",'&lt;':'<','&gt;':'>','&quot;':'"','&#039;':"'",'&#8217;':"’",'&#8216;':"‘",'&#8211;':"–",'&#8212;':"—",'&#8230;':"…",'&#8221;':'”'};return a.replace(/\&[\w\d\#]{2,5}\;/g,function(a){return b[a]})},this.init()}wpcf7_redirect=new b})(jQuery);
(function(a){'use strict';a(window).ready(function(){a('.agree-checkbox').prop('checked',!1),a('.wpcf7-submit').prop('disabled',!1)})})(jQuery);
!function(e){"use strict";"function"==typeof define&&define.amd?define(["jquery"],e):"object"==typeof module&&module.exports?module.exports=e(require("jquery")):jQuery&&!jQuery.fn.hoverIntent&&e(jQuery)}(function(a){"use strict";var i,r,u={interval:100,sensitivity:6,timeout:0},v=0,d=function(e){i=e.pageX,r=e.pageY},s=function(e,t,n,o){if(Math.sqrt((n.pX-i)*(n.pX-i)+(n.pY-r)*(n.pY-r))<o.sensitivity)return t.off(n.event,d),delete n.timeoutId,n.isActive=!0,e.pageX=i,e.pageY=r,delete n.pX,delete n.pY,o.over.apply(t[0],[e]);n.pX=i,n.pY=r,n.timeoutId=setTimeout(function(){s(e,t,n,o)},o.interval)},p=function(e){return"function"==typeof e};a.fn.hoverIntent=function(e,t,n){var o=v++,f=a.extend({},u);a.isPlainObject(e)?(f=a.extend(f,e),p(f.out)||(f.out=f.over)):f=p(t)?a.extend(f,{over:e,out:t,selector:n}):a.extend(f,{over:e,out:e,selector:t});var i=function(e){var r=a.extend({},e),u=a(this),t=u.data("hoverIntent");t||u.data("hoverIntent",t={});var v=t[o];v||(t[o]=v={id:o}),v.timeoutId&&(v.timeoutId=clearTimeout(v.timeoutId));var n=v.event="mousemove.hoverIntent.hoverIntent"+o;if("mouseenter"===e.type){if(v.isActive)return;v.pX=r.pageX,v.pY=r.pageY,u.off(n,d).on(n,d),v.timeoutId=setTimeout(function(){s(r,u,v,f)},f.interval)}else{if(!v.isActive)return;u.off(n,d),v.timeoutId=setTimeout(function(){var e,t,n,o,i;e=r,t=u,n=v,o=f.out,(i=t.data("hoverIntent"))&&delete i[n.id],o.apply(t[0],[e])},f.timeout)}};return this.on({"mouseenter.hoverIntent":i,"mouseleave.hoverIntent":i},f.selector)}});;
!function(c){c.fn.supersubs=function(t){var e=c.extend({},c.fn.supersubs.defaults,t);return this.each(function(){var t=c(this),d=c.meta?c.extend({},e,t.data()):e,i=t.find("ul").show(),h=c('<li id="menu-fontsize">&#8212;</li>').css({padding:0,position:"absolute",top:"-999em",width:"auto"}).appendTo(t)[0].clientWidth;c("#menu-fontsize").remove(),i.each(function(t){var i=c(this),e=i.children(),s=e.children("a"),n=e.css("white-space","nowrap").css("float");i.add(e).add(s).css({float:"none",width:"auto"});var a=i[0].clientWidth/h;(a+=d.extraWidth)>d.maxWidth?a=d.maxWidth:a<d.minWidth&&(a=d.minWidth),a+="em",i.css("width",a),e.css({float:n,width:"100%","white-space":"normal"}).each(function(){var t=c(this).children("ul"),i=void 0!==t.css("left")?"left":"right";t.css(i,"100%")})}).hide()})},c.fn.supersubs.defaults={minWidth:9,maxWidth:25,extraWidth:0}}(jQuery);;
!function(n){"use strict";var e,s,r,o,t,i,a,h,l,p,f,u,c,d,v,m,y,C=(r="sf-breadcrumb",o="sf-js-enabled",t="sf-with-ul",i="sf-arrows",(s=/iPhone|iPad|iPod/i.test(navigator.userAgent))&&n("html").css("cursor","pointer").on("click",n.noop),a=s,h="behavior"in(e=document.documentElement.style)&&"fill"in e&&/iemobile/i.test(navigator.userAgent),l=function(e,s){var t=o;s.cssArrows&&(t+=" "+i),e.toggleClass(t)},p=function(e){e.children("a").toggleClass(t)},f=function(e){var s=e.css("ms-touch-action");s="pan-y"===s?"auto":"pan-y",e.css("ms-touch-action",s)},u=function(e){var s=n(this),t=s.siblings(e.data.popUpSelector);0<t.length&&t.is(":hidden")&&(s.one("click.superfish",!1),"MSPointerDown"===e.type?s.trigger("focus"):n.proxy(c,s.parent("li"))())},c=function(){var e=n(this),s=y(e);clearTimeout(s.sfTimer),e.siblings().superfish("hide").end().superfish("show")},d=function(){var e=n(this),s=y(e);a?n.proxy(v,e,s)():(clearTimeout(s.sfTimer),s.sfTimer=setTimeout(n.proxy(v,e,s),s.delay))},v=function(e){e.retainPath=-1<n.inArray(this[0],e.$path),this.superfish("hide"),this.parents("."+e.hoverClass).length||(e.onIdle.call(m(this)),e.$path.length&&n.proxy(c,e.$path)())},m=function(e){return e.closest("."+o)},y=function(e){return m(e).data("sf-options")},{hide:function(e){if(this.length){var s=y(this);if(!s)return this;var t=!0===s.retainPath?s.$path:"",o=this.find("li."+s.hoverClass).add(this).not(t).removeClass(s.hoverClass).children(s.popUpSelector),i=s.speedOut;e&&(o.show(),i=0),s.retainPath=!1,s.onBeforeHide.call(o),o.stop(!0,!0).animate(s.animationOut,i,function(){var e=n(this);s.onHide.call(e)})}return this},show:function(){var e=y(this);if(!e)return this;var s=this.addClass(e.hoverClass).children(e.popUpSelector);return e.onBeforeShow.call(s),s.stop(!0,!0).animate(e.animation,e.speed,function(){e.onShow.call(s)}),this},destroy:function(){return this.each(function(){var e,s=n(this),t=s.data("sf-options");if(!t)return!1;e=s.find(t.popUpSelector).parent("li"),clearTimeout(t.sfTimer),l(s,t),p(e),f(s),s.off(".superfish").off(".hoverIntent"),e.children(t.popUpSelector).attr("style",function(e,s){return s.replace(/display[^;]+;?/g,"")}),t.$path.removeClass(t.hoverClass+" "+r).addClass(t.pathClass),s.find("."+t.hoverClass).removeClass(t.hoverClass),t.onDestroy.call(s),s.removeData("sf-options")})},init:function(i){return this.each(function(){var e=n(this);if(e.data("sf-options"))return!1;var s,t=n.extend({},n.fn.superfish.defaults,i),o=e.find(t.popUpSelector).parent("li");t.$path=(s=t,e.find("li."+s.pathClass).slice(0,s.pathLevels).addClass(s.hoverClass+" "+r).filter(function(){return n(this).children(s.popUpSelector).hide().show().length}).removeClass(s.pathClass)),e.data("sf-options",t),l(e,t),p(o),f(e),function(e,s){var t="li:has("+s.popUpSelector+")";n.fn.hoverIntent&&!s.disableHI?e.hoverIntent(c,d,t):e.on("mouseenter.superfish",t,c).on("mouseleave.superfish",t,d);var o="MSPointerDown.superfish";a||(o+=" touchend.superfish"),h&&(o+=" mousedown.superfish"),e.on("focusin.superfish","li",c).on("focusout.superfish","li",d).on(o,"a",s,u)}(e,t),o.not("."+r).superfish("hide",!0),t.onInit.call(this)})}});n.fn.superfish=function(e,s){return C[e]?C[e].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof e&&e?n.error("Method "+e+" does not exist on jQuery.fn.superfish"):C.init.apply(this,arguments)},n.fn.superfish.defaults={popUpSelector:"ul,.sf-mega",hoverClass:"sfHover",pathClass:"overrideThisToUse",pathLevels:1,delay:800,animation:{opacity:"show"},animationOut:{opacity:"hide"},speed:"normal",speedOut:"fast",cssArrows:!0,disableHI:!1,onInit:n.noop,onBeforeShow:n.noop,onShow:n.noop,onBeforeHide:n.noop,onHide:n.noop,onIdle:n.noop,onDestroy:n.noop},n.fn.extend({hideSuperfishUl:C.hide,showSuperfishUl:C.show})}(jQuery);;
!function(e){"function"==typeof define&&define.amd?define(["jquery"],function(n){return e(n)}):"object"==typeof module&&"object"==typeof module.exports?exports=e(require("jquery")):e(jQuery)}(function(e){void 0!==e.easing&&(e.easing.jswing=e.easing.swing);var t=Math.pow,u=Math.sqrt,r=Math.sin,i=Math.cos,a=Math.PI,c=1.70158,o=1.525*c,s=c+1,f=2*a/3,I=2*a/4.5;function O(n){var e=7.5625,t=2.75;return n<1/t?e*n*n:n<2/t?e*(n-=1.5/t)*n+.75:n<2.5/t?e*(n-=2.25/t)*n+.9375:e*(n-=2.625/t)*n+.984375}e.extend(e.easing,{def:"easeOutQuad",swing:function(n){return e.easing[e.easing.def](n)},easeInQuad:function(n){return n*n},easeOutQuad:function(n){return 1-(1-n)*(1-n)},easeInOutQuad:function(n){return n<.5?2*n*n:1-t(-2*n+2,2)/2},easeInCubic:function(n){return n*n*n},easeOutCubic:function(n){return 1-t(1-n,3)},easeInOutCubic:function(n){return n<.5?4*n*n*n:1-t(-2*n+2,3)/2},easeInQuart:function(n){return n*n*n*n},easeOutQuart:function(n){return 1-t(1-n,4)},easeInOutQuart:function(n){return n<.5?8*n*n*n*n:1-t(-2*n+2,4)/2},easeInQuint:function(n){return n*n*n*n*n},easeOutQuint:function(n){return 1-t(1-n,5)},easeInOutQuint:function(n){return n<.5?16*n*n*n*n*n:1-t(-2*n+2,5)/2},easeInSine:function(n){return 1-i(n*a/2)},easeOutSine:function(n){return r(n*a/2)},easeInOutSine:function(n){return-(i(a*n)-1)/2},easeInExpo:function(n){return 0===n?0:t(2,10*n-10)},easeOutExpo:function(n){return 1===n?1:1-t(2,-10*n)},easeInOutExpo:function(n){return 0===n?0:1===n?1:n<.5?t(2,20*n-10)/2:(2-t(2,-20*n+10))/2},easeInCirc:function(n){return 1-u(1-t(n,2))},easeOutCirc:function(n){return u(1-t(n-1,2))},easeInOutCirc:function(n){return n<.5?(1-u(1-t(2*n,2)))/2:(u(1-t(-2*n+2,2))+1)/2},easeInElastic:function(n){return 0===n?0:1===n?1:-t(2,10*n-10)*r((10*n-10.75)*f)},easeOutElastic:function(n){return 0===n?0:1===n?1:t(2,-10*n)*r((10*n-.75)*f)+1},easeInOutElastic:function(n){return 0===n?0:1===n?1:n<.5?-t(2,20*n-10)*r((20*n-11.125)*I)/2:t(2,-20*n+10)*r((20*n-11.125)*I)/2+1},easeInBack:function(n){return s*n*n*n-c*n*n},easeOutBack:function(n){return 1+s*t(n-1,3)+c*t(n-1,2)},easeInOutBack:function(n){return n<.5?t(2*n,2)*(2*(o+1)*n-o)/2:(t(2*n-2,2)*((o+1)*(2*n-2)+o)+2)/2},easeInBounce:function(n){return 1-O(1-n)},easeOutBounce:O,easeInOutBounce:function(n){return n<.5?(1-O(1-2*n))/2:(1+O(2*n-1))/2}})});;
window.NodeList&&!NodeList.prototype.forEach&&(NodeList.prototype.forEach=function(e,t){t=t||window;for(var i=0;i<this.length;i++)e.call(t,this[i],i,this)}),"undefined"==typeof Element||Element.prototype.matches||(Element.prototype.matches=Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector),"undefined"==typeof Element||Element.prototype.closest||(Element.prototype.closest=function(e){var t=this;do{if(Element.prototype.matches.call(t,e))return t;t=t.parentElement||t.parentNode}while(null!==t&&1===t.nodeType);return null}),"function"!=typeof Object.assign&&Object.defineProperty(Object,"assign",{value:function(e,t){"use strict";if(null==e)throw new TypeError("Cannot convert undefined or null to object");for(var i=Object(e),n=1;n<arguments.length;n++){var o=arguments[n];if(null!=o)for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(i[a]=o[a])}return i},writable:!0,configurable:!0}),"function"!==window.wpexEqualHeights&&(window.wpexEqualHeights=function(e,a,t){if(e&&a){t&&t.childNodes||(t=document);var i=t.querySelectorAll(e);i&&(i.forEach(function(t){"function"==typeof imagesLoaded?new imagesLoaded(t).on("always",function(e){n(t,!1)}):n(t,!1)}),window.addEventListener("resize",function(){i.forEach(function(e){n(e,!0)})}))}function n(e,i){var n=0,t=e.querySelectorAll(a);if(t&&(t.forEach(function(e){if(!e.classList.contains("vc_column-inner")||!e.closest(".vc_row.vc_inner")){i&&(e.style.height="");var t=e.getBoundingClientRect().height;n<t&&(n=t)}}),n&&(t.forEach(function(e){e.style.height=n+"px"}),"undefined"!=typeof Isotope))){var o=Isotope.data(e);o&&o.layout()}}}),"undefined"!=typeof jQuery&&(jQuery.fn.wpexEqualHeights=function(){this.get()&&console.log("The jQuery wpexEqualHeights prototype has been deprecated. Please use the new wpexEqualHeights function.")});var wpex={};!function(y){"use strict";(wpex={init:function(){this.config(),this.replaceNoJsClass(),this.bindEvents()},config:function(){this.config={localScrollOffset:0,localScrollSections:[],passiveListeners:this.passiveListenersSupport()}},replaceNoJsClass:function(){var e=document.body.className;e=e.replace(/wpex-no-js/,"wpex-js"),document.body.className=e},bindEvents:function(){var e=this;e.domReady(function(){document.body.classList.add("wpex-docready"),e.retinaCheck()&&document.body.classList.add("wpex-is-retina"),e.mobileCheck()&&document.body.classList.add("wpex-is-mobile-device"),e.localScrollSections(),e.megaMenuAddClasses(),e.superfish(),e.dropdownMenuOnclick(),e.dropdownMenuTouch(),e.mobileMenu(),e.hideEditLink(),e.menuWidgetAccordion(),e.inlineHeaderLogo(),e.menuSearch(),e.menuCart(),e.skipToContent(),e.backTopLink(),e.goBackButton(),e.smoothCommentScroll(),e.toggleElements(),e.toggleBar(),e.localScrollLinks(),e.customSelects(),e.lightbox(),e.masonryGrids(),e.hoverStyles(),e.overlaysMobileSupport(),e.accessability()}),window.addEventListener("load",function(){document.body.classList.add("wpex-window-loaded"),e.megaMenusWidth(),e.megaMenusTop(),e.parallax(),e.stickyTopBar(),e.vcTabsTogglesJS(),e.headerOverlayOffset(),e.equalHeights(),e.localScrollHighlight(),e.stickyHeader(),e.stickyHeaderMenu(),e.parseLocalScrollOffset("init"),e.footerReveal(),e.fixedFooter(),y.scrollToHash&&window.setTimeout(function(){e.scrollToHash(e)},parseInt(y.scrollToHashTimeout))}),window.addEventListener("resize",function(){e.parseLocalScrollOffset("resize")})},superfish:function(){"function"==typeof jQuery&&"function"==typeof jQuery.fn.superfish&&jQuery("#site-navigation ul.sf-menu").superfish({delay:wpex_superfish_params.delay,speed:wpex_superfish_params.speed,speedOut:wpex_superfish_params.speedOut,cssArrows:!1,disableHI:!1,animation:{opacity:"show"},animationOut:{opacity:"hide"}})},dropdownMenuOnclick:function(){document.addEventListener("click",function(e){var t=e.target;if(t.closest(".wpex-dropdown-menu--onclick .menu-item-has-children > a")){document.querySelectorAll(".wpex-dropdown-menu--onclick .menu-item-has-children").forEach(function(e){e.contains(t)||e.classList.remove("wpex-active")});var i=t.closest(".menu-item-has-children"),n=t.closest("a");i.classList.contains("wpex-active")?(i.classList.remove("wpex-active"),"#"===n.getAttribute("href")&&e.preventDefault()):(i.classList.add("wpex-active"),e.preventDefault())}else document.querySelectorAll(".wpex-dropdown-menu--onclick .menu-item-has-children").forEach(function(e){e.classList.remove("wpex-active")})}),document.addEventListener("keydown",function(e){var t=e.keyCode||e.which,i=e.target.closest(".wpex-dropdown-menu--onclick .menu-item-has-children.wpex-active");27===t&&i&&i.classList.remove("wpex-active")}),document.querySelectorAll(".wpex-dropdown-menu--onclick .sub-menu").forEach(function(e){e.addEventListener("keydown",function(e){if(27===(e.keyCode||e.which)){var t=e.target.closest(".menu-item-has-children.wpex-active");if(t)t.classList.remove("wpex-active"),t.querySelector("a").focus(),e.stopPropagation()}})})},dropdownMenuTouch:function(){var e=this,n=!1;document.querySelectorAll(".wpex-dropdown-menu--onhover .menu-item-has-children > a").forEach(function(i){i.addEventListener("touchend",function(e){if(!n){var t=i.closest(".menu-item-has-children");t.classList.contains("wpex-touched")||(e.preventDefault(),t.classList.add("wpex-touched"))}}),i.addEventListener("touchmove",function(e){n=!0},!!e.config.passiveListeners&&{passive:!0}),i.addEventListener("touchstart",function(e){n=!1},!!e.config.passiveListeners&&{passive:!0})});var t=function(e){var t=e.target;document.querySelectorAll(".menu-item-has-children.wpex-touched").forEach(function(e){e.contains(t)||e.classList.remove("wpex-touched")})};document.addEventListener("touchstart",t,!!e.config.passiveListeners&&{passive:!0}),document.addEventListener("touchmove",t,!!e.config.passiveListeners&&{passive:!0})},megaMenuAddClasses:function(){document.querySelectorAll(".main-navigation-ul .megamenu > .sub-menu").forEach(function(e){e.querySelectorAll(".sub-menu").forEach(function(e){e.classList.add("megamenu__inner-ul")})})},megaMenusWidth:function(){var e=document.querySelector("#site-navigation-wrap.wpex-stretch-megamenus");if(this.isVisible(e)){var o=e.querySelectorAll(".megamenu > ul");o.length&&(t(),window.addEventListener("resize",t),window.addEventListener("orientationchange",t))}function t(){var t=document.querySelector("#site-header.header-one .container").getBoundingClientRect().width,i=e.getBoundingClientRect().width,n=parseInt(window.getComputedStyle(e).right)||0;o.forEach(function(e){e.style.width=t+"px",e.style.marginLeft=-(t-i-n)+"px"})}},megaMenusTop:function(){var i=this,n=document.querySelector("#site-navigation-wrap.wpex-stretch-megamenus:not(.wpex-flush-dropdowns)");if(this.isVisible(n)){var o=n.querySelectorAll(".megamenu > ul");if(o){var a=document.querySelector("#site-header.header-one");t(),window.addEventListener("scroll",t,!!i.config.passiveListeners&&{passive:!0}),window.addEventListener("resize",t),n.querySelectorAll(".megamenu > a").forEach(function(e){e.addEventListener("mouseenter",t,!1)})}}function t(){if(i.isVisible(n)){var e=n.getBoundingClientRect().height,t=(a.getBoundingClientRect().height-e)/2+e;o.forEach(function(e){e.style.top=t+"px"})}}},mobileMenu:function(){switch(y.mobileMenuStyle){case"sidr":this.mobileMenuSidr();break;case"toggle":this.mobileMenuToggle();break;case"full_screen":this.mobileMenuFullScreen()}},mobileMenuSidr:function(){if(void 0!==y.sidrSource&&void 0!==window.sidr){var n=window.sidr,o=this,e=document.body,t=document.querySelector("a.mobile-menu-toggle, li.mobile-menu-toggle > a"),i=document.createElement("div");i.className="wpex-sidr-overlay wpex-hidden",e.appendChild(i),n.new("a.mobile-menu-toggle, li.mobile-menu-toggle > a",{name:"sidr-main",source:y.sidrSource,side:y.sidrSide,timing:"ease-in-out",displace:y.sidrDisplace,speed:parseInt(y.sidrSpeed),renaming:!0,bind:"click",onOpen:function(){t&&(t.setAttribute("aria-expanded","true"),t.classList.add("wpex-active")),y.sidrBodyNoScroll&&e.classList.add("wpex-noscroll"),i&&(i.classList.remove("wpex-hidden"),i.classList.add("wpex-custom-cursor")),o.focusOnElement(document.querySelector("#sidr-main"))},onClose:function(){t&&(t.setAttribute("aria-expanded","false"),t.classList.remove("wpex-active")),y.sidrBodyNoScroll&&e.classList.remove("wpex-noscroll"),i&&(i.classList.remove("wpex-custom-cursor"),i.classList.add("wpex-hidden"))},onCloseEnd:function(){document.querySelectorAll(".sidr-class-menu-item-has-children.active").forEach(function(e){e.classList.remove("active");var t=e.querySelector("ul");t&&(t.style.display="");var i=e.querySelector("a");if(i){var n=i.querySelector(".wpex-open-submenu");n&&(n.setAttribute("aria-label",y.i18n.openSubmenu.replace("%s",i.textContent.trim())),n.setAttribute("aria-expanded","false"))}}),y.sidrDisplace&&"function"==typeof window.vc_rowBehaviour&&setTimeout(window.vc_rowBehaviour)}});var a=document.querySelector("#sidr-main"),r=a.querySelector(".sidr-inner");a.classList.add("wpex-mobile-menu");var s=document.createElement("div");s.className="sidr-class-wpex-close";var c=document.createElement("a");c.href="#",c.setAttribute("role","button"),s.appendChild(c);var l=document.createElement("span");l.className="sidr-class-wpex-close__icon",l.setAttribute("aria-hidden","true"),l.innerHTML="&times;",c.appendChild(l);var d=document.createElement("span");d.className="screen-reader-text",d.textContent=y.mobileMenuCloseAriaLabel,c.appendChild(d),a.insertBefore(s,a.firstChild),o.insertExtras(document.querySelector(".wpex-mobile-menu-top"),r,"prepend"),o.insertExtras(document.querySelector(".wpex-mobile-menu-bottom"),r,"append");var u=a.querySelector(".sidr-class-main-navigation-ul");u&&u.classList.add("sidr-class-dropdown-menu"),o.menuAccordion(document.querySelector("#sidr-main .sidr-class-dropdown-menu")),o.removeClassPrefix(a.querySelectorAll('[class*="sidr-class-fa"]'),/^sidr-class-fa/,"sidr-class-"),o.removeClassPrefix(a.querySelectorAll('[class*="sidr-class-ticon"]'),/^sidr-class-ticon/,"sidr-class-"),o.removeClassPrefix(a.querySelectorAll("[class^=sidr-class-wpex-cart-link]"),/^sidr-class-wpex/,"sidr-class-"),o.removeClassPrefix(a.querySelectorAll(".sidr-class-screen-reader-text"),/^sidr-class-screen-reader-text/,"sidr-class-"),document.addEventListener("click",function(e){e.target.closest(".sidr-class-wpex-close")&&(e.preventDefault(),n.close("sidr-main"),t&&t.focus())}),window.addEventListener("resize",function(){o.viewportWidth()>=y.mobileMenuBreakpoint&&n.close("sidr-main")}),o.config.localScrollSections&&document.addEventListener("click",function(e){var t=e.target.closest("li.sidr-class-local-scroll > a");if(t){var i=t.hash;i&&-1!==o.config.localScrollSections.indexOf(i)&&(n.close("sidr-main"),o.scrollTo(i),e.preventDefault(),e.stopPropagation())}}),i.addEventListener("click",function(e){n.close("sidr-main"),e.preventDefault()}),a.addEventListener("keydown",function(e){27===(e.keyCode||e.which)&&(n.close("sidr-main"),t&&t.focus())});var f=document.querySelector("#mobile-menu-alternative");f&&f.parentNode.removeChild(f)}},mobileMenuToggle:function(){var e,t,i=this,n=y.mobileToggleMenuPosition,o="",a=document.querySelector("#mobile-menu-alternative");if(a){var r=a.querySelector(".dropdown-menu");r&&(o=r.innerHTML),a.parentNode.removeChild(a)}if(!o){var s=document.querySelector(".main-navigation-ul");s&&(o=s.innerHTML)}var c=document.createElement("nav");c.className="mobile-toggle-nav wpex-mobile-menu wpex-clr wpex-togglep-"+n,c.setAttribute("aria-label",y.mobileMenuAriaLabel),"fixed_top"===y.mobileMenuToggleStyle?(e=document.querySelector("#wpex-mobile-menu-fixed-top"))&&e.appendChild(c):"absolute"===n?e="navbar"===y.mobileMenuToggleStyle?document.querySelector("#wpex-mobile-menu-navbar"):document.querySelector("#site-header"):t="afterself"===n?document.querySelector("#wpex-mobile-menu-navbar"):document.querySelector("#site-header"),e?e.appendChild(c):t&&i.insertAfter(c,t);var l=document.createElement("div");l.className="mobile-toggle-nav-inner container";var d=document.createElement("ul");d.className="mobile-toggle-nav-ul",d.innerHTML=o,l.appendChild(d),c.appendChild(l),document.querySelectorAll(".mobile-toggle-nav-ul, .mobile-toggle-nav-ul *").forEach(function(e){e.removeAttribute("style"),e.removeAttribute("id")});var u=document.querySelector("#mobile-menu-search");if(u){var f=document.createElement("div");f.className="mobile-toggle-nav-search",l.appendChild(f),f.appendChild(u),u.classList.remove("wpex-hidden")}i.insertExtras(document.querySelector(".wpex-mobile-menu-top"),l,"prepend"),i.insertExtras(document.querySelector(".wpex-mobile-menu-bottom"),l,"append"),i.menuAccordion(c);var p=document.querySelector("a.mobile-menu-toggle, li.mobile-menu-toggle > a");function m(){y.animateMobileToggle?i.slideUp(c,300,function(){c.classList.remove("visible")}):c.classList.remove("visible"),c.querySelectorAll("li.active > ul").forEach(function(e){i.slideUp(e)}),c.querySelectorAll(".active").forEach(function(e){e.classList.remove("active")}),p&&(p.classList.remove("wpex-active"),p.setAttribute("aria-expanded","false"))}document.addEventListener("click",function(){event.target.closest(".mobile-menu-toggle")?(event.preventDefault(),c.classList.contains("wpex-transitioning")||(c.classList.contains("visible")?m():(y.animateMobileToggle?i.slideDown(c,300,function(){i.focusOnElement(c),c.classList.add("visible")}):(c.classList.add("visible"),i.focusOnElement(c)),p&&(p.classList.add("wpex-active"),p.setAttribute("aria-expanded","true"))))):c.classList.contains("visible")&&!event.target.closest(".mobile-toggle-nav")&&m()}),c.addEventListener("keydown",function(e){var t=e.keyCode||e.which;c.classList.contains("visible")&&27===t&&(m(),p&&p.focus())}),window.addEventListener("resize",function(){c.classList.contains("visible")&&i.viewportWidth()>=y.mobileMenuBreakpoint&&m()})},mobileMenuFullScreen:function(){var n=this,e=null,i=document.querySelector(".mobile-menu-toggle"),t=document.querySelector("#mobile-menu-alternative");if(t)e=t.innerHTML,t.parentNode.removeChild(t);else{var o=document.querySelector("#site-navigation .main-navigation-ul");o&&(e=o.innerHTML)}if(e){var a=document.createElement("div");a.className="full-screen-overlay-nav wpex-mobile-menu wpex-clr",y.fullScreenMobileMenuStyle&&a.classList.add(y.fullScreenMobileMenuStyle),a.setAttribute("aria-expanded","false"),document.body.appendChild(a);var r=document.createElement("button");r.className="full-screen-overlay-nav-close",a.appendChild(r);var s=document.createElement("span");s.className="full-screen-overlay-nav-close__icon",s.innerHTML="&times;",s.setAttribute("aria-hidden","true"),r.appendChild(s);var c=document.createElement("span");c.className="screen-reader-text",c.textContent=y.mobileMenuCloseAriaLabel,r.appendChild(c);var l=document.createElement("div");l.className="full-screen-overlay-nav-content",a.appendChild(l);var d=document.createElement("div");d.className="full-screen-overlay-nav-content-inner",l.appendChild(d);var u=document.createElement("nav");u.className="full-screen-overlay-nav-menu",d.appendChild(u);var f=document.createElement("ul");u.appendChild(f),f.innerHTML=e,document.querySelectorAll(".full-screen-overlay-nav, .full-screen-overlay-nav *").forEach(function(e){e.removeAttribute("style"),e.removeAttribute("id")}),n.insertExtras(document.querySelector(".wpex-mobile-menu-top"),d,"prepend"),n.insertExtras(document.querySelector(".wpex-mobile-menu-bottom"),d,"append");var p=document.querySelector("#mobile-menu-search");if(p){var m=document.createElement("li");m.className="wpex-search",f.appendChild(m),m.appendChild(p),p.classList.remove("wpex-hidden")}var v=!1;document.addEventListener("click",function(e){var i=e.target.closest(".full-screen-overlay-nav-menu li.menu-item-has-children > a");if(i){var t=i.parentNode;if(!t.classList.contains("local-scroll"))return v?(e.preventDefault(),void e.stopPropagation()):void(t.classList.contains("wpex-active")?(t.classList.remove("wpex-active"),t.querySelectorAll("li").forEach(function(e){e.classList.remove("wpex-active")}),t.querySelectorAll("ul").forEach(function(e){v=!0,n.slideUp(e,300,function(){v=!1})}),t.classList.contains("nav-no-click")&&(e.preventDefault(),e.stopPropagation())):(a.querySelectorAll(".menu-item-has-children").forEach(function(e){if(!e.contains(i)&&e.classList.contains("wpex-active")){var t=e.querySelector(":scope > ul");t&&(e.classList.remove("wpex-active"),v=!0,n.slideUp(t,300,function(){v=!1}))}}),t.classList.add("wpex-active"),v=!0,n.slideDown(t.querySelector(":scope > ul"),300,function(){v=!1}),e.preventDefault(),e.stopPropagation()))}}),document.addEventListener("click",function(e){var t=e.target.closest(".full-screen-overlay-nav-menu .local-scroll > a");if(t){var i=t.hash;i&&-1!==n.config.localScrollSections.indexOf(i)&&(h(),e.preventDefault(),e.stopPropagation())}}),i.addEventListener("click",function(e){e.target.closest(".mobile-menu-toggle")&&(a.classList.contains("visible")?h():function(){a.classList.add("visible"),a.setAttribute("aria-expanded","true"),i&&i.setAttribute("aria-expanded","true");document.body.classList.add("wpex-noscroll");var t=function(e){n.focusOnElement(a),a.removeEventListener("transitionend",t)};a.addEventListener("transitionend",t)}(),e.preventDefault(),e.stopPropagation())}),document.addEventListener("click",function(e){e.target.closest(".full-screen-overlay-nav-close")&&(h(),i&&i.focus(),e.preventDefault(),e.stopPropagation())}),a.addEventListener("keydown",function(e){var t=e.keyCode||e.which;a.classList.contains("visible")&&27===t&&(h(),i&&i.focus())})}function h(){a.classList.remove("visible"),a.setAttribute("aria-expanded","false"),i&&i.setAttribute("aria-expanded","false"),a.querySelectorAll(".wpex-active").forEach(function(e){e.classList.remove("wpex-active");var t=e.querySelector(":scope > ul");t&&(t.style.display="none")}),document.body.classList.remove("wpex-noscroll")}},menuSearch:function(){var e=document.querySelector(".header-searchform-wrap");if(e){var t=e.querySelector('input[type="search"]');t&&(e&&(e.dataset.placeholder&&t.setAttribute("placeholder",e.dataset.placeholder),e.dataset.disableAutocomplete&&t.setAttribute("autocomplete","off")),this.menuSearchDropdown(),this.menuSearchOverlay(),this.menuSearchHeaderReplace())}},menuSearchDropdown:function(){var i=this,n=document.querySelector("#searchform-dropdown");if(n){var o=!1,t=null,a=n.querySelector('input[type="search"]'),r=function(){n.classList.remove("show"),document.querySelectorAll("a.search-dropdown-toggle, a.mobile-menu-search").forEach(function(e){e.setAttribute("aria-expanded","false");var t=e.closest("li");t&&t.classList.remove("active")}),t&&t.focus(),o=!1};document.addEventListener("click",function(e){(t=e.target.closest("a.search-dropdown-toggle, a.mobile-menu-search"))?(e.preventDefault(),o?r():function(){n.classList.add("show"),document.querySelectorAll("a.search-dropdown-toggle, a.mobile-menu-search").forEach(function(e){e.setAttribute("aria-expanded","true");var t=e.closest("li");t&&t.classList.add("active")}),a.value="","function"==typeof jQuery&&jQuery(document).trigger("show.wpex.menuSearch");var t=function(e){i.focusOnElement(n,a),n.removeEventListener("transitionend",t)};n.addEventListener("transitionend",t),o=!0}()):!e.target.closest("#searchform-dropdown")&&o&&r()}),n.addEventListener("keydown",function(e){27===(e.keyCode||e.which)&&o&&r()})}},menuSearchOverlay:function(){var i=this,n=document.querySelector("#wpex-searchform-overlay");if(n){var o=!1,a=null,r=n.querySelector('input[type="search"]'),s=function(){n.classList.remove("active"),document.querySelectorAll("a.search-overlay-toggle, a.mobile-menu-search, li.search-overlay-toggle > a").forEach(function(e){e.setAttribute("aria-expanded","false");var t=e.closest("li");t&&t.classList.remove("active")}),a&&a.focus(),o=!1};document.addEventListener("click",function(e){var t=e.target.closest("a.search-overlay-toggle, a.mobile-menu-search, li.search-overlay-toggle > a");t?(a=t,e.preventDefault(),o?s():function(){n.classList.add("active"),document.querySelectorAll("a.search-overlay-toggle, a.mobile-menu-search, li.search-overlay-toggle > a").forEach(function(e){e.setAttribute("aria-expanded","true");var t=e.closest("li");t&&t.classList.add("active")}),r.value="","function"==typeof jQuery&&jQuery(document).trigger("show.wpex.menuSearch");var t=function(e){i.focusOnElement(n,r),n.removeEventListener("transitionend",t)};n.addEventListener("transitionend",t),o=!0}()):e.target.closest("#wpex-searchform-overlay .wpex-close")&&o&&s()}),n.addEventListener("keydown",function(e){27===(e.keyCode||e.which)&&o&&s()})}},menuSearchHeaderReplace:function(){var i=this,n=document.querySelector("#searchform-header-replace");if(n){var o=!1,a=null,r=n.querySelector('input[type="search"]'),s=function(){n.classList.remove("show"),document.querySelectorAll("a.search-header-replace-toggle, a.mobile-menu-search").forEach(function(e){e.setAttribute("aria-expanded","false");var t=e.closest("li");t&&t.classList.remove("active")}),a&&a.focus(),o=!1};document.addEventListener("click",function(e){var t=e.target.closest("a.search-header-replace-toggle, a.mobile-menu-search");t?(a=t,e.preventDefault(),o?s():function(){n.classList.add("show"),document.querySelectorAll("a.search-header-replace-toggle, a.mobile-menu-search").forEach(function(e){e.setAttribute("aria-expanded","true");var t=e.closest("li");t&&t.classList.add("active")}),r.value="","function"==typeof jQuery&&jQuery(document).trigger("show.wpex.menuSearch");var t=function(e){i.focusOnElement(n,r),n.removeEventListener("transitionend",t)};n.addEventListener("transitionend",t),o=!0}()):!e.target.closest("#searchform-header-replace .searchform")&&o&&s()}),n.addEventListener("keydown",function(e){27===(e.keyCode||e.which)&&o&&s()})}},menuCart:function(){var e=document.querySelector("a.wcmenucart");e&&e.classList.contains("go-to-shop")||(this.menuCartDropdown(),this.menuCartOverlay())},menuCartDropdown:function(){var i=this,n=document.querySelector("#current-shop-items-dropdown");if(n){var t=null,o=!1,a=function(){n.classList.remove("show"),document.querySelectorAll("a.toggle-cart-widget, li.toggle-cart-widget > a, li.toggle-header-cart > a").forEach(function(e){e.classList.remove("active"),e.setAttribute("aria-expanded","false")}),t&&t.focus(),o=!1};document.addEventListener("click",function(e){(t=e.target.closest("a.toggle-cart-widget, li.toggle-cart-widget > a, li.toggle-header-cart > a"))?(e.preventDefault(),o?a():function(){n.classList.add("show"),document.querySelectorAll("a.toggle-cart-widget, li.toggle-cart-widget > a, li.toggle-header-cart > a").forEach(function(e){e.classList.add("active"),e.setAttribute("aria-expanded","true")}),"function"==typeof jQuery&&jQuery(document).trigger("show.wpex.menuCart");var t=function(e){i.focusOnElement(n),n.removeEventListener("transitionend",t)};n.addEventListener("transitionend",t),o=!0}()):!e.target.closest("#current-shop-items-dropdown")&&o&&a()}),document.addEventListener("keydown",function(e){27===(e.keyCode||e.which)&&o&&a()})}},menuCartOverlay:function(){var i=this,n=document.querySelector("#wpex-cart-overlay");if(n){var o=null,a=!1,r=function(){n.classList.remove("active"),document.querySelectorAll("a.toggle-cart-widget, li.toggle-cart-widget > a, li.toggle-header-cart > a").forEach(function(e){e.classList.remove("active"),e.setAttribute("aria-expanded","false")}),o&&o.focus(),a=!1};document.addEventListener("click",function(e){var t=e.target.closest("a.toggle-cart-widget, li.toggle-cart-widget > a, li.toggle-header-cart > a");t?(o=t,e.preventDefault(),a?r():function(){n.classList.add("active"),document.querySelectorAll("a.toggle-cart-widget, li.toggle-cart-widget > a, li.toggle-header-cart > a").forEach(function(e){e.classList.add("active"),e.setAttribute("aria-expanded","true")}),"function"==typeof jQuery&&jQuery(document).trigger("show.wpex.menuCart");var t=function(e){i.focusOnElement(n),n.removeEventListener("transitionend",t)};n.addEventListener("transitionend",t),a=!0}()):!e.target.closest("#wpex-cart-overlay .wpex-inner")&&a&&r()}),document.addEventListener("keydown",function(e){27===(e.keyCode||e.which)&&a&&r()})}},headerOverlayOffset:function(){var e=document.querySelector("#site-header");if(e&&e.classList.contains("overlay-header")){var t=document.querySelectorAll(".add-overlay-header-offset");if(t.length){var i=e.getBoundingClientRect().height;t.forEach(function(e){var t=document.createElement("div");t.className="overlay-header-offset-div wpex-w-100",e.prepend(t),n(t),e.setAttribute("data-wpex-overlay-header-offset-init","true")}),window.addEventListener("resize",function(){i=e.getBoundingClientRect().height,document.querySelectorAll(".overlay-header-offset-div").forEach(function(e){n(e)})})}}function n(e){e.style.height=i+"px"}},hideEditLink:function(){document.addEventListener("click",function(e){var t=e.target.closest("a.hide-post-edit");if(t){e.preventDefault();var i=t.closest("div.post-edit");i&&i.parentNode.removeChild(i)}})},menuWidgetAccordion:function(){var r=this,s=!1;if(y.menuWidgetAccordion){document.querySelectorAll("#sidebar .widget_nav_menu .current-menu-ancestor, .widget_nav_menu_accordion .widget_nav_menu .current-menu-ancestor,#sidebar .widget_nav_menu .current-menu-item, .widget_nav_menu_accordion .widget_nav_menu .current-menu-item").forEach(function(e){e.classList.add("active")}),document.querySelectorAll("#sidebar .widget_nav_menu, .widget_nav_menu_accordion .widget_nav_menu").forEach(function(e){e.querySelectorAll(".menu-item-has-children").forEach(function(e){e.classList.add("parent")})});var c=function(e){s=!0,r.slideUp(e,300,function(){s=!1})};document.addEventListener("click",function(e){var i=e.target.closest("#sidebar .widget_nav_menu .menu-item-has-children > a, .widget_nav_menu_accordion .widget_nav_menu .menu-item-has-children > a");if(i&&(e.preventDefault(),e.stopPropagation(),!s)){var t,n=i.parentNode,o=i.closest(".widget_nav_menu"),a=n.querySelector(".sub-menu");if(o.querySelectorAll(".menu-item-has-children").forEach(function(e){if(!e.contains(i)){var t=e.querySelector(".sub-menu");t&&e.classList.contains("active")&&(e.classList.remove("active"),c(t))}}),a)if(!a.classList.contains("wpex-transitioning"))n.classList.contains("active")?(n.classList.remove("active"),c(a)):(n.classList.add("active"),t=a,s=!0,r.slideDown(t,300,function(){s=!1}))}})}},inlineHeaderLogo:function(){var o=this,e=document.querySelector("#site-header");if(e&&e.classList.contains("header-five")){var t=document.querySelector("#site-header.header-five #site-header-inner > .header-five-logo"),i=document.querySelector("#site-header.header-five .navbar-style-five"),n=null;if(t&&i){var a=function(){var e=function(){for(var e=document.querySelectorAll(".navbar-style-five .main-navigation-ul > li"),t=[],i=0;i<e.length;i++)o.isVisible(e[i])&&t.push(e[i]);var n=t.length;return t[Math.round(n/2)-parseInt(y.headerFiveSplitOffset)]}();e&&o.viewportWidth()>y.mobileMenuBreakpoint&&(n||((n=document.createElement("li")).className="menu-item-logo"),n.appendChild(t),e.parentNode.insertBefore(n,e.nextSibling),t.classList.add("display"))};a(),window.addEventListener("resize",function(){var e=document.querySelector(".menu-item-logo .header-five-logo");if(o.viewportWidth()<=y.mobileMenuBreakpoint){if(e){var t=document.querySelector("#site-header-inner");t&&t.insertBefore(e,t.firstChild),n&&n.parentNode.removeChild(n)}}else e||a()})}}},skipToContent:function(){var i=this;document.addEventListener("click",function(e){if(e.target.classList.contains("skip-to-content")){var t=document.querySelector(e.target.getAttribute("href"));t&&(t.setAttribute("tabIndex","-1"),i.scrollTo(t,i.offset(t).top-i.config.localScrollOffset),t.focus()),e.preventDefault(),e.stopPropagation()}})},backTopLink:function(){var a=this;document.addEventListener("click",function(e){var t=e.target;if(t.closest("a#site-scroll-top, a.wpex-scroll-top, .wpex-scroll-top a")){var i=t.closest("#site-scroll-top");i&&(t=i);var n=parseInt(t.dataset.scrollSpeed||parseInt(y.localScrollSpeed)),o=a.getEasing(t.dataset.scrollEasing);o&&"function"==typeof jQuery?jQuery("html, body").stop(!0,!0).animate({scrollTop:0},n,o):window.scrollTo({top:0,behavior:"smooth"}),e.preventDefault(),e.stopPropagation()}});var t=document.querySelector("#site-scroll-top");if(t){var i=t.dataset.scrollOffset||100;if(0!==i){window.addEventListener("scroll",function(e){window.pageYOffset>i?t.classList.add("show"):t.classList.remove("show")},!!a.config.passiveListeners&&{passive:!0})}}},goBackButton:function(){document.querySelectorAll(".wpex-go-back").forEach(function(e){e.addEventListener("click",function(e){e.preventDefault(),history.back()})})},smoothCommentScroll:function(){var i=this;document.addEventListener("click",function(e){if(e.target.closest(".comments-link")){var t=document.querySelector("#comments");t&&(i.scrollTo(t,i.offset(t).top-i.config.localScrollOffset-20),e.preventDefault(),e.stopPropagation())}})},toggleElements:function(){document.addEventListener("click",function(e){var t=e.target.closest("a.wpex-toggle-element-trigger");if(t){var i=function(e){var t=e.getAttribute("aria-controls");if(t)return document.querySelector(t)}(t);if(i){e.preventDefault();var n=i.parentNode,o=t.closest(".vc_section")||t.closest(".vc_row"),a=i.classList.contains("wpex-toggle-element--visible"),r=!1;o.contains(i)&&(r=!0);var s=r?o:document;s.querySelectorAll(".wpex-toggle-element--visible").forEach(function(e){e.classList.remove("wpex-toggle-element--visible")}),s.querySelectorAll("a.wpex-toggle-element-trigger").forEach(function(e){e.setAttribute("aria-expanded","false"),e.classList.remove("active")});i&&i.classList.contains("wpex-toggle-element")&&(a?(t.classList.contains("vcex-button")&&t.classList.remove("active"),i.classList.remove("wpex-toggle-element--visible"),t.setAttribute("aria-expanded","false")):(t.classList.contains("vcex-button")&&t.classList.add("active"),t.setAttribute("aria-expanded","true"),i.classList.add("wpex-toggle-element--visible"),n.classList.contains("wpex-toggle-element")?(n.classList.add("wpex-toggle-element--visible"),n.setAttribute("tabIndex","-1"),n.focus()):(i.setAttribute("tabIndex","-1"),i.focus()),window.dispatchEvent(new Event("resize"))))}}}),document.addEventListener("keydown",function(e){var t=e.target.closest(".wpex-toggle-element--visible");t&&27===e.keyCode&&document.querySelectorAll('.wpex-toggle-element-trigger[aria-expanded="true"]').forEach(function(e){e.getAttribute("href")==="#"+t.getAttribute("id")&&e.focus()})})},toggleBar:function(){var e=document.querySelector("#toggle-bar-wrap");if(e){var t=e.dataset.allowToggle;t&&"false"!==t?this.toggleBarToggle(e):this.toggleBarDismiss(e)}},toggleBarToggle:function(t){var i="true"===t.dataset.rememberState,n=document.querySelector("#toggle-bar-button");function o(){return t.dataset.state||"hidden"}function a(){if(t.classList.remove("active-bar"),t.dataset.state="hidden",n&&(n.setAttribute("aria-expanded","false"),n.dataset.iconHover&&n.dataset.icon)){var e=n.getElementsByClassName(n.dataset.iconHover);e.length&&(e[0].className=n.dataset.icon)}r("hidden")}function r(e){i&&(document.cookie="total_togglebar_state="+e+"; path=/; Max-Age=604800; SameSite=Strict; Secure")}document.addEventListener("click",function(e){e.target.closest("a.toggle-bar-btn, a.togglebar-toggle, .togglebar-toggle > a")?("hidden"===o()?function(){if(t.classList.add("active-bar"),t.dataset.state="visible",n&&(n.setAttribute("aria-expanded","true"),n.dataset.icon&&n.dataset.iconHover)){var e=n.getElementsByClassName(n.dataset.icon);e.length&&(e[0].className=n.dataset.iconHover)}r("visible")}():a(),e.preventDefault(),e.stopPropagation()):"visible"===o()&&t.classList.contains("close-on-doc-click")&&!e.target.closest("#toggle-bar-wrap")&&a()})},toggleBarDismiss:function(t){document.addEventListener("click",function(e){e.target.closest(".toggle-bar-dismiss__button")&&(t.parentNode.removeChild(t),"true"===t.dataset.rememberState&&(document.cookie="total_togglebar_state=hidden; path=/; Max-Age=604800; SameSite=Strict; Secure"),e.preventDefault())})},parallax:function(e){var m=this,t=function(){document.querySelectorAll(".wpex-parallax-bg").forEach(function(e){if(!e.classList.contains("not-mobile")||!m.mobileCheck()){var t=0,i=e.dataset.velocity,n=e.dataset.direction,o=e.dataset.fixed,a=e.getBoundingClientRect().height,r=m.offset(e).top,s=r+e.getBoundingClientRect().height,c=m.winScrollTop(),l=window.innerHeight;if(!(c+l+20<=r||s<=c-20)){l<r&&"none"!==n&&(t=(r-l)*Math.abs(i));var d=Math.ceil(t+c*i),u="50%",f="50%";switch(n){case"left":u=d+"px";break;case"right":u="calc(100% + "+-d+"px)";break;case"down":if("true"===o)f="calc(100% + "+-d+"px)";else{var p=window.getComputedStyle(e);f="calc(100% + "+(-(l-r-a-parseInt(p.getPropertyValue("padding-top"))-parseInt(p.getPropertyValue("padding-bottom")))-c-d)+"px)"}break;default:f="true"===o?d+"px":r-c+d+"px"}e.style.backgroundPosition=u+" "+f}}})};t(),window.addEventListener("scroll",t,!!m.config.passiveListeners&&{passive:!0})},parseLocalScrollOffset:function(e){var t=this,i=0;if(y.localScrollOffset)return t.config.localScrollOffset=y.localScrollOffset,t.config.localScrollOffset;y.localScrollExtraOffset&&(i=parseInt(i)+parseInt(y.localScrollExtraOffset));var n=document.querySelector("#site-header.fixed-scroll");return n&&(!y.hasStickyMobileHeader&&t.viewportWidth()<y.stickyHeaderBreakPoint?i=parseInt(i)+0:n.classList.contains("shrink-sticky-header")?("init"===e||t.isVisible(n))&&(i=parseInt(i)+parseInt(y.shrinkHeaderHeight)):i=parseInt(i)+n.getBoundingClientRect().height),document.querySelectorAll(".wpex-ls-offset,#wpadminbar,#top-bar-wrap-sticky-wrapper.wpex-can-sticky,#site-navigation-sticky-wrapper.wpex-can-sticky,#wpex-mobile-menu-fixed-top,.vcex-navbar-sticky-offset").forEach(function(e){t.isVisible(e)&&(i=parseInt(i)+e.getBoundingClientRect().height)}),i=i?i-1:0,t.config.localScrollOffset=i,t.config.localScrollOffset},scrollTo:function(e,t,i){if(e){for(var n=this,o=null,a=!1,r=n.config.localScrollOffset,s=parseInt(y.localScrollSpeed),c=document.querySelectorAll("[data-ls_id]"),l=null,d=n.getEasing(),u=function(){d&&"function"==typeof jQuery?jQuery("html, body").stop(!0,!0).animate({scrollTop:t},s,d):window.scrollTo({top:t,behavior:"smooth"})},f=0;f<c.length;f++)if(e===c[f].dataset.ls_id){l=c[f];break}if(l?(o=l,a=!0):"string"==typeof e?n.isSelectorValid(e)&&(o=document.querySelector(e)):e.nodeType&&(o=e),o){if(o.classList.contains("vc_tta-panel")){var p=o.closest(".vc_tta-tabs");p&&(t=n.offset(p).top-r-20)}t=t||n.offset(o).top-r,y.localScrollUpdateHash&&"string"==typeof e&&a&&(window.location.hash=e);var m=document.querySelector(".mobile-toggle-nav");m&&m.classList.contains("visible")?("absolute"!==window.getComputedStyle(m).position&&(t-=m.getBoundingClientRect().height),document.querySelectorAll("a.mobile-menu-toggle, li.mobile-menu-toggle > a").forEach(function(e){e.classList.remove("wpex-active"),e.setAttribute("aria-expanded","false")}),y.animateMobileToggle?n.slideUp(m,300,function(){m.classList.remove("visible"),u()}):(m.classList.remove("visible"),u())):u()}}},scrollToHash:function(e){var t,i=0,n=location.hash;""!=n&&"#"!==n&&null!=n&&("#view_comments"!==n&&"#comments_reply"!==n||(t=document.querySelector("#comments"))&&(i=e.offset(t).top-e.config.localScrollOffset-20,e.scrollTo(t,i)),-1!==n.indexOf("comment-")&&document.querySelector("#site-header.fixed-scroll")?(t=document.querySelector(n))&&(i=e.offset(t).top-e.config.localScrollOffset-20,e.scrollTo(t,i)):(-1!==n.indexOf("localscroll-")&&(n=n.replace("localscroll-","")),e.scrollTo(n)))},localScrollSections:function(){var o=[];return document.querySelectorAll(y.localScrollTargets).forEach(function(e){var t=e.getAttribute("href"),i=t?"#"+t.replace(/^.*?(#|$)/,""):null;if(i&&"#"!==i){e.hasAttribute("data-ls_linkto")||e.setAttribute("data-ls_linkto",i);var n=document.querySelector('[data-ls_id="'+i+'"]');n||(n=document.querySelector(i)),n&&-1==o.indexOf(i)&&o.push(i)}}),this.config.localScrollSections=o,this.config.localScrollSections},localScrollLinks:function(){var o=this;document.addEventListener("click",function(e){var t=e.target.closest(y.localScrollTargets);if(t){var i=t.dataset.ls_linkto||t.hash;o.config.localScrollSections&&-1!=o.config.localScrollSections.indexOf(i)&&(t.closest(".sfHover")&&t.parentNode.classList.remove("sfHover"),o.scrollTo(i),t.closest(".full-screen-overlay-nav-menu .local-scroll > a")||(e.preventDefault(),e.stopPropagation()))}}),document.addEventListener("click",function(e){if(e.target.closest("body.single-product .entry-summary a.woocommerce-review-link")){var t=document.querySelector(".woocommerce-tabs"),i=document.querySelector(".reviews_tab a");if(t&&i){e.preventDefault(),i.click();var n=o.offset(t).top-o.config.localScrollOffset;o.scrollTo(t,n)}}})},localScrollHighlight:function(){if(y.localScrollHighlight){var s=this,t=s.config.localScrollSections;t.length&&window.addEventListener("scroll",function(){for(var e=0;e<t.length;e++)i(t[e])},!!s.config.passiveListeners&&{passive:!0})}function i(e){var t=document.querySelector('[data-ls_id="'+e+'"]')||document.querySelector(e);if(t){var i=!1,n=s.winScrollTop(),o=s.offset(t).top-s.config.localScrollOffset-1,a=t.offsetHeight,r=document.querySelectorAll('[data-ls_linkto="'+e+'"]');(i=o<=n&&n<o+a)?(t.classList.add("wpex-ls-inview"),document.querySelectorAll(".local-scroll.menu-item").forEach(function(e){e.classList.remove("current-menu-item")})):t.classList.remove("wpex-ls-inview"),r.forEach(function(e){i?e.classList.add("active"):e.classList.remove("active");var t=e.closest("li");t&&(i?t.classList.add("current-menu-item"):t.classList.remove("current-menu-item"))})}}},equalHeights:function(e){"function"==typeof window.wpexEqualHeights&&(wpexEqualHeights(".match-height-grid",".match-height-content",e),wpexEqualHeights(".match-height-row",".match-height-content",e),wpexEqualHeights(".vcex-feature-box-match-height",".vcex-match-height",e),wpexEqualHeights(".blog-equal-heights",".blog-entry-inner",e),wpexEqualHeights(".vc_row",".equal-height-column",e),wpexEqualHeights(".vc_row",".equal-height-content",e),wpexEqualHeights(".wpex-vc-row-columns-match-height",".vc_column-inner",e))},footerReveal:function(){var n=this,o=document.querySelector("#footer-reveal"),a=document.querySelector("#wrap"),e=document.querySelector("#main");function t(){if(n.viewportWidth()<960)o.classList.contains("footer-reveal")&&(o.classList.remove("footer-reveal"),o.classList.add("footer-reveal-visible"),a.style.removeProperty("margin-bottom"));else{var e=o.offsetHeight,t=window.innerHeight,i=0;i=o.classList.contains("footer-reveal")?a.offsetHeight+n.config.localScrollOffset:a.offsetHeight+n.config.localScrollOffset-e,e<t&&t<i?o.classList.contains("footer-reveal-visible")&&(a.style.marginBottom=e+"px",o.classList.remove("footer-reveal-visible"),o.classList.add("footer-reveal")):o.classList.contains("footer-reveal")&&(a.style.removeProperty("margin-bottom"),o.classList.remove("footer-reveal"),o.classList.remove("wpex-visible"),o.classList.add("footer-reveal-visible"))}}function i(){o.classList.contains("footer-reveal")&&(n.scrolledToBottom(e)?o.classList.add("wpex-visible"):o.classList.remove("wpex-visible"))}o&&a&&e&&(t(),i(),window.addEventListener("scroll",i,!!n.config.passiveListeners&&{passive:!0}),window.addEventListener("resize",t))},fixedFooter:function(){if(document.body.classList.contains("wpex-has-fixed-footer")){var e=document.querySelector("#main");e&&(t(),window.addEventListener("resize",t))}function t(){e.style.minHeight=e.offsetHeight+(window.innerHeight-document.documentElement.offsetHeight)+"px"}},customSelects:function(e){e&&e.childNodes||(e=document);var s=this;e.querySelectorAll(y.customSelects).forEach(function(e){var t=e.parentNode;if(!t.classList.contains("wpex-select-wrap")&&!t.classList.contains("wpex-multiselect-wrap")){var i=e.id,n=i?" wpex-"+i:"",o=!1;if(s.isVisible(e)){var a=document.createElement("div");if(e.hasAttribute("multiple")?a.className="wpex-multiselect-wrap"+n:(a.className="wpex-select-wrap"+n,o=!0),e=s.wrap(e,a),o){var r=document.createElement("span");r.className="ticon ticon-angle-down",r.setAttribute("aria-hidden","true"),a.appendChild(r)}}}})},masonryGrids:function(){if("undefined"!=typeof Isotope){var e=document.querySelectorAll(".wpex-masonry-grid"),t=function(e){var t={};"object"==typeof wpex_isotope_params&&((t=Object.assign({},wpex_isotope_params)).itemSelector=".wpex-masonry-col"),e.dataset.transitionDuration&&(t.transitionDuration=parseFloat(e.dataset.transitionDuration)+"s"),e.dataset.layoutMode&&(t.layoutMode=e.dataset.layoutMode);new Isotope(e,t)},i=function(e){"function"==typeof imagesLoaded?imagesLoaded(e,function(){t(e)}):t(e)};e.forEach(function(e){e.closest("[data-vc-stretch-content]")?setTimeout(function(){i(e)},10):i(e)})}},lightbox:function(e){this.autoLightbox(),this.lightboxSingle(e),this.lightboxInlineGallery(e),this.lightboxGallery(e),this.lightboxCarousels(e)},autoLightbox:function(){if(void 0!==y.autoLightbox&&y.autoLightbox&&"function"==typeof jQuery){var n=this,o=["bmp","gif","jpeg","jpg","png","tiff","tif","jfif","jpe"];jQuery(y.autoLightbox).each(function(){var e=jQuery(this),t=e.attr("href"),i=n.getUrlExtension(t);t&&-1!==o.indexOf(i)&&(e.parents(".woocommerce-product-gallery").length||e.addClass("wpex-lightbox"))})}},lightboxSingle:function(e){if("function"==typeof jQuery&&void 0!==jQuery.fancybox){var d=this;(e=e||jQuery("body")).on("click",".wpex-lightbox, .wpex-lightbox-video, .wpb_single_image.video-lightbox a, .wpex-lightbox-autodetect, .wpex-lightbox-autodetect a",function(e){e.preventDefault();var t=jQuery(this);if(t.is("a")||(t=t.find("a")),!t.hasClass("wpex-lightbox-group-item")){var i=t.data()||{},n=t.attr("href")||t.data("src")||"",o=t.data("type")||"",a=t.data("caption")||"",r=t.attr("data-show_title")||!0,s=t.data("options")&&d.parseObjectLiteralData(t.data("options"))||"";if(!i.parsedOpts){if(s&&(t.data("type")&&"iframe"===t.data("type")&&s.width&&s.height&&(i.width=s.width,i.height=s.height),s.iframeType&&"video"===s.iframeType&&(o="")),"iframe"===o&&i.width&&i.height&&(i.iframe={css:{width:i.width,height:i.height}}),"false"!==r){var c=t.data("title")||"";if(c.length){var l="fancybox-caption__title";a.length&&(l+=" fancybox-caption__title-margin"),a='<div class="'+l+'">'+c+"</div>"+a}}a.length&&(i.caption=a),i.parsedOpts=!0}t.hasClass("wpex-lightbox-iframe")&&(o="iframe"),t.hasClass("wpex-lightbox-inline")&&(o="inline"),"inline"===o&&(i.afterLoad=function(e,t){jQuery(document).trigger("wpex-modal-loaded")}),t.hasClass("rev-btn")&&(o="",i={}),jQuery.fancybox.open([{src:n,opts:i,type:o}],jQuery.extend({},wpex_fancybox_params,{}))}})}},lightboxInlineGallery:function(e){"function"==typeof jQuery&&void 0!==jQuery.fancybox&&(e=e||jQuery(document)).on("click",".wpex-lightbox-gallery",function(e){e.preventDefault();var t=jQuery(this).data("gallery")||"",r=[];t.length&&"object"==typeof t&&(jQuery.each(t,function(e,t){var i={},n=t.title||"",o=t.caption||"";if(n.length){var a="fancybox-caption__title";o.length&&(a+=" fancybox-caption__title-margin"),o='<div class="'+a+'">'+n+"</div>"+o}o.length&&(i.caption=o),i.thumb=t.thumb||t.src,r.push({src:t.src,opts:i})}),jQuery.fancybox.open(r,wpex_fancybox_params))})},lightboxGallery:function(e){if("function"==typeof jQuery&&void 0!==jQuery.fancybox){var f=this;e=e||jQuery(document),document.querySelectorAll("a.wpex-lightbox-group-item").forEach(function(e){e.classList.remove("wpex-lightbox")}),e.on("click","a.wpex-lightbox-group-item",function(e){e.preventDefault(),jQuery(".wpex-lightbox-group-item").removeAttr("data-lb-index");var l=jQuery(this),t=l.closest(".wpex-lightbox-group").find("a.wpex-lightbox-group-item:visible"),d=[],u=0;t.each(function(e){var t=jQuery(this),i=t.data()||{},n=t.attr("href")||t.data("src")||"",o="",a=t.attr("data-show_title")||!0,r=t.data("caption")||"",s=t.data("options")&&f.parseObjectLiteralData("({"+t.data("options")+"})")||"";if(!i.parsedOpts){if(i.thumb=t.data("thumb")||n,s&&(i.thumb=s.thumbnail||i.thumb,s.iframeType&&"video"===s.iframeType&&(i.type="")),"false"!==a&&(o=t.data("title")||t.attr("title")||"").length){var c="fancybox-caption__title";r.length&&(c+=" fancybox-caption__title-margin"),r='<div class="'+c+'">'+o+"</div>"+r}r.length&&(i.caption=r),i.parsedOpts=!0}n&&(t.attr("data-lb-index",e),l[0]==t[0]&&(u=e),d.push({src:n,opts:i}))}),jQuery.fancybox.open(d,jQuery.extend({},wpex_fancybox_params,{}),u)})}},lightboxCarousels:function(e){"function"==typeof jQuery&&void 0!==jQuery.fancybox&&(e=e||jQuery(document)).on("click",".wpex-carousel-lightbox-item",function(e){e.preventDefault();var t=jQuery(this),i=t.parents(".wpex-carousel").find(".owl-item"),r=[];if(i.each(function(){if(!jQuery(this).hasClass("cloned")){var e=jQuery(this).find(".wpex-carousel-lightbox-item");if(e.length){var t={},i=e.attr("href")||e.data("src")||"",n=e.data("title")||e.attr("title")||"",o=e.data("caption")||"";if("false"!==(e.attr("data-show_title")||!0)&&n.length){var a="fancybox-caption__title";o.length&&(a+=" fancybox-caption__title-margin"),o='<div class="'+a+'">'+n+"</div>"+o}o.length&&(t.caption=o),t.thumb=e.data("thumb")||i,r.push({src:i,opts:t})}}}),r.length&&"object"==typeof r){var n=t.data("count")-1||0;jQuery.fancybox.open(r,jQuery.extend({},wpex_fancybox_params,{loop:!0}),n)}})},hoverStyles:function(){var e,d,t,i,n="",u={};if((e=document.querySelector(".wpex-hover-data"))&&e.remove(),t=(d=document.querySelectorAll("[data-wpex-hover]")).length){for(var o=0;o<t;o++)r(o);if(u)for(var a in u)u.hasOwnProperty(a)&&(n+=u[a]+"{"+a+"}");n&&((i=document.createElement("style")).classList.add("wpex-hover-data"),i.appendChild(document.createTextNode(n)),(document.head||document.getElementsByTagName("head")[0]).appendChild(i))}function r(e){var t,i,n,o,a,r="",s="";if(i=(t=d[e]).dataset.wpexHover){i=JSON.parse(i),o=t.classList;for(var c=0;c<o.length;c++)-1!==o[c].indexOf("wpex-dhover-")&&t.classList.remove(o[c]);for(var l in n="wpex-dhover-"+e,i.parent?(a=t.closest(i.parent))&&(a.classList.add(n+"-p"),t.classList.add(n),s="."+n+"-p:hover ."+n):(t.classList.add(n),s="."+n+":hover"),i)if(i.hasOwnProperty(l)){if("target"===l||"parent"===l)continue;r+=l+":"+i[l]+"!important;"}r&&(u[r]=r in u?u[r]+","+s:s)}}},overlaysMobileSupport:function(){var e=this;if(window.matchMedia("(any-pointer: coarse)").matches){var n=!1;document.querySelectorAll(".overlay-parent.overlay-hh").forEach(function(e){e.classList.contains("overlay-ms")||e.querySelector(".theme-overlay")&&e.parentNode.removeChild(e)});var o=function(){document.querySelectorAll(".overlay-parent.wpex-touched").forEach(function(e){e.classList.remove("wpex-touched")})};document.querySelectorAll("a.overlay-parent.overlay-ms.overlay-h, .overlay-parent.overlay-ms.overlay-h > a").forEach(function(i){i.addEventListener("touchend",function(e){if(n)o();else{var t=i.closest(".overlay-parent");t.classList.contains("wpex-touched")||(e.preventDefault(),o(),t.classList.add("wpex-touched"))}}),i.addEventListener("touchmove",function(e){n=!0},!!e.config.passiveListeners&&{passive:!0}),i.addEventListener("touchstart",function(e){n=!1},!!e.config.passiveListeners&&{passive:!0})});var t=function(e){e.target.closest(".overlay-parent.wpex-touched")||o()};document.addEventListener("touchstart",t,!!e.config.passiveListeners&&{passive:!0}),document.addEventListener("touchmove",t,!!e.config.passiveListeners&&{passive:!0})}},stickyTopBar:function(){var t=this,i=!1,n=0,o=document.querySelector("#top-bar-wrap.wpex-top-bar-sticky"),e=document.querySelector("#wpadminbar"),a=document.querySelector("#wpex-mobile-menu-fixed-top"),r=document.querySelectorAll(".wpex-sticky-el-offset"),s=y.stickyTopBarBreakPoint;if(o){var c=document.createElement("div");c.id="top-bar-wrap-sticky-wrapper",c.className="wpex-sticky-top-bar-holder not-sticky",t.wrap(o,c),f(),window.addEventListener("scroll",function(){var e;c&&c.classList.contains("wpex-can-sticky")&&(0!==(e=t.winScrollTop())&&e>=t.offset(c).top-l()?d():u())},!!t.config.passiveListeners&&{passive:!0}),window.addEventListener("resize",f),window.addEventListener("orientationchange",function(){u(),f()})}function l(){return n=0,t.isVisible(e)&&"fixed"===window.getComputedStyle(e).position&&(n+=e.getBoundingClientRect().height),t.isVisible(a)&&(n+=a.getBoundingClientRect().height),r.forEach(function(e){t.isVisible(e)&&(n+=e.getBoundingClientRect().height)}),n}function d(){i||(c.style.height=o.getBoundingClientRect().height+"px",c.classList.remove("not-sticky"),c.classList.add("is-sticky"),o.style.top=l()+"px",o.style.width=c.getBoundingClientRect().width+"px",i=!0)}function u(){i&&(c.style.height="",c.classList.remove("is-sticky"),c.classList.add("not-sticky"),o.style.width="",o.style.top="",i=!1)}function f(){if(!y.hasStickyTopBarMobile&&t.viewportWidth()<s)return c.classList.remove("wpex-can-sticky"),void u();var e=t.winScrollTop();c.classList.add("wpex-can-sticky"),i?(c.style.height=o.getBoundingClientRect().height+"px",o.style.top=l()+"px",o.style.width=c.getBoundingClientRect().width+"px"):(n=t.offset(c).top-l(),0!==e&&n<e?d():u())}},stickyOffset:function(){var t=this,i=0;t.isVisible(document.querySelector("#top-bar-wrap-sticky-wrapper.wpex-can-sticky #top-bar-wrap"))&&(i+=document.querySelector("#top-bar-wrap-sticky-wrapper.wpex-can-sticky").getBoundingClientRect().height);var e=document.querySelector("#wpex-mobile-menu-fixed-top");t.isVisible(e)&&(i+=e.getBoundingClientRect().height);var n=document.querySelector("#wpadminbar");return t.isVisible(n)&&"fixed"===window.getComputedStyle(n).position&&(i+=n.getBoundingClientRect().height),document.querySelectorAll(".wpex-sticky-el-offset").forEach(function(e){t.isVisible(e)&&(i+=e.getBoundingClientRect().height)}),y.addStickyHeaderOffset&&(i+=y.addStickyHeaderOffset),i},stickyHeaderCustomStartPoint:function(){var e=y.stickyHeaderStartPosition;if(e&&!isNaN(e))return e;var t=document.querySelector(e);return t?this.offset(t).top:0},stickyHeader:function(){var i=this,e=y.stickyHeaderStyle;if("standard"===e||"shrink"===e||"shrink_animated"===e){var n=document.querySelector("#site-header.fixed-scroll");if(n){var o=!1,t=!1,a=document.createElement("div");a.id="site-header-sticky-wrapper",a.className="wpex-sticky-header-holder not-sticky",i.wrap(n,a);var r=y.stickyHeaderBreakPoint,s=y.hasStickyMobileHeader,c=i.stickyHeaderCustomStartPoint(),l=y.hasStickyHeaderShrink,d=0;d=document.querySelector("#overlay-header-wrap")?i.offset(n).top+n.getBoundingClientRect().height:i.offset(a).top+a.getBoundingClientRect().height,g(),window.addEventListener("scroll",function(){var e,t=i.winScrollTop();a.classList.contains("wpex-can-sticky")&&(c&&(e=i.winScrollTop(),o&&n.classList.add("transform-go"),e<=0?n.classList.remove("transform-prepare"):f()?n.classList.add("transform-prepare"):n.classList.remove("transform-prepare")),0!=t&&t>=p()?m():h(),l&&v())},!!i.config.passiveListeners&&{passive:!0}),window.addEventListener("resize",g),window.addEventListener("orientationchange",function(){h(),g()})}}function u(){return i.viewportWidth()<r}function f(){return i.winScrollTop()>d}function p(){return(c||i.offset(a).top)-i.stickyOffset()}function m(){o||(a.style.height=n.getBoundingClientRect().height+"px",a.classList.remove("not-sticky"),a.classList.add("is-sticky"),n.classList.remove("dyn-styles"),n.style.top=i.stickyOffset()+"px",n.style.width=a.getBoundingClientRect().width+"px",n.classList.contains("transform-prepare")&&n.classList.add("transform-go"),o=!0)}function v(){var e=!0;u()&&(e=!(!s||!y.hasStickyMobileHeaderShrink)),e&&f()?!t&&o&&(n.classList.add("sticky-header-shrunk"),t=!0):(n.classList.remove("sticky-header-shrunk"),t=!1)}function h(){o&&(c?(n.classList.remove("transform-go"),t&&(n.classList.remove("sticky-header-shrunk"),t=!1)):n.classList.remove("transform-prepare"),a.classList.remove("is-sticky"),a.classList.add("not-sticky"),n.classList.contains("shrink-sticky-header")||(a.style.height=""),n.classList.add("dyn-styles"),n.style.width="",n.style.top="",n.classList.remove("transform-go"),o=!1,n.classList.remove("sticky-header-shrunk"),t=!1)}function g(){var e=i.winScrollTop();if(!s&&u())return h(),a.classList.remove("wpex-can-sticky"),void n.classList.remove("transform-prepare");a.classList.add("wpex-can-sticky"),o?(n.classList.contains("shrink-sticky-header")||(a.style.height=n.getBoundingClientRect().height+"px"),n.style.top=i.stickyOffset()+"px",n.style.width=a.getBoundingClientRect().width+"px"):0!==e&&e>p()?m():h(),l&&v()}},stickyHeaderMenu:function(){var t=this,i=document.querySelector("#site-navigation-wrap.fixed-nav");if(i){var n=!1,e=document.querySelector("#site-header"),o=document.createElement("div");o.id="site-navigation-sticky-wrapper",o.className="wpex-sticky-navigation-holder not-sticky",t.wrap(i,o);var a=t.offset(o).top-t.stickyOffset();c(),window.addEventListener("scroll",function(){if(o.classList.contains("wpex-can-sticky")){var e=t.winScrollTop();0!==e&&a<=e?r():s()}},!!t.config.passiveListeners&&{passive:!0}),window.addEventListener("resize",c),window.addEventListener("orientationchange",function(){s(),c()})}function r(){n||(o.style.height=i.getBoundingClientRect().height+"px",o.classList.remove("not-sticky"),o.classList.add("is-sticky"),i.style.top=t.stickyOffset()+"px",i.style.width=o.getBoundingClientRect().width+"px",e&&e.classList.remove("dyn-styles"),n=!0)}function s(){n&&(o.style.height="",o.classList.remove("is-sticky"),o.classList.add("not-sticky"),i.style.top="",i.style.width="",e&&e.classList.add("dyn-styles"),n=!1)}function c(){if(t.viewportWidth()<=y.stickyNavbarBreakPoint)return s(),void o.classList.remove("wpex-can-sticky");var e=t.winScrollTop();o.classList.add("wpex-can-sticky"),n?(o.style.height=i.getBoundingClientRect().height+"px",i.style.top=t.stickyOffset()+"px",i.style.width=o.getBoundingClientRect().width+"px"):a<=e&&0!==e?r():s()}},vcTabsTogglesJS:function(){document.body.classList.contains("wpb-js-composer")&&"function"==typeof jQuery&&jQuery(document).on("afterShow.vc.accordion",function(e,t){if(void 0!==e){var i=jQuery(e.target).data("vc.accordion");i&&(i=i.getTarget())&&i.length&&("function"==typeof jQuery&&"function"==typeof jQuery.fn.sliderPro&&i.find(".wpex-slider").each(function(){jQuery(this).data("sliderPro")&&jQuery(this).sliderPro("update")}),"function"==typeof Isotope&&i.find(".vcex-isotope-grid, .wpex-masonry-grid, .vcex-navbar-filter-grid").each(function(){var e=Isotope.data(this);e&&e.layout()}))}})},accessability:function(){document.querySelectorAll("li.nav-no-click > a, li.sidr-class-nav-no-click > a").forEach(function(e){e.closest(".full-screen-overlay-nav-menu")&&e.parentNode.classList.contains("menu-item-has-children")||e.setAttribute("tabIndex","-1")}),document.querySelectorAll(".vc_toggle .vc_toggle_title").forEach(function(e){e.setAttribute("tabIndex",0),e.addEventListener("keydown",function(e){13===(e.keyCode||e.which)&&e.target.click()})})},domReady:function(e){if("function"==typeof e&&"undefined"!=typeof document){var t=document.readyState;if("interactive"===t||"complete"===t)return setTimeout(e);document.addEventListener("DOMContentLoaded",e,!1)}},retinaCheck:function(){return 1<window.devicePixelRatio||!(!window.matchMedia||!window.matchMedia("(-webkit-min-device-pixel-ratio: 1.5), (min--moz-device-pixel-ratio: 1.5), (-o-min-device-pixel-ratio: 3/2), (min-resolution: 1.5dppx)").matches)},mobileCheck:function(){if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))return!0},passiveListenersSupport:function(){var e=!1;try{var t=Object.defineProperty({},"passive",{get:function(){e=!0}});window.addEventListener("testPassive",null,t),window.removeEventListener("testPassive",null,t)}catch(e){}return e},getEasing:function(e){if(y.localScrollEasing&&"function"==typeof jQuery&&void 0!==jQuery.easing&&"function"==typeof jQuery.easing.jswing){var t=e||y.localScrollEasing;return jQuery.easing.hasOwnProperty(t)||(t="swing"),t}},viewportWidth:function(){var e=window,t="inner";return"innerWidth"in window||(t="client",e=document.documentElement||document.body),e[t+"Width"]},isSelectorValid:function(e){var t;try{t=e,document.createDocumentFragment().querySelector(t)}catch(e){return!1}return!0},slideUp:function(e,t,i){if(e&&"none"!==window.getComputedStyle(e).display){var n=window.getComputedStyle(e).transitionDuration;n&&"0s"===n||(t=parseFloat(n)*(-1<n.indexOf("ms")?1:1e3)),t||(t=300),e.classList.add("wpex-transitioning"),e.style.transitionProperty="height, margin, padding",e.style.transitionDuration=t+"ms",e.style.height=e.offsetHeight+"px",e.offsetHeight,e.style.overflow="hidden",e.style.height=0,e.style.paddingTop=0,e.style.paddingBottom=0,e.style.marginTop=0,e.style.marginBottom=0,setTimeout(function(){e.style.display="none",e.style.removeProperty("height"),e.style.removeProperty("padding-top"),e.style.removeProperty("padding-bottom"),e.style.removeProperty("margin-top"),e.style.removeProperty("margin-bottom"),e.style.removeProperty("overflow"),e.style.removeProperty("transition-duration"),e.style.removeProperty("transition-property"),e.classList.remove("wpex-transitioning"),i&&i()},t)}},slideDown:function(e,t,i){if(e){var n=window.getComputedStyle(e).display;if("block"!==n){var o=window.getComputedStyle(e).transitionDuration;o&&"0s"===o||(t=parseFloat(o)*(-1<o.indexOf("ms")?1:1e3)),t||(t=300),e.classList.add("wpex-transitioning"),e.style.removeProperty("display"),"none"===n&&(n="block"),e.style.display=n,e.style.transitionProperty="none";var a=e.offsetHeight;e.style.overflow="hidden",e.style.height=0,e.style.paddingTop=0,e.style.paddingBottom=0,e.style.marginTop=0,e.style.marginBottom=0,e.offsetHeight,e.style.boxSizing="border-box",e.style.transitionProperty="height, margin, padding",e.style.transitionDuration=t+"ms",e.style.height=a+"px",e.style.removeProperty("padding-top"),e.style.removeProperty("padding-bottom"),e.style.removeProperty("margin-top"),e.style.removeProperty("margin-bottom"),setTimeout(function(){e.style.removeProperty("height"),e.style.removeProperty("overflow"),e.style.removeProperty("transition-duration"),e.style.removeProperty("transition-property"),e.classList.remove("wpex-transitioning"),i&&i()},t)}}},focusOnElement:function(e,t){var i=e.querySelectorAll('button, [href], input, select, textarea, a,[tabindex]:not([tabindex="-1"])');if(i.length){for(var n=[],o=0;o<i.length;o++)this.isVisible(i[o])&&n.push(i[o]);if(n.length){var a=n[0],r=n[n.length-1];t?t.focus():a.focus(),r.addEventListener("keydown",function(e){9!==(e.keyCode||e.which)||e.shiftKey||(e.preventDefault(),a.focus())}),a.addEventListener("keydown",function(e){9===(e.keyCode||e.which)&&e.shiftKey&&(e.preventDefault(),r.focus())})}}},wrap:function(e,t){e.childNodes||(e=[e]),e.nextSibling?e.parentNode.insertBefore(t,e.nextSibling):e.parentNode.appendChild(t),t.appendChild(e)},insertAfter:function(e,t){t.parentNode.insertBefore(e,t.nextSibling)},offset:function(e){var t=e.getBoundingClientRect();return{top:t.top+this.winScrollTop(),left:t.left+this.winScrollTop()}},isVisible:function(e){return!!e&&!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)},isEmpty:function(e){return!e||""===e.innerHTML},insertExtras:function(e,t,i){if(e&&t){switch(i){case"append":t.appendChild(e);break;case"prepend":t.insertBefore(e,t.firstChild)}e.classList.remove("wpex-hidden")}},getUrlExtension:function(e){var t=e.split(".").pop().toLowerCase(),i=-1!==t.indexOf("?")?t.split("?").pop():"";return(t=t.replace(i,"")).replace("?","")},winScrollTop:function(){var e=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0;return e<0&&(e=0),e},scrolledToBottom:function(e){return this.winScrollTop()>=e.offsetTop+e.offsetHeight-window.innerHeight},parseObjectLiteralData:function(e){if("function"==typeof jQuery){var t=e.split(","),n={};return jQuery.each(t,function(e,t){var i=t.split(":");n[i[0]]=i[1]}),n}},removeClassPrefix:function(e,o,a){e.forEach(function(e){for(var t=e.classList,i=0;i<t.length;i++)if(o.test(t[i])){var n=t[i].replace(a,"");e.classList.replace(t[i],n)}})},menuAccordion:function(a){if(a){var r=this,s=!1;a.querySelectorAll(".menu-item-has-children, .sidr-class-menu-item-has-children").forEach(function(e){var t=e.querySelector("a");if(t){var i=document.createElement("button");i.className="wpex-open-submenu",i.setAttribute("aria-haspopup","true"),i.setAttribute("aria-expanded","false"),i.setAttribute("aria-label",y.i18n.openSubmenu.replace("%s",t.textContent.trim()));var n=document.createElement("span");n.className="ticon ticon-angle-down",n.setAttribute("aria-hidden","true"),i.appendChild(n),t.appendChild(i)}});var c=function(e){var t=e.closest("li.active");t.classList.remove("active");var i=t.querySelector("a"),n=t.querySelector(".wpex-open-submenu");n.setAttribute("aria-expanded","false"),n.setAttribute("aria-label",y.i18n.openSubmenu.replace("%s",i.textContent.trim())),s=!0,r.slideUp(e,null,function(){s=!1})};document.addEventListener("click",function(e){var t=e.target.closest(".wpex-open-submenu");if(t&&a.contains(t)){var i=t.closest("li");if(i){var n=i.querySelector("ul");if(n){var o=i.querySelector("a");o&&(e.preventDefault(),e.stopPropagation(),s||(i.classList.contains("active")?(i.querySelectorAll("li.active > ul").forEach(function(e){c(e)}),i.classList.remove("active"),t.setAttribute("aria-expanded","false"),t.setAttribute("aria-label",y.i18n.openSubmenu.replace("%s",o.textContent.trim())),s=!0,r.slideUp(n,null,function(){s=!1})):(t.setAttribute("aria-expanded","true"),t.setAttribute("aria-label",y.i18n.closeSubmenu.replace("%s",o.textContent.trim())),a.querySelectorAll("li.active > ul").forEach(function(e){e.contains(n)||c(e)}),s=!0,r.slideDown(n,null,function(){s=!1}),i.classList.add("active"))))}}}})}},sliderPro:function(e){"function"==typeof window.wpexSliderPro&&wpexSliderPro()},loadMore:function(){"function"==typeof window.wpexLoadMore&&wpexLoadMore()}}).init()}(wpex_theme_params);;
/*!
 * WPBakery Page Builder v6.0.0 (https://wpbakery.com)
 * Copyright 2011-2021 Michael M, WPBakery
 * License: Commercial. More details: http://go.wpbakery.com/licensing
 */

// jscs:disable
// jshint ignore: start

document.documentElement.className+=" js_active ",document.documentElement.className+="ontouchstart"in document.documentElement?" vc_mobile ":" vc_desktop ",function(){for(var prefix=["-webkit-","-moz-","-ms-","-o-",""],i=0;i<prefix.length;i++)prefix[i]+"transform"in document.documentElement.style&&(document.documentElement.className+=" vc_transform ")}(),function($){"function"!=typeof window.vc_js&&(window.vc_js=function(){"use strict";vc_toggleBehaviour(),vc_tabsBehaviour(),vc_accordionBehaviour(),vc_teaserGrid(),vc_carouselBehaviour(),vc_slidersBehaviour(),vc_prettyPhoto(),vc_pinterest(),vc_progress_bar(),vc_plugin_flexslider(),vc_gridBehaviour(),vc_rowBehaviour(),vc_prepareHoverBox(),vc_googleMapsPointer(),vc_ttaActivation(),jQuery(document).trigger("vc_js"),window.setTimeout(vc_waypoints,500)}),"function"!=typeof window.vc_plugin_flexslider&&(window.vc_plugin_flexslider=function($parent){($parent?$parent.find(".wpb_flexslider"):jQuery(".wpb_flexslider")).each(function(){var this_element=jQuery(this),sliderTimeout=1e3*parseInt(this_element.attr("data-interval"),10),sliderFx=this_element.attr("data-flex_fx"),slideshow=0==sliderTimeout?!1:!0;this_element.is(":visible")&&this_element.flexslider({animation:sliderFx,slideshow:slideshow,slideshowSpeed:sliderTimeout,sliderSpeed:800,smoothHeight:!0})})}),"function"!=typeof window.vc_googleplus&&(window.vc_googleplus=function(){0<jQuery(".wpb_googleplus").length&&function(){var po=document.createElement("script");po.type="text/javascript",po.async=!0,po.src="https://apis.google.com/js/plusone.js";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(po,s)}()}),"function"!=typeof window.vc_pinterest&&(window.vc_pinterest=function(){0<jQuery(".wpb_pinterest").length&&function(){var po=document.createElement("script");po.type="text/javascript",po.async=!0,po.src="https://assets.pinterest.com/js/pinit.js";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(po,s)}()}),"function"!=typeof window.vc_progress_bar&&(window.vc_progress_bar=function(){void 0!==jQuery.fn.vcwaypoint&&jQuery(".vc_progress_bar").each(function(){var $el=jQuery(this);$el.vcwaypoint(function(){$el.find(".vc_single_bar").each(function(index){var bar=jQuery(this).find(".vc_bar"),val=bar.data("percentage-value");setTimeout(function(){bar.css({width:val+"%"})},200*index)})},{offset:"85%"})})}),"function"!=typeof window.vc_waypoints&&(window.vc_waypoints=function(){void 0!==jQuery.fn.vcwaypoint&&jQuery(".wpb_animate_when_almost_visible:not(.wpb_start_animation)").each(function(){var $el=jQuery(this);$el.vcwaypoint(function(){$el.addClass("wpb_start_animation animated")},{offset:"85%"})})}),"function"!=typeof window.vc_toggleBehaviour&&(window.vc_toggleBehaviour=function($el){function event(content){content&&content.preventDefault&&content.preventDefault();var element=jQuery(this).closest(".vc_toggle"),content=element.find(".vc_toggle_content");element.hasClass("vc_toggle_active")?content.slideUp({duration:300,complete:function(){element.removeClass("vc_toggle_active")}}):content.slideDown({duration:300,complete:function(){element.addClass("vc_toggle_active")}})}($el?$el.hasClass("vc_toggle_title")?$el.unbind("click"):$el.find(".vc_toggle_title").off("click"):jQuery(".vc_toggle_title").off("click")).on("click",event)}),"function"!=typeof window.vc_tabsBehaviour&&(window.vc_tabsBehaviour=function(ver){var $call,old_version;jQuery.ui&&($call=ver||jQuery(".wpb_tabs, .wpb_tour"),ver=jQuery.ui&&jQuery.ui.version?jQuery.ui.version.split("."):"1.10",old_version=1===parseInt(ver[0],10)&&parseInt(ver[1],10)<9,$call.each(function(index){var interval=jQuery(this).attr("data-interval"),tabs_array=[],$tabs=jQuery(this).find(".wpb_tour_tabs_wrapper").tabs({show:function(event,ui){wpb_prepare_tab_content(event,ui)},activate:function(event,ui){wpb_prepare_tab_content(event,ui)}});if(interval&&0<interval)try{$tabs.tabs("rotate",1e3*interval)}catch(err){window.console&&window.console.warn&&console.warn("tabs behaviours error",err)}jQuery(this).find(".wpb_tab").each(function(){tabs_array.push(this.id)}),jQuery(this).find(".wpb_tabs_nav li").on("click",function(e){return e&&e.preventDefault&&e.preventDefault(),old_version?$tabs.tabs("select",jQuery("a",this).attr("href")):$tabs.tabs("option","active",jQuery(this).index()),!1}),jQuery(this).find(".wpb_prev_slide a, .wpb_next_slide a").on("click",function(length){var index;length&&length.preventDefault&&length.preventDefault(),old_version?(index=$tabs.tabs("option","selected"),jQuery(this).parent().hasClass("wpb_next_slide")?index++:index--,index<0?index=$tabs.tabs("length")-1:index>=$tabs.tabs("length")&&(index=0),$tabs.tabs("select",index)):(index=$tabs.tabs("option","active"),length=$tabs.find(".wpb_tab").length,index=jQuery(this).parent().hasClass("wpb_next_slide")?length<=index+1?0:index+1:index-1<0?length-1:index-1,$tabs.tabs("option","active",index))})}))}),"function"!=typeof window.vc_accordionBehaviour&&(window.vc_accordionBehaviour=function(){jQuery(".wpb_accordion").each(function(index){var $this=jQuery(this),active_tab=($this.attr("data-interval"),!isNaN(jQuery(this).data("active-tab"))&&0<parseInt($this.data("active-tab"),10)&&parseInt($this.data("active-tab"),10)-1),$tabs=!1===active_tab||"yes"===$this.data("collapsible"),$tabs=$this.find(".wpb_accordion_wrapper").accordion({header:"> div > h3",autoHeight:!1,heightStyle:"content",active:active_tab,collapsible:$tabs,navigation:!0,activate:vc_accordionActivate,change:function(event,ui){void 0!==jQuery.fn.isotope&&ui.newContent.find(".isotope").isotope("layout"),vc_carouselBehaviour(ui.newPanel)}});!0===$this.data("vcDisableKeydown")&&($tabs.data("uiAccordion")._keydown=function(){})})}),"function"!=typeof window.vc_teaserGrid&&(window.vc_teaserGrid=function(){var layout_modes={fitrows:"fitRows",masonry:"masonry"};jQuery(".wpb_grid .teaser_grid_container:not(.wpb_carousel), .wpb_filtered_grid .teaser_grid_container:not(.wpb_carousel)").each(function(){var $container=jQuery(this),$thumbs=$container.find(".wpb_thumbnails"),layout_mode=$thumbs.attr("data-layout-mode");$thumbs.isotope({itemSelector:".isotope-item",layoutMode:void 0===layout_modes[layout_mode]?"fitRows":layout_modes[layout_mode]}),$container.find(".categories_filter a").data("isotope",$thumbs).on("click",function($thumbs){$thumbs&&$thumbs.preventDefault&&$thumbs.preventDefault();$thumbs=jQuery(this).data("isotope");jQuery(this).parent().parent().find(".active").removeClass("active"),jQuery(this).parent().addClass("active"),$thumbs.isotope({filter:jQuery(this).attr("data-filter")})}),jQuery(window).on("load resize",function(){$thumbs.isotope("layout")})})}),"function"!=typeof window.vc_carouselBehaviour&&(window.vc_carouselBehaviour=function($parent){($parent?$parent.find(".wpb_carousel"):jQuery(".wpb_carousel")).each(function(){var fluid_ul=jQuery(this);!0!==fluid_ul.data("carousel_enabled")&&fluid_ul.is(":visible")&&(fluid_ul.data("carousel_enabled",!0),getColumnsCount(jQuery(this)),jQuery(this).hasClass("columns_count_1"),(fluid_ul=jQuery(this).find(".wpb_thumbnails-fluid li")).css({"margin-right":fluid_ul.css("margin-left"),"margin-left":0}),(fluid_ul=jQuery(this).find("ul.wpb_thumbnails-fluid")).width(fluid_ul.width()+300))})}),"function"!=typeof window.vc_slidersBehaviour&&(window.vc_slidersBehaviour=function(){jQuery(".wpb_gallery_slides").each(function(index){var $imagesGrid,sliderTimeout,this_element=jQuery(this);this_element.hasClass("wpb_slider_nivo")?(0===(sliderTimeout=1e3*this_element.attr("data-interval"))&&(sliderTimeout=9999999999),this_element.find(".nivoSlider").nivoSlider({effect:"boxRainGrow,boxRain,boxRainReverse,boxRainGrowReverse",slices:15,boxCols:8,boxRows:4,animSpeed:800,pauseTime:sliderTimeout,startSlide:0,directionNav:!0,directionNavHide:!0,controlNav:!0,keyboardNav:!1,pauseOnHover:!0,manualAdvance:!1,prevText:"Prev",nextText:"Next"})):this_element.hasClass("wpb_image_grid")&&(jQuery.fn.imagesLoaded?$imagesGrid=this_element.find(".wpb_image_grid_ul").imagesLoaded(function(){$imagesGrid.isotope({itemSelector:".isotope-item",layoutMode:"fitRows"})}):this_element.find(".wpb_image_grid_ul").isotope({itemSelector:".isotope-item",layoutMode:"fitRows"}))})}),"function"!=typeof window.vc_prettyPhoto&&(window.vc_prettyPhoto=function(){try{jQuery&&jQuery.fn&&jQuery.fn.prettyPhoto&&jQuery('a.prettyphoto, .gallery-icon a[href*=".jpg"]').prettyPhoto({animationSpeed:"normal",hook:"data-rel",padding:15,opacity:.7,showTitle:!0,allowresize:!0,counter_separator_label:"/",hideflash:!1,deeplinking:!1,modal:!1,callback:function(){-1<location.href.indexOf("#!prettyPhoto")&&(location.hash="")},social_tools:""})}catch(err){window.console&&window.console.warn&&window.console.warn("vc_prettyPhoto initialize error",err)}}),"function"!=typeof window.vc_google_fonts&&(window.vc_google_fonts=function(){return window.console&&window.console.warn&&window.console.warn("function vc_google_fonts is deprecated, no need to use it"),!1}),window.vcParallaxSkroll=!1,"function"!=typeof window.vc_rowBehaviour&&(window.vc_rowBehaviour=function(){var callSkrollInit,$=window.jQuery;function fullWidthRow(){var $elements=$('[data-vc-full-width="true"]');$.each($elements,function(key,item){var $el=$(this);$el.addClass("vc_hidden");var el_margin_left,el_margin_right,offset,width,padding,paddingRight,$el_full=$el.next(".vc_row-full-width");($el_full=!$el_full.length?$el.parent().next(".vc_row-full-width"):$el_full).length&&(el_margin_left=parseInt($el.css("margin-left"),10),el_margin_right=parseInt($el.css("margin-right"),10),offset=0-$el_full.offset().left-el_margin_left,width=$(window).width(),"rtl"===$el.css("direction")&&(offset-=$el_full.width(),offset+=width,offset+=el_margin_left,offset+=el_margin_right),$el.css({position:"relative",left:offset,"box-sizing":"border-box",width:width}),$el.data("vcStretchContent")||("rtl"===$el.css("direction")?((padding=offset)<0&&(padding=0),(paddingRight=offset)<0&&(paddingRight=0)):(paddingRight=width-(padding=(padding=-1*offset)<0?0:padding)-$el_full.width()+el_margin_left+el_margin_right)<0&&(paddingRight=0),$el.css({"padding-left":padding+"px","padding-right":paddingRight+"px"})),$el.attr("data-vc-full-width-init","true"),$el.removeClass("vc_hidden"),$(document).trigger("vc-full-width-row-single",{el:$el,offset:offset,marginLeft:el_margin_left,marginRight:el_margin_right,elFull:$el_full,width:width}))}),$(document).trigger("vc-full-width-row",$elements)}function fullHeightRow(){var windowHeight,offsetTop,$element=$(".vc_row-o-full-height:first");$element.length&&(windowHeight=$(window).height(),(offsetTop=$element.offset().top)<windowHeight&&$element.css("min-height",100-offsetTop/(windowHeight/100)+"vh")),$(document).trigger("vc-full-height-row",$element)}$(window).off("resize.vcRowBehaviour").on("resize.vcRowBehaviour",fullWidthRow).on("resize.vcRowBehaviour",fullHeightRow),fullWidthRow(),fullHeightRow(),(0<window.navigator.userAgent.indexOf("MSIE ")||navigator.userAgent.match(/Trident.*rv\:11\./))&&$(".vc_row-o-full-height").each(function(){"flex"===$(this).css("display")&&$(this).wrap('<div class="vc_ie-flexbox-fixer"></div>')}),vc_initVideoBackgrounds(),callSkrollInit=!1,window.vcParallaxSkroll&&window.vcParallaxSkroll.destroy(),$(".vc_parallax-inner").remove(),$("[data-5p-top-bottom]").removeAttr("data-5p-top-bottom data-30p-top-bottom"),$("[data-vc-parallax]").each(function(){var skrollrSize,$parallaxElement,parallaxImage,youtubeId;callSkrollInit=!0,"on"===$(this).data("vcParallaxOFade")&&$(this).children().attr("data-5p-top-bottom","opacity:0;").attr("data-30p-top-bottom","opacity:1;"),skrollrSize=100*$(this).data("vcParallax"),($parallaxElement=$("<div />").addClass("vc_parallax-inner").appendTo($(this))).height(skrollrSize+"%"),parallaxImage=$(this).data("vcParallaxImage"),(youtubeId=vcExtractYoutubeId(parallaxImage))?insertYoutubeVideoAsBackground($parallaxElement,youtubeId):void 0!==parallaxImage&&$parallaxElement.css("background-image","url("+parallaxImage+")"),$parallaxElement.attr("data-bottom-top","top: "+-(skrollrSize-100)+"%;").attr("data-top-bottom","top: 0%;")}),callSkrollInit&&window.skrollr&&(window.vcParallaxSkroll=skrollr.init({forceHeight:!1,smoothScrolling:!1,mobileCheck:function(){return!1}}),window.vcParallaxSkroll)}),"function"!=typeof window.vc_gridBehaviour&&(window.vc_gridBehaviour=function(){jQuery.fn.vcGrid&&jQuery("[data-vc-grid]").vcGrid()}),"function"!=typeof window.getColumnsCount&&(window.getColumnsCount=function(el){for(var find=!1,i=1;!1===find;){if(el.hasClass("columns_count_"+i))return find=!0,i;i++}}),"function"!=typeof window.wpb_prepare_tab_content&&(window.wpb_prepare_tab_content=function(event,ui){var panel=ui.panel||ui.newPanel,$pie_charts=panel.find(".vc_pie_chart:not(.vc_ready)"),$round_charts=panel.find(".vc_round-chart"),$frame=panel.find(".vc_line-chart"),$google_maps=panel.find('[data-ride="vc_carousel"]');vc_carouselBehaviour(),vc_plugin_flexslider(panel),ui.newPanel.find(".vc_masonry_media_grid, .vc_masonry_grid").length&&ui.newPanel.find(".vc_masonry_media_grid, .vc_masonry_grid").each(function(){var grid=jQuery(this).data("vcGrid");grid&&grid.gridBuilder&&grid.gridBuilder.setMasonry&&grid.gridBuilder.setMasonry()}),panel.find(".vc_masonry_media_grid, .vc_masonry_grid").length&&panel.find(".vc_masonry_media_grid, .vc_masonry_grid").each(function(){var grid=jQuery(this).data("vcGrid");grid&&grid.gridBuilder&&grid.gridBuilder.setMasonry&&grid.gridBuilder.setMasonry()}),$pie_charts.length&&jQuery.fn.vcChat&&$pie_charts.vcChat(),$round_charts.length&&jQuery.fn.vcRoundChart&&$round_charts.vcRoundChart({reload:!1}),$frame.length&&jQuery.fn.vcLineChart&&$frame.vcLineChart({reload:!1}),$google_maps.length&&jQuery.fn.carousel&&$google_maps.carousel("resizeAction"),$frame=panel.find(".isotope, .wpb_image_grid_ul"),$google_maps=panel.find(".wpb_gmaps_widget"),0<$frame.length&&$frame.isotope("layout"),$google_maps.length&&!$google_maps.is(".map_ready")&&(($frame=$google_maps.find("iframe")).attr("src",$frame.attr("src")),$google_maps.addClass("map_ready")),panel.parents(".isotope").length&&panel.parents(".isotope").each(function(){jQuery(this).isotope("layout")}),$(document).trigger("wpb_prepare_tab_content",panel)}),"function"!=typeof window.vc_ttaActivation&&(window.vc_ttaActivation=function(){jQuery("[data-vc-accordion]").on("show.vc.accordion",function(e){var $=window.jQuery,ui={};ui.newPanel=$(this).data("vc.accordion").getTarget(),window.wpb_prepare_tab_content(e,ui)})}),"function"!=typeof window.vc_accordionActivate&&(window.vc_accordionActivate=function(event,ui){var $pie_charts,$round_charts,$line_charts,$carousel;ui.newPanel.length&&ui.newHeader.length&&($pie_charts=ui.newPanel.find(".vc_pie_chart:not(.vc_ready)"),$round_charts=ui.newPanel.find(".vc_round-chart"),$line_charts=ui.newPanel.find(".vc_line-chart"),$carousel=ui.newPanel.find('[data-ride="vc_carousel"]'),void 0!==jQuery.fn.isotope&&ui.newPanel.find(".isotope, .wpb_image_grid_ul").isotope("layout"),ui.newPanel.find(".vc_masonry_media_grid, .vc_masonry_grid").length&&ui.newPanel.find(".vc_masonry_media_grid, .vc_masonry_grid").each(function(){var grid=jQuery(this).data("vcGrid");grid&&grid.gridBuilder&&grid.gridBuilder.setMasonry&&grid.gridBuilder.setMasonry()}),vc_carouselBehaviour(ui.newPanel),vc_plugin_flexslider(ui.newPanel),$pie_charts.length&&jQuery.fn.vcChat&&$pie_charts.vcChat(),$round_charts.length&&jQuery.fn.vcRoundChart&&$round_charts.vcRoundChart({reload:!1}),$line_charts.length&&jQuery.fn.vcLineChart&&$line_charts.vcLineChart({reload:!1}),$carousel.length&&jQuery.fn.carousel&&$carousel.carousel("resizeAction"),ui.newPanel.parents(".isotope").length&&ui.newPanel.parents(".isotope").each(function(){jQuery(this).isotope("layout")}))}),"function"!=typeof window.initVideoBackgrounds&&(window.initVideoBackgrounds=function(){return window.console&&window.console.warn&&window.console.warn("this function is deprecated use vc_initVideoBackgrounds"),vc_initVideoBackgrounds()}),"function"!=typeof window.vc_initVideoBackgrounds&&(window.vc_initVideoBackgrounds=function(){jQuery("[data-vc-video-bg]").each(function(){var youtubeId,$element=jQuery(this);$element.data("vcVideoBg")?(youtubeId=$element.data("vcVideoBg"),(youtubeId=vcExtractYoutubeId(youtubeId))&&($element.find(".vc_video-bg").remove(),insertYoutubeVideoAsBackground($element,youtubeId)),jQuery(window).on("grid:items:added",function(event,$grid){$element.has($grid).length&&vcResizeVideoBackground($element)})):$element.find(".vc_video-bg").remove()})}),"function"!=typeof window.insertYoutubeVideoAsBackground&&(window.insertYoutubeVideoAsBackground=function($element,youtubeId,counter){if("undefined"==typeof YT||void 0===YT.Player)return 100<(counter=void 0===counter?0:counter)?void console.warn("Too many attempts to load YouTube api"):void setTimeout(function(){insertYoutubeVideoAsBackground($element,youtubeId,counter++)},100);var $container=$element.prepend('<div class="vc_video-bg vc_hidden-xs"><div class="inner"></div></div>').find(".inner");new YT.Player($container[0],{width:"100%",height:"100%",videoId:youtubeId,playerVars:{playlist:youtubeId,iv_load_policy:3,enablejsapi:1,disablekb:1,autoplay:1,controls:0,showinfo:0,rel:0,loop:1,wmode:"transparent"},events:{onReady:function(event){event.target.mute().setLoop(!0)}}}),vcResizeVideoBackground($element),jQuery(window).on("resize",function(){vcResizeVideoBackground($element)})}),"function"!=typeof window.vcResizeVideoBackground&&(window.vcResizeVideoBackground=function($element){var iframeW,iframeH,marginLeft,marginTop,containerW=$element.innerWidth(),containerH=$element.innerHeight();containerW/containerH<16/9?(iframeW=containerH*(16/9),iframeH=containerH,marginLeft=-Math.round((iframeW-containerW)/2)+"px",marginTop=-Math.round((iframeH-containerH)/2)+"px"):(iframeH=(iframeW=containerW)*(9/16),marginTop=-Math.round((iframeH-containerH)/2)+"px",marginLeft=-Math.round((iframeW-containerW)/2)+"px"),iframeW+="px",iframeH+="px",$element.find(".vc_video-bg iframe").css({maxWidth:"1000%",marginLeft:marginLeft,marginTop:marginTop,width:iframeW,height:iframeH})}),"function"!=typeof window.vcExtractYoutubeId&&(window.vcExtractYoutubeId=function(id){if(void 0===id)return!1;id=id.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);return null!==id&&id[1]}),"function"!=typeof window.vc_googleMapsPointer&&(window.vc_googleMapsPointer=function(){var $=window.jQuery,$wpbGmapsWidget=$(".wpb_gmaps_widget");$wpbGmapsWidget.on("click",function(){$("iframe",this).css("pointer-events","auto")}),$wpbGmapsWidget.on("mouseleave",function(){$("iframe",this).css("pointer-events","none")}),$(".wpb_gmaps_widget iframe").css("pointer-events","none")}),"function"!=typeof window.vc_setHoverBoxPerspective&&(window.vc_setHoverBoxPerspective=function(hoverBox){hoverBox.each(function(){var $this=jQuery(this),width=$this.width();$this.css("perspective",4*width+"px")})}),"function"!=typeof window.vc_setHoverBoxHeight&&(window.vc_setHoverBoxHeight=function(hoverBox){hoverBox.each(function(){var hoverBoxHeight=jQuery(this),hoverBoxInner=hoverBoxHeight.find(".vc-hoverbox-inner");hoverBoxInner.css("min-height",0);var frontHeight=hoverBoxHeight.find(".vc-hoverbox-front-inner").outerHeight(),hoverBoxHeight=hoverBoxHeight.find(".vc-hoverbox-back-inner").outerHeight(),hoverBoxHeight=hoverBoxHeight<frontHeight?frontHeight:hoverBoxHeight;hoverBoxInner.css("min-height",(hoverBoxHeight=hoverBoxHeight<250?250:hoverBoxHeight)+"px")})}),"function"!=typeof window.vc_prepareHoverBox&&(window.vc_prepareHoverBox=function(){var hoverBox=jQuery(".vc-hoverbox");vc_setHoverBoxHeight(hoverBox),vc_setHoverBoxPerspective(hoverBox)}),jQuery(document).ready(window.vc_prepareHoverBox),jQuery(window).on("resize",window.vc_prepareHoverBox),jQuery(document).ready(function($){window.vc_js()})}(window.jQuery);;
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}
;
!function(){"use strict";var d=function(a){return Math.abs(parseInt(a,10))},c,b,g,l,k;const a=(b,a)=>{const c=new Map([["init","init"],["validation_failed","invalid"],["acceptance_missing","unaccepted"],["spam","spam"],["aborted","aborted"],["mail_sent","sent"],["mail_failed","failed"],["submitting","submitting"],["resetting","resetting"],["payment_required","payment-required"]]);c.has(a)&&(a=c.get(a)),Array.from(c.values()).includes(a)||(a=`custom-${a=(a=a.replace(/[^0-9a-z]+/i," ").trim()).replace(/\s+/,"-")}`);const d=b.getAttribute("data-status");return b.wpcf7.status=a,b.setAttribute("data-status",a),b.classList.add(a),d&&d!==a&&b.classList.remove(d),a};c=function(a,b,c){var d=new CustomEvent("wpcf7".concat(b),{bubbles:!0,detail:c});"string"==typeof a&&(a=document.querySelector(a)),a.dispatchEvent(d)};function j(a,b,c){return b in a?Object.defineProperty(a,b,{value:c,enumerable:!0,configurable:!0,writable:!0}):a[b]=c,a}function h(a,d){var b=Object.keys(a),c;return Object.getOwnPropertySymbols&&(c=Object.getOwnPropertySymbols(a),d&&(c=c.filter(function(b){return Object.getOwnPropertyDescriptor(a,b).enumerable})),b.push.apply(b,c)),b}function f(c){for(var a=1,b;a<arguments.length;a++)b=null!=arguments[a]?arguments[a]:{},a%2?h(Object(b),!0).forEach(function(a){j(c,a,b[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(c,Object.getOwnPropertyDescriptors(b)):h(Object(b)).forEach(function(a){Object.defineProperty(c,a,Object.getOwnPropertyDescriptor(b,a))});return c}b=function(d){var a=wpcf7.api,b=a.root,c=a.namespace,e=void 0===c?"contact-form-7/v1":c;return g.reduceRight(function(a,b){return function(c){return b(c,a)}},function(c){var g,h,i=c.url,a=c.path,j=c.endpoint,d=c.headers,k=c.body,l=c.data,n=function(b,f){var a,c,d,e;if(null==b)return{};if(d=function(c,f){if(null==c)return{};var a,b,d={},e=Object.keys(c);for(b=0;b<e.length;b++)a=e[b],f.indexOf(a)>=0||(d[a]=c[a]);return d}(b,f),Object.getOwnPropertySymbols){e=Object.getOwnPropertySymbols(b);for(c=0;c<e.length;c++)a=e[c],f.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(b,a)&&(d[a]=b[a])}return d}(c,["url","path","endpoint","headers","body","data"]),o,m;return"string"==typeof j&&(g=e.replace(/^\/|\/$/g,""),a=(h=j.replace(/^\//,""))?g+"/"+h:g),"string"==typeof a&&(-1!==b.indexOf("?")&&(a=a.replace("?","&")),a=a.replace(/^\//,""),i=b+a),delete(d=f({Accept:"application/json, */*;q=0.1"},d))["X-WP-Nonce"],l&&(k=JSON.stringify(l),d["Content-Type"]="application/json"),o={code:"fetch_error",message:"You are probably offline."},m={code:"invalid_json",message:"The response is not a valid JSON response."},window.fetch(i||a||window.location.href,f(f({},n),{},{headers:d,body:k})).then(function(a){return Promise.resolve(a).then(function(a){if(a.status>=200&&a.status<300)return a;throw a}).then(function(a){if(204===a.status)return null;if(a&&a.json)return a.json().catch(function(){throw m});throw m})},function(){throw o})})(d)},g=[];function n(d,g={}){if(wpcf7.blocked)return e(d),void a(d,"submitting");const h=new FormData(d);g.submitter&&g.submitter.name&&h.append(g.submitter.name,g.submitter.value);const f={contactFormId:d.wpcf7.id,pluginVersion:d.wpcf7.pluginVersion,contactFormLocale:d.wpcf7.locale,unitTag:d.wpcf7.unitTag,containerPostId:d.wpcf7.containerPost,status:d.wpcf7.status,inputs:Array.from(h,a=>{const b=a[0],c=a[1];return!b.match(/^_/)&&{name:b,value:c}}).filter(a=>!1!==a),formData:h},i=a=>{const b=document.createElement("li");b.setAttribute("id",a.error_id),a.idref?b.insertAdjacentHTML("beforeend",`<a href="#${a.idref}">${a.message}</a>`):b.insertAdjacentText("beforeend",a.message),d.wpcf7.parent.querySelector(".screen-reader-response ul").appendChild(b)},j=c=>{const e=d.querySelector(c.into),b=e.querySelector(".wpcf7-form-control");b.classList.add("wpcf7-not-valid"),b.setAttribute("aria-describedby",c.error_id);const a=document.createElement("span");a.setAttribute("class","wpcf7-not-valid-tip"),a.setAttribute("aria-hidden","true"),a.insertAdjacentText("beforeend",c.message),e.appendChild(a),e.querySelectorAll("[aria-invalid]").forEach(a=>{a.setAttribute("aria-invalid","true")}),b.closest(".use-floating-validation-tip")&&(b.addEventListener("focus",b=>{a.setAttribute("style","display: none")}),a.addEventListener("mouseover",b=>{a.setAttribute("style","display: none")}))};b({endpoint:`contact-forms/${d.wpcf7.id}/feedback`,method:"POST",body:h,wpcf7:{endpoint:"feedback",form:d,detail:f}}).then(b=>{const e=a(d,b.status);return f.status=b.status,f.apiResponse=b,["invalid","unaccepted","spam","aborted"].includes(e)?c(d,e,f):["sent","failed"].includes(e)&&c(d,`mail${e}`,f),c(d,"submit",f),b}).then(a=>{a.posted_data_hash&&(d.querySelector('input[name="_wpcf7_posted_data_hash"]').value=a.posted_data_hash),"mail_sent"===a.status&&(d.reset(),d.wpcf7.resetOnMailSent=!0),a.invalid_fields&&(a.invalid_fields.forEach(i),a.invalid_fields.forEach(j)),d.wpcf7.parent.querySelector('.screen-reader-response [role="status"]').insertAdjacentText("beforeend",a.message),d.querySelectorAll(".wpcf7-response-output").forEach(b=>{b.innerText=a.message})}).catch(a=>console.error(a))}b.use=function(a){g.unshift(a)},b.use((b,d)=>{if(b.wpcf7&&"feedback"===b.wpcf7.endpoint){const{form:d,detail:f}=b.wpcf7;e(d),c(d,"beforesubmit",f),a(d,"submitting")}return d(b)});const e=a=>{a.wpcf7.parent.querySelector('.screen-reader-response [role="status"]').innerText="",a.wpcf7.parent.querySelector(".screen-reader-response ul").innerText="",a.querySelectorAll(".wpcf7-not-valid-tip").forEach(a=>{a.remove()}),a.querySelectorAll("[aria-invalid]").forEach(a=>{a.setAttribute("aria-invalid","false")}),a.querySelectorAll(".wpcf7-form-control").forEach(a=>{a.removeAttribute("aria-describedby"),a.classList.remove("wpcf7-not-valid")}),a.querySelectorAll(".wpcf7-response-output").forEach(a=>{a.innerText=""})};function m(d){var f=new FormData(d),e={contactFormId:d.wpcf7.id,pluginVersion:d.wpcf7.pluginVersion,contactFormLocale:d.wpcf7.locale,unitTag:d.wpcf7.unitTag,containerPostId:d.wpcf7.containerPost,status:d.wpcf7.status,inputs:Array.from(f,function(a){var b=a[0],c=a[1];return!b.match(/^_/)&&{name:b,value:c}}).filter(function(a){return!1!==a}),formData:f};b({endpoint:"contact-forms/".concat(d.wpcf7.id,"/refill"),method:"GET",wpcf7:{endpoint:"refill",form:d,detail:e}}).then(function(b){d.wpcf7.resetOnMailSent?(delete d.wpcf7.resetOnMailSent,a(d,"mail_sent")):a(d,"init"),e.apiResponse=b,c(d,"reset",e)}).catch(function(a){return console.error(a)})}b.use(function(b,f){if(b.wpcf7&&"refill"===b.wpcf7.endpoint){var c=b.wpcf7,d=c.form;c.detail,e(d),a(d,"resetting")}return f(b)}),l=function(a,b){var c=function(c){var d=b[c],e;a.querySelectorAll('input[name="'.concat(c,'"]')).forEach(function(a){a.value=""}),a.querySelectorAll("img.wpcf7-captcha-".concat(c)).forEach(function(a){a.setAttribute("src",d)}),e=/([0-9]+)\.(png|gif|jpeg)$/.exec(d),e&&a.querySelectorAll('input[name="_wpcf7_captcha_challenge_'.concat(c,'"]')).forEach(function(a){a.value=e[1]})},d;for(d in b)c(d)},k=function(b,a){var c=function(c){var d=a[c][0],e=a[c][1];b.querySelectorAll(".wpcf7-form-control-wrap.".concat(c)).forEach(function(a){a.querySelector('input[name="'.concat(c,'"]')).value="",a.querySelector(".wpcf7-quiz-label").textContent=d,a.querySelector('input[name="_wpcf7_quiz_answer_'.concat(c,'"]')).value=e})},d;for(d in a)c(d)};function i(a,d){var b=Object.keys(a),c;return Object.getOwnPropertySymbols&&(c=Object.getOwnPropertySymbols(a),d&&(c=c.filter(function(b){return Object.getOwnPropertyDescriptor(a,b).enumerable})),b.push.apply(b,c)),b}function o(a){const b=new FormData(a);a.wpcf7={id:d(b.get("_wpcf7")),status:a.getAttribute("data-status"),pluginVersion:b.get("_wpcf7_version"),locale:b.get("_wpcf7_locale"),unitTag:b.get("_wpcf7_unit_tag"),containerPost:d(b.get("_wpcf7_container_post")),parent:a.closest(".wpcf7")},a.querySelectorAll(".has-spinner").forEach(a=>{a.insertAdjacentHTML("afterend",'<span class="wpcf7-spinner"></span>')}),function(a){a.querySelectorAll(".wpcf7-exclusive-checkbox").forEach(function(b){b.addEventListener("change",function(b){var c=b.target.getAttribute("name");a.querySelectorAll('input[type="checkbox"][name="'.concat(c,'"]')).forEach(function(a){a!==b.target&&(a.checked=!1)})})})}(a),function(a){a.querySelectorAll(".has-free-text").forEach(function(d){var c=d.querySelector("input.wpcf7-free-text"),b=d.querySelector('input[type="checkbox"], input[type="radio"]');c.disabled=!b.checked,a.addEventListener("change",function(a){c.disabled=!b.checked,a.target===b&&b.checked&&c.focus()})})}(a),function(a){a.querySelectorAll(".wpcf7-validates-as-url").forEach(function(a){a.addEventListener("change",function(c){var b=a.value.trim();b&&!b.match(/^[a-z][a-z0-9.+-]*:/i)&&-1!==b.indexOf(".")&&(b="http://"+(b=b.replace(/^\/+/,""))),a.value=b})})}(a),function(a){if(a.querySelector(".wpcf7-acceptance")&&!a.classList.contains("wpcf7-acceptance-as-validation")){var b=function(){var b=!0;a.querySelectorAll(".wpcf7-acceptance").forEach(function(a){if(b&&!a.classList.contains("optional")){var c=a.querySelector('input[type="checkbox"]');(a.classList.contains("invert")&&c.checked||!a.classList.contains("invert")&&!c.checked)&&(b=!1)}}),a.querySelectorAll(".wpcf7-submit").forEach(function(a){a.disabled=!b})};b(),a.addEventListener("change",function(a){b()}),a.addEventListener("wpcf7reset",function(a){b()})}}(a),function(a){var b=function(a,b){var g=d(a.getAttribute("data-starting-value")),c=d(a.getAttribute("data-maximum-value")),e=d(a.getAttribute("data-minimum-value")),f=a.classList.contains("down")?g-b.value.length:b.value.length;a.setAttribute("data-current-value",f),a.innerText=f,c&&c<b.value.length?a.classList.add("too-long"):a.classList.remove("too-long"),e&&b.value.length<e?a.classList.add("too-short"):a.classList.remove("too-short")},c=function(c){c=function(c){for(var a=1,b;a<arguments.length;a++)b=null!=arguments[a]?arguments[a]:{},a%2?i(Object(b),!0).forEach(function(a){j(c,a,b[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(c,Object.getOwnPropertyDescriptors(b)):i(Object(b)).forEach(function(a){Object.defineProperty(c,a,Object.getOwnPropertyDescriptor(b,a))});return c}({init:!1},c),a.querySelectorAll(".wpcf7-character-count").forEach(function(e){var f=e.getAttribute("data-target-name"),d=a.querySelector('[name="'.concat(f,'"]'));d&&(d.value=d.defaultValue,b(e,d),c.init&&d.addEventListener("keyup",function(a){b(e,d)}))})};c({init:!0}),a.addEventListener("wpcf7reset",function(a){c()})}(a),window.addEventListener("load",b=>{wpcf7.cached&&a.reset()}),a.addEventListener("reset",b=>{wpcf7.reset(a)}),a.addEventListener("submit",b=>{const c=b.submitter;wpcf7.submit(a,{submitter:c}),b.preventDefault()}),a.addEventListener("wpcf7submit",b=>{b.detail.apiResponse.captcha&&l(a,b.detail.apiResponse.captcha),b.detail.apiResponse.quiz&&k(a,b.detail.apiResponse.quiz)}),a.addEventListener("wpcf7reset",b=>{b.detail.apiResponse.captcha&&l(a,b.detail.apiResponse.captcha),b.detail.apiResponse.quiz&&k(a,b.detail.apiResponse.quiz)})}document.addEventListener("DOMContentLoaded",c=>{var a;if("undefined"==typeof wpcf7)return void console.error("wpcf7 is not defined.");if(void 0===wpcf7.api)return void console.error("wpcf7.api is not defined.");if("function"!=typeof window.fetch)return void console.error("Your browser doesn't support window.fetch().");if("function"!=typeof window.FormData)return void console.error("Your browser doesn't support window.FormData().");const b=document.querySelectorAll(".wpcf7 > form");"function"==typeof b.forEach?(wpcf7={init:o,submit:n,reset:m,...null!==(a=wpcf7)&&void 0!==a?a:{}},b.forEach(a=>wpcf7.init(a))):console.error("Your browser doesn't support NodeList.forEach().")})}();
(function(a){'use strict';a(function(){const b=a('.wpcf7-field-groups');b.length&&(b.each(function(){a(this).data('group-model',a(this).find('.wpcf7-field-group').eq(0).clone())}),a('body').on('wpcf7-field-groups/change','.wpcf7-field-groups',function(){const b=a(this).find('.wpcf7-field-group');b.each(function(b){a(this).find('.wpcf7-field-group-remove').toggle(b>0);const c=b+1;a(this).find('[name]').each(function(){const d=a(this),e=d.closest('.wpcf7-form-control-wrap'),f=d.attr('name'),h=f.indexOf('[]')>-1,g=f.replace('[]','');let b=g.replace(/__[0-9]*/,'')+'__'+c;e.length&&!e.hasClass(b)&&e.removeClass(g).addClass(b),b+=h?'[]':'',d.attr('name',b)})}),a(this).find('.wpcf7-field-group-count').val(b.length)}),b.trigger('wpcf7-field-groups/change'),a('body').on('click','.wpcf7-field-group-add, .wpcf7-field-group-remove',function(){const b=a(this),c=b.closest('.wpcf7-field-groups');if(b.hasClass('wpcf7-field-group-add')){const a=c.data('group-model').clone(!0);c.append(a),b.trigger('wpcf7-field-groups/added',a)}else b.trigger('wpcf7-field-groups/removed'),b.closest('.wpcf7-field-group').remove();return c.trigger('wpcf7-field-groups/change'),!1}),b.on('click','.wpcf7-exclusive-checkbox input:checkbox',function(){const c=a(this).attr('name');b.find('input:checkbox[name="'+c+'"]').not(this).prop('checked',!1)}))})})(jQuery);
/*! jQuery UI - v1.12.1 - 2020-09-25
* http://jqueryui.com
* Includes: data.js, disable-selection.js, escape-selector.js, focusable.js, form-reset-mixin.js, form.js, ie.js, jquery-1-7.js, keycode.js, labels.js, plugin.js, position.js, safe-active-element.js, safe-blur.js, scroll-parent.js, tabbable.js, unique-id.js, version.js, widget.js
* Copyright jQuery Foundation and other contributors; Licensed  */
( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} ( function( $ ) {

// Source: version.js
$.ui = $.ui || {};

$.ui.version = "1.12.1";

// Source: data.js
/*!
 * jQuery UI :data 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: :data Selector
//>>group: Core
//>>description: Selects elements which have data stored under the specified key.
//>>docs: http://api.jqueryui.com/data-selector/

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo( function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		} ) :

		// Support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		}
} );


// Source: disable-selection.js
/*!
 * jQuery UI Disable Selection 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: disableSelection
//>>group: Core
//>>description: Disable selection of text content within the set of matched elements.
//>>docs: http://api.jqueryui.com/disableSelection/

// This file is deprecated
$.fn.extend( {
	disableSelection: ( function() {
		var eventType = "onselectstart" in document.createElement( "div" ) ?
			"selectstart" :
			"mousedown";

		return function() {
			return this.on( eventType + ".ui-disableSelection", function( event ) {
				event.preventDefault();
			} );
		};
	} )(),

	enableSelection: function() {
		return this.off( ".ui-disableSelection" );
	}
} );

// Source: escape-selector.js
// Internal use only
$.ui.escapeSelector = ( function() {
	var selectorEscape = /([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g;
	return function( selector ) {
		return selector.replace( selectorEscape, "\\$1" );
	};
} )();

// Source: focusable.js
/*!
 * jQuery UI Focusable 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: :focusable Selector
//>>group: Core
//>>description: Selects elements which can be focused.
//>>docs: http://api.jqueryui.com/focusable-selector/

// Selectors
$.ui.focusable = function( element, hasTabindex ) {
	var map, mapName, img, focusableIfVisible, fieldset,
		nodeName = element.nodeName.toLowerCase();

	if ( "area" === nodeName ) {
		map = element.parentNode;
		mapName = map.name;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap='#" + mapName + "']" );
		return img.length > 0 && img.is( ":visible" );
	}

	if ( /^(input|select|textarea|button|object)$/.test( nodeName ) ) {
		focusableIfVisible = !element.disabled;

		if ( focusableIfVisible ) {

			// Form controls within a disabled fieldset are disabled.
			// However, controls within the fieldset's legend do not get disabled.
			// Since controls generally aren't placed inside legends, we skip
			// this portion of the check.
			fieldset = $( element ).closest( "fieldset" )[ 0 ];
			if ( fieldset ) {
				focusableIfVisible = !fieldset.disabled;
			}
		}
	} else if ( "a" === nodeName ) {
		focusableIfVisible = element.href || hasTabindex;
	} else {
		focusableIfVisible = hasTabindex;
	}

	return focusableIfVisible && $( element ).is( ":visible" ) && visible( $( element ) );
};

// Support: IE 8 only
// IE 8 doesn't resolve inherit to visible/hidden for computed values
function visible( element ) {
	var visibility = element.css( "visibility" );
	while ( visibility === "inherit" ) {
		element = element.parent();
		visibility = element.css( "visibility" );
	}
	return visibility !== "hidden";
}

$.extend( $.expr[ ":" ], {
	focusable: function( element ) {
		return $.ui.focusable( element, $.attr( element, "tabindex" ) != null );
	}
} );

// Source: form.js
// Support: IE8 Only
// IE8 does not support the form attribute and when it is supplied. It overwrites the form prop
// with a string, so we need to find the proper form.
$.fn.form = function() {
	return typeof this[ 0 ].form === "string" ? this.closest( "form" ) : $( this[ 0 ].form );
};

// Source: form-reset-mixin.js
/*!
 * jQuery UI Form Reset Mixin 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Form Reset Mixin
//>>group: Core
//>>description: Refresh input widgets when their form is reset
//>>docs: http://api.jqueryui.com/form-reset-mixin/

$.ui.formResetMixin = {
	_formResetHandler: function() {
		var form = $( this );

		// Wait for the form reset to actually happen before refreshing
		setTimeout( function() {
			var instances = form.data( "ui-form-reset-instances" );
			$.each( instances, function() {
				this.refresh();
			} );
		} );
	},

	_bindFormResetHandler: function() {
		this.form = this.element.form();
		if ( !this.form.length ) {
			return;
		}

		var instances = this.form.data( "ui-form-reset-instances" ) || [];
		if ( !instances.length ) {

			// We don't use _on() here because we use a single event handler per form
			this.form.on( "reset.ui-form-reset", this._formResetHandler );
		}
		instances.push( this );
		this.form.data( "ui-form-reset-instances", instances );
	},

	_unbindFormResetHandler: function() {
		if ( !this.form.length ) {
			return;
		}

		var instances = this.form.data( "ui-form-reset-instances" );
		instances.splice( $.inArray( this, instances ), 1 );
		if ( instances.length ) {
			this.form.data( "ui-form-reset-instances", instances );
		} else {
			this.form
				.removeData( "ui-form-reset-instances" )
				.off( "reset.ui-form-reset" );
		}
	}
};

// Source: ie.js
// This file is deprecated
$.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );

// Source: jquery-1-7.js
/*!
 * jQuery UI Support for jQuery core 1.7.x 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 */

//>>label: jQuery 1.7 Support
//>>group: Core
//>>description: Support version 1.7.x of jQuery core

// Support: jQuery 1.7 only
// Not a great way to check versions, but since we only support 1.7+ and only
// need to detect <1.8, this is a simple check that should suffice. Checking
// for "1.7." would be a bit safer, but the version string is 1.7, not 1.7.0
// and we'll never reach 1.70.0 (if we do, we certainly won't be supporting
// 1.7 anymore). See #11197 for why we're not using feature detection.
if ( $.fn.jquery.substring( 0, 3 ) === "1.7" ) {

	// Setters for .innerWidth(), .innerHeight(), .outerWidth(), .outerHeight()
	// Unlike jQuery Core 1.8+, these only support numeric values to set the
	// dimensions in pixels
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.css( elem, "padding" + this ) ) || 0;
				if ( border ) {
					size -= parseFloat( $.css( elem, "border" + this + "Width" ) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.css( elem, "margin" + this ) ) || 0;
				}
			} );
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each( function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			} );
		};

		$.fn[ "outer" + name ] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each( function() {
				$( this ).css( type, reduce( this, size, true, margin ) + "px" );
			} );
		};
	} );

	$.fn.addBack = function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	};
}

// Source: keycode.js
/*!
 * jQuery UI Keycode 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Keycode
//>>group: Core
//>>description: Provide keycodes as keynames
//>>docs: http://api.jqueryui.com/jQuery.ui.keyCode/

$.ui.keyCode = {
	BACKSPACE: 8,
	COMMA: 188,
	DELETE: 46,
	DOWN: 40,
	END: 35,
	ENTER: 13,
	ESCAPE: 27,
	HOME: 36,
	LEFT: 37,
	PAGE_DOWN: 34,
	PAGE_UP: 33,
	PERIOD: 190,
	RIGHT: 39,
	SPACE: 32,
	TAB: 9,
	UP: 38
};

// Source: labels.js
/*!
 * jQuery UI Labels 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: labels
//>>group: Core
//>>description: Find all the labels associated with a given input
//>>docs: http://api.jqueryui.com/labels/

$.fn.labels = function() {
	var ancestor, selector, id, labels, ancestors;

	// Check control.labels first
	if ( this[ 0 ].labels && this[ 0 ].labels.length ) {
		return this.pushStack( this[ 0 ].labels );
	}

	// Support: IE <= 11, FF <= 37, Android <= 2.3 only
	// Above browsers do not support control.labels. Everything below is to support them
	// as well as document fragments. control.labels does not work on document fragments
	labels = this.eq( 0 ).parents( "label" );

	// Look for the label based on the id
	id = this.attr( "id" );
	if ( id ) {

		// We don't search against the document in case the element
		// is disconnected from the DOM
		ancestor = this.eq( 0 ).parents().last();

		// Get a full set of top level ancestors
		ancestors = ancestor.add( ancestor.length ? ancestor.siblings() : this.siblings() );

		// Create a selector for the label based on the id
		selector = "label[for='" + $.ui.escapeSelector( id ) + "']";

		labels = labels.add( ancestors.find( selector ).addBack( selector ) );

	}

	// Return whatever we have found for labels
	return this.pushStack( labels );
};

// Source: plugin.js
// $.ui.plugin is deprecated. Use $.widget() extensions instead.
$.ui.plugin = {
	add: function( module, option, set ) {
		var i,
			proto = $.ui[ module ].prototype;
		for ( i in set ) {
			proto.plugins[ i ] = proto.plugins[ i ] || [];
			proto.plugins[ i ].push( [ option, set[ i ] ] );
		}
	},
	call: function( instance, name, args, allowDisconnected ) {
		var i,
			set = instance.plugins[ name ];

		if ( !set ) {
			return;
		}

		if ( !allowDisconnected && ( !instance.element[ 0 ].parentNode ||
				instance.element[ 0 ].parentNode.nodeType === 11 ) ) {
			return;
		}

		for ( i = 0; i < set.length; i++ ) {
			if ( instance.options[ set[ i ][ 0 ] ] ) {
				set[ i ][ 1 ].apply( instance.element, args );
			}
		}
	}
};

// Source: position.js
/*!
 * jQuery UI Position 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/position/
 */

//>>label: Position
//>>group: Core
//>>description: Positions elements relative to other elements.
//>>docs: http://api.jqueryui.com/position/
//>>demos: http://jqueryui.com/position/

( function() {
var cachedScrollbarWidth,
	max = Math.max,
	abs = Math.abs,
	rhorizontal = /left|center|right/,
	rvertical = /top|center|bottom/,
	roffset = /[\+\-]\d+(\.[\d]+)?%?/,
	rposition = /^\w+/,
	rpercent = /%$/,
	_position = $.fn.position;

function getOffsets( offsets, width, height ) {
	return [
		parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
		parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
	];
}

function parseCss( element, property ) {
	return parseInt( $.css( element, property ), 10 ) || 0;
}

function getDimensions( elem ) {
	var raw = elem[ 0 ];
	if ( raw.nodeType === 9 ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: 0, left: 0 }
		};
	}
	if ( $.isWindow( raw ) ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: elem.scrollTop(), left: elem.scrollLeft() }
		};
	}
	if ( raw.preventDefault ) {
		return {
			width: 0,
			height: 0,
			offset: { top: raw.pageY, left: raw.pageX }
		};
	}
	return {
		width: elem.outerWidth(),
		height: elem.outerHeight(),
		offset: elem.offset()
	};
}

$.position = {
	scrollbarWidth: function() {
		if ( cachedScrollbarWidth !== undefined ) {
			return cachedScrollbarWidth;
		}
		var w1, w2,
			div = $( "<div " +
				"style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'>" +
				"<div style='height:100px;width:auto;'></div></div>" ),
			innerDiv = div.children()[ 0 ];

		$( "body" ).append( div );
		w1 = innerDiv.offsetWidth;
		div.css( "overflow", "scroll" );

		w2 = innerDiv.offsetWidth;

		if ( w1 === w2 ) {
			w2 = div[ 0 ].clientWidth;
		}

		div.remove();

		return ( cachedScrollbarWidth = w1 - w2 );
	},
	getScrollInfo: function( within ) {
		var overflowX = within.isWindow || within.isDocument ? "" :
				within.element.css( "overflow-x" ),
			overflowY = within.isWindow || within.isDocument ? "" :
				within.element.css( "overflow-y" ),
			hasOverflowX = overflowX === "scroll" ||
				( overflowX === "auto" && within.width < within.element[ 0 ].scrollWidth ),
			hasOverflowY = overflowY === "scroll" ||
				( overflowY === "auto" && within.height < within.element[ 0 ].scrollHeight );
		return {
			width: hasOverflowY ? $.position.scrollbarWidth() : 0,
			height: hasOverflowX ? $.position.scrollbarWidth() : 0
		};
	},
	getWithinInfo: function( element ) {
		var withinElement = $( element || window ),
			isWindow = $.isWindow( withinElement[ 0 ] ),
			isDocument = !!withinElement[ 0 ] && withinElement[ 0 ].nodeType === 9,
			hasOffset = !isWindow && !isDocument;
		return {
			element: withinElement,
			isWindow: isWindow,
			isDocument: isDocument,
			offset: hasOffset ? $( element ).offset() : { left: 0, top: 0 },
			scrollLeft: withinElement.scrollLeft(),
			scrollTop: withinElement.scrollTop(),
			width: withinElement.outerWidth(),
			height: withinElement.outerHeight()
		};
	}
};

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// Make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
		target = $( options.of ),
		within = $.position.getWithinInfo( options.within ),
		scrollInfo = $.position.getScrollInfo( within ),
		collision = ( options.collision || "flip" ).split( " " ),
		offsets = {};

	dimensions = getDimensions( target );
	if ( target[ 0 ].preventDefault ) {

		// Force left top to allow flipping
		options.at = "left top";
	}
	targetWidth = dimensions.width;
	targetHeight = dimensions.height;
	targetOffset = dimensions.offset;

	// Clone to reuse original targetOffset later
	basePosition = $.extend( {}, targetOffset );

	// Force my and at to have valid horizontal and vertical positions
	// if a value is missing or invalid, it will be converted to center
	$.each( [ "my", "at" ], function() {
		var pos = ( options[ this ] || "" ).split( " " ),
			horizontalOffset,
			verticalOffset;

		if ( pos.length === 1 ) {
			pos = rhorizontal.test( pos[ 0 ] ) ?
				pos.concat( [ "center" ] ) :
				rvertical.test( pos[ 0 ] ) ?
					[ "center" ].concat( pos ) :
					[ "center", "center" ];
		}
		pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
		pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

		// Calculate offsets
		horizontalOffset = roffset.exec( pos[ 0 ] );
		verticalOffset = roffset.exec( pos[ 1 ] );
		offsets[ this ] = [
			horizontalOffset ? horizontalOffset[ 0 ] : 0,
			verticalOffset ? verticalOffset[ 0 ] : 0
		];

		// Reduce to just the positions without the offsets
		options[ this ] = [
			rposition.exec( pos[ 0 ] )[ 0 ],
			rposition.exec( pos[ 1 ] )[ 0 ]
		];
	} );

	// Normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	if ( options.at[ 0 ] === "right" ) {
		basePosition.left += targetWidth;
	} else if ( options.at[ 0 ] === "center" ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[ 1 ] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[ 1 ] === "center" ) {
		basePosition.top += targetHeight / 2;
	}

	atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
	basePosition.left += atOffset[ 0 ];
	basePosition.top += atOffset[ 1 ];

	return this.each( function() {
		var collisionPosition, using,
			elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseCss( this, "marginLeft" ),
			marginTop = parseCss( this, "marginTop" ),
			collisionWidth = elemWidth + marginLeft + parseCss( this, "marginRight" ) +
				scrollInfo.width,
			collisionHeight = elemHeight + marginTop + parseCss( this, "marginBottom" ) +
				scrollInfo.height,
			position = $.extend( {}, basePosition ),
			myOffset = getOffsets( offsets.my, elem.outerWidth(), elem.outerHeight() );

		if ( options.my[ 0 ] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[ 0 ] === "center" ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[ 1 ] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[ 1 ] === "center" ) {
			position.top -= elemHeight / 2;
		}

		position.left += myOffset[ 0 ];
		position.top += myOffset[ 1 ];

		collisionPosition = {
			marginLeft: marginLeft,
			marginTop: marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[ i ] ] ) {
				$.ui.position[ collision[ i ] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
					my: options.my,
					at: options.at,
					within: within,
					elem: elem
				} );
			}
		} );

		if ( options.using ) {

			// Adds feedback as second argument to using callback, if present
			using = function( props ) {
				var left = targetOffset.left - position.left,
					right = left + targetWidth - elemWidth,
					top = targetOffset.top - position.top,
					bottom = top + targetHeight - elemHeight,
					feedback = {
						target: {
							element: target,
							left: targetOffset.left,
							top: targetOffset.top,
							width: targetWidth,
							height: targetHeight
						},
						element: {
							element: elem,
							left: position.left,
							top: position.top,
							width: elemWidth,
							height: elemHeight
						},
						horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
						vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
					};
				if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
					feedback.horizontal = "center";
				}
				if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
					feedback.vertical = "middle";
				}
				if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
					feedback.important = "horizontal";
				} else {
					feedback.important = "vertical";
				}
				options.using.call( this, props, feedback );
			};
		}

		elem.offset( $.extend( position, { using: using } ) );
	} );
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
				outerWidth = within.width,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = withinOffset - collisionPosLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
				newOverRight;

			// Element is wider than within
			if ( data.collisionWidth > outerWidth ) {

				// Element is initially over the left side of within
				if ( overLeft > 0 && overRight <= 0 ) {
					newOverRight = position.left + overLeft + data.collisionWidth - outerWidth -
						withinOffset;
					position.left += overLeft - newOverRight;

				// Element is initially over right side of within
				} else if ( overRight > 0 && overLeft <= 0 ) {
					position.left = withinOffset;

				// Element is initially over both left and right sides of within
				} else {
					if ( overLeft > overRight ) {
						position.left = withinOffset + outerWidth - data.collisionWidth;
					} else {
						position.left = withinOffset;
					}
				}

			// Too far left -> align with left edge
			} else if ( overLeft > 0 ) {
				position.left += overLeft;

			// Too far right -> align with right edge
			} else if ( overRight > 0 ) {
				position.left -= overRight;

			// Adjust based on position and margin
			} else {
				position.left = max( position.left - collisionPosLeft, position.left );
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
				outerHeight = data.within.height,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = withinOffset - collisionPosTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
				newOverBottom;

			// Element is taller than within
			if ( data.collisionHeight > outerHeight ) {

				// Element is initially over the top of within
				if ( overTop > 0 && overBottom <= 0 ) {
					newOverBottom = position.top + overTop + data.collisionHeight - outerHeight -
						withinOffset;
					position.top += overTop - newOverBottom;

				// Element is initially over bottom of within
				} else if ( overBottom > 0 && overTop <= 0 ) {
					position.top = withinOffset;

				// Element is initially over both top and bottom of within
				} else {
					if ( overTop > overBottom ) {
						position.top = withinOffset + outerHeight - data.collisionHeight;
					} else {
						position.top = withinOffset;
					}
				}

			// Too far up -> align with top
			} else if ( overTop > 0 ) {
				position.top += overTop;

			// Too far down -> align with bottom edge
			} else if ( overBottom > 0 ) {
				position.top -= overBottom;

			// Adjust based on position and margin
			} else {
				position.top = max( position.top - collisionPosTop, position.top );
			}
		}
	},
	flip: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.left + within.scrollLeft,
				outerWidth = within.width,
				offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = collisionPosLeft - offsetLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					data.at[ 0 ] === "right" ?
						-data.targetWidth :
						0,
				offset = -2 * data.offset[ 0 ],
				newOverRight,
				newOverLeft;

			if ( overLeft < 0 ) {
				newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth -
					outerWidth - withinOffset;
				if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
					position.left += myOffset + atOffset + offset;
				}
			} else if ( overRight > 0 ) {
				newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset +
					atOffset + offset - offsetLeft;
				if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
					position.left += myOffset + atOffset + offset;
				}
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.top + within.scrollTop,
				outerHeight = within.height,
				offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = collisionPosTop - offsetTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
				top = data.my[ 1 ] === "top",
				myOffset = top ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					data.at[ 1 ] === "bottom" ?
						-data.targetHeight :
						0,
				offset = -2 * data.offset[ 1 ],
				newOverTop,
				newOverBottom;
			if ( overTop < 0 ) {
				newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight -
					outerHeight - withinOffset;
				if ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) {
					position.top += myOffset + atOffset + offset;
				}
			} else if ( overBottom > 0 ) {
				newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset +
					offset - offsetTop;
				if ( newOverTop > 0 || abs( newOverTop ) < overBottom ) {
					position.top += myOffset + atOffset + offset;
				}
			}
		}
	},
	flipfit: {
		left: function() {
			$.ui.position.flip.left.apply( this, arguments );
			$.ui.position.fit.left.apply( this, arguments );
		},
		top: function() {
			$.ui.position.flip.top.apply( this, arguments );
			$.ui.position.fit.top.apply( this, arguments );
		}
	}
};

} )();

// Source: safe-active-element.js
$.ui.safeActiveElement = function( document ) {
	var activeElement;

	// Support: IE 9 only
	// IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
	try {
		activeElement = document.activeElement;
	} catch ( error ) {
		activeElement = document.body;
	}

	// Support: IE 9 - 11 only
	// IE may return null instead of an element
	// Interestingly, this only seems to occur when NOT in an iframe
	if ( !activeElement ) {
		activeElement = document.body;
	}

	// Support: IE 11 only
	// IE11 returns a seemingly empty object in some cases when accessing
	// document.activeElement from an <iframe>
	if ( !activeElement.nodeName ) {
		activeElement = document.body;
	}

	return activeElement;
};

// Source: safe-blur.js
$.ui.safeBlur = function( element ) {

	// Support: IE9 - 10 only
	// If the <body> is blurred, IE will switch windows, see #9420
	if ( element && element.nodeName.toLowerCase() !== "body" ) {
		$( element ).trigger( "blur" );
	}
};

// Source: scroll-parent.js
/*!
 * jQuery UI Scroll Parent 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: scrollParent
//>>group: Core
//>>description: Get the closest ancestor element that is scrollable.
//>>docs: http://api.jqueryui.com/scrollParent/

$.fn.scrollParent = function( includeHidden ) {
	var position = this.css( "position" ),
		excludeStaticParent = position === "absolute",
		overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
		scrollParent = this.parents().filter( function() {
			var parent = $( this );
			if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
				return false;
			}
			return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
				parent.css( "overflow-x" ) );
		} ).eq( 0 );

	return position === "fixed" || !scrollParent.length ?
		$( this[ 0 ].ownerDocument || document ) :
		scrollParent;
};

// Source: tabbable.js
/*!
 * jQuery UI Tabbable 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: :tabbable Selector
//>>group: Core
//>>description: Selects elements which can be tabbed to.
//>>docs: http://api.jqueryui.com/tabbable-selector/

$.extend( $.expr[ ":" ], {
	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			hasTabindex = tabIndex != null;
		return ( !hasTabindex || tabIndex >= 0 ) && $.ui.focusable( element, hasTabindex );
	}
} );

// Source: unique-id.js
/*!
 * jQuery UI Unique ID 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: uniqueId
//>>group: Core
//>>description: Functions to generate and remove uniqueId's
//>>docs: http://api.jqueryui.com/uniqueId/

$.fn.extend( {
	uniqueId: ( function() {
		var uuid = 0;

		return function() {
			return this.each( function() {
				if ( !this.id ) {
					this.id = "ui-id-" + ( ++uuid );
				}
			} );
		};
	} )(),

	removeUniqueId: function() {
		return this.each( function() {
			if ( /^ui-id-\d+$/.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		} );
	}
} );

// Source: widget.js
/*!
 * jQuery UI Widget 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget
//>>group: Core
//>>description: Provides a factory for creating stateful widgets with a common API.
//>>docs: http://api.jqueryui.com/jQuery.widget/
//>>demos: http://jqueryui.com/widget/

var widgetUuid = 0;
var widgetSlice = Array.prototype.slice;

$.cleanData = ( function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {
			try {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			// Http://bugs.jquery.com/ticket/8235
			} catch ( e ) {}
		}
		orig( elems );
	};
} )( $.cleanData );

$.widget = function( name, base, prototype ) {
	var existingConstructor, constructor, basePrototype;

	// ProxiedPrototype allows the provided prototype to remain unmodified
	// so that it can be used as a mixin for multiple widgets (#8876)
	var proxiedPrototype = {};

	var namespace = name.split( "." )[ 0 ];
	name = name.split( "." )[ 1 ];
	var fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	if ( $.isArray( prototype ) ) {
		prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
	}

	// Create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {

		// Allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// Allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	// Extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,

		// Copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),

		// Track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	} );

	basePrototype = new base();

	// We need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = ( function() {
			function _super() {
				return base.prototype[ prop ].apply( this, arguments );
			}

			function _superApply( args ) {
				return base.prototype[ prop ].apply( this, args );
			}

			return function() {
				var __super = this._super;
				var __superApply = this._superApply;
				var returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		} )();
	} );
	constructor.prototype = $.widget.extend( basePrototype, {

		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	} );

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// Redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor,
				child._proto );
		} );

		// Remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widgetSlice.call( arguments, 1 );
	var inputIndex = 0;
	var inputLength = input.length;
	var key;
	var value;

	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {

				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :

						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );

				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string";
		var args = widgetSlice.call( arguments, 1 );
		var returnValue = this;

		if ( isMethodCall ) {

			// If this is an empty collection, we need to have the instance method
			// return undefined instead of the jQuery instance
			if ( !this.length && options === "instance" ) {
				returnValue = undefined;
			} else {
				this.each( function() {
					var methodValue;
					var instance = $.data( this, fullName );

					if ( options === "instance" ) {
						returnValue = instance;
						return false;
					}

					if ( !instance ) {
						return $.error( "cannot call methods on " + name +
							" prior to initialization; " +
							"attempted to call method '" + options + "'" );
					}

					if ( !$.isFunction( instance[ options ] ) || options.charAt( 0 ) === "_" ) {
						return $.error( "no such method '" + options + "' for " + name +
							" widget instance" );
					}

					methodValue = instance[ options ].apply( instance, args );

					if ( methodValue !== instance && methodValue !== undefined ) {
						returnValue = methodValue && methodValue.jquery ?
							returnValue.pushStack( methodValue.get() ) :
							methodValue;
						return false;
					}
				} );
			}
		} else {

			// Allow multiple hashes to be passed on init
			if ( args.length ) {
				options = $.widget.extend.apply( null, [ options ].concat( args ) );
			}

			this.each( function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			} );
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",

	options: {
		classes: {},
		disabled: false,

		// Callbacks
		create: null
	},

	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = widgetUuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();
		this.classesElementLookup = {};

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			} );
			this.document = $( element.style ?

				// Element within the document
				element.ownerDocument :

				// Element is window or document
				element.document || element );
			this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
		}

		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this._create();

		if ( this.options.disabled ) {
			this._setOptionDisabled( this.options.disabled );
		}

		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},

	_getCreateOptions: function() {
		return {};
	},

	_getCreateEventData: $.noop,

	_create: $.noop,

	_init: $.noop,

	destroy: function() {
		var that = this;

		this._destroy();
		$.each( this.classesElementLookup, function( key, value ) {
			that._removeClass( value, key );
		} );

		// We can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.off( this.eventNamespace )
			.removeData( this.widgetFullName );
		this.widget()
			.off( this.eventNamespace )
			.removeAttr( "aria-disabled" );

		// Clean up events and states
		this.bindings.off( this.eventNamespace );
	},

	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key;
		var parts;
		var curOption;
		var i;

		if ( arguments.length === 0 ) {

			// Don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {

			// Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},

	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},

	_setOption: function( key, value ) {
		if ( key === "classes" ) {
			this._setOptionClasses( value );
		}

		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this._setOptionDisabled( value );
		}

		return this;
	},

	_setOptionClasses: function( value ) {
		var classKey, elements, currentElements;

		for ( classKey in value ) {
			currentElements = this.classesElementLookup[ classKey ];
			if ( value[ classKey ] === this.options.classes[ classKey ] ||
					!currentElements ||
					!currentElements.length ) {
				continue;
			}

			// We are doing this to create a new jQuery object because the _removeClass() call
			// on the next line is going to destroy the reference to the current elements being
			// tracked. We need to save a copy of this collection so that we can add the new classes
			// below.
			elements = $( currentElements.get() );
			this._removeClass( currentElements, classKey );

			// We don't use _addClass() here, because that uses this.options.classes
			// for generating the string of classes. We want to use the value passed in from
			// _setOption(), this is the new value of the classes option which was passed to
			// _setOption(). We pass this value directly to _classes().
			elements.addClass( this._classes( {
				element: elements,
				keys: classKey,
				classes: value,
				add: true
			} ) );
		}
	},

	_setOptionDisabled: function( value ) {
		this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

		// If the widget is becoming disabled, then nothing is interactive
		if ( value ) {
			this._removeClass( this.hoverable, null, "ui-state-hover" );
			this._removeClass( this.focusable, null, "ui-state-focus" );
		}
	},

	enable: function() {
		return this._setOptions( { disabled: false } );
	},

	disable: function() {
		return this._setOptions( { disabled: true } );
	},

	_classes: function( options ) {
		var full = [];
		var that = this;

		options = $.extend( {
			element: this.element,
			classes: this.options.classes || {}
		}, options );

		function processClassString( classes, checkOption ) {
			var current, i;
			for ( i = 0; i < classes.length; i++ ) {
				current = that.classesElementLookup[ classes[ i ] ] || $();
				if ( options.add ) {
					current = $( $.unique( current.get().concat( options.element.get() ) ) );
				} else {
					current = $( current.not( options.element ).get() );
				}
				that.classesElementLookup[ classes[ i ] ] = current;
				full.push( classes[ i ] );
				if ( checkOption && options.classes[ classes[ i ] ] ) {
					full.push( options.classes[ classes[ i ] ] );
				}
			}
		}

		this._on( options.element, {
			"remove": "_untrackClassesElement"
		} );

		if ( options.keys ) {
			processClassString( options.keys.match( /\S+/g ) || [], true );
		}
		if ( options.extra ) {
			processClassString( options.extra.match( /\S+/g ) || [] );
		}

		return full.join( " " );
	},

	_untrackClassesElement: function( event ) {
		var that = this;
		$.each( that.classesElementLookup, function( key, value ) {
			if ( $.inArray( event.target, value ) !== -1 ) {
				that.classesElementLookup[ key ] = $( value.not( event.target ).get() );
			}
		} );
	},

	_removeClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, false );
	},

	_addClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, true );
	},

	_toggleClass: function( element, keys, extra, add ) {
		add = ( typeof add === "boolean" ) ? add : extra;
		var shift = ( typeof element === "string" || element === null ),
			options = {
				extra: shift ? keys : extra,
				keys: shift ? element : keys,
				element: shift ? this.element : element,
				add: add
			};
		options.element.toggleClass( this._classes( options ), add );
		return this;
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement;
		var instance = this;

		// No suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// No element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {

				// Allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
						$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// Copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ );
			var eventName = match[ 1 ] + instance.eventNamespace;
			var selector = match[ 2 ];

			if ( selector ) {
				delegateElement.on( eventName, selector, handlerProxy );
			} else {
				element.on( eventName, handlerProxy );
			}
		} );
	},

	_off: function( element, eventName ) {
		eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.off( eventName ).off( eventName );

		// Clear the stack to avoid memory leaks (#10056)
		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
			},
			mouseleave: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
			}
		} );
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
			},
			focusout: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
			}
		} );
	},

	_trigger: function( type, event, data ) {
		var prop, orig;
		var callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();

		// The original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// Copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}

		var hasOptions;
		var effectName = !options ?
			method :
			options === true || typeof options === "number" ?
				defaultEffect :
				options.effect || defaultEffect;

		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}

		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;

		if ( options.delay ) {
			element.delay( options.delay );
		}

		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue( function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			} );
		}
	};
} );


} ) );
;
var a3_lazyload_params = {"apply_images":"1","apply_videos":"1"};;
/*! Lazy Load XT v1.1.0 2016-01-12
 * http://ressio.github.io/lazy-load-xt
 * (C) 2016 RESS.io
 * Licensed under MIT */(function(a,c,l,n){var g='lazyLoadXT',o='lazied',y='load error',p='lazy-hidden',e=l.documentElement||l.body,z=c.onscroll===n||!!c.operamini||!e.getBoundingClientRect,b={autoInit:!0,selector:'img[data-src]',blankImage:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',throttle:99,forceLoad:z,loadEvent:'pageshow',updateEvent:'load orientationchange resize scroll touchmove focus',forceEvent:'lazyloadall',oninit:{removeClass:'lazy'},onshow:{addClass:p},onload:{removeClass:p,addClass:'lazy-loaded'},onerror:{removeClass:p},checkDuplicates:!0},s={srcAttr:'data-src',edgeX:0,edgeY:0,visibleOnly:!0},k=a(c),q=a.extend,r=a.data||function(b,c){return a(b).data(c)},f=[],m=0,j=0;a[g]=q(b,s,a[g]);function i(c,a){return c[a]===n?b[a]:c[a]}function t(){var a=c.pageYOffset;return a===n?e.scrollTop:a}a.fn[g]=function(e){e=e||{};var k=i(e,'blankImage'),m=i(e,'checkDuplicates'),n=i(e,'scrollContainer'),p=i(e,'show'),l={},j;a(n).on('scroll',d);for(j in s)l[j]=i(e,j);return this.each(function(s,i){if(i===c)a(b.selector).lazyLoadXT(e);else{var n=m&&r(i,o),j=a(i).data(o,p?-1:1);if(n){d();return}k&&i.tagName==='IMG'&&!i.src&&(i.src=k),j[g]=q({},l),h('init',j),f.push(j),d()}})};function h(e,c){var a=b['on'+e];a&&(typeof a=="function"?a.call(c[0]):(a.addClass&&c.addClass(a.addClass),a.removeClass&&c.removeClass(a.removeClass))),c.trigger('lazy'+e,[c]),d()}function v(b){h(b.type,a(this).off(y,v))}function w(w){var A,D,C,j,n,i,d,p,u,q,l,k,x,z,s,B;if(!f.length)return;w=w||b.forceLoad,m=1/0,A=t(),D=c.innerHeight||e.clientHeight,C=c.innerWidth||e.clientWidth;for(j=0,n=f.length;j<n;j++)i=f[j],d=i[0],p=i[g],u=!1,q=w||r(d,o)<0,a.contains(e,d)?(w||!p.visibleOnly||d.offsetWidth||d.offsetHeight)&&(q||(k=d.getBoundingClientRect(),x=p.edgeX,z=p.edgeY,l=k.top+A-z-D,q=l<=A&&k.bottom>-z&&k.left<=C+x&&k.right>-x),q?(i.on(y,v),h('show',i),s=p.srcAttr,B=typeof s=="function"?s(i):d.getAttribute(s),B&&(d.src=B),u=!0):l<m&&(m=l)):u=!0,u&&(f.splice(j--,1),n--);n||h('complete',a(e))}function x(){j>1?(j=1,w(),setTimeout(x,b.throttle)):j=0}function d(a){if(!f.length)return;if(a&&a.type==='scroll'&&a.currentTarget===c)if(m>=t())return;j||setTimeout(x,0),j=2}function u(){k.lazyLoadXT()}function A(){w(!0)}a(l).ready(function(){h('start',k),k.on(b.updateEvent,d).on(b.forceEvent,A),a(l).on(b.updateEvent,d),b.autoInit&&(k.on(b.loadEvent,u),u())})})(window.jQuery||window.Zepto||window.$,window,document),function(a){var b=a.lazyLoadXT;b.selector+=',video,iframe[data-src],embed[data-src]',b.videoPoster='data-poster',a(document).on('lazyshow','video',function(g,c){var d=c.lazyLoadXT.srcAttr,f=typeof d=="function",e=!1;c.attr('poster',c.attr(b.videoPoster)),c.children('source,track').each(function(h,g){var b=a(g),c=f?d(b):b.attr(d);c&&(b.attr('src',c),e=!0)}),e&&typeof a(this).attr('preload')!='undefined'&&'none'!=a(this).attr('preload')&&this.load(),a(this).removeClass('lazy-hidden')}),a(document).on('lazyshow','embed',function(b,c){a(this).removeClass('lazy-hidden')})}(window.jQuery||window.Zepto||window.$);
/*! Lazy Load XT v1.1.0 2016-01-12
 * http://ressio.github.io/lazy-load-xt
 * (C) 2016 RESS.io
 * Licensed under MIT */(function(c,f,g,q){var a=c.lazyLoadXT,i=function(){return'srcset'in new Image}(),p=/^\s*(\S*)/,o=/\S\s+(\d+)w/,t=/\S\s+(\d+)h/,n=/\S\s+([\d\.]+)x/,k=[0,1/0],m=[0,1],j={srcsetAttr:'data-srcset',srcsetExtended:!0,srcsetBaseAttr:'data-srcset-base',srcsetExtAttr:'data-srcset-ext'},d={w:0,h:0,x:0},b,e;for(b in j)a[b]===q&&(a[b]=j[b]);a.selector+=',img['+a.srcsetAttr+'],source['+a.srcsetAttr+']';function h(a,d){return Math[d].apply(null,c.map(a,function(a){return a[b]}))}function r(a){return a[b]>=d[b]||a[b]===e}function s(a){return a[b]===e}function l(q){var u=q.attr(a.srcsetAttr),i,v,j,l;if(!u)return!1;if(i=c.map(u.replace(/(\s[\d.]+[whx]),/g,'$1 @,@ ').split(' @,@ '),function(a){return{url:p.exec(a)[1],w:parseFloat((o.exec(a)||k)[1]),h:parseFloat((t.exec(a)||k)[1]),x:parseFloat((n.exec(a)||m)[1])}}),!i.length)return!1;v=g.documentElement,d={w:f.innerWidth||v.clientWidth,h:f.innerHeight||v.clientHeight,x:f.devicePixelRatio||1};for(j in d)b=j,e=h(i,'max'),i=c.grep(i,r);for(j in d)b=j,e=h(i,'min'),i=c.grep(i,s);return l=i[0].url,a.srcsetExtended&&(l=(q.attr(a.srcsetBaseAttr)||'')+l+(q.attr(a.srcsetExtAttr)||'')),l}c(g).on('lazyshow','img',function(d,b){var c=b.attr(a.srcsetAttr);c&&(!a.srcsetExtended&&i?(b.attr('srcset',c),b.attr('data-srcset','')):b.lazyLoadXT.srcAttr=l)}),c(g).on('lazyshow','source',function(e,b){c(this).removeClass('lazy-hidden');var d=b.attr(a.srcsetAttr);d&&(!a.srcsetExtended&&i?(b.attr('srcset',d),b.attr('data-srcset','')):b.lazyLoadXT.srcAttr=l)})})(window.jQuery||window.Zepto||window.$,window,document);
jQuery.lazyLoadXT.updateEvent='load orientationchange resize scroll touchmove focus click customlazyloadxtevent',jQuery.lazyLoadXT.edgeY=a3_lazyload_extend_params.edgeY,jQuery.lazyLoadXT.srcsetExtended=!1,typeof a3_lazyload_extend_params.horizontal_container_classnames!='undefined'&&''!==a3_lazyload_extend_params.horizontal_container_classnames&&(jQuery.lazyLoadXT.scrollContainer=a3_lazyload_extend_params.horizontal_container_classnames),jQuery(document).ready(function(a){jQuery(document).on('mouseenter','.site-header-cart',function(){jQuery(document).trigger('customlazyloadxtevent')}),jQuery(document).on('mouseenter','.widget_shopping_cart',function(){jQuery(document).trigger('customlazyloadxtevent')}),jQuery(document).on('mouseover','#wp-admin-bar-top-secondary',function(){jQuery(document).trigger('customlazyloadxtevent')})}),jQuery(document).ajaxComplete(function(){setTimeout(function(){jQuery(window).lazyLoadXT()},1e3)});
/**
 * WordPress inline HTML embed
 *
 * @since 4.4.0
 * @output wp-includes/js/wp-embed.js
 *
 * This file cannot have ampersands in it. This is to ensure
 * it can be embedded in older versions of WordPress.
 * See https://core.trac.wordpress.org/changeset/35708.
 */
(function ( window, document ) {
	'use strict';

	var supportedBrowser = false,
		loaded = false;

		if ( document.querySelector ) {
			if ( window.addEventListener ) {
				supportedBrowser = true;
			}
		}

	/** @namespace wp */
	window.wp = window.wp || {};

	if ( !! window.wp.receiveEmbedMessage ) {
		return;
	}

	window.wp.receiveEmbedMessage = function( e ) {
		var data = e.data;

		if ( ! data ) {
			return;
		}

		if ( ! ( data.secret || data.message || data.value ) ) {
			return;
		}

		if ( /[^a-zA-Z0-9]/.test( data.secret ) ) {
			return;
		}

		var iframes = document.querySelectorAll( 'iframe[data-secret="' + data.secret + '"]' ),
			blockquotes = document.querySelectorAll( 'blockquote[data-secret="' + data.secret + '"]' ),
			i, source, height, sourceURL, targetURL;

		for ( i = 0; i < blockquotes.length; i++ ) {
			blockquotes[ i ].style.display = 'none';
		}

		for ( i = 0; i < iframes.length; i++ ) {
			source = iframes[ i ];

			if ( e.source !== source.contentWindow ) {
				continue;
			}

			source.removeAttribute( 'style' );

			/* Resize the iframe on request. */
			if ( 'height' === data.message ) {
				height = parseInt( data.value, 10 );
				if ( height > 1000 ) {
					height = 1000;
				} else if ( ~~height < 200 ) {
					height = 200;
				}

				source.height = height;
			}

			/* Link to a specific URL on request. */
			if ( 'link' === data.message ) {
				sourceURL = document.createElement( 'a' );
				targetURL = document.createElement( 'a' );

				sourceURL.href = source.getAttribute( 'src' );
				targetURL.href = data.value;

				/* Only continue if link hostname matches iframe's hostname. */
				if ( targetURL.host === sourceURL.host ) {
					if ( document.activeElement === source ) {
						window.top.location.href = data.value;
					}
				}
			}
		}
	};

	function onLoad() {
		if ( loaded ) {
			return;
		}

		loaded = true;

		var isIE10 = -1 !== navigator.appVersion.indexOf( 'MSIE 10' ),
			isIE11 = !!navigator.userAgent.match( /Trident.*rv:11\./ ),
			iframes = document.querySelectorAll( 'iframe.wp-embedded-content' ),
			iframeClone, i, source, secret;

		for ( i = 0; i < iframes.length; i++ ) {
			source = iframes[ i ];

			if ( ! source.getAttribute( 'data-secret' ) ) {
				/* Add secret to iframe */
				secret = Math.random().toString( 36 ).substr( 2, 10 );
				source.src += '#?secret=' + secret;
				source.setAttribute( 'data-secret', secret );
			}

			/* Remove security attribute from iframes in IE10 and IE11. */
			if ( ( isIE10 || isIE11 ) ) {
				iframeClone = source.cloneNode( true );
				iframeClone.removeAttribute( 'security' );
				source.parentNode.replaceChild( iframeClone, source );
			}
		}
	}

	if ( supportedBrowser ) {
		window.addEventListener( 'message', window.wp.receiveEmbedMessage, false );
		document.addEventListener( 'DOMContentLoaded', onLoad, false );
		window.addEventListener( 'load', onLoad, false );
	}
})( window, document );
;
/*!
    photobox v1.9.9
    (c) 2013 Yair Even Or <http://dropthebit.com>

    MIT-style license.
*/


;(function($, doc, win){
    "use strict";

    var Photobox, photobox, options, images=[], imageLinks, activeImage = -1, activeURL, lastActive, activeType, prevImage, nextImage, thumbsStripe, docElm, APControl, changeImage,
        isOldIE = !('placeholder' in doc.createElement('input')),
        noPointerEvents = (function(){ var el = $('<p>')[0]; el.style.cssText = 'pointer-events:auto'; return !el.style.pointerEvents})(),
        isTouchDevice = false, // assume "false" unless there's a touch
        thumbsContainerWidth, thumbsTotalWidth, activeThumb = $(),
        blankImg = "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        transformOrigin = getPrefixed('transformOrigin'),
        transition = getPrefixed('transition'),
        transitionend = "transitionend webkitTransitionEnd oTransitionEnd otransitionend",
          // Normalize rAF
        raf = window.requestAnimationFrame
           || window.webkitRequestAnimationFrame
           || window.mozRequestAnimationFrame
           || window.msRequestAnimationFrame
           || function(cb) { return window.setTimeout(cb, 1000 / 60); },

        // Preload images
        preload = {}, preloadPrev = new Image(), preloadNext = new Image(),
        // DOM elements
        closeBtn, image, video, prevBtn, nextBtn, thumbsToggler, caption, captionText, pbLoader, autoplayBtn, thumbs, wrapper,

        defaults = {
            single        : false,        // if "true" - gallery will only show a single image, with no way to navigate
            beforeShow    : null,         // Callback before showing an image
            afterClose    : null,         // Callback after closing the gallery
            loop          : true,         // Allows to navigate between first and last images
            thumb         : null,         // A relative path from the link to the thumbnail (if it's not inside the link)
            thumbs        : true,         // Show gallery thumbnails below the presented photo
            thumbAttr     : 'data-src',   // Attribute to get the image for the thumbnail from
            counter       : "(A/B)",      // Counts which piece of content is being viewed, relative to the total count of items in the photobox set. ["false","String"]
            title         : true,         // show the original alt or title attribute of the image's thumbnail. (path to image, relative to the element which triggers photobox)
            autoplay      : false,        // should autoplay on first time or not
            time          : 3000,         // autoplay interval, in miliseconds (less than 1000 will hide the autoplay button)
            history       : false,        // should use history hashing if possible (HTML5 API)
            hideFlash     : true,         // Hides flash elements on the page when photobox is activated. NOTE: flash elements must have wmode parameter set to "opaque" or "transparent" if this is set to false
            zoomable      : true,         // disable/enable mousewheel image zooming
            wheelNextPrev : true,         // change image using mousewheel left/right
            keys          : {
                close : [27, 88, 67],    // keycodes to close photobox, default: esc (27), 'x' (88), 'c' (67)
                prev  : [37, 80],        // keycodes to navigate to the previous image, default: Left arrow (37), 'p' (80)
                next  : [39, 78]         // keycodes to navigate to the next image, default: Right arrow (39), 'n' (78)
            }
        },

        // DOM structure
        overlay =   $('<div id="pbOverlay">').append(
                        thumbsToggler = $('<input type="checkbox" id="pbThumbsToggler" checked hidden>'),
                        pbLoader = $('<div class="pbLoader"><b></b><b></b><b></b></div>'),
                        prevBtn = $('<div id="pbPrevBtn" class="prevNext"><b></b></div>').on('click', next_prev),
                        nextBtn = $('<div id="pbNextBtn" class="prevNext"><b></b></div>').on('click', next_prev),
                        wrapper = $('<div class="pbWrapper">').append(  // gives Perspective
                            image = $('<img>'),
                            video = $('<div>')
                        ),
                        closeBtn = $('<div id="pbCloseBtn">').on('click', close)[0],
                        autoplayBtn = $('<div id="pbAutoplayBtn">').append(
                            $('<div class="pbProgress">')
                        ),
                        caption = $('<div id="pbCaption">').append(
                            '<label for="pbThumbsToggler" title="thumbnails on/off"></label>',
                            captionText = $('<div class="pbCaptionText">').append('<div class="title"></div><div class="counter">'),
                            thumbs = $('<div>').addClass('pbThumbs')
                        )
                    );

    ///////////////////////////////////////////////
    // Should remove this and use underscore/lodash if possible

    function throttle(callback, duration){
        var wait = false;
        return function(){
            if( !wait ){
                callback.call();
                wait = true;
                setTimeout(function(){wait = false; }, duration);
            }
        }
    }

    ///////////////////////////////////////////////
    // Initialization (on DOM ready)

    function prepareDOM(){
        noPointerEvents && overlay.hide();

        $(doc).on('touchstart.testMouse', function(){
            $(doc).off('touchstart.testMouse');
            isTouchDevice = true;
            overlay.addClass('mobile');
        });

        autoplayBtn.off().on('click', APControl.toggle);
        // attach a delegated event on the thumbs container
        thumbs.off().on('click', 'a', thumbsStripe.click);
        // if useragent is IE < 10 (user deserves a slap on the face, but I gotta support them still...)
        isOldIE && overlay.addClass('msie');

        // cancel prorogation up to the overlay container so it won't close
        overlay.off().on('click', 'img', function(e){
            e.stopPropagation();
        });

        $(doc.body).append(overlay);

        // need this for later:
        docElm = doc.documentElement;
    }

    // @param [List of elements to work on, Custom settings, Callback after image is loaded]
    $.fn.photobox = function(target, settings, callback){
        return this.each(function(){
            var o,
                PB_data = $(this).data('_photobox');

            if( PB_data ){ // don't initiate the plugin more than once on the same element
                if( target === 'destroy')
                    PB_data.destroy();

                return this;
            }

            if( typeof target != 'string' )
                target = 'a';

            if( target === 'prepareDOM' ){
                prepareDOM();
                return this;
            }

            o = $.extend({}, defaults, settings || {});
            photobox = new Photobox(o, this, target);

            // Saves the insance on the gallery's target element
            $(this).data('_photobox', photobox);
            // add a callback to the specific gallery
            photobox.callback = callback;
        });
    }

    Photobox = function(_options, object, target){
        this.options = $.extend({}, _options);
        this.target = target;
        this.selector = $(object || doc);

        this.thumbsList = null;
        // filter the links which actually HAS an image as a child
        var filtered = this.imageLinksFilter( this.selector.find(target) );

        this.imageLinks = filtered[0];  // Array of jQuery links
        this.images = filtered[1];      // 2D Array of image URL & title
        this.init();
    };

    Photobox.prototype = {
        init : function(){
            var that = this;

            // only generates the thumbStripe once, and listen for any DOM changes on the selector element, if so, re-generate
            // This is done on "mouseenter" so images will not get called unless it's liekly that they would be needed
            this.selector.one('mouseenter.photobox', this.target, function(e){
                that.thumbsList = thumbsStripe.generate.apply(that);
            });

            this.selector.on('click.photobox', this.target, function(e){
                e.preventDefault();
                that.open(this);
            });

            // if any node was added or removed from the Selector of the gallery
            this.observerTimeout = null;

            if( !isOldIE && this.selector[0].nodeType == 1 ) // observe normal nodes
                this.observeDOM( this.selector[0], this.onDOMchanges.bind(this));
        },

        onDOMchanges : function(){
            var that = this;
             // use a timeout to prevent more than one DOM change event firing at once, and also to overcome the fact that IE's DOMNodeRemoved is fired BEFORE elements were actually removed
            clearTimeout(this.observerTimeout);
            that.observerTimeout = setTimeout( function(){
                var filtered = that.imageLinksFilter( that.selector.find(that.target) ),
                    activeIndex = 0,
                    isActiveUrl = false,
                    i;

                // Make sure that ONLY DOM changes in the photobox number of items will trigger a change
                if(that.imageLinks.length == filtered[0].length)
                    return;

                that.imageLinks = filtered[0];
                that.images = filtered[1];

                // if photobox is opened
                if( photobox ){
                    // if gallery which was changed is the currently viewed one:
                    if( that.selector == photobox.selector ){
                        images = that.images;
                        imageLinks = that.imageLinks;
                        // check if the currently VIEWED photo has been detached from a photobox set
                        // if so, remove navigation arrows
                        // TODO: fix the "images" to be an object and not an array.
                        for( i = images.length; i--; ){
                            if( images[i][0] == activeURL )
                                isActiveUrl = true;
                            // if not exits any more
                        }
                       // if( isActiveUrl ){
                       //     overlay.removeClass('hasArrows');
                       // }
                    }
                }

                // if this gallery has thumbs
                //if( that.options.thumbs ){
                    that.thumbsList = thumbsStripe.generate.apply(that);
                    thumbs.html( that.thumbsList );
                //}

                if( that.images.length && activeURL && that.options.thumbs ){
                    activeIndex = that.thumbsList.find('a[href="'+activeURL+'"]').eq(0).parent().index();

                    if( activeIndex == -1 )
                        activeIndex = 0;

                    // updateIndexes(activeIndex);
                    thumbsStripe.changeActive(activeIndex, 0);
                }
            }, 50);
        },

        open : function(link){
            var startImage = $.inArray(link, this.imageLinks);
            // if image link does not exist in the imageLinks array (probably means it's not a valid part of the gallery)
            if( startImage == -1 )
                return false;

            // load the right gallery selector...
            options = this.options;
            images = this.images;
            imageLinks = this.imageLinks;

            photobox = this;
            this.setup(1);

            overlay.on(transitionend, function(){
                overlay.off(transitionend).addClass('on'); // class 'on' is set when the initial fade-in of the overlay is done
                changeImage(startImage, true);
            }).addClass('show');

            if( isOldIE )
                overlay.trigger('MSTransitionEnd');

            return false;
        },

        imageLinksFilter : function(obj){
            var that = this,
                images = [],
                caption = {},
                captionlink;

            return [obj.filter(function(i){
                // search for the thumb inside the link, if not found then see if there's a 'that.settings.thumb' pointer to the thumbnail
                var link = $(this),
                    thumbImg,
                    thumbSrc = '';

                caption.content = link[0].getAttribute('title') || '';

                if( that.options.thumb )
                    thumbImg = link.find(that.options.thumb)[0];

                // try a direct child lookup
                if( !that.options.thumb || !thumbImg )
                    thumbImg = link.find('img')[0];

                // if no img child found in the link
                if( thumbImg ){
                    captionlink = thumbImg.getAttribute('data-pb-captionlink');
                    thumbSrc = thumbImg.getAttribute(that.options.thumbAttr) || thumbImg.getAttribute('src');
                    caption.content = ( thumbImg.getAttribute('alt') || thumbImg.getAttribute('title') || '');
                }


                // if there is a caption link to be added:
                if( captionlink ){
                    captionlink = captionlink.split('[');
                    // parse complex links: text[www.site.com]
                    if( captionlink.length == 2 ){
                        caption.linkText = captionlink[0];
                        caption.linkHref = captionlink[1].slice(0,-1);
                    }
                    else{
                        caption.linkText = captionlink;
                        caption.linkHref = captionlink;
                    }
                    caption.content += ' <a href="'+ caption.linkHref +'">' + caption.linkText + '</a>';
                }

                images.push( [link[0].href, caption.content, thumbSrc] );

                return true;
            }), images];
        },

        //check if DOM nodes were added or removed, to re-build the imageLinks and thumbnails
        observeDOM : (function(){
            var MutationObserver = win.MutationObserver || win.WebKitMutationObserver,
                eventListenerSupported = win.addEventListener;

            return function(obj, callback){
                if( MutationObserver ){
                    var that = this,
                        // define a new observer
                        obs = new MutationObserver(function(mutations, observer){
                            if( mutations[0].addedNodes.length || mutations[0].removedNodes.length )
                                callback(that);
                        });
                    // have the observer observe for changes in children
                    obs.observe( obj, { childList:true, subtree:true });
                }
                else if( eventListenerSupported ){
                    obj.addEventListener('DOMNodeInserted', callback.bind(that), false);
                    obj.addEventListener('DOMNodeRemoved', callback.bind(that), false);
                }
            }
        })(),

        // things that should happen every time the gallery opens or closes (some messed up code below..)
        setup : function (open){
            var fn = open ? "on" : "off";

            // thumbs stuff
            if( options.thumbs ){
                if( !isTouchDevice ){
                    thumbs[fn]('mouseenter.photobox', thumbsStripe.calc)
                          [fn]('mousemove.photobox', thumbsStripe.move);
                }
            }

            if( open ){
                image.css({'transition':'0s'}).removeAttr('style'); // reset any transition that might be on the element (yes it's ugly)
                overlay.show();
                // Clean up if another gallery was viewed before, which had a thumbsList
                thumbs
                    .html( this.thumbsList )
                    .trigger('mouseenter.photobox');

                if( options.thumbs ){
                    overlay.addClass('thumbs');
                }
                else{
                    thumbsToggler.prop('checked', false);
                    overlay.removeClass('thumbs');
                }

                // things to hide if there are less than 2 images
                if( this.images.length < 2 ||  options.single )
                    overlay.removeClass('thumbs hasArrows hasCounter hasAutoplay');
                else{
                    overlay.addClass('hasArrows hasCounter')

                    // check is the autoplay button should be visible (per gallery) and if so, should it autoplay or not.
                    if( options.time > 1000 ){
                        overlay.addClass('hasAutoplay');
                        if( options.autoplay )
                            APControl.progress.start();
                        else
                            APControl.pause();
                    }
                    else
                        overlay.removeClass('hasAutoplay');
                }

                options.hideFlash && $('iframe, object, embed').css('visibility', 'hidden');

            } else {
                $(win).off('resize.photobox');
            }

            $(doc).off("keydown.photobox")[fn]({ "keydown.photobox": keyDown });

            if( isTouchDevice ){
                overlay.removeClass('hasArrows'); // no need for Arrows on touch-enabled
                wrapper[fn]('swipe', onSwipe);
            }

            if( options.zoomable ){
                overlay[fn]({"mousewheel.photobox": scrollZoom });
                if( !isOldIE) thumbs[fn]({"mousewheel.photobox": thumbsResize });
            }

            if( !options.single && options.wheelNextPrev ){
                overlay[fn]({"mousewheel.photobox": throttle(wheelNextPrev,1000) });
            }
        },

        destroy : function(){
            options = this.options;
            this.selector
                .off('click.photobox', this.target)
                .removeData('_photobox');

            close();
        }
    }

    // on touch-devices only
    function onSwipe(e, Dx, Dy){
        if( Dx == 1 ){
            image.css({transform:'translateX(25%)', transition:'.2s', opacity:0});
            setTimeout(function(){ changeImage(prevImage) }, 200);
        }
        else if( Dx == -1 ){
            image.css({transform:'translateX(-25%)', transition:'.2s', opacity:0});
            setTimeout(function(){ changeImage(nextImage) }, 200);
        }

        if( Dy == 1 )
            thumbsToggler.prop('checked', true);
        else if( Dy == -1 )
            thumbsToggler.prop('checked', false);
    }

    // manage the (bottom) thumbs strip
    thumbsStripe = (function(){
        var containerWidth = 0,
            scrollWidth    = 0,
            posFromLeft    = 0,    // Stripe position from the left of the screen
            stripePos      = 0,    // When relative mouse position inside the thumbs stripe
            animated       = null,
            padding,                 // in percentage to the containerWidth
            el, $el, ratio, scrollPos, pos;

        return{
            // returns a <ul> element which is populated with all the gallery links and thumbs
            generate : function(){
                var thumbsList = $('<ul>'),
                    elements   = [],
                    len        = this.imageLinks.length,
                    isHide     = false,
                    title, thumbSrc, link, type, i;

                for( i = 0; i < len; i++ ){

                    if ($(this.imageLinks[i]).parent().hasClass('bx-clone')) {
                        isHide = true;
                    }
                    else {
                        isHide = false;
                    }
                    
                    link = this.imageLinks[i];

                    thumbSrc = this.images[i][2];
                    // continue if has thumb
                    if( !thumbSrc )
                        continue;

                    title = this.images[i][1];
                    type = link.rel ? " class='" + link.rel +"'" : '';
                    elements.push('<li '+(isHide ? 'style="display:none;"' : '')+' '+ type +'><a href="'+ link.href +'"><img src="'+ thumbSrc +'" alt="" title="'+ title +'" /></a></li>');
                };
                thumbsList.html( elements.join('') );
                return thumbsList;
            },

            click : function(e){
                e.preventDefault();

                activeThumb.removeClass('active');
                activeThumb = $(this).parent().addClass('active');

                var imageIndex = $(this.parentNode).index();
                return changeImage(imageIndex, 0, 1);
            },

            changeActiveTimeout : null,
            /** Highlights the thumb which represents the photo and centres the thumbs viewer on it.
            **  @thumbClick - if a user clicked on a thumbnail, don't center on it
            */
            changeActive : function(index, delay, thumbClick){
                if( !options.thumbs )
                    return;

                var lastIndex = activeThumb.index();
                activeThumb.removeClass('active');
                activeThumb = thumbs.find('li').eq(index).addClass('active');

                if( thumbClick || !activeThumb[0] ) return;
                // set the scrollLeft position of the thumbs list to show the active thumb
                clearTimeout(this.changeActiveTimeout);
                // give the images time to to settle on their new sizes (because of css transition) and then calculate the center...
                this.changeActiveTimeout = setTimeout(
                    function(){
                        var pos = activeThumb[0].offsetLeft + activeThumb[0].clientWidth/2 - docElm.clientWidth/2;
                        delay ? thumbs.delay(800) : thumbs.stop();
                        thumbs.animate({scrollLeft: pos}, 500, 'swing');
                    }, 200);
            },

            // calculate the thumbs container width, if the window has been resized
            calc : function(e){
                el = thumbs[0];

                containerWidth       = el.clientWidth;
                scrollWidth          = el.scrollWidth;
                padding              = 0.15 * containerWidth;

                posFromLeft          = thumbs.offset().left;
                stripePos            = e.pageX - padding - posFromLeft;
                pos                  = stripePos / (containerWidth - padding*2);
                scrollPos            = (scrollWidth - containerWidth ) * pos;

                thumbs.animate({scrollLeft:scrollPos}, 200);

                clearTimeout(animated);
                animated = setTimeout(function(){
                    animated = null;
                }, 200);

                return this;
            },

            // move the stripe left or right according to mouse position
            move : function(e){
                // don't move anything until initial movement on 'mouseenter' has finished
                if( animated ) return;

                var ratio     = scrollWidth / containerWidth,
                    stripePos = e.pageX - padding - posFromLeft, // the mouse X position, "normalized" to the carousel position
                    pos, scrollPos;

                if( stripePos < 0) stripePos = 0; //

                pos = stripePos / (containerWidth - padding*2); // calculated position between 0 to 1
                // calculate the percentage of the mouse position within the carousel
                scrollPos = (scrollWidth - containerWidth ) * pos;

                raf(function(){
                    el.scrollLeft = scrollPos;
                });
            }
        }
    })();

    // Autoplay controller
    APControl = {
        autoPlayTimer : false,
        play : function(){
            APControl.autoPlayTimer = setTimeout(function(){ changeImage(nextImage) }, options.time);
            APControl.progress.start();
            autoplayBtn.removeClass('play');
            APControl.setTitle('Click to stop autoplay');
            options.autoplay = true;
        },
        pause : function(){
            clearTimeout(APControl.autoPlayTimer);
            APControl.progress.reset();
            autoplayBtn.addClass('play');
            APControl.setTitle('Click to resume autoplay');
            options.autoplay = false;
        },
        progress : {
            reset : function(){
                autoplayBtn.find('div').removeAttr('style');
                setTimeout(function(){ autoplayBtn.removeClass('playing') },200);
            },
            start : function(){
                if( !isOldIE)
                    autoplayBtn.find('div').css(transition, options.time+'ms');
                autoplayBtn.addClass('playing');
            }
        },
        // sets the button Title property
        setTitle : function(text){
            if(text)
                autoplayBtn.prop('title', text + ' (every ' + options.time/1000 + ' seconds)' );
        },
        // the button onClick handler
        toggle : function(e){
            e.stopPropagation();
            APControl[ options.autoplay ? 'pause' : 'play']();
        }
    }

    function getPrefixed(prop){
        var i, s = doc.createElement('p').style, v = ['ms','O','Moz','Webkit'];
        if( s[prop] == '' ) return prop;
        prop = prop.charAt(0).toUpperCase() + prop.slice(1);
        for( i = v.length; i--; )
            if( s[v[i] + prop] == '' )
                return (v[i] + prop);
    }

    function keyDown(event){
        var code = event.keyCode, ok = options.keys, result;
        // Prevent default keyboard action (like navigating inside the page)
        return $.inArray(code, ok.close) >= 0 && close() ||
               $.inArray(code, ok.next) >= 0 && !options.single && loophole(nextImage) ||
               $.inArray(code, ok.prev) >= 0 && !options.single && loophole(prevImage) || true;
    }

    function wheelNextPrev(e, dY, dX){
        if( dX == 1 )
            loophole(nextImage);
        else if( dX == -1 )
            loophole(prevImage);
    }


    // serves as a callback for pbPrevBtn / pbNextBtn buttons but also is called on keypress events
    function next_prev(){
        // don't get crazy when user clicks next or prev buttons rapidly
        //if( !image.hasClass('zoomable') )
        //  return false;

        var idx = (this.id == 'pbPrevBtn') ? prevImage : nextImage;

        loophole(idx);
        return false;
    }

    function updateIndexes(idx){
        lastActive = activeImage;
        activeImage = idx;
        activeURL = images[idx][0];
        prevImage = (activeImage || (options.loop ? images.length : 0)) - 1;
        nextImage = ((activeImage + 1) % images.length) || (options.loop ? 0 : -1);
    }

    // check if looping is allowed before changing image/video.
    // A pre-changeImage function, only for linear changes
    function loophole(idx){
        if( !options.loop ){
            var afterLast = activeImage == images.length-1 && idx == nextImage,
                beforeFirst = activeImage == 0 && idx == prevImage;

            if( afterLast || beforeFirst )
                return;
        }

        changeImage(idx);
    }

    changeImage = (function(){
        var timer;

        return function(imageIndex, firstTime, thumbClick){
            // throttle mechanism
            if( timer )
                return;

            timer = setTimeout(function(){
                timer = null;
            }, 150);

            if( !imageIndex || imageIndex < 0 )
                imageIndex = 0;

            // hide/show next-prev buttons
            if( !options.loop ){
                //nextBtn[ imageIndex == images.length-1 ? 'addClass' : 'removeClass' ]('pbHide');
                nextBtn.toggleClass('pbHide', imageIndex == images.length-1);
                //prevBtn[ imageIndex == 0 ? 'addClass' : 'removeClass' ]('pbHide');
                prevBtn.toggleClass('pbHide', imageIndex == 0);
            }

            // if there's a callback for this point:
            if( typeof options.beforeShow == "function")
                options.beforeShow(imageLinks[imageIndex]);

            overlay.removeClass('error');

            if( activeImage >= 0 )
                overlay.addClass( imageIndex > activeImage ? 'next' : 'prev' );

            updateIndexes(imageIndex);

            // reset things
            stop();
            video.empty();
            preload.onerror = null;
            image.add(video).data('zoom', 1);

            activeType = imageLinks[imageIndex].rel == 'video' ? 'video' : 'image';

            // check if current link is a video
            if( activeType == 'video' ){
                video.html( newVideo() ).addClass('pbHide');
                showContent(firstTime);
            }
            else{
                // give a tiny delay to the preloader, so it won't be showed when images load very quickly
                var loaderTimeout = setTimeout(function(){ overlay.addClass('pbLoading'); }, 50);

                if( isOldIE ) overlay.addClass('pbHide'); // should wait for the image onload. just hide the image while old IE display the preloader

                options.autoplay && APControl.progress.reset();
                preload = new Image();
                preload.onload = function(){
                    preload.onload = null;

                    if( prevImage >= 0 ) preloadPrev.src = images[prevImage][0];
                    if( nextImage >= 0 ) preloadNext.src = images[nextImage][0];

                    clearTimeout(loaderTimeout);
                    showContent(firstTime);
                };
                preload.onerror = imageError;
                preload.src = activeURL;
            }

            // Show Caption text
            captionText.on(transitionend, captionTextChange).addClass('change');
            if( firstTime || isOldIE ) captionTextChange();


            thumbsStripe.changeActive(imageIndex, firstTime, thumbClick);
            // Save url hash for current image
            history.save();
        }
    })();

    function newVideo(){
        var url = images[activeImage][0],
            sign = $('<a>').prop('href',images[activeImage][0])[0].search ? '&' : '?';
        url += sign + 'vq=hd720&wmode=opaque';
        return $("<iframe>").prop({ scrolling:'no', frameborder:0, allowTransparency:true, src:url }).attr({webkitAllowFullScreen:true, mozallowfullscreen:true, allowFullScreen:true});
    }

    // show the item's Title & Counter
    function captionTextChange(){
        captionText.off(transitionend).removeClass('change');
        // change caption's text
        if( options.counter ){
            try{
                var value = options.counter.replace('A', activeImage + 1).replace('B', images.length);
            }
            // if, for some reason, the above has failed from a bad "counter" value, reset and retry
            catch(err){
                options.counter = '(A/B)';
                captionTextChange();
            }
            caption.find('.counter').text(value);
        }
        if( options.title )
            caption.find('.title').html('<span>' + images[activeImage][1] + '</span>');
    }

    // Handles the history states when changing images
    var history = {
        save : function(){
            // only save to history urls which are not already in the hash
            if('pushState' in window.history && decodeURIComponent(window.location.hash.slice(1)) != activeURL && options.history ){
                window.history.pushState( 'photobox', doc.title + '-' + images[activeImage][1], window.location.pathname + window.location.search + '#' + encodeURIComponent(activeURL) );
            }
        },
        load : function(){
            if( options && !options.history ) return false;
            var hash = decodeURIComponent( window.location.hash.slice(1) ), i, j;
            if( !hash && overlay.hasClass('show') )
                close();

            $('a[href="' + hash + '"]').trigger('click.photobox');
        },
        clear : function(){
            if( options.history && 'pushState' in window.history )
                window.history.pushState('photobox', doc.title, window.location.pathname + window.location.search);
        }
    };

    // Add Photobox special `onpopstate` to the `onpopstate` function
    window.onpopstate = (function(){
        var cached = window.onpopstate;
        return function(event){
            cached && cached.apply(this, arguments);
            if( event.state == 'photobox' )
                history.load();
        }
    })();

    // handles all image loading error (if image is dead)
    function imageError(){
        overlay.addClass('error');
        image[0].src = blankImg; // set the source to a blank image
        preload.onerror = null;
    }

    // Shows the content (image/video) on the screen
    function showContent(firstTime){
        var out, showSaftyTimer;
        showSaftyTimer = setTimeout(show, 2000);

        // hides the current image and prepare ground for an image change
        pbLoader.fadeOut(300, function(){
            overlay.removeClass("pbLoading");
            pbLoader.removeAttr('style');
        });
        overlay.addClass('pbHide');

        image.add(video).removeAttr('style').removeClass('zoomable'); // while transitioning an image, do not apply the 'zoomable' class

        // check which element needs to transition-out:
        if( imageLinks[lastActive] != undefined && !firstTime && imageLinks[lastActive].rel == 'video' ){
            out = video;
            image.addClass('prepare');
        }
        else
            out = image;

        if( firstTime || isOldIE )
            show();
        else
            out.on(transitionend, show);

        // in case the 'transitionend' didn't fire
        // after hiding the last seen image, show the new one
        function show(){
            clearTimeout(showSaftyTimer);
            out.off(transitionend).css({'transition':'none'});
            overlay.removeClass('video');
            if( activeType == 'video' ){
                image[0].src = blankImg;
                video.addClass('prepare');
                overlay.addClass('video');
            }
            else
                image.prop({ 'src':activeURL, 'class':'prepare' });

            // filthy hack for the transitionend event, but cannot work without it:
            setTimeout(function(){
                image.add(video).removeAttr('style').removeClass('prepare');
                overlay.removeClass('pbHide next prev');
                setTimeout(function(){
                    image.add(video).on(transitionend, showDone);
                    if(isOldIE) showDone(); // IE9 and below don't support transitionEnd...
                }, 0);
            },50);
        }
    }

    // a callback whenever a transition of an image or a video is done
    function showDone(){
        image.add(video).off(transitionend).addClass('zoomable');
        if( activeType == 'video' )
            video.removeClass('pbHide');
        else{
            autoplayBtn && options.autoplay && APControl.play();
        }
        if( photobox && typeof photobox.callback == 'function' )
            photobox.callback.apply(imageLinks[activeImage]);
    }

    function scrollZoom(e, deltaY, deltaX){
        if( deltaX ) return false;

        if( activeType == 'video' ){
            var zoomLevel = video.data('zoom') || 1;
            zoomLevel += (deltaY / 10);
            if( zoomLevel < 0.5 )
                return false;

            video.data('zoom', zoomLevel).css({width:624*zoomLevel, height:351*zoomLevel});
        }
        else{
            var zoomLevel = image.data('zoom') || 1,
                getSize = image[0].getBoundingClientRect();

            zoomLevel += (deltaY / 10);

            if( zoomLevel < 0.1 )
                zoomLevel = 0.1;

            raf(function() {
                image.data('zoom', zoomLevel).css({'transform':'scale('+ zoomLevel +')'});
            });

            // check if image (by mouse) movement should take effect (if image is larger than the window
            if( getSize.height > docElm.clientHeight || getSize.width > docElm.clientWidth ){
                $(doc).on('mousemove.photobox', imageReposition);
            }
            else{
                $(doc).off('mousemove.photobox');
                image[0].style[transformOrigin] = '50% 50%';
            }
        }
        return false;
    }

    function thumbsResize(e, delta){
        e.preventDefault();
        e.stopPropagation(); // stop the event from bubbling up to the Overlay and enlarge the content itself
        var thumbList = photobox.thumbsList, h;
        thumbList.css('height', thumbList[0].clientHeight + (delta * 10) );
        h = caption[0].clientHeight / 2;
        wrapper[0].style.cssText = "margin-top: -"+ h +"px; padding: "+ h +"px 0;";
        thumbs.hide().show(0);
        //thumbs.trigger('mouseenter').trigger('mousemove');
    }

    // moves the image around during zoom mode on mousemove event
    function imageReposition(e){
        var y = (e.clientY / docElm.clientHeight) * (docElm.clientHeight + 200) - 100, // extend the range of the Y axis by 100 each side
            yDelta = y / docElm.clientHeight * 100,
            xDelta = e.clientX / docElm.clientWidth * 100,
            origin = xDelta.toFixed(2)+'% ' + yDelta.toFixed(2) +'%';

        raf(function() {
            image[0].style[transformOrigin] = origin;
        });
    }

    function stop(){
        clearTimeout(APControl.autoPlayTimer);
        $(doc).off('mousemove.photobox');
        preload.onload = function(){};
        preload.src = preloadPrev.src = preloadNext.src = activeURL;
    }

    function close(){
        if( !overlay.hasClass('show') )
            return false;

        stop();
        video.find('iframe').prop('src','').empty();
        Photobox.prototype.setup();
        history.clear();

        overlay.removeClass('on video').addClass('pbHide');
        activeImage = -1;

        image.on(transitionend, hide);
        isOldIE && hide();

        // the "photobox" instance might be needed for async transitionEnd functions, so give it some time before clearing it
        setTimeout(function(){
            photobox = null;
        },1000);

        function hide(){
            if( overlay[0].className == '' ) return; // if already hidden
            overlay.removeClass('show pbHide error pbLoading');
            image.removeAttr('class').removeAttr('style').off().data('zoom',1);
            // a hack to change the image src to nothing, because you can't do that in CHROME
            image[0].src = blankImg;

            caption.find('.title').empty();

            if(noPointerEvents) // pointer-events lack support in IE, so just hide the overlay
                setTimeout(function(){ overlay.hide(); }, 200);

            options.hideFlash && $('iframe, object, embed').css('visibility', 'visible');
        }

        // fall-back if the 'transitionend' event didn't fire
        setTimeout(hide, 500);
        // callback after closing the gallery
        if( typeof options.afterClose === 'function' )
            options.afterClose(overlay);
    }


    /**
    * jQuery Plugin to add basic "swipe" support on touch-enabled devices
    *
    * @author Yair Even Or
    * @version 1.0.0 (March 20, 2013)
    */
    $.event.special.swipe = {
        setup: function(){
            $(this).bind('touchstart', $.event.special.swipe.handler);
        },

        teardown: function(){
            $(this).unbind('touchstart', $.event.special.swipe.handler);
        },

        handler: function(event){
            var args = [].slice.call( arguments, 1 ), // clone arguments array, remove original event from cloned array
                touches = event.originalEvent.touches,
                startX, startY,
                deltaX = 0, deltaY = 0,
                that = this;

            event = $.event.fix(event);

            if( touches.length == 1 ){
                startX = touches[0].pageX;
                startY = touches[0].pageY;
                this.addEventListener('touchmove', onTouchMove, false);
            }

            function cancelTouch(){
                that.removeEventListener('touchmove', onTouchMove);
                startX = startY = null;
            }

            function onTouchMove(e){
                e.preventDefault();

                var Dx = startX - e.touches[0].pageX,
                    Dy = startY - e.touches[0].pageY;

                if( Math.abs(Dx) >= 20 ){
                    cancelTouch();
                    deltaX = (Dx > 0) ? -1 : 1;
                }
                else if( Math.abs(Dy) >= 20 ){
                    cancelTouch();
                    deltaY = (Dy > 0) ? 1 : -1;
                }

                event.type = 'swipe';
                args.unshift(event, deltaX, deltaY); // add back the new event to the front of the arguments with the delatas
                return ($.event.dispatch || $.event.handle).apply(that, args);
            }
        }
    };

    /* MouseWheel plugin
     * ! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
     * Licensed under the MIT License (LICENSE.txt).
     *
     * Version: 3.1.11
     *
     * Requires: jQuery 1.2.2+
     */
    !function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?module.exports=a:a(jQuery)}(function(a){function b(b){var g=b||window.event,h=i.call(arguments,1),j=0,l=0,m=0,n=0,o=0,p=0;if(b=a.event.fix(g),b.type="mousewheel","detail"in g&&(m=-1*g.detail),"wheelDelta"in g&&(m=g.wheelDelta),"wheelDeltaY"in g&&(m=g.wheelDeltaY),"wheelDeltaX"in g&&(l=-1*g.wheelDeltaX),"axis"in g&&g.axis===g.HORIZONTAL_AXIS&&(l=-1*m,m=0),j=0===m?l:m,"deltaY"in g&&(m=-1*g.deltaY,j=m),"deltaX"in g&&(l=g.deltaX,0===m&&(j=-1*l)),0!==m||0!==l){if(1===g.deltaMode){var q=a.data(this,"mousewheel-line-height");j*=q,m*=q,l*=q}else if(2===g.deltaMode){var r=a.data(this,"mousewheel-page-height");j*=r,m*=r,l*=r}if(n=Math.max(Math.abs(m),Math.abs(l)),(!f||f>n)&&(f=n,d(g,n)&&(f/=40)),d(g,n)&&(j/=40,l/=40,m/=40),j=Math[j>=1?"floor":"ceil"](j/f),l=Math[l>=1?"floor":"ceil"](l/f),m=Math[m>=1?"floor":"ceil"](m/f),k.settings.normalizeOffset&&this.getBoundingClientRect){var s=this.getBoundingClientRect();o=b.clientX-s.left,p=b.clientY-s.top}return b.deltaX=l,b.deltaY=m,b.deltaFactor=f,b.offsetX=o,b.offsetY=p,b.deltaMode=0,h.unshift(b,j,l,m),e&&clearTimeout(e),e=setTimeout(c,200),(a.event.dispatch||a.event.handle).apply(this,h)}}function c(){f=null}function d(a,b){return k.settings.adjustOldDeltas&&"mousewheel"===a.type&&b%120===0}var e,f,g=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],h="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],i=Array.prototype.slice;if(a.event.fixHooks)for(var j=g.length;j;)a.event.fixHooks[g[--j]]=a.event.mouseHooks;var k=a.event.special.mousewheel={version:"3.1.11",setup:function(){if(this.addEventListener)for(var c=h.length;c;)this.addEventListener(h[--c],b,!1);else this.onmousewheel=b;a.data(this,"mousewheel-line-height",k.getLineHeight(this)),a.data(this,"mousewheel-page-height",k.getPageHeight(this))},teardown:function(){if(this.removeEventListener)for(var c=h.length;c;)this.removeEventListener(h[--c],b,!1);else this.onmousewheel=null;a.removeData(this,"mousewheel-line-height"),a.removeData(this,"mousewheel-page-height")},getLineHeight:function(b){var c=a(b)["offsetParent"in a.fn?"offsetParent":"parent"]();return c.length||(c=a("body")),parseInt(c.css("fontSize"),10)},getPageHeight:function(b){return a(b).height()},settings:{adjustOldDeltas:!0,normalizeOffset:!0}};a.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})});

    ////////////// ON DOCUMENT READY /////////////////
    $(doc).ready(prepareDOM);

    // Expose:
    window._photobox = {
        DOM      : {
            overlay : overlay
        },
        close    : close,
        history  : history,
        defaults : defaults
    };
})(jQuery, document, window);;
!function(h,i,n,a){function l(t,e){this.settings=null,this.options=h.extend({},l.Defaults,e),this.$element=h(t),this._handlers={},this._plugins={},this._supress={},this._current=null,this._speed=null,this._coordinates=[],this._breakpoint=null,this._width=null,this._items=[],this._clones=[],this._mergers=[],this._widths=[],this._invalidated={},this._pipe=[],this._drag={time:null,target:null,pointer:null,stage:{start:null,current:null},direction:null},this._states={current:{},tags:{initializing:["busy"],animating:["busy"],dragging:["interacting"]}},h.each(["onResize","onThrottledResize"],h.proxy(function(t,e){this._handlers[e]=h.proxy(this[e],this)},this)),h.each(l.Plugins,h.proxy(function(t,e){this._plugins[t.charAt(0).toLowerCase()+t.slice(1)]=new e(this)},this)),h.each(l.Workers,h.proxy(function(t,e){this._pipe.push({filter:e.filter,run:h.proxy(e.run,this)})},this)),this.setup(),this.initialize()}l.Defaults={items:3,loop:!1,center:!1,rewind:!1,checkVisibility:!0,mouseDrag:!0,touchDrag:!0,pullDrag:!0,freeDrag:!1,margin:0,stagePadding:0,merge:!1,mergeFit:!0,autoWidth:!1,startPosition:0,rtl:!1,smartSpeed:250,fluidSpeed:!1,dragEndSpeed:!1,responsive:{},responsiveRefreshRate:200,responsiveBaseElement:i,fallbackEasing:"swing",info:!1,nestedItemSelector:!1,itemElement:"div",stageElement:"div",refreshClass:"owl-refresh",loadedClass:"owl-loaded",loadingClass:"owl-loading",rtlClass:"owl-rtl",responsiveClass:"owl-responsive",dragClass:"owl-drag",itemClass:"owl-item",stageClass:"owl-stage",stageOuterClass:"owl-stage-outer",grabClass:"owl-grab"},l.Width={Default:"default",Inner:"inner",Outer:"outer"},l.Type={Event:"event",State:"state"},l.Plugins={},l.Workers=[{filter:["width","settings"],run:function(){this._width=this.$element.width()}},{filter:["width","items","settings"],run:function(t){t.current=this._items&&this._items[this.relative(this._current)]}},{filter:["items","settings"],run:function(){this.$stage.children(".cloned").remove()}},{filter:["width","items","settings"],run:function(t){var e=this.settings.margin||"",i=!this.settings.autoWidth,s=this.settings.rtl,n={width:"auto","margin-left":s?e:"","margin-right":s?"":e};!i&&this.$stage.children().css(n),t.css=n}},{filter:["width","items","settings"],run:function(t){var e=(this.width()/this.settings.items).toFixed(3)-this.settings.margin,i=null,s=this._items.length,n=!this.settings.autoWidth,o=[];for(t.items={merge:!1,width:e};s--;)i=this._mergers[s],i=this.settings.mergeFit&&Math.min(i,this.settings.items)||i,t.items.merge=1<i||t.items.merge,o[s]=n?e*i:this._items[s].width();this._widths=o}},{filter:["items","settings"],run:function(){var t=[],e=this._items,i=this.settings,s=Math.max(2*i.items,4),n=2*Math.ceil(e.length/2),o=i.loop&&e.length?i.rewind?s:Math.max(s,n):0,r="",a="";for(o/=2;0<o;)t.push(this.normalize(t.length/2,!0)),r+=e[t[t.length-1]][0].outerHTML,t.push(this.normalize(e.length-1-(t.length-1)/2,!0)),a=e[t[t.length-1]][0].outerHTML+a,o-=1;this._clones=t,h(r).addClass("cloned").appendTo(this.$stage),h(a).addClass("cloned").prependTo(this.$stage)}},{filter:["width","items","settings"],run:function(){for(var t=this.settings.rtl?1:-1,e=this._clones.length+this._items.length,i=-1,s=0,n=0,o=[];++i<e;)s=o[i-1]||0,n=this._widths[this.relative(i)]+this.settings.margin,o.push(s+n*t);this._coordinates=o}},{filter:["width","items","settings"],run:function(){var t=this.settings.stagePadding,e=this._coordinates,i={width:Math.ceil(Math.abs(e[e.length-1]))+2*t,"padding-left":t||"","padding-right":t||""};this.$stage.css(i)}},{filter:["width","items","settings"],run:function(t){var e=this._coordinates.length,i=!this.settings.autoWidth,s=this.$stage.children();if(i&&t.items.merge)for(;e--;)t.css.width=this._widths[this.relative(e)],s.eq(e).css(t.css);else i&&(t.css.width=t.items.width,s.css(t.css))}},{filter:["items"],run:function(){this._coordinates.length<1&&this.$stage.removeAttr("style")}},{filter:["width","items","settings"],run:function(t){t.current=t.current?this.$stage.children().index(t.current):0,t.current=Math.max(this.minimum(),Math.min(this.maximum(),t.current)),this.reset(t.current)}},{filter:["position"],run:function(){this.animate(this.coordinates(this._current))}},{filter:["width","position","items","settings"],run:function(){var t,e,i,s,n=this.settings.rtl?1:-1,o=2*this.settings.stagePadding,r=this.coordinates(this.current())+o,a=r+this.width()*n,h=[];for(i=0,s=this._coordinates.length;i<s;i++)t=this._coordinates[i-1]||0,e=Math.abs(this._coordinates[i])+o*n,(this.op(t,"<=",r)&&this.op(t,">",a)||this.op(e,"<",r)&&this.op(e,">",a))&&h.push(i);this.$stage.children(".active").removeClass("active"),this.$stage.children(":eq("+h.join("), :eq(")+")").addClass("active"),this.$stage.children(".center").removeClass("center"),this.settings.center&&this.$stage.children().eq(this.current()).addClass("center")}}],l.prototype.initializeStage=function(){this.$stage=this.$element.find("."+this.settings.stageClass),this.$stage.length||(this.$element.addClass(this.options.loadingClass),this.$stage=h("<"+this.settings.stageElement+' class="'+this.settings.stageClass+'"/>').wrap('<div class="'+this.settings.stageOuterClass+'"/>'),this.$element.append(this.$stage.parent()))},l.prototype.initializeItems=function(){var t=this.$element.find(".owl-item");if(t.length)return this._items=t.get().map(function(t){return h(t)}),this._mergers=this._items.map(function(){return 1}),void this.refresh();this.replace(this.$element.children().not(this.$stage.parent())),this.isVisible()?this.refresh():this.invalidate("width"),this.$element.removeClass(this.options.loadingClass).addClass(this.options.loadedClass)},l.prototype.initialize=function(){var t,e,i;(this.enter("initializing"),this.trigger("initialize"),this.$element.toggleClass(this.settings.rtlClass,this.settings.rtl),this.settings.autoWidth&&!this.is("pre-loading"))&&(t=this.$element.find("img"),e=this.settings.nestedItemSelector?"."+this.settings.nestedItemSelector:a,i=this.$element.children(e).width(),t.length&&i<=0&&this.preloadAutoWidthImages(t));this.initializeStage(),this.initializeItems(),this.registerEventHandlers(),this.leave("initializing"),this.trigger("initialized")},l.prototype.isVisible=function(){return!this.settings.checkVisibility||this.$element.is(":visible")},l.prototype.setup=function(){var e=this.viewport(),t=this.options.responsive,i=-1,s=null;t?(h.each(t,function(t){t<=e&&i<t&&(i=Number(t))}),"function"==typeof(s=h.extend({},this.options,t[i])).stagePadding&&(s.stagePadding=s.stagePadding()),delete s.responsive,s.responsiveClass&&this.$element.attr("class",this.$element.attr("class").replace(new RegExp("("+this.options.responsiveClass+"-)\\S+\\s","g"),"$1"+i))):s=h.extend({},this.options),this.trigger("change",{property:{name:"settings",value:s}}),this._breakpoint=i,this.settings=s,this.invalidate("settings"),this.trigger("changed",{property:{name:"settings",value:this.settings}})},l.prototype.optionsLogic=function(){this.settings.autoWidth&&(this.settings.stagePadding=!1,this.settings.merge=!1)},l.prototype.prepare=function(t){var e=this.trigger("prepare",{content:t});return e.data||(e.data=h("<"+this.settings.itemElement+"/>").addClass(this.options.itemClass).append(t)),this.trigger("prepared",{content:e.data}),e.data},l.prototype.update=function(){for(var t=0,e=this._pipe.length,i=h.proxy(function(t){return this[t]},this._invalidated),s={};t<e;)(this._invalidated.all||0<h.grep(this._pipe[t].filter,i).length)&&this._pipe[t].run(s),t++;this._invalidated={},!this.is("valid")&&this.enter("valid")},l.prototype.width=function(t){switch(t=t||l.Width.Default){case l.Width.Inner:case l.Width.Outer:return this._width;default:return this._width-2*this.settings.stagePadding+this.settings.margin}},l.prototype.refresh=function(){this.enter("refreshing"),this.trigger("refresh"),this.setup(),this.optionsLogic(),this.$element.addClass(this.options.refreshClass),this.update(),this.$element.removeClass(this.options.refreshClass),this.leave("refreshing"),this.trigger("refreshed")},l.prototype.onThrottledResize=function(){i.clearTimeout(this.resizeTimer),this.resizeTimer=i.setTimeout(this._handlers.onResize,this.settings.responsiveRefreshRate)},l.prototype.onResize=function(){return!!this._items.length&&(this._width!==this.$element.width()&&(!!this.isVisible()&&(this.enter("resizing"),this.trigger("resize").isDefaultPrevented()?(this.leave("resizing"),!1):(this.invalidate("width"),this.refresh(),this.leave("resizing"),void this.trigger("resized")))))},l.prototype.registerEventHandlers=function(){h.support.transition&&this.$stage.on(h.support.transition.end+".owl.core",h.proxy(this.onTransitionEnd,this)),!1!==this.settings.responsive&&this.on(i,"resize",this._handlers.onThrottledResize),this.settings.mouseDrag&&(this.$element.addClass(this.options.dragClass),this.$stage.on("mousedown.owl.core",h.proxy(this.onDragStart,this)),this.$stage.on("dragstart.owl.core selectstart.owl.core",function(){return!1})),this.settings.touchDrag&&(this.$stage.on("touchstart.owl.core",h.proxy(this.onDragStart,this)),this.$stage.on("touchcancel.owl.core",h.proxy(this.onDragEnd,this)))},l.prototype.onDragStart=function(t){var e=null;3!==t.which&&(e=h.support.transform?{x:(e=this.$stage.css("transform").replace(/.*\(|\)| /g,"").split(","))[16===e.length?12:4],y:e[16===e.length?13:5]}:(e=this.$stage.position(),{x:this.settings.rtl?e.left+this.$stage.width()-this.width()+this.settings.margin:e.left,y:e.top}),this.is("animating")&&(h.support.transform?this.animate(e.x):this.$stage.stop(),this.invalidate("position")),this.$element.toggleClass(this.options.grabClass,"mousedown"===t.type),this.speed(0),this._drag.time=(new Date).getTime(),this._drag.target=h(t.target),this._drag.stage.start=e,this._drag.stage.current=e,this._drag.pointer=this.pointer(t),h(n).on("mouseup.owl.core touchend.owl.core",h.proxy(this.onDragEnd,this)),h(n).one("mousemove.owl.core touchmove.owl.core",h.proxy(function(t){var e=this.difference(this._drag.pointer,this.pointer(t));h(n).on("mousemove.owl.core touchmove.owl.core",h.proxy(this.onDragMove,this)),Math.abs(e.x)<Math.abs(e.y)&&this.is("valid")||(t.preventDefault(),this.enter("dragging"),this.trigger("drag"))},this)))},l.prototype.onDragMove=function(t){var e=null,i=null,s=null,n=this.difference(this._drag.pointer,this.pointer(t)),o=this.difference(this._drag.stage.start,n);this.is("dragging")&&(t.preventDefault(),this.settings.loop?(e=this.coordinates(this.minimum()),i=this.coordinates(this.maximum()+1)-e,o.x=((o.x-e)%i+i)%i+e):(e=this.settings.rtl?this.coordinates(this.maximum()):this.coordinates(this.minimum()),i=this.settings.rtl?this.coordinates(this.minimum()):this.coordinates(this.maximum()),s=this.settings.pullDrag?-1*n.x/5:0,o.x=Math.max(Math.min(o.x,e+s),i+s)),this._drag.stage.current=o,this.animate(o.x))},l.prototype.onDragEnd=function(t){var e=this.difference(this._drag.pointer,this.pointer(t)),i=this._drag.stage.current,s=0<e.x^this.settings.rtl?"left":"right";h(n).off(".owl.core"),this.$element.removeClass(this.options.grabClass),(0!==e.x&&this.is("dragging")||!this.is("valid"))&&(this.speed(this.settings.dragEndSpeed||this.settings.smartSpeed),this.current(this.closest(i.x,0!==e.x?s:this._drag.direction)),this.invalidate("position"),this.update(),this._drag.direction=s,(3<Math.abs(e.x)||300<(new Date).getTime()-this._drag.time)&&this._drag.target.one("click.owl.core",function(){return!1})),this.is("dragging")&&(this.leave("dragging"),this.trigger("dragged"))},l.prototype.closest=function(i,s){var n=-1,o=this.width(),r=this.coordinates();return this.settings.freeDrag||h.each(r,h.proxy(function(t,e){return"left"===s&&e-30<i&&i<e+30?n=t:"right"===s&&e-o-30<i&&i<e-o+30?n=t+1:this.op(i,"<",e)&&this.op(i,">",r[t+1]!==a?r[t+1]:e-o)&&(n="left"===s?t+1:t),-1===n},this)),this.settings.loop||(this.op(i,">",r[this.minimum()])?n=i=this.minimum():this.op(i,"<",r[this.maximum()])&&(n=i=this.maximum())),n},l.prototype.animate=function(t){var e=0<this.speed();this.is("animating")&&this.onTransitionEnd(),e&&(this.enter("animating"),this.trigger("translate")),h.support.transform3d&&h.support.transition?this.$stage.css({transform:"translate3d("+t+"px,0px,0px)",transition:this.speed()/1e3+"s"}):e?this.$stage.animate({left:t+"px"},this.speed(),this.settings.fallbackEasing,h.proxy(this.onTransitionEnd,this)):this.$stage.css({left:t+"px"})},l.prototype.is=function(t){return this._states.current[t]&&0<this._states.current[t]},l.prototype.current=function(t){if(t===a)return this._current;if(0===this._items.length)return a;if(t=this.normalize(t),this._current!==t){var e=this.trigger("change",{property:{name:"position",value:t}});e.data!==a&&(t=this.normalize(e.data)),this._current=t,this.invalidate("position"),this.trigger("changed",{property:{name:"position",value:this._current}})}return this._current},l.prototype.invalidate=function(t){return"string"===h.type(t)&&(this._invalidated[t]=!0,this.is("valid")&&this.leave("valid")),h.map(this._invalidated,function(t,e){return e})},l.prototype.reset=function(t){(t=this.normalize(t))!==a&&(this._speed=0,this._current=t,this.suppress(["translate","translated"]),this.animate(this.coordinates(t)),this.release(["translate","translated"]))},l.prototype.normalize=function(t,e){var i=this._items.length,s=e?0:this._clones.length;return!this.isNumeric(t)||i<1?t=a:(t<0||i+s<=t)&&(t=((t-s/2)%i+i)%i+s/2),t},l.prototype.relative=function(t){return t-=this._clones.length/2,this.normalize(t,!0)},l.prototype.maximum=function(t){var e,i,s,n=this.settings,o=this._coordinates.length;if(n.loop)o=this._clones.length/2+this._items.length-1;else if(n.autoWidth||n.merge){if(e=this._items.length)for(i=this._items[--e].width(),s=this.$element.width();e--&&!(s<(i+=this._items[e].width()+this.settings.margin)););o=e+1}else o=n.center?this._items.length-1:this._items.length-n.items;return t&&(o-=this._clones.length/2),Math.max(o,0)},l.prototype.minimum=function(t){return t?0:this._clones.length/2},l.prototype.items=function(t){return t===a?this._items.slice():(t=this.normalize(t,!0),this._items[t])},l.prototype.mergers=function(t){return t===a?this._mergers.slice():(t=this.normalize(t,!0),this._mergers[t])},l.prototype.clones=function(i){var e=this._clones.length/2,s=e+this._items.length,n=function(t){return t%2==0?s+t/2:e-(t+1)/2};return i===a?h.map(this._clones,function(t,e){return n(e)}):h.map(this._clones,function(t,e){return t===i?n(e):null})},l.prototype.speed=function(t){return t!==a&&(this._speed=t),this._speed},l.prototype.coordinates=function(t){var e,i=1,s=t-1;return t===a?h.map(this._coordinates,h.proxy(function(t,e){return this.coordinates(e)},this)):(this.settings.center?(this.settings.rtl&&(i=-1,s=t+1),e=this._coordinates[t],e+=(this.width()-e+(this._coordinates[s]||0))/2*i):e=this._coordinates[s]||0,e=Math.ceil(e))},l.prototype.duration=function(t,e,i){return 0===i?0:Math.min(Math.max(Math.abs(e-t),1),6)*Math.abs(i||this.settings.smartSpeed)},l.prototype.to=function(t,e){var i=this.current(),s=null,n=t-this.relative(i),o=(0<n)-(n<0),r=this._items.length,a=this.minimum(),h=this.maximum();this.settings.loop?(!this.settings.rewind&&Math.abs(n)>r/2&&(n+=-1*o*r),(s=(((t=i+n)-a)%r+r)%r+a)!==t&&s-n<=h&&0<s-n&&(i=s-n,t=s,this.reset(i))):t=this.settings.rewind?(t%(h+=1)+h)%h:Math.max(a,Math.min(h,t)),this.speed(this.duration(i,t,e)),this.current(t),this.isVisible()&&this.update()},l.prototype.next=function(t){t=t||!1,this.to(this.relative(this.current())+1,t)},l.prototype.prev=function(t){t=t||!1,this.to(this.relative(this.current())-1,t)},l.prototype.onTransitionEnd=function(t){if(t!==a&&(t.stopPropagation(),(t.target||t.srcElement||t.originalTarget)!==this.$stage.get(0)))return!1;this.leave("animating"),this.trigger("translated")},l.prototype.viewport=function(){var t;return this.options.responsiveBaseElement!==i?t=h(this.options.responsiveBaseElement).width():i.innerWidth?t=i.innerWidth:n.documentElement&&n.documentElement.clientWidth?t=n.documentElement.clientWidth:console.warn("Can not detect viewport width."),t},l.prototype.replace=function(t){this.$stage.empty(),this._items=[],t&&(t=t instanceof jQuery?t:h(t)),this.settings.nestedItemSelector&&(t=t.find("."+this.settings.nestedItemSelector)),t.filter(function(){return 1===this.nodeType}).each(h.proxy(function(t,e){e=this.prepare(e),this.$stage.append(e),this._items.push(e),this._mergers.push(1*e.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)},this)),this.reset(this.isNumeric(this.settings.startPosition)?this.settings.startPosition:0),this.invalidate("items")},l.prototype.add=function(t,e){var i=this.relative(this._current);e=e===a?this._items.length:this.normalize(e,!0),t=t instanceof jQuery?t:h(t),this.trigger("add",{content:t,position:e}),t=this.prepare(t),0===this._items.length||e===this._items.length?(0===this._items.length&&this.$stage.append(t),0!==this._items.length&&this._items[e-1].after(t),this._items.push(t),this._mergers.push(1*t.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)):(this._items[e].before(t),this._items.splice(e,0,t),this._mergers.splice(e,0,1*t.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)),this._items[i]&&this.reset(this._items[i].index()),this.invalidate("items"),this.trigger("added",{content:t,position:e})},l.prototype.remove=function(t){(t=this.normalize(t,!0))!==a&&(this.trigger("remove",{content:this._items[t],position:t}),this._items[t].remove(),this._items.splice(t,1),this._mergers.splice(t,1),this.invalidate("items"),this.trigger("removed",{content:null,position:t}))},l.prototype.preloadAutoWidthImages=function(t){t.each(h.proxy(function(t,e){this.enter("pre-loading"),e=h(e),h(new Image).one("load",h.proxy(function(t){e.attr("src",t.target.src),e.css("opacity",1),this.leave("pre-loading"),!this.is("pre-loading")&&!this.is("initializing")&&this.refresh()},this)).attr("src",e.attr("src")||e.attr("data-src")||e.attr("data-src-retina"))},this))},l.prototype.destroy=function(){for(var t in this.$element.off(".owl.core"),this.$stage.off(".owl.core"),h(n).off(".owl.core"),!1!==this.settings.responsive&&(i.clearTimeout(this.resizeTimer),this.off(i,"resize",this._handlers.onThrottledResize)),this._plugins)this._plugins[t].destroy();this.$stage.children(".cloned").remove(),this.$stage.unwrap(),this.$stage.children().contents().unwrap(),this.$stage.children().unwrap(),this.$stage.remove(),this.$element.removeClass(this.options.refreshClass).removeClass(this.options.loadingClass).removeClass(this.options.loadedClass).removeClass(this.options.rtlClass).removeClass(this.options.dragClass).removeClass(this.options.grabClass).attr("class",this.$element.attr("class").replace(new RegExp(this.options.responsiveClass+"-\\S+\\s","g"),"")).removeData("owl.carousel")},l.prototype.op=function(t,e,i){var s=this.settings.rtl;switch(e){case"<":return s?i<t:t<i;case">":return s?t<i:i<t;case">=":return s?t<=i:i<=t;case"<=":return s?i<=t:t<=i}},l.prototype.on=function(t,e,i,s){t.addEventListener?t.addEventListener(e,i,s):t.attachEvent&&t.attachEvent("on"+e,i)},l.prototype.off=function(t,e,i,s){t.removeEventListener?t.removeEventListener(e,i,s):t.detachEvent&&t.detachEvent("on"+e,i)},l.prototype.trigger=function(t,e,i,s,n){var o={item:{count:this._items.length,index:this.current()}},r=h.camelCase(h.grep(["on",t,i],function(t){return t}).join("-").toLowerCase()),a=h.Event([t,"owl",i||"carousel"].join(".").toLowerCase(),h.extend({relatedTarget:this},o,e));return this._supress[t]||(h.each(this._plugins,function(t,e){e.onTrigger&&e.onTrigger(a)}),this.register({type:l.Type.Event,name:t}),this.$element.trigger(a),this.settings&&"function"==typeof this.settings[r]&&this.settings[r].call(this,a)),a},l.prototype.enter=function(t){h.each([t].concat(this._states.tags[t]||[]),h.proxy(function(t,e){this._states.current[e]===a&&(this._states.current[e]=0),this._states.current[e]++},this))},l.prototype.leave=function(t){h.each([t].concat(this._states.tags[t]||[]),h.proxy(function(t,e){this._states.current[e]--},this))},l.prototype.register=function(i){if(i.type===l.Type.Event){if(h.event.special[i.name]||(h.event.special[i.name]={}),!h.event.special[i.name].owl){var e=h.event.special[i.name]._default;h.event.special[i.name]._default=function(t){return!e||!e.apply||t.namespace&&-1!==t.namespace.indexOf("owl")?t.namespace&&-1<t.namespace.indexOf("owl"):e.apply(this,arguments)},h.event.special[i.name].owl=!0}}else i.type===l.Type.State&&(this._states.tags[i.name]?this._states.tags[i.name]=this._states.tags[i.name].concat(i.tags):this._states.tags[i.name]=i.tags,this._states.tags[i.name]=h.grep(this._states.tags[i.name],h.proxy(function(t,e){return h.inArray(t,this._states.tags[i.name])===e},this)))},l.prototype.suppress=function(t){h.each(t,h.proxy(function(t,e){this._supress[e]=!0},this))},l.prototype.release=function(t){h.each(t,h.proxy(function(t,e){delete this._supress[e]},this))},l.prototype.pointer=function(t){var e={x:null,y:null};return(t=(t=t.originalEvent||t||i.event).touches&&t.touches.length?t.touches[0]:t.changedTouches&&t.changedTouches.length?t.changedTouches[0]:t).pageX?(e.x=t.pageX,e.y=t.pageY):(e.x=t.clientX,e.y=t.clientY),e},l.prototype.isNumeric=function(t){return!isNaN(parseFloat(t))},l.prototype.difference=function(t,e){return{x:t.x-e.x,y:t.y-e.y}},h.fn.wpexOwlCarousel=function(e){var s=Array.prototype.slice.call(arguments,1);return this.each(function(){var t=h(this),i=t.data("owl.carousel");i||(i=new l(this,"object"==typeof e&&e),t.data("owl.carousel",i),h.each(["next","prev","to","destroy","refresh","replace","add","remove"],function(t,e){i.register({type:l.Type.Event,name:e}),i.$element.on(e+".owl.carousel.core",h.proxy(function(t){t.namespace&&t.relatedTarget!==this&&(this.suppress([e]),i[e].apply(this,[].slice.call(arguments,1)),this.release([e]))},i))})),"string"==typeof e&&"_"!==e.charAt(0)&&i[e].apply(i,s)})},h.fn.wpexOwlCarousel.Constructor=l}(window.Zepto||window.jQuery,window,document),function(e,i,t,s){var n=function(t){this._core=t,this._interval=null,this._visible=null,this._handlers={"initialized.owl.carousel":e.proxy(function(t){t.namespace&&this._core.settings.autoRefresh&&this.watch()},this)},this._core.options=e.extend({},n.Defaults,this._core.options),this._core.$element.on(this._handlers)};n.Defaults={autoRefresh:!0,autoRefreshInterval:500},n.prototype.watch=function(){this._interval||(this._visible=this._core.isVisible(),this._interval=i.setInterval(e.proxy(this.refresh,this),this._core.settings.autoRefreshInterval))},n.prototype.refresh=function(){this._core.isVisible()!==this._visible&&(this._visible=!this._visible,this._core.$element.toggleClass("owl-hidden",!this._visible),this._visible&&this._core.invalidate("width")&&this._core.refresh())},n.prototype.destroy=function(){var t,e;for(t in i.clearInterval(this._interval),this._handlers)this._core.$element.off(t,this._handlers[t]);for(e in Object.getOwnPropertyNames(this))"function"!=typeof this[e]&&(this[e]=null)},e.fn.wpexOwlCarousel.Constructor.Plugins.AutoRefresh=n}(window.Zepto||window.jQuery,window,document),function(a,o,t,e){var i=function(t){this._core=t,this._loaded=[],this._handlers={"initialized.owl.carousel change.owl.carousel resized.owl.carousel":a.proxy(function(t){if(t.namespace&&this._core.settings&&this._core.settings.lazyLoad&&(t.property&&"position"==t.property.name||"initialized"==t.type))for(var e=this._core.settings,i=e.center&&Math.ceil(e.items/2)||e.items,s=e.center&&-1*i||0,n=(t.property&&void 0!==t.property.value?t.property.value:this._core.current())+s,o=this._core.clones().length,r=a.proxy(function(t,e){this.load(e)},this);s++<i;)this.load(o/2+this._core.relative(n)),o&&a.each(this._core.clones(this._core.relative(n)),r),n++},this)},this._core.options=a.extend({},i.Defaults,this._core.options),this._core.$element.on(this._handlers)};i.Defaults={lazyLoad:!1},i.prototype.load=function(t){var e=this._core.$stage.children().eq(t),i=e&&e.find(".owl-lazy");!i||-1<a.inArray(e.get(0),this._loaded)||(i.each(a.proxy(function(t,e){var i,s=a(e),n=1<o.devicePixelRatio&&s.attr("data-src-retina")||s.attr("data-src")||s.attr("data-srcset");this._core.trigger("load",{element:s,url:n},"lazy"),s.is("img")?s.one("load.owl.lazy",a.proxy(function(){s.css("opacity",1),this._core.trigger("loaded",{element:s,url:n},"lazy")},this)).attr("src",n):s.is("source")?s.one("load.owl.lazy",a.proxy(function(){this._core.trigger("loaded",{element:s,url:n},"lazy")},this)).attr("srcset",n):((i=new Image).onload=a.proxy(function(){s.css({"background-image":'url("'+n+'")',opacity:"1"}),this._core.trigger("loaded",{element:s,url:n},"lazy")},this),i.src=n)},this)),this._loaded.push(e.get(0)))},i.prototype.destroy=function(){var t,e;for(t in this.handlers)this._core.$element.off(t,this.handlers[t]);for(e in Object.getOwnPropertyNames(this))"function"!=typeof this[e]&&(this[e]=null)},a.fn.wpexOwlCarousel.Constructor.Plugins.Lazy=i}(window.Zepto||window.jQuery,window,document),function(o,i,t,e){var s=function(t){this._core=t,this._handlers={"initialized.owl.carousel refreshed.owl.carousel":o.proxy(function(t){t.namespace&&this._core.settings.autoHeight&&this.update()},this),"changed.owl.carousel":o.proxy(function(t){t.namespace&&this._core.settings.autoHeight&&"position"===t.property.name&&(console.log("update called"),this.update())},this),"loaded.owl.lazy":o.proxy(function(t){t.namespace&&this._core.settings.autoHeight&&t.element.closest("."+this._core.settings.itemClass).index()===this._core.current()&&this.update()},this)},this._core.options=o.extend({},s.Defaults,this._core.options),this._core.$element.on(this._handlers),this._intervalId=null;var e=this;o(i).on("load",function(){e._core.settings.autoHeight&&e.update()}),o(i).resize(function(){e._core.settings.autoHeight&&(null!=e._intervalId&&clearTimeout(e._intervalId),e._intervalId=setTimeout(function(){e.update()},250))})};s.Defaults={autoHeight:!1,autoHeightClass:"owl-height"},s.prototype.update=function(){var t,e=this._core._current,i=e+this._core.settings.items,s=this._core.$stage.children().toArray().slice(e,i),n=[];o.each(s,function(t,e){n.push(o(e).height())}),t=Math.max.apply(null,n),this._core.$stage.parent().height(t).addClass(this._core.settings.autoHeightClass)},s.prototype.destroy=function(){var t,e;for(t in this._handlers)this._core.$element.off(t,this._handlers[t]);for(e in Object.getOwnPropertyNames(this))"function"!=typeof this[e]&&(this[e]=null)},o.fn.wpexOwlCarousel.Constructor.Plugins.AutoHeight=s}(window.Zepto||window.jQuery,window,document),function(c,t,e,i){var s=function(t){this._core=t,this._videos={},this._playing=null,this._handlers={"initialized.owl.carousel":c.proxy(function(t){t.namespace&&this._core.register({type:"state",name:"playing",tags:["interacting"]})},this),"resize.owl.carousel":c.proxy(function(t){t.namespace&&this._core.settings.video&&this.isInFullScreen()&&t.preventDefault()},this),"refreshed.owl.carousel":c.proxy(function(t){t.namespace&&this._core.is("resizing")&&this._core.$stage.find(".cloned .owl-video-frame").remove()},this),"changed.owl.carousel":c.proxy(function(t){t.namespace&&"position"===t.property.name&&this._playing&&this.stop()},this),"prepared.owl.carousel":c.proxy(function(t){if(t.namespace){var e=c(t.content).find(".owl-video");e.length&&(e.css("display","none"),this.fetch(e,c(t.content)))}},this)},this._core.options=c.extend({},s.Defaults,this._core.options),this._core.$element.on(this._handlers),this._core.$element.on("click.owl.video",".owl-video-play-icon",c.proxy(function(t){this.play(t)},this))};s.Defaults={video:!1,videoHeight:!1,videoWidth:!1},s.prototype.fetch=function(t,e){var i=t.attr("data-vimeo-id")?"vimeo":t.attr("data-vzaar-id")?"vzaar":"youtube",s=t.attr("data-vimeo-id")||t.attr("data-youtube-id")||t.attr("data-vzaar-id"),n=t.attr("data-width")||this._core.settings.videoWidth,o=t.attr("data-height")||this._core.settings.videoHeight,r=t.attr("href");if(!r)throw new Error("Missing video URL.");if(-1<(s=r.match(/(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/))[3].indexOf("youtu"))i="youtube";else if(-1<s[3].indexOf("vimeo"))i="vimeo";else{if(!(-1<s[3].indexOf("vzaar")))throw new Error("Video URL not supported.");i="vzaar"}s=s[6],this._videos[r]={type:i,id:s,width:n,height:o},e.attr("data-video",r),this.thumbnail(t,this._videos[r])},s.prototype.thumbnail=function(e,t){var i,s,n=t.width&&t.height?'style="width:'+t.width+"px;height:"+t.height+'px;"':"",o=e.find("img"),r="src",a="",h=this._core.settings,l=function(t){'<div class="owl-video-play-icon"></div>',i=h.lazyLoad?'<div class="owl-video-tn '+a+'" '+r+'="'+t+'"></div>':'<div class="owl-video-tn" style="opacity:1;background-image:url('+t+')"></div>',e.after(i),e.after('<div class="owl-video-play-icon"></div>')};if(e.wrap('<div class="owl-video-wrapper"'+n+"></div>"),this._core.settings.lazyLoad&&(r="data-src",a="owl-lazy"),o.length)return l(o.attr(r)),o.remove(),!1;"youtube"===t.type?(s="//img.youtube.com/vi/"+t.id+"/hqdefault.jpg",l(s)):"vimeo"===t.type?c.ajax({type:"GET",url:"//vimeo.com/api/v2/video/"+t.id+".json",jsonp:"callback",dataType:"jsonp",success:function(t){s=t[0].thumbnail_large,l(s)}}):"vzaar"===t.type&&c.ajax({type:"GET",url:"//vzaar.com/api/videos/"+t.id+".json",jsonp:"callback",dataType:"jsonp",success:function(t){s=t.framegrab_url,l(s)}})},s.prototype.stop=function(){this._core.trigger("stop",null,"video"),this._playing.find(".owl-video-frame").remove(),this._playing.removeClass("owl-video-playing"),this._playing=null,this._core.leave("playing"),this._core.trigger("stopped",null,"video")},s.prototype.play=function(t){var e,i=c(t.target).closest("."+this._core.settings.itemClass),s=this._videos[i.attr("data-video")],n=s.width||"100%",o=s.height||this._core.$stage.height();this._playing||(this._core.enter("playing"),this._core.trigger("play",null,"video"),i=this._core.items(this._core.relative(i.index())),this._core.reset(i.index()),"youtube"===s.type?e='<iframe width="'+n+'" height="'+o+'" src="//www.youtube.com/embed/'+s.id+"?autoplay=1&rel=0&v="+s.id+'" frameborder="0" allowfullscreen></iframe>':"vimeo"===s.type?e='<iframe src="//player.vimeo.com/video/'+s.id+'?autoplay=1" width="'+n+'" height="'+o+'" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>':"vzaar"===s.type&&(e='<iframe frameborder="0"height="'+o+'"width="'+n+'" allowfullscreen mozallowfullscreen webkitAllowFullScreen src="//view.vzaar.com/'+s.id+'/player?autoplay=true"></iframe>'),c('<div class="owl-video-frame">'+e+"</div>").insertAfter(i.find(".owl-video")),this._playing=i.addClass("owl-video-playing"))},s.prototype.isInFullScreen=function(){var t=e.fullscreenElement||e.mozFullScreenElement||e.webkitFullscreenElement;return t&&c(t).parent().hasClass("owl-video-frame")},s.prototype.destroy=function(){var t,e;for(t in this._core.$element.off("click.owl.video"),this._handlers)this._core.$element.off(t,this._handlers[t]);for(e in Object.getOwnPropertyNames(this))"function"!=typeof this[e]&&(this[e]=null)},c.fn.wpexOwlCarousel.Constructor.Plugins.Video=s}(window.Zepto||window.jQuery,window,document),function(r,t,e,i){var s=function(t){this.core=t,this.core.options=r.extend({},s.Defaults,this.core.options),this.swapping=!0,this.previous=void 0,this.next=void 0,this.handlers={"change.owl.carousel":r.proxy(function(t){t.namespace&&"position"==t.property.name&&(this.previous=this.core.current(),this.next=t.property.value)},this),"drag.owl.carousel dragged.owl.carousel translated.owl.carousel":r.proxy(function(t){t.namespace&&(this.swapping="translated"==t.type)},this),"translate.owl.carousel":r.proxy(function(t){t.namespace&&this.swapping&&(this.core.options.animateOut||this.core.options.animateIn)&&this.swap()},this)},this.core.$element.on(this.handlers)};s.Defaults={animateOut:!1,animateIn:!1},s.prototype.swap=function(){if(1===this.core.settings.items&&r.support.animation&&r.support.transition){this.core.speed(0);var t,e=r.proxy(this.clear,this),i=this.core.$stage.children().eq(this.previous),s=this.core.$stage.children().eq(this.next),n=this.core.settings.animateIn,o=this.core.settings.animateOut;this.core.current()!==this.previous&&(o&&(t=this.core.coordinates(this.previous)-this.core.coordinates(this.next),i.one(r.support.animation.end,e).css({left:t+"px"}).addClass("animated owl-animated-out").addClass(o)),n&&s.one(r.support.animation.end,e).addClass("animated owl-animated-in").addClass(n))}},s.prototype.clear=function(t){r(t.target).css({left:""}).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut),this.core.onTransitionEnd()},s.prototype.destroy=function(){var t,e;for(t in this.handlers)this.core.$element.off(t,this.handlers[t]);for(e in Object.getOwnPropertyNames(this))"function"!=typeof this[e]&&(this[e]=null)},r.fn.wpexOwlCarousel.Constructor.Plugins.Animate=s}(window.Zepto||window.jQuery,window,document),function(s,n,e,t){var i=function(t){this._core=t,this._call=null,this._time=0,this._timeout=0,this._paused=!0,this._handlers={"changed.owl.carousel":s.proxy(function(t){t.namespace&&"settings"===t.property.name?this._core.settings.autoplay?this.play():this.stop():t.namespace&&"position"===t.property.name&&this._paused&&(this._time=0)},this),"initialized.owl.carousel":s.proxy(function(t){t.namespace&&this._core.settings.autoplay&&this.play()},this),"play.owl.autoplay":s.proxy(function(t,e,i){t.namespace&&this.play(e,i)},this),"stop.owl.autoplay":s.proxy(function(t){t.namespace&&this.stop()},this),"mouseover.owl.autoplay":s.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.pause()},this),"mouseleave.owl.autoplay":s.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.play()},this),"touchstart.owl.core":s.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.pause()},this),"touchend.owl.core":s.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.play()},this)},this._core.$element.on(this._handlers),this._core.options=s.extend({},i.Defaults,this._core.options)};i.Defaults={autoplay:!1,autoplayTimeout:5e3,autoplayHoverPause:!1,autoplaySpeed:!1},i.prototype._next=function(t){this._call=n.setTimeout(s.proxy(this._next,this,t),this._timeout*(Math.round(this.read()/this._timeout)+1)-this.read()),this._core.is("interacting")||e.hidden||this._core.next(t||this._core.settings.autoplaySpeed)},i.prototype.read=function(){return(new Date).getTime()-this._time},i.prototype.play=function(t,e){var i;this._core.is("rotating")||this._core.enter("rotating"),t=t||this._core.settings.autoplayTimeout,i=Math.min(this._time%(this._timeout||t),t),this._paused?(this._time=this.read(),this._paused=!1):n.clearTimeout(this._call),this._time+=this.read()%t-i,this._timeout=t,this._call=n.setTimeout(s.proxy(this._next,this,e),t-i)},i.prototype.stop=function(){this._core.is("rotating")&&(this._time=0,this._paused=!0,n.clearTimeout(this._call),this._core.leave("rotating"))},i.prototype.pause=function(){this._core.is("rotating")&&!this._paused&&(this._time=this.read(),this._paused=!0,n.clearTimeout(this._call))},i.prototype.destroy=function(){var t,e;for(t in this.stop(),this._handlers)this._core.$element.off(t,this._handlers[t]);for(e in Object.getOwnPropertyNames(this))"function"!=typeof this[e]&&(this[e]=null)},s.fn.wpexOwlCarousel.Constructor.Plugins.autoplay=i}(window.Zepto||window.jQuery,window,document),function(o,t,e,i){"use strict";var s=function(t){this._core=t,this._initialized=!1,this._pages=[],this._controls={},this._templates=[],this.$element=this._core.$element,this._overrides={next:this._core.next,prev:this._core.prev,to:this._core.to},this._handlers={"prepared.owl.carousel":o.proxy(function(t){t.namespace&&this._core.settings.dotsData&&this._templates.push('<div class="'+this._core.settings.dotClass+'">'+o(t.content).find("[data-dot]").addBack("[data-dot]").attr("data-dot")+"</div>")},this),"added.owl.carousel":o.proxy(function(t){t.namespace&&this._core.settings.dotsData&&this._templates.splice(t.position,0,this._templates.pop())},this),"remove.owl.carousel":o.proxy(function(t){t.namespace&&this._core.settings.dotsData&&this._templates.splice(t.position,1)},this),"changed.owl.carousel":o.proxy(function(t){t.namespace&&"position"==t.property.name&&this.draw()},this),"initialized.owl.carousel":o.proxy(function(t){t.namespace&&!this._initialized&&(this._core.trigger("initialize",null,"navigation"),this.initialize(),this.update(),this.draw(),this._initialized=!0,this._core.trigger("initialized",null,"navigation"))},this),"refreshed.owl.carousel":o.proxy(function(t){t.namespace&&this._initialized&&(this._core.trigger("refresh",null,"navigation"),this.update(),this.draw(),this._core.trigger("refreshed",null,"navigation"))},this)},this._core.options=o.extend({},s.Defaults,this._core.options),this.$element.on(this._handlers)};s.Defaults={nav:!1,navText:['<span aria-label="Previous">&#x2039;</span>','<span aria-label="Next">&#x203a;</span>'],navSpeed:!1,navElement:'button type="button" role="presentation"',navContainer:!1,navContainerClass:"owl-nav",navClass:["owl-prev","owl-next"],slideBy:1,dotClass:"owl-dot",dotsClass:"owl-dots",dots:!0,dotsEach:!1,dotsData:!1,dotsSpeed:!1,dotsContainer:!1},s.prototype.initialize=function(){var t,i=this._core.settings;for(t in this._controls.$relative=(i.navContainer?o(i.navContainer):o("<div>").addClass(i.navContainerClass).appendTo(this.$element)).addClass("disabled"),this._controls.$previous=o("<"+i.navElement+">").addClass(i.navClass[0]).html(i.navText[0]).prependTo(this._controls.$relative).on("click",o.proxy(function(t){this.prev(i.navSpeed)},this)),this._controls.$next=o("<"+i.navElement+">").addClass(i.navClass[1]).html(i.navText[1]).appendTo(this._controls.$relative).on("click",o.proxy(function(t){this.next(i.navSpeed)},this)),i.dotsData||(this._templates=[o('<button role="button">').addClass(i.dotClass).append(o("<span>")).prop("outerHTML")]),this._controls.$absolute=(i.dotsContainer?o(i.dotsContainer):o("<div>").addClass(i.dotsClass).appendTo(this.$element)).addClass("disabled"),this._controls.$absolute.on("click","button",o.proxy(function(t){var e=o(t.target).parent().is(this._controls.$absolute)?o(t.target).index():o(t.target).parent().index();t.preventDefault(),this.to(e,i.dotsSpeed)},this)),this._overrides)this._core[t]=o.proxy(this[t],this)},s.prototype.destroy=function(){var t,e,i,s,n;for(t in n=this._core.settings,this._handlers)this.$element.off(t,this._handlers[t]);for(e in this._controls)"$relative"===e&&n.navContainer?this._controls[e].html(""):this._controls[e].remove();for(s in this.overides)this._core[s]=this._overrides[s];for(i in Object.getOwnPropertyNames(this))"function"!=typeof this[i]&&(this[i]=null)},s.prototype.update=function(){var t,e,i=this._core.clones().length/2,s=i+this._core.items().length,n=this._core.maximum(!0),o=this._core.settings,r=o.center||o.autoWidth||o.dotsData?1:o.dotsEach||o.items;if("page"!==o.slideBy&&(o.slideBy=Math.min(o.slideBy,o.items)),o.dots||"page"==o.slideBy)for(this._pages=[],t=i,e=0;t<s;t++){if(r<=e||0===e){if(this._pages.push({start:Math.min(n,t-i),end:t-i+r-1}),Math.min(n,t-i)===n)break;e=0,0}e+=this._core.mergers(this._core.relative(t))}},s.prototype.draw=function(){var t,e=this._core.settings,i=this._core.items().length<=e.items,s=this._core.relative(this._core.current()),n=e.loop||e.rewind;this._controls.$relative.toggleClass("disabled",!e.nav||i),e.nav&&(this._controls.$previous.toggleClass("disabled",!n&&s<=this._core.minimum(!0)),this._controls.$next.toggleClass("disabled",!n&&s>=this._core.maximum(!0))),this._controls.$absolute.toggleClass("disabled",!e.dots||i),e.dots&&(t=this._pages.length-this._controls.$absolute.children().length,e.dotsData&&0!==t?this._controls.$absolute.html(this._templates.join("")):0<t?this._controls.$absolute.append(new Array(t+1).join(this._templates[0])):t<0&&this._controls.$absolute.children().slice(t).remove(),this._controls.$absolute.find(".active").removeClass("active"),this._controls.$absolute.children().eq(o.inArray(this.current(),this._pages)).addClass("active"))},s.prototype.onTrigger=function(t){var e=this._core.settings;t.page={index:o.inArray(this.current(),this._pages),count:this._pages.length,size:e&&(e.center||e.autoWidth||e.dotsData?1:e.dotsEach||e.items)}},s.prototype.current=function(){var i=this._core.relative(this._core.current());return o.grep(this._pages,o.proxy(function(t,e){return t.start<=i&&t.end>=i},this)).pop()},s.prototype.getPosition=function(t){var e,i,s=this._core.settings;return"page"==s.slideBy?(e=o.inArray(this.current(),this._pages),i=this._pages.length,t?++e:--e,e=this._pages[(e%i+i)%i].start):(e=this._core.relative(this._core.current()),i=this._core.items().length,t?e+=s.slideBy:e-=s.slideBy),e},s.prototype.next=function(t){o.proxy(this._overrides.to,this._core)(this.getPosition(!0),t)},s.prototype.prev=function(t){o.proxy(this._overrides.to,this._core)(this.getPosition(!1),t)},s.prototype.to=function(t,e,i){var s;!i&&this._pages.length?(s=this._pages.length,o.proxy(this._overrides.to,this._core)(this._pages[(t%s+s)%s].start,e)):o.proxy(this._overrides.to,this._core)(t,e)},o.fn.wpexOwlCarousel.Constructor.Plugins.Navigation=s}(window.Zepto||window.jQuery,window,document),function(s,n,t,e){"use strict";var i=function(t){this._core=t,this._hashes={},this.$element=this._core.$element,this._handlers={"initialized.owl.carousel":s.proxy(function(t){t.namespace&&"URLHash"===this._core.settings.startPosition&&s(n).trigger("hashchange.owl.navigation")},this),"prepared.owl.carousel":s.proxy(function(t){if(t.namespace){var e=s(t.content).find("[data-hash]").addBack("[data-hash]").attr("data-hash");if(!e)return;this._hashes[e]=t.content}},this),"changed.owl.carousel":s.proxy(function(t){if(t.namespace&&"position"===t.property.name){var i=this._core.items(this._core.relative(this._core.current())),e=s.map(this._hashes,function(t,e){return t===i?e:null}).join();if(!e||n.location.hash.slice(1)===e)return;n.location.hash=e}},this)},this._core.options=s.extend({},i.Defaults,this._core.options),this.$element.on(this._handlers),s(n).on("hashchange.owl.navigation",s.proxy(function(t){var e=n.location.hash.substring(1),i=this._core.$stage.children(),s=this._hashes[e]&&i.index(this._hashes[e]);void 0!==s&&s!==this._core.current()&&this._core.to(this._core.relative(s),!1,!0)},this))};i.Defaults={URLhashListener:!1},i.prototype.destroy=function(){var t,e;for(t in s(n).off("hashchange.owl.navigation"),this._handlers)this._core.$element.off(t,this._handlers[t]);for(e in Object.getOwnPropertyNames(this))"function"!=typeof this[e]&&(this[e]=null)},s.fn.wpexOwlCarousel.Constructor.Plugins.Hash=i}(window.Zepto||window.jQuery,window,document),function(n,t,e,o){var r=n("<support>").get(0).style,a="Webkit Moz O ms".split(" "),i={transition:{end:{WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd",transition:"transitionend"}},animation:{end:{WebkitAnimation:"webkitAnimationEnd",MozAnimation:"animationend",OAnimation:"oAnimationEnd",animation:"animationend"}}},s=function(){return!!c("transform")},h=function(){return!!c("perspective")},l=function(){return!!c("animation")};function c(t,i){var s=!1,e=t.charAt(0).toUpperCase()+t.slice(1);return n.each((t+" "+a.join(e+" ")+e).split(" "),function(t,e){if(r[e]!==o)return s=!i||e,!1}),s}function p(t){return c(t,!0)}(function(){return!!c("transition")})()&&(n.support.transition=new String(p("transition")),n.support.transition.end=i.transition.end[n.support.transition]),l()&&(n.support.animation=new String(p("animation")),n.support.animation.end=i.animation.end[n.support.animation]),s()&&(n.support.transform=new String(p("transform")),n.support.transform3d=h())}(window.Zepto||window.jQuery,window,document);;
/*! This file is auto-generated */
/*!
 * imagesLoaded PACKAGED v4.1.4
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

!function(e,t){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",t):"object"==typeof module&&module.exports?module.exports=t():e.EvEmitter=t()}("undefined"!=typeof window?window:this,function(){function e(){}var t=e.prototype;return t.on=function(e,t){if(e&&t){var i=this._events=this._events||{},n=i[e]=i[e]||[];return n.indexOf(t)==-1&&n.push(t),this}},t.once=function(e,t){if(e&&t){this.on(e,t);var i=this._onceEvents=this._onceEvents||{},n=i[e]=i[e]||{};return n[t]=!0,this}},t.off=function(e,t){var i=this._events&&this._events[e];if(i&&i.length){var n=i.indexOf(t);return n!=-1&&i.splice(n,1),this}},t.emitEvent=function(e,t){var i=this._events&&this._events[e];if(i&&i.length){i=i.slice(0),t=t||[];for(var n=this._onceEvents&&this._onceEvents[e],o=0;o<i.length;o++){var r=i[o],s=n&&n[r];s&&(this.off(e,r),delete n[r]),r.apply(this,t)}return this}},t.allOff=function(){delete this._events,delete this._onceEvents},e}),function(e,t){"use strict";"function"==typeof define&&define.amd?define(["ev-emitter/ev-emitter"],function(i){return t(e,i)}):"object"==typeof module&&module.exports?module.exports=t(e,require("ev-emitter")):e.imagesLoaded=t(e,e.EvEmitter)}("undefined"!=typeof window?window:this,function(e,t){function i(e,t){for(var i in t)e[i]=t[i];return e}function n(e){if(Array.isArray(e))return e;var t="object"==typeof e&&"number"==typeof e.length;return t?d.call(e):[e]}function o(e,t,r){if(!(this instanceof o))return new o(e,t,r);var s=e;return"string"==typeof e&&(s=document.querySelectorAll(e)),s?(this.elements=n(s),this.options=i({},this.options),"function"==typeof t?r=t:i(this.options,t),r&&this.on("always",r),this.getImages(),h&&(this.jqDeferred=new h.Deferred),void setTimeout(this.check.bind(this))):void a.error("Bad element for imagesLoaded "+(s||e))}function r(e){this.img=e}function s(e,t){this.url=e,this.element=t,this.img=new Image}var h=e.jQuery,a=e.console,d=Array.prototype.slice;o.prototype=Object.create(t.prototype),o.prototype.options={},o.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},o.prototype.addElementImages=function(e){"IMG"==e.nodeName&&this.addImage(e),this.options.background===!0&&this.addElementBackgroundImages(e);var t=e.nodeType;if(t&&u[t]){for(var i=e.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var r=e.querySelectorAll(this.options.background);for(n=0;n<r.length;n++){var s=r[n];this.addElementBackgroundImages(s)}}}};var u={1:!0,9:!0,11:!0};return o.prototype.addElementBackgroundImages=function(e){var t=getComputedStyle(e);if(t)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(t.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,e),n=i.exec(t.backgroundImage)}},o.prototype.addImage=function(e){var t=new r(e);this.images.push(t)},o.prototype.addBackground=function(e,t){var i=new s(e,t);this.images.push(i)},o.prototype.check=function(){function e(e,i,n){setTimeout(function(){t.progress(e,i,n)})}var t=this;return this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?void this.images.forEach(function(t){t.once("progress",e),t.check()}):void this.complete()},o.prototype.progress=function(e,t,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded,this.emitEvent("progress",[this,e,t]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,e),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&a&&a.log("progress: "+i,e,t)},o.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(e,[this]),this.emitEvent("always",[this]),this.jqDeferred){var t=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[t](this)}},r.prototype=Object.create(t.prototype),r.prototype.check=function(){var e=this.getIsImageComplete();return e?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),void(this.proxyImage.src=this.img.src))},r.prototype.getIsImageComplete=function(){return this.img.complete&&this.img.naturalWidth},r.prototype.confirm=function(e,t){this.isLoaded=e,this.emitEvent("progress",[this,this.img,t])},r.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},r.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},r.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},r.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype=Object.create(r.prototype),s.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url;var e=this.getIsImageComplete();e&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},s.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype.confirm=function(e,t){this.isLoaded=e,this.emitEvent("progress",[this,this.element,t])},o.makeJQueryPlugin=function(t){t=t||e.jQuery,t&&(h=t,h.fn.imagesLoaded=function(e,t){var i=new o(this,e,t);return i.jqDeferred.promise(h(this))})},o.makeJQueryPlugin(),o});;
"function"!=typeof window.vcexCarousels&&(window.vcexCarousels=function(e){if("undefined"!=typeof jQuery&&"function"==typeof jQuery.fn.wpexOwlCarousel){e&&e.childNodes||(e=document);var n=vcex_carousels_params,s=document.body.classList.contains("rtl"),t=e.querySelectorAll(".wpex-carousel"),a=function(e){var t=JSON.parse(e.dataset.wpexCarousel);if(t){var a={animateIn:!1,animateOut:!1,lazyLoad:!1,autoplayHoverPause:!0,rtl:s,navText:['<span class="ticon ticon-chevron-left" aria-hidden="true"></span><span class="screen-reader-text">'+n.i18n.PREV+"</span>",'<span class="ticon ticon-chevron-right" aria-hidden="true"></span><span class="screen-reader-text">'+n.i18n.NEXT+"</span>"],responsive:{0:{items:t.itemsMobilePortrait},480:{items:t.itemsMobileLandscape},768:{items:t.itemsTablet},960:{items:t.items}}};jQuery(e).wpexOwlCarousel(jQuery.extend(!0,{},a,t))}else console.log("Total Notice: The Carousel template in your child theme needs updating to include wpex-carousel data attribute.")};t.forEach(function(e){"function"==typeof imagesLoaded?imagesLoaded(e,function(){a(e)}):a(e)})}}),"interactive"===document.readyState||"complete"===document.readyState?setTimeout(vcexCarousels,0):document.addEventListener("DOMContentLoaded",vcexCarousels,!1);;
var sbi_js_exists=void 0!==sbi_js_exists;sbi_js_exists||(!function(i){function e(){var i,e,t,s=s||{VER:"0.9.944"};s.bgs_Available=!1,s.bgs_CheckRunned=!1,function(i){i.fn.extend({sbi_imgLiquid:function(e){this.defaults={fill:!0,verticalAlign:"center",horizontalAlign:"center",useBackgroundSize:!0,useDataHtmlAttr:!0,responsive:!0,delay:0,fadeInTime:0,removeBoxBackground:!0,hardPixels:!0,responsiveCheckTime:500,timecheckvisibility:500,onStart:null,onFinish:null,onItemStart:null,onItemFinish:null,onItemError:null},function(){if(!s.bgs_CheckRunned){s.bgs_CheckRunned=!0;var e=i('<span style="background-size:cover" />');i("body").append(e),function(){var i=e[0];if(i&&window.getComputedStyle){var t=window.getComputedStyle(i,null);t&&t.backgroundSize&&(s.bgs_Available="cover"===t.backgroundSize)}}(),e.remove()}}();var t=this;return this.options=e,this.settings=i.extend({},this.defaults,this.options),this.settings.onStart&&this.settings.onStart(),this.each(function(e){function n(){(r.responsive||c.data("sbi_imgLiquid_oldProcessed"))&&c.data("sbi_imgLiquid_settings")&&(r=c.data("sbi_imgLiquid_settings"),l.actualSize=l.get(0).offsetWidth+l.get(0).offsetHeight/1e4,l.sizeOld&&l.actualSize!==l.sizeOld&&a(),l.sizeOld=l.actualSize,setTimeout(n,r.responsiveCheckTime))}function o(){c.data("sbi_imgLiquid_error",!0),l.addClass("sbi_imgLiquid_error"),r.onItemError&&r.onItemError(e,l,c),d()}function a(){var i,t,s,n,o,a,h,g,f=0,u=0,b=l.width(),_=l.height();void 0===c.data("owidth")&&c.data("owidth",c[0].width),void 0===c.data("oheight")&&c.data("oheight",c[0].height),r.fill===b/_>=c.data("owidth")/c.data("oheight")?(i="100%",t="auto",s=Math.floor(b),n=Math.floor(b*(c.data("oheight")/c.data("owidth")))):(i="auto",t="100%",s=Math.floor(_*(c.data("owidth")/c.data("oheight"))),n=Math.floor(_)),h=b-s,"left"===(o=r.horizontalAlign.toLowerCase())&&(u=0),"center"===o&&(u=.5*h),"right"===o&&(u=h),-1!==o.indexOf("%")&&((o=parseInt(o.replace("%",""),10))>0&&(u=h*o*.01)),g=_-n,"left"===(a=r.verticalAlign.toLowerCase())&&(f=0),"center"===a&&(f=.5*g),"bottom"===a&&(f=g),-1!==a.indexOf("%")&&((a=parseInt(a.replace("%",""),10))>0&&(f=g*a*.01)),r.hardPixels&&(i=s,t=n),c.css({width:i,height:t,"margin-left":Math.floor(u),"margin-top":Math.floor(f)}),c.data("sbi_imgLiquid_oldProcessed")||(c.fadeTo(r.fadeInTime,1),c.data("sbi_imgLiquid_oldProcessed",!0),r.removeBoxBackground&&l.css("background-image","none"),l.addClass("sbi_imgLiquid_nobgSize"),l.addClass("sbi_imgLiquid_ready")),r.onItemFinish&&r.onItemFinish(e,l,c),d()}function d(){e===t.length-1&&t.settings.onFinish&&t.settings.onFinish()}var r=t.settings,l=i(this),c=i("img:first",l);return c.length?(c.data("sbi_imgLiquid_settings")?(l.removeClass("sbi_imgLiquid_error").removeClass("sbi_imgLiquid_ready"),r=i.extend({},c.data("sbi_imgLiquid_settings"),t.options)):r=i.extend({},t.settings,function(){var i={};if(t.settings.useDataHtmlAttr){var e=l.attr("data-sbi_imgLiquid-fill"),n=l.attr("data-sbi_imgLiquid-horizontalAlign"),o=l.attr("data-sbi_imgLiquid-verticalAlign");("true"===e||"false"===e)&&(i.fill=Boolean("true"===e)),void 0===n||"left"!==n&&"center"!==n&&"right"!==n&&-1===n.indexOf("%")||(i.horizontalAlign=n),void 0===o||"top"!==o&&"bottom"!==o&&"center"!==o&&-1===o.indexOf("%")||(i.verticalAlign=o)}return s.isIE&&t.settings.ieFadeInDisabled&&(i.fadeInTime=0),i}()),c.data("sbi_imgLiquid_settings",r),r.onItemStart&&r.onItemStart(e,l,c),void(s.bgs_Available&&r.useBackgroundSize?(-1===l.css("background-image").indexOf(encodeURI(c.attr("src")))&&l.css({"background-image":'url("'+encodeURI(c.attr("src"))+'")'}),l.css({"background-size":r.fill?"cover":"contain","background-position":(r.horizontalAlign+" "+r.verticalAlign).toLowerCase(),"background-repeat":"no-repeat"}),i("a:first",l).css({display:"block",width:"100%",height:"100%"}),i("img",l).css({display:"none"}),r.onItemFinish&&r.onItemFinish(e,l,c),l.addClass("sbi_imgLiquid_bgSize"),l.addClass("sbi_imgLiquid_ready"),d()):function t(){if(c.data("oldSrc")&&c.data("oldSrc")!==c.attr("src")){var s=c.clone().removeAttr("style");return s.data("sbi_imgLiquid_settings",c.data("sbi_imgLiquid_settings")),c.parent().prepend(s),c.remove(),(c=s)[0].width=0,void setTimeout(t,10)}return c.data("sbi_imgLiquid_oldProcessed")?void a():(c.data("sbi_imgLiquid_oldProcessed",!1),c.data("oldSrc",c.attr("src")),i("img:not(:first)",l).css("display","none"),l.css({overflow:"hidden"}),c.fadeTo(0,0).removeAttr("width").removeAttr("height").css({visibility:"visible","max-width":"none","max-height":"none",width:"auto",height:"auto",display:"block"}),c.on("error",o),c[0].onerror=o,function i(){c.data("sbi_imgLiquid_error")||c.data("sbi_imgLiquid_loaded")||c.data("sbi_imgLiquid_oldProcessed")||(l.is(":visible")&&c[0].complete&&c[0].width>0&&c[0].height>0?(c.data("sbi_imgLiquid_loaded",!0),setTimeout(a,e*r.delay)):setTimeout(i,r.timecheckvisibility))}(),void n())}())):void o()})}})}(jQuery),i=s.injectCss,e=document.getElementsByTagName("head")[0],(t=document.createElement("style")).type="text/css",t.styleSheet?t.styleSheet.cssText=i:t.appendChild(document.createTextNode(i)),e.appendChild(t)}function t(){this.feeds={},this.options=sb_instagram_js_options}function s(i,e,t){this.el=i,this.index=e,this.settings=t,this.minImageWidth=0,this.imageResolution=150,this.resizedImages={},this.needsResizing=[],this.outOfPages=!1,this.page=1,this.isInitialized=!1}function n(e,t){i.ajax({url:sbiajaxurl,type:"post",data:e,success:t})}t.prototype={createPage:function(e,t){void 0!==window.sbiajaxurl&&-1!==window.sbiajaxurl.indexOf(window.location.hostname)||(window.sbiajaxurl=location.protocol+"//"+window.location.hostname+"/wp-admin/admin-ajax.php"),i(".sbi_no_js_error_message").remove(),i(".sbi_no_js").removeClass("sbi_no_js"),e(t)},createFeeds:function(e){e.whenFeedsCreated(i(".sbi").each(function(e){i(this).attr("data-sbi-index",e+1);var t=i(this),o=void 0!==t.attr("data-sbi-flags")?t.attr("data-sbi-flags").split(","):[],a=void 0!==t.attr("data-options")?JSON.parse(t.attr("data-options")):{};if(o.indexOf("testAjax")>-1){window.sbi.triggeredTest=!0;n({action:"sbi_on_ajax_test_trigger"},function(i){console.log("did test")})}var d={cols:t.attr("data-cols"),colsmobile:void 0!==t.attr("data-colsmobile")&&"same"!==t.attr("data-colsmobile")?t.attr("data-colsmobile"):t.attr("data-cols"),num:t.attr("data-num"),imgRes:t.attr("data-res"),feedID:t.attr("data-feedid"),postID:"undefind"!=typeof t.attr("data-postid")?t.attr("data-postid"):"unknown",shortCodeAtts:t.attr("data-shortcode-atts"),resizingEnabled:-1===o.indexOf("resizeDisable"),imageLoadEnabled:-1===o.indexOf("imageLoadDisable"),debugEnabled:o.indexOf("debug")>-1,favorLocal:o.indexOf("favorLocal")>-1,ajaxPostLoad:o.indexOf("ajaxPostLoad")>-1,gdpr:o.indexOf("gdpr")>-1,overrideBlockCDN:o.indexOf("overrideBlockCDN")>-1,consentGiven:!1,locator:o.indexOf("locator")>-1,autoMinRes:1,general:a};window.sbi.feeds[e]=function(i,e,t){return new s(i,e,t)}(this,e,d),window.sbi.feeds[e].setResizedImages(),window.sbi.feeds[e].init();var r=jQuery.Event("sbiafterfeedcreate");r.feed=window.sbi.feeds[e],jQuery(window).trigger(r)}))},afterFeedsCreated:function(){i(".sb_instagram_header").each(function(){var e=i(this);e.find(".sbi_header_link").on("mouseenter mouseleave",function(i){switch(i.type){case"mouseenter":e.find(".sbi_header_img_hover").addClass("sbi_fade_in");break;case"mouseleave":e.find(".sbi_header_img_hover").removeClass("sbi_fade_in")}})})},encodeHTML:function(i){return void 0===i?"":i.replace(/(>)/g,"&gt;").replace(/(<)/g,"&lt;").replace(/(&lt;br\/&gt;)/g,"<br>").replace(/(&lt;br&gt;)/g,"<br>")},urlDetect:function(i){return i.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)}},s.prototype={init:function(){var e=this;e.settings.consentGiven=e.checkConsent(),i(this.el).find(".sbi_photo").parent("p").length&&i(this.el).addClass("sbi_no_autop"),i(this.el).find("#sbi_mod_error").length&&i(this.el).prepend(i(this.el).find("#sbi_mod_error")),this.settings.ajaxPostLoad?this.getNewPostSet():this.afterInitialImagesLoaded();var t,s=(t=0,function(i,e){clearTimeout(t),t=setTimeout(i,e)});jQuery(window).on("resize",function(){s(function(){e.afterResize()},500)}),i(this.el).find(".sbi_item").each(function(){e.lazyLoadCheck(i(this))})},initLayout:function(){},afterInitialImagesLoaded:function(){this.initLayout(),this.loadMoreButtonInit(),this.hideExtraImagesForWidth(),this.beforeNewImagesRevealed(),this.revealNewImages(),this.afterNewImagesRevealed()},afterResize:function(){this.setImageHeight(),this.setImageResolution(),this.maybeRaiseImageResolution(),this.setImageSizeClass()},afterLoadMoreClicked:function(i){i.find(".sbi_loader").removeClass("sbi_hidden"),i.find(".sbi_btn_text").addClass("sbi_hidden"),i.closest(".sbi").find(".sbi_num_diff_hide").addClass("sbi_transition").removeClass("sbi_num_diff_hide")},afterNewImagesLoaded:function(){var e=i(this.el),t=this;this.beforeNewImagesRevealed(),this.revealNewImages(),this.afterNewImagesRevealed(),setTimeout(function(){e.find(".sbi_loader").addClass("sbi_hidden"),e.find(".sbi_btn_text").removeClass("sbi_hidden"),t.maybeRaiseImageResolution()},500)},beforeNewImagesRevealed:function(){this.setImageHeight(),this.maybeRaiseImageResolution(!0),this.setImageSizeClass()},revealNewImages:function(){var e=i(this.el);e.find(".sbi-screenreader").each(function(){i(this).find("img").remove()}),"function"==typeof sbi_custom_js&&setTimeout(function(){sbi_custom_js()},100),this.applyImageLiquid(),e.find(".sbi_item").each(function(i){jQuery(this).find(".sbi_photo").on("mouseenter mouseleave",function(i){switch(i.type){case"mouseenter":jQuery(this).fadeTo(200,.85);break;case"mouseleave":jQuery(this).stop().fadeTo(500,1)}})}),setTimeout(function(){jQuery("#sbi_images .sbi_item.sbi_new").removeClass("sbi_new");var i=10;e.find(".sbi_transition").each(function(){var e=jQuery(this);setTimeout(function(){e.removeClass("sbi_transition")},i),i+=10})},500)},lazyLoadCheck:function(e){if(e.find(".sbi_photo").length&&!e.closest(".sbi").hasClass("sbi-no-ll-check")){var t=this.getImageUrls(e),s=void 0!==t[640]?t[640]:e.find(".sbi_photo").attr("data-full-res");if(!this.settings.consentGiven&&s.indexOf("scontent")>-1)return;e.find(".sbi_photo img").each(function(){s&&void 0!==i(this).attr("data-src")&&i(this).attr("data-src",s),s&&void 0!==i(this).attr("data-orig-src")&&i(this).attr("data-orig-src",s),i(this).on("load",function(){!i(this).hasClass("sbi-replaced")&&i(this).attr("src").indexOf("placeholder")>-1&&(i(this).addClass("sbi-replaced"),s&&(i(this).attr("src",s),i(this).closest(".sbi_imgLiquid_bgSize").length&&i(this).closest(".sbi_imgLiquid_bgSize").css("background-image","url("+s+")")))})})}},afterNewImagesRevealed:function(){this.listenForVisibilityChange(),this.sendNeedsResizingToServer(),this.settings.imageLoadEnabled||i(".sbi_no_resraise").removeClass("sbi_no_resraise");var e=i.Event("sbiafterimagesloaded");e.el=i(this.el),i(window).trigger(e)},setResizedImages:function(){i(this.el).find(".sbi_resized_image_data").length&&void 0!==i(this.el).find(".sbi_resized_image_data").attr("data-resized")&&0===i(this.el).find(".sbi_resized_image_data").attr("data-resized").indexOf('{"')&&(this.resizedImages=JSON.parse(i(this.el).find(".sbi_resized_image_data").attr("data-resized")),i(this.el).find(".sbi_resized_image_data").remove())},sendNeedsResizingToServer:function(){var e=this,t=i(this.el);if(e.needsResizing.length>0&&e.settings.resizingEnabled){var s=i(this.el).find(".sbi_item").length,o=void 0!==e.settings.general.cache_all&&e.settings.general.cache_all,a="";void 0!==t.attr("data-locatornonce")&&(a=t.attr("data-locatornonce")),n({action:"sbi_resized_images_submit",needs_resizing:e.needsResizing,offset:s,feed_id:e.settings.feedID,atts:e.settings.shortCodeAtts,location:e.locationGuess(),post_id:e.settings.postID,cache_all:o,locator_nonce:a},function(i){if(0===i.trim().indexOf("{")){var t=JSON.parse(i);for(var s in e.settings.debugEnabled&&console.log(t),t)t.hasOwnProperty(s)&&(e.resizedImages[s]=t[s]);e.maybeRaiseImageResolution(),setTimeout(function(){e.afterResize()},500)}})}else if(e.settings.locator){a="";void 0!==t.attr("data-locatornonce")&&(a=t.attr("data-locatornonce")),n({action:"sbi_do_locator",feed_id:e.settings.feedID,atts:e.settings.shortCodeAtts,location:e.locationGuess(),post_id:e.settings.postID,locator_nonce:a},function(i){})}},loadMoreButtonInit:function(){var e=i(this.el),t=this;e.find("#sbi_load .sbi_load_btn").off().on("click",function(){t.afterLoadMoreClicked(jQuery(this)),t.getNewPostSet()})},getNewPostSet:function(){var e=i(this.el),t=this;t.page++;var s="";void 0!==e.attr("data-locatornonce")&&(s=e.attr("data-locatornonce"));n({action:"sbi_load_more_clicked",offset:e.find(".sbi_item").length,page:t.page,feed_id:t.settings.feedID,atts:t.settings.shortCodeAtts,location:t.locationGuess(),post_id:t.settings.postID,current_resolution:t.imageResolution,locator_nonce:s},function(s){if(0===s.trim().indexOf("{")){var n=JSON.parse(s);t.settings.debugEnabled&&console.log(n),t.appendNewPosts(n.html),t.addResizedImages(n.resizedImages),t.settings.ajaxPostLoad?(t.settings.ajaxPostLoad=!1,t.afterInitialImagesLoaded()):t.afterNewImagesLoaded(),n.feedStatus.shouldPaginate?t.outOfPages=!1:(t.outOfPages=!0,e.find(".sbi_load_btn").hide()),i(".sbi_no_js").removeClass("sbi_no_js")}})},appendNewPosts:function(e){var t=i(this.el);t.find("#sbi_images .sbi_item").length?t.find("#sbi_images .sbi_item").last().after(e):t.find("#sbi_images").append(e)},addResizedImages:function(i){for(var e in i)this.resizedImages[e]=i[e]},setImageHeight:function(){var e=i(this.el),t=e.find(".sbi_photo").eq(0).innerWidth(),s=this.getColumnCount(),n=e.find("#sbi_images").innerWidth()-e.find("#sbi_images").width(),o=n/2;sbi_photo_width_manual=e.find("#sbi_images").width()/s-n,e.find(".sbi_photo").css("height",t),e.find(".sbi-owl-nav").length&&setTimeout(function(){var i=2;e.find(".sbi_owl2row-item").length&&(i=1);var t=e.find(".sbi_photo").eq(0).innerWidth()/i;t+=parseInt(o)*(2-i+2),e.find(".sbi-owl-nav div").css("top",t)},100)},maybeRaiseSingleImageResolution:function(e,t,s){var n=this,o=n.getImageUrls(e),a=e.find(".sbi_photo img").attr("src"),d=150,r=e.find("img").get(0),l=a===window.sbi.options.placeholder?1:r.naturalWidth/r.naturalHeight;s=void 0!==s&&s;if(!(e.hasClass("sbi_no_resraise")||e.hasClass("sbi_had_error")||e.find(".sbi_link_area").length&&e.find(".sbi_link_area").hasClass("sbi_had_error")))if(o.length<1)e.find(".sbi_link_area").length&&e.find(".sbi_link_area").attr("href",window.sbi.options.placeholder.replace("placeholder.png","thumb-placeholder.png"));else{(e.find(".sbi_link_area").length&&e.find(".sbi_link_area").attr("href")===window.sbi.options.placeholder.replace("placeholder.png","thumb-placeholder.png")||!n.settings.consentGiven)&&e.find(".sbi_link_area").attr("href",o[o.length-1]),void 0!==o[640]&&e.find(".sbi_photo").attr("data-full-res",o[640]),i.each(o,function(i,e){e===a&&(d=parseInt(i),s=!1)});var c=640;switch(n.settings.imgRes){case"thumb":c=150;break;case"medium":c=320;break;case"full":c=640;break;default:var h=Math.max(n.settings.autoMinRes,e.find(".sbi_photo").innerWidth()),g=n.getBestResolutionForAuto(h,l,e);switch(g){case 320:c=320;break;case 150:c=150}}if(c>d||a===window.sbi.options.placeholder||s){if(n.settings.debugEnabled){var f=a===window.sbi.options.placeholder?"was placeholder":"too small";console.log("rais res for "+a,f)}var u=o[c].split("?ig_cache_key")[0];if(a!==u&&(e.find(".sbi_photo img").attr("src",u),e.find(".sbi_photo").css("background-image",'url("'+u+'")')),d=c,"auto"===n.settings.imgRes){var b=!1;e.find(".sbi_photo img").on("load",function(){var t=i(this),s=t.get(0).naturalWidth/t.get(0).naturalHeight;if(1e3!==t.get(0).naturalWidth&&s>l&&!b){switch(n.settings.debugEnabled&&console.log("rais res again for aspect ratio change "+a),b=!0,h=e.find(".sbi_photo").innerWidth(),g=n.getBestResolutionForAuto(h,s,e),c=640,g){case 320:c=320;break;case 150:c=150}c>d&&(u=o[c].split("?ig_cache_key")[0],t.attr("src",u),t.closest(".sbi_photo").css("background-image",'url("'+u+'")')),"masonry"!==n.layout&&"highlight"!==n.layout||(i(n.el).find("#sbi_images").smashotope(n.isotopeArgs),setTimeout(function(){i(n.el).find("#sbi_images").smashotope(n.isotopeArgs)},500))}else if(n.settings.debugEnabled){var r=b?"already checked":"no aspect ratio change";console.log("not raising res for replacement  "+a,r)}})}}e.find("img").on("error",function(){if(i(this).hasClass("sbi_img_error"))console.log("unfixed error "+i(this).attr("src"));else{var e;if(i(this).addClass("sbi_img_error"),!(i(this).attr("src").indexOf("media/?size=")>-1||i(this).attr("src").indexOf("cdninstagram")>-1||i(this).attr("src").indexOf("fbcdn")>-1)&&n.settings.consentGiven){if("undefined"!==i(this).closest(".sbi_photo").attr("data-img-src-set"))void 0!==(e=JSON.parse(i(this).closest(".sbi_photo").attr("data-img-src-set").replace(/\\\//g,"/"))).d&&(i(this).attr("src",e.d),i(this).closest(".sbi_photo").css("background-image","url("+e.d+")"),i(this).closest(".sbi_item").addClass("sbi_had_error").find(".sbi_link_area").attr("href",e[640]).addClass("sbi_had_error"))}else n.settings.favorLocal=!0,void 0!==(e=n.getImageUrls(i(this).closest(".sbi_item")))[640]&&(i(this).attr("src",e[640]),i(this).closest(".sbi_photo").css("background-image","url("+e[640]+")"),i(this).closest(".sbi_item").addClass("sbi_had_error").find(".sbi_link_area").attr("href",e[640]).addClass("sbi_had_error"));setTimeout(function(){n.afterResize()},1500)}})}},maybeRaiseImageResolution:function(e){var t=this,s=void 0!==e&&!0===e?".sbi_item.sbi_new":".sbi_item",n=!t.isInitialized;i(t.el).find(s).each(function(e){!i(this).hasClass("sbi_num_diff_hide")&&i(this).find(".sbi_photo").length&&void 0!==i(this).find(".sbi_photo").attr("data-img-src-set")&&t.maybeRaiseSingleImageResolution(i(this),e,n)}),t.isInitialized=!0},getBestResolutionForAuto:function(e,t,s){(isNaN(t)||t<1)&&(t=1);var n=e*t,o=10*Math.ceil(n/10),a=[150,320,640];if(s.hasClass("sbi_highlighted")&&(o*=2),-1===a.indexOf(parseInt(o))){var d=!1;i.each(a,function(i,e){e>parseInt(o)&&!d&&(o=e,d=!0)})}return o},hideExtraImagesForWidth:function(){if("carousel"!==this.layout){var e=i(this.el),t=void 0!==e.attr("data-num")&&""!==e.attr("data-num")?parseInt(e.attr("data-num")):1,s=void 0!==e.attr("data-nummobile")&&""!==e.attr("data-nummobile")?parseInt(e.attr("data-nummobile")):t;i(window).width()<480?s<e.find(".sbi_item").length&&e.find(".sbi_item").slice(s-e.find(".sbi_item").length).addClass("sbi_num_diff_hide"):t<e.find(".sbi_item").length&&e.find(".sbi_item").slice(t-e.find(".sbi_item").length).addClass("sbi_num_diff_hide")}},setImageSizeClass:function(){var e=i(this.el);e.removeClass("sbi_small sbi_medium");var t=e.innerWidth(),s=parseInt(e.find("#sbi_images").outerWidth()-e.find("#sbi_images").width())/2,n=this.getColumnCount(),o=(t-s*(n+2))/n;o>120&&o<240?e.addClass("sbi_medium"):o<=120&&e.addClass("sbi_small")},setMinImageWidth:function(){i(this.el).find(".sbi_item .sbi_photo").first().length?this.minImageWidth=i(this.el).find(".sbi_item .sbi_photo").first().innerWidth():this.minImageWidth=150},setImageResolution:function(){if("auto"===this.settings.imgRes)this.imageResolution="auto";else switch(this.settings.imgRes){case"thumb":this.imageResolution=150;break;case"medium":this.imageResolution=320;break;default:this.imageResolution=640}},getImageUrls:function(i){var e=JSON.parse(i.find(".sbi_photo").attr("data-img-src-set").replace(/\\\//g,"/")),t=i.attr("id").replace("sbi_","");if(this.settings.consentGiven||this.settings.overrideBlockCDN||(e=[]),void 0!==this.resizedImages[t]&&"video"!==this.resizedImages[t]&&"pending"!==this.resizedImages[t]&&"error"!==this.resizedImages[t].id&&"video"!==this.resizedImages[t].id&&"pending"!==this.resizedImages[t].id){if(void 0!==this.resizedImages[t].sizes){var s=[];void 0!==this.resizedImages[t].sizes.full&&(e[640]=sb_instagram_js_options.resized_url+this.resizedImages[t].id+"full.jpg",s.push(640)),void 0!==this.resizedImages[t].sizes.low&&(e[320]=sb_instagram_js_options.resized_url+this.resizedImages[t].id+"low.jpg",s.push(320)),void 0!==this.resizedImages[t].sizes.thumb&&(s.push(150),e[150]=sb_instagram_js_options.resized_url+this.resizedImages[t].id+"thumb.jpg"),this.settings.favorLocal&&(-1===s.indexOf(640)&&s.indexOf(320)>-1&&(e[640]=sb_instagram_js_options.resized_url+this.resizedImages[t].id+"low.jpg"),-1===s.indexOf(320)&&(s.indexOf(640)>-1?e[320]=sb_instagram_js_options.resized_url+this.resizedImages[t].id+"full.jpg":s.indexOf(150)>-1&&(e[320]=sb_instagram_js_options.resized_url+this.resizedImages[t].id+"thumb.jpg")),-1===s.indexOf(150)&&(s.indexOf(320)>-1?e[150]=sb_instagram_js_options.resized_url+this.resizedImages[t].id+"low.jpg":s.indexOf(640)>-1&&(e[150]=sb_instagram_js_options.resized_url+this.resizedImages[t].id+"full.jpg")))}}else(void 0===this.resizedImages[t]||void 0!==this.resizedImages[t].id&&"pending"!==this.resizedImages[t].id&&"error"!==this.resizedImages[t].id)&&this.addToNeedsResizing(t);return e},getAvatarUrl:function(i,e){if(""===i)return"";var t=this.settings.general.avatars;return"local"===(e=void 0!==e?e:"local")?void 0!==t["LCL"+i]&&1===parseInt(t["LCL"+i])?sb_instagram_js_options.resized_url+i+".jpg":void 0!==t[i]?t[i]:"":void 0!==t[i]?t[i]:void 0!==t["LCL"+i]&&1===parseInt(t["LCL"+i])?sb_instagram_js_options.resized_url+i+".jpg":""},addToNeedsResizing:function(i){-1===this.needsResizing.indexOf(i)&&this.needsResizing.push(i)},applyImageLiquid:function(){var t=i(this.el);e(),"function"==typeof t.find(".sbi_photo").sbi_imgLiquid&&t.find(".sbi_photo").sbi_imgLiquid({fill:!0})},listenForVisibilityChange:function(){var e,t,s,n=this;e=jQuery,t={callback:function(){},runOnLoad:!0,frequency:100,sbiPreviousVisibility:null},s={sbiCheckVisibility:function(i,e){if(jQuery.contains(document,i[0])){var t=e.sbiPreviousVisibility,n=i.is(":visible");e.sbiPreviousVisibility=n,null==t?e.runOnLoad&&e.callback(i,n):t!==n&&e.callback(i,n),setTimeout(function(){s.sbiCheckVisibility(i,e)},e.frequency)}}},e.fn.sbiVisibilityChanged=function(i){var n=e.extend({},t,i);return this.each(function(){s.sbiCheckVisibility(e(this),n)})},"function"==typeof i(this.el).filter(":hidden").sbiVisibilityChanged&&i(this.el).filter(":hidden").sbiVisibilityChanged({callback:function(i,e){n.afterResize()},runOnLoad:!1})},getColumnCount:function(){var e=i(this.el),t=this.settings.cols,s=this.settings.colsmobile,n=t;return sbiWindowWidth=window.innerWidth,e.hasClass("sbi_mob_col_auto")?(sbiWindowWidth<640&&parseInt(t)>2&&parseInt(t)<7&&(n=2),sbiWindowWidth<640&&parseInt(t)>6&&parseInt(t)<11&&(n=4),sbiWindowWidth<=480&&parseInt(t)>2&&(n=1)):sbiWindowWidth<=480&&(n=s),parseInt(n)},checkConsent:function(){if(this.settings.consentGiven||!this.settings.gdpr)return!0;if("undefined"!=typeof CLI_Cookie)null!==CLI_Cookie.read(CLI_ACCEPT_COOKIE_NAME)&&(null!==CLI_Cookie.read("cookielawinfo-checkbox-non-necessary")&&(this.settings.consentGiven="yes"===CLI_Cookie.read("cookielawinfo-checkbox-non-necessary")),null!==CLI_Cookie.read("cookielawinfo-checkbox-necessary")&&(this.settings.consentGiven="yes"===CLI_Cookie.read("cookielawinfo-checkbox-necessary")));else if(void 0!==window.cnArgs){var i=("; "+document.cookie).split("; cookie_notice_accepted=");if(2===i.length){var e=i.pop().split(";").shift();this.settings.consentGiven="true"===e}}else void 0!==window.cookieconsent?this.settings.consentGiven="allow"===function(i){for(var e=i+"=",t=window.document.cookie.split(";"),s=0;s<t.length;s++){var n=t[s].trim();if(0==n.indexOf(e))return n.substring(e.length,n.length)}return""}("complianz_consent_status"):void 0!==window.Cookiebot?this.settings.consentGiven=Cookiebot.consented:void 0!==window.BorlabsCookie&&(this.settings.consentGiven=window.BorlabsCookie.checkCookieConsent("instagram"));var t=jQuery.Event("sbicheckconsent");return t.feed=this,jQuery(window).trigger(t),this.settings.consentGiven},afterConsentToggled:function(){if(this.checkConsent()){var i=this;i.maybeRaiseImageResolution(),setTimeout(function(){i.afterResize()},500)}},locationGuess:function(){var e=i(this.el),t="content";return e.closest("footer").length?t="footer":e.closest(".header").length||e.closest("header").length?t="header":(e.closest(".sidebar").length||e.closest("aside").length)&&(t="sidebar"),t}},window.sbi_init=function(){window.sbi=new t,window.sbi.createPage(window.sbi.createFeeds,{whenFeedsCreated:window.sbi.afterFeedsCreated})}}(jQuery),jQuery(document).ready(function(i){void 0===window.sb_instagram_js_options&&(window.sb_instagram_js_options={font_method:"svg",resized_url:location.protocol+"//"+window.location.hostname+"/wp-content/uploads/sb-instagram-feed-images/",placeholder:location.protocol+"//"+window.location.hostname+"/wp-content/plugins/instagram-feed/img/placeholder.png"}),void 0!==window.sb_instagram_js_options.resized_url&&-1===window.sb_instagram_js_options.resized_url.indexOf(location.protocol)&&("http:"===location.protocol?window.sb_instagram_js_options.resized_url=window.sb_instagram_js_options.resized_url.replace("https:","http:"):window.sb_instagram_js_options.resized_url=window.sb_instagram_js_options.resized_url.replace("http:","https:")),sbi_init(),i("#cookie-notice a").on("click",function(){setTimeout(function(){i.each(window.sbi.feeds,function(i){window.sbi.feeds[i].afterConsentToggled()})},1e3)}),i("#cookie-law-info-bar a").on("click",function(){setTimeout(function(){i.each(window.sbi.feeds,function(i){window.sbi.feeds[i].afterConsentToggled()})},1e3)}),i(".cli-user-preference-checkbox").on("click",function(){setTimeout(function(){i.each(window.sbi.feeds,function(i){window.sbi.feeds[i].settings.consentGiven=!1,window.sbi.feeds[i].afterConsentToggled()})},1e3)}),i(window).on("CookiebotOnAccept",function(e){i.each(window.sbi.feeds,function(i){window.sbi.feeds[i].settings.consentGiven=!0,window.sbi.feeds[i].afterConsentToggled()})}),i(document).on("cmplzAcceptAll",function(e){i.each(window.sbi.feeds,function(i){window.sbi.feeds[i].settings.consentGiven=!0,window.sbi.feeds[i].afterConsentToggled()})}),i(document).on("cmplzRevoke",function(e){i.each(window.sbi.feeds,function(i){window.sbi.feeds[i].settings.consentGiven=!1,window.sbi.feeds[i].afterConsentToggled()})}),i(document).on("borlabs-cookie-consent-saved",function(e){i.each(window.sbi.feeds,function(i){window.sbi.feeds[i].settings.consentGiven=!1,window.sbi.feeds[i].afterConsentToggled()})})}));