/*
	mediaboxAdvanced v0.9.9f - The ultimate extension of Mediabox into an all-media script
	updated 2009.03.28
	(c) 2007-2009 John Einselen <http://iaian7.com>
		based on
	Slimbox v1.64 - The ultimate lightweight Lightbox clone
	(c) 2007-2008 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/

var Mediabox;

(function() {

	// Global variables, accessible to Mediabox only
	var state = 0, options, images, activeImage, prevImage, nextImage, top, fx, preload, preloadPrev = new Image(), preloadNext = new Image(),	// State values: 0 (closed or closing), 1 (open and ready), 2+ (open and busy with animation)
	// DOM elements
	overlay, center, image, bottomContainer, bottom, captionSplit, title, caption, prevLink, number, nextLink,
	// Mediabox specific vars
	URL, WH, WHL, elrel, mediaWidth, mediaHeight, mediaType = "none", mediaSplit, mediaId = "mediaBox", mediaFmt;

	/*
		Initialization
	*/

	window.addEvent("domready", function() {
		// Create and append the Mediabox HTML code at the bottom of the document
		$(document.body).adopt(
			$$([
				overlay = new Element("div", {id: "mbOverlay"}).addEvent("click", close),
				center = new Element("div", {id: "mbCenter"}),
				bottomContainer = new Element("div", {id: "mbBottomContainer"})
			]).setStyle("display", "none")
		);

		image = new Element("div", {id: "mbImage"}).injectInside(center);
		bottom = new Element("div", {id: "mbBottom"}).injectInside(bottomContainer).adopt(
			new Element("a", {id: "mbCloseLink", href: "#"}).addEvent("click", close),
			nextLink = new Element("a", {id: "mbNextLink", href: "#"}).addEvent("click", next),
			prevLink = new Element("a", {id: "mbPrevLink", href: "#"}).addEvent("click", previous),
			title = new Element("div", {id: "mbTitle"}),
			number = new Element("div", {id: "mbNumber"}),
			caption = new Element("div", {id: "mbCaption"}),
			new Element("div", {styles: {clear: "both"}})
		);

		fx = {
			overlay: new Fx.Tween(overlay, {property: "opacity", duration: 360}).set(0),
			image: new Fx.Tween(image, {property: "opacity", duration: 360, onComplete: nextEffect}),
			bottom: new Fx.Tween(bottom, {property: "margin-top", duration: 240})
		};
	});

	/*
		API
	*/

	Mediabox = {
		close: function(){ 
			close();	// Thanks to Yosha on the google group for fixing the close function API!
		}, 

		open: function(_images, startImage, _options) {
			options = $extend({
				loop: false,					// Allows to navigate between first and last images
				stopKey: true,					// Prevents default keyboard action (such as up/down arrows), in lieu of the shortcuts
													// Does not apply to iFrame content
													// Does not affect mouse scrolling
				overlayOpacity: 0.7,			// 1 is opaque, 0 is completely transparent (change the color in the CSS file)
													// Remember that Firefox 2 and Camino 1.6 on the Mac require a background .png set in the CSS
				resizeDuration: 240,			// Duration of each of the box resize animations (in milliseconds)
				resizeTransition: false,		// Default transition in mootools
				initialWidth: 360,				// Initial width of the box (in pixels)
				initialHeight: 240,				// Initial height of the box (in pixels)
				showCaption: true,				// Display the title and caption, true / false
				animateCaption: true,			// Animate the caption, true / false
				showCounter: true,				// If true, a counter will only be shown if there is more than 1 image to display
				counterText: '  ({x} of {y})',	// Translate or change as you wish
//			Global media options
				scriptaccess: 'true',		// Allow script access to flash files
				fullscreen: 'true',			// Use fullscreen
				fullscreenNum: '1',			// 1 = true
				autoplay: 'true',			// Plays the video as soon as it's opened
				autoplayNum: '1',			// 1 = true
				autoplayYes: 'yes',			// yes = true
				bgcolor: '#000000',			// Background color, used for both flash and QT media
//			JW Media Player settings and options
				playerpath: '../js/player.swf',	// Path to the mediaplayer.swf or flvplayer.swf file
				backcolor:  '000000',		// Base color for the controller, color name / hex value (0x000000)
				frontcolor: '999999',		// Text and button color for the controller, color name / hex value (0x000000)
				lightcolor: '000000',		// Rollover color for the controller, color name / hex value (0x000000)
				screencolor: '000000',		// Rollover color for the controller, color name / hex value (0x000000)
				controlbar: 'over',			// bottom, over, none (this setting is ignored when playing audio files)
//			NonverBlaster
				useNB: true,				// use NonverBlaster in place of the JW Media Player for .flv and .mp4 files
				NBpath: '../js/NonverBlaster.swf',	// Path to NonverBlaster.swf
				NBloop: 'true',				// Loop video playback, true / false
				controllerColor: '0x777777',	// set the controlbar colour
				showTimecode: 'false',		// turn timecode display off or on
//			Quicktime options
				controller: 'true',			// Show controller, true / false
//			Flickr options
				flInfo: 'true',				// Show title and info at video start
//			Revver options
				revverID: '187866',			// Revver affiliate ID, required for ad revinue sharing
				revverFullscreen: 'true',	// Fullscreen option
				revverBack: '000000',		// Background colour
				revverFront: 'ffffff',		// Foreground colour
				revverGrad: '000000',		// Gradation colour
//			Youtube options
				ytColor1: '000000',			// Outline colour
				ytColor2: '333333',			// Base interface colour (highlight colours stay consistent)
				ytQuality: '&ap=%2526fmt%3D18',	// Empty for standard quality, use '&ap=%2526fmt%3D18' for high quality, and '&ap=%2526fmt%3D22' for HD (note that not all videos are availible in high quality, and very few in HD)
//			Vimeo options
				vdPlayer: 'false',			// Use simple (smaller) player (22px less)
//			Vimeo options
				vmTitle: '1',				// Show video title
				vmByline: '1',				// Show byline
				vmPortrait: '1',			// Show author portrait
				vmColor: 'ffffff'			// Custom controller colours, hex value minus the # sign, defult is 5ca0b5
			}, _options || {});

			if (typeof _images == "string") {	// The function is called for a single image, with URL and Title as first two arguments
				_images = [[_images,startImage,_options]];
				startImage = 0;
			}

// Fixes Firefox 2 and Camino 1.6 incompatibility with opacity + flash
if ((Browser.Engine.gecko) && (Browser.Engine.version<19)) {
	options.overlayOpacity = 1;
	overlay.className = 'mbOverlayFF';
}

			images = _images;
			options.loop = options.loop && (images.length > 1);
			position();
			setup(true);
			top = window.getScrollTop() + (window.getHeight() / 15);
			fx.resize = new Fx.Morph(center, $extend({duration: options.resizeDuration, onComplete: nextEffect}, options.resizeTransition ? {transition: options.resizeTransition} : {}));
			center.setStyles({top: top, width: options.initialWidth, height: options.initialHeight, marginLeft: -(options.initialWidth/2), display: ""});
			fx.overlay.start(options.overlayOpacity);
			state = 1;
			return changeImage(startImage);
		}
	};

	Element.implement({
		mediabox: function(_options, linkMapper) {
			$$(this).mediabox(_options, linkMapper);	// The processing of a single element is similar to the processing of a collection with a single element

			return this;
		}
	});

	Elements.implement({
		/*
			options:	Optional options object, see Mediabox.open()
			linkMapper:	Optional function taking a link DOM element and an index as arguments and returning an array containing 3 elements:
					the image URL and the image caption (may contain HTML)
			linksFilter:	Optional function taking a link DOM element and an index as arguments and returning true if the element is part of
					the image collection that will be shown on click, false if not. "this" refers to the element that was clicked.
					This function must always return true when the DOM element argument is "this".
		*/
		mediabox: function(_options, linkMapper, linksFilter) {
			linkMapper = linkMapper || function(el) {
				elrel = el.rel.split(/[\[\]]/);
				elrel = elrel[1];
				return [el.href, el.title, elrel];
			};

			linksFilter = linksFilter || function() {
				return true;
			};

			var links = this;

			links.removeEvents("click").addEvent("click", function() {
				// Build the list of images that will be displayed
				var filteredArray = links.filter(linksFilter, this);
				var filteredLinks = [];
				var filteredHrefs = [];

				filteredArray.each(function(item, index){
					if(filteredHrefs.indexOf(item.toString()) < 0) {
						filteredLinks.include(filteredArray[index]);
						filteredHrefs.include(filteredArray[index].toString());
					};
				});

				return Mediabox.open(filteredLinks.map(linkMapper), filteredHrefs.indexOf(this.toString()), _options);
			});

			return links;
		}
	});

	/*
		Internal functions
	*/

	function position() {
		overlay.setStyles({top: window.getScrollTop(), height: window.getHeight()});
	}

	function setup(open) {
		// Hides on-page objects and embeds while the overlay is open to counteract Firefox stupidity
		["object", window.ie ? "select" : "embed"].forEach(function(tag) {
			Array.forEach(document.getElementsByTagName(tag), function(el) {
				if (open) el._mediabox = el.style.visibility;
				el.style.visibility = open ? "hidden" : el._mediabox;
			});
		});

		overlay.style.display = open ? "" : "none";

		var fn = open ? "addEvent" : "removeEvent";
		window[fn]("scroll", position)[fn]("resize", position);
		document[fn]("keydown", keyDown);
	}

	function keyDown(event) {
		switch(event.code) {
			case 27:	// Esc
			case 88:	// 'x'
			case 67:	// 'c'
				close();
				break;
			case 37:	// Left arrow
			case 80:	// 'p'
				previous();
				break;	
			case 39:	// Right arrow
			case 78:	// 'n'
				next();
		}
		if (options.stopKey) { return false; };
	}

	function previous() {
		return changeImage(prevImage);
	}

	function next() {
		return changeImage(nextImage);
	}

	function changeImage(imageIndex) {
		if ((state == 1) && (imageIndex >= 0)) {
			state = 2;
			image.set('html', '');
			activeImage = imageIndex;
			prevImage = ((activeImage || !options.loop) ? activeImage : images.length) - 1;
			nextImage = activeImage + 1;
			if (nextImage == images.length) nextImage = options.loop ? 0 : -1;

			$$(prevLink, nextLink, image, bottomContainer).setStyle("display", "none");
			fx.bottom.cancel().set(0);
			fx.image.set(0);
			center.className = "mbLoading";

// MEDIABOX FORMATING
			WH = images[imageIndex][2].split(' ');
			WHL = WH.length;
			if (WHL>1) {
				mediaWidth = (WH[WHL-2].match("%")) ? (window.getWidth()*("0."+(WH[WHL-2].replace("%", ""))))+"px" : WH[WHL-2]+"px";
				mediaHeight = (WH[WHL-1].match("%")) ? (window.getHeight()*("0."+(WH[WHL-1].replace("%", ""))))+"px" : WH[WHL-1]+"px";
			} else {
				mediaWidth = "";
				mediaHeight = "";
			}
			URL = images[imageIndex][0];
			captionSplit = images[activeImage][1].split('::');
// Quietube support
			if (URL.match(/quietube\.com/i)) {
				mediaSplit = URL.split('v.php/');
				URL = mediaSplit[1];
			}
// MEDIA TYPES
// IMAGES
			if (URL.match(/\.gif|\.jpg|\.png/i)) {
				mediaType = 'img';
				preload = new Image();
				preload.onload = nextEffect;
				preload.src = images[imageIndex][0];
// FLV, MP4
			} else if (URL.match(/\.flv|\.mp4/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || options.initialWidth;
				mediaHeight = mediaHeight || options.initialHeight;
				if (options.useNB) {
				preload = new Swiff(''+options.NBpath+'?videoURL='+URL+'&allowSmoothing=true&autoPlay='+options.autoplay+'&buffer=6&showTimecode='+options.showTimecode+'&loop='+options.NBloop+'&controlColour='+options.controllerColor+'&scaleIfFullScreen=true&showScalingButton=false', {
					id: 'MediaboxSWF',
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				} else {
				preload = new Swiff(''+options.playerpath+'?file='+URL+'&backcolor='+options.backcolor+'&frontcolor='+options.frontcolor+'&lightcolor='+options.lightcolor+'&screencolor='+options.screencolor+'&autostart='+options.autoplay+'&controlbar='+options.controlbar, {
					id: 'MediaboxSWF',
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				}
				nextEffect();
// MP3, AAC
			} else if (URL.match(/\.mp3|\.aac/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || options.initialWidth;
				mediaHeight = mediaHeight || options.initialHeight;
				preload = new Swiff(''+options.playerpath+'?file='+URL+'&backcolor='+options.backcolor+'&frontcolor='+options.frontcolor+'&lightcolor='+options.lightcolor+'&screencolor='+options.screencolor+'&autostart='+options.autoplay, {
					id: 'MediaboxSWF',
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// SWF
			} else if (URL.match(/\.swf/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || options.initialWidth;
				mediaHeight = mediaHeight || options.initialHeight;
				preload = new Swiff(URL, {
					id: 'MediaboxSWF',
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// SOCIAL SITES
// Blip.tv
			} else if (URL.match(/blip\.tv/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "640px";
				mediaHeight = mediaHeight || "390px";
				preload = new Swiff(URL, {
					src: URL,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// DailyMotion
			} else if (URL.match(/dailymotion\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "480px";
				mediaHeight = mediaHeight || "381px";
				preload = new Swiff(URL, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Facebook
			} else if (URL.match(/facebook\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "320px";
				mediaHeight = mediaHeight || "240px";
				mediaSplit = URL.split('v=');
				mediaSplit = mediaSplit[1].split('&');
				mediaId = mediaSplit[0];
				preload = new Swiff('http://www.facebook.com/v/'+mediaId, {
					movie: 'http://www.facebook.com/v/'+mediaId,
					classid: 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000',
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				startEffect();
// Flickr
			} else if (URL.match(/flickr\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "500px";
				mediaHeight = mediaHeight || "375px";
				mediaSplit = URL.split('/');
				mediaId = mediaSplit[5];
				preload = new Swiff('http://www.flickr.com/apps/video/stewart.swf', {
					id: mediaId,
					classid: 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000',
					width: mediaWidth,
					height: mediaHeight,
					params: {flashvars: 'photo_id='+mediaId+'&amp;show_info_box='+options.flInfo, wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Google Video
			} else if (URL.match(/google\.com\/videoplay/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "400px";
				mediaHeight = mediaHeight || "326px";
				mediaSplit = URL.split('=');
				mediaId = mediaSplit[1];
				preload = new Swiff('http://video.google.com/googleplayer.swf?docId='+mediaId+'&autoplay='+options.autoplayNum, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Megavideo - Thanks to Robert Jandreu for suggesting this code!
			} else if (URL.match(/megavideo\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "640px";
				mediaHeight = mediaHeight || "360px";
				mediaSplit = URL.split('=');
				mediaId = mediaSplit[1];
				preload = new Swiff('http://wwwstatic.megavideo.com/mv_player.swf?v='+mediaId, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Metacafe
			} else if (URL.match(/metacafe\.com\/watch/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "400px";
				mediaHeight = mediaHeight || "345px";
				mediaSplit = URL.split('/');
				mediaId = mediaSplit[4];
				preload = new Swiff('http://www.metacafe.com/fplayer/'+mediaId+'/.swf?playerVars=autoPlay='+options.autoplayYes, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// MyspaceTV
			} else if (URL.match(/myspacetv\.com|vids\.myspace\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "425px";
				mediaHeight = mediaHeight || "360px";
				mediaSplit = URL.split('=');
				mediaId = mediaSplit[2];
				preload = new Swiff('http://lads.myspace.com/videos/vplayer.swf?m='+mediaId+'&v=2&a='+options.autoplayNum+'&type=video', {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Revver
			} else if (URL.match(/revver\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "480px";
				mediaHeight = mediaHeight || "392px";
				mediaSplit = URL.split('/');
				mediaId = mediaSplit[4];
				preload = new Swiff('http://flash.revver.com/player/1.0/player.swf?mediaId='+mediaId+'&affiliateId='+options.revverID+'&allowFullScreen='+options.revverFullscreen+'&autoStart='+options.autoplay+'&backColor=#'+options.revverBack+'&frontColor=#'+options.revverFront+'&gradColor=#'+options.revverGrad+'&shareUrl=revver', {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Rutube
			} else if (URL.match(/rutube\.ru/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "470px";
				mediaHeight = mediaHeight || "353px";
				mediaSplit = URL.split('=');
				mediaId = mediaSplit[1];
				preload = new Swiff('http://video.rutube.ru/'+mediaId, {
					movie: 'http://video.rutube.ru/'+mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Seesmic
			} else if (URL.match(/seesmic\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "435px";
				mediaHeight = mediaHeight || "355px";
				mediaSplit = URL.split('/');
				mediaId = mediaSplit[5];
				preload = new Swiff('http://seesmic.com/Standalone.swf?video='+mediaId, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Tudou
			} else if (URL.match(/tudou\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "400px";
				mediaHeight = mediaHeight || "340px";
				mediaSplit = URL.split('/');
				mediaId = mediaSplit[5];
				preload = new Swiff('http://www.tudou.com/v/'+mediaId, {
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// YouKu
			} else if (URL.match(/youku\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "480px";
				mediaHeight = mediaHeight || "400px";
				mediaSplit = URL.split('id_');
				mediaId = mediaSplit[1];
				preload = new Swiff('http://player.youku.com/player.php/sid/'+mediaId+'=/v.swf', {
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// YouTube
			} else if (URL.match(/youtube\.com\/watch/i)) {
				mediaType = 'obj';
				mediaSplit = URL.split('v=');
				mediaId = mediaSplit[1];
				if (mediaId.match(/fmt=18/i)) {
					mediaFmt = '&ap=%2526fmt%3D18';
					mediaWidth = mediaWidth || "560px";
					mediaHeight = mediaHeight || "345px";
				} else if (mediaId.match(/fmt=22/i)) {
					mediaFmt = '&ap=%2526fmt%3D22';
					mediaWidth = mediaWidth || "640px";
					mediaHeight = mediaHeight || "385px";
				} else {
					mediaFmt = options.ytQuality;
					mediaWidth = mediaWidth || "480px";
					mediaHeight = mediaHeight || "295px";
				}
				preload = new Swiff('http://www.youtube.com/v/'+mediaId+'&autoplay='+options.autoplayNum+'&fs='+options.fullscreenNum+mediaFmt+'&color1=0x'+options.ytColor1+'&color2=0x'+options.ytColor2, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// YouTube
			} else if (URL.match(/youtube\.com\/view/i)) {
				mediaType = 'obj';
				mediaSplit = URL.split('p=');
				mediaId = mediaSplit[1];
				mediaWidth = mediaWidth || "480px";
				mediaHeight = mediaHeight || "385px";
				preload = new Swiff('http://www.youtube.com/p/'+mediaId+'&autoplay='+options.autoplayNum+'&fs='+options.fullscreenNum+mediaFmt+'&color1=0x'+options.ytColor1+'&color2=0x'+options.ytColor2, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Veoh
			} else if (URL.match(/veoh\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "410px";
				mediaHeight = mediaHeight || "341px";
				mediaSplit = URL.split('videos/');
				mediaId = mediaSplit[1];
				preload = new Swiff('http://www.veoh.com/videodetails2.swf?permalinkId='+mediaId+'&player=videodetailsembedded&videoAutoPlay='+options.AutoplayNum, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// Viddler
			} else if (URL.match(/viddler\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "437px";
				mediaHeight = mediaHeight || "370px";
				mediaSplit = URL.split('/');
				mediaId = mediaSplit[4];
				preload = new Swiff(URL, {
					id: 'viddler_'+mediaId,
					movie: URL,
					classid: 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000',
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen, id: 'viddler_'+mediaId, movie: URL}
					});
				nextEffect();
// Vimeo
			} else if (URL.match(/vimeo\.com/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "400px";
				mediaHeight = mediaHeight || "225px";
				mediaSplit = URL.split('/');
				mediaId = mediaSplit[3];
				preload = new Swiff('http://www.vimeo.com/moogaloop.swf?clip_id='+mediaId+'&amp;server=www.vimeo.com&amp;fullscreen='+options.fullscreenNum+'&amp;autoplay='+options.autoplayNum+'&amp;show_title='+options.vmTitle+'&amp;show_byline='+options.vmByline+'&amp;show_portrait='+options.vmPortrait+'&amp;color='+options.vmColor, {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// 12seconds
			} else if (URL.match(/12seconds\.tv/i)) {
				mediaType = 'obj';
				mediaWidth = mediaWidth || "430px";
				mediaHeight = mediaHeight || "360px";
				mediaSplit = URL.split('/');
				mediaId = mediaSplit[5];
				preload = new Swiff('http://embed.12seconds.tv/players/remotePlayer.swf', {
					id: mediaId,
					width: mediaWidth,
					height: mediaHeight,
					params: {flashvars: 'vid='+mediaId+'', wmode: 'opaque', bgcolor: options.bgcolor, allowscriptaccess: options.scriptaccess, allowfullscreen: options.fullscreen}
					});
				nextEffect();
// CONTENT TYPES
// INLINE
			} else if (URL.match(/\#mb_/i)) {
				mediaType = 'inline';
				mediaWidth = mediaWidth || options.initialWidth;
				mediaHeight = mediaHeight || options.initialHeight;
				URLsplit = URL.split('#');
				preload = $(URLsplit[1]).get('html');
				nextEffect();
// HTML
			} else {
				mediaType = 'url';
				mediaWidth = mediaWidth || options.initialWidth;
				mediaHeight = mediaHeight || options.initialHeight;
				mediaId = "mediaId_"+new Date().getTime();	// Safari will not update iframe content with a static id.
				preload = new Element('iframe', {
//					'href': URL,
					'src': URL,
					'id': mediaId,
					'width': mediaWidth,
					'height': mediaHeight,
					'frameborder': 0
					});
				nextEffect();
			}
		}
		return false;
	}

	function nextEffect() {
		switch (state++) {
			case 2:
				if (mediaType == "img"){
					mediaWidth = preload.width;
					mediaHeight = preload.height;
					image.setStyles({backgroundImage: "url("+URL+")", display: ""});
				} else if (mediaType == "obj") {
					if (Browser.Plugins.Flash.version<8) {
						image.setStyles({backgroundImage: "none", display: ""});
						image.set('html', '<div id="mbError"><b>Error</b><br/>Adobe Flash is either not installed or not up to date,<br/>please visit <a href="http://www.adobe.com/shockwave/download/download.cgi?P1_Prod_Version=ShockwaveFlash" title="Get Flash" target="_new">Adobe.com</a> to download the free player.</div>');
					} else {
						image.setStyles({backgroundImage: "none", display: ""});
						preload.inject(image);
					}
				} else if (mediaType == "inline") {
					image.setStyles({backgroundImage: "none", display: ""});
					image.set('html', preload);
				} else if (mediaType == "url") {
					image.setStyles({backgroundImage: "none", display: ""});
					preload.inject(image);
				} else {
					alert('this file type is not supported\n'+URL+'\nplease visit iaian7.com/webcode/Mediabox for more information');
				}
				$$(image, bottom).setStyle("width", mediaWidth);
				image.setStyle("height", mediaHeight);

				title.set('html', (options.showCaption) ? captionSplit[0] : "");
				caption.set('html', (options.showCaption && (captionSplit.length > 1)) ? captionSplit[1] : "");
				number.set('html', (options.showCounter && (images.length > 1)) ? options.counterText.replace(/{x}/, activeImage + 1).replace(/{y}/, images.length) : "");

				if ((prevImage >= 0) && (images[prevImage][0].match(/\.gif|\.jpg|\.png/i))) preloadPrev.src = images[prevImage][0];
				if ((nextImage >= 0) && (images[nextImage][0].match(/\.gif|\.jpg|\.png/i))) preloadNext.src = images[nextImage][0];

				state++;
			case 3:
				center.className = "";
				fx.resize.start({height: image.offsetHeight, width: image.offsetWidth, marginLeft: -image.offsetWidth/2});
				break;
				state++;
			case 4:
				bottomContainer.setStyles({top: top + center.clientHeight, marginLeft: center.style.marginLeft, visibility: "hidden", display: ""});
				fx.image.start(1);
				break;
			case 5:
				if (prevImage >= 0) prevLink.style.display = "";
				if (nextImage >= 0) nextLink.style.display = "";
				if (options.animateCaption) {
					fx.bottom.set(-bottom.offsetHeight).start(0);
				}
				bottomContainer.style.visibility = "";
				state = 1;
		}
	}

	function close() {
		if (state) {
			state = 0;
			preload.onload = $empty;
			image.set('html', '');
			for (var f in fx) fx[f].cancel();
			$$(center, bottomContainer).setStyle("display", "none");
			fx.overlay.chain(setup).start(0);
		}
		return false;
	}
})();

// AUTOLOAD CODE BLOCK
Mediabox.scanPage = function() {
	var links = $$("a").filter(function(el) {
		return el.rel && el.rel.test(/^lightbox/i);
	});
	$$(links).mediabox({/* Put custom options here */}, null, function(el) {
		var rel0 = this.rel.replace(/[[]|]/gi," ");
		var relsize = rel0.split(" ");
		return (this == el) || ((this.rel.length > 8) && el.rel.match(relsize[1]));
	});
};
window.addEvent("domready", Mediabox.scanPage);