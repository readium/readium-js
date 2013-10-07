#Install the tools to run our installer, then run our installer.

echo "Attempting to use Homebrew to install Node.js. If Homebrew is not installed, you can grab it from http://brew.sh/."
brew install node
curl https://npmjs.org/install.sh | sh #Install npm, node's package manager.
sudo npm install -g grunt-cli #Install grunt globally, because it won't work just locally.
npm install
grunt
echo "You can compile the javascript again, if you want to make changes, by running 'grunt'.\n"