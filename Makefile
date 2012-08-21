#
# Makefile for last.fm-reply-tracker
#

userscript = lastfm-reply-tracker.user.js

srcdir = src/

parts = ${srcdir}header.js \
				${srcdir}lib.js \
				${srcdir}thread.js \
				${srcdir}replytracker.js \
				${srcdir}main.js

${userscript}: ${parts}
	awk 'FNR==1 && NR!=1 {print ""}{print}' $^ > $@

clean:
	rm -f ${userscript}