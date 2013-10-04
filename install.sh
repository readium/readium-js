#Install the tools to run our installer, then run our installer.

set -e
set -u

sudo apt-get install nodejs npm python
npm install
grunt