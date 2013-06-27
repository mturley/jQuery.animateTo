/*
 *  Project: jQuery.animateTo
 *  Description: A jQuery Plugin with the functionality of $.appendTo and $.insertAfter, plus a transition effect.
 *  Author: Mike Turley <mike@miketurley.com> github.com/mturley twitter.com/TheMikeTurley
 *  License: Dual Licensed with MIT and GPL.
 */

 // Warning: do not use this on any elements which contain large media, especially if it will autoplay.
 //   clones of the element will be created and destroyed to keep the page flow correct.
 //   this would cause, for example, youtube videos within the element to load more than once.
 //   however, the element which ends up in the target container is in fact the original one and not a clone.

 // FOR BEST RESULTS, the original container and the new target container should share the same offset parent.
 //   if they don't, you may get positioning bugs and jumpiness.

;(function ( $, window, document, undefined ) {
  // Create the defaults once
  var defaults = {
    mode        : 'appendTo',         // choices are 'appendTo', 'prependTo', 'insertBefore', 'insertAfter'
    duration    : undefined,          // delegated to jQuery.animate, leaving undefined will use framework defaults.
    easing      : undefined,          // delegated to jQuery.animate, leaving undefined will use framework defaults.
    position    : 'relativeToSource', // choices are 'relativeToSource', 'relativeToTarget', 'absolute'
    alsoAnimate : undefined,          // css key/value pairs to animate on the element along with moving it.
    callback    : undefined           // an optional function to call after the animation is all done.
  };

  // The actual plugin constructor
  function Plugin( element, options ) {
    this.element = element;
    this.options = $.extend( {}, defaults, options );
    this._defaults = defaults;
    this._name = "animateTo";
    this.init();
  }

  // Here's where we define the actual plugin logic and guts.
  // init() will be called by the $.fn.animateTo wrapper after fleshing out the options object.
  Plugin.prototype = {
    init: function() {
      // this.element, this.target and this.options are predefined by the constructor.
      // check for a valid mode option:
      if(this.options.mode !== 'appendTo'     &&
         this.options.mode !== 'prependTo'    &&
         this.options.mode !== 'insertBefore' &&
         this.options.mode !== 'insertAfter') {
        if(console && console.warn) {
          console.warn("jQuery.animateTo :: WARNING: The mode you specified is invalid: '"+this.options.mode+"'");
          console.warn("jQuery.animateTo :: Valid modes are: 'appendTo', 'prependTo', 'insertBefore', 'insertAfter'");
          console.warn("jQuery.animateTo :: USING DEFAULT MODE '"+defaults.mode+"' INSTEAD!");
        }
        this.options.mode = defaults.mode;
      }
      if(this.options.position !== 'relativeToSource' &&
         this.options.position !== 'relativeToTarget' &&
         this.options.position !== 'absolute') {
        if(console && console.warn) {
          console.warn("jQuery.animateTo :: WARNING: The position option you specified is invalid: '"+this.options.position+"'");
          console.warn("jQuery.animateTo :: Valid position options are: 'relativeToSource', 'relativeToTarget', 'absolute'");
          console.warn("jQuery.animateTo :: USING DEFAULT position '"+defaults.position+"' INSTEAD!");
        }
        this.options.position = defaults.position;
      }
      // check for valid source and target elements:
      if($(this.element).length === 0 || $(this.options.target).length === 0) {
        if(console && console.error) {
          console.error("jQuery.animateTo :: ERROR: Your source element or target element do not exist, or your selectors are bad.");
          console.error("jQuery.animateTo :: You must pass either a non-empty jQuery selection or a valid jQuery selector string.")
          console.error("jQuery.animateTo :: Your source element was: ",this.element);
          console.error("jQuery.animateTo :: Your target element was: ",this.target);
        }
        return this; // prevent the rest of the plugin from running
      }
      // save our zIndex for later
      $(this.element).data('oldZIndex', $(this.element).css('zIndex'));
      // at this point, we know we have a valid source, target, mode, and all options.
      if(this.options.position == 'relativeToTarget') this.animateRelativeToTarget();
      if(this.options.position == 'relativeToSource') this.animateRelativeToSource();
      if(this.options.position == 'absolute') this.animateAbsolute();
    },

    animateRelativeToTarget: function() {
      var element = $(this.element);
      // put an invisible placeholder as a sibling to the element, then move the element to where it will be going.
      var sourcePlaceholder = element.clone(true).css('visibility','hidden').insertAfter(element);
      element[this.options.mode](this.options.target);
      // $(element)[mode](target) works because we've guaranteed that mode will be a valid jQuery function e.g. appendTo.
      // apply relative position so it looks like the element is still on top of the source Placeholder.
      element.css({
        'position' : 'relative',
        'top'      : (sourcePlaceholder.offset().top - element.offset().top)+'px',
        'left'     : (sourcePlaceholder.offset().left - element.offset().left)+'px',
        'zIndex'   : 99999
      }).animate({ // animate it into static positioning at the target.
        'top'  : '0px'
        'left' : '0px'
      }, this.options.duration, this.options.easing, function() {
        // when the animation is over, remove the relative css and just let it be static.
        element.css({
          'position' : 'static',
          'top'      : '',
          'left'     : '',
          'zIndex'   : element.data('oldZIndex')
        });
        element.removeData('oldZIndex');
        sourcePlaceholder.remove();
        if($.isFunction(options.callback)) options.callback.call(this.element);
      });
    },

    animateRelativeToSource: function() {
      var element = $(this.element);
      // put an invisible placeholder where the element will end up, and leave the element where it is for now.
      var targetPlaceholder = element.clone(true).css('visibility','hidden')[this.options.mode](this.options.target);
      // $(element)[mode](target) works because we've guaranteed that mode will be a valid jQuery function e.g. appendTo.
      // apply relative position of 0,0 so we can start moving the element towards the target.
      element.css({
        'position' : 'relative',
        'top'      : '0px',
        'left'     : '0px',
        'zIndex'   : 99999
      }).animate({ // animate it until it looks like it's on top of the target placeholder.
        'top'  : (targetPlaceholder.offset().top - element.offset().top)+'px',
        'left' : (targetPlaceholder.offset().left - element.offset().left)+'px'
      }, this.options.duration, this.options.easing, function() {
        // when the animation is over, actually move the element into place.
        targetPlaceholder.replaceWith(element);
        // then remove the relative css and just let it be static.
        element.css({
          'position' : 'static',
          'top'      : '',
          'left'     : '',
          'zIndex'   : element.data('oldZIndex')
        });
        element.removeData('oldZIndex');
        if($.isFunction(options.callback)) options.callback.call(this.element);
      });
    },

    animateAbsolute: function() {
      var element = $(this.element);
      // put invisible placeholders at BOTH the eource and the target.
      var sourcePlaceholder = element.clone(true).css('visibility','hidden').insertAfter(element);
      var targetPlaceholder = element.clone(true).css('visibility','hidden')[this.options.mode](this.options.target);
      // $(element)[mode](target) works because we've guaranteed that mode will be a valid jQuery function e.g. appendTo.
      // place the element absolutely on top of the source placeholder.
      element.css({
        'position' : 'absolute',
        'top'      : (sourcePlaceholder.offset().top)+'px',
        'left'     : (sourcePlaceholder.offset().left)+'px'
        'z-index'  : 9999
      }).animate({ // animate it to the target placeholder.
        'top'  : (targetPlaceholder.offset().top)+'px',
        'left' : (targetPlaceholder.offset().left)+'px'
      }, this.options.duration, this.options.easing, function() {
        // when the animation is over, actually move the element into place.
        targetPlaceholder.replaceWith(element);
        element.css({
          'position' : 'static',
          'top'      : '',
          'left'     : '',
          'zIndex'   : element.data('oldZIndex')
        });
        sourcePlaceholder.remove();
        element.removeData('oldZIndex');
        if($.isFunction(options.callback)) options.callback.call(this.element);
      });
    }
  };

  // $.fn.animateTo: this is what you actually call on your page to use the plugin.
  // it's a wrapper for the plugin constructor that allows for virtual argument overloading.
  // All of the following are valid and equivalent:
  //     $(element).animateTo(target, mode, duration, options)
  //     $(element).animateTo(target, mode, options)  // duration in options
  //     $(element).animateTo(target, options)        // mode and duration in options
  //     $(element).animateTo(options)                // target, mode and duration in options
  // also:
  //   * target is always required, if you exclude it you'll get a console error.
  //   * options is optional if you pass a target (and mode, duration if necessary) directly.
  //   * mode is optional if you want to default to 'appendTo' mode.
  //   * duration is optional if you want to default to your jQuery.animate default.
  $.fn.animateTo = function ( target, mode, duration, options ) {
    return this.each(function () {
      var optionsObj = {};
      // figure out which of the arguments is actually the options object
      if(typeof(target)   == "object") optionsObj = target;
      if(typeof(mode)     == "object") optionsObj = mode;
      if(typeof(duration) == "object") optionsObj = duration;
      if(typeof(options)  == "object") optionsObj = options;
      // put the other arguments' values, if valid, into options.
      if(typeof(target)   == "string") optionsObj.target = target;
      if(typeof(mode)     == "string") optionsObj.mode = mode;
      if(typeof(duration) == "number") optionsObj.duration = duration;
      // we'll fall back on defaults for anything we didn't set here.
      if(optionsObj.hasOwnProperty('target')) {
        // we're good to go, now we call the plugin constructor!  (Defined above in Plugin.prototype)
        // we store the Plugin object in $(this).data so we can reference it from the DOM if we need to.
        $(this).data("plugin_animateTo", new Plugin( this, optionsObj ));
      } else if(console && console.error) {
        console.error("jQuery.animateTo :: ERROR: You did not specify a target!  Your source element was: ",this);
        console.error("jQuery.animateTo :: Your arguments were: ",arguments);
      }
    });
  };

})( jQuery, window, document );