/* jquery.write.1.0.0.js
 * by Jeff Hui (contrib@jeffhui.net)
 *
 * MIT Licensed:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function($){
// stores the last editor iframe we accessed
var last_iframe = false;

// returns the current user's selection range for a given window
// If there is no selection, defaults to the start of the document
function getSelection(win){
    var range;
    // grab selection (cross-browser)
    if(win.getSelection){
	var sel = win.getSelection();
	if(sel.anchorNode === undefined){
	    range = win.document.createRange();
	}
	if(sel.getRangeAt){
	    range = sel.getRangeAt(0);
	} else { // opera
	    range = win.document.createRange();
	    range.setStart(sel.anchorNode, sel.anchorOffset);
	    range.setEnd(sel.focusNode, sel.focusOffset);
	}
    } else { // IE
	range = win.document.selection.createRange();
    }
    return range;
}

// executes a command for a given iframe
// returns value from $.editable.returnValue
function execCmd(args){
    var arg = args.arg, iframe = args.iframe, name = args.name;
    if(iframe === undefined && last_iframe){
	iframe = last_iframe;
    }
    if(iframe){
	iframe.contentWindow.document.execCommand(name, false, arg);
    }
    iframe.contentWindow.focus();
    return $.editable.returnValue;
}

// Returns a function that wraps execCmd with a provided command
// Can be called with .to() to bind to an iframe
execCmd.build = function(name){
    var func = this;
    return function(options){
	return func.call(this, $.extend(true, options, {name: name}));
    };
};

// decorator: ensures the command can only be executed on multi-lined editors
function ignoreSingleLine(func){
    return function(options){
	var iframe = options.iframe;
	if(iframe === undefined && last_iframe){
	    iframe = last_iframe;
	}
	if($(iframe).data('singlelined')){
	    return $.editable.returnValue;
	} else {
	    return func.apply(this, arguments);
	}
    };
}

// decorator: aborts if the options has an arg key set to false.
// this is may happen if the argHandler returns false to invoke later.
function requiresArg(func){
    return function(opt){
	if(!opt.arg)
	    return $.editable.returnValue;
	return func.call(this, opt);
    };
}

// decorator: provides the iframe context to the decorated function.
// Can be called with .build to bind to an specific command
function withIFrame(func, iframe){
    return function(opt){
	// BUG: allows formatting to work when user provided no selection.
	iframe.contentWindow.focus();
	return func.call(this, $.extend(true, opt, {iframe: iframe}));
    };
}

// decorator: sets the iframe key to the last iframe used. The iframe is only set
// if iframe is not set (via withIFrame).
function withLastIFrame(func){
    return function(opt){
	return func.call(this, $.extend({iframe: last_iframe}, opt));
    };
}

// decorator: saves the user's selection range object after the first invocation to
// allow subsequent calls to refer to the existing range object.
function withCachedSelection(func){
    var sel = false;
    return function(opt){
	var iframe = opt.iframe;
	if(sel === false){
	    sel = getSelection(iframe.contentWindow);
	}
	return func.call(this, $.extend(opt, {selection: sel}));
    };
}

// deselects all text for a given iframe
// if no iframe is given, defaults to current window
function deselect(iframe){
    var win = (iframe === undefined)? window : iframe.contentWindow;
    if(win.getSelection){
	win.getSelection().removeAllRanges();
    } else {
	win.document.selection.empty();
    }
}

// this is function handles to creation fo the toolbar buttons
function addToolButton(name, toolbar, iframe, options){
    toolbar = $(toolbar);
    var clsn = options.gui.classes,
    html = options.gui.html,
    argHandler = options.gui.argHandler,
    func = $.editable.commands[name];

    // don't create toolbar button for a feature we don't support
    if($(iframe).data('singlelined') && func.multiLined){
	return;
    }

    toolbar.append('<a href="#" class="'+clsn[name]+'">'+html[name]+'</a>');

    if(func.requiresArg){
	$('.'+clsn[name], toolbar).click(
	    function(){
		var self=this, fun=function(arg){
		    return requiresArg(
			withIFrame(
			    withCachedSelection(func), iframe))
			.call(self, {arg: arg});
		},
		value = argHandler[name](iframe, options, fun);
		if(value){
		    fun(value);
		}
	    });
    } else {
	$('.'+clsn[name], toolbar).click(withIFrame(func, iframe));
    }
}

// handles the creation of the resizer
function resizeHandle(iframe, options){
    var c = $(iframe).parent(), handle = $('<div class="'+options.gui.classes.resizer+'"></div>');
}

// internal function that builds the GUI front end.
function buildGUI(iframe, options){
    var toolbar = $('<div class="'+options.gui.classes.toolbar+'"></div>');
    $(iframe).parent().before(toolbar);
    $.each(options.toolbar, function(i, v){
	if($.isFunction(v)){
	    v(toolbar.get(0), iframe, options);
	} else {
	    options.gui.addButton(v, toolbar.get(0), iframe, options);
	}
    });
    options.gui.resizeBuilder(iframe, options);
}

// a custom command (since IE doesn't support one) that inserts HTML
// at the specified cursor.
function insertHTML(args){
    var iframe=args.iframe, arg=args.arg, range=args.selection,
	doc=iframe.contentWindow.document,
	frag = doc.createDocumentFragment(arg),
	container = doc.createElement('div');
    range.deleteContents();
    // we cheat, use a tmp element to let jquery get all the elements,
    // then we can add it to the doc (since it doesn't support normal
    // element methods).
    $(container).html(arg).children().each(function(){
	frag.appendChild(this);
    });
    range.insertNode(frag);
}

// used with $.each to quickly add commands from document.execCommand
// which are invoked via execCmd
function addCommand(keyname, options){
    var t = typeof options, multiLined = false, requiresArg = false;
    if(t === 'string'){
	$.editable.commands[keyname] = execCmd.build(options);
    } else if(t === 'object') { // object
	var opt = $.extend(true, {cmd: keyname,requiresArg: false,multiLined: false}, options);
	if($.isFunction(opt.cmd)){
	    $.editable.commands[keyname] = opt.cmd;
	} else {
	    $.editable.commands[keyname] = execCmd.build(opt.cmd);
	}
	requiresArg = options.requiresArg;
	multiLined = opt.multiLined;
    } else if(t === 'function') {
	$.editable.commands[keyname] = options;
    } else {
	$.editable.commands[keyname] = execCmd.build(keyname);
	multiLined = !options? true : false;
    }
    if(multiLined){
	$.editable.commands[keyname] = ignoreSingleLine($.editable.commands[keyname]);
    }
    $.editable.commands[keyname] = $.editable.commands[keyname];
    $.editable.commands[keyname].multiLined = multiLined;
    $.editable.commands[keyname].requiresArg = requiresArg;
}

// default settings
$.editable = {
    returnValue: false,
    commands: {}, // filled below
    addCommand: addCommand,
    options: {
	gui: {
	    builder: buildGUI,
	    resizeBuilder: resizeHandle,
	    addButton: addToolButton,
	    classes: {
		toolbar: 'jwriteToolbar',
		resize: 'jwriteResize',
		selected: 'selected',
		bold: 'bold',
		italic: 'italic',
		strike: 'strike',
		unordered: 'unordered',
		ordered: 'ordered',
		link: 'link',
		image: 'image',
		html: 'html'
	    },
	    html: {
		bold: 'Bold',
		italic: 'Italics',
		strike: 'Strike',
		unordered: 'Bullets',
		ordered: 'Numbers',
		link: 'Link',
		image: 'Image',
		html: 'Embed'
	    },
	    argHandler: {
		'link': function(){ return prompt('Enter url:'); },
		'image': function(){ return prompt('Enter image url:'); },
		'html': function(){ return prompt('Enter html:'); }
	    }
	},
	bodyCSS: {
	    margin: 0,
	    padding: '0.1em 0.2em',
	    fontFamily: 'Arial, sans',
	    fontSize: '13px'
	},
	attr: {
	    'scrolling': 'false',
	    'scroll': 'no',
	    'frameborder': '0',
	    'allowtransparency': 'true'
	},
	enabled: true,
	toolbar: ['bold', 'italic', 'strike', 'ordered', 'unordered', 'link', 'image', 'html'],
	classes: {
	    iframe: 'jwriteEditor',
	    container: 'jwriterContainer'
	},
	exclusiveSelect: true,
	resizable: true,
	singleLined: 'input'
    }
};

/*
 * WARN: I didn't have the time or willingness to test all the functionality
 * listed here. I really only needed to bare minimal set in option.toolbar.
 * 
 * So this is neither comprehensive or ensured for cross-platform.
 * Don't run with scissors here.
 * 
 * For those curious, the keys represent the name of the function which is invoked
 * like $.editable.<name>, such as $.editable.bold(). The values are as follows:
 *   string = original execCommand name to use when calling execCommand
 *   object = {cmd: original execCommand name to use when calling execCommand,
 *                  If cmd is a function(iframe, options), it is invoked.
 *                  If requiresArgs is true, the function prototype is assumed to
 *                  be function(iframe, arg, options).
 *             requiresArgs: indicates this execCommand needs the additional
 *                           argument. Which looks for a func to call in
 *                           options.argHandler[name],
 *             singleLined: a boolean that enforced use in multiline fields only.}
 *            If any key is missing, it assumes the default (see 'anything else').
 *   anything else = Nothing. Use same key name for execCommand and assume
 *                   it *does not* require an additional argument.
 *                   Falsy values indicate multiline only.
 */
$.each({
    // unchanged
    bold: true, italic: true, underline: true, subscript: true, superscript: true,
    undo: true, redo: true, cut: true, copy: true, paste: true, unlink: true,
    indent: false, outdent: false, removeFormat: true, selectAll: true,
    // renames
    center: 'justifyCenter',
    left: 'justifyLeft',
    right: 'justifyRight',
    strike: 'strikeThrough',
    // customized
    ordered: {cmd: 'insertOrderedList', multiLined: true},
    unordered: {cmd: 'insertUnorderedList', multiLined: true},
    link: {cmd: 'createLink', requiresArg: true },
    color: {cmd: 'foreColor', requiresArg: true},
    format: {cmd: 'formatBlock', requiresArg: true},
    image: {cmd: 'insertImage', requiresArg: true, multiLined: true},
    html: {cmd: insertHTML, requiresArg: true, multiLined: true}
}, addCommand);

/*
 * Creates a wysiwyg write for the selected fields. The original
 * fields are hidden and iframes are appended.
 */
$.fn.editable = function(options){
    options = $.extend(true, {}, $.editable.options, options);

    if(!options.enabled){
	$(this).show().next('.'+options.classes.container).remove();
	return this;
    }

    var all_editors = 'iframe.'+options.classes.iframe;
    
    $(this).hide().after('<div class="'+options.classes.container+
			 '"><iframe class="'+options.classes.iframe+'"></iframe></div>');
    $(all_editors).each(
	function(){
	    var self=this, doc=this.contentWindow.document, target=$(this).parent().prev();
	    doc.designMode = 'on';

	    $(this).width('100%').height('100%');

	    if(options.singleLined === true ||
	       (typeof options.singleLined === 'string' && target.is(options.singleLined))){
		$(self).data('singlelined', true);
		$('head', doc).append('<style>body * {display:inline;}</style>');
		$(doc).bind('keydown',
		    function(event){
			if(event.keyCode === 13){ // enter
			    $(this).parent('form').submit();
			    return false;
			}
			return true;
		    }).bind('keyup',
			    function(){
				$(this).find('br').remove();
				$(this).find('ul, ol').each(function(){
				    $(this).replaceWith($(this).text());
				});
			   });
	    } else {
		$(self).data('singlelined', false);
	    }
	    $(self).parents('form')
		.bind('submit',
		      function(){
			  var html = $(this).html();
			  if ($(target).is('input, textarea')){
			      $(target).val(html);
			  } else {
			      $(target).html(html);
			  }
		      });

	    // if we have no stylesheet, but we still want it to look
	    // (mostly) like a normal text field
	    if($(self).data('singlelined')){
		$(doc.body).css(options.bodyCSS);
		$(this).parent().height('1.2em');
	    } else {
		$(doc.body).css(options.bodyCSS);
		$(this).parent().height('10.2em');
	    }
	    $(this.contentWindow).focus(function(){last_iframe = self;});
	    
	    if(options.exclusiveSelect){
		$(this.contentWindow).focus(
		    function(){
			$(all_editors).not(self).each(function(){deselect(this);});
		    });
	    }
	    $(this).attr(options.attr).data('target', target.get(0));
	    $(doc.body).html(target.is('input, textarea')? target.val() : target.html());

	    options.gui.builder(self, options);
	});
    return this;
};

}(jQuery));