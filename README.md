mediaboxAdvanced
===========

Based on Lightbox, Slimbox, and the Mootools javascript library, *mediaboxAdvanced* is a modal overlay that can handle images, videos, animations, social video sites, twitter media links, inline elements, and external pages with ease.

![Screenshot](http://iaian7.com/images/webcode/mediaboxAdv/mediaboxAdv-1.1.png)

How to use
----------

mediaboxAdvanced supports a wide range of media formats; simply link to any image, flash video, or popular website, and the media will be automatically loaded into an overlay when clicked.

*Installation*

* The following files must be correctly linked in the page header:

	mediaboxAdv.css
	
	MooTools-main.js
	
	mediaboxAdv.js

(mediaboxAdvanced depends on all MooTools core elements except Request, Cookie, and JSON features)

* Optionally, you can also include Quickie.js for Quicktime support

	quickie.js

(available here http://mootools.net/forge/p/quickie)

* To play media files such as mp4, mp3, and other formats, you'll need to upload a flash-based player to the server and update the link inside mediaboxAdv.js to match.

	nonverblaster.swf
	
	or
	
	jwmediaplayer.swf

(available from http://www.nonverbla.de/nonverblaster-hover/ or http://www.longtailvideo.com/players/jw-flv-player/)


*Link formatting*

	<a href="url" rel="lightbox[galleryName width height]" title="header::subtitle">...content...</a>

*Examples*

* Image with gallery name and thumbnail

	<a href="images/window.jpg" rel="lightbox[image]" title="window"><img src="images/windowThumb.jpg" alt="window" /></a>

* Youtube video with gallery name, custom size, and title with header and subtitle

	<a href="http://www.youtube.com/watch?v=MrqcK5arPPk" rel="lightbox[video 640 360]" title="Microsoft Blue Monster::inspired by Hugh MacLeod's original illustration">watch the Blue Monster video</a>

* Google map

	<a href="http://maps.google.com/maps?f=q&amp;source=s_q&amp;hl=en&amp;geocode=&amp;q=detroit,+mi&amp;aq=&amp;sll=42.653,-83.14063&amp;sspn=0.026765,0.024848&amp;ie=UTF8&amp;hq=&amp;hnear=Detroit,+Wayne,+Michigan&amp;z=10&amp;ll=42.331427,-83.045754&amp;output=embed" rel="lightbox[external 640 360]" title="Detroit, Michigan">Google map »</a>




For more information and a full list of examples and supported sites, please visit http://iaian7.com/webcode/mediaboxAdvanced