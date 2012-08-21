#
# Makefile for last.fm-reply-tracker
#

srcdir = src/

parts = ${srcdir}header.js \
				${srcdir}lib.js \
				${srcdir}thread.js \
				${srcdir}replytracker.js \
				${srcdir}main.js

lastfm-reply-tracker.js: ${parts}
	awk 'FNR==1 && NR!=1 {print ""}{print}' $^ > $@

clean:
	rm -f lastfm-reply-tracker.js