jQuery Write
================
Version: 0.9.0

About
-----
jQuery Write is simple WYSIWYG html editor. If you are looking for a
feature-filled editor, please see [TinyMCE][tinymce] or [CKEditor][ckeditor].

**This is not a 1.0.0 release.**

Install
-----
To utilize, include jwrite js file into your page (after including jquery).

    <script type="text/javascript" src="path/to/jquery.write.1.0.0.js"></script>

And then use the jquery object to select the object and call .editable().

    <script type="text/javscript">
      $('textarea').editable();
    </script>

Documentation
-----
The function, jQuery.fn.editable ($(selector).editable()), is used to
convert any element into a WYSIWYG text iframe. The .editable function only
accepts one, optional argument: an object of options.

All the options are located in jQuery.editable (or $.editable) object.
To change default settings used by the editable function, modify
$.editable.options.

Example:

  $('textarea').editable({
    enabled: true,
    toolbar: ['bold', 'italic', 'strike']
  });

Options:

* gui: An object which stores various settings pertaining to the UI.
* * classes: An object which maps toolbar items to their appropriate classes.
* * * toolbar: The class name for the toolbar that wraps all the toolbar buttons
* * * resize: Reserved. This feature not yet implemented.
* * * selected: Reserved. This feature not yet implemented.
* * * bold, italic, strike, ordered, unordered, link, image, html: each property
    sets a corresponding toolbar button to a specific class
* * html: An object which maps toolbar items to their appropriate innerHTML.
* * * bold, italic, strike, ordered, unordered, link, image, html: each property
    sets a corresponding toolbar button to a specific innerHTML value.
* * argHandler: Some toolbar buttons require extra input, their appropriate functions
   are stored here. Functions accept 3 arguments: the iframe editor they're acting
   upon, the current options set for the editor, and a callback function that can
   be passed the value. Returning a logically true value is equivalent to passing the
   callback function the value. Using the callback function allows delayed processing
   of a toolbar's function (ie - show an HTML-based dialog instead of confirm).
* bodyCSS: An object of all the CSS attributes that the text editing area should have.
  The style is independent of whatever styles the site has since it is inside an
  iframe.
* attr: An object of all the html attributes the iframe should get when created.
* enabled: Reserved. This feature is not yet implemented.
* toolbar: An array of strings for the toolbar items to use.
* classes: An object of classes to use for iframe and div wrapper.
* * iframe: The class for the iframe
* * container: The class for the div wrapper that wraps all the editor components.
* exclusiveSelect: A boolean.
* resizable: Reserved. This feature is not yet implemented.
* singleLined: A selector. The selector is used to determine what elements should be
  forced into singled lined editor versus the multilined editor.


Todo
-----
Currently the user interface needs massive improvement and image uploading support is needed.
The WYSIWYG feature-set is deemed sufficient enough as of now.

List of things needed to get done.

* Buttons toggles (don't forget hotkeys can toggle)
* Image upload support
* Better dialog support
* Enable/disabling the editor
* User-resizable editor

Authors
-----
* Jeff Hui (contrib@jeffhui.net)

  [tinymce]: http://tinymce.moxiecode.com/
  [ckeditor]: http://ckeditor.com/