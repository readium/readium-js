#!/bin/sh

cd epub-modules/epub
rake gen_module

cd ../epub-parser
rake gen_module

cd ../epub-reflowable
rake gen_module

cd ../epub-fixed
rake gen_module

cd ../epub-reader
rake gen_module

cd ../epub-cfi
rake gen_module

cd ..
rake gen_simple_readiumjs

cd epub-reflowable
rake get_dependencies

cd ../epub-fixed
rake get_dependencies

cd ../epub-reader
rake get_dependencies

cd ..

root=$(pwd)

#HTML1="'file://"${root}"/epub-fixed/view_testing/fixed_view.html'"
#HTML1="\"file://"${root}"/epub-fixed/view_testing/fixed_view.html\""
HTML1="file://"${root}"/epub-fixed/view_testing/fixed_view.html"
HTML1=$(echo ${HTML1} | sed 's/ /%20/g')
echo ${HTML1}

HTML2="file://"${root}"/epub-reader/view_testing/reader_view.html"
HTML2=$(echo ${HTML2} | sed 's/ /%20/g')
echo ${HTML2}

HTML3="file://"${root}"/epub-reflowable/view_testing/reflowable_view.html"
HTML3=$(echo ${HTML3} | sed 's/ /%20/g')
echo ${HTML3}



CHROME_APP=$(ls /Applications/ | grep Chrome | head -n 1)
#CHROME_APP='Google\\ Chrome\\ BETA.app'
echo ${CHROME_APP}

#CHROME_APP_PATH="'/Applications/"${CHROME_APP}"'"
#CHROME_APP_PATH="\"/Applications/"${CHROME_APP}"\""
CHROME_APP_PATH="/Applications/"${CHROME_APP}
#CHROME_APP_PATH=$(echo ${CHROME_APP_PATH} | sed 's/ /\\ /g')
echo ${CHROME_APP_PATH}

osascript -e "tell application \"${CHROME_APP}\"" -e "set chromewindows to every window" -e "repeat with chromewindow in chromewindows" -e "set windowtabs to every tab of chromewindow" -e "repeat with windowtab in windowtabs" -e "tell windowtab" -e "delete" -e "end tell" -e "end repeat" -e "end repeat" -e "end tell"

osascript -e "tell application \"${CHROME_APP}\" to activate"

osascript -e "delay 2" -e "tell application \"${CHROME_APP}\"" -e "tell application \"System Events\"" -e "keystroke \"q\" using {command down}" -e "end tell" -e "end tell" -e "delay 2" 

function activateStuff(){
osascript -e "tell application \"${CHROME_APP}\" to activate"

osascript -e "delay 2" -e "tell application \"${CHROME_APP}\"" -e "tell application \"System Events\"" -e "keystroke \"j\" using {command down, option down}" -e "end tell" -e "end tell"
#-e "tell process \"Google Chrome\"" -e "click menu item \"JavaScript Console\" of menu 1 of menu item \"Developer\" of menu 1 of menu bar item \"View\" of menu bar 1" -e "end tell" -e "end tell" -e "end tell"

#osascript -e "tell application \"${CHROME_APP}\" to tell the active tab of its first window" -e "reload" -e "end tell"

#osascript -e "do shell script \'${CHROME_APP_COMMAND}\'"
}

open -a "${CHROME_APP_PATH}" --args --disable-application-cache --disable-web-security -–allow-file-access-from-files --incognito ${HTML3}

activateStuff

#exit

#open -a "${CHROME_APP_PATH}" --args --disable-application-cache --disable-web-security -–allow-file-access-from-files --incognito ${HTML2}
osascript -e "tell application \"${CHROME_APP}\"" -e "set myTab to make new tab at end of tabs of window 1" -e "set URL of myTab to \"${HTML2}\"" -e "end tell"

activateStuff

osascript -e "tell application \"${CHROME_APP}\"" -e "set myTab to make new tab at end of tabs of window 1" -e "set URL of myTab to \"${HTML1}\"" -e "end tell"

activateStuff